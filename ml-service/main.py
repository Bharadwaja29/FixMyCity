"""
FixMyCity ML service
--------------------
Run (from inside the ml-service folder):
    uvicorn main:app --port 8000

Needs these two files from your Colab notebooks in ml-service/models/:
    image_clf.pkl   (image classifier)
    text_clf.pkl    (department text classifier)

Endpoints:
    GET  /health
    POST /analyze          photo (optional) + description text (optional)
    POST /duplicate-check  new complaint + nearby candidate complaints
"""
import io
import os
from typing import List, Optional

import joblib
import numpy as np
import requests
import torch
from fastapi import FastAPI, File, Form, UploadFile
from PIL import Image
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import CLIPModel, CLIPProcessor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ----------------------------------------------------------------------
# Load all models once, when the server starts
# ----------------------------------------------------------------------
image_bundle = joblib.load(os.path.join(MODEL_DIR, "image_clf.pkl"))
IMG_CLF = image_bundle["clf"]
IMG_CLASSES = image_bundle["classes"]
TEXT_CLF = joblib.load(os.path.join(MODEL_DIR, "text_clf.pkl"))

CLIP_NAME = image_bundle.get("embedder", "openai/clip-vit-base-patch32")
clip_model = CLIPModel.from_pretrained(CLIP_NAME).eval()
clip_proc = CLIPProcessor.from_pretrained(CLIP_NAME)
st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# ----------------------------------------------------------------------
# Routing tables
# ----------------------------------------------------------------------
LABEL_TO_DEPT = {
    "Roads": "Roads",
    "Electricity": "Electricity",
    "Water_Supply": "Water Supply",
    "Sanitation": "Sanitation",
    "Schools": "Schools",
    "Hospitals": "Hospitals",
    "Hostel_Food": "Hostel & Food Safety",
}
CATEGORY_TO_LABEL = {
    "pothole": "Roads",
    "damaged_infrastructure": "Roads",
    "streetlight": "Electricity",
    "water_leakage": "Water_Supply",
    "garbage": "Sanitation",
}
IMG_CONF_MIN = 0.50      # below this the image prediction is not trusted
TEXT_CONF_STRONG = 0.55  # text label wins if at least this confident
TEXT_CONF_WEAK = 0.40    # text label used only if the image gives nothing

# ----------------------------------------------------------------------
# Severity (rule-based, NOT a trained model)
# ----------------------------------------------------------------------
SEVERITIES = ["Low", "Medium", "High", "Critical"]
BASE_SEVERITY = {
    "garbage": 0, "no_issue": 0,
    "pothole": 1, "damaged_infrastructure": 1,
    "streetlight": 1, "water_leakage": 1,
}
CRITICAL_WORDS = ["live wire", "spark", "electrocut", "collaps", "open manhole", "fire", "injur"]
HIGH_WORDS = ["accident", "danger", "unsafe", "children", "student", "school", "hospital",
              "ambulance", "burst", "flood", "overflow", "elderly", "dark", "no water"]


def estimate_severity(category: Optional[str], text: Optional[str]) -> str:
    level = BASE_SEVERITY.get(category or "", 1)
    t = (text or "").lower()
    if any(w in t for w in CRITICAL_WORDS):
        level = 3
    elif any(w in t for w in HIGH_WORDS):
        level = max(level, 2)
    return SEVERITIES[level]


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def as_tensor(out):
    """Works across different transformers versions."""
    if isinstance(out, torch.Tensor):
        return out
    for name in ("image_embeds", "text_embeds", "pooler_output"):
        val = getattr(out, name, None)
        if val is not None:
            return val
    return out[0]


def trim_black(img: Image.Image, thresh: int = 10) -> Image.Image:
    """Removes black bars (same preprocessing as in training)."""
    a = np.array(img.convert("L"))
    mask = a > thresh
    if not mask.any():
        return img
    rows, cols = mask.any(axis=1), mask.any(axis=0)
    y0, y1 = np.where(rows)[0][[0, -1]]
    x0, x1 = np.where(cols)[0][[0, -1]]
    return img.crop((x0, y0, x1 + 1, y1 + 1))


def clip_embed(img: Image.Image) -> np.ndarray:
    inputs = clip_proc(images=[trim_black(img)], return_tensors="pt")
    with torch.no_grad():
        feats = as_tensor(clip_model.get_image_features(**inputs))
    feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats.cpu().numpy()[0]


def classify_image(img: Image.Image):
    emb = clip_embed(img).reshape(1, -1)
    probs = IMG_CLF.predict_proba(emb)[0]
    order = np.argsort(probs)[::-1]
    return [{"label": IMG_CLASSES[int(i)], "prob": round(float(probs[i]), 4)} for i in order[:3]]


def classify_text(text: str):
    emb = st_model.encode([text], normalize_embeddings=True)
    probs = TEXT_CLF.predict_proba(emb)[0]
    i = int(np.argmax(probs))
    return str(TEXT_CLF.classes_[i]), float(probs[i])


def fetch_image(url: Optional[str]) -> Optional[Image.Image]:
    if not url:
        return None
    try:
        r = requests.get(url, timeout=8)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception:
        return None


# ----------------------------------------------------------------------
# App
# ----------------------------------------------------------------------
app = FastAPI(title="FixMyCity ML service")


@app.get("/health")
def health():
    return {"status": "ok", "image_classes": IMG_CLASSES}


@app.post("/analyze")
def analyze(file: Optional[UploadFile] = File(None), text: Optional[str] = Form(None)):
    text = (text or "").strip()

    # 1) image classifier
    category, img_conf, top3 = None, 0.0, []
    if file is not None:
        try:
            img = Image.open(io.BytesIO(file.file.read())).convert("RGB")
            top3 = classify_image(img)
            category, img_conf = top3[0]["label"], top3[0]["prob"]
        except Exception:
            category, img_conf, top3 = None, 0.0, []

    # 2) text classifier (needs a few words to be meaningful)
    text_label, text_conf = None, 0.0
    if len(text) >= 10:
        text_label, text_conf = classify_text(text)

    # 3) decide the department
    image_label = None
    if category and category != "no_issue" and img_conf >= IMG_CONF_MIN:
        image_label = CATEGORY_TO_LABEL.get(category)

    if text_label and text_conf >= TEXT_CONF_STRONG:
        dept_label, dept_conf, source = text_label, text_conf, "text"
    elif image_label:
        dept_label, dept_conf, source = image_label, img_conf, "image"
    elif text_label and text_conf >= TEXT_CONF_WEAK:
        dept_label, dept_conf, source = text_label, text_conf, "text"
    else:
        dept_label, dept_conf, source = None, 0.0, "none"

    strong_text = text_label if (text_label and text_conf >= TEXT_CONF_STRONG) else None
    disagree = bool(image_label and strong_text and image_label != strong_text)
    needs_review = dept_label is None or category == "no_issue" or disagree

    return {
        "category": category,
        "confidence": round(img_conf, 4),
        "top3": top3,
        "department": LABEL_TO_DEPT.get(dept_label) if dept_label else None,
        "department_label": dept_label,
        "department_confidence": round(dept_conf, 4),
        "department_source": source,
        "needs_review": needs_review,
        "severity": estimate_severity(category, text),
        "text_department": text_label,
        "text_confidence": round(text_conf, 4),
    }


class Candidate(BaseModel):
    id: str
    case_id: Optional[str] = None
    description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    distance_m: Optional[float] = None


class DupRequest(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None
    candidates: List[Candidate] = []


RADIUS_M = 600.0
WEIGHTS = {"loc": 0.4, "text": 0.3, "img": 0.3}
THRESHOLD = 0.5
MAX_CANDIDATES = 10


@app.post("/duplicate-check")
def duplicate_check(req: DupRequest):
    cands = sorted(req.candidates, key=lambda c: c.distance_m if c.distance_m is not None else 1e9)
    cands = cands[:MAX_CANDIDATES]
    if not cands:
        return {"matches": [], "threshold": THRESHOLD}

    new_text = (req.text or "").strip()
    new_img = fetch_image(req.image_url)
    new_img_emb = clip_embed(new_img) if new_img is not None else None

    texts = [new_text] + [(c.description or "").strip() for c in cands]
    text_embs = st_model.encode(texts, normalize_embeddings=True)

    matches = []
    for k, c in enumerate(cands):
        # location score: 1.0 at the same spot, 0.0 at 600 m or more
        d = c.distance_m if c.distance_m is not None else RADIUS_M
        loc = max(0.0, 1.0 - d / RADIUS_M)

        # text score: cosine similarity of sentence embeddings
        has_text = bool(new_text) and bool((c.description or "").strip())
        text_s = max(0.0, float(np.dot(text_embs[0], text_embs[k + 1]))) if has_text else 0.0

        # image score: CLIP cosine similarity, rescaled (heuristic, 0.75 -> 0, 0.95 -> 1)
        img_s, has_img = 0.0, False
        if new_img_emb is not None and c.image_urls:
            other = fetch_image(c.image_urls[0])
            if other is not None:
                cos = float(np.dot(new_img_emb, clip_embed(other)))
                img_s = float(np.clip((cos - 0.75) / 0.20, 0.0, 1.0))
                has_img = True

        parts = [("loc", loc)]
        if has_text:
            parts.append(("text", text_s))
        if has_img:
            parts.append(("img", img_s))
        total_w = sum(WEIGHTS[n] for n, _ in parts)
        score = sum(WEIGHTS[n] * v for n, v in parts) / total_w

        matches.append({
            "id": c.id,
            "case_id": c.case_id,
            "score": round(score, 3),
            "location_score": round(loc, 3),
            "text_score": round(text_s, 3),
            "image_score": round(img_s, 3),
            "image_available": has_img,
        })

    matches = [m for m in matches if m["score"] >= THRESHOLD]
    matches.sort(key=lambda m: m["score"], reverse=True)
    return {"matches": matches[:5], "threshold": THRESHOLD}

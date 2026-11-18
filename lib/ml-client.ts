import type { ComplaintCategory, Severity } from './api'

/**
 * One-to-one display mapping for ML labels in the AI Analysis panel:
 * pothole -> Pothole
 * streetlight -> Streetlight
 * garbage -> Garbage
 * water_leakage -> Water Supply (leak)
 * damaged_infrastructure -> Damaged Infrastructure
 * no_issue -> "No issue detected"
 */
export const ML_TO_DISPLAY_LABEL: Record<string, string> = {
  pothole: 'Pothole',
  Pothole: 'Pothole',
  streetlight: 'Streetlight',
  Streetlight: 'Streetlight',
  garbage: 'Garbage',
  Garbage: 'Garbage',
  water_leakage: 'Water Supply (leak)',
  'Water Supply (leak)': 'Water Supply (leak)',
  water_supply: 'Water Supply (leak)',
  'Water Supply': 'Water Supply (leak)',
  damaged_infrastructure: 'Damaged Infrastructure',
  'Damaged Infrastructure': 'Damaged Infrastructure',
  no_issue: 'No issue detected',
  'No issue detected': 'No issue detected',
}

export function mapMlLabelToDisplay(raw?: string): string {
  if (!raw) return 'No issue detected'
  const trimmed = raw.trim()
  if (ML_TO_DISPLAY_LABEL[trimmed]) return ML_TO_DISPLAY_LABEL[trimmed]
  const lower = trimmed.toLowerCase()
  if (ML_TO_DISPLAY_LABEL[lower]) return ML_TO_DISPLAY_LABEL[lower]
  const spaced = lower.replace(/_/g, ' ')
  if (ML_TO_DISPLAY_LABEL[spaced]) return ML_TO_DISPLAY_LABEL[spaced]
  return trimmed
}

/**
 * Mapping of ML category names (and common variants / snake_case) to the app's ComplaintCategory.
 */
export const ML_TO_APP_CATEGORY: Record<string, ComplaintCategory> = {
  pothole: 'Pothole',
  Pothole: 'Pothole',
  potholes: 'Pothole',
  streetlight: 'Streetlight',
  Streetlight: 'Streetlight',
  street_light: 'Streetlight',
  'street light': 'Streetlight',
  garbage: 'Garbage',
  Garbage: 'Garbage',
  trash: 'Garbage',
  waste: 'Garbage',
  drainage: 'Drainage',
  Drainage: 'Drainage',
  water_supply: 'Water Supply',
  'Water Supply': 'Water Supply',
  water_leakage: 'Water Supply',
  'Water Leakage': 'Water Supply',
  'Water Supply (leak)': 'Water Supply',
  encroachment: 'Encroachment',
  Encroachment: 'Encroachment',
  damaged_infrastructure: 'Damaged Infrastructure',
  'Damaged Infrastructure': 'Damaged Infrastructure',
  school_facilities: 'School Facilities',
  'School Facilities': 'School Facilities',
  hospital_services: 'Hospital Services',
  'Hospital Services': 'Hospital Services',
  food_safety: 'Food Safety',
  'Food Safety': 'Food Safety',
}

export function mapMlCategoryToApp(raw?: string): ComplaintCategory | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed === 'no_issue') return null
  if (ML_TO_APP_CATEGORY[trimmed]) return ML_TO_APP_CATEGORY[trimmed]
  const lower = trimmed.toLowerCase()
  if (lower === 'no_issue') return null
  if (ML_TO_APP_CATEGORY[lower]) return ML_TO_APP_CATEGORY[lower]
  const spaced = lower.replace(/_/g, ' ')
  if (ML_TO_APP_CATEGORY[spaced]) return ML_TO_APP_CATEGORY[spaced]
  for (const [key, val] of Object.entries(ML_TO_APP_CATEGORY)) {
    if (key.toLowerCase() === spaced) return val
  }
  return null
}

export function normalizeSeverity(raw?: string): Severity {
  if (!raw) return 'Medium'
  const lower = raw.toLowerCase().trim()
  if (lower === 'low') return 'Low'
  if (lower === 'medium') return 'Medium'
  if (lower === 'high') return 'High'
  if (lower === 'critical') return 'Critical'
  return 'Medium'
}

export interface MlTop3Class {
  label: string
  prob: number
}

export interface MlAnalyzeResponse {
  category: string
  confidence: number
  top3: MlTop3Class[]
  department: string
  department_confidence?: number
  department_source?: string
  needs_review?: boolean
  severity?: string
}

export interface MlDuplicateCandidate {
  id: string
  case_id: string
  description: string
  image_urls: string[]
  distance_m: number
}

export interface MlDuplicateRequest {
  text: string
  image_url: string
  candidates: MlDuplicateCandidate[]
}

export interface MlDuplicateMatch {
  id: string
  case_id: string
  score: number
  location_score: number
  text_score: number
  image_score: number
}

export interface MlDuplicateResponse {
  matches: MlDuplicateMatch[]
}

export interface MlCallResult<T> {
  data: T | null
  usedLive: boolean
  reason?: string
}

/**
 * Call Python ML service POST /analyze with 10s timeout.
 * Returns { data, usedLive: true } or { data: null, usedLive: false, reason }.
 */
export async function callMlAnalyze(options: {
  file?: Blob | File | Buffer
  fileName?: string
  text?: string
}): Promise<MlCallResult<MlAnalyzeResponse>> {
  const mlUrl = process.env.ML_SERVICE_URL?.trim()
  if (!mlUrl) {
    return { data: null, usedLive: false, reason: 'ML_SERVICE_URL is empty' }
  }

  try {
    const formData = new FormData()
    if (options.file) {
      if (options.file instanceof Blob) {
        formData.append('file', options.file, options.fileName || 'image.jpg')
      } else if (Buffer.isBuffer(options.file)) {
        const blob = new Blob([options.file])
        formData.append('file', blob, options.fileName || 'image.jpg')
      }
    }
    if (options.text) {
      formData.append('text', options.text)
    }

    const endpoint = `${mlUrl.replace(/\/$/, '')}/analyze`
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!res.ok) {
      return { data: null, usedLive: false, reason: `HTTP ${res.status} ${res.statusText}` }
    }

    const data = (await res.json()) as MlAnalyzeResponse
    return { data, usedLive: true }
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return { data: null, usedLive: false, reason: 'request timed out after 10s' }
    }
    return { data: null, usedLive: false, reason: err?.message || 'service unreachable' }
  }
}

/**
 * Call Python ML service POST /duplicate-check with 10s timeout.
 * Returns { data, usedLive: true } or { data: null, usedLive: false, reason }.
 */
export async function callMlDuplicateCheck(
  req: MlDuplicateRequest
): Promise<MlCallResult<MlDuplicateMatch[]>> {
  const mlUrl = process.env.ML_SERVICE_URL?.trim()
  if (!mlUrl) {
    return { data: null, usedLive: false, reason: 'ML_SERVICE_URL is empty' }
  }

  try {
    const endpoint = `${mlUrl.replace(/\/$/, '')}/duplicate-check`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!res.ok) {
      return { data: null, usedLive: false, reason: `HTTP ${res.status} ${res.statusText}` }
    }

    const data = (await res.json()) as MlDuplicateResponse
    return { data: data.matches || [], usedLive: true }
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return { data: null, usedLive: false, reason: 'request timed out after 10s' }
    }
    return { data: null, usedLive: false, reason: err?.message || 'service unreachable' }
  }
}

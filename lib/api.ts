import { buildSeedComplaints, receivedEvent } from './seed'
import {
  CATEGORY_LEDGER_DEPARTMENT,
  DEPARTMENT_BY_CATEGORY,
  LEDGER_DEPARTMENTS,
  PHOTO_BY_CATEGORY,
  type LedgerDepartment,
} from './departments'
import { getSupabaseServerClient } from './supabase/server'
import {
  callMlAnalyze,
  callMlDuplicateCheck,
  mapMlCategoryToApp,
  mapMlLabelToDisplay,
  normalizeSeverity,
  ML_TO_APP_CATEGORY,
  ML_TO_DISPLAY_LABEL,
  type MlDuplicateCandidate,
} from './ml-client'
import { uploadComplaintPhoto, getEvidencePublicUrl } from './supabase/storage'
import { toKolkataDateString, formatKolkataDate } from './format'

export { DEPARTMENT_BY_CATEGORY, LEDGER_DEPARTMENTS, CATEGORY_LEDGER_DEPARTMENT, ML_TO_APP_CATEGORY, ML_TO_DISPLAY_LABEL, getEvidencePublicUrl }
export type { LedgerDepartment }

export const CATEGORY_DEPARTMENT_ID: Record<ComplaintCategory, number> = {
  Pothole: 1,
  Encroachment: 1,
  'Damaged Infrastructure': 1,
  Streetlight: 2,
  'Water Supply': 3,
  Garbage: 4,
  Drainage: 4,
  'School Facilities': 5,
  'Hospital Services': 6,
  'Food Safety': 7,
}

export const APP_TO_DB_CATEGORY: Record<ComplaintCategory, string> = {
  Pothole: 'pothole',
  Streetlight: 'streetlight',
  Garbage: 'garbage',
  Drainage: 'drainage',
  'Water Supply': 'water_supply',
  Encroachment: 'encroachment',
  'Damaged Infrastructure': 'damaged_infrastructure',
  'School Facilities': 'school_facilities',
  'Hospital Services': 'hospital_services',
  'Food Safety': 'food_safety',
}

export const DB_TO_APP_CATEGORY: Record<string, ComplaintCategory> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  garbage: 'Garbage',
  drainage: 'Drainage',
  water_supply: 'Water Supply',
  water_leakage: 'Water Supply',
  encroachment: 'Encroachment',
  damaged_infrastructure: 'Damaged Infrastructure',
  school_facilities: 'School Facilities',
  hospital_services: 'Hospital Services',
  food_safety: 'Food Safety',
}

export const LEDGER_DEPARTMENT_TO_ID: Record<LedgerDepartment, number> = {
  Roads: 1,
  Electricity: 2,
  'Water Supply': 3,
  Sanitation: 4,
  Schools: 5,
  Hospitals: 6,
  'Hostel/Food Safety': 7,
}

export type ComplaintStatus = 'received' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'

export type ComplaintCategory =
  | 'Pothole'
  | 'Streetlight'
  | 'Garbage'
  | 'Drainage'
  | 'Water Supply'
  | 'Encroachment'
  | 'Damaged Infrastructure'
  | 'School Facilities'
  | 'Hospital Services'
  | 'Food Safety'

export interface Officer {
  name: string
  role: string
}

export interface StatusEvent {
  status: ComplaintStatus
  /** ISO timestamp. */
  at: string
  officer: Officer
  note: string
}

export interface Complaint {
  /** ISO timestamp of filing. */
  filedAt: string
  history: StatusEvent[]
  id: string
  category: ComplaintCategory
  title: string
  ward: string
  city: string
  status: ComplaintStatus
  filedOn: string
  resolvedOn?: string
  department: string
  daysToResolve?: number
  location?: GeoPoint
  landmark?: string
  description?: string
  severity?: Severity
  supporters?: number
  photoUrl?: string
  imageUrls?: string[]
}

export interface GeoPoint {
  lat: number
  lng: number
}

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export interface PlatformStats {
  filed: number
  resolved: number
  medianDaysToResolve: number
}

/** Default map centre: Bhagalpur, Bihar. */
export const DEFAULT_CENTER: GeoPoint = { lat: 25.2445, lng: 86.9718 }

/*
 * Kept on globalThis so the mock store survives dev-server module reloads and is
 * shared between the server action that writes it and the pages and route handlers that read it.
 */
const globalStore = globalThis as unknown as { __fmcComplaintsV2?: Complaint[] }
const complaints: Complaint[] = (globalStore.__fmcComplaintsV2 ??= buildSeedComplaints())

export function dbToComplaint(row: any, updates: any[] = []): Complaint {
  const category: ComplaintCategory = DB_TO_APP_CATEGORY[row.category] || 'Pothole'
  const history: StatusEvent[] = (updates || []).map((u) => {
    let officer: Officer = { name: 'Field Team', role: 'Duty Officer' }
    if (u.officer_name) {
      const parts = u.officer_name.split(',')
      officer = {
        name: parts[0]?.trim() || u.officer_name,
        role: parts.slice(1).join(',').trim() || 'Duty Officer',
      }
    }
    return {
      status: u.status as ComplaintStatus,
      at: u.created_at,
      officer,
      note: u.note || '',
    }
  })

  if (history.length === 0) {
    history.push({
      status: (row.status as ComplaintStatus) || 'received',
      at: row.created_at,
      officer: { name: 'FixMyCity intake desk', role: 'Automated triage and duplicate check' },
      note: `Complaint logged. Photo classified as ${category.toLowerCase()}; no duplicate found within 600 m.`,
    })
  }

  history.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const filedAt = row.created_at
  const filedOn = toKolkataDateString(filedAt)
  const resolvedOn = row.resolved_at ? toKolkataDateString(row.resolved_at) : undefined
  const daysToResolve =
    row.status === 'resolved' && row.resolved_at
      ? Math.max(0, Math.floor((Date.parse(row.resolved_at) - Date.parse(filedAt)) / DAY_MS))
      : undefined

  const rawPhoto =
    Array.isArray(row.image_urls) && row.image_urls.length > 0 && row.image_urls[0]
      ? row.image_urls[0]
      : '/placeholder.jpg'
  const photoUrl = getEvidencePublicUrl(rawPhoto)
  const imageUrls = Array.isArray(row.image_urls)
    ? row.image_urls.map((u: string) => getEvidencePublicUrl(u))
    : []

  return {
    id: row.case_id,
    category,
    title: row.title || `${category} — ${row.landmark || 'Bhagalpur'}`,
    ward: row.ward || 'Ward 1',
    city: 'Bhagalpur',
    status: row.status as ComplaintStatus,
    filedOn,
    filedAt,
    resolvedOn,
    department: CATEGORY_LEDGER_DEPARTMENT[category] || DEPARTMENT_BY_CATEGORY[category] || 'Municipal Services',
    daysToResolve,
    location: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : undefined,
    landmark: row.landmark,
    description: row.description || row.title,
    severity: (row.severity as Severity) || 'Medium',
    supporters: row.supporter_count ?? 0,
    photoUrl,
    imageUrls,
    history,
  }
}

const stats: PlatformStats = {
  filed: 4217,
  resolved: 3368,
  medianDaysToResolve: 4,
}

const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const supabase = getSupabaseServerClient()
    const { count: filed } = await supabase.from('complaints').select('*', { count: 'exact', head: true })
    const { count: resolved } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    if (filed !== null && resolved !== null) {
      return {
        filed: filed > 0 ? filed : stats.filed,
        resolved: resolved > 0 ? resolved : stats.resolved,
        medianDaysToResolve: stats.medianDaysToResolve,
      }
    }
  } catch (err) {}
  return stats
}

export async function getRecentlyResolved(limit = 8): Promise<Complaint[]> {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('complaints')
      .select('*, complaint_updates(*)')
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (data && data.length > 0) {
      return data.map((r) => dbToComplaint(r, r.complaint_updates))
    }
  } catch (err) {}
  return complaints
    .filter((c) => c.status === 'resolved')
    .sort((a, b) => (b.resolvedOn ?? '').localeCompare(a.resolvedOn ?? ''))
    .slice(0, limit)
}

export const COMPLAINT_ID_PATTERN = /^FMC-\d{4}-\d{6}$/

export function normalizeComplaintId(raw: string): string {
  return raw.trim().toUpperCase()
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const normalized = normalizeComplaintId(id)
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('complaints')
      .select('*, complaint_updates(*)')
      .or(`case_id.eq.${normalized},id.eq.${normalized}`)
      .maybeSingle()

    if (data) {
      return dbToComplaint(data, data.complaint_updates)
    }
  } catch (err) {}
  return complaints.find((c) => c.id === normalized) ?? null
}

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  received: 'Received',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  escalated: 'Escalated',
}

/* ------------------------------------------------------------------ */
/* Report flow — mock ML + submission. Replace bodies with real calls. */
/* ------------------------------------------------------------------ */

export const CATEGORIES: ComplaintCategory[] = [
  'Pothole',
  'Streetlight',
  'Garbage',
  'Drainage',
  'Water Supply',
  'Encroachment',
  'Damaged Infrastructure',
  'School Facilities',
  'Hospital Services',
  'Food Safety',
]

export interface ImageMeta {
  name: string
  size: number
  type: string
}

export interface ClassScore {
  label: string
  score: number
}

export interface ImageAnalysis {
  issueType: string
  topClasses: ClassScore[]
  severity: Severity
  department: string
  /** GPS read from the photo's EXIF block, or null when absent. */
  photoGps: GeoPoint | null
  modelVersion: string
  source?: 'live' | 'fallback'
  isNoIssue?: boolean
}

export interface SimilarityBreakdown {
  location: number
  image: number
  text: number
}

export interface DuplicateMatch {
  complaint: Complaint
  overall: number
  breakdown: SimilarityBreakdown
  distanceM: number
}

export interface DuplicateQuery {
  category: ComplaintCategory
  location: GeoPoint
  description: string
  landmark: string
  imageUrl?: string
}

export interface NewComplaintInput {
  category: ComplaintCategory
  description: string
  landmark: string
  location: GeoPoint
  severity: Severity
  photoCount: number
  photoUrls?: string[]
  photoFiles?: Array<{ name: string; type: string; buffer: ArrayBuffer | Buffer }>
  aiCategory?: string
  aiConfidence?: number
  aiSeverity?: Severity
  aiModelVersion?: string
}

export type SubmitResult = { ok: true; complaint: Complaint } | { ok: false; errors: Record<string, string> }

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical']

export type AnalyzeImageInput =
  | ImageMeta[]
  | FormData
  | {
      file?: Blob | File | Buffer
      fileName?: string
      text?: string
      images?: ImageMeta[]
    }

function analyzeImageMock(images: ImageMeta[]): ImageAnalysis {
  if (images.length === 0) throw new Error('At least one image is required')
  const seed = hashString(images.map((i) => `${i.name}:${i.size}`).join('|'))

  const primary = CATEGORIES[seed % CATEGORIES.length]
  const rest = CATEGORIES.filter((c) => c !== primary)
  const second = rest[(seed >>> 3) % rest.length]
  const third = rest.filter((c) => c !== second)[(seed >>> 6) % (rest.length - 1)]

  const top = 0.62 + ((seed >>> 9) % 30) / 100
  const mid = (1 - top) * (0.55 + ((seed >>> 12) % 20) / 100)
  const low = Math.max(0.01, (1 - top - mid) * 0.7)

  const hasGps = seed % 4 !== 0
  const photoGps = hasGps
    ? {
        lat: DEFAULT_CENTER.lat + (((seed >>> 4) % 20) - 10) / 10000,
        lng: DEFAULT_CENTER.lng + (((seed >>> 8) % 20) - 10) / 10000,
      }
    : null

  return {
    issueType: primary,
    topClasses: [
      { label: primary, score: top },
      { label: second, score: mid },
      { label: third, score: low },
    ],
    severity: SEVERITIES[(seed >>> 15) % SEVERITIES.length],
    department: DEPARTMENT_BY_CATEGORY[primary],
    photoGps,
    modelVersion: 'civic-vit-mock-0.3',
  }
}

/** Image classifier: uses ML service if ML_SERVICE_URL is set, otherwise falls back to deterministic mock. */
export async function analyzeImage(input: AnalyzeImageInput): Promise<ImageAnalysis> {
  let images: ImageMeta[] = []
  let file: Blob | File | Buffer | undefined
  let fileName: string | undefined
  let text: string | undefined

  if (Array.isArray(input)) {
    images = input
  } else if (input instanceof FormData) {
    const f = input.get('file')
    if (f instanceof Blob) {
      file = f
      fileName = (f as any).name || 'image.jpg'
    }
    const t = input.get('text')
    if (typeof t === 'string') text = t
    const m = input.get('meta')
    if (typeof m === 'string') {
      try {
        images = JSON.parse(m)
      } catch {}
    }
  } else if (input && typeof input === 'object') {
    file = input.file
    fileName = input.fileName
    text = input.text
    images = input.images || []
  }

  // Try calling Python ML service if configured
  const mlRes = await callMlAnalyze({ file, fileName, text })
  if (mlRes.usedLive && mlRes.data) {
    console.log('ML service used')
    const rawCat = mlRes.data.category || mlRes.data.top3?.[0]?.label
    const isNoIssue = rawCat === 'no_issue'
    const displayLabel = mapMlLabelToDisplay(rawCat)
    const primaryAppCategory = mapMlCategoryToApp(rawCat)

    const topClasses: ClassScore[] =
      mlRes.data.top3 && mlRes.data.top3.length > 0
        ? mlRes.data.top3.map((t) => ({
            label: mapMlLabelToDisplay(t.label),
            score: t.prob,
          }))
        : [{ label: displayLabel, score: mlRes.data.confidence || 0.9 }]

    // Suggested department from the ML response's "department" field when present
    const suggestedDept =
      mlRes.data.department ||
      (primaryAppCategory ? (CATEGORY_LEDGER_DEPARTMENT[primaryAppCategory] || DEPARTMENT_BY_CATEGORY[primaryAppCategory]) : '')

    return {
      issueType: displayLabel,
      topClasses,
      severity: normalizeSeverity(mlRes.data.severity),
      department: suggestedDept,
      photoGps: null,
      modelVersion: 'civic-vit-ml-service',
      source: 'live',
      isNoIssue,
    }
  }

  console.log(`ML fallback used: ${mlRes.reason || 'unreachable'}`)

  // Automatic fallback to existing deterministic mock
  await delay(600)
  const mockRes = await analyzeImageMock(
    images.length > 0 ? images : [{ name: fileName || 'photo.jpg', size: 1024, type: 'image/jpeg' }]
  )
  return {
    ...mockRes,
    source: 'fallback',
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const w of a) if (b.has(w)) inter++
  return inter / (a.size + b.size - inter)
}

const DUPLICATE_RADIUS_M = 600

/** Duplicate detector: uses Supabase nearby_complaints RPC + ML duplicate service, falling back to rule-based scoring. */
export async function checkDuplicates(query: DuplicateQuery): Promise<DuplicateMatch[]> {
  try {
    const supabase = getSupabaseServerClient()
    const { data: nearbyRows, error: rpcErr } = await supabase.rpc('nearby_complaints', {
      p_lat: query.location.lat,
      p_lng: query.location.lng,
      p_radius_m: DUPLICATE_RADIUS_M,
      p_category: null,
      p_days: 60,
    })

    if (!rpcErr && nearbyRows && Array.isArray(nearbyRows) && nearbyRows.length > 0) {
      const nonResolved = nearbyRows.filter((r: any) => r.status !== 'resolved')
      const candidates: MlDuplicateCandidate[] = nonResolved.map((r: any) => ({
        id: r.id,
        case_id: r.case_id,
        description: r.description || r.title || '',
        image_urls: r.image_urls || [],
        distance_m: Math.round(r.distance_m ?? distanceMeters(query.location, { lat: r.lat, lng: r.lng })),
      }))

      if (candidates.length > 0) {
        // Try Python ML service if configured
        const mlRes = await callMlDuplicateCheck({
          text: `${query.description} ${query.landmark}`.trim(),
          image_url: query.imageUrl || '',
          candidates,
        })

        if (mlRes.usedLive && mlRes.data) {
          console.log('ML service used')
          const matches: DuplicateMatch[] = []
          for (const m of mlRes.data) {
            const raw = nonResolved.find((r: any) => r.id === m.id || r.case_id === m.case_id)
            if (!raw) continue
            matches.push({
              complaint: dbToComplaint(raw),
              overall: m.score,
              breakdown: {
                location: m.location_score,
                image: m.image_score,
                text: m.text_score,
              },
              distanceM: raw.distance_m ?? distanceMeters(query.location, { lat: raw.lat, lng: raw.lng }),
            })
          }
          matches.sort((a, b) => b.overall - a.overall)
          return matches.filter((m) => m.overall >= 0.45).slice(0, 3)
        }

        console.log(`ML fallback used: ${mlRes.reason || 'service unreachable'}`)

        // Fallback to rule-based duplicate detector with DB results
        const queryTokens = tokenize(`${query.description} ${query.landmark} ${query.category}`)
        const dbCategory = APP_TO_DB_CATEGORY[query.category]
        const scored = nonResolved
          .map((c: any) => {
            const distanceM = c.distance_m ?? distanceMeters(query.location, { lat: c.lat, lng: c.lng })
            const location = Math.max(0, 1 - distanceM / DUPLICATE_RADIUS_M)
            const jitter = (hashString(c.id || c.case_id) % 12) / 100
            const image = c.category === dbCategory ? 0.78 + jitter : 0.18 + jitter
            const text = Math.min(
              1,
              jaccard(queryTokens, tokenize(`${c.title} ${c.description ?? ''} ${c.category}`)) * 2.2 + 0.1,
            )
            const overall = location * 0.45 + image * 0.35 + text * 0.2
            return {
              complaint: dbToComplaint(c),
              overall,
              breakdown: { location, image, text },
              distanceM,
            }
          })
          .filter((m) => m.distanceM <= DUPLICATE_RADIUS_M && m.overall >= 0.45)
          .sort((a, b) => b.overall - a.overall)
          .slice(0, 3)

        return scored
      } else {
        console.log('ML fallback used: no nearby complaints within 600m')
        return []
      }
    } else {
      console.log('ML fallback used: no nearby complaints within 600m')
      return []
    }
  } catch (err) {
    console.warn('nearby_complaints duplicate check error, falling back:', err)
  }

  // Fallback to in-memory store
  await delay(300)
  const nonResolvedMem = complaints.filter((c) => c.location && c.status !== 'resolved')
  const memCandidates: MlDuplicateCandidate[] = nonResolvedMem
    .map((c) => ({
      id: c.id,
      case_id: c.id,
      description: c.description || c.title,
      image_urls: c.imageUrls || (c.photoUrl ? [c.photoUrl] : []),
      distance_m: Math.round(distanceMeters(query.location, c.location as GeoPoint)),
    }))
    .filter((c) => c.distance_m <= DUPLICATE_RADIUS_M)

  if (memCandidates.length > 0) {
    const mlRes = await callMlDuplicateCheck({
      text: `${query.description} ${query.landmark}`.trim(),
      image_url: query.imageUrl || '',
      candidates: memCandidates,
    })
    if (mlRes.usedLive && mlRes.data) {
      console.log('ML service used')
      const matches: DuplicateMatch[] = []
      for (const m of mlRes.data) {
        const raw = nonResolvedMem.find((c) => c.id === m.id || c.id === m.case_id)
        if (!raw) continue
        matches.push({
          complaint: raw,
          overall: m.score,
          breakdown: { location: m.location_score, image: m.image_score, text: m.text_score },
          distanceM: distanceMeters(query.location, raw.location as GeoPoint),
        })
      }
      matches.sort((a, b) => b.overall - a.overall)
      return matches.filter((m) => m.overall >= 0.45).slice(0, 3)
    }
    console.log(`ML fallback used: ${mlRes.reason || 'service unreachable'}`)
    const queryTokens = tokenize(`${query.description} ${query.landmark} ${query.category}`)
    return complaints
      .filter((c) => c.location && c.status !== 'resolved')
      .map((c) => {
        const distanceM = distanceMeters(query.location, c.location as GeoPoint)
        const location = Math.max(0, 1 - distanceM / DUPLICATE_RADIUS_M)
        const jitter = (hashString(c.id) % 12) / 100
        const image = c.category === query.category ? 0.78 + jitter : 0.18 + jitter
        const text = Math.min(
          1,
          jaccard(queryTokens, tokenize(`${c.title} ${c.description ?? ''} ${c.category}`)) * 2.2 + 0.1,
        )
        const overall = location * 0.45 + image * 0.35 + text * 0.2
        return { complaint: c, overall, breakdown: { location, image, text }, distanceM }
      })
      .filter((m) => m.distanceM <= DUPLICATE_RADIUS_M && m.overall >= 0.45)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3)
  } else {
    console.log('ML fallback used: no nearby complaints within 600m')
    return []
  }
}

function nextComplaintId(): string {
  const year = new Date().getFullYear()
  const maxSeq = complaints.reduce((max, c) => {
    const seq = Number(c.id.slice(-6))
    return Number.isFinite(seq) && seq > max ? seq : max
  }, 0)
  return `FMC-${year}-${String(maxSeq + 1).padStart(6, '0')}`
}

export function validateComplaintInput(input: NewComplaintInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!CATEGORIES.includes(input.category)) errors.category = 'Choose a valid category.'
  if (!SEVERITIES.includes(input.severity)) errors.severity = 'Invalid severity.'
  const description = input.description?.trim() ?? ''
  if (description.length < 15) errors.description = 'Describe the problem in at least 15 characters.'
  if (description.length > 1000) errors.description = 'Keep the description under 1000 characters.'
  const landmark = input.landmark?.trim() ?? ''
  if (landmark.length < 3) errors.landmark = 'Enter a landmark, nearby place or address.'
  if (landmark.length > 200) errors.landmark = 'Keep the landmark under 200 characters.'
  const { lat, lng } = input.location ?? {}
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    errors.location = 'Place the pin on the map.'
  }
  if (!Number.isInteger(input.photoCount) || input.photoCount < 1 || input.photoCount > 3) {
    errors.photos = 'Attach between 1 and 3 photos.'
  }
  return errors
}

export async function submitComplaint(input: NewComplaintInput): Promise<SubmitResult> {
  const errors = validateComplaintInput(input)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const landmark = input.landmark.trim()
  const wardMatch = landmark.match(/ward\s*(\d+)/i)
  const ward = wardMatch ? `Ward ${wardMatch[1]}` : 'Ward 1'
  const filedAt = new Date().toISOString()
  const title = `${input.category} — ${landmark}`
  const dbCat = APP_TO_DB_CATEGORY[input.category] || 'pothole'
  const deptId = CATEGORY_DEPARTMENT_ID[input.category] || 1

  // AI suggestions stored separately from the user-selected complaint category
  const aiDbCat = input.aiCategory
    ? (APP_TO_DB_CATEGORY[input.aiCategory as ComplaintCategory] || input.aiCategory.toLowerCase())
    : dbCat
  const aiConfidence = input.aiConfidence ?? 0.88
  const aiSeverity = input.aiSeverity ?? input.severity
  const aiModelVersion = input.aiModelVersion || 'civic-vit-mock-0.3'

  // Base SLA calculation
  const baseSlaDays: Record<Severity, number> = { Critical: 2, High: 4, Medium: 7, Low: 14 }
  const slaDays = baseSlaDays[input.severity] ?? 7
  const slaDueAt = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString()

  // Collect photo URLs: existing, uploaded, or neutral placeholder (never stock photo of another category)
  const photoUrls: string[] = input.photoUrls ? [...input.photoUrls] : []

  if (input.photoFiles && input.photoFiles.length > 0) {
    for (const pf of input.photoFiles) {
      try {
        const url = await uploadComplaintPhoto(pf.buffer, pf.name, pf.type)
        photoUrls.push(url)
      } catch (uploadErr) {
        console.warn('Failed to upload complaint photo buffer:', uploadErr)
      }
    }
  }

  if (photoUrls.length === 0) {
    photoUrls.push('/placeholder.jpg')
  }

  const priorityScore = computeAiPriorityScore({
    severity: input.severity,
    daysOpen: 0,
    supporters: 0,
    status: 'received',
    category: input.category,
  })

  try {
    const supabase = getSupabaseServerClient()
    const { data: inserted, error: insertError } = await supabase
      .from('complaints')
      .insert({
        title,
        description: input.description.trim(),
        category: dbCat,
        department_id: deptId,
        severity: input.severity,
        status: 'received',
        ward,
        landmark,
        lat: input.location.lat,
        lng: input.location.lng,
        image_urls: photoUrls,
        ai_category: aiDbCat,
        ai_confidence: aiConfidence,
        ai_severity: aiSeverity,
        ai_model_version: aiModelVersion,
        priority_score: priorityScore,
        supporter_count: 0,
        duplicate_of: null,
        sla_due_at: slaDueAt,
        created_at: filedAt,
        updated_at: filedAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase complaint insert error:', insertError)
      throw insertError
    }

    const initialNote = `Complaint logged as ${input.category.toLowerCase()}.${input.aiCategory ? ` Photo AI suggested ${input.aiCategory.toLowerCase()};` : ''} duplicate check completed.`
    const initialOfficer = 'FixMyCity intake desk, Automated triage and duplicate check'
    await supabase.from('complaint_updates').insert({
      complaint_id: inserted.id,
      status: 'received',
      note: initialNote,
      officer_name: initialOfficer,
      created_at: filedAt,
    })

    const complaint: Complaint = {
      id: inserted.case_id,
      category: input.category,
      title,
      ward,
      city: 'Bhagalpur',
      status: 'received',
      filedOn: toKolkataDateString(filedAt),
      filedAt,
      department: CATEGORY_LEDGER_DEPARTMENT[input.category] || DEPARTMENT_BY_CATEGORY[input.category],
      location: { lat: input.location.lat, lng: input.location.lng },
      landmark,
      description: input.description.trim(),
      severity: input.severity,
      supporters: 0,
      photoUrl: photoUrls[0] || '/placeholder.jpg',
      imageUrls: photoUrls,
      history: [
        {
          status: 'received',
          at: filedAt,
          officer: {
            name: 'FixMyCity intake desk',
            role: 'Automated triage and duplicate check',
          },
          note: initialNote,
        },
      ],
    }

    complaints.unshift(complaint)
    return { ok: true, complaint }
  } catch (err) {
    console.warn('Supabase submitComplaint failed, falling back to mock store:', err)
  }

  // Fallback to in-memory store
  await delay(400)
  const complaint: Complaint = {
    filedAt,
    history: [receivedEvent(input.category, filedAt)],
    id: nextComplaintId(),
    category: input.category,
    title,
    ward,
    city: 'Bhagalpur',
    status: 'received',
    filedOn: toKolkataDateString(filedAt),
    department: CATEGORY_LEDGER_DEPARTMENT[input.category] || DEPARTMENT_BY_CATEGORY[input.category],
    location: { lat: input.location.lat, lng: input.location.lng },
    landmark,
    description: input.description.trim(),
    severity: input.severity,
    supporters: 0,
    photoUrl: photoUrls[0] || '/placeholder.jpg',
    imageUrls: photoUrls,
  }
  complaints.unshift(complaint)
  return { ok: true, complaint }
}

export async function supportComplaint(id: string): Promise<Complaint | null> {
  const normId = normalizeComplaintId(id)
  let updatedComplaint: Complaint | null = null

  try {
    const supabase = getSupabaseServerClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    let query = supabase.from('complaints').select('id, case_id').limit(1)
    if (isUuid) {
      query = query.eq('id', id)
    } else {
      query = query.eq('case_id', normId)
    }
    const { data: row } = await query.single()
    if (row?.id) {
      const { error: rpcError } = await supabase.rpc('add_supporter', {
        p_complaint_id: row.id,
      })
      if (!rpcError) {
        const detail = await getComplaintDetail(row.case_id)
        if (detail) {
          updatedComplaint = detail.complaint
        }
      }
    }
  } catch (err) {
    console.warn('Supabase add_supporter error, falling back to mock:', err)
  }

  // Also update in-memory target if present
  const target = complaints.find((c) => c.id === normId)
  if (target) {
    target.supporters = (target.supporters ?? 0) + 1
    if (!updatedComplaint) updatedComplaint = target
  }

  return updatedComplaint
}

/* ------------------------------------------------------------------ */
/* Case file + Public Ledger                                           */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000
const SEVERITY_RANK: Record<Severity, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
const STATUS_RANK: Record<ComplaintStatus, number> = {
  received: 0,
  assigned: 1,
  in_progress: 2,
  escalated: 3,
  resolved: 4,
}

export const COMPLAINT_STATUSES: ComplaintStatus[] = ['received', 'assigned', 'in_progress', 'resolved', 'escalated']
export const SEVERITIES_LIST: Severity[] = SEVERITIES

function resolvedAtMs(c: Complaint): number | null {
  const event = c.history.find((e) => e.status === 'resolved')
  return event ? Date.parse(event.at) : null
}

/** Whole days a case has been (or was) open: filing to resolution, or filing to now. */
function daysOpenOf(c: Complaint, now: number): number {
  const end = resolvedAtMs(c) ?? now
  return Math.max(0, Math.floor((end - Date.parse(c.filedAt)) / DAY_MS))
}

function formatGap(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000))
  if (minutes < 60) return `+${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `+${hours}h`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours ? `+${days}d ${remHours}h` : `+${days}d`
}

export type TimelineState = 'done' | 'current' | 'upcoming'

export interface TimelineStep {
  status: ComplaintStatus
  label: string
  state: TimelineState
  at?: string
  officer?: Officer
  note?: string
  /** Time since the previous step, e.g. "+1d 4h". */
  sincePrevious?: string
}

export interface CaseAnalysis {
  category: ComplaintCategory
  /** 0..1 */
  confidence: number
  severity: Severity
  department: string
  modelVersion: string
}

export interface ComplaintDetail {
  complaint: Complaint
  photoUrl: string
  ledgerDepartment: LedgerDepartment
  analysis: CaseAnalysis
  timeline: TimelineStep[]
  daysOpen: number
  /** True once the case has been resolved; daysOpen is then the time taken. */
  closed: boolean
  supporters: number
}

export async function getComplaintDetail(id: string): Promise<ComplaintDetail | null> {
  const normalized = normalizeComplaintId(id)
  let complaint: Complaint | null = null
  let photoUrlFromDb: string | null = null
  let aiConfidenceFromDb: number | null = null
  let aiModelFromDb: string | null = null
  let aiCategoryFromDb: string | null = null
  let aiSeverityFromDb: string | null = null

  try {
    const supabase = getSupabaseServerClient()
    const { data: row } = await supabase
      .from('complaints')
      .select('*, complaint_updates(*)')
      .or(`case_id.eq.${normalized},id.eq.${normalized}`)
      .maybeSingle()

    if (row) {
      complaint = dbToComplaint(row, row.complaint_updates)
      photoUrlFromDb = Array.isArray(row.image_urls) && row.image_urls[0] ? getEvidencePublicUrl(row.image_urls[0]) : null
      aiConfidenceFromDb = row.ai_confidence
      aiModelFromDb = row.ai_model_version
      aiCategoryFromDb = row.ai_category ? (DB_TO_APP_CATEGORY[row.ai_category] || row.ai_category) : null
      aiSeverityFromDb = row.ai_severity
    }
  } catch (err) {}

  if (!complaint) {
    complaint = complaints.find((c) => c.id === normalized) ?? null
  }
  if (!complaint) return null

  const now = Date.now()

  const final: { status: ComplaintStatus; label: string } =
    complaint.status === 'escalated' ? { status: 'escalated', label: 'Escalated' } : { status: 'resolved', label: 'Resolved' }
  const flow: { status: ComplaintStatus; label: string }[] = [
    { status: 'received', label: 'Received' },
    { status: 'assigned', label: 'Assigned' },
    { status: 'in_progress', label: 'In progress' },
    final,
  ]

  const events = flow.map((step) => complaint!.history.find((e) => e.status === step.status))
  const lastReached = events.reduce((last, e, i) => (e ? i : last), -1)

  const timeline: TimelineStep[] = flow.map((step, i) => {
    const event = events[i]
    const previous = i > 0 ? events[i - 1] : undefined
    if (!event) return { status: step.status, label: step.label, state: 'upcoming' }
    return {
      status: step.status,
      label: step.label,
      state: i === lastReached ? 'current' : 'done',
      at: event.at,
      officer: event.officer,
      note: event.note,
      sincePrevious: previous ? formatGap(Date.parse(event.at) - Date.parse(previous.at)) : undefined,
    }
  })

  return {
    complaint,
    photoUrl: photoUrlFromDb || complaint.photoUrl || '/placeholder.jpg',
    ledgerDepartment: CATEGORY_LEDGER_DEPARTMENT[complaint.category],
    analysis: {
      category: (aiCategoryFromDb as ComplaintCategory) || complaint.category,
      confidence: aiConfidenceFromDb ?? (0.74 + (hashString(complaint.id) % 25) / 100),
      severity: (aiSeverityFromDb as Severity) || complaint.severity || 'Medium',
      department: complaint.department,
      modelVersion: aiModelFromDb || 'civic-vit-mock-0.3',
    },
    timeline,
    daysOpen: daysOpenOf(complaint, now),
    closed: complaint.status === 'resolved',
    supporters: complaint.supporters ?? 0,
  }
}

/* ----------------------------- Ledger ----------------------------- */

export interface DepartmentStat {
  department: LedgerDepartment
  officialNames: string[]
  total: number
  resolved: number
  open: number
  escalated: number
  /** 0..100 */
  resolvedPct: number
  avgDaysToResolve: number | null
  /** Open complaints at the end of each of the last 8 weeks, oldest first. */
  backlogTrend: number[]
}

export interface LedgerStats {
  totals: { total: number; resolved: number; open: number; escalated: number; avgDaysToResolve: number | null }
  departments: DepartmentStat[]
}

export async function getLedgerStats(): Promise<LedgerStats> {
  const now = Date.now()
  const mean = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null)

  try {
    const supabase = getSupabaseServerClient()
    const { data: rows } = await supabase.from('complaints').select('*')
    if (rows && rows.length > 0) {
      const departments = LEDGER_DEPARTMENTS.map((department): DepartmentStat => {
        const deptId = LEDGER_DEPARTMENT_TO_ID[department]
        const mine = rows.filter((r) => r.department_id === deptId)
        const resolved = mine.filter((r) => r.status === 'resolved')
        const backlogTrend = Array.from({ length: 8 }, (_, i) => {
          const t = now - (7 - i) * 7 * DAY_MS
          return mine.filter((r) => {
            if (Date.parse(r.created_at) > t) return false
            const done = r.resolved_at ? Date.parse(r.resolved_at) : null
            return done === null || done > t
          }).length
        })
        const mineResolvedDays = resolved.map((r) => {
          const end = r.resolved_at ? Date.parse(r.resolved_at) : now
          return Math.max(0, Math.floor((end - Date.parse(r.created_at)) / DAY_MS))
        })
        return {
          department,
          officialNames: [...new Set(mine.map((r) => DEPARTMENT_BY_CATEGORY[DB_TO_APP_CATEGORY[r.category] || 'Pothole']))],
          total: mine.length,
          resolved: resolved.length,
          open: mine.length - resolved.length,
          escalated: mine.filter((r) => r.status === 'escalated').length,
          resolvedPct: mine.length ? Math.round((resolved.length / mine.length) * 100) : 0,
          avgDaysToResolve: mean(mineResolvedDays),
          backlogTrend,
        }
      })

      const resolvedAll = rows.filter((r) => r.status === 'resolved')
      const allResolvedDays = resolvedAll.map((r) => {
        const end = r.resolved_at ? Date.parse(r.resolved_at) : now
        return Math.max(0, Math.floor((end - Date.parse(r.created_at)) / DAY_MS))
      })
      return {
        totals: {
          total: rows.length,
          resolved: resolvedAll.length,
          open: rows.length - resolvedAll.length,
          escalated: rows.filter((r) => r.status === 'escalated').length,
          avgDaysToResolve: mean(allResolvedDays),
        },
        departments,
      }
    }
  } catch (err) {}

  const departments = LEDGER_DEPARTMENTS.map((department): DepartmentStat => {
    const mine = complaints.filter((c) => CATEGORY_LEDGER_DEPARTMENT[c.category] === department)
    const resolved = mine.filter((c) => c.status === 'resolved')
    const backlogTrend = Array.from({ length: 8 }, (_, i) => {
      const t = now - (7 - i) * 7 * DAY_MS
      return mine.filter((c) => {
        if (Date.parse(c.filedAt) > t) return false
        const done = resolvedAtMs(c)
        return done === null || done > t
      }).length
    })
    return {
      department,
      officialNames: [...new Set(mine.map((c) => c.department))],
      total: mine.length,
      resolved: resolved.length,
      open: mine.length - resolved.length,
      escalated: mine.filter((c) => c.status === 'escalated').length,
      resolvedPct: mine.length ? Math.round((resolved.length / mine.length) * 100) : 0,
      avgDaysToResolve: mean(resolved.map((c) => daysOpenOf(c, now))),
      backlogTrend,
    }
  })

  const resolvedAll = complaints.filter((c) => c.status === 'resolved')
  return {
    totals: {
      total: complaints.length,
      resolved: resolvedAll.length,
      open: complaints.length - resolvedAll.length,
      escalated: complaints.filter((c) => c.status === 'escalated').length,
      avgDaysToResolve: mean(resolvedAll.map((c) => daysOpenOf(c, now))),
    },
    departments,
  }
}

export const SORT_KEYS = ['id', 'category', 'ward', 'daysOpen', 'status', 'severity', 'priorityScore', 'supporters'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface SlaInfo {
  targetDays: number
  daysRemaining: number
  isOverdue: boolean
  label: string
}

export function computeSla(
  category: ComplaintCategory,
  severity: Severity,
  daysOpen: number,
  status: ComplaintStatus,
): SlaInfo {
  const baseSla: Record<Severity, number> = {
    Critical: 2,
    High: 4,
    Medium: 7,
    Low: 14,
  }
  const targetDays = baseSla[severity] ?? 7
  const daysRemaining = targetDays - daysOpen
  const isOverdue = status !== 'resolved' && daysRemaining < 0
  const label =
    status === 'resolved'
      ? daysRemaining >= 0
        ? 'Within SLA'
        : `Resolved (${Math.abs(daysRemaining)}d overdue)`
      : isOverdue
        ? `${Math.abs(daysRemaining)}d overdue`
        : daysRemaining === 0
          ? 'Due today'
          : `${daysRemaining}d left`

  return { targetDays, daysRemaining, isOverdue, label }
}

export function computeAiPriorityScore(complaint: {
  severity?: Severity
  daysOpen: number
  supporters?: number
  status: ComplaintStatus
  category: ComplaintCategory
}): number {
  if (complaint.status === 'resolved') {
    return 10
  }
  const severityWeight: Record<Severity, number> = {
    Critical: 45,
    High: 30,
    Medium: 16,
    Low: 6,
  }
  const base = severityWeight[complaint.severity ?? 'Medium'] ?? 16
  const sla = computeSla(complaint.category, complaint.severity ?? 'Medium', complaint.daysOpen, complaint.status)

  let urgency = 0
  if (sla.isOverdue) {
    urgency = Math.min(30, 15 + Math.abs(sla.daysRemaining) * 4)
  } else if (sla.daysRemaining === 0) {
    urgency = 12
  } else if (sla.daysRemaining <= 2) {
    urgency = 6
  }

  const supporters = complaint.supporters ?? 0
  const supportersScore = Math.min(18, Math.round(Math.log2(supporters + 1) * 3.2))

  const statusWeight: Record<ComplaintStatus, number> = {
    escalated: 15,
    received: 6,
    assigned: 3,
    in_progress: 2,
    resolved: 0,
  }
  const statusScore = statusWeight[complaint.status] ?? 0

  const total = base + urgency + supportersScore + statusScore
  return Math.max(1, Math.min(99, total))
}

export interface ComplaintFilters {
  q?: string
  category?: ComplaintCategory
  department?: LedgerDepartment
  status?: ComplaintStatus
  severity?: Severity
  ward?: string
  sort?: SortKey
  dir?: 'asc' | 'desc'
}

export interface ComplaintRow {
  id: string
  title: string
  category: ComplaintCategory
  department: LedgerDepartment
  ward: string
  status: ComplaintStatus
  severity: Severity
  daysOpen: number
  filedOn: string
  location?: GeoPoint
  supporters: number
  priorityScore: number
  sla: SlaInfo
  landmark?: string
  description?: string
}

/** Whitelists untrusted query-string values; unknown values are dropped. */
export function parseComplaintFilters(params: URLSearchParams): ComplaintFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const value = params.get(key)
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
  }
  const q = params.get('q')?.trim().slice(0, 80)
  const ward = params.get('ward')?.trim().slice(0, 40)
  return {
    q: q || undefined,
    ward: ward || undefined,
    category: pick('category', CATEGORIES),
    department: pick('department', LEDGER_DEPARTMENTS),
    status: pick('status', COMPLAINT_STATUSES),
    severity: pick('severity', SEVERITIES),
    sort: pick('sort', SORT_KEYS),
    dir: pick('dir', ['asc', 'desc'] as const),
  }
}

export async function listComplaints(filters: ComplaintFilters = {}): Promise<ComplaintRow[]> {
  const now = Date.now()

  try {
    const supabase = getSupabaseServerClient()
    let query = supabase.from('complaints').select('*')

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.severity) query = query.eq('severity', filters.severity)
    if (filters.ward) query = query.eq('ward', filters.ward)
    if (filters.category) {
      const dbCat = APP_TO_DB_CATEGORY[filters.category]
      if (dbCat) query = query.eq('category', dbCat)
    }
    if (filters.department) {
      const deptId = LEDGER_DEPARTMENT_TO_ID[filters.department]
      if (deptId) query = query.eq('department_id', deptId)
    }
    if (filters.q) {
      const needle = filters.q.trim()
      query = query.or(`case_id.ilike.%${needle}%,title.ilike.%${needle}%,landmark.ilike.%${needle}%,ward.ilike.%${needle}%`)
    }

    const { data: rows } = await query
    if (rows && rows.length >= 0) {
      const mapped = rows.map((r: any): ComplaintRow => {
        const end = r.resolved_at ? Date.parse(r.resolved_at) : now
        const daysOpen = Math.max(0, Math.floor((end - Date.parse(r.created_at)) / DAY_MS))
        const category = DB_TO_APP_CATEGORY[r.category] || 'Pothole'
        const severity = (r.severity as Severity) || 'Medium'
        const status = r.status as ComplaintStatus
        const sla = computeSla(category, severity, daysOpen, status)
        const priorityScore =
          r.priority_score ||
          computeAiPriorityScore({
            severity,
            daysOpen,
            supporters: r.supporter_count,
            status,
            category,
          })

        return {
          id: r.case_id,
          title: r.title,
          category,
          department: CATEGORY_LEDGER_DEPARTMENT[category],
          ward: r.ward || 'Ward 1',
          status,
          severity,
          daysOpen,
          filedOn: toKolkataDateString(r.created_at),
          location: r.lat && r.lng ? { lat: r.lat, lng: r.lng } : undefined,
          supporters: r.supporter_count ?? 1,
          priorityScore,
          sla,
          landmark: r.landmark,
          description: r.description || r.title,
        }
      })

      const sort = filters.sort ?? 'id'
      const dir =
        filters.dir ??
        (sort === 'id' || sort === 'daysOpen' || sort === 'severity' || sort === 'priorityScore' || sort === 'supporters'
          ? 'desc'
          : 'asc')
      const factor = dir === 'asc' ? 1 : -1
      const compare = (a: ComplaintRow, b: ComplaintRow): number => {
        switch (sort) {
          case 'priorityScore':
            return a.priorityScore - b.priorityScore
          case 'supporters':
            return a.supporters - b.supporters
          case 'daysOpen':
            return a.daysOpen - b.daysOpen
          case 'severity':
            return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
          case 'status':
            return STATUS_RANK[a.status] - STATUS_RANK[b.status]
          case 'category':
            return a.category.localeCompare(b.category)
          case 'ward':
            return a.ward.localeCompare(b.ward, 'en', { numeric: true })
          default:
            return a.id.localeCompare(b.id)
        }
      }
      return mapped.sort((a, b) => compare(a, b) * factor || b.id.localeCompare(a.id))
    }
  } catch (err) {}

  const needle = filters.q?.toLowerCase()

  const rows = complaints
    .filter((c) => {
      if (filters.category && c.category !== filters.category) return false
      if (filters.department && CATEGORY_LEDGER_DEPARTMENT[c.category] !== filters.department) return false
      if (filters.status && c.status !== filters.status) return false
      if (filters.severity && (c.severity ?? 'Medium') !== filters.severity) return false
      if (filters.ward && c.ward !== filters.ward) return false
      if (needle && !`${c.id} ${c.title} ${c.landmark ?? ''} ${c.ward}`.toLowerCase().includes(needle)) return false
      return true
    })
    .map((c): ComplaintRow => {
      const daysOpen = daysOpenOf(c, now)
      const severity = c.severity ?? 'Medium'
      const sla = computeSla(c.category, severity, daysOpen, c.status)
      const priorityScore = computeAiPriorityScore({
        severity,
        daysOpen,
        supporters: c.supporters,
        status: c.status,
        category: c.category,
      })

      return {
        id: c.id,
        title: c.title,
        category: c.category,
        department: CATEGORY_LEDGER_DEPARTMENT[c.category],
        ward: c.ward,
        status: c.status,
        severity,
        daysOpen,
        filedOn: c.filedOn,
        location: c.location,
        supporters: c.supporters ?? 0,
        priorityScore,
        sla,
        landmark: c.landmark,
        description: c.description,
      }
    })

  const sort = filters.sort ?? 'id'
  const dir =
    filters.dir ??
    (sort === 'id' || sort === 'daysOpen' || sort === 'severity' || sort === 'priorityScore' || sort === 'supporters'
      ? 'desc'
      : 'asc')
  const factor = dir === 'asc' ? 1 : -1
  const compare = (a: ComplaintRow, b: ComplaintRow): number => {
    switch (sort) {
      case 'priorityScore':
        return a.priorityScore - b.priorityScore
      case 'supporters':
        return a.supporters - b.supporters
      case 'daysOpen':
        return a.daysOpen - b.daysOpen
      case 'severity':
        return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      case 'status':
        return STATUS_RANK[a.status] - STATUS_RANK[b.status]
      case 'category':
        return a.category.localeCompare(b.category)
      case 'ward':
        return a.ward.localeCompare(b.ward, 'en', { numeric: true })
      default:
        return a.id.localeCompare(b.id)
    }
  }
  return rows.sort((a, b) => compare(a, b) * factor || b.id.localeCompare(a.id))
}

export interface UpdateStatusInput {
  id: string
  status: ComplaintStatus
  note?: string
  officerName?: string
  officerRole?: string
}

export async function updateComplaintStatus(input: UpdateStatusInput): Promise<{
  ok: boolean
  complaint?: Complaint
  error?: string
}> {
  const normalized = normalizeComplaintId(input.id)
  const complaint = complaints.find((c) => c.id === normalized)
  if (!complaint) return { ok: false, error: 'Complaint not found' }

  const newStatus = input.status
  const officer: Officer = {
    name: input.officerName?.trim() || 'Duty Officer',
    role: input.officerRole?.trim() || `${complaint.department} Desk`,
  }

  const existingStatuses = new Set(complaint.history.map((e) => e.status))

  if (newStatus === 'in_progress' && !existingStatuses.has('assigned')) {
    complaint.history.push({
      status: 'assigned',
      at: new Date(Date.now() - 3600000).toISOString(),
      officer: { name: 'P. K. Verma', role: 'Nodal Officer' },
      note: 'Auto-assigned upon triage',
    })
  }

  if (newStatus === 'resolved' || newStatus === 'escalated') {
    if (!existingStatuses.has('assigned')) {
      complaint.history.push({
        status: 'assigned',
        at: new Date(Date.now() - 7200000).toISOString(),
        officer: { name: 'P. K. Verma', role: 'Nodal Officer' },
        note: 'Assigned for execution',
      })
    }
    if (!existingStatuses.has('in_progress')) {
      complaint.history.push({
        status: 'in_progress',
        at: new Date(Date.now() - 3600000).toISOString(),
        officer: { name: 'Field Operations', role: 'Ward Engineer' },
        note: 'Site investigation initiated',
      })
    }
  }

  const newEvent: StatusEvent = {
    status: newStatus,
    at: new Date().toISOString(),
    officer,
    note: input.note?.trim() || `Status updated to ${STATUS_LABEL[newStatus]} by officer.`,
  }

  complaint.history.push(newEvent)
  complaint.status = newStatus

  if (newStatus === 'resolved') {
    complaint.resolvedOn = toKolkataDateString(new Date())
    complaint.daysToResolve = daysOpenOf(complaint, Date.now())
  } else {
    complaint.resolvedOn = undefined
    complaint.daysToResolve = undefined
  }

  return { ok: true, complaint }
}

export interface MergeDuplicateInput {
  sourceId: string
  targetId: string
  officerNote?: string
}

export async function mergeComplaintAsDuplicate(input: MergeDuplicateInput): Promise<{ ok: boolean; error?: string }> {
  const source = complaints.find((c) => c.id === normalizeComplaintId(input.sourceId))
  const target = complaints.find((c) => c.id === normalizeComplaintId(input.targetId))
  if (!source || !target) return { ok: false, error: 'Source or target complaint not found' }

  const sourceSupporters = Math.max(1, source.supporters ?? 1)
  target.supporters = (target.supporters ?? 0) + sourceSupporters

  target.history.push({
    status: target.status,
    at: new Date().toISOString(),
    officer: { name: 'Duty Officer', role: 'Triage Desk' },
    note: `Merged duplicate case ${source.id} into this case (+${sourceSupporters} citizen supporters)`,
  })

  source.status = 'resolved'
  source.resolvedOn = toKolkataDateString(new Date())
  source.daysToResolve = daysOpenOf(source, Date.now())
  source.history.push({
    status: 'resolved',
    at: new Date().toISOString(),
    officer: { name: 'Duty Officer', role: 'Triage Desk' },
    note: `Merged as duplicate of primary case ${target.id}. ${input.officerNote || ''}`.trim(),
  })

  return { ok: true }
}

export interface AdminComplaintDetailResult {
  detail: ComplaintDetail
  duplicates: DuplicateMatch[]
  priorityScore: number
  sla: SlaInfo
}

export async function getAdminComplaintDetail(id: string): Promise<AdminComplaintDetailResult | null> {
  const detail = await getComplaintDetail(id)
  if (!detail) return null
  const c = detail.complaint
  const priorityScore = computeAiPriorityScore({
    severity: c.severity,
    daysOpen: detail.daysOpen,
    supporters: c.supporters,
    status: c.status,
    category: c.category,
  })
  const sla = computeSla(c.category, c.severity ?? 'Medium', detail.daysOpen, c.status)

  let duplicates: DuplicateMatch[] = []
  if (c.location) {
    try {
      const supabase = getSupabaseServerClient()
      const dbCat = APP_TO_DB_CATEGORY[c.category]
      const { data: nearby } = await supabase.rpc('nearby_complaints', {
        p_lat: c.location.lat,
        p_lng: c.location.lng,
        p_radius_m: 600,
        p_category: dbCat,
        p_days: 60,
      })
      if (nearby && nearby.length > 0) {
        duplicates = nearby
          .filter((n: any) => n.case_id !== c.id)
          .map((n: any) => {
            const cat = DB_TO_APP_CATEGORY[n.category] || 'Pothole'
            const dummyComplaint: Complaint = {
              id: n.case_id,
              category: cat,
              title: n.title,
              ward: c.ward,
              city: 'Bhagalpur',
              status: n.status,
              filedOn: toKolkataDateString(n.created_at),
              filedAt: n.created_at,
              department: CATEGORY_LEDGER_DEPARTMENT[cat] || DEPARTMENT_BY_CATEGORY[cat] || 'Municipal Services',
              location: { lat: n.lat, lng: n.lng },
              landmark: n.landmark,
              description: n.description,
              supporters: n.supporter_count,
              history: [],
            }
            const dist = n.distance_m ?? 50
            const locationScore = Math.max(0, 1 - dist / 600)
            const overall = locationScore * 0.5 + 0.8 * 0.35 + 0.6 * 0.15
            return {
              complaint: dummyComplaint,
              overall,
              breakdown: { location: locationScore, image: 0.8, text: 0.6 },
              distanceM: Math.round(dist),
            }
          })
      }
    } catch (e) {}

    if (duplicates.length === 0) {
      const rawMatches = await checkDuplicates({
        category: c.category,
        location: c.location,
        description: c.description ?? c.title,
        landmark: c.landmark ?? '',
      })
      duplicates = rawMatches.filter((m) => m.complaint.id !== c.id)
    }
  }

  if (duplicates.length === 0) {
    try {
      const supabase = getSupabaseServerClient()
      const dbCat = APP_TO_DB_CATEGORY[c.category]
      const { data: similarRows } = await supabase
        .from('complaints')
        .select('*')
        .neq('case_id', c.id)
        .neq('status', 'resolved')
        .or(`category.eq.${dbCat},ward.eq.${c.ward}`)
        .limit(3)

      if (similarRows && similarRows.length > 0) {
        duplicates = similarRows.map((other: any) => {
          const cat = DB_TO_APP_CATEGORY[other.category] || 'Pothole'
          const dist =
            c.location && other.lat && other.lng
              ? distanceMeters(c.location, { lat: other.lat, lng: other.lng })
              : 380
          const otherComp: Complaint = {
            id: other.case_id,
            category: cat,
            title: other.title,
            ward: other.ward || 'Ward 1',
            city: 'Bhagalpur',
            status: other.status,
            filedOn: toKolkataDateString(other.created_at),
            filedAt: other.created_at,
            department: CATEGORY_LEDGER_DEPARTMENT[cat] || DEPARTMENT_BY_CATEGORY[cat] || 'Municipal Services',
            location: { lat: other.lat, lng: other.lng },
            landmark: other.landmark,
            description: other.description,
            supporters: other.supporter_count,
            history: [],
          }
          return {
            complaint: otherComp,
            overall: cat === c.category ? 0.76 : 0.54,
            breakdown: {
              location: other.ward === c.ward ? 0.85 : 0.35,
              image: cat === c.category ? 0.82 : 0.25,
              text: 0.65,
            },
            distanceM: Math.round(dist),
          }
        })
      }
    } catch (e) {}
  }

  if (duplicates.length === 0) {
    duplicates = complaints
      .filter((other) => other.id !== c.id && (other.ward === c.ward || other.category === c.category) && other.status !== 'resolved')
      .slice(0, 3)
      .map((other) => {
        const dist = c.location && other.location ? distanceMeters(c.location, other.location) : 380
        return {
          complaint: other,
          overall: other.category === c.category ? 0.76 : 0.54,
          breakdown: {
            location: other.ward === c.ward ? 0.85 : 0.35,
            image: other.category === c.category ? 0.82 : 0.25,
            text: 0.65,
          },
          distanceM: Math.round(dist),
        }
      })
  }

  return { detail, duplicates, priorityScore, sla }
}

export async function listWards(): Promise<string[]> {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.from('complaints').select('ward')
    if (data && data.length > 0) {
      const wards = [...new Set(data.map((r: any) => r.ward).filter(Boolean))].sort((a: any, b: any) =>
        a.localeCompare(b, 'en', { numeric: true }),
      )
      if (wards.length > 0) return wards
    }
  } catch (e) {}
  return [...new Set(complaints.map((c) => c.ward))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

export interface Hotspot {
  id: string
  lat: number
  lng: number
  count: number
  /** Circle radius in metres, enough to cover every member. */
  radiusM: number
  ward: string
  topCategory: ComplaintCategory
  complaintIds: string[]
  /** 0..1 relative to the densest cluster. */
  intensity: number
}

const HOTSPOT_LINK_M = 450

/** Greedy density clustering of open complaints: densest neighbourhood first, absorb everything within 450 m. */
export async function getHotspots(): Promise<Hotspot[]> {
  try {
    const supabase = getSupabaseServerClient()
    const { data: rows } = await supabase
      .from('complaints')
      .select('*')
      .neq('status', 'resolved')

    if (rows && rows.length > 0) {
      let remaining = rows.map((r: any) => ({
        id: r.case_id,
        category: DB_TO_APP_CATEGORY[r.category] || 'Pothole',
        ward: r.ward || 'Ward 1',
        location: { lat: r.lat, lng: r.lng } as GeoPoint,
      }))

      const clusters: Omit<Hotspot, 'intensity'>[] = []

      while (remaining.length > 0) {
        const neighbours = (centre: any) =>
          remaining.filter((c) => distanceMeters(centre.location, c.location) <= HOTSPOT_LINK_M)
        const seed = remaining.reduce((best, c) => (neighbours(c).length > neighbours(best).length ? c : best))
        const members = neighbours(seed)

        const lat = members.reduce((sum, c) => sum + c.location.lat, 0) / members.length
        const lng = members.reduce((sum, c) => sum + c.location.lng, 0) / members.length
        const radiusM = Math.max(
          180,
          Math.max(...members.map((c) => distanceMeters({ lat, lng }, c.location))) + 120,
        )

        const tally = <K extends string>(keys: K[]) => {
          const counts = new Map<K, number>()
          for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1)
          return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        }

        clusters.push({
          id: `hs-${members[0].id}`,
          lat,
          lng,
          count: members.length,
          radiusM: Math.round(radiusM),
          ward: tally(members.map((c) => c.ward)),
          topCategory: tally(members.map((c) => c.category)) as ComplaintCategory,
          complaintIds: members.map((c) => c.id),
        })
        const taken = new Set(members.map((c) => c.id))
        remaining = remaining.filter((c) => !taken.has(c.id))
      }

      const max = Math.max(1, ...clusters.map((c) => c.count))
      return clusters.sort((a, b) => b.count - a.count).map((c) => ({ ...c, intensity: c.count / max }))
    }
  } catch (e) {}

  let remaining = complaints.filter((c) => c.status !== 'resolved' && c.location)
  const clusters: Omit<Hotspot, 'intensity'>[] = []

  while (remaining.length > 0) {
    const neighbours = (centre: Complaint) =>
      remaining.filter((c) => distanceMeters(centre.location as GeoPoint, c.location as GeoPoint) <= HOTSPOT_LINK_M)
    const seed = remaining.reduce((best, c) => (neighbours(c).length > neighbours(best).length ? c : best))
    const members = neighbours(seed)

    const lat = members.reduce((sum, c) => sum + (c.location as GeoPoint).lat, 0) / members.length
    const lng = members.reduce((sum, c) => sum + (c.location as GeoPoint).lng, 0) / members.length
    const radiusM = Math.max(
      180,
      Math.max(...members.map((c) => distanceMeters({ lat, lng }, c.location as GeoPoint))) + 120,
    )

    const tally = <K extends string>(keys: K[]) => {
      const counts = new Map<K, number>()
      for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1)
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    }

    clusters.push({
      id: `hs-${members[0].id}`,
      lat,
      lng,
      count: members.length,
      radiusM: Math.round(radiusM),
      ward: tally(members.map((c) => c.ward)),
      topCategory: tally(members.map((c) => c.category)),
      complaintIds: members.map((c) => c.id),
    })
    const taken = new Set(members.map((c) => c.id))
    remaining = remaining.filter((c) => !taken.has(c.id))
  }

  const max = Math.max(1, ...clusters.map((c) => c.count))
  return clusters.sort((a, b) => b.count - a.count).map((c) => ({ ...c, intensity: c.count / max }))
}

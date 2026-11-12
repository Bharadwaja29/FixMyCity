export type ComplaintStatus = 'received' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'

export type ComplaintCategory =
  | 'Pothole'
  | 'Streetlight'
  | 'Garbage'
  | 'Drainage'
  | 'Water Supply'
  | 'Encroachment'

export interface Complaint {
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

const seedComplaints: Complaint[] = [
  {
    id: 'FMC-2026-004217',
    category: 'Pothole',
    title: 'Deep pothole near Tilka Manjhi Chowk',
    ward: 'Ward 14',
    city: 'Bhagalpur',
    status: 'in_progress',
    filedOn: '2026-11-02',
    department: 'Public Works Department',
  },
  {
    id: 'FMC-2026-004198',
    category: 'Streetlight',
    title: 'Three streetlights dark on Station Road',
    ward: 'Ward 9',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-11-04',
    resolvedOn: '2026-11-07',
    department: 'Electrical Division',
    daysToResolve: 3,
  },
  {
    id: 'FMC-2026-004176',
    category: 'Garbage',
    title: 'Overflowing bin outside Khalifabag market',
    ward: 'Ward 21',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-11-05',
    resolvedOn: '2026-11-06',
    department: 'Sanitation Department',
    daysToResolve: 1,
  },
  {
    id: 'FMC-2026-004151',
    category: 'Drainage',
    title: 'Blocked drain causing waterlogging, Adampur',
    ward: 'Ward 17',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-10-29',
    resolvedOn: '2026-11-05',
    department: 'Drainage Cell',
    daysToResolve: 7,
  },
  {
    id: 'FMC-2026-004133',
    category: 'Water Supply',
    title: 'Leaking main pipeline, Nathnagar',
    ward: 'Ward 3',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-10-31',
    resolvedOn: '2026-11-04',
    department: 'Water Works',
    daysToResolve: 4,
  },
  {
    id: 'FMC-2026-004120',
    category: 'Encroachment',
    title: 'Footpath blocked by stalls, Sujaganj',
    ward: 'Ward 11',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-10-25',
    resolvedOn: '2026-11-03',
    department: 'Enforcement Wing',
    daysToResolve: 9,
  },
  {
    id: 'FMC-2026-004102',
    category: 'Pothole',
    title: 'Broken road surface near Barari Ghat',
    ward: 'Ward 2',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-10-27',
    resolvedOn: '2026-11-02',
    department: 'Public Works Department',
    daysToResolve: 6,
  },
  {
    id: 'FMC-2026-004088',
    category: 'Streetlight',
    title: 'Flickering pole light, Mirjanhat',
    ward: 'Ward 25',
    city: 'Bhagalpur',
    status: 'resolved',
    filedOn: '2026-10-30',
    resolvedOn: '2026-11-01',
    department: 'Electrical Division',
    daysToResolve: 2,
  },
  {
    id: 'FMC-2026-004209',
    category: 'Garbage',
    title: 'Garbage dumped on vacant plot behind bus stand',
    ward: 'Ward 12',
    city: 'Bhagalpur',
    status: 'assigned',
    filedOn: '2026-11-08',
    department: 'Sanitation Department',
    description: 'Household waste piling up for a week, stray dogs scattering it on the road.',
  },
  {
    id: 'FMC-2026-004203',
    category: 'Streetlight',
    title: 'Streetlight not working near Govt School',
    ward: 'Ward 12',
    city: 'Bhagalpur',
    status: 'received',
    filedOn: '2026-11-10',
    department: 'Electrical Division',
    description: 'Pole light outside the school gate has been off for four nights.',
  },
]

/** Default map centre: Bhagalpur, Bihar. */
export const DEFAULT_CENTER: GeoPoint = { lat: 25.2445, lng: 86.9718 }

const SEED_LOCATIONS: Record<string, GeoPoint> = {
  'FMC-2026-004217': { lat: 25.2452, lng: 86.9725 },
  'FMC-2026-004209': { lat: 25.2431, lng: 86.9706 },
  'FMC-2026-004203': { lat: 25.2461, lng: 86.9731 },
  'FMC-2026-004198': { lat: 25.2513, lng: 86.9889 },
  'FMC-2026-004176': { lat: 25.2398, lng: 86.9812 },
  'FMC-2026-004151': { lat: 25.2367, lng: 86.9644 },
  'FMC-2026-004133': { lat: 25.2271, lng: 86.9461 },
  'FMC-2026-004120': { lat: 25.2489, lng: 86.9826 },
  'FMC-2026-004102': { lat: 25.2602, lng: 86.9931 },
  'FMC-2026-004088': { lat: 25.2335, lng: 86.9998 },
}

/*
 * Kept on globalThis so the mock store survives dev-server module reloads and is
 * shared between the server action that writes it and the /track page that reads it.
 */
const globalStore = globalThis as unknown as { __fmcComplaints?: Complaint[] }
const complaints: Complaint[] = (globalStore.__fmcComplaints ??= seedComplaints.map((c) => ({
  ...c,
  location: SEED_LOCATIONS[c.id],
  supporters: 0,
})))

const stats: PlatformStats = {
  filed: 4217,
  resolved: 3368,
  medianDaysToResolve: 4,
}

const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getPlatformStats(): Promise<PlatformStats> {
  await delay()
  return stats
}

export async function getRecentlyResolved(limit = 8): Promise<Complaint[]> {
  await delay()
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
  await delay()
  const normalized = normalizeComplaintId(id)
  return complaints.find((c) => c.id === normalized) ?? null
}

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  received: 'Received',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
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
]

export const DEPARTMENT_BY_CATEGORY: Record<ComplaintCategory, string> = {
  Pothole: 'Public Works Department',
  Streetlight: 'Electrical Division',
  Garbage: 'Sanitation Department',
  Drainage: 'Drainage Cell',
  'Water Supply': 'Water Works',
  Encroachment: 'Enforcement Wing',
}

export interface ImageMeta {
  name: string
  size: number
  type: string
}

export interface ClassScore {
  label: ComplaintCategory
  score: number
}

export interface ImageAnalysis {
  issueType: ComplaintCategory
  topClasses: ClassScore[]
  severity: Severity
  department: string
  /** GPS read from the photo's EXIF block, or null when absent. */
  photoGps: GeoPoint | null
  modelVersion: string
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
}

export interface NewComplaintInput {
  category: ComplaintCategory
  description: string
  landmark: string
  location: GeoPoint
  severity: Severity
  photoCount: number
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

/** Mock image classifier. Deterministic per file so repeated uploads give stable results. */
export async function analyzeImage(images: ImageMeta[]): Promise<ImageAnalysis> {
  await delay(900)
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

/** Mock duplicate detector: weighted blend of distance, category (image proxy) and text overlap. */
export async function checkDuplicates(query: DuplicateQuery): Promise<DuplicateMatch[]> {
  await delay(600)
  const queryTokens = tokenize(`${query.description} ${query.landmark} ${query.category}`)

  return complaints
    .filter((c) => c.location && c.status !== 'resolved' && c.status !== 'rejected')
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
  await delay(700)
  const errors = validateComplaintInput(input)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const landmark = input.landmark.trim()
  const wardMatch = landmark.match(/ward\s*(\d+)/i)
  const complaint: Complaint = {
    id: nextComplaintId(),
    category: input.category,
    title: `${input.category} — ${landmark}`,
    ward: wardMatch ? `Ward ${wardMatch[1]}` : 'Ward pending',
    city: 'Bhagalpur',
    status: 'received',
    filedOn: new Date().toISOString().slice(0, 10),
    department: DEPARTMENT_BY_CATEGORY[input.category],
    location: { lat: input.location.lat, lng: input.location.lng },
    landmark,
    description: input.description.trim(),
    severity: input.severity,
    supporters: 0,
  }
  complaints.unshift(complaint)
  return { ok: true, complaint }
}

export async function supportComplaint(id: string): Promise<Complaint | null> {
  await delay(300)
  const target = complaints.find((c) => c.id === normalizeComplaintId(id))
  if (!target) return null
  target.supporters = (target.supporters ?? 0) + 1
  return target
}

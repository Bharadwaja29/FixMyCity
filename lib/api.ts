import { buildSeedComplaints, receivedEvent } from './seed'
import {
  CATEGORY_LEDGER_DEPARTMENT,
  DEPARTMENT_BY_CATEGORY,
  LEDGER_DEPARTMENTS,
  PHOTO_BY_CATEGORY,
  type LedgerDepartment,
} from './departments'

export { DEPARTMENT_BY_CATEGORY, LEDGER_DEPARTMENTS, CATEGORY_LEDGER_DEPARTMENT }
export type { LedgerDepartment }

export type ComplaintStatus = 'received' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'

export type ComplaintCategory =
  | 'Pothole'
  | 'Streetlight'
  | 'Garbage'
  | 'Drainage'
  | 'Water Supply'
  | 'Encroachment'
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
  const filedAt = new Date().toISOString()
  const complaint: Complaint = {
    filedAt,
    history: [receivedEvent(input.category, filedAt)],
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
  const complaint = complaints.find((c) => c.id === normalizeComplaintId(id))
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

  const events = flow.map((step) => complaint.history.find((e) => e.status === step.status))
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
    photoUrl: PHOTO_BY_CATEGORY[complaint.category],
    ledgerDepartment: CATEGORY_LEDGER_DEPARTMENT[complaint.category],
    analysis: {
      category: complaint.category,
      confidence: 0.74 + (hashString(complaint.id) % 25) / 100,
      severity: complaint.severity ?? 'Medium',
      department: complaint.department,
      modelVersion: 'civic-vit-mock-0.3',
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

export const SORT_KEYS = ['id', 'category', 'ward', 'daysOpen', 'status', 'severity'] as const
export type SortKey = (typeof SORT_KEYS)[number]

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
    .map(
      (c): ComplaintRow => ({
        id: c.id,
        title: c.title,
        category: c.category,
        department: CATEGORY_LEDGER_DEPARTMENT[c.category],
        ward: c.ward,
        status: c.status,
        severity: c.severity ?? 'Medium',
        daysOpen: daysOpenOf(c, now),
        filedOn: c.filedOn,
        location: c.location,
      }),
    )

  const sort = filters.sort ?? 'id'
  const dir = filters.dir ?? (sort === 'id' || sort === 'daysOpen' || sort === 'severity' ? 'desc' : 'asc')
  const factor = dir === 'asc' ? 1 : -1
  const compare = (a: ComplaintRow, b: ComplaintRow): number => {
    switch (sort) {
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

export async function listWards(): Promise<string[]> {
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

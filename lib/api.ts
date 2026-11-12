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
}

export interface PlatformStats {
  filed: number
  resolved: number
  medianDaysToResolve: number
}

const complaints: Complaint[] = [
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
]

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

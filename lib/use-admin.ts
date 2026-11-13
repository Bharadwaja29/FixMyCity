'use client'

import useSWR from 'swr'
import type { AdminComplaintDetailResult, ComplaintStatus } from '@/lib/api'

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export function useAdminComplaintDetail(id: string | null) {
  return useSWR<AdminComplaintDetailResult>(
    id ? `/api/admin/complaints/${id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )
}

export async function mutateComplaintStatus(
  id: string,
  data: {
    status: ComplaintStatus
    note?: string
    officerName?: string
    officerRole?: string
  },
) {
  const res = await fetch(`/api/admin/complaints/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to update status')
  }
  return res.json()
}

export async function mutateMergeDuplicate(
  sourceId: string,
  targetId: string,
  officerNote?: string,
) {
  const res = await fetch('/api/admin/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, targetId, officerNote }),
  })
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to merge duplicate')
  }
  return res.json()
}

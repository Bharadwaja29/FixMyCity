'use client'

import useSWR from 'swr'
import type { ComplaintFilters, ComplaintRow, Hotspot, LedgerStats } from '@/lib/api'

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export function useLedgerStats() {
  return useSWR<LedgerStats>('/api/ledger/stats', fetcher)
}

export function useWards() {
  return useSWR<string[]>('/api/ledger/wards', fetcher)
}

export function useHotspots() {
  return useSWR<Hotspot[]>('/api/ledger/hotspots', fetcher)
}

export function useComplaints(filters: ComplaintFilters = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  const query = params.toString()
  return useSWR<ComplaintRow[]>(`/api/ledger/complaints${query ? `?${query}` : ''}`, fetcher, {
    keepPreviousData: true,
  })
}

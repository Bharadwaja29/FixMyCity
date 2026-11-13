'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { COMPLAINT_STATUSES, STATUS_LABEL, type ComplaintStatus } from '@/lib/api'
import { useComplaints, useHotspots } from '@/lib/use-ledger'
import { cn } from '@/lib/utils'

const LedgerMap = dynamic(() => import('./ledger-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

const SWATCH: Record<ComplaintStatus, string> = {
  received: 'border-2 border-primary bg-card',
  assigned: 'border border-primary bg-primary',
  in_progress: 'border border-primary bg-saffron',
  resolved: 'border border-card bg-success',
  escalated: 'border border-card bg-destructive',
}

type Mode = 'status' | 'hotspots'

export function MapPanel() {
  const [mode, setMode] = useState<Mode>('status')
  const { data: rows, error: rowsError } = useComplaints({})
  const { data: hotspots, error: hotspotsError } = useHotspots()

  if (rowsError || hotspotsError) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-md border border-destructive bg-card p-5 text-sm">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden="true" />
        <p>The map data could not be loaded. Refresh the page to try again.</p>
      </div>
    )
  }

  const clusters = (hotspots ?? []).filter((h) => h.count >= 2).sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label="Map view" className="inline-flex rounded-md border border-input bg-card p-0.5">
          {(
            [
              ['status', 'By status'],
              ['hotspots', 'Hotspots'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'h-9 rounded-sm px-4 text-sm font-semibold',
                mode === value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'status' ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Legend">
            {COMPLAINT_STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className={cn('size-3.5 rounded-full', SWATCH[s])} aria-hidden="true" />
                {STATUS_LABEL[s]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Shaded circles group open complaints within about 450 m. The number is the complaint count.
          </p>
        )}
      </div>

      <div
        role="region"
        aria-label={
          mode === 'status'
            ? 'Map of all complaints coloured by status. The All complaints tab lists the same data as a table.'
            : 'Map of complaint hotspots. The list below gives the same clusters as text.'
        }
        className="h-[60vh] min-h-[360px] overflow-hidden rounded-md border border-border bg-muted md:h-[560px]"
      >
        {rows && hotspots ? <LedgerMap rows={rows} hotspots={hotspots} mode={mode} /> : <Skeleton className="h-full w-full rounded-none" />}
      </div>

      {mode === 'hotspots' && (
        <section aria-labelledby="hotspot-list" className="flex flex-col gap-3">
          <h3 id="hotspot-list" className="font-serif text-xl font-semibold">
            Densest clusters of open complaints
          </h3>
          {clusters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clusters of two or more complaints right now.</p>
          ) : (
            <ol className="grid gap-3 md:grid-cols-2">
              {clusters.slice(0, 6).map((h) => (
                <li key={h.id} className="flex items-start gap-4 rounded-md border border-border bg-card p-4">
                  <span className="font-serif text-3xl font-semibold tabular-nums leading-none text-destructive">
                    {h.count}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1 text-sm">
                    <p className="font-semibold">
                      {h.ward}, mostly {h.topCategory.toLowerCase()}
                    </p>
                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {h.complaintIds.slice(0, 3).map((id) => (
                        <Link key={id} href={`/track?id=${id}`} className="tabular-nums underline underline-offset-2">
                          {id}
                        </Link>
                      ))}
                      {h.complaintIds.length > 3 && (
                        <span className="text-muted-foreground">+{h.complaintIds.length - 3} more</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}

'use client'

import { TriangleAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { DepartmentStat } from '@/lib/api'
import { useLedgerStats } from '@/lib/use-ledger'
import { Sparkline } from './sparkline'

function trendSummary(values: number[]): string {
  const first = values[0]
  const last = values[values.length - 1]
  if (last > first) return `Backlog up from ${first} to ${last} over 8 weeks`
  if (last < first) return `Backlog down from ${first} to ${last} over 8 weeks`
  return `Backlog steady at ${last} over 8 weeks`
}

function DepartmentCard({ stat }: { stat: DepartmentStat }) {
  return (
    <li className="flex flex-col gap-5 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-serif text-xl font-semibold">{stat.department}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{stat.officialNames.join(' / ')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-4xl font-semibold tabular-nums leading-none">
            {stat.resolvedPct}
            <span className="text-2xl">%</span>
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">
              {stat.resolved} of {stat.total}
            </span>{' '}
            resolved
          </p>
        </div>
        <div
          role="meter"
          aria-label={`${stat.department} resolution rate`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stat.resolvedPct}
          className="h-2 w-full overflow-hidden rounded-sm border border-border bg-muted"
        >
          <div className="h-full bg-success" style={{ width: `${stat.resolvedPct}%` }} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-dashed border-border pt-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Avg. days to resolve</dt>
          <dd className="font-semibold tabular-nums">{stat.avgDaysToResolve ?? 'Not yet'}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Open</dt>
          <dd className="font-semibold tabular-nums">{stat.open}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Escalated</dt>
          <dd className={stat.escalated > 0 ? 'font-semibold tabular-nums text-destructive' : 'font-semibold tabular-nums'}>
            {stat.escalated}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-snug text-muted-foreground">
          <span className="block font-semibold text-foreground">Open backlog, 8 weeks</span>
          {trendSummary(stat.backlogTrend)}
        </p>
        <Sparkline
          values={stat.backlogTrend}
          label={`Open complaints by week, oldest to newest: ${stat.backlogTrend.join(', ')}`}
        />
      </div>
    </li>
  )
}

function PanelSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  )
}

export function DepartmentsPanel() {
  const { data, error, isLoading } = useLedgerStats()

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading department figures</span>
        <PanelSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-md border border-destructive bg-card p-5 text-sm">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden="true" />
        <p>The department figures could not be loaded. Refresh the page to try again.</p>
      </div>
    )
  }

  const { totals, departments } = data
  const summary = [
    ['Complaints filed', totals.total],
    ['Resolved', totals.resolved],
    ['Still open', totals.open],
    ['Avg. days to resolve', totals.avgDaysToResolve ?? 0],
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-md border border-border bg-card px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="font-serif text-3xl font-semibold tabular-nums leading-none">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((stat) => (
          <DepartmentCard key={stat.department} stat={stat} />
        ))}
      </ul>
    </div>
  )
}

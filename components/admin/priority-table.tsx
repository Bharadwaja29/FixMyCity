'use client'

import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Clock, Inbox, Users } from 'lucide-react'
import { StatusBadge } from '@/components/case/status-badge'
import { SeverityChip } from '@/components/report/severity-chip'
import { Skeleton } from '@/components/ui/skeleton'
import type { ComplaintRow, SortKey } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PriorityTableProps {
  complaints: ComplaintRow[]
  loading: boolean
  selectedId: string | null
  onSelectComplaint: (id: string) => void
  sort: SortKey
  dir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onResetFilters?: () => void
}

function PriorityBar({ score }: { score: number }) {
  const isHigh = score >= 75
  const isMedium = score >= 45 && score < 75

  return (
    <div className="flex w-28 items-center gap-2">
      <div
        role="meter"
        aria-label={`AI Priority score ${score} out of 100`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-16 overflow-hidden rounded-sm bg-muted"
      >
        <div
          className={cn(
            'h-full transition-all',
            isHigh && 'bg-destructive',
            isMedium && 'bg-saffron',
            !isHigh && !isMedium && 'bg-primary/70',
          )}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>
      <span
        className={cn(
          'w-7 font-mono text-xs font-semibold tabular-nums',
          isHigh && 'text-destructive font-bold',
          isMedium && 'text-saffron-foreground',
          !isHigh && !isMedium && 'text-muted-foreground',
        )}
      >
        {score}
      </span>
    </div>
  )
}

function SlaCountdown({ row }: { row: ComplaintRow }) {
  const { daysOpen, sla, status } = row
  const isClosed = status === 'resolved'

  if (isClosed) {
    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="font-medium tabular-nums text-muted-foreground">{daysOpen}d to resolve</span>
        <span className="text-[11px] text-muted-foreground/80">{sla.label}</span>
      </div>
    )
  }

  if (sla.isOverdue) {
    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="font-medium tabular-nums">{daysOpen}d open</span>
        <span
          className="inline-flex w-fit items-center gap-1 rounded-sm border border-destructive bg-destructive/15 px-1.5 py-0.5 text-[11px] font-semibold text-destructive"
          title={`SLA target was ${sla.targetDays} days. Case is ${Math.abs(sla.daysRemaining)} days overdue.`}
        >
          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
          {sla.label}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className="font-medium tabular-nums">{daysOpen}d open</span>
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
          sla.daysRemaining === 0
            ? 'border-saffron bg-saffron/15 text-foreground font-semibold'
            : 'border-border bg-muted/60 text-muted-foreground',
        )}
      >
        <Clock className="size-3 shrink-0" aria-hidden="true" />
        {sla.label}
      </span>
    </div>
  )
}

export function PriorityTable({
  complaints,
  loading,
  selectedId,
  onSelectComplaint,
  sort,
  dir,
  onSort,
  onResetFilters,
}: PriorityTableProps) {
  const renderSortIcon = (columnKey: SortKey) => {
    if (sort !== columnKey) {
      return <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
    }
    return dir === 'asc' ? (
      <ArrowUp className="size-3 text-foreground" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3 text-foreground" aria-hidden="true" />
    )
  }

  return (
    <div className="relative overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-left text-sm" aria-label="Complaints Queue">
        <thead className="border-b border-border bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              <button
                type="button"
                onClick={() => onSort('id')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>ID</span>
                {renderSortIcon('id')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3">
              <button
                type="button"
                onClick={() => onSort('category')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>Category</span>
                {renderSortIcon('category')}
              </button>
            </th>
            <th scope="col" className="px-3 py-3">
              <button
                type="button"
                onClick={() => onSort('severity')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>Severity</span>
                {renderSortIcon('severity')}
              </button>
            </th>
            <th scope="col" className="px-3 py-3">
              <button
                type="button"
                onClick={() => onSort('priorityScore')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>AI Priority</span>
                {renderSortIcon('priorityScore')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3">
              <button
                type="button"
                onClick={() => onSort('daysOpen')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>Days Open & SLA</span>
                {renderSortIcon('daysOpen')}
              </button>
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              <button
                type="button"
                onClick={() => onSort('supporters')}
                className="ml-auto flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>Supporters</span>
                {renderSortIcon('supporters')}
              </button>
            </th>
            <th scope="col" className="px-4 py-3">
              <button
                type="button"
                onClick={() => onSort('status')}
                className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>Status</span>
                {renderSortIcon('status')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Skeleton className="ml-auto h-4 w-10" />
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton className="h-5 w-20" />
                </td>
              </tr>
            ))}

          {!loading && complaints.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-14 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary">
                    <Inbox className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold">No complaints found</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    There are no cases matching the selected department, category, status, or severity filters.
                  </p>
                  {onResetFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-2 inline-flex h-8 items-center rounded-md border border-input bg-card px-3 text-xs font-semibold hover:bg-secondary"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            complaints.map((c) => {
              const isSelected = selectedId === c.id
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectComplaint(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectComplaint(c.id)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Open case file for ${c.id}: ${c.title}`}
                  className={cn(
                    'group cursor-pointer transition-colors hover:bg-secondary/70 focus-visible:bg-secondary focus-visible:outline-none',
                    isSelected && 'bg-secondary font-medium border-l-4 border-l-saffron',
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold tabular-nums text-foreground group-hover:text-primary">
                    <span className="underline decoration-muted-foreground/40 underline-offset-4 group-hover:decoration-foreground">
                      {c.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="block font-medium leading-snug">{c.category}</span>
                    <span className="text-[11px] text-muted-foreground">{c.ward}</span>
                  </td>
                  <td className="px-3 py-3">
                    <SeverityChip severity={c.severity} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBar score={c.priorityScore} />
                  </td>
                  <td className="px-4 py-3">
                    <SlaCountdown row={c} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
                      <Users className="size-3 shrink-0" aria-hidden="true" />
                      {c.supporters}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

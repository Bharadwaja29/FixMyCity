'use client'

import { useId } from 'react'
import { Filter, RotateCcw } from 'lucide-react'
import {
  CATEGORIES,
  COMPLAINT_STATUSES,
  LEDGER_DEPARTMENTS,
  SEVERITIES_LIST,
  STATUS_LABEL,
  type ComplaintCategory,
  type ComplaintFilters,
  type ComplaintStatus,
  type LedgerDepartment,
  type Severity,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminFilterSidebarProps {
  filters: ComplaintFilters
  onChange: (updated: Partial<ComplaintFilters>) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
  className?: string
}

export function AdminFilterSidebar({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  className,
}: AdminFilterSidebarProps) {
  const deptId = useId()
  const catId = useId()
  const statusId = useId()
  const sevId = useId()

  const hasActiveFilters = Boolean(
    filters.department || filters.category || filters.status || filters.severity || filters.q,
  )

  return (
    <aside
      aria-label="Filter complaints"
      className={cn(
        'flex flex-col gap-5 rounded-md border border-border bg-card p-5 text-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
        <div className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Filter className="size-4 text-saffron" strokeWidth={2} aria-hidden="true" />
          <span>Queue Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing:</span>
        <span className="font-semibold tabular-nums text-foreground">
          {filteredCount} of {totalCount} cases
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Department Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={deptId}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Department
          </label>
          <select
            id={deptId}
            value={filters.department ?? ''}
            onChange={(e) =>
              onChange({
                department: (e.target.value as LedgerDepartment) || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
          >
            <option value="">All Departments</option>
            {LEDGER_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={catId}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Category
          </label>
          <select
            id={catId}
            value={filters.category ?? ''}
            onChange={(e) =>
              onChange({
                category: (e.target.value as ComplaintCategory) || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={statusId}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Status
          </label>
          <select
            id={statusId}
            value={filters.status ?? ''}
            onChange={(e) =>
              onChange({
                status: (e.target.value as ComplaintStatus) || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
          >
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {STATUS_LABEL[st]}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={sevId}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Severity
          </label>
          <select
            id={sevId}
            value={filters.severity ?? ''}
            onChange={(e) =>
              onChange({
                severity: (e.target.value as Severity) || undefined,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
          >
            <option value="">All Severities</option>
            {SEVERITIES_LIST.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-border pt-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sorted primarily by AI priority score (0–100) combining severity, overdue SLA, and resident support.
        </p>
      </div>
    </aside>
  )
}

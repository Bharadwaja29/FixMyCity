'use client'

import { useDeferredValue, useId, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX, TriangleAlert } from 'lucide-react'
import { StatusBadge } from '@/components/case/status-badge'
import { SeverityChip } from '@/components/report/severity-chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CATEGORIES,
  COMPLAINT_STATUSES,
  LEDGER_DEPARTMENTS,
  SEVERITIES_LIST,
  STATUS_LABEL,
  type ComplaintFilters,
  type ComplaintRow,
  type SortKey,
} from '@/lib/api'
import { useComplaints, useWards } from '@/lib/use-ledger'
import { cn } from '@/lib/utils'

type Dir = 'asc' | 'desc'
const DEFAULT_DIR: Record<SortKey, Dir> = {
  id: 'desc',
  category: 'asc',
  ward: 'asc',
  daysOpen: 'desc',
  status: 'asc',
  severity: 'desc',
}

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'id', label: 'Case ID' },
  { key: 'category', label: 'Category' },
  { key: 'ward', label: 'Ward' },
  { key: 'daysOpen', label: 'Days open', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'severity', label: 'Severity' },
]

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  allLabel: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function SortHeader({
  column,
  sort,
  dir,
  onSort,
}: {
  column: (typeof COLUMNS)[number]
  sort: SortKey
  dir: Dir
  onSort: (key: SortKey) => void
}) {
  const active = sort === column.key
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-0 text-xs font-semibold uppercase tracking-widest', column.numeric && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          'inline-flex h-11 items-center gap-1.5 uppercase tracking-widest',
          column.numeric && 'flex-row-reverse',
        )}
      >
        {column.label}
        <Icon className={cn('size-3.5', !active && 'text-muted-foreground')} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </th>
  )
}

function IdLink({ id }: { id: string }) {
  return (
    <Link href={`/track?id=${id}`} className="font-semibold tabular-nums underline underline-offset-4 hover:text-saffron-ink">
      {id}
    </Link>
  )
}

function ResultsTable({ rows, sort, dir, onSort }: { rows: ComplaintRow[]; sort: SortKey; dir: Dir; onSort: (k: SortKey) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border border-border bg-card md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <caption className="sr-only">Complaints in the public ledger. Column headers are buttons that sort the table.</caption>
          <thead className="border-b border-border bg-muted">
            <tr>
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} column={c} sort={sort} dir={dir} onSort={onSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-muted/60">
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <IdLink id={r.id} />
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="block font-medium">{r.category}</span>
                  <span className="block max-w-64 truncate text-xs text-muted-foreground">{r.title}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">{r.ward}</td>
                <td className="px-3 py-3 text-right align-top tabular-nums">{r.daysOpen}</td>
                <td className="px-3 py-3 align-top">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-3 align-top">
                  <SeverityChip severity={r.severity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <IdLink id={r.id} />
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm leading-snug">
              <span className="font-medium">{r.category}</span>
              <span className="text-muted-foreground"> · {r.title}</span>
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{r.ward}</span>
              <span>
                <span className="font-semibold tabular-nums text-foreground">{r.daysOpen}</span> days{' '}
                {r.status === 'resolved' ? 'to resolve' : 'open'}
              </span>
              <SeverityChip severity={r.severity} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function TableSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">Loading complaints</span>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} aria-hidden="true" className="h-14" />
      ))}
    </div>
  )
}

export function ComplaintsPanel() {
  const searchId = useId()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<Omit<ComplaintFilters, 'q' | 'sort' | 'dir'>>({})
  const [sort, setSort] = useState<SortKey>('id')
  const [dir, setDir] = useState<Dir>('desc')
  const deferredQ = useDeferredValue(q)

  const { data: wards } = useWards()
  const { data: rows, error, isLoading } = useComplaints({ ...filters, q: deferredQ.trim() || undefined, sort, dir })
  const { data: all } = useComplaints({})

  const hasFilters = Boolean(q || Object.values(filters).some(Boolean))
  const setFilter = <K extends keyof typeof filters>(key: K, value: string) =>
    setFilters((f) => ({ ...f, [key]: value || undefined }))

  function onSort(key: SortKey) {
    if (key === sort) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setDir(DEFAULT_DIR[key])
    }
  }

  function clear() {
    setQ('')
    setFilters({})
  }

  return (
    <div className="flex flex-col gap-5">
      <form role="search" aria-label="Filter complaints" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Search
          </label>
          <Input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Case ID, landmark or description"
            maxLength={80}
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <FilterSelect
            label="Department"
            allLabel="All departments"
            value={filters.department ?? ''}
            onChange={(v) => setFilter('department', v)}
            options={LEDGER_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          />
          <FilterSelect
            label="Category"
            allLabel="All categories"
            value={filters.category ?? ''}
            onChange={(v) => setFilter('category', v)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            label="Status"
            allLabel="Any status"
            value={filters.status ?? ''}
            onChange={(v) => setFilter('status', v)}
            options={COMPLAINT_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <FilterSelect
            label="Severity"
            allLabel="Any severity"
            value={filters.severity ?? ''}
            onChange={(v) => setFilter('severity', v)}
            options={SEVERITIES_LIST.map((s) => ({ value: s, label: s }))}
          />
          <FilterSelect
            label="Ward"
            allLabel="All wards"
            value={filters.ward ?? ''}
            onChange={(v) => setFilter('ward', v)}
            options={(wards ?? []).map((w) => ({ value: w, label: w }))}
          />
        </div>
      </form>

      <div className="flex min-h-9 items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {rows && all && (
            <>
              Showing <span className="font-semibold tabular-nums text-foreground">{rows.length}</span> of{' '}
              <span className="tabular-nums">{all.length}</span> complaints
            </>
          )}
        </p>
        {hasFilters && (
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-destructive bg-card p-5 text-sm">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden="true" />
          <p>The complaint register could not be loaded. Refresh the page to try again.</p>
        </div>
      ) : isLoading || !rows ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-input bg-card p-6">
          <SearchX className="size-6" strokeWidth={1.5} aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-serif text-xl font-semibold">No complaints match these filters</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Try a different ward or status, or remove a filter to widen the register.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={clear}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ResultsTable rows={rows} sort={sort} dir={dir} onSort={onSort} />
      )}
    </div>
  )
}

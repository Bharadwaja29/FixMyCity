import { CircleCheck } from 'lucide-react'
import type { Complaint } from '@/lib/api'

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00+05:30`) : new Date(iso)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d)
}

function TickerItem({ c, hidden = false }: { c: Complaint; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 px-6 text-sm motion-reduce:aria-hidden:hidden">
      <CircleCheck className="size-4 text-success" strokeWidth={1.5} aria-hidden="true" />
      <span className="font-mono font-semibold tabular-nums">{c.id}</span>
      <span className="text-muted-foreground">{c.category}</span>
      <span>{c.ward}</span>
      <span className="text-muted-foreground">
        resolved {formatDate(c.resolvedOn)} · <span className="tabular-nums">{c.daysToResolve}</span>{' '}
        {c.daysToResolve === 1 ? 'day' : 'days'}
      </span>
    </li>
  )
}

export function ResolvedTicker({ items }: { items: Complaint[] }) {
  return (
    <section aria-labelledby="ticker-label" className="border-y border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <h2
          id="ticker-label"
          className="flex shrink-0 items-center gap-2 border-r border-border px-4 py-3 font-sans text-xs font-semibold uppercase tracking-widest md:px-6"
        >
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Recently resolved
        </h2>
        <div className="group relative flex-1 overflow-hidden py-3 motion-reduce:overflow-x-auto">
          <ul className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
            {items.map((c) => (
              <TickerItem key={c.id} c={c} />
            ))}
            {items.map((c) => (
              <TickerItem key={`dup-${c.id}`} c={c} hidden />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

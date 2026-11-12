import { FileSearch } from 'lucide-react'
import { getComplaintById, STATUS_LABEL, type ComplaintStatus } from '@/lib/api'
import { TrackForm } from '@/components/landing/track-form'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Track a complaint' }

const STATUS_STYLE: Record<ComplaintStatus, string> = {
  received: 'border-input text-foreground',
  assigned: 'border-input text-foreground',
  in_progress: 'border-saffron bg-saffron/15 text-foreground',
  resolved: 'border-success bg-success text-success-foreground',
  rejected: 'border-destructive bg-destructive text-destructive-foreground',
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const complaint = id ? await getComplaintById(id) : null

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-6 md:py-20">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Track</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Look up a case</h1>
      </div>

      <TrackForm defaultValue={id ?? ''} />

      {id && !complaint && (
        <div role="status" className="flex items-start gap-3 rounded-md border border-border bg-card p-5">
          <FileSearch className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            No case found for <span className="font-mono font-semibold tabular-nums">{id.toUpperCase()}</span>. Check
            the number on your SMS receipt and try again.
          </p>
        </div>
      )}

      {complaint && (
        <article aria-labelledby="case-title" className="rounded-md border border-border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border px-5 py-4">
            <span className="font-mono text-sm font-semibold tabular-nums">{complaint.id}</span>
            <span
              className={cn('rounded-sm border px-2 py-0.5 text-xs font-semibold', STATUS_STYLE[complaint.status])}
            >
              {STATUS_LABEL[complaint.status]}
            </span>
          </header>
          <div className="flex flex-col gap-4 px-5 py-6">
            <h2 id="case-title" className="font-serif text-2xl font-semibold">
              {complaint.title}
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ['Category', complaint.category],
                ['Ward', `${complaint.ward}, ${complaint.city}`],
                ['Department', complaint.department],
                ['Filed on', complaint.filedOn],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      )}
    </section>
  )
}

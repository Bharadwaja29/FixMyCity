import { FileSearch } from 'lucide-react'
import { getComplaintDetail } from '@/lib/api'
import { TrackForm } from '@/components/landing/track-form'
import { CaseFile } from '@/components/track/case-file'

export const metadata = { title: 'Track a complaint' }

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const detail = id ? await getComplaintDetail(id) : null

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Track</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          {detail ? 'Your case file' : 'Look up a case'}
        </h1>
      </div>

      <div className="max-w-3xl">
        <TrackForm defaultValue={id ?? ''} />
      </div>

      {id && !detail && (
        <div role="status" className="flex max-w-3xl items-start gap-3 rounded-md border border-border bg-card p-5">
          <FileSearch className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            No case found for{' '}
            <span className="font-semibold tabular-nums">{id.slice(0, 32).toUpperCase()}</span>. Check the number on your
            receipt and try again.
          </p>
        </div>
      )}

      {detail && <CaseFile detail={detail} />}
    </section>
  )
}

import { Files, Loader2 } from 'lucide-react'
import { STATUS_LABEL, type DuplicateMatch } from '@/lib/api'
import { CaseCard } from './case-card'

interface Props {
  matches: DuplicateMatch[]
  onSupport: (id: string) => void
  onDifferent: () => void
  supportingId: string | null
}

const pct = (n: number) => Math.round(n * 100)

export function SimilarReports({ matches, onSupport, onDifferent, supportingId }: Props) {
  return (
    <CaseCard
      label="Similar reports found"
      icon={Files}
      labelledBy="similar-title"
      footer={<span>Supporting an existing case raises its priority instead of creating a duplicate.</span>}
    >
      <div className="flex flex-col gap-2">
        <h3 id="similar-title" className="font-serif text-2xl font-semibold">
          {matches.length === 1 ? 'This may already be on record' : `${matches.length} similar cases on record nearby`}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If one of these is the same problem, add your support. Otherwise continue with your own report.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {matches.map((m) => (
          <li key={m.complaint.id} className="flex flex-col gap-4 rounded-md border border-border p-4 md:flex-row">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-sm font-semibold tabular-nums">{m.complaint.id}</span>
                <span className="rounded-sm border border-input px-2 py-0.5 text-xs font-semibold">
                  {STATUS_LABEL[m.complaint.status]}
                </span>
              </div>
              <p className="font-serif text-lg font-semibold leading-snug">{m.complaint.title}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {m.complaint.category} · {Math.round(m.distanceM)} m away · Filed {m.complaint.filedOn}
              </p>
              <dl className="mt-1 grid grid-cols-3 gap-3">
                {(
                  [
                    ['Location', m.breakdown.location],
                    ['Image', m.breakdown.image],
                    ['Text', m.breakdown.text],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="flex flex-col gap-1">
                      <span className="font-mono text-sm tabular-nums">{pct(v)}%</span>
                      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-sm bg-muted">
                        <span className="block h-full bg-primary" style={{ width: `${pct(v)}%` }} />
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-row items-center justify-between gap-3 border-t border-dashed border-border pt-3 md:w-44 md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <p className="flex flex-col">
                <span className="font-serif text-3xl font-semibold tabular-nums">{pct(m.overall)}%</span>
                <span className="text-xs text-muted-foreground">overall similarity</span>
              </p>
              <button
                type="button"
                onClick={() => onSupport(m.complaint.id)}
                disabled={supportingId !== null}
                aria-label={`Support report ${m.complaint.id}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
              >
                {supportingId === m.complaint.id && (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                )}
                Support this report
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDifferent}
          disabled={supportingId !== null}
          className="inline-flex h-10 items-center rounded-md border border-foreground bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-70"
        >
          Mine is different
        </button>
      </div>
    </CaseCard>
  )
}

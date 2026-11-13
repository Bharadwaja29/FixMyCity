import { ScanSearch } from 'lucide-react'
import { SeverityChip } from '@/components/report/severity-chip'
import type { CaseAnalysis } from '@/lib/api'

export function AnalysisCard({ analysis }: { analysis: CaseAnalysis }) {
  const pct = Math.round(analysis.confidence * 100)
  return (
    <section aria-labelledby="analysis-heading" className="rounded-md border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-dashed border-border px-5 py-3">
        <ScanSearch className="size-4" strokeWidth={1.5} aria-hidden="true" />
        <h2 id="analysis-heading" className="font-serif text-lg font-semibold">
          AI Analysis
        </h2>
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-5 py-5 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detected category</dt>
          <dd className="font-semibold">{analysis.category}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Severity</dt>
          <dd>
            <SeverityChip severity={analysis.severity} />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confidence</dt>
          <dd className="flex flex-col gap-1.5">
            <span className="font-semibold tabular-nums">{pct}%</span>
            <span
              role="meter"
              aria-label="Classification confidence"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="block h-1.5 w-full max-w-32 overflow-hidden rounded-sm border border-border bg-muted"
            >
              <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assigned department</dt>
          <dd className="font-semibold">{analysis.department}</dd>
        </div>
      </dl>
      <p className="border-t border-dashed border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        Automated suggestion from the photo and description. A ward officer confirms the category before work is
        dispatched. Model {analysis.modelVersion}.
      </p>
    </section>
  )
}

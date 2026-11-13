import { Loader2, ScanSearch } from 'lucide-react'
import { CATEGORIES, DEPARTMENT_BY_CATEGORY, type ComplaintCategory, type ImageAnalysis } from '@/lib/api'
import { CaseCard, FieldError, fieldClass } from './case-card'
import { SeverityChip } from './severity-chip'
import { cn } from '@/lib/utils'

interface Props {
  analysis: ImageAnalysis | null
  analyzing: boolean
  error: string | null
  category: ComplaintCategory | ''
  onCategoryChange: (c: ComplaintCategory) => void
  categoryError?: string
}

export function AiAnalysisPanel({ analysis, analyzing, error, category, onCategoryChange, categoryError }: Props) {
  const overridden = analysis && category && category !== analysis.issueType

  return (
    <CaseCard
      label="AI Analysis"
      icon={ScanSearch}
      footer={
        analysis ? (
          <span>Model {analysis.modelVersion} · Suggestion only, you have the final say</span>
        ) : (
          <span>Runs automatically after upload</span>
        )
      }
    >
      <div aria-live="polite" className="flex flex-col gap-5">
        {analyzing && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} aria-hidden="true" />
            Analysing photo…
          </p>
        )}
        {!analyzing && error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {!analyzing && !analysis && !error && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upload a photo and we will suggest an issue type, severity and the department that should handle it.
          </p>
        )}

        {!analyzing && analysis && (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Detected issue</p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-serif text-2xl font-semibold">{analysis.issueType}</p>
                <SeverityChip severity={analysis.severity} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p id="confidence-title" className="text-xs uppercase tracking-widest text-muted-foreground">
                Confidence, top 3
              </p>
              <ul aria-labelledby="confidence-title" className="flex flex-col gap-2">
                {analysis.topClasses.map((c, i) => {
                  const pct = Math.round(c.score * 100)
                  return (
                    <li key={c.label} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                      <span className={cn(i === 0 && 'font-semibold')}>{c.label}</span>
                      <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-sm bg-muted">
                        <span
                          className={cn('block h-full', i === 0 ? 'bg-primary' : 'bg-input')}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-right font-mono tabular-nums">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <dl className="grid gap-1 text-sm">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Suggested department</dt>
              <dd>{category ? DEPARTMENT_BY_CATEGORY[category] : analysis.department}</dd>
            </dl>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-semibold">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ComplaintCategory)}
          aria-invalid={categoryError ? true : undefined}
          aria-describedby={cn(categoryError && 'category-error', 'category-hint') || undefined}
          className={cn(fieldClass, 'h-11')}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p id="category-hint" className="text-xs text-muted-foreground">
          {overridden ? 'You changed the AI suggestion. Your choice will be used.' : 'Change this if the AI got it wrong.'}
        </p>
        <FieldError id="category-error" message={categoryError} />
      </div>
    </CaseCard>
  )
}

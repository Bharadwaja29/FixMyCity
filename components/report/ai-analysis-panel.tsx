import { Loader2, ScanSearch } from 'lucide-react'
import {
  CATEGORIES,
  CATEGORY_LEDGER_DEPARTMENT,
  DEPARTMENT_BY_CATEGORY,
  type ComplaintCategory,
  type ImageAnalysis,
} from '@/lib/api'
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
  const isLive = analysis?.source === 'live'
  const isNoIssue = Boolean(
    analysis?.isNoIssue ||
    analysis?.issueType === 'No issue detected' ||
    analysis?.topClasses?.[0]?.label === 'No issue detected'
  )
  const sourceLabel = isLive ? 'Live model' : 'Demo fallback'

  return (
    <CaseCard
      label={
        <span className="flex items-center gap-2">
          <span>AI Analysis</span>
          {analysis && (
            <span
              className={cn(
                'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide',
                isLive
                  ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : 'border-border bg-muted text-muted-foreground',
              )}
            >
              {sourceLabel}
            </span>
          )}
        </span>
      }
      icon={ScanSearch}
      footer={
        analysis ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Model {analysis.modelVersion} · Suggestion only, you have the final say</span>
            <span className={cn('font-semibold', isLive ? 'text-foreground' : 'text-muted-foreground')}>
              {sourceLabel}
            </span>
          </div>
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Detected issue</p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide',
                    isLive
                      ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {sourceLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-serif text-2xl font-semibold">{analysis.issueType}</p>
                {!isNoIssue && <SeverityChip severity={analysis.severity} />}
              </div>
            </div>

            {isNoIssue && (
              <p role="status" className="rounded-md border border-border bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
                No civic issue was detected in this photo. Please choose a category manually below.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <p id="confidence-title" className="text-xs uppercase tracking-widest text-muted-foreground">
                Confidence, top 3
              </p>
              <ul aria-labelledby="confidence-title" className="flex flex-col gap-2">
                {analysis.topClasses.map((c, i) => {
                  const pct = Math.round(c.score * 100)
                  return (
                    <li key={c.label} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-sm">
                      <span className={cn('truncate', i === 0 && 'font-semibold')} title={c.label}>
                        {c.label}
                      </span>
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
              <dd>
                {analysis.department
                  ? analysis.department
                  : category
                  ? (CATEGORY_LEDGER_DEPARTMENT[category] || DEPARTMENT_BY_CATEGORY[category])
                  : '—'}
              </dd>
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
          {isNoIssue
            ? 'Please choose a category from the list above.'
            : overridden
            ? 'You changed the AI suggestion. Your choice will be used.'
            : 'Change this if the AI got it wrong.'}
        </p>
        <FieldError id="category-error" message={categoryError} />
      </div>
    </CaseCard>
  )
}

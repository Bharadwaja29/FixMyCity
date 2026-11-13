import { FileCheck2 } from 'lucide-react'
import { DEPARTMENT_BY_CATEGORY, type ComplaintCategory, type GeoPoint, type ImageAnalysis } from '@/lib/api'
import { CaseCard, FieldError } from './case-card'
import { SeverityChip } from './severity-chip'
import { LocationCheck } from './location-check'
import type { Photo } from './evidence-step'

interface Props {
  photos: Photo[]
  analysis: ImageAnalysis | null
  category: ComplaintCategory | ''
  description: string
  landmark: string
  location: GeoPoint
  onEdit: (step: 1 | 2) => void
  confirmed: boolean
  onConfirmedChange: (v: boolean) => void
  errors: Record<string, string>
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-dashed border-border py-3 last:border-b-0 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground sm:pt-0.5">{term}</dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  )
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm text-sm font-semibold underline underline-offset-4 hover:no-underline"
    >
      Edit<span className="sr-only"> {label}</span>
    </button>
  )
}

export function ReviewStep(props: Props) {
  const { photos, analysis, category, description, landmark, location, onEdit, errors } = props
  const overridden = analysis && category && analysis.issueType !== category

  return (
    <CaseCard label="Draft case file · Not yet filed" icon={FileCheck2} labelledBy="review-title">
      <h3 id="review-title" className="sr-only">
        Summary of your complaint
      </h3>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-lg font-semibold">Evidence</p>
          <EditButton onClick={() => onEdit(1)} label="evidence" />
        </div>
        <ul aria-label="Attached photos" className="flex gap-2 pt-2">
          {photos.map((p, i) => (
            <li key={p.id} className="size-20 overflow-hidden rounded-md border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
            </li>
          ))}
        </ul>
        <dl className="mt-2">
          <Row term="Category">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{category}</span>
              {analysis && <SeverityChip severity={analysis.severity} />}
              <span className="text-xs text-muted-foreground">{overridden ? 'Changed by you' : 'AI suggested'}</span>
            </span>
          </Row>
          <Row term="Department">{category ? DEPARTMENT_BY_CATEGORY[category] : '—'}</Row>
          <Row term="Description">
            <span className="whitespace-pre-line">{description}</span>
          </Row>
        </dl>
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-lg font-semibold">Location</p>
          <EditButton onClick={() => onEdit(2)} label="location" />
        </div>
        <dl>
          <Row term="Landmark">{landmark}</Row>
          <Row term="Coordinates">
            <span className="font-mono tabular-nums">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
          </Row>
        </dl>
        <div className="pt-2">
          <LocationCheck analysis={analysis} location={location} />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            id="confirm"
            checked={props.confirmed}
            onChange={(e) => props.onConfirmedChange(e.target.checked)}
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? 'confirm-error' : undefined}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <span>
            I confirm this report is accurate to the best of my knowledge. The photos and location will be visible on
            the Public Ledger; my phone number will not.
          </span>
        </label>
        <FieldError id="confirm-error" message={errors.confirm} />
      </div>
    </CaseCard>
  )
}

import Image from 'next/image'
import { MapPin, Users } from 'lucide-react'
import type { ComplaintDetail } from '@/lib/api'
import { StatusStamp } from '@/components/case/status-badge'
import { AnalysisCard } from './analysis-card'
import { CaseMap } from './case-map'
import { CopyLinkButton } from './copy-link-button'
import { Timeline } from './timeline'

export function CaseFile({ detail }: { detail: ComplaintDetail }) {
  const { complaint, analysis, timeline, daysOpen, closed, photoUrl, supporters } = detail

  return (
    <article aria-labelledby="case-id" className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Case file</p>
            <h2
              id="case-id"
              className="font-serif text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl md:text-5xl"
            >
              {complaint.id}
            </h2>
          </div>
          <StatusStamp status={complaint.status} className="mt-1" />
        </div>

        <p className="text-pretty font-serif text-xl leading-snug md:text-2xl">{complaint.title}</p>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-dashed border-border pt-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {closed ? 'Days to resolve' : 'Days open'}
              </dt>
              <dd className="font-serif text-3xl font-semibold tabular-nums leading-none">{daysOpen}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filed on</dt>
              <dd className="tabular-nums">{complaint.filedOn}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ward</dt>
              <dd>
                {complaint.ward}, {complaint.city}
              </dd>
            </div>
          </dl>
          <CopyLinkButton id={complaint.id} />
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <figure className="order-1 overflow-hidden rounded-md border border-border bg-card">
            <div className="relative aspect-[4/3] w-full bg-muted">
              <Image
                src={photoUrl}
                alt={`Photo submitted with the complaint: ${complaint.title}`}
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <figcaption className="border-t border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
              Evidence photo, as filed by the citizen
            </figcaption>
          </figure>

          <div className="order-3">
            <AnalysisCard analysis={analysis} />
          </div>

          <section aria-labelledby="location-heading" className="order-4 overflow-hidden rounded-md border border-border bg-card">
            <h2 id="location-heading" className="sr-only">
              Location and support
            </h2>
            {complaint.location ? (
              <CaseMap
                position={complaint.location}
                label={`Map showing the complaint location${complaint.landmark ? `, ${complaint.landmark}` : ''}`}
              />
            ) : (
              <p className="border-b border-border bg-muted px-5 py-6 text-sm text-muted-foreground">
                No map pin was recorded for this complaint.
              </p>
            )}
            <div className="flex flex-col gap-3 px-5 py-4 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="leading-relaxed">{complaint.landmark || 'No landmark given'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="font-semibold tabular-nums">{supporters}</span>{' '}
                  {supporters === 1 ? 'resident supports' : 'residents support'} this report
                </span>
              </p>
            </div>
          </section>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <section aria-labelledby="timeline-heading" className="order-2 flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="timeline-heading" className="font-serif text-2xl font-semibold">
                Tracking
              </h2>
              <p className="text-xs text-muted-foreground">Handled by {detail.ledgerDepartment}</p>
            </div>
            <Timeline steps={timeline} />
          </section>
        </div>
      </div>
    </article>
  )
}

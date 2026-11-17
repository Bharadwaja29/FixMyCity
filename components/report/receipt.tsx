'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Copy, Check, ArrowRight } from 'lucide-react'
import type { Complaint } from '@/lib/api'
import { CATEGORY_LEDGER_DEPARTMENT } from '@/lib/departments'
import { formatKolkataDate, toKolkataDateString } from '@/lib/format'

interface Props {
  complaint: Complaint
  kind: 'filed' | 'supported'
  onReset: () => void
  headingRef: React.Ref<HTMLHeadingElement>
}

export function Receipt({ complaint, kind, onReset, headingRef }: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const trackPath = `/track?id=${encodeURIComponent(complaint.id)}`
  const today = toKolkataDateString(new Date())

  async function copyLink() {
    const url = `${window.location.origin}${trackPath}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  // Database department name (e.g. "Roads" instead of "Public Works Department")
  const departmentName = CATEGORY_LEDGER_DEPARTMENT[complaint.category] || complaint.department

  const rows: [string, string][] = [
    ['Case no.', complaint.id],
    ['Date filed', formatKolkataDate(kind === 'filed' ? (complaint.filedAt || complaint.filedOn) : today)],
    ['Department', departmentName],
    ['Category', complaint.category],
    ['Location', complaint.landmark ?? `${complaint.ward}, ${complaint.city}`],
  ]
  if (kind === 'supported') {
    rows[1] = ['Date supported', formatKolkataDate(today)]
    rows.push(['Supporters', String(complaint.supporters ?? 1)])
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <article
        aria-labelledby="receipt-title"
        className="relative overflow-hidden rounded-md border border-border bg-card"
      >
        <div className="flex flex-col gap-1 border-b border-dashed border-border px-6 py-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            FixMyCity · Acknowledgement receipt
          </p>
          <h2 id="receipt-title" ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold">
            {kind === 'filed' ? 'Your complaint is on record.' : 'Your support has been recorded.'}
          </h2>
        </div>

        <dl className="flex flex-col px-6 py-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-dotted border-border py-2.5 last:border-b-0">
              <dt className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
              <dd
                className={
                  k === 'Case no.'
                    ? 'text-right font-mono text-lg font-semibold tabular-nums'
                    : 'text-right text-sm tabular-nums'
                }
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-16 -rotate-12 rounded-sm border-[3px] border-double border-destructive px-3 py-1 font-serif text-2xl font-bold uppercase tracking-[0.2em] text-destructive opacity-85 sm:right-8 sm:text-3xl"
        >
          {kind === 'filed' ? 'Received' : 'Supported'}
        </div>
        <p className="sr-only">Stamped {kind === 'filed' ? 'received' : 'supported'}.</p>

        <p className="border-t border-border bg-muted px-6 py-3 font-mono text-xs leading-relaxed">
          Keep this case number to track your complaint.
        </p>
      </article>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-foreground bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          {copyState === 'copied' ? (
            <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Copy className="size-4" strokeWidth={1.5} aria-hidden="true" />
          )}
          {copyState === 'copied' ? 'Link copied' : 'Copy tracking link'}
        </button>
        <Link
          href={trackPath}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Track this complaint
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {copyState === 'failed' && (
          <>
            Could not access the clipboard. Copy this link:{' '}
            <span className="select-all font-mono tabular-nums text-foreground">{trackPath}</span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="self-start rounded-sm text-sm font-semibold underline underline-offset-4 hover:no-underline"
      >
        File another complaint
      </button>
    </div>
  )
}

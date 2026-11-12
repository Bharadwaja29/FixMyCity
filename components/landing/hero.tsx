'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'
import { TrackForm } from './track-form'

export function Hero() {
  const { t } = useLocale()
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pb-14 pt-12 md:px-6 md:pb-20 md:pt-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-px w-8 bg-saffron" aria-hidden="true" />
            {t('heroKicker')}
          </p>
          <h1
            id="hero-title"
            className="text-balance font-serif text-5xl font-semibold leading-none tracking-tight md:text-7xl"
          >
            <span className="block">{t('heroTitleA')}</span>
            <span className="block">{t('heroTitleB')}</span>
            <span className="block italic font-normal">{t('heroTitleC')}</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">{t('heroBody')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/report"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-saffron px-5 text-sm font-semibold text-saffron-foreground transition-colors hover:bg-saffron/90"
            >
              {t('reportCta')}
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href="/ledger"
              className="inline-flex h-11 items-center justify-center rounded-md px-2 text-sm font-semibold underline decoration-border decoration-2 underline-offset-4 hover:decoration-foreground"
            >
              {t('ledgerCta')}
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-end lg:col-span-5">
          <TrackForm />
        </div>
      </div>
    </section>
  )
}

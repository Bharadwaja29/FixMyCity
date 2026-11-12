'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DictionaryKey, Locale } from '@/lib/i18n'
import { useLocale } from './locale-provider'
import { Wordmark } from './wordmark'

const NAV: { href: string; key: DictionaryKey }[] = [
  { href: '/report', key: 'navReport' },
  { href: '/track', key: 'navTrack' },
  { href: '/ledger', key: 'navLedger' },
]

function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const options: { value: Locale; label: string; name: string }[] = [
    { value: 'en', label: 'EN', name: 'English' },
    { value: 'hi', label: 'हिं', name: 'हिन्दी' },
  ]
  return (
    <div role="group" aria-label="Language" className="flex rounded-md border border-input bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          aria-pressed={locale === o.value}
          aria-label={o.name}
          onClick={() => setLocale(o.value)}
          className={cn(
            'min-w-9 rounded-sm px-2 py-1 text-xs font-semibold transition-colors',
            locale === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SiteHeader() {
  const { t } = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        {t('skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary',
                  active ? 'text-foreground underline decoration-saffron decoration-2 underline-offset-8' : 'text-muted-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            )
          })}
          <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          <Link
            href="/officer"
            className="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t('navOfficer')}
          </Link>
          <div className="ml-3">
            <LanguageToggle />
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md border border-input bg-card"
          >
            {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-border bg-card md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {[...NAV, { href: '/officer', key: 'navOfficer' as DictionaryKey }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className="block rounded-md px-2 py-3 text-base font-medium hover:bg-secondary"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

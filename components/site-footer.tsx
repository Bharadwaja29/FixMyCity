import Link from 'next/link'
import { Phone, ShieldCheck } from 'lucide-react'
import { PinCheckMark } from './wordmark'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <PinCheckMark className="h-6 w-auto text-foreground" />
            <span className="font-serif text-lg font-semibold">FixMyCity</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A public register of civic complaints, open for anyone to read.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Privacy
          </h2>
          <p className="text-sm leading-relaxed">
            Your name and phone number are never published. The public ledger shows only the case number, category,
            ward and status.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Phone className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Helpline
          </h2>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold tabular-nums">1800-XXX-XXXX</span>
            <span className="text-muted-foreground"> · Mon–Sat, 9:00–18:00 (placeholder)</span>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href="/ledger" className="underline underline-offset-4 hover:text-muted-foreground">
              Public Ledger
            </Link>
            <Link href="/officer" className="underline underline-offset-4 hover:text-muted-foreground">
              Officer Login
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground md:px-6">
          Built as a student project at IIIT Bhagalpur. Not an official government service.
        </p>
      </div>
    </footer>
  )
}

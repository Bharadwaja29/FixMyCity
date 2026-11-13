import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Officer Desk' }

export default function OfficerPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card">
        <ShieldCheck className="size-7 text-saffron" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Officer Portal</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Department Triage & Desk</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ward officers and department heads triage complaints, review AI priority scoring, deduplicate incidents, and update field resolution progress.
        </p>
      </div>
      <Link
        href="/admin"
        className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <span>Open Officer Console</span>
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}

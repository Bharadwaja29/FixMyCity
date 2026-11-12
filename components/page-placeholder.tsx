import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PagePlaceholder({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{kicker}</p>
      <h1 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-8 rounded-md border border-dashed border-input bg-card p-6 text-sm text-muted-foreground">
        This section of the shell is not built yet.
      </div>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Back to home
      </Link>
    </section>
  )
}

import { LedgerTabs } from '@/components/ledger/ledger-tabs'
import { parseLedgerTab } from '@/components/ledger/tabs'

export const metadata = {
  title: 'Public Ledger',
  description: 'Every complaint filed on FixMyCity, with department performance, status and location, open to all.',
}

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const initialTab = parseLedgerTab(tab)

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Public Ledger</p>
        <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Every complaint, on the record
        </h1>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Filed complaints, response times and escalations for each department. Nothing here is hidden behind a login.
        </p>
      </div>
      <LedgerTabs initialTab={initialTab} />
    </section>
  )
}

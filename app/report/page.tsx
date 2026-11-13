import { ReportFlow } from '@/components/report/report-flow'

export const metadata = {
  title: 'Report a problem',
  description: 'File a civic complaint with photos and a map pin. Get a case number you can track publicly.',
}

export default function ReportPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Report</p>
        <h1 className="text-balance font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          File a new complaint
        </h1>
      </div>
      <ReportFlow />
    </section>
  )
}

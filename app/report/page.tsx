import { PagePlaceholder } from '@/components/page-placeholder'

export const metadata = { title: 'Report a problem' }

export default function ReportPage() {
  return (
    <PagePlaceholder
      kicker="Report"
      title="File a new complaint"
      body="Photo, location and category — then you'll receive a case number by SMS."
    />
  )
}

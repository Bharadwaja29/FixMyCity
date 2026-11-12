import { PagePlaceholder } from '@/components/page-placeholder'

export const metadata = { title: 'Public Ledger' }

export default function LedgerPage() {
  return (
    <PagePlaceholder
      kicker="Public Ledger"
      title="Every complaint, in the open"
      body="A searchable register of all cases by ward, category, department and status."
    />
  )
}

import { PagePlaceholder } from '@/components/page-placeholder'

export const metadata = { title: 'Officer Login' }

export default function OfficerPage() {
  return (
    <PagePlaceholder
      kicker="Officer Login"
      title="Department sign-in"
      body="Ward officers will sign in here to accept, update and close assigned cases."
    />
  )
}

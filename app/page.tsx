import { getPlatformStats, getRecentlyResolved } from '@/lib/api'
import { Hero } from '@/components/landing/hero'
import { ResolvedTicker } from '@/components/landing/resolved-ticker'
import { HowItWorks } from '@/components/landing/how-it-works'
import { StatCounters } from '@/components/landing/stat-counters'

export default async function HomePage() {
  const [resolved, stats] = await Promise.all([getRecentlyResolved(), getPlatformStats()])
  return (
    <>
      <Hero />
      <ResolvedTicker items={resolved} />
      <HowItWorks />
      <StatCounters stats={stats} />
    </>
  )
}

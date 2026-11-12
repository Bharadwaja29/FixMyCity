'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { GeoPoint } from '@/lib/api'

const PinMap = dynamic(() => import('./pin-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

export function CaseMap({ position, label }: { position: GeoPoint; label: string }) {
  return (
    <div role="img" aria-label={label} className="h-56 w-full overflow-hidden border-b border-border md:h-64">
      <PinMap position={position} />
    </div>
  )
}

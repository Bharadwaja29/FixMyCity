import { CircleCheck, CircleHelp, TriangleAlert } from 'lucide-react'
import { distanceMeters, type GeoPoint, type ImageAnalysis } from '@/lib/api'
import { cn } from '@/lib/utils'

export const GPS_MATCH_RADIUS_M = 250

export type LocationCheckResult =
  | { kind: 'match'; distance: number }
  | { kind: 'mismatch'; distance: number }
  | { kind: 'none' }

export function getLocationCheck(analysis: ImageAnalysis | null, location: GeoPoint): LocationCheckResult {
  if (!analysis?.photoGps) return { kind: 'none' }
  const distance = distanceMeters(analysis.photoGps, location)
  return distance <= GPS_MATCH_RADIUS_M ? { kind: 'match', distance } : { kind: 'mismatch', distance }
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

export function LocationCheck({ analysis, location }: { analysis: ImageAnalysis | null; location: GeoPoint }) {
  const result = getLocationCheck(analysis, location)

  const content = {
    match: {
      icon: CircleCheck,
      title: 'Photo GPS matches the pin',
      body: result.kind !== 'none' ? `Taken ${formatDistance(result.distance)} from the pin.` : '',
      tone: 'border-success text-foreground',
      iconTone: 'text-success',
    },
    mismatch: {
      icon: TriangleAlert,
      title: 'Photo GPS does not match the pin',
      body:
        result.kind !== 'none'
          ? `The photo was taken about ${formatDistance(result.distance)} away. Check the pin before submitting.`
          : '',
      tone: 'border-saffron bg-saffron/10 text-foreground',
      iconTone: 'text-foreground',
    },
    none: {
      icon: CircleHelp,
      title: 'No GPS data in photo',
      body: 'We could not verify the location from the photo. The pin will be used as-is.',
      tone: 'border-input text-foreground',
      iconTone: 'text-muted-foreground',
    },
  }[result.kind]

  const Icon = content.icon
  return (
    <div role="status" className={cn('flex items-start gap-3 rounded-md border px-4 py-3', content.tone)}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', content.iconTone)} strokeWidth={1.5} aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Location check · </span>
          {content.title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{content.body}</p>
      </div>
    </div>
  )
}

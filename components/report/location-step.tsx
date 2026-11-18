'use client'

import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
import type L from 'leaflet'
import { Crosshair, LocateFixed, MapPin } from 'lucide-react'
import type { GeoPoint, ImageAnalysis } from '@/lib/api'
import { CaseCard, FieldError, fieldClass } from './case-card'
import { LocationCheck } from './location-check'
import { cn } from '@/lib/utils'

const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Loading map…</div>
  ),
})

interface Props {
  location: GeoPoint
  onLocationChange: (p: GeoPoint) => void
  landmark: string
  onLandmarkChange: (v: string) => void
  analysis: ImageAnalysis | null
  errors: Record<string, string>
}

export function LocationStep({ location, onLocationChange, landmark, onLandmarkChange, analysis, errors }: Props) {
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [geoStatus, setGeoStatus] = useState<{ kind: 'idle' | 'locating' | 'error' | 'ok'; message?: string }>({
    kind: 'idle',
  })
  const mapRef = useRef<L.Map | null>(null)
  const onMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setGeoStatus({ kind: 'error', message: 'Your browser does not support location access. Click the map or drag the pin instead.' })
      return
    }
    setGeoStatus({ kind: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setRecenterSignal((n) => n + 1)
        setGeoStatus({ kind: 'ok', message: `Pin moved to your location (±${Math.round(pos.coords.accuracy)} m).` })
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Click anywhere on the map or drag the pin instead.'
            : 'Could not get your location. Click anywhere on the map or drag the pin instead.'
        setGeoStatus({ kind: 'error', message })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function placeAtCentre() {
    const c = mapRef.current?.getCenter()
    if (c) onLocationChange({ lat: c.lat, lng: c.lng })
  }

  return (
    <CaseCard
      label="Exhibit B · Location"
      icon={MapPin}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Pin coordinates · {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </span>
          <span className="text-muted-foreground">Click map or drag pin to position</span>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={geoStatus.kind === 'locating'}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
          >
            <LocateFixed className="size-4" strokeWidth={1.5} aria-hidden="true" />
            {geoStatus.kind === 'locating' ? 'Locating…' : 'Use my current location'}
          </button>
          <button
            type="button"
            onClick={placeAtCentre}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-semibold hover:bg-muted"
          >
            <Crosshair className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Place pin at map centre
          </button>
        </div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          Coordinates: <span className="font-semibold text-foreground">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
        </div>
      </div>
      <p
        role="status"
        className={cn(
          'min-h-5 text-sm',
          geoStatus.kind === 'error' ? 'font-medium text-destructive' : 'text-muted-foreground',
        )}
      >
        {geoStatus.message ?? 'Click anywhere on the map to place the pin, drag it to adjust, or use “Use my current location”.'}
      </p>

      <div
        role="region"
        aria-label="Map. Focus and use arrow keys to pan, plus and minus to zoom, or click anywhere to position the pin."
        className="relative isolate z-0 h-72 overflow-hidden rounded-md border border-border sm:h-96"
      >
        <LocationMap
          position={location}
          onChange={onLocationChange}
          recenterSignal={recenterSignal}
          onMapReady={onMapReady}
        />
      </div>
      <FieldError id="location-error" message={errors.location} />

      <div className="flex flex-col gap-2">
        <label htmlFor="landmark" className="text-sm font-semibold">
          Landmark / nearby place / address <span className="text-destructive">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          id="landmark"
          type="text"
          required
          maxLength={200}
          autoComplete="street-address"
          value={landmark}
          onChange={(e) => onLandmarkChange(e.target.value)}
          placeholder="Near Govt School, Ward 12"
          aria-invalid={errors.landmark ? true : undefined}
          aria-describedby={cn('landmark-hint', errors.landmark && 'landmark-error')}
          className={cn(fieldClass, 'h-11')}
        />
        <p id="landmark-hint" className="text-xs text-muted-foreground">
          Helps the field team find the exact spot. Include the ward number if you know it.
        </p>
        <FieldError id="landmark-error" message={errors.landmark} />
      </div>

      <LocationCheck analysis={analysis} location={location} />
    </CaseCard>
  )
}

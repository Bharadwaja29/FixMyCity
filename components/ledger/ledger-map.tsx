'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { STATUS_LABEL, type ComplaintRow, type ComplaintStatus, type Hotspot } from '@/lib/api'

const BHAGALPUR: [number, number] = [25.2425, 86.9842]

export const STATUS_DOT: Record<ComplaintStatus, L.CircleMarkerOptions> = {
  received: { color: '#0B1F3A', fillColor: '#FFFDF8', fillOpacity: 1, weight: 2.5, radius: 8 },
  assigned: { color: '#FFFDF8', fillColor: '#0B1F3A', fillOpacity: 1, weight: 1.5, radius: 8 },
  in_progress: { color: '#0B1F3A', fillColor: '#E08A00', fillOpacity: 1, weight: 1.5, radius: 8 },
  resolved: { color: '#FFFDF8', fillColor: '#1E7A4F', fillOpacity: 1, weight: 1.5, radius: 8 },
  escalated: { color: '#FFFDF8', fillColor: '#B3261E', fillOpacity: 1, weight: 1.5, radius: 10 },
}

function FitToData({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
  }, [map, points])
  return null
}

export default function LedgerMap({
  rows,
  hotspots,
  mode,
}: {
  rows: ComplaintRow[]
  hotspots: Hotspot[]
  mode: 'status' | 'hotspots'
}) {
  const located = rows.filter((r) => r.location)
  const points = located.map((r) => [r.location!.lat, r.location!.lng] as [number, number])

  return (
    <MapContainer center={BHAGALPUR} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToData points={points} />

      {mode === 'status' &&
        located.map((r) => (
          <CircleMarker key={r.id} center={[r.location!.lat, r.location!.lng]} pathOptions={STATUS_DOT[r.status]} radius={STATUS_DOT[r.status].radius}>
            <Tooltip direction="top" offset={[0, -6]}>
              {r.id}
            </Tooltip>
            <Popup>
              <div className="flex min-w-44 flex-col gap-1 text-sm">
                <a href={`/track?id=${r.id}`} className="font-semibold tabular-nums underline underline-offset-2">
                  {r.id}
                </a>
                <span>{r.title}</span>
                <span className="text-xs">
                  {r.category}, {r.ward}
                </span>
                <span className="text-xs font-semibold">{STATUS_LABEL[r.status]}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {mode === 'hotspots' && (
        <>
          {located
            .filter((r) => r.status !== 'resolved')
            .map((r) => (
              <CircleMarker
                key={r.id}
                center={[r.location!.lat, r.location!.lng]}
                radius={3}
                interactive={false}
                pathOptions={{ color: '#0B1F3A', fillColor: '#0B1F3A', fillOpacity: 0.7, weight: 0 }}
              />
            ))}
          {hotspots
            .filter((h) => h.count >= 2)
            .map((h) => (
              <Circle
                key={h.id}
                center={[h.lat, h.lng]}
                radius={h.radiusM}
                pathOptions={{
                  color: '#B3261E',
                  fillColor: '#B3261E',
                  fillOpacity: 0.12 + 0.3 * h.intensity,
                  weight: 1.5,
                }}
              >
                <Tooltip permanent direction="center" className="fmc-hotspot-label">
                  {h.count}
                </Tooltip>
              </Circle>
            ))}
        </>
      )}
    </MapContainer>
  )
}

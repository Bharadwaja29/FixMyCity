'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { GeoPoint } from '@/lib/api'

const pinIcon = L.divIcon({
  className: 'fmc-map-pin',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#0B1F3A" stroke="#FFFDF8" stroke-width="2"/><circle cx="16" cy="15.5" r="5" fill="#E08A00"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
})

/** Read-only: every interaction handler is off, the pin is not draggable or focusable. */
export default function PinMap({ position }: { position: GeoPoint }) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={16}
      className="h-full w-full"
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[position.lat, position.lng]} icon={pinIcon} interactive={false} keyboard={false} />
    </MapContainer>
  )
}

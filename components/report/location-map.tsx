'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { GeoPoint } from '@/lib/api'

const pinIcon = L.divIcon({
  className: 'fmc-map-pin',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#0B1F3A" stroke="#FFFDF8" stroke-width="2"/><circle cx="16" cy="15.5" r="5" fill="#E08A00"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
})

interface Props {
  position: GeoPoint
  onChange: (p: GeoPoint) => void
  recenterSignal: number
  onMapReady: (map: L.Map) => void
}

function MapBridge({ position, onChange, recenterSignal, onMapReady }: Props) {
  const map = useMap()

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (recenterSignal > 0) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16))
    // Recentre only on explicit request, not on every drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal])

  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function LocationMap(props: Props) {
  const { position, onChange } = props
  const handlers = useMemo(
    () => ({
      dragend(e: L.LeafletEvent) {
        const ll = (e.target as L.Marker).getLatLng()
        onChange({ lat: ll.lat, lng: ll.lng })
      },
    }),
    [onChange],
  )

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={pinIcon}
        draggable
        eventHandlers={handlers}
        title="Complaint location pin. Drag to adjust."
        alt="Complaint location pin"
      />
      <MapBridge {...props} />
    </MapContainer>
  )
}

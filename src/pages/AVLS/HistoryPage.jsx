import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { useData } from '../../context/DataContext'
import { formatTime } from '../../utils/helpers'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FitBounds({ pings }) {
  const map = useMap()
  if (pings.length > 0) {
    const bounds = pings.map((p) => [p.lat, p.lng])
    map.fitBounds(bounds, { padding: [40, 40] })
  }
  return null
}

export default function HistoryPage() {
  const [searchParams] = useSearchParams()
  const { vehicles, gpsPings } = useData()

  const [selectedVehicleId, setSelectedVehicleId] = useState(
    searchParams.get('vehicle') ?? ''
  )
  const [selectedDate, setSelectedDate] = useState('2026-05-31')
  const [viewedVehicleId, setViewedVehicleId] = useState(
    searchParams.get('vehicle') ?? ''
  )
  const [viewedDate, setViewedDate] = useState('2026-05-31')
  const [hasQueried, setHasQueried] = useState(!!searchParams.get('vehicle'))

  const filteredPings = useMemo(() => {
    if (!viewedVehicleId || !viewedDate) return []
    return gpsPings
      .filter((p) => {
        if (p.vehicle_id !== viewedVehicleId) return false
        const pingDate = p.ts.slice(0, 10)
        return pingDate === viewedDate
      })
      .sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }, [gpsPings, viewedVehicleId, viewedDate])

  const polylinePositions = useMemo(
    () => filteredPings.map((p) => [p.lat, p.lng]),
    [filteredPings]
  )

  const firstPing = filteredPings[0] ?? null
  const lastPing = filteredPings[filteredPings.length - 1] ?? null

  const mapCenter = firstPing
    ? [firstPing.lat, firstPing.lng]
    : [28.57, 77.32]

  function handleViewHistory() {
    setViewedVehicleId(selectedVehicleId)
    setViewedDate(selectedDate)
    setHasQueried(true)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200 shrink-0 flex-wrap">
        <span className="text-sm font-semibold text-slate-700">Trip History</span>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <label htmlFor="vehicle-select" className="text-xs text-slate-500">
            Vehicle:
          </label>
          <select
            id="vehicle-select"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg_no}
              </option>
            ))}
          </select>

          <label htmlFor="date-pick" className="text-xs text-slate-500">
            Date:
          </label>
          <input
            id="date-pick"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleViewHistory}
            disabled={!selectedVehicleId || !selectedDate}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            View History
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div style={{ height: '60%' }} className="shrink-0">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredPings.length > 0 && <FitBounds pings={filteredPings} />}

            {polylinePositions.length >= 2 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.85 }}
              />
            )}

            {filteredPings.map((ping, idx) => {
              const isFirst = idx === 0
              const isLast = idx === filteredPings.length - 1

              if (isFirst || isLast) {
                return (
                  <Marker
                    key={ping.id}
                    position={[ping.lat, ping.lng]}
                    icon={isFirst ? startIcon : endIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{isFirst ? 'Start' : 'End'}</div>
                        <div>Time: {formatTime(ping.ts)}</div>
                        <div>Speed: {ping.speed_kmh} km/h</div>
                      </div>
                    </Popup>
                  </Marker>
                )
              }

              return (
                <CircleMarker
                  key={ping.id}
                  center={[ping.lat, ping.lng]}
                  radius={4}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#93c5fd',
                    fillOpacity: 0.9,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div>Time: {formatTime(ping.ts)}</div>
                      <div>Speed: {ping.speed_kmh} km/h</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        <div className="flex-1 overflow-y-auto bg-white border-t border-slate-200">
          {hasQueried && filteredPings.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No GPS data found for this vehicle on the selected date.
            </div>
          ) : filteredPings.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Latitude
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Longitude
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Speed (km/h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPings.map((ping, idx) => (
                  <tr key={ping.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 text-slate-700 tabular-nums">
                      {formatTime(ping.ts)}
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs tabular-nums">
                      {ping.lat.toFixed(5)}
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs tabular-nums">
                      {ping.lng.toFixed(5)}
                    </td>
                    <td className="px-4 py-2 text-slate-700 tabular-nums">{ping.speed_kmh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Select a vehicle and date, then click View History.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

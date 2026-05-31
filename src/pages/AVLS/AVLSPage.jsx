import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useTickSimulator } from '../../utils/tickSimulator'
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatTime,
} from '../../utils/helpers'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

const greenIcon = createIcon('green')
const greyIcon = createIcon('grey')

const TODAY = '2026-05-31'

function FlyToVehicle({ position }) {
  const map = useMap()
  if (position) {
    map.flyTo([position.lat, position.lng], 15, { duration: 1 })
  }
  return null
}

function TrailPolyline({ vehicleId, gpsPings }) {
  const thirtyMinAgo = useMemo(() => {
    const d = new Date(`${TODAY}T23:59:59.000Z`)
    d.setMinutes(d.getMinutes() - 30)
    return d
  }, [])

  const positions = useMemo(() => {
    return gpsPings
      .filter((p) => {
        if (p.vehicle_id !== vehicleId) return false
        const t = new Date(p.ts)
        return t >= thirtyMinAgo
      })
      .sort((a, b) => new Date(a.ts) - new Date(b.ts))
      .map((p) => [p.lat, p.lng])
  }, [vehicleId, gpsPings, thirtyMinAgo])

  if (positions.length < 2) return null
  return <Polyline positions={positions} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} />
}

export default function AVLSPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { vehicles, depots, duties, users, routes, gpsPings } = useData()

  const isDepotManager = user?.role === 'depot_manager'

  const [selectedDepot, setSelectedDepot] = useState(
    isDepotManager ? user.depot_id : ''
  )
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)

  const livePositions = useTickSimulator(vehicles, gpsPings, true)

  const filteredVehicles = useMemo(() => {
    if (!selectedDepot) return vehicles
    return vehicles.filter((v) => v.depot_id === selectedDepot)
  }, [vehicles, selectedDepot])

  const todayDuties = useMemo(
    () => duties.filter((d) => d.date === TODAY),
    [duties]
  )

  const getDutyForVehicle = useCallback(
    (vehicleId) => todayDuties.find((d) => d.vehicle_id === vehicleId) ?? null,
    [todayDuties]
  )

  const selectedVehicle = useMemo(
    () => (selectedVehicleId ? getVehicleById(vehicles, selectedVehicleId) : null),
    [vehicles, selectedVehicleId]
  )

  const selectedDuty = useMemo(
    () => (selectedVehicleId ? getDutyForVehicle(selectedVehicleId) : null),
    [selectedVehicleId, getDutyForVehicle]
  )

  const selectedDriver = useMemo(
    () => (selectedDuty ? getUserById(users, selectedDuty.driver_id) : null),
    [selectedDuty, users]
  )

  const selectedDepotData = useMemo(
    () => (selectedVehicle ? getDepotById(depots, selectedVehicle.depot_id) : null),
    [selectedVehicle, depots]
  )

  const selectedRoute = useMemo(() => {
    if (!selectedDuty) return null
    return routes.find((r) => r.id === selectedDuty.route_id) ?? null
  }, [selectedDuty, routes])

  const selectedPosition = selectedVehicleId ? livePositions[selectedVehicleId] : null

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200 z-10 shrink-0">
        <span className="text-sm font-semibold text-slate-700">Live Vehicle Map</span>
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="depot-filter" className="text-xs text-slate-500">
            Depot:
          </label>
          <select
            id="depot-filter"
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            disabled={isDepotManager}
            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All Depots</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
            Moving
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            Idle
          </span>
        </div>
      </div>

      <div className="relative flex-1">
        <MapContainer
          center={[28.57, 77.32]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedPosition && (
            <FlyToVehicle position={selectedPosition} />
          )}

          {selectedVehicleId && (
            <TrailPolyline vehicleId={selectedVehicleId} gpsPings={gpsPings} />
          )}

          {filteredVehicles.map((vehicle) => {
            const pos = livePositions[vehicle.id]
            if (!pos) return null

            const duty = getDutyForVehicle(vehicle.id)
            const driver = duty ? getUserById(users, duty.driver_id) : null
            const route = duty ? routes.find((r) => r.id === duty.route_id) : null
            const isMoving = pos.speed_kmh > 5
            const icon = isMoving ? greenIcon : greyIcon

            return (
              <Marker
                key={vehicle.id}
                position={[pos.lat, pos.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedVehicleId(vehicle.id),
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1 min-w-[160px]">
                    <div className="font-semibold text-slate-800">{vehicle.reg_no}</div>
                    <div className="text-slate-600">
                      Driver: {driver ? driver.full_name : '—'}
                    </div>
                    <div className="text-slate-600">
                      Route: {route ? route.name : '—'}
                    </div>
                    <div className="text-slate-600">
                      Speed: {pos.speed_kmh} km/h
                    </div>
                    <div className="text-slate-400 text-xs">
                      Updated: {formatTime(pos.ts)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {selectedVehicle && (
          <div className="absolute top-3 right-3 z-[1000] w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-sm">Vehicle Details</span>
              <button
                onClick={() => setSelectedVehicleId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Vehicle</div>
                <div className="font-mono font-semibold text-slate-800">
                  {selectedVehicle.reg_no}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedVehicle.type} · Capacity {selectedVehicle.capacity}
                </div>
                <div className="text-xs text-slate-500">
                  Depot: {selectedDepotData?.name ?? '—'}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Driver</div>
                {selectedDriver ? (
                  <>
                    <div className="text-sm font-medium text-slate-700">
                      {selectedDriver.full_name}
                    </div>
                    <div className="text-xs text-slate-500">{selectedDriver.phone}</div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">No duty assigned today</div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Route</div>
                {selectedRoute ? (
                  <div className="text-sm text-slate-700">{selectedRoute.name}</div>
                ) : (
                  <div className="text-sm text-slate-400">—</div>
                )}
              </div>

              {selectedPosition && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Live Position</div>
                  <div className="text-xs text-slate-600">
                    {selectedPosition.lat.toFixed(4)}, {selectedPosition.lng.toFixed(4)}
                  </div>
                  <div className="text-xs text-slate-600">
                    Speed: {selectedPosition.speed_kmh} km/h
                  </div>
                  <div className="text-xs text-slate-400">
                    Updated: {formatTime(selectedPosition.ts)}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => navigate(`/avls/history?vehicle=${selectedVehicle.id}`)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  View Full History →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useTickSimulator } from "../../utils/tickSimulator";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatTime,
} from "../../utils/helpers";
import styles from "./AVLS.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const greenIcon = createIcon("green");
const greyIcon = createIcon("grey");

const TODAY = "2026-05-31";

function FlyToVehicle({ position }) {
  const map = useMap();
  if (position) map.flyTo([position.lat, position.lng], 15, { duration: 1 });
  return null;
}

function TrailPolyline({ vehicleId, gpsPings }) {
  const thirtyMinAgo = useMemo(() => {
    const d = new Date(`${TODAY}T23:59:59.000Z`);
    d.setMinutes(d.getMinutes() - 30);
    return d;
  }, []);

  const positions = useMemo(
    () =>
      gpsPings
        .filter(
          (p) => p.vehicle_id === vehicleId && new Date(p.ts) >= thirtyMinAgo,
        )
        .sort((a, b) => new Date(a.ts) - new Date(b.ts))
        .map((p) => [p.lat, p.lng]),
    [vehicleId, gpsPings, thirtyMinAgo],
  );

  if (positions.length < 2) return null;
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.8 }}
    />
  );
}

export default function AVLSPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vehicles, depots, duties, users, routes, gpsPings } = useData();

  const isDepotManager = user?.role === "depot_manager";
  const [selectedDepot, setSelectedDepot] = useState(
    isDepotManager ? user.depot_id : "",
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const livePositions = useTickSimulator(vehicles, gpsPings, true);

  const filteredVehicles = useMemo(
    () =>
      selectedDepot
        ? vehicles.filter((v) => v.depot_id === selectedDepot)
        : vehicles,
    [vehicles, selectedDepot],
  );

  const todayDuties = useMemo(
    () => duties.filter((d) => d.date === TODAY),
    [duties],
  );

  const getDutyForVehicle = useCallback(
    (vehicleId) => todayDuties.find((d) => d.vehicle_id === vehicleId) ?? null,
    [todayDuties],
  );

  const selectedVehicle = useMemo(
    () =>
      selectedVehicleId ? getVehicleById(vehicles, selectedVehicleId) : null,
    [vehicles, selectedVehicleId],
  );
  const selectedDuty = useMemo(
    () => (selectedVehicleId ? getDutyForVehicle(selectedVehicleId) : null),
    [selectedVehicleId, getDutyForVehicle],
  );
  const selectedDriver = useMemo(
    () => (selectedDuty ? getUserById(users, selectedDuty.driver_id) : null),
    [selectedDuty, users],
  );
  const selectedDepotData = useMemo(
    () =>
      selectedVehicle ? getDepotById(depots, selectedVehicle.depot_id) : null,
    [selectedVehicle, depots],
  );
  const selectedRoute = useMemo(
    () =>
      selectedDuty
        ? (routes.find((r) => r.id === selectedDuty.route_id) ?? null)
        : null,
    [selectedDuty, routes],
  );
  const selectedPosition = selectedVehicleId
    ? livePositions[selectedVehicleId]
    : null;

  const activeCount = filteredVehicles.filter(
    (v) => livePositions[v.id],
  ).length;

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Live Vehicle Map</span>

        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          LIVE
        </div>

        <span className={styles.vehicleCount}>{activeCount} active</span>

        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          disabled={isDepotManager}
          className={styles.select}
        >
          <option value="">All Depots</option>
          {depots.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDotMoving} /> Moving
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDotIdle} /> Idle
          </span>
        </div>
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        <MapContainer
          center={[28.57, 77.32]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedPosition && <FlyToVehicle position={selectedPosition} />}
          {selectedVehicleId && (
            <TrailPolyline vehicleId={selectedVehicleId} gpsPings={gpsPings} />
          )}

          {filteredVehicles.map((vehicle) => {
            const pos = livePositions[vehicle.id];
            if (!pos) return null;
            const duty = getDutyForVehicle(vehicle.id);
            const driver = duty ? getUserById(users, duty.driver_id) : null;
            const route = duty
              ? routes.find((r) => r.id === duty.route_id)
              : null;
            const isMoving = pos.speed_kmh > 5;
            return (
              <Marker
                key={vehicle.id}
                position={[pos.lat, pos.lng]}
                icon={isMoving ? greenIcon : greyIcon}
                eventHandlers={{
                  click: () => setSelectedVehicleId(vehicle.id),
                }}
              >
                <Popup>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-sm)",
                      minWidth: 160,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {vehicle.reg_no}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Driver: {driver ? driver.full_name : "—"}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Route: {route ? route.name : "—"}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Speed: {pos.speed_kmh} km/h
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "var(--text-xs)",
                        marginTop: 4,
                      }}
                    >
                      Updated: {formatTime(pos.ts)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Side panel */}
        {selectedVehicle && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <span className={styles.sidePanelTitle}>Vehicle Details</span>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedVehicleId(null)}
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.sidePanelBody}>
              <div className={styles.infoGroup}>
                <p className={styles.infoGroupTitle}>Vehicle</p>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Reg No</span>
                  <span className={styles.infoValueMono}>
                    {selectedVehicle.reg_no}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Type</span>
                  <span className={styles.infoValue}>
                    {selectedVehicle.type} · {selectedVehicle.capacity} seats
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Depot</span>
                  <span className={styles.infoValue}>
                    {selectedDepotData?.name ?? "—"}
                  </span>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.infoGroup}>
                <p className={styles.infoGroupTitle}>Driver</p>
                {selectedDriver ? (
                  <>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Name</span>
                      <span className={styles.infoValue}>
                        {selectedDriver.full_name}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Phone</span>
                      <span className={styles.infoValue}>
                        {selectedDriver.phone}
                      </span>
                    </div>
                  </>
                ) : (
                  <span
                    className={styles.infoValue}
                    style={{ color: "var(--text-muted)" }}
                  >
                    No duty assigned today
                  </span>
                )}
              </div>

              <hr className={styles.divider} />

              <div className={styles.infoGroup}>
                <p className={styles.infoGroupTitle}>Route</p>
                <span className={styles.infoValue}>
                  {selectedRoute ? selectedRoute.name : "—"}
                </span>
              </div>

              {selectedPosition && (
                <>
                  <hr className={styles.divider} />
                  <div className={styles.infoGroup}>
                    <p className={styles.infoGroupTitle}>Live Position</p>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Speed</span>
                      <span
                        className={`${styles.speedBadge} ${selectedPosition.speed_kmh > 5 ? styles.speedMoving : styles.speedIdle}`}
                      >
                        {selectedPosition.speed_kmh} km/h
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Coords</span>
                      <span
                        className={styles.infoValue}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        {selectedPosition.lat.toFixed(4)},{" "}
                        {selectedPosition.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Updated</span>
                      <span className={styles.infoValue}>
                        {formatTime(selectedPosition.ts)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button
                className={styles.historyLink}
                onClick={() =>
                  navigate(`/avls/history?vehicle=${selectedVehicle.id}`)
                }
              >
                View Full History →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

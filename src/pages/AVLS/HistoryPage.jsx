import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { useData } from "../../context/DataContext";
import { formatTime } from "../../utils/helpers";
import styles from "./History.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const makeIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
const startIcon = makeIcon("green");
const endIcon = makeIcon("red");

function FitBounds({ pings }) {
  const map = useMap();
  if (pings.length > 0)
    map.fitBounds(
      pings.map((p) => [p.lat, p.lng]),
      { padding: [40, 40] },
    );
  return null;
}

export default function HistoryPage() {
  const [searchParams] = useSearchParams();
  const { vehicles, gpsPings } = useData();
  const initVehicle = searchParams.get("vehicle") ?? "";

  const [selectedVehicleId, setSelectedVehicleId] = useState(initVehicle);
  const [selectedDate, setSelectedDate] = useState("2026-05-31");
  const [viewedVehicleId, setViewedVehicleId] = useState(initVehicle);
  const [viewedDate, setViewedDate] = useState("2026-05-31");
  const [hasQueried, setHasQueried] = useState(!!initVehicle);

  const filteredPings = useMemo(() => {
    if (!viewedVehicleId || !viewedDate) return [];
    return gpsPings
      .filter(
        (p) =>
          p.vehicle_id === viewedVehicleId && p.ts.slice(0, 10) === viewedDate,
      )
      .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }, [gpsPings, viewedVehicleId, viewedDate]);

  const polylinePositions = useMemo(
    () => filteredPings.map((p) => [p.lat, p.lng]),
    [filteredPings],
  );
  const mapCenter = filteredPings[0]
    ? [filteredPings[0].lat, filteredPings[0].lng]
    : [28.57, 77.32];

  function handleView() {
    setViewedVehicleId(selectedVehicleId);
    setViewedDate(selectedDate);
    setHasQueried(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Trip History</span>
        <span className={styles.label}>Vehicle</span>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className={styles.select}
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.reg_no}
            </option>
          ))}
        </select>
        <span className={styles.label}>Date</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.dateInput}
        />
        <button
          onClick={handleView}
          disabled={!selectedVehicleId || !selectedDate}
          className={styles.viewBtn}
        >
          View History
        </button>
      </div>

      <div className={styles.mapWrap}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredPings.length > 0 && <FitBounds pings={filteredPings} />}
          {polylinePositions.length >= 2 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.85 }}
            />
          )}
          {filteredPings.map((ping, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === filteredPings.length - 1;
            if (isFirst || isLast) {
              return (
                <Marker
                  key={ping.id}
                  position={[ping.lat, ping.lng]}
                  icon={isFirst ? startIcon : endIcon}
                >
                  <Popup>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "13px",
                      }}
                    >
                      <b>{isFirst ? "Start" : "End"}</b>
                      <br />
                      {formatTime(ping.ts)} · {ping.speed_kmh} km/h
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return (
              <CircleMarker
                key={ping.id}
                center={[ping.lat, ping.lng]}
                radius={4}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#93c5fd",
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div
                    style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
                  >
                    {formatTime(ping.ts)} · {ping.speed_kmh} km/h
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className={styles.tableWrap}>
        {hasQueried && filteredPings.length === 0 ? (
          <div className={styles.empty}>
            No GPS data found for this vehicle on the selected date.
          </div>
        ) : filteredPings.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Time</th>
                <th className={styles.th}>Latitude</th>
                <th className={styles.th}>Longitude</th>
                <th className={styles.th}>Speed (km/h)</th>
              </tr>
            </thead>
            <tbody>
              {filteredPings.map((ping, idx) => (
                <tr key={ping.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdMono}`}>{idx + 1}</td>
                  <td className={styles.td}>{formatTime(ping.ts)}</td>
                  <td className={`${styles.td} ${styles.tdMono}`}>
                    {ping.lat.toFixed(5)}
                  </td>
                  <td className={`${styles.td} ${styles.tdMono}`}>
                    {ping.lng.toFixed(5)}
                  </td>
                  <td className={styles.td}>{ping.speed_kmh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>
            Select a vehicle and date, then click View History.
          </div>
        )}
      </div>
    </div>
  );
}

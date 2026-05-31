import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { getDepotById } from "../../utils/helpers";
import styles from "./RoutesPage.module.css";

function RouteStopsPanel({ routeId, routeStops, stops }) {
  const ordered = useMemo(() => {
    return routeStops
      .filter((rs) => rs.route_id === routeId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((rs) => ({
        rs,
        stop: stops.find((s) => s.id === rs.stop_id),
      }))
      .filter((x) => x.stop);
  }, [routeId, routeStops, stops]);

  if (!ordered.length) {
    return (
      <div className={styles.stopsPanel}>
        <p className={styles.stopsPanelLabel}>Stop Sequence</p>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          No stops configured.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stopsPanel}>
      <p className={styles.stopsPanelLabel}>Stop Sequence</p>
      <div className={styles.stopsList}>
        {ordered.map(({ rs, stop }) => (
          <div key={rs.id} className={styles.stopItem}>
            <span className={styles.stopNum}>{rs.sequence}</span>
            <span className={styles.stopName}>{stop.name}</span>
            <span className={styles.stopOffset}>
              +{rs.planned_offset_min} min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddRouteModal({ depots, stops, visibleDepotId, onClose, onSave }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [depotId, setDepotId] = useState(
    visibleDepotId || (depots[0]?.id ?? ""),
  );
  const [stopSearch, setStopSearch] = useState("");
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [addedStops, setAddedStops] = useState([]);
  const [error, setError] = useState("");

  const filteredStops = useMemo(() => {
    const q = stopSearch.trim().toLowerCase();
    if (!q) return stops.slice(0, 8);
    return stops.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [stops, stopSearch]);

  function handleAddStop(stop) {
    if (addedStops.some((s) => s.stop_id === stop.id)) return;
    setAddedStops((prev) => [
      ...prev,
      {
        stop_id: stop.id,
        stop_name: stop.name,
        planned_offset_min: Number(selectedOffset),
      },
    ]);
    setStopSearch("");
    setSelectedOffset(0);
  }

  function handleRemoveStop(stopId) {
    setAddedStops((prev) => prev.filter((s) => s.stop_id !== stopId));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Route code is required.");
      return;
    }
    if (!name.trim()) {
      setError("Route name is required.");
      return;
    }
    if (!depotId) {
      setError("Please select a depot.");
      return;
    }
    if (addedStops.length < 2) {
      setError("Add at least 2 stops.");
      return;
    }
    setError("");
    onSave({
      code: code.trim(),
      name: name.trim(),
      depotId,
      stops: addedStops,
    });
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Route</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
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

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={styles.label}>Route Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. NC-62"
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Depot</label>
              <select
                value={depotId}
                onChange={(e) => setDepotId(e.target.value)}
                disabled={!!visibleDepotId}
                className={styles.select}
              >
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>Route Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Noida City Centre → Sector 62"
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Add Stops</label>
            <div className={styles.stopAdder}>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={stopSearch}
                  onChange={(e) => setStopSearch(e.target.value)}
                  placeholder="Search stop name…"
                  className={styles.input}
                />
                {stopSearch && (
                  <div className={styles.stopDropdown}>
                    {filteredStops.length === 0 ? (
                      <div className={styles.stopDropdownEmpty}>
                        No stops found
                      </div>
                    ) : (
                      filteredStops.map((s) => {
                        const already = addedStops.some(
                          (x) => x.stop_id === s.id,
                        );
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={already}
                            onClick={() => handleAddStop(s)}
                            className={styles.stopDropdownItem}
                          >
                            {s.name}
                            {already && (
                              <span
                                style={{
                                  marginLeft: "var(--sp-1)",
                                  fontSize: "var(--text-xs)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                (added)
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="number"
                  value={selectedOffset}
                  onChange={(e) => setSelectedOffset(e.target.value)}
                  min="0"
                  placeholder="min"
                  className={styles.input}
                  style={{ width: "80px" }}
                />
              </div>
            </div>

            {addedStops.length > 0 && (
              <div className={`${styles.addedStopsList} mt-3`}>
                {addedStops.map((s, idx) => (
                  <div key={s.stop_id} className={styles.addedStopItem}>
                    <span className={styles.addedStopNum}>{idx + 1}</span>
                    <span className={styles.addedStopName}>{s.stop_name}</span>
                    <span className={styles.addedStopOffset}>
                      +{s.planned_offset_min} min
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(s.stop_id)}
                      className={styles.removeStopBtn}
                    >
                      <svg
                        width="14"
                        height="14"
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
                ))}
              </div>
            )}
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Save Route
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const { user } = useAuth();
  const { depots, routes: ctxRoutes, routeStops, stops } = useData();

  const [routes, setRoutes] = useState(() => ctxRoutes);
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "depot_manager";
  const canManage = isAdmin || isManager;

  const visibleDepotId = isManager ? user.depot_id : null;

  const visibleRoutes = useMemo(() => {
    if (isAdmin) return routes;
    if (isManager) return routes.filter((r) => r.depot_id === user.depot_id);
    return routes;
  }, [routes, isAdmin, isManager, user]);

  function handleSaveRoute({ code, name, depotId, stops: newStops }) {
    const id = `R${Date.now()}`;
    const newRoute = {
      id,
      code,
      name,
      depot_id: depotId,
      total_stops: newStops.length,
      distance_km: 0,
    };
    setRoutes((prev) => [...prev, newRoute]);
    setShowAddModal(false);
  }

  function handleDelete(routeId) {
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setDeleteId(null);
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className={`${styles.page} p-6`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Routes</h1>
          <p className={styles.pageSubtitle}>
            {visibleRoutes.length} route{visibleRoutes.length !== 1 ? "s" : ""}{" "}
            configured
            {isManager &&
              ` for ${getDepotById(depots, user.depot_id)?.name ?? "your depot"}`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className={`${styles.btn} ${styles.btnPrimary}`}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Route
          </button>
        )}
      </div>

      <div className={styles.card}>
        {visibleRoutes.length === 0 ? (
          <div className={styles.emptyState}>No routes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Code</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Depot</th>
                  <th className={styles.th}>Stops</th>
                  <th className={`${styles.th} hidden md:table-cell`}>
                    Distance
                  </th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRoutes.map((route) => {
                  const depot = getDepotById(depots, route.depot_id);
                  const isExpanded = expandedId === route.id;
                  return (
                    <>
                      <tr
                        key={route.id}
                        className={`${styles.tr} ${isExpanded ? styles.trExpanded : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleExpand(route.id)}
                      >
                        <td className={styles.td}>
                          <span className={styles.codeCell}>{route.code}</span>
                        </td>
                        <td className={styles.td}>
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 500,
                            }}
                          >
                            {route.name}
                          </span>
                        </td>
                        <td className={styles.td}>
                          {depot?.name ?? route.depot_id}
                        </td>
                        <td className={styles.td}>{route.total_stops}</td>
                        <td className={`${styles.td} hidden md:table-cell`}>
                          {route.distance_km > 0
                            ? `${route.distance_km} km`
                            : "—"}
                        </td>
                        <td
                          className={styles.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              className={`${styles.actionBtn} ${styles.expandBtn}`}
                              onClick={() => toggleExpand(route.id)}
                            >
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              Stops
                            </button>
                            {isAdmin && (
                              <button
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                onClick={() => setDeleteId(route.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${route.id}-stops`}
                          className={styles.expandedRow}
                        >
                          <td colSpan={6} style={{ padding: 0 }}>
                            <RouteStopsPanel
                              routeId={route.id}
                              routeStops={routeStops}
                              stops={stops}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRouteModal
          depots={
            isManager ? depots.filter((d) => d.id === user.depot_id) : depots
          }
          stops={stops}
          visibleDepotId={visibleDepotId}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveRoute}
        />
      )}

      {deleteId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Delete Route</h3>
            <p className={styles.confirmDesc}>
              Are you sure you want to delete this route? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className={`${styles.btn} ${styles.btnDanger}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { getDepotById } from "../../utils/helpers";

function StopRow({ stop, offset, sequence }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
        {sequence}
      </div>
      <span className="text-sm text-slate-700 flex-1">{stop.name}</span>
      <span className="text-xs text-slate-400 tabular-nums">+{offset} min</span>
    </div>
  );
}

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
      <p className="text-sm text-slate-400 py-2 px-4">No stops configured.</p>
    );
  }

  return (
    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Stop Sequence
      </p>
      <div className="space-y-0.5">
        {ordered.map(({ rs, stop }) => (
          <StopRow
            key={rs.id}
            stop={stop}
            offset={rs.planned_offset_min}
            sequence={rs.sequence}
          />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Add Route</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Route Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. NC-62"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Depot
              </label>
              <select
                value={depotId}
                onChange={(e) => setDepotId(e.target.value)}
                disabled={!!visibleDepotId}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
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
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Route Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Noida City Centre → Sector 62"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Add Stops
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={stopSearch}
                  onChange={(e) => setStopSearch(e.target.value)}
                  placeholder="Search stop name…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {stopSearch && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                    {filteredStops.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-400">
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
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {s.name}
                            {already && (
                              <span className="ml-1 text-xs text-slate-400">
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
                  className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {addedStops.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {addedStops.map((s, idx) => (
                  <div
                    key={s.stop_id}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {s.stop_name}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      +{s.planned_offset_min} min
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(s.stop_id)}
                      className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
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

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-route-form"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manage Routes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {visibleRoutes.length} route{visibleRoutes.length !== 1 ? "s" : ""}{" "}
            configured
            {isManager &&
              ` for ${getDepotById(depots, user.depot_id)?.name ?? "your depot"}`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {visibleRoutes.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No routes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Depot
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Stops
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Distance
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRoutes.map((route) => {
                  const depot = getDepotById(depots, route.depot_id);
                  const isExpanded = expandedId === route.id;
                  return (
                    <tr
                      key={route.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td colSpan={6} className="p-0">
                        <div>
                          <div
                            className={`grid cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? "bg-slate-50" : ""}`}
                            style={{
                              gridTemplateColumns:
                                "96px 1fr 180px 80px 100px 120px",
                            }}
                            onClick={() => toggleExpand(route.id)}
                          >
                            <div className="px-4 py-3">
                              <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                {route.code}
                              </span>
                            </div>
                            <div className="px-4 py-3 text-slate-700 font-medium truncate">
                              {route.name}
                            </div>
                            <div className="px-4 py-3 text-slate-500 truncate">
                              {depot?.name ?? route.depot_id}
                            </div>
                            <div className="px-4 py-3 text-slate-600">
                              {route.total_stops}
                            </div>
                            <div className="px-4 py-3 text-slate-600">
                              {route.distance_km > 0
                                ? `${route.distance_km} km`
                                : "—"}
                            </div>
                            <div
                              className="px-4 py-3 flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => toggleExpand(route.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
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
                                  onClick={() => setDeleteId(route.id)}
                                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          {isExpanded && (
                            <RouteStopsPanel
                              routeId={route.id}
                              routeStops={routeStops}
                              stops={stops}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-2">
              Delete Route
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this route? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { getDepotById, getRouteById, getVehicleById } from "../../utils/helpers";

const TODAY = "2026-05-31";

function getWeekDates() {
  const base = new Date(TODAY);
  const dates = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const WEEK_DATES = getWeekDates();

function fmtWeekDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const STATUS_CELL = {
  draft:        "bg-slate-100 border border-slate-200 text-slate-600",
  published:    "bg-blue-50 border border-blue-200 text-blue-700",
  acknowledged: "bg-green-50 border border-green-200 text-green-700",
  completed:    "bg-slate-200 border border-slate-300 text-slate-500",
};

function DutyCell({ duty, vehicle, route, canEdit, onEdit }) {
  if (!duty) {
    return (
      <td className="px-2 py-2 min-w-[130px]">
        {canEdit ? (
          <button
            onClick={onEdit}
            className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          <div className="w-full h-12 rounded-lg bg-slate-50" />
        )}
      </td>
    );
  }

  const cls = STATUS_CELL[duty.status] ?? STATUS_CELL.draft;

  return (
    <td className="px-2 py-2 min-w-[130px]">
      <div
        className={`rounded-lg px-2 py-1.5 ${cls} ${canEdit ? "cursor-pointer hover:opacity-80" : ""} transition-opacity`}
        onClick={canEdit ? onEdit : undefined}
        title={`${duty.start_time}–${duty.end_time}`}
      >
        <div className="text-xs font-semibold truncate">{vehicle?.reg_no ?? duty.vehicle_id}</div>
        <div className="text-xs truncate opacity-80">{route?.code ?? duty.route_id}</div>
        <div className="text-xs opacity-60 tabular-nums">{duty.start_time}–{duty.end_time}</div>
      </div>
    </td>
  );
}

function AssignModal({ driverName, date, depotId, vehicles, routes, existingDuty, onClose, onSave }) {
  const [vehicleId, setVehicleId] = useState(existingDuty?.vehicle_id ?? "");
  const [routeId, setRouteId] = useState(existingDuty?.route_id ?? "");
  const [startTime, setStartTime] = useState(existingDuty?.start_time ?? "06:00");
  const [endTime, setEndTime] = useState(existingDuty?.end_time ?? "14:00");
  const [error, setError] = useState("");

  const depotVehicles = vehicles.filter((v) => v.depot_id === depotId && v.status !== "maintenance");
  const depotRoutes = routes.filter((r) => r.depot_id === depotId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!vehicleId) { setError("Please select a vehicle."); return; }
    if (!routeId) { setError("Please select a route."); return; }
    if (!startTime) { setError("Start time is required."); return; }
    if (!endTime) { setError("End time is required."); return; }
    setError("");
    onSave({ vehicleId, routeId, startTime, endTime });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {existingDuty ? "Edit Duty" : "Assign Duty"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Driver</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 truncate">
                {driverName}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                {date}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Select vehicle —</option>
              {depotVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.reg_no} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Select route —</option>
              {depotRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {existingDuty ? "Update Duty" : "Assign Duty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RosterPage() {
  const { user } = useAuth();
  const { depots, vehicles, routes, users, duties: ctxDuties, updateDuty } = useData();

  const [localDuties, setLocalDuties] = useState(() => ctxDuties);
  const [modal, setModal] = useState(null);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "depot_manager";
  const canEdit = isAdmin || isManager;

  const depotId = isManager ? user.depot_id : null;

  const drivers = useMemo(() => {
    const all = users.filter((u) => u.role === "driver");
    if (depotId) return all.filter((u) => u.depot_id === depotId);
    return all;
  }, [users, depotId]);

  const dutyMap = useMemo(() => {
    const map = {};
    localDuties.forEach((d) => {
      const key = `${d.driver_id}__${d.date}`;
      if (!map[key]) map[key] = d;
    });
    return map;
  }, [localDuties]);

  function getDuty(driverId, date) {
    return dutyMap[`${driverId}__${date}`] ?? null;
  }

  function openModal(driver, date) {
    const existing = getDuty(driver.id, date);
    const driverDepotId = depotId ?? driver.depot_id;
    setModal({ driver, date, depotId: driverDepotId, existingDuty: existing });
  }

  function handleSave({ vehicleId, routeId, startTime, endTime }) {
    const { driver, date, depotId: mDepotId, existingDuty } = modal;

    if (existingDuty) {
      const updated = {
        ...existingDuty,
        vehicle_id: vehicleId,
        route_id: routeId,
        start_time: startTime,
        end_time: endTime,
      };
      updateDuty(updated);
      setLocalDuties((prev) =>
        prev.map((d) => (d.id === existingDuty.id ? updated : d))
      );
    } else {
      const newDuty = {
        id: `DT${Date.now()}`,
        date,
        vehicle_id: vehicleId,
        driver_id: driver.id,
        route_id: routeId,
        depot_id: mDepotId,
        start_time: startTime,
        end_time: endTime,
        status: "draft",
        ack_at: null,
      };
      setLocalDuties((prev) => [...prev, newDuty]);
    }

    setModal(null);
  }

  function handlePublishAll() {
    const publishDepot = depotId;
    const updated = localDuties.map((d) => {
      if (d.status === "draft" && (!publishDepot || d.depot_id === publishDepot)) {
        const upd = { ...d, status: "published" };
        updateDuty(upd);
        return upd;
      }
      return d;
    });
    setLocalDuties(updated);
  }

  const draftCount = useMemo(() => {
    return localDuties.filter(
      (d) => d.status === "draft" && (!depotId || d.depot_id === depotId)
    ).length;
  }, [localDuties, depotId]);

  const depot = depotId ? getDepotById(depots, depotId) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Roster & Duties</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Week of {WEEK_DATES[0]} – {WEEK_DATES[WEEK_DATES.length - 1]}
            {depot && ` · ${depot.name}`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handlePublishAll}
            disabled={draftCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publish All Drafts
            {draftCount > 0 && (
              <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-xs font-bold">{draftCount}</span>
            )}
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap text-xs">
        {[
          { label: "Draft", cls: "bg-slate-100 border border-slate-200 text-slate-600" },
          { label: "Published", cls: "bg-blue-50 border border-blue-200 text-blue-700" },
          { label: "Acknowledged", cls: "bg-green-50 border border-green-200 text-green-700" },
          { label: "Completed", cls: "bg-slate-200 border border-slate-300 text-slate-500" },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse" style={{ minWidth: "900px" }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-slate-50 z-10 min-w-[150px] border-r border-slate-100">
                  Driver
                </th>
                {WEEK_DATES.map((date) => {
                  const isToday = date === TODAY;
                  return (
                    <th
                      key={date}
                      className={`px-2 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap min-w-[130px] text-center ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {fmtWeekDay(date)}
                      {isToday && <span className="ml-1 text-blue-200 font-normal normal-case text-xs">(today)</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {drivers.map((driver) => {
                const driverDepot = getDepotById(depots, driver.depot_id);
                return (
                  <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 sticky left-0 bg-white z-10 border-r border-slate-100 min-w-[150px]">
                      <div className="font-medium text-slate-700 truncate">{driver.full_name}</div>
                      {!depotId && (
                        <div className="text-xs text-slate-400 truncate">{driverDepot?.code ?? driver.depot_id}</div>
                      )}
                    </td>
                    {WEEK_DATES.map((date) => {
                      const duty = getDuty(driver.id, date);
                      const vehicle = duty ? getVehicleById(vehicles, duty.vehicle_id) : null;
                      const route = duty ? getRouteById(routes, duty.route_id) : null;
                      return (
                        <DutyCell
                          key={date}
                          duty={duty}
                          vehicle={vehicle}
                          route={route}
                          canEdit={canEdit}
                          onEdit={() => openModal(driver, date)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={WEEK_DATES.length + 1} className="text-center py-12 text-slate-400 text-sm">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <AssignModal
          driverName={modal.driver.full_name}
          date={modal.date}
          depotId={modal.depotId}
          vehicles={vehicles}
          routes={routes}
          existingDuty={modal.existingDuty}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getDepotById,
  getRouteById,
  getVehicleById,
} from "../../utils/helpers";
import styles from "./RosterPage.module.css";

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
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const STATUS_CELL_CLASS = {
  draft: styles.dutyCellDraft,
  published: styles.dutyCellPublished,
  acknowledged: styles.dutyCellAcknowledged,
  completed: styles.dutyCellCompleted,
};

const STATUS_BADGE_CLASS = {
  draft: styles.dutyCellStatusBadgeDraft,
  published: styles.dutyCellStatusBadgePublished,
  acknowledged: styles.dutyCellStatusBadgeAcknowledged,
  completed: styles.dutyCellStatusBadgeCompleted,
};

function DutyCell({ duty, vehicle, route, canEdit, onEdit }) {
  if (!duty) {
    return (
      <td className={styles.rosterTd}>
        {canEdit ? (
          <button className={styles.addDutyBtn} onClick={onEdit} type="button">
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
          </button>
        ) : (
          <div className={styles.emptyDutyCell} />
        )}
      </td>
    );
  }

  const statusCls = STATUS_CELL_CLASS[duty.status] ?? STATUS_CELL_CLASS.draft;
  const badgeCls = STATUS_BADGE_CLASS[duty.status] ?? STATUS_BADGE_CLASS.draft;

  return (
    <td className={styles.rosterTd}>
      <div
        className={`${styles.dutyCell} ${statusCls} ${canEdit ? styles.dutyCellClickable : ""}`}
        onClick={canEdit ? onEdit : undefined}
        title={`${duty.start_time}–${duty.end_time}`}
      >
        <div className={styles.dutyCellRoute}>
          {route?.code ?? duty.route_id}
        </div>
        <div className={styles.dutyCellVehicle}>
          {vehicle?.reg_no ?? duty.vehicle_id}
        </div>
        <div className={styles.dutyCellTime}>
          {duty.start_time}–{duty.end_time}
        </div>
        <span className={`${styles.dutyCellStatusBadge} ${badgeCls}`}>
          {duty.status}
        </span>
      </div>
    </td>
  );
}

function AssignModal({
  driverName,
  date,
  depotId,
  vehicles,
  routes,
  existingDuty,
  onClose,
  onSave,
}) {
  const [vehicleId, setVehicleId] = useState(existingDuty?.vehicle_id ?? "");
  const [routeId, setRouteId] = useState(existingDuty?.route_id ?? "");
  const [startTime, setStartTime] = useState(
    existingDuty?.start_time ?? "06:00",
  );
  const [endTime, setEndTime] = useState(existingDuty?.end_time ?? "14:00");
  const [error, setError] = useState("");

  const depotVehicles = vehicles.filter(
    (v) => v.depot_id === depotId && v.status !== "maintenance",
  );
  const depotRoutes = routes.filter((r) => r.depot_id === depotId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!vehicleId) {
      setError("Please select a vehicle.");
      return;
    }
    if (!routeId) {
      setError("Please select a route.");
      return;
    }
    if (!startTime) {
      setError("Start time is required.");
      return;
    }
    if (!endTime) {
      setError("End time is required.");
      return;
    }
    setError("");
    onSave({ vehicleId, routeId, startTime, endTime });
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {existingDuty ? "Edit Duty" : "Assign Duty"}
          </h2>
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
              <label className={styles.label}>Driver</label>
              <div className={`${styles.input} ${styles.inputReadonly}`}>
                {driverName}
              </div>
            </div>
            <div>
              <label className={styles.label}>Date</label>
              <div className={`${styles.input} ${styles.inputReadonly}`}>
                {date}
              </div>
            </div>
          </div>

          <div>
            <label className={styles.label}>Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={styles.select}
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
            <label className={styles.label}>Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className={styles.select}
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
              <label className={styles.label}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={styles.input}
              />
            </div>
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
            {existingDuty ? "Update Duty" : "Assign Duty"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RosterPage() {
  const { user } = useAuth();
  const {
    depots,
    vehicles,
    routes,
    users,
    duties: ctxDuties,
    updateDuty,
  } = useData();

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
        prev.map((d) => (d.id === existingDuty.id ? updated : d)),
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
      if (
        d.status === "draft" &&
        (!publishDepot || d.depot_id === publishDepot)
      ) {
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
      (d) => d.status === "draft" && (!depotId || d.depot_id === depotId),
    ).length;
  }, [localDuties, depotId]);

  const depot = depotId ? getDepotById(depots, depotId) : null;

  return (
    <div className={`${styles.page} p-6`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Roster</h1>
          <p className={styles.pageSubtitle}>
            Week of {WEEK_DATES[0]} – {WEEK_DATES[WEEK_DATES.length - 1]}
            {depot && ` · ${depot.name}`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handlePublishAll}
            disabled={draftCount === 0}
            className={`${styles.btn} ${styles.btnSuccess}`}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Publish All Drafts
            {draftCount > 0 && (
              <span className={styles.draftBadge}>{draftCount}</span>
            )}
          </button>
        )}
      </div>

      <div className={styles.legendWrap}>
        <span className={`${styles.legendBadge} ${styles.legendDraft}`}>
          Draft
        </span>
        <span className={`${styles.legendBadge} ${styles.legendPublished}`}>
          Published
        </span>
        <span className={`${styles.legendBadge} ${styles.legendAcknowledged}`}>
          Acknowledged
        </span>
        <span className={`${styles.legendBadge} ${styles.legendCompleted}`}>
          Completed
        </span>
      </div>

      <div className={styles.card}>
        <div className={styles.rosterWrap}>
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th className={`${styles.rosterTh} ${styles.rosterDriverTh}`}>
                  Driver
                </th>
                {WEEK_DATES.map((date) => {
                  const isToday = date === TODAY;
                  return (
                    <th
                      key={date}
                      className={`${styles.rosterTh} ${isToday ? styles.rosterThToday : ""}`}
                    >
                      {fmtWeekDay(date)}
                      {isToday && (
                        <span className={styles.rosterTodayLabel}>
                          {" "}
                          (today)
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const driverDepot = getDepotById(depots, driver.depot_id);
                return (
                  <tr key={driver.id}>
                    <td className={styles.rosterDriverTd}>
                      <div>{driver.full_name}</div>
                      {!depotId && (
                        <div className={styles.rosterDriverSubtext}>
                          {driverDepot?.code ?? driver.depot_id}
                        </div>
                      )}
                    </td>
                    {WEEK_DATES.map((date) => {
                      const duty = getDuty(driver.id, date);
                      const vehicle = duty
                        ? getVehicleById(vehicles, duty.vehicle_id)
                        : null;
                      const route = duty
                        ? getRouteById(routes, duty.route_id)
                        : null;
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
                  <td
                    colSpan={WEEK_DATES.length + 1}
                    className={styles.emptyState}
                  >
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

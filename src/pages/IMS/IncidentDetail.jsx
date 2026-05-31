import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatDate,
  timeAgo,
} from "../../utils/helpers";
import styles from "./IncidentDetail.module.css";

const NEXT_STATUSES = {
  open: ["acknowledged"],
  acknowledged: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

function severityBadgeClass(severity) {
  if (severity === "P1") return `${styles.badge} ${styles.badgeP1}`;
  if (severity === "P2") return `${styles.badge} ${styles.badgeP2}`;
  if (severity === "P3") return `${styles.badge} ${styles.badgeP3}`;
  return styles.badge;
}

function statusBadgeClass(status) {
  if (status === "open") return `${styles.badge} ${styles.badgeOpen}`;
  if (status === "acknowledged")
    return `${styles.badge} ${styles.badgeAcknowledged}`;
  if (status === "in_progress")
    return `${styles.badge} ${styles.badgeInProgress}`;
  if (status === "resolved") return `${styles.badge} ${styles.badgeResolved}`;
  if (status === "closed") return `${styles.badge} ${styles.badgeClosed}`;
  return styles.badge;
}

function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{children}</span>
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    incidents,
    incidentEvents,
    users,
    vehicles,
    depots,
    updateIncident,
    addIncidentEvent,
  } = useData();

  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [statusError, setStatusError] = useState("");
  const eventIdCounter = useRef(0);

  if (!user) return null;

  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className={styles.notFoundPage}>
        <div className={styles.notFoundInner}>
          <p className={styles.notFoundText}>Incident not found.</p>
          <button
            onClick={() => navigate("/ims")}
            className={styles.notFoundLink}
          >
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  const vehicle = getVehicleById(vehicles, incident.vehicle_id);
  const depot = getDepotById(depots, incident.depot_id);
  const raiser = getUserById(users, incident.raised_by);
  const assignee = incident.assigned_to
    ? getUserById(users, incident.assigned_to)
    : null;

  const events = incidentEvents
    .filter((e) => e.incident_id === id)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  const canAct =
    user.role === "admin" ||
    user.role === "control_operator" ||
    user.role === "depot_manager";

  const depotUsers = canAct
    ? users.filter((u) => {
        if (user.role === "admin" || user.role === "control_operator")
          return true;
        return u.depot_id === user.depot_id;
      })
    : [];

  const nextOptions = NEXT_STATUSES[incident.status] ?? [];

  function handleStatusUpdate() {
    if (!nextStatus) {
      setStatusError("Please select a status.");
      return;
    }
    setStatusError("");
    const now = new Date().toISOString();
    const changes = { status: nextStatus };
    if (nextStatus === "resolved") changes.resolved_at = now;

    updateIncident({ ...incident, ...changes });

    eventIdCounter.current += 1;
    addIncidentEvent({
      id: `IE-${id}-${eventIdCounter.current}`,
      incident_id: incident.id,
      ts: now,
      actor_id: user.id,
      from_status: incident.status,
      to_status: nextStatus,
      note: note.trim() || "",
    });

    setNextStatus("");
    setNote("");
  }

  function handleAssign() {
    if (!assignTo) return;
    updateIncident({ ...incident, assigned_to: assignTo });
    setAssignTo("");
  }

  return (
    <div className={`${styles.page} space-y-5`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/ims")} className={styles.backLink}>
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Incidents
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{incident.id}</span>
      </div>

      {/* Two-panel layout: left 3 cols, right 2 cols on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — incident info */}
        <div className="lg:col-span-3 space-y-4">
          <div className={styles.card}>
            <div className={styles.cardBody}>
              {/* Title row */}
              <div className={styles.incidentTitleRow}>
                <h2 className={styles.incidentType}>
                  {incident.type.replace("_", " ")}
                </h2>
                <span className={styles.incidentId}>{incident.id}</span>
              </div>

              {/* Severity + status badges */}
              <div className={styles.badgesRow}>
                <span className={severityBadgeClass(incident.severity)}>
                  {incident.severity}
                </span>
                <span className={statusBadgeClass(incident.status)}>
                  {incident.status.replace("_", " ")}
                </span>
              </div>

              {/* Description */}
              {incident.description && (
                <div className={styles.descBox}>
                  <p className={styles.descLabel}>Description</p>
                  <p className={styles.descText}>{incident.description}</p>
                </div>
              )}

              {/* Info rows */}
              <div className={styles.infoGrid}>
                <InfoRow label="Vehicle">
                  {vehicle ? (
                    <span className={styles.infoValueMono}>
                      {vehicle.reg_no}
                    </span>
                  ) : (
                    <span className={styles.infoValueEmpty}>—</span>
                  )}
                </InfoRow>
                <InfoRow label="Depot">
                  {depot ? (
                    depot.name
                  ) : (
                    <span className={styles.infoValueEmpty}>—</span>
                  )}
                </InfoRow>
                <InfoRow label="Raised By">
                  {raiser ? raiser.full_name : incident.raised_by}
                </InfoRow>
                <InfoRow label="Assigned To">
                  {assignee ? (
                    assignee.full_name
                  ) : (
                    <span className={styles.infoValueEmpty}>Unassigned</span>
                  )}
                </InfoRow>
                <InfoRow label="Created At">
                  {formatDate(incident.created_at)}{" "}
                  <span className={styles.infoValueSub}>
                    ({timeAgo(incident.created_at)})
                  </span>
                </InfoRow>
                {incident.resolved_at && (
                  <InfoRow label="Resolved At">
                    {formatDate(incident.resolved_at)}
                  </InfoRow>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — timeline + actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Timeline</h3>
            </div>
            <div className={styles.cardBody}>
              {events.length === 0 ? (
                <p className={styles.timelineEmpty}>No events recorded yet.</p>
              ) : (
                <ol className={styles.timeline}>
                  {events.map((ev) => {
                    const actor = getUserById(users, ev.actor_id);
                    return (
                      <li key={ev.id} className={styles.timelineItem}>
                        <span className={styles.timelineDot} />
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineActor}>
                            {actor ? actor.full_name : ev.actor_id}
                          </span>
                          <span className={statusBadgeClass(ev.from_status)}>
                            {ev.from_status.replace("_", " ")}
                          </span>
                          <span className={styles.timelineArrow}>
                            <svg
                              width="12"
                              height="12"
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
                          </span>
                          <span className={statusBadgeClass(ev.to_status)}>
                            {ev.to_status.replace("_", " ")}
                          </span>
                          <span className={styles.timelineTime}>
                            {timeAgo(ev.ts)}
                          </span>
                        </div>
                        {ev.note && (
                          <p className={styles.timelineNote}>{ev.note}</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* Actions */}
          {canAct && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Actions</h3>
              </div>
              <div className={styles.cardBody}>
                {nextOptions.length > 0 ? (
                  <div>
                    <div className={styles.formField}>
                      <label className={styles.label}>Update Status</label>
                      <select
                        value={nextStatus}
                        onChange={(e) => {
                          setNextStatus(e.target.value);
                          setStatusError("");
                        }}
                        className={styles.select}
                      >
                        <option value="">Select next status…</option>
                        {nextOptions.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      {statusError && (
                        <p className={styles.fieldError}>{statusError}</p>
                      )}
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.label}>Note (optional)</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Add a note…"
                        className={styles.textarea}
                      />
                    </div>
                    <button
                      onClick={handleStatusUpdate}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                    >
                      Update Status
                    </button>
                  </div>
                ) : (
                  <p className={styles.closedNote}>
                    This incident is closed. No further status updates allowed.
                  </p>
                )}

                <div className={styles.assignDivider}>
                  <label className={styles.label}>Assign To</label>
                  <div className={styles.assignRow}>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className={styles.assignSelect}
                    >
                      <option value="">Select user…</option>
                      {depotUsers
                        .filter((u) => u.role !== "driver")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.role.replace("_", " ")})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!assignTo}
                      className={`${styles.btn} ${styles.btnSecondary} ${!assignTo ? styles.btnSecondaryDisabled : ""}`}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

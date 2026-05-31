import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  timeAgo,
  severityColor,
} from "../../utils/helpers";
import styles from "./IMSPage.module.css";

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

export default function IMSPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents, users, vehicles, depots, updateIncident } = useData();

  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);

  if (!user) return null;

  const isDepotManager = user.role === "depot_manager";
  const canAssign =
    user.role === "admin" ||
    user.role === "control_operator" ||
    user.role === "depot_manager";

  const baseIncidents = isDepotManager
    ? incidents.filter((i) => i.depot_id === user.depot_id)
    : incidents;

  const filtered = baseIncidents.filter((inc) => {
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    if (severityFilter !== "all" && inc.severity !== severityFilter)
      return false;
    if (mineOnly && inc.raised_by !== user.id) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  function handleAssign(e, inc) {
    e.stopPropagation();
    updateIncident({ ...inc, assigned_to: user.id, status: "acknowledged" });
  }

  return (
    <div className={`${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Incidents</h1>
          <p className={styles.pageSubtitle}>
            Track and manage operational incidents.
          </p>
        </div>
        <Link to="/ims/raise" className={`${styles.btn} ${styles.btnPrimary}`}>
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
          Raise Incident
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <span className={`${styles.filterLabel} ml-2`}>Severity</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All severities</option>
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — Major</option>
            <option value="P3">P3 — Minor</option>
          </select>

          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className={`${styles.btn} ${mineOnly ? styles.btnMineActive : styles.btnSecondary} ml-auto`}
          >
            {mineOnly ? (
              <svg
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
            Mine only
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className={styles.emptyTitle}>No incidents found</p>
            <p className={styles.emptyHint}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Severity</th>
                  <th className={styles.th}>Status</th>
                  <th className={`${styles.th} hidden md:table-cell`}>
                    Vehicle
                  </th>
                  <th className={`${styles.th} hidden md:table-cell`}>Depot</th>
                  <th className={styles.th}>Raised By</th>
                  <th className={styles.th}>Time</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inc) => {
                  const vehicle = getVehicleById(vehicles, inc.vehicle_id);
                  const raiser = getUserById(users, inc.raised_by);
                  const depot = getDepotById(depots, inc.depot_id);
                  const isAssignable =
                    canAssign &&
                    (inc.status === "open" || inc.status === "acknowledged");
                  const isUrgent =
                    inc.severity === "P1" && inc.status === "open";

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/ims/${inc.id}`)}
                      className={`${styles.tr} ${isUrgent ? styles.trUrgent : ""}`}
                    >
                      <td className={`${styles.td} ${styles.idCell}`}>
                        {inc.id}
                      </td>
                      <td className={`${styles.td} ${styles.typeCell}`}>
                        {inc.type.replace("_", " ")}
                      </td>
                      <td className={styles.td}>
                        <span className={severityBadgeClass(inc.severity)}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={statusBadgeClass(inc.status)}>
                          {inc.status.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className={`${styles.td} ${styles.monoCell} hidden md:table-cell`}
                      >
                        {vehicle ? vehicle.reg_no : "—"}
                      </td>
                      <td className={`${styles.td} hidden md:table-cell`}>
                        {depot ? depot.name : inc.depot_id}
                      </td>
                      <td className={styles.td}>
                        {raiser ? raiser.full_name : inc.raised_by}
                      </td>
                      <td className={`${styles.td} ${styles.timeCell}`}>
                        {timeAgo(inc.created_at)}
                      </td>
                      <td className={styles.td}>
                        {isAssignable && (
                          <button
                            onClick={(e) => handleAssign(e, inc)}
                            className={styles.assignBtn}
                          >
                            Assign to me
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

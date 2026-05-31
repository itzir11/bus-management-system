import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import StatCard from "../../components/StatCard";
import styles from "./Dashboard.module.css";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatDate,
  timeAgo,
} from "../../utils/helpers";

const TODAY = "2026-05-31";

const SEVERITY_LABEL = { P1: "Critical", P2: "Major", P3: "Minor" };

const SEVERITY_BADGE_CLASS = {
  P1: styles.badgeP1,
  P2: styles.badgeP2,
  P3: styles.badgeP3,
};

const STATUS_BADGE_CLASS = {
  open: styles.badgeOpen,
  acknowledged: styles.badgeAcknowledged,
  in_progress: styles.badgeInProgress,
  resolved: styles.badgeResolved,
  closed: styles.badgeClosed,
};

const ICON_VEHICLES =
  "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0";
const ICON_DUTIES =
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const ICON_INCIDENTS =
  "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
const ICON_DRIVERS =
  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";

function SeverityBadge({ severity }) {
  const cls = SEVERITY_BADGE_CLASS[severity] ?? styles.badgeClosed;
  return (
    <span className={styles.badge + " " + cls}>
      {severity}
      {SEVERITY_LABEL[severity] ? ` · ${SEVERITY_LABEL[severity]}` : ""}
    </span>
  );
}

function StatusBadge({ status }) {
  const cls = STATUS_BADGE_CLASS[status] ?? styles.badgeClosed;
  const label = status.replace(/_/g, " ");
  return <span className={styles.badge + " " + cls}>{label}</span>;
}

function IncidentsTable({ incidents, users, vehicles, onRowClick }) {
  if (!incidents.length) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          ✅
        </span>
        No recent incidents.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Severity</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Vehicle</th>
            <th className={styles.th}>Raised By</th>
            <th className={styles.th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => {
            const vehicle = getVehicleById(vehicles, inc.vehicle_id);
            const raiser = getUserById(users, inc.raised_by);
            return (
              <tr
                key={inc.id}
                className={styles.tr}
                onClick={() => onRowClick(inc.id)}
              >
                <td className={`${styles.td} ${styles.idCell}`}>{inc.id}</td>
                <td className={`${styles.td} ${styles.typeCell}`}>
                  {inc.type.replace(/_/g, " ")}
                </td>
                <td className={styles.td}>
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className={styles.td}>
                  <StatusBadge status={inc.status} />
                </td>
                <td className={styles.td}>
                  {vehicle ? vehicle.reg_no : inc.vehicle_id}
                </td>
                <td className={styles.td}>
                  {raiser ? raiser.full_name : inc.raised_by}
                </td>
                <td
                  className={styles.td}
                  style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}
                >
                  {timeAgo(inc.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { vehicles, duties, incidents, notices, noticeReads, users, depots } =
    useData();
  const navigate = useNavigate();

  if (!user) return null;

  if (user.role === "driver") {
    return <Navigate to="/driver" replace />;
  }

  const isDepotManager = user.role === "depot_manager";
  const isAdmin = user.role === "admin";

  const filteredVehicles = isDepotManager
    ? vehicles.filter((v) => v.depot_id === user.depot_id)
    : vehicles;

  const filteredDuties = isDepotManager
    ? duties.filter((d) => d.depot_id === user.depot_id)
    : duties;

  const filteredIncidents = isDepotManager
    ? incidents.filter((i) => i.depot_id === user.depot_id)
    : incidents;

  const filteredUsers = isDepotManager
    ? users.filter((u) => u.depot_id === user.depot_id)
    : users;

  const activeDutiesToday = filteredDuties.filter(
    (d) => d.date === TODAY && d.status !== "draft",
  ).length;

  const openIncidents = filteredIncidents.filter(
    (i) => i.status === "open" || i.status === "acknowledged",
  ).length;

  const totalDrivers = filteredUsers.filter((u) => u.role === "driver").length;

  const unreadNoticesCount = notices.filter((n) => {
    const isPublished = !n.publish_at || new Date(n.publish_at) <= new Date();
    if (!isPublished) return false;
    const isRead = noticeReads.some(
      (r) => r.notice_id === n.id && r.user_id === user.id,
    );
    return !isRead;
  }).length;

  const recentIncidents = [...filteredIncidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const depot = isDepotManager ? getDepotById(depots, user.depot_id) : null;
  const depotLabel = depot ? depot.name : null;

  return (
    <div className={styles.page}>
      {/* ── Page header ──────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          Dashboard
          {depotLabel && <span className={styles.depotTag}>{depotLabel}</span>}
        </h1>
        <p className={styles.pageSubtitle}>{formatDate(TODAY)}</p>
      </div>

      {/* ── Quick actions ─────────────────────────────── */}
      <div className={styles.quickActions}>
        <Link
          to="/ims/raise"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Raise Incident
        </Link>

        {(isAdmin || user.role === "control_operator" || isDepotManager) && (
          <Link
            to="/avls"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Live Map
          </Link>
        )}

        {(isAdmin || isDepotManager) && (
          <Link
            to="/scheduling/roster"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={ICON_DUTIES} />
            </svg>
            Roster
          </Link>
        )}
      </div>

      {/* ── Stats grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Vehicles"
          value={filteredVehicles.length}
          icon={ICON_VEHICLES}
          color="blue"
          subtitle={isDepotManager ? "In your depot" : "Fleet wide"}
        />
        <StatCard
          title="Active Duties Today"
          value={activeDutiesToday}
          icon={ICON_DUTIES}
          color="green"
          subtitle={`Date: ${TODAY}`}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          icon={ICON_INCIDENTS}
          color={openIncidents > 0 ? "red" : "slate"}
          subtitle="Open or acknowledged"
        />
        <StatCard
          title="Total Drivers"
          value={totalDrivers}
          icon={ICON_DRIVERS}
          color="indigo"
          subtitle={isDepotManager ? "In your depot" : "All depots"}
        />
      </div>

      {/* ── Unread notices alert ──────────────────────── */}
      {unreadNoticesCount > 0 && (
        <div className={styles.alertBanner}>
          <svg
            className={styles.alertIcon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
          </svg>
          <span className={styles.alertText}>
            You have {unreadNoticesCount} unread notice
            {unreadNoticesCount !== 1 ? "s" : ""}.
            <Link to="/cms" className={styles.alertLink}>
              View notices
            </Link>
          </span>
        </div>
      )}

      {/* ── Recent incidents section ──────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Incidents</h2>
          <Link to="/ims" className={styles.sectionLink}>
            View all
          </Link>
        </div>
        <IncidentsTable
          incidents={recentIncidents}
          users={users}
          vehicles={vehicles}
          onRowClick={(id) => navigate(`/ims/${id}`)}
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getRouteById,
  getVehicleById,
  getDepotById,
  formatDate,
  timeAgo,
} from "../../utils/helpers";
import styles from "./Driver.module.css";

const TODAY = "2026-05-31";

function Toast({ message }) {
  return (
    <div className={styles.toast}>
      <svg
        className={styles.toastIcon}
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const {
    duties,
    notices,
    noticeReads,
    vehicles,
    routes,
    depots,
    updateDuty,
    addIncident,
  } = useData();

  const [toast, setToast] = useState(null);

  if (!user) return null;

  const todayDuty =
    duties.find((d) => d.driver_id === user.id && d.date === TODAY) ?? null;

  const todayVehicle = todayDuty
    ? getVehicleById(vehicles, todayDuty.vehicle_id)
    : null;
  const todayRoute = todayDuty
    ? getRouteById(routes, todayDuty.route_id)
    : null;
  const todayDepot = todayDuty
    ? getDepotById(depots, todayDuty.depot_id)
    : null;

  const myNotices = notices.filter(
    (n) =>
      n.audience === "all_drivers" || n.audience === `depot:${user.depot_id}`,
  );

  const unreadCount = myNotices.filter(
    (n) =>
      !noticeReads.some((r) => r.notice_id === n.id && r.user_id === user.id),
  ).length;

  const recentNotices = [...myNotices]
    .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at))
    .slice(0, 3);

  function isNoticeRead(noticeId) {
    return noticeReads.some(
      (r) => r.notice_id === noticeId && r.user_id === user.id,
    );
  }

  function handleAcknowledgeDuty() {
    if (!todayDuty) return;
    updateDuty({
      ...todayDuty,
      status: "acknowledged",
      ack_at: new Date().toISOString(),
    });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function handlePanic() {
    const confirmed = window.confirm(
      "This will raise a P1 incident. Continue?",
    );
    if (!confirmed) return;

    addIncident({
      id: `INC${Date.now()}`,
      type: "breakdown",
      severity: "P1",
      status: "open",
      raised_by: user.id,
      depot_id: user.depot_id,
      vehicle_id: todayDuty?.vehicle_id ?? null,
      description: "PANIC button triggered by driver",
      created_at: new Date().toISOString(),
      assigned_to: null,
      resolved_at: null,
    });

    showToast("P1 Incident raised. Help is on the way.");
  }

  const dutyAcknowledged =
    todayDuty &&
    (todayDuty.status === "acknowledged" || todayDuty.status === "completed");

  const firstName = user.full_name.split(" ")[0];

  return (
    <div className="p-4 md:p-6">
      <div className={styles.page}>
        {/* Greeting strip */}
        <div className={styles.greeting}>
          <p className={styles.greetingName}>Good morning, {firstName}</p>
          <p className={styles.greetingRole}>Driver</p>
          <p className={styles.greetingDepot}>{formatDate(TODAY)}</p>
        </div>

        {/* Today's duty card */}
        <div className={styles.dutyCard}>
          <div className={styles.dutyHeader}>
            <span className={styles.dutyHeaderTitle}>Today's Duty</span>
            {todayDuty && (
              <span
                className={`${styles.statusBadge} ${
                  dutyAcknowledged ? styles.statusAck : styles.statusPending
                }`}
              >
                {dutyAcknowledged ? "Acknowledged" : "Pending"}
              </span>
            )}
          </div>

          <div className={styles.dutyBody}>
            {!todayDuty ? (
              <div className={styles.noDuty}>
                <div className={styles.noDutyIcon}>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
                  No duty assigned for today
                </p>
                <p
                  style={{
                    marginTop: "var(--sp-1)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  Check back with your depot manager.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.dutyMeta}>
                  <div className={styles.dutyMetaItem}>
                    <span className={styles.dutyMetaLabel}>Route</span>
                    <span
                      className={styles.dutyMetaValue}
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {todayRoute ? todayRoute.name : todayDuty.route_id}
                    </span>
                  </div>
                  <div className={styles.dutyMetaItem}>
                    <span className={styles.dutyMetaLabel}>Vehicle</span>
                    <span
                      className={`${styles.dutyMetaValue} ${styles.dutyMetaValueMono}`}
                    >
                      {todayVehicle
                        ? todayVehicle.reg_no
                        : todayDuty.vehicle_id}
                    </span>
                  </div>
                  <div className={styles.dutyMetaItem}>
                    <span className={styles.dutyMetaLabel}>Depot</span>
                    <span
                      className={styles.dutyMetaValue}
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {todayDepot ? todayDepot.name : todayDuty.depot_id}
                    </span>
                  </div>
                  <div className={styles.dutyMetaItem}>
                    <span className={styles.dutyMetaLabel}>Shift</span>
                    <span className={styles.dutyMetaValue}>
                      {todayDuty.start_time} → {todayDuty.end_time}
                    </span>
                  </div>
                </div>

                {dutyAcknowledged ? (
                  <div className={styles.ackBadge}>
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Acknowledged
                  </div>
                ) : (
                  todayDuty.status === "published" && (
                    <button
                      onClick={handleAcknowledgeDuty}
                      className={styles.ackBtn}
                    >
                      Acknowledge Duty
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Notices card */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className="flex items-center gap-3">
              <span className={styles.sectionTitle}>Notices</span>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </div>
            <Link
              to="/cms"
              className={styles.viewAllLink}
              style={{ padding: 0, border: "none" }}
            >
              View All
            </Link>
          </div>

          <div>
            {recentNotices.length === 0 ? (
              <div
                style={{
                  padding: "var(--sp-6)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "var(--text-sm)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                No notices yet
              </div>
            ) : (
              recentNotices.map((notice) => {
                const read = isNoticeRead(notice.id);
                return (
                  <Link
                    key={notice.id}
                    to="/cms"
                    className={styles.noticeItem}
                    style={!read ? { background: "var(--primary-light)" } : {}}
                  >
                    <span
                      className={`${styles.noticeDot} ${read ? styles.noticeDotRead : ""}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={styles.noticeItemTitle}
                        style={
                          !read
                            ? { fontWeight: 600 }
                            : {
                                fontWeight: 400,
                                color: "var(--text-secondary)",
                              }
                        }
                      >
                        {notice.title}
                      </p>
                      <p className={styles.noticeItemTime}>
                        {timeAgo(notice.publish_at)}
                      </p>
                    </div>
                    {notice.requires_ack && !read && (
                      <span className={styles.noticeAckTag}>Ack</span>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <Link to="/cms" className={styles.viewAllLink}>
            View all notices
          </Link>
        </div>

        {/* Panic button */}
        <div className={styles.panicWrap}>
          <p className={styles.panicTitle}>Emergency</p>
          <p className={styles.panicDesc}>
            Use only in case of a genuine emergency. This will immediately raise
            a P1 incident and alert your depot.
          </p>
          <button onClick={handlePanic} className={styles.panicBtn}>
            PANIC — Report Emergency
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}

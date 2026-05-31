import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./SchedulingPage.module.css";

export default function SchedulingPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "control_operator") {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          <div className={styles.accessIcon}>
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className={styles.accessTitle}>Read-Only Access</h2>
          <p className={styles.accessDesc}>
            You have read-only access to this module. Scheduling and roster
            management is restricted to depot managers and administrators.
          </p>
        </div>
      </div>
    );
  }

  const modules = [
    {
      to: "/scheduling/routes",
      variant: "Primary",
      icon: (
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
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      title: "Manage Routes",
      desc: "Create and edit bus routes with stops and timings",
    },
    {
      to: "/scheduling/roster",
      variant: "Success",
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "Roster & Duties",
      desc: "Assign drivers to vehicles and publish weekly duties",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Scheduling</h1>
          <p className={styles.pageSubtitle}>
            Manage routes, driver rosters, and duty assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {modules.map((mod) => (
          <Link
            key={mod.to}
            to={mod.to}
            className={`${styles.moduleCard} ${styles[`moduleCard${mod.variant}`]}`}
          >
            <div
              className={`${styles.moduleIcon} ${styles[`moduleIcon${mod.variant}`]}`}
            >
              {mod.icon}
            </div>
            <div>
              <div className={styles.moduleCardTitle}>{mod.title}</div>
              <p className={styles.moduleCardDesc}>{mod.desc}</p>
            </div>
            <span className={styles.moduleCardLink}>Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import styles from "./StatCard.module.css";

const COLOR_MAP = {
  blue: {
    accent: "var(--primary)",
    iconBg: "var(--primary-light)",
    iconColor: "var(--primary)",
  },
  green: {
    accent: "var(--success)",
    iconBg: "var(--success-light)",
    iconColor: "var(--success)",
  },
  red: {
    accent: "var(--danger)",
    iconBg: "var(--danger-light)",
    iconColor: "var(--danger)",
  },
  amber: {
    accent: "var(--warning)",
    iconBg: "var(--warning-light)",
    iconColor: "var(--warning)",
  },
  purple: {
    accent: "var(--purple)",
    iconBg: "var(--purple-light)",
    iconColor: "var(--purple)",
  },
  indigo: {
    accent: "var(--primary)",
    iconBg: "var(--primary-light)",
    iconColor: "var(--primary)",
  },
};

export default function StatCard({
  title,
  value,
  icon,
  color = "blue",
  subtitle,
  trend,
}) {
  const { accent, iconBg, iconColor } = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className={styles.card} style={{ "--card-accent": accent }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {trend && (
            <p className={styles.trend}>
              <span aria-hidden="true">&#8593;</span> {trend}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={styles.iconWrap}
            style={{ background: iconBg, color: iconColor }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

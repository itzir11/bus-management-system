const COLOR_MAP = {
  blue: { container: "bg-blue-50", icon: "text-blue-600" },
  green: { container: "bg-emerald-50", icon: "text-emerald-600" },
  red: { container: "bg-red-50", icon: "text-red-600" },
  amber: { container: "bg-amber-50", icon: "text-amber-600" },
  purple: { container: "bg-purple-50", icon: "text-purple-600" },
  indigo: { container: "bg-indigo-50", icon: "text-indigo-600" },
};

export default function StatCard({
  title,
  value,
  icon,
  color = "blue",
  subtitle,
  trend,
}) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500 mb-1 truncate">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs font-medium text-emerald-600 mt-2">
            <span className="mr-0.5">&#8593;</span>
            {trend}
          </p>
        )}
      </div>

      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.container}`}
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
            className={colors.icon}
          >
            <path d={icon} />
          </svg>
        </div>
      )}
    </div>
  );
}

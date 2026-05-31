const COLOR_MAP = {
  blue:   "border-blue-500   bg-blue-50   text-blue-600",
  green:  "border-green-500  bg-green-50  text-green-600",
  red:    "border-red-500    bg-red-50    text-red-600",
  amber:  "border-amber-500  bg-amber-50  text-amber-600",
  orange: "border-orange-500 bg-orange-50 text-orange-600",
  indigo: "border-indigo-500 bg-indigo-50 text-indigo-600",
  slate:  "border-slate-500  bg-slate-50  text-slate-600",
  purple: "border-purple-500 bg-purple-50 text-purple-600",
};

export default function StatCard({ title, value, icon, color = "blue", subtitle }) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.slate;
  const [borderColor] = colors.split(" ");

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 ${borderColor} p-4 flex items-center gap-4`}>
      {icon && (
        <div className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${colors.split(" ").slice(1).join(" ")}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

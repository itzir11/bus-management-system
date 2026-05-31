export function getUserById(users, id) {
  return users.find((u) => u.id === id) ?? null;
}

export function getVehicleById(vehicles, id) {
  return vehicles.find((v) => v.id === id) ?? null;
}

export function getDepotById(depots, id) {
  return depots.find((d) => d.id === id) ?? null;
}

export function getRouteById(routes, id) {
  return routes.find((r) => r.id === id) ?? null;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatTime(isoOrTime) {
  if (!isoOrTime) return "";
  if (/^\d{2}:\d{2}/.test(isoOrTime)) return isoOrTime.slice(0, 5);
  const d = new Date(isoOrTime);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function timeAgo(isoTs) {
  if (!isoTs) return "";
  const diff = Date.now() - new Date(isoTs).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export function severityColor(severity) {
  const map = { P1: "red", P2: "amber", P3: "green" };
  return map[severity] ?? "slate";
}

export function statusBadgeClass(status) {
  const map = {
    active: "bg-green-100 text-green-800 border border-green-200",
    inactive: "bg-slate-100 text-slate-600 border border-slate-200",
    idle: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    maintenance: "bg-orange-100 text-orange-800 border border-orange-200",
    open: "bg-red-100 text-red-800 border border-red-200",
    in_progress: "bg-blue-100 text-blue-800 border border-blue-200",
    resolved: "bg-green-100 text-green-800 border border-green-200",
    closed: "bg-slate-100 text-slate-600 border border-slate-200",
    scheduled: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    completed: "bg-green-100 text-green-800 border border-green-200",
    cancelled: "bg-red-100 text-red-800 border border-red-200",
    on_duty: "bg-blue-100 text-blue-800 border border-blue-200",
  };
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  return `${base} ${map[status] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`;
}

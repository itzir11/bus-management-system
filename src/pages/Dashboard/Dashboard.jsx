import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import StatCard from "../../components/StatCard";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatDate,
  timeAgo,
  severityColor,
  statusBadgeClass,
} from "../../utils/helpers";

const TODAY = "2026-05-31";

const SEVERITY_LABEL = { P1: "Critical", P2: "Major", P3: "Minor" };

function SeverityBadge({ severity }) {
  const color = severityColor(severity);
  const colorMap = {
    red: "bg-red-100 text-red-800 border border-red-200",
    amber: "bg-amber-100 text-amber-800 border border-amber-200",
    green: "bg-green-100 text-green-800 border border-green-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[color] ?? colorMap.slate}`}>
      {severity} {SEVERITY_LABEL[severity] ? `· ${SEVERITY_LABEL[severity]}` : ""}
    </span>
  );
}

function IncidentsTable({ incidents, users, vehicles }) {
  if (!incidents.length) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">No recent incidents.</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Raised By</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {incidents.map((inc) => {
            const vehicle = getVehicleById(vehicles, inc.vehicle_id);
            const raiser = getUserById(users, inc.raised_by);
            return (
              <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{inc.id}</td>
                <td className="px-4 py-3 capitalize text-slate-700">{inc.type.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className="px-4 py-3">
                  <span className={statusBadgeClass(inc.status)}>
                    {inc.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {vehicle ? vehicle.reg_no : inc.vehicle_id}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {raiser ? raiser.full_name : inc.raised_by}
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
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
  const {
    vehicles,
    duties,
    incidents,
    notices,
    noticeReads,
    users,
    depots,
  } = useData();

  if (!user) return null;

  if (user.role === "driver") {
    return <Navigate to="/driver" replace />;
  }

  const isDepotManager = user.role === "depot_manager";

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
    (d) => d.date === TODAY && d.status !== "draft"
  ).length;

  const openIncidents = filteredIncidents.filter(
    (i) => i.status === "open" || i.status === "acknowledged"
  ).length;

  const totalDrivers = filteredUsers.filter((u) => u.role === "driver").length;

  const unreadNoticesCount = notices.filter((n) => {
    const isPublished = !n.publish_at || new Date(n.publish_at) <= new Date();
    if (!isPublished) return false;
    const isRead = noticeReads.some(
      (r) => r.notice_id === n.id && r.user_id === user.id
    );
    return !isRead;
  }).length;

  const recentIncidents = [...filteredIncidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const depot = isDepotManager ? getDepotById(depots, user.depot_id) : null;
  const depotLabel = depot ? depot.name : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Dashboard
          {depotLabel && (
            <span className="ml-2 text-base font-normal text-slate-500">— {depotLabel}</span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {formatDate(TODAY)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles"
          value={filteredVehicles.length}
          icon="🚌"
          color="blue"
          subtitle={isDepotManager ? "In your depot" : "Fleet wide"}
        />
        <StatCard
          title="Active Duties Today"
          value={activeDutiesToday}
          icon="📋"
          color="green"
          subtitle={`Date: ${TODAY}`}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          icon="⚠️"
          color={openIncidents > 0 ? "red" : "slate"}
          subtitle="Open or acknowledged"
        />
        <StatCard
          title="Total Drivers"
          value={totalDrivers}
          icon="👤"
          color="indigo"
          subtitle={isDepotManager ? "In your depot" : "All depots"}
        />
      </div>

      {unreadNoticesCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-amber-800 font-medium">
            You have {unreadNoticesCount} unread notice{unreadNoticesCount !== 1 ? "s" : ""}.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent Incidents</h2>
          <span className="text-xs text-slate-400">Last 5</span>
        </div>
        <IncidentsTable
          incidents={recentIncidents}
          users={users}
          vehicles={vehicles}
        />
      </div>
    </div>
  );
}

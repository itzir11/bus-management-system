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
  statusBadgeClass,
} from "../../utils/helpers";

const SEVERITY_COLORS = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  slate: "bg-slate-100 text-slate-600",
};

function SeverityBadge({ severity }) {
  const color = severityColor(severity);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[color] ?? SEVERITY_COLORS.slate}`}>
      {severity}
    </span>
  );
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
  const canAssign = user.role === "admin" || user.role === "control_operator" || user.role === "depot_manager";

  const baseIncidents = isDepotManager
    ? incidents.filter((i) => i.depot_id === user.depot_id)
    : incidents;

  const filtered = baseIncidents.filter((inc) => {
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
    if (mineOnly && inc.raised_by !== user.id) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  function handleAssign(e, inc) {
    e.stopPropagation();
    updateIncident({ ...inc, assigned_to: user.id, status: "acknowledged" });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Incidents</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage operational incidents.</p>
        </div>
        <Link
          to="/ims/raise"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Raise Incident
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-500">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setMineOnly((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${mineOnly ? "bg-blue-600" : "bg-slate-200"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${mineOnly ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm text-slate-600 font-medium">Mine only</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No incidents found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Depot</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Raised By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((inc) => {
                  const vehicle = getVehicleById(vehicles, inc.vehicle_id);
                  const raiser = getUserById(users, inc.raised_by);
                  const depot = getDepotById(depots, inc.depot_id);
                  const isAssignable = canAssign && (inc.status === "open" || inc.status === "acknowledged");
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => navigate(`/ims/${inc.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{inc.id}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{inc.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusBadgeClass(inc.status)}>
                          {inc.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {vehicle ? vehicle.reg_no : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {depot ? depot.name : inc.depot_id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {raiser ? raiser.full_name : inc.raised_by}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {timeAgo(inc.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {isAssignable && (
                          <button
                            onClick={(e) => handleAssign(e, inc)}
                            className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap font-medium"
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

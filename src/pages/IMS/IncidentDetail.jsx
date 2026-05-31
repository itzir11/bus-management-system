import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getUserById,
  getVehicleById,
  getDepotById,
  formatDate,
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

const NEXT_STATUSES = {
  open: ["acknowledged"],
  acknowledged: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

function SeverityBadge({ severity }) {
  const color = severityColor(severity);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${SEVERITY_COLORS[color] ?? SEVERITY_COLORS.slate}`}
    >
      {severity}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-slate-700">{children}</span>
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    incidents,
    incidentEvents,
    users,
    vehicles,
    depots,
    updateIncident,
    addIncidentEvent,
  } = useData();

  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [statusError, setStatusError] = useState("");
  const eventIdCounter = useRef(0);

  if (!user) return null;

  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <p className="text-slate-500 text-sm">Incident not found.</p>
          <button
            onClick={() => navigate("/ims")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  const vehicle = getVehicleById(vehicles, incident.vehicle_id);
  const depot = getDepotById(depots, incident.depot_id);
  const raiser = getUserById(users, incident.raised_by);
  const assignee = incident.assigned_to
    ? getUserById(users, incident.assigned_to)
    : null;

  const events = incidentEvents
    .filter((e) => e.incident_id === id)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  const canAct =
    user.role === "admin" ||
    user.role === "control_operator" ||
    user.role === "depot_manager";

  const depotUsers = canAct
    ? users.filter((u) => {
        if (user.role === "admin" || user.role === "control_operator")
          return true;
        return u.depot_id === user.depot_id;
      })
    : [];

  const nextOptions = NEXT_STATUSES[incident.status] ?? [];

  function handleStatusUpdate() {
    if (!nextStatus) {
      setStatusError("Please select a status.");
      return;
    }
    setStatusError("");
    const now = new Date().toISOString();
    const changes = { status: nextStatus };
    if (nextStatus === "resolved") changes.resolved_at = now;

    updateIncident({ ...incident, ...changes });

    eventIdCounter.current += 1;
    addIncidentEvent({
      id: `IE-${id}-${eventIdCounter.current}`,
      incident_id: incident.id,
      ts: now,
      actor_id: user.id,
      from_status: incident.status,
      to_status: nextStatus,
      note: note.trim() || "",
    });

    setNextStatus("");
    setNote("");
  }

  function handleAssign() {
    if (!assignTo) return;
    updateIncident({ ...incident, assigned_to: assignTo });
    setAssignTo("");
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/ims")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Incidents
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700 font-mono">
          {incident.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800 capitalize">
                {incident.type.replace("_", " ")}
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {incident.id}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={incident.severity} />
              <span className={statusBadgeClass(incident.status)}>
                {incident.status.replace("_", " ")}
              </span>
            </div>

            {incident.description && (
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Description
                </span>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                  {incident.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 pt-1 border-t border-slate-100">
              <InfoRow label="Vehicle">
                {vehicle ? (
                  <span className="font-mono">{vehicle.reg_no}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </InfoRow>
              <InfoRow label="Depot">
                {depot ? depot.name : <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="Raised By">
                {raiser ? raiser.full_name : incident.raised_by}
              </InfoRow>
              <InfoRow label="Assigned To">
                {assignee ? (
                  assignee.full_name
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </InfoRow>
              <InfoRow label="Created At">
                {formatDate(incident.created_at)}{" "}
                <span className="text-slate-400 text-xs">
                  ({timeAgo(incident.created_at)})
                </span>
              </InfoRow>
              {incident.resolved_at && (
                <InfoRow label="Resolved At">
                  {formatDate(incident.resolved_at)}
                </InfoRow>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Timeline
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No events recorded yet.
              </p>
            ) : (
              <ol className="relative border-l border-slate-200 space-y-5 ml-2">
                {events.map((ev) => {
                  const actor = getUserById(users, ev.actor_id);
                  return (
                    <li key={ev.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-700">
                            {actor ? actor.full_name : ev.actor_id}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className={statusBadgeClass(ev.from_status)}>
                              {ev.from_status.replace("_", " ")}
                            </span>
                            <svg
                              className="w-3 h-3 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            <span className={statusBadgeClass(ev.to_status)}>
                              {ev.to_status.replace("_", " ")}
                            </span>
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {timeAgo(ev.ts)}
                          </span>
                        </div>
                        {ev.note && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {ev.note}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {canAct && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Actions</h3>

              {nextOptions.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Update Status
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => {
                        setNextStatus(e.target.value);
                        setStatusError("");
                      }}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select next status...</option>
                      {nextOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {statusError && (
                      <p className="text-xs text-red-500 mt-1">{statusError}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Note
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Add a note (optional)..."
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleStatusUpdate}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  This incident is closed. No further status updates allowed.
                </p>
              )}

              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Assign To
                </label>
                <div className="flex gap-2">
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select user...</option>
                    {depotUsers
                      .filter((u) => u.role !== "driver")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role.replace("_", " ")})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!assignTo}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

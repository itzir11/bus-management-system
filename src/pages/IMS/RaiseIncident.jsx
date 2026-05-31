import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";

export default function RaiseIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vehicles, depots, addIncident } = useData();

  const isAdmin = user?.role === "admin";
  const isOperator = user?.role === "control_operator";
  const canPickDepot = isAdmin || isOperator;

  const [type, setType] = useState("breakdown");
  const [severity, setSeverity] = useState("P2");
  const [description, setDescription] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [depotId, setDepotId] = useState(canPickDepot ? "" : (user?.depot_id ?? ""));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const depotVehicles = depotId
    ? vehicles.filter((v) => v.depot_id === depotId)
    : canPickDepot
    ? vehicles
    : vehicles.filter((v) => v.depot_id === user.depot_id);

  function validate() {
    const e = {};
    if (!type) e.type = "Required.";
    if (!severity) e.severity = "Required.";
    if (!description.trim()) e.description = "Description is required.";
    if (canPickDepot && !depotId) e.depotId = "Please select a depot.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    const newIncident = {
      id: `INC${String(Date.now()).slice(-4)}`,
      type,
      severity,
      description: description.trim(),
      vehicle_id: vehicleId || null,
      depot_id: depotId || user.depot_id,
      status: "open",
      raised_by: user.id,
      assigned_to: null,
      created_at: new Date().toISOString(),
      resolved_at: null,
    };

    addIncident(newIncident);
    navigate("/ims");
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/ims")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Incidents
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-700">Raise Incident</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">Raise Incident</h1>
          <p className="text-sm text-slate-500 mt-0.5">Report a new operational incident.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="breakdown">Breakdown</option>
                <option value="accident">Accident</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="P1">P1 — Critical</option>
                <option value="P2">P2 — Major</option>
                <option value="P3">P3 — Minor</option>
              </select>
              {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
              rows={4}
              placeholder="Describe the incident in detail..."
              className={`w-full text-sm border rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? "border-red-300" : "border-slate-200"}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {canPickDepot ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Depot <span className="text-red-500">*</span>
              </label>
              <select
                value={depotId}
                onChange={(e) => { setDepotId(e.target.value); setVehicleId(""); setErrors((p) => ({ ...p, depotId: undefined })); }}
                className={`w-full text-sm border rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.depotId ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Select depot...</option>
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.depotId && <p className="text-xs text-red-500 mt-1">{errors.depotId}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Depot</label>
              <div className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                {depots.find((d) => d.id === user.depot_id)?.name ?? user.depot_id}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle (optional)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— None / Not applicable —</option>
              {depotVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.reg_no} ({v.type})</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              Raise Incident
            </button>
            <button
              type="button"
              onClick={() => navigate("/ims")}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

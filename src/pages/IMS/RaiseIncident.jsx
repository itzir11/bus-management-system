import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import styles from "./RaiseIncident.module.css";

const SEVERITY_OPTIONS = [
  { value: "P1", label: "Critical", tileClass: styles.severityTileP1 },
  { value: "P2", label: "Major", tileClass: styles.severityTileP2 },
  { value: "P3", label: "Minor", tileClass: styles.severityTileP3 },
];

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
  const [depotId, setDepotId] = useState(
    canPickDepot ? "" : (user?.depot_id ?? ""),
  );
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
    <div className={`${styles.page}`}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/ims")} className={styles.backLink}>
            <svg
              width="16"
              height="16"
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
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Raise Incident</span>
        </div>

        {/* Page heading */}
        <div>
          <h1 className={styles.pageTitle}>Raise Incident</h1>
          <p className={styles.pageSubtitle}>
            Report a new operational incident.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className={styles.card}>
          {/* Section: Incident Details */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>
              <span className={styles.sectionTitleDot} />
              Incident Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Type */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  Type <span className={styles.required}>*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={`${styles.select} ${errors.type ? styles.selectError : ""}`}
                >
                  <option value="breakdown">Breakdown</option>
                  <option value="accident">Accident</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && (
                  <p className={styles.fieldError}>{errors.type}</p>
                )}
              </div>
            </div>

            {/* Severity tiles */}
            <div className={styles.formField}>
              <label className={styles.label}>
                Severity <span className={styles.required}>*</span>
              </label>
              <div className={styles.severityTiles}>
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`${styles.severityTile} ${opt.tileClass} ${severity === opt.value ? styles.severityTileSelected : ""}`}
                  >
                    <span className={styles.severityTileCode}>{opt.value}</span>
                    <span className={styles.severityTileLabel}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.severity && (
                <p className={styles.fieldError}>{errors.severity}</p>
              )}
            </div>

            {/* Description */}
            <div className={`${styles.formField} mt-5`}>
              <label className={styles.label}>
                Description <span className={styles.required}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((p) => ({ ...p, description: undefined }));
                }}
                rows={4}
                placeholder="Describe the incident in detail…"
                className={`${styles.textarea} ${errors.description ? styles.textareaError : ""}`}
              />
              {errors.description && (
                <p className={styles.fieldError}>{errors.description}</p>
              )}
            </div>
          </div>

          {/* Section: Location & Vehicle */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>
              <span className={styles.sectionTitleDot} />
              Location &amp; Vehicle
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Depot */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  Depot{" "}
                  {canPickDepot && <span className={styles.required}>*</span>}
                </label>
                {canPickDepot ? (
                  <>
                    <select
                      value={depotId}
                      onChange={(e) => {
                        setDepotId(e.target.value);
                        setVehicleId("");
                        setErrors((p) => ({ ...p, depotId: undefined }));
                      }}
                      className={`${styles.select} ${errors.depotId ? styles.selectError : ""}`}
                    >
                      <option value="">Select depot…</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.depotId && (
                      <p className={styles.fieldError}>{errors.depotId}</p>
                    )}
                  </>
                ) : (
                  <div className={styles.depotReadonly}>
                    {depots.find((d) => d.id === user.depot_id)?.name ??
                      user.depot_id}
                  </div>
                )}
              </div>

              {/* Vehicle */}
              <div className={styles.formField}>
                <label className={styles.label}>Vehicle (optional)</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">— None / Not applicable —</option>
                  {depotVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_no} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.formFooter}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.btnSubmit}
            >
              {submitting ? "Submitting…" : "Raise Incident"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/ims")}
              className={styles.btnCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

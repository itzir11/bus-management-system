import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";

const DEMO_CREDENTIALS = [
  { role: "Admin", username: "admin", password: "admin123" },
  { role: "Manager", username: "manager1", password: "password" },
  { role: "Operator", username: "operator1", password: "password" },
  { role: "Driver", username: "driver1", password: "password" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = login(username.trim(), password);
    setLoading(false);
    if (success) {
      navigate("/");
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandGlow} aria-hidden="true" />

        <div className={styles.brandContent}>
          {/* Bus icon */}
          <div className={styles.brandIconWrap}>
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Bus body */}
              <rect
                x="4"
                y="10"
                width="36"
                height="22"
                rx="4"
                fill="white"
                fillOpacity="0.95"
              />
              {/* Windshield left */}
              <rect
                x="7"
                y="14"
                width="10"
                height="8"
                rx="1.5"
                fill="#93c5fd"
              />
              {/* Windshield right */}
              <rect
                x="20"
                y="14"
                width="10"
                height="8"
                rx="1.5"
                fill="#93c5fd"
              />
              {/* Door */}
              <rect x="33" y="16" width="5" height="10" rx="1" fill="#bfdbfe" />
              {/* Undercarriage / chassis */}
              <rect
                x="6"
                y="32"
                width="32"
                height="3"
                rx="1"
                fill="white"
                fillOpacity="0.6"
              />
              {/* Left wheel */}
              <circle cx="11" cy="35" r="4" fill="white" fillOpacity="0.9" />
              <circle cx="11" cy="35" r="2" fill="#3b82f6" />
              {/* Right wheel */}
              <circle cx="33" cy="35" r="4" fill="white" fillOpacity="0.9" />
              <circle cx="33" cy="35" r="2" fill="#3b82f6" />
              {/* Roof stripe */}
              <rect
                x="4"
                y="10"
                width="36"
                height="3"
                rx="2"
                fill="#3b82f6"
                fillOpacity="0.5"
              />
            </svg>
          </div>

          <h1 className={styles.brandTitle}>Bus Management System</h1>
          <p className={styles.brandSubtitle}>by Ishika Rohilla</p>

          <div className={styles.brandStats}>
            <div className={styles.brandStat}>
              <span className={styles.brandStatValue}>4</span>
              <span className={styles.brandStatLabel}>Depots</span>
            </div>
            <div className={styles.brandStat}>
              <span className={styles.brandStatValue}>20</span>
              <span className={styles.brandStatLabel}>Vehicles</span>
            </div>
            <div className={styles.brandStat}>
              <span className={styles.brandStatValue}>5</span>
              <span className={styles.brandStatLabel}>Roles</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.formPanel}>
        {/* Mobile-only top strip */}
        <div className={styles.mobileHeader}>
          <span className={styles.mobileHeaderTitle}>
            Bus Management System
          </span>
          <span className={styles.mobileHeaderSub}>by Ishika Rohilla</span>
        </div>

        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Enter username"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className={styles.error}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className={styles.submitBtn}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <hr className={styles.divider} />

          <p className={styles.demoLabel}>Demo Credentials</p>
          <div className={styles.demoGrid}>
            {DEMO_CREDENTIALS.map(({ role, username: u, password: p }) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUsername(u);
                  setPassword(p);
                  setError("");
                }}
                className={styles.demoBtn}
              >
                <span className={styles.demoRole}>{role}</span>
                <span className={styles.demoUser}>{u}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  admin: "Admin",
  control_operator: "Control Operator",
  depot_manager: "Depot Manager",
  driver: "Driver",
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-slate-800 text-white flex items-center px-4 gap-4 shrink-0 z-10 shadow">
      <button
        className="md:hidden p-1.5 rounded hover:bg-slate-700 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <span className="text-xl">☰</span>
      </button>

      <span className="font-bold text-lg tracking-wide select-none">NCRTC BMS</span>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user.full_name}</p>
              <p className="text-xs text-slate-400 leading-tight">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-600 text-xs font-semibold text-slate-200 uppercase tracking-wide">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </>
        )}
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded bg-slate-700 hover:bg-red-600 text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

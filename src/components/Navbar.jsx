import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  admin: "Admin",
  control_operator: "Control Operator",
  depot_manager: "Depot Manager",
  driver: "Driver",
};

const ROLE_BADGE = {
  admin: "bg-purple-100 text-purple-700",
  control_operator: "bg-blue-100 text-blue-700",
  depot_manager: "bg-emerald-100 text-emerald-700",
  driver: "bg-amber-100 text-amber-700",
};

function getInitials(fullName) {
  if (!fullName) return "U";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? "";
  const roleBadge = ROLE_BADGE[user?.role] ?? "bg-slate-100 text-slate-600";
  const initials = getInitials(user?.full_name);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 z-20 shadow-sm">
      <button
        className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 select-none">
        <span className="font-semibold text-slate-900">Bus Management System</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-300"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-slate-500">by Ishika Rohilla</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
          aria-label="Notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-slate-200" />

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0 select-none">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                  {user.full_name}
                </span>
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${roleBadge}`}
                >
                  {roleLabel}
                </span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400 hidden sm:block"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.username}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

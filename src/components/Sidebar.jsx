import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ICONS = {
  dashboard: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  avls: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  scheduling: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  ims: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  cms: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  driver: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  users: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: "dashboard",
        path: "/",
        roles: ["admin", "control_operator", "depot_manager"],
      },
    ],
  },
  {
    label: "FLEET",
    items: [
      {
        label: "AVLS",
        icon: "avls",
        path: "/avls",
        roles: ["admin", "control_operator", "depot_manager"],
      },
      {
        label: "Scheduling",
        icon: "scheduling",
        path: "/scheduling",
        roles: ["admin", "depot_manager"],
      },
    ],
  },
  {
    label: "MODULES",
    items: [
      {
        label: "IMS",
        icon: "ims",
        path: "/ims",
        roles: ["admin", "control_operator", "depot_manager"],
      },
      { label: "CMS", icon: "cms", path: "/cms", roles: ["admin"] },
      { label: "Users", icon: "users", path: "/users", roles: ["admin"] },
    ],
  },
];

const DRIVER_SECTIONS = [
  {
    label: "MY WORK",
    items: [
      { label: "My Duty", icon: "driver", path: "/my-duty", roles: ["driver"] },
      { label: "Notices", icon: "cms", path: "/notices", roles: ["driver"] },
      {
        label: "Incidents",
        icon: "ims",
        path: "/incidents",
        roles: ["driver"],
      },
    ],
  },
];

function getInitials(fullName) {
  if (!fullName) return "U";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;
  const isDriver = role === "driver";

  const sections = isDriver ? DRIVER_SECTIONS : NAV_SECTIONS;

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-30 md:z-auto
          w-60 bg-slate-950 flex flex-col shrink-0
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-16 flex items-center px-6 shrink-0 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-semibold text-sm select-none">
                Bus Management
              </span>
              <span className="text-slate-500 text-[10px] leading-none select-none mt-0.5">
                by Ishika Rohilla
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-5 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5 px-3">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                       ${
                         isActive
                           ? "bg-blue-600 text-white shadow-sm"
                           : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                       }`
                    }
                  >
                    {ICONS[item.icon]}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {user && (
          <div className="px-4 py-4 border-t border-slate-800/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold shrink-0 select-none">
                {getInitials(user.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 text-sm font-medium truncate leading-tight">
                  {user.full_name}
                </p>
                <p className="text-slate-500 text-xs truncate leading-tight mt-0.5">
                  {user.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

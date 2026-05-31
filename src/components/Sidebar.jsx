import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard",   icon: "📊", path: "/",           roles: ["admin", "control_operator", "depot_manager"] },
  { label: "AVLS",        icon: "🗺️",  path: "/avls",       roles: ["admin", "control_operator", "depot_manager"] },
  { label: "Scheduling",  icon: "📅", path: "/scheduling", roles: ["admin", "depot_manager"] },
  { label: "IMS",         icon: "⚠️",  path: "/ims",        roles: ["admin", "control_operator", "depot_manager"] },
  { label: "CMS",         icon: "📢", path: "/cms",        roles: ["admin"] },
  { label: "Users",       icon: "👥", path: "/users",      roles: ["admin"] },
  { label: "My Duty",     icon: "🚌", path: "/my-duty",    roles: ["driver"] },
  { label: "Notices",     icon: "📋", path: "/notices",    roles: ["driver"] },
  { label: "Incidents",   icon: "🚨", path: "/incidents",  roles: ["driver"] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-30 md:z-auto
          w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0
          transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-14 flex items-center px-5 bg-slate-800 md:hidden">
          <span className="font-bold text-white text-base tracking-wide">NCRTC BMS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm font-medium rounded-none transition-colors
                 ${isActive
                  ? "bg-slate-700 text-white border-l-4 border-blue-500"
                  : "hover:bg-slate-800 hover:text-white border-l-4 border-transparent"
                 }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-500">
            <p className="truncate font-medium text-slate-400">{user.full_name}</p>
            <p className="truncate">{user.username}</p>
          </div>
        )}
      </aside>
    </>
  );
}

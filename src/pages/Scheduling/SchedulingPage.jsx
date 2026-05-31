import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SchedulingPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "control_operator") {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Read-Only Access
          </h2>
          <p className="text-sm text-slate-500">
            You have read-only access to this module. Scheduling and roster
            management is restricted to depot managers and administrators.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      to: "/scheduling/routes",
      title: "Manage Routes",
      description:
        "View, add, and manage bus routes and their ordered stop sequences. Assign routes to depots and configure stop timings.",
      icon: (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      color: "blue",
    },
    {
      to: "/scheduling/roster",
      title: "Roster & Duties",
      description:
        "Plan weekly driver rosters, assign vehicles and routes to drivers, and publish duties for the upcoming week.",
      icon: (
        <svg
          className="w-6 h-6 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "indigo",
    },
  ];

  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      hover: "hover:border-blue-400 hover:bg-blue-50",
      iconBg: "bg-blue-100",
      arrow: "text-blue-500",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      hover: "hover:border-indigo-400 hover:bg-indigo-50",
      iconBg: "bg-indigo-100",
      arrow: "text-indigo-500",
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Scheduling</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage routes, driver rosters, and duty assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        {cards.map((card) => {
          const c = colorMap[card.color];
          return (
            <Link
              key={card.to}
              to={card.to}
              className={`group block bg-white border ${c.border} ${c.hover} rounded-xl p-6 shadow-sm transition-all duration-150`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-lg ${c.iconBg} flex items-center justify-center`}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      {card.title}
                    </h2>
                    <svg
                      className={`w-4 h-4 ${c.arrow} opacity-0 group-hover:opacity-100 transition-opacity`}
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
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

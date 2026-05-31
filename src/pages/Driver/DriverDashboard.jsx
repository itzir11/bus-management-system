import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  getRouteById,
  getVehicleById,
  getDepotById,
  formatDate,
  timeAgo,
} from "../../utils/helpers";

const TODAY = "2026-05-31";

function Toast({ message, onDone }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const {
    duties,
    notices,
    noticeReads,
    vehicles,
    routes,
    depots,
    updateDuty,
    addIncident,
  } = useData();

  const [toast, setToast] = useState(null);

  if (!user) return null;

  const todayDuty = duties.find(
    (d) => d.driver_id === user.id && d.date === TODAY
  ) ?? null;

  const todayVehicle = todayDuty ? getVehicleById(vehicles, todayDuty.vehicle_id) : null;
  const todayRoute = todayDuty ? getRouteById(routes, todayDuty.route_id) : null;
  const todayDepot = todayDuty ? getDepotById(depots, todayDuty.depot_id) : null;

  const myNotices = notices.filter(
    (n) => n.audience === "all_drivers" || n.audience === `depot:${user.depot_id}`
  );

  const unreadCount = myNotices.filter(
    (n) => !noticeReads.some((r) => r.notice_id === n.id && r.user_id === user.id)
  ).length;

  const recentNotices = [...myNotices]
    .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at))
    .slice(0, 3);

  function isNoticeRead(noticeId) {
    return noticeReads.some((r) => r.notice_id === noticeId && r.user_id === user.id);
  }

  function handleAcknowledgeDuty() {
    if (!todayDuty) return;
    updateDuty({
      ...todayDuty,
      status: "acknowledged",
      ack_at: new Date().toISOString(),
    });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function handlePanic() {
    const confirmed = window.confirm(
      "This will raise a P1 incident. Continue?"
    );
    if (!confirmed) return;

    addIncident({
      id: `INC${Date.now()}`,
      type: "breakdown",
      severity: "P1",
      status: "open",
      raised_by: user.id,
      depot_id: user.depot_id,
      vehicle_id: todayDuty?.vehicle_id ?? null,
      description: "PANIC button triggered by driver",
      created_at: new Date().toISOString(),
      assigned_to: null,
      resolved_at: null,
    });

    showToast("P1 Incident raised. Help is on the way.");
  }

  const dutyAcknowledged =
    todayDuty &&
    (todayDuty.status === "acknowledged" || todayDuty.status === "completed");

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-md mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Good morning, {user.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate(TODAY)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800">Today's Duty</span>
            </div>
            {todayDuty && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                dutyAcknowledged
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {dutyAcknowledged ? "Acknowledged" : "Pending"}
              </span>
            )}
          </div>

          <div className="px-5 py-5">
            {!todayDuty ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No duty assigned for today</p>
                <p className="text-xs text-slate-400 mt-1">Check back with your depot manager.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Route</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {todayRoute ? todayRoute.name : todayDuty.route_id}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Vehicle</p>
                    <p className="text-sm font-semibold text-slate-800 font-mono">
                      {todayVehicle ? todayVehicle.reg_no : todayDuty.vehicle_id}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Depot</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {todayDepot ? todayDepot.name : todayDuty.depot_id}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Shift</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {todayDuty.start_time} → {todayDuty.end_time}
                    </p>
                  </div>
                </div>

                {dutyAcknowledged ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700">Acknowledged</span>
                  </div>
                ) : (
                  todayDuty.status === "published" && (
                    <button
                      onClick={handleAcknowledgeDuty}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all"
                    >
                      Acknowledge Duty
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800">Notices</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <Link
              to="/cms"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {recentNotices.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-slate-500">No notices yet</p>
              </div>
            ) : (
              recentNotices.map((notice) => {
                const read = isNoticeRead(notice.id);
                return (
                  <Link
                    key={notice.id}
                    to="/cms"
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${
                      !read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {!read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                    {read && (
                      <span className="w-2 h-2 rounded-full bg-transparent flex-shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug truncate ${read ? "text-slate-600" : "text-slate-900 font-medium"}`}>
                        {notice.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(notice.publish_at)}</p>
                    </div>
                    {notice.requires_ack && !read && (
                      <span className="flex-shrink-0 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Ack
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={handlePanic}
          className="w-full py-5 rounded-2xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:scale-[0.97] transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🚨</span>
          PANIC — Report Emergency
        </button>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, driverRedirect }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (driverRedirect && user.role === "driver") {
    return <Navigate to={driverRedirect} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow border border-slate-200 max-w-sm w-full">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-500 text-sm">
            Your role{" "}
            <span className="font-medium text-slate-700">({user.role})</span>{" "}
            does not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

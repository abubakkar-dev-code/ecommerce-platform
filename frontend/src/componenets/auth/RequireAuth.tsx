import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

export default function RequireAuth() {
  const authenticated = useSelector((state: RootState) => state.userInfo.isAuthenticated);
  const location = useLocation();
  const status = useSelector((state: RootState) => state.userInfo.status);
  if (status === "error" && !authenticated) return <p className="mx-auto max-w-7xl p-6">An active session is required to view this page.</p>;
  return authenticated ? <Outlet /> : <Navigate to="/auth/login" replace state={{ from: location.pathname + location.search }} />;
}

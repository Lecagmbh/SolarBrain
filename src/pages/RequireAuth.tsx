import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import PaymentWarningBanner from "../components/PaymentWarningBanner";

/**
 * AUTH GUARD (Cookie-basiert)
 * - Prüft user aus AuthContext (Session-Cookie)
 * - loading = warten auf /auth/v2/me
 * - kein user = Login
 * - gesperrte User werden NICHT blockiert, nur gewarnt
 */
export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f23",
        color: "white"
      }}>
        Laden…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ENDKUNDE_PORTAL") {
    return <Navigate to="/portal" replace />;
  }

  return (
    <>
      <PaymentWarningBanner />
      <Outlet />
    </>
  );
}

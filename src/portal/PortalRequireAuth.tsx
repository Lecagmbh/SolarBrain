/**
 * Portal RequireAuth Component
 * ============================
 * Schützt Portal-Routes und prüft auf ENDKUNDE_PORTAL Rolle.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import { Loader2 } from "lucide-react";

export default function PortalRequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-zinc-400">Laden...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to portal login
  if (!user) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  // Wrong role -> redirect to main login or dashboard
  if (user.role !== "ENDKUNDE_PORTAL") {
    // If it's a normal user, redirect to main dashboard
    if (["ADMIN", "MITARBEITER", "KUNDE", "SUBUNTERNEHMER", "HANDELSVERTRETER"].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise to login
    return <Navigate to="/login" replace />;
  }

  // All good
  return <Outlet />;
}

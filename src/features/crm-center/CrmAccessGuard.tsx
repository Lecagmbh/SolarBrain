/**
 * CRM Access Guard — prüft ob der User CRM-Zugang hat.
 * Liest permissions.crmAccess aus dem User-Objekt.
 * Wenn kein Zugang → Redirect zu /dashboard oder Access-Denied Seite.
 */
import { useAuth } from "../../modules/auth/AuthContext";
import { Navigate } from "react-router-dom";
import { C } from "./crm.styles";

export default function CrmAccessGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Admin + Mitarbeiter haben immer Zugang
  if (user.role === "ADMIN" || user.role === "MITARBEITER") {
    return <>{children}</>;
  }

  // Andere Rollen: prüfe permissions.crmAccess
  const perms = (user as any).permissions || {};
  if (perms.crmAccess === true) {
    return <>{children}</>;
  }

  // Kein Zugang
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 8 }}>CRM-Zugang nicht freigeschaltet</div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
          Ihr Account hat keinen Zugang zum Baunity CRM. Bitte kontaktieren Sie Ihren Administrator, um den CRM-Zugang freizuschalten.
        </div>
        <a href="/dashboard" style={{ display: "inline-block", background: C.primary, color: "#fff", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Zurück zum Dashboard
        </a>
      </div>
    </div>
  );
}

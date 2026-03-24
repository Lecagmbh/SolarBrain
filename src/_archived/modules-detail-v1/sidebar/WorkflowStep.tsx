
import { useAuth } from "../../../auth/AuthContext";
import { canProgress } from "../logic/statusEngine";
import { isAdmin, isKunde } from "../logic/permissions";
import { useInstallationDetail } from "../context/InstallationDetailContext";

export default function WorkflowStep({
  state,
  active,
  onClick,
}: {
  state: string;
  active: boolean;
  onClick: () => void;
}) {
  const { user } = useAuth();
  const role = user?.role ?? "mitarbeiter";
  const { detail } = useInstallationDetail();

  const isCurrent = active;
  const canClick =
    isAdmin(role) ||
    (detail &&
      canProgress(detail.status as any, state as any, role)) &&
    !isKunde(role);

  const baseStyle = {
    padding: "0.55rem 0.8rem",
    borderRadius: "10px",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
    cursor: canClick ? "pointer" : "default",
    border: isCurrent
      ? "1px solid rgba(34,197,94,0.6)"
      : "1px solid rgba(148,163,184,0.4)",
    background: isCurrent
      ? "rgba(34,197,94,0.12)"
      : "rgba(15,23,42,0.85)",
  } as React.CSSProperties;

  return (
    <div style={baseStyle} onClick={() => canClick && onClick()}>
      {state.replace("_", " ")}
    </div>
  );
}


import { useInstallationDetail } from "../context/InstallationDetailContext";
import { formatDate } from "../logic/utils";
import { useAuth } from "../../../auth/AuthContext";
import SmartActions from "../smart/SmartActions";
import { isKunde } from "../logic/permissions";

export default function DetailHeader({
  onClose,
  onSelectTab,
}: {
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}) {
  const { detail } = useInstallationDetail();
  const { user } = useAuth();

  if (!detail) return null;

  return (
    <header className="installation-modal-header">
      <div style={{ flex: 1 }}>
        <div className="installation-eyebrow">
          Anlage #{detail.id}
        </div>

        <div className="installation-title">{detail.customerName}</div>

        <div className="installation-sub-small">{detail.location}</div>

        <div className="installation-sub">
          Letzte Änderung: {formatDate(detail.updatedAt)}
        </div>

        {!isKunde(user?.role ?? "mitarbeiter") && (
          <SmartActions onSelectTab={onSelectTab} />
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="admin-btn admin-btn-ghost admin-btn-sm"
        style={{ marginTop: "0.4rem" }}
      >
        Schließen ✕
      </button>
    </header>
  );
}

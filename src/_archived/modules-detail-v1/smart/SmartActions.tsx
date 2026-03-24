
import { useInstallationDetail } from "../context/InstallationDetailContext";
import { useAuth } from "../../../auth/AuthContext";
import { isAdmin, isMitarbeiter } from "../logic/permissions";

type Props = {
  onSelectTab: (tab: string) => void;
};

export default function SmartActions({ onSelectTab }: Props) {
  const { detail, reload, updateStatus } = useInstallationDetail();
  const { user } = useAuth();

  const role = user?.role ?? "mitarbeiter";

  if (!detail) return null;

  function handleAi() {
    onSelectTab("ai");
  }

  function handleEmails() {
    onSelectTab("emails");
  }

  function handleDocs() {
    onSelectTab("documents");
  }

  async function handleNextStatus() {
    if (!detail) return;
    const order = ["entwurf", "eingegangen", "in_pruefung", "beim_netzbetreiber", "freigegeben"];
    const idx = order.indexOf(detail.status);
    const next = order[idx + 1];
    if (!next) return;
    await updateStatus(next, "Automatischer Fortschritt");
  }

  return (
    <div style={{
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      marginTop: "0.4rem"
    }}>
      
      {(isAdmin(role) || isMitarbeiter(role)) && (
        <button
          className="admin-btn admin-btn-sm"
          onClick={handleNextStatus}
        >
          Nächster Status
        </button>
      )}

      <button
        className="admin-btn admin-btn-sm"
        onClick={handleDocs}
      >
        Dokumente
      </button>

      <button
        className="admin-btn admin-btn-sm"
        onClick={handleEmails}
      >
        E-Mails
      </button>

      <button
        className="admin-btn admin-btn-sm"
        onClick={handleAi}
      >
        KI Analyse
      </button>

      <button
        className="admin-btn admin-btn-ghost admin-btn-sm"
        onClick={() => reload()}
      >
        Reload
      </button>

      {isAdmin(role) && (
        <button
          className="admin-btn admin-btn-primary admin-btn-sm"
          onClick={() => updateStatus("freigegeben", "Admin-Override")}
        >
          Sofort freigeben
        </button>
      )}
    </div>
  );
}

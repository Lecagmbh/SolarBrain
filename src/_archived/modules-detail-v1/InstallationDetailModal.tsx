import React from "react";
import { InstallationDetailProvider } from "./context/InstallationDetailContext";

import DetailHeader from "./header/DetailHeader";
import WorkflowSidebar from "./sidebar/WorkflowSidebar";

import OverviewTab from "./tabs/OverviewTab";
import DocumentsTab from "./tabs/DocumentsTab";
import EmailsTab from "./tabs/EmailsTab";
import AiTab from "./tabs/AiTab";
import HistoryTab from "./tabs/HistoryTab";
import RawTab from "./tabs/RawTab";
import AdminTab from "./tabs/AdminTab";

import { useAuth } from "../../auth/AuthContext";
import { isAdmin, isKunde } from "./logic/permissions";

type Props = {
  open: boolean;
  installationId: number | null;
  onClose: () => void;
};

const TABS = [
  { key: "overview", label: "Übersicht" },
  { key: "documents", label: "Dokumente" },
  { key: "emails", label: "E-Mails" },
  { key: "ai", label: "KI Analyse" },
  { key: "history", label: "Verlauf" },
  { key: "raw", label: "Rohdaten" },
  { key: "admin", label: "Admin" },
];

export default function InstallationDetailModal({
  open,
  installationId,
  onClose,
}: Props) {
  const { user } = useAuth();
  const role = user?.role ?? "mitarbeiter";

  if (!open || !installationId) return null;

  const [tab, setTab] = React.useState("overview");

  // Kunde darf NICHT durch Backdrop schließen
  function handleBackdropClick() {
    if (isKunde(role)) return;
    onClose();
  }

  return (
    <div
      className="installation-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="installation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <InstallationDetailProvider installationId={installationId}>
          <DetailHeader onClose={onClose} onSelectTab={(t) => setTab(t)} />

          <div className="installation-tabs">
            {TABS.map((t) => {
              if (t.key === "admin" && !isAdmin(role)) return null;

              return (
                <button
                  key={t.key}
                  className={
                    "installation-tab" +
                    (tab === t.key ? " installation-tab--active" : "")
                  }
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="installation-tab-content">
            {tab === "overview" && <OverviewTab />}
            {tab === "documents" && <DocumentsTab />}
            {tab === "emails" && <EmailsTab />}
            {tab === "ai" && <AiTab />}
            {tab === "history" && <HistoryTab />}
            {tab === "raw" && <RawTab />}
            {tab === "admin" && isAdmin(role) && <AdminTab />}
          </div>

          <WorkflowSidebar />
        </InstallationDetailProvider>
      </div>
    </div>
  );
}

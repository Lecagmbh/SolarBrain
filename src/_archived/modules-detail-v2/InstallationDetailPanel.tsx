import { createPortal } from "react-dom";
import { useEffect } from "react";
import { DetailProvider, useDetail } from "./context/DetailContext";
import { useKeyboardNavigation } from "./hooks/useKeyboard";
import { useAuth } from "../../auth/AuthContext";

// Components
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import CommandPalette from "./components/CommandPalette";
import SmartSidebar from "./components/SmartSidebar";
import DocumentPreview from "./components/DocumentPreview";

// Tabs
import OverviewTab from "./tabs/OverviewTab";
import DocumentsTab from "./tabs/DocumentsTab";
import EmailsTab from "./tabs/EmailsTab";
import CommunicationTab from "./tabs/CommunicationTab";
import TimelineTab from "./tabs/TimelineTab";
import DataTab from "./tabs/DataTab";
import AdminTab from "./tabs/AdminTab";
import IntelligenceTab from "./tabs/IntelligenceTab";

// Styles
import "./styles/detail.css";

// Utils
import { isAdmin } from "./utils";

interface Props {
  open: boolean;
  installationId: number | null;
  onClose: () => void;
}

export default function InstallationDetailPanel({
  open,
  installationId,
  onClose,
}: Props) {
  if (!open || !installationId) return null;

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    <DetailProvider installationId={installationId}>
      <DetailModal installationId={installationId} onClose={onClose} />
    </DetailProvider>,
    modalRoot
  );
}

function DetailModal({
  installationId,
  onClose,
}: {
  installationId: number;
  onClose: () => void;
}) {
  const { activeTab } = useDetail();
  const { user } = useAuth();
  const role = (user?.role ?? "mitarbeiter") as
    | "admin"
    | "mitarbeiter"
    | "kunde";

  useKeyboardNavigation(onClose);

  useEffect(() => {
    document.body.classList.add("ld-no-scroll");
    return () => document.body.classList.remove("ld-no-scroll");
  }, []);

  return (
    <div className="gridnetz-detail-modal" role="dialog" aria-modal="true">
      <div className="gridnetz-detail-backdrop" onClick={onClose} />

      <div className="gridnetz-detail-panel">
        <Header onClose={onClose} />
        <Tabs />

        <div
          className={`ld-content ${
            activeTab === "overview" ? "ld-content--overview" : ""
          }`}
        >
          <div className="ld-main">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "documents" && <DocumentsTab />}
            {activeTab === "emails" && (
              <EmailsTab installationId={installationId} />
            )}
            {activeTab === "communication" && <CommunicationTab />}
            {activeTab === "timeline" && <TimelineTab />}
            {activeTab === "data" && <DataTab />}
            {activeTab === "intelligence" && <IntelligenceTab />}
            {activeTab === "admin" && isAdmin(role) && <AdminTab />}
          </div>

          <div className="ld-side">
            <SmartSidebar />
          </div>
        </div>
      </div>

      <CommandPalette onClose={onClose} />
      <DocumentPreview />
    </div>
  );
}

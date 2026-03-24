import React, { useState, useEffect, useCallback } from "react";
import { C, FONT, STATUS_ACTIONS, GLOW_PULSE_KEYFRAMES, normalizeWizardData } from "./constants";
import type { DashboardInstallation, DashboardEmail, TabId } from "./constants";
import { TopBar } from "./components/TopBar";
import { AlertBar } from "./components/AlertBar";
import { TabBar } from "./components/TabBar";
import { DatenTab } from "./tabs/DatenTab";
import { KommunikationTab } from "./tabs/KommunikationTab";
import { DokumenteTab } from "./tabs/DokumenteTab";
import { NbDataModal } from "./components/NbDataModal";

interface DashboardV2Props {
  installation: DashboardInstallation;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  showToast: (msg: string, type: "success" | "error") => void;
  onOpenUploadModal?: () => void;
  isAdmin?: boolean;
}

// Parse wizardContext from string to object
function parseWizardContext(wc: any): any {
  if (!wc) return {};
  if (typeof wc === "string") {
    try { return JSON.parse(wc); } catch { return {}; }
  }
  return wc;
}

// Map backend email response to frontend DashboardEmail interface
function mapEmailFromApi(raw: any): DashboardEmail {
  const dir = raw.direction?.toLowerCase();
  return {
    id: typeof raw.id === "string" ? parseInt(raw.id, 10) : raw.id,
    subject: raw.subject || "",
    fromAddress: raw.from || raw.fromAddress || "",
    fromName: raw.fromName,
    receivedAt: raw.date || raw.receivedAt || "",
    isRead: raw.isRead ?? false,
    direction: dir === "inbound" || dir === "incoming" ? "incoming" : dir === "outbound" || dir === "outgoing" ? "outgoing" : undefined,
    aiType: raw.aiType?.toLowerCase(),
    aiSummary: raw.aiSummary,
    // bodyHtml/bodyText/attachments/aiAnalysis come from detail endpoint
    bodyHtml: raw.bodyHtml,
    bodyText: raw.bodyText,
    attachments: raw.attachments,
    aiAnalysis: raw.aiAnalysis,
  };
}

export function DashboardV2({
  installation,
  onClose,
  onStatusChange,
  showToast,
  onOpenUploadModal,
  isAdmin,
}: DashboardV2Props) {
  const [activeTab, setActiveTab] = useState<TabId>("daten");
  const [showNbData, setShowNbData] = useState(false);
  const [emails, setEmails] = useState<DashboardEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [emailDetailCache, setEmailDetailCache] = useState<Record<number, DashboardEmail>>({});

  // Inject glow-pulse keyframes once
  useEffect(() => {
    const styleId = "baunity-glow-pulse";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = GLOW_PULSE_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // Normalize wizard data
  const rawWizardData = parseWizardContext(installation.wizardContext);
  const wizardData = normalizeWizardData(rawWizardData, installation);

  // Fetch emails list
  useEffect(() => {
    let cancelled = false;
    setEmailsLoading(true);
    fetch(`/api/emails/for-installation/${installation.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const rawList = Array.isArray(data) ? data : data?.data || [];
          const mapped = rawList.map(mapEmailFromApi);
          setEmails(mapped);
          if (mapped.length > 0 && !selectedEmailId) {
            setSelectedEmailId(mapped[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setEmails([]);
      })
      .finally(() => {
        if (!cancelled) setEmailsLoading(false);
      });
    return () => { cancelled = true; };
  }, [installation.id]);

  // Fetch email detail when selected (to get bodyHtml, bodyText, attachments, aiAnalysis)
  useEffect(() => {
    if (!selectedEmailId) return;
    // Already cached?
    if (emailDetailCache[selectedEmailId]) return;
    let cancelled = false;
    fetch(`/api/emails/${selectedEmailId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!cancelled && data) {
          const detail = data?.data || data;
          const mapped = mapEmailFromApi(detail);
          setEmailDetailCache((prev) => ({ ...prev, [selectedEmailId]: mapped }));
        }
      })
      .catch(() => { /* ignore detail fetch errors */ });
    return () => { cancelled = true; };
  }, [selectedEmailId, emailDetailCache]);

  // Merge list email with detail data for the selected email
  const enrichedEmails = emails.map((e) => {
    const detail = emailDetailCache[e.id];
    if (!detail) return e;
    return {
      ...e,
      bodyHtml: detail.bodyHtml || e.bodyHtml,
      bodyText: detail.bodyText || e.bodyText,
      attachments: detail.attachments || e.attachments,
      aiAnalysis: detail.aiAnalysis || e.aiAnalysis,
      fromAddress: detail.fromAddress || e.fromAddress,
      fromName: detail.fromName || e.fromName,
      receivedAt: detail.receivedAt || e.receivedAt,
    };
  });

  // Alert detection
  const status = installation.status?.toLowerCase() || "eingang";
  const hasRueckfrage = status === "rueckfrage";
  const nbMissing = status === "beim_nb" && (!installation.nbEmail || !installation.nbCaseNumber);

  // Primary action for top bar (only for admin)
  const actions = STATUS_ACTIONS[status] || [];
  const primaryAction = isAdmin && actions[0]
    ? { label: actions[0].label, onClick: () => onStatusChange(actions[0].target) }
    : undefined;

  // Email handlers
  const handleSendReply = useCallback(async (emailId: number, text: string) => {
    const email = enrichedEmails.find((e) => e.id === emailId);
    if (!email) return;
    const res = await fetch(`/api/installation/${installation.id}/reply-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        replyToEmailId: emailId,
        subject: `Re: ${email.subject}`,
        body: text,
      }),
    });
    if (!res.ok) throw new Error("Send failed");
    // Refresh emails
    const refreshRes = await fetch(`/api/emails/for-installation/${installation.id}`, { credentials: "include" });
    const refreshData = await refreshRes.json();
    const rawList = Array.isArray(refreshData) ? refreshData : refreshData?.data || [];
    setEmails(rawList.map(mapEmailFromApi));
  }, [enrichedEmails, installation.id]);

  const handleGenerateAI = useCallback(async (emailId: number, prompt: string): Promise<string> => {
    const res = await fetch("/api/claude-code/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailId, instruction: prompt }),
    });
    if (!res.ok) throw new Error("Generate failed");
    const result = await res.json();
    return result.data?.response || result.response || result.reply || "";
  }, []);

  // Tab config with counts
  const tabs = [
    { id: "daten" as TabId, label: "Daten & Status" },
    { id: "kommunikation" as TabId, label: "Kommunikation", count: enrichedEmails.length || undefined },
    { id: "dokumente" as TabId, label: "Dokumente & Details", count: (installation.documents || []).length || undefined },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: C.bg,
        fontFamily: FONT,
        color: C.t,
        overflow: "hidden",
      }}
    >
      {/* Top Bar (sticky) */}
      <TopBar
        publicId={installation.publicId}
        customerName={installation.customerName}
        status={status}
        totalKwp={wizardData.technical.totalPvKwp || installation.totalKwp}
        onClose={onClose}
        onUpload={onOpenUploadModal}
        onStornieren={isAdmin ? () => onStatusChange("storniert") : undefined}
        onNbData={() => setShowNbData(true)}
        primaryAction={primaryAction}
      />

      {/* Alert Bar */}
      {hasRueckfrage && (
        <AlertBar
          title="Rückfrage vom Netzbetreiber"
          message={installation.nbRueckfrageText || "Weitere Informationen benötigt"}
          onUpload={onOpenUploadModal}
          onShowEmail={() => setActiveTab("kommunikation")}
        />
      )}
      {nbMissing && !hasRueckfrage && (
        <AlertBar
          title="NB-Daten unvollständig"
          message={`${!installation.nbEmail ? "NB-Email fehlt" : ""}${!installation.nbEmail && !installation.nbCaseNumber ? " + " : ""}${!installation.nbCaseNumber ? "Vorgangsnummer fehlt" : ""}`}
        />
      )}

      {/* Tab Bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {activeTab === "daten" && (
          <DatenTab
            data={installation}
            wiz={wizardData}
            emails={enrichedEmails}
            onStatusChange={onStatusChange}
            onTabChange={setActiveTab}
            onUpload={onOpenUploadModal}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === "kommunikation" && (
          <KommunikationTab
            data={installation}
            emails={enrichedEmails}
            selectedEmailId={selectedEmailId}
            onSelectEmail={setSelectedEmailId}
            onSendReply={handleSendReply}
            onGenerateAI={handleGenerateAI}
            showToast={showToast}
          />
        )}
        {activeTab === "dokumente" && (
          <DokumenteTab
            data={installation}
            wiz={wizardData}
            onUpload={onOpenUploadModal}
            showToast={showToast}
          />
        )}
      </div>

      {/* NB-Daten Modal */}
      {showNbData && (
        <NbDataModal
          data={installation}
          wiz={wizardData}
          onClose={() => setShowNbData(false)}
        />
      )}
    </div>
  );
}

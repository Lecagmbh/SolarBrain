import React, { useEffect, useMemo, useState } from "react";
import type {
  WizardStepProps,
  DocumentCategory,
  DocumentDefinition,
} from "../../../wizard/domain/wizardDomain.types";
import {
  getDocumentsForCaseType,
  groupDocumentsByCategory,
} from "../../../wizard/domain/documentDefinitions";
import { useWizard } from "../../WizardContext";
import { api } from "../../../api/client";
import "../../../../styles/wizard-documents.css";

/* ============================================================================
   TABS
============================================================================ */

const CATEGORY_TABS: {
  key: DocumentCategory;
  label: string;
  uploadDisabled?: boolean;
}[] = [
  { key: "SITE", label: "Standort & Lage" },
  { key: "TECHNICAL", label: "Technische Unterlagen" },
  { key: "ADMIN", label: "Verträge & Formulare" },
  {
    key: "SERVICE",
    label: "Optionale LeCa-Services",
    uploadDisabled: true, // ⛔ KEIN UPLOAD
  },
];

/* ============================================================================
   PFLICHT
============================================================================ */

const REQUIRED_KEYS = ["lageplan", "schaltplan"];

/* ============================================================================
   MAPPING – KEIN Fallback-Murks mehr
============================================================================ */

function mapUpload(def: DocumentDefinition): {
  dokumentTyp: string;
  kategorie: string;
} {
  return {
    dokumentTyp: def.id,       // lageplan | schaltplan | ...
    kategorie: def.category,   // SITE | TECHNICAL | ADMIN
  };
}

/* ============================================================================
   COMPONENT
============================================================================ */

export const StepUploads: React.FC<WizardStepProps> = ({
  context,
  onBack,
  onNext,
}) => {
  const { ensureDraftInstallation } = useWizard();

  const [activeTab, setActiveTab] = useState<DocumentCategory>("SITE");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    ensureDraftInstallation().catch(console.error);
  }, [ensureDraftInstallation]);

  const docDefs = useMemo(
    () => getDocumentsForCaseType(context.caseType),
    [context.caseType]
  );

  const grouped = useMemo(
    () => groupDocumentsByCategory(docDefs),
    [docDefs]
  );

  async function upload(def: DocumentDefinition, file: File) {
    const installationId = await ensureDraftInstallation();
    const mapped = mapUpload(def);

    setBusyId(def.id);

    try {
      const fd = new FormData();
      fd.append("installationId", String(installationId));
      fd.append("file", file);

      // 🔑 EINDEUTIG
      fd.append("dokumentTyp", mapped.dokumentTyp);
      fd.append("kategorie", mapped.kategorie);

      await api.post("/documents/upload", fd);

      setUploaded((prev) => new Set(prev).add(def.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="wizard-modern-step-card">
      <h2 className="wizard-section-title">Dokumente</h2>
      <p className="wizard-section-sub">
        <b>Lageplan</b> & <b>Schaltplan</b> sind verpflichtend.
      </p>

      <div className="wu-tabs">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            className={activeTab === t.key ? "wu-tab-active" : ""}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="wu-grid">
        {(grouped[activeTab] ?? []).map((def) => {
          const isRequired = REQUIRED_KEYS.includes(def.id);
          const isUploaded = uploaded.has(def.id);
          const isBusy = busyId === def.id;

          const tabCfg = CATEGORY_TABS.find((t) => t.key === activeTab);
          const uploadDisabled = tabCfg?.uploadDisabled === true;

          return (
            <label
              key={def.id}
              className={`wu-card wu-card-upload ${
                isUploaded ? "wu-card-success" : ""
              } ${uploadDisabled ? "wu-card-disabled" : ""}`}
            >
              <div className="wu-card-head">
                <div className="wu-card-title">{def.label}</div>
                {isRequired && (
                  <span className="wu-badge wu-badge-req">Pflicht</span>
                )}
                {uploadDisabled && (
                  <span className="wu-badge">Optional</span>
                )}
              </div>

              {def.description && (
                <div className="wu-card-sub">{def.description}</div>
              )}

              {!uploadDisabled && (
                <input
                  type="file"
                  hidden
                  disabled={isBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(def, f);
                  }}
                />
              )}

              <div className="wu-upload-hint">
                {uploadDisabled
                  ? "Optionaler Service – kein Upload erforderlich"
                  : isBusy
                  ? "Upload läuft…"
                  : isUploaded
                  ? "✔ Hochgeladen"
                  : "Klicken zum Hochladen"}
              </div>
            </label>
          );
        })}
      </div>

      <div className="wizard-footer">
        <button className="wizard-btn wizard-btn-secondary" onClick={onBack}>
          Zurück
        </button>
        <button className="wizard-btn wizard-btn-primary" onClick={onNext}>
          Weiter
        </button>
      </div>
    </div>
  );
};

export default StepUploads;

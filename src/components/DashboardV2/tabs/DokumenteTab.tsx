import React, { useState } from "react";
import { C, FONT, MONO, DOC_CATEGORIES, formatDate, boolLabel } from "../constants";
import type { DashboardInstallation, DashboardDocument, NormalizedWizardData } from "../constants";
import { Box } from "../components/Box";
import { CopyField } from "../components/CopyField";
import { Btn } from "../components/Btn";
import { DocCheck } from "../components/DocCheck";

interface DokumenteTabProps {
  data: DashboardInstallation;
  wiz: NormalizedWizardData;
  onUpload?: () => void;
  onMastrSearch?: () => void;
  onMastrConfirm?: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

type DocFilter = "alle" | string;

export function DokumenteTab({ data, wiz, onUpload, onMastrSearch, onMastrConfirm, showToast }: DokumenteTabProps) {
  const [docFilter, setDocFilter] = useState<DocFilter>("alle");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const documents = data.documents || [];

  // Get unique categories from existing documents
  const existingCategories = [...new Set(documents.map((d) => d.kategorie))];

  const filteredDocs = docFilter === "alle"
    ? documents
    : documents.filter((d) => d.kategorie === docFilter);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 300px",
        gap: 0,
        height: "100%",
        fontFamily: FONT,
      }}
    >
      {/* === LEFT: Pflichtdokumente + Upload === */}
      <div
        style={{
          borderRight: `1px solid ${C.bd}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 16,
          gap: 12,
        }}
      >
        {/* Pflichtdokumente */}
        <Box
          title={`Pflichtdokumente (${documents.filter((d) => ["lageplan", "schaltplan", "datenblatt_module", "datenblatt_wechselrichter"].includes(d.kategorie)).length}/${4})`}
        >
          <DocCheck documents={documents} />
          <div style={{ padding: "6px 6px 4px" }}>
            <Btn
              label="+ Hochladen"
              variant="ghost"
              small
              onClick={onUpload}
            />
          </div>
        </Box>

        {/* Fotos */}
        {wiz.photos && wiz.photos.length > 0 && (
          <Box title={`Fotos (${wiz.photos.length})`}>
            <div style={{ padding: "4px 6px" }}>
              {wiz.photos.map((photo: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "3px 0",
                    fontSize: 12,
                    color: C.t2,
                  }}
                >
                  <span style={{ color: photo.istPflicht ? C.wr : C.t3, fontSize: 10 }}>
                    {photo.istPflicht ? "★" : "☆"}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {photo.kategorie || photo.filename}
                  </span>
                </div>
              ))}
            </div>
          </Box>
        )}
      </div>

      {/* === MIDDLE: Alle Dokumente mit Filter === */}
      <div
        style={{
          borderRight: `1px solid ${C.bd}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 16,
          gap: 12,
        }}
      >
        <Box title={`Alle Dokumente (${documents.length})`}>
          {/* Filter Chips */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "6px 6px 4px",
              flexWrap: "wrap",
            }}
          >
            <FilterChip
              label="Alle"
              active={docFilter === "alle"}
              onClick={() => setDocFilter("alle")}
              count={documents.length}
            />
            {existingCategories.map((cat) => (
              <FilterChip
                key={cat}
                label={DOC_CATEGORIES[cat] || cat}
                active={docFilter === cat}
                onClick={() => setDocFilter(cat)}
                count={documents.filter((d) => d.kategorie === cat).length}
              />
            ))}
          </div>

          {/* Document List */}
          <div style={{ padding: "4px 0" }}>
            {filteredDocs.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: C.t3, fontSize: 12 }}>
                Keine Dokumente
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    borderBottom: `1px solid ${C.bd}`,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onClick={() => {
                    if (doc.url) window.open(doc.url, "_blank");
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = C.s3;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 14, color: C.t3, flexShrink: 0 }}>
                    {doc.dateiname?.endsWith(".pdf") ? "📄" : "📁"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.t,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.originalName || doc.dateiname}
                    </div>
                    <div style={{ fontSize: 10, color: C.t3 }}>
                      {DOC_CATEGORIES[doc.kategorie] || doc.kategorie} {"·"} {formatDate(doc.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Box>
      </div>

      {/* === RIGHT: IBN + Autorisierung + Notizen === */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 12,
          gap: 12,
        }}
      >
        {/* Inbetriebnahme */}
        <Box title="Inbetriebnahme">
          <CopyField label="Geplant" value={formatDate(wiz.commissioning?.plannedDate)} />
          <CopyField label="Tatsächlich" value={formatDate(wiz.commissioning?.actualDate)} />
          {wiz.commissioning?.eegDate && <CopyField label="EEG-IBN" value={formatDate(wiz.commissioning.eegDate)} />}
          <CopyField label="MaStR reg." value={boolLabel(wiz.commissioning?.mastrRegistered)} />
          {wiz.commissioning?.mastrNumber && <CopyField label="MaStR-Nr." value={wiz.commissioning.mastrNumber} mono />}
          {wiz.commissioning?.mastrNumberSpeicher && <CopyField label="MaStR Sp." value={wiz.commissioning.mastrNumberSpeicher} mono />}
          {wiz.commissioning?.mastrDate && <CopyField label="MaStR-Datum" value={formatDate(wiz.commissioning.mastrDate)} />}
          <CopyField label="NB gemeldet" value={boolLabel(wiz.commissioning?.gridOperatorNotified)} />
          {wiz.commissioning?.gridOperatorNotifiedDate && <CopyField label="NB-Meldedatum" value={formatDate(wiz.commissioning.gridOperatorNotifiedDate)} />}
          {wiz.commissioning?.gridOperatorConfirmed != null && <CopyField label="NB bestätigt" value={boolLabel(wiz.commissioning.gridOperatorConfirmed)} />}
          {wiz.commissioning?.status && <CopyField label="IBN-Status" value={wiz.commissioning.status} />}

          {(data as any).ibnErledigt != null && (
            <CopyField label="IBN erledigt" value={boolLabel((data as any).ibnErledigt)} />
          )}

          {/* MaStR Actions */}
          <div style={{ padding: "6px 6px", display: "flex", gap: 6 }}>
            {onMastrSearch && (
              <Btn label="Auto-Suche" variant="ghost" small onClick={onMastrSearch} />
            )}
            {onMastrConfirm && (
              <Btn label="Bestätigen" variant="ghost" small onClick={onMastrConfirm} />
            )}
          </div>
        </Box>

        {/* Autorisierung */}
        <Box title="Autorisierung">
          <CopyField label="Vollmacht" value={boolLabel(wiz.authorization?.powerOfAttorney)} />
          <CopyField label="AGB" value={boolLabel(wiz.authorization?.termsAccepted)} />
          <CopyField label="Datenschutz" value={boolLabel(wiz.authorization?.privacyAccepted)} />
          <CopyField label="MaStR-Reg." value={wiz.authorization?.mastrRegistration ? "Durch Baunity" : "Durch Kunde"} />
          <CopyField label="Kundenportal" value={boolLabel(wiz.authorization?.kundenportalAnlegen)} />
          {wiz.authorization?.signature && <CopyField label="Signatur" value="Vorhanden" />}
        </Box>

        {/* Notizen */}
        <Box title="Notizen">
          <div style={{ padding: "8px 6px" }}>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Interne Notizen..."
              rows={5}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${C.bd}`,
                background: C.s3,
                color: C.t,
                fontSize: 12,
                fontFamily: FONT,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={() => {
                  setNotesSaved(true);
                  showToast("Notiz gespeichert", "success");
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 5,
                  border: `1px solid ${C.bd}`,
                  background: notesSaved ? C.okB : "transparent",
                  color: notesSaved ? C.ok : C.t2,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {notesSaved ? "✓ Gespeichert" : "Speichern"}
              </button>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}

// Filter chip component
function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 8px",
        borderRadius: 12,
        border: `1px solid ${active ? C.ac + "40" : C.bd}`,
        background: active ? C.acG : "transparent",
        color: active ? C.ac : C.t3,
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: FONT,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count != null && (
        <span style={{ fontSize: 9, opacity: 0.7 }}>{count}</span>
      )}
    </button>
  );
}

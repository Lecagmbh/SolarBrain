import React, { useMemo, useState, useEffect } from "react";
import type { WizardStepProps, MKType } from "../../../wizard/domain/wizardDomain.types";

import {
  getMesskonzeptDefinitionsForCaseType,
  findMesskonzeptDefinition,
} from "../../../wizard/domain/messkonzeptDefinitions";

import { getMesskonzeptSuggestion } from "../../../wizard/engine/messkonzeptEngine";
import { MKRenderer } from "../mk-renderer/MKRenderer";

import "../../../../styles/wizard-mk.css";

/**
 * PREMIUM MESSKONZEPT-STEP
 * Modernes 2-Spalten Layout
 * - Linke Seite: Karten (Empfohlen, Alternativen, Weitere)
 * - Rechte Seite: Visualisierung + Details
 * - Dynamische Badges, Hover-Glow, High-End UI
 */

// kleine Helper-Funktion für eine lesbare Anmeldeart
const getCaseTypeLabel = (caseType?: string | null): string => {
  if (!caseType) return "Keine Anmeldeart gewählt";

  switch (caseType) {
    case "PV_PRIVATE":
      return "Privater PV-Anschluss";
    // hier kannst du später weitere Cases ergänzen:
    // case "PV_COMMERCIAL":
    //   return "Gewerblicher PV-Anschluss";
    default:
      return caseType;
  }
};

export const StepMesskonzept: React.FC<WizardStepProps> = ({
  context,
  onUpdateContext,
  onNext,
  onBack,
}) => {
  /* ---------------------------------------------------------
   * Daten aus Domain + Engine
   * --------------------------------------------------------- */

  const suggestion = useMemo(
    () => getMesskonzeptSuggestion(context),
    [context.caseType]
  );

  const definitions = useMemo(
    () => getMesskonzeptDefinitionsForCaseType(context.caseType),
    [context.caseType]
  );

  const recommendedId = suggestion.recommended;
  const recommendedDef =
    findMesskonzeptDefinition(recommendedId) ??
    findMesskonzeptDefinition("MK1");

  const alternativeDefs = suggestion.alternatives
    .map((id) => findMesskonzeptDefinition(id))
    .filter((d) => Boolean(d)) as NonNullable<
    ReturnType<typeof findMesskonzeptDefinition>
  >[];

  const otherDefs = definitions.filter(
    (d) =>
      d.id !== recommendedId &&
      !alternativeDefs.some((alt) => alt.id === d.id)
  );

  const selectedMk: MKType =
    (context.messkonzept as MKType | undefined) ?? recommendedId;

  const [previewMk, setPreviewMk] = useState<MKType>(selectedMk);

  useEffect(() => {
    setPreviewMk(selectedMk);
  }, [selectedMk]);

  const setSelected = (mk: MKType) => {
    onUpdateContext({ messkonzept: mk });
  };

  const currentDef = findMesskonzeptDefinition(previewMk);

  const isValid = Boolean(selectedMk);

  /* ---------------------------------------------------------
   * Badges (Empfohlen / Ausgewählt / Optional)
   * --------------------------------------------------------- */
  const renderBadge = (mkId: MKType) => {
    if (mkId === selectedMk)
      return <span className="mkx-badge mkx-badge-selected">Ausgewählt</span>;

    if (mkId === recommendedId)
      return <span className="mkx-badge mkx-badge-recommended">Empfohlen</span>;

    return <span className="mkx-badge">Optional</span>;
  };

  /* ---------------------------------------------------------
   * MK-Karte
   * --------------------------------------------------------- */

  const renderCard = (mkId: MKType) => {
    const def = findMesskonzeptDefinition(mkId);
    if (!def) return null;

    const active = mkId === selectedMk;

    return (
      <div
        key={mkId}
        className={`mkx-card ${active ? "mkx-card-active" : ""}`}
      >
        <div className="mkx-card-head">
          <div>
            <div className="mkx-card-title">{def.label}</div>
            <div className="mkx-card-sub">{def.description}</div>
          </div>
          {renderBadge(mkId)}
        </div>

        <div className="mkx-card-info">
          <div>
            <div className="mkx-label">Typ</div>
            <div className="mkx-value">{mkId}</div>
          </div>
          <div>
            <div className="mkx-label">Komplexität</div>
            <div className="mkx-value">{def.complexityScore} / 5</div>
          </div>
        </div>

        <div className="mkx-card-actions">
          <button
            type="button"
            className="mkx-btn mkx-btn-secondary"
            onClick={() => setPreviewMk(mkId)}
          >
            Vorschau
          </button>
          <button
            type="button"
            className="mkx-btn mkx-btn-primary"
            onClick={() => setSelected(mkId)}
          >
            {active ? "Gewählt" : "Auswählen"}
          </button>
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------
   * Layout Render
   * --------------------------------------------------------- */

  return (
    <div className="wizard-modern-step-card mkx-root">
      <h2 className="wizard-section-title">Messkonzept</h2>
      <p className="wizard-section-sub">
        Auf Basis der Anmeldeart schlägt der Wizard automatisch ein passendes
        Messkonzept vor und zeigt weitere Optionen.
      </p>

      {context.caseType && (
        <div className="mkx-case-type-hint">
          <span>Passend zur gewählten Anmeldeart:&nbsp;</span>
          <span className="mkx-badge mkx-badge-glow">
            {getCaseTypeLabel(context.caseType)}
          </span>
        </div>
      )}

      <div className="mkx-grid">
        {/* LEFT SIDE — Karten */}
        <div className="mkx-left">
          {/* EMPFOHLEN */}
          {recommendedDef && (
            <section className="mkx-section">
              <h3 className="mkx-heading">Empfohlenes Messkonzept</h3>
              <p className="mkx-sub">
                Automatisch ermittelt aus Anmeldeart und technischen Angaben.
              </p>

              {renderCard(recommendedDef.id)}

              {Array.isArray(suggestion.reasons) &&
                suggestion.reasons.length > 0 && (
                  <ul className="mkx-reasons">
                    {suggestion.reasons.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                )}
            </section>
          )}

          {/* ALTERNATIVEN */}
          {alternativeDefs.length > 0 && (
            <section className="mkx-section">
              <h3 className="mkx-heading">Alternativen</h3>
              <div className="mkx-card-grid">
                {alternativeDefs.map((d) => renderCard(d.id))}
              </div>
            </section>
          )}

          {/* WEITERE OPTIONEN */}
          {otherDefs.length > 0 && (
            <section className="mkx-section">
              <h3 className="mkx-heading">Weitere Optionen</h3>
              <div className="mkx-card-grid">
                {otherDefs.map((d) => renderCard(d.id))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT SIDE — Visualisierung */}
        <div className="mkx-right">
          <div className="mkx-visual-box">
            <div className="mkx-visual-header">
              <div>
                <div className="mkx-visual-title">{currentDef?.label}</div>
                <div className="mkx-visual-sub">Messkonzept-Vorschau</div>
              </div>

              <span className="mkx-badge mkx-badge-glow">{previewMk}</span>
            </div>

            <div className="mkx-diagram">
              <MKRenderer mk={previewMk} onChange={() => {}} alternatives={[]} />
            </div>

            {/* Einschränkungen */}
            {Array.isArray(currentDef?.nbRestrictions) &&
              currentDef.nbRestrictions.length > 0 && (
                <ul className="mkx-restrictions">
                  {currentDef.nbRestrictions.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="wizard-footer">
        <button className="wizard-btn wizard-btn-secondary" onClick={onBack}>
          Zurück
        </button>

        <button
          className="wizard-btn wizard-btn-primary"
          disabled={!isValid}
          onClick={onNext}
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

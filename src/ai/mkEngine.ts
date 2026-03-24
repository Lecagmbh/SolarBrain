// KI-Engine für Messkonzepte & Prozesslogik
// bewusst kompakt gehalten – nur klar definierte, wiederverwendbare Helfer

import type {
  WizardPayload,
  MeasurementConcept,
  RegistrationTarget,
} from "../shared/types";

export type ProcessPrimaryTarget = RegistrationTarget | "unknown";

export type MKDecisionFlag =
  | "missingPower"
  | "missingTargets"
  | "mkAmbiguous"
  | "mkOverride";

export interface ProcessDecision {
  primaryTarget: ProcessPrimaryTarget;
  secondaryTargets: RegistrationTarget[];
  warnings: string[];
}

export interface MKDecision {
  mk: MeasurementConcept | "";
  flags: MKDecisionFlag[];
  note: string;
}

export interface WizardAiSummary {
  process: ProcessDecision;
  mkDecision: MKDecision;
  aiNotes: string;
}

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const uniq = <T>(items: T[]): T[] =>
  Array.from(new Set(items)).filter((x) => x !== undefined && x !== null);

/**
 * RegistrationTargets + abgeleitete Komponenten (Speicher, Wallbox, WP)
 * in ein sauberes Target-Set bringen.
 */
const normalizeTargets = (payload: WizardPayload): RegistrationTarget[] => {
  const baseTargets = Array.isArray(payload.registrationTargets)
    ? (payload.registrationTargets.filter(Boolean) as RegistrationTarget[])
    : [];

  const derived: RegistrationTarget[] = [];

  if (payload.hasStorage) derived.push("battery");
  if (payload.hasWallbox) derived.push("wallbox");
  if (payload.hasHeatpump) derived.push("heatpump");

  return uniq([...baseTargets, ...derived]);
};

/* --------------------------------------------------
 * 1) Prozess-Entscheidung
 * -------------------------------------------------- */

export const decideProcess = (payload: WizardPayload): ProcessDecision => {
  const allTargets = normalizeTargets(payload);

  const warnings: string[] = [];
  let primary: ProcessPrimaryTarget = "unknown";

  if (!allTargets.length) {
    warnings.push(
      "Es konnte kein klarer Anmeldetyp erkannt werden. Bitte im Wizard einen Typ wählen."
    );
    return {
      primaryTarget: "unknown",
      secondaryTargets: [],
      warnings,
    };
  }

  const priorityOrder: RegistrationTarget[] = [
    "connectionChange",
    "existingPlantChange",
    "pv",
    "kwk",
    "otherGeneration",
    "battery",
    "wallbox",
    "heatpump",
  ];

  primary =
    (priorityOrder.find((p) => allTargets.includes(p)) as ProcessPrimaryTarget) ??
    "unknown";

  const secondary = allTargets.filter((t) => t !== primary);

  if (allTargets.length > 1) {
    warnings.push(
      "Es wurden mehrere Komponenten erkannt. Da pro Vorgang nur eine Sache angemeldet werden darf, sollten weitere Komponenten in getrennten Vorgängen erfasst werden."
    );
  }

  return {
    primaryTarget: primary,
    secondaryTargets: secondary,
    warnings,
  };
};

/* --------------------------------------------------
 * 2) Messkonzept-Entscheidung (MK1–MK8)
 * -------------------------------------------------- */

export const decideMeasurementConcept = (
  payload: WizardPayload
): MKDecision => {
  const flags: MKDecisionFlag[] = [];

  if (payload.measurementConcept) {
    return {
      mk: payload.measurementConcept as MeasurementConcept,
      flags: ["mkOverride"],
      note: "Messkonzept wurde im Wizard explizit vorgegeben.",
    };
  }

  const moduleWp = toNumber((payload as any).moduleWp);
  const moduleCount = toNumber((payload as any).moduleCount);
  const totalKwp =
    moduleWp && moduleCount ? (moduleWp * moduleCount) / 1000 : 0;

  const hasStorage = !!payload.hasStorage;
  const hasWallbox = !!payload.hasWallbox;
  const hasHeatpump = !!payload.hasHeatpump;

  if (!totalKwp) {
    flags.push("missingPower");
    return {
      mk: "" as unknown as MeasurementConcept,
      flags,
      note: "Anlagenleistung fehlt – Messkonzept kann nur grob geschätzt werden.",
    };
  }

  let mk: MeasurementConcept | "" = "" as unknown as MeasurementConcept;

  if (!hasStorage && !hasWallbox && !hasHeatpump) {
    mk = "MK2";
    return {
      mk,
      flags,
      note: "Standard-PV ohne Speicher / Wallbox / WP – Empfehlung: MK2 (Überschusseinspeisung).",
    };
  }

  if (hasStorage && !hasWallbox && !hasHeatpump) {
    mk = "MK8";
    return {
      mk,
      flags,
      note: "PV mit Speicher – Empfehlung: MK8 (PV + Speicher, genaues Muster je Netzbetreiber prüfen).",
    };
  }

  flags.push("mkAmbiguous");
  return {
    mk,
    flags,
    note: "Komplexe Kombination aus PV, Speicher, Wallbox oder Wärmepumpe – Messkonzept muss manuell / mit KI-Assistent geprüft werden.",
  };
};

/* --------------------------------------------------
 * 3) Textuelle Empfehlung für das UI
 * -------------------------------------------------- */

export const buildMeasurementConceptAdvice = (
  payload: WizardPayload,
  decision: MKDecision
): string[] => {
  const lines: string[] = [];

  const process = decideProcess(payload);

  const name =
    [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() ||
    payload.companyName ||
    "der Kunde";

  lines.push(`Für ${name} wurde als Hauptvorgang „${process.primaryTarget}“ erkannt.`);

  if (process.secondaryTargets.length) {
    lines.push(
      `Weitere Komponenten wurden erkannt: ${process.secondaryTargets.join(
        ", "
      )}. Diese sollten in separaten Vorgängen angemeldet werden.`
    );
  }

  if (decision.mk) {
    lines.push(`Empfohlenes Messkonzept: ${decision.mk}. ${decision.note}`);
  } else {
    lines.push(`Es konnte kein eindeutiges Messkonzept ermittelt werden. ${decision.note}`);
  }

  if (process.warnings.length) {
    lines.push(...process.warnings.map((w) => `Hinweis: ${w}`));
  }

  return lines;
};

/* --------------------------------------------------
 * 4) Komplett-Pipeline für den Wizard
 * -------------------------------------------------- */

export const runWizardAi = (payload: WizardPayload): WizardAiSummary => {
  const process = decideProcess(payload);
  const mkDecision = decideMeasurementConcept(payload);
  const adviceLines = buildMeasurementConceptAdvice(payload, mkDecision);

  return {
    process,
    mkDecision,
    aiNotes: adviceLines.join("\n"),
  };
};

export const analyzeInstallation = (payload: WizardPayload): WizardAiSummary =>
  runWizardAi(payload);

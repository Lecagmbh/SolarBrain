/**
 * Source-Tabs — Alle / CRM / Wizard / API
 * Eingefügt zwischen Pipeline und Filter in NetzanmeldungenEnterprise.
 * Design: pixel-matched an Mock gridnetz-netzanmeldungen-erweitert.jsx
 */
import { useEffect, useState, useMemo } from "react";

export type SourceFilter = "alle" | "crm" | "wizard" | "api";

interface Props {
  active: SourceFilter;
  onChange: (tab: SourceFilter) => void;
  crmCount: number;
  wizardCount: number;
  apiCount: number;
}

const TABS: { k: SourceFilter; l: string; icon: string; c: string }[] = [
  { k: "alle", l: "Alle Projekte", icon: "📊", c: "#a5b4fc" },
  { k: "crm", l: "CRM-Projekte", icon: "📊", c: "#D4A843" },
  { k: "wizard", l: "Netzanmeldungen", icon: "🧙", c: "#f97316" },
  { k: "api", l: "API-Importe", icon: "🔗", c: "#06b6d4" },
];

export function SourceTabs({ active, onChange, crmCount, wizardCount, apiCount }: Props) {
  const counts: Record<SourceFilter, number> = {
    alle: crmCount + wizardCount + apiCount,
    crm: crmCount,
    wizard: wizardCount,
    api: apiCount,
  };

  // Hide API tab if 0
  const visibleTabs = apiCount > 0 ? TABS : TABS.filter(t => t.k !== "api");

  return (
    <div style={{
      display: "flex", gap: 3, margin: "12px 0",
      background: "rgba(15,15,28,0.5)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8, padding: 4,
    }}>
      {visibleTabs.map(t => {
        const isActive = active === t.k;
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 10px", borderRadius: 6, border: "none",
              fontSize: 12, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
              background: isActive ? t.c + "12" : "transparent",
              color: isActive ? t.c : "#64748b",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 12 }}>{t.icon}</span>
            {t.l}
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: isActive ? t.c + "20" : "rgba(255,255,255,0.05)",
              color: isActive ? t.c : "#64748b",
              borderRadius: 10, padding: "1px 7px",
            }}>
              {counts[t.k] >= 0 ? counts[t.k] : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hook: lädt CRM-Projekte und gibt sie als "virtuelle Installations" zurück
 */
export function useCrmProjekte() {
  const [crmItems, setCrmItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/crm/projekte?limit=500", { credentials: "include" })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        if (cancelled) return;
        const items = (data?.items || []).map((p: any) => ({
          // Felder die EnterpriseList erwartet
          id: -p.id, // Negative ID um Kollision mit echten Installations zu vermeiden
          publicId: `CRM-${p.id}`,
          customerName: p.kundenName || p.titel || "—",
          status: mapStage(p.stage),
          plz: p.plz || "",
          ort: p.ort || "",
          netzbetreiberName: p.netzbetreiberName || "",
          netzbetreiber: null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          technical_data: p.totalKwp ? { totalPvKwPeak: Number(p.totalKwp) } : null,
          kundeId: null,
          createdById: null,
          createdByName: "CRM",
          createdByCompany: null,
          // CRM-spezifische Marker
          _isCrm: true,
          _crmId: p.id,
          _crmStage: p.stage,
          _crmTitel: p.titel,
          _crmWert: p.geschaetzterWert,
          _crmEmail: p.kontaktEmail,
          _hasNa: !!p.installationId,
        }));
        setCrmItems(items);
      })
      .catch(() => setCrmItems([]))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { crmItems, crmLoading: loading };
}

function mapStage(stage: string): string {
  // CRM-Stages als eigene Status-Keys (nicht auf Installation-Statuses mappen)
  const m: Record<string, string> = {
    ANFRAGE: "crm_anfrage",
    HV_VERMITTELT: "crm_hv",
    AUFTRAG: "crm_auftrag",
    NB_ANFRAGE: "beim_nb",
    NB_KOMMUNIKATION: "crm_nb_kommunikation",
    NB_GENEHMIGT: "crm_nb_genehmigt",
    NB_ABGELEHNT: "crm_abgelehnt",
    EINGESTELLT: "crm_eingestellt",
    ABGESCHLOSSEN: "fertig",
  };
  return m[stage] || "eingang";
}

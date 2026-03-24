import { useState, useEffect } from "react";
import type { VdeFormInfo, VdeFormStatus } from "../services/vdeCenterApi";
import { fetchForms, fetchInstallationFormStatus } from "../services/vdeCenterApi";

const C = {
  bgCard: "rgba(12,12,20,0.85)", bgCardHover: "rgba(18,18,30,0.95)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
  green: "#34d399", greenBg: "rgba(52,211,153,0.12)",
  red: "#f87171", redBg: "rgba(248,113,113,0.12)",
  orange: "#fb923c", orangeBg: "rgba(251,146,60,0.12)",
  purple: "#f0d878", purpleBg: "rgba(167,139,250,0.12)",
};

interface FormSelectorProps {
  installationId?: number;
  selectedFormId: string | null;
  onSelect: (formId: string, formName: string) => void;
}

export function FormSelector({ installationId, selectedFormId, onSelect }: FormSelectorProps) {
  const [forms, setForms] = useState<VdeFormInfo[]>([]);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [statusMap, setStatusMap] = useState<Record<string, VdeFormStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms().then(res => {
      setForms(res.forms);
      setGroups(res.groups);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!installationId) return;
    fetchInstallationFormStatus(installationId).then(statuses => {
      const map: Record<string, VdeFormStatus> = {};
      statuses.forEach(s => map[s.formId] = s);
      setStatusMap(map);
    }).catch(console.error);
  }, [installationId]);

  if (loading) return <div style={{ padding: 20, color: C.textMuted, fontSize: 12 }}>Formulare laden...</div>;

  const renderFormGroup = (normLabel: string, formIds: string[]) => {
    const groupForms = formIds.map(id => forms.find(f => f.id === id)).filter(Boolean) as VdeFormInfo[];
    if (groupForms.length === 0) return null;

    return (
      <div key={normLabel} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, padding: "0 4px" }}>
          VDE-AR-N {normLabel}
        </div>
        {groupForms.map(form => {
          const status = statusMap[form.id];
          const isActive = selectedFormId === form.id;
          const percent = status?.completeness.percent || 0;
          const missing = status?.missingRequiredCount || 0;

          return (
            <div
              key={form.id}
              onClick={() => onSelect(form.id, form.name)}
              style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
                background: isActive ? C.primaryGlow : "transparent",
                border: `1px solid ${isActive ? C.primary + "40" : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? C.textBright : C.text }}>{form.name}</span>
              </div>
              {installationId && status && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Mini progress bar */}
                  <div style={{ flex: 1, height: 3, background: "rgba(212,168,67,0.1)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${percent}%`, background: percent === 100 ? C.green : percent > 50 ? C.orange : C.red, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: percent === 100 ? C.green : percent > 50 ? C.orange : C.red }}>{percent}%</span>
                  {missing > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: C.redBg, color: C.red }}>{missing}</span>
                  )}
                </div>
              )}
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{form.fieldCount} Felder · {form.pages} Seite{form.pages > 1 ? "n" : ""}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: "12px 8px" }}>
      {Object.entries(groups).map(([norm, formIds]) => renderFormGroup(norm, formIds))}
    </div>
  );
}

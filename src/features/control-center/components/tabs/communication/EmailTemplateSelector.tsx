/**
 * EMAIL TEMPLATE SELECTOR
 * Dropdown zum Auswählen und Anwenden von Reply-Templates
 * API: GET /api/email-templates + POST /api/email-templates/apply
 */

import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api } from "../../../../../modules/api/client";
import { s } from "./styles";
import type { EmailTemplate } from "./types";

interface EmailTemplateSelectorProps {
  onApply: (subject: string, body: string) => void;
  variables?: Record<string, string>;
}

export function EmailTemplateSelector({ onApply, variables }: EmailTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/email-templates")
      .then((res) => {
        if (!cancelled) {
          setTemplates(res.data?.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = Number(e.target.value);
    if (!templateId) return;

    setApplying(true);
    try {
      const res = await api.post("/email-templates/apply", {
        templateId,
        variables: variables || {},
      });
      const result = res.data?.data;
      if (result) {
        onApply(result.subject || "", result.body || "");
      }
    } catch (err) {
      console.error("Failed to apply template:", err);
      alert("Fehler beim Anwenden der Vorlage");
    } finally {
      setApplying(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#71717a", fontSize: "0.8rem" }}>
        <Loader2 size={14} style={{ animation: "comm-spin 1s linear infinite" }} />
        Vorlagen laden...
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <FileText size={14} style={{ color: "#71717a", flexShrink: 0 }} />
      <select
        style={s.templateSelect}
        onChange={handleSelect}
        disabled={applying}
        defaultValue=""
      >
        <option value="" disabled>
          {applying ? "Wird angewendet..." : "Vorlage wählen..."}
        </option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

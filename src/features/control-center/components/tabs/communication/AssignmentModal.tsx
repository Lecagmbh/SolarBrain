/**
 * ASSIGNMENT MODAL
 * Email einer Installation zuordnen
 */

import { useState, useEffect } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";
import { api } from "../../../../../modules/api/client";
import { s } from "./styles";
import type { InboxEmail, Installation } from "./types";

interface AssignmentModalProps {
  email: InboxEmail;
  onAssign: (emailId: number, installationId: number) => Promise<void>;
  onClose: () => void;
}

export function AssignmentModal({ email, onAssign, onClose }: AssignmentModalProps) {
  const [search, setSearch] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (search.length < 2) {
      setInstallations([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/email-inbox/search-installations", {
          params: { q: search, limit: 10 },
        });
        setInstallations(res.data?.data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleAssign = async (installationId: number) => {
    setAssigning(true);
    try {
      await onAssign(email.id, installationId);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Email zuordnen</span>
          <button style={s.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Email Info */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#71717a" }}>Email:</div>
          <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{email.subject}</div>
          <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: 4 }}>
            Von: {email.fromAddress}
          </div>
        </div>

        {/* Search */}
        <div style={s.modalSearch}>
          <Search size={16} style={{ color: "#71717a" }} />
          <input
            style={s.modalSearchInput}
            placeholder="Anlage suchen (ID, Name, Adresse)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {searching && (
            <Loader2
              size={16}
              style={{ color: "#71717a", animation: "comm-spin 1s linear infinite" }}
            />
          )}
        </div>

        {/* Results */}
        <div style={s.installationList}>
          {installations.length === 0 && search.length >= 2 && !searching && (
            <div style={{ padding: 20, textAlign: "center" as const, color: "#71717a" }}>
              Keine Anlagen gefunden
            </div>
          )}
          {installations.map((inst) => (
            <div
              key={inst.id}
              style={s.installationItem}
              onClick={() => handleAssign(inst.id)}
            >
              <div style={s.installationInfo}>
                <span style={s.installationId}>{inst.publicId}</span>
                <span style={s.installationCustomer}>{inst.customerName}</span>
                <span style={s.installationAddress}>
                  {inst.strasse}, {inst.plz} {inst.ort}
                </span>
              </div>
              {assigning ? (
                <Loader2 size={16} style={{ animation: "comm-spin 1s linear infinite" }} />
              ) : (
                <Check size={16} style={{ color: "#10b981" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

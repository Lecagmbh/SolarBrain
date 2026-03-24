import { useState, useEffect } from "react";
import { SignaturePad } from "../../netzanmeldungen/components/SignaturePad";
import { fetchSignatures, createSignature, deleteSignature } from "../services/vdeCenterApi";

const C = {
  bg: "#06060b", bgCard: "rgba(12,12,20,0.85)", bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
  green: "#34d399", greenBg: "rgba(52,211,153,0.12)",
  red: "#f87171", redBg: "rgba(248,113,113,0.12)",
};

// Fest hinterlegte Errichter-Daten
const ERRICHTER = {
  firma: "LeCa GmbH & Co KG",
  name: "Hartmut Bischoff",
  adresse: "Vogesenblick 21, 77933 Lahr",
  eintragNr: "0366-471-01",
  eingetragen: "bei UEWM",
};

interface Signature {
  id: number;
  signatureType: string;
  name: string;
  betrieb?: string;
  eintragNr?: string;
  isDefault: boolean;
  createdAt: string;
}

export function SignatureManager() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPad, setShowPad] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSignatures(await fetchSignatures()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentSig = signatures.find(s => s.isDefault) || signatures[0];

  const handleSaveSignature = async (base64: string) => {
    setSaving(true);
    try {
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      await createSignature({
        signatureType: "errichter_efk",
        name: ERRICHTER.name,
        betrieb: ERRICHTER.firma,
        eintragNr: `${ERRICHTER.eintragNr} ${ERRICHTER.eingetragen}`,
        signatureImage: cleanBase64,
        signatureMime: "image/png",
        isDefault: true,
      });
      setShowPad(false);
      await load();
    } catch (e) {
      console.error(e);
      alert("Fehler beim Speichern der Signatur");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Unterschrift wirklich löschen?")) return;
    try { await deleteSignature(id); await load(); } catch (e) { console.error(e); }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>

      {/* Errichter-Stammdaten */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Anlagenerrichter — Stammdaten
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InfoField label="Firma" value={ERRICHTER.firma} />
          <InfoField label="Name (EFK)" value={ERRICHTER.name} />
          <InfoField label="Adresse" value={ERRICHTER.adresse} />
          <InfoField label="Eintragungsnummer" value={`${ERRICHTER.eintragNr} ${ERRICHTER.eingetragen}`} />
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10, fontStyle: "italic" }}>
          Diese Daten werden automatisch in alle VDE-Formulare eingetragen.
        </div>
      </div>

      {/* Unterschrift */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: 1 }}>
              Unterschrift
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Wird via Vollmacht für alle Kunden auf allen Formularen verwendet
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 12 }}>Laden...</div>
        ) : currentSig ? (
          <div>
            {/* Aktive Signatur */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: 16,
              background: C.primaryGlow, borderRadius: 10, border: `1px solid ${C.primary}30`,
            }}>
              <img
                src={`/api/vde-center/signatures/${currentSig.id}/image`}
                alt="Unterschrift"
                style={{ height: 60, maxWidth: 200, objectFit: "contain", background: "#fff", borderRadius: 6, padding: 4 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright }}>{currentSig.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>
                  {currentSig.betrieb}{currentSig.eintragNr ? ` · Nr. ${currentSig.eintragNr}` : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.greenBg, color: C.green }}>
                    AKTIV — wird auf allen Formularen verwendet
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button onClick={() => setShowPad(true)} style={{
                  padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                  background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer",
                }}>
                  Neu zeichnen
                </button>
                <button onClick={() => handleDelete(currentSig.id)} style={{
                  padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.red}30`,
                  background: "transparent", color: C.red, fontSize: 11, cursor: "pointer",
                }}>
                  Löschen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              padding: 30, textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: 10,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textBright, marginBottom: 4 }}>Noch keine Unterschrift hinterlegt</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                Einmal unterschreiben — wird dann auf allen VDE-Formularen für alle Kunden verwendet
              </div>
              <button onClick={() => setShowPad(true)} style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                Jetzt unterschreiben
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signatur-Pad Modal */}
      {showPad && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setShowPad(false)} />
          <div style={{ position: "relative", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: 520 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textBright, margin: "0 0 4px" }}>Unterschrift zeichnen</h3>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>
              {ERRICHTER.name} · {ERRICHTER.firma} · {ERRICHTER.eintragNr} {ERRICHTER.eingetragen}
            </p>
            <div style={{ background: "#fff", borderRadius: 8, padding: 4, display: "inline-block" }}>
              <SignaturePad
                width={470}
                height={180}
                onSave={handleSaveSignature}
                onCancel={() => setShowPad(false)}
              />
            </div>
            {saving && <div style={{ fontSize: 12, color: C.primary, marginTop: 8 }}>Wird gespeichert...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{value}</div>
    </div>
  );
}

/**
 * Baunity Lead-Wizard — Premium Dark Mock
 * Same aesthetic as baunity.de landing page:
 * Sora headings, DM Sans body, grain overlay, gold shimmer, glassmorphism
 */
import { useState } from "react";

const STEPS = ["Kunde", "Standort", "Verbrauch", "Dach", "Extras", "Abschluss"];

export default function LeadWizardMock() {
  const [step, setStep] = useState(0);
  const [k, setK] = useState({ typ: "privat", heizung: "gas", dach: "satteldach", eindeckung: "ziegel", richt: "S", schatten: "keine", zs: "gut", zsPlatz: true, speicher: false, wallbox: false, fin: "kauf", zeit: "3-6", erg: "INTERESSIERT", int: 4, signed: false, personen: 3 });
  const s = (p: Partial<typeof k>) => setK(v => ({ ...v, ...p }));

  const Chip = ({ on, children, click }: { on: boolean; children: React.ReactNode; click: () => void }) => (
    <button onClick={click} style={{
      padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
      fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 7,
      minHeight: 48, transition: "all .25s var(--ease)", border: "none", userSelect: "none" as const,
      background: on ? "rgba(212,168,67,.12)" : "var(--bg-2)",
      color: on ? "var(--gold)" : "var(--text-2)",
      boxShadow: on ? "inset 0 0 0 1.5px var(--gold), 0 0 20px rgba(212,168,67,.08)" : "inset 0 0 0 1px var(--border-3)",
    }}>{children}</button>
  );

  const Tog = ({ on, label, click }: { on: boolean; label: string; click: () => void }) => (
    <button onClick={click} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 18px", borderRadius: 14, cursor: "pointer", minHeight: 56, border: "none",
      transition: "all .25s var(--ease)", fontFamily: "'DM Sans',sans-serif", marginBottom: 10,
      background: on ? "rgba(34,197,94,.06)" : "var(--bg-2)",
      boxShadow: on ? "inset 0 0 0 1px rgba(34,197,94,.25)" : "inset 0 0 0 1px var(--border-2)",
    }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: on ? "var(--text-1)" : "var(--text-2)" }}>{label}</span>
      <div style={{ width: 46, height: 26, borderRadius: 13, position: "relative", transition: "background .3s", background: on ? "#22c55e" : "var(--bg-3)" }}>
        <div style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "transform .3s cubic-bezier(.4,0,.2,1)", transform: on ? "translateX(20px)" : "none", boxShadow: "0 1px 4px rgba(0,0,0,.25)" }} />
      </div>
    </button>
  );

  const Sl = ({ label, val }: { label: string; val: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", width: 90, flexShrink: 0, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{label}</span>
      <input type="range" style={{ flex: 1, accentColor: "var(--gold)", height: 6 }} />
      <span style={{ minWidth: 80, padding: "10px 12px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--gold)", fontSize: 15, fontWeight: 600, textAlign: "center", fontFamily: "'JetBrains Mono',monospace" }}>{val}</span>
    </div>
  );

  const Row = ({ l, v, c }: { l: string; v: string; c?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-1)" }}>
      <span style={{ fontSize: 14, color: "var(--text-3)" }}>{l}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: c || "var(--text-1)", textAlign: "right" }}>{v}</span>
    </div>
  );

  const card = (icon: string, title: string, sub: string, children: React.ReactNode) => (
    <div style={{
      background: "var(--bg-1)", borderRadius: 20, padding: "28px 24px", marginBottom: 16,
      border: "1px solid var(--border-2)", position: "relative", overflow: "hidden",
      backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,.2)",
    }}>
      {/* Gold shimmer line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,168,67,.2), transparent)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid var(--border-1)" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-2)", border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Sora',sans-serif", letterSpacing: "-.02em" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );

  const label = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: ".05em", marginBottom: 10 }}>{t}</div>;

  const input = (v: string, ph: string) => <input defaultValue={v} placeholder={ph} style={{
    width: "100%", minHeight: 52, padding: "14px 18px", borderRadius: 14,
    background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--text-1)",
    fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "all .2s",
    boxSizing: "border-box" as const,
  }} />;

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif",
      WebkitFontSmoothing: "antialiased", position: "relative",
      // CSS Variables from baunity landing
      ["--bg-0" as any]: "#060B18", ["--bg-1" as any]: "#0B1224", ["--bg-2" as any]: "#111B32", ["--bg-3" as any]: "#182440",
      ["--text-1" as any]: "#E8EAF0", ["--text-2" as any]: "#8B92A8", ["--text-3" as any]: "#505872", ["--text-4" as any]: "#343B50",
      ["--gold" as any]: "#D4A843", ["--gold-bright" as any]: "#EAD068",
      ["--border-1" as any]: "rgba(255,255,255,.04)", ["--border-2" as any]: "rgba(255,255,255,.08)", ["--border-3" as any]: "rgba(255,255,255,.14)",
      ["--ease" as any]: "cubic-bezier(.16,1,.3,1)",
      background: "var(--bg-0)", color: "var(--text-1)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .wm-grain{position:fixed;inset:0;pointer-events:none;z-index:10000;opacity:.3;background:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E")}
        .wm-glow{position:fixed;width:600px;height:600px;border-radius:50%;pointer-events:none;filter:blur(80px);opacity:.6}
        input:focus,textarea:focus{border-color:rgba(212,168,67,.35)!important;box-shadow:0 0 0 3px rgba(212,168,67,.08)!important}
        input::placeholder,textarea::placeholder{color:var(--text-4)}
        ::selection{background:rgba(212,168,67,.3);color:#fff}
        @media(max-width:500px){.wm-row2{grid-template-columns:1fr!important}}
      `}</style>

      {/* Grain + Ambient Glows */}
      <div className="wm-grain" />
      <div className="wm-glow" style={{ top: "-20%", left: "10%", background: "rgba(212,168,67,.04)" }} />
      <div className="wm-glow" style={{ bottom: "-20%", right: "5%", background: "rgba(59,130,246,.02)" }} />

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "28px 20px 150px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sora',sans-serif", letterSpacing: "-.04em", margin: 0, lineHeight: 1 }}>
              Neuer <span style={{ color: "var(--gold)", textShadow: "0 0 40px rgba(212,168,67,.2)" }}>Lead</span>
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>{STEPS[step].charAt(0).toUpperCase() + STEPS[step].slice(1)} — Schritt {step + 1} von {STEPS.length}</p>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--gold), var(--gold-bright))", color: "var(--bg-0)",
            fontSize: 18, fontWeight: 800, fontFamily: "'Sora',sans-serif",
            boxShadow: "0 4px 24px rgba(212,168,67,.25)",
          }}>{step + 1}</div>
        </div>

        {/* ── Progress ── */}
        <div style={{ display: "flex", gap: 5, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => i < step && setStep(i)} style={{
              flex: 1, height: 5, borderRadius: 3, cursor: i < step ? "pointer" : "default",
              transition: "all .4s cubic-bezier(.4,0,.2,1)",
              background: i < step ? "#22c55e" : i === step ? "var(--gold)" : "var(--bg-3)",
              boxShadow: i === step ? "0 0 16px rgba(212,168,67,.3)" : "none",
            }} />
          ))}
        </div>

        {/* ═══ STEP 0 ═══ */}
        {step === 0 && card("👤", "Kundendaten", "Wer ist der Interessent?", <>
          <div style={{ marginBottom: 20 }}>{label("Kundentyp")}
            <div style={{ display: "flex", gap: 10 }}>
              <Chip on={k.typ === "privat"} click={() => s({ typ: "privat" })}>🏠 Privat</Chip>
              <Chip on={k.typ === "gewerbe"} click={() => s({ typ: "gewerbe" })}>🏢 Gewerbe</Chip>
            </div>
          </div>
          <div className="wm-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>{label("Vorname *")}{input("Max", "Vorname")}</div>
            <div>{label("Nachname *")}{input("Mustermann", "Nachname")}</div>
          </div>
          <div style={{ marginBottom: 20 }}>{label("Telefon *")}{input("+49 171 1234567", "+49...")}</div>
          <div>{label("E-Mail")}{input("max@mustermann.de", "E-Mail")}</div>
        </>)}

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && card("📍", "Standort", "Wo steht das Gebäude?", <>
          <button style={{
            width: "100%", padding: "16px 20px", borderRadius: 14, border: "none", minHeight: 56,
            background: "rgba(34,197,94,.06)", boxShadow: "inset 0 0 0 1px rgba(34,197,94,.25)",
            color: "#22c55e", fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, fontFamily: "'DM Sans',sans-serif", marginBottom: 20,
          }}>
            <span style={{ fontSize: 18 }}>📡</span>
            ✓ GPS-Position erfasst — Goethestraße 12, Lahr
          </button>
          <div className="wm-row2" style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 14, marginBottom: 20 }}>
            <div>{label("Straße *")}{input("Goethestraße", "Straße")}</div>
            <div>{label("Nr.")}{input("12", "Nr.")}</div>
          </div>
          <div className="wm-row2" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
            <div>{label("PLZ *")}{input("77933", "PLZ")}</div>
            <div>{label("Ort *")}{input("Lahr", "Ort")}</div>
          </div>
        </>)}

        {/* ═══ STEP 2 ═══ */}
        {step === 2 && card("⚡", "Verbrauch & Haushalt", "Wie viel Strom wird benötigt?", <>
          <div style={{ marginBottom: 20 }}>{label("Personen")}
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5,6].map(n => <Chip key={n} on={k.personen === n} click={() => s({ personen: n })}>{n}{n===6?"+":""}</Chip>)}
            </div>
          </div>
          <Sl label="Verbrauch" val="4.200 kWh" />
          <Sl label="Strompreis" val="0,35 €/kWh" />
          <div style={{ marginBottom: 20 }}>{label("Heizung")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["gas","🔥 Gas"],["oel","🛢 Öl"],["fernwaerme","🏭 Fern"],["strom","⚡ Strom"],["wp","♨️ WP"]].map(([v,l]) =>
                <Chip key={v} on={k.heizung===v} click={() => s({ heizung: v })}>{l}</Chip>
              )}
            </div>
          </div>
          <Tog on={true} label="🚗 E-Auto vorhanden" click={() => {}} />
          <Tog on={false} label="♨️ Wärmepumpe geplant" click={() => {}} />
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(212,168,67,.04)", border: "1px solid rgba(212,168,67,.08)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginTop: 8 }}>
            <b style={{ color: "var(--gold)" }}>💡</b> E-Auto +2.500 kWh · Wärmepumpe +4.000 kWh
          </div>
        </>)}

        {/* ═══ STEP 3 ═══ */}
        {step === 3 && card("🏠", "Dach & Technik", "Technische Rahmenbedingungen", <>
          <div style={{ marginBottom: 20 }}>{label("Dachtyp")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["satteldach","Sattel"],["flachdach","Flach"],["pultdach","Pult"],["walmdach","Walm"],["zeltdach","Zelt"]].map(([v,l]) =>
                <Chip key={v} on={k.dach===v} click={() => s({ dach: v })}>{l}</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>{label("Eindeckung")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["ziegel","Ziegel"],["beton","Beton"],["metall","Metall"],["bitumen","Bitumen"],["sonstige","Sonstige"]].map(([v,l]) =>
                <Chip key={v} on={k.eindeckung===v} click={() => s({ eindeckung: v })}>{l}</Chip>)}
            </div>
          </div>
          <Sl label="Neigung" val="30°" />
          <div style={{ marginBottom: 20 }}>{label("Ausrichtung")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["S","Süd"],["SO","SO"],["SW","SW"],["O","Ost"],["W","West"],["N","Nord"]].map(([v,l]) =>
                <Chip key={v} on={k.richt===v} click={() => s({ richt: v })}>{l}</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>{label("Verschattung")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["keine","☀️ Keine"],["gering","🌤 Gering"],["mittel","⛅ Mittel"],["stark","☁️ Stark"]].map(([v,l]) =>
                <Chip key={v} on={k.schatten===v} click={() => s({ schatten: v })}>{l}</Chip>)}
            </div>
          </div>
          <Sl label="Dachfläche" val="45 m²" />
          <Sl label="Anlage" val="9,6 kWp" />
          <div style={{ marginBottom: 16 }}>{label("Zählerschrank")}
            <div style={{ display: "flex", gap: 8 }}>
              {[["gut","✅ Gut"],["mittel","⚠️ Mittel"],["schlecht","❌ Erneuerung"]].map(([v,l]) =>
                <Chip key={v} on={k.zs===v} click={() => s({ zs: v })}>{l}</Chip>)}
            </div>
          </div>
          <Tog on={k.zsPlatz} label="📦 Platz im Zählerschrank" click={() => s({ zsPlatz: !k.zsPlatz })} />
        </>)}

        {/* ═══ STEP 4 ═══ */}
        {step === 4 && card("🔋", "Extras & Wünsche", "Zusätzliche Komponenten & Planung", <>
          <Tog on={k.speicher} label="🔋 Batteriespeicher" click={() => s({ speicher: !k.speicher })} />
          {k.speicher && <Sl label="Kapazität" val="10 kWh" />}
          <Tog on={k.wallbox} label="🔌 Wallbox" click={() => s({ wallbox: !k.wallbox })} />
          {k.wallbox && <Sl label="Leistung" val="11 kW" />}
          <div style={{ marginBottom: 20 }}>{label("Finanzierung")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["kauf","💰 Kauf"],["kredit","🏦 Kredit"],["leasing","📋 Leasing"],["miete","🏠 Miete"]].map(([v,l]) =>
                <Chip key={v} on={k.fin===v} click={() => s({ fin: v })}>{l}</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>{label("Zeitrahmen")}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {[["sofort","⚡ Sofort"],["1-3","1-3 Mon."],["3-6","3-6 Mon."],["6-12","6-12 Mon."],["offen","🤷 Offen"]].map(([v,l]) =>
                <Chip key={v} on={k.zeit===v} click={() => s({ zeit: v })}>{l}</Chip>)}
            </div>
          </div>
          {label("Fotos (3 aufgenommen)")}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {[["🏠 Dach",2],["📦 Zähler",1],["🌳 Umgebung",0],["📄 Rechnung",0],["🔍 Detail",0],["📸 Sonstige",0]].map(([l,c]) => (
              <button key={l as string} style={{
                padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans',sans-serif", border: "none",
                minHeight: 46, transition: "all .2s",
                background: (c as number) > 0 ? "rgba(34,197,94,.06)" : "var(--bg-2)",
                color: (c as number) > 0 ? "#22c55e" : "var(--text-3)",
                boxShadow: (c as number) > 0 ? "inset 0 0 0 1px rgba(34,197,94,.25)" : "inset 0 0 0 1px var(--border-2)",
              }}>
                {l}
                {(c as number) > 0 && <span style={{ background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{c}</span>}
              </button>
            ))}
          </div>
        </>)}

        {/* ═══ STEP 5 ═══ */}
        {step === 5 && <>
          {card("📊", "Gesprächsergebnis", "Wie lief das Gespräch?", <>
            <div style={{ marginBottom: 20 }}>{label("Ergebnis")}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {[["INTERESSIERT","👍 Interessiert"],["TERMIN_VEREINBART","📅 Termin"],["ANGEBOT_ERSTELLT","📋 Angebot"],["NICHT_INTERESSIERT","👎 Kein Int."],["KEIN_KONTAKT","🚪 Nicht da"]].map(([v,l]) =>
                  <Chip key={v} on={k.erg===v} click={() => s({ erg: v })}>{l}</Chip>)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>{label("Interesse")}
              <div style={{ display: "flex", gap: 8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => s({ int: n })} style={{
                    width: 48, height: 48, borderRadius: 12, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    transition: "all .25s", background: k.int >= n ? "rgba(212,168,67,.1)" : "var(--bg-2)",
                    boxShadow: k.int >= n ? "inset 0 0 0 1.5px var(--gold), 0 0 16px rgba(212,168,67,.06)" : "inset 0 0 0 1px var(--border-2)",
                  }}>⭐</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>{label("Nächste Schritte")}{input("Angebot per Mail senden", "z.B. Rückruf, Angebot...")}</div>
            <div>{label("Notizen")}<textarea defaultValue="Kunde sehr interessiert, hat bereits Angebote von 2 Anbietern. Entscheidung bis Ende März." style={{
              width: "100%", minHeight: 90, padding: "14px 18px", borderRadius: 14, resize: "vertical",
              background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--text-1)",
              fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
            }} /></div>
          </>)}

          {card("✅", "Zusammenfassung", "Alle erfassten Daten im Überblick", <>
            <Row l="Kunde" v="Max Mustermann" />
            <Row l="Telefon" v="+49 171 1234567" />
            <Row l="Standort" v="Goethestraße 12, 77933 Lahr" />
            <Row l="Netzbetreiber" v="Überlandwerk Mittelbaden" c="#22c55e" />
            <Row l="Verbrauch" v="4.200 kWh · 0,35 €/kWh" />
            <Row l="Dach" v="Satteldach · Ziegel · 30° Süd" />
            <Row l="Anlage" v="9,6 kWp · 45 m²" c="var(--gold)" />
            <Row l="Speicher" v="10 kWh" />
            <Row l="Finanzierung" v="Kauf · 3-6 Monate" />
            <Row l="Fotos" v="3 Stück" />
            <Row l="Ergebnis" v="👍 Interessiert · ⭐⭐⭐⭐" />

            {/* Unterschrift */}
            <div style={{ marginTop: 24 }}>
              {label("✍️ Kundenunterschrift")}
              {k.signed ? (
                <div style={{ textAlign: "center", padding: 24, background: "var(--bg-2)", borderRadius: 16, border: "1px solid rgba(34,197,94,.15)" }}>
                  <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 16, fontFamily: "'Sora',sans-serif" }}>✓ Unterschrieben</div>
                  <div style={{ marginTop: 10, height: 60, background: "#fafafa", borderRadius: 10, border: "1px solid rgba(34,197,94,.2)" }} />
                  <button onClick={() => s({ signed: false })} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,.15)", background: "rgba(239,68,68,.04)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Erneut unterschreiben</button>
                </div>
              ) : (
                <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px dashed var(--border-3)", background: "var(--bg-2)" }}>
                  <div style={{ height: 140, background: "#fafafa", position: "relative" }}>
                    <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#bbb", fontSize: 14, fontStyle: "italic" }}>Bitte hier unterschreiben</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, padding: "12px 16px", background: "var(--bg-1)", borderTop: "1px solid var(--border-1)" }}>
                    <button style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border-2)", background: "var(--bg-2)", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✕ Löschen</button>
                    <button onClick={() => s({ signed: true })} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(34,197,94,.25)", background: "rgba(34,197,94,.06)", color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✓ Bestätigen</button>
                  </div>
                </div>
              )}
            </div>

            {/* Wirtschaftlichkeit */}
            <div style={{ marginTop: 24, padding: 24, borderRadius: 18, background: "linear-gradient(135deg, rgba(212,168,67,.06), rgba(212,168,67,.02))", border: "1px solid rgba(212,168,67,.12)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "'Sora',sans-serif", letterSpacing: ".06em", textTransform: "uppercase" as const, marginBottom: 16, marginTop: 0 }}>💶 Wirtschaftlichkeits-Vorschau</h3>
              <Row l="Jahresertrag" v="9.120 kWh" />
              <Row l="Eigenverbrauch" v="2.736 kWh (65%)" />
              <Row l="Ersparnis / Jahr" v="1.481 €" c="#22c55e" />
              <Row l="Anlagenkosten" v="~21.440 €" />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)" }}>Amortisation</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)", fontFamily: "'Sora',sans-serif" }}>~14,5 Jahre</span>
              </div>
            </div>
          </>)}
        </>}
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 20px", display: "flex", gap: 12,
        background: "rgba(6,11,24,.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border-1)",
      }}>
        <button onClick={() => step > 0 && setStep(step - 1)} style={{
          flex: 1, padding: 16, borderRadius: 14, fontSize: 15, fontWeight: 600,
          fontFamily: "'DM Sans',sans-serif", cursor: "pointer", minHeight: 54,
          background: "var(--bg-1)", border: "1px solid var(--border-2)", color: "var(--text-3)",
          transition: "all .2s",
        }}>{step > 0 ? "← Zurück" : "✕ Abbrechen"}</button>
        <button disabled={step === 5 && !k.signed} onClick={() => step < 5 && setStep(step + 1)} style={{
          flex: 1, padding: 16, borderRadius: 14, fontSize: 15, fontWeight: 700,
          fontFamily: "'Sora',sans-serif", cursor: "pointer", minHeight: 54, border: "none",
          background: "linear-gradient(135deg, var(--gold), var(--gold-bright))", color: "var(--bg-0)",
          boxShadow: "0 4px 24px rgba(212,168,67,.25)", transition: "all .2s", letterSpacing: "-.01em",
          opacity: (step === 5 && !k.signed) ? 0.3 : 1,
        }}>{step < 5 ? "Weiter →" : k.signed ? "✓ Lead speichern" : "✍️ Erst unterschreiben"}</button>
      </div>
    </div>
  );
}

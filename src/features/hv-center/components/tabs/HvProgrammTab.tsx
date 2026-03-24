/**
 * HV PROGRAMM TAB
 * Pricing, process overview, marketing materials, and key stats for Handelsvertreter
 */

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  Sparkles,
  ArrowRight,
  Mail,
  FileDown,
  BookOpen,
  Palette,
  Clock,
  MapPin,
  CheckCircle2,
  Zap,
  Globe,
  Star,
} from "lucide-react";
import { api } from "../../../../modules/api/client";
import { useAuth } from "../../../../pages/AuthContext";

/* ── Types ── */

interface HvProfil {
  provisionssatz: number | null;
  weitergabeSatz?: number | null;
}

/* ── Styles ── */

const s: Record<string, CSSProperties> = {
  container: {
    padding: "2rem 2.5rem 4rem",
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
  },
  // Hero
  hero: {
    background: "linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(59, 130, 246, 0.1) 100%)",
    border: "1px solid rgba(212, 168, 67, 0.25)",
    borderRadius: "16px",
    padding: "2.5rem 3rem",
    position: "relative",
    overflow: "hidden",
  },
  heroTitle: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.3,
  },
  heroSub: {
    margin: "0.75rem 0 0",
    fontSize: "1rem",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.6,
    maxWidth: "600px",
  },
  heroGlow: {
    position: "absolute" as const,
    top: "-40px",
    right: "-40px",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(212, 168, 67, 0.2) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  // Section
  sectionTitle: {
    margin: "0 0 1.25rem",
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  // Pricing
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  },
  pricingCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "1.75rem 1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    transition: "border-color 0.2s, transform 0.2s",
    position: "relative" as const,
  },
  pricingCardPopular: {
    background: "rgba(212, 168, 67, 0.06)",
    border: "1px solid rgba(212, 168, 67, 0.35)",
    transform: "scale(1.02)",
  },
  popularBadge: {
    position: "absolute" as const,
    top: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "3px 14px",
    borderRadius: "20px",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  pricingTier: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "0.5rem",
  },
  pricingRange: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "1rem",
  },
  pricingPrice: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
  },
  pricingUnit: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
    marginTop: "0.35rem",
  },
  pricingNote: {
    marginTop: "1.25rem",
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center" as const,
  },
  provisionBox: {
    marginTop: "1rem",
    padding: "1rem 1.25rem",
    background: "rgba(16, 185, 129, 0.06)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "10px",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.6,
  },
  provisionHighlight: {
    color: "#10b981",
    fontWeight: 600,
  },
  // Timeline
  timeline: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
    position: "relative" as const,
  },
  timelineStep: {
    display: "flex",
    gap: "1.25rem",
    position: "relative" as const,
    paddingBottom: "1.5rem",
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "48px",
    flexShrink: 0,
  },
  timelineDot: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  timelineLine: {
    flex: 1,
    width: "2px",
    background: "rgba(255,255,255,0.08)",
    marginTop: "6px",
  },
  timelineContent: {
    paddingTop: "6px",
  },
  timelineLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "0.25rem",
  },
  timelineTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#fff",
    margin: 0,
  },
  timelineDesc: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.45)",
    margin: "0.25rem 0 0",
  },
  // Materials
  materialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
  },
  materialCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    transition: "border-color 0.2s",
  },
  materialIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "rgba(212, 168, 67, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#EAD068",
  },
  materialTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#fff",
    margin: 0,
  },
  materialDesc: {
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.45)",
    margin: "0.35rem 0 0.75rem",
    lineHeight: 1.5,
  },
  materialBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "6px",
    padding: "3px 10px",
  },
  materialLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#EAD068",
    textDecoration: "none",
    cursor: "pointer",
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none",
    borderRadius: "8px",
    padding: "6px 14px",
    textDecoration: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "1.75rem 1.5rem",
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.5)",
    marginTop: "0.5rem",
  },
  // Contact
  contactBox: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "2rem",
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "2rem",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.6)",
  },
  contactLink: {
    color: "#EAD068",
    textDecoration: "none",
    fontWeight: 500,
  },
};

/* ── Pricing Data ── */

const PRICING_TIERS = [
  { tier: "Starter", range: "1–9 Anlagen / Monat", price: "199€", unit: "netto pro Anlage", popular: false },
  { tier: "Business", range: "10–49 Anlagen / Monat", price: "149€", unit: "netto pro Anlage", popular: true },
  { tier: "Professional", range: "Ab 50 Anlagen / Monat", price: "129€", unit: "netto pro Anlage", popular: false },
  { tier: "Enterprise", range: "Ab 100 Anlagen / Monat", price: "Individuell", unit: "auf Anfrage", popular: false },
];

/* ── Timeline Data ── */

const TIMELINE_STEPS = [
  {
    who: "SIE",
    whoColor: "#10b981",
    dotBg: "rgba(16, 185, 129, 0.15)",
    dotBorder: "rgba(16, 185, 129, 0.4)",
    title: "Kunde an Baunity vermitteln",
    desc: "Sie leiten die Kundendaten weiter — wir übernehmen den Rest.",
  },
  {
    who: "WIR",
    whoColor: "#D4A843",
    dotBg: "rgba(212, 168, 67, 0.15)",
    dotBorder: "rgba(212, 168, 67, 0.4)",
    title: "Netzanmeldung beim Netzbetreiber einreichen",
    desc: "PV-Anlagen, Speicher, Wallboxen, Kombianlagen — wir erstellen alle Unterlagen und reichen den Antrag beim zuständigen NB ein.",
  },
  {
    who: "KUNDE",
    whoColor: "#3b82f6",
    dotBg: "rgba(59, 130, 246, 0.15)",
    dotBorder: "rgba(59, 130, 246, 0.4)",
    title: "Kunde bezahlt Rechnung",
    desc: "Nach erfolgreicher Einreichung erhält der Kunde seine Rechnung und bezahlt.",
  },
  {
    who: "AUTOMATISCH",
    whoColor: "#f59e0b",
    dotBg: "rgba(245, 158, 11, 0.15)",
    dotBorder: "rgba(245, 158, 11, 0.4)",
    title: "Provision wird gutgeschrieben",
    desc: "Sobald die Zahlung eingeht, wird Ihre Provision automatisch berechnet und gutgeschrieben.",
  },
];

/* ── Component ── */

export function HvProgrammTab() {
  const { user } = useAuth();
  const [profil, setProfil] = useState<HvProfil | null>(null);
  const isHv = user?.role === "HANDELSVERTRETER";

  useEffect(() => {
    if (!isHv) return;
    api
      .get("/hv/profil")
      .then((r) => {
        const data = r.data?.data || r.data;
        setProfil(data);
      })
      .catch(() => {
        // Provision info not available
      });
  }, [isHv]);

  const provisionssatz = profil?.provisionssatz ?? null;

  return (
    <div style={s.container}>
      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Sparkles size={22} color="#EAD068" />
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#EAD068", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Handelsvertreter-Programm
          </span>
        </div>
        <h1 style={s.heroTitle}>Ihr Baunity Handelsvertreter-Programm</h1>
        <p style={s.heroSub}>
          Wir melden alles an, was beim Netzbetreiber angemeldet werden muss — PV-Anlagen,
          Batteriespeicher, Wallboxen (&gt;11 kW), Kombianlagen und mehr.
          Vermitteln Sie Kunden an Baunity und profitieren Sie von attraktiven Provisionen.
        </p>
      </div>

      {/* ── Preisliste ── */}
      <div>
        <h2 style={s.sectionTitle}>
          <Zap size={18} color="#EAD068" />
          Preise pro Netzanmeldung
        </h2>
        <div style={s.pricingGrid}>
          {PRICING_TIERS.map((t) => (
            <div
              key={t.tier}
              style={{
                ...s.pricingCard,
                ...(t.popular ? s.pricingCardPopular : {}),
              }}
            >
              {t.popular && <span style={s.popularBadge}>Beliebt</span>}
              <div style={s.pricingTier}>{t.tier}</div>
              <div style={s.pricingRange}>{t.range}</div>
              <div style={s.pricingPrice}>{t.price}</div>
              <div style={s.pricingUnit}>{t.unit}</div>
            </div>
          ))}
        </div>
        <p style={s.pricingNote}>
          Alle Preise zzgl. 19% MwSt. · Abrechnung pro Anlage, keine Grundgebühr
        </p>

        {/* Provisions-Hinweis */}
        <div style={s.provisionBox}>
          {provisionssatz != null ? (
            <>
              <span>Ihr Provisionssatz: </span>
              <span style={s.provisionHighlight}>{provisionssatz}%</span>
              <span> — Beispiel bei 15 Anlagen/Monat: 9 × 199€ + 6 × 149€ = 2.685€ × {provisionssatz}% = </span>
              <span style={s.provisionHighlight}>
                {((9 * 199 + 6 * 149) * (provisionssatz / 100)).toFixed(2).replace(".", ",")}€
              </span>
              <span> Provision</span>
            </>
          ) : (
            <span>Ihre individuelle Provision gemäß Vereinbarung</span>
          )}
        </div>
        <p style={{ ...s.pricingNote, marginTop: "0.5rem" }}>
          Staffelpreise gelten gestaffelt: Die ersten 9 Anlagen zu 199€, ab der 10. zu 149€, ab der 50. zu 129€
        </p>
      </div>

      {/* ── Ablauf ── */}
      <div>
        <h2 style={s.sectionTitle}>
          <ArrowRight size={18} color="#EAD068" />
          So funktioniert&apos;s
        </h2>
        <div style={s.timeline}>
          {TIMELINE_STEPS.map((step, i) => (
            <div key={i} style={s.timelineStep}>
              <div style={s.timelineLeft}>
                <div
                  style={{
                    ...s.timelineDot,
                    background: step.dotBg,
                    border: `2px solid ${step.dotBorder}`,
                    color: step.whoColor,
                  }}
                >
                  {i + 1}
                </div>
                {i < TIMELINE_STEPS.length - 1 && <div style={s.timelineLine} />}
              </div>
              <div style={s.timelineContent}>
                <div style={{ ...s.timelineLabel, color: step.whoColor }}>{step.who}</div>
                <p style={s.timelineTitle}>{step.title}</p>
                <p style={s.timelineDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Werbematerialien ── */}
      <div>
        <h2 style={s.sectionTitle}>
          <FileDown size={18} color="#EAD068" />
          Werbematerialien
        </h2>
        <div style={s.materialsGrid}>
          {[
            {
              icon: BookOpen,
              title: "Partnerprogramm-Info",
              desc: "Übersicht des Baunity Partnerprogramms — Konditionen, Ablauf und Vorteile.",
              downloadUrl: "/downloads/Baunity-Partnerprogramm-Info.pdf",
              fileName: "Baunity-Partnerprogramm-Info.pdf",
            },
            {
              icon: FileDown,
              title: "Unterlagen-Checkliste",
              desc: "Welche Unterlagen werden für eine Netzanmeldung benötigt? Checkliste zum Weitergeben.",
              downloadUrl: "/downloads/Baunity-Unterlagen-Checkliste.pdf",
              fileName: "Baunity-Unterlagen-Checkliste.pdf",
            },
            {
              icon: Palette,
              title: "Individuelle Flyer",
              desc: "Personalisierte Werbematerialien mit Ihrem Branding.",
              downloadUrl: null,
              fileName: null,
            },
          ].map((mat) => (
            <div key={mat.title} style={s.materialCard}>
              <div style={s.materialIcon}>
                <mat.icon size={20} />
              </div>
              <div>
                <p style={s.materialTitle}>{mat.title}</p>
                <p style={s.materialDesc}>{mat.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  {mat.downloadUrl ? (
                    <a
                      href={mat.downloadUrl}
                      download={mat.fileName}
                      style={s.downloadBtn}
                    >
                      <FileDown size={13} />
                      Herunterladen
                    </a>
                  ) : (
                    <>
                      <span style={s.materialBadge}>
                        <Clock size={12} />
                        Demnächst verfügbar
                      </span>
                      <a href="mailto:info@baunity.de?subject=Individuelle%20Flyer%20anfordern" style={s.materialLink}>
                        <Mail size={13} />
                        Anfordern
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vorteile / Stats ── */}
      <div>
        <h2 style={s.sectionTitle}>
          <Star size={18} color="#EAD068" />
          Vorteile auf einen Blick
        </h2>
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={s.statValue}>2–5 Tage</div>
            <div style={s.statLabel}>Ø Bearbeitungszeit</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>850+</div>
            <div style={s.statLabel}>Netzbetreiber abgedeckt</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>98%</div>
            <div style={s.statLabel}>Erstgenehmigungsquote</div>
          </div>
        </div>
      </div>

      {/* ── Kontakt ── */}
      <div style={s.contactBox}>
        <div style={s.contactItem}>
          <Mail size={16} color="#EAD068" />
          <a href="mailto:info@baunity.de" style={s.contactLink}>info@baunity.de</a>
        </div>
        <div style={s.contactItem}>
          <Globe size={16} color="#EAD068" />
          <a href="https://www.baunity.de" target="_blank" rel="noopener noreferrer" style={s.contactLink}>
            www.baunity.de
          </a>
        </div>
        <div style={s.contactItem}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>Fragen? Wir beraten Sie gerne!</span>
        </div>
      </div>
    </div>
  );
}

export default HvProgrammTab;

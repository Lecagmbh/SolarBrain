import { useState, useRef, lazy, Suspense } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/AuthContext";
import {
  LayoutDashboard,
  Zap,
  Wand2,
  Mail,
  BookOpen,
  Database,
  MessageCircle,
  Users,
  FileText,
  Wallet,
  Palette,
  Gift,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  type LucideIcon,
} from "lucide-react";

const DashboardBackground = lazy(() =>
  import("../components/three/DashboardBackground").then((m) => ({
    default: m.DashboardBackground,
  }))
);

const TOTAL_STEPS = 5;

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
};

// Step 2: Anlagen & Workflow
const workflowFeatures: FeatureCard[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Alle Anlagen auf einen Blick – Pipeline-Status, offene Aufgaben, Termine.",
    color: "#D4A843",
  },
  {
    icon: Zap,
    title: "Meine Anlagen",
    description:
      "Jede Netzanmeldung verfolgen – vom Eingang bis zur Genehmigung.",
    color: "#f59e0b",
  },
  {
    icon: Wand2,
    title: "Anlagen-Wizard",
    description:
      "Neue PV-Anlage in Minuten anlegen. Der Wizard führt Sie durch alle Schritte.",
    color: "#a855f7",
  },
  {
    icon: Mail,
    title: "Installations-Email",
    description:
      "Jede Anlage bekommt eine eigene Email (z.B. inst-ABC123@baunity.de). Emails vom Netzbetreiber werden automatisch zugeordnet.",
    color: "#ec4899",
  },
  {
    icon: BookOpen,
    title: "NB-Wissen",
    description:
      "Alles über Netzbetreiber: Anforderungen, Bearbeitungszeiten, Besonderheiten.",
    color: "#14b8a6",
  },
  {
    icon: Database,
    title: "Geräte-Datenbank",
    description:
      "Wechselrichter, Speicher und Module aller Hersteller – technische Daten, Kompatibilität und Zertifizierungen auf einen Blick.",
    color: "#3b82f6",
  },
];

// Step 3: Kommunikation & Portal
const communicationFeatures: FeatureCard[] = [
  // DEAKTIVIERT: WhatsApp
  // {
  //   icon: MessageCircle,
  //   title: "WhatsApp",
  //   description: "...",
  //   color: "#22c55e",
  // },
  {
    icon: Users,
    title: "Kundenportal",
    description:
      "Aktivieren Sie das Portal pro Installation – Ihre Endkunden können Status, Dokumente und Rückfragen selbst einsehen, direkt über einen persönlichen Login.",
    color: "#D4A843",
  },
  {
    icon: FileText,
    title: "Dokumente",
    description:
      "Lageplan, Schaltplan, Datenblätter – alle Unterlagen zentral verwaltet und jederzeit verfügbar.",
    color: "#f59e0b",
  },
  {
    icon: Wallet,
    title: "Rechnungen",
    description:
      "Alle Abrechnungen im Blick. Transparent und übersichtlich.",
    color: "#ec4899",
  },
];

// Step 4: Wachstum & Partner
const growthFeatures: FeatureCard[] = [
  {
    icon: Palette,
    title: "White Label",
    description:
      "Ihr eigenes Branding: Logo, Farben und Firmenname. Kontaktieren Sie uns, um Ihr individuelles Portal einzurichten.",
    color: "#a855f7",
  },
  {
    icon: Users,
    title: "Subunternehmer",
    description:
      "Erstellen Sie Zugänge für Ihre Subunternehmer. Jeder kann eigene Anlagen verwalten, Sie behalten den Überblick.",
    color: "#3b82f6",
  },
  {
    icon: Gift,
    title: "Weiterempfehlung",
    description:
      "Empfehlen Sie Baunity weiter und verdienen Sie bei jeder Anlage mit. Unser Partnerprogramm belohnt Ihre Empfehlungen mit attraktiven Provisionen.",
    color: "#f59e0b",
  },
];

function FeatureGrid({ features }: { features: FeatureCard[] }) {
  return (
    <div className="ob-feature-grid">
      {features.map((f, i) => (
        <div
          key={f.title}
          className="ob-feature-card"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div
            className="ob-feature-icon"
            style={{ background: `${f.color || "#D4A843"}18` }}
          >
            <f.icon
              size={22}
              style={{ color: f.color || "#D4A843" }}
              strokeWidth={1.8}
            />
          </div>
          <div className="ob-feature-content">
            <h3 className="ob-feature-title">{f.title}</h3>
            <p className="ob-feature-desc">{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="ob-progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`ob-dot ${i === current ? "ob-dot--active" : ""} ${i < current ? "ob-dot--done" : ""}`}
        />
      ))}
    </div>
  );
}

// Step 1: Willkommen
function WelcomeStep({
  companyName,
  onNext,
}: {
  companyName: string;
  onNext: () => void;
}) {
  return (
    <div className="ob-step ob-animate">
      <div className="ob-logo-wrap">
        <svg
          viewBox="0 0 40 40"
          width="56"
          height="56"
          className="ob-logo-svg"
        >
          <defs>
            <linearGradient id="obGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#obGrad)" />
          <path
            d="M12 20 L18 26 L28 14"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="ob-title">
        {"Willkommen bei Baunity"}
        {companyName ? `, ${companyName}` : ""}{"!"}
      </h1>
      <p className="ob-subtitle">
        {"Ihre zentrale Plattform für automatisierte Netzanmeldungen"}
      </p>
      <ul className="ob-bullet-list">
        <li>
          <Check size={16} className="ob-bullet-icon" />
          {"Automatische Netzanmeldungen"}
        </li>
        <li>
          <Check size={16} className="ob-bullet-icon" />
          {"Alle Dokumente an einem Ort"}
        </li>
        <li>
          <Check size={16} className="ob-bullet-icon" />
          {"Echtzeit-Status für jede Anlage"}
        </li>
        {/* DEAKTIVIERT: WhatsApp */}
        <li>
          <Check size={16} className="ob-bullet-icon" />
          {"Eigenes Kundenportal für Ihre Endkunden"}
        </li>
      </ul>
      <button className="ob-btn ob-btn--primary" onClick={onNext}>
        {"Los geht's"}
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// Step 2: Anlagen & Workflow
function WorkflowStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="ob-step ob-animate">
      <h2 className="ob-step-title">{"Ihre Anlagen im Griff"}</h2>
      <p className="ob-step-subtitle">
        {"Von der Erfassung bis zur Genehmigung – alles in einer Plattform."}
      </p>
      <FeatureGrid features={workflowFeatures} />
      <div className="ob-nav">
        <button className="ob-btn ob-btn--secondary" onClick={onBack}>
          <ChevronLeft size={18} />
          {"Zurück"}
        </button>
        <button className="ob-btn ob-btn--primary" onClick={onNext}>
          {"Weiter"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Step 3: Kommunikation & Portal
function CommunicationStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="ob-step ob-animate">
      <h2 className="ob-step-title">{"Kommunikation & Service"}</h2>
      <p className="ob-step-subtitle">
        {"Bleiben Sie mit Ihren Kunden und Netzbetreibern in Verbindung."}
      </p>
      <FeatureGrid features={communicationFeatures} />
      <div className="ob-nav">
        <button className="ob-btn ob-btn--secondary" onClick={onBack}>
          <ChevronLeft size={18} />
          {"Zurück"}
        </button>
        <button className="ob-btn ob-btn--primary" onClick={onNext}>
          {"Weiter"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Step 4: Wachstum & Partner
function GrowthStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="ob-step ob-animate">
      <h2 className="ob-step-title">{"Wachsen Sie mit Baunity"}</h2>
      <p className="ob-step-subtitle">
        {"Tools für Skalierung, Partnerschaften und Ihr eigenes Branding."}
      </p>
      <FeatureGrid features={growthFeatures} />
      <div className="ob-nav">
        <button className="ob-btn ob-btn--secondary" onClick={onBack}>
          <ChevronLeft size={18} />
          {"Zurück"}
        </button>
        <button className="ob-btn ob-btn--primary" onClick={onNext}>
          {"Weiter"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Step 5: Los geht's
function ReadyStep({
  onFinish,
  onBack,
}: {
  onFinish: (path: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="ob-step ob-animate">
      <div className="ob-ready-icon">
        <Rocket size={40} strokeWidth={1.5} />
      </div>
      <h2 className="ob-step-title">{"Alles bereit!"}</h2>
      <p className="ob-step-subtitle">
        {"Wählen Sie, womit Sie starten möchten."}
      </p>
      <div className="ob-quick-actions">
        <button
          className="ob-action-card"
          onClick={() => onFinish("/anlagen-wizard")}
        >
          <Wand2 size={24} style={{ color: "#a855f7" }} strokeWidth={1.8} />
          <span>{"Erste Anlage anlegen"}</span>
          <ChevronRight
            size={16}
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
        </button>
        <button
          className="ob-action-card"
          onClick={() => onFinish("/dashboard")}
          style={{ display: "none" }}
        >
          <span>{"WhatsApp einrichten (deaktiviert)"}</span>
        </button>
        <button
          className="ob-action-card"
          onClick={() => onFinish("/dashboard")}
        >
          <LayoutDashboard
            size={24}
            style={{ color: "#D4A843" }}
            strokeWidth={1.8}
          />
          <span>{"Zum Dashboard"}</span>
          <ChevronRight
            size={16}
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
        </button>
      </div>
      <div className="ob-nav" style={{ justifyContent: "flex-start" }}>
        <button className="ob-btn ob-btn--secondary" onClick={onBack}>
          <ChevronLeft size={18} />
          {"Zurück"}
        </button>
      </div>
    </div>
  );
}

export default function KundenOnboardingPage() {
  const { user, preferences, setPreference } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const finishingRef = useRef(false);

  // Already completed -> redirect to dashboard (but not while finishing)
  if (preferences?.onboarding?.completed === true && !finishingRef.current) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not a KUNDE/DEMO/SUBUNTERNEHMER -> redirect to dashboard
  if (user && user.role !== "KUNDE" && user.role !== "DEMO" && user.role !== "SUBUNTERNEHMER") {
    return <Navigate to="/dashboard" replace />;
  }

  const companyName =
    user?.kunde?.firmenName || user?.kunde?.name || "";

  const handleFinish = async (targetPath: string) => {
    if (completing) return;
    finishingRef.current = true;
    setCompleting(true);
    try {
      await setPreference("onboarding", "completed", true);
    } catch {
      // Even if preference save fails, let the user continue
    }
    navigate(targetPath, { replace: true });
  };

  return (
    <>
      <style>{kundenOnboardingStyles}</style>
      <Suspense fallback={null}>
        <DashboardBackground />
      </Suspense>
      <div className="kob-root">
        <div className="kob-container">
          <ProgressDots current={step} total={TOTAL_STEPS} />
          <div className="kob-card">
            {step === 0 && (
              <WelcomeStep
                companyName={companyName}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && (
              <WorkflowStep
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <CommunicationStep
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <GrowthStep
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <ReadyStep
                onFinish={handleFinish}
                onBack={() => setStep(3)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const kundenOnboardingStyles = `
  @keyframes kobFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes kobPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0.4); }
    50%      { box-shadow: 0 0 0 10px rgba(212,168,67,0); }
  }
  @keyframes kobRocket {
    0%   { transform: translateY(0) rotate(-5deg); }
    50%  { transform: translateY(-8px) rotate(5deg); }
    100% { transform: translateY(0) rotate(-5deg); }
  }
  @keyframes kobCardIn {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .kob-root {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(4px);
    padding: 20px;
    overflow-y: auto;
  }

  .kob-container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .ob-progress {
    display: flex;
    gap: 8px;
  }
  .ob-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    transition: all 0.3s ease;
  }
  .ob-dot--active {
    background: linear-gradient(135deg, #D4A843, #a855f7);
    box-shadow: 0 0 12px rgba(212,168,67,0.5);
    animation: kobPulse 2s ease-in-out infinite;
  }
  .ob-dot--done {
    background: #D4A843;
  }

  .kob-card {
    width: 100%;
    background: rgba(12, 12, 20, 0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }

  .ob-step { display: flex; flex-direction: column; align-items: center; }
  .ob-animate { animation: kobFadeUp 0.35s ease-out; }

  .ob-logo-wrap {
    margin-bottom: 24px;
    animation: kobPulse 3s ease-in-out infinite;
    border-radius: 16px;
  }
  .ob-logo-svg { filter: drop-shadow(0 4px 20px rgba(212,168,67,0.4)); }

  .ob-title {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px;
    text-align: center;
    line-height: 1.3;
  }
  .ob-subtitle {
    font-size: 15px;
    color: rgba(255,255,255,0.55);
    margin: 0 0 28px;
    text-align: center;
    line-height: 1.5;
  }
  .ob-step-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 6px;
    text-align: center;
  }
  .ob-step-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    margin: 0 0 24px;
    text-align: center;
    line-height: 1.5;
  }

  .ob-bullet-list {
    list-style: none;
    padding: 0;
    margin: 0 0 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 360px;
  }
  .ob-bullet-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }
  .ob-bullet-icon {
    color: #D4A843;
    flex-shrink: 0;
  }

  .ob-feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    margin-bottom: 28px;
  }
  .ob-feature-card {
    display: flex;
    gap: 12px;
    padding: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    transition: all 0.2s ease;
    animation: kobCardIn 0.3s ease-out both;
  }
  .ob-feature-card:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-2px);
  }
  .ob-feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ob-feature-content { flex: 1; min-width: 0; }
  .ob-feature-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 3px;
  }
  .ob-feature-desc {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.45;
  }

  .ob-nav {
    display: flex;
    gap: 12px;
    justify-content: center;
    width: 100%;
  }
  .ob-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .ob-btn--primary {
    background: linear-gradient(135deg, #D4A843, #a855f7);
    color: #fff;
    box-shadow: 0 4px 16px rgba(212,168,67,0.3);
  }
  .ob-btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(212,168,67,0.4);
  }
  .ob-btn--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  .ob-btn--secondary {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .ob-btn--secondary:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .ob-ready-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(212,168,67,0.15), rgba(168,85,247,0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: #a855f7;
    animation: kobRocket 3s ease-in-out infinite;
  }

  .ob-quick-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    margin-bottom: 24px;
  }
  .ob-action-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    width: 100%;
  }
  .ob-action-card span { flex: 1; }
  .ob-action-card:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(212,168,67,0.3);
    transform: translateX(4px);
  }

  @media (max-width: 640px) {
    .kob-card { padding: 24px 18px; }
    .ob-title { font-size: 22px; }
    .ob-feature-grid { grid-template-columns: 1fr; }
    .ob-step-title { font-size: 19px; }
    .ob-nav { flex-direction: column-reverse; }
    .ob-nav .ob-btn { width: 100%; justify-content: center; }
  }
`;

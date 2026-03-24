/**
 * AI Center – Unified Intelligence Dashboard
 * Combines RAG Admin, Brain Admin, Agent Center, Claude AI Dashboard
 */

import { useState, lazy, Suspense } from "react";
import { Brain, Database, Bot, Sparkles, Loader2 } from "lucide-react";
import "./ai-center.css";

const RagAdminPage = lazy(() =>
  import("../features/rag-admin").then((m) => ({ default: m.RagAdminPage }))
);
const BrainAdminPage = lazy(() =>
  import("../features/brain-admin").then((m) => ({ default: m.BrainAdminPage }))
);
const AgentCenterPage = lazy(() =>
  import("../features/agent-center").then((m) => ({ default: m.AgentCenterPage }))
);
const ClaudeAIDashboardPage = lazy(() =>
  import("../features/claude-ai-dashboard").then((m) => ({
    default: m.ClaudeAIDashboardPage,
  }))
);

type AITab = "rag" | "brain" | "agents" | "claude";

const AI_TABS: { id: AITab; label: string; icon: React.ReactNode }[] = [
  { id: "rag", label: "RAG System", icon: <Database size={16} /> },
  { id: "brain", label: "Brain", icon: <Brain size={16} /> },
  { id: "agents", label: "Agents", icon: <Bot size={16} /> },
  { id: "claude", label: "AI Dashboard", icon: <Sparkles size={16} /> },
];

function LoadingFallback() {
  return (
    <div className="aic-loading">
      <Loader2 size={24} className="animate-spin" />
      <span>Lade...</span>
    </div>
  );
}

export default function AICenterPage() {
  const [tab, setTab] = useState<AITab>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("section") as AITab) || "rag";
  });

  const handleTabChange = (newTab: AITab) => {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("section", newTab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="aic-page">
      {/* Top-level tab bar */}
      <div className="aic-tab-bar">
        {AI_TABS.map((t) => (
          <button
            key={t.id}
            className={`aic-tab ${tab === t.id ? "aic-tab--active" : ""}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content – each sub-page renders its own header/tabs */}
      <div className="aic-content">
        <Suspense fallback={<LoadingFallback />}>
          {tab === "rag" && <RagAdminPage />}
          {tab === "brain" && <BrainAdminPage />}
          {tab === "agents" && <AgentCenterPage />}
          {tab === "claude" && <ClaudeAIDashboardPage />}
        </Suspense>
      </div>
    </div>
  );
}

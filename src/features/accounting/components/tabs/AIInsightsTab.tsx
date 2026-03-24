/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI INSIGHTS TAB
 * KI-gestützte Finanzanalysen, Anomalie-Erkennung, Chat
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import * as accountingApi from "../../../../api/accounting";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIInsightsTab() {
  const [insights, setInsights] = useState<accountingApi.AIInsights | null>(null);
  const [anomalies, setAnomalies] = useState<accountingApi.Anomaly[]>([]);
  const [topExpenses, setTopExpenses] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectingAnomalies, setDetectingAnomalies] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function loadData() {
    try {
      setLoading(true);
      const [insightsRes, anomaliesRes, expensesRes, customersRes] = await Promise.all([
        accountingApi.getAIInsights(),
        accountingApi.getAnomalies(),
        accountingApi.getTopExpenseCategories(undefined, undefined, 5),
        accountingApi.getTopCustomers(undefined, undefined, 5),
      ]);
      setInsights(insightsRes);
      setAnomalies(anomaliesRes);
      setTopExpenses(expensesRes);
      setTopCustomers(customersRes);
    } catch (err) {
      console.error("Failed to load AI insights:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDetectAnomalies() {
    try {
      setDetectingAnomalies(true);
      const newAnomalies = await accountingApi.detectAnomalies();
      setAnomalies(newAnomalies);
    } catch (err) {
      console.error("Anomaly detection failed:", err);
    } finally {
      setDetectingAnomalies(false);
    }
  }

  async function handleResolveAnomaly(id: number) {
    const resolution = prompt("Wie wurde diese Anomalie gelöst?");
    if (!resolution) return;

    try {
      await accountingApi.resolveAnomaly(id, resolution);
      setAnomalies((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to resolve anomaly:", err);
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await accountingApi.sendChatMessage(userMessage, chatMessages);
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.response }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Entschuldigung, es ist ein Fehler aufgetreten." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          color: "var(--dash-text-subtle, #71717a)",
        }}
      >
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 2.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--dash-text, #fafafa)",
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Sparkles size={20} color="#EAD068" />
            KI Insights
          </h2>
          <p style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem", margin: 0 }}>
            Intelligente Finanzanalysen und Empfehlungen
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* AI Summary Card */}
          {insights && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(212, 168, 67, 0.1) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "16px",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Sparkles size={18} color="#EAD068" />
                <h3
                  style={{
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Monatliche Zusammenfassung
                </h3>
              </div>

              <p
                style={{
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                {insights.summary || "Analysiere Finanzdaten..."}
              </p>

              {/* Key Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <MetricCard
                  label="Umsatz"
                  value={formatCurrency(insights.revenue?.total || 0)}
                  change={insights.revenue?.change || 0}
                  positive
                />
                <MetricCard
                  label="Ausgaben"
                  value={formatCurrency(insights.expenses?.total || 0)}
                  change={insights.expenses?.change || 0}
                  positive={false}
                />
                <MetricCard
                  label="Gewinn"
                  value={formatCurrency(insights.profit?.total || 0)}
                  change={insights.profit?.margin || 0}
                  positive={(insights.profit?.total || 0) >= 0}
                  suffix="%"
                />
              </div>

              {/* Highlights */}
              {insights.highlights && insights.highlights.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h4
                    style={{
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Highlights
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {insights.highlights.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <CheckCircle2 size={14} color="#10b981" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h4
                    style={{
                      color: "var(--dash-text-subtle, #71717a)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Empfehlungen
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {insights.recommendations.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <Lightbulb size={14} color="#f59e0b" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Anomalies Section */}
          <div
            style={{
              background: "var(--dash-card-bg, #111113)",
              border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <h3
                  style={{
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Anomalie-Erkennung
                </h3>
                {anomalies.length > 0 && (
                  <span
                    style={{
                      padding: "0.125rem 0.5rem",
                      background: "rgba(245, 158, 11, 0.1)",
                      borderRadius: "4px",
                      color: "#f59e0b",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                  >
                    {anomalies.length}
                  </span>
                )}
              </div>
              <button
                onClick={handleDetectAnomalies}
                disabled={detectingAnomalies}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "6px",
                  color: "#f59e0b",
                  fontSize: "0.75rem",
                  cursor: detectingAnomalies ? "wait" : "pointer",
                }}
              >
                <RefreshCw size={12} className={detectingAnomalies ? "animate-spin" : ""} />
                Prüfen
              </button>
            </div>

            {anomalies.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--dash-text-subtle, #71717a)",
                }}
              >
                <CheckCircle2 size={32} style={{ marginBottom: "0.5rem", color: "#10b981" }} />
                <p style={{ margin: 0, fontSize: "0.85rem" }}>Keine Anomalien erkannt</p>
              </div>
            ) : (
              <div>
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background:
                          anomaly.severity === "HIGH"
                            ? "rgba(239, 68, 68, 0.1)"
                            : anomaly.severity === "MEDIUM"
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(212, 168, 67, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle
                        size={16}
                        color={
                          anomaly.severity === "HIGH"
                            ? "#ef4444"
                            : anomaly.severity === "MEDIUM"
                            ? "#f59e0b"
                            : "#D4A843"
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: "var(--dash-text, #fafafa)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {anomaly.title}
                      </div>
                      <div
                        style={{
                          color: "var(--dash-text-subtle, #71717a)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {anomaly.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAnomaly(anomaly.id)}
                      style={{
                        padding: "0.375rem 0.625rem",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#10b981",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                      }}
                    >
                      Lösen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Top Expenses */}
            <div
              style={{
                background: "var(--dash-card-bg, #111113)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <BarChart3 size={16} color="#f59e0b" />
                <h4
                  style={{
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Top Ausgaben
                </h4>
              </div>
              {topExpenses.map((exp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom:
                      i < topExpenses.length - 1
                        ? "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))"
                        : "none",
                  }}
                >
                  <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
                    {exp.category}
                  </span>
                  <span style={{ color: "var(--dash-text, #fafafa)", fontSize: "0.8rem", fontWeight: 500 }}>
                    {formatCurrency(exp.total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Top Customers */}
            <div
              style={{
                background: "var(--dash-card-bg, #111113)",
                border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Users size={16} color="#10b981" />
                <h4
                  style={{
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Top Kunden
                </h4>
              </div>
              {topCustomers.map((cust, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom:
                      i < topCustomers.length - 1
                        ? "1px solid var(--dash-border, rgba(255, 255, 255, 0.05))"
                        : "none",
                  }}
                >
                  <span style={{ color: "var(--dash-text-subtle, #71717a)", fontSize: "0.8rem" }}>
                    {cust.name}
                  </span>
                  <span style={{ color: "var(--dash-text, #fafafa)", fontSize: "0.8rem", fontWeight: 500 }}>
                    {formatCurrency(cust.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div
          style={{
            background: "var(--dash-card-bg, #111113)",
            border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            height: "600px",
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <MessageSquare size={16} color="#EAD068" />
            <h3
              style={{
                color: "var(--dash-text, #fafafa)",
                fontSize: "0.9rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Buchhaltungs-Assistent
            </h3>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {chatMessages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 1rem",
                  color: "var(--dash-text-subtle, #71717a)",
                }}
              >
                <Sparkles size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "0.85rem" }}>
                  Frag mich etwas zu deinen Finanzen!
                </p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem" }}>
                  z.B. "Was waren unsere größten Ausgaben?" oder "Wie ist unser Cashflow?"
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: "var(--dash-text, #fafafa)",
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--dash-text-subtle, #71717a)",
                    fontSize: "0.8rem",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{ display: "flex", gap: "0.5rem" }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Frage stellen..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: "0.625rem 0.875rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
                  borderRadius: "8px",
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "0.8rem",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: "0.625rem",
                  background: "linear-gradient(135deg, #EAD068 0%, #D4A843 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                  opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  positive: boolean;
  suffix?: string;
}

function MetricCard({ label, value, change, positive, suffix }: MetricCardProps) {
  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        padding: "0.875rem",
      }}
    >
      <div
        style={{
          color: "var(--dash-text-subtle, #71717a)",
          fontSize: "0.7rem",
          fontWeight: 500,
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--dash-text, #fafafa)",
          fontSize: "1.125rem",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          color: positive ? "#10b981" : "#ef4444",
          fontSize: "0.7rem",
        }}
      >
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change >= 0 ? "+" : ""}
        {change.toFixed(1)}
        {suffix || "%"}
      </div>
    </div>
  );
}

export default AIInsightsTab;

// src/components/BankIntegration.tsx
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  BANK INTEGRATION UI - GoCardless Open Banking                                ║
// ║  Automatischer Bankabgleich für Rechnungen                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useState, useEffect, useCallback } from "react";
import { 
  Building2, Link2, Unlink, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, Search, ExternalLink, CreditCard, TrendingUp,
  Clock, X, Check, HelpCircle, Zap, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { getAccessToken } from "../modules/auth/tokenStorage";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

interface BankConnection {
  id: number;
  requisitionId: string;
  institutionId: string;
  institutionName: string | null;
  accountId: string | null;
  iban: string | null;
  status: string;
  lastSync: string | null;
  createdAt: string;
}

interface BankTransaction {
  id: number;
  bookingDate: string;
  amount: number;
  currency: string;
  remittanceInfo: string | null;
  debtorName: string | null;
  debtorIban: string | null;
  matchedRechnungId: number | null;
  matchConfidence: string | null;
  matchedAt: string | null;
  bankIban: string | null;
}

interface Institution {
  id: string;
  name: string;
  logo: string;
}

interface BankStats {
  activeConnections: number;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  matchRate: number;
  lastSync: string | null;
}

export default function BankIntegration() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [stats, setStats] = useState<BankStats | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [showTransactions, setShowTransactions] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = getAccessToken();

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [connRes, txRes, statsRes] = await Promise.all([
        fetch("/api/bank/connections", { headers }),
        fetch("/api/bank/transactions?limit=50", { headers }),
        fetch("/api/bank/stats", { headers }),
      ]);

      if (connRes.ok) setConnections(await connRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    
    // Check for callback from bank auth
    const params = new URLSearchParams(window.location.search);
    if (params.get("bank") === "callback") {
      handleBankCallback();
    }
  }, [fetchData]);

  const handleBankCallback = async () => {
    // Find pending connection and complete it
    const pending = connections.find(c => c.status === "PENDING");
    if (pending) {
      try {
        const res = await fetch("/api/bank/callback", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ requisitionId: pending.requisitionId }),
        });
        
        if (res.ok) {
          setSuccess("Bank erfolgreich verknüpft! 🎉");
          fetchData();
        }
      } catch {}
    }
    
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
  };

  const loadInstitutions = async () => {
    if (institutions.length > 0) return;
    
    try {
      const res = await fetch("/api/bank/institutions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data.institutions || []);
      }
    } catch {}
  };

  const connectBank = async (institutionId: string) => {
    setConnecting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/bank/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ institutionId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Verbindung fehlgeschlagen");
      }
      
      // Redirect to bank auth
      window.location.href = data.authUrl;
    } catch (e: any) {
      setError(e.message);
      setConnecting(false);
    }
  };

  const disconnectBank = async (id: number) => {
    if (!confirm("Bankverbindung wirklich trennen?")) return;
    
    try {
      const res = await fetch(`/api/bank/connections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setSuccess("Bankverbindung getrennt");
        fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const syncTransactions = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      const res = await fetch("/api/bank/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Sync fehlgeschlagen");
      }
      
      setSuccess(
        `Sync abgeschlossen: ${data.transactionsImported} neue Transaktionen, ` +
        `${data.matchesFound} Matches, ${data.invoicesPaid} Rechnungen bezahlt`
      );
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredInstitutions = institutions.filter(i =>
    i.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Popular banks first
  const popularBanks = ["VIVID", "SPARKASSE", "VOLKSBANK", "COMMERZBANK", "DEUTSCHE_BANK", "ING", "N26", "DKB"];
  const sortedInstitutions = [...filteredInstitutions].sort((a, b) => {
    const aPopular = popularBanks.some(p => a.id.toUpperCase().includes(p));
    const bPopular = popularBanks.some(p => b.id.toUpperCase().includes(p));
    if (aPopular && !bPopular) return -1;
    if (!aPopular && bPopular) return 1;
    return a.name.localeCompare(b.name);
  });

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtMoney = (n: number) => 
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

  if (loading) {
    return (
      <div className="bank-loading">
        <Loader2 className="bank-loading__spinner" />
        <span>Lade Bankdaten...</span>
      </div>
    );
  }

  const activeConnection = connections.find(c => c.status === "LINKED");

  return (
    <div className="bank-integration">
      <style>{styles}</style>

      {/* Header */}
      <div className="bank-header">
        <div className="bank-header__icon">
          <Building2 size={24} />
        </div>
        <div className="bank-header__text">
          <h2>Bank-Integration</h2>
          <p>Automatischer Rechnungsabgleich mit GoCardless Open Banking</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bank-alert bank-alert--error">
          <AlertTriangle size={18} />
          <span>{safeString(error)}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bank-alert bank-alert--success">
          <CheckCircle2 size={18} />
          <span>{safeString(success)}</span>
          <button onClick={() => setSuccess(null)}><X size={16} /></button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bank-stats">
          <div className="bank-stat">
            <div className="bank-stat__icon"><Link2 size={20} /></div>
            <div className="bank-stat__content">
              <span className="bank-stat__value">{stats.activeConnections}</span>
              <span className="bank-stat__label">Verbindung{stats.activeConnections !== 1 ? "en" : ""}</span>
            </div>
          </div>
          <div className="bank-stat">
            <div className="bank-stat__icon"><CreditCard size={20} /></div>
            <div className="bank-stat__content">
              <span className="bank-stat__value">{stats.totalTransactions}</span>
              <span className="bank-stat__label">Transaktionen</span>
            </div>
          </div>
          <div className="bank-stat">
            <div className="bank-stat__icon"><CheckCircle2 size={20} /></div>
            <div className="bank-stat__content">
              <span className="bank-stat__value">{stats.matchRate}%</span>
              <span className="bank-stat__label">Match-Rate</span>
            </div>
          </div>
          <div className="bank-stat">
            <div className="bank-stat__icon"><Clock size={20} /></div>
            <div className="bank-stat__content">
              <span className="bank-stat__value">{stats.lastSync ? fmtDate(stats.lastSync).split(",")[0] : "—"}</span>
              <span className="bank-stat__label">Letzter Sync</span>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bank-section">
        <h3>Bankverbindung</h3>
        
        {activeConnection ? (
          <div className="bank-connection bank-connection--active">
            <div className="bank-connection__info">
              <div className="bank-connection__bank">
                <Building2 size={24} />
                <div>
                  <strong>{activeConnection.institutionName || activeConnection.institutionId}</strong>
                  <span className="bank-connection__iban">{activeConnection.iban}</span>
                </div>
              </div>
              <div className="bank-connection__status">
                <CheckCircle2 size={16} />
                Verbunden
              </div>
            </div>
            <div className="bank-connection__actions">
              <button 
                className="bank-btn bank-btn--primary"
                onClick={syncTransactions}
                disabled={syncing}
              >
                {syncing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                {syncing ? "Synchronisiere..." : "Jetzt synchronisieren"}
              </button>
              <button 
                className="bank-btn bank-btn--ghost"
                onClick={() => disconnectBank(activeConnection.id)}
              >
                <Unlink size={16} />
                Trennen
              </button>
            </div>
            {activeConnection.lastSync && (
              <div className="bank-connection__lastsync">
                Letzter Sync: {fmtDate(activeConnection.lastSync)}
              </div>
            )}
          </div>
        ) : (
          <div className="bank-connection bank-connection--empty">
            <div className="bank-connection__empty-icon">
              <Building2 size={48} />
            </div>
            <p>Keine Bank verbunden</p>
            <button 
              className="bank-btn bank-btn--primary bank-btn--lg"
              onClick={() => { setShowBankSelector(true); loadInstitutions(); }}
            >
              <Link2 size={18} />
              Bank verbinden
            </button>
          </div>
        )}
      </div>

      {/* Bank Selector Modal */}
      {showBankSelector && (
        <div className="bank-modal-overlay" onClick={() => setShowBankSelector(false)}>
          <div className="bank-modal" onClick={e => e.stopPropagation()}>
            <div className="bank-modal__header">
              <h3>Bank auswählen</h3>
              <button onClick={() => setShowBankSelector(false)}><X size={20} /></button>
            </div>
            
            <div className="bank-modal__search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Bank suchen..."
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="bank-modal__list">
              {sortedInstitutions.length === 0 ? (
                <div className="bank-modal__empty">
                  <Loader2 size={24} className="spin" />
                  <span>Lade Banken...</span>
                </div>
              ) : (
                sortedInstitutions.slice(0, 50).map(bank => (
                  <button
                    key={bank.id}
                    className="bank-modal__item"
                    onClick={() => connectBank(bank.id)}
                    disabled={connecting}
                  >
                    {bank.logo ? (
                      <img src={bank.logo} alt="" className="bank-modal__logo" />
                    ) : (
                      <Building2 size={24} />
                    )}
                    <span>{bank.name}</span>
                    <ArrowRight size={16} />
                  </button>
                ))
              )}
            </div>

            <div className="bank-modal__footer">
              <HelpCircle size={14} />
              <span>Powered by GoCardless Open Banking</span>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeConnection && (
        <div className="bank-section">
          <div 
            className="bank-section__header"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            <h3>
              <FileText size={18} />
              Transaktionen
              {stats && stats.unmatchedTransactions > 0 && (
                <span className="bank-badge">{stats.unmatchedTransactions} offen</span>
              )}
            </h3>
            {showTransactions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {showTransactions && (
            <div className="bank-transactions">
              {transactions.length === 0 ? (
                <div className="bank-transactions__empty">
                  <CreditCard size={32} />
                  <p>Noch keine Transaktionen importiert</p>
                  <button className="bank-btn bank-btn--primary" onClick={syncTransactions}>
                    <RefreshCw size={16} />
                    Jetzt synchronisieren
                  </button>
                </div>
              ) : (
                <table className="bank-transactions__table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Absender</th>
                      <th>Verwendungszweck</th>
                      <th>Betrag</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className={tx.matchedRechnungId ? "matched" : ""}>
                        <td>{fmtDate(tx.bookingDate).split(",")[0]}</td>
                        <td>
                          <div className="bank-tx__debtor">
                            <span>{tx.debtorName || "—"}</span>
                            {tx.debtorIban && <small>{tx.debtorIban}</small>}
                          </div>
                        </td>
                        <td className="bank-tx__info">{tx.remittanceInfo || "—"}</td>
                        <td className="bank-tx__amount">{fmtMoney(tx.amount)}</td>
                        <td>
                          {tx.matchedRechnungId ? (
                            <span className={`bank-tx__status bank-tx__status--${tx.matchConfidence?.toLowerCase()}`}>
                              <CheckCircle2 size={14} />
                              {tx.matchConfidence === "HIGH" ? "Auto-Match" : 
                               tx.matchConfidence === "MANUAL" ? "Manuell" : "Match"}
                            </span>
                          ) : (
                            <span className="bank-tx__status bank-tx__status--pending">
                              <AlertTriangle size={14} />
                              Offen
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bank-info">
        <Zap size={20} />
        <div>
          <strong>So funktioniert's:</strong>
          <p>
            Bei jedem Sync werden neue Zahlungseingänge geprüft. Wenn eine Rechnungsnummer 
            (z.B. RE-202601-000D53) im Verwendungszweck steht und der Betrag stimmt, wird 
            die Rechnung automatisch als bezahlt markiert.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = `
.bank-integration {
  max-width: 900px;
  margin: 0 auto;
}

.bank-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #64748b;
}

.bank-loading__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin { animation: spin 1s linear infinite; }

/* Header */
.bank-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.bank-header__icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EAD068, #06b6d4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bank-header__text h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: #f8fafc;
}

.bank-header__text p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Alerts */
.bank-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.bank-alert--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.bank-alert--success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.bank-alert button {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
}

.bank-alert button:hover { opacity: 1; }

/* Stats */
.bank-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.bank-stat {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.bank-stat__icon {
  width: 40px;
  height: 40px;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #EAD068;
}

.bank-stat__value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
}

.bank-stat__label {
  font-size: 0.75rem;
  color: #64748b;
}

/* Section */
.bank-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.bank-section h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bank-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin: -20px;
  padding: 20px;
}

.bank-section__header h3 {
  margin: 0;
}

.bank-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* Connection */
.bank-connection--empty {
  text-align: center;
  padding: 40px 20px;
}

.bank-connection__empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.bank-connection--empty p {
  color: #64748b;
  margin-bottom: 20px;
}

.bank-connection--active {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bank-connection__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.bank-connection__bank {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bank-connection__bank strong {
  display: block;
  color: #f8fafc;
}

.bank-connection__iban {
  font-size: 0.85rem;
  color: #64748b;
  font-family: monospace;
}

.bank-connection__status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 500;
}

.bank-connection__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.bank-connection__lastsync {
  font-size: 0.8rem;
  color: #64748b;
}

/* Buttons */
.bank-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.bank-btn--primary {
  background: linear-gradient(135deg, #EAD068, #7c3aed);
  color: white;
}

.bank-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.bank-btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.bank-btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bank-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.bank-btn--lg {
  padding: 14px 24px;
  font-size: 1rem;
}

/* Modal */
.bank-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.bank-modal {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.bank-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.bank-modal__header h3 {
  margin: 0;
  color: #f8fafc;
}

.bank-modal__header button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
}

.bank-modal__search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #64748b;
}

.bank-modal__search input {
  flex: 1;
  background: none;
  border: none;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
}

.bank-modal__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.bank-modal__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #64748b;
}

.bank-modal__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.bank-modal__item:hover {
  background: rgba(139, 92, 246, 0.15);
}

.bank-modal__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bank-modal__logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.bank-modal__item span {
  flex: 1;
}

.bank-modal__item svg:last-child {
  color: #64748b;
}

.bank-modal__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
  color: #64748b;
}

/* Transactions */
.bank-transactions {
  margin-top: 16px;
}

.bank-transactions__empty {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.bank-transactions__empty p {
  margin: 12px 0 20px;
}

.bank-transactions__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.bank-transactions__table th {
  text-align: left;
  padding: 8px 12px;
  color: #64748b;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.bank-transactions__table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

.bank-transactions__table tr.matched td {
  background: rgba(16, 185, 129, 0.05);
}

.bank-tx__debtor small {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
}

.bank-tx__info {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bank-tx__amount {
  font-weight: 600;
  color: #10b981 !important;
  font-family: monospace;
}

.bank-tx__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.bank-tx__status--high,
.bank-tx__status--manual {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.bank-tx__status--medium {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.bank-tx__status--pending {
  background: rgba(100, 116, 139, 0.15);
  color: #94a3b8;
}

/* Info Box */
.bank-info {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  font-size: 0.85rem;
}

.bank-info svg {
  flex-shrink: 0;
  color: #EAD068;
}

.bank-info strong {
  display: block;
  color: #f8fafc;
  margin-bottom: 4px;
}

.bank-info p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}
`;

/**
 * Baunity Netzbetreiber Intelligence Config
 * Komponente für NB-spezifische E-Mail Domains und Erkennungsmuster
 */

import { useState, useEffect, useCallback } from "react";
import "./NetzbetreiberConfig.css";

const getToken = () => localStorage.getItem('baunity_token');

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface EmailDomain {
  id: number;
  domain: string;
  isVerified: boolean;
  createdAt: string;
}

interface Pattern {
  id: number;
  patternType: string;
  pattern: string;
  description: string;
  priority: number;
  isActive: boolean;
}

interface NBStats {
  avgProcessingDays: number;
  medianProcessingDays: number;
  approvalRate: number;
  sampleSize: number;
  lastCalculated: string;
}

interface Props {
  netzbetreiberId: number;
  netzbetreiberName: string;
}

const PATTERN_TYPES = [
  { value: 'AKTENZEICHEN', label: 'Aktenzeichen-Format', description: 'Regex für das Aktenzeichen-Format dieses NB' },
  { value: 'BETREFF', label: 'Betreff-Keywords', description: 'Keywords die im Betreff vorkommen' },
  { value: 'ABSENDER', label: 'Absender-Pattern', description: 'Zusätzliche Absender-Patterns' },
  { value: 'INHALT', label: 'Inhalt-Keywords', description: 'Keywords im E-Mail-Inhalt' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NetzbetreiberConfig({ netzbetreiberId, netzbetreiberName }: Props) {
  const [activeTab, setActiveTab] = useState<'domains' | 'patterns' | 'stats'>('domains');
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [stats, setStats] = useState<NBStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Forms
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [showPatternForm, setShowPatternForm] = useState(false);
  const [newPattern, setNewPattern] = useState({ type: 'AKTENZEICHEN', pattern: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/config`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        setPatterns(data.patterns || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  }, [netzbetreiberId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      setError('Ungültiges Domain-Format (z.B. enbw.com)');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/domains`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() })
      });

      if (res.ok) {
        setNewDomain('');
        setShowDomainForm(false);
        await loadConfig();
      } else {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : (data.error?.message || 'Fehler beim Speichern'));
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const deleteDomain = async (domainId: number) => {
    if (!confirm('Domain wirklich entfernen?')) return;
    
    try {
      await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/domains/${domainId}`, {
        method: 'DELETE',
        headers
      });
      await loadConfig();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.pattern.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/patterns`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patternType: newPattern.type,
          pattern: newPattern.pattern.trim(),
          description: newPattern.description.trim()
        })
      });

      if (res.ok) {
        setNewPattern({ type: 'AKTENZEICHEN', pattern: '', description: '' });
        setShowPatternForm(false);
        await loadConfig();
      } else {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : (data.error?.message || 'Fehler beim Speichern'));
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const togglePattern = async (patternId: number, isActive: boolean) => {
    try {
      await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/patterns/${patternId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !isActive })
      });
      await loadConfig();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deletePattern = async (patternId: number) => {
    if (!confirm('Pattern wirklich löschen?')) return;
    
    try {
      await fetch(`/api/intelligence/netzbetreiber/${netzbetreiberId}/patterns/${patternId}`, {
        method: 'DELETE',
        headers
      });
      await loadConfig();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const recalculateStats = async () => {
    setSaving(true);
    try {
      await fetch('/api/intelligence/learn/calculate-stats', {
        method: 'POST',
        headers,
        body: JSON.stringify({ netzbetreiberId })
      });
      await loadConfig();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return <div className="nb-config-loading">Lade Konfiguration...</div>;
  }

  return (
    <div className="nb-config">
      {/* Header */}
      <div className="nb-config-header">
        <div>
          <h2>⚙️ {netzbetreiberName}</h2>
          <p>Intelligence Konfiguration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="nb-config-tabs">
        <button
          className={activeTab === 'domains' ? 'active' : ''}
          onClick={() => setActiveTab('domains')}
        >
          📧 E-Mail Domains
          <span className="tab-badge">{domains.length}</span>
        </button>
        <button
          className={activeTab === 'patterns' ? 'active' : ''}
          onClick={() => setActiveTab('patterns')}
        >
          🔍 Erkennungsmuster
          <span className="tab-badge">{patterns.length}</span>
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistiken
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="nb-config-error">
          {safeString(error)}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DOMAINS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'domains' && (
        <div className="nb-config-section">
          <div className="section-header">
            <div>
              <h3>E-Mail Domains</h3>
              <p>E-Mails von diesen Domains werden automatisch diesem Netzbetreiber zugeordnet.</p>
            </div>
            <button className="btn-add" onClick={() => setShowDomainForm(!showDomainForm)}>
              {showDomainForm ? '✕ Abbrechen' : '+ Domain hinzufügen'}
            </button>
          </div>

          {showDomainForm && (
            <form className="add-form" onSubmit={addDomain}>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Domain</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="z.B. enbw.com, netz-bw.de"
                    autoFocus
                  />
                  <span className="form-hint">Ohne @ oder www, nur die Domain</span>
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? '⏳' : '✓'} Hinzufügen
                </button>
              </div>
            </form>
          )}

          <div className="items-list">
            {domains.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>Noch keine Domains konfiguriert</p>
                <p className="empty-hint">Fügen Sie E-Mail-Domains hinzu, um automatische Zuordnung zu ermöglichen.</p>
              </div>
            ) : (
              domains.map(domain => (
                <div key={domain.id} className="item-row">
                  <div className="item-icon">📧</div>
                  <div className="item-content">
                    <span className="item-value">@{domain.domain}</span>
                    {domain.isVerified && <span className="badge verified">✓ Verifiziert</span>}
                  </div>
                  <button className="btn-delete" onClick={() => deleteDomain(domain.id)}>🗑️</button>
                </div>
              ))
            )}
          </div>

          <div className="section-tip">
            <strong>💡 Tipp:</strong> Viele Netzbetreiber nutzen mehrere Domains (z.B. enbw.com und netz-bw.de). 
            Fügen Sie alle relevanten Domains hinzu.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PATTERNS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'patterns' && (
        <div className="nb-config-section">
          <div className="section-header">
            <div>
              <h3>Erkennungsmuster</h3>
              <p>Patterns für automatische Erkennung von Aktenzeichen und Keywords.</p>
            </div>
            <button className="btn-add" onClick={() => setShowPatternForm(!showPatternForm)}>
              {showPatternForm ? '✕ Abbrechen' : '+ Pattern hinzufügen'}
            </button>
          </div>

          {showPatternForm && (
            <form className="add-form" onSubmit={addPattern}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Typ</label>
                  <select
                    value={newPattern.type}
                    onChange={e => setNewPattern({ ...newPattern, type: e.target.value })}
                  >
                    {PATTERN_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <span className="form-hint">
                    {PATTERN_TYPES.find(t => t.value === newPattern.type)?.description}
                  </span>
                </div>

                <div className="form-group">
                  <label>Pattern / Keywords</label>
                  <input
                    type="text"
                    value={newPattern.pattern}
                    onChange={e => setNewPattern({ ...newPattern, pattern: e.target.value })}
                    placeholder={newPattern.type === 'AKTENZEICHEN' ? 'z.B. NBW-\\d{4}-\\d{6}' : 'z.B. Genehmigung, Freigabe'}
                  />
                </div>

                <div className="form-group">
                  <label>Beschreibung (optional)</label>
                  <input
                    type="text"
                    value={newPattern.description}
                    onChange={e => setNewPattern({ ...newPattern, description: e.target.value })}
                    placeholder="z.B. EnBW Aktenzeichen-Format"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPatternForm(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={saving || !newPattern.pattern}>
                  {saving ? '⏳ Speichern...' : '✓ Speichern'}
                </button>
              </div>
            </form>
          )}

          <div className="items-list">
            {patterns.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>Noch keine Patterns konfiguriert</p>
                <p className="empty-hint">Fügen Sie Erkennungsmuster hinzu für bessere automatische Zuordnung.</p>
              </div>
            ) : (
              patterns.map(pattern => (
                <div key={pattern.id} className={`item-row ${!pattern.isActive ? 'inactive' : ''}`}>
                  <div className="item-icon">
                    {pattern.patternType === 'AKTENZEICHEN' ? '📋' :
                     pattern.patternType === 'BETREFF' ? '📝' :
                     pattern.patternType === 'ABSENDER' ? '👤' : '📄'}
                  </div>
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-type">{PATTERN_TYPES.find(t => t.value === pattern.patternType)?.label}</span>
                      {!pattern.isActive && <span className="badge inactive">Inaktiv</span>}
                    </div>
                    <code className="item-pattern">{pattern.pattern}</code>
                    {pattern.description && <span className="item-desc">{pattern.description}</span>}
                  </div>
                  <div className="item-actions">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={pattern.isActive}
                        onChange={() => togglePattern(pattern.id, pattern.isActive)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button className="btn-delete" onClick={() => deletePattern(pattern.id)}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section-tip">
            <strong>💡 Tipp:</strong> Aktenzeichen-Patterns nutzen Regex. 
            <code>\d</code> = Zahl, <code>\d&#123;4&#125;</code> = 4 Zahlen, <code>[A-Z]+</code> = Buchstaben
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stats' && (
        <div className="nb-config-section">
          <div className="section-header">
            <div>
              <h3>Statistiken & Prognosen</h3>
              <p>Automatisch berechnete Metriken basierend auf historischen Daten.</p>
            </div>
            <button className="btn-add" onClick={recalculateStats} disabled={saving}>
              {saving ? '⏳ Berechne...' : '🔄 Neu berechnen'}
            </button>
          </div>

          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <div className="stat-value">{stats.avgProcessingDays?.toFixed(1) || '-'} <small>Tage</small></div>
                <div className="stat-label">Ø Bearbeitungszeit</div>
                <div className="stat-sub">Median: {stats.medianProcessingDays?.toFixed(1) || '-'} Tage</div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <div className="stat-value">{stats.approvalRate ? (stats.approvalRate * 100).toFixed(0) : '-'}<small>%</small></div>
                <div className="stat-label">Genehmigungsrate</div>
                <div className="stat-sub">Basierend auf {stats.sampleSize || 0} Anträgen</div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">📊</span>
                <div className="stat-value">{stats.sampleSize || 0}</div>
                <div className="stat-label">Datengrundlage</div>
                <div className="stat-sub">
                  {stats.lastCalculated 
                    ? `Zuletzt: ${new Date(stats.lastCalculated).toLocaleDateString('de-DE')}`
                    : 'Noch nicht berechnet'}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>Noch keine Statistiken verfügbar</p>
              <p className="empty-hint">Klicken Sie auf "Neu berechnen" um Statistiken zu generieren.</p>
              <button className="btn-primary" onClick={recalculateStats} disabled={saving}>
                {saving ? '⏳' : '📊'} Statistiken berechnen
              </button>
            </div>
          )}

          {stats && (
            <div className="section-tip">
              <strong>🧠 KI-Insight:</strong> Basierend auf diesen Statistiken prognostiziert das System 
              Genehmigungszeiträume und warnt bei Überschreitung der durchschnittlichen Bearbeitungszeit.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACCESS MODAL
// ═══════════════════════════════════════════════════════════════════════════

export function NetzbetreiberConfigModal({ 
  netzbetreiberId, 
  netzbetreiberName,
  onClose 
}: Props & { onClose: () => void }) {
  return (
    <div className="nb-config-modal-overlay" onClick={onClose}>
      <div className="nb-config-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <NetzbetreiberConfig netzbetreiberId={netzbetreiberId} netzbetreiberName={netzbetreiberName} />
      </div>
    </div>
  );
}

/**
 * NETZBETREIBER CENTER - ABSOLUTE ENDLEVEL PREMIUM EDITION
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Master-Detail Layout mit PLZ-Integration
 * - Live PLZ-Suche & Auto-Suggest
 * - Credentials Management mit verschlüsselter Anzeige
 * - Installation-Stats pro Netzbetreiber
 * - CSV Import/Export
 * - Tiefe Integration mit NetzanmeldungenPage
 * - Premium Dark Glassmorphism UI
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2, Plus, Edit3, Trash2, X, Search, Loader2,
  CheckCircle, AlertCircle, MapPin, Globe, Mail, Phone, Key,
  Eye, EyeOff, Copy, ExternalLink, Zap, FileText, Upload,
  ChevronRight, Lock, Settings, Download, Filter, BarChart3,
  Map, Users, Clock, Shield, Link2, Hash, RefreshCw,
  ChevronDown, Database, ArrowRight, Star, Activity,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../modules/api/client";
import "./NetzbetreiberCenterPage.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Netzbetreiber {
  id: number;
  name: string;
  kurzname?: string;
  bdewCode?: string;
  email?: string;
  telefon?: string;
  website?: string;
  portalUrl?: string;
  portalHinweise?: string;
  plzBereiche?: string[];
  aktiv: boolean;
  installationsCount?: number;
  pendingCount?: number;
  completedCount?: number;
  createdAt?: string;
  // EVU Learning Stats
  avgProcessingDays?: number | null;
  medianProcessingDays?: number | null;
  sofortFreigabeRate?: number | null;
  rueckfrageRate?: number | null;
  successRate?: number | null;
  genehmigungsTyp?: string | null;
  nachhakSchwelleTage?: number | null;
  totalSubmissions?: number;
}

interface Credential {
  id: number;
  netzbetreiberId: number;
  netzbetreiberName?: string;
  label: string;
  username?: string;
  notes?: string;
}

interface Installation {
  id: string;
  kundenName?: string;
  status?: string;
  createdAt?: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

type TabType = "overview" | "credentials" | "installations" | "plz";
type ViewMode = "list" | "grid";

// API PUT helper (not in services/api.ts)
async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  return apiPatch(endpoint, data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "NB";
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #3b82f6, #EAD068)",
    "linear-gradient(135deg, #06b6d4, #22c55e)",
    "linear-gradient(135deg, #f59e0b, #ec4899)",
    "linear-gradient(135deg, #ef4444, #f97316)",
    "linear-gradient(135deg, #EAD068, #ec4899)",
    "linear-gradient(135deg, #10b981, #3b82f6)",
    "linear-gradient(135deg, #D4A843, #a855f7)",
    "linear-gradient(135deg, #14b8a6, #22d3ee)",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function NetzbetreiberCenterPage() {
  // State
  const [netzbetreiber, setNetzbetreiber] = useState<Netzbetreiber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  
  // Credentials
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credsLoading, setCredsLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const revealTimers = useRef<Record<number, number>>({});
  
  // Installations
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [installationsLoading, setInstallationsLoading] = useState(false);
  
  // Modals
  const [showNbModal, setShowNbModal] = useState(false);
  const [editingNb, setEditingNb] = useState<Netzbetreiber | null>(null);
  const [showCredModal, setShowCredModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Sync & Auto-Assign States
  const [syncing, setSyncing] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  // Toast Helper
  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = `t-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Load Netzbetreiber
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nbRes, instRes] = await Promise.all([
        apiGet("/netzbetreiber?limit=1000"),
        apiGet("/installations/enterprise?limit=1000"),
      ]);
      
      const nbList = nbRes?.data || nbRes || [];
      const allInstallations = instRes?.data || instRes || [];
      
      // Count installations per NB
      const stats: Record<string, { total: number; pending: number; completed: number }> = {};
      allInstallations.forEach((inst: any) => {
        const nbName = inst.gridOperator || inst.netzbetreiber;
        if (nbName) {
          if (!stats[nbName]) stats[nbName] = { total: 0, pending: 0, completed: 0 };
          stats[nbName].total++;
          if (inst.status === "completed" || inst.status === "abgeschlossen") {
            stats[nbName].completed++;
          } else if (inst.status !== "cancelled" && inst.status !== "storniert") {
            stats[nbName].pending++;
          }
        }
      });
      
      const enriched = nbList.map((nb: Netzbetreiber) => ({
        ...nb,
        installationsCount: stats[nb.name]?.total || 0,
        pendingCount: stats[nb.name]?.pending || 0,
        completedCount: stats[nb.name]?.completed || 0,
      }));
      
      // Sort by installations count
      enriched.sort((a: Netzbetreiber, b: Netzbetreiber) => 
        (b.installationsCount || 0) - (a.installationsCount || 0)
      );
      
      setNetzbetreiber(enriched);
      
      // Auto-select first if none selected
      if (!selectedId && enriched.length > 0) {
        setSelectedId(enriched[0].id);
      }
    } catch (e) {
      console.error("Load error:", e);
      addToast("error", "Fehler beim Laden der Netzbetreiber");
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedId]);

  // Load Credentials for selected NB
  const loadCredentials = useCallback(async (nbId: number) => {
    setCredsLoading(true);
    try {
      const res = await apiGet(`/credentials?netzbetreiberId=${nbId}`);
      const list = Array.isArray(res) ? res : res?.data || [];
      setCredentials(list.map((c: any) => ({
        id: c.id,
        netzbetreiberId: c.netzbetreiberId || c.netzbetreiber_id,
        netzbetreiberName: c.netzbetreiberName,
        label: c.label || "Portal-Login",
        username: c.username,
        notes: c.notes,
      })));
    } catch (e) {
      console.error("Load credentials error:", e);
      setCredentials([]);
    } finally {
      setCredsLoading(false);
    }
  }, []);

  // Load Installations for selected NB
  const loadInstallations = useCallback(async (nbName: string) => {
    setInstallationsLoading(true);
    try {
      const res = await apiGet(`/installations/enterprise?gridOperator=${encodeURIComponent(nbName)}&limit=100`);
      const list = Array.isArray(res) ? res : res?.data || [];
      setInstallations(list);
    } catch (e) {
      console.error("Load installations error:", e);
      setInstallations([]);
    } finally {
      setInstallationsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);
  
  useEffect(() => {
    if (selectedId) {
      loadCredentials(selectedId);
      const nb = netzbetreiber.find(n => n.id === selectedId);
      if (nb) loadInstallations(nb.name);
    }
  }, [selectedId, loadCredentials, loadInstallations, netzbetreiber]);

  // Filter
  const filtered = useMemo(() => {
    let list = netzbetreiber;
    
    // Active filter
    if (filterActive === "active") list = list.filter(nb => nb.aktiv);
    if (filterActive === "inactive") list = list.filter(nb => !nb.aktiv);
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(nb =>
        nb.name.toLowerCase().includes(q) ||
        nb.kurzname?.toLowerCase().includes(q) ||
        nb.bdewCode?.toLowerCase().includes(q) ||
        nb.plzBereiche?.some(p => p.includes(q))
      );
    }
    
    return list;
  }, [netzbetreiber, search, filterActive]);

  const selected = netzbetreiber.find(nb => nb.id === selectedId);

  // Stats
  const stats = useMemo(() => {
    const total = netzbetreiber.length;
    const active = netzbetreiber.filter(nb => nb.aktiv).length;
    const withCredentials = netzbetreiber.filter(nb => 
      credentials.some(c => c.netzbetreiberId === nb.id)
    ).length;
    const totalInstallations = netzbetreiber.reduce((sum, nb) => 
      sum + (nb.installationsCount || 0), 0
    );
    return { total, active, withCredentials, totalInstallations };
  }, [netzbetreiber, credentials]);

  // Handlers
  const handleEditNb = (nb: Netzbetreiber) => {
    setEditingNb(nb);
    setShowNbModal(true);
  };

  const handleNewNb = () => {
    setEditingNb(null);
    setShowNbModal(true);
  };

  const handleDeleteNb = async (nb: Netzbetreiber) => {
    if (!confirm(`"${nb.name}" wirklich löschen?\n\nAlle zugehörigen Zugangsdaten werden ebenfalls gelöscht.`)) return;
    try {
      await apiDelete(`/netzbetreiber/${nb.id}`);
      addToast("success", "Netzbetreiber gelöscht");
      loadData();
      if (selectedId === nb.id) setSelectedId(null);
    } catch (e: any) {
      addToast("error", e.message || "Fehler beim Löschen");
    }
  };

  const handleSaveNb = async (data: Partial<Netzbetreiber>) => {
    try {
      if (editingNb) {
        await apiPut(`/netzbetreiber/${editingNb.id}`, data);
        addToast("success", "Netzbetreiber aktualisiert");
      } else {
        const res = await apiPost("/netzbetreiber", data);
        addToast("success", "Netzbetreiber erstellt");
        setSelectedId(res?.data?.id || res?.id);
      }
      setShowNbModal(false);
      loadData();
    } catch (e: any) {
      addToast("error", e.message || "Fehler beim Speichern");
    }
  };

  const handleRevealPassword = async (credId: number) => {
    // Clear any existing timer
    if (revealTimers.current[credId]) {
      clearTimeout(revealTimers.current[credId]);
    }
    
    try {
      const res = await apiGet(`/credentials/${credId}/reveal`);
      const pwd = res?.password || res?.data?.password || "••••••••";
      setRevealed(prev => ({ ...prev, [credId]: pwd }));
      
      // Auto-hide after 30 seconds
      revealTimers.current[credId] = window.setTimeout(() => {
        setRevealed(prev => {
          const next = { ...prev };
          delete next[credId];
          return next;
        });
      }, 30000);
    } catch (e) {
      addToast("error", "Passwort konnte nicht geladen werden");
    }
  };

  const handleHidePassword = (credId: number) => {
    if (revealTimers.current[credId]) {
      clearTimeout(revealTimers.current[credId]);
    }
    setRevealed(prev => {
      const next = { ...prev };
      delete next[credId];
      return next;
    });
  };

  const handleCopyPassword = async (credId: number) => {
    const pwd = revealed[credId];
    if (!pwd) {
      // Reveal first, then copy
      try {
        const res = await apiGet(`/credentials/${credId}/reveal`);
        const password = res?.password || res?.data?.password;
        if (password) {
          const ok = await copyToClipboard(password);
          addToast(ok ? "success" : "error", ok ? "Passwort kopiert!" : "Kopieren fehlgeschlagen");
        }
      } catch {
        addToast("error", "Passwort konnte nicht geladen werden");
      }
    } else {
      const ok = await copyToClipboard(pwd);
      addToast(ok ? "success" : "error", ok ? "Passwort kopiert!" : "Kopieren fehlgeschlagen");
    }
  };

  const handleSaveCredential = async (data: { username: string; password: string; notes: string }) => {
    if (!selectedId) return;
    try {
      await apiPost("/credentials", {
        netzbetreiberId: selectedId,
        label: "Portal-Login",
        ...data,
      });
      addToast("success", "Zugangsdaten gespeichert");
      setShowCredModal(false);
      loadCredentials(selectedId);
    } catch (e: any) {
      addToast("error", e.message || "Fehler beim Speichern");
    }
  };

  const handleDeleteCredential = async (credId: number) => {
    if (!confirm("Zugangsdaten wirklich löschen?")) return;
    try {
      await apiDelete(`/credentials/${credId}`);
      addToast("success", "Zugangsdaten gelöscht");
      if (selectedId) loadCredentials(selectedId);
    } catch (e: any) {
      addToast("error", e.message || "Fehler beim Löschen");
    }
  };

  const handleExportCSV = async () => {
    const lines = ["name;kurzname;bdew_code;email;telefon;website;portal_url;plz_bereiche;aktiv"];
    netzbetreiber.forEach(nb => {
      const plz = (nb.plzBereiche || []).join(",");
      lines.push(`"${nb.name}";"${nb.kurzname || ""}";"${nb.bdewCode || ""}";"${nb.email || ""}";"${nb.telefon || ""}";"${nb.website || ""}";"${nb.portalUrl || ""}";"${plz}";${nb.aktiv ? 1 : 0}`);
    });
    
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `netzbetreiber_export_${new Date().toISOString().slice(0, 10)}.csv`, blob, fileType: 'csv' });
    addToast("success", "CSV exportiert");
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SYNC & AUTO-ASSIGN
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Synchronisiert alle Installationen ohne NB mit VNBdigital
   * Holt für jede PLZ den zuständigen Netzbetreiber und speichert ihn
   */
  const handleSyncVNBdigital = async () => {
    if (syncing) return;
    
    const confirmSync = confirm(
      "VNBdigital Synchronisation starten?\n\n" +
      "Dies durchsucht alle Installationen ohne Netzbetreiber und holt die Daten von vnbdigital.de.\n\n" +
      "Der Vorgang kann einige Minuten dauern."
    );
    
    if (!confirmSync) return;
    
    setSyncing(true);
    setSyncProgress({ current: 0, total: 0 });
    
    try {
      // Hole alle Installationen ohne Netzbetreiber
      const res = await apiGet("/installations/enterprise?limit=2000") as any;
      const allInstallations = res?.data || res || [];
      
      // Filtere Installationen ohne NB aber mit PLZ
      const withoutNb = allInstallations.filter((inst: any) => 
        !inst.netzbetreiberId && !inst.gridOperator && inst.plz && /^\d{5}$/.test(inst.plz)
      );
      
      if (withoutNb.length === 0) {
        addToast("info", "Alle Installationen haben bereits einen Netzbetreiber zugeordnet");
        setSyncing(false);
        setSyncProgress(null);
        return;
      }
      
      // Unique PLZ sammeln
      const uniquePlz = [...new Set(withoutNb.map((i: any) => i.plz))] as string[];
      setSyncProgress({ current: 0, total: uniquePlz.length });
      
      addToast("info", `Synchronisiere ${uniquePlz.length} PLZ-Bereiche...`);
      
      let synced = 0;
      let errors = 0;
      
      // PLZ für PLZ abfragen (mit Rate-Limiting)
      for (let i = 0; i < uniquePlz.length; i++) {
        const plz = uniquePlz[i];
        setSyncProgress({ current: i + 1, total: uniquePlz.length });
        
        try {
          // VNBdigital Lookup - Backend erstellt NB automatisch wenn nicht vorhanden
          await apiGet(`/netzbetreiber/by-plz/${plz}`);
          synced++;
        } catch (e) {
          errors++;
          console.error(`Sync error for PLZ ${plz}:`, e);
        }
        
        // Kleine Pause um Rate-Limits zu vermeiden
        if (i % 10 === 9) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      addToast("success", `Sync abgeschlossen: ${synced} PLZ synchronisiert, ${errors} Fehler`);
      
      // Daten neu laden
      loadData();
      
    } catch (e: any) {
      console.error("Sync error:", e);
      addToast("error", e.message || "Synchronisation fehlgeschlagen");
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  /**
   * Automatische Zuordnung von Netzbetreibern zu Installationen
   * Basierend auf PLZ-Mapping in der Datenbank
   */
  const handleAutoAssign = async () => {
    if (autoAssigning) return;
    
    const confirmAssign = confirm(
      "Automatische Netzbetreiber-Zuordnung starten?\n\n" +
      "Dies ordnet allen Installationen ohne Netzbetreiber automatisch den passenden NB zu, " +
      "basierend auf der PLZ und dem gespeicherten PLZ-Mapping.\n\n" +
      "Fortfahren?"
    );
    
    if (!confirmAssign) return;
    
    setAutoAssigning(true);
    
    try {
      const res = await apiPost("/netzbetreiber/auto-assign", {}) as any;
      
      if (res?.success) {
        const msg = `${res.matched || 0} Installationen zugeordnet`;
        if (res.errors > 0) {
          addToast("info", `${msg} (${res.errors} Fehler)`);
        } else {
          addToast("success", msg);
        }
        
        // Daten neu laden
        loadData();
      } else {
        addToast("error", res?.message || "Auto-Assign fehlgeschlagen");
      }
    } catch (e: any) {
      console.error("Auto-assign error:", e);
      addToast("error", e.message || "Auto-Assign fehlgeschlagen");
    } finally {
      setAutoAssigning(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="nbc-container">
      {/* Background */}
      <div className="nbc-bg">
        <div className="nbc-orb nbc-orb--1" />
        <div className="nbc-orb nbc-orb--2" />
        <div className="nbc-orb nbc-orb--3" />
        <div className="nbc-grid-pattern" />
      </div>

      {/* Header */}
      <header className="nbc-header">
        <div className="nbc-header__left">
          <div className="nbc-header__icon">
            <Building2 size={26} />
          </div>
          <div>
            <h1>Netzbetreiber Center</h1>
            <p>Verwaltung • Zugangsdaten • PLZ-Mapping</p>
          </div>
        </div>
        
        <div className="nbc-header__stats">
          <div className="nbc-stat">
            <span className="nbc-stat__value">{stats.total}</span>
            <span className="nbc-stat__label">NETZBETREIBER</span>
          </div>
          <div className="nbc-stat nbc-stat--success">
            <span className="nbc-stat__value">{stats.active}</span>
            <span className="nbc-stat__label">AKTIV</span>
          </div>
          <div className="nbc-stat nbc-stat--info">
            <span className="nbc-stat__value">{stats.totalInstallations}</span>
            <span className="nbc-stat__label">INSTALLATIONEN</span>
          </div>
        </div>

        <div className="nbc-header__actions">
          {/* Sync & Auto-Assign Buttons */}
          <button 
            className={`nbc-btn nbc-btn--secondary ${syncing ? 'nbc-btn--loading' : ''}`}
            onClick={handleSyncVNBdigital}
            disabled={syncing || autoAssigning}
            title="Synchronisiert fehlende Netzbetreiber von vnbdigital.de"
          >
            {syncing ? (
              <>
                <Loader2 size={16} className="nbc-spin" />
                {syncProgress ? `${syncProgress.current}/${syncProgress.total}` : 'Sync...'}
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                VNB Sync
              </>
            )}
          </button>
          <button 
            className={`nbc-btn nbc-btn--secondary ${autoAssigning ? 'nbc-btn--loading' : ''}`}
            onClick={handleAutoAssign}
            disabled={syncing || autoAssigning}
            title="Ordnet Installationen automatisch dem passenden Netzbetreiber zu"
          >
            {autoAssigning ? (
              <>
                <Loader2 size={16} className="nbc-spin" />
                Zuordnen...
              </>
            ) : (
              <>
                <Zap size={16} />
                Auto-Assign
              </>
            )}
          </button>
          
          <div className="nbc-btn-divider" />
          
          <button className="nbc-btn" onClick={() => setShowImportModal(true)}>
            <Upload size={16} />
            Import
          </button>
          <button className="nbc-btn" onClick={handleExportCSV}>
            <Download size={16} />
            Export
          </button>
          <button className="nbc-btn nbc-btn--primary" onClick={handleNewNb}>
            <Plus size={16} />
            Neu
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="nbc-main">
        {/* Sidebar */}
        <aside className="nbc-sidebar">
          <div className="nbc-sidebar__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Suche nach Name, PLZ, BDEW..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}><X size={16} /></button>
            )}
          </div>
          
          <div className="nbc-sidebar__filters">
            <button
              className={`nbc-filter-btn ${filterActive === "all" ? "nbc-filter-btn--active" : ""}`}
              onClick={() => setFilterActive("all")}
            >
              Alle
            </button>
            <button
              className={`nbc-filter-btn ${filterActive === "active" ? "nbc-filter-btn--active" : ""}`}
              onClick={() => setFilterActive("active")}
            >
              Aktiv
            </button>
            <button
              className={`nbc-filter-btn ${filterActive === "inactive" ? "nbc-filter-btn--active" : ""}`}
              onClick={() => setFilterActive("inactive")}
            >
              Inaktiv
            </button>
            <span className="nbc-sidebar__count">{filtered.length}</span>
          </div>

          <div className="nbc-sidebar__list">
            {loading ? (
              <div className="nbc-sidebar__loading">
                <Loader2 size={24} className="nbc-spin" />
                <span>Lade Netzbetreiber...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="nbc-sidebar__empty">
                <Building2 size={40} />
                <span>Keine Netzbetreiber gefunden</span>
              </div>
            ) : (
              filtered.map(nb => (
                <button
                  key={nb.id}
                  className={`nbc-nb-card ${selectedId === nb.id ? "nbc-nb-card--active" : ""} ${!nb.aktiv ? "nbc-nb-card--inactive" : ""}`}
                  onClick={() => setSelectedId(nb.id)}
                >
                  <div
                    className="nbc-nb-card__avatar"
                    style={{ background: getAvatarGradient(nb.name) }}
                  >
                    {initials(nb.name)}
                  </div>
                  <div className="nbc-nb-card__info">
                    <div className="nbc-nb-card__name">{nb.name}</div>
                    <div className="nbc-nb-card__meta">
                      {nb.installationsCount ? (
                        <span><Zap size={11} /> {nb.installationsCount}</span>
                      ) : null}
                      {nb.plzBereiche?.length ? (
                        <span><MapPin size={11} /> {nb.plzBereiche.length} PLZ</span>
                      ) : null}
                    </div>
                  </div>
                  {!nb.aktiv && <span className="nbc-badge nbc-badge--inactive">Inaktiv</span>}
                  <ChevronRight size={16} className="nbc-nb-card__arrow" />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Content */}
        <section className="nbc-content">
          {selected ? (
            <>
              {/* Content Header */}
              <div className="nbc-content__header">
                <div className="nbc-content__title">
                  <div
                    className="nbc-content__avatar"
                    style={{ background: getAvatarGradient(selected.name) }}
                  >
                    {initials(selected.name)}
                  </div>
                  <div>
                    <h2>{selected.name}</h2>
                    <div className="nbc-content__subtitle">
                      {selected.kurzname && <span className="nbc-badge">{selected.kurzname}</span>}
                      {selected.bdewCode && <span><Hash size={12} /> {selected.bdewCode}</span>}
                      {selected.aktiv ? (
                        <span className="nbc-badge nbc-badge--success"><CheckCircle size={12} /> Aktiv</span>
                      ) : (
                        <span className="nbc-badge nbc-badge--inactive"><AlertCircle size={12} /> Inaktiv</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="nbc-content__actions">
                  <button className="nbc-btn" onClick={() => handleEditNb(selected)}>
                    <Edit3 size={16} />
                    Bearbeiten
                  </button>
                  <button className="nbc-btn nbc-btn--danger" onClick={() => handleDeleteNb(selected)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="nbc-tabs">
                <button
                  className={`nbc-tab ${activeTab === "overview" ? "nbc-tab--active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <Building2 size={16} />
                  Übersicht
                </button>
                <button
                  className={`nbc-tab ${activeTab === "credentials" ? "nbc-tab--active" : ""}`}
                  onClick={() => setActiveTab("credentials")}
                >
                  <Key size={16} />
                  Zugangsdaten
                  {credentials.length > 0 && (
                    <span className="nbc-tab__badge">{credentials.length}</span>
                  )}
                </button>
                <button
                  className={`nbc-tab ${activeTab === "installations" ? "nbc-tab--active" : ""}`}
                  onClick={() => setActiveTab("installations")}
                >
                  <Zap size={16} />
                  Installationen
                  {(selected.installationsCount || 0) > 0 && (
                    <span className="nbc-tab__badge">{selected.installationsCount}</span>
                  )}
                </button>
                <button
                  className={`nbc-tab ${activeTab === "plz" ? "nbc-tab--active" : ""}`}
                  onClick={() => setActiveTab("plz")}
                >
                  <MapPin size={16} />
                  PLZ-Bereiche
                  {(selected.plzBereiche?.length || 0) > 0 && (
                    <span className="nbc-tab__badge">{selected.plzBereiche?.length}</span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="nbc-tab-content">
                {activeTab === "overview" && (
                  <OverviewTab nb={selected} onOpenPortal={() => selected.portalUrl && window.open(selected.portalUrl, "_blank")} />
                )}
                {activeTab === "credentials" && (
                  <CredentialsTab
                    credentials={credentials}
                    loading={credsLoading}
                    revealed={revealed}
                    onReveal={handleRevealPassword}
                    onHide={handleHidePassword}
                    onCopy={handleCopyPassword}
                    onDelete={handleDeleteCredential}
                    onAdd={() => setShowCredModal(true)}
                  />
                )}
                {activeTab === "installations" && (
                  <InstallationsTab
                    nb={selected}
                    installations={installations}
                    loading={installationsLoading}
                  />
                )}
                {activeTab === "plz" && (
                  <PLZTab nb={selected} onEdit={() => handleEditNb(selected)} />
                )}
              </div>
            </>
          ) : (
            <div className="nbc-empty">
              <Building2 size={80} />
              <h2>Kein Netzbetreiber ausgewählt</h2>
              <p>Wähle links einen Netzbetreiber aus oder erstelle einen neuen.</p>
              <button className="nbc-btn nbc-btn--primary" onClick={handleNewNb}>
                <Plus size={16} />
                Netzbetreiber erstellen
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {showNbModal && (
        <NetzbetreiberModal
          nb={editingNb}
          onClose={() => setShowNbModal(false)}
          onSave={handleSaveNb}
        />
      )}

      {showCredModal && selected && (
        <CredentialModal
          nbName={selected.name}
          onClose={() => setShowCredModal(false)}
          onSave={handleSaveCredential}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={async (data) => {
            try {
              await apiPost("/netzbetreiber/import", { netzbetreiber: data });
              addToast("success", `${data.length} Netzbetreiber importiert`);
              setShowImportModal(false);
              loadData();
            } catch (e: any) {
              addToast("error", e.message || "Import fehlgeschlagen");
            }
          }}
        />
      )}

      {/* Toasts */}
      <div className="nbc-toasts">
        {toasts.map(toast => (
          <div key={toast.id} className={`nbc-toast nbc-toast--${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> :
             toast.type === "error" ? <AlertCircle size={18} /> :
             <Activity size={18} />}
            <span>{safeString(toast.message)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS: TABS
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ nb, onOpenPortal }: { nb: Netzbetreiber; onOpenPortal: () => void }) {
  return (
    <div className="nbc-overview">
      {/* Quick Stats */}
      <div className="nbc-overview__stats">
        <div className="nbc-mini-stat">
          <Zap size={20} />
          <div>
            <span className="nbc-mini-stat__value">{nb.installationsCount || 0}</span>
            <span className="nbc-mini-stat__label">Installationen</span>
          </div>
        </div>
        <div className="nbc-mini-stat nbc-mini-stat--warning">
          <Clock size={20} />
          <div>
            <span className="nbc-mini-stat__value">{nb.pendingCount || 0}</span>
            <span className="nbc-mini-stat__label">In Bearbeitung</span>
          </div>
        </div>
        <div className="nbc-mini-stat nbc-mini-stat--success">
          <CheckCircle size={20} />
          <div>
            <span className="nbc-mini-stat__value">{nb.completedCount || 0}</span>
            <span className="nbc-mini-stat__label">Abgeschlossen</span>
          </div>
        </div>
        <div className="nbc-mini-stat nbc-mini-stat--info">
          <MapPin size={20} />
          <div>
            <span className="nbc-mini-stat__value">{nb.plzBereiche?.length || 0}</span>
            <span className="nbc-mini-stat__label">PLZ-Bereiche</span>
          </div>
        </div>
      </div>

      {/* EVU Learning Stats */}
      {(nb.avgProcessingDays != null || nb.successRate != null || nb.genehmigungsTyp) && (
        <div className="nbc-overview__stats" style={{ marginTop: 8 }}>
          {nb.avgProcessingDays != null && (
            <div className={`nbc-mini-stat ${nb.avgProcessingDays <= 7 ? "nbc-mini-stat--success" : nb.avgProcessingDays <= 21 ? "nbc-mini-stat--info" : "nbc-mini-stat--warning"}`}>
              <BarChart3 size={20} />
              <div>
                <span className="nbc-mini-stat__value">{nb.medianProcessingDays ?? Math.round(nb.avgProcessingDays)}d</span>
                <span className="nbc-mini-stat__label">{nb.medianProcessingDays != null ? "Median" : "Ø"} Bearbeitungstage</span>
              </div>
            </div>
          )}
          {nb.successRate != null && (
            <div className={`nbc-mini-stat ${nb.successRate >= 0.7 ? "nbc-mini-stat--success" : "nbc-mini-stat--warning"}`}>
              <CheckCircle size={20} />
              <div>
                <span className="nbc-mini-stat__value">{Math.round(nb.successRate * 100)}%</span>
                <span className="nbc-mini-stat__label">Genehmigungsquote</span>
              </div>
            </div>
          )}
          {nb.sofortFreigabeRate != null && (
            <div className={`nbc-mini-stat ${nb.sofortFreigabeRate >= 0.7 ? "nbc-mini-stat--success" : nb.sofortFreigabeRate >= 0.3 ? "nbc-mini-stat--warning" : ""}`}>
              <Zap size={20} />
              <div>
                <span className="nbc-mini-stat__value">{Math.round(nb.sofortFreigabeRate * 100)}%</span>
                <span className="nbc-mini-stat__label">Sofort-Freigabe</span>
              </div>
            </div>
          )}
          {nb.genehmigungsTyp && (
            <div className="nbc-mini-stat">
              <Shield size={20} />
              <div>
                <span className={`nbc-mini-stat__value nbc-badge-typ ${nb.genehmigungsTyp === "SCHNELL" ? "nbc-badge-typ--schnell" : nb.genehmigungsTyp === "STANDARD" ? "nbc-badge-typ--standard" : nb.genehmigungsTyp === "LANGSAM" ? "nbc-badge-typ--langsam" : "nbc-badge-typ--sehr-langsam"}`}>
                  {nb.genehmigungsTyp}
                </span>
                <span className="nbc-mini-stat__label">Genehmigungstyp</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="nbc-overview__grid">
        {/* Contact Card */}
        <div className="nbc-info-card">
          <div className="nbc-info-card__header">
            <Users size={18} />
            <h3>Kontaktdaten</h3>
          </div>
          <div className="nbc-info-card__body">
            {nb.email && (
              <div className="nbc-info-row">
                <Mail size={14} />
                <a href={`mailto:${nb.email}`}>{nb.email}</a>
              </div>
            )}
            {nb.telefon && (
              <div className="nbc-info-row">
                <Phone size={14} />
                <a href={`tel:${nb.telefon}`}>{nb.telefon}</a>
              </div>
            )}
            {nb.website && (
              <div className="nbc-info-row">
                <Globe size={14} />
                <a href={nb.website} target="_blank" rel="noopener noreferrer">
                  {nb.website.replace(/^https?:\/\//, "")}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
            {!nb.email && !nb.telefon && !nb.website && (
              <div className="nbc-info-row nbc-info-row--empty">
                Keine Kontaktdaten hinterlegt
              </div>
            )}
          </div>
        </div>

        {/* Portal Card */}
        <div className="nbc-info-card nbc-info-card--portal">
          <div className="nbc-info-card__header">
            <Globe size={18} />
            <h3>Online-Portal</h3>
          </div>
          <div className="nbc-info-card__body">
            {nb.portalUrl ? (
              <>
                <div className="nbc-info-row">
                  <Link2 size={14} />
                  <a href={nb.portalUrl} target="_blank" rel="noopener noreferrer">
                    {nb.portalUrl.replace(/^https?:\/\//, "").substring(0, 40)}...
                  </a>
                </div>
                {nb.portalHinweise && (
                  <div className="nbc-portal-hints">
                    <p>{nb.portalHinweise}</p>
                  </div>
                )}
                <button className="nbc-btn nbc-btn--primary nbc-btn--full" onClick={onOpenPortal}>
                  <ExternalLink size={16} />
                  Portal öffnen
                </button>
              </>
            ) : (
              <div className="nbc-info-row nbc-info-row--empty">
                Kein Portal hinterlegt
              </div>
            )}
          </div>
        </div>

        {/* Identification Card */}
        <div className="nbc-info-card">
          <div className="nbc-info-card__header">
            <Hash size={18} />
            <h3>Identifikation</h3>
          </div>
          <div className="nbc-info-card__body">
            <div className="nbc-info-row">
              <span className="nbc-info-label">BDEW-Code:</span>
              <span className="nbc-info-value">{nb.bdewCode || "–"}</span>
            </div>
            <div className="nbc-info-row">
              <span className="nbc-info-label">Kurzname:</span>
              <span className="nbc-info-value">{nb.kurzname || "–"}</span>
            </div>
            <div className="nbc-info-row">
              <span className="nbc-info-label">Status:</span>
              <span className={`nbc-info-value ${nb.aktiv ? "nbc-info-value--success" : "nbc-info-value--muted"}`}>
                {nb.aktiv ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialsTab({
  credentials,
  loading,
  revealed,
  onReveal,
  onHide,
  onCopy,
  onDelete,
  onAdd,
}: {
  credentials: Credential[];
  loading: boolean;
  revealed: Record<number, string>;
  onReveal: (id: number) => void;
  onHide: (id: number) => void;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  if (loading) {
    return (
      <div className="nbc-loading-state">
        <Loader2 size={24} className="nbc-spin" />
        <span>Lade Zugangsdaten...</span>
      </div>
    );
  }

  return (
    <div className="nbc-credentials">
      <div className="nbc-credentials__header">
        <div className="nbc-credentials__info">
          <Shield size={20} />
          <div>
            <h3>Sichere Zugangsdaten</h3>
            <p>Passwörter werden verschlüsselt gespeichert und nur bei Bedarf entschlüsselt.</p>
          </div>
        </div>
        <button className="nbc-btn nbc-btn--primary" onClick={onAdd}>
          <Plus size={16} />
          Hinzufügen
        </button>
      </div>

      {credentials.length === 0 ? (
        <div className="nbc-credentials__empty">
          <Key size={48} />
          <h4>Keine Zugangsdaten</h4>
          <p>Füge Portal-Zugangsdaten hinzu um schnell auf das Netzbetreiber-Portal zuzugreifen.</p>
          <button className="nbc-btn nbc-btn--primary" onClick={onAdd}>
            <Plus size={16} />
            Zugangsdaten hinzufügen
          </button>
        </div>
      ) : (
        <div className="nbc-credentials__list">
          {credentials.map(cred => (
            <div key={cred.id} className="nbc-cred-card">
              <div className="nbc-cred-card__header">
                <div className="nbc-cred-card__icon">
                  <Key size={18} />
                </div>
                <div className="nbc-cred-card__title">
                  <h4>{cred.label}</h4>
                  {cred.notes && <p>{cred.notes}</p>}
                </div>
                <button className="nbc-btn nbc-btn--icon nbc-btn--danger" onClick={() => onDelete(cred.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="nbc-cred-card__row">
                <div className="nbc-cred-card__field">
                  <label>Username</label>
                  <span>{cred.username || "–"}</span>
                </div>
                <button
                  className="nbc-btn nbc-btn--icon"
                  onClick={() => cred.username && copyToClipboard(cred.username)}
                >
                  <Copy size={14} />
                </button>
              </div>
              
              <div className="nbc-cred-card__row">
                <div className="nbc-cred-card__field">
                  <label>Passwort</label>
                  <span className={revealed[cred.id] ? "" : "nbc-masked"}>
                    {revealed[cred.id] || "••••••••••••"}
                  </span>
                </div>
                <div className="nbc-cred-card__btn-group">
                  <button
                    className="nbc-btn nbc-btn--icon"
                    onClick={() => revealed[cred.id] ? onHide(cred.id) : onReveal(cred.id)}
                    title={revealed[cred.id] ? "Verbergen" : "Anzeigen"}
                  >
                    {revealed[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="nbc-btn nbc-btn--icon"
                    onClick={() => onCopy(cred.id)}
                    title="Kopieren"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstallationsTab({
  nb,
  installations,
  loading,
}: {
  nb: Netzbetreiber;
  installations: Installation[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="nbc-loading-state">
        <Loader2 size={24} className="nbc-spin" />
        <span>Lade Installationen...</span>
      </div>
    );
  }

  return (
    <div className="nbc-installations">
      <div className="nbc-installations__header">
        <div className="nbc-installations__stat">
          <Zap size={48} />
          <span className="nbc-installations__count">{nb.installationsCount || 0}</span>
          <span className="nbc-installations__label">Installationen bei diesem Netzbetreiber</span>
        </div>
        
        <div className="nbc-installations__breakdown">
          <div className="nbc-mini-stat nbc-mini-stat--warning">
            <Clock size={18} />
            <div>
              <span className="nbc-mini-stat__value">{nb.pendingCount || 0}</span>
              <span className="nbc-mini-stat__label">Offen</span>
            </div>
          </div>
          <div className="nbc-mini-stat nbc-mini-stat--success">
            <CheckCircle size={18} />
            <div>
              <span className="nbc-mini-stat__value">{nb.completedCount || 0}</span>
              <span className="nbc-mini-stat__label">Abgeschlossen</span>
            </div>
          </div>
        </div>
      </div>

      {installations.length > 0 && (
        <div className="nbc-installations__list">
          <h4>Letzte Installationen</h4>
          <div className="nbc-installations__grid">
            {installations.slice(0, 10).map(inst => (
              <div key={inst.id} className="nbc-inst-card">
                <div className="nbc-inst-card__icon">
                  <Zap size={16} />
                </div>
                <div className="nbc-inst-card__info">
                  <span className="nbc-inst-card__name">{inst.kundenName || inst.id}</span>
                  <span className="nbc-inst-card__date">{formatDate(inst.createdAt)}</span>
                </div>
                <span className={`nbc-badge nbc-badge--${inst.status || "pending"}`}>
                  {inst.status || "Offen"}
                </span>
              </div>
            ))}
          </div>
          
          <a href={`/netzanmeldungen?gridOperator=${encodeURIComponent(nb.name)}`} className="nbc-btn nbc-btn--full">
            <ArrowRight size={16} />
            Alle Installationen anzeigen
          </a>
        </div>
      )}
    </div>
  );
}

function PLZTab({ nb, onEdit }: { nb: Netzbetreiber; onEdit: () => void }) {
  const plzList = nb.plzBereiche || [];
  
  return (
    <div className="nbc-plz">
      <div className="nbc-plz__header">
        <div className="nbc-plz__info">
          <MapPin size={20} />
          <div>
            <h3>PLZ-Bereiche</h3>
            <p>Postleitzahlen, für die dieser Netzbetreiber zuständig ist.</p>
          </div>
        </div>
        <button className="nbc-btn" onClick={onEdit}>
          <Edit3 size={16} />
          Bearbeiten
        </button>
      </div>

      {plzList.length === 0 ? (
        <div className="nbc-plz__empty">
          <Map size={48} />
          <h4>Keine PLZ-Bereiche</h4>
          <p>Füge PLZ-Bereiche hinzu, um automatisches Matching zu ermöglichen.</p>
          <button className="nbc-btn nbc-btn--primary" onClick={onEdit}>
            <Plus size={16} />
            PLZ hinzufügen
          </button>
        </div>
      ) : (
        <div className="nbc-plz__grid">
          {plzList.map((plz, i) => (
            <div key={i} className="nbc-plz-chip">
              <MapPin size={12} />
              {plz}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS: MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function NetzbetreiberModal({
  nb,
  onClose,
  onSave,
}: {
  nb: Netzbetreiber | null;
  onClose: () => void;
  onSave: (data: Partial<Netzbetreiber>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: nb?.name || "",
    kurzname: nb?.kurzname || "",
    bdewCode: nb?.bdewCode || "",
    email: nb?.email || "",
    telefon: nb?.telefon || "",
    website: nb?.website || "",
    portalUrl: nb?.portalUrl || "",
    portalHinweise: nb?.portalHinweise || "",
    plzBereiche: (nb?.plzBereiche || []).join(", "),
    aktiv: nb?.aktiv ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setSaving(true);
    const plzBereiche = form.plzBereiche
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    
    await onSave({
      name: form.name.trim(),
      kurzname: form.kurzname.trim() || undefined,
      bdewCode: form.bdewCode.trim() || undefined,
      email: form.email.trim() || undefined,
      telefon: form.telefon.trim() || undefined,
      website: form.website.trim() || undefined,
      portalUrl: form.portalUrl.trim() || undefined,
      portalHinweise: form.portalHinweise.trim() || undefined,
      plzBereiche: plzBereiche.length > 0 ? plzBereiche : undefined,
      aktiv: form.aktiv,
    });
    
    setSaving(false);
  };

  return (
    <div className="nbc-modal-overlay" onClick={onClose}>
      <div className="nbc-modal" onClick={e => e.stopPropagation()}>
        <div className="nbc-modal__header">
          <h2>{nb ? "Netzbetreiber bearbeiten" : "Neuer Netzbetreiber"}</h2>
          <button className="nbc-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="nbc-modal__body">
          <div className="nbc-form-grid">
            <div className="nbc-form-group nbc-form-group--full">
              <label>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z.B. Stromnetz Berlin GmbH"
                required
                autoFocus
              />
            </div>
            
            <div className="nbc-form-group">
              <label>Kurzname</label>
              <input
                type="text"
                value={form.kurzname}
                onChange={e => setForm(f => ({ ...f, kurzname: e.target.value }))}
                placeholder="z.B. SNB"
              />
            </div>
            
            <div className="nbc-form-group">
              <label>BDEW-Code</label>
              <input
                type="text"
                value={form.bdewCode}
                onChange={e => setForm(f => ({ ...f, bdewCode: e.target.value }))}
                placeholder="z.B. 9900123456789"
              />
            </div>
            
            <div className="nbc-form-group">
              <label>E-Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="netzanschluss@example.de"
              />
            </div>
            
            <div className="nbc-form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={form.telefon}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                placeholder="+49 30 123456"
              />
            </div>
            
            <div className="nbc-form-group">
              <label>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.example.de"
              />
            </div>
            
            <div className="nbc-form-group">
              <label>Portal-URL</label>
              <input
                type="url"
                value={form.portalUrl}
                onChange={e => setForm(f => ({ ...f, portalUrl: e.target.value }))}
                placeholder="https://portal.example.de"
              />
            </div>
            
            <div className="nbc-form-group nbc-form-group--full">
              <label>PLZ-Bereiche <span className="nbc-hint">(kommagetrennt, z.B. 10115, 10000-10999, 12*)</span></label>
              <textarea
                value={form.plzBereiche}
                onChange={e => setForm(f => ({ ...f, plzBereiche: e.target.value }))}
                placeholder="10115, 10117, 10119, 10178, 10179..."
                rows={3}
              />
            </div>
            
            <div className="nbc-form-group nbc-form-group--full">
              <label>Portal-Hinweise</label>
              <textarea
                value={form.portalHinweise}
                onChange={e => setForm(f => ({ ...f, portalHinweise: e.target.value }))}
                placeholder="Hinweise zur Nutzung, 2FA-Infos etc."
                rows={2}
              />
            </div>
            
            <div className="nbc-form-group nbc-form-group--full">
              <label className="nbc-checkbox">
                <input
                  type="checkbox"
                  checked={form.aktiv}
                  onChange={e => setForm(f => ({ ...f, aktiv: e.target.checked }))}
                />
                <span>Aktiv</span>
              </label>
            </div>
          </div>
        </form>
        
        <div className="nbc-modal__footer">
          <button type="button" className="nbc-btn" onClick={onClose}>Abbrechen</button>
          <button
            type="submit"
            className="nbc-btn nbc-btn--primary"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
          >
            {saving ? <Loader2 size={16} className="nbc-spin" /> : <CheckCircle size={16} />}
            {nb ? "Speichern" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CredentialModal({
  nbName,
  onClose,
  onSave,
}: {
  nbName: string;
  onClose: () => void;
  onSave: (data: { username: string; password: string; notes: string }) => void;
}) {
  const [form, setForm] = useState({ username: "", password: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() && !form.password.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="nbc-modal-overlay" onClick={onClose}>
      <div className="nbc-modal nbc-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="nbc-modal__header">
          <h2>Zugangsdaten hinzufügen</h2>
          <button className="nbc-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="nbc-modal__body">
          <p className="nbc-modal__subtitle">
            <Key size={16} /> Für <strong>{nbName}</strong>
          </p>
          
          <div className="nbc-form-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="z.B. info@example.de"
              autoFocus
            />
          </div>
          
          <div className="nbc-form-group">
            <label>Passwort</label>
            <div className="nbc-input-group">
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Passwort eingeben"
              />
              <button type="button" className="nbc-input-btn" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div className="nbc-form-group">
            <label>Notizen</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="2FA Hinweise, Deep-Link, etc."
              rows={2}
            />
          </div>
        </form>
        
        <div className="nbc-modal__footer">
          <button type="button" className="nbc-btn" onClick={onClose}>Abbrechen</button>
          <button
            type="submit"
            className="nbc-btn nbc-btn--primary"
            onClick={handleSubmit}
            disabled={saving || (!form.username.trim() && !form.password.trim())}
          >
            {saving ? <Loader2 size={16} className="nbc-spin" /> : <CheckCircle size={16} />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
}) {
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;
    
    const header = lines[0].split(";").map(h => h.replace(/"/g, "").trim().toLowerCase());
    const data: any[] = [];
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = lines[i].split(";").map(v => v.replace(/"/g, "").trim());
      const row: any = {};
      header.forEach((h, idx) => {
        if (h === "name" || h === "netzbetreiber_name") row.name = values[idx];
        if (h === "kurzname") row.kurzname = values[idx];
        if (h === "bdew_code" || h === "bdewcode") row.bdewCode = values[idx];
        if (h === "email") row.email = values[idx];
        if (h === "telefon") row.telefon = values[idx];
        if (h === "website") row.website = values[idx];
        if (h === "portal_url" || h === "portalurl") row.portalUrl = values[idx];
        if (h === "plz_bereiche" || h === "plzbereiche") {
          row.plzBereiche = values[idx] ? values[idx].split(",").map((p: string) => p.trim()) : [];
        }
        if (h === "aktiv") row.aktiv = values[idx] === "1" || values[idx].toLowerCase() === "true";
      });
      if (row.name) data.push(row);
    }
    
    setPreview(data);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    
    setImporting(true);
    
    // Parse full CSV
    const lines = csvContent.trim().split("\n");
    const header = lines[0].split(";").map(h => h.replace(/"/g, "").trim().toLowerCase());
    const fullData: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";").map(v => v.replace(/"/g, "").trim());
      const row: any = { aktiv: true };
      header.forEach((h, idx) => {
        if (h === "name" || h === "netzbetreiber_name") row.name = values[idx];
        if (h === "kurzname") row.kurzname = values[idx];
        if (h === "bdew_code" || h === "bdewcode") row.bdewCode = values[idx];
        if (h === "email") row.email = values[idx];
        if (h === "telefon") row.telefon = values[idx];
        if (h === "website") row.website = values[idx];
        if (h === "portal_url" || h === "portalurl") row.portalUrl = values[idx];
        if (h === "plz_bereiche" || h === "plzbereiche") {
          row.plzBereiche = values[idx] ? values[idx].split(",").map((p: string) => p.trim()) : [];
        }
        if (h === "aktiv") row.aktiv = values[idx] === "1" || values[idx].toLowerCase() === "true";
      });
      if (row.name) fullData.push(row);
    }
    
    await onImport(fullData);
    setImporting(false);
  };

  return (
    <div className="nbc-modal-overlay" onClick={onClose}>
      <div className="nbc-modal nbc-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="nbc-modal__header">
          <h2>Netzbetreiber importieren</h2>
          <button className="nbc-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="nbc-modal__body">
          <div className="nbc-import-zone">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              className="nbc-import-zone__btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} />
              <span>CSV-Datei auswählen</span>
              <small>Format: name;kurzname;bdew_code;email;telefon;website;portal_url;plz_bereiche;aktiv</small>
            </button>
          </div>

          {preview.length > 0 && (
            <div className="nbc-import-preview">
              <h4>Vorschau ({preview.length} von {csvContent.split("\n").length - 1} Zeilen)</h4>
              <div className="nbc-import-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Kurzname</th>
                      <th>PLZ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td>{row.name}</td>
                        <td>{row.kurzname || "–"}</td>
                        <td>{row.plzBereiche?.length || 0} PLZ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="nbc-modal__footer">
          <button type="button" className="nbc-btn" onClick={onClose}>Abbrechen</button>
          <button
            className="nbc-btn nbc-btn--primary"
            onClick={handleImport}
            disabled={importing || preview.length === 0}
          >
            {importing ? <Loader2 size={16} className="nbc-spin" /> : <Database size={16} />}
            {csvContent ? `${csvContent.split("\n").length - 1} Einträge importieren` : "Importieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

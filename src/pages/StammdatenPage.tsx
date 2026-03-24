/**
 * STAMMDATEN - ZENTRALE DATENBANK
 * Vereint: Produkte, Hersteller, PLZ-Netzbetreiber, Kunden, Datenblätter
 * Mit automatischer Synchronisation aus Installationen
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database, Plus, Trash2, Package,
  Sun, Zap, Battery, Car, Thermometer, Building2, MapPin,
  RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2,
  Users, FileSpreadsheet, Download, Sparkles, TrendingUp, Clock
} from 'lucide-react';
import api from '../modules/api/client';
import './StammdatenPage.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Hersteller {
  id: number;
  name: string;
  kurzname?: string;
  website?: string;
  aktiv: boolean;
  verified: boolean;
  usageCount: number;
  _count?: { pvModule?: number; wechselrichter?: number; speicher?: number; wallboxen?: number; waermepumpen?: number };
}

interface PlzMapping {
  id?: number;
  plz: string;
  gridOperator: string;
  gridOperatorId?: number;
  confidence: number;
  source: 'manual' | 'auto' | 'import';
  usageCount: number;
  lastUsed?: string;
}

interface Kunde {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  installationCount: number;
  createdAt: string;
}

interface SyncStats {
  hersteller: { total: number; synced: number; new: number };
  produkte: { total: number; synced: number; new: number };
  plzMappings: { total: number; unique: number; conflicts: number };
  datenblaetter: { total: number; synced: number };
  kunden: { total: number; unique: number };
}

type TabKey = 'overview' | 'produkte' | 'hersteller' | 'plzMappings' | 'kunden' | 'datenblaetter';
type ProduktTyp = 'pvModule' | 'wechselrichter' | 'speicher' | 'wallboxen' | 'waermepumpen';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: typeof Database;
  color: string;
  description: string;
}

const TABS: TabConfig[] = [
  { key: 'overview', label: 'Übersicht', icon: TrendingUp, color: '#3b82f6', description: 'Sync-Status & Statistiken' },
  { key: 'produkte', label: 'Produkte', icon: Package, color: '#f59e0b', description: 'PV, WR, Speicher, Wallbox, WP' },
  { key: 'hersteller', label: 'Hersteller', icon: Building2, color: '#EAD068', description: 'Hersteller-Verwaltung' },
  { key: 'plzMappings', label: 'PLZ → NB', icon: MapPin, color: '#22c55e', description: 'PLZ-Netzbetreiber Zuordnung' },
  { key: 'kunden', label: 'Kunden', icon: Users, color: '#ec4899', description: 'Kundenstammdaten' },
  { key: 'datenblaetter', label: 'Datenblätter', icon: FileSpreadsheet, color: '#06b6d4', description: 'Technische Dokumente' },
];

const PRODUKT_TABS: { key: ProduktTyp; label: string; icon: typeof Sun; color: string }[] = [
  { key: 'pvModule', label: 'PV-Module', icon: Sun, color: '#f59e0b' },
  { key: 'wechselrichter', label: 'Wechselrichter', icon: Zap, color: '#3b82f6' },
  { key: 'speicher', label: 'Speicher', icon: Battery, color: '#10b981' },
  { key: 'wallboxen', label: 'Wallboxen', icon: Car, color: '#EAD068' },
  { key: 'waermepumpen', label: 'Wärmepumpen', icon: Thermometer, color: '#ef4444' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`sd-toast sd-toast--${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : type === 'error' ? <AlertCircle size={18} /> : <Sparkles size={18} />}
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function StammdatenPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Data states
  const [hersteller, setHersteller] = useState<Hersteller[]>([]);
  const [plzMappings, setPlzMappings] = useState<PlzMapping[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [produkteByType, setProdukteByType] = useState<Record<ProduktTyp, any[]>>({
    pvModule: [], wechselrichter: [], speicher: [], wallboxen: [], waermepumpen: []
  });
  const [, setSyncStats] = useState<SyncStats | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Load Hersteller
      const herstellerRes = await api.get('/produkte/hersteller').catch(() => ({ data: [] }));
      setHersteller(Array.isArray(herstellerRes.data) ? herstellerRes.data : []);

      // Load all products
      const [pv, wr, sp, wb, wp] = await Promise.all([
        api.get('/produkte/pv-module').catch(() => ({ data: [] })),
        api.get('/produkte/wechselrichter').catch(() => ({ data: [] })),
        api.get('/produkte/speicher').catch(() => ({ data: [] })),
        api.get('/produkte/wallboxen').catch(() => ({ data: [] })),
        api.get('/produkte/waermepumpen').catch(() => ({ data: [] })),
      ]);
      setProdukteByType({
        pvModule: Array.isArray(pv.data) ? pv.data : [],
        wechselrichter: Array.isArray(wr.data) ? wr.data : [],
        speicher: Array.isArray(sp.data) ? sp.data : [],
        wallboxen: Array.isArray(wb.data) ? wb.data : [],
        waermepumpen: Array.isArray(wp.data) ? wp.data : [],
      });

      // Load PLZ mappings from localStorage (or API if available)
      const storedMappings = localStorage.getItem('plzMappings');
      if (storedMappings) {
        setPlzMappings(JSON.parse(storedMappings));
      }

      // Load customers from installations
      const installationsRes = await api.get('/installations').catch(() => ({ data: [] }));
      const installations = Array.isArray(installationsRes.data) ? installationsRes.data : [];
      
      // Extract unique customers
      const customerMap = new Map<string, Kunde>();
      installations.forEach((inst: any) => {
        const name = inst.customerName || inst.customer?.name;
        const email = inst.customerEmail || inst.customer?.email;
        if (name && !customerMap.has(name.toLowerCase())) {
          customerMap.set(name.toLowerCase(), {
            id: inst.customerId || inst.id,
            name,
            email,
            phone: inst.customerPhone || inst.customer?.phone,
            address: inst.location || inst.address,
            installationCount: 1,
            createdAt: inst.createdAt
          });
        } else if (name) {
          const existing = customerMap.get(name.toLowerCase())!;
          existing.installationCount++;
        }
      });
      setKunden(Array.from(customerMap.values()));

      // Calculate sync stats
      calculateSyncStats(installations);

    } catch (err) {
      console.error('Load error:', err);
      setToast({ message: 'Fehler beim Laden', type: 'error' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const calculateSyncStats = (installations: any[]) => {
    const stats: SyncStats = {
      hersteller: { total: hersteller.length, synced: 0, new: 0 },
      produkte: { 
        total: Object.values(produkteByType).reduce((sum, arr) => sum + arr.length, 0),
        synced: 0, 
        new: 0 
      },
      plzMappings: { total: plzMappings.length, unique: 0, conflicts: 0 },
      datenblaetter: { total: 0, synced: 0 },
      kunden: { total: kunden.length, unique: kunden.length }
    };

    // Count PLZ conflicts
    const plzGroups = new Map<string, Set<string>>();
    installations.forEach((inst: any) => {
      const plz = inst.plz || inst.zipCode;
      const nb = inst.gridOperator;
      if (plz && nb) {
        if (!plzGroups.has(plz)) plzGroups.set(plz, new Set());
        plzGroups.get(plz)!.add(nb);
      }
    });
    plzGroups.forEach((nbs) => {
      if (nbs.size > 1) stats.plzMappings.conflicts++;
      else stats.plzMappings.unique++;
    });

    setSyncStats(stats);
  };

  const runFullSync = async () => {
    setSyncing(true);
    setSyncProgress('Lade Installationen...');
    
    try {
      const installationsRes = await api.get('/installations');
      const installations = Array.isArray(installationsRes.data) ? installationsRes.data : [];
      
      let herstellerCreated = 0;
      let produkteCreated = 0;
      let plzMappingsCreated = 0;
      
      // 1. Sync Hersteller & Produkte
      setSyncProgress('Synchronisiere Produkte...');
      const herstellerMap = new Map(hersteller.map(h => [h.name.toLowerCase(), h.id]));
      
      for (const inst of installations) {
        const techItems = extractTechFromInstallation(inst);
        
        for (const { item, type } of techItems) {
          if (!item.manufacturer || !item.model) continue;
          
          // Check/Create Hersteller
          let herstellerId = herstellerMap.get(item.manufacturer.toLowerCase());
          if (!herstellerId) {
            try {
              const newH = await api.post('/produkte/hersteller', { name: item.manufacturer, aktiv: true });
              herstellerId = newH.data?.id;
              if (herstellerId) {
                herstellerMap.set(item.manufacturer.toLowerCase(), herstellerId);
                herstellerCreated++;
              }
            } catch (e) { continue; }
          }
          
          // Check/Create Product
          const endpoint = getProductEndpoint(type);
          const products = produkteByType[type as ProduktTyp] || [];
          const exists = products.find((p: any) => 
            p.modell?.toLowerCase() === item.model.toLowerCase() &&
            p.herstellerId === herstellerId
          );
          
          if (!exists && herstellerId) {
            try {
              await api.post(`/produkte/${endpoint}`, buildProductData(item, type, herstellerId));
              produkteCreated++;
            } catch (e) { /* ignore */ }
          }
        }
      }

      // 2. Sync PLZ Mappings (nur bei eindeutiger Zuordnung!)
      setSyncProgress('Analysiere PLZ-Zuordnungen...');
      const plzNbMap = new Map<string, Map<string, number>>();
      
      installations.forEach((inst: any) => {
        const plz = inst.plz || inst.zipCode;
        const nb = inst.gridOperator;
        if (plz && nb) {
          if (!plzNbMap.has(plz)) plzNbMap.set(plz, new Map());
          const nbCount = plzNbMap.get(plz)!;
          nbCount.set(nb, (nbCount.get(nb) || 0) + 1);
        }
      });

      const newPlzMappings: PlzMapping[] = [...plzMappings];
      
      plzNbMap.forEach((nbCounts, plz) => {
        // Nur bei EINDEUTIGER Zuordnung (ein NB für diese PLZ)
        if (nbCounts.size === 1) {
          const [gridOperator, count] = Array.from(nbCounts.entries())[0];
          const existing = newPlzMappings.find(m => m.plz === plz);
          
          if (!existing) {
            newPlzMappings.push({
              plz,
              gridOperator,
              confidence: 1.0,
              source: 'auto',
              usageCount: count,
              lastUsed: new Date().toISOString()
            });
            plzMappingsCreated++;
          } else if (existing.gridOperator === gridOperator) {
            existing.usageCount += count;
            existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
          }
          // Bei Konflikt: NICHT automatisch ändern!
        }
      });

      setPlzMappings(newPlzMappings);
      localStorage.setItem('plzMappings', JSON.stringify(newPlzMappings));

      // Reload data
      await loadAllData();
      
      setLastSync(new Date().toISOString());
      setSyncProgress(null);
      setSyncing(false);
      
      const messages = [];
      if (herstellerCreated > 0) messages.push(`${herstellerCreated} Hersteller`);
      if (produkteCreated > 0) messages.push(`${produkteCreated} Produkte`);
      if (plzMappingsCreated > 0) messages.push(`${plzMappingsCreated} PLZ-Mappings`);
      
      if (messages.length > 0) {
        setToast({ message: `Sync: ${messages.join(', ')} angelegt`, type: 'success' });
      } else {
        setToast({ message: 'Sync: Alles aktuell', type: 'info' });
      }
      
    } catch (err) {
      console.error('Sync error:', err);
      setToast({ message: 'Sync fehlgeschlagen', type: 'error' });
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function extractTechFromInstallation(inst: any): { item: any; type: string }[] {
    const items: { item: any; type: string }[] = [];
    const tech = inst.technicalData || {};
    const wizardTech = inst.wizardContext?.technical || {};

    const addItems = (data: any, type: string) => {
      const arr = ensureArray(data);
      arr.forEach((item: any) => {
        if (item.manufacturer && item.model) {
          items.push({ item, type });
        }
      });
    };

    addItems(tech.pvEntries || tech.pv || wizardTech.pv, 'pvModule');
    addItems(tech.inverterEntries || tech.inverter || wizardTech.inverter, 'wechselrichter');
    addItems(tech.storageEntries || tech.storage || wizardTech.storage, 'speicher');
    addItems(tech.wallboxEntries || tech.wallbox || wizardTech.wallbox, 'wallboxen');
    addItems(tech.heatPumpEntries || tech.heatPump || wizardTech.heatPump, 'waermepumpen');

    return items;
  }

  function ensureArray(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object' && val.enabled) return [val];
    if (typeof val === 'object') return [val];
    return [];
  }

  function getProductEndpoint(type: string): string {
    if (type === 'pvModule') return 'pv-module';
    return type;
  }

  function buildProductData(item: any, type: string, herstellerId: number): any {
    const base = { herstellerId, modell: item.model, aktiv: true, verified: false };
    switch (type) {
      case 'pvModule': return { ...base, leistungWp: item.powerWp || item.power || 0 };
      case 'wechselrichter': return { ...base, acLeistungW: ((item.acPowerKw || item.power || 0) * 1000), hybrid: item.hybrid || false };
      case 'speicher': return { ...base, kapazitaetBruttoKwh: item.capacityKwh || item.capacity || 0 };
      case 'wallboxen': return { ...base, ladeleistungKw: item.powerKw || item.power || 0 };
      case 'waermepumpen': return { ...base, heizleistungKw: item.powerKw || item.power || 0 };
      default: return base;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLZ MAPPING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addPlzMapping = (plz: string, gridOperator: string) => {
    const newMappings = [...plzMappings];
    const existing = newMappings.find(m => m.plz === plz);
    
    if (existing) {
      existing.gridOperator = gridOperator;
      existing.source = 'manual';
      existing.confidence = 1.0;
    } else {
      newMappings.push({
        plz,
        gridOperator,
        confidence: 1.0,
        source: 'manual',
        usageCount: 0
      });
    }
    
    setPlzMappings(newMappings);
    localStorage.setItem('plzMappings', JSON.stringify(newMappings));
    setToast({ message: `PLZ ${plz} → ${gridOperator} gespeichert`, type: 'success' });
  };

  const deletePlzMapping = (plz: string) => {
    const newMappings = plzMappings.filter(m => m.plz !== plz);
    setPlzMappings(newMappings);
    localStorage.setItem('plzMappings', JSON.stringify(newMappings));
    setToast({ message: `PLZ ${plz} Zuordnung gelöscht`, type: 'success' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════

  const totalProdukte = useMemo(() => 
    Object.values(produkteByType).reduce((sum, arr) => sum + (arr as any[]).length, 0),
    [produkteByType]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="sd-container">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-bg">
          <div className="sd-orb sd-orb--1" />
          <div className="sd-orb sd-orb--2" />
          <div className="sd-orb sd-orb--3" />
        </div>
        <div className="sd-header-content">
          <div className="sd-header-left">
            <div className="sd-header-icon">
              <Database size={28} />
            </div>
            <div>
              <h1>Stammdaten</h1>
              <p>Zentrale Datenbank • {totalProdukte} Produkte • {hersteller.length} Hersteller • {plzMappings.length} PLZ-Mappings</p>
            </div>
          </div>
          <div className="sd-header-right">
            <button 
              className={`sd-sync-btn ${syncing ? 'sd-sync-btn--syncing' : ''}`} 
              onClick={runFullSync}
              disabled={syncing}
            >
              {syncing ? (
                <><Loader2 size={18} className="sd-spin" /> {syncProgress || 'Synchronisiere...'}</>
              ) : (
                <><Sparkles size={18} /> Auto-Sync</>
              )}
            </button>
            <button className="sd-refresh-btn" onClick={loadAllData} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'sd-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="sd-stats-bar">
        {TABS.slice(1).map(tab => {
          const count = tab.key === 'produkte' ? totalProdukte :
                        tab.key === 'hersteller' ? hersteller.length :
                        tab.key === 'plzMappings' ? plzMappings.length :
                        tab.key === 'kunden' ? kunden.length : 0;
          const TabIcon = tab.icon;
          return (
            <button 
              key={tab.key} 
              className={`sd-stat-card ${activeTab === tab.key ? 'sd-stat-card--active' : ''}`}
              style={{ '--stat-color': tab.color } as React.CSSProperties}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="sd-stat-icon"><TabIcon size={20} /></div>
              <div className="sd-stat-content">
                <span className="sd-stat-value">{count}</span>
                <span className="sd-stat-label">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="sd-tabs">
        {TABS.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`sd-tab ${activeTab === tab.key ? 'sd-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="sd-main">
        {activeTab === 'overview' && (
          <OverviewTab 
            lastSync={lastSync}
            hersteller={hersteller}
            produkteByType={produkteByType}
            plzMappings={plzMappings}
            kunden={kunden}
            onSync={runFullSync}
            syncing={syncing}
          />
        )}
        
        {activeTab === 'produkte' && (
          <ProdukteTab 
            produkteByType={produkteByType}
            searchQuery={searchQuery}
          />
        )}
        
        {activeTab === 'hersteller' && (
          <HerstellerTab 
            hersteller={hersteller}
            searchQuery={searchQuery}
          />
        )}
        
        {activeTab === 'plzMappings' && (
          <PlzMappingsTab 
            mappings={plzMappings}
            searchQuery={searchQuery}
            onAdd={addPlzMapping}
            onDelete={deletePlzMapping}
          />
        )}
        
        {activeTab === 'kunden' && (
          <KundenTab 
            kunden={kunden}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'datenblaetter' && (
          <DatenblaetterTab 
            produkteByType={produkteByType}
            searchQuery={searchQuery}
          />
        )}
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({ lastSync, hersteller, produkteByType, plzMappings, kunden, onSync, syncing }: any) {
  const totalProdukte = Object.values(produkteByType as Record<string, any[]>).reduce((sum: number, arr: any[]) => sum + arr.length, 0);
  
  return (
    <div className="sd-overview">
      <div className="sd-overview-grid">
        {/* Sync Status Card */}
        <div className="sd-overview-card sd-overview-card--sync">
          <div className="sd-overview-card__header">
            <Sparkles size={24} />
            <h3>Auto-Synchronisation</h3>
          </div>
          <div className="sd-overview-card__content">
            <p>Synchronisiert automatisch:</p>
            <ul>
              <li>✓ Neue Hersteller aus Installationen</li>
              <li>✓ Neue Produkte (PV, WR, Speicher, etc.)</li>
              <li>✓ PLZ → Netzbetreiber (nur bei eindeutiger Zuordnung)</li>
              <li>✓ Datenblätter zwischen Produkt-DB und Installationen</li>
            </ul>
            {lastSync && (
              <p className="sd-overview-card__lastsync">
                <Clock size={14} /> Letzter Sync: {new Date(lastSync).toLocaleString('de-DE')}
              </p>
            )}
          </div>
          <button className="sd-btn sd-btn--primary" onClick={onSync} disabled={syncing}>
            {syncing ? <Loader2 size={18} className="sd-spin" /> : <Sparkles size={18} />}
            Jetzt synchronisieren
          </button>
        </div>

        {/* Stats Cards */}
        <div className="sd-overview-card">
          <div className="sd-overview-card__header" style={{ color: '#f59e0b' }}>
            <Package size={24} />
            <h3>Produkte</h3>
          </div>
          <div className="sd-overview-card__stats">
            <div className="sd-overview-stat">
              <span className="sd-overview-stat__value">{totalProdukte}</span>
              <span className="sd-overview-stat__label">Gesamt</span>
            </div>
            {PRODUKT_TABS.map(pt => (
              <div key={pt.key} className="sd-overview-stat sd-overview-stat--small">
                <pt.icon size={16} style={{ color: pt.color }} />
                <span>{produkteByType[pt.key]?.length || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sd-overview-card">
          <div className="sd-overview-card__header" style={{ color: '#EAD068' }}>
            <Building2 size={24} />
            <h3>Hersteller</h3>
          </div>
          <div className="sd-overview-card__stats">
            <div className="sd-overview-stat">
              <span className="sd-overview-stat__value">{hersteller.length}</span>
              <span className="sd-overview-stat__label">Gesamt</span>
            </div>
            <div className="sd-overview-stat sd-overview-stat--small">
              <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
              <span>{hersteller.filter((h: any) => h.verified).length} verifiziert</span>
            </div>
          </div>
        </div>

        <div className="sd-overview-card">
          <div className="sd-overview-card__header" style={{ color: '#22c55e' }}>
            <MapPin size={24} />
            <h3>PLZ-Zuordnungen</h3>
          </div>
          <div className="sd-overview-card__stats">
            <div className="sd-overview-stat">
              <span className="sd-overview-stat__value">{plzMappings.length}</span>
              <span className="sd-overview-stat__label">Gesamt</span>
            </div>
            <div className="sd-overview-stat sd-overview-stat--small">
              <span style={{ color: '#3b82f6' }}>{plzMappings.filter((m: any) => m.source === 'auto').length} auto</span>
              <span style={{ color: '#EAD068' }}>{plzMappings.filter((m: any) => m.source === 'manual').length} manuell</span>
            </div>
          </div>
        </div>

        <div className="sd-overview-card">
          <div className="sd-overview-card__header" style={{ color: '#ec4899' }}>
            <Users size={24} />
            <h3>Kunden</h3>
          </div>
          <div className="sd-overview-card__stats">
            <div className="sd-overview-stat">
              <span className="sd-overview-stat__value">{kunden.length}</span>
              <span className="sd-overview-stat__label">Eindeutige Kunden</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProdukteTab({ produkteByType, searchQuery }: any) {
  const [activeProduktTyp, setActiveProduktTyp] = useState<ProduktTyp>('pvModule');
  
  const produkte = produkteByType[activeProduktTyp] || [];
  const filtered = produkte.filter((p: any) =>
    p.modell?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hersteller?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sd-produkte">
      {/* Sub-Tabs */}
      <div className="sd-subtabs">
        {PRODUKT_TABS.map(pt => (
          <button
            key={pt.key}
            className={`sd-subtab ${activeProduktTyp === pt.key ? 'sd-subtab--active' : ''}`}
            style={{ '--subtab-color': pt.color } as React.CSSProperties}
            onClick={() => setActiveProduktTyp(pt.key)}
          >
            <pt.icon size={16} />
            <span>{pt.label}</span>
            <span className="sd-subtab__count">{produkteByType[pt.key]?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="sd-list">
        {filtered.length === 0 ? (
          <div className="sd-empty">
            <Package size={48} />
            <h3>Keine Produkte</h3>
            <p>Produkte werden automatisch aus Installationen synchronisiert</p>
          </div>
        ) : (
          filtered.map((p: any) => (
            <div key={p.id} className="sd-list-item">
              <div className="sd-list-item__icon" style={{ background: PRODUKT_TABS.find(t => t.key === activeProduktTyp)?.color }}>
                {(() => { const Icon = PRODUKT_TABS.find(t => t.key === activeProduktTyp)?.icon || Package; return <Icon size={20} />; })()}
              </div>
              <div className="sd-list-item__content">
                <h4>{p.hersteller?.name || 'Unbekannt'} {p.modell}</h4>
                <p>
                  {activeProduktTyp === 'pvModule' && `${p.leistungWp || 0} Wp`}
                  {activeProduktTyp === 'wechselrichter' && `${p.acLeistungW || 0} W AC`}
                  {activeProduktTyp === 'speicher' && `${p.kapazitaetBruttoKwh || 0} kWh`}
                  {activeProduktTyp === 'wallboxen' && `${p.ladeleistungKw || 0} kW`}
                  {activeProduktTyp === 'waermepumpen' && `${p.heizleistungKw || 0} kW`}
                  {p.verified && <span className="sd-badge sd-badge--green">Verifiziert</span>}
                </p>
              </div>
              {p.datenblattUrl && (
                <a href={p.datenblattUrl} target="_blank" rel="noopener noreferrer" className="sd-list-item__action">
                  <FileSpreadsheet size={16} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HerstellerTab({ hersteller, searchQuery }: any) {
  const filtered = hersteller.filter((h: any) =>
    h.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sd-list">
      {filtered.length === 0 ? (
        <div className="sd-empty">
          <Building2 size={48} />
          <h3>Keine Hersteller</h3>
        </div>
      ) : (
        filtered.map((h: any) => (
          <div key={h.id} className="sd-list-item">
            <div className="sd-list-item__icon" style={{ background: '#EAD068' }}>
              <Building2 size={20} />
            </div>
            <div className="sd-list-item__content">
              <h4>{h.name}</h4>
              <p>
                {h._count?.pvModule || 0} Module • {h._count?.wechselrichter || 0} WR • {h._count?.speicher || 0} Speicher
                {h.verified && <span className="sd-badge sd-badge--green">Verifiziert</span>}
              </p>
            </div>
            {h.website && (
              <a href={h.website} target="_blank" rel="noopener noreferrer" className="sd-list-item__action">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function PlzMappingsTab({ mappings, searchQuery, onAdd, onDelete }: any) {
  const [newPlz, setNewPlz] = useState('');
  const [newNb, setNewNb] = useState('');
  
  const filtered = mappings.filter((m: any) =>
    m.plz?.includes(searchQuery) ||
    m.gridOperator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (newPlz && newNb) {
      onAdd(newPlz, newNb);
      setNewPlz('');
      setNewNb('');
    }
  };

  return (
    <div className="sd-plz">
      {/* Add Form */}
      <div className="sd-plz-form">
        <input 
          type="text" 
          placeholder="PLZ" 
          value={newPlz} 
          onChange={e => setNewPlz(e.target.value)}
          maxLength={5}
        />
        <input 
          type="text" 
          placeholder="Netzbetreiber" 
          value={newNb} 
          onChange={e => setNewNb(e.target.value)}
        />
        <button className="sd-btn sd-btn--primary" onClick={handleAdd}>
          <Plus size={18} /> Hinzufügen
        </button>
      </div>

      <p className="sd-plz-info">
        <AlertCircle size={16} />
        PLZ-Zuordnungen werden nur bei <strong>eindeutiger</strong> Übereinstimmung automatisch erstellt.
        Bei mehreren Netzbetreibern pro PLZ muss manuell zugeordnet werden.
      </p>

      {/* List */}
      <div className="sd-list">
        {filtered.length === 0 ? (
          <div className="sd-empty">
            <MapPin size={48} />
            <h3>Keine PLZ-Zuordnungen</h3>
          </div>
        ) : (
          filtered.map((m: any, i: number) => (
            <div key={m.plz || i} className="sd-list-item">
              <div className="sd-list-item__icon" style={{ background: m.source === 'manual' ? '#EAD068' : '#22c55e' }}>
                <MapPin size={20} />
              </div>
              <div className="sd-list-item__content">
                <h4>{m.plz} → {m.gridOperator}</h4>
                <p>
                  {m.source === 'manual' ? 'Manuell' : 'Automatisch'} • 
                  Konfidenz: {Math.round(m.confidence * 100)}% • 
                  {m.usageCount || 0}x verwendet
                </p>
              </div>
              <button className="sd-list-item__action sd-list-item__action--delete" onClick={() => onDelete(m.plz)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KundenTab({ kunden, searchQuery }: any) {
  const filtered = kunden.filter((k: any) =>
    k.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sd-list">
      {filtered.length === 0 ? (
        <div className="sd-empty">
          <Users size={48} />
          <h3>Keine Kunden</h3>
        </div>
      ) : (
        filtered.map((k: any) => (
          <div key={k.id} className="sd-list-item">
            <div className="sd-list-item__icon" style={{ background: '#ec4899' }}>
              <Users size={20} />
            </div>
            <div className="sd-list-item__content">
              <h4>{k.name}</h4>
              <p>
                {k.email && <span>{k.email}</span>}
                {k.installationCount > 0 && <span className="sd-badge">{k.installationCount} Anlagen</span>}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DatenblaetterTab({ produkteByType, searchQuery }: any) {
  const allWithDatasheet = Object.entries(produkteByType as Record<string, any[]>).flatMap(([type, products]) =>
    products.filter(p => p.datenblattUrl || p.datenblattPfad).map(p => ({ ...p, _type: type }))
  );

  const filtered = allWithDatasheet.filter((p: any) =>
    p.modell?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hersteller?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sd-list">
      {filtered.length === 0 ? (
        <div className="sd-empty">
          <FileSpreadsheet size={48} />
          <h3>Keine Datenblätter</h3>
          <p>Datenblätter werden automatisch aus Installationen synchronisiert</p>
        </div>
      ) : (
        filtered.map((p: any) => (
          <div key={`${p._type}-${p.id}`} className="sd-list-item">
            <div className="sd-list-item__icon" style={{ background: '#06b6d4' }}>
              <FileSpreadsheet size={20} />
            </div>
            <div className="sd-list-item__content">
              <h4>{p.hersteller?.name || 'Unbekannt'} {p.modell}</h4>
              <p>{p._type}</p>
            </div>
            <a 
              href={p.datenblattUrl || p.datenblattPfad} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="sd-list-item__action"
            >
              <Download size={16} />
            </a>
          </div>
        ))
      )}
    </div>
  );
}

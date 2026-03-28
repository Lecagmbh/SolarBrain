/**
 * SolarBrain D2D — Vertriebskarte
 * Zeigt alle Leads als farbige Pins nach Status
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAuthToken } from "../../config/storage";

import { API_BASE as API } from "../../lib/apiBase";

async function apiFetch(path: string) {
  const token = getAuthToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Status-Konfiguration
const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  NEU:              { color: "#f59e0b", label: "Neu",             icon: "●" },
  KONTAKTIERT:      { color: "#3b82f6", label: "Kontaktiert",     icon: "●" },
  QUALIFIZIERT:     { color: "#10b981", label: "Qualifiziert",    icon: "●" },
  DISQUALIFIZIERT:  { color: "#ef4444", label: "Disqualifiziert", icon: "●" },
  KONVERTIERT:      { color: "#8b5cf6", label: "Konvertiert",     icon: "●" },
  ABGELEHNT:        { color: "#6b7280", label: "Abgelehnt",       icon: "●" },
};

const HAUSART_LABELS: Record<string, string> = {
  efh: "Einfamilienhaus", mfh: "Mehrfamilienhaus",
  gewerbe: "Gewerbe", gewerblich: "Gewerbe", sonstiges: "Sonstiges",
};

function createPin(color: string, isActive: boolean) {
  const size = isActive ? 18 : 12;
  const glow = isActive ? `0 0 12px ${color}80, 0 0 24px ${color}30` : `0 0 6px ${color}40`;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:${glow};
      transition:all .2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════

const CSS = `
/* Layout */
.sb-map{display:flex;height:calc(100vh - 64px);height:calc(100dvh - 64px);background:#060b18;overflow:hidden;position:relative}
.sb-map-area{flex:1;position:relative;min-width:0}
.sb-map-area .leaflet-container{height:100%!important;width:100%!important;background:#f0ede6}

/* Dark map theme overrides */
.leaflet-control-zoom a{background:#111827!important;color:#d1d5db!important;border-color:#1f2937!important}
.leaflet-control-zoom a:hover{background:#1f2937!important;color:#f9fafb!important}
.leaflet-popup-content-wrapper{background:#fff!important;color:#1e293b!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,0.15)!important;border:1px solid rgba(0,0,0,0.06)!important}
.leaflet-popup-tip{background:#fff!important}
.leaflet-popup-close-button{color:#64748b!important;font-size:18px!important;top:6px!important;right:8px!important}

/* Panel */
.sb-panel{width:360px;flex-shrink:0;background:#0d1321;border-left:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;overflow:hidden}
.sb-panel-head{padding:20px 20px 16px}
.sb-panel-title{font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:-0.03em}
.sb-panel-sub{font-size:12px;color:#64748b;margin-top:4px}

/* Stats Grid */
.sb-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 20px 16px}
.sb-stat{text-align:center;padding:10px 4px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:all .15s}
.sb-stat:hover{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08)}
.sb-stat.active{border-color:var(--sc);background:color-mix(in srgb,var(--sc) 8%,transparent)}
.sb-stat-n{font-size:22px;font-weight:800;color:var(--sc);font-variant-numeric:tabular-nums}
.sb-stat-l{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-top:3px}

/* Filter Pills */
.sb-filters{display:flex;gap:6px;padding:0 20px 12px;flex-wrap:wrap}
.sb-pill{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#94a3b8;cursor:pointer;transition:all .15s;text-transform:uppercase;letter-spacing:0.04em}
.sb-pill:hover{border-color:rgba(255,255,255,0.15);color:#cbd5e1}
.sb-pill.active{border-color:var(--pc);color:var(--pc);background:color-mix(in srgb,var(--pc) 10%,transparent)}

/* Divider */
.sb-div{height:1px;background:rgba(255,255,255,0.04);margin:0 20px}

/* List */
.sb-list{flex:1;overflow-y:auto;padding:8px 12px}
.sb-list::-webkit-scrollbar{width:3px}
.sb-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
.sb-card{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:4px;border:1px solid transparent;position:relative}
.sb-card:hover{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06)}
.sb-card-pin{width:10px;height:10px;border-radius:50%;flex-shrink:0;position:relative}
.sb-card-pin::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:currentColor;opacity:0.15}
.sb-card-info{flex:1;min-width:0}
.sb-card-name{font-size:13px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-card-meta{font-size:10px;color:#64748b;margin-top:2px;display:flex;gap:8px;align-items:center}
.sb-card-badge{font-size:9px;font-weight:700;padding:3px 10px;border-radius:20px;flex-shrink:0;letter-spacing:0.02em}

/* Map Controls */
.sb-controls{position:absolute;top:16px;right:16px;z-index:1000;display:flex;gap:8px}
.sb-btn{padding:9px 16px;background:rgba(13,19,33,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#cbd5e1;font-size:11px;font-weight:600;cursor:pointer;backdrop-filter:blur(12px);transition:all .15s;font-family:inherit;display:flex;align-items:center;gap:6px}
.sb-btn:hover{border-color:rgba(255,255,255,0.15);color:#f1f5f9;background:rgba(13,19,33,0.96)}
.sb-btn.active{border-color:#D4A843;color:#D4A843}
.sb-btn svg{width:14px;height:14px}

/* CTA */
.sb-cta{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:1000}
.sb-cta button{padding:12px 28px;background:linear-gradient(135deg,#D4A843 0%,#e8c35a 100%);border:none;border-radius:12px;color:#060b18;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 4px 24px rgba(212,168,67,0.25),0 0 0 1px rgba(212,168,67,0.1);transition:all .2s;font-family:inherit;letter-spacing:-0.01em}
.sb-cta button:hover{transform:translateY(-1px);box-shadow:0 8px 32px rgba(212,168,67,0.35)}

/* Empty */
.sb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;color:#475569;font-size:13px;text-align:center;gap:12px}

/* Legende */
.sb-legend{position:absolute;bottom:24px;left:16px;z-index:1000;background:rgba(13,19,33,0.92);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:5px}
.sb-legend-item{display:flex;align-items:center;gap:8px;font-size:10px;color:#94a3b8;font-weight:500}
.sb-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

@keyframes sb-pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:0;transform:scale(2.5)}}
@keyframes sb-spin{to{transform:rotate(360deg)}}

/* Responsive */
@media(max-width:1024px){.sb-panel{width:300px}.sb-stat-n{font-size:18px}.sb-stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){
  .sb-map{flex-direction:column}
  .sb-map-area{flex:1;min-height:55vh}
  .sb-panel{width:100%;max-height:42vh;border-left:none;border-top:1px solid rgba(255,255,255,0.04);border-radius:16px 16px 0 0}
  .sb-panel-head{padding:12px 16px 8px}
  .sb-panel-title{font-size:15px}
  .sb-stats{padding:0 16px 10px;grid-template-columns:repeat(4,1fr)}
  .sb-controls{top:10px;right:10px;gap:6px;flex-wrap:wrap}
  .sb-btn{padding:8px 12px;font-size:10px;min-height:38px}
  .sb-legend{bottom:16px;left:10px;padding:8px 12px}
  .sb-cta{bottom:16px}
}
`;

// ════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════

interface LeadPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  status: string;
  hausart: string;
  stromverbrauch: number;
  plz: string;
  timestamp: string;
}

export default function MapPage() {
  const nav = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [pins, setPins] = useState<LeadPin[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [satellite, setSatellite] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);

  // Load leads
  const loadPins = useCallback(async () => {
    try {
      const data = await apiFetch("/wizard/leads-map");
      if (!data?.success) { setPins([]); return; }
      const items = data.data || [];
      setAllItems(items);
      setStats(data.stats || {});
      const mapped: LeadPin[] = items
        .filter((i: any) => i.lat && i.lng)
        .map((i: any) => ({
          id: i.id,
          lat: i.lat,
          lng: i.lng,
          name: i.name || "–",
          address: [i.strasse, i.hausNr, i.plz, i.ort].filter(Boolean).join(", "),
          status: (i.status || "NEU").toUpperCase(),
          hausart: i.hausart || "",
          stromverbrauch: i.stromverbrauch || 0,
          plz: i.plz || "",
          timestamp: i.timestamp || "",
        }));
      setPins(mapped);
    } catch {
      setPins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered pins
  const visiblePins = filter ? pins.filter(p => p.status === filter) : pins;

  // Init map
  useEffect(() => {
    function initMap() {
      if (!mapEl.current || mapRef.current) return false;
      const el = mapEl.current;
      if (!el.offsetWidth || !el.offsetHeight) return false;

      try {
        const map = L.map(el, {
          center: [51.1657, 10.4515],
          zoom: 6,
          zoomControl: false,
          attributionControl: false,
        });

        tileLayerRef.current = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          { maxZoom: 19 }
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        setTimeout(() => map.invalidateSize(), 200);
        setTimeout(() => map.invalidateSize(), 1000);

        // Location
        function showLocation(ll: [number, number], label: string, zoom: number) {
          setUserPos(ll);
          map.setView(ll, zoom);
          L.marker(ll, {
            icon: L.divIcon({
              className: "",
              html: `<div style="position:relative">
                <div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.5);position:relative;z-index:2"></div>
                <div style="position:absolute;top:-7px;left:-7px;width:28px;height:28px;background:rgba(59,130,246,0.2);border-radius:50%;animation:sb-pulse 2s infinite"></div>
              </div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            }),
            zIndexOffset: 1000,
          }).addTo(map).bindPopup(`<div style="font-size:12px;font-weight:600">${label}</div>`);
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => showLocation([pos.coords.latitude, pos.coords.longitude], "Dein Standort", 14),
            () => showLocation([48.3392, 7.8723], "SolarBrain HQ", 12),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          showLocation([48.3392, 7.8723], "SolarBrain HQ", 12);
        }
      } catch (err) {
        console.error("[Map] Init error:", err);
      }
      return true;
    }

    if (!initMap()) {
      const t1 = setTimeout(() => { if (!initMap()) { setTimeout(initMap, 1000); } }, 300);
      return () => clearTimeout(t1);
    }
  }, []);

  // Load data
  useEffect(() => { loadPins(); }, [loadPins]);

  // Render pins
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    visiblePins.forEach((pin) => {
      const cfg = STATUS_CONFIG[pin.status] || STATUS_CONFIG.NEU;
      const isHighlighted = activePin === pin.id;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createPin(cfg.color, isHighlighted),
        zIndexOffset: isHighlighted ? 1000 : 0,
      });

      const timeAgo = pin.timestamp ? formatTimeAgo(pin.timestamp) : "";

      marker.bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif;min-width:200px;padding:4px 0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:32px;height:32px;border-radius:10px;background:${cfg.color}18;display:flex;align-items:center;justify-content:center">
              <div style="width:10px;height:10px;border-radius:50%;background:${cfg.color}"></div>
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;color:#1e293b">${pin.name}</div>
              <div style="font-size:11px;color:#64748b">${pin.address || pin.plz || "–"}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span style="background:${cfg.color}18;color:${cfg.color};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700">${cfg.label}</span>
            ${pin.hausart ? `<span style="background:rgba(255,255,255,0.05);color:#94a3b8;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600">${HAUSART_LABELS[pin.hausart] || pin.hausart}</span>` : ""}
          </div>
          ${pin.stromverbrauch > 0 ? `<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:#f8fafc;border-radius:8px;margin-bottom:6px">
            <span style="font-size:10px;color:#64748b">Verbrauch</span>
            <span style="font-size:12px;font-weight:700;color:#1e293b;margin-left:auto">${pin.stromverbrauch.toLocaleString("de-DE")} kWh/J.</span>
          </div>` : ""}
          ${timeAgo ? `<div style="font-size:10px;color:#475569;text-align:right">${timeAgo}</div>` : ""}
        </div>
      `, { className: "sb-popup", maxWidth: 280 });

      markersRef.current!.addLayer(marker);
    });

    if (visiblePins.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(visiblePins.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [visiblePins, activePin]);

  // Toggle satellite / dark
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(mapRef.current);
    tileLayerRef.current.setZIndex(0);
  }, [satellite]);

  const flyTo = (lat: number, lng: number, id: string) => {
    setActivePin(id);
    mapRef.current?.flyTo([lat, lng], 16, { duration: 0.6 });
    setTimeout(() => setActivePin(null), 4000);
  };

  // Filtered list items
  const filteredItems = filter
    ? allItems.filter((i: any) => (i.status || "NEU").toUpperCase() === filter)
    : allItems;

  return (
    <div className="sb-map">
      <style>{CSS}</style>

      {/* Map */}
      <div className="sb-map-area">
        <div ref={mapEl} style={{ height: "100%", width: "100%" }} />

        {/* Controls */}
        <div className="sb-controls">
          <button className={`sb-btn${satellite ? " active" : ""}`} onClick={() => setSatellite(!satellite)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            Satellit
          </button>
          <button className="sb-btn" onClick={() => userPos && mapRef.current?.flyTo(userPos, 15, { duration: 0.6 })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
            Standort
          </button>
          <button className="sb-btn" onClick={() => visiblePins.length > 0 && mapRef.current?.fitBounds(L.latLngBounds(visiblePins.map(p => [p.lat, p.lng])), { padding: [60, 60] })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
            Alle
          </button>
        </div>

        {/* Legend */}
        <div className="sb-legend">
          {Object.entries(STATUS_CONFIG).filter(([k]) => {
            const count = pins.filter(p => p.status === k).length;
            return count > 0;
          }).map(([key, cfg]) => (
            <div key={key} className="sb-legend-item">
              <div className="sb-legend-dot" style={{ background: cfg.color }} />
              <span>{cfg.label} ({pins.filter(p => p.status === key).length})</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="sb-cta">
          <button onClick={() => nav("/lead/new")}>+ Neuen Lead erfassen</button>
        </div>
      </div>

      {/* Panel */}
      <div className="sb-panel">
        <div className="sb-panel-head">
          <div className="sb-panel-title">Vertriebsgebiet</div>
          <div className="sb-panel-sub">{pins.length} Leads auf der Karte</div>
        </div>

        {/* Stats */}
        <div className="sb-stats">
          <div
            className={`sb-stat${filter === null ? " active" : ""}`}
            style={{ "--sc": "#D4A843" } as any}
            onClick={() => setFilter(null)}
          >
            <div className="sb-stat-n">{stats.total || 0}</div>
            <div className="sb-stat-l">Gesamt</div>
          </div>
          <div
            className={`sb-stat${filter === "NEU" ? " active" : ""}`}
            style={{ "--sc": STATUS_CONFIG.NEU.color } as any}
            onClick={() => setFilter(filter === "NEU" ? null : "NEU")}
          >
            <div className="sb-stat-n">{stats.neu || 0}</div>
            <div className="sb-stat-l">Neu</div>
          </div>
          <div
            className={`sb-stat${filter === "KONTAKTIERT" ? " active" : ""}`}
            style={{ "--sc": STATUS_CONFIG.KONTAKTIERT.color } as any}
            onClick={() => setFilter(filter === "KONTAKTIERT" ? null : "KONTAKTIERT")}
          >
            <div className="sb-stat-n">{stats.kontaktiert || 0}</div>
            <div className="sb-stat-l">Kontaktiert</div>
          </div>
          <div
            className={`sb-stat${filter === "QUALIFIZIERT" ? " active" : ""}`}
            style={{ "--sc": STATUS_CONFIG.QUALIFIZIERT.color } as any}
            onClick={() => setFilter(filter === "QUALIFIZIERT" ? null : "QUALIFIZIERT")}
          >
            <div className="sb-stat-n">{stats.qualifiziert || 0}</div>
            <div className="sb-stat-l">Qualifiziert</div>
          </div>
        </div>

        <div className="sb-div" />

        {/* Lead List */}
        <div className="sb-list">
          {loading ? (
            <div className="sb-empty">
              <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.2)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "sb-spin .6s linear infinite" }} />
              <span>Leads werden geladen...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="sb-empty">
              {filter ? (
                <>
                  <span style={{ fontSize: 32, opacity: 0.5 }}>&#8709;</span>
                  <span>Keine Leads mit Status "{STATUS_CONFIG[filter]?.label || filter}"</span>
                  <button onClick={() => setFilter(null)} style={{ marginTop: 8, padding: "6px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Filter zurücksetzen</button>
                </>
              ) : (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>Noch keine Leads erfasst</span>
                </>
              )}
            </div>
          ) : (
            filteredItems.slice(0, 60).map((item: any) => {
              const hasCoords = item.lat != null && item.lng != null;
              const status = (item.status || "NEU").toUpperCase();
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEU;
              const name = item.name || "–";
              const address = [item.strasse, item.hausNr, item.plz, item.ort].filter(Boolean).join(", ");
              const timeStr = item.timestamp ? formatTimeAgo(item.timestamp) : "";
              return (
                <div
                  key={item.id}
                  className="sb-card"
                  onClick={() => hasCoords ? flyTo(item.lat, item.lng, item.id) : undefined}
                  style={!hasCoords ? { opacity: 0.5, cursor: "default" } : undefined}
                >
                  <div className="sb-card-pin" style={{ background: cfg.color, color: cfg.color }} />
                  <div className="sb-card-info">
                    <div className="sb-card-name">{name}</div>
                    <div className="sb-card-meta">
                      <span>{address || "Keine Adresse"}</span>
                      {timeStr && <span>{timeStr}</span>}
                    </div>
                  </div>
                  <span className="sb-card-badge" style={{ color: cfg.color, background: `${cfg.color}12` }}>{cfg.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `vor ${days} T.`;
  return `vor ${Math.floor(days / 30)} Mon.`;
}

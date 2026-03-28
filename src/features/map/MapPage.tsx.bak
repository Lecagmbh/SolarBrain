/**
 * Baunity D2D — Kartenbasierter Vertrieb
 * =======================================
 * Leaflet Map mit:
 * - Installations/Leads als Pins
 * - Gebiete (Territories) als farbige Polygone
 * - Heatmap Layer (Aktivitätsdichte)
 * - GPS-Tracking, Visit Check-in
 * - Sidebar mit Visit-Liste & Quick-Stats
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAuthToken } from "../../config/storage";

const API = import.meta.env.VITE_API_BASE || "/api";

async function apiFetch(path: string) {
  const token = getAuthToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Pin colors per status
const PIN_COLORS: Record<string, string> = {
  LEAD: "#D4A843",
  KONTAKTIERT: "#3b82f6",
  QUALIFIZIERT: "#22c55e",
  DISQUALIFIZIERT: "#ef4444",
  VERKAUFT: "#22c55e",
  INSTALLATION: "#f59e0b",
  FERTIG: "#64748b",
  // Legacy
  EINGANG: "#D4A843",
  BEIM_NB: "#3b82f6",
  RUECKFRAGE: "#8b5cf6",
  GENEHMIGT: "#22c55e",
  IBN: "#f59e0b",
};

const STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead", KONTAKTIERT: "Kontaktiert", QUALIFIZIERT: "Qualifiziert",
  DISQUALIFIZIERT: "Disqualifiziert", VERKAUFT: "Verkauft",
  INSTALLATION: "Installation", FERTIG: "Fertig",
  EINGANG: "Lead", BEIM_NB: "Kontaktiert", RUECKFRAGE: "Qualifiziert", GENEHMIGT: "Verkauft", IBN: "Installation",
};

function createPin(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 0 8px ${color}60,0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const CSS = `
.map-page{display:flex;height:calc(100vh - 64px);height:calc(100dvh - 64px);background:#060a14;overflow:hidden}
.map-container{flex:1;position:relative;min-width:0}
.map-container .leaflet-container{height:100%!important;width:100%!important;background:#f0ede6}
.map-sidebar{width:340px;flex-shrink:0;background:#0b1224;border-left:1px solid rgba(212,168,67,0.08);display:flex;flex-direction:column;overflow:hidden}
@media(max-width:768px){.map-sidebar{display:none}.map-page{height:100vh;height:100dvh}}
.map-sidebar-header{padding:16px 20px;border-bottom:1px solid rgba(212,168,67,0.06)}
.map-sidebar-header h2{font-size:15px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;font-family:'Inter',sans-serif}
.map-sidebar-header p{font-size:11px;color:#64748b;margin-top:2px}
.map-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:12px 20px;border-bottom:1px solid rgba(212,168,67,0.06)}
.map-stat{text-align:center;padding:8px 4px;background:rgba(15,23,42,0.5);border-radius:8px;border:1px solid rgba(212,168,67,0.04)}
.map-stat-val{font-size:20px;font-weight:800;color:var(--sc,#D4A843);font-family:'DM Mono',monospace}
.map-stat-label{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
.map-list{flex:1;overflow-y:auto;padding:8px 12px}
.map-list::-webkit-scrollbar{width:4px}
.map-list::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.15);border-radius:2px}
.map-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all .15s;margin-bottom:4px;border:1px solid transparent}
.map-item:hover{background:rgba(15,23,42,0.6);border-color:rgba(212,168,67,0.08)}
.map-item-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;box-shadow:0 0 6px var(--dc,#D4A843)}
.map-item-body{flex:1;min-width:0}
.map-item-name{font-size:12px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.map-item-sub{font-size:10px;color:#64748b;margin-top:1px}
.map-item-status{font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;text-transform:uppercase;flex-shrink:0}
.map-toolbar{position:absolute;top:12px;right:12px;z-index:1000;display:flex;gap:6px}
.map-toolbar button{padding:8px 14px;background:rgba(11,18,36,0.9);border:1px solid rgba(212,168,67,0.12);border-radius:8px;color:#e2e8f0;font-size:11px;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);transition:all .15s;font-family:'Inter',sans-serif}
.map-toolbar button:hover{border-color:rgba(212,168,67,0.3);background:rgba(11,18,36,0.95)}
.map-toolbar button.active{border-color:#D4A843;color:#D4A843;background:rgba(212,168,67,0.08)}
.map-checkin{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000}
.map-checkin button{padding:12px 32px;background:linear-gradient(135deg,#D4A843,#EAD068);border:none;border-radius:12px;color:#060a14;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 20px rgba(212,168,67,0.3);transition:all .2s;font-family:'Inter',sans-serif}
.map-checkin button:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(212,168,67,0.4)}
.map-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#475569;font-size:12px;text-align:center;gap:8px}
@keyframes locPulse{0%{transform:scale(1);opacity:.4}50%{transform:scale(2.5);opacity:0}100%{transform:scale(1);opacity:0}}

/* Tablet */
@media(max-width:1024px){
  .map-sidebar{width:280px}
  .map-stat-val{font-size:16px}
}

/* Mobile */
@media(max-width:768px){
  .map-page{flex-direction:column;height:calc(100vh - 60px)}
  .map-container{flex:1;min-height:50vh}
  .map-sidebar{width:100%;height:auto;max-height:45vh;border-left:none;border-top:1px solid rgba(212,168,67,0.08);border-radius:16px 16px 0 0;overflow:hidden}
  .map-sidebar-header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
  .map-sidebar-header h2{font-size:14px}
  .map-sidebar-header p{display:none}
  .map-stats{padding:8px 16px;gap:6px}
  .map-stat{padding:6px 4px}
  .map-stat-val{font-size:16px}
  .map-list{padding:4px 8px}
  .map-item{padding:10px 10px}
  .map-toolbar{top:8px;right:8px;left:68px;gap:4px;flex-wrap:wrap}
  .map-toolbar button{padding:8px 10px;font-size:11px;border-radius:10px;min-height:38px}
  .map-checkin{bottom:20px;top:auto;left:50%;transform:translateX(-50%)}
  .map-checkin button{padding:10px 20px;font-size:12px;border-radius:10px;min-height:44px}
  .map-handle{display:block;width:40px;height:4px;background:rgba(212,168,67,0.2);border-radius:2px;margin:8px auto 0}
}

/* Small Phone */
@media(max-width:400px){
  .map-toolbar button{font-size:10px;padding:6px 8px}
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MapPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  status: string;
  kwp: number;
  nb: string;
}

export default function MapPage() {
  const nav = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Load installations — auch ohne Koordinaten für die Sidebar-Liste
  const [allItems, setAllItems] = useState<any[]>([]);
  const loadPins = useCallback(async () => {
    try {
      const data = await apiFetch("/installations/enterprise?limit=1000");
      const items = data?.data || [];
      setAllItems(items);
      const mapped: MapPin[] = items
        .filter((i: any) => i.latitude && i.longitude)
        .map((i: any) => ({
          id: i.installationId || i.id,
          lat: parseFloat(i.latitude),
          lng: parseFloat(i.longitude),
          name: i.customerName || i.name || "–",
          address: [i.strasse || i.street, i.plz, i.ort || i.city].filter(Boolean).join(", "),
          status: (i.status || "LEAD").toUpperCase(),
          kwp: i.kwp || 0,
          nb: i.gridOperator || i.netzbetreiberName || "–",
        }));
      setPins(mapped);
    } catch {
      setPins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init map (with retry for WebView navigation)
  useEffect(() => {
    function initMap() {
      if (!mapEl.current || mapRef.current) return false;
      const el = mapEl.current;
      // Guard: element must have dimensions
      if (!el.offsetWidth || !el.offsetHeight) return false;

    try {
      const map = L.map(el, {
        center: [51.1657, 10.4515], // Germany center
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      // Map tiles — Standard (Carto Voyager)
      tileLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.attribution({ position: "bottomleft" }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Fix for WebView: force map to recalculate size
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 1000);

    // Klick auf Karte → Solar-Check
    map.on("click", async (e: L.LeafletMouseEvent) => {
      if (map.getZoom() < 15) return; // Nur bei hohem Zoom
      const { lat, lng } = e.latlng;
      const popup = L.popup({ maxWidth: 280 })
        .setLatLng(e.latlng)
        .setContent(`<div style="text-align:center;padding:8px;font-family:Inter,sans-serif">
          <div style="width:20px;height:20px;border:2px solid #D4A843;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto"></div>
          <div style="font-size:11px;color:#888;margin-top:6px">Solar-Analyse läuft...</div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>`)
        .openOn(map);

      try {
        const data = await apiFetch(`/solar/solar-check?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
        if (!data || !data.available) {
          popup.setContent(`<div style="font-family:Inter,sans-serif;padding:4px">
            <div style="font-size:12px;color:#888">Keine Solardaten für diesen Standort</div>
          </div>`);
          return;
        }

        const syBase = data.specificYield || data.maxSunshineHours || 950;
        const optAngle = data.optimalAngle || 30;
        const pid = `sp${Date.now()}`;

        function renderPopup(kwp: number) {
          const quality = syBase >= 1050 ? "Sehr gut" : syBase >= 950 ? "Gut" : syBase >= 850 ? "Mittel" : "Mäßig";
          const qc = syBase >= 1050 ? "#059669" : syBase >= 950 ? "#D4A843" : syBase >= 850 ? "#f59e0b" : "#ef4444";
          const ykwh = Math.round(kwp * syBase);
          const sav = Math.round(ykwh * 0.7 * 0.35 + ykwh * 0.3 * 0.082);
          const pan = Math.round(kwp * 1000 / 400);
          const amo = sav > 0 ? (kwp * 1400 / sav).toFixed(1) : "–";

          return `<div style="font-family:Inter,sans-serif;min-width:290px;max-width:330px" id="${pid}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <div style="font-size:14px;font-weight:700;color:#1a1a1a">☀️ Solar-Rechner</div>
              <div style="display:flex;align-items:center;gap:4px">
                <div style="width:7px;height:7px;border-radius:50%;background:${qc}"></div>
                <span style="font-size:10px;font-weight:700;color:${qc}">${quality}</span>
              </div>
            </div>
            <div style="font-size:10px;color:#888;margin-bottom:8px" data-o="syval">${syBase} kWh/kWp</div>
            <div style="padding:8px;background:#f8f8f8;border-radius:8px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Anlagengröße</span><input type="range" min="3" max="30" step="0.5" value="${kwp}" data-s="kwp" style="flex:1;accent-color:#D4A843;height:4px"><span style="font-size:10px;font-weight:700;color:#D4A843;width:55px;text-align:right" data-o="kwp">${kwp} kWp</span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Strompreis</span><input type="range" min="0.20" max="0.55" step="0.01" value="0.35" data-s="price" style="flex:1;accent-color:#2563EB;height:4px"><span style="font-size:10px;font-weight:700;color:#2563EB;width:55px;text-align:right" data-o="price">0.35 €</span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Dachneigung</span><input type="range" min="0" max="90" step="5" value="${optAngle}" data-s="angle" style="flex:1;accent-color:#059669;height:4px"><span style="font-size:10px;font-weight:700;color:#059669;width:55px;text-align:right" data-o="angle">${optAngle}°</span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Ausrichtung</span><select data-s="dir" style="flex:1;font-size:10px;padding:3px;border:1px solid #ddd;border-radius:4px"><option value="1.0">Süd</option><option value="0.97">SSO / SSW</option><option value="0.95">SO / SW</option><option value="0.80">Ost / West</option><option value="0.65">NO / NW</option><option value="0.55">Nord</option></select><span style="width:55px"></span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Eigenverbr.</span><input type="range" min="30" max="90" step="5" value="70" data-s="ev" style="flex:1;accent-color:#8b5cf6;height:4px"><span style="font-size:10px;font-weight:700;color:#8b5cf6;width:55px;text-align:right" data-o="ev">70%</span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:9px;color:#666;width:62px">Modul</span><input type="range" min="300" max="500" step="10" value="400" data-s="watt" style="flex:1;accent-color:#f59e0b;height:4px"><span style="font-size:10px;font-weight:700;color:#f59e0b;width:55px;text-align:right" data-o="watt">400 W</span></div>
              <div style="display:flex;align-items:center;gap:6px"><span style="font-size:9px;color:#666;width:62px">Alter</span><input type="range" min="0" max="25" step="1" value="0" data-s="age" style="flex:1;accent-color:#64748b;height:4px"><span style="font-size:10px;font-weight:700;color:#64748b;width:55px;text-align:right" data-o="age">0 J.</span></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-top:8px">
              <div style="background:#ECFDF5;padding:6px;border-radius:6px;text-align:center"><div style="font-size:15px;font-weight:800;color:#059669" data-o="kwh">${ykwh.toLocaleString("de-DE")}</div><div style="font-size:8px;color:#065F46;font-weight:600">kWh/Jahr</div></div>
              <div style="background:#FEF3C7;padding:6px;border-radius:6px;text-align:center"><div style="font-size:15px;font-weight:800;color:#D4A843" data-o="sav">${sav.toLocaleString("de-DE")}€</div><div style="font-size:8px;color:#92400E;font-weight:600">Ersparnis/J.</div></div>
              <div style="background:#F5F3FF;padding:6px;border-radius:6px;text-align:center"><div style="font-size:15px;font-weight:800;color:#7C3AED" data-o="pan">${pan}</div><div style="font-size:8px;color:#5B21B6;font-weight:600">Module</div></div>
            </div>
            <div style="margin-top:6px;padding:5px 8px;background:#FEF9C3;border-radius:6px;font-size:10px;color:#854D0E;text-align:center">⚡ Amortisation: ~<span data-o="amo">${amo}</span> Jahre · Kosten ~<span data-o="cost">${(kwp*1.4).toFixed(1)}</span>k€</div>
          </div>`;
        }

        popup.setContent(renderPopup(10));

        // Event-Listener NACH dem Rendern registrieren
        popup.on("add", () => {
          const root = document.getElementById(pid);
          if (!root) return;

          const NF: Record<number,number> = {0:0.87,5:0.90,10:0.93,15:0.96,20:0.98,25:0.99,30:1.0,35:1.0,40:0.99,45:0.97,50:0.94,55:0.90,60:0.85,65:0.79,70:0.73,75:0.66,80:0.60,85:0.57,90:0.55};

          function calc() {
            const g = (s: string) => root!.querySelector(`[data-s="${s}"]`) as HTMLInputElement | HTMLSelectElement;
            const k = parseFloat(g("kwp").value);
            const price = parseFloat(g("price").value);
            const angle = parseInt(g("angle").value);
            const dirFactor = parseFloat(g("dir").value);
            const ev = parseInt(g("ev").value) / 100;
            const watt = parseInt(g("watt").value);
            const age = parseInt(g("age").value);

            // Neigungsfaktor interpolieren
            const lo = Math.floor(angle / 5) * 5;
            const hi = Math.ceil(angle / 5) * 5;
            const nf = lo === hi ? (NF[lo] || 0.87) : (NF[lo] || 0.87) + ((NF[hi] || 0.87) - (NF[lo] || 0.87)) * ((angle - lo) / 5);
            const degradation = 1 - age * 0.005;
            const syAdj = Math.round(syBase * nf * dirFactor * degradation);
            const yearly = Math.round(k * syAdj);
            const evKwh = Math.round(yearly * ev);
            const eiKwh = yearly - evKwh;
            const savings = Math.round(evKwh * price + eiKwh * 0.082);
            const panels = Math.round(k * 1000 / watt);
            const cost = k * 1400;
            const amort = savings > 0 ? (cost / savings).toFixed(1) : "–";

            const o = (s: string) => root!.querySelector(`[data-o="${s}"]`) as HTMLElement;
            o("kwp").textContent = k + " kWp";
            o("price").textContent = price.toFixed(2) + " €";
            o("angle").textContent = angle + "°";
            o("ev").textContent = Math.round(ev * 100) + "%";
            o("watt").textContent = watt + " W";
            o("age").textContent = age + " J.";
            o("syval").textContent = syAdj + " kWh/kWp";
            o("kwh").textContent = yearly.toLocaleString("de-DE");
            o("sav").textContent = savings.toLocaleString("de-DE") + "€";
            o("pan").textContent = String(panels);
            o("amo").textContent = amort;
            o("cost").textContent = (cost / 1000).toFixed(1);
          }

          root.querySelectorAll("[data-s]").forEach(el => {
            el.addEventListener("input", calc);
            el.addEventListener("change", calc);
          });
        });
      } catch {
        popup.setContent(`<div style="font-family:Inter,sans-serif;color:#888;font-size:11px">Fehler bei der Analyse</div>`);
      }
    });

    // Standort ermitteln: GPS → IP-Fallback
    function showLocation(ll: [number, number], label: string, zoom: number) {
      setUserPos(ll);
      map.setView(ll, zoom);
      L.marker(ll, {
        icon: L.divIcon({
          className: "",
          html: `<div style="position:relative">
            <div style="width:16px;height:16px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.5);position:relative;z-index:2"></div>
            <div style="position:absolute;top:-8px;left:-8px;width:32px;height:32px;background:rgba(59,130,246,0.15);border-radius:50%;animation:locPulse 2s infinite"></div>
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000,
      }).addTo(map).bindPopup(`<b>${label}</b>`);
    }

    // IP-basierter Fallback
    async function ipFallback() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.latitude && data.longitude) {
          showLocation([data.latitude, data.longitude], `Standort: ${data.city || ""}`, 13);
          return;
        }
      } catch {}
      // Letzter Fallback: Lahr (Baunity HQ)
      showLocation([48.3392, 7.8723], "Baunity HQ — Lahr", 13);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => showLocation([pos.coords.latitude, pos.coords.longitude], "Dein Standort", 15),
        () => ipFallback(),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      ipFallback();
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    } catch (err) {
      console.error("[Map] Init error:", err);
    }
    return true;
    }

    // Try immediately, then retry after delays (for WebView navigation)
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

    pins.forEach((pin) => {
      const color = PIN_COLORS[pin.status] || "#D4A843";
      const label = STATUS_LABELS[pin.status] || pin.status;
      const marker = L.marker([pin.lat, pin.lng], { icon: createPin(color) });
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${pin.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:6px">${pin.address}</div>
          <div style="display:flex;gap:8px;font-size:10px">
            <span style="background:${color}15;color:${color};padding:2px 8px;border-radius:4px;font-weight:700">${label}</span>
            ${pin.kwp > 0 ? `<span style="color:#888">${pin.kwp} kWp</span>` : ""}
          </div>
          ${pin.nb !== "–" ? `<div style="font-size:10px;color:#999;margin-top:4px">NB: ${pin.nb}</div>` : ""}
        </div>
      `, { className: "baunity-popup" });
      markersRef.current!.addLayer(marker);
    });

    // Fit bounds if pins exist
    if (pins.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [pins]);

  // Toggle satellite
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(
      satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(mapRef.current);
    // Tiles müssen unter den Markern sein
    tileLayerRef.current.setZIndex(0);
  }, [satellite]);

  // Toggle heatmap
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const heatId = "_baunityHeat";

    if (heatmapOn && pins.length > 0) {
      // Simple circle-based heatmap (no leaflet.heat needed)
      const heatGroup = L.layerGroup();
      pins.forEach((p) => {
        L.circle([p.lat, p.lng], {
          radius: 2000,
          color: "transparent",
          fillColor: "#D4A843",
          fillOpacity: 0.08,
        }).addTo(heatGroup);
      });
      (heatGroup as any)._baunityId = heatId;
      heatGroup.addTo(map);
    } else {
      map.eachLayer((layer: any) => {
        if (layer._baunityId === heatId) map.removeLayer(layer);
      });
    }
  }, [heatmapOn, pins]);

  // Stats
  const statusCounts: Record<string, number> = {};
  pins.forEach((p) => {
    const mapped = STATUS_LABELS[p.status] || p.status;
    statusCounts[mapped] = (statusCounts[mapped] || 0) + 1;
  });

  const flyTo = (lat: number, lng: number) => {
    mapRef.current?.flyTo([lat, lng], 15, { duration: 0.8 });
  };

  return (
    <div className="map-page">
      <style>{CSS}</style>

      {/* Map */}
      <div className="map-container">
        <div ref={mapEl} style={{ height: "100%", width: "100%" }} />

        {/* Toolbar */}
        <div className="map-toolbar">
          <button className={satellite ? "active" : ""} onClick={() => setSatellite(!satellite)}>
            🛰 Satellit
          </button>
          <button className={heatmapOn ? "active" : ""} onClick={() => setHeatmapOn(!heatmapOn)}>
            🔥 Heatmap
          </button>
          <button onClick={() => userPos && mapRef.current?.flyTo(userPos, 14, { duration: 0.8 })}>
            📍 Mein Standort
          </button>
          <button onClick={() => pins.length > 0 && mapRef.current?.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng])), { padding: [50, 50] })}>
            🗺 Alle zeigen
          </button>
          <button onClick={() => mapRef.current && mapRef.current.getZoom() < 15 && mapRef.current.setZoom(15)}>
            ☀️ Solar-Check
          </button>
        </div>

        {/* Check-in Button */}
        <div className="map-checkin">
          <button onClick={() => nav("/lead/new")}>+ Neuen Lead erfassen</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="map-sidebar">
        <div className="map-handle" style={{ display: "none" }} />
        <div className="map-sidebar-header">
          <h2>Vertriebsgebiet</h2>
          <p>{pins.length} Standorte</p>
        </div>

        <div className="map-stats">
          <div className="map-stat" style={{ "--sc": "#D4A843" } as any}>
            <div className="map-stat-val">{allItems.length || pins.length}</div>
            <div className="map-stat-label">Gesamt</div>
          </div>
          <div className="map-stat" style={{ "--sc": "#22c55e" } as any}>
            <div className="map-stat-val">{allItems.filter((i: any) => ["verkauft","genehmigt","VERKAUFT","GENEHMIGT"].includes(i.status)).length || pins.filter(p => ["VERKAUFT", "GENEHMIGT"].includes(p.status)).length}</div>
            <div className="map-stat-label">Verkauft</div>
          </div>
          <div className="map-stat" style={{ "--sc": "#3b82f6" } as any}>
            <div className="map-stat-val">{pins.length}</div>
            <div className="map-stat-label">Auf Karte</div>
          </div>
        </div>

        <div className="map-list">
          {loading ? (
            <div className="map-empty">
              <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "dcSpin .6s linear infinite" }} />
              Lade Standorte...
            </div>
          ) : allItems.length === 0 && pins.length === 0 ? (
            <div className="map-empty">
              <span style={{ fontSize: 28 }}>📍</span>
              Noch keine Standorte.<br />Erstelle deinen ersten Lead.
            </div>
          ) : (
            (allItems.length > 0 ? allItems : pins).slice(0, 50).map((item: any) => {
              const isMapPin = item.lat != null;
              const status = (item.status || "LEAD").toUpperCase();
              const color = PIN_COLORS[status] || "#D4A843";
              const label = STATUS_LABELS[status] || status;
              const name = item.name || item.customerName || item.projektName || "–";
              const address = item.address || [item.strasse || item.street, item.plz, item.ort || item.city].filter(Boolean).join(", ");
              const nb = item.nb || item.gridOperator || item.netzbetreiberName || "–";
              const id = item.id || item.installationId;
              const lat = isMapPin ? item.lat : item.latitude ? parseFloat(item.latitude) : null;
              const lng = isMapPin ? item.lng : item.longitude ? parseFloat(item.longitude) : null;
              return (
                <div key={id} className="map-item" onClick={() => lat && lng ? flyTo(lat, lng) : undefined} style={!lat ? { opacity: 0.6 } : undefined}>
                  <div className="map-item-dot" style={{ background: color, "--dc": color } as any} />
                  <div className="map-item-body">
                    <div className="map-item-name">{name}</div>
                    <div className="map-item-sub">{address || nb}{!lat && " · Keine GPS-Daten"}</div>
                  </div>
                  <span className="map-item-status" style={{ color, background: color + "12" }}>{label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

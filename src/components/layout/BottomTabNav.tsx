/**
 * BottomTabNav — Native-style Bottom Navigation für Capacitor App
 * 5 Tabs: Home, Karte, Lead+ (FAB), Leads, Ranking
 */
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Map, Zap, List, User } from "lucide-react";
import { useEffect, useState } from "react";

const GOLD = "#D4A843";
const NAVY = "#060b18";
const MUTED = "#475569";

const TABS = [
  { key: "home",    path: "/hv-center",   icon: Home,   label: "Home" },
  { key: "map",     path: "/map",         icon: Map,    label: "Karte" },
  { key: "lead",    path: "/lead/new",    icon: Zap,    label: "Lead",  fab: true },
  { key: "leads",   path: "/leads",       icon: List,   label: "Leads" },
  { key: "profil",  path: "/settings/me", icon: User,   label: "Profil" },
];

function haptic(style: "light" | "medium" | "heavy" = "light") {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Haptics) {
      cap.Plugins.Haptics.impact({ style });
    }
  } catch {}
}

export default function BottomTabNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard detection — hide nav when keyboard is open
  useEffect(() => {
    const onShow = () => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);
    window.addEventListener("keyboardWillShow" as any, onShow);
    window.addEventListener("keyboardDidShow" as any, onShow);
    window.addEventListener("keyboardWillHide" as any, onHide);
    window.addEventListener("keyboardDidHide" as any, onHide);
    // Fallback: detect via resize (Android)
    const onResize = () => {
      const vh = window.innerHeight;
      setKeyboardVisible(vh < window.screen.height * 0.7);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keyboardWillShow" as any, onShow);
      window.removeEventListener("keyboardDidShow" as any, onShow);
      window.removeEventListener("keyboardWillHide" as any, onHide);
      window.removeEventListener("keyboardDidHide" as any, onHide);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (keyboardVisible) return null;

  const isActive = (path: string) => {
    if (path === "/hv-center") return location.pathname === "/hv-center" || location.pathname === "/dashboard" || location.pathname === "/home";
    if (path === "/settings/me") return location.pathname.startsWith("/settings");
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={styles.nav}>
      {TABS.map(tab => {
        const active = isActive(tab.path);
        const Icon = tab.icon;

        if (tab.fab) {
          return (
            <button key={tab.key} style={styles.fabWrap} onClick={() => { haptic("medium"); navigate(tab.path); }}>
              <div style={styles.fab}>
                <Icon size={22} color={NAVY} strokeWidth={2.5} />
              </div>
            </button>
          );
        }

        return (
          <button key={tab.key} style={styles.tab} onClick={() => { haptic("light"); navigate(tab.path); }}>
            <Icon size={20} color={active ? GOLD : MUTED} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ ...styles.label, color: active ? GOLD : MUTED, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            {active && <div style={styles.dot} />}
          </button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    background: "#0a1128",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 6,
    paddingBottom: `max(8px, env(safe-area-inset-bottom))` as any,
    paddingLeft: 4,
    paddingRight: 4,
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  tab: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: "4px 0",
    background: "none",
    border: "none",
    cursor: "pointer",
    position: "relative",
    WebkitTapHighlightColor: "transparent",
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  dot: {
    position: "absolute",
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    background: GOLD,
  },
  fabWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    marginTop: -18,
    WebkitTapHighlightColor: "transparent",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${GOLD}, #EAD068)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 4px 20px rgba(212,168,67,0.35)`,
  },
};

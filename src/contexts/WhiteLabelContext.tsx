import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { apiGet } from "../modules/api/client";
import { useAuth } from "../modules/auth/AuthContext";

export interface WhiteLabelConfig {
  enabled: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  faviconUrl?: string | null;
}

interface WhiteLabelContextValue {
  config: WhiteLabelConfig | null;
  loading: boolean;
  reload: () => Promise<void>;
  isWhiteLabel: boolean;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

const defaultConfig: WhiteLabelConfig = {
  enabled: false,
  companyName: "Baunity",
  logoUrl: null,
  primaryColor: "#D4A843",
  accentColor: "#EAD068",
};

const WhiteLabelContext = createContext<WhiteLabelContextValue | undefined>(undefined);

function injectCSSVariables(config: WhiteLabelConfig) {
  const root = document.documentElement;
  root.style.setProperty("--wl-primary", config.primaryColor);
  root.style.setProperty("--wl-accent", config.accentColor);

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "99, 102, 241";
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  root.style.setProperty("--wl-primary-rgb", hexToRgb(config.primaryColor));
  root.style.setProperty("--wl-accent-rgb", hexToRgb(config.accentColor));

  if (config.enabled && config.companyName) {
    document.title = `${config.companyName} Portal`;
  } else {
    document.title = "Baunity";
  }
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const prevUserRef = useRef<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();

  const loadConfig = useCallback(async () => {
    // Warte bis Auth fertig geladen hat
    if (authLoading) {
      return;
    }
    
    // Wenn nicht eingeloggt -> Standard-Design
    if (!user) {
      setConfig(defaultConfig);
      injectCSSVariables(defaultConfig);
      setLoading(false);
      prevUserRef.current = null;
      return;
    }

    // Admin/Mitarbeiter -> IMMER Standard-Design
    const userRole = String(user.role || "").toLowerCase();
    if (userRole === "admin" || userRole === "mitarbeiter") {
      // Admin/Mitarbeiter uses standard design
      setConfig(defaultConfig);
      injectCSSVariables(defaultConfig);
      setLoading(false);
      prevUserRef.current = user.email;
      return;
    }

    // Kunde/Subunternehmer -> Prüfe WhiteLabel
    try {
      const response = await apiGet("/me");
      const wlConfig = response?.whiteLabelConfig || response?.kunde?.whiteLabelConfig;
      
      if (wlConfig && wlConfig.enabled === true) {
        const wl: WhiteLabelConfig = {
          enabled: true,
          companyName: wlConfig.companyName || "Portal",
          logoUrl: wlConfig.logoUrl || null,
          primaryColor: wlConfig.primaryColor || "#D4A843",
          accentColor: wlConfig.accentColor || "#EAD068",
        };
        setConfig(wl);
        injectCSSVariables(wl);
        // WhiteLabel activated
      } else {
        setConfig(defaultConfig);
        injectCSSVariables(defaultConfig);
        // Customer without WhiteLabel
      }
    } catch (err) {
      console.warn("[WhiteLabel] Load failed:", err);
      setConfig(defaultConfig);
      injectCSSVariables(defaultConfig);
    } finally {
      setLoading(false);
      prevUserRef.current = user.email;
    }
  }, [user, authLoading]);

  // Lade Config wenn sich User ändert (inkl. nach Login!)
  useEffect(() => {
    const currentUserEmail = user?.email || null;
    
    // Trigger reload wenn User sich ändert
    if (currentUserEmail !== prevUserRef.current) {
      // User changed, reloading WhiteLabel config
      loadConfig();
    }
  }, [user, loadConfig]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      loadConfig();
    }
  }, [authLoading, loadConfig]);

  const value: WhiteLabelContextValue = {
    config,
    loading,
    reload: loadConfig,
    isWhiteLabel: config?.enabled ?? false,
    brandName: config?.enabled ? config.companyName : "Baunity",
    logoUrl: config?.logoUrl ?? null,
    primaryColor: config?.primaryColor ?? defaultConfig.primaryColor,
    accentColor: config?.accentColor ?? defaultConfig.accentColor,
  };

  return (
    <WhiteLabelContext.Provider value={value}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const ctx = useContext(WhiteLabelContext);
  if (!ctx) {
    throw new Error("useWhiteLabel must be used within WhiteLabelProvider");
  }
  return ctx;
}

export default WhiteLabelContext;

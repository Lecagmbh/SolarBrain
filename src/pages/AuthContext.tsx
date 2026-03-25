import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setCsrfToken, clearCsrfToken } from "../modules/api/client";
import { clearAccessToken, setAccessToken } from "../modules/auth/tokenStorage";
import { cacheLoginData, tryOfflineLogin, clearOfflineAuth } from "../services/offlineAuth";
import { getNetworkStatus } from "../hooks/useNetworkStatus";

/**
 * Baunity Auth Context (v2)
 * ==========================
 * Cookie-basierte Session-Authentifizierung
 * - httpOnly Cookies (XSS-sicher)
 * - CSRF Token für mutating requests
 * - User Preferences vom Backend
 */

// Types
type WhiteLabelConfig = {
  enabled: boolean;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
};

type Kunde = {
  id: number;
  name: string;
  firmenName?: string;
  whiteLabelConfig?: WhiteLabelConfig | null;
};

type UserPreferences = Record<string, Record<string, unknown>>;

type GesperrtWarnung = {
  gesperrt: boolean;
  grund: string | null;
  offeneRechnungen: number;
};

type User = {
  id?: number;
  email: string;
  name?: string;
  role: string;
  kundeId?: number;
  kunde?: Kunde | null;
  parentUserId?: number | null;
  parentUser?: { id: number; name: string } | null;
  whiteLabelConfig?: WhiteLabelConfig | null;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
  gesperrtWarnung?: GesperrtWarnung | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  preferences: UserPreferences;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; user?: { role?: string } }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setPreference: (category: string, key: string, value: unknown) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({});

  // Lade User-Daten vom /auth/v2/me Endpoint (Cookie-Auth)
  // Bei Impersonation: User-Daten direkt aus localStorage nutzen
  const loadUserData = useCallback(async () => {
    try {
      // Impersonation-Override: User-Daten aus Exchange-Response
      const impersonateUser = localStorage.getItem("baunity_impersonate_user");
      if (impersonateUser) {
        try {
          const iu = JSON.parse(impersonateUser);
          setUser({
            id: iu.id,
            email: iu.email,
            name: iu.name,
            role: (iu.role || "KUNDE").toUpperCase(),
            kundeId: iu.kundeId,
            kunde: iu.kunde || null,
            parentUserId: null,
            parentUser: null,
            whiteLabelConfig: null,
            mustChangePassword: false,
            emailVerified: true,
            gesperrtWarnung: null,
          });
          setLoading(false);
          return;
        } catch {}
      }

      const response = await api.get("/auth/v2/me");
      const meData = response.data;

      setUser({
        id: meData.id,
        email: meData.email,
        name: meData.name,
        role: (meData.role || "KUNDE").toUpperCase(),
        kundeId: meData.kundeId,
        kunde: meData.kunde,
        parentUserId: meData.parentUserId,
        parentUser: meData.parentUser,
        whiteLabelConfig: meData.whiteLabelConfig || meData.kunde?.whiteLabelConfig || null,
        mustChangePassword: meData.mustChangePassword,
        emailVerified: meData.emailVerified ?? true,
        gesperrtWarnung: meData.gesperrtWarnung || null,
      });

      // Preferences vom /me Endpoint
      if (meData.preferences) {
        setPreferences(meData.preferences);
      }

      return true;
    } catch (err: unknown) {
      // 401 = Nicht eingeloggt (kein gültiger Session-Cookie)
      const axiosErr = err as { response?: { status?: number }; message?: string };
      if (axiosErr.response?.status !== 401) {
        console.warn("[Auth] Load user failed:", axiosErr.message);
      }
      setUser(null);
      setPreferences({});
      return false;
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      await loadUserData();
      setLoading(false);
    };
    checkAuth();
  }, [loadUserData]);

  // Login mit v2 Endpoint (Cookie-basiert) + Offline-Fallback
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const isOnline = getNetworkStatus();

    // Offline-Login: Gegen lokalen Cache prüfen
    if (!isOnline) {
      const offlineResult = await tryOfflineLogin(email, password);
      if (offlineResult.success) {
        setAccessToken(offlineResult.accessToken);
        setUser({
          id: offlineResult.user.id,
          email: offlineResult.user.email,
          name: offlineResult.user.name,
          role: (offlineResult.user.role || "KUNDE").toUpperCase(),
          kundeId: offlineResult.user.kundeId,
          kunde: offlineResult.user.kunde || null,
        });
        return { success: true, user: offlineResult.user };
      }
      return { success: false, error: offlineResult.error };
    }

    // Online-Login
    try {
      const response = await api.post("/auth/v2/login", {
        email,
        password,
        rememberMe
      });

      const data = response.data;

      // CSRF Token speichern
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }

      // Access Token speichern (für PDF Downloads und andere Browser-Requests)
      if (data.accessToken) {
        setAccessToken(data.accessToken);
      } else {
        console.warn('[Auth] KEIN accessToken in Login-Response!');
      }

      // User setzen
      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: (data.user.role || "KUNDE").toUpperCase(),
          kundeId: data.user.kundeId,
          kunde: data.user.kundeName ? { id: data.user.kundeId!, name: data.user.kundeName, firmenName: data.user.kundeName } : null,
          mustChangePassword: data.user.mustChangePassword,
        };
        setUser(userData);

        // Offline-Login cachen für nächstes Mal
        if (data.accessToken && data.user.id) {
          cacheLoginData(email, password, {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: userData.role,
            kundeId: data.user.kundeId,
            kunde: userData.kunde,
          }, data.accessToken).catch(() => {});
        }
      }

      // Preferences setzen
      if (data.preferences) {
        setPreferences(data.preferences);
      }

      // Vollständige User-Daten laden (Login-Response enthält nicht alle Felder)
      await loadUserData();

      return { success: true, user: data.user };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const data = axiosErr.response?.data;
      const message = data?.error || data?.message || axiosErr.message || "Login fehlgeschlagen";

      // Wenn Netzwerkfehler (nicht 401/403): Offline-Login versuchen
      if (!axiosErr.response) {
        const offlineResult = await tryOfflineLogin(email, password);
        if (offlineResult.success) {
          setAccessToken(offlineResult.accessToken);
          setUser({
            id: offlineResult.user.id,
            email: offlineResult.user.email,
            name: offlineResult.user.name,
            role: (offlineResult.user.role || "KUNDE").toUpperCase(),
            kundeId: offlineResult.user.kundeId,
            kunde: offlineResult.user.kunde || null,
          });
          return { success: true, user: offlineResult.user };
        }
      }

      return { success: false, error: message };
    }
  }, [loadUserData]);

  // Logout mit v2 Endpoint
  // Offline-Auth-Cache bleibt erhalten (damit Offline-Login nach Neustart funktioniert)
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/v2/logout");
    } catch (err) {
      console.warn("[Auth] Logout error:", err);
    } finally {
      // Cleanup (Offline-Cache bleibt!)
      setUser(null);
      setPreferences({});
      clearCsrfToken();
      clearAccessToken();

      // Zur Login-Seite
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/app/login';
      }
    }
  }, []);

  // User-Daten neu laden
  const refreshUser = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Preference setzen (speichert im Backend)
  const setPreference = useCallback(async (category: string, key: string, value: unknown) => {
    try {
      await api.put(`/me/preferences/${category}/${key}`, { value });

      // Lokal updaten
      setPreferences(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        }
      }));
    } catch (err) {
      console.error("[Auth] Set preference failed:", err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      preferences,
      login,
      logout,
      refreshUser,
      setPreference,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper hooks für häufige Checks
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'ADMIN';
}

export function useIsMitarbeiter() {
  const { user } = useAuth();
  return user?.role === 'MITARBEITER' || user?.role === 'ADMIN';
}

export function useIsKunde() {
  const { user } = useAuth();
  return user?.role === 'KUNDE';
}

export function useIsHandelsvertreter() {
  const { user } = useAuth();
  return user?.role === "HANDELSVERTRETER";
}

export function useIsHvOrAbove() {
  const { user } = useAuth();
  return ["ADMIN", "MITARBEITER", "HANDELSVERTRETER"].includes(user?.role || "");
}

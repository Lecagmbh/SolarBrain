# GridNetz Auth-System Architektur

**Erstellt:** 2026-01-19
**Status:** Entwurf zur Genehmigung

---

## 1. ÜBERSICHT

### Ziel
Vollständige User-Isolation mit sicherer Token-Verwaltung und personalisierten Backend-Einstellungen.

### Kernprinzipien
1. **Security First**: httpOnly Cookies statt localStorage für Tokens
2. **Backend-zentrierte Personalisierung**: Alle User-Einstellungen im Backend
3. **Multi-Device Sync**: Einstellungen folgen dem User, nicht dem Browser
4. **Zero-Trust Frontend**: Frontend speichert keine sensiblen Daten

---

## 2. AKTUELLE ARCHITEKTUR (IST)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  localStorage:                                               │
│  ├── gridnetz_token (JWT)         ← SICHERHEITSRISIKO!      │
│  ├── gridnetz_refresh_token                                  │
│  ├── gridnetz-wizard-v1-{userId}                            │
│  ├── gridnetz-dashboard-prefs                               │
│  └── gridnetz-admin-center                                  │
│                                                              │
│  Probleme:                                                   │
│  • XSS kann Tokens stehlen                                  │
│  • Einstellungen gehen bei Browser-Wechsel verloren         │
│  • Keine echte User-Isolation                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
├─────────────────────────────────────────────────────────────┤
│  JWT Token im Authorization Header                          │
│  ├── Access Token (15min Gültigkeit)                        │
│  └── Refresh Token (7 Tage Gültigkeit)                      │
│                                                              │
│  Datenbank:                                                  │
│  └── User-Tabelle (nur Auth-Daten)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. NEUE ARCHITEKTUR (SOLL)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  localStorage: (nur nicht-sensible Daten)                   │
│  ├── gridnetz-wizard-draft-{sessionId}  ← temporäre Drafts  │
│  └── gridnetz-ui-state                  ← UI State (Sidebar)│
│                                                              │
│  KEINE Tokens im Frontend!                                  │
│  Cookies werden automatisch bei jedem Request mitgesendet   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COOKIE (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│  gridnetz_session (httpOnly, Secure, SameSite=Strict)       │
│  ├── Enthält: Session-ID (nicht den Token selbst!)          │
│  ├── Max-Age: 7 Tage                                        │
│  └── Automatisch bei /api/* Requests mitgesendet            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
├─────────────────────────────────────────────────────────────┤
│  Session Management:                                        │
│  ├── Redis/DB: Session → User Mapping                       │
│  ├── JWT nur intern (nie an Frontend)                       │
│  └── Automatische Token-Rotation                            │
│                                                              │
│  Neue Datenbank-Tabellen:                                   │
│  ├── user_sessions                                          │
│  ├── user_preferences                                       │
│  ├── user_saved_views                                       │
│  └── user_saved_filters                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. DATENBANK SCHEMA

### 4.1 User Sessions (für httpOnly Cookie Auth)

```sql
-- User Sessions für sichere Cookie-basierte Auth
CREATE TABLE user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token   VARCHAR(255) NOT NULL UNIQUE,  -- Im httpOnly Cookie
  refresh_token   VARCHAR(255),                   -- Für Token-Rotation
  user_agent      TEXT,
  ip_address      VARCHAR(45),
  device_info     JSONB,                          -- Browser, OS, etc.
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,
  last_activity   TIMESTAMP DEFAULT NOW(),
  is_valid        BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE is_valid = TRUE;
```

### 4.2 User Preferences (Einstellungen)

```sql
-- User Preferences - alle personalisierten Einstellungen
CREATE TABLE user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category        VARCHAR(50) NOT NULL,  -- 'dashboard', 'wizard', 'notifications', etc.
  key             VARCHAR(100) NOT NULL,
  value           JSONB NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, category, key)
);

CREATE INDEX idx_prefs_user_cat ON user_preferences(user_id, category);

-- Beispiel-Daten:
-- category: 'dashboard', key: 'widgets', value: {"showKpis": true, "compactMode": false}
-- category: 'wizard', key: 'lastAddress', value: {"strasse": "...", "plz": "..."}
-- category: 'notifications', key: 'settings', value: {"email": true, "push": false}
```

### 4.3 User Saved Views

```sql
-- Gespeicherte Ansichten (Tabellen-Konfigurationen)
CREATE TABLE user_saved_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  page            VARCHAR(50) NOT NULL,   -- 'netzanmeldungen', 'rechnungen', etc.
  is_default      BOOLEAN DEFAULT FALSE,
  config          JSONB NOT NULL,         -- columns, sorting, grouping
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, page, name)
);

CREATE INDEX idx_views_user_page ON user_saved_views(user_id, page);

-- Beispiel config:
-- {
--   "columns": ["id", "kunde", "status", "createdAt"],
--   "columnWidths": {"id": 80, "kunde": 200},
--   "sorting": {"field": "createdAt", "direction": "desc"},
--   "groupBy": "status"
-- }
```

### 4.4 User Saved Filters

```sql
-- Gespeicherte Filter
CREATE TABLE user_saved_filters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  page            VARCHAR(50) NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  filters         JSONB NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, page, name)
);

CREATE INDEX idx_filters_user_page ON user_saved_filters(user_id, page);

-- Beispiel filters:
-- {
--   "status": ["OFFEN", "IN_BEARBEITUNG"],
--   "dateRange": {"from": "2026-01-01", "to": "2026-01-31"},
--   "gridOperator": ["Netze BW", "EnBW"]
-- }
```

---

## 5. API ENDPOINTS

### 5.1 Auth Endpoints (Neu)

```
POST   /api/auth/login
  Request:  { email, password }
  Response: { user, message }
  Cookie:   Set-Cookie: gridnetz_session=xxx; HttpOnly; Secure; SameSite=Strict

POST   /api/auth/logout
  Cookie:   Cleared
  Response: { success: true }

GET    /api/auth/me
  Cookie:   gridnetz_session (automatisch)
  Response: { user, preferences, defaultViews }

POST   /api/auth/refresh
  Cookie:   Rotiert automatisch
  Response: { success: true }

GET    /api/auth/sessions
  Response: [{ id, device, lastActivity, isCurrent }]  -- Alle aktiven Sessions

DELETE /api/auth/sessions/:id
  Response: { success: true }  -- Session beenden (Logout auf anderem Gerät)
```

### 5.2 Preferences Endpoints (Neu)

```
GET    /api/me/preferences
  Response: { dashboard: {...}, wizard: {...}, notifications: {...} }

GET    /api/me/preferences/:category
  Response: { key1: value1, key2: value2 }

PUT    /api/me/preferences/:category/:key
  Request:  { value: {...} }
  Response: { success: true }

DELETE /api/me/preferences/:category/:key
  Response: { success: true }
```

### 5.3 Views & Filters Endpoints (Neu)

```
GET    /api/me/views/:page
  Response: [{ id, name, isDefault, config }]

POST   /api/me/views/:page
  Request:  { name, config, isDefault? }
  Response: { id, name, config }

PUT    /api/me/views/:page/:id
  Request:  { name?, config?, isDefault? }
  Response: { success: true }

DELETE /api/me/views/:page/:id
  Response: { success: true }

-- Analog für /api/me/filters/:page
```

---

## 6. FRONTEND IMPLEMENTIERUNG

### 6.1 Auth Service (Neu)

```typescript
// src/services/auth.service.ts

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

class AuthService {
  // Login - setzt httpOnly Cookie automatisch
  async login(email: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',  // WICHTIG: Cookies mitsenden!
    });

    if (!response.ok) throw new AuthError(response);
    return response.json();
  }

  // Logout - löscht Cookie
  async logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/login';
  }

  // User laden (mit Preferences)
  async getMe(): Promise<{ user: User; preferences: Preferences }> {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new SessionExpiredError();
    }

    return response.json();
  }
}
```

### 6.2 Preferences Hook (Neu)

```typescript
// src/hooks/usePreferences.ts

interface UsePreferencesOptions<T> {
  category: string;
  key: string;
  defaultValue: T;
}

export function usePreferences<T>({ category, key, defaultValue }: UsePreferencesOptions<T>) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from backend
  useEffect(() => {
    fetch(`/api/me/preferences/${category}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data[key]) setValue(data[key]);
        setIsLoading(false);
      });
  }, [category, key]);

  // Save to backend (debounced)
  const updateValue = useDebouncedCallback((newValue: T) => {
    setValue(newValue);
    fetch(`/api/me/preferences/${category}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newValue }),
      credentials: 'include',
    });
  }, 500);

  return { value, updateValue, isLoading };
}

// Beispiel-Nutzung:
const { value: dashboardPrefs, updateValue } = usePreferences({
  category: 'dashboard',
  key: 'layout',
  defaultValue: { compactMode: false, showKpis: true }
});
```

### 6.3 API Client Update

```typescript
// src/api/client.ts

// ALLE Requests müssen credentials: 'include' haben!
const request = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include',  // KRITISCH!
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 401 = Session abgelaufen
  if (response.status === 401) {
    // Automatisch zur Login-Seite
    window.location.href = '/login?expired=1';
    throw new SessionExpiredError();
  }

  return response;
};
```

---

## 7. BACKEND IMPLEMENTIERUNG

### 7.1 Session Middleware

```typescript
// middleware/session.ts

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies['gridnetz_session'];

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Session validieren
  const session = await db.userSession.findFirst({
    where: {
      sessionToken,
      isValid: true,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!session) {
    res.clearCookie('gridnetz_session');
    return res.status(401).json({ error: 'Session expired' });
  }

  // Last activity updaten
  await db.userSession.update({
    where: { id: session.id },
    data: { lastActivity: new Date() }
  });

  // User an Request anhängen
  req.user = session.user;
  req.sessionId = session.id;

  next();
}
```

### 7.2 Login Handler

```typescript
// routes/auth.ts

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // User validieren
  const user = await validateCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Session erstellen
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

  await db.userSession.create({
    data: {
      userId: user.id,
      sessionToken,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    }
  });

  // httpOnly Cookie setzen
  res.cookie('gridnetz_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  // User und Preferences laden
  const preferences = await loadUserPreferences(user.id);

  res.json({
    user: sanitizeUser(user),
    preferences
  });
});
```

---

## 8. MIGRATION PLAN

### Phase 1: Backend vorbereiten (Tag 1)
1. Datenbank-Tabellen erstellen (Sessions, Preferences, Views, Filters)
2. Session-Middleware implementieren
3. Neue Auth-Endpoints implementieren
4. Preferences-Endpoints implementieren

### Phase 2: Frontend umstellen (Tag 2)
1. API-Client auf `credentials: 'include'` umstellen
2. AuthContext auf Cookie-basierte Auth umstellen
3. localStorage Token-Handling entfernen
4. usePreferences Hook implementieren

### Phase 3: Migration bestehender User (Tag 3)
1. Bestehende localStorage-Daten beim ersten Login ins Backend migrieren
2. Legacy-Support für 30 Tage (beide Systeme parallel)
3. Nach 30 Tagen: localStorage-Cleanup

### Phase 4: Cleanup (Tag 4)
1. Alte Token-Handling Code entfernen
2. Dokumentation aktualisieren
3. Sicherheits-Audit

---

## 9. SICHERHEITS-VORTEILE

| Aspekt | Alt (localStorage) | Neu (httpOnly Cookie) |
|--------|-------------------|----------------------|
| XSS Token-Diebstahl | ❌ Möglich | ✅ Unmöglich |
| CSRF | ❌ Kein Schutz | ✅ SameSite=Strict |
| Token im JS | ❌ Sichtbar | ✅ Nicht erreichbar |
| Multi-Device Sync | ❌ Keine | ✅ Automatisch |
| Session Management | ❌ Keine | ✅ Vollständig |
| "Alle Geräte abmelden" | ❌ Unmöglich | ✅ Möglich |

---

## 10. ZUSAMMENFASSUNG

**Vorteile der neuen Architektur:**
- Tokens sind vor XSS-Angriffen geschützt
- User-Einstellungen synchronisieren über alle Geräte
- Zentrale Session-Verwaltung (Sessions auf anderen Geräten beenden)
- Saubere Trennung: Frontend = UI, Backend = Daten + Auth
- Audit-Trail für alle Logins

**Aufwand:**
- Backend: ~2 Tage
- Frontend: ~1-2 Tage
- Testing: ~1 Tag
- **Gesamt: ~4-5 Tage**

---

## NÄCHSTE SCHRITTE

1. **Genehmigung** dieser Architektur
2. **Backend-Migration** starten
3. **Frontend-Migration** nach Backend fertig
4. **Testing** mit echten Usern

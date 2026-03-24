# ULTIMATIVES ADMIN CONTROL CENTER - MASTERPLAN

**Datum:** 22.01.2026
**Version:** 1.0
**Status:** Geplant

---

## 1. ANALYSE - BESTAND

### 1.1 Frontend-Struktur

```
/var/www/gridnetz-frontend/src/
├── admin-center/          # Bestehendes Admin Center (Basic)
│   ├── api/               # admin-center.api.ts
│   ├── components/        # Tabs: Documents, Fields, GridOperators, etc.
│   ├── pages/             # AdminCenterPage.tsx
│   └── stores/
├── components/
│   └── layout/
│       ├── AdminLayout.tsx   # Haupt-Layout
│       └── Sidebar.tsx       # Navigation
├── features/
│   └── netzanmeldungen/      # Enterprise-Netzanmeldungen
├── modules/
│   ├── admin/             # Admin-Module (ai, billing, customers, etc.)
│   ├── auth/              # Login, Password-Reset
│   ├── dashboard/         # Dashboard-Komponenten
│   ├── emails/            # Email-Komponenten
│   └── installations/     # Installation-Details, Tabs
├── pages/                 # Alle Hauptseiten
└── wizard/                # Anlagen-Wizard
```

### 1.2 Bestehende Seiten

| Seite | Pfad | Funktion | Status |
|-------|------|----------|--------|
| Dashboard | `/dashboard` | Übersicht, Widgets | ✅ Existiert |
| Netzanmeldungen | `/netzanmeldungen` | Alle Anlagen | ✅ Existiert |
| Email Command Center | `/emails` | Email-Templates, Queue | ✅ Existiert |
| Netzbetreiber Center | `/netzbetreiber` | NB-Verwaltung | ✅ Existiert |
| User Management | `/benutzer` | Benutzer-CRUD | ✅ Existiert |
| Rechnungen | `/rechnungen` | Abrechnung | ✅ Existiert |
| Dokumente | `/dokumente` | Dokumenten-Center | ✅ Existiert |
| Archiv | `/archiv` | Abgeschlossene Vorgänge | ✅ Existiert |
| Logs | `/logs` | Activity Logs | ✅ Existiert |
| Einstellungen | `/settings/company` | Firma-Settings | ✅ Existiert |
| Admin Center | `/admin/center` | Basic Dashboard, Bugs | ✅ Existiert (Basic) |
| Intelligence | `/intelligence` | AI/ML Dashboard | ✅ Existiert |

### 1.3 Backend APIs

| Route-Datei | Pfad-Prefix | Funktion |
|-------------|-------------|----------|
| `admin-center.routes.ts` | `/api/admin-center` | Dashboard-Stats, Logs, Bugs |
| `admin.users.routes.ts` | `/api/admin/users` | User-Management |
| `analytics.routes.ts` | `/api/analytics` | Statistiken |
| `emailCommandCenter.routes.ts` | `/api/email-center` | Templates, Queue |
| `nbCommunication.routes.ts` | `/api/nb-communication` | NB-Korrespondenz |
| `netzbetreiber.routes.ts` | `/api/netzbetreiber` | NB-CRUD |
| `intelligence.routes.ts` | `/api/intelligence` | AI/ML |
| `installation.routes.ts` | `/api/installations` | Anlagen |
| `rechnung.routes.ts` | `/api/rechnungen` | Rechnungen |
| `settings.routes.ts` | `/api/settings` | System-Settings |
| `preferences.routes.ts` | `/api/me/*` | User-Preferences |

### 1.4 Backend Services

| Service | Funktion |
|---------|----------|
| `smartEmail.service.ts` | Intelligentes Email-System |
| `nbCommunication.service.ts` | NB-Korrespondenz |
| `emailCommandCenter.service.ts` | Email-Rendering |
| `workflow.service.ts` | Status-Workflow |
| `websocket.service.ts` | Real-time Updates |

---

## 2. ZIEL-ARCHITEKTUR

### 2.1 Unified Control Center Konzept

Ein **EINZIGES** Control Center das alle Admin-Funktionen vereint:

```
/control-center
├── Dashboard (Smart Overview mit KPIs)
├── Operations
│   ├── Anlagen Pipeline
│   ├── Workflow Monitor
│   └── Bulk Actions
├── Communication
│   ├── Email Center
│   ├── NB-Kommunikation
│   └── Templates
├── Network
│   ├── Netzbetreiber
│   └── NB-Statistiken
├── Users
│   ├── User Management
│   ├── Rollen & Rechte
│   └── Sessions
├── Finance
│   ├── Rechnungen
│   ├── Mahnungen
│   └── Statistiken
├── System
│   ├── Jobs & Crons
│   ├── Health Monitor
│   └── Logs & Audit
└── Settings
    ├── Firma
    ├── SMTP
    └── Features
```

### 2.2 Intelligente Features

#### A) Command Palette (Cmd+K)
```
Suche: "email failed" → Zeigt fehlgeschlagene Emails
Suche: "user:max" → Findet User Max
Suche: "nb:edis" → Findet E.DIS Netzbetreiber
Suche: "anlage:12345" → Findet Anlage

Quick Actions:
- "Neuer User erstellen"
- "Email-Queue leeren"
- "NB-Nachfragen prüfen"
- "Backup starten"
```

#### B) Real-time Dashboard
- WebSocket-Updates für Live-Daten
- Alerts prominent angezeigt
- Drag & Drop Widgets
- Personalisierte Layouts

#### C) Kontext-aware Alerts
- Überfällige NB-Antworten
- Fehlgeschlagene Emails
- Wartende Anlagen (>X Tage)
- System-Fehler

---

## 3. KOMPONENTEN-INVENTAR

### 3.1 Wiederverwendbare Komponenten (EXISTIEREN)

| Komponente | Pfad | Wiederverwendung |
|------------|------|------------------|
| `AdminCenterPage` | `/admin-center/pages/` | Basis für Dashboard |
| `StatCard` | In AdminCenterPage | KPI-Anzeige |
| `ActivityItem` | In AdminCenterPage | Aktivitäts-Log |
| `HealthIndicator` | In AdminCenterPage | System-Status |
| `GridOperatorsTab` | `/admin-center/components/` | NB-Verwaltung |
| `DocumentsTab` | `/admin-center/components/` | Dokument-Typen |
| `RulesTab` | `/admin-center/components/` | Regeln |
| `SettingsTab` | `/admin-center/components/` | Einstellungen |
| `EmailCommandCenter` | `/pages/` | Email-System |
| `NetzbetreiberCenterPage` | `/pages/` | NB-Verwaltung |
| `UserManagementPage` | `/pages/` | User-CRUD |
| `IntelligenceDashboard` | `/pages/` | AI-Dashboard |
| `LogsPage` | `/pages/` | Activity Logs |

### 3.2 Neu zu bauen

| Komponente | Priorität | Beschreibung |
|------------|-----------|--------------|
| `ControlCenterShell` | HOCH | Haupt-Container mit Sidebar |
| `SmartDashboard` | HOCH | Intelligentes Dashboard |
| `CommandPalette` | HOCH | Globale Suche & Actions |
| `NbCommunicationPanel` | HOCH | NB-Korrespondenz UI |
| `EmailQueueMonitor` | MITTEL | Real-time Email Queue |
| `WorkflowPipeline` | MITTEL | Anlagen-Pipeline Visual |
| `SystemHealthPanel` | MITTEL | Crons, Jobs, Health |
| `BulkActionsPanel` | MITTEL | Mehrfach-Aktionen |
| `UserSessionsPanel` | NIEDRIG | Aktive Sessions |
| `FeatureFlagsPanel` | NIEDRIG | Feature Toggles |

---

## 4. DATENBANK-INVENTAR

### 4.1 Relevante Tabellen (existieren)

```sql
-- User & Auth
users, refresh_tokens, user_sessions, user_settings

-- Anlagen & Workflow
installations, status_history, tasks, documents

-- Netzbetreiber
netzbetreiber, grid_operator_intelligence, nb_correspondences

-- Email
email_templates, email_logs, email_queue_items, smart_email_queue

-- Anti-Spam
email_preferences, email_cooldowns

-- Admin
activity_logs, bug_reports, announcements

-- System
system_health, backup_records, automation_rules
```

### 4.2 Neue Tabellen (optional)

```sql
-- Feature Flags (optional)
CREATE TABLE feature_flags (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  enabled BOOLEAN,
  config JSON
);

-- Saved Dashboards (optional)
CREATE TABLE saved_dashboards (
  id INT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  layout JSON
);
```

---

## 5. API-INVENTAR

### 5.1 Existierende Endpoints (nutzbar)

```
# Admin Center
GET  /api/admin-center/dashboard
GET  /api/admin-center/activity-logs
GET  /api/admin-center/bugs
POST /api/admin-center/bugs

# Email System
GET  /api/email-center/templates
GET  /api/email-center/queue
POST /api/email-center/queue/:id/approve

# NB-Kommunikation
GET  /api/nb-communication/stats
GET  /api/nb-communication/pending
POST /api/nb-communication/send

# Netzbetreiber
GET  /api/netzbetreiber
PUT  /api/netzbetreiber/:id

# User Management
GET  /api/admin/users
POST /api/admin/users
PUT  /api/admin/users/:id

# System
GET  /api/settings
PUT  /api/settings
```

### 5.2 Neue Endpoints (zu bauen)

```
# Unified Dashboard
GET  /api/control-center/overview
GET  /api/control-center/alerts
GET  /api/control-center/quick-stats

# System Health
GET  /api/system/health
GET  /api/system/crons
POST /api/system/crons/:name/run

# Feature Flags
GET  /api/features
PUT  /api/features/:name

# Sessions
GET  /api/admin/sessions
DELETE /api/admin/sessions/:id
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (1-2 Tage)
1. `ControlCenterShell` - Haupt-Layout mit Sub-Navigation
2. `SmartDashboard` - Unified Dashboard mit KPIs
3. API: `/api/control-center/overview`

### Phase 2: Communication Hub (1 Tag)
1. `NbCommunicationPanel` - Integriert in Control Center
2. `EmailQueueMonitor` - Real-time Queue
3. Verknüpfung mit bestehenden Email-APIs

### Phase 3: Operations (1 Tag)
1. `WorkflowPipeline` - Visual Pipeline
2. `BulkActionsPanel` - Mehrfach-Aktionen
3. Alerts für überfällige Anlagen

### Phase 4: Intelligence (0.5 Tag)
1. `CommandPalette` - Cmd+K Suche
2. Smart Search über alle Entitäten
3. Quick Actions

### Phase 5: System & Polish (1 Tag)
1. `SystemHealthPanel` - Crons, Health
2. WebSocket Real-time Updates
3. Responsive Design
4. Performance-Optimierung

---

## 7. DATEI-STRUKTUR (NEU)

```
/var/www/gridnetz-frontend/src/
├── control-center/                    # NEU
│   ├── api/
│   │   └── control-center.api.ts
│   ├── components/
│   │   ├── shell/
│   │   │   ├── ControlCenterShell.tsx
│   │   │   ├── ControlCenterSidebar.tsx
│   │   │   └── ControlCenterHeader.tsx
│   │   ├── dashboard/
│   │   │   ├── SmartDashboard.tsx
│   │   │   ├── KpiCards.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── communication/
│   │   │   ├── NbCommunicationPanel.tsx
│   │   │   ├── EmailQueueMonitor.tsx
│   │   │   └── TemplatePreview.tsx
│   │   ├── operations/
│   │   │   ├── WorkflowPipeline.tsx
│   │   │   ├── BulkActionsPanel.tsx
│   │   │   └── PendingAlerts.tsx
│   │   ├── system/
│   │   │   ├── SystemHealthPanel.tsx
│   │   │   ├── CronJobsPanel.tsx
│   │   │   └── LogsViewer.tsx
│   │   └── common/
│   │       ├── CommandPalette.tsx
│   │       ├── StatCard.tsx
│   │       └── DataTable.tsx
│   ├── hooks/
│   │   ├── useControlCenter.ts
│   │   ├── useWebSocket.ts
│   │   └── useAlerts.ts
│   ├── pages/
│   │   └── ControlCenterPage.tsx
│   ├── stores/
│   │   └── control-center.store.ts
│   ├── styles/
│   │   └── control-center.css
│   └── index.ts
```

---

## 8. INTEGRATION MIT BESTAND

### 8.1 Sidebar-Integration

```tsx
// In Sidebar.tsx - Ersetze Admin Center mit Control Center
{
  id: "control-center",
  label: "Control Center",
  icon: Icons.shield,
  path: "/control-center"
}
```

### 8.2 Router-Integration

```tsx
// In router.tsx
import { ControlCenterPage } from './control-center';

<Route path="/control-center/*" element={<ControlCenterPage />}>
  <Route index element={<SmartDashboard />} />
  <Route path="operations" element={<OperationsPanel />} />
  <Route path="communication" element={<CommunicationPanel />} />
  <Route path="network" element={<NetworkPanel />} />
  <Route path="users" element={<UsersPanel />} />
  <Route path="finance" element={<FinancePanel />} />
  <Route path="system" element={<SystemPanel />} />
  <Route path="settings" element={<SettingsPanel />} />
</Route>
```

### 8.3 Bestehende Seiten einbetten

Bestehende Seiten können als Sub-Komponenten eingebettet werden:
- `EmailCommandCenter` → Communication Tab
- `NetzbetreiberCenterPage` → Network Tab
- `UserManagementPage` → Users Tab
- `RechnungenPage` → Finance Tab
- `LogsPage` → System Tab

---

## 9. DESIGN-RICHTLINIEN

### 9.1 Farbschema (bestehend)

```css
--primary: #6366f1;      /* Indigo */
--accent: #8b5cf6;       /* Violet */
--success: #10b981;      /* Emerald */
--warning: #f59e0b;      /* Amber */
--danger: #ef4444;       /* Red */
--background: #0a0a0f;   /* Dark */
--surface: #18181b;      /* Zinc-900 */
--border: #27272a;       /* Zinc-800 */
```

### 9.2 Komponenten-Style

- Glass-Morphism Effekte (bestehend)
- Gradient-Borders
- Subtle Animations
- Responsive Grid-Layouts

---

## 10. METRIKEN & KPIs

### Dashboard-KPIs

| Metrik | Quelle | Aktualisierung |
|--------|--------|----------------|
| Offene Anlagen | `installations` WHERE status != 'FERTIG' | Real-time |
| Beim NB wartend | `installations` WHERE status = 'BEIM_NB' | Real-time |
| Durchschn. Wartezeit | Berechnet aus `nb_eingereicht_am` | Täglich |
| Emails heute | `email_logs` WHERE date = today | Real-time |
| Fehler heute | `activity_logs` WHERE category = 'ERROR' | Real-time |
| NB ohne Antwort | `nb_correspondences` ohne response | Real-time |
| Offene Rechnungen | `rechnungen` WHERE status = 'OFFEN' | Real-time |

---

## 11. NÄCHSTE SCHRITTE

### Sofort starten mit:

1. **Backend API erstellen**: `/api/control-center/overview`
   ```ts
   // Aggregiert alle wichtigen Metriken in einem Call
   GET /api/control-center/overview
   Response: {
     kpis: { ... },
     alerts: [ ... ],
     recentActivity: [ ... ],
     systemHealth: { ... }
   }
   ```

2. **ControlCenterShell bauen**: Layout mit Sub-Navigation

3. **SmartDashboard implementieren**: KPIs, Alerts, Activity

4. **NbCommunicationPanel hinzufügen**: UI für NB-Korrespondenz

---

## ZUSAMMENFASSUNG

| Kategorie | Bestand | Neu zu bauen |
|-----------|---------|--------------|
| Seiten | 12 | 1 (ControlCenter) |
| Komponenten | ~20 nutzbar | ~15 neue |
| APIs | ~25 nutzbar | ~5 neue |
| Services | 6 nutzbar | 0 neue |

**Geschätzte Umsetzung:** 4-5 Tage für vollständiges Control Center

**Empfehlung:** Start mit Phase 1 (Foundation) - dann schrittweise erweitern.

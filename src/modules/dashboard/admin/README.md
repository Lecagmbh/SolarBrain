# LECA Admin v3.0

Komplett überarbeitetes Admin-Dashboard mit allen Fixes und neuen Features.

## 🆕 Was ist neu in v3.0

### Fixes
- ✅ Navigation korrigiert: `/netzanmeldungen` statt `/archiv`
- ✅ Kanban-Link entfernt (in Netzanmeldungen integriert)
- ✅ totalKwp/MWp KPI im Dashboard
- ✅ Nachbesserung-Status separat (nicht mehr mit warten_nb gemischt)
- ✅ WebSocket für Live-Updates im Dashboard
- ✅ Light Mode Support

### Neue Components
- ✅ Modal/Dialog
- ✅ Tabs
- ✅ Toast Notifications
- ✅ Dropdown Menu
- ✅ Table Component
- ✅ Checkbox & Switch

### Verbesserungen
- 📊 6 KPIs statt 5 (neu: Anlagenleistung in MWp)
- 🎨 Theme Toggle (Dark/Light Mode)
- 🔔 Notification Center
- 🤖 AI Assistant
- ⌨️ Command Palette (⌘K)
- 📱 Mobile-optimiert

## 📁 Struktur

```
admin/
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx     # Main Layout mit Sidebar
│   │   └── layout.css
│   └── ui/
│       ├── UIComponents.tsx    # Alle UI Components
│       ├── ui-components.css
│       ├── CommandPalette.tsx  # ⌘K Suche
│       └── command-palette.css
├── features/
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # Haupt-Dashboard
│   │   └── dashboard.css
│   ├── notifications/
│   │   ├── NotificationCenter.tsx
│   │   └── notifications.css
│   ├── ai/
│   │   ├── AIAssistantLocal.tsx
│   │   └── ai-assistant-local.css
│   ├── analytics/
│   │   ├── Analytics.tsx
│   │   └── analytics.css
│   └── automation/
│       ├── WorkflowAutomation.tsx
│       └── automation.css
├── styles/
│   └── design-system.css       # CSS Variables + Reset
├── types/
│   └── index.ts                # TypeScript Types
├── router.tsx                  # React Router Config
└── index.ts                    # All Exports
```

## 🚀 Installation

```bash
# 1. In admin-frontend wechseln
cd /var/www/leca-admin-frontend-dev/src

# 2. Altes admin-Verzeichnis sichern
mv admin admin-backup

# 3. Neues admin-Verzeichnis entpacken
unzip admin-v3.zip

# 4. Build starten
npm run build
```

## 📦 Import

```typescript
// Layout
import { AdminLayout } from "./admin";

// Components
import { 
  Button, 
  Card, 
  Badge, 
  Modal, 
  Tabs, 
  Table,
  useToast 
} from "./admin";

// Features
import { Dashboard } from "./admin";
```

## 🎨 CSS Imports

In deiner `index.css` oder `App.css`:

```css
@import "./admin/styles/design-system.css";
@import "./admin/components/ui/ui-components.css";
@import "./admin/components/ui/command-palette.css";
@import "./admin/components/layout/layout.css";
@import "./admin/features/dashboard/dashboard.css";
@import "./admin/features/notifications/notifications.css";
@import "./admin/features/ai/ai-assistant-local.css";
@import "./admin/features/analytics/analytics.css";
@import "./admin/features/automation/automation.css";
```

## 🔧 Theme Wechsel

```typescript
// Im Code
document.documentElement.setAttribute("data-theme", "light"); // oder "dark"

// Automatisch via System
// Design System unterstützt auch prefers-color-scheme
```

## 📊 Dashboard KPIs

Das Dashboard zeigt jetzt:
1. **Gesamt** - Alle Anmeldungen
2. **Offen** - Nicht abgeschlossen
3. **Diese Woche** - Neu in dieser Woche
4. **Beim NB** - Status warten_auf_nb
5. **Anlagenleistung** - Gesamt kWp/MWp ← NEU
6. **Offene Rechnungen** - Für Staff/Kunden

## 🐛 Bekannte Einschränkungen

- Analytics lädt aktuell Mock-Daten (API-Integration ausstehend)
- AI Assistant ist lokal simuliert (echte API-Anbindung ausstehend)

## 📝 Version History

- **v3.0** - Komplett überarbeitet mit allen Fixes
- **v2.1** - Token-Fix, API-Mapping
- **v2.0** - Initial Release

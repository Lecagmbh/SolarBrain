# LECA Installation Detail V2 - High-End Panel

## 🚀 Features

### Design & UX
- **Fullscreen Slide-Over Panel** - Elegantes Panel das von rechts einslided
- **Dark Theme** - Konsistent mit dem Dashboard Design (`#0f1623` Background, `#00b7ff` Akzent)
- **Glassmorphism Effects** - Blur-Backdrop, Glow-Shadows
- **Smooth Animations** - CSS Transitions für alle Interaktionen
- **Skeleton Loaders** - Premium Loading States

### Navigation
- **Tab-System** - 6 Tabs (Übersicht, Dokumente, E-Mails, Timeline, Daten, Admin)
- **Command Palette** - `⌘K` / `Ctrl+K` für Schnellzugriff auf alle Aktionen
- **Keyboard Navigation** - Tabs mit `1-6`, `←/→` für Tab-Wechsel, `Esc` zum Schließen

### Tabs im Detail

#### 1. Übersicht
- Kunden- und Standortdaten in Cards
- Anlagendaten mit Component-Badges (Speicher, Wallbox, Wärmepumpe)
- Status-Änderung mit Kommentar
- Letzte Kommentare Preview

#### 2. Dokumente
- **Drag & Drop Upload** - Dateien direkt ins Panel ziehen
- **Kategorie-Auswahl** - Automatische oder manuelle Kategorisierung
- **Pflichtdokumente-Checklist** - Visueller Fortschritt
- **Inline Preview** - PDFs und Bilder direkt anzeigen
- **Document Grid** - Übersichtliche Darstellung mit Icons

#### 3. E-Mails
- **Thread-Ansicht** - Expandierbare E-Mail-Items
- **HTML-Rendering** - Sichere Darstellung von E-Mail-Inhalten
- **Attachment-Preview** - Anhänge direkt sehen
- **Zuordnungs-Management** - E-Mails zuordnen/entfernen

#### 4. Timeline
- **Kombinierte Ansicht** - Status-Änderungen + Kommentare
- **Filter** - Nach Typ filtern
- **Kommentar-Eingabe** - Direkt neue Kommentare hinzufügen
- **Relative Zeitangaben** - "vor 2 Stunden", "Gestern" etc.

#### 5. Daten (JSON Viewer)
- **Premium JSON Viewer** - Expandierbar, durchsuchbar
- **Live-Suche** - Highlighting von Matches
- **Copy-to-Clipboard** - Einzelne Werte oder ganzes JSON
- **Quick Stats** - Feldanzahl, Größe etc.

#### 6. Admin (nur für Admins)
- **Status-Override** - Direkter Status-Wechsel
- **System-Informationen** - IDs, Timestamps, Counts
- **Danger Zone** - Lösch-Aktionen (mit Confirmation)
- **Debug-Info** - Browser, User etc.

### Smart Assistant Sidebar
- **Kontextuelle Vorschläge** - Basierend auf aktuellem Status
- **Pflichtdokumente prüfen** - Automatische Erkennung fehlender Docs
- **Workflow-Schritte** - Visueller Fortschritt
- **Action Buttons** - Direkt zur relevanten Aktion springen

---

## 📦 Installation / Usage

### Import

```tsx
import InstallationDetailPanel from './installations/detail-v2';

// Oder einzelne Komponenten:
import { 
  InstallationDetailPanel, 
  useDetail, 
  DetailProvider 
} from './installations/detail-v2';
```

### Basic Usage

```tsx
function MyPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      {/* Deine Installation-Liste */}
      <InstallationList onSelect={(id) => setSelectedId(id)} />

      {/* Das Detail-Panel */}
      <InstallationDetailPanel
        open={selectedId !== null}
        installationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
```

### Mit Custom Styling

```tsx
// Das Panel nutzt CSS Custom Properties, die überschrieben werden können:
<div style={{ '--ld-accent': '#10b981' } as React.CSSProperties}>
  <InstallationDetailPanel {...props} />
</div>
```

---

## 🔄 Migration von V1

### Alte Verwendung (V1):

```tsx
import InstallationDetailModal from './installations/detail/InstallationDetailModal';

<InstallationDetailModal
  open={open}
  installationId={id}
  onClose={handleClose}
/>
```

### Neue Verwendung (V2):

```tsx
import InstallationDetailPanel from './installations/detail-v2';

<InstallationDetailPanel
  open={open}
  installationId={id}
  onClose={handleClose}
/>
```

**Das Interface ist identisch** - einfach den Import ändern!

---

## 🎨 CSS Customization

Die wichtigsten CSS-Variablen:

```css
.leca-detail-v2 {
  /* Colors */
  --ld-accent: #00b7ff;           /* Hauptakzent */
  --ld-bg-base: #0a0f16;          /* Basis-Hintergrund */
  --ld-bg-elevated: #0f1623;      /* Erhöhte Flächen */
  
  /* Status Colors */
  --ld-status-draft: #64748b;
  --ld-status-received: #f59e0b;
  --ld-status-review: #3b82f6;
  --ld-status-grid: #8b5cf6;
  --ld-status-approved: #10b981;
  
  /* Shadows */
  --ld-shadow-glow: 0 0 40px rgba(0, 183, 255, 0.15);
}
```

---

## 📁 Dateistruktur

```
detail-v2/
├── index.ts                    # Public API exports
├── InstallationDetailPanel.tsx # Haupt-Komponente
├── types.ts                    # TypeScript Definitionen
├── context/
│   └── DetailContext.tsx       # React Context & Provider
├── hooks/
│   └── useKeyboard.ts          # Keyboard Navigation
├── components/
│   ├── Header.tsx              # Panel Header
│   ├── Tabs.tsx                # Tab Navigation
│   ├── CommandPalette.tsx      # ⌘K Menu
│   ├── SmartSidebar.tsx        # AI Suggestions
│   └── DocumentPreview.tsx     # Document Modal
├── tabs/
│   ├── OverviewTab.tsx
│   ├── DocumentsTab.tsx
│   ├── EmailsTab.tsx
│   ├── TimelineTab.tsx
│   ├── DataTab.tsx
│   └── AdminTab.tsx
├── styles/
│   └── detail.css              # Alle Styles
└── utils/
    └── index.ts                # Helper Functions
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Esc` | Panel schließen / Modal schließen |
| `⌘K` / `Ctrl+K` | Command Palette öffnen |
| `1-6` | Zu Tab wechseln |
| `←` / `→` | Vorheriger / Nächster Tab |
| `⌘Enter` / `Ctrl+Enter` | Kommentar speichern |

---

## 🔌 API-Endpunkte (erwartet)

Das Panel erwartet folgende Backend-Endpunkte:

```
GET    /api/installations/:id              # Detail laden
PATCH  /api/installations/:id              # Status/Kommentar updaten
POST   /api/installations/:id/comments     # Kommentar hinzufügen
POST   /api/installations/:id/documents    # Dokument hochladen
DELETE /api/installations/:id/documents/:docId  # Dokument löschen
POST   /api/emails/:id/assign              # E-Mail zuordnen
POST   /api/emails/:id/unassign            # Zuordnung aufheben
```

---

## 🛠️ Noch zu implementieren

- [ ] E-Mail Vollansicht Modal
- [ ] Dokument-Kategorisierung per Drag & Drop
- [ ] Export-Funktion (PDF-Report)
- [ ] Audit-Log Tab
- [ ] WebSocket für Live-Updates
- [ ] Mobile-Responsive Optimierungen

# Netzanmeldungen - VDE Generator Integration

## 🚀 Neues Feature: KI-gestützte VDE-Formular-Generierung

### Was ist drin?

```
netzanmeldungen/
├── components/
│   ├── DetailPanel/
│   │   ├── index.tsx          ← VDE Button integriert
│   │   └── styles.css         ← VDE Button Styles
│   │
│   └── VDEGeneratorModal/     ← NEU!
│       ├── index.tsx          ← 5-Step Wizard Modal
│       └── styles.css         ← Premium Dark UI
│
├── services/
│   └── api.ts                 ← vdeGenerator API hinzugefügt
│
└── backend/
    ├── routes/
    │   └── vde_generator_routes.ts  ← Backend API
    └── VDE_GENERATOR_README.md
```

### Flow

```
┌─────────────────┐
│ 1. Button       │  Im DetailPanel Overview Tab
│    klicken      │  (nur bei STORAGE_RETROFIT/PV_NEW)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. Datenblatt   │  PDF oder Bild hochladen
│    hochladen    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. KI-Extraktion│  Claude liest alle Specs
│                 │  (Kapazität, Leistung, Technologie...)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 4. Prüfen       │  Daten kontrollieren/korrigieren
│                 │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 5. Generieren   │  E.1, E.3, E.8 PDFs erstellen
│                 │  Im LECA Premium Design
└────────┬────────┘
         ↓
┌─────────────────┐
│ 6. E-Mail       │  An Netzbetreiber senden
│    senden       │  Mit allen Anhängen
└─────────────────┘
```

### Backend Setup

1. **Dependencies:**
```bash
npm install @anthropic-ai/sdk jspdf multer
npm install -D @types/multer
```

2. **Environment:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Route registrieren:**
```typescript
import vdeGeneratorRoutes from './routes/vde_generator_routes';
app.use('/api/vde-generator', vdeGeneratorRoutes);
```

### Kosten

~1 Cent pro Formular-Generierung (Claude API)

### Screenshots

Der VDE Generator Button erscheint im DetailPanel:
- Nach dem Status & Workflow Bereich
- Nur für Admins (nicht für Kunden)
- Nur bei STORAGE_RETROFIT und PV_NEW Anmeldungen

### Dateien kopieren

Alle neuen Dateien sind bereits an der richtigen Stelle:

1. `components/VDEGeneratorModal/` → Neuer Ordner mit Modal + CSS
2. `components/DetailPanel/index.tsx` → Aktualisiert mit Import + Button
3. `components/DetailPanel/styles.css` → Aktualisiert mit Button Styles
4. `services/api.ts` → Aktualisiert mit vdeGenerator Endpoints
5. `backend/routes/vde_generator_routes.ts` → Backend Route

Einfach das ganze `netzanmeldungen/` Verzeichnis in dein Projekt kopieren!

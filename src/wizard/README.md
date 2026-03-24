# LECA Wizard V11 - Enterprise Modular Architecture

> Intelligente Netzanmeldung mit 3D UI, Auto-Schaltplan, VDE-Konformität

## 🚀 Features

- ✅ 8-Step Wizard mit Progress-Tracking
- ✅ Glassmorphism 3D Design mit Parallax
- ✅ VDE-AR-N 4105 Regelwerk Engine
- ✅ §14a EnWG Integration
- ✅ Automatische Schaltplan-Generierung (SVG)
- ✅ Vollmacht-Generator (HTML/PDF)
- ✅ Netzbetreiber PLZ-Mapping
- ✅ String-Berechnung & Kompatibilitätsprüfung
- ✅ Ertragsschätzung nach Bundesland
- ✅ Digitale Signatur
- ✅ Zustand State Management mit Persistence

## 📦 Installation

```bash
npm install
npm run dev
```

## 🏗️ Projektstruktur

```
leca-wizard-v11/
├── app/
│   ├── wizard/page.tsx       # Wizard Route
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── wizard/
│   │   ├── WizardMain.tsx    # Haupt-Komponente
│   │   ├── steps/index.tsx   # Alle 8 Steps
│   │   └── generators/       # Schaltplan, Vollmacht
│   ├── ui/index.tsx          # UI Components
│   └── 3d/Background3D.tsx   # 3D Animated Background
├── lib/
│   ├── regelwerk/            # VDE, EEG Regeln
│   ├── netzbetreiber/        # PLZ Mapping
│   ├── technik/              # Berechnungen
│   └── utils/                # Helpers
├── stores/wizardStore.ts     # Zustand Store
├── types/wizard.types.ts     # TypeScript Types
└── styles/globals.css        # Tailwind + Custom
```

## 🔌 API Endpoints (Backend)

```
GET  /api/produkte?kategorie=...
GET  /api/produkte/:id/datenblatt
GET  /api/netzbetreiber?plz=...
POST /api/wizard/start
PUT  /api/wizard/:id
POST /api/wizard/:id/submit
POST /api/dokumente/upload
GET  /api/dokumente/generiere-schaltplan
GET  /api/dokumente/generiere-vollmacht
POST /api/mastr/voranmeldung
```

## 📋 LECA Firmendaten

```
GridNetz
Südstraße 31
47475 Kamp-Lintfort
E-Mail: info@gridnetz.de
USt-ID: DE311312826
Geschäftsführer: Isabella Zwick
```

---

**LECA GmbH & Co. KG** - Intelligente Netzanmeldung

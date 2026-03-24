# GridNetz Frontend - Vollständige Analyse

**Erstellt:** 2026-01-19
**Pfad:** `/var/www/gridnetz-frontend`
**Version:** Nach Migration von LeCa

---

## 1. DATEISTRUKTUR

### Übersicht
| Metrik | Wert |
|--------|------|
| Quelldateien (ts/tsx/js/css/json) | 490 |
| Gesamtgröße (ohne node_modules) | 8.8 MB |
| TypeScript-Zeilen gesamt | 115,785 |

### Ordnerstruktur nach Größe
```
1.7M  ./src/modules/        ← Größter Ordner
1.5M  ./src/pages/
1.4M  ./src/wizard/
1.1M  ./src/features/
396K  ./src/styles/
376K  ./src/components/
320K  ./src/admin-center/
300K  ./src/finanzen-module/
180K  ./src/screens/
120K  ./src/lib/
112K  ./src/shared/
76K   ./src/services/
56K   ./src/utils/
40K   ./src/api/
36K   ./src/hooks/
24K   ./src/debug/
24K   ./src/contexts/
16K   ./src/ai/
12K   ./src/types/
12K   ./src/theme/
```

### Größte Dateien (> 1000 Zeilen)
| Datei | Zeilen | Status |
|-------|--------|--------|
| `pages/RechnungenPage.tsx` | 3,394 | ⚠️ Zu groß |
| `pages/ProdukteDatenbankPage.tsx` | 2,727 | ⚠️ Zu groß |
| `wizard/components/wizard/steps/index.tsx` | 2,526 | ⚠️ Zu groß |
| `features/netzanmeldungen/services/dokumenteGenerator.ts` | 2,273 | ⚠️ Zu groß |
| `finanzen-module/index.tsx` | 2,250 | ⚠️ Zu groß |
| `modules/rechnungen/InvoiceCreateModal.tsx` | 2,033 | ⚠️ Zu groß |
| `pages/NetzbetreiberCenterPage.tsx` | 1,725 | ⚠️ Zu groß |
| `pages/UserManagementPage.tsx` | 1,679 | ⚠️ Zu groß |
| `pages/LandingPage.tsx` | 1,372 | ✓ Akzeptabel (neu) |

---

## 2. UNGENUTZTE DATEIEN

### Backup-Dateien (28 Stück - LÖSCHEN!)
```
./src/lib/mailer.ts.bak.2025-12-13-050746
./src/lib/mailer.ts.bak.2025-12-13-045120
./src/lib/mailer.ts.bak.2025-12-13-050551
./src/lib/mailer.ts.bak.2025-12-13-050104
./src/lib/mailer.ts.bak.2025-12-13-045636
./src/lib/mailer.ts.bak.2025-12-13-044504
./src/lib/mailer.ts.bak.2025-12-13-171300
./src/lib/mailer.ts.bak.2025-12-13-050908
./src/pages/admin/Dashboard.tsx.bak.2025-12-18-224803
./src/modules/api/client.ts.bak.2025-12-15-091717
./src/modules/installations/detail-v2/tabs/EmailsTab.tsx.bak.* (5x)
./src/modules/installations/detail-v2/context/DetailContext.tsx.bak.* (4x)
./src/modules/dashboard/user/UserDashboard.tsx.bak.* (3x)
./src/modules/dashboard/admin/features/dashboard/Dashboard.tsx.bak
./src/modules/auth/LoginPage.tsx.bak.* (2x)
./src/modules/auth/tokenStorage.ts.bak.* (2x)
./src/services/ruleEngine.ts.bak.2025-12-13-194023
```

### Doppelte Dateinamen (potenzielle Duplikate)
```
AbrechnungPage.tsx      (2x)
AdminLayout.tsx         (2x)
AdminTab.tsx            (2x)
Analytics.tsx           (2x)
AnlagenPage.tsx         (2x)
api.ts                  (4x)
App.tsx                 (2x)
client.ts               (3x)
Dashboard.tsx           (3x)
DocumentsTab.tsx        (2x)
EmailsTab.tsx           (2x)
index.ts/tsx            (viele)
LageplanGenerator.ts    (2x)
NetzanmeldungenPage.tsx (2x)
router.tsx              (2x)
types.ts                (4x)
vdeGenerator.ts         (2x)
WizardPage.tsx          (2x)
```

---

## 3. LECA REFERENZEN (615 Stück!)

### KRITISCH - Muss geändert werden

#### 3.1 Zentrale Konfiguration
**Datei:** `src/wizard/types/wizard.types.ts` (Zeile 462-473)
```typescript
export const LECA_FIRMA = {
  name: 'LeCa GmbH & Co. KG',
  strasse: '...',
  plz: '...',
  ort: '...',
  email: 'netzanmeldung@lecagmbh.de',
  website: 'https://lecagmbh.de',
  agbUrl: 'https://lecagmbh.de/agb.html',
  datenschutzUrl: 'https://lecagmbh.de/datenschutz.html',
};
```
**→ Umbenennen zu `GRIDNETZ_FIRMA` und Werte anpassen!**

#### 3.2 Duplizierte LECA_FIRMA Definitionen (KONSOLIDIEREN!)
| Datei | Zeile |
|-------|-------|
| `wizard/types/wizard.types.ts` | 462 |
| `features/netzanmeldungen/components/EmailComposer/index.tsx` | 127 |
| `features/netzanmeldungen/lib/pdf/VDEFormularePremium.ts` | 21 |
| `features/netzanmeldungen/services/vdeGenerator.ts` | 36 |
| `features/netzanmeldungen/services/dokumenteGenerator.ts` | 97 |

**→ Alle auf EINE zentrale Definition umstellen!**

#### 3.3 Hardcoded URLs & E-Mails
| Datei | Zeile | Inhalt |
|-------|-------|--------|
| `wizard/lib/maps/openstreetmap.ts` | 54 | `'LECA-Wizard/1.0 (contact@lecagmbh.de)'` |
| `layout/AdminLayout.tsx` | 196 | `"https://lecagmbh.de"` |
| `modules/auth/LoginPage.tsx` | 625 | `"https://lecagmbh.de"` |
| `pages/BenutzerPage.tsx` | 130 | `"name@lecagmbh.de"` |

#### 3.4 LocalStorage Keys (BENENNEN!)
| Datei | Key |
|-------|-----|
| `wizard/stores/wizardStore.ts` | `leca-wizard-v12-{userId}` |
| `wizard/stores/wizardStore.ts` | `leca-learning-session` |
| `wizard/lib/intelligence/learningEngine.ts` | `leca-failed-sessions` |
| `wizard/lib/intelligence/learningEngine.ts` | `leca-last-address` |
| `wizard/lib/intelligence/learningEngine.ts` | `leca-last-customer` |
| `wizard/lib/api/client.ts` | `leca_token` |

#### 3.5 Window-Objekte
| Datei | Zeile | Variable |
|-------|-------|----------|
| `wizard/lib/api/client.ts` | 8 | `window.__LECA_API_URL__` |
| `wizard/lib/api/client.ts` | 229 | `window.__LECA_API__` |

### MEDIUM - Code-Kommentare & Styles
| Kategorie | Anzahl | Dateien |
|-----------|--------|---------|
| CSS Kommentare | ~20 | `styles/*.css` |
| TSDoc Kommentare | ~80 | `wizard/**/*.ts` |
| Style-IDs | ~5 | `leca-premium-styles`, `leca-ai-styles`, `leca-v12`, `leca-wizard-styles` |

### NIEDRIG - Kann bleiben
- Debug-Logs mit "LECA" Prefix
- Historische Kommentare in Backup-Dateien

---

## 4. CODE QUALITÄT

### TypeScript
| Metrik | Wert |
|--------|------|
| Kompilierungsfehler | 0 ✅ |
| @ts-ignore | 3 |
| @ts-nocheck | 0 |
| `any` Types | ~30 Dateien |

### Code Hygiene
| Metrik | Wert |
|--------|------|
| console.log/warn/error | 473 ⚠️ |
| TODO/FIXME/HACK | 5 |
| eslint-disable | 9 |

---

## 5. DEPENDENCIES

### Security Vulnerabilities (3 Stück)
| Package | Severity | Issue |
|---------|----------|-------|
| `jspdf` ≤3.0.4 | **CRITICAL** | Local File Inclusion/Path Traversal |
| `react-router` 7.0-7.12 | **HIGH** | CSRF + XSS vulnerabilities |
| `react-router-dom` | **HIGH** | Depends on vulnerable react-router |

**Fix:** `npm audit fix` oder `npm audit fix --force`

### Veraltete Packages (23 Stück)
| Package | Current | Latest | Priority |
|---------|---------|--------|----------|
| jspdf | 3.0.4 | 4.0.0 | **HOCH** (Security) |
| react-router-dom | 7.9.6 | 7.12.0 | **HOCH** (Security) |
| react | 19.2.0 | 19.2.3 | Mittel |
| react-dom | 19.2.0 | 19.2.3 | Mittel |
| vite | 7.2.6 | 7.3.1 | Niedrig |
| tailwindcss | 4.1.17 | 4.1.18 | Niedrig |
| typescript-eslint | 8.48.0 | 8.53.0 | Niedrig |
| framer-motion | 12.23.26 | 12.27.0 | Niedrig |
| ... | ... | ... | ... |

---

## 6. PERFORMANCE ISSUES

### Bundle Size
| Chunk | Größe | Gzip |
|-------|-------|------|
| index.js (main) | 2.37 MB | 652 KB |
| three.module.js | 720 KB | 187 KB |
| html2canvas.esm.js | 201 KB | 47 KB |
| index.es.js (PDF) | 159 KB | 53 KB |

**Warnung:** Main chunk > 500 KB!

### Empfehlungen
1. **Code Splitting** - Große Pages lazy loaden
2. **Tree Shaking** - Three.js nur für Landing Page
3. **Dynamic Imports** - PDF-Generatoren bei Bedarf laden

### Dateien die gesplittet werden sollten
- `RechnungenPage.tsx` (3,394 Zeilen)
- `ProdukteDatenbankPage.tsx` (2,727 Zeilen)
- `wizard/components/wizard/steps/index.tsx` (2,526 Zeilen)
- `dokumenteGenerator.ts` (2,273 Zeilen)

---

## 7. ARCHITEKTUR PROBLEME

### Inkonsistente Strukturen
1. **Doppelte Module:**
   - `src/finanzen-module/` + `src/modules/rechnungen/`
   - `src/pages/admin/` + `src/modules/dashboard/admin/`

2. **Mehrere API-Clients:**
   - `src/api/client.ts`
   - `src/wizard/lib/api/client.ts`
   - `src/modules/api/client.ts`

3. **Mehrere Router:**
   - `src/router.tsx`
   - `src/modules/dashboard/admin/router.tsx`

### Empfohlene Konsolidierung
```
src/
├── api/          ← EIN API-Client
├── components/   ← Gemeinsame Komponenten
├── features/     ← Feature-Module
├── hooks/        ← Gemeinsame Hooks
├── lib/          ← Utilities
├── pages/        ← Seiten/Routes
├── stores/       ← State Management
├── styles/       ← Globale Styles
└── types/        ← TypeScript Types
```

---

## 8. EMPFEHLUNGEN

### SOFORT (Kritisch)
1. **Backup-Dateien löschen** (28 Dateien)
   ```bash
   find ./src -name "*.bak*" -delete
   ```

2. **LECA_FIRMA zentralisieren**
   - Umbenennen zu `COMPANY_CONFIG` oder `GRIDNETZ_FIRMA`
   - Alle 5 Definitionen auf eine reduzieren
   - In `/src/config/company.ts` auslagern

3. **Security Fixes**
   ```bash
   npm audit fix
   ```

4. **LocalStorage Keys umbenennen**
   - `leca-*` → `gridnetz-*`

### KURZFRISTIG (1-2 Wochen)
1. **console.log entfernen** (473 Stück)
   ```bash
   # Prüfen, dann entfernen
   grep -rn "console\." ./src --include="*.ts" --include="*.tsx"
   ```

2. **Große Dateien splitten**
   - RechnungenPage → Unterkomponenten
   - dokumenteGenerator → Pro-Dokument-Module

3. **API-Clients konsolidieren**
   - Einen `apiClient` mit konfigurierbarer baseURL

### MITTELFRISTIG (1 Monat)
1. **Dependencies aktualisieren**
2. **Bundle-Optimierung mit Code Splitting**
3. **Architektur-Refactoring**
4. **Vollständige LeCa→GridNetz Migration**

---

## 9. SCHNELLE WINS

### Befehl: Backup-Dateien löschen
```bash
cd /var/www/gridnetz-frontend
find ./src -name "*.bak*" -type f -delete
echo "Gelöscht!"
```

### Befehl: LeCa→GridNetz in wizard.types.ts
```bash
# In src/wizard/types/wizard.types.ts:
# LECA_FIRMA → GRIDNETZ_FIRMA
# Alle Werte aktualisieren
```

### Befehl: Security Fixes
```bash
npm audit fix
npm update react-router-dom
```

---

## 10. ZUSAMMENFASSUNG

| Kategorie | Status | Handlungsbedarf |
|-----------|--------|-----------------|
| TypeScript-Fehler | ✅ 0 | Keiner |
| Security | ❌ 3 CVEs | **SOFORT** |
| LeCa-Referenzen | ❌ 615 | **HOCH** |
| Backup-Dateien | ❌ 28 | **SOFORT** |
| Console.logs | ⚠️ 473 | Mittel |
| Bundle Size | ⚠️ >500KB | Mittel |
| Architektur | ⚠️ Inkonsistent | Niedrig |

**Geschätzte Zeit für vollständige Bereinigung:**
- Kritisch (Backup + Security): ~30 Minuten
- LeCa→GridNetz Migration: ~2-4 Stunden
- Code-Optimierung: ~1-2 Tage

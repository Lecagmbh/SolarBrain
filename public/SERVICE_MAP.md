# GridNetz Service-Map
Letzte Aktualisierung: 2026-03-15
Analysierte Seiten: /dashboard, /netzanmeldungen, /vde-formulare, /vde-4110

---

## 1. Komponentenbaum: /dashboard

```
Dashboard (modules/dashboard/Dashboard.tsx, 238 Z.)
│
├── [Rolle: KUNDE/DEMO] → KundenDashboard (components/KundenDashboard.tsx, 818 Z.)
│   ├── KPI-Cards ×4 (Gesamt, Beim NB, Rückfragen, Genehmigt)
│   ├── Alert-Banner (wenn Rückfragen > 0)
│   ├── Pipeline-Übersicht (vereinfacht)
│   ├── Aktivitäten-Liste
│   ├── Quick-Actions (Neue Anlage, Dokumente, Rechnungen, WhatsApp)
│   ├── Termine-Liste (max 3)
│   └── Anlagen-Liste (max 5)
│
├── [Rolle: ADMIN/MITARBEITER/SUB] →
│   ├── DashboardHeader (components/DashboardHeader.tsx, 94 Z.)
│   │   └── AnimatedCounter (openCount)
│   │
│   ├── ActionRequired (components/ActionRequired/ActionRequired.tsx, 152 Z.)
│   │   └── ActionItemCard ×N (nb-mails, submit, ibn, followup, documents)
│   │
│   ├── AnimatedPipeline (components/AnimatedPipeline/AnimatedPipeline.tsx, 171 Z.)
│   │   ├── PipelineStage ×6 (eingang, beim_nb, rueckfrage, genehmigt, ibn, fertig)
│   │   └── FlowingParticles (Animation)
│   │
│   ├── AdminTaskList (components/TaskList/AdminTaskList.tsx, 463 Z.)
│   │   └── TaskCard ×N (Drag-Reorder, Filter, Priority-Badges)
│   │
│   ├── ActivityFeedCard (components/Insights/ActivityFeedCard.tsx, 264 Z.)
│   │   └── ActivityRow ×N (Status-Changes + Kommentare)
│   │
│   ├── WeekCalendar (components/Calendar/WeekCalendar.tsx, 409 Z.)
│   │   └── TerminRow ×N (7-Tage Grid + Liste)
│   │
│   └── QuickActions (components/QuickActions.tsx, 120 Z.)
│       └── Buttons: Neue Anmeldung, Import, E-Mails, Dokumente, Analytics
│
├── [Rolle: HV] → Redirect /hv-center
│
└── NewAnmeldungModal (features/nb-portal)
```

**Daten-Hook:** `useDashboardData` (hooks/useDashboardData.ts, 590 Z.)
- Fetcht 6 Endpoints parallel via `Promise.allSettled()`
- Auto-Refresh: 60s Intervall
- Tab-Visibility: Refresh bei Tab-Wechsel

---

## 2. API-Ketten (Service-Mapping)

### Kette #1: Pipeline-Stages
```
UI: AnimatedPipeline → useDashboardData → fetchPipelineData()
Frontend: GET /api/dashboard/summary
Route: dashboard.routes.ts:23
Service: Inline (kein separater Service)
DB-Reads:
  - installations (COUNT, WHERE deletedAt IS NULL) — Gesamt
  - installations (COUNT, WHERE status NOT IN [FERTIG, STORNIERT]) — Offen
  - installations (COUNT × 6, GROUP BY status) — Pro Pipeline-Stage
  - installations (findMany, WHERE status=FERTIG, TAKE 100) — Avg Processing Time
DB-Writes: keine
Cache: Redis 60s, Key: dashboard:summary:{userId}
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: Nur /dashboard
```

### Kette #2: Action Items (Admin)
```
UI: ActionRequired → useDashboardData → fetchActionItems(isAdmin=true)
Frontend: GET /api/v2/inbox/counts
Route: workflowV2.routes.ts:173
Service: inboxItemGenerator.service.ts → getOpenItemsCount()
DB-Reads:
  - inbox_items (findMany, WHERE resolvedAt IS NULL AND snoozedUntil < NOW())
DB-Writes: keine
Cache: nein
Auch genutzt von: Sidebar Badge (global), /netzanmeldungen Header
```

### Kette #3: Action Items (Kunde)
```
UI: KundenDashboard → useDashboardData → fetchActionItems(isAdmin=false)
Frontend: GET /api/dashboard/alerts
Route: dashboard.routes.ts:550
Service: Inline
DB-Reads:
  - installations (COUNT × 4, WHERE status IN [EINGANG, RUECKFRAGE, GENEHMIGT, BEIM_NB >14d])
DB-Writes: keine
Cache: nein
Rollen-Filter: getVisibleKundeIds()
Auch genutzt von: Nur /dashboard (Kunden-View)
```

### Kette #4: Task-Liste (Admin)
```
UI: AdminTaskList → useDashboardData → fetchTasks()
Frontend: GET /api/installations?status=EINGANG,RUECKFRAGE,GENEHMIGT&limit=20&sort=-updatedAt
Route: installation.routes.ts:765
Service: Inline (komplexer Handler mit Scoping)
DB-Reads:
  - installations (COUNT + findMany, WHERE status IN [...], TAKE 20, ORDER BY updatedAt DESC)
  - rechnungen (findMany, WHERE kundeId IN [...] OR beschreibung CONTAINS publicId)
DB-Writes: keine
Cache: Redis 60s, Key: cache:installations:list:{role}:{params}
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: /netzanmeldungen (Hauptliste), /hv-center, /ops-center, /archiv
```

### Kette #5: Anlagen-Liste (Kunde)
```
UI: CustomerAnlagen → useDashboardData → fetchAnlagen(kundeId)
Frontend: GET /api/installations?kundeId={id}&limit=10&sort=-updatedAt
Route: installation.routes.ts:765 (gleicher Endpoint wie Kette #4)
Service: Inline
DB-Reads: Gleich wie Kette #4, gefiltert auf kundeId
Cache: Redis 60s
Auch genutzt von: /netzanmeldungen (Kundensicht)
```

### Kette #6: NB-Performance (Admin)
```
UI: (nicht direkt sichtbar, aber gefetcht) → useDashboardData → fetchNBPerformance()
Frontend: GET /api/netzbetreiber/performance
Route: netzbetreiber.routes.ts:716
Service: Inline
DB-Reads:
  - netzbetreiber (findMany, WHERE aktiv=true, LIMIT 20)
  - installations (COUNT × 40: je 2 pro NB — completed + open)
DB-Writes: keine
Cache: nein ⚠️ (41 Queries ohne Cache!)
Auch genutzt von: /analytics, /ops-center
```

### Kette #7: Termine
```
UI: WeekCalendar → useDashboardData → fetchTermine()
Frontend: GET /api/dashboard/termine
Route: dashboard.routes.ts:511
Service: Inline
DB-Reads:
  - projekt_termine (findMany, WHERE startzeit BETWEEN now AND +7d, status ≠ ABGESAGT, TAKE 10)
  - projekte (include, SELECT id, titel, projektNummer)
DB-Writes: keine
Cache: nein
Auch genutzt von: /calendar
```

### Kette #8: Activity Feed
```
UI: ActivityFeedCard → useDashboardData → fetchActivities()
Frontend: GET /api/dashboard/activity-feed?limit=10
Route: dashboard.routes.ts:390
Service: Inline
DB-Reads:
  - status_history (findMany, TAKE 20, ORDER BY createdAt DESC, include installation)
  - comments (findMany, TAKE 20, ORDER BY createdAt DESC, include installation)
  → Merge + Sort + Slice
DB-Writes: keine
Cache: nein
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: Nur /dashboard
```

---

## 3. Generator-Inventar

Vom /dashboard aus sind **keine Generatoren direkt erreichbar**. Das Dashboard ist rein lesend. Aber über QuickActions-Buttons navigiert der User zu Seiten mit Generatoren:

| QuickAction | Navigiert zu | Generatoren dort |
|-------------|-------------|-----------------|
| Neue Anmeldung | NewAnmeldungModal → /netzanmeldungen | Schaltplan, Lageplan, Vollmacht, VDE E1-E8 |
| Import | /import | CSV/Excel Parser |
| E-Mails | /emails | Email-Templates (MJML) |
| Dokumente | /dokumente | — |
| Analytics | /analytics | Report-Export (CSV) |

---

## 4. Shared Services

### Services die /dashboard nutzt:

| Service/Modul | /dashboard nutzt | Andere Seiten |
|---------------|-----------------|---------------|
| `installation.routes.ts` (inline) | GET /installations (Liste) | /netzanmeldungen, /hv-center, /ops-center, /archiv, /analytics |
| `dashboard.routes.ts` (inline) | GET /summary, /alerts, /termine, /activity-feed | Nur /dashboard |
| `workflowV2.routes.ts` | GET /v2/inbox/counts | Sidebar (global), /netzanmeldungen |
| `netzbetreiber.routes.ts` | GET /performance | /analytics, /ops-center |
| `roles.ts` → `getVisibleKundeIds()` | Rollen-Scoping | JEDE geschützte Route |
| `roles.ts` → `addDemoFilter()` | Demo-Isolation | JEDE geschützte Route |
| `inboxItemGenerator.service.ts` | getOpenItemsCount() | /netzanmeldungen, WorkflowV2 |

### Beobachtung: Kein separater Dashboard-Service
Der dashboard.routes.ts hat **keinen eigenen Service-Layer** — alle Queries sind inline in den Route-Handlern. Das bedeutet:
- Business-Logik ist nicht wiederverwendbar
- Gleiche Aggregationen (z.B. Status-Counts) werden in verschiedenen Routes neu geschrieben

---

## 5. Services → Seiten Matrix

| Service/Endpoint | /dashboard | /netzanmeldungen | /finanzen | /ops-center | /analytics | /hv-center |
|------------------|:---------:|:----------------:|:---------:|:-----------:|:----------:|:----------:|
| GET /installations | ✓ (Tasks/Anlagen) | ✓ (Hauptliste) | | ✓ | ✓ | ✓ |
| GET /dashboard/summary | ✓ (Pipeline) | | | | | |
| GET /dashboard/alerts | ✓ (Kunde) | | | | | |
| GET /dashboard/termine | ✓ (Kalender) | | | | | |
| GET /dashboard/activity-feed | ✓ (Feed) | | | | | |
| GET /v2/inbox/counts | ✓ (ActionItems) | ✓ (Badge) | | | | |
| GET /netzbetreiber/performance | ✓ (NB-Stats) | | | ✓ | ✓ | |
| getVisibleKundeIds() | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 6. API-Endpunkte → DB-Tabellen

| Endpoint | Route-Datei | DB-Tabellen (Read) | Cache | Seiten |
|----------|-------------|-------------------|-------|--------|
| GET /api/dashboard/summary | dashboard.routes.ts:23 | installations (×9 Queries) | Redis 60s | /dashboard |
| GET /api/dashboard/alerts | dashboard.routes.ts:550 | installations (×4 COUNT) | nein | /dashboard |
| GET /api/dashboard/termine | dashboard.routes.ts:511 | projekt_termine, projekte | nein | /dashboard |
| GET /api/dashboard/activity-feed | dashboard.routes.ts:390 | status_history, comments, installations | nein | /dashboard |
| GET /api/dashboard/priorities | dashboard.routes.ts:473 | installations (×3 COUNT) | nein | /dashboard |
| GET /api/v2/inbox/counts | workflowV2.routes.ts:173 | inbox_items | nein | /dashboard, Sidebar |
| GET /api/installations | installation.routes.ts:765 | installations, rechnungen | Redis 60s | /dashboard, /netzanmeldungen, /hv-center, /ops-center |
| GET /api/netzbetreiber/performance | netzbetreiber.routes.ts:716 | netzbetreiber, installations (×41!) | nein | /dashboard, /analytics |

---

## 7. Zusammenhänge (Cross-Page)

### Installation-Status Aggregation — 3× verschiedene Implementierungen
- **/dashboard** (`/summary`): `prisma.installation.count()` × 6 für Pipeline-Stages, inline in Route-Handler
- **/dashboard** (`/alerts`): Nochmal `prisma.installation.count()` × 4 für Action Items, separate Route
- **/netzanmeldungen** (`/installations`): `prisma.installation.count()` für Gesamt + findMany für Liste
- **Alle drei lesen dieselbe `installations`-Tabelle mit fast identischen WHERE-Clauses**
- → KANDIDAT für zentralen `installationStats.service.ts`

### Rollen-Scoping — Zentralisiert aber überall manuell aufgerufen
- `getVisibleKundeIds()` wird in JEDEM Route-Handler manuell aufgerufen
- `addDemoFilter()` ebenso
- → Könnte als Middleware automatisch an `req` gehängt werden

### NB-Performance — N+1 Problem
- `/netzbetreiber/performance` macht 41 DB-Queries (1 + 2×20)
- Kein Cache, kein Batching
- Gleiche Daten auch auf /analytics und /ops-center relevant
- → KANDIDAT für `nbPerformance.service.ts` mit Cache

### Termine — Eigene Tabelle
- `projekt_termine` wird nur von `/dashboard/termine` gelesen
- `/calendar` Route nutzt vermutlich denselben oder ähnlichen Endpoint
- → Prüfen bei /calendar Analyse

### Activity Feed — Merge aus 2 Tabellen
- `status_history` + `comments` werden gemergt und sortiert
- Dieses Pattern existiert vermutlich auch auf der Installations-Detailseite
- → KANDIDAT für `activityFeed.service.ts`

### Dashboard hat KEINEN eigenen Service
- Alle 5 dashboard.routes.ts Endpoints haben inline DB-Queries
- Kein `dashboard.service.ts` existiert (obwohl in DEEP_ANALYSIS.md als "dashboard.service" referenziert)
- → Bei Konsolidierung: Service-Layer einführen

---

## 8. Performance-Beobachtungen

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| /dashboard/summary | 11 | ✅ 60s | OK, aber 11 Queries pro Aufruf nach Cache-Expiry |
| /netzbetreiber/performance | 41 | ❌ | ⚠️ KRITISCH: 41 Queries ohne Cache |
| /dashboard/alerts | 4 | ❌ | Kein Cache, aber leichtgewichtig |
| /dashboard/activity-feed | 2 | ❌ | OK, aber 2 findMany ohne Limit-Schutz (TAKE 20 je) |
| /dashboard/termine | 1 | ❌ | OK, leichtgewichtig |
| /v2/inbox/counts | 1 | ❌ | OK, aber häufig aufgerufen (auch Sidebar) |
| /installations | 2-3 | ✅ 60s | OK |

**Gesamt pro Dashboard-Load: ~60 DB-Queries** (11+41+4+2+1+1+2 = 62, davon 52 nach Cache-Miss)

---

---

## 9. Komponentenbaum: /netzanmeldungen

```
NetzanmeldungenEnterprise (features/netzanmeldungen/NetzanmeldungenEnterprise.tsx, 283 Z.)
│
├── WorkflowOverview (components/WorkflowOverview.tsx, 150 Z.)
│   └── 7 Status-Boxes: Eingang, Beim NB, Rückfrage, Genehmigt, IBN, Fertig, Abgerechnet
│       Hook: useStats() → GET /api/netzanmeldungen/stats (30s stale, 60s refetch)
│
├── ActionRequired (components/ActionRequired.tsx, 214 Z.)
│   ├── Rückfragen-Cards (rot, max 5) → GET /api/netzanmeldungen/list?status=RUECKFRAGE&limit=20
│   ├── Einreichen-Cards (blau, Admin) → GET /api/netzanmeldungen/list?status=EINGANG&limit=20
│   └── Zählerwechsel-Cards (violett, Admin) → GET /api/netzanmeldungen/list?status=GENEHMIGT,IBN&limit=20
│       Hook: useActionRequired() (3 parallele Queries, 30s stale)
│
├── EnterpriseList (components/EnterpriseList.tsx, 528 Z.)
│   ├── Toolbar: Suche + Status-Tabs + Sortierung
│   ├── Tabelle: 9 Spalten (Checkbox, Status, Kunde, Standort, NB, kWp, Alter, Beim NB, Action)
│   ├── Pagination: Page-basiert (Limit 50)
│   └── Batch-Ops: Bulk Delete (Admin only)
│       Hook: useList(filters) → GET /api/netzanmeldungen/list (15s stale)
│       Mutation: POST /api/netzanmeldungen/bulk/remove
│
└── DetailPanel (components/DetailPanel/index.tsx, 975 Z.)
    ├── useInstallationDetail Hook (hooks/useInstallationDetail.ts, 282 Z.)
    │   └── Lazy-Loading: Tabs laden Daten erst bei Aktivierung
    │
    ├── Tab 1: OverviewTab (tabs/OverviewTab.tsx, 2103 Z.) ⭐
    │   ├── Status-Transition-Buttons (kontextabhängig)
    │   ├── Kunde-Card (Name, Email, Tel — InlineEdit)
    │   ├── Standort-Card (Adresse, PLZ, Ort)
    │   ├── NB-Card (Name, Email, Portal-URL, Vorgangsnummer)
    │   ├── Technik-Summary (kWp, WR, Speicher, WP, WB)
    │   ├── Progress-Bar (5 Schritte)
    │   ├── Zählernummer + NB-Referenzen
    │   └── Meta (Erstellt, Aktualisiert, Ersteller)
    │   API: GET /api/netzanmeldungen/:id, GET /api/netzbetreiber
    │   Mutations: POST /:id/status, PATCH /:id/customer, POST /:id/grid-operator
    │
    ├── Tab 2: TechTab (tabs/TechTab.tsx, 368 Z.)
    │   └── PV, Speicher, Wallbox, Wärmepumpe — Collapsible Cards
    │   API: Keine (liest aus Detail-Objekt)
    │
    ├── Tab 3: DocumentsTab (tabs/DocumentsTab.tsx, 961 Z.)
    │   ├── Upload (Drag&Drop, Kategorien)
    │   ├── Download (mit Auth Token)
    │   ├── Generatoren: Vollmacht, Schaltplan, Lageplan, VDE E1-E8, Projektmappe
    │   └── Delete mit Bestätigung
    │   API: GET /:id/documents, POST /:id/documents, DELETE /:id/documents/:docId
    │   Generators: POST /:id/documents/generate, POST /vde/generate/:id
    │
    ├── Tab 4: TimelineTab (tabs/TimelineTab.tsx, 453 Z.)
    │   ├── Status-Changes + Kommentare (merged, sortiert)
    │   └── Notiz hinzufügen, Kommentare bearbeiten/löschen
    │   API: GET /:id/timeline, POST /:id/timeline,
    │         GET /:id/comments, POST/PATCH/DELETE /:id/comments
    │
    ├── Tab 5: EmailsTab (tabs/EmailsTab.tsx, 526 Z.)
    │   ├── Email-Verlauf (gruppiert nach Empfänger)
    │   ├── Quick-Templates (Dokumente anfordern, Status-Update, NB-Einreichung)
    │   └── Premium-Composer (Signatur, Anhänge, Template-Variablen)
    │   API: GET /:id/emails, POST /:id/emails, POST /:id/emails/nb
    │         GET/POST/PATCH/DELETE /email-templates
    │
    ├── Tab 6: TasksTab (tabs/TasksTab.tsx, 457 Z.)
    │   ├── Tasks gruppiert: Offen/In Progress vs. Completed/Cancelled
    │   └── Task-Templates, Prioritäten, Fälligkeiten
    │   API: GET /:id/tasks, POST /:id/tasks, PATCH/DELETE /tasks/:id
    │
    ├── Tab 7: KommunikationTab (tabs/KommunikationTab.tsx, 659 Z.)
    │   ├── NB-Info-Card (Name, Email, Portal, Telefon)
    │   ├── Korrespondenz-Verlauf (Typen: Erstanmeldung, Nachfrage, Antwort)
    │   ├── NB-Stats (Avg Response Days, Pending)
    │   └── Aktionen: Nachfrage senden, Antwort erfassen
    │   API: GET /:id/correspondence, GET /:id/nb-stats, POST /:id/nb-response
    │
    ├── Tab 8: ChatTab (tabs/ChatTab.tsx, 380 Z.)
    │   ├── Kanal-Wechsel: Ersteller / Endkunde
    │   └── Nachrichten-Verlauf + Senden
    │   API: GET /chat/installations/:id, POST /chat/installations/:id/messages
    │
    └── Tab 9: WhatsAppTab (tabs/WhatsAppTab.tsx, 336 Z.)
        ├── WhatsApp-Nachrichten-Verlauf
        └── Media-Support (Fotos, Dokumente)
        API: GET /whatsapp/installations/:id, POST /whatsapp/installations/:id/messages
```

**API-Layer:** `services/api.ts` (989 Z.) — 12 API-Module mit ~60 Funktionen
**Styling:** `DetailPanel/styles.css` (154 KB)
**Auch vorhanden:** `DetailModal.tsx` (2863 Z.) — Alternative Implementierung, Feature-Flag gesteuert

---

## 10. API-Ketten: /netzanmeldungen

### Kette #9: Workflow-Stats (Pipeline)
```
UI: WorkflowOverview → useStats()
Frontend: GET /api/netzanmeldungen/stats
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline
DB-Reads:
  - installations (COUNT × 7, pro Status)
  - installations (AGGREGATE, avgDaysBeimNb)
  - installations (COUNT, überfällig >14d)
  - installations (COUNT, Zählerwechsel nächste 14d)
  - installations (COUNT, abgerechnet)
DB-Writes: keine
Cache: nein
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: Nur /netzanmeldungen
⚠️ ÜBERSCHNEIDUNG mit /dashboard/summary (gleiche Status-Counts, andere Berechnung)
```

### Kette #10: Action-Items (Rückfragen/Einreichen/Zähler)
```
UI: ActionRequired → useActionRequired()
Frontend: GET /api/netzanmeldungen/list?status=RUECKFRAGE&limit=20 (×3 Queries parallel)
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline
DB-Reads:
  - installations (findMany × 3, WHERE status IN [...], TAKE 20)
Cache: nein (15s staleTime client-seitig)
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: Nur /netzanmeldungen
```

### Kette #11: Installations-Liste (Haupttabelle)
```
UI: EnterpriseList → useList(filters)
Frontend: GET /api/netzanmeldungen/list?status=X&search=Y&page=1&limit=50&sortBy=createdAt
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline (Cursor-Pagination optimiert für 10k+)
DB-Reads:
  - installations (findMany, mit Minimal-Select + ORDER BY + TAKE/SKIP)
  - installations (COUNT, für Total)
DB-Writes: keine
Cache: nein (15s staleTime client-seitig)
Rollen-Filter: getVisibleKundeIds() + addDemoFilter()
Auch genutzt von: Nur /netzanmeldungen (aber ähnlich: /dashboard Kette #4 nutzt /installations)
```

### Kette #12: Installation Detail
```
UI: DetailPanel → useInstallationDetail → api.installations.getById(id)
Frontend: GET /api/netzanmeldungen/:id
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline
DB-Reads:
  - installations (findUnique mit 6 includes: netzbetreiber, createdBy, kunde, documents, comments)
  - rechnung (findFirst, neueste für Kunde)
DB-Writes: keine
Cache: nein
Rollen-Filter: Demo-Isolation
Auch genutzt von: /hv-center (Detail), /ops-center (Detail)
⚠️ Schwerer Endpoint: Lädt Documents + Comments + 6 Relations in einer Query
```

### Kette #13: Status-Änderung + Workflow-Chain
```
UI: OverviewTab → Status-Button Click
Frontend: POST /api/netzanmeldungen/:id/status {status, reason}
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline + workflow.service.onStatusChange() + autoInvoice.service

VOLLSTÄNDIGE CHAIN:
1. Validierung:
   - canTransitionToStatus(role, newStatus)
   - validateDocCompleteness(id, newStatus) ← Pflichtdokumente prüfen
2. DB-Writes:
   - installations (UPDATE status, statusLabel, nbEingereichtAm/nbGenehmigungAm)
   - status_history (CREATE fromStatus → toStatus)
3. Side Effects (async, fire & forget):
   a) workflow.service.onStatusChange():
      - Lade Installation mit createdBy, assignedTo, kunde, NB
      - Template aus email_templates laden
      - 5-Level Subunternehmer-Blockierung prüfen
      - WhiteLabel-Weiterleitung (parentUserId)
      - Email senden via nodemailer
      - recordLearningEvent()
   b) wsService.notifyStatusChanged() → WebSocket an alle Clients
   c) Wenn newStatus === BEIM_NB:
      autoInvoice.service.createAutoInvoice() →
        → pricing.service.getInstallationPrice()
        → nextInvoiceNumber() (YYYYMM Counter)
        → invoicePdf.service.renderInvoicePdf()
        → paymentLink.service.createPaymentLink()
        → email.service.send() (Rechnung per Email)
        → prisma.rechnung.create()
        → prisma.installation.update(rechnungGestellt=true)

DB-Reads: installations, documents, email_templates, kunden, rechnung, companySettings
DB-Writes: installations, status_history, rechnung, documents, email_logs
Externe: SMTP (Email-Versand)
Generatoren: invoicePdf (bei BEIM_NB)
Cache: Redis invalidiert nach Änderung
```

### Kette #14: Dokument-Upload
```
UI: DocumentsTab → Drag&Drop Upload
Frontend: POST /api/installations/:id/documents (FormData)
Route: document.routes.ts
Service: Inline + notifyDocumentUpload()
DB-Writes:
  - documents (CREATE: dateiname, kategorie, sha256)
  - installations (UPDATE: updatedAt)
Side Effects: Email-Notification an Ersteller (wenn Status ≠ EINGANG)
Storage: Disk (uploads/ Verzeichnis)
```

### Kette #15: Dokument-Generierung
```
UI: DocumentsTab → Generator-Buttons
Frontend: POST /api/installations/:id/documents/generate {type: "schaltplan"|"lageplan"|"vollmacht"}
          POST /api/vde/generate/:id {forms: ["E1","E2","E3","E8"]}
Route: document.routes.ts / vdeFormular.routes.ts
Service: documentGenerator/index.ts → Orchestrator
Generatoren:
  - schaltplanGeneratorPython.ts → Python subprocess → A3 PDF
  - lageplan.ts → Satellitenbild + PV-Overlay → PDF
  - vollmacht.ts → PDFKit → A4 PDF mit Checkboxen
  - vde-pdf-service.ts → VDE E1/E2/E3/E8 PDFs (A4)
Input: Installation technicalData + wizardContext + Kundendaten
Output: PDF-Dateien in uploads/documents/
DB-Writes: documents (CREATE pro generiertes PDF)
Auch erreichbar von: /vde-formulare, /dokumente
```

### Kette #16: Kommentare
```
UI: TimelineTab → Notiz hinzufügen / Kommentar CRUD
Frontend: GET/POST /api/installations/:id/comments, PATCH/DELETE /comments/:id
Route: installationComments.routes.ts
Service: Inline
DB-Reads: comments (mit author Relation)
DB-Writes: comments (CREATE/UPDATE/DELETE)
Permission: canWriteComments, canDeleteComments (Rollen-basiert)
Auch genutzt von: /dashboard (Activity Feed liest comments)
```

### Kette #17: NB-Kommunikation
```
UI: KommunikationTab → Korrespondenz + NB-Stats
Frontend: GET /api/nb-communication/installation/:id
          GET /api/installations/:id/nb-stats (eigener Endpoint?)
          POST /api/nb-communication/send
Route: nbCommunication.routes.ts
Service: nbCommunication.service.ts
DB-Reads: nb_correspondences, installations, netzbetreiber
DB-Writes: nb_correspondences, email_logs
Externe: SMTP (Emails an NB)
Auch genutzt von: /ops-center
```

### Kette #18: Email-Versand
```
UI: EmailsTab → Composer + Templates
Frontend: POST /api/installations/:id/emails {to, subject, body, attachments}
          POST /api/installations/:id/emails/nb (an NB)
Route: emailSend.routes.ts
Service: emailSend.service.ts → emailGateway.service.ts
DB-Reads: installations (publicId, dedicatedEmail), email_templates
DB-Writes: sent_emails, email_logs
Externe: SMTP
Auch genutzt von: /emails (Email-Inbox)
```

### Kette #19: Bulk Delete
```
UI: EnterpriseList → Checkbox-Auswahl → "X löschen"
Frontend: POST /api/netzanmeldungen/bulk/remove {ids: [...]}
Route: netzanmeldungen.enterprise.routes.ts
Service: Inline
DB-Writes: installations (updateMany, SET deletedAt + deletedById)
Cache: Redis invalidiert (cacheInvalidatePattern)
Permission: NUR ADMIN
```

---

## 11. Generator-Inventar (erweitert)

| Generator | Typ | Backend-Pfad | Input | Output | Trigger | Aufgerufen von (Routes) | Seiten |
|-----------|-----|-------------|-------|--------|---------|------------------------|--------|
| Schaltplan | PDF (A3) | documentGenerator/schaltplanGeneratorPython.ts | technicalData, wizardContext | A3 PDF | Button (DocumentsTab) | document.routes | /netzanmeldungen |
| Lageplan | PDF | documentGenerator/lageplan.ts | GPS, Dachflächen | PDF mit Satellitenbild | Button (DocumentsTab) | document.routes | /netzanmeldungen |
| Vollmacht | PDF (A4) | documentGenerator/vollmacht.ts | Kundendaten, Checkboxen | A4 PDF | Button (DocumentsTab) | document.routes | /netzanmeldungen |
| VDE E1 | PDF | vde-pdf-service.ts | Installation + Signatur | VDE-AR-N 4105 E1 | Button / Auto | vdeFormular.routes | /netzanmeldungen, /vde-formulare |
| VDE E2 | PDF | vde-pdf-service.ts | Installation + Technische Daten | VDE-AR-N 4105 E2 | Button / Auto | vdeFormular.routes | /netzanmeldungen, /vde-formulare |
| VDE E3 | PDF | vde-pdf-service.ts | Speicher-Daten | VDE-AR-N 4105 E3 | Button (wenn Speicher) | vdeFormular.routes | /netzanmeldungen, /vde-formulare |
| VDE E8 | PDF | vde-pdf-service.ts | IBN-Daten + Signatur | VDE-AR-N 4105 E8 | Button / Auto | vdeFormular.routes | /netzanmeldungen, /vde-formulare |
| Invoice PDF | PDF (A4) | invoicePdf.service.ts | Rechnung + Kunde + Items | Premium A4 PDF | Auto (BEIM_NB) | autoInvoice → rechnung.routes | /netzanmeldungen (auto), /finanzen |
| Email (MJML) | HTML | emailTemplate.service.ts | Template + Variablen | HTML Email | Status-Change / Manual | emailSend.routes | /netzanmeldungen, /emails |
| Projektmappe | ZIP/PDF | documentGenerator/index.ts | Alle Dokumente | Gesamtpaket | Button (DocumentsTab) | document.routes | /netzanmeldungen |

---

## 12. Generatoren-Ketten (Trigger → Kaskade)

### Trigger: Status → BEIM_NB (wichtigste Kette)
```
1. netzanmeldungen.enterprise.routes POST /:id/status
   → prisma.installation.update({status: BEIM_NB, nbEingereichtAm: now})
   → prisma.statusHistory.create()

2. workflow.service.onStatusChange() [async]
   → Email-Template laden (NB_SUBMITTED)
   → Subunternehmer-Blockierung prüfen (5 Level)
   → WhiteLabel-Weiterleitung
   → Email senden an Kunde/Ersteller
   → recordLearningEvent()

3. autoInvoice.service.autoCreateAndSendInvoice() [async]
   → pricing.service.getInstallationPrice()
     → Paket-Check → Kundenpreis → Staffelpreis (199/149/129€)
   → nextInvoiceNumber() (RE-YYYYMM-XXXXX)
   → invoicePdf.service.renderInvoicePdf() → PDF auf Disk
   → paymentLink.service.createPaymentLink()
   → email.service.send("invoice") → Rechnung per Email
   → prisma.rechnung.create() + prisma.installation.update(rechnungGestellt=true)
   → prisma.document.create() (PDF als Dokument)

4. wsService.notifyStatusChanged() [async]
   → WebSocket broadcast an alle verbundenen Clients

5. inboxItemGenerator (bei bestimmten Transitions) [async]
   → prisma.inboxItem.create() → Aufgabe für Admin
```

### Trigger: Status → GENEHMIGT
```
1. prisma.installation.update({status: GENEHMIGT, nbGenehmigungAm: now})
2. prisma.statusHistory.create()
3. workflow.service → Email "Genehmigung erhalten"
4. inboxItemGenerator → "IBN vorbereiten" Aufgabe (HIGH)
5. workflowV2.automationEngine → Deadline "ibn_protocol" (30 Tage)
```

### Trigger: Status → FERTIG
```
1. prisma.installation.update({status: FERTIG, completedAt: now})
2. prisma.statusHistory.create()
3. workflow.service → Email "Anlage fertiggestellt"
4. Alle offenen InboxItems resolved
```

### Trigger: Dokument-Upload
```
1. multer → Datei auf Disk
2. prisma.document.create()
3. notifyDocumentUpload() [async]
   → Email an Ersteller (wenn Status ≠ EINGANG)
4. checkDocumentCompleteness() [optional]
   → Prüfe LAGEPLAN + SCHALTPLAN vorhanden
```

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /finanzen | /ops-center | /analytics | /hv-center |
|------------------|:---------:|:----------------:|:---------:|:-----------:|:----------:|:----------:|
| GET /installations | ✓ (Tasks) | | | ✓ | ✓ | ✓ |
| GET /netzanmeldungen/stats | | ✓ (Pipeline) | | | | |
| GET /netzanmeldungen/list | | ✓ (Hauptliste) | | | | |
| GET /netzanmeldungen/enterprise | | ✓ (Enhanced) | | | | |
| GET /netzanmeldungen/:id | | ✓ (Detail) | | ✓ | | ✓ |
| POST /netzanmeldungen/:id/status | | ✓ (Status) | | | | |
| PATCH /netzanmeldungen/:id/customer | | ✓ (Edit) | | | | |
| POST /netzanmeldungen/:id/grid-operator | | ✓ (NB-Zuordnung) | | | | |
| POST /netzanmeldungen/bulk/remove | | ✓ (Admin) | | | | |
| GET /dashboard/summary | ✓ (Pipeline) | | | | | |
| GET /dashboard/alerts | ✓ (Kunde) | | | | | |
| GET /dashboard/termine | ✓ (Kalender) | | | | | |
| GET /dashboard/activity-feed | ✓ (Feed) | | | | | |
| GET /v2/inbox/counts | ✓ (Actions) | ✓ (Badge) | | | | |
| GET /netzbetreiber/performance | ✓ (NB-Stats) | | | ✓ | ✓ | |
| GET /netzbetreiber | | ✓ (NB-Dropdown) | | ✓ | | |
| GET /:id/documents | | ✓ (DocumentsTab) | | | | |
| POST /:id/documents | | ✓ (Upload) | | | | |
| POST /:id/documents/generate | | ✓ (Generatoren) | | | | |
| POST /vde/generate/:id | | ✓ (VDE) | | | | ✓ ? |
| GET /:id/timeline | | ✓ (TimelineTab) | | | | |
| GET/POST /:id/comments | | ✓ (TimelineTab) | | | | |
| GET /:id/emails + POST | | ✓ (EmailsTab) | | | | |
| POST /:id/emails/nb | | ✓ (NB-Mail) | | | | |
| GET /email-templates | | ✓ (Composer) | | | | ✓ ? |
| GET /:id/tasks + CRUD | | ✓ (TasksTab) | | | | |
| GET /:id/correspondence | | ✓ (KommTab) | | ✓ | | |
| POST /nb-communication/send | | ✓ (NB-Mail) | | ✓ | | |
| GET /chat/installations/:id | | ✓ (ChatTab) | | | | |
| GET /whatsapp/installations/:id | | ✓ (WhatsAppTab) | | | | |
| workflow.service.onStatusChange() | | ✓ (Side Effect) | | | | |
| autoInvoice.service | | ✓ (bei BEIM_NB) | ✓ | | | |
| pricing.service | | ✓ (via autoInvoice) | ✓ | | | |
| invoicePdf.service | | ✓ (via autoInvoice) | ✓ | | | |
| documentGenerator/* | | ✓ (Generatoren) | | | | |
| vde-pdf-service | | ✓ (VDE-Forms) | | | | |
| emailSend.service | | ✓ (Versand) | | | | |
| emailGateway.service | | ✓ (SMTP) | | ✓ | | |
| nbCommunication.service | | ✓ (NB-Kontakt) | | ✓ | | |
| getVisibleKundeIds() | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## API-Endpunkte → DB-Tabellen (ERWEITERT)

| Endpoint | Route-Datei | DB-Tabellen (Read) | DB-Tabellen (Write) | Cache | Seiten |
|----------|-------------|-------------------|-------------------|-------|--------|
| GET /api/dashboard/summary | dashboard.routes | installations ×9 | — | Redis 60s | /dashboard |
| GET /api/dashboard/alerts | dashboard.routes | installations ×4 | — | nein | /dashboard |
| GET /api/dashboard/termine | dashboard.routes | projekt_termine, projekte | — | nein | /dashboard |
| GET /api/dashboard/activity-feed | dashboard.routes | status_history, comments | — | nein | /dashboard |
| GET /api/v2/inbox/counts | workflowV2.routes | inbox_items | — | nein | /dashboard, /netzanmeldungen |
| GET /api/installations | installation.routes | installations, rechnungen | — | Redis 60s | /dashboard, /hv-center |
| GET /api/netzbetreiber/performance | netzbetreiber.routes | netzbetreiber, installations ×41 | — | nein | /dashboard, /analytics |
| GET /api/netzanmeldungen/stats | enterprise.routes | installations ×11 | — | nein | /netzanmeldungen |
| GET /api/netzanmeldungen/list | enterprise.routes | installations ×2 | — | nein | /netzanmeldungen |
| GET /api/netzanmeldungen/enterprise | enterprise.routes | installations, rechnungen, users, kunden, netzbetreiber | — | nein | /netzanmeldungen |
| GET /api/netzanmeldungen/:id | enterprise.routes | installations (6 includes), rechnung | — | nein | /netzanmeldungen, /ops-center |
| POST /api/netzanmeldungen/:id/status | enterprise.routes | installations, documents | installations, status_history, rechnung, documents, email_logs | nein | /netzanmeldungen |
| PATCH /api/netzanmeldungen/:id/customer | enterprise.routes | installations, kunden | installations, kunden | nein | /netzanmeldungen |
| POST /api/netzanmeldungen/:id/grid-operator | enterprise.routes | installations, netzbetreiber | installations | nein | /netzanmeldungen |
| POST /api/netzanmeldungen/bulk/remove | enterprise.routes | installations | installations | Redis inv. | /netzanmeldungen |
| GET /api/installations/:id/documents | document.routes | documents | — | nein | /netzanmeldungen |
| POST /api/installations/:id/documents | document.routes | installations | documents, installations | nein | /netzanmeldungen |
| POST /api/installations/:id/documents/generate | document.routes | installations | documents | nein | /netzanmeldungen |
| GET /api/installations/:id/timeline | enterprise.routes | status_history, comments | — | nein | /netzanmeldungen |
| GET/POST /api/installations/:id/comments | comments.routes | comments, users | comments | nein | /netzanmeldungen |
| POST /api/installations/:id/emails | emailSend.routes | installations, email_templates | sent_emails, email_logs | nein | /netzanmeldungen |
| GET /:id/tasks | installation routes | tasks | tasks | nein | /netzanmeldungen |
| GET /:id/correspondence | nbCommunication.routes | nb_correspondences | — | nein | /netzanmeldungen, /ops-center |

---

## Zusammenhänge (Cross-Page) — ERWEITERT

### Installation-Status: 4× verschiedene Aggregation
- **/dashboard** `/summary`: COUNT × 6 für Pipeline (inline, Redis 60s)
- **/dashboard** `/alerts`: COUNT × 4 für Action Items (inline, kein Cache)
- **/netzanmeldungen** `/stats`: COUNT × 7 + AGGREGATE + 3 Extra-Counts (inline, kein Cache)
- **/netzanmeldungen** `/enterprise`: COUNT × 6 für KPIs (inline, kein Cache)
- **4 verschiedene Endpoints** zählen dieselben Status-Verteilungen mit leicht unterschiedlichen Filtern
- → KANDIDAT #1 für zentralen `installationStats.service.ts`

### Installation-Detail: 2× verschiedene Implementierung
- **/netzanmeldungen** `/netzanmeldungen/:id`: Enterprise-Route mit 6 includes + Rechnung
- **/dashboard** → `/installations/:id`: Ältere Route mit anderem Response-Shape
- Beide lesen dieselben Daten, formatieren sie unterschiedlich
- → KANDIDAT für zentralen `installationDetail.service.ts`

### Activity Feed = Timeline
- **/dashboard** `/activity-feed`: Merge aus status_history + comments (global, limitiert)
- **/netzanmeldungen** `/timeline`: Merge aus status_history + comments (pro Installation)
- Identisches Pattern, verschiedene Scopes
- → BESTÄTIGT: `activityFeed.service.ts` als Kandidat

### Status-Change Kaskade: Längste Chain im System
- POST status → DB Update → StatusHistory → Workflow-Emails → AutoInvoice → PDF → PaymentLink → Email → InboxItem → WebSocket
- **10 Side Effects** bei einer Status-Änderung zu BEIM_NB
- Alle async/fire-and-forget — kein Fehler stoppt den Haupt-Flow
- → Kritischster Punkt für Konsolidierung: Event-basierte Architektur

### Document-Generatoren: Einziger Zugang über /netzanmeldungen
- Alle 7 Generatoren werden nur vom DocumentsTab auf /netzanmeldungen getriggert
- VDE-Formulare auch über /vde-formulare erreichbar (eigene Seite)
- Auto-Generate bei bestimmten Status-Changes (über documentGenerator/index.ts)

### Subunternehmer-Blockierung: 5-Level-Prüfung bei JEDEM Email-Versand
- Wird im workflow.service beim Status-Change geprüft
- Manueller Email-Versand aus EmailsTab durchläuft dieselbe Prüfung
- → Zentrale Middleware statt in jedem Service einzeln

---

## Performance-Beobachtungen (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| /dashboard/summary | 11 | ✅ 60s | OK nach Cache |
| /netzbetreiber/performance | 41 | ❌ | ⚠️ KRITISCH: N+1 |
| /netzanmeldungen/stats | ~11 | ❌ | ⚠️ Gleiche Daten wie /dashboard/summary, kein Cache |
| /netzanmeldungen/enterprise | 5-8 | ❌ | ⚠️ Schwer: 6 includes + Rechnungen + KPIs |
| /netzanmeldungen/:id (Detail) | 2-3 | ❌ | ⚠️ 6 Relation-includes in einer Query |
| /netzanmeldungen/list | 2 | ❌ | OK (optimiert für Cursor) |
| POST /:id/status (BEIM_NB) | 2 + 10 async | ❌ | ⚠️ 10 Side-Effect-Services ohne Batching |

**Gesamt pro /netzanmeldungen Page-Load:** ~25 DB-Queries (stats + actionItems×3 + list + inbox/counts)
**Gesamt pro Detail-Panel Open:** ~10 DB-Queries (detail + documents + timeline + ggf. weitere Tabs)
**Gesamt Status-Change (BEIM_NB):** ~15 DB-Queries (2 direkt + ~13 async über Services)

---

---

## 13. Komponentenbaum: /vde-formulare (VDE 4105) + /vde-4110 (VDE 4110)

### VDE 4105 (/vde-formulare)
```
VDEFormularePage (pages/VDEFormularePage.tsx, 16 Z. — Wrapper)
└── VDEFormularWizard (features/netzanmeldungen/components/VDEFormularWizard/index.tsx, 718 Z.)
    ├── Step 1: Search — Installation-ID eingeben
    │   API: GET /api/vde/{id}/data
    │
    ├── Step 2: Review — Daten prüfen & editieren (4 Sektionen)
    │   ├── Anlagenanschrift (Name, Straße, PLZ/Ort, Tel, Email)
    │   ├── Anschlussnehmer (Name, Adresse)
    │   ├── Anlagenerrichter (Firma, Adresse, Eintragungsnr.)
    │   ├── Technische Daten (P_Amax, S_Amax, P_Agen, WR, Speicher)
    │   └── Formular-Auswahl: ☑ E1 ☑ E2 ☐ E3 (wenn Speicher) ☑ E8
    │
    ├── Step 3: Sign — Canvas-Signaturfeld
    │   API: POST /api/vde/sets/{id}/sign
    │
    ├── Step 4: Generate — PDF-Generierung
    │   API: POST /api/vde/{id}/create → POST /api/vde/sets/{id}/generate
    │   Output: E1, E2, E3?, E8 als Base64 PDFs
    │
    └── Step 5: Send — Email an NB
        API: POST /api/vde/sets/{id}/send
        Anhänge: VDE-PDFs + optional Vollmacht
```

### VDE 4110 (/vde-4110)
```
VDE4110FormularePage (pages/VDE4110FormularePage.tsx, 869 Z. — eigenständig)
├── Step 1: Search — Installation-ID ODER Public-ID ODER PartnerProject-ID
│   API: GET /api/vde4110/{id}/data
│   Besonderheit: Kann aus PartnerProject laden (source: "partner_project")
│
├── Step 2: Review — Daten prüfen & editieren (gleiche 4 Sektionen)
│   └── Formular-Auswahl: ☑ E1 ☑ E8 ☐ E10
│
├── Step 3: Sign — Canvas-Signaturfeld
│   API: POST /api/vde4110/sets/{id}/sign
│
├── Step 4: Generate — PDF-Generierung
│   API: POST /api/vde4110/{id}/create → POST /api/vde4110/sets/{id}/generate
│   Output: E1 (1 Seite), E8 (5 Seiten), E10? (2 Seiten)
│
└── Step 5: Send — Email an NB
    API: POST /api/vde4110/sets/{id}/send
```

**Schlüssel-Unterschied:** VDE 4105 nutzt eine Wizard-Komponente (718 Z.), VDE 4110 hat alles inline (869 Z.) — identischer Flow, duplizierter Code.

---

## 14. API-Ketten: /vde-formulare + /vde-4110

### Kette #20: VDE-Daten laden (4105)
```
UI: VDEFormularWizard Step 1 → Search
Frontend: GET /api/vde/{installationId}/data
Route: vdeFormular.routes.ts
Service: installationDataAssembler.ts → assembleInstallationData()
DB-Reads:
  - installations (findUnique mit kunde, netzbetreiber)
  - company_settings (Errichter-Daten: LeCa GmbH)
  - documents (findFirst WHERE kategorie LIKE '%vollmacht%')
DB-Writes: keine
Daten-Transformation: technicalData JSON → VdeInstallationData Interface
Cache: nein
Auch genutzt von: /netzanmeldungen (DocumentsTab → VDE-Generierung)
```

### Kette #21: VDE-Daten laden (4110 — mit PartnerProject)
```
UI: VDE4110FormularePage Step 1
Frontend: GET /api/vde4110/{id}/data
Route: vde4110Formular.routes.ts
Service: installationDataAssembler.ts ODER assemblePartnerProjectData() (inline)
DB-Reads:
  - installations (findUnique) ODER partner_projects (findFirst)
  - company_settings
  - documents ODER partner_documents (Vollmacht-Suche)
DB-Writes: keine
Besonderheit: 3-stufiger Lookup (numerisch → publicId → installationNumber)
Auch genutzt von: /partner-center (VDE für Partner-Projekte)
```

### Kette #22: FormularSet erstellen + Signatur
```
UI: Wizard Step 2→3 → "Weiter" Button
Frontend: POST /api/vde/{id}/create {formulare, edits}
          POST /api/vde/sets/{setId}/sign {signatur, vollmachtDocId}
Route: vdeFormular.routes.ts (4105) / vde4110Formular.routes.ts (4110)
Service: Inline
DB-Writes:
  - vde_formular_sets (CREATE: installationId/partnerProjectId, formulare[], edits, status=draft)
  - vde_formular_sets (UPDATE: signaturInstallateur, vollmachtDocId, status=signed)
  - Bei 4110+Partner: datenSnapshot als JSON gespeichert
Auch genutzt von: /netzanmeldungen (DocumentsTab VDE-Generierung)
```

### Kette #23: PDF-Generierung (KERN-GENERATOR)
```
UI: Wizard Step 4 → "Generieren" Button
Frontend: POST /api/vde/sets/{setId}/generate (4105)
          POST /api/vde4110/sets/{setId}/generate (4110)
Route: vdeFormular.routes.ts / vde4110Formular.routes.ts
Service: vde-pdf-service.ts (4105) / vde4110-pdf-service.ts (4110)
         + efkSignature.service.ts (Signatur-Embedding)

GENERATOR-CHAIN:
1. VdeFormularSet laden (edits, signatur, formulare)
2. Basisdaten assemblieren:
   - 4105: assembleInstallationData(installationId)
   - 4110: datenSnapshot || assemblePartnerProjectData()
3. User-Edits mergen: {...baseData, ...set.edits}
4. Für jedes Formular:
   - 4105: VDEPDFService.generateE1/E2/E3/E8WithSignature(data, signatur)
   - 4110: VDE4110PDFService.generateE1/E8/E10WithSignature(data, signatur)
5. pdf-lib: Template laden → Formfelder füllen → Signatur embedden → Buffer
6. Buffer → Datei schreiben (uploads/documents/{installationId}/)
7. Document/PartnerDocument Record erstellen
8. Optional: Vollmacht-Doc anhängen

DB-Reads: vde_formular_sets, installations, efk_signatures
DB-Writes: vde_formular_sets (UPDATE status=generated), documents/partner_documents (CREATE pro PDF)
Externe: Keine
Output: PDF-Buffers als Base64 + Document-Records
```

### Kette #24: Email an NB senden
```
UI: Wizard Step 5 → "Senden" Button
Frontend: POST /api/vde/sets/{setId}/send (4105)
          POST /api/vde4110/sets/{setId}/send (4110)
Route: vdeFormular.routes.ts / vde4110Formular.routes.ts
Service: emailGateway.service.ts → SMTP
DB-Reads:
  - vde_formular_sets, documents/partner_documents (generierte PDFs laden)
  - documents (Vollmacht wenn attachVollmacht=true)
DB-Writes:
  - vde_formular_sets (UPDATE status=sent, sentAt, sentTo)
  - email_logs (CREATE)
SMTP: Von "NETZANMELDUNG" (netzanmeldung@gridnetz.de)
Auch genutzt von: /netzanmeldungen (EmailsTab → POST /:id/emails/nb)
```

---

## 15. Generator Deep-Dive: VDE-System

### Generator-Architektur

```
                        ┌─────────────────────────────────┐
                        │    installationDataAssembler     │
                        │  (5 DB-Quellen → 1 Interface)   │
                        └───────────────┬─────────────────┘
                                        │
                        ┌───────────────┴─────────────────┐
                        │      VdeInstallationData        │
                        │   (~40 Felder, shared Interface) │
                        └───────┬──────────────┬──────────┘
                                │              │
                ┌───────────────┴──┐    ┌──────┴───────────────┐
                │  VDEPDFService   │    │  VDE4110PDFService   │
                │  (4105, 622 Z.)  │    │  (4110, 558 Z.)      │
                ├──────────────────┤    ├──────────────────────┤
                │ Template: 12p    │    │ Template: 38p, 1074  │
                │ Library: pdf-lib │    │ Library: pdf-lib      │
                │ Forms: E1,E2,    │    │ Forms: E1, E8 (5p),  │
                │   E3,E8          │    │   E10 (2p)           │
                └──────────────────┘    └──────────────────────┘
                        │                        │
                        └───────────┬────────────┘
                                    │
                        ┌───────────┴──────────────┐
                        │   EFK Signature Service   │
                        │  (PNG/JPEG → pdf-lib embed)│
                        └──────────────────────────┘
```

### VDE 4105 Generatoren (Detail)

| Formular | Funktion | Seiten | Pflichtfelder | Signatur |
|----------|----------|--------|--------------|----------|
| E.1 Antragstellung | generateE1WithSignature() | 1 | anlagenName, anlagenStrasse, anlagenPlzOrt, eigentName, errichterFirma, geplanterTermin | Anschlussnehmer |
| E.2 Datenblatt EZA | generateE2WithSignature() | 1 | wrHersteller, wrTyp, pAmax, sAmax, netzeinspeisung, ueberschuss/volleinspeisung | Anschlussnehmer |
| E.3 Datenblatt Speicher | generateE3WithSignature() | 1 | speicherHersteller, speicherTyp, speicherKapazitaetKwh, speicherKopplung | Errichter |
| E.8 IBN-Protokoll | generateE8WithSignature() | 1 | errichterFirma, pAmax, sAmax, pAgen, ibnDatum | Betreiber + Errichter |

### VDE 4110 Generatoren (Detail)

| Formular | Funktion | Seiten | Besonderheit |
|----------|----------|--------|-------------|
| E.1 Antragstellung | generateE1WithSignature() | 1 | Ähnlich 4105, aber MS-spezifische Felder |
| E.8 Datenblatt (5-teilig) | generateE8WithSignature() | 5 | S.1: Leistung, S.2: Transformator, S.3: WR-Details, S.4: Speicher, S.5: Checkliste |
| E.10 IBN-Protokoll | generateE10WithSignature() | 2 | Dual-Signatur (Errichter links, Betreiber rechts) |

### Frontend-Generatoren (Duplikate!)

| Datei | Zeilen | Library | Zweck |
|-------|--------|---------|-------|
| `features/.../services/vdeGenerator.ts` | 675 | **jsPDF** | Frontend-seitige PDF-Generierung (VDE 4105) |
| `lib/generators/VDEFormulareGenerator.ts` | 446 | **jsPDF** | Alternative Frontend-Generierung |
| `wizard/lib/pdf/VDEFormularePDF.ts` | 257 | **jsPDF** | Wizard-spezifischer VDE-Generator |
| `features/.../lib/pdf/VDEFormularePremium.ts` | 973 | **jsPDF** | Premium-Version mit erweiterten Layouts |

**⚠️ 4 Frontend-VDE-Generatoren + 2 Backend-VDE-Generatoren = 6 Generatoren total für dasselbe Ergebnis!**

---

## 16. Daten-Assembler: installationDataAssembler.ts (259 Z.)

### 5 Datenquellen → 1 Interface

| Quelle | Tabelle | Felder | Priorität |
|--------|---------|--------|-----------|
| 1. Installation | installations | customerName, strasse, plz, ort, contactPhone, contactEmail, technicalData (JSON) | Basis |
| 2. Kunde | kunden (via kundeId) | firmenName, name, strasse, plz, ort, telefon, email | Fallback für Eigentümer |
| 3. Netzbetreiber | netzbetreiber (via netzbetreiberId) | name, email | NB-Kontakt |
| 4. CompanySettings | company_settings | legalName, street, zip, city, phone, email, registrationNumber | Errichter (immer LeCa) |
| 5. technicalData | installations.technicalData (JSON) | inverterEntries, batteryEntries, pvEntries, totalPvKwp, feedInType, betreiber-Override | Technik |

### Feld-Mapping (Schlüssel-Transformationen)

```
anlagenName    ← installation.customerName || kunde.firmenName || kunde.name
pAmax          ← inverter[0].leistungKw || totalKwp
sAmax          ← inverter[0].powerKva || totalInverterKva || pAmax
pAgen          ← totalKwp (PV-Modul-Summe)
wrHersteller   ← wechselrichter[0].hersteller (5+ verschiedene JSON-Pfade!)
speicherKwh    ← battery.kapazitaetKwh || battery.capacityKwh || totalBatteryKwh
volleinspeisung ← feedInType === "volleinspeisung"
errichterFirma ← settings.legalName + ", Hartmut Bischoff" (HARDCODED!)
```

### technicalData JSON-Formate (3 verschiedene!)

1. **Wizard-Format**: `{ inverterEntries: [{hersteller, modell, leistungKw}], batteryEntries: [...] }`
2. **Legacy-Format**: `{ inverters: [{manufacturer, model, powerKva}], storage: {...} }`
3. **Flat-Format**: `{ totalKwp: 10.5, wrHersteller: "Fronius", speicherKwh: 5.12 }`

Der Assembler versucht alle 3 Formate zu parsen und normalisiert auf ein einheitliches `VdeInstallationData` Interface.

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-formulare | /vde-4110 | /partner-center |
|------------------|:---------:|:----------------:|:-------------:|:---------:|:--------------:|
| GET /installations | ✓ | ✓ | | | |
| GET /netzanmeldungen/stats | | ✓ | | | |
| GET /netzanmeldungen/:id | | ✓ | | | |
| POST /:id/status | | ✓ | | | |
| GET /vde/{id}/data | | ✓ (DocTab) | ✓ (Step 1) | | |
| POST /vde/{id}/create | | ✓ (DocTab) | ✓ (Step 2) | | |
| POST /vde/sets/{id}/sign | | ✓ (DocTab) | ✓ (Step 3) | | |
| POST /vde/sets/{id}/generate | | ✓ (DocTab) | ✓ (Step 4) | | |
| POST /vde/sets/{id}/send | | ✓ (DocTab?) | ✓ (Step 5) | | |
| GET /vde4110/{id}/data | | | | ✓ (Step 1) | ✓ ? |
| POST /vde4110/{id}/create | | | | ✓ (Step 2) | |
| POST /vde4110/sets/{id}/generate | | | | ✓ (Step 4) | |
| POST /vde4110/sets/{id}/send | | | | ✓ (Step 5) | |
| vde-pdf-service (4105) | | ✓ (DocGen) | ✓ | | |
| vde4110-pdf-service (4110) | | | | ✓ | ✓ |
| installationDataAssembler | | ✓ (DocGen) | ✓ | ✓ | |
| efkSignature.service | | ✓ (DocGen) | ✓ | ✓ | |
| emailGateway.service | | ✓ | ✓ (Send) | ✓ (Send) | |
| documentGenerator/index.ts | | ✓ (Auto) | | | |

---

## API-Endpunkte (ERWEITERT)

| Endpoint | Route-Datei | DB-Tabellen | Seiten |
|----------|-------------|-------------|--------|
| GET /api/vde/:id/data | vdeFormular.routes | installations, kunden, netzbetreiber, company_settings, documents | /vde-formulare, /netzanmeldungen |
| POST /api/vde/:id/create | vdeFormular.routes | vde_formular_sets (W) | /vde-formulare, /netzanmeldungen |
| GET /api/vde/:id/sets | vdeFormular.routes | vde_formular_sets | /vde-formulare |
| POST /api/vde/sets/:id/sign | vdeFormular.routes | vde_formular_sets (W) | /vde-formulare |
| POST /api/vde/sets/:id/generate | vdeFormular.routes | vde_formular_sets (W), documents (W), efk_signatures | /vde-formulare, /netzanmeldungen |
| GET /api/vde/sets/:id/preview/:type | vdeFormular.routes | vde_formular_sets, installations | /vde-formulare |
| POST /api/vde/sets/:id/send | vdeFormular.routes | vde_formular_sets (W), documents, email_logs (W) | /vde-formulare |
| GET /api/vde4110/:id/data | vde4110Formular.routes | installations, partner_projects, company_settings | /vde-4110, /partner-center |
| POST /api/vde4110/:id/create | vde4110Formular.routes | vde_formular_sets (W) | /vde-4110 |
| POST /api/vde4110/sets/:id/generate | vde4110Formular.routes | vde_formular_sets (W), documents/partner_documents (W) | /vde-4110 |
| POST /api/vde4110/sets/:id/send | vde4110Formular.routes | vde_formular_sets (W), email_logs (W) | /vde-4110 |
| POST /api/vde-generator/extract | vde_generator.routes | — (Legacy, hardcoded Batterie-DB) | Legacy |
| POST /api/vde-generator/generate/:id | vde_generator.routes | installations | Legacy |

---

## Zusammenhänge (ERWEITERT)

### VDE-Generatoren: 6-fache Duplikation ⚠️ KRITISCH
- **Backend 4105**: `vde-pdf-service.ts` (622 Z., pdf-lib, Template-basiert)
- **Backend 4110**: `vde4110-pdf-service.ts` (558 Z., pdf-lib, Template-basiert)
- **Frontend 1**: `vdeGenerator.ts` (675 Z., jsPDF, programmatisch)
- **Frontend 2**: `VDEFormulareGenerator.ts` (446 Z., jsPDF, programmatisch)
- **Frontend 3**: `VDEFormularePDF.ts` (257 Z., jsPDF, Wizard-Wrapper)
- **Frontend 4**: `VDEFormularePremium.ts` (973 Z., jsPDF, Premium-Layout)
- **Gesamt: ~3.500 Zeilen Code für VDE-PDF-Generierung, davon ~2.350 Frontend-Duplikate**
- → KANDIDAT #1 für Konsolidierung: Nur Backend-Generatoren behalten, Frontend ruft API

### VDE 4105 vs 4110 Frontend: Code-Duplikation
- `VDEFormularWizard/index.tsx` (718 Z.) und `VDE4110FormularePage.tsx` (869 Z.) haben identischen 5-Schritt-Flow
- Gleiche EditableField-Logik, gleiche Signatur-Integration, gleiche Email-Vorlage
- → Sollte EIN Wizard mit Konfiguration sein (4105/4110 als Parameter)

### documentGenerator/index.ts: Orchestriert VDE + Rest
```
documentGenerator/index.ts
  ├── VDEPDFService → E1, E2, E3?, E8 (4105 nur)
  ├── schaltplanGeneratorPython → Schaltplan A3
  ├── vollmacht.ts → Vollmacht PDF
  └── lageplan.ts → Lageplan PDF

Aufrufer:
  1. /netzanmeldungen DocumentsTab "Alle Dokumente generieren" → documentGenerator
  2. /vde-formulare → VDE direkt (NICHT über documentGenerator!)
  3. /vde-4110 → VDE4110 direkt
  4. nbResponseOrchestrator → VDE Auto-Generate bei Rückfrage-Resolve
  5. nbResolveEngine → VDE Re-Generate bei Schaltplan-Korrektur
```

### Shared Data Assembler
- `installationDataAssembler.ts` wird von ALLEN VDE-Routen + documentGenerator + nbResolveEngine genutzt
- Ist der **einzige Punkt** der Installation + Kunde + NB + CompanySettings + TechnicalData zusammenführt
- → Zentraler Service, darf nicht dupliziert werden

### EFK-Signatur: Zentrale Verwaltung
- `efkSignature.service.ts` verwaltet Signaturen (DB: `efk_signatures`)
- Genutzt von: VDE 4105 + VDE 4110 + nbResolveEngine (Auto-Resolve)
- Default-Signatur wird automatisch eingesetzt wenn keine explizite gewählt

### technicalData JSON: 3 Formate → 1 Assembler
- Wizard-Format, Legacy-Format, Flat-Format
- Der Assembler muss alle 3 verstehen → Fragil, Error-Prone
- → KANDIDAT für Migration: Alle Installationen auf ein Format normalisieren

---

## 17. Generator-Abhängigkeiten (NEU)

### Vollständige Generator-Landkarte

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GENERATOREN                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VDE 4105 (Backend)              VDE 4110 (Backend)                         │
│  ┌──────────────────┐           ┌──────────────────┐                        │
│  │ vde-pdf-service   │           │ vde4110-pdf-svc  │                        │
│  │ E1, E2, E3, E8    │           │ E1, E8(5p), E10  │                        │
│  │ pdf-lib + Template│           │ pdf-lib + Template│                        │
│  │ 622 Zeilen        │           │ 558 Zeilen        │                        │
│  └────────┬─────────┘           └────────┬─────────┘                        │
│           │                              │                                   │
│           └──────────┬───────────────────┘                                   │
│                      │                                                       │
│           ┌──────────┴───────────┐                                          │
│           │installationData      │                                          │
│           │Assembler (259 Z.)    │ ← SHARED: 5 DB-Quellen → 1 Interface    │
│           └──────────┬───────────┘                                          │
│                      │                                                       │
│           ┌──────────┴───────────┐                                          │
│           │efkSignature.service  │ ← SHARED: Signatur-Embedding            │
│           │(226 Z.)              │                                          │
│           └──────────────────────┘                                          │
│                                                                             │
│  Schaltplan (Backend)            Lageplan (Backend)                          │
│  ┌──────────────────┐           ┌──────────────────┐                        │
│  │ schaltplanGen     │           │ lageplan.ts       │                        │
│  │ Python (reportlab)│           │ Satellitenbild    │                        │
│  │ A3 Querformat     │           │ + PV-Overlay      │                        │
│  └──────────────────┘           └──────────────────┘                        │
│                                                                             │
│  Vollmacht (Backend)             Invoice PDF (Backend)                      │
│  ┌──────────────────┐           ┌──────────────────┐                        │
│  │ vollmacht.ts      │           │ invoicePdf.svc    │                        │
│  │ PDFKit, Checkboxen│           │ PDFKit, A4 Premium│                        │
│  └──────────────────┘           └──────────────────┘                        │
│                                                                             │
│  VDE Frontend (4× DUPLIKATE!)    Email Templates                            │
│  ┌──────────────────┐           ┌──────────────────┐                        │
│  │ vdeGenerator.ts   │ 675Z     │ emailTemplate.svc │                        │
│  │ VDEFormGen.ts     │ 446Z     │ MJML + Handlebars │                        │
│  │ VDEFormPDF.ts     │ 257Z     │                    │                        │
│  │ VDEPremium.ts     │ 973Z     │                    │                        │
│  │ = 2351 Z. jsPDF   │           │                    │                        │
│  └──────────────────┘           └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘

AUFRUFER:
  /vde-formulare ──────────────→ VDE 4105 (Backend)
  /vde-4110 ───────────────────→ VDE 4110 (Backend)
  /netzanmeldungen DocumentsTab → VDE 4105 (Backend) ODER Frontend-Gen
  /netzanmeldungen DocGen Auto  → documentGenerator/index.ts → VDE 4105
  nbResponseOrchestrator ──────→ VDE 4105 (Auto bei Rückfrage)
  nbResolveEngine ─────────────→ Schaltplan (Re-Generate bei Korrektur)
  autoInvoice ─────────────────→ Invoice PDF
  netzanfrage.service ─────────→ Email Template + VDE als Anhang
```

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| GET /vde/:id/data | 4-5 | ❌ | OK, wenige Queries |
| POST /vde/sets/:id/generate | 3-4 + PDF-Gen | ❌ | CPU-intensiv (pdf-lib) |
| POST /vde4110/sets/:id/generate | 3-4 + PDF-Gen | ❌ | CPU-intensiv (38-Seiten-Template) |
| GET /vde/:id/sets | 1 | ❌ | Leichtgewichtig |
| /vde-generator/* (Legacy) | 1-2 | ❌ | Hardcoded Batterie-DB |

---

---

## 18. Komponentenbaum: /nb-wissen + /netzbetreiber

### /nb-wissen (Knowledge Base)
```
NbWissenPage (pages/NbWissenPage.tsx, 1692 Z.)
├── Suchleiste (Echtzeit-Filter nach NB-Name)
│
├── NbCard ×N (pro Netzbetreiber)
│   ├── Header: Name, Email, Website, Portal-Link
│   ├── KPI-Bar: Installationen, Erfolgsquote, Ø Bearbeitung, Sofort-Freigabe, Rückfrage-Rate, Genehmigungstyp
│   │
│   └── [Expandable Details]
│       ├── Intelligence-Sektionen (ReadOnly)
│       │   ├── Bearbeitungszeiten (Min/Median/Max)
│       │   ├── Typische Rückfragen + Häufigkeit
│       │   ├── Praktische Tipps + Confidence
│       │   ├── Ablehnungsgründe
│       │   ├── Status-Verteilung der Installationen
│       │   └── Letzte Korrespondenzen (max 5)
│       │
│       ├── TAB-Management (Admin only)
│       │   ├── PDF-Upload (50MB limit)
│       │   ├── AI-Analyse (async, WebSocket-Update)
│       │   └── TabSummaryView: Titel, Geltungsbereich, Pflichtdokumente, Messkonzepte, Kernregeln, Fristen
│       │
│       ├── Workflow-Editor (Admin only)
│       │   ├── Tab: Einreichung (Methode, Email, Betreff-Format, Pflichtdokumente, Follow-Up-Schwelle)
│       │   ├── Tab: IBN (Methode, Portal-URL, Schritte, Dokumente, Zählerantrag, MaStR-Pflicht)
│       │   ├── Tab: Kommunikation (Tonalität, Anrede, Grußformel, Sprachbesonderheiten, Kontakte)
│       │   └── Tab: Few-Shot (5 Typen: Rückfrage, Genehmigung, Eingangsbestätigung, Nachhaken, Ablehnung)
│       │
│       └── Notizen (Freitext)

API: GET /api/nb-wissen (Haupt-Datenladen)
     POST /api/nb-wissen/:nbId/tab-upload (TAB-Upload)
     POST /api/nb-wissen/:nbId/tab-analyze/:docId (TAB re-analysieren)
     DELETE /api/nb-wissen/:nbId/tab/:docId (TAB löschen)
     PATCH /api/netzbetreiber/:nbId/workflow (Workflow speichern)
     GET/POST/PUT/DELETE /api/netzbetreiber/:nbId/few-shot-examples (CRUD)
WebSocket: tab:analyzed, tab:analysis_failed
```

### /netzbetreiber (Management Center)
```
NetzbetreiberCenterPage (pages/NetzbetreiberCenterPage.tsx, 1784 Z.)
├── Toolbar: Suche, Filter (aktiv/inaktiv), Import-Button, View-Toggle (Liste/Grid)
├── NB-Liste (Master-Detail Layout)
│   └── NB-Card ×N: Name, Email, PLZ-Bereiche, Installation-Count, Aktiv-Badge
├── NB-Detail-Panel
│   ├── Tab: Übersicht (Stammdaten, Kontakt, Portal)
│   ├── Tab: Zugangsdaten (AES-256 verschlüsselt)
│   ├── Tab: Installationen (Zugeordnete Installationen)
│   └── Tab: PLZ-Bereiche (PLZ-Mapping + VNBdigital-Lookup)
├── Import-Dialog (CSV/JSON Bulk-Import)
└── PLZ-Lookup-Dialog (Debug: welcher NB für welche PLZ)

API: GET /api/netzbetreiber (Liste)
     POST /api/netzbetreiber (Erstellen)
     PUT/PATCH /api/netzbetreiber/:id (Bearbeiten)
     DELETE /api/netzbetreiber/:id (Löschen)
     POST /api/netzbetreiber/import (Bulk-Import)
     GET /api/netzbetreiber/by-plz/:plz (PLZ-Lookup + VNBdigital)
     POST /api/netzbetreiber/auto-assign (Auto-Zuordnung)
     GET /api/netzbetreiber/performance (Performance-Stats)
     GET/POST/PATCH/DELETE /api/credentials (Zugangsdaten CRUD)
```

---

## 19. API-Ketten: /nb-wissen

### Kette #25: NB-Wissensbasis laden
```
UI: NbWissenPage → useEffect/fetch
Frontend: GET /api/nb-wissen
Route: nbWissen.routes.ts
Service: Inline (kein separater Service)
DB-Reads (PARALLEL, pro NB):
  - installations (distinct netzbetreiberId, filtered by visibleKundeIds)
  - netzbetreiber (findMany, 40+ Felder inkl. Workflow-Daten)
  - evu_profiles (successRate, avgProcessingDays, commonIssues, tips)
  - grid_operator_intelligence (documentRequirements, rejectionReasons)
  - nb_correspondences (findMany TAKE 5 pro NB, ORDER BY sentAt DESC)
  - evu_learning_logs (findMany TAKE 10 pro NB)
  - nb_tab_documents (findMany, summary JSON)
DB-Writes: keine
Cache: nein ⚠️ (7 Tabellen, potenziell schwer bei vielen NB)
Rollen-Filter: getVisibleKundeIds() → nur NB die der User "sieht"
Auch genutzt von: Nur /nb-wissen
```

### Kette #26: TAB-PDF Upload + AI-Analyse
```
UI: NbCard → "TAB-PDF hochladen" → File-Input
Frontend: POST /api/nb-wissen/:nbId/tab-upload (FormData)
Route: nbWissen.routes.ts
Service: Inline + analyzeTabPdf() (async, OpenAI)
DB-Writes:
  - nb_tab_documents (CREATE: filename, filePath, fileSize)
Storage: uploads/TAB/nb_{nbId}/
Side Effects:
  - analyzeTabPdf(docId) → OpenAI GPT-4o → Extraktion von: Pflichtdokumente, Messkonzepte, Kernregeln, Fristen, Besonderheiten
  - WebSocket broadcast: tab:analyzed / tab:analysis_failed
DB-Writes (nach Analyse): nb_tab_documents (UPDATE: summary JSON, analyzedAt)
Externe API: OpenAI GPT-4o
```

### Kette #27: Workflow-Daten speichern
```
UI: WorkflowEditForm → "Workflow speichern"
Frontend: PATCH /api/netzbetreiber/:nbId/workflow
Route: netzbetreiber.routes.ts
Service: Inline
DB-Writes:
  - netzbetreiber (UPDATE: 20+ Felder)
    einreichMethode, einreichEmail, einreichBetreffFormat, pflichtDokumente (JSON),
    antwortKanal, nachhakSchwelleTage, eskalationSchwelleTage,
    ibnMethode, ibnPortalUrl, ibnSchritte (JSON), ibnDokumente (JSON),
    zaehlerantragFormularUrl, mastrVorIbn,
    tonalitaet, anrede, grussformel, sprachBesonderheiten (JSON), kontakte (JSON), notizen
Cache: nein
Auch genutzt von: Nur /nb-wissen
```

### Kette #28: Few-Shot Examples CRUD
```
UI: FewShotEditInline → Create/Edit/Delete
Frontend: GET/POST/PUT/DELETE /api/netzbetreiber/:nbId/few-shot-examples
Route: netzbetreiber.routes.ts
Service: Inline
DB-Reads/Writes: few_shot_examples (CRUD)
Felder: typ (rueckfrage|genehmigung|eingangsbestaetigung|nachhaken|ablehnung), eingehend, analyse, antwort, rating (1-5)
Auch genutzt von: emailAutomation.service (liest Few-Shots für Prompt-Anreicherung)
```

### Kette #29: PLZ-Lookup mit VNBdigital
```
UI: NetzbetreiberCenterPage → PLZ-Suche
Frontend: GET /api/netzbetreiber/by-plz/:plz
Route: netzbetreiber.routes.ts
Service: Inline + vnbdigital.service.ts (Fallback)
DB-Reads:
  - netzbetreiber (WHERE plzBereiche @> plz)
  - Falls nicht gefunden: VNBdigital GraphQL API
Externe API: https://www.vnbdigital.de/gateway/graphql (öffentlich)
Cache: VNBdigital 24h Map-Cache
Auch genutzt von: /netzanmeldungen (NB-Zuordnung), netzanfrage.service (VNB-Email Lookup)
```

---

## 20. Knowledge Flow Map: Netzbetreiber-Wissen (NEU)

### Quellen (wer SCHREIBT NB-Wissen):

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHREIBER → NB-WISSEN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MANUELL:                                                        │
│  /nb-wissen UI ─────→ netzbetreiber (Workflow-Felder, 20+)      │
│  /nb-wissen UI ─────→ few_shot_examples (CRUD)                  │
│  /nb-wissen UI ─────→ nb_tab_documents (Upload + AI-Analyse)    │
│  /netzbetreiber UI ─→ netzbetreiber (Stammdaten CRUD)           │
│  /netzbetreiber UI ─→ netzbetreiber_credentials (AES-256)       │
│                                                                  │
│  AUTOMATISCH (Learning):                                         │
│  nbLearning.service ──→ evu_profiles (Stats-Aggregation)        │
│  nbLearning.service ──→ nb_complaint_patterns (Cross-Learning)  │
│  nbLearning.service ──→ netzbetreiber.avgResponseDays           │
│  evuLearning.service ─→ evu_profiles (Genehmigungsanalyse)      │
│  nbCommunication.svc ─→ nb_correspondences (Korrespondenz-Log)  │
│  nbCommunication.svc ─→ netzbetreiber.avgResponseDays           │
│  emailMatcher.service ─→ nb_domain_mappings (Domain-Erweiterung)│
│                                                                  │
│  EXTERN:                                                         │
│  vnbdigital.service ──→ netzbetreiber (Enrichment: Email,       │
│                          Website, Telefon, vnbDigitalId)         │
│  TAB-AI-Analyse ──────→ nb_tab_documents.summary (GPT-4o)       │
│                                                                  │
│  RAG AUTO-REINDEX (alle 60 Min):                                │
│  indexingService ─────→ pgvector (NETZBETREIBER, EVU_PROFILES,  │
│                          NB_CORRESPONDENCE Kategorien)           │
└─────────────────────────────────────────────────────────────────┘
```

### Speicher (NB-Wissens-Tabellen):

| Tabelle | Einträge | Typ | Schlüssel-Felder |
|---------|----------|-----|-----------------|
| `netzbetreiber` | 787 | Stamm + Workflow | name, email, portalUrl, plzBereiche, avgResponseDays, einreichMethode, pflichtDokumente, tonalitaet, kontakte |
| `evu_profiles` | ~200 | Lern-Statistiken | successRate, avgProcessingDays, rueckfrageRate, commonIssues, tips |
| `nb_complaint_patterns` | ~500 | Cross-Learning | netzbetreiberId + complaintType + pattern → frequency, suggestedFix |
| `nb_tab_documents` | ~50 | TAB-Analysen | summary JSON (Pflichtdokumente, Messkonzepte, Kernregeln) |
| `few_shot_examples` | ~100 | Prompt-Training | typ, eingehend, analyse, antwort, rating |
| `grid_operator_intelligence` | ~200 | Dokument-Anforderungen | documentRequirements, rejectionReasons, approvalRate |
| `nb_correspondences` | ~2000 | Korrespondenz-Log | type, subject, responseType, sentAt |
| `nb_domain_mappings` | ~50 | Email→NB | domain → netzbetreiberId |
| `nb_form_mappings` | ~30 | Portal-Formulare | portalUrl, formFields, selectorMap |
| `nb_portal_configs` | ~10 | Portal-Automatisierung | credentials, pollingConfig |
| `netzbetreiber_credentials` | ~20 | Zugangsdaten | AES-256 verschlüsselt |

### Konsumenten (wer LIEST NB-Wissen — 27+ Dateien!):

| Konsument | Tabellen gelesen | Zweck |
|-----------|-----------------|-------|
| **/nb-wissen** UI | ALLE 11 Tabellen | Zentrale Anzeige + Verwaltung |
| **/netzbetreiber** UI | netzbetreiber, credentials | Stammdaten-Management |
| **/netzanmeldungen** EnterpriseList | netzbetreiber (Name für Liste) | NB-Spalte in Tabelle |
| **/netzanmeldungen** DetailPanel OverviewTab | netzbetreiber (Name, Email, Portal) | NB-Card im Detail |
| **/netzanmeldungen** DetailPanel KommTab | nb_correspondences, netzbetreiber | NB-Korrespondenz |
| **/netzanmeldungen** Status-Change | netzbetreiber (via workflow.service) | Email-Template-Auswahl |
| **/dashboard** NB-Performance | evu_profiles, netzbetreiber | Performance-Stats |
| **/vde-formulare** | netzbetreiber (Email für Versand) | NB-Email im Send-Step |
| emailMatcher.service | nb_domain_mappings → netzbetreiber | Email → Installation Matching |
| netzanfrage.service | netzbetreiber (Email, Name) | Netzanfrage-Versand |
| nbCommunication.service | netzbetreiber (Email, reminderDays) | Reminder-Emails |
| nbResponseOrchestrator | netzbetreiber (via Installation) | Rückfrage-Resolve |
| nbResolveEngine | nb_complaint_patterns | Pattern-basierte Resolve-Hints |
| nbComplaintParser | nb_complaint_patterns | Prompt-Anreicherung |
| predictionEngine.service | evu_profiles, netzbetreiber | Bearbeitungszeit-Vorhersagen |
| emailAutomation.service | few_shot_examples, evu_profiles | Prompt-Anreicherung |
| emailEscalation.service | netzbetreiber (nachhakSchwelleTage) | Eskalations-Timing |
| nbLearning.service | evu_profiles (Read+Write) | Stats-Berechnung |
| evuLearning.service | evu_profiles (Read+Write) | Lern-Aggregation |
| installationAI.service | evu_profiles | AI-Vorschläge |
| claudeBot.service | netzbetreiber (WhatsApp-Kontext) | WhatsApp-Antworten |
| netzbetreiberMatcher.ts | netzbetreiber (plzBereiche) | PLZ→NB Auto-Matching |
| vnbdigital.service | netzbetreiber (vnbDigitalId) | Enrichment-Sync |
| nbPortalAutomation | nb_portal_configs, credentials | Portal-Polling |
| RAG indexingService | netzbetreiber, evu_profiles, nb_correspondences | 25.314 Embeddings |
| RAG enterpriseRagService | pgvector (3 NB-Kategorien) | AI-Context für alle Services |

### RAG-Index (NB-Daten in pgvector):

| RAG-Kategorie | DB-Quelle | Indexierte Felder | Embeddings |
|--------------|-----------|------------------|-----------|
| NETZBETREIBER | netzbetreiber | name, kurzname, bdewCode, email, telefon, website, portalUrl, portalHinweise, plzBereiche, avgResponseDays, reminderDays | ~787 |
| EVU_PROFILES | evu_profiles + netzbetreiber | totalSubmissions, successRate, avgProcessingDays, commonIssues, tips | ~200 |
| NB_CORRESPONDENCE | nb_correspondences | type, subject, bodyPreview, sentAt, responseType, responseNote | ~1000 |

**RAG-Konsumenten (AI-Services die NB-Wissen via RAG erhalten):**
- claudeAI.service → `getSmartContext()` für Email-Generierung
- emailAutoreply.service → `getSmartContext()` für Auto-Replies
- nbResolveEngine → `getSmartContext()` für Resolve-Kontext
- openai.service → `getSmartContext()` für Chat

**⚠️ RAG-LÜCKE:** `few_shot_examples` und `nb_tab_documents` sind NICHT im RAG indexiert! Die TAB-Analysen und Few-Shot-Trainings-Daten fließen nicht in die AI-Services.

---

## 21. Hardcodiertes NB-Wissen (sollte zentralisiert werden)

| Was | Wo | Sollte wohin |
|-----|-----|-------------|
| Portal-URLs (StromnetzBerlin, Westnetz, energis) | emailPipeline.service.ts:24, nbPortalProxy | netzbetreiber.portalUrl |
| Domain-Mapping "westnetz.de" | emailRouter.ts:45, seedNbDomainMappings.ts | nb_domain_mappings (DB) |
| StromnetzBerlin Service (727 Z.) | services/nbPortal/stromnetzBerlin.ts | nbPortalConfig (DB-basiert) |
| noreply@-Erkennung | nbResponseOrchestrator, emailPipeline | OK hardcoded (systemweit) |
| Admin User ID 4 | nbResponseOrchestrator | OK hardcoded (System-User) |
| VDE Standard-Set ["E1","E2","E3","E8"] | nbResponseOrchestrator | OK hardcoded (VDE-Norm) |
| 24h Cooldown für NB-Reminders | nbCommunication.service | netzbetreiber.reminderCooldownHours (DB) |
| Errichter "LeCa GmbH & Co KG, Hartmut Bischoff" | vde4110Formular.routes, installationDataAssembler | company_settings (DB) |
| Batterie-DB (8 Hersteller) | vde_generator.routes.ts | produkte-Tabelle (DB) |

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-formulare | /vde-4110 | /nb-wissen | /netzbetreiber |
|------------------|:---------:|:----------------:|:-------------:|:---------:|:----------:|:-------------:|
| GET /nb-wissen | | | | | ✓ (Alles) | |
| POST /nb-wissen/:id/tab-upload | | | | | ✓ (TAB) | |
| PATCH /netzbetreiber/:id/workflow | | | | | ✓ (Workflow) | |
| GET/CRUD /few-shot-examples | | | | | ✓ (CRUD) | |
| GET /netzbetreiber | | ✓ (Dropdown) | | | | ✓ (Liste) |
| POST/PUT/DELETE /netzbetreiber | | | | | | ✓ (CRUD) |
| GET /netzbetreiber/by-plz/:plz | | ✓ (Auto-Assign) | | | | ✓ (PLZ-Lookup) |
| GET /netzbetreiber/performance | ✓ | | | | | ✓ |
| GET/CRUD /credentials | | | | | | ✓ (Zugang) |
| netzbetreiber (DB-Tabelle) | ✓ (perf) | ✓ (NB-Card) | ✓ (Email) | ✓ (Email) | ✓ (Alles) | ✓ (CRUD) |
| evu_profiles (DB) | ✓ (perf) | | | | ✓ (Stats) | |
| nb_complaint_patterns (DB) | | ✓ (Resolve) | | | ✓ (Anzeige) | |
| nb_correspondences (DB) | | ✓ (KommTab) | | | ✓ (Historie) | |
| few_shot_examples (DB) | | ✓ (AI-Prompt) | | | ✓ (CRUD) | |
| nb_tab_documents (DB) | | | | | ✓ (TAB) | |
| RAG: NETZBETREIBER | | ✓ (AI-Ctx) | | | | |
| RAG: EVU_PROFILES | | ✓ (AI-Ctx) | | | | |
| RAG: NB_CORRESPONDENCE | | ✓ (AI-Ctx) | | | | |

---

## Zusammenhänge (ERWEITERT)

### NB-Wissen: Zentralste Wissensquelle mit 27+ Konsumenten
- Die `netzbetreiber`-Tabelle wird von **27 verschiedenen Dateien** gelesen
- Aber nur von **3 Stellen** geschrieben: /netzbetreiber UI, /nb-wissen Workflow-Editor, vnbdigital Enrichment
- → Sehr gutes Write-Read-Verhältnis (zentrale Quelle), aber kein Service-Layer dazwischen

### Learning-Loop: Automatische Wissenserweiterung
```
Installation abgeschlossen (Status FERTIG)
  → nbLearning.service: Aggregiert Stats (Median/P75/P90 Tage, Rückfrage-Rate)
  → evuProfile: UPSERT (automatisch)
  → RAG Auto-Reindex (alle 60 Min)
  → AI-Services nutzen aktualisiertes Wissen

NB-Rückfrage resolved (NbResponseTask SENT)
  → nbLearning.learnFromResolvedTask()
  → nb_complaint_patterns: UPSERT (Frequency + suggestedFix)
  → nbResolveEngine: Nutzt Patterns beim nächsten Resolve
```

### RAG-Lücke: 2 Wissensquellen nicht indexiert
1. **few_shot_examples** — Training-Daten die manuell auf /nb-wissen gepflegt werden, aber NICHT im RAG landen
2. **nb_tab_documents** — AI-analysierte TAB-PDFs mit Pflichtdokumenten/Messkonzepten, NICHT im RAG
- → Diese Lücken bedeuten: Die AI-Services (claudeAI, emailAutoreply, nbResolveEngine) haben KEINEN Zugriff auf die manuell gepflegten Few-Shots und TAB-Analysen über den RAG-Pfad

### Portal-Automatisierung: Hardcoded statt DB
- StromnetzBerlin hat einen eigenen Service (727 Z.) mit hardcoded Selektoren
- Westnetz + energis Portal-URLs sind im emailPipeline hardcoded
- → Sollte über nbPortalConfig + nbFormMapping in der DB gepflegt werden

### Cross-Page NB-Daten-Zugriff (Zusammenfassung)
- **/dashboard**: Nur Performance-Stats (evu_profiles via /netzbetreiber/performance)
- **/netzanmeldungen**: NB-Name in Liste, NB-Card + Korrespondenz im Detail, NB-Email für Versand
- **/vde-formulare**: NB-Email für PDF-Versand (Step 5)
- **/nb-wissen**: ALLES — zentrale Anzeige + Verwaltung aller 11 Tabellen
- **/netzbetreiber**: Stammdaten-CRUD + PLZ + Credentials + Import

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| GET /nb-wissen | 7 Tabellen × N NB | ❌ | ⚠️ Sehr schwer bei vielen NB (787 × 7 = potenziell 5.500 Queries) |
| GET /netzbetreiber | 1-2 | ❌ | OK mit Pagination |
| GET /netzbetreiber/by-plz | 1 + VNBdigital | VNBdigital 24h | OK |
| GET /netzbetreiber/performance | 41 | ❌ | ⚠️ Gleicher N+1 wie in /dashboard Kette #6 |
| POST /nb-wissen/:id/tab-upload | 2 + OpenAI | ❌ | CPU: GPT-4o TAB-Analyse (async) |

---

---

## 22. Komponentenbaum: /calendar + /termin + /termin/absagen

### /calendar (Authentifiziert — ADMIN/MITARBEITER/HV)
```
CalendarPage (features/calendar/CalendarPage.tsx, 993 Z.)
├── Header: Statistiken (Pending, Heute, Diese Woche)
├── Toolbar: Monats-Navigation, Filter (Status/Service/Suche), View-Toggle
├── CalendarGrid (Monatsansicht)
│   └── Tag-Zellen mit Termin-Balken (Status-Färbung)
├── ListView (Listenansicht)
│   └── Termin-Rows mit Status-Dropdown
├── AppointmentModal (Erstellen/Bearbeiten)
│   ├── Titel, Beschreibung, Datum/Uhrzeit, Dauer
│   ├── Service-Auswahl, Kontakt (Name/Email/Tel)
│   ├── Installations-Verknüpfung (optional)
│   └── Admin-Notizen
└── SettingsModal
    ├── Tab: Verfügbarkeit (Wochentags-Slots)
    ├── Tab: Blockierte Tage
    └── Tab: Services/Terminarten (Admin only)

API (authentifiziert):
  GET  /api/calendar/appointments?from=&to=&status=&limit=500
  POST /api/calendar/appointments (Erstellen)
  PUT  /api/calendar/appointments/:id (Bearbeiten)
  DELETE /api/calendar/appointments/:id (Löschen)
  GET/POST/PUT/DELETE /api/calendar/availability (Verfügbarkeit CRUD)
  GET/POST/DELETE /api/calendar/blocked-dates (Blockierte Tage)
  GET/POST/PUT/DELETE /api/calendar/services (Terminarten, Admin)
  GET /api/calendar/slots?month=&serviceId= (Freie Slots)
```

### /termin (Öffentlich — Buchungsseite für Endkunden)
```
BookingPage (features/calendar/BookingPage.tsx, 541 Z.)
├── Step 1: Loading → User + Services laden
├── Step 2: DateTime → Monatskalender + Zeitslots
├── Step 3: Contact → Formular (Name, Email, Telefon, Nachricht)
└── Step 4: Done → Erfolgsseite mit Termin-Details + Zoom-Link

API (KEIN Auth):
  GET  /api/calendar/public/user/:userId (User-Info)
  GET  /api/calendar/public/services (Terminarten)
  GET  /api/calendar/public/slots?month=&userId=&serviceId=
  POST /api/calendar/public/book (Buchung erstellen)
  GET  /api/calendar/public/team (Buchbare Mitarbeiter)
```

### /termin/absagen (Öffentlich — Token-basierte Absage)
```
CancelPage (features/calendar/CancelPage.tsx, 205 Z.)
├── Bestätigungs-Dialog
├── Loading-State
├── Erfolg / Bereits abgesagt / Fehler
└── Link zu Neubuchung

API (KEIN Auth, Token-basiert):
  POST /api/calendar/public/cancel/:cancelToken
```

**HV-Buchungslink:** `/termin?user={hvUserId}` → Slots nur von diesem HV

---

## 23. API-Ketten: /calendar

### Kette #30: Termine laden (Monatsansicht)
```
UI: CalendarPage → useEffect bei Monatswechsel
Frontend: GET /api/calendar/appointments?from=2026-03-01&to=2026-03-31&limit=500
Route: calendar.routes.ts
Service: Inline
DB-Reads:
  - calendar_appointments (findMany, WHERE scheduledAt BETWEEN, mit service + assignedUser includes)
  - HV-Filter: WHERE assignedUserId = currentUser (bei HANDELSVERTRETER)
DB-Writes: keine
Cache: nein
Auch genutzt von: Nur /calendar
```

### Kette #31: Verfügbarkeit + Services + Blockierungen
```
UI: CalendarPage → SettingsModal / Slot-Berechnung
Frontend: GET /api/calendar/availability, GET /api/calendar/services, GET /api/calendar/blocked-dates
Route: calendar.routes.ts
Service: Inline
DB-Reads:
  - calendar_availability (findMany, WHERE userId = current ODER global)
  - calendar_services (findMany, WHERE isActive = true)
  - calendar_blocked_dates (findMany, WHERE date BETWEEN)
DB-Writes: CRUD bei Bearbeitung
Cache: nein
Auch genutzt von: /termin (öffentliche Buchung, über /public/ Endpoints)
```

### Kette #32: Öffentliche Buchung (komplex)
```
UI: BookingPage → Step 2 (Datum wählen) → Step 3 (Kontakt) → Submit
Frontend: POST /api/calendar/public/book
Route: calendar.routes.ts (public section)
Service: Inline + bookingEmail.service + zoom.service

VOLLSTÄNDIGE CHAIN:
1. Validierung:
   - Termin in Zukunft (24h Vorlauf, max 60 Tage)
   - Slot verfügbar (keine Konflikte, 15min Buffer)
   - Service existiert und ist aktiv
2. DB-Writes:
   - calendar_appointments (CREATE: status=PENDING, confirmToken, cancelToken)
3. Side Effects (async):
   a) Zoom Meeting erstellen (wenn ZOOM_ACCOUNT_ID konfiguriert):
      → zoom.service.ts → POST api.zoom.us/v2/users/me/meetings
      → Speichert Meeting-URL + ID in location + adminNotes
   b) Bestätigungs-Email an Kunden:
      → bookingEmail.service.ts → HTML + ICS-Attachment
      → ICS mit Floating Time (kein Z, kein TZID)
      → Absage-Link: /termin/absagen?token={cancelToken}
   c) Benachrichtigungs-Email an Staff/HV:
      → bookingEmail.service.ts → Einfaches HTML

DB-Reads: calendar_services, calendar_availability, calendar_blocked_dates, calendar_appointments (Konflikt-Check)
DB-Writes: calendar_appointments
Externe APIs: Zoom (optional), SMTP
Generatoren: ICS-Datei (inline in bookingEmail), HTML-Email (inline)
```

### Kette #33: Öffentliche Absage
```
UI: CancelPage → "Ja, absagen"
Frontend: POST /api/calendar/public/cancel/:cancelToken
Route: calendar.routes.ts (public section)
Service: Inline + bookingEmail.service
DB-Reads: calendar_appointments (findUnique WHERE cancelToken)
DB-Writes: calendar_appointments (UPDATE status=CANCELLED, cancelledAt)
Side Effects: Email an Staff (Absage-Benachrichtigung)
Externe APIs: Zoom DELETE /meetings/:id (wenn Meeting existiert)
```

---

## 24. Deadline & Termin-System (NEU)

### Zwei separate Systeme — NICHT integriert!

```
┌─────────────────────────────────────────────────────────────┐
│  SYSTEM 1: Calendar-Termine                                  │
│  Tabelle: calendar_appointments                              │
│  Typen: Beratungsgespräch, Meeting, Custom                  │
│  Ersteller: /calendar UI, /termin (öffentlich)              │
│  Anzeige: /calendar, /dashboard (WeekCalendar Widget)       │
│  Integration: Zoom, ICS-Email, Token-basierte Absage        │
│  ❌ NICHT in /netzanmeldungen Detail-Panel                  │
│  ❌ NICHT mit Installationen verknüpft (optional FK)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SYSTEM 2: Workflow-Deadlines                                │
│  Tabelle: deadlines                                          │
│  Typen: nb_response (21d), rueckfrage_response (14d),       │
│         ibn_protocol (30d)                                   │
│  Ersteller: workflowV2/transitionService (automatisch),     │
│             workflowV2/automationEngine (regelbasiert)       │
│  Anzeige: /netzanmeldungen (als InboxItems), /ops-center    │
│  Cron: deadlineCheckCron.ts (alle 15 Min) → InboxItems      │
│  ❌ NICHT auf /calendar angezeigt                            │
│  ❌ KEIN Zusammenhang mit Calendar-System                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SYSTEM 3: Zählerwechsel-Termine                             │
│  Felder: In Installation-Tabelle (zaehlerwechselDatum,       │
│          zaehlerwechselKundeInformiert)                       │
│  Ersteller: /netzanmeldungen Detail-Panel                    │
│             (MeterChangeScheduler Komponente)                 │
│  Service: zaehlerwechselTermin.service.ts                    │
│  Cron: zaehlerwechselReminderCron.ts                         │
│  ❌ NICHT auf /calendar angezeigt                            │
│  ❌ Komplett separates System                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SYSTEM 4: Dashboard-Termine                                 │
│  Tabelle: projekt_termine (!)                                │
│  Anzeige: /dashboard (WeekCalendar + UpcomingTermine)       │
│  API: GET /api/dashboard/termine                             │
│  ⚠️ ANDERE TABELLE als Calendar-System!                      │
│  → Dashboard zeigt projekt_termine, Calendar zeigt           │
│    calendar_appointments — KEINE Verbindung!                 │
└─────────────────────────────────────────────────────────────┘
```

### Deadline-Quellen und -Aktionen

| Quelle | Deadline-Typ | Tage | Tabelle | Aktion bei Ablauf |
|--------|-------------|------|---------|-------------------|
| workflowV2.transitionService | nb_response | 21 | deadlines | deadlineCheckCron → InboxItem (CRITICAL) |
| workflowV2.transitionService | rueckfrage_response | 14 | deadlines | deadlineCheckCron → InboxItem |
| workflowV2.transitionService | ibn_protocol | 30 | deadlines | deadlineCheckCron → InboxItem |
| automationEngine | auto_deadline_nb_response | 21 | deadlines | InboxItem erstellen |
| emailEscalation.service | REMINDER (28d) | 28 | email_escalations | Email an NB senden |
| emailEscalation.service | ESCALATION (56d) | 56 | email_escalations | Admin-Alert |
| emailEscalation.service | CUSTOMER_UPDATE (14d) | 14 | email_escalations | Alert (keine Email) |
| mahnung.service | Zahlungsfrist | 3 Werktage | rechnungen.faelligAm | Mahnung erstellen |
| zaehlerwechselTermin | Zählerwechsel-Datum | variabel | installations | Reminder-Email + WhatsApp |

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-formulare | /nb-wissen | /calendar | /termin |
|------------------|:---------:|:----------------:|:-------------:|:----------:|:---------:|:------:|
| GET /calendar/appointments | | | | | ✓ (Alle) | |
| POST /calendar/appointments | | | | | ✓ (CRUD) | |
| GET /calendar/public/slots | | | | | | ✓ (Buchung) |
| POST /calendar/public/book | | | | | | ✓ (Buchung) |
| POST /calendar/public/cancel | | | | | | ✓ (Absage) |
| GET /calendar/availability | | | | | ✓ (Settings) | ✓ (Slots) |
| GET /calendar/services | | | | | ✓ (Liste) | ✓ (Auswahl) |
| GET /dashboard/termine | ✓ (Widget) | | | | | |
| zoom.service | | | | | ✓ (Meeting) | ✓ (Meeting) |
| bookingEmail.service | | | | | | ✓ (Emails) |
| zaehlerwechselTermin.svc | | ✓ (DetailPanel) | | | | |
| deadlineCheckCron | | ✓ (InboxItems) | | | | |
| emailEscalation.service | | ✓ (Reminder) | | | | |
| getVisibleKundeIds() | ✓ | ✓ | | ✓ | | |

---

## API-Endpunkte (ERWEITERT)

| Endpoint | Route-Datei | DB-Tabellen | Cache | Seiten |
|----------|-------------|-------------|-------|--------|
| GET /api/calendar/appointments | calendar.routes (1414 Z.) | calendar_appointments, services, users | nein | /calendar |
| POST /api/calendar/appointments | calendar.routes | calendar_appointments (W) | nein | /calendar |
| PUT /api/calendar/appointments/:id | calendar.routes | calendar_appointments (W) | nein | /calendar |
| DELETE /api/calendar/appointments/:id | calendar.routes | calendar_appointments (W) | nein | /calendar |
| GET /api/calendar/availability | calendar.routes | calendar_availability | nein | /calendar, /termin |
| GET /api/calendar/services | calendar.routes | calendar_services | nein | /calendar, /termin |
| GET /api/calendar/slots | calendar.routes | availability, blocked_dates, appointments | nein | /calendar, /termin |
| GET /api/calendar/public/slots | calendar.routes | availability, blocked_dates, appointments | nein | /termin |
| POST /api/calendar/public/book | calendar.routes | appointments (W), services, availability | nein | /termin |
| POST /api/calendar/public/cancel/:token | calendar.routes | appointments (W) | nein | /termin/absagen |
| GET /api/calendar/public/team | calendar.routes | users (buchbare Mitarbeiter) | nein | /termin |
| GET /api/dashboard/termine | dashboard.routes | projekt_termine (!) | nein | /dashboard |
| POST /api/installations/:id/zaehlerwechsel-termin | zaehlerwechselTermin.routes | installations (W) | nein | /netzanmeldungen |

---

## Zusammenhänge (ERWEITERT)

### 4 isolierte Termin-Systeme — NICHT integriert!
Das ist der wichtigste Fund der /calendar-Analyse:

1. **Calendar-System** (calendar_appointments) — `/calendar` + `/termin`
2. **Workflow-Deadlines** (deadlines) — WorkflowV2, DeadlineCheckCron
3. **Zählerwechsel-Termine** (installations.zaehlerwechselDatum) — Netzanmeldungen DetailPanel
4. **Dashboard-Termine** (projekt_termine) — Dashboard WeekCalendar

**Keines dieser 4 Systeme kennt die anderen.** Der /dashboard zeigt `projekt_termine` im WeekCalendar, aber NICHT `calendar_appointments`. Der /calendar zeigt `calendar_appointments`, aber NICHT `deadlines` oder `zaehlerwechsel-termine`.

→ **KANDIDAT für Konsolidierung:** Einheitliches Termin-System das alle 4 Quellen aggregiert

### Calendar ist relativ isoliert
- Eigene DB-Tabellen (calendar_*), eigener Service-Stack
- Einzige Verbindung zu Installationen: optionaler FK `installationId` in appointments
- Einzige externe Integration: Zoom API
- Einzige Cross-Page Nutzung: /dashboard zeigt `projekt_termine` (ANDERE Tabelle!)
- Kein RAG-Index, kein Learning, keine NB-Verbindung

### Zoom-Integration: Nur in Calendar
- `zoom.service.ts` (219 Z.) — Server-to-Server OAuth
- Nur von calendar.routes.ts genutzt
- Meeting-URL landet in appointment.location + adminNotes
- Bei Absage: Zoom-Meeting wird gelöscht

### Zählerwechsel: Eigenes Mini-System
- In Installation-Tabelle gespeichert (kein eigenes Modell)
- Eigener Service + Routes + Cron
- Nur über /netzanmeldungen DetailPanel erreichbar
- Keine Verbindung zum Calendar-System

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| GET /calendar/appointments (Monat) | 1-2 | ❌ | OK (LIMIT 500, indexed auf scheduledAt) |
| POST /calendar/public/book | 4-5 + Zoom + 2 Emails | ❌ | CPU: Zoom API + 2 Email-Sends |
| GET /calendar/public/slots (Monat) | 3-4 | ❌ | OK (Availability + Blocks + Conflicts) |
| GET /dashboard/termine | 1 | ❌ | OK (LIMIT 10, andere Tabelle!) |

---

---

## 25. Komponentenbaum: /zaehlerwechsel-center

```
ZaehlerwechselCenter (features/netzanmeldungen/components/ZaehlerwechselCenter/, ~1050 Z.)
│
├── HeaderStats (32 Z.) — KPIs: Total, Parsed, Confirmed, Notified, Errors
├── StepTrack (66 Z.) — 3-Schritt Progress: Input → Review → Done
│
├── Step 1: Input
│   └── Textarea (Freitext einfügen: "Name DD.MM.YYYY HH:MM" pro Zeile)
│       Hook: useTerminParser → terminParser.ts (Regex, client-side, KEIN API)
│
├── Step 2: Review
│   ├── TerminCard ×N (117 Z. pro Card)
│   │   ├── Name + Datum/Uhrzeit
│   │   ├── InstallationMatchDropdown (89 Z.) — Fuzzy-Match Auswahl
│   │   ├── StatusPill (parsed → confirmed → notified)
│   │   └── Bestätigen / Ablehnen Buttons
│   │
│   ├── EmailPreview (53 Z.) — Vorschau der Email
│   └── TerminCalendar (51 Z.) — React Day Picker Mini-Kalender
│       Hook: useInstallationMatch → GET /email-inbox/search-installations?q={name}
│       Fuzzy: fuzzyMatch.ts (Dice 60% + Token 20% + Prefix 20%, Auto-Select ≥70%)
│
├── Step 3: Processing → Done
│   └── Sequentielle Benachrichtigung (300ms Pause zwischen Calls)
│       API: POST /installations/{id}/zaehlerwechsel-termin pro Termin
│
└── TermineOverview (192 Z.) — Sidebar mit bestehenden Terminen
    API: GET /zaehlerwechsel-termine
```

**Schlüssel-Architektur:** Text → Parse (Regex, Client) → Match (Fuzzy, Client + API) → Confirm (Manual) → Notify (Sequential API)

---

## 26. API-Ketten: /zaehlerwechsel-center

### Kette #34: Text-Parsing (rein Client-Side)
```
UI: ZaehlerwechselCenter Step 1 → Textarea
Frontend: KEIN API CALL (reiner Client-Side Regex)
Service: utils/terminParser.ts (162 Z.)
Parsing: "Name DD.MM.YYYY HH:MM" → {customerName, datum, uhrzeit}
Cleanup: Unicode normalisieren, Header-Zeilen entfernen
Auch genutzt von: Nur /zaehlerwechsel-center
```

### Kette #35: Installations-Matching
```
UI: ZaehlerwechselCenter Step 2 → useInstallationMatch Hook
Frontend: GET /api/email-inbox/search-installations?q={name}&limit=10
Route: emailInbox.routes.ts (!)
Service: Inline
DB-Reads:
  - installations (findMany, WHERE customerName LIKE '%name%', LIMIT 10)
Fuzzy-Score: Dice (60%) + TokenOverlap (20%) + Prefix (20%)
Auto-Select: ≥ 70% Score → automatische Zuordnung
Auch genutzt von: /emails (Email-Inbox Zuordnung!)
⚠️ CROSS-MODUL: ZW-Center nutzt Email-Inbox Route für Installation-Suche
```

### Kette #36: Zählerwechsel-Termin erstellen + benachrichtigen
```
UI: ZaehlerwechselCenter "Alle benachrichtigen" → useTerminActions
Frontend: POST /api/installations/{id}/zaehlerwechsel-termin {datum, uhrzeit, kommentar}
Route: zaehlerwechselTermin.routes.ts
Service: zaehlerwechselTermin.service.ts → scheduleTermin()

VOLLSTÄNDIGE CHAIN:
1. Installation laden (mit endkundenConsent)
2. Datum validieren (muss in Zukunft liegen)
3. Alte PENDING Zählerwechsel stornieren
4. CalendarAppointment erstellen (serviceId=1, status=PENDING, confirmToken)
5. Installation updaten (zaehlerwechselDatum, -Uhrzeit, -Kommentar)
6. StatusHistory erstellen
7. Notifications (3 Kanäle):
   a) Errichter Email (IMMER): HTML + ICS Attachment
   b) Endkunde Email (wenn Portal + emailConsent): HTML + ICS + Bestätigungs-Link
   c) Endkunde WhatsApp (wenn Portal + whatsappConsent + verified): Text

DB-Reads: installations (mit endkundenConsent, createdBy), calendar_services, netzbetreiber
DB-Writes: calendar_appointments (CREATE), installations (UPDATE), status_history (CREATE)
Externe: SMTP (3 Emails), Wassenger WhatsApp API
Generatoren: ICS-Datei (Floating Time), HTML-Email-Templates (inline)
Cache: nein
Auch genutzt von: /netzanmeldungen DetailPanel (gleicher Endpoint, Single statt Bulk!)
```

### Kette #37: Kunden-Bestätigung (öffentlich)
```
UI: Email-Link → /api/public/confirm-termin/{token}
Frontend: KEIN Frontend (Backend rendert HTML direkt)
Route: zaehlerwechselTermin.routes.ts (PUBLIC, kein Auth!)
Service: zaehlerwechselTermin.service.ts → confirmTermin()

CHAIN:
1. CalendarAppointment finden (WHERE confirmToken)
2. Status → CONFIRMED, confirmedAt = now
3. Installation: zaehlerwechselKundeInformiert = true
4. StatusHistory erstellen
5. Auto-Reply an NB: sendZwTerminBestaetigung()
   → Email an netzbetreiber.email
   → Von: netzanmeldung@lecagmbh.de
   → Inhalt: Kundenname, Adresse, Datum, Vorgangsnummer

DB-Reads: calendar_appointments, installations, netzbetreiber
DB-Writes: calendar_appointments (UPDATE), installations (UPDATE), status_history (CREATE), email_logs (CREATE)
Externe: SMTP (Email an NB)
```

### Kette #38: Termine-Übersicht laden
```
UI: TermineOverview → useEffect
Frontend: GET /api/zaehlerwechsel-termine
Route: zaehlerwechselTermin.routes.ts
Service: zaehlerwechselTermin.service.ts → getUpcomingTermine()
DB-Reads: calendar_appointments (WHERE serviceId=1, status IN [PENDING, CONFIRMED]), installations
Cache: nein
Auch genutzt von: Nur /zaehlerwechsel-center
```

### Kette #39: Automatische Erinnerungen (Cron)
```
Trigger: Cron daily 08:00 UTC
Job: zaehlerwechselReminderCron.ts
Service: zaehlerwechselTermin.service.ts → sendTerminReminder()
Prüft:
  - Termine in 3 Tagen → Erinnerung "3 Tage vorher"
  - Termine in 1 Tag → Erinnerung "1 Tag vorher"
Duplikat-Schutz: Redis TTL 24h (Key: reminder:zaehlerwechsel:{id}:{days}d)
Notifications: Errichter Email + Endkunde Email/WhatsApp (wie Kette #36)
Feature Flag: automation.zaehlerwechsel-reminder
DB-Writes: status_history (Reminder-Einträge)
```

---

## 27. Duplikat-Vergleich: Zählerwechsel auf 3 Seiten

| Aspekt | /zaehlerwechsel-center | /netzanmeldungen DetailPanel | /calendar |
|--------|----------------------|---------------------------|-----------|
| **Zweck** | Bulk-Terminplanung (Listen) | Einzelner Termin pro Installation | Allgemeine Termine |
| **Zähler-Daten anzeigen** | Nur Name + Datum | Ja (Datum, Uhrzeit, Kommentar, Status) | Nein |
| **Termin erstellen** | Ja (Bulk, aus Text-Input) | Ja (Single, manuell) | Ja (aber nicht ZW-spezifisch) |
| **Termin bearbeiten** | Nein (nur neu anlegen) | Stornieren + neu | Ja (Status, Datum) |
| **API-Endpoint** | POST /installations/:id/zaehlerwechsel-termin | **GLEICHER Endpoint** | POST /calendar/appointments |
| **Backend-Service** | zaehlerwechselTermin.service | **GLEICHER Service** | calendar.routes (inline) |
| **DB-Tabelle** | calendar_appointments + installations | **GLEICHE Tabellen** | calendar_appointments |
| **Email senden** | Ja (3 Kanäle) | **GLEICHE Logik** (via Service) | Ja (bookingEmail, anders) |
| **Status-Tracking** | StatusHistory Einträge | **GLEICHE StatusHistory** | Appointment.status |
| **NB benachrichtigen** | Ja (bei Bestätigung) | **GLEICHE Logik** | Nein |

**Duplikat-Level:** /zaehlerwechsel-center und /netzanmeldungen Detail-Panel nutzen **denselben Backend-Service und dieselben Endpoints**. Kein Code-Duplikat, nur verschiedene UIs (Bulk vs. Single). /calendar ist ein **separates System** mit eigener DB-Logik, aber teilt die `calendar_appointments` Tabelle.

---

## 28. Termin-System Komplett (ERWEITERT von Sektion 24)

### calendar_appointments: Shared Tabelle, 2 verschiedene Writer

```
┌──────────────────────────────────────────────────────────────────┐
│  calendar_appointments Tabelle                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  WRITER 1: Zählerwechsel-System                                   │
│  Service: zaehlerwechselTermin.service.ts                         │
│  Routes: zaehlerwechselTermin.routes.ts                           │
│  Cron: zaehlerwechselReminderCron.ts                              │
│  UI: /zaehlerwechsel-center (Bulk), /netzanmeldungen (Single)     │
│  Merkmale: serviceId=1, installationId gesetzt, confirmToken,     │
│            ICS-Attachment, 3-Kanal-Benachrichtigung, NB-Auto-Reply│
│                                                                   │
│  WRITER 2: Calendar/Booking-System                                │
│  Routes: calendar.routes.ts (1414 Z.)                             │
│  Service: bookingEmail.service.ts, zoom.service.ts                │
│  UI: /calendar (intern), /termin (public)                         │
│  Merkmale: Zoom-Meeting, Public Booking, HV-Zuordnung,            │
│            Keine Installation-Verknüpfung (optional FK)            │
│                                                                   │
│  ⚠️ PROBLEM: Zwei Systeme schreiben in dieselbe Tabelle          │
│  mit verschiedener Logik, verschiedenen Status-Flows,              │
│  und verschiedenen Notification-Pfaden!                            │
│                                                                   │
│  READER: /dashboard zeigt projekt_termine (DRITTE Tabelle!)       │
└──────────────────────────────────────────────────────────────────┘
```

### Installations-Lifecycle mit Zählerwechsel

```
Installation erstellt (EINGANG)
  → Dokumente + VDE-Formulare erstellen
  → Status: BEIM_NB
    → Auto-Invoice
    → NB bearbeitet
  → Status: GENEHMIGT
    → [MANUELL] Zählerwechsel planen ← /zaehlerwechsel-center ODER /netzanmeldungen
      → Email an Errichter + Endkunde
      → Endkunde bestätigt (Token-Link)
      → Auto-Reply an NB
      → Cron: Erinnerungen 3d + 1d vorher
    → Zählerwechsel durchgeführt
      → [MANUELL] Status: IBN ← kein Auto-Trigger!
  → Status: IBN
    → VDE E.8 (IBN-Protokoll)
  → Status: FERTIG

⚠️ KEIN automatischer Trigger: Zählerwechsel → IBN
   Der Zählerwechsel ändert KEINEN Installations-Status.
   IBN muss manuell gesetzt werden.
```

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-form. | /nb-wissen | /calendar | /termin | /zw-center |
|------------------|:---------:|:----------------:|:----------:|:----------:|:---------:|:------:|:----------:|
| POST /:id/zaehlerwechsel-termin | | ✓ (Single) | | | | | ✓ (Bulk) |
| DELETE /:id/zaehlerwechsel-termin | | ✓ (Cancel) | | | | | |
| GET /:id/zaehlerwechsel-termin | | ✓ (Detail) | | | | | |
| GET /zaehlerwechsel-termine | | | | | | | ✓ (Übersicht) |
| GET /public/confirm-termin/:token | | | | | | | ✓ (Public) |
| GET /email-inbox/search-installations | | | | | | | ✓ (Match) |
| zaehlerwechselTermin.service | | ✓ | | | | | ✓ |
| zaehlerwechselReminderCron | | | | | | | ✓ (Auto) |
| calendar_appointments (DB) | | | | | ✓ | ✓ | ✓ |
| emailGateway.service | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| whatsappMessage.service | | | | | | | ✓ |

---

## API-Endpunkte (ERWEITERT)

| Endpoint | Route-Datei | DB-Tabellen | Cache | Seiten |
|----------|-------------|-------------|-------|--------|
| POST /api/installations/:id/zaehlerwechsel-termin | zaehlerwechselTermin.routes | calendar_appointments (W), installations (W), status_history (W) | nein | /netzanmeldungen, /zw-center |
| DELETE /api/installations/:id/zaehlerwechsel-termin | zaehlerwechselTermin.routes | calendar_appointments (W), installations (W) | nein | /netzanmeldungen |
| GET /api/installations/:id/zaehlerwechsel-termin | zaehlerwechselTermin.routes | calendar_appointments, installations | nein | /netzanmeldungen |
| GET /api/zaehlerwechsel-termine | zaehlerwechselTermin.routes | calendar_appointments, installations | nein | /zw-center |
| GET /api/public/confirm-termin/:token | zaehlerwechselTermin.routes | calendar_appointments (W), installations (W), netzbetreiber | nein | Public |
| GET /api/email-inbox/search-installations | emailInbox.routes | installations | nein | /zw-center, /emails |

---

## Zusammenhänge (ERWEITERT)

### Zählerwechsel: Gut strukturiert, aber isoliert vom Status-Flow
- **Backend-Service ist sauber**: 1 Service, 1 Route-File, 1 Cron → kein Code-Duplikat
- **Frontend: 2 verschiedene UIs** (Bulk vs. Single) auf denselben Backend-Endpoints → gute Architektur
- **ABER**: Zählerwechsel ändert keinen Installations-Status → manueller Bruch im Lifecycle
- **calendar_appointments** wird von 2 verschiedenen Systemen beschrieben → potenzielle Konflikte

### Cross-Modul API-Nutzung
- `/zaehlerwechsel-center` nutzt `/email-inbox/search-installations` für Fuzzy-Matching
- Das ist eine unerwartete Abhängigkeit: ZW-Center → Email-Inbox-Modul
- → Sollte zu einem generischen `installations/search` Endpoint konsolidiert werden

### 3 Termin-Tabellen Problem (bestätigt)
Die /calendar-Analyse hat 4 isolierte Systeme gefunden. Der ZW-Center bestätigt:
1. `calendar_appointments` mit `serviceId=1` → Zählerwechsel
2. `calendar_appointments` mit `serviceId≠1` → Calendar/Booking
3. `projekt_termine` → Dashboard
4. `deadlines` → Workflow-V2
- **calendar_appointments** ist die einzige geteilte Tabelle, aber mit komplett unterschiedlicher Logik

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| POST /installations/:id/zaehlerwechsel-termin | 4-5 + 3 Emails + WhatsApp | ❌ | CPU: 3 Emails + WhatsApp pro Termin |
| GET /zaehlerwechsel-termine | 1-2 | ❌ | OK (nur PENDING/CONFIRMED) |
| GET /email-inbox/search-installations | 1 | ❌ | OK (LIKE-Query, dedupliziert im Frontend) |
| Cron (daily 08:00) | N × (2 + 3 Notifications) | Redis 24h | ⚠️ Bei vielen Terminen: viele Emails |

---

---

## 29. Komponentenbaum: /control-center + /ops-center + /nb-response

### Drei operative Seiten — verschiedene Fokus-Bereiche

### /control-center (ADMIN only — Executive Dashboard)
```
ControlCenterPage (features/control-center/, ~3000 Z. gesamt)
├── Tab 1: Dashboard (SmartDashboard, 345 Z.)
│   ├── KpiCard ×8 (260 Z.) — Total, Active, BeimNB, Emails, Invoices, Users, NB, Errors
│   ├── WorkflowPipeline (216 Z.) — 7 Stages visuell
│   ├── LongestWaiting (131 Z.) — Installationen mit längster Wartezeit
│   ├── QuickActions (78 Z.) — 6 Links zu Hauptseiten
│   ├── InsightsPanel (567 Z.) — AI-generierte Insights (unread/critical Filter)
│   └── PredictionsPanel (845 Z.) — 3 Tabs: Workload Forecast, Anomalien, Funnel
│
├── Tab 2: Operations (OperationsTab)
│   └── Installations-Tabelle mit Bulk-Status-Change + CSV-Export
│
├── Tab 3: Communication (3-Spalten Email-Client)
│   ├── MailboxSidebar (230px) — Mailboxen, Kunden, VNB, Eskalationen
│   ├── InboxTable (380px) — Virtualisierte Email-Liste
│   └── EmailDetailPanel (flex) — Thread, Anhänge, Aktionen
│
├── Tab 4: Network — NB-Stats Grid
├── Tab 5: Users
├── Tab 6: System
├── Tab 7: Logs
└── Tab 8: Settings

API: GET /api/control-center/overview (KPIs, 60s refresh)
     GET /api/control-center/quick-stats (30s refresh)
     GET /api/control-center/health (5min refresh)
     GET /api/intelligence/insights (AI Insights)
     GET /api/intelligence/predictions/workload
     GET /api/intelligence/anomalies
     GET /api/intelligence/funnel/summary
WebSocket: installation:created, installation:updated, stats:updated, alert:new, email:sent
```

### /ops-center (ADMIN + MITARBEITER — Operatives Kanban)
```
OpsCenterPage (pages/OpsCenterPage.tsx, 863 Z.)
├── Header: Stats-Bar (7 Chips: Critical, Overdue, Escalated, AvgDays, etc.)
│
├── Tab 1: Board → Kanban-Board
│   ├── Column: Critical (rot, ≥21 Tage)
│   ├── Column: Overdue (amber, ≥14 Tage)
│   ├── Column: Due (blau, ≥7 Tage)
│   └── Column: OK (grün, <7 Tage)
│       └── DetailPanel (Modal, 4 Sub-Tabs: Overview, Daten, Historie, Kommentare)
│
├── Tab 2: NB Directory → NB-Kontaktliste mit Email, Telefon, Portal, Reminder-Intervall
├── Tab 3: Data Quality → Vollständigkeits-Check (14 Felder × 6 Kategorien)
└── Tab 4: Log → Audit-Trail + Reminder-Log

API: GET /api/ops/cases (Installationen beim NB mit Urgency)
     GET /api/ops/stats (Dashboard-Statistiken)
     POST /api/ops/cases/:id/remind (Manuelle NB-Erinnerung senden)
     PATCH /api/ops/cases/:id (Case-Daten aktualisieren)
     PATCH /api/ops/cases/:id/automation (Reminder-Automation toggle)
     POST /api/ops/cases/:id/comments (Kommentar hinzufügen)
     GET /api/ops/nb-directory (NB-Kontaktliste)
     PATCH /api/ops/nb/:id (NB-Kontakt bearbeiten)
     GET /api/ops/log (Audit/Reminder-Logs)
     GET /api/ops/data-quality (Vollständigkeits-Check)
```

### /nb-response (ADMIN + MITARBEITER — NB-Rückfrage-Automation)
```
NbResponsePage (pages/NbResponsePage.tsx, ~600 Z.)
├── Header: Stats-Bar (Tasks nach Status: Analyzing, Collecting, Ready, Sent)
│
├── TaskList (paginiert, 20/Seite)
│   └── TaskCard ×N
│       ├── Status-Badge (ANALYZING → COLLECTING → READY_FOR_REVIEW → APPROVED → SENT)
│       └── Complaint-Count Badge
│
└── DetailPanel (Modal)
    ├── TaskHeader (PublicId, Kunde, Status)
    ├── Tab: Complaints
    │   ├── ComplaintCard ×N (6 Typen mit Icons + Resolve-Status)
    │   └── "Re-Resolve" Button → POST /nb-response/tasks/:id/re-resolve
    ├── Tab: Documents
    │   └── Dokument-Checkliste (VDE, Requirements, Present-Status)
    ├── Tab: Thread
    │   └── Email-Timeline (Inbound/Outbound + Trigger-Email markiert)
    └── ResponsePreview
        └── Approve / Send / Cancel Buttons

API: GET /api/nb-response/tasks (Task-Liste + Stats)
     GET /api/nb-response/tasks/:id (Detail mit Complaints, Thread, Docs)
     POST /api/nb-response/tasks/:id/re-resolve (Auto-Resolve neu triggern)
     PATCH /api/nb-response/tasks/:id (Response-Text bearbeiten)
     POST /api/nb-response/tasks/:id/send (Genehmigte Antwort senden)
     POST /api/nb-response/tasks/:id/cancel (Task abbrechen)
```

---

## 30. API-Ketten: /control-center

### Kette #40: Control Center Overview (KPIs)
```
UI: SmartDashboard → useControlCenter() (60s Refresh)
Frontend: GET /api/control-center/overview
Route: controlCenter.routes.ts
Service: Inline (direkte Prisma-Queries)
DB-Reads (PARALLEL):
  - installations (COUNT × 8: total, active, by status, today/yesterday)
  - nb_correspondences (COUNT pending responses >7d)
  - email_logs (COUNT sent today/yesterday/failed/queued)
  - rechnungen (COUNT open, overdue, SUM open amount)
  - users (COUNT active)
  - netzbetreiber (COUNT total)
  - activity_logs (findMany recent errors)
DB-Writes: keine
Cache: nein
⚠️ ÜBERSCHNEIDUNG: Installations-Stats auch in /dashboard/summary und /netzanmeldungen/stats
```

### Kette #41: AI Insights
```
UI: InsightsPanel → fetch
Frontend: GET /api/intelligence/insights?severity=&unreadOnly=
Route: (intelligence routes — separate)
Service: predictionEngine? anomalyDetection?
DB-Reads: installations, status_history (für Pattern-Detection)
Auch genutzt von: Nur /control-center
```

### Kette #42: Workload Predictions
```
UI: PredictionsPanel → 3 Tabs
Frontend: GET /api/intelligence/predictions/workload
          GET /api/intelligence/anomalies
          GET /api/intelligence/funnel/summary
Route: (intelligence routes)
Service: predictionEngine.service.ts
DB-Reads: installations (historische Daten für Forecast)
Auch genutzt von: Nur /control-center
```

### Kette #43: Communication Tab (Email-Client)
```
UI: CommunicationTab → useEmailCenter Hook
Frontend: GET /api/emails (Inbox-Liste)
          GET /api/emails/:id (Detail + Thread)
          GET /api/emails/sent (Gesendete)
          GET /api/escalations (Überfällige)
          POST /api/emails (Neue Email senden)
          POST /api/emails/:id/reply
          POST /api/emails/:id/archive
          POST /api/emails/batch-mark-read
          POST /api/escalations/:id/execute
Route: emails.routes.ts, emailInbox.routes.ts, emailEscalation routes
Service: emailInbox.service, emailSend.service, emailEscalation.service, emailGateway.service
DB-Reads: emails, sent_emails, email_escalations, installations (für Zuordnung)
DB-Writes: emails (archive/read), sent_emails (reply), email_escalations (execute/skip)
Auch genutzt von: /emails (Email-Inbox Seite — vermutlich gleiche Endpoints!)
```

---

## 31. API-Ketten: /ops-center

### Kette #44: OpsCenter Cases (Kanban)
```
UI: OpsCenterPage Board-Tab → fetch
Frontend: GET /api/ops/cases
Route: ops.routes.ts
Service: ops.service.ts → getCases()
DB-Reads:
  - installations (WHERE status IN [BEIM_NB, RUECKFRAGE], deletedAt IS NULL)
  - netzbetreiber (Name, Email, Portal)
  - comments (letzte Kommentare)
  - documents (Vollständigkeits-Check)
Berechnet: urgency (Tage seit Einreichung/letzter Aktivität), completeness (14 Felder)
Cache: nein
Auch genutzt von: Nur /ops-center
```

### Kette #45: OpsCenter Reminder senden
```
UI: DetailPanel → "Reminder senden" Button
Frontend: POST /api/ops/cases/:id/remind
Route: ops.routes.ts
Service: ops.service.ts → sendReminder()
DB-Reads: installations (mit NB-Daten)
DB-Writes: installations (reminderCount++), ops_reminder_log (CREATE), ops_audit_log (CREATE)
Externe: SMTP (emailGateway → Email an NB)
Email-Template: "{vorgangsnummer} – {n}. Nachfrage zum Bearbeitungsstand"
Auto-Eskalation: Wenn reminderCount ≥ 4 → Flag gesetzt
Auch genutzt von: opsReminderCron (automatisch)
⚠️ ÜBERSCHNEIDUNG: nbCommunication.service macht DASSELBE (NB-Reminder) mit eigenem Template!
```

### Kette #46: Data Quality Check
```
UI: OpsCenterPage Data-Quality-Tab
Frontend: GET /api/ops/data-quality
Route: ops.routes.ts
Service: ops.service.ts → getDataQuality()
DB-Reads: installations (WHERE status=BEIM_NB, check 14 Felder)
Prüft: Kundenname, Adresse, Email, Tel, kWp, Typ, Module, WR, Speicher, kWh, Zählernr, NB, NB-Email, Vorgangsnr
Auch genutzt von: Nur /ops-center
```

---

## 32. API-Ketten: /nb-response

### Kette #47: NB-Response Tasks laden
```
UI: NbResponsePage → fetch
Frontend: GET /api/nb-response/tasks?status=&page=&limit=20
Route: nbResponse.routes.ts
Service: Inline
DB-Reads:
  - nb_response_tasks (findMany mit installation include)
  - nb_response_tasks (groupBy status für Stats)
  - nb_response_tasks (COUNT für Total)
Cache: nein
Auch genutzt von: Nur /nb-response
```

### Kette #48: NB-Response Task Detail
```
UI: NbResponsePage DetailPanel
Frontend: GET /api/nb-response/tasks/:id
Route: nbResponse.routes.ts
Service: Inline
DB-Reads:
  - nb_response_tasks (findUnique mit installation, emailAttachments, nbComplaints, nbTaskComments)
  - emails (Thread-Emails für die Installation)
  - documents (Dokument-Checkliste)
Cache: nein
```

### Kette #49: Re-Resolve + Approve + Send (GENERATOR-CHAIN)
```
UI: NbResponsePage → "Re-Resolve" / "Approve" / "Send"
Frontend: POST /api/nb-response/tasks/:id/re-resolve
          POST /api/nb-response/tasks/:id/send
Route: nbResponse.routes.ts
Service: nbResponseOrchestrator.service.ts

RE-RESOLVE CHAIN:
1. nbThreadAnalyzer → Email-Thread aufbauen
2. nbComplaintParser → Complaints extrahieren (GPT-4o-mini)
3. nbResolveEngine → Auto-Resolve:
   → MISSING_SIGNATURE: efkSignature einsetzen
   → SCHALTPLAN_ERROR: GPT-Korrektur → schaltplanGeneratorPython
   → WRONG_DATE: VDE-Formular nachfüllen
   → MISSING_DOCUMENT: Attachment/VDE suchen
   → FORM_INCOMPLETE: VDE nachfüllen
   → CLARIFICATION_NEEDED: Pattern-Hints aus nb_complaint_patterns
4. Dokument-Lücken bewerten
5. Antwort-Entwurf generieren

SEND CHAIN (nach Admin-Approve):
1. nbResponseTask UPDATE status=SENT
2. emailSend.service → Antwort an NB senden
3. nbLearning.learnFromResolvedTask() → nb_complaint_patterns UPSERT
4. InboxItems auflösen

GENERATOREN (indirekt):
  - schaltplanGeneratorPython (bei SCHALTPLAN_ERROR)
  - vde-pdf-service (bei FORM_INCOMPLETE, WRONG_DATE)
  - efkSignature.service (bei MISSING_SIGNATURE)

DB-Reads: nb_response_tasks, emails, documents, nb_complaint_patterns, installations, netzbetreiber
DB-Writes: nb_response_tasks, nb_complaints, nb_complaint_patterns, documents, sent_emails, email_logs
AI: GPT-4o-mini (Complaint-Parsing + Schaltplan-Korrektur)
Auch genutzt von: Nur /nb-response (aber nbResponseOrchestrator wird auch von emailAutomation getriggert!)
```

---

## 33. InboxItem-System (NEU — Komplett)

### InboxItem Flow-Diagramm

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOXITEM ERSTELLER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EMAIL-PIPELINE (automatisch):                                       │
│  emailAutomation.service → createFromEmailAnalysis()                 │
│    RUECKFRAGE → email_rueckfrage (CRITICAL)                         │
│    GENEHMIGUNG → email_genehmigung (HIGH)                           │
│    ABLEHNUNG → email_ablehnung (CRITICAL)                           │
│    INBETRIEBSETZUNG → email_inbetriebsetzung (HIGH)                │
│                                                                      │
│  STATUS-CHANGES (automatisch):                                       │
│  workflow.service → createFromStatusChange()                         │
│    BEIM_NB → nachfassen_nb (nach 14d, NORMAL)                      │
│    RUECKFRAGE → rueckfrage_beantworten (HIGH)                       │
│    GENEHMIGT → ibn_vorbereiten (HIGH)                               │
│    IBN → ibn_protokoll + mastr_eintragen (NORMAL)                   │
│                                                                      │
│  CRON-JOBS (automatisch):                                           │
│  maintainInboxItems() (60 Min) → installation_ueberfaellig          │
│  checkOverdueInstallationsV2() → nachfassen_nb (Eskalation 1-3)    │
│  kundenfreigabeReminderCron → customer_reminder                      │
│                                                                      │
│  NB-RESPONSE (automatisch):                                         │
│  nbResponseOrchestrator → rueckfrage_beantworten                    │
│                                                                      │
│  FACTRO (automatisch):                                              │
│  factroCommentAnalyzer → review_eingang, nb_einreichen              │
│                                                                      │
│  CUSTOMER ALERTS (automatisch):                                      │
│  alertRueckfrageItem → alert_rueckfrage (visibility: CUSTOMER)      │
│  alertAblehnungItem → alert_ablehnung (visibility: CUSTOMER)        │
│  alertGenehmigungItem → alert_genehmigung (visibility: CUSTOMER)    │
│  alertDokumentFehltItem → alert_dokument_fehlt (visibility: CUSTOMER)│
│  alertWartezeitItem → alert_wartezeit (visibility: CUSTOMER)        │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    inbox_items TABELLE                                │
│  20+ Typen, 4 Prioritäten, Visibility (INTERNAL/CUSTOMER/BOTH)      │
│  Idempotenz: Max 1 offenes Item pro Typ pro Installation            │
│  Snooze: snoozedUntil > now → ausgeblendet                         │
│  Deadline: dueDate für zeitkritische Items                           │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOXITEM KONSUMENTEN                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /dashboard         → GET /v2/inbox/counts (ActionRequired Widget)  │
│  /netzanmeldungen   → GET /v2/inbox/counts (Badge im Header)       │
│  /ops-center        → Indirekt (Cases basieren auf ähnlichen Daten) │
│  Sidebar (global)   → GET /v2/inbox/counts (Badge)                  │
│  Portal (Endkunde)  → getCustomerVisibleItems() (CUSTOMER visibility)│
│                                                                      │
│  ⚠️ /control-center zeigt InboxItems NICHT direkt an!               │
│  ⚠️ Kein dediziertes "Inbox/Aufgaben"-UI existiert!                │
│  (/aufgaben wurde entfernt, /ops-center hat eigenes Case-System)    │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOXITEM AUFLÖSUNG                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AUTO-RESOLVE bei neuen Items (Kaskade):                            │
│  email_genehmigung → schließt: rueckfrage, nachfassen_nb            │
│  email_inbetriebsetzung → schließt: ibn_vorbereiten, genehmigung    │
│  alert_genehmigung → schließt: alert_rueckfrage, alert_wartezeit    │
│                                                                      │
│  AUTO-RESOLVE bei Status-Change:                                    │
│  GENEHMIGT → schließt: rueckfrage, email_rueckfrage, nachfassen     │
│  FERTIG → schließt: ALLE offenen Items                              │
│  STORNIERT → schließt: ALLE offenen Items                           │
│                                                                      │
│  MANUELL:                                                           │
│  Portal → resolveItem() (Endkunde markiert als gelesen/erledigt)    │
│  workflowV2.routes → resolveItem() (Admin löst Item auf)           │
│                                                                      │
│  CRON:                                                              │
│  maintainInboxItems() → Stale Items nach X Tagen auto-resolven     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 34. Drei operative Seiten — Vergleich

| Aspekt | /control-center | /ops-center | /nb-response |
|--------|----------------|-------------|--------------|
| **Rolle** | ADMIN only | ADMIN + MITARBEITER | ADMIN + MITARBEITER |
| **Fokus** | Executive Overview + Email | NB-Reminder Kanban | NB-Rückfrage Auto-Resolve |
| **Hauptdaten** | KPIs, Emails, Predictions | Cases beim NB (Urgency) | NbResponseTasks (AI-Pipeline) |
| **Layout** | 8 Tabs, Dashboard-Grid | 4 Tabs, Kanban-Board | Liste + Detail-Modal |
| **AI-Services** | Insights + Predictions | Keine | GPT-4o-mini (Complaints), GPT-4o (Schaltplan) |
| **Email** | Vollständiger Email-Client | NB-Reminder senden | Antwort an NB senden |
| **Generatoren** | Keine direkt | Email-Reminder | VDE, Schaltplan, EFK-Signatur (via Resolve) |
| **InboxItems** | NICHT angezeigt (!) | Eigenes Case-System | Eigenes Task-System |
| **Real-Time** | WebSocket Events | Keine | Keine |
| **Installations** | Stats + Tabelle | Nur BEIM_NB/RUECKFRAGE | Nur mit NbResponseTask |
| **NB-Kontakt** | Network-Tab (Stats) | NB Directory (Kontakte) | Via Installation-Relation |

### Kein Overlap, aber Lücken!
- **Kein dediziertes InboxItem-UI** — /aufgaben wurde entfernt, nichts ersetzt es
- **/control-center** ist das einzige mit Email-Client (Communication Tab)
- **/ops-center** ist das einzige mit Datenqualitäts-Check
- **/nb-response** ist das einzige mit AI-Resolve-Pipeline

### NB-Reminder: 2 verschiedene Systeme!
- **/ops-center** → `ops.service.sendReminder()` → ops_reminder_log, eigene Email-Templates
- **nbCommunication.service** → `checkNbReminders()` → nb_correspondences, andere Email-Templates
- Beide senden Reminder-Emails an NB, mit verschiedener Logik und verschiedenen Logs

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-form. | /nb-wissen | /calendar | /zw-center | /control-center | /ops-center | /nb-response |
|------------------|:---------:|:----------------:|:----------:|:----------:|:---------:|:----------:|:---------------:|:-----------:|:------------:|
| GET /control-center/overview | | | | | | | ✓ (KPIs) | | |
| GET /control-center/quick-stats | | | | | | | ✓ (Live) | | |
| GET /intelligence/insights | | | | | | | ✓ (AI) | | |
| GET /intelligence/predictions | | | | | | | ✓ (AI) | | |
| GET /api/ops/cases | | | | | | | | ✓ (Kanban) | |
| POST /ops/cases/:id/remind | | | | | | | | ✓ (Manual) | |
| GET /ops/data-quality | | | | | | | | ✓ | |
| GET /nb-response/tasks | | | | | | | | | ✓ (Liste) |
| POST /nb-response/tasks/:id/send | | | | | | | | | ✓ (Approve) |
| POST /nb-response/tasks/:id/re-resolve | | | | | | | | | ✓ (AI) |
| GET /v2/inbox/counts | ✓ | ✓ | | | | | | | |
| inboxItemGenerator.service | | ✓ (Trigger) | | | | | | | |
| emailInbox.service | | | | | | | ✓ (CommTab) | | |
| emailSend.service | | ✓ | ✓ | | | | ✓ (CommTab) | | ✓ |
| emailGateway.service | | ✓ | ✓ | | | ✓ | ✓ | ✓ | ✓ |
| nbResponseOrchestrator | | | | | | | | | ✓ |
| nbResolveEngine | | | | | | | | | ✓ (Auto) |
| nbComplaintParser | | | | | | | | | ✓ (GPT) |
| predictionEngine.service | | | | | | | ✓ (Predict) | | |
| ops.service | | | | | | | | ✓ (All) | |
| nbCommunication.service | | ✓ | | | | | | | |

---

## API-Endpunkte (ERWEITERT)

| Endpoint | Route-Datei | DB-Tabellen (Read) | DB-Tabellen (Write) | Seiten |
|----------|-------------|-------------------|-------------------|--------|
| GET /api/control-center/overview | controlCenter.routes | installations ×8, nb_correspondences, email_logs, rechnungen, users, netzbetreiber, activity_logs | — | /control-center |
| GET /api/control-center/quick-stats | controlCenter.routes | installations, activity_logs, email_logs | — | /control-center |
| GET /api/control-center/health | controlCenter.routes | smart_email_queue, activity_logs | — | /control-center |
| GET /api/intelligence/insights | intelligence routes | installations, status_history | — | /control-center |
| GET /api/ops/cases | ops.routes | installations, netzbetreiber, comments, documents | — | /ops-center |
| GET /api/ops/stats | ops.routes | installations, ops_reminder_log | — | /ops-center |
| POST /api/ops/cases/:id/remind | ops.routes | installations, netzbetreiber | installations (W), ops_reminder_log (W), ops_audit_log (W) | /ops-center |
| GET /api/ops/data-quality | ops.routes | installations (14 Felder) | — | /ops-center |
| GET /api/ops/nb-directory | ops.routes | netzbetreiber, installations | — | /ops-center |
| GET /api/ops/log | ops.routes | ops_reminder_log OR ops_audit_log | — | /ops-center |
| GET /api/nb-response/tasks | nbResponse.routes | nb_response_tasks, installations | — | /nb-response |
| GET /api/nb-response/tasks/:id | nbResponse.routes | nb_response_tasks (6 includes) | — | /nb-response |
| POST /api/nb-response/tasks/:id/re-resolve | nbResponse.routes | nb_response_tasks, emails, docs, nb_complaint_patterns | nb_response_tasks (W), nb_complaints (W), documents (W) | /nb-response |
| POST /api/nb-response/tasks/:id/send | nbResponse.routes | nb_response_tasks | nb_response_tasks (W), sent_emails (W), nb_complaint_patterns (W) | /nb-response |

---

## Zusammenhänge (ERWEITERT)

### Installations-Stats: Jetzt 5× verschiedene Aggregation!
- **/dashboard** `/summary`: COUNT × 6 (Redis 60s)
- **/dashboard** `/alerts`: COUNT × 4
- **/netzanmeldungen** `/stats`: COUNT × 7 + AGGREGATE
- **/netzanmeldungen** `/enterprise`: COUNT × 6 KPIs
- **/control-center** `/overview`: COUNT × 8 (!) + Emails + Invoices + Users
- **5 verschiedene Endpoints** zählen dieselben Installationen mit leicht unterschiedlichen Filtern
- → `installationStats.service.ts` als zentraler Cache wird immer dringender

### NB-Reminder: 2 parallele Systeme
```
System A: ops.service.sendReminder()
  Trigger: /ops-center Button + opsReminderCron
  Log: ops_reminder_log (eigene Tabelle)
  Template: "{vorgangsnummer} – {n}. Nachfrage zum Bearbeitungsstand"
  Auto-Eskalation: bei reminderCount ≥ 4

System B: nbCommunication.service.checkNbReminders()
  Trigger: Cron in jobs/
  Log: nb_correspondences (andere Tabelle!)
  Template: "nb-nachfrage" (DB-Template)
  Auto-Eskalation: bei 3 NACHFRAGE → ADMIN_ALERT
  In-Memory Cooldown: 24h Map

→ DUPLIKAT: Beide senden Reminder-Emails an NB, aber mit verschiedenen Templates,
  verschiedenen Logs, verschiedenen Eskalations-Regeln, und verschiedenen Zählern!
```

### InboxItems: Umfangreiches System ohne eigenes UI
- 20+ Item-Typen, komplexe Auto-Resolve-Kaskaden, Cron-basierte Maintenance
- Aber: Kein dediziertes UI! /aufgaben wurde entfernt, /ops-center hat eigenes Case-System
- Items werden nur als Badge-Counts auf /dashboard und /netzanmeldungen angezeigt
- Customer-visible Items gehen ans Portal, aber das Portal-UI ist minimal
- → Potenzial für ein dediziertes Aufgaben-UI oder Integration in /ops-center

### AI-Services Verteilung

| AI-Service | /control-center | /netzanmeldungen | /nb-response | Sonstige |
|-----------|:-:|:-:|:-:|:-:|
| predictionEngine (Forecast) | ✓ | | | |
| anomalyDetection | ✓ | | | |
| openaiClassifier (Email) | | ✓ (Pipeline) | | emailPipeline (Auto) |
| localAI (Ollama) | | ✓ (Pipeline) | | emailPipeline (Auto) |
| nbComplaintParser (GPT) | | | ✓ (Resolve) | nbResponseOrchestrator (Auto) |
| nbResolveEngine | | | ✓ (Auto-Fix) | nbResponseOrchestrator (Auto) |
| claudeAI/GPT-4o (Draft) | | | ✓ (Draft) | emailAutoreply (Auto) |
| RAG enterpriseRagService | | ✓ (Context) | ✓ (Context) | AI-Chat |

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| GET /control-center/overview | ~15 | ❌ | ⚠️ Schwer: 8 Installation-Counts + Emails + Invoices + Users |
| GET /control-center/quick-stats | ~4 | ❌ | OK (leicht, 30s refresh) |
| GET /ops/cases | 4-5 | ❌ | OK (nur BEIM_NB + RUECKFRAGE) |
| POST /ops/cases/:id/remind | 2 + Email | ❌ | OK (Single-Op) |
| GET /ops/data-quality | 1 | ❌ | OK (nur BEIM_NB, 14 Feld-Checks) |
| GET /nb-response/tasks | 3 | ❌ | OK (paginiert) |
| GET /nb-response/tasks/:id | 5-6 | ❌ | ⚠️ 6 includes in einer Query |
| POST /nb-response/tasks/:id/re-resolve | ~10 + GPT | ❌ | ⚠️ CPU: GPT-4o-mini + ggf. Schaltplan-Regenerierung |

---

---

## 35. Komponentenbaum: /finanzen (Unified Hub)

```
FinanzenPage (features/finanzen/FinanzenPage.tsx, 252 Z.)
├── Tab 1: Übersicht (UebersichtTab, 480 Z.)
│   └── Finanz-KPIs + Charts
│
├── Tab 2: Rechnungen → RechnungenPage (pages/RechnungenPage.tsx, 953 Z.)
│   ├── Stats-Bar (4 KPIs: Gesamt, Offen+Summe, Bezahlt, Überfällig)
│   ├── Filter (Suche, Status, Kunde, ZIP-Download, Neu, Sammelrechnung)
│   ├── Invoice-Tabelle (20/Seite, sortierbar, Inline-Status-Dropdown)
│   ├── Aktionen: PDF ansehen, Download, Bezahlt markieren, WhatsApp, Stornieren
│   └── Modals: InvoiceCreateModal, SammelrechnungModal
│
├── Tab 3: Offene Posten → OPCenterPage (pages/OPCenterPage.tsx, 990 Z.)
│   ├── 7 KPI-Cards (Total, Summe offen, Überfällig, Mahnung, Ø Zahlungsziel)
│   ├── Filter (Suche, Aging 7/30/60/90+d, Status, Kunde)
│   ├── OP-Tabelle (Nr., Kunde, Tage offen, Betrag, Status)
│   └── Batch: Mahnung erstellen, Kunden entsperren
│
├── Tab 4: Abrechnung → AbrechnungOverview (components/billing/, 618 Z.)
│   ├── 4 KPIs (Kunden mit OP, Unbilled, Offen, Bezahlt)
│   └── Collapsible Kunden-Liste → Installation-Rows (Billing-Status)
│
├── Tab 5: Wise Bank → WiseTab (features/accounting/tabs/, 620 Z.)
│   ├── Kontostand nach Währung
│   ├── Unmatched Transactions (20 neueste)
│   ├── Smart Suggestions (AI-Matching)
│   ├── Manual Match Modal
│   └── Sync-Button
│
├── Tab 6: Ausgaben → AusgabenTab (68 Z.)
├── Tab 7: Journal → JournalTab (423 Z.)
├── Tab 8: Berichte → ReportsTab (884 Z.) — BWA, GuV, Bilanz, Cash Flow
└── Tab 9: KI Insights → AIInsightsTab (776 Z.) — AI-Finanzanalyse

Weitere Finance-Seiten (NICHT in /finanzen integriert):
  /rechnungen        → RechnungenPage (Staff) / KundenRechnungenPage (Kunde, 269 Z.)
  /rechnungs-ordner  → RechnungsOrdnerPage (203 Z.) — Kunden→Installationen Ordner-Ansicht
  /admin/provisionen → ProvisionenPage (921 Z.) — HV-Provisionen verwalten
  /accounting        → Redirect → /finanzen
  /op-center         → Redirect → /finanzen?tab=offene-posten
```

---

## 36. API-Ketten: /finanzen

### Kette #50: Rechnungen laden
```
UI: RechnungenPage → fetchInvoices()
Frontend: GET /api/rechnungen?limit=9999
Route: rechnung.routes.ts
Service: Inline
DB-Reads: rechnungen (findMany mit kunde include)
Cache: nein
Auch genutzt von: /rechnungen (gleiche Komponente!), /rechnungs-ordner (indirekt)
```

### Kette #51: Rechnung erstellen (manuell)
```
UI: InvoiceCreateModal → Submit
Frontend: POST /api/rechnungen {kundeId, positionen, ...}
Route: rechnung.routes.ts
Service: Inline + nextInvoiceNumber()
DB-Writes:
  - rechnungen (CREATE: ENTWURF Status)
  - invoice_counters (INCREMENT: YYYYMM Counter)
Generatoren: Keine (erst bei Finalisierung)
```

### Kette #52: Rechnung finalisieren + PDF
```
UI: RechnungenPage → "Finalisieren" Button (nur ENTWURF)
Frontend: POST /api/rechnungen/:id/finalize
Route: rechnung.routes.ts
Service: invoicePdf.service.ts → renderInvoicePdf()

CHAIN:
1. Rechnung laden + validieren (Status muss ENTWURF sein)
2. PDF generieren (PDFKit, A4, Gradient-Header, Positionen-Tabelle)
3. PDF auf Disk speichern (uploads/invoices/)
4. Rechnung UPDATE: status=OFFEN, pdfPath, pdfSha256, finalisiertAm
5. PaymentLink erstellen (Wise)
6. Optional: Document-Record erstellen

DB-Writes: rechnungen (UPDATE), documents (CREATE), payment_links (CREATE)
Generator: invoicePdf.service.ts (491 Z., PDFKit)
```

### Kette #53: Rechnung bezahlt markieren → Provision erstellen
```
UI: RechnungenPage → "Bezahlt" Button
Frontend: POST /api/rechnungen/:id/mark-paid
Route: rechnung.routes.ts
Service: Inline + provision.service.createProvisionForInvoice()

CHAIN:
1. Rechnung UPDATE: status=BEZAHLT, bezahltAm
2. Journal-Eintrag erstellen (Double-Entry Bookkeeping)
3. Provision erstellen:
   → HV ermitteln (Kunde → HV-Relation)
   → Rate berechnen (HV.provisionssatz)
   → Ober-HV-Splitting (wenn oberHvId gesetzt)
   → prisma.provision.create({status: OFFEN})
4. Optional: Mahnung-Entsperrung (entsperreNachZahlung)

DB-Writes: rechnungen, journal_entries, provision, ggf. kunde + user (Entsperrung)
Auch getriggert von: Wise Auto-Matching, GoCardless Webhook
```

### Kette #54: Sammelrechnung
```
UI: RechnungenPage → "Sammelrechnung" Dropdown
Frontend: POST /api/rechnungen/sammelrechnung {kundeId, installationIds[], periode}
Route: rechnung.routes.ts
Service: Inline + invoicePdf.service
DB-Reads: installations (WHERE id IN [...]), rechnungen (Duplikat-Check)
DB-Writes: rechnungen (CREATE), documents (CREATE)
Generator: invoicePdf.service → Zusammengefasste PDF mit allen Positionen
```

### Kette #55: Wise Auto-Matching
```
UI: WiseTab → Sync → Match
Frontend: POST /api/wise/sync + GET /api/accounting/wise/transactions
Route: wise.routes.ts + accounting.routes.ts
Service: wiseSync.service.ts + wiseMatching.service.ts

CHAIN:
1. Wise API sync (30d Statement)
2. Für jede neue Transaktion:
   a) Invoice-Referenz extrahieren (Pattern: RE-YYYYMM-XXXXX)
   b) Wenn Match: Rechnung markieren als BEZAHLT
   c) Auto-Provision erstellen
   d) Auto-Mahnung-Entsperrung
3. Unmatched → Manual Match UI

DB-Reads: wise_accounts, wise_transactions, rechnungen
DB-Writes: wise_transactions (CREATE), rechnungen (UPDATE), provision (CREATE)
Externe API: Wise v1-v4
```

### Kette #56: Provisionen freigeben + Auszahlung
```
UI: ProvisionenPage → Batch Freigeben → Auszahlung erstellen
Frontend: POST /admin/provisionen/batch-freigeben {provisionIds}
          POST /admin/hv/:hvId/auszahlungen {provisionIds}
Route: provisionen.routes.ts + auszahlungen.routes.ts
Service: provisionWorkflow.service.ts

CHAIN:
1. Batch Freigeben: provision.status → FREIGEGEBEN
2. Auto-Verrechnung: Match gegen offene Rechnungen (FIFO)
3. Auszahlung erstellen: ProvisionsAuszahlung (status: AUSSTEHEND)
4. Optional: SEPA XML oder CSV Export
5. Optional: Wise Payout (wisePayoutService)

DB-Writes: provision (UPDATE ×N), provisionsAuszahlung (CREATE)
Generatoren: SEPA XML (pain.001.001.03), CSV
Externe: Wise API (Payout)
```

### Kette #57: Buchhaltungs-Reports
```
UI: ReportsTab → Report-Auswahl
Frontend: GET /api/accounting/reports/balance-sheet
          GET /api/accounting/reports/income-statement
          GET /api/accounting/reports/trial-balance
          GET /api/accounting/reports/cash-flow
Route: accounting.routes.ts
Service: accounting/reports.service.ts
DB-Reads: accounts (mit aggregierten journal_entries), journal_entries, expenses
Output: JSON (kein PDF-Generator, Rendering im Frontend)
```

### Kette #58: Jahresabschluss + Steuer-Export
```
UI: ReportsTab → "Steuer-Paket generieren"
Frontend: POST /api/accounting/year-end/generate-tax-package
Route: accounting.routes.ts
Service: accounting/yearEnd.service.ts
Generator: ZIP mit 6 CSVs (IncomeStatement, BalanceSheet, TrialBalance, Journal, Invoices, Expenses)
Output: ZIP-Download
```

---

## 37. Billing-Lifecycle (End-to-End) — NEU

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    BILLING LIFECYCLE (Komplett)                            │
└──────────────────────────────────────────────────────────────────────────┘

1. INSTALLATION ERSTELLT
   Seite: /netzanmeldungen (Wizard oder manuell)
   Preis: Noch nicht bestimmt

2. STATUS → BEIM_NB
   Trigger: POST /netzanmeldungen/:id/status
   ↓
   autoInvoice.service.autoCreateAndSendInvoice() [ASYNC]
   ├── pricing.service.getInstallationPrice()
   │   ├── Paket-Check (kundeServicePrice PAKET_REMAINING)
   │   ├── Kundenpreis (kundeServicePrice NETZANMELDUNG)
   │   └── Staffel: 199€ (1-9/Mo), 149€ (10-49), 129€ (50+)
   ├── nextInvoiceNumber() → RE-YYYYMM-XXXXXX
   ├── invoicePdf.service.renderInvoicePdf() → A4 PDF
   ├── paymentLink.service.createPaymentLink() → Wise Link
   ├── email.service.send("invoice") → Email an Kunde mit PDF + Link
   └── installation.update(rechnungGestellt=true)
   Sichtbar auf: /netzanmeldungen (Flag), /finanzen/rechnungen (neue Rechnung)

3. KUNDE ZAHLT
   Erkennung A: wise.service.syncAllWiseAccounts() → Auto-Match (Referenz+Betrag)
   Erkennung B: GoCardless Webhook → Bank-Transaktion
   Erkennung C: Admin manuell → POST /rechnungen/:id/mark-paid
   ↓
   rechnung.status → BEZAHLT
   ├── journal.recordInvoiceTransaction() → Double-Entry Buchung
   ├── provision.createProvisionForInvoice()
   │   ├── HV ermitteln (Kunde → Handelsvertreter Relation)
   │   ├── Rate: HV.provisionssatz (z.B. 10%)
   │   ├── Ober-HV Splitting (wenn oberHvId)
   │   └── provision.create(status: OFFEN)
   └── mahnung.entsperreNachZahlung() (falls gesperrt)
   Sichtbar auf: /finanzen/rechnungen, /admin/provisionen

4. KUNDE ZAHLT NICHT
   mahnung.service.runMahnlauf() [Cron oder manuell]
   ├── Stufe 1: 3 Werktage → Mahnung erstellen
   │   └── Email/WhatsApp: DEAKTIVIERT (nur DB-Eintrag)
   ├── Stufe 2: +7 Tage → Kontosperre
   │   ├── kunde.accountGesperrt = true
   │   └── user.gesperrt = true (alle User des Kunden)
   └── Max 3 Stufen
   Sichtbar auf: /finanzen/offene-posten, /finanzen/rechnungen (Status MAHNUNG)

5. PROVISION FREIGEBEN
   Admin: POST /admin/provisionen/batch-freigeben
   provision.status → FREIGEGEBEN
   ├── Auto-Verrechnung gegen offene Rechnungen (FIFO)
   └── Ggf. Restrechnungen erstellen
   Sichtbar auf: /admin/provisionen

6. AUSZAHLUNG
   Admin: POST /admin/hv/:hvId/auszahlungen
   provisionsAuszahlung.create(status: AUSSTEHEND)
   ├── SEPA XML Export (pain.001) ODER CSV
   ├── Wise Payout (Quote → Transfer → Fund mit SCA)
   └── provision.status → AUSGEZAHLT
   Sichtbar auf: /admin/provisionen, (ggf. /hv-center für HV)

7. JAHRESABSCHLUSS
   Admin: POST /accounting/year-end/generate-tax-package
   → ZIP mit 6 CSVs
   Sichtbar auf: /finanzen/berichte
```

---

## 38. Generator-Inventar: Finanzen (ERWEITERT)

| Generator | Pfad | Typ | Library | Input | Output | Trigger | Seiten |
|-----------|------|-----|---------|-------|--------|---------|--------|
| invoicePdf | invoicePdf.service.ts (491 Z.) | PDF | PDFKit | Rechnung + Kunde + Positionen | A4 PDF (Gradient-Header) | Manual + autoInvoice | /finanzen, /rechnungen, /netzanmeldungen (auto) |
| autoInvoice | autoInvoice.service.ts (311 Z.) | Orchestrator | — | Installation + Pricing | PDF + Email + PaymentLink | Status BEIM_NB (Event) | /netzanmeldungen (Trigger), /finanzen (Ergebnis) |
| SEPA Export | provision/provisionQuery.service.ts | XML | String-Build | Auszahlung + HV-IBAN | pain.001.001.03 XML | Manuell (Admin) | /admin/provisionen |
| CSV Export | provision/provisionQuery.service.ts | CSV | String-Build | Auszahlung + Provisionen | CSV (UTF-8) | Manuell (Admin) | /admin/provisionen |
| Tax Package | accounting/yearEnd.service.ts | ZIP+CSV | — | Alle Finanzdaten | ZIP (6 CSVs) | Manuell (Admin) | /finanzen/berichte |
| HV-Report | provisionAutomation.service.ts (545 Z.) | Email/HTML | String-Concat | Monats-Provisionen | HTML Email | Cron (monatlich) | Automatisch |
| Payment Link | paymentLink.service.ts | URL | Wise API | Rechnung | URL + Token | autoInvoice / Manual | /finanzen, /netzanmeldungen |
| AI Beleg-Extraktion | accounting/aiExtraction.service.ts | AI Parse | GPT-4o | Beleg-Bild/PDF | Strukturierte Daten | Manuell (Upload) | /finanzen/ausgaben |

---

## 39. Pricing-Map (NEU)

```
## Pricing: Wer bestimmt den Preis?

Quelle: pricing.service.ts (151 Z.)
  Staffelung (für Neukunden ohne Custom-Preis):
    1-9/Monat:  199€ netto
    10-49/Monat: 149€ netto
    ab 50/Monat: 129€ netto
  MwSt: 19% (hardcoded)

Kundenspezifische Preise (DB: kunde_service_prices):
  EHBB: 89€, Lumina/GEOPERIS/Solar Star/Heitzer: 99€
  Sol-Living/Grünergie/Schiewe: 50€, Gregori: 300€
  Alle bestehenden Kunden: 149€ (migriert am 2026-03-15)

Paket-Kontingente (HARDCODED in pricing.service.ts!):
  Kunde 10 (360° Solar): 5 Units → DB Counter
  Kunde 26 (altena): 6 Units → DB Counter

Partner-Pricing (SEPARAT, services/partner/billing.ts):
  pvRate: 2.0 €/kWp
  speicherRate: 1.0 €/kWp
  pauschalRate: 99€ (Übernahme)
  → Aus Partner-Tabelle geladen, NICHT aus pricing.service

Konsumenten:
  autoInvoice.service → bei BEIM_NB (Hauptpfad)
  rechnung.routes → manuelle Rechnung (Admin wählt Positionen frei)
  partner/billing.ts → Partner-Projekte (andere Berechnung!)

⚠️ Pricing ist an 3 Stellen implementiert:
  1. pricing.service.ts (Staffel für reguläre Kunden)
  2. partner/billing.ts (Rate-basiert für Partner)
  3. rechnung.routes.ts (frei wählbar bei manueller Erstellung)
```

---

## Services → Seiten Matrix (ERWEITERT)

| Service/Endpoint | /dashboard | /netzanmeldungen | /vde-form. | /nb-wissen | /calendar | /zw-center | /control-center | /ops-center | /nb-response | /finanzen | /provisionen |
|------------------|:---------:|:----------------:|:----------:|:----------:|:---------:|:----------:|:---------------:|:-----------:|:------------:|:---------:|:------------:|
| GET /rechnungen | | | | | | | ✓ (KPI) | | | ✓ (Tab) | |
| POST /rechnungen | | | | | | | | | | ✓ (Create) | |
| POST /:id/finalize | | | | | | | | | | ✓ | |
| POST /:id/mark-paid | | | | | | | | | | ✓ | |
| POST /sammelrechnung | | | | | | | | | | ✓ | |
| GET /:id/pdf | | | | | | | | | | ✓ | |
| GET /billing-overview | | | | | | | | | | ✓ (KPI) | |
| POST /op/:id/send-reminder | | | | | | | | | | ✓ (OP Tab) | |
| GET /admin/provisionen | | | | | | | | | | | ✓ |
| POST /batch-freigeben | | | | | | | | | | | ✓ |
| POST /hv/:id/auszahlungen | | | | | | | | | | | ✓ |
| POST /wise/sync | | | | | | | | | | ✓ (Wise) | |
| GET /accounting/journal | | | | | | | | | | ✓ (Journal) | |
| GET /accounting/reports/* | | | | | | | | | | ✓ (Reports) | |
| POST /year-end/tax-package | | | | | | | | | | ✓ (Reports) | |
| autoInvoice.service | | ✓ (Trigger) | | | | | | | | ✓ (Result) | |
| pricing.service | | ✓ (via auto) | | | | | | | | ✓ (via auto) | |
| invoicePdf.service | | | | | | | | | | ✓ | |
| provision.service | | | | | | | | | | | ✓ |
| provisionAutomation | | | | | | | | | | | ✓ (Cron) |
| wise.service | | | | | | | | | | ✓ (Sync) | ✓ (Payout) |
| mahnung.service | | | | | | | | | | ✓ (OP Tab) | |
| paymentLink.service | | ✓ (auto) | | | | | | | | ✓ | |
| journal.service | | | | | | | | | | ✓ | |
| reports.service | | | | | | | | | | ✓ | |
| yearEnd.service | | | | | | | | | | ✓ | |
| partner/billing.ts | | | | | | | | | | | |

---

## Zusammenhänge (ERWEITERT)

### Rechnungen auf 5 Seiten sichtbar
1. **/finanzen** Tab "Rechnungen" → Volle Verwaltung (CRUD, PDF, Status)
2. **/finanzen** Tab "Offene Posten" → Überfällige mit Aging + Mahnung
3. **/finanzen** Tab "Abrechnung" → Pro Kunde/Installation gruppiert
4. **/rechnungen** → Standalone (gleiche Komponente wie Tab 2)
5. **/rechnungs-ordner** → Kunden-Ordner-Ansicht
6. **/netzanmeldungen** → rechnungGestellt Flag + Invoice-Card im Detail-Panel
- 6 verschiedene Ansichten auf `rechnungen`-Tabelle, alle mit eigenen API-Calls

### autoInvoice: Event-Driven Kette über 2 Seiten
- **Trigger:** Status BEIM_NB auf /netzanmeldungen (POST /netzanmeldungen/:id/status)
- **Ausführung:** autoInvoice.service (async, fire-and-forget)
- **Ergebnis sichtbar:** /finanzen (neue Rechnung), /netzanmeldungen (rechnungGestellt=true)
- **6 Services beteiligt:** pricing → invoicePdf → paymentLink → email → rechnung → installation

### Provision → Auszahlung: Längste Finance-Chain
```
Invoice BEZAHLT → provision.create(OFFEN) → batch-freigeben(FREIGEGEBEN)
  → auto-Verrechnung → createAuszahlung(AUSSTEHEND) → SEPA/Wise → AUSGEZAHLT
```
4 Status-Transitions, 3 Seiten (/finanzen, /provisionen, Wise Dashboard), 5 Services

### Partner-Pricing vs. Standard-Pricing: Separate Welten
- Standard: pricing.service → Staffel 199/149/129
- Partner: partner/billing.ts → Rate-basiert (€/kWp + Pauschal)
- Kein gemeinsamer Pricing-Service → Konsolidierungskandidat

---

## Performance (ERWEITERT)

| Endpoint | Queries | Cache | Problem |
|----------|---------|-------|---------|
| GET /rechnungen?limit=9999 | 1-2 | ❌ | ⚠️ LIMIT 9999 — lädt ALLE Rechnungen! |
| GET /billing-overview | 4-5 | ❌ | OK (Aggregationen) |
| GET /op/dashboard | 3-4 | ❌ | OK |
| GET /op/offene-posten | 2-3 | ❌ | OK (paginiert) |
| POST /rechnungen/:id/finalize | 3 + PDF-Gen | ❌ | CPU: PDFKit PDF-Generierung |
| GET /admin/provisionen | 2 | ❌ | OK (paginiert, 50/Seite) |
| POST /wise/sync | External API | ❌ | ⚠️ 30d Statement, multiple Accounts |
| GET /accounting/reports/* | 5-10 | ❌ | ⚠️ Aggregiert über alle journal_entries |

---

---

## 40. Komponentenbaum: /evu-dashboard

```
EvuDashboardPage (pages/EvuDashboardPage.tsx, 771 Z.)
├── Header (Logo + "Alle EVUs analysieren" Button)
├── KPI-Cards ×3
│   ├── Total EVUs (aktiv in DB)
│   ├── Analysis Coverage (analysiert / gesamt %)
│   └── Avg Success Rate (Ø Erfolgsquote)
├── Top Issues (Custom Bar-Chart, kein Recharts)
│   └── Top 5 Issue-Kategorien mit Häufigkeit
├── System Status (Info-Rows)
└── Tabellen ×2
    ├── EVUs mit niedrigster Erfolgsquote (Bottom 5, min 5 Submissions)
    └── EVUs mit längster Bearbeitungszeit (Top 5, min 5 Submissions)

API: GET /api/evu/dashboard → EvuDashboard (aggregiert aus EvuProfile)
     POST /api/evu/analyze-all → Batch-Analyse aller NB (ADMIN only)
Weitere Endpoints (nicht auf dieser Seite, aber im Service):
     GET /api/evu/:id/profile, /warnings, /tips
     POST /api/evu/analyze/:id, /learn, /recalculate-all
```

**Datenquelle:** `evuProfile`-Tabelle (vorberechnet durch `evuLearningService.analyzeHistoricalData()`)
**NICHT live berechnet** — liest aggregierte Snapshots aus EvuProfile

---

## 41. API-Ketten: /evu-dashboard

### Kette #59: EVU-Dashboard laden
```
UI: EvuDashboardPage → useEffect
Frontend: GET /api/evu/dashboard
Route: evuLearning.routes.ts
Service: evuLearningService.getEvuDashboard()
DB-Reads:
  - evu_profiles (findMany, alle mit totalSubmissions ≥ 1)
  - Aggregation: avg successRate, top issues, bottom/top 5
DB-Writes: keine
Cache: nein (aber liest vorberechnete Daten)
Auch genutzt von: Nur /evu-dashboard
```

### Kette #60: Batch-Analyse aller EVUs
```
UI: EvuDashboardPage → "Alle EVUs analysieren" Button
Frontend: POST /api/evu/analyze-all
Route: evuLearning.routes.ts
Service: evuLearningService.analyzeAllEvus(batchSize=10)

CHAIN pro NB:
1. installations laden (WHERE netzbetreiberId, status IN [GENEHMIGT, FERTIG, ABGELEHNT, ...])
2. StatusHistory analysieren (Processing-Times: BEIM_NB → GENEHMIGT)
3. Stats berechnen:
   - successRate, avgProcessingDays, median/min/max
   - sofortFreigabeRate (% ohne RUECKFRAGE)
   - rueckfrageRate, typischeRueckfragen
   - bestResponseDay (Wochentag mit meisten Genehmigungen)
4. Genehmigungstyp klassifizieren:
   - SCHNELL (≤7d), STANDARD (≤21d), LANGSAM (≤42d), SEHR_LANGSAM (>42d)
5. Schwellenwerte berechnen:
   - nachhakSchwelleTage = median × 1.4
   - eskalationSchwelleTage = min(56, median × 2)
6. Tips generieren (wenn ≥5 Logs → GPT-4o-mini)
7. evuProfile UPSERT + netzbetreiber UPDATE

DB-Reads: installations, status_history, evu_learning_logs
DB-Writes: evu_profiles (UPSERT), netzbetreiber (UPDATE: genehmigungsTyp, Schwellenwerte)
AI: GPT-4o-mini (Tip-Generierung, optional)
Performance: Batch à 10, 1s Pause → bei 787 NB: ~80 Batches ≈ 80s
```

### Kette #61: EVU-Warnings (genutzt im Wizard + Detail-Panel)
```
UI: EvuWarningsCard (Komponente) → fetch
Frontend: GET /api/evu/:evuId/warnings?kwp=&hasBattery=&hasWallbox=
Route: evuLearning.routes.ts
Service: evuLearningService.getWarningsForSubmission()
DB-Reads: evu_profiles (findUnique)
Berechnet: Kontextuelle Warnings basierend auf:
  - Top 3 häufigste Issues für diesen NB
  - Installation-spezifisch (Speicher, Wallbox, kWp)
  - Lange Bearbeitungszeiten (>30d) → WARNING
  - Niedrige Erfolgsquote (<70%) → CRITICAL
Auch genutzt von: /anlagen-wizard (Step 3), /netzanmeldungen (Detail-Panel OverviewTab)
```

---

## 42. NB-Daten: /nb-wissen vs /evu-dashboard — Klare Antwort

| Aspekt | /nb-wissen | /evu-dashboard |
|--------|-----------|---------------|
| **Zweck** | KONFIGURATION + KNOWLEDGE | ANALYTICS + MONITORING |
| **Zielgruppe** | Admin der NB pflegt | Admin der Performance überwacht |
| **NB-Scope** | Nur NB die User "sieht" (Rollen-Filter) | ALLE aktiven NB (global) |
| **Stammdaten** | ✓ (Name, Email, Portal, PLZ) | ✗ |
| **Workflow-Config** | ✓ (Einreichmethode, Tonalität, Kontakte) | ✗ |
| **TAB-Dokumente** | ✓ (Upload + AI-Analyse) | ✗ |
| **Few-Shot Examples** | ✓ (CRUD) | ✗ |
| **Zugangsdaten** | ✓ (via /netzbetreiber) | ✗ |
| **Bearbeitungszeiten** | ✓ (pro NB: Median, Min, Max) | ✓ (Top 5 langsamste) |
| **Erfolgsquote** | ✓ (pro NB) | ✓ (Ø global + Bottom 5) |
| **Rückfrage-Rate** | ✓ (pro NB) | ✗ (nur aggregiert als "Top Issues") |
| **Top Issues** | ✗ | ✓ (Global Top 5, Bar-Chart) |
| **Trends über Zeit** | ✗ | ✗ (kein Zeitreihen-Feature!) |
| **Charts** | ✗ | ✓ (Custom Bar-Chart) |
| **Batch-Analyse Trigger** | ✗ | ✓ ("Alle analysieren" Button) |
| **Datenquelle** | 7 DB-Tabellen direkt | evuProfile (vorberechnet) |
| **Write-Ops** | ✓ (Workflow, TAB, Few-Shot) | ✓ (nur Trigger: analyze-all) |

**Antwort:** /nb-wissen ist für **Konfiguration** (wie arbeiten wir mit diesem NB?), /evu-dashboard ist für **Analytics** (wie performt dieser NB?). **Kein Duplikat**, aber sie lesen teilweise dieselbe `evuProfile`-Tabelle. Die Daten fließen so:

```
evuLearningService.analyzeHistoricalData()
  → SCHREIBT in evuProfile
    → /evu-dashboard LIEST aggregiert (Dashboard)
    → /nb-wissen LIEST pro NB (Knowledge Base)
    → predictionEngine LIEST für Vorhersagen
    → emailEscalation LIEST für Schwellenwerte
```

**⚠️ Fehlend:** Kein Zeitreihen-Feature auf /evu-dashboard — man sieht nur den aktuellen Stand, keine Trends.

---

## Services → Seiten Matrix (ERWEITERT)

| Service | /dashboard | /netzanm. | /vde | /nb-wissen | /calendar | /zw-center | /ctrl-center | /ops-center | /nb-resp. | /finanzen | /evu-dash |
|---------|:---------:|:---------:|:----:|:----------:|:---------:|:----------:|:------------:|:-----------:|:---------:|:---------:|:---------:|
| evuLearning.service | | | | ✓ (Stats) | | | | | | | ✓ (ALL) |
| evuProfile (DB) | ✓ (perf) | | | ✓ (Stats) | | | | | | | ✓ (Agg) |
| getEvuDashboard() | | | | | | | | | | | ✓ |
| getEvuWarnings() | | ✓ (Panel) | | | | | | | | | |
| getEvuTips() | | | | ✓ | | | | | | | |
| analyzeAllEvus() | | | | | | | | | | | ✓ (Btn) |

---

---

## 43. Batch-Analyse: 10 Seiten

### Seite 1: /kunden (978 Z.)
```
KundenPage (pages/admin/KundenPage.tsx)
├── Tab: Users (Benutzerliste mit Rollen-Filter)
├── Tab: Tree View (Kunden-Hierarchie: Kunde → Sub-Users → Installationen)
├── Tab: WhatsApp (WhatsApp-Verknüpfungen verwalten)
├── User-Detail-Panel (Bearbeiten, Passwort, Blockieren)
└── WhatsApp-Modal (Verifizierung, Confirm)

API: GET/POST/PATCH/DELETE /admin/users (13 Endpoints)
     PUT /kunden/:id (HV zuweisen)
     GET/PATCH/POST/DELETE /admin/users/:id/whatsapp

DB: users (R/W), kunden (R/W), installations (R)
Generators: Kundennummer K{YYYY}{00001}
Cross-Page:
  - User.parentUserId → Subunternehmer-Ketten (/finanzen Billing)
  - kunde.accountGesperrt → mahnung.service Stufe 2
  - kunde.handelsvertreterId → /admin/handelsvertreter
  - WhiteLabel: getBillingKundeId() → /netzanmeldungen autoInvoice
```

### Seite 2: /admin/handelsvertreter (1182 Z.)
```
HandelsvertreterPage (features/admin/handelsvertreter/)
├── Liste: HV-Records mit Provisions/Kunden-Count
├── Detail: provisionssatz, IBAN, BIC, oberHvId, steuerNr, ustIdNr
├── Kunden-Tab: Zugewiesene Kunden
├── Provisionen-Tab: HV-spezifische Provisionen
├── HV-Vertrag-Tab (HvContractAdminTab, 602 Z.)
└── Auszahlungs-Modal

API: GET/POST/PATCH /admin/handelsvertreter (8 Endpoints)
     GET /admin/hv/:id, PUT /admin/hv/:id
     GET /admin/hv/:id/provisionen
     POST /admin/hv/:id/auszahlungen

DB: handelsvertreter (R/W), provision (R), kunde (R), hv_contract_audit (R/W)
Generators: HV-Vertrag PDF? (hvContract.service)
Cross-Page:
  - oberHvId → Ober-HV Provisions-Splitting (/admin/provisionen)
  - wiseRecipientId → Wise Payout (/finanzen)
  - kunden Relation → /kunden
  - provisionssatz → /admin/provisionen Berechnung
```

### Seite 3: /admin/provisionen (921 Z.)
```
ProvisionenPage (features/admin/provisionen/)
├── Summary Cards ×3 (Offen, Freigegeben, Ausgezahlt)
├── Filter (Status, HV, Datum)
├── Batch-Auswahl + "Freigeben" Button
├── Provisions-Tabelle (50/Seite, Checkbox-Select)
└── Auszahlungs-Modal (2-Step: HV wählen → Provisionen bestätigen)

API: GET /admin/provisionen (6 Endpoints)
     POST /admin/provisionen/batch-freigeben
     POST /admin/hv/:id/auszahlungen

DB: provision (R/W), provisionsAuszahlung (R/W), handelsvertreter (R)
Generators: SEPA XML, CSV Export (via Auszahlung)

DUPLIKAT-CHECK:
  /admin/provisionen = Standalone-Seite für Provisions-Verwaltung
  /finanzen Tab "Rechnungen" = Zeigt Rechnungen (NICHT Provisionen direkt)
  /admin/handelsvertreter = Zeigt HV-spezifische Provisionen
  → 3 verschiedene Views, aber GLEICHE Backend-Endpoints (/admin/provisionen/*)
  → Kein Code-Duplikat im Backend, nur 3 Frontend-Ansichten
```

### Seite 4: /mastr-admin (620 Z.)
```
MaStRAdminPage (pages/MaStRAdminPage.tsx)
├── Tab: Einheiten (MaStR-verknüpfte PV/Speicher-Einheiten)
├── Tab: Sync (Sync-Historie + Trigger)
├── Tab: Suche (MaStR-Nr. lookup → SOAP API)
├── Status-Panel (API-Verbindung, Kontingent)
└── Match-Modal (Installation ↔ MaStR-Einheit verknüpfen)

API: GET /api/mastr/status, /kontingent, /test (13 Endpoints)
     GET /api/mastr/einheit/solar/:nr, /speicher/:nr
     POST /api/mastr/sync
     POST /api/mastr/installations/:publicId/match

DB: installations (R/W: mastrNummer), factro_projects (R), mastr_sync_log (R/W)
Externe API: BNetzA MaStR SOAP 1.1 (Raw HTTP, kein npm soap)
Generators: SOAP-XML Requests (generiert XML für BNetzA API)
Cross-Page:
  - installations.mastrNummer → /netzanmeldungen Detail-Panel
  - factro_projects → /factro-center (MaStR-Link)
  - InboxItem "mastr_eintragen" → nach IBN erstellt
```

### Seite 5: /ai-center (83 Z. Container)
```
AICenterPage (pages/AICenterPage.tsx — nur Tab-Container)
├── Tab: RAG → RagAdminPage (features/rag-admin/)
│   └── Embedding-Stats, Kategorien, Reindex-Trigger
├── Tab: Brain → BrainAdminPage (features/brain-admin/)
│   └── BrainKnowledge (29 Einträge), Pattern-Overview
├── Tab: Agents → AgentCenterPage (features/agent-center/)
│   └── Agent-Konfiguration
└── Tab: AI Dashboard → ClaudeAIDashboardPage (features/claude-ai-dashboard/)
    └── Email-Klassifikation Stats, Model-Comparison, Learning-Events

API: POST /api/claude-ai/analyze-email/:id (16+ Endpoints)
     POST /api/learning/run, /email-learning, /refresh/:nbId
     GET /api/rag/stats, /categories, POST /api/rag/reindex
     GET /api/brain/knowledge, /patterns

DB: email_classification (R), brain_knowledge (R/W), brain_patterns (R/W),
    rag_query_log (R), rag_embeddings (via pgvector), evu_learning_logs (R)
AI: OpenAI (Classify), Ollama (Classify), GPT-4o (Generate), RAG (pgvector)
Cross-Page:
  - Email-Pipeline Stats → /control-center (Communication Tab)
  - NB-Learning → /nb-wissen, /evu-dashboard
  - RAG → ALLE AI-Services die getSmartContext() nutzen
  - Brain-Patterns → predictionEngine, emailAutomation
```

### Seite 6: /partner-center (1355 Z.)
```
PartnerCenterPage (features/partner-center/)
├── Header + Status-Filter
├── Kanban-ähnliche Job-Liste (Status: RECEIVED → ... → COMPLETED)
├── JobDetailPanel (680px Slide-Over)
│   ├── Tab: Übersicht (Extracted Data)
│   ├── Tab: Dokumente (Partner-Documents)
│   ├── Tab: Kommentare
│   └── Tab: Verlauf
├── Upload-Modal (ZIP)
└── Approve/Reject Actions

API: GET/POST /api/partner/projects (8 Endpoints)
     POST /:id/upload, /approve, /reject, /comments
     GET/POST /api/partner/partners (Admin CRUD)

DB: partner_projects (R/W), partner_documents (R), partner_comments (R/W), partners (R)
Generators: ZIP-Extraction → Document-Classification → Data-Merge → Installation
Pipeline: RECEIVED → EXTRACTING → PARSING → MERGING → REVIEW → BILLING → COMPLETED
Cross-Page:
  - Partner → Installation (/netzanmeldungen) bei Approve
  - Partner-Billing (eigenes Pricing: pvRate, speicherRate, pauschalRate)
  - VDE 4110 → /vde-4110 kann aus PartnerProject laden
```

### Seite 7: /factro-center (3466 Z. — zweitgrößte Seite!)
```
FactroCenterPage (pages/FactroCenterPage.tsx)
├── Config-Selector (Factro-Verbindung auswählen)
├── Kanban-Board (5 Spalten: Inbox, Enriching, Review, Billing, Done)
├── ProjectCard ×N (Status, kWp, Email-Count)
├── DetailPanel (Slide-Over, Collapsible Sections)
│   ├── Kundendaten, Standort, Technik, NB, Projekt-Params
│   ├── Bankhaus, Statik, Sonstiges, Links, Meta
│   └── Emails Tab (Netzanfrage-Verlauf)
├── BatchNetzanfrageModal (Massen-Versand)
└── ConfigModal (CRUD für FactroConfigs)

API: GET/PATCH /api/factro/projects (12 Endpoints)
     POST /factro/projects/:id/create-installation
     POST /factro/netzanfrage/:id/send, /batch/send
     GET/POST/PUT/DELETE /api/factro/configs
     POST /api/factro/poll (Sync triggern)
     GET /factro/projects/:id/comments

DB: factro_projects (R/W), factro_configs (R/W), factro_comments (R),
    email_logs (R/W), installations (W bei create)
Externe API: cloud.factro.com/api/core (api-key Auth)
Generators:
  - factroParser → HTML → 90+ strukturierte Felder
  - factroDocumentImporter → Auto-Kategorisierung
  - factroCommentAnalyzer → Action-Erkennung (Regex)
  - netzanfrage.service → Email an VNB
Cross-Page:
  - FactroProject.factroTaskId ↔ Installation (/netzanmeldungen)
  - emailMatcher nutzt factroProject als Match-Target
  - Netzanfrage → /nb-wissen (VNB-Email), /vde-formulare (als Anhang)
```

### Seite 8: /formulare (817 Z.)
```
FormularLinksPage (pages/FormularLinksPage.tsx)
├── Tab: Meine Links (Formular-Links verwalten)
│   ├── Tabelle (Slug, Titel, Kunde, Views, Submissions)
│   ├── Create/Edit Modal
│   └── Active/Inactive Toggle
└── Tab: Einreichungen (eingegangene Submissions)
    ├── Tabelle (Name, Email, kWp, Status)
    ├── Expandable Row (extrahierte Daten)
    └── Convert → Installation / Reject Actions

API: GET/POST/PATCH/DELETE /api/formulare/links (9 Endpoints)
     GET /api/formulare/submissions
     POST /submissions/:id/convert, /reject

DB: formular_links (R/W), formular_submissions (R/W), installations (W bei convert)
Generators: FormularSubmission → Installation (bei Convert)
Public URL: https://gridnetz.de/formular/{slug}
Cross-Page:
  - KEIN Zusammenhang mit /vde-formulare (komplett getrennt!)
  - KEIN Zusammenhang mit /nb-wissen Formular-Mappings
  - /formulare = Eigene Intake-Formulare für Endkunden
  - /vde-formulare = VDE-AR-N 4105/4110 Norm-PDFs
  - /nb-wissen nbFormMapping = NB-Portal-Automatisierung
  → 3 verschiedene Systeme die alle "Formulare" heißen!
```

### Seite 9: /settings/me (683 Z.)
```
MyCompanySettingsPage (pages/MyCompanySettingsPage.tsx)
├── Persönliche Daten (Name, Email [readonly], Rolle [readonly])
├── Firmendaten (wenn kundeId: Firmenname, Ansprechpartner, Tel, Email)
├── Adresse (Straße, PLZ, Ort, Land)
├── Rechnungsdaten (USt-IdNr, Steuernummer)
├── Passwort ändern (3 Felder)
└── Toast-Notifications

API: GET /api/auth/v2/me (4 Endpoints)
     PATCH /api/auth/me (Name)
     PATCH /api/auth/me/kunde (Firmendaten)
     POST /api/auth/change-password

DB: users (R/W: name), kunden (R/W: firma, adresse, steuerdaten)
Generators: Keine
Cross-Page:
  - User.kundeId → /kunden, /finanzen, /netzanmeldungen
  - EFK-Signatur NICHT hier (→ /signatures Endpoint, separates UI)
  - 2FA NICHT hier (→ eigener Route /settings/security?)
```

### Seite 10: /anlagen-wizard (7500+ Z. — größtes Feature!)
```
AnlagenWizardPage (26 Z.) → WizardMain (wizard/components/wizard/WizardMain.tsx, 709 Z.)
├── WizardHeader (Schritt-Anzeige 1-5)
├── Step 1: Standort (341 Z.) — PLZ, Ort, Straße, GPS → NB-Auto-Erkennung
├── Step 2: Betreiber (302 Z.) — Name, Email, Telefon, Firma
├── Step 3: Endkunde (276 Z.) — Falls abweichend vom Betreiber
├── Step 4: Netzanschluss (389 Z.) — Zähler, Einspeiseart, §14a, Messkonzept
├── Step 5: Anlagen-Technik (567 Z.) — PV-Module, WR, Speicher, WB, WP (Produkt-DB)
├── RightSidebar — SmartSuggestions (AI), Product-Preview, VDE-Check
├── LageplanEditor — Map + Marker + Upload
└── Modals: NB-Auswahl, Produkt-Suche, Admin-User-Selector

Steps gesamt: 2349 Z. + wizard/ Verzeichnis: 133 Dateien

API: POST /api/wizard/start → Installation erstellen (6 Endpoints)
     PUT /api/installations/:id (schrittweiser Update)
     GET /api/netzbetreiber?plz= (NB-Suche)
     POST /api/installations/:id/lageplan/upload
     GET /api/produkte?typ=&filter= (Autocomplete)
     POST /api/installations/:id/learn (Wizard-Learning)

DB: installations (CREATE + schrittweise UPDATE), netzbetreiber (R), produkte (R)
Generators:
  - Installation (bei /wizard/start)
  - Lageplan (bei Upload)
  - Smart-Suggestions (RAG-basiert)
Cross-Page:
  - Wizard erstellt Installation → erscheint auf /netzanmeldungen
  - PLZ → NB-Zuordnung → /nb-wissen netzbetreiber
  - Produkt-Auswahl → produkte-DB → /produkte-db
  - technicalData JSON → /vde-formulare (installationDataAssembler)
  - wizardContext JSON → /netzanmeldungen Detail-Panel (TechTab)
  - Nach Completion → Redirect zu /netzanmeldungen/:publicId
```

---

## 44. Batch-Analyse Zusammenfassung

### Alle analysierten Seiten (18 total)

| # | Seite | Zeilen | Endpoints | Haupt-Tabellen | Typ |
|---|-------|--------|-----------|---------------|-----|
| 1 | /dashboard | 238+590 | 8 | installations, inbox_items | Overview |
| 2 | /netzanmeldungen | 283+975+2103 | 40+ | installations, documents, comments | Core |
| 3 | /vde-formulare | 16+718 | 7 | vde_formular_sets, documents | Generator |
| 4 | /vde-4110 | 869 | 7 | vde_formular_sets, partner_documents | Generator |
| 5 | /nb-wissen | 1692 | 8 | netzbetreiber, evu_profiles, nb_tab_documents | Knowledge |
| 6 | /calendar | 993+541+205 | 15 | calendar_appointments, calendar_availability | Scheduling |
| 7 | /zaehlerwechsel-center | 1050 | 5 | calendar_appointments, installations | Scheduling |
| 8 | /control-center | 3000+ | 10 | installations, emails, rechnungen | Executive |
| 9 | /ops-center | 863 | 10 | installations, ops_reminder_log | Operations |
| 10 | /nb-response | 600+ | 6 | nb_response_tasks, nb_complaints | AI-Ops |
| 11 | /finanzen | 252+953+990+618 | 90+ | rechnungen, provisionen, accounts | Finance |
| 12 | /evu-dashboard | 771 | 11 | evu_profiles, installations | Analytics |
| 13 | /kunden | 978 | 13 | users, kunden | Admin |
| 14 | /admin/handelsvertreter | 1182 | 8 | handelsvertreter, provision | Admin |
| 15 | /admin/provisionen | 921 | 6 | provision, provisionsAuszahlung | Finance |
| 16 | /mastr-admin | 620 | 13 | installations, mastr_sync_log | Integration |
| 17 | /ai-center | 83 (Container) | 16+ | brain_*, rag_*, email_classification | AI-Admin |
| 18 | /partner-center | 1355 | 8 | partner_projects, partner_documents | Intake |
| 19 | /factro-center | 3466 | 12 | factro_projects, factro_comments | Integration |
| 20 | /formulare | 817 | 9 | formular_links, formular_submissions | Intake |
| 21 | /settings/me | 683 | 4 | users, kunden | Settings |
| 22 | /anlagen-wizard | 7500+ | 6 | installations, netzbetreiber, produkte | Intake |

### Duplikat-Cluster

**Cluster 1: Installations-Status-Counts (6× implementiert!)**
- /dashboard `/summary` (inline, Redis 60s)
- /dashboard `/alerts` (inline, kein Cache)
- /netzanmeldungen `/stats` (inline, kein Cache)
- /netzanmeldungen `/enterprise` KPIs (inline, kein Cache)
- /control-center `/overview` (inline, kein Cache)
- /ops-center `/stats` (inline, kein Cache)
→ **6 verschiedene Endpoints zählen dieselben Installationen**

**Cluster 2: NB-Reminder (2× implementiert)**
- ops.service.sendReminder() → ops_reminder_log
- nbCommunication.service.checkNbReminders() → nb_correspondences
→ **Verschiedene Templates, Logs, Eskalationsregeln, Zähler**

**Cluster 3: VDE-PDF-Generierung (6× implementiert)**
- Backend 4105: vde-pdf-service.ts (622 Z., pdf-lib)
- Backend 4110: vde4110-pdf-service.ts (558 Z., pdf-lib)
- Frontend 1: vdeGenerator.ts (675 Z., jsPDF)
- Frontend 2: VDEFormulareGenerator.ts (446 Z., jsPDF)
- Frontend 3: VDEFormularePDF.ts (257 Z., jsPDF)
- Frontend 4: VDEFormularePremium.ts (973 Z., jsPDF)
→ **3.531 Zeilen, davon 2.351 Frontend-Duplikate**

**Cluster 4: "Formulare" (3 verschiedene Systeme!)**
- /formulare → formular_links (Intake-Formulare für Endkunden)
- /vde-formulare → vde_formular_sets (VDE-Norm-PDFs)
- /nb-wissen → nbFormMapping (NB-Portal-Automatisierung)
→ **Gleicher Name, komplett verschiedene Systeme**

**Cluster 5: Termin-Systeme (4 isolierte Systeme)**
- calendar_appointments (Calendar + Zählerwechsel)
- deadlines (Workflow V2)
- projekt_termine (Dashboard)
- installations.zaehlerwechselDatum (Installations-Feld)
→ **Dashboard zeigt andere Termine als Calendar!**

**Cluster 6: Installations-Intake (3 Eingangspunkte)**
- /anlagen-wizard → Installation direkt erstellen (Hauptpfad)
- /formulare → FormularSubmission → Convert → Installation
- /partner-center → PartnerProject → Approve → Installation
- /factro-center → FactroProject → create-installation → Installation
→ **4 Wege eine Installation zu erstellen, alle mit verschiedener Datenqualität**

### Generatoren-Gesamtliste (22 Generatoren)

| # | Generator | Typ | Library | Seiten |
|---|-----------|-----|---------|--------|
| 1 | Schaltplan | PDF A3 | Python/reportlab | /netzanmeldungen, /nb-response |
| 2 | Lageplan | PDF | Satellitenbild | /netzanmeldungen, /anlagen-wizard |
| 3 | Vollmacht | PDF A4 | PDFKit | /netzanmeldungen |
| 4 | VDE 4105 E1-E8 | PDF | pdf-lib (Backend) | /vde-formulare, /netzanmeldungen, /nb-response |
| 5 | VDE 4110 E1/E8/E10 | PDF | pdf-lib (Backend) | /vde-4110, /partner-center |
| 6 | VDE Frontend (4×) | PDF | jsPDF (Frontend) | /netzanmeldungen, /anlagen-wizard |
| 7 | Invoice PDF | PDF A4 | PDFKit | /finanzen, /netzanmeldungen (auto) |
| 8 | autoInvoice | Orchestrator | — | /netzanmeldungen (Trigger), /finanzen (Ergebnis) |
| 9 | SEPA XML | XML | String-Build | /admin/provisionen |
| 10 | CSV Export | CSV | String-Build | /admin/provisionen |
| 11 | Tax Package | ZIP+CSV | — | /finanzen/berichte |
| 12 | HV-Report | HTML Email | String-Concat | Cron (automatisch) |
| 13 | Payment Link | URL | Wise API | /finanzen, /netzanmeldungen |
| 14 | AI Beleg-Extraktion | AI Parse | GPT-4o | /finanzen/ausgaben |
| 15 | ICS Calendar | ICS | Inline | /calendar, /zw-center |
| 16 | Email (MJML) | HTML | Handlebars+MJML | Überall |
| 17 | Projektmappe | ZIP/PDF | — | /netzanmeldungen |
| 18 | MaStR SOAP | XML | Raw HTTP | /mastr-admin |
| 19 | factroParser | Data | Regex | /factro-center |
| 20 | Partner-Intake | Data | ZIP+AI | /partner-center |
| 21 | Smart-Suggestions | AI | RAG | /anlagen-wizard |
| 22 | Netzanfrage | Email | Template | /factro-center, /netzanmeldungen |

### Services auf 5+ Seiten (Kandidaten für zentralen Service-Layer)

| Service | Seiten-Count | Seiten |
|---------|-------------|--------|
| `getVisibleKundeIds()` | 10+ | ALLE authentifizierten Seiten |
| `installations` DB-Tabelle | 15+ | Fast alle Seiten |
| `emailGateway.service` | 8 | /netzanm., /vde, /calendar, /zw-center, /ctrl-center, /ops-center, /nb-response, /finanzen |
| `netzbetreiber` DB-Tabelle | 8 | /nb-wissen, /netzanm., /vde, /dashboard, /ops-center, /evu-dash, /anlagen-wizard, /factro |
| `evuProfile` DB-Tabelle | 5 | /evu-dash, /nb-wissen, /dashboard, /netzanm. (Warnings), predictionEngine |
| `pricing.service` | 3 | /netzanm. (auto), /finanzen, /partner-center (eigenes!) |
| `inboxItemGenerator` | 6+ | /dashboard, /netzanm., /nb-response, emailAutomation, workflowV2, Crons |

### Wizard → Lifecycle Verbindung

```
/anlagen-wizard
  → Installation erstellt (technicalData + wizardContext JSON)
    ↓
/netzanmeldungen (Liste + Detail-Panel)
  → Status BEIM_NB
    → autoInvoice (/finanzen)
    → workflow.service → Emails
    → inboxItemGenerator → InboxItems
    ↓
  → NB antwortet (Email)
    → emailPipeline → openaiClassifier
    → emailAutomation → nbResponseTask
    → /nb-response → Auto-Resolve
    ↓
  → Status GENEHMIGT
    → /zaehlerwechsel-center → Termin planen
    → Zähler gewechselt
    ↓
  → Status IBN
    → VDE E.8 (IBN-Protokoll) → /vde-formulare
    → MaStR-Meldung → /mastr-admin
    ↓
  → Status FERTIG
    → Alle InboxItems aufgelöst
    → nbLearning → evuProfile → /evu-dashboard
    ↓
  → Kunde zahlt
    → wise.service → Auto-Match → /finanzen
    → provision.create → /admin/provisionen
    → mahnung (wenn nicht zahlt) → Kontosperre → /kunden
```

---

---

## 45. Komponentenbaum: /portal (Endkunden-Portal)

```
PortalLayout (portal/PortalLayout.tsx)
├── Sidebar/Navbar: Dashboard, Dokumente, Nachrichten, Einstellungen
├── NotificationBell (portal/components/NotificationBell.tsx) — Badge + Dropdown
├── AlertBanner (bei offenen Rückfragen)
├── Impersonation-Banner (Admin-Ansicht)
│
├── /portal/login → LoginPage (Particle-Animation, 3D-Tilt)
├── /portal/onboarding → OnboardingPage
│   ├── Step 1: Welcome
│   └── Step 2: Consent (Email Pflicht, WhatsApp optional + Verifizierung)
│
├── /portal → DashboardPage
│   ├── Links: Prozess-Schritte (5 Stufen), "Was passiert als Nächstes?", Tipps
│   ├── Mitte: Status, Kundenfreigabe-Banner, Doc-Status, Timeline
│   ├── Rechts: Anlage-Info, Installateur-Kontakt, Technik, NB, FAQ (5 Einträge)
│   └── Installation-Selector (bei Multi-Installationen)
│
├── /portal/documents → DocumentsPage
│   ├── 8 Kategorien (4 Pflicht + 4 Optional)
│   ├── Completeness-Bar (fulfilled/total)
│   ├── Upload pro Kategorie
│   └── Status: UPLOADED → VERIFIED → REJECTED
│
├── /portal/messages → MessagesPage
│   ├── Chat-UI (Polling 15s)
│   ├── Sender: BETREIBER, SYSTEM, INSTALLATEUR
│   └── File-Upload
│
├── /portal/settings → SettingsPage
│   ├── Account-Info
│   ├── Passwort ändern
│   └── WhatsApp verwalten
│
└── /portal/notifications → NotificationsPage
    └── Timeline aller Benachrichtigungen

State: PortalContext (installations[], selectedInstallation, onboardingStatus, unreadCount)
Polling: Notifications alle 30s, Messages alle 15s
Auth: portalAuth.ts (EIGENES System, ENDKUNDE_PORTAL Rolle)
```

---

## 46. API-Ketten: /portal

### Kette #62: Portal-Installationen laden
```
UI: PortalContext → useEffect
Frontend: GET /api/portal/installations
Route: portal.routes.ts (2282 Z.)
Service: Inline
DB-Reads:
  - portal_user_installations (WHERE userId = currentUser)
  - installations (findMany WHERE id IN [linkedIds])
  - endkunden_consent (findFirst WHERE installationId)
Scoping: NUR eigene Installationen via portalUserInstallation-Tabelle
Cache: nein
⚠️ EIGENER Endpoint, NICHT /api/installations!
```

### Kette #63: Installation-Detail (Portal-Version)
```
UI: DashboardPage → Installation auswählen
Frontend: GET /api/portal/installation/:id
Route: portal.routes.ts
Service: Inline
Scoping: requireInstallationAccess() → prüft portalUserInstallation
DB-Reads:
  - installations (findUnique mit netzbetreiber, createdBy)
  - endkunden_consent
  - documents (Completeness-Check)
Response: REDUZIERT — kein Pricing, keine Rechnungen, keine Admin-Felder
⚠️ EIGENER Response-Shape, NICHT wie /netzanmeldungen/:id
```

### Kette #64: Dokumente (Upload + Download)
```
UI: DocumentsPage → Upload/Download
Frontend: POST /api/portal/installation/:id/documents/upload (FormData)
          GET /api/portal/installation/:id/documents
Route: portal.routes.ts
Service: Inline (gleicher Disk-Upload wie Admin, aber portal-spezifische Validierung)
DB-Reads: documents (WHERE installationId, filtered by portal-sichtbare Kategorien)
DB-Writes: documents (CREATE bei Upload)
⚠️ Portal-User kann Dokumente hochladen aber NICHT löschen
⚠️ Upload triggert KEINE notifyDocumentUpload (anders als Admin-Upload)
```

### Kette #65: Nachrichten (Chat)
```
UI: MessagesPage → Chat + Polling (15s)
Frontend: GET /api/portal/installation/:id/messages
          POST /api/portal/installation/:id/messages
Route: portal.routes.ts
Service: Inline
DB-Reads: portal_messages oder comments (WHERE installationId, visibility: CUSTOMER/BOTH)
DB-Writes: portal_messages (CREATE)
⚠️ EIGENES Nachrichten-System, NICHT die Admin-Comments
```

### Kette #66: Onboarding + DSGVO Consent
```
UI: OnboardingPage → 2 Steps
Frontend: GET /api/portal/onboarding/status
          POST /api/portal/onboarding/consent {emailConsent, whatsappConsent}
          POST /api/portal/onboarding/complete
Route: portal.routes.ts
Service: Inline
DB-Reads: endkunden_consent
DB-Writes: endkunden_consent (UPDATE: emailConsent, whatsappConsent, onboardingCompleted)
Side Effects: Bei whatsappConsent → WhatsApp-Verifizierung starten
```

### Kette #67: Benachrichtigungen
```
UI: NotificationBell → Polling 30s
Frontend: GET /api/portal/notifications?unreadOnly=true
          GET /api/portal/notifications/count
          POST /api/portal/notifications/read
Route: portal.routes.ts
Service: portalNotificationCreator.service.ts (SCHREIBER)
DB-Reads: portal_notifications (WHERE userId = current)
DB-Writes: portal_notifications (UPDATE: read, readAt)
Typen: STATUS_CHANGE, NEW_MESSAGE, DOCUMENT_REQUEST, RUECKFRAGE
```

### Kette #68: Kundenfreigabe (NB-Portal)
```
UI: DashboardPage → Kundenfreigabe-Banner
Frontend: GET /api/portal/installation/:id/kundenfreigabe/status
          POST /api/portal/installation/:id/kundenfreigabe/done
Route: portal.routes.ts
Service: Inline
DB-Reads: installations (kundenfreigabeNoetig, kundenfreigabeErledigt)
DB-Writes: installations (UPDATE: kundenfreigabeErledigt = true)
```

---

## 47. Portal-Architektur (NEU)

### Auth: Eigenes System
```
Admin-Auth (middleware/auth.ts):
  - JWT mit userId, email, role (ADMIN/MITARBEITER/HV/KUNDE/SUB)
  - tokenVersion Check gegen DB
  - Session Cookie Fallback
  - Inactivity 4h

Portal-Auth (middleware/portalAuth.ts):
  - GLEICHER JWT Mechanismus (auth.ts → portalAuth.ts als Zusatz)
  - Role-Check: ENDKUNDE_PORTAL only
  - Installation-Scoping via portalUserInstallation Tabelle
  - Onboarding-Check: 428 wenn nicht abgeschlossen
  - lastPortalVisit Tracking (fire-and-forget)
```

### Shared vs Eigene Services
```
SHARED (Portal nutzt Admin-Code mit Auth-Filter):
  - JWT-Generierung (auth.routes → gleicher Login)
  - Passwort-Reset (gleicher Flow)
  - Disk-Upload (gleicher Multer, gleicher Speicherpfad)

EIGENE Portal-Services:
  - portalUser.service → User-Erstellung, Installation-Verknüpfung
  - portalNotification.service → Email/WhatsApp an Endkunde
  - portalNotificationCreator.service → In-App Notifications
  - endkundenContactGuard.ts → Consent-Check (fail-open!)

EIGENE Portal-Endpoints (NICHT /api/installations etc.):
  - /api/portal/installations (eigener Endpoint, eigener Response-Shape)
  - /api/portal/installation/:id (reduzierte Felder)
  - /api/portal/installation/:id/documents (gefilterte Kategorien)
  - /api/portal/installation/:id/messages (eigenes Chat-System)
  - /api/portal/onboarding/* (Consent-Flow)
  - /api/portal/notifications/* (In-App)
  - /api/portal/kundenfreigabe/* (NB-Portal Freigabe)

NICHT erreichbar vom Portal:
  - VDE-Generatoren
  - Schaltplan/Lageplan-Generierung
  - Rechnungs-System (explizit entfernt!)
  - NB-Kommunikation (direkt)
  - Status-Änderungen
  - Dokument-Löschung
  - Admin-Funktionen
  - Wise/Accounting
  - Provisionen
```

### Data-Scoping
```
Portal-User sieht NUR:
  ✓ Eigene Installationen (via portalUserInstallation FK)
  ✓ Dokumente dieser Installationen (gefilterte Kategorien)
  ✓ Nachrichten dieser Installationen (CUSTOMER/BOTH visibility)
  ✓ Timeline dieser Installationen (Status + Docs + Messages)
  ✓ Benachrichtigungen (eigene portal_notifications)

Portal-User sieht NICHT:
  ✗ Andere Kunden/Installationen
  ✗ NB-Details (Name ja, aber nicht Email/Portal)
  ✗ Rechnungen (explizit entfernt)
  ✗ Admin-Kommentare (isInternal=true)
  ✗ Pricing-Daten
  ✗ HV/Provisions-Daten
  ✗ Workflow V2 Interna (Phase/Zustand)
```

---

## 48. Generator-Zugriff nach Rolle (NEU)

| Generator | ADMIN | MITARBEITER | HV | KUNDE | SUB | ENDKUNDE_PORTAL | PARTNER |
|-----------|:-----:|:-----------:|:--:|:-----:|:---:|:---------------:|:-------:|
| VDE 4105 E1-E8 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VDE 4110 E1/E8/E10 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ (eigene) |
| Schaltplan | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Lageplan | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Vollmacht | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Invoice PDF | ✓ | ✓ | ✗ | Download | ✗ | ✗ | ✗ |
| Netzanfrage | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| SEPA/CSV Export | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Tax Package | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MaStR SOAP | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Email (Senden) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Doc Upload | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (eingeschränkt) | ✓ |
| AI Auto-Resolve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Smart Suggestions | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## Zusammenhänge (Portal → Rest)

### Portal ist ein eigenständiges Produkt
- **Komplett eigene Endpoints** (/api/portal/*), nicht gefilterte Admin-Endpoints
- **Eigenes Response-Format** (reduzierte Felder, keine Finanzdaten)
- **Eigenes Nachrichten-System** (portal_messages, nicht admin comments)
- **Eigenes Notification-System** (portal_notifications + In-App + Polling)
- **Eigener DSGVO-Flow** (Onboarding mit Consent-Checkboxen)

### Berührungspunkte mit Admin-System
- **Installation-Daten** werden von beiden gelesen (verschiedene Endpoints, gleiche DB)
- **Dokumente** werden in gleicher Tabelle gespeichert, aber Portal sieht nur subset
- **Status-Änderungen** auf Admin-Seite → portalNotificationCreator → In-App Notification
- **Workflow-Emails** werden via workflow.service an Portal-User gesendet (wenn Consent)
- **WhatsApp** geht über gleichen whatsappMessage.service (wenn Consent + verified)
- **InboxItems** mit `visibility: CUSTOMER` werden im Portal angezeigt

### Portal ↔ /netzanmeldungen
- Admin aktiviert Portal → `POST /admin/installations/:id/activate`
- Portal-User uploaded Dokument → sichtbar im Admin Detail-Panel DocumentsTab
- Admin schreibt Nachricht → sichtbar im Portal MessagesPage
- Status-Change (Admin) → Portal-Notification + Optional Email/WhatsApp

---

---

## 49. Dead Code Report (14 Dateien, ~5.800 Zeilen)

### Komplett ungenutzte Services (0 Imports)

| # | Datei | Zeilen | Exports | Sicher löschbar |
|---|-------|--------|---------|----------------|
| 1 | `services/installationAI.service.ts` | ~380 | checkQuality, checkDocCompleteness, getSuggestions | Ja |
| 2 | `services/nbDomainMapping.service.ts` | 128 | getAllNbMappings, getNbMapping, upsertNbMapping | Ja |
| 3 | `services/product.service.ts` | 447 | productService (AI-Produktsuche mit GPT-4) | Ja |
| 4 | `services/workflowInbox.service.ts` | 177 | processEmailQueue | Ja |

### Nicht registrierte Route-Dateien (in index.ts nicht importiert)

| # | Datei | Zeilen | Grund | Sicher löschbar |
|---|-------|--------|-------|----------------|
| 5 | `routes/admin.users.routes.ts` | 451 | Duplikat von adminUsers.routes.ts | Ja |
| 6 | `routes/companySettings.routes.ts` | 43 | Ersetzt durch settings.routes.ts | Ja |
| 7 | `routes/emailCommandCenter.routes.ts` | 885 | Ersetzt durch emailAdmin.routes.ts | Ja |
| 8 | `routes/emailTracking.routes.ts` | 95 | Phase 4 Cleanup entfernt | Ja |
| 9 | `routes/intelligence.routes.ts` | 542 | Phase 4 entfernt | Ja |
| 10 | `routes/installationPatch.routes.ts` | 73 | Nicht registriert | Ja |
| 11 | `routes/vde4110Formular.routes.ts` | 724 | Nicht in index.ts | Prüfen! |
| 12 | `routes/uploadQueue.routes.ts` | 22 | Nicht registriert | Ja |
| 13 | `routes/partner.routes.ts` | 744 | Nicht in index.ts | Prüfen! |
| 14 | `routes/hvLeads.routes.ts` | 748 | Nicht in index.ts | Prüfen! |

**Gesamt Dead Code: ~5.800 Zeilen (12 sicher löschbar, 3 prüfen)**

---

## 50. Security Findings (20 Findings)

### CRITICAL (2)

| # | Datei:Zeile | Problem | Fix |
|---|-------------|---------|-----|
| S1 | `middleware/auth.ts:85` | JWT `ignoreExpiration: !!req.query.token` erlaubt abgelaufene Tokens via Query-Parameter | `ignoreExpiration` komplett entfernen |
| S2 | `routes/calendar.routes.ts:1102` | Public booking akzeptiert `assignedUserId` ohne Validierung — Angreifer kann Termine beliebigen Usern zuweisen | `assignedUserId` aus public body entfernen |

### HIGH (5)

| # | Datei:Zeile | Problem |
|---|-------------|---------|
| S3 | `routes/archiv.routes.ts:38` | `$queryRawUnsafe` mit String-Interpolation (SQL Injection Risiko) |
| S4 | `routes/intelligence.routes.ts:146+` | Mehrere `$executeRaw` mit `parseInt()` ohne NaN-Check |
| S5 | `routes/factro.routes.ts` (mehrfach) | `parseInt(req.params.id)` ohne NaN-Validierung |
| S6 | `routes/calendar.routes.ts:576` | `/slots` Endpoint exponiert ALLE Staff-Verfügbarkeiten an alle Auth-User |
| S7 | Alle POST/PUT/DELETE Routes | Kein CSRF-Token-Schutz (CORS-only ist nicht ausreichend) |

### MEDIUM (10)

| # | Problem | Dateien |
|---|---------|---------|
| S8 | `parseInt()` ohne NaN-Check | 20+ Route-Dateien |
| S9 | `JSON.parse()` ohne try-catch | emailMatcher, index.ts, diverse |
| S10 | Fehlende Rate-Limiting auf `/public/book` | calendar.routes.ts |
| S11 | HMAC-Token auf 32 Zeichen gekürzt | rechnung.routes.ts:35 |
| S12 | Unsichere Temp-Files mit `Math.random()` | partner/classifier.ts:294 |
| S13 | Path Traversal Risiko in NB-Portal-Proxy | nbPortalProxy.routes.ts:777 |
| S14 | WebSocket Token ohne Rate-Limiting | websocket.service.ts:59 |
| S15 | JSON-Parsing in Startup ohne Error-Handling | index.ts:546 |
| S16 | Boolean Injection via Query-Params | wise.routes.ts:142 |
| S17 | Neue PrismaClient Instanz statt Shared | archiv.routes.ts:8 |

---

## 51. Performance Issues (15 Issues)

### CRITICAL (2)

| # | Problem | Datei | Impact |
|---|---------|-------|--------|
| P1 | **94 PrismaClient Instanzen** — jede Route-Datei erstellt `new PrismaClient()` statt Shared Singleton | 94 Route-Dateien | 940 potenzielle DB-Connections, Memory-Leak |
| P2 | **Fehlende Composite-Indizes** auf `installations(deletedAt, status)`, `installations(kundeId, netzbetreiberId)`, `emails(installationId, receivedAt)` | schema.prisma | Full Table Scans bei 100k+ Rows |

### HIGH (3)

| # | Problem | Datei | Impact |
|---|---------|-------|--------|
| P3 | N+1 in `/netzbetreiber/performance`: 40 COUNT-Queries statt 1 groupBy | netzbetreiber.routes.ts:732 | 200-500ms extra |
| P4 | Fehlende Timeouts auf External API Calls (Lageplan, PVGIS, teilw. Factro) | lageplan.ts, solarCalculator | Request hängt bei API-Ausfall |
| P5 | Factro Polling sequentiell: 500 HTTP-Calls in Loop statt parallel | factro.service.ts:468 | Cron dauert 5+ Minuten |

### MEDIUM (8)

| # | Problem | Datei | Impact |
|---|---------|-------|--------|
| P6 | Dashboard lädt ALLE Aktivitäten ohne Limit | dashboard.routes.ts:66 | MB-Payload bei 50k+ Installationen |
| P7 | 6 separate COUNT-Queries für Pipeline-Stages | dashboard.routes.ts:87 | 50-100ms (statt 1 groupBy) |
| P8 | NB-Learning: In-Memory Aggregation statt SQL | nbLearning.service.ts:70 | 200-500ms pro NB |
| P9 | Sync File-Ops (mkdirSync, readFileSync, statSync) | 5 Dateien | Event Loop Blocking |
| P10 | Fehlender Cache auf `/netzbetreiber/performance`, `/netzanmeldungen/stats` | Diverse | 8-10s Dashboard bei 10 Usern |
| P11 | `GET /rechnungen?limit=9999` lädt ALLE Rechnungen | rechnung.routes.ts | Unbegrenzter Payload |
| P12 | predictionEngine: 3-5 separate Queries pro Detail-View | predictionEngine.service.ts | 100-200ms extra |
| P13 | JSON.parse in Loops (plzBereiche pro NB) | netzbetreiber.routes.ts:627 | 10-50ms bei 500+ NBs |

### LOW (2)

| # | Problem | Impact |
|---|---------|--------|
| P14 | In-Memory Maps ohne Max-Size | Langsames Wachstum |
| P15 | Doppelte JSON.parse in safeJson() Helper | <1ms |

---

## 52. Vollständige Generator-Liste (100+ Generatoren, kategorisiert)

### PDF-Generatoren (22)

| # | Generator | Datei | Library | Output |
|---|-----------|-------|---------|--------|
| 1 | Invoice PDF | invoicePdf.service.ts:130 | PDFKit | A4 Rechnung |
| 2 | VDE 4105 E.1 | vde-pdf-service.ts:209 | pdf-lib | Antragstellung |
| 3 | VDE 4105 E.2 | vde-pdf-service.ts:263 | pdf-lib | Datenblatt EZA |
| 4 | VDE 4105 E.3 | vde-pdf-service.ts:313 | pdf-lib | Datenblatt Speicher |
| 5 | VDE 4105 E.8 | vde-pdf-service.ts:402 | pdf-lib | IBN-Protokoll |
| 6 | VDE 4110 E.1 | vde4110-pdf-service.ts:36 | pdf-lib | MS Antragstellung |
| 7 | VDE 4110 E.1+Sig | vde4110-pdf-service.ts:103 | pdf-lib | Mit EFK-Signatur |
| 8 | VDE 4110 E.8 (5p) | vde4110-pdf-service.ts:162 | pdf-lib | MS Datenblatt |
| 9 | VDE 4110 E.8+Sig | vde4110-pdf-service.ts:309 | pdf-lib | Mit Signatur |
| 10 | VDE 4110 E.10 (2p) | vde4110-pdf-service.ts:339 | pdf-lib | MS IBN-Protokoll |
| 11 | VDE 4110 E.10+Sig | vde4110-pdf-service.ts:420 | pdf-lib | Dual-Signatur |
| 12 | HV-Vertrag PDF | hvContract.service.ts:111 | PDFKit | Personalisierter Vertrag |
| 13 | HV-Vertragsbestätigung | hvContract.service.ts:332 | PDFKit | Annahme-PDF |
| 14 | HV-Provisionsreport PDF | automations/hvReport.ts:66 | PDFKit | Monatsreport |
| 15 | Vollmacht | documentGenerator/vollmacht.ts:27 | PDFKit | Vollmacht mit Checkboxen |
| 16 | Lageplan | documentGenerator/lageplan.ts:103 | PDFKit+MapTiler | Satellitenbild+PV |
| 17 | Schaltplan (Python) | documentGenerator/schaltplanGeneratorPython.ts:88 | Python/reportlab | A3 Schaltplan |
| 18 | Schaltplan (Legacy) | documentGenerator/schaltplan.ts:35 | PDFKit | Deprecated A4 |
| 19 | Formular-PDF | formularPdf.service.ts:643 | pdf-lib | Anmeldungsformular |
| 20 | Formular-PDF (Low-Level) | formularPdf.service.ts:494 | pdf-lib | AcroForm Felder |
| 21 | Dokument-Set Orchestrator | documentGenerator/index.ts:33 | Multi | VDE+Schaltplan+Vollmacht+Lageplan |
| 22 | EFK-Signatur-Overlay | efkSignature.service.ts | pdf-lib | Signatur in PDF einbetten |

### Email-Generatoren (11)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 23 | MJML Template Renderer | emailTemplate.service.ts:154 | DB-Template → HTML |
| 24 | Email Gateway (SMTP) | emailGateway.service.ts:293 | Versand via Nodemailer |
| 25 | Auto-Reply Draft | emailAutoreply.service.ts:152 | GPT-4o generierter Entwurf |
| 26 | Netzanfrage Subject | netzanfrageGenerator.service.ts:406 | Dynamischer Betreff |
| 27 | Netzanfrage Body | netzanfrageGenerator.service.ts:416 | Dynamischer Email-Body |
| 28 | NB-Korrespondenz | nbCommunication.service.ts:64 | NB-Email mit Tracking |
| 29 | NB Subject-Generator | nbCommunication.service.ts:224 | Typ-basierter Betreff |
| 30 | Booking-Bestätigung | bookingEmail.service.ts | HTML+ICS an Kunde |
| 31 | ZW-Termin Email | zaehlerwechselTermin.service.ts | Errichter+Endkunde |
| 32 | Portal-Benachrichtigung | portalNotification.service.ts | Endkunde Email/WhatsApp |
| 33 | Portal In-App Notification | portalNotificationCreator.service.ts | Status/Message/Doc Alerts |

### ICS-Generatoren (2)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 34 | Booking ICS | bookingEmail.service.ts:216 | Termin-Kalender-Datei |
| 35 | Zählerwechsel ICS | zaehlerwechselTermin.service.ts:47 | ZW-Termin-Kalender |

### Export-Generatoren (12)

| # | Generator | Datei | Output |
|---|-----------|-------|--------|
| 36 | SEPA XML | provision/provisionQuery.service.ts | pain.001.001.03 |
| 37 | Provisions CSV | provision/provisionQuery.service.ts | UTF-8 CSV |
| 38 | Tax Package ZIP | accounting/yearEnd.service.ts:404 | ZIP mit 8+ CSVs |
| 39 | Income Statement CSV | accounting/yearEnd.service.ts:645 | Einnahmen/Ausgaben |
| 40 | Balance Sheet CSV | accounting/yearEnd.service.ts:672 | Bilanz |
| 41 | Trial Balance CSV | accounting/yearEnd.service.ts:708 | Saldenliste |
| 42 | Intercompany CSV | accounting/yearEnd.service.ts:757 | Konzernbuchungen |
| 43 | Invoices CSV | accounting/yearEnd.service.ts:784 | Rechnungsliste |
| 44 | Expenses CSV | accounting/yearEnd.service.ts:803 | Ausgabenliste |
| 45 | Wise Statement CSV | accounting/yearEnd.service.ts:823 | Bank-Transaktionen |
| 46 | XLSX Report | report.routes.ts | Excel Workbook |
| 47 | Invoice ZIP Archive | rechnung.routes.ts:248 | ZIP mit PDFs |

### WhatsApp-Generatoren (9)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 48 | WA Text | whatsappMessage.service.ts:49 | Freitext |
| 49 | WA Installation Summary | whatsappMessage.service.ts:119 | Formatierte Zusammenfassung |
| 50 | WA Welcome | whatsappMessage.service.ts:177 | Willkommen |
| 51 | WA Follow-Up | whatsappMessage.service.ts:201 | Nachfrage |
| 52 | WA Success | whatsappMessage.service.ts:208 | Bestätigung |
| 53 | WA Cancellation | whatsappMessage.service.ts:223 | Stornierung |
| 54 | WA Unclear | whatsappMessage.service.ts:236 | Unklare Anfrage |
| 55 | WA Yes/No Buttons | whatsappMessage.service.ts:254 | Auswahl-Buttons |
| 56 | WA Template (Betreiber) | betreiberChat.service.ts:533 | Template-basiert |

### SOAP/XML-Generatoren (2)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 57 | SOAP Envelope | mastr.service.ts:164 | MaStR API XML |
| 58 | SOAP Request | mastr.service.ts:173 | HTTPS SOAP Call |

### AI-Content-Generatoren (10)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 59 | Installation Summary | ai/qualityCheck.service.ts:138 | AI-generierte Zusammenfassung |
| 60 | Installation Alerts | ai/qualityCheck.service.ts:269 | AI-generierte Warnungen |
| 61 | Rückfrage-Response | ai/emailGenerate.service.ts:100 | AI Email-Antwort |
| 62 | Local LLM Reply | ai/localAI.service.ts:400 | Ollama Email-Antwort |
| 63 | Claude Response | claude/claudeCodeClient.ts:245 | Claude API Antwort |
| 64 | Schaltplan Corrections | nbResolveEngine.service.ts:349 | GPT-4o Korrektur-Analyse |
| 65 | EVU Tips | evuLearning.service.ts:1067 | NB-spezifische Tipps |
| 66 | Financial AI Summary | accounting/aiInsights.service.ts:239 | Finanz-Insights |
| 67 | Accounting Chat | accounting/aiChat.service.ts:217 | Buchhaltungs-Antwort |
| 68 | Accounting Suggestions | accounting/aiChat.service.ts:272 | Query-Vorschläge |

### Data-Transformer (15)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 69 | Partner-Klassifikation | partner/classifier.ts:386 | Dokument-Typ erkennen |
| 70 | Partner-Textextraktion | partner/classifier.ts:182 | PDF/Image → Text |
| 71 | Partner-Validierung | partner/gptValidator.ts:165 | GPT-Validierung |
| 72 | Partner-Cross-Validierung | partner/gptValidator.ts:275 | Dokument-Vergleich |
| 73 | Partner-Merge | partner/merger.ts:103 | Multi-Source Merge |
| 74 | Complaint-Parsing | nbComplaintParser.service.ts:103 | Email → Structured Complaints |
| 75 | PDF-Text-Extraktion | emailAttachment.service.ts:218 | PDF → Text |
| 76 | TAB-Analyse | tabAnalysis.service.ts:72 | TAB-PDF → Structured Data |
| 77 | Local PDF Extract | ai/localAI.service.ts:312 | Ollama PDF-Text |
| 78 | Local Email Classify | ai/localAI.service.ts:374 | Ollama Klassifikation |
| 79 | OpenAI Email Classify | ai/openaiClassifier.service.ts:282 | GPT Klassifikation |
| 80 | Factro HTML Parser | factroParser.ts:1050 | HTML → 90+ Felder |
| 81 | Installation Data Assembler | vdeFormular/installationDataAssembler.ts | 5 Quellen → 1 Interface |
| 82 | Document Data Assembler | documentGenerator/dataAdapter.ts:71 | Installation → GeneratorInput |
| 83 | Insights Generator | insightsGenerator.service.ts:42 | 7 Insight-Typen |

### Nummern/ID-Generatoren (7)

| # | Generator | Datei | Format |
|---|-----------|-------|--------|
| 84 | Invoice Number | lib/invoiceNumber.ts:13 | RE-YYYYMM-XXXXXX (base36) |
| 85 | Auszahlungs Number | provision/provisionWorkflow.service.ts | AZ-YYYYMM-XXXXXX |
| 86 | Payment Link | paymentLink.service.ts:40 | URL + Token |
| 87 | EPC QR Code | paymentLink.service.ts:283 | SEPA QR Data |
| 88 | 2FA Setup | twoFactor.service.ts:10 | Secret + QR URL |
| 89 | Formular Public ID | formularLink.service.ts:353 | 8-char alphanumeric |
| 90 | Dedicated Email | formularLink.service.ts:385 | inst-xxx@gridnetz.de |

### Learning/Knowledge-Generatoren (3)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 91 | EVU Event Learning | evuLearning.service.ts:636 | Learning + RAG Update |
| 92 | EVU Email Learning | evuLearning.service.ts:1184 | Email → Learning |
| 93 | NB Pattern Learning | nbLearning.service.ts:572 | Resolve → Pattern Update |

### Orchestrator-Generatoren (4)

| # | Generator | Datei | Zweck |
|---|-----------|-------|-------|
| 94 | autoInvoice Pipeline | autoInvoice.service.ts | Pricing→PDF→Link→Email→Mark |
| 95 | NB-Response Pipeline | nbResponseOrchestrator.service.ts | Thread→Complaints→Resolve→Draft |
| 96 | Email Pipeline | emailPipeline.service.ts | Dual-LLM→Classify→Dispatch |
| 97 | Partner Intake Pipeline | partner/intakeService.ts | ZIP→Extract→Parse→Merge→Review |

**Gesamt: 97 Generatoren** (plus Frontend-Duplikate: 4 VDE jsPDF = 101)

---

*Analyse abgeschlossen. 23 Seiten, 97+ Generatoren, 14 Dead Code Files (5.800 Z.), 20 Security Findings (2 Critical), 15 Performance Issues (2 Critical), 6 Duplikat-Cluster, Generator-Zugriff nach 7 Rollen dokumentiert.*

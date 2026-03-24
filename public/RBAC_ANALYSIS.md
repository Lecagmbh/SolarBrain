# GridNetz RBAC Analysis
Generated: 2026-03-15

---

## 1. Kern-Dateien

### 1.1 middleware/auth.ts (196 Z.)

**JwtPayload Interface:**
```
userId: number (NICHT id!)
email: string
role: UserRole (UPPERCASE: ADMIN, MITARBEITER, etc.)
tokenVersion?: number (Token-Invalidierung)
kundeId?: number
name?: string
partnerId?: number
```

**authenticate Middleware — 3-stufiger Auth-Flow:**
1. **JWT (Bearer Header)** → `jwt.verify()` mit JWT_SECRET
2. **Query-Parameter Token** → `?token=xxx` (für Downloads/iFrames)
   - **CRITICAL S1: `ignoreExpiration: true`** → Abgelaufene Tokens werden akzeptiert!
3. **Session Cookie** → `gridnetz_session` → DB-Lookup in userSession

**Post-Auth Validierung:**
- User existiert + aktiv?
- `user.gesperrt`? → 403 "Zugang gesperrt: {grund}"
- `tokenVersion` stimmt mit DB überein? → sonst 401

### 1.2 middleware/roles.ts (484 Z.)

**getVisibleKundeIds(userId, role) — Kern-Scoping:**

| Rolle | Return | Bedeutung |
|-------|--------|-----------|
| ADMIN | `null` | Kein Filter → sieht ALLE |
| MITARBEITER | `null` | Kein Filter → sieht ALLE |
| HV | `[]` | NICHT implementiert → sieht NICHTS! |
| KUNDE (ohne WL) | `[kundeId]` | Nur eigener Kunde |
| KUNDE (mit WL) | `[kundeId, sub1, sub2, ...]` | Eigener + alle Descendant-Kunden |
| SUB | `[kundeId]` oder `[]` | Basierend auf eigenem kundeId |
| DEMO | `[kundeId]` | Nur eigener Kunde, KEIN WL-Expansion |
| PORTAL | `[]` | NICHT implementiert (eigenes Scoping) |
| PARTNER | `[]` | NICHT implementiert (eigenes Scoping) |

**addDemoFilter(where, role):**
- DEMO → `{...where, isDemo: true}` (nur Demo-Daten)
- Alle anderen → `{...where, isDemo: false}` (nur Live-Daten)

**getBillingKundeIdForInstallation(installationId):**
- Lädt Installation → return `kundeId ?? null`
- Für SUB-Abrechnung unter WhiteLabel-Kunde

**canAccessInstallation(userId, role, installationId):**
- ADMIN/MITARBEITER → `true`
- Andere → `getVisibleKundeIds()` → `includes(installation.kundeId)`

**denySubRechnungAccess:**
- SUB → 403 (kein Zugriff auf Rechnungen)

### 1.3 middleware/hvGuard.ts (93 Z.)

- `requireHvOrStaff` → ADMIN/MITARBEITER/HV
- `attachHvProfile` → Lädt HV-Record, prüft `aktiv`, setzt `req.handelsvertreterId`
- `buildHvScopedWhere` → Filtert nach `handelsvertreterId`

### 1.4 middleware/portalAuth.ts (216 Z.)

- `requirePortalUser` → Prüft `role === ENDKUNDE_PORTAL`, lädt `portalUserInstallationIds`
- `requireInstallationAccess(param)` → Prüft ob Installation-ID in `portalInstallationIds`
- `requireOnboardingComplete` → 428 wenn `onboardingCompleted !== true`
- `hasInstallationAccess(userId, role, installationId)`:
  - ADMIN/MITARBEITER → true
  - KUNDE → `installation.kundeId === user.kundeId`
  - SUB → `installation.assignedToId === userId`
  - PORTAL → `portalUserInstallation` exists

### 1.5 utils/permissions.ts (163 Z.)

**Statische Berechtigungs-Matrix:**

| Permission | ADMIN | MITARB | SUB | KUNDE | DEMO |
|-----------|:-----:|:------:|:---:|:-----:|:----:|
| canViewInstallation | ✓ | ✓ | ✓ | ✓ | ✓ |
| canChangeStatus | ✓ | ✓ | ✓ | ✗ | ✗ |
| canMarkAsAbgerechnet | ✓ | ✗ | ✗ | ✗ | ✗ |
| canStornieren | ✓ | ✓ | ✗ | ✗ | ✗ |
| canEditNbVorgangsnummer | ✓ | ✓ | ✓ | ✗ | ✗ |
| canUploadDocuments | ✓ | ✓ | ✓ | ✓ | ✓ |
| canDeleteDocuments | ✓ | ✓ | ✗ | ✗ | ✗ |
| canWriteComments | ✓ | ✓ | ✓ | ✗ | ✗ |
| canDeleteAllComments | ✓ | ✗ | ✗ | ✗ | ✗ |
| canAssign | ✓ | ✓ | ✗ | ✗ | ✗ |
| canDelete | ✓ | ✗ | ✗ | ✗ | ✗ |
| canCreate | ✓ | ✓ | ✓ | ✓ | ✓ |

**INKONSISTENZ Backend vs Frontend:**
- Backend: `canChangeStatus` = ADMIN + MITARBEITER + SUB
- Frontend `usePermissions.ts`: `canChangeStatus` = **NUR ADMIN**!
- → SUB und MITARBEITER können im Backend Status ändern, aber das Frontend blockiert die UI

---

## 2. Rollen-Definitionen (8 Rollen)

### ADMIN
- **Kann:** Alles — User CRUD, Settings, Backup, Status, Abrechnung, Löschen, AI-Center, Export
- **Sieht:** Alle Daten (getVisibleKundeIds → null)
- **Besonderheiten:** Einzige Rolle die User löschen, Rechnungen stornieren, Kommentare anderer löschen kann

### MITARBEITER
- **Kann:** Fast alles wie ADMIN, AUSSER: User löschen, Rechnungen stornieren(?), Installations löschen, alle Kommentare löschen
- **Sieht:** Alle Daten (getVisibleKundeIds → null)
- **Besonderheiten:** Kann Status ändern, Dokumente löschen, zuweisen

### HANDELSVERTRETER (HV)
- **Kann:** Eigene Leads verwalten, Kunden sehen, Provisionen sehen, Termine buchen
- **Sieht:** Nur zugewiesene Kunden (HV → Kunden Relation)
- **Scoping:** `attachHvProfile` + `buildHvScopedWhere`
- **PROBLEM:** `getVisibleKundeIds` gibt `[]` zurück → HV hat eigenes Scoping-System, nicht das zentrale!
- **Redirect:** Login → /hv-center

### KUNDE
- **Kann:** Installationen erstellen, Dokumente hochladen, Wizard nutzen
- **Sieht:** Nur eigene Installationen (kundeId-Filter)
- **WhiteLabel:** Wenn aktiviert, sieht auch Installationen von Sub-Kunden
- **Besonderheiten:** Kein Status-Change, kein Löschen, keine Kommentare (laut Backend — Frontend erlaubt es!)

### SUBUNTERNEHMER (SUB)
- **Kann:** Wie KUNDE + NB-Vorgangsnummer bearbeiten + Status ändern + Kommentare schreiben
- **Sieht:** Eigene kundeId ODER assignedToId (je nach Kontext)
- **Billing:** Rechnung geht an WhiteLabel-Eltern-Kunde (getBillingKundeId)
- **Einschränkung:** Kein Rechnungszugriff (denySubRechnungAccess)

### ENDKUNDE_PORTAL
- **Kann:** Status sehen (read-only), Dokumente hoch/runterladen, Nachrichten senden, Kundenfreigabe erteilen
- **Sieht:** NUR eigene Installationen via portalUserInstallation FK
- **Auth:** Gleicher JWT, aber eigene Middleware (portalAuth.ts)
- **NICHT sichtbar:** Rechnungen, Admin-Features, NB-Details, VDE, Schaltplan
- **Isolation:** ENDKUNDE_PORTAL → /portal nur, andere Rollen → kein /portal Zugang

### PARTNER
- **Kann:** Partner-Projekte verwalten, ZIP uploaden, VDE 4110 generieren
- **Sieht:** Nur eigene Partner-Projekte (partnerId-Filter)
- **JWT:** partnerId wird aus DB geladen (nicht im Token)

### DEMO
- **Kann:** Wie KUNDE, aber nur Demo-Daten
- **Sieht:** Nur Installationen mit isDemo=true
- **Einschränkung:** Kein WhiteLabel-Expansion, nur addDemoFilter

---

## 3. Vollständige Berechtigungs-Matrix

| Aktion | ADMIN | MITARB | HV | KUNDE | SUB | PORTAL | PARTNER | DEMO |
|--------|:-----:|:------:|:--:|:-----:|:---:|:------:|:-------:|:----:|
| **Installationen** | | | | | | | | |
| Installation erstellen | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Installation lesen (eigene) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Installation lesen (alle) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Installation bearbeiten | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Installation löschen | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Bulk Delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Status** | | | | | | | | |
| Status ändern | ✓ | ✓ | ✗ | ✗ | ✓* | ✗ | ✗ | ✗ |
| Stornieren | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Abgerechnet markieren | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Dokumente** | | | | | | | | |
| Upload | ✓ | ✓ | ✓ | ✓ | ✓ | ✓(eingeschr.) | ✓ | ✓ |
| Download | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Löschen | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Generatoren** | | | | | | | | |
| VDE 4105 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| VDE 4110 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Schaltplan | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Lageplan | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Vollmacht | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Netzanfrage senden | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Kommunikation** | | | | | | | | |
| Email senden (an NB) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Email lesen | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Kommentar schreiben | ✓ | ✓ | ✓ | ✗** | ✗ | ✓(msg) | ✗ | ✗ |
| Kommentar löschen (eigene) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Kommentar löschen (alle) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| WhatsApp senden | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Finanzen** | | | | | | | | |
| Rechnung erstellen | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Rechnung lesen | ✓ | ✓ | ✗ | ✓ | ✗(!) | ✗ | ✗ | ✓ |
| Rechnung PDF download | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Rechnung stornieren | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Provision lesen | ✓ | ✓ | ✓(eigene) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Provision auszahlen | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Admin** | | | | | | | | |
| User erstellen | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| User löschen | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| NB bearbeiten | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| NB-Zugangsdaten | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Settings bearbeiten | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Backup erstellen | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Feature Flags | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| AI-Center | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Control Center | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Ops Center | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Sonstiges** | | | | | | | | |
| Kalender verwalten | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Zählerwechsel planen | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| CSV/Excel Export | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MaStR-Verwaltung | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Batch-Operationen | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Partner-Projekte | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

*SUB kann Status ändern laut Backend permissions.ts, aber Frontend blockiert UI
**KUNDE kann laut Backend KEINE Kommentare schreiben, aber Frontend usePermissions erlaubt es

---

## 4. Scoping-Aufrufe (JEDER Aufruf)

### getVisibleKundeIds() — 23 Aufrufe

| # | Datei:Zeile | Endpoint/Kontext |
|---|-------------|-----------------|
| 1 | routes/dashboard.routes.ts:32 | GET /dashboard/summary |
| 2 | routes/dashboard.routes.ts:398 | GET /dashboard/activity-feed |
| 3 | routes/dashboard.routes.ts:555 | GET /dashboard/alerts |
| 4 | routes/netzanmeldungen.enterprise.routes.ts:35 | GET /netzanmeldungen/stats |
| 5 | routes/netzanmeldungen.enterprise.routes.ts:130 | GET /netzanmeldungen/list |
| 6 | routes/netzanmeldungen.enterprise.routes.ts:250 | GET /netzanmeldungen/enterprise |
| 7 | routes/netzanmeldungen.enterprise.routes.ts:425 | GET /netzanmeldungen/:id |
| 8 | routes/netzanmeldungen.enterprise.routes.ts:520 | POST /netzanmeldungen/:id/status |
| 9 | routes/installation.routes.ts:775 | GET /installations |
| 10 | routes/installation.routes.ts:1225 | GET /installations/:id |
| 11 | routes/rechnung.routes.ts:240 | GET /rechnungen |
| 12 | routes/rechnung.routes.ts:615 | GET /rechnungen/:id |
| 13 | routes/nbWissen.routes.ts:25 | GET /nb-wissen |
| 14 | routes/archiv.routes.ts:23 | GET /archiv |
| 15 | routes/hv.routes.ts:35 | GET /hv/dashboard |
| 16 | routes/hvLeads.routes.ts:25 | GET /hv-leads |
| 17 | middleware/roles.ts:214 | canAccessInstallation() |
| 18 | middleware/roles.ts:235 | canAccessKunde() |
| 19 | middleware/roles.ts:141 | attachDataScope() |
| 20 | routes/installationComments.routes.ts:18 | GET /installations/:id/comments |
| 21 | routes/document.routes.ts:45 | GET /installations/:id/documents |
| 22 | services/workflow.service.ts:85 | onStatusChange() Subunternehmer-Check |
| 23 | routes/portal.routes.ts:42 | GET /portal/installations |

### addDemoFilter() — 18 Aufrufe

| # | Datei | Endpoint |
|---|-------|---------|
| 1-6 | dashboard.routes.ts | /summary, /alerts, /activity-feed, /priorities |
| 7-10 | netzanmeldungen.enterprise.routes.ts | /stats, /list, /enterprise, /:id |
| 11-12 | installation.routes.ts | GET /, GET /:id |
| 13 | archiv.routes.ts | GET /archiv |
| 14 | nbWissen.routes.ts | GET /nb-wissen |
| 15-18 | Diverse weitere | analytics, ops, etc. |

### getBillingKundeId — 3 Aufrufe

| # | Datei | Zweck |
|---|-------|-------|
| 1 | services/autoInvoice.service.ts:63 | SUB → WhiteLabel-Kunde für Rechnung |
| 2 | middleware/roles.ts:366 | getBillingKundeIdForInstallation() |
| 3 | routes/rechnung.routes.ts:1780 | Sammelrechnung Billing-Zuordnung |

---

## 5. Route-Level Enforcement (71 Route-Dateien)

### Auth-Level pro Route-Datei

| Route-Datei | Auth | Rollen-Requirement | Scoping |
|-------------|------|-------------------|---------|
| auth.routes.ts | Teilweise | PUBLIC (login, register) | - |
| auth.session.routes.ts | authenticate | Alle | User-ID |
| me.routes.ts | authenticate | Alle | User-ID |
| dashboard.routes.ts | authenticate | Alle | getVisibleKundeIds + addDemoFilter |
| installation.routes.ts | authenticate | Alle + Scoping | getVisibleKundeIds |
| netzanmeldungen.enterprise.routes.ts | authenticate | Alle + Scoping | getVisibleKundeIds + addDemoFilter |
| rechnung.routes.ts | authenticate + requireStaff (meiste) | Staff + Scoping | getVisibleKundeIds |
| provisionen.routes.ts | requireMitarbeiter | Staff | - |
| auszahlungen.routes.ts | requireAdmin | Admin | - |
| mahnung.routes.ts | requireAdmin | Admin | - |
| wise.routes.ts | requireAdmin (meiste) | Admin | - |
| accounting.routes.ts | requireMitarbeiter | Staff | - |
| netzbetreiber.routes.ts | authenticate | Alle (Listing), Admin (CRUD) | - |
| nbWissen.routes.ts | authenticate | Alle + Scoping | getVisibleKundeIds |
| nbResponse.routes.ts | requireMitarbeiter | Staff | - |
| nbCommunication.routes.ts | authenticate | Alle | - |
| vdeFormular.routes.ts | authenticate | Staff implizit | - |
| vde4110Formular.routes.ts | authenticate | Staff implizit | - |
| document.routes.ts | authenticate | Alle + Scoping | canAccessInstallation |
| calendar.routes.ts | authenticate + PUBLIC | Alle + Public | HV-Scoping |
| partner.routes.ts | authenticate | requireStaffOrPartner | partnerId |
| factro.routes.ts | authenticate | Staff + KUNDE(24) | kundeId=24 |
| portal.routes.ts | portalAuth | ENDKUNDE_PORTAL | portalUserInstallation |
| controlCenter.routes.ts | authenticate | Admin implizit | - |
| ops.routes.ts | requireStaff | Staff | - |
| admin-center.routes.ts | requireAdmin | Admin | - |
| backup.routes.ts | requireAdmin | Admin | - |
| featureFlags.routes.ts | requireAdmin | Admin | - |
| credentials.routes.ts | requireAdmin | Admin | - |

---

## 6. Frontend Route-Guards

### RoleGuard-geschützte Routes (32)

| Route | Erlaubte Rollen |
|-------|----------------|
| /admin/center | ADMIN |
| /control-center | ADMIN |
| /intelligence | ADMIN |
| /admin/handelsvertreter | ADMIN |
| /admin/provisionen | ADMIN |
| /evu-dashboard | ADMIN |
| /mastr-admin | ADMIN |
| /ai-center | ADMIN |
| /vde-formulare | ADMIN, MITARBEITER |
| /vde-4110 | ADMIN, MITARBEITER |
| /netzbetreiber | ADMIN, MITARBEITER |
| /kunden | ADMIN, MITARBEITER |
| /emails | ADMIN, MITARBEITER |
| /logs | ADMIN, MITARBEITER |
| /regeln | ADMIN, MITARBEITER |
| /import | ADMIN, MITARBEITER |
| /email-inbox | ADMIN, MITARBEITER |
| /finanzen | ADMIN, MITARBEITER |
| /analytics | ADMIN, MITARBEITER |
| /ops-center | ADMIN, MITARBEITER |
| /zaehlerwechsel-center | ADMIN, MITARBEITER |
| /offline | ADMIN, MITARBEITER |
| /benutzer | ADMIN, MITARBEITER, KUNDE |
| /formulare | ADMIN, MITARBEITER, KUNDE |
| /partner-center | ADMIN, PARTNER |
| /factro-center | ADMIN, KUNDE(24) |

### Ungeschützte Routes (alle Auth-Rollen)
/dashboard, /netzanmeldungen, /anlagen-wizard, /dokumente, /rechnungen, /rechnungs-ordner, /nb-wissen, /archiv, /settings/me, /calendar, /hv-center, /produkte-db, /projekte

---

## 7. Daten-Scoping-Karte

| Tabelle | ADMIN | MITARB | HV | KUNDE | SUB | PORTAL | PARTNER | DEMO |
|---------|-------|--------|-----|-------|-----|--------|---------|------|
| installations | Alle | Alle | HV.kunden | kundeId | kundeId | portalUserInst | ✗ | isDemo=true |
| rechnungen | Alle | Alle | ✗ | kundeId | ✗(blocked!) | ✗ | ✗ | kundeId+isDemo |
| provisionen | Alle | Alle | hvId | ✗ | ✗ | ✗ | ✗ | ✗ |
| documents | Alle | Alle | via inst | via inst | via inst | via inst(limited) | via partner | via inst |
| comments | Alle | Alle | via inst | via inst(read) | via inst | visibility filter | ✗ | via inst |
| netzbetreiber | Alle | Alle | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| kunden | Alle | Alle | HV.kunden | eigener | parent | ✗ | ✗ | eigener |
| users | Alle | Alle | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| partner_projects | Alle | Alle | ✗ | ✗ | ✗ | ✗ | partnerId | ✗ |
| factro_projects | Alle | Alle | ✗ | kundeId=24 | ✗ | ✗ | ✗ | ✗ |
| calendar_appointments | Alle | Alle | assignedUserId | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 8. Security-Lücken

### CRITICAL

| # | Problem | Datei | Impact |
|---|---------|-------|--------|
| S1 | JWT `ignoreExpiration` bei Query-Token | auth.ts:85 | Abgelaufene Tokens funktionieren via URL |
| S2 | Public Booking akzeptiert `assignedUserId` | calendar.routes.ts:1102 | Termine beliebigen Usern zuweisen |

### HIGH — Fehlende Scoping-Checks

| # | Problem | Datei | Impact |
|---|---------|-------|--------|
| S3 | Subcontractor-Installationen ohne kundeId-Scoping | subcontractor.routes.ts:280 | HV sieht fremde Installationen |
| S4 | Analytics ohne Kunden-Scoping | analytics.routes.ts:21 | KUNDE sieht globale Umsätze |
| S5 | Calendar /slots exponiert alle Staff-Verfügbarkeiten | calendar.routes.ts:576 | Interne Daten für alle Auth-User |

### MEDIUM — Inkonsistenzen

| # | Problem | Impact |
|---|---------|--------|
| S6 | Backend erlaubt SUB Status-Change, Frontend blockiert UI | Inkonsistenz |
| S7 | Backend verbietet KUNDE Kommentare, Frontend erlaubt sie | Inkonsistenz |
| S8 | HV nicht in getVisibleKundeIds implementiert, eigenes System | Fragile Architektur |
| S9 | 245+ direkte Role-Checks statt standardisierter Middleware | Fehleranfällig |
| S10 | PARTNER/PORTAL nicht in getVisibleKundeIds, eigene Systeme | 3 verschiedene Scoping-Mechanismen |

---

## 9. Inkonsistenzen

### Backend ↔ Frontend Permission-Matrix

| Permission | Backend (permissions.ts) | Frontend (usePermissions.ts) | Problem |
|-----------|------------------------|----------------------------|---------|
| canChangeStatus | ADMIN + MITARB + SUB | NUR ADMIN | SUB sieht keinen Button, kann aber API nutzen |
| canWriteComments | ADMIN + MITARB + SUB | ADMIN + MITARB + SUB + KUNDE + DEMO | KUNDE/DEMO können API nicht nutzen |
| canStornieren | ADMIN + MITARB | NUR ADMIN | MITARB sieht keinen Button |

### Scoping-Inkonsistenzen

| Route A | Route B | Problem |
|---------|---------|---------|
| dashboard/summary (scoped) | analytics (NICHT scoped) | KUNDE sieht auf /analytics globale Daten |
| netzanmeldungen/enterprise (scoped) | subcontractor/:id/installations (NICHT scoped) | Fehlender Filter |
| installations (scoped) | bankintegration/transactions (NICHT scoped) | Transaktionen ohne Kunden-Filter |

---

## 10. Empfehlungen

### Sofort (Security)
1. **S1 FIX:** `ignoreExpiration` entfernen aus auth.ts
2. **S2 FIX:** `assignedUserId` aus public booking body entfernen
3. **S3 FIX:** Kunden-Scoping in subcontractor.routes.ts hinzufügen
4. **S4 FIX:** `requireStaff()` auf analytics.routes.ts

### Kurzfristig (Inkonsistenzen)
5. **Frontend/Backend Permissions angleichen** — EINE Source of Truth
6. **HV in getVisibleKundeIds integrieren** statt eigenes System
7. **PARTNER/PORTAL Scoping zentralisieren**

### Mittelfristig (Architektur)
8. **Middleware-Kette standardisieren:** `authenticate → scopeData → validatePermissions → handler`
9. **Direkte Role-Checks durch Middleware ersetzen** (245 Stellen)
10. **Zentrale Permission-Matrix** in DB statt hardcoded in 2 Dateien

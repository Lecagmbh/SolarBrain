# GridNetz Deep Analysis Report
Generated: 2026-03-15

---

## 1. Executive Summary

GridNetz ist eine umfangreiche Enterprise-Plattform für die Verwaltung von Netzanschlussanträgen (Netzanmeldungen) für PV-Anlagen, Speicher, Wallboxen und Wärmepumpen in Deutschland. Das System automatisiert den gesamten Workflow von der Antragsstellung über die Kommunikation mit Netzbetreibern bis zur Abrechnung.

**Architektur-Zustand:** Das Backend ist ein monolithischer Node.js/Express-Server mit ~335 TypeScript-Dateien, 100+ Services, 71 Route-Dateien und 18 Cron-Jobs. Das Frontend ist eine React 19 SPA mit ~860 Dateien, 532 Komponenten und umfangreicher Feature-Modularisierung. Beide Projekte sind produktionsreif und aktiv in Betrieb.

**Größte Probleme:**
1. **Service-Monolithen**: Mehrere Services mit >1000 Zeilen (claudeAI: 1837, provision: 1353, wise: 1295, workflow: 1183, whatsappMessage: 1121, openai: 1107, mastr: 1060, netzanfrage: 1013)
2. **Code-Duplikate**: 4x stripHtml(), 19x OpenAI-Client-Initialisierung, 11x Cache-Pattern, 8x Phone-Normalisierung, 9x Date-Formatting
3. **Fehlende Transaktionen**: Kritische Multi-Step-Operationen (Invoice-Erstellung, Mahnung+Kontosperre, Wise-Payouts) ohne `prisma.$transaction()`
4. **In-Memory State**: Idempotency-Sets, Cooldown-Maps und Caches gehen bei Restart verloren

---

## 2. Tech Stack

### Backend (`/var/www/gridnetz-backend`)

| Kategorie | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | (Production) |
| Sprache | TypeScript (strict mode) | 5.9.3 |
| Framework | Express | 4.21.1 |
| ORM | Prisma | 5.22.0 |
| Primary DB | MySQL | localhost:3306, `gridnetz_db` |
| Vector DB | PostgreSQL + pgvector 0.8.0 | localhost:5432, `gridnetz_vectors` |
| Cache/Queue | Redis (ioredis) | 5.9.2, localhost:6379 |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| Email | Nodemailer + MJML + Handlebars | 7.0.11 / 4.18.0 |
| AI Primary | OpenAI SDK (gpt-4o, gpt-4o-mini) | 6.17.0 |
| AI Secondary | Anthropic Claude SDK | 0.71.2 |
| AI Local | Ollama (llama3.1:8b) | localhost:11434 |
| RAG | pgvector + text-embedding-3-small | 1536 Dim, 25.314 Embeddings |
| PDF | PDFKit, jsPDF, pdf-lib, pdf-parse | Diverse |
| File Upload | Multer + AWS S3 | 1.4.5-lts.1 |
| WebSocket | ws | 8.18.3 |
| Cron | node-cron | 4.2.1 |
| Monitoring | Sentry | 10.36.0 |
| Logger | Pino | 10.3.0 |
| Rate Limiting | express-rate-limit + rate-limit-redis | 8.2.1 / 4.3.1 |
| Process Manager | PM2 | App: "gridnetz-backend", Port 3002 |

### Frontend (`/var/www/gridnetz-frontend`)

| Kategorie | Technologie | Version |
|-----------|-------------|---------|
| Build Tool | Vite | 7.2.4 |
| Framework | React | 19.2.0 |
| Sprache | TypeScript (strict mode) | 5.9.3 |
| Router | React Router DOM | 7.9.6 |
| CSS | Tailwind CSS | 4.1.17 |
| State (Global) | Zustand | - |
| State (Server) | @tanstack/react-query | - |
| State (Complex) | XState | - |
| Tables | @tanstack/react-table | - |
| Forms | React Hook Form | - |
| Charts | Recharts | - |
| 3D | Three.js + @react-three/fiber | - |
| PDF Gen | jsPDF, @react-pdf/renderer, pdf-lib | - |
| HTTP | Axios | - |
| Monitoring | Sentry | - |
| Icons | Lucide React | - |
| Animation | Framer Motion | - |
| Toast | Sonner | - |

### Externe APIs & Integrationen

| Integration | API-Typ | Zweck |
|-------------|---------|-------|
| OpenAI | REST | Email-Klassifikation, PDF-Analyse, Bild-OCR, Chat |
| Anthropic Claude | SDK | AI-Assistenz |
| Ollama | REST (local) | Lokale LLM-Klassifikation (Dual-LLM) |
| Factro | REST | Projektmanagement-CRM, Kommentar-Sync |
| VNBdigital.de | GraphQL | Netzbetreiber-Lookup (öffentlich) |
| MaStR (BNetzA) | SOAP 1.1 | Marktstammdatenregister |
| Wise Business | REST v1-v4 | Bankanbindung, Zahlungsabgleich, HV-Auszahlungen |
| Wassenger | REST | WhatsApp Business API |
| PVGIS (EU) | REST | Solarertrags-Berechnung |
| Nominatim (OSM) | REST | Reverse Geocoding |
| gridnetz.de | HTTP | VDE-Formular-Download |

### Deployment

```
PM2 Process: gridnetz-backend (ID 5)
Script: dist/index.js
CWD: /var/www/gridnetz-backend
Port: 3002
Frontend: Static Build via Vite → /var/www/gridnetz-frontend/dist
Frontend URL: https://gridnetz.de
```

### Environment Variables (Schlüssel-Kategorien)

- **DB**: DATABASE_URL (MySQL), PGVECTOR_URL (PostgreSQL)
- **Auth**: JWT_SECRET, CREDENTIALS_MASTER_KEY
- **Email**: SMTP_HOST/PORT/USER/PASS, IMAP configs (2 Mailboxen)
- **AI**: OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_URL
- **Integrations**: FACTRO_API_KEY, WISE_API_TOKEN, WASSENGER_API_KEY, MASTR_API_KEY
- **URLs**: FRONTEND_URL, SENTRY_DSN

---

## 3. Verzeichnisstruktur

### Backend (`/var/www/gridnetz-backend/src/`)

```
src/
├── index.ts                          # Express Server, 71 Route-Registrierungen, 18 Cron-Jobs
├── bootstrap/
│   └── env.ts                        # Environment Loader
├── config/
│   ├── ai.config.ts                  # AI-Modelle, Thresholds, Retry, Cache (411 Zeilen)
│   ├── eegTarife.ts                  # EEG-Einspeisetarife Feb-Jul 2026
│   ├── pgvector.ts                   # PostgreSQL Vector DB Setup
│   └── rag.config.ts                 # RAG-System-Konfiguration
├── constants/
│   ├── emailCategories.ts            # Email-Kategorien
│   └── speicherTemplates.ts          # Speicher-Templates
├── intelligence/
│   └── emailRouter.ts                # Smart Email Routing
├── middleware/                        # 11 Dateien
│   ├── auth.ts                       # JWT + Session Cookie Auth (196 Z.)
│   ├── roles.ts                      # RBAC, Data Scoping, WhiteLabel (484 Z.)
│   ├── rateLimiter.ts                # Redis-backed Rate Limiting (157 Z.)
│   ├── errorHandler.ts               # Zentrale Fehlerbehandlung (115 Z.)
│   ├── hvGuard.ts                    # Handelsvertreter-Scoping (93 Z.)
│   ├── demoGuard.ts                  # Demo-Modus Flag (15 Z.)
│   ├── portalAuth.ts                 # Endkunden-Portal Auth (216 Z.)
│   ├── requestId.ts                  # Request-ID Tracking
│   ├── session.ts                    # Session Management
│   ├── tracking.middleware.ts        # API Performance Tracking
│   └── validate.ts                   # Input-Validierung
├── routes/                           # 71 Route-Dateien (siehe Sektion 4)
├── services/                         # 100+ Service-Dateien (siehe Sektion 5)
│   ├── accounting/                   # 12 Dateien: Buchhaltung, AI-Matching, Reports
│   ├── ai/                           # 4 Dateien: OpenAI Classifier, Local AI, Email Automation
│   ├── automations/                  # 9 Dateien: Bulk-NB, Doc-Completeness, Mahnwesen
│   ├── brain/                        # 1 Datei: Event Hooks
│   ├── claude/                       # 1 Datei: Claude Code Client
│   ├── documentGenerator/            # 8 Dateien: Schaltplan, Lageplan, Vollmacht, VDE
│   ├── nbPortal/                     # 1 Datei: Stromnetz Berlin Bot
│   ├── nbPortalProxy/                # 7 Dateien: NB-Portal Reverse Proxy
│   ├── partner/                      # 11 Dateien: Intake, Classifier, Extractors, Merger
│   ├── rag/                          # 5 Dateien: Enterprise RAG, Embedding, Chunking, Index
│   ├── stromnetzBot/                 # 2 Dateien: Stromnetz Berlin Automation
│   ├── vdeFormular/                  # 1 Datei: Installation Data Assembler
│   ├── whatsapp/                     # 9 Dateien: Router, Messages, Media, Conversations
│   ├── workflowV2/                   # 7 Dateien: Transitions, Automation, Events, Inbox
│   └── [40+ Root-Services]           # Email, Factro, NB, Billing, Wise, etc.
├── jobs/                             # 18 Cron-Job-Dateien
├── lib/                              # 8 Dateien: Prisma, Redis, Sentry, Feature Flags
│   └── emailTemplates/               # 6 Template-Dateien (Auth, Booking, Invoice, Portal)
├── utils/                            # 9 Dateien: Logger, Crypto, Pagination, Permissions
├── workers/                          # 2 Dateien: Address Util, Email Ingest
├── types/                            # 3 Dateien: Installation, RAG, WhatsApp Types
├── backup/                           # 2 Dateien: Backup + S3
├── scripts/                          # 3 Dateien: Backfill, Seed, Python Schaltplan
└── prisma/
    ├── schema.prisma                 # ~2000+ Zeilen, 80+ Modelle
    ├── seed.ts
    └── seedPortalDemo.ts
```

### Frontend (`/var/www/gridnetz-frontend/src/`)

```
src/
├── main.tsx                          # Entry Point, Provider Stack
├── router.tsx                        # 50+ Routes mit Lazy Loading (248 Z.)
├── api/                              # 9 Dateien: Client, Endpoints, Types
├── components/                       # 79 Dateien: Reusable UI Components
├── contexts/                         # 5 Dateien: Auth, WhiteLabel, Tracking
├── config/                           # 2 Dateien: Company, Storage
├── debug/                            # 4 Dateien: ErrorBoundary, DebugPanel
├── features/                         # 267 Dateien, 14 Feature-Module:
│   ├── accounting/                   # Buchhaltung
│   ├── admin/                        # Admin-Funktionen
│   ├── agent-center/                 # Agent Center
│   ├── anlagen/                      # Bestandsanlagen
│   ├── brain-admin/                  # Brain Knowledge Admin
│   ├── calendar/                     # Kalender/Termine
│   ├── claude-ai-dashboard/          # AI Dashboard
│   ├── control-center/               # Control Center
│   ├── finanzen/                     # Finanzen
│   ├── hv-center/                    # Handelsvertreter Center
│   ├── nb-portal/                    # NB Portal
│   ├── netzanmeldungen/              # Hauptmodul: Netzanmeldungen
│   ├── partner-center/               # Partner Center
│   └── rag-admin/                    # RAG Administration
├── finanzen-module/                  # 18 Dateien: KPI Cards, Invoice Tables
├── hooks/                            # 11 Dateien: Preferences, Realtime, Permissions
├── lib/                              # 11 Dateien: Sentry, QueryClient, PDF Generators
├── modules/                          # 164 Dateien, 18 Module:
│   ├── abrechnung/, admin/, anlagen/, api/, auth/
│   ├── benutzer/, common/, dashboard/, emails/
│   ├── installations/, layout/, performance/
│   ├── rechnungen/, rechnungs-ordner/, ui/
│   ├── uploadQueue/, utils/, wizard/
├── pages/                            # 66 Dateien: Alle Seiten-Komponenten
├── portal/                           # 24 Dateien: Endkunden-Portal
├── admin-center/                     # 21 Dateien: Admin Center
├── services/                         # 13 Dateien: Business Logic Isolation
├── utils/                            # 7 Dateien: AutoLogout, TokenRefresh, Sanitize
└── wizard/                           # 133 Dateien: Installations-Wizard
```

---

## 4. API-Endpunkte (komplett)

### Authentifizierung & User

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| POST | /api/auth/login | auth.routes | - | Login mit Email/Passwort |
| POST | /api/auth/register | auth.routes | - | Registrierung |
| POST | /api/auth/refresh | auth.routes | - | Token Refresh |
| POST | /api/auth/forgot-password | auth.routes | - | Passwort vergessen |
| POST | /api/auth/reset-password | auth.routes | - | Passwort zurücksetzen |
| GET | /api/auth/verify-email | auth.routes | - | Email-Verifizierung |
| POST | /api/auth/logout | auth.routes | JWT | Logout |
| GET | /api/me | me.routes | JWT | Eigenes Profil |
| PUT | /api/me | me.routes | JWT | Profil bearbeiten |
| * | /api/auth/sessions | auth.session.routes | JWT | Session Management |
| * | /api/2fa | twoFactor.routes | JWT | 2-Faktor-Auth |
| * | /api/users | user.routes | Admin | User CRUD |
| * | /api/admin/users | adminUsers.routes | Admin | Admin User Management |
| * | /api/settings | settings.routes | JWT | System Settings |
| * | /api/preferences | preferences.routes | JWT | User Preferences |

### Kern-Geschäftslogik: Installationen

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| GET | /api/installations | installation.routes | JWT+Scope | Liste (paginiert, gefiltert) |
| GET | /api/installations/:id | installation.routes | JWT+Access | Detail mit Relations |
| POST | /api/installations | installation.routes | JWT | Neue Installation |
| PUT | /api/installations/:id | installation.routes | JWT+Access | Update |
| DELETE | /api/installations/:id | installation.routes | Admin | Soft Delete |
| PUT | /api/installations/:id/status | installation.routes | Staff | Status ändern |
| * | /api/installations/wizard | installationWizard.routes | JWT | Wizard-basierte Erstellung |
| * | /api/installations/meta | installationsMeta.routes | JWT | Metadaten & Statistiken |
| * | /api/installations/nb-case | installationsNbCase.routes | Staff | NB-Vorgangsnummer |
| * | /api/installations/comments | installationComments.routes | JWT | Kommentare CRUD |
| * | /api/installations/customer | installationsCustomer.routes | JWT | Kunden-spezifisch |
| * | /api/netzanmeldungen | netzanmeldungen.enterprise.routes | JWT | Enterprise Features |

### Netzbetreiber

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/netzbetreiber | netzbetreiber.routes | JWT | NB CRUD (787 Einträge) |
| * | /api/nb-communication | nbCommunication.routes | Staff | NB-Kommunikation |
| * | /api/nb-response | nbResponse.routes | Staff | NB-Rückfrage-Orchestrator |
| * | /api/nb-wissen | nbWissen.routes | Staff | NB Knowledge Base |
| * | /api/nb-portal | nbPortalConfig.routes | Admin | NB-Portal Konfiguration |
| * | /api/nb-portal-proxy | nbPortalProxy.routes | Staff | NB-Portal Reverse Proxy |
| * | /api/vnbdigital | vnbdigital.routes | Staff | VNBdigital.de Integration |
| * | /api/mastr | mastr.routes | Staff | MaStR API |
| * | /api/zerez | zerez.routes | Staff | ZEREZ Lookup |

### Email-System

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/emails | emails.routes | Staff | Email-Verwaltung |
| * | /api/email-inbox | emailInbox.routes | Staff | Inbox Management |
| * | /api/email-send | emailSend.routes | Staff | Email-Versand |
| * | /api/email-admin | emailAdmin.routes | Admin | Email-Administration |
| * | /api/email-learning | emailLearning.routes | Staff | KI-Training Center |

### Dokumente & Formulare

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/documents | document.routes | JWT | Dokument CRUD |
| * | /api/document-types | documentType.routes | Staff | Dokumenttypen |
| * | /api/upload | upload.routes | JWT+Auth | Datei-Upload |
| * | /api/vde-formular | vdeFormular.routes | Staff | VDE-Formulare |
| * | /api/vde-generator | vde_generator.routes | Staff | VDE-Generator |
| * | /api/vde4110 | vde4110Formular.routes | Staff | VDE 4110 Formulare |
| * | /api/signatures | signatures.routes | Staff | EFK-Signaturen |
| * | /api/formular-links | formularLink.routes | JWT | Externe Formulare |

### Abrechnung & Finanzen

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/rechnungen | rechnung.routes | JWT+Scope | Rechnungen CRUD |
| * | /api/mahnungen | mahnung.routes | Admin | Mahnwesen |
| * | /api/provisionen | provisionen.routes | Staff | Provisionen |
| * | /api/auszahlungen | auszahlungen.routes | Admin | Auszahlungen |
| * | /api/payment-links | paymentLink.routes | JWT | Payment Links |
| * | /api/kunde-prices | kundePrices.routes | Admin | Kundenpreise |
| * | /api/wise | wise.routes | Admin | Wise Bank-Integration |
| * | /api/bank | bankintegration.routes | Admin | Bank-Sync |
| * | /api/accounting | accounting.routes | Admin | Buchhaltung |
| * | /api/accounting-ai | accountingAI.routes | Admin | AI-Buchhaltung |

### AI & Intelligence

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/ai | ai.routes | JWT+AI-Limiter | AI-Assistenz |
| * | /api/ai-assistant | aiAssistant.routes | JWT | AI-Chat |
| * | /api/claude-ai | claudeAI.routes | Admin | Claude AI Dashboard |
| * | /api/claude-code | claudeCode.routes | Admin | Claude Code CLI |
| * | /api/rag | rag.routes | Staff | RAG-System |
| * | /api/learning | learning.routes | Staff | Brain Learning |
| * | /api/evu-learning | evuLearning.routes | Staff | EVU/NB Learning |
| * | /api/wizard-learning | wizardLearning.routes | JWT+Auth | Wizard Learning |

### CRM & Partner

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/kunden | kunde.routes | JWT+Scope | Kunden CRUD |
| * | /api/handelsvertreter | handelsvertreter.routes | Staff | HV-Verwaltung |
| * | /api/hv | hv.routes | HV+Staff | HV-Dashboard |
| * | /api/hv-leads | hvLeads.routes | HV+Staff | Lead Management |
| * | /api/hv-contracts | hvContract.routes | HV+Staff | HV-Verträge |
| * | /api/subcontractor | subcontractor.routes | Staff | Subunternehmer |
| * | /api/partner | partner.routes | Staff+Partner | Partner Center |
| * | /api/factro | factro.routes | JWT | Factro Integration |

### Weitere Endpunkte

| Method | Route | Handler | Auth | Beschreibung |
|--------|-------|---------|------|-------------|
| * | /api/whatsapp | whatsapp.routes | JWT | WhatsApp Integration |
| * | /api/calendar | calendar.routes | JWT | Kalender/Termine |
| * | /api/dashboard | dashboard.routes | JWT | Dashboard Stats |
| * | /api/analytics | analytics.routes | Staff | Analytics |
| * | /api/workflow | workflow.routes | Staff | Workflow V1 |
| * | /api/workflow-v2 | workflowV2.routes | Staff | Workflow V2 |
| * | /api/automations | automations.routes | Admin | Automations |
| * | /api/rules | rules.routes | Admin | Regel-Engine |
| * | /api/feature-flags | featureFlags.routes | Admin | Feature Flags |
| * | /api/logs | logs.routes | Admin | System Logs |
| * | /api/anlagen | anlage.routes | JWT | Bestandsanlagen |
| * | /api/projekte | projekte.routes | JWT | Projekte |
| * | /api/produkte | produkte.routes | JWT+Auth | Produktkatalog |
| * | /api/solar | solar.routes | JWT | Solar-Rechner |
| * | /api/plz | plz.routes | - | PLZ-Lookup |
| * | /api/import | import.routes | Admin | Datenimport |
| * | /api/import-datasheets | import-datasheets.routes | Admin | Datenblatt-Import |
| * | /api/archiv | archiv.routes | JWT | Archiv |
| * | /api/alerts | alert.routes | Staff | Alerts |
| * | /api/ops | ops.routes | Admin | Ops Center |
| * | /api/credentials | credentials.routes | Admin | NB-Zugangsdaten |
| * | /api/control-center | controlCenter.routes | Admin | Control Center |
| * | /api/admin-center | admin-center.routes | Admin | Admin Center |
| * | /api/backup | backup.routes | Admin | DB Backups |
| * | /api/dsgvo | dsgvo.routes | JWT | DSGVO Compliance |
| * | /api/portal | portal.routes | Portal | Endkunden-Portal |
| * | /api/tracking | tracking.routes | JWT | Session Tracking |
| * | /api/reports | report.routes | Staff | Report-Generator |
| * | /api/unsubscribe | unsubscribe.routes | - | Email Abmeldung |
| * | /api/netzanfrage | netzanfrage routes (in factro) | Staff | Netzanfrage-Versand |
| * | /api/zaehlerwechsel | zaehlerwechselTermin.routes | Staff | Zählerwechsel-Termine |
| GET | /api/health | index.ts | - | Health Check (10s Cache) |

**Gesamt: ~98 Route-Module mit geschätzt 500+ individuellen Endpunkten**

---

## 5. Service-Inventar

### 5.1 Email-System (14 Services)

#### email.service.ts (382 Z.)
- **Zweck**: Zentraler Email-Versand & Queue-System
- **Exports**: `send()`, `queue()`, `processQueue()`
- **DB**: emailTemplate, emailQueueItem, emailLog
- **Abhängigkeiten**: emailTemplate.service, emailGateway.service
- **Hardcoded**: Queue limit=20, maxAttempts=3, priority default=5
- **Issue**: Kein exponential backoff bei Retries

#### emailInbox.service.ts (588 Z.)
- **Zweck**: Multi-Mailbox IMAP-Polling & Email-Matching
- **Exports**: `EmailInboxManager` (Singleton), `getDedicatedEmail()`
- **Mailboxen**: inbox@gridnetz.de + netzanmeldung@lecagmbh.de
- **DB**: email, installation, factroProject, document, emailClassification
- **Abhängigkeiten**: emailMatcher, emailPipeline, emailAutomation, localAI
- **Hardcoded**: Letzte 100 Emails prüfen, Poll-Intervall 60s
- **Issue**: `classifyWithLocalLLM()` deklariert aber nie aufgerufen (Dead Code)

#### emailPipeline.service.ts (~550 Z.)
- **Zweck**: Dual-LLM Klassifikation (OpenAI + Ollama parallel)
- **Exports**: `processEmail()`, `extractDocumentRequestsFromEmail()`
- **DB**: email, emailClassification, nbResponseTask, factroComment, installationAlert
- **Abhängigkeiten**: openaiClassifier, localAI
- **Hardcoded**: 38 DOCUMENT_KEYWORDS, Confidence Threshold 0.6, Timeout 15s
- **Issue**: Bei Fehler eines LLMs wird gesamte Pipeline abgebrochen

#### emailGateway.service.ts (471 Z.)
- **Zweck**: SMTP-Gateway mit Circuit Breaker
- **Exports**: `send()`, `getHealthStatus()`
- **Circuit Breaker**: 5 Fehler → OPEN (60s Cooldown)
- **FROM_MAP**: 6 Presets (noreply, netzanmeldung, support, buchhaltung, termine, admin)
- **Issue**: Circuit Breaker State nicht persistent (bei Restart: CLOSED)

#### emailSend.service.ts (273 Z.)
- **Zweck**: Email-Versand im Namen von Installationen
- **Exports**: `sendEmail()`, `sendReply()`, `getSentEmails()`, `applyTemplate()`
- **DB**: installation, sentEmail, email, emailTemplate
- **Issue**: `logActivity()` nutzt raw SQL statt Prisma

#### emailTemplate.service.ts (285 Z.)
- **Zweck**: MJML + Handlebars Template Engine mit Cache
- **Exports**: `renderTemplate()`, `invalidateCache()`
- **DB**: emailTemplate
- **Cache**: 5 Min TTL, 50 Max Entries (FIFO)
- **Issue**: Cache Key nur slug, verschiedene Variablen gleicher Key

#### emailMatcher.service.ts (1002 Z.)
- **Zweck**: Email → Installation/FactroProject Matching (6 Strategien)
- **Strategien**: DEDICATED_EMAIL (100), VORGANGSNUMMER (95), NETZANFRAGE_REPLY (95), VNB_DOMAIN_ADDRESS (60-90), NB_CASE_NUMBER, CONTENT_FALLBACK (80-90)
- **DB**: installation, factroProject, vorgangsnummerMapping, nbDomainMapping, netzbetreiber, emailLog
- **Issue**: addressPatterns zu aggressive, könnte False Positives generieren

#### emailEscalation.service.ts (429 Z.)
- **Zweck**: Automatische Eskalationen bei ausstehenden VNB-Antworten
- **Typen**: REMINDER (28T), ESCALATION (56T), CUSTOMER_UPDATE (14T)
- **DB**: emailEscalation, factroProject, installation, installationAlert, emailLog
- **Issue**: CUSTOMER_UPDATE erstellt nur Alert, sendet keine Email

#### emailAutoreply.service.ts (337 Z.)
- **Zweck**: Automatische Antworten auf RUECKFRAGE-Emails
- **Flow**: checkFeasibility → generateDraft (GPT-4o-mini) → sendApprovedReply
- **DB**: email, installation, document, emailLog
- **Issue**: PDF-Anhänge nicht in Draft-Generierung einbezogen

#### emailAttachment.service.ts (355 Z.)
- **Zweck**: Anhang-Verarbeitung mit SHA-256 Duplikat-Detection
- **Exports**: `processEmailAttachments()`, `findDuplicates()`, `identifyNbFormular()`
- **DB**: emailAttachment, installation
- **38 Dokumenttyp-Patterns**: VDE_E1-E8, SCHALTPLAN, LAGEPLAN, GENEHMIGUNG, etc.
- **Issue**: ATTACHMENT_DIR hardcoded statt ENV

#### ai/openaiClassifier.service.ts (324 Z.)
- **Zweck**: Primary LLM Classifier (gpt-4o-mini, Temp 0.1)
- **11 Kategorien**: eingangsbestaetigung, rueckfrage, einspeisezusage, ablehnung, netztechnische_stellungnahme, ibs_pin, zaehler, fertigmeldung, kundenfreigabe, statusupdate, sonstige
- **18 Extrahierte Felder**: vorgangsnummer, deadline, zaehlernummer, pin, kWp, etc.
- **Issue**: JSON-Parse Fallback via Regex (fragil)

#### ai/localAI.service.ts (487 Z.)
- **Zweck**: Local LLM Classifier (Ollama llama3.1:8b, Temp 0.1)
- **10 Kategorien** (kein "kundenfreigabe"!)
- **Timeout**: 120s (CPU-Inference)
- **Issue**: Prüft nicht ob llama3.1:8b tatsächlich geladen ist

#### ai/emailAutomation.service.ts (~800 Z.)
- **Zweck**: Automatische Email-Verarbeitung & Workflow-Dispatch
- **Actions**: GENEHMIGUNG→GENEHMIGT, ABLEHNUNG→ABGELEHNT, RUECKFRAGE→NbResponseTask, KUNDENFREIGABE→Portal-Link, IBN→IBN
- **Issue**: Zu groß (800+ Z.), mehrere Verantwortlichkeiten

### 5.2 NB-Response-System (8 Services)

#### nbResponseOrchestrator.service.ts (871 Z.)
- **Zweck**: Orchestriert gesamten NB-Response-Workflow
- **Pipeline**: Email → Thread → Complaints → Resolve → Docs → Draft → Admin-Freigabe → Senden
- **DB**: nbResponseTask, emailClassification, vdeFormularSet, email, installation, document, nbComplaint, sentEmail, emailAttachment, inboxItem
- **Hardcoded**: Admin User ID 4, VDE Standard-Set ["E1","E2","E3","E8"], noreply@ Regex
- **Issue**: `as unknown as any` Type Coercion, keine Transaktion

#### nbResolveEngine.service.ts (778 Z.)
- **Zweck**: Auto-Resolve für 6 Complaint-Typen
- **Resolver**: MISSING_SIGNATURE (VDE+EFK), SCHALTPLAN_ERROR (GPT-Korrektur), WRONG_DATE, MISSING_DOCUMENT, FORM_INCOMPLETE, CLARIFICATION_NEEDED
- **AI**: GPT-4o-mini für Schaltplan-Korrektur-Analyse (Confidence ≥0.7 → apply)
- **Issue**: Lange GPT-Prompts inline, redundante VDE-Service-Aufrufe

#### nbComplaintParser.service.ts (359 Z.)
- **Zweck**: GPT-4o-mini analysiert NB-Emails, extrahiert strukturierte Complaints
- **DB**: nbComplaint, installation, nbComplaintPattern
- **Hardcoded**: MAX_PER_PDF=3000, MAX_TOTAL=10000 Chars
- **Issue**: Kein Retry für OpenAI API

#### nbThreadAnalyzer.service.ts (335 Z.)
- **Zweck**: Email-Thread-Rekonstruktion (4 Matching-Strategien)
- **Strategien**: Installation-Match, Message-ID Chain, NB Case Number, Subject Threading
- **DB**: email, sentEmail, emailAttachment, factroProject
- **Issue**: `normalizeSubject()` wendet Regex doppelt an

#### nbLearning.service.ts (664 Z.)
- **Zweck**: SQL-basierte NB-Statistik-Aggregation (kein AI)
- **Stats**: Processing Times (Median/P75/P90), Sofort-Freigabe Rate, Rückfrage-Gründe
- **DB**: installation, statusHistory, email, evuProfile, netzbetreiber, nbComplaintPattern
- **Genehmigungstyp**: SCHNELL (≤7d), STANDARD (≤21d), LANGSAM (≤42d), SEHR_LANGSAM (>42d)
- **Issue**: Median in Memory statt SQL PERCENTILE_CONT

#### nbCommunication.service.ts (574 Z.)
- **Zweck**: Automatische NB-Reminder-Emails mit Cooldown
- **Typen**: ERSTANMELDUNG, NACHFRAGE_1/2/3, RUECKFRAGE_ANTWORT, DOKUMENT_NACHREICHUNG, STORNIERUNG
- **Hardcoded**: 24h In-Memory Cooldown, nach 3 NACHFRAGE → ADMIN_ALERT
- **Issue**: Cooldown-Map geht bei Restart verloren, unbounded growth

#### nbDomainMapping.service.ts (128 Z.)
- **Zweck**: NB-Portal-Konfigurationen mit Redis-Cache (5 Min TTL)
- **DB**: nbFormMapping

#### nbTaskComment.service.ts (90 Z.)
- **Zweck**: Fire-and-Forget Activity Logging (18 Action Types)
- **DB**: nbTaskComment
- **Issue**: Silent failures (nur log.warn)

### 5.3 Factro Integration (5 Services)

#### factro.service.ts (~1500+ Z.)
- **Zweck**: Factro CRM-Sync (Tasks, Status, Dokumente)
- **API**: `cloud.factro.com/api/core`, Auth via `api-key` Header
- **DB**: factroProject, factroConfig, factroComment, email, installation
- **Issue**: Größter Service im Projekt

#### factroCommentSync.ts (326 Z.)
- **Zweck**: Inkrementeller Kommentar-Sync (4.155 Kommentare, 117 Projekte)
- **Rate Limit**: 200ms zwischen Requests
- **Issue**: setTimeout in Loop blockiert Event Loop

#### factroCommentAnalyzer.ts (~300 Z.)
- **Zweck**: Regex-basierte Pattern-Detection in Kommentaren (6 Action Types)
- **Issue**: Rein Regex, kein NLP

#### factroParser.ts (~500 Z.)
- **Zweck**: Deterministischer HTML-Description-Parser (90+ Felder)
- **Sections**: KONTAKT, ADRESSE, NB, BANKHAUS, STATIK, PARAMETER
- **Issue**: Kein HTML Entity Decoding für Sonderzeichen

#### factroDocumentImporter.ts (~300 Z.)
- **Zweck**: Factro-Dokument-Download mit Auto-Kategorisierung
- **Storage**: `uploads/documents/{installationId}` oder `uploads/factro/{projectId}`
- **Issue**: mkdirSync pro Dokument (könnte batchen)

### 5.4 RAG-System (5 Services)

#### rag/enterpriseRagService.ts (280+ Z.)
- **Zweck**: Semantic Search in pgvector, Basic Reranking
- **Flow**: Query → Embedding → Cosine Similarity (≥0.45) → Top-5 → Context
- **Issue**: Viele Options-Parameter nicht implementiert (compress, queryExpansion)

#### rag/embeddingService.ts (200+ Z.)
- **Zweck**: OpenAI Embeddings mit Cache (30 Min TTL, 500 Max)
- **Model**: text-embedding-3-small (1536 Dim)
- **Batch**: Max 2048 Texts pro Batch, 3 Retries mit Backoff
- **Issue**: LRU-Eviction nimmt ersten Key statt ältesten

#### rag/chunkingService.ts (217 Z.)
- **Zweck**: Token-basiertes Text-Chunking mit Paragraph-Awareness
- **Tokenizer**: cl100k_base (gpt-4o kompatibel)
- **Issue**: Sentence-Splitting via einfachem Regex (Abkürzungen problematisch)

#### rag/indexingService.ts (300+ Z.)
- **Zweck**: 7 Knowledge-Quellen MySQL → pgvector indexieren
- **Kategorien**: NETZBETREIBER, EMAIL_TEMPLATES, PRODUKTE, DOCS, EVU_PROFILES, INSTALLATIONS, NB_CORRESPONDENCE

#### rag/autoReindexService.ts (200+ Z.)
- **Zweck**: Inkrementelle Change Detection & Reindexierung (alle 60 Min)
- **Detection**: Count-Vergleich + Timestamp-Prüfung

### 5.5 Billing & Finanzen (7 Services)

#### autoInvoice.service.ts (311 Z.)
- **Zweck**: Automatische Rechnungserstellung bei Status BEIM_NB
- **Pipeline**: Load → Duplicate Check → Pricing → PDF → PaymentLink → Email → Mark
- **Leistungstext**: "Administrative Bearbeitung Netzanschlussantrag (digital/remote) - {kWp} kWp"
- **Issue**: Keine Transaktion für 7-Step-Pipeline

#### invoicePdf.service.ts (491 Z.)
- **Zweck**: Premium PDF-Rendering mit PDFKit (A4, Gradient-Header)
- **Issue**: Große Funktion (361 Z.), Magic Numbers für Positionierung

#### mahnung.service.ts (812 Z.)
- **Zweck**: 3-Stufen-Mahnsystem mit Kontosperre
- **Stufen**: Stufe 1 (3 Werktage), Stufe 2 (7 Tage → Kontosperre)
- **DEAKTIVIERT**: emailVersandAktiv=false, whatsappVersandAktiv=false, autoSperrungAktiv=false
- **Issue**: Email/WhatsApp-Sender sind Stubs, Feiertagsberechnung fehlt

#### provision.service.ts (1353 Z.)
- **Zweck**: Provisions-Berechnung, Freigabe, Genehmigung, Auszahlung
- **Status-Flow**: OFFEN → FREIGEGEBEN → AUSGEZAHLT (oder STORNIERT)
- **Issue**: Zu groß, CSV-Export ohne Escaping, Decimal-Konvertierungen repetitiv

#### provisionAutomation.service.ts (545 Z.)
- **Zweck**: Monatliche Auszahlungs-Entwürfe, Auto-Release (<100€), HV-Reports
- **Feature Flags**: automation.payout-drafts, automation.auto-release, automation.hv-reports
- **Issue**: HTML-Generierung via Concatenation, previousMonthRange() Edge Case Dez/Jan

#### wise.service.ts (1295 Z.)
- **Zweck**: Wise Business API (Sync, Matching, Payouts, SCA)
- **Auto-Matching**: Invoice-Referenz + Betrag → BEZAHLT
- **Encryption**: AES-256-CBC für API Token
- **Issue**: 1295 Z., keine Transaktion bei Payouts, Pagination nicht behandelt

#### pricing.service.ts (151 Z.)
- **Zweck**: Gestaffelte Preise mit Paket-Kontingenten
- **Tiers**: 1-9/Monat = 149€, 10+ = 129€
- **Pakete**: Kunde 10 (360° Solar) = 5 Units, Kunde 26 (altena) = 6 Units
- **Issue**: Pakete hardcoded, Race Condition bei gleichzeitigen Invoices

### 5.6 Workflow (3 Services)

#### workflow.service.ts (1183 Z.)
- **Zweck**: Legacy Workflow - Email-Benachrichtigungen bei Status-Änderungen
- **Subunternehmer-Blocking**: Level 1-5 verhindert Emails an Sub-Tiers
- **Issue**: 1183 Z., Test-Threshold installationId > 100000 hardcoded

#### workflowV2/transitionService.ts (187 Z.)
- **Zweck**: Phase/Zustand-Transitions mit Validation & Dual-Write
- **States**: einreichung:offen → wartet → genehmigung:abgeschlossen → ibn:offen → fertig
- **Issue**: Hardcoded Transitions, keine Transaktion

#### workflowV2/automationEngine.ts (230 Z.)
- **Zweck**: Event-basierte Automations-Regeln (4 Rules)
- **Idempotency**: In-Memory Set (10k Max)
- **Issue**: Idempotency bei Restart verloren

### 5.7 WhatsApp (9 Services)

#### whatsapp/whatsappRouter.service.ts (948 Z.)
- **Zweck**: Intent Detection & Message Routing
- **Intents**: DOCUMENT_RESPONSE, STATUS_QUERY, NEW_INSTALLATION, CONFIRMATION, HELP, etc.
- **Issue**: Zu groß, Phone-Normalisierung dupliziert

#### whatsapp/whatsappMessage.service.ts (1121 Z.)
- **Zweck**: Wassenger API Integration für WhatsApp-Versand
- **API**: `api.wassenger.com/v1`
- **Issue**: 1121 Z., Test-Storage in Memory

### 5.8 Partner Center (6 Services)

#### partner/intakeService.ts (469 Z.)
- **Zweck**: ZIP-Upload Processing Pipeline (7 Stages)
- **Pipeline**: RECEIVED → EXTRACTING → PARSING → MERGING → REVIEW → BILLING → COMPLETED

#### partner/emailWatcher.ts (307 Z.)
- **Zweck**: IMAP-Watcher für intake@gridnetz.de
- **Issue**: /tmp/intake nicht aufgeräumt

#### partner/merger.ts (288 Z.)
- **Zweck**: Multi-Source Field Merging mit Prioritäten
- **Priority**: portaldaten(100) > vollmacht_netzanfrage(80) > datenblatt(60)

### 5.9 AI & Intelligence (4 Services)

#### claudeAI.service.ts (1837 Z.) ⚠️ **GRÖSSTE DATEI**
- **Zweck**: Email-Analyse, Response-Generierung, Quality Checks
- **Modelle**: gpt-4o-mini (Classify), gpt-4o (Generate) — NICHT Claude trotz Dateiname!
- **Issue**: 1837 Z., sollte aufgeteilt werden

#### openai.service.ts (1107 Z.)
- **Zweck**: OpenAI-Wrapper für Email, Bild-OCR, Audio, Geocoding
- **Highlight**: `parseInstallationData()` versteht Kurzantworten ("50A" → hausanschlussAbsicherung: 50)
- **Issue**: 1107 Z., Temp-Files ohne Cleanup-Garantie

#### predictionEngine.service.ts (631 Z.)
- **Zweck**: Heuristische Vorhersagen (kein ML)
- **Algorithmen**: Basis × Komplexität × Workload × Saison
- **Issue**: Hardcoded Multiplier, DB-Queries in Loops

#### solarCalculator.service.ts (218 Z.)
- **Zweck**: Solar-Ertragsberechnung mit Wirtschaftlichkeitsanalyse
- **Externe API**: PVGIS (EU)
- **Hardcoded**: CO2=0.38 kg/kWh, Degradation 0.5%/y, Basis 4500 kWh/y

### 5.10 Dokument-Generierung (5 Services)

#### documentGenerator/index.ts (143 Z.)
- **Zweck**: Orchestrator für VDE, Schaltplan, Vollmacht, Lageplan
- **VDE Set**: E1 (immer), E2 (immer), E3 (wenn Speicher), E8 (immer)

#### documentGenerator/schaltplanGeneratorPython.ts
- **Zweck**: Python/reportlab Schaltplan-Generator (A3 Querformat)
- **Ersetzt**: Altes PDFKit-basiertes schaltplan.ts

#### documentGenerator/lageplan.ts
- **Zweck**: Satellitenbilder mit PV-Overlay

#### documentGenerator/vollmacht.ts
- **Zweck**: Vollmacht-PDF mit Checkboxen

### 5.11 Weitere Kern-Services

| Service | Zeilen | Zweck |
|---------|--------|-------|
| netzanfrage.service.ts | 1013 | Netzanfrage-Generierung & Versand an NB |
| installationAutomation.service.ts | 692 | 5 Automations-Regeln für Installationen |
| mastr.service.ts | 1060 | BNetzA MaStR SOAP-Client |
| vnbdigital.service.ts | 302 | VNBdigital.de GraphQL-Client |
| evuLearning.service.ts | - | EVU/NB-Profil Learning |
| securityAudit.service.ts | 39 | Security Event Logging |
| endkundenContactGuard.ts | 191 | DSGVO Consent Checking (fail-open) |
| cacheService.ts | 158 | Redis-Cache mit Feature Flag |
| backupService.ts | - | DB Backup & S3 Upload |
| sessionTrackingService.ts | - | User Session Analytics |
| portalNotification.service.ts | - | Endkunden-Benachrichtigungen |
| paymentLink.service.ts | - | Stripe-ähnliche Payment Links |
| zoom.service.ts | - | Zoom Meeting Integration |
| hvContract.service.ts | - | HV-Vertragsverwaltung |

### 5.12 Accounting-Module (12 Services)

| Service | Zweck |
|---------|-------|
| accounting/account.service.ts | Kontenplan (SKR04) |
| accounting/journal.service.ts | Buchungsjournal |
| accounting/expense.service.ts | Ausgaben-Tracking |
| accounting/vendor.service.ts | Lieferanten |
| accounting/reports.service.ts | BWA, GuV, Bilanz |
| accounting/yearEnd.service.ts | Jahresabschluss |
| accounting/aiChat.service.ts | AI-gestützte Buchhaltungsfragen |
| accounting/aiExtraction.service.ts | AI-Belegextraktion |
| accounting/aiInsights.service.ts | AI-Finanzanalyse |
| accounting/aiMatching.service.ts | AI-Transaktions-Matching |
| accounting/exchangeRate.service.ts | Wechselkurse |

---

## 6. Datenmodelle

### 6.1 Prisma Schema (~2000+ Zeilen, 80+ Modelle)

#### Authentifizierung & Benutzer (7 Modelle)
- **User**: email, role (ADMIN|MITARBEITER|HANDELSVERTRETER|KUNDE|SUBUNTERNEHMER|DEMO|ENDKUNDE_PORTAL|PARTNER), parentUserId (Hierarchie), tokenVersion, gesperrt
- **RefreshToken**, **PasswordResetToken**, **EmailVerificationToken**
- **UserSession**: lastActivity, deviceInfo, ipAddress
- **UserSetting**: key/value pro User
- **WhatsAppUserLink**: Multi-Nummern-Support

#### Kunden & Organisationen (5 Modelle)
- **Kunde**: firma, steuernummer, whiteLabelConfig (JSON), accountGesperrt
- **Handelsvertreter**: provisionssatz, iban, wiseRecipientId, aktiv, oberHvId (Hierarchie)
- **HvLead**, **HvLeadNote**, **HvLeadActivity**: CRM für HV-Leads

#### Installationen (Kern-Geschäftsmodell, 14 Modelle)
- **Installation**: status, phase, zustand, kundeId, netzbetreiberId, technicalData (JSON), publicId, dedicatedEmail, isSold, factroTaskId, rechnungGestellt, isDemo, deletedAt
- **InstallationEvent**: phase, zustand, fromStatus, toStatus, comment, userId
- **StatusHistory**: from_status, to_status, created_at
- **InboxItem**: type, priority (CRITICAL/HIGH/NORMAL/LOW), status, metadata
- **Deadline**: type, dueDate, status, installationId
- **Anlage**: Bestandsanlagen mit technischen Details
- **TechnikModul**, **TechnikWechselrichter**, **TechnikSpeicher**, **TechnikWallbox**, **TechnikWaermepumpe**: technik_* Tabellen mit hersteller/modell als Strings

#### Netzbetreiber (4 Modelle)
- **Netzbetreiber**: name, bdewCode, email, portalUrl, plzBereiche (JSON), vnbDigitalId, avgResponseDays, reminderDays
- **NetzbetreiberCredential**: AES-256-CBC verschlüsselt
- **NbPortalConfig**: Portal-Automatisierung
- **NbDomainMapping**: Domain → netzbetreiberId

#### Dokumente & Kommunikation (7+ Modelle)
- **Document**: kategorie, dokumentTyp, status, speicherpfad, aiAnalysis
- **VdeFormularSet**: VDE E1-E8 PDFs mit Signatur
- **Email**: fromAddress, subject, bodyText, bodyHtml, aiType, aiConfidence, installationId, factroProjectId
- **SentEmail**: outbound Emails
- **Comment**: installationId, userId, is_internal
- **EmailAction**, **EmailEscalation**

#### NB-Response System (4 Modelle)
- **NbResponseTask**: status, resolveStatus, threadEmails (JSON), classificationId, category, ibnCheckliste
- **NbComplaint**: type (6 Typen), detail, resolved, method
- **NbComplaintPattern**: Cross-Project-Learning pro NB+Typ+Pattern
- **NbTaskComment**: action, message, type (SYSTEM/MANUAL)

#### Rechnungswesen (6+ Modelle)
- **Rechnung**: nummer (RE-YYYYMM-XXXXX), status (ENTWURF/OFFEN/VERSENDET/UEBERFAELLIG/MAHNUNG/BEZAHLT/STORNIERT), betragNetto, betragBrutto, mahnStufe
- **InvoiceCounter**: key=YYYYMM, counter (base36 + OFFSET 17000)
- **Provision**: betrag, provisionssatz, status (OFFEN/FREIGEGEBEN/AUSGEZAHLT/STORNIERT)
- **ProvisionsAuszahlung**: Batch-Auszahlungen pro HV
- **PaymentLink**: paymentUrl, expiresAt
- **MahnungWesen**: Mahnstufe, mahngebuehr

#### Wise Integration (2 Modelle)
- **WiseAccount**: profileId, balanceId, token (encrypted)
- **WiseTransaction**: referenceNumber, amount, matchedRechnungId, matchConfidence

#### Produkte (6 Modelle)
- **Hersteller**: name (Relation)
- **Produkt**: name, herstellerId, verified
- **PvModul**: 40+ technische Felder
- **Wechselrichter**: acLeistungW, dcLeistungMaxW, mppTrackerAnzahl (NICHT max*)
- **SpeicherSystem**: ladeleistungMaxKw, batterietyp (lowercase), zyklenBeiDod80
- **WallboxDb**, **WaermepumpeDb**

#### Intelligence & Learning (15+ Modelle)
- **EmailClassification**: llm* (OpenAI) + local* (Ollama) Felder
- **BrainKnowledge**: 29 Einträge aus deriveBusinessKnowledge()
- **EvuProfile**: Aggregierte NB-Stats (confidence, processingDays, approvalRate)
- **NbCorrespondence**, **NbIntelligence**, **GridOperatorIntelligence**
- **BotLearningEvent**, **SmartSuggestion**, **InstallationIntelligence**
- **AutomationLog**, **AnalyticsSnapshot**

#### Integrations (5 Modelle)
- **FactroProject**: netzanfrageGestelltAm, vorgangsnummer, dedicatedEmail
- **FactroComment**: factroCommentId, parentCommentId, creatorName
- **Partner**, **PartnerProject**, **PartnerDocument**, **PartnerComment**

#### Weitere Modelle
- **EfkSignature**: PNG/JPEG Signaturen, isDefault
- **EmailAttachment**: SHA-256 contentHash, documentType
- **WhatsAppMessage**, **WhatsAppConversation**, **UserPreference**
- **PortalUserInstallation**, **EndkundenConsent**
- **CompanySettings**, **AuditLog**, **BugReport**, **Announcement**
- **FeatureFlag**, **AutomationRule**, **AutomationExecution**
- **FormularLink**: Externe Formular-Links

### 6.2 Beziehungs-Highlights

```
User ──1:N──> Installation (kundeId via Kunde)
User ──1:1──> Handelsvertreter
User ──N:1──> Kunde (parentUserId für SUBUNTERNEHMER)
User ──N:1──> Partner (partnerId)

Installation ──N:1──> Netzbetreiber
Installation ──1:N──> Document
Installation ──1:N──> Comment
Installation ──1:N──> StatusHistory
Installation ──1:N──> InstallationEvent
Installation ──1:N──> InboxItem
Installation ──1:N──> Deadline
Installation ──1:1──> FactroProject (factroTaskId)
Installation ──1:N──> NbResponseTask
Installation ──1:N──> Email (matched)
Installation ──N:N──> TechnikModul/Wechselrichter/Speicher/etc.

Rechnung ──N:1──> Kunde
Rechnung ──1:N──> Mahnung
Rechnung ──0:1──> WiseTransaction (matched)

Provision ──N:1──> Handelsvertreter
Provision ──N:1──> ProvisionsAuszahlung

FactroProject ──1:N──> FactroComment
FactroProject ──1:N──> EmailLog

Partner ──1:N──> PartnerProject
Partner ──1:N──> User (partnerId)
```

---

## 7. Knowledge Map

### 7.1 Netzbetreiber-Wissen

| Wissensbereich | Speicherort | Beschreibung |
|---------------|-------------|-------------|
| NB-Stammdaten | `netzbetreiber` Tabelle (787 Einträge) | Name, Email, Telefon, Portal-URL, PLZ-Bereiche |
| NB-Kontaktdaten | `netzbetreiber` + VNBdigital Enrichment | 92% verlinkt, 712 mit Email, 719 mit Website |
| NB-Portal-Config | `nbFormMapping` + `nbPortalConfig` | URL, CSS-Selektoren, Zugangsdaten |
| NB-Zugangsdaten | `netzbetreiberCredential` (AES-256) | Verschlüsselte Portal-Logins |
| NB-Domain-Mapping | `nbDomainMapping` | Email-Domain → Netzbetreiber-ID |
| NB-Lernprofile | `evuProfile` | Bearbeitungszeiten, Rückfrage-Rate, Genehmigungstyp |
| NB-Complaint-Patterns | `nbComplaintPattern` | Cross-Project-Learning pro NB+Typ |
| NB-Kommunikation | `nbCorrespondence` | Korrespondenz-Historie pro Installation |
| NB-spezifische Sonderlogik | `nbResponseOrchestrator`, `emailMatcher` | noreply@ Detection, NB-Portal-URLs (Stromnetz Berlin, energis, Westnetz) |

### 7.2 Regulatorisches Wissen

| Norm/Gesetz | Implementierung | Dateien |
|-------------|----------------|---------|
| VDE-AR-N 4105 | VDE-Formulare E1-E8, Schaltplan-Layout | vdeFormular/, documentGenerator/ |
| VDE-AR-N 4110 | VDE 4110 Formular-Generator | vde4110-pdf-service.ts |
| §14a EnWG | Steuerbare Verbraucher in Schaltplänen | schaltplanGeneratorPython.ts |
| MaStR | SOAP-API Integration | mastr.service.ts |
| DSGVO | Endkunden-Consent, Unsubscribe | endkundenContactGuard.ts, unsubscribe.routes.ts |
| EEG 2023 | Einspeisetarife (Staffelung) | eegTarife.ts |

### 7.3 Produkt-Wissen

| Kategorie | Tabelle | Felder | Vollständigkeit |
|-----------|---------|--------|----------------|
| PV-Module | `pv_modul` | 40+ Felder (Hersteller→Relation) | Gut |
| Wechselrichter | `wechselrichter` | acLeistungW, dcLeistungMaxW, mppTracker | Gut |
| Batteriespeicher | `speicher_system` | ladeleistungMaxKw, batterietyp, zyklen | Gut |
| Wallboxen | `wallbox_db` | Basis-Felder | Mittel |
| Wärmepumpen | `waermepumpe_db` | Basis-Felder | Mittel |
| Technik-Tabellen | `technik_*` | hersteller/modell als Strings (nicht Relations!) | Legacy |

### 7.4 Geschäftslogik

| Bereich | Ort | Details |
|---------|-----|---------|
| Pricing | `pricing.service.ts` | Tier 1: 149€ (1-9/Mo), Tier 2: 129€ (10+/Mo), Pakete hardcoded |
| HV-Provisionen | `provision.service.ts` | Rate pro HV, Ober-HV-Splitting via oberHvId |
| Billing-Trigger | `autoInvoice.service.ts` | Bei Status BEIM_NB → Auto-Rechnung |
| Mahnsystem | `mahnung.service.ts` | 3 Stufen, Email/WhatsApp DEAKTIVIERT |
| Status-Workflow | `workflowV2/transitionService.ts` | 16 erlaubte Transitions, Dual-Write (V1+V2) |
| Subunternehmer | `roles.ts` → `getBillingKundeId()` | SUB wird unter WhiteLabel-Kunde abgerechnet |
| Rechnungsnummern | `lib/invoiceNumber.ts` | RE-YYYYMM-XXXXXX (base36, OFFSET=17000) |

### 7.5 Status-Workflow

```
NEU → IN_BEARBEITUNG → BEIM_NB → RUECKFRAGE → BEIM_NB
                                → GENEHMIGT → IBN → FERTIG
                                → ABGELEHNT
(jederzeit) → STORNIERT

WorkflowV2 Phasen:
einreichung:offen → einreichung:wartet → genehmigung:abgeschlossen → ibn:offen → fertig:abgeschlossen
einreichung:offen → einreichung:rueckfrage → einreichung:wartet
```

---

## 8. AI-System Dokumentation

### 8.1 AI-Modell-Landschaft

| Modell | Anbieter | Einsatz | Temp | Timeout |
|--------|----------|---------|------|---------|
| gpt-4o-mini | OpenAI | Email-Klassifikation (Primary), Complaint-Parsing, Schaltplan-Korrektur | 0.1 | 15s |
| gpt-4o | OpenAI | Email-Response-Generierung, Bild-OCR, PDF-Analyse, Quality Checks | 0.1 | 60s |
| llama3.1:8b | Ollama (local) | Email-Klassifikation (Parallel/Secondary) | 0.1 | 120s |
| text-embedding-3-small | OpenAI | RAG Embeddings (1536 Dim) | - | 20s |
| claude-sonnet/haiku | Anthropic | AI-Assistenz (konfiguriert aber wenig genutzt) | - | - |
| whisper-1 | OpenAI | Audio-Transkription (WhatsApp Voice) | - | - |

### 8.2 Email-KI-Pipeline (Dual-LLM)

```
Inbound Email (IMAP)
    ↓
emailInbox.service → emailPipeline.service
    ↓
┌──────────────────────────┐
│  Promise.allSettled()     │
│  ┌──────────┐ ┌────────┐ │
│  │ OpenAI   │ │ Ollama │ │
│  │ gpt-4o-  │ │ llama  │ │
│  │ mini     │ │ 3.1:8b │ │
│  └──────────┘ └────────┘ │
└──────────────────────────┘
    ↓
emailClassification (llm* + local* Felder)
    ↓
emailAutomation.service
    ↓
┌─────────────────────────────────┐
│ GENEHMIGUNG → Status GENEHMIGT  │
│ ABLEHNUNG → Status ABGELEHNT    │
│ RUECKFRAGE → NbResponseTask     │
│ KUNDENFREIGABE → Portal-Link    │
│ IBN → Status IBN                │
│ SONSTIGE → Alert                │
└─────────────────────────────────┘
```

### 8.3 NB-Response-Orchestrator (Auto-Resolve)

```
NbResponseTask erstellt
    ↓
prepareResponse() [5 Phasen]
    ↓
1. nbThreadAnalyzer → Email-Thread aufbauen
    ↓
2. nbComplaintParser → Complaints extrahieren (GPT-4o-mini)
    ↓
3. nbResolveEngine → Auto-Resolve versuchen
   ├── MISSING_SIGNATURE → EFK-Signatur einsetzen
   ├── SCHALTPLAN_ERROR → GPT-Korrektur + Regenerierung
   ├── WRONG_DATE → VDE-Formular nachfüllen
   ├── MISSING_DOCUMENT → Anhang/VDE suchen
   ├── FORM_INCOMPLETE → VDE nachfüllen
   └── CLARIFICATION_NEEDED → Pattern-Hints
    ↓
4. Dokument-Lücken bewerten
    ↓
5. Antwort-Entwurf generieren
    ↓
Admin Review → approveAndSend()
    ↓
learnFromResolvedTask() → nbComplaintPattern
```

### 8.4 RAG-System

```
Query → enterpriseRagService.getSmartContext()
    ↓
1. generateEmbedding() [text-embedding-3-small]
    ↓
2. pgvector Cosine Similarity Search (Threshold ≥ 0.45)
    ↓
3. Top-5 Results
    ↓
4. Context-Formatierung: "[CATEGORY] content"
    ↓
Genutzt von: claudeAI, openai, emailAutoreply, nbResolveEngine

29 Kategorien indexiert, 25.314 Embeddings
Auto-Reindex alle 60 Min (inkrementell)
```

### 8.5 Prompts & Safety Gates

- **Prompts**: Alle inline in Services (NICHT konfigurierbar)
  - `openaiClassifier.service.ts`: Email-Klassifikation (11 Kategorien + 18 Felder)
  - `nbComplaintParser.service.ts`: Complaint-Extraktion (6 Typen)
  - `nbResolveEngine.service.ts`: Schaltplan-Korrektur-Analyse (~400 Z.)
  - `emailAutoreply.service.ts`: Antwort-Generierung
  - `openai.service.ts`: Installation-Parsing, Bild-OCR, PDF-Analyse

- **Safety Gates**:
  - `is_document_request` Guard (openaiClassifier): Verhindert False-Positive RUECKFRAGE
  - `hasConcreteDocumentRequests()` (emailPipeline): Prüft gegen 38 DOCUMENT_KEYWORDS
  - noreply@ Detection (nbResponseOrchestrator): responseTo=null + Warnung
  - IBN-Checkliste (Orchestrator): Spezielles Dokument-Set für Inbetriebsetzung
  - Confidence Thresholds: 95% Auto-Act, 90% Suggest, 75% Manual, 50% Ignore

---

## 9. Duplikate & Dead Code

### 9.1 Code-Duplikate

#### Duplikat #1: stripHtml() — 4 Implementierungen ⚠️ HIGH
| Stelle | Datei:Zeile | Verhalten |
|--------|-------------|-----------|
| A | emailTemplate.service.ts:252 | Aggressive: Alles zu Single Space |
| B | nbComplaintParser.service.ts:339 | Konservativ: br/p/div → Newlines |
| C | factroParser.ts:114 | Umfassend: + h1-6, Entity Decode |
| D | factroCommentSync.ts:79 | Export: stripCommentHtml, 8 Entity Types |
| **Empfehlung**: Zentraler `htmlStripper.util.ts` mit Optionen |

#### Duplikat #2: Phone-Normalisierung — 8 Stellen ⚠️ MEDIUM
| Stelle | Datei | Verhalten |
|--------|-------|-----------|
| A | adminUsers.routes.ts:582 | `replace(/[^0-9]/g, "")` |
| B | betreiberChat.service.ts:52 | Identisch + getPhoneVariants() |
| C | whatsappRouter.service.ts:177-178 | +49/0 Conversion |
| D | whatsappConversation.service.ts:464,780 | Multiple Formate |
| E | hvLeads.routes.ts:58-62 | Eigene Normalisierung |
| F | userPreferences.service.ts:90 | `.replace(/^49/, '+49')` |
| **Empfehlung**: `phoneNormalizer.util.ts` |

#### Duplikat #3: Date-Formatting — 9+ Stellen ⚠️ MEDIUM
| Stelle | Datei | Verhalten |
|--------|-------|-----------|
| A | emailTemplate.service.ts:31-40 | Handlebars Helpers, de-DE |
| B | zaehlerwechselTermin.service.ts:114-129 | formatDateGerman(), formatDateShort() |
| C | documentGenerator/shared/pdfHelpers.ts:357 | Underscore-Fallback |
| D | Diverse Services | Inline `toLocaleDateString('de-DE')` |
| **Empfehlung**: `dateFormatter.util.ts` |

#### Duplikat #4: OpenAI Client Init — 19 Stellen ⚠️ HIGH
| Pattern | Anzahl | Stellen |
|---------|--------|---------|
| Lazy Singleton (null check) | 8 | emailAutoreply, claudeAI, emailAutomation, nbComplaintParser, evuLearning, gptValidator, localAI, workflow.routes |
| Class Instance Property | 6 | productEnrichment, product, openai, productMatcher, etc. |
| Module-Level Direct | 3 | ai.routes, produkte.routes (2x inline!) |
| Functional Return | 2 | accounting/aiChat, accounting/aiExtraction |
| Per-Call New Instance | 1 | tabAnalysis |
| **Empfehlung**: `openaiClientFactory.ts` mit Pooling |

#### Duplikat #5: Cache-Pattern — 11 Implementierungen ⚠️ MEDIUM
Alle nutzen `Map<string, {data, timestamp}>` mit verschiedenen TTLs und Max-Sizes, aber ohne standardisiertes Interface.
| Stelle | TTL | Max |
|--------|-----|-----|
| emailTemplate | 5min | 50 |
| emailMatcher | 10min | - |
| endkundenContactGuard | 5min | 500 |
| embeddingService | 30min | 500 |
| vnbdigital | 24h | 500 |
| claudeAI | 5min | 100 |
| featureFlags | 5min | Redis+Memory |
| **Empfehlung**: `CacheManager` Klasse mit TTL, Max, LRU |

### 9.2 Dead Code & Unused Exports

| Fund | Datei | Details |
|------|-------|---------|
| `classifyWithLocalLLM()` | emailInbox.service.ts | Deklariert, nie aufgerufen |
| openaiTest.routes.ts | routes/ | Test-Routes in Production |
| claudeCode.routes.ts | routes/ | Verifizieren ob aktiv genutzt |
| featureBuilder.routes.ts | routes/ | Verifizieren ob aktiv genutzt |
| schaltplan.ts (PDFKit) | documentGenerator/ | DEPRECATED, ersetzt durch Python |
| intelligence-schema.sql | src/ | SQL-Schema-Datei im src/ Verzeichnis |

### 9.3 Inkonsistenzen

| Inkonsistenz | Details |
|-------------|---------|
| Error Responses | 3+ Formate: `{error:"..."}`, `{success:false, message:"..."}`, `{message:"...", code:N}` |
| Pagination | Manche routes nutzen `utils/pagination.ts`, viele implementieren es manuell |
| Naming | API-Responses mischen snake_case (`technical_data`) und camelCase (`kundeId`) |
| Email-Kategorien | openaiClassifier hat 11, localAI hat 10 (kein `kundenfreigabe`!) |
| Date-Handling | Manche Services nutzen `Date`, andere `dayjs`, manche Raw-Millisekunden |

---

## 10. Dependency-Graph

### 10.1 Service-Abhängigkeiten (Kern)

```
emailInbox
  → emailMatcher (Installation/FactroProject matching)
  → emailPipeline
      → openaiClassifier (GPT-4o-mini)
      → localAI (Ollama)
      → emailAutomation
          → evuLearning
          → enterpriseRag
          → workflow
          → autoInvoice
          → inboxItemGenerator

nbResponseOrchestrator
  → nbThreadAnalyzer (Thread-Aufbau)
  → nbComplaintParser (GPT-Analyse)
  → nbResolveEngine
      → vdeFormularFetcher
      → efkSignature
      → emailAttachment
      → documentGenerator (Schaltplan)
      → OpenAI (Korrektur-Analyse)
  → emailSend (Versand)
  → nbLearning (Post-Send Learning)

autoInvoice
  → pricing (Preis ermitteln)
  → invoicePdf (PDF rendern)
  → paymentLink (Link erstellen)
  → email.service (Email senden)

wise
  → rechnung (Status updaten)
  → mahnung (Entsperren nach Zahlung)
  → provision (HV-Provisionen)
  → journal (Buchungen)

workflow (Legacy)
  → emailGateway (Benachrichtigungen)
  → inboxItemGenerator (Aufgaben)
  → betreiberChat (NB-Learning)

workflowV2/transitionService
  → statusMapping (Phase → Legacy Status)
  → dualWrite (V1+V2 sync)
  → eventService (Events erstellen)
  → workflow (Legacy Hook)
  → portalNotificationCreator
```

### 10.2 Zirkuläre Abhängigkeiten

Keine echten zirkulären Imports gefunden, aber:
- `workflow.service` und `workflowV2/transitionService` rufen sich gegenseitig über Hooks auf (Dual-Write Pattern)
- `emailAutomation` ruft `autoInvoice` auf, `autoInvoice` nutzt `email.service` → keine Zirkularität, aber lange Ketten

### 10.3 God-Services (zu viele Verantwortlichkeiten)

| Service | Zeilen | Verantwortlichkeiten | Empfehlung |
|---------|--------|---------------------|------------|
| claudeAI.service.ts | 1837 | Email-Classify, Generate, Summarize, Quality, Validate, Alerts | Aufteilen in 4 Services |
| factro.service.ts | ~1500 | Config, Polling, Status-Sync, Parser, Document-Import | Aufteilen in 3 Services |
| provision.service.ts | 1353 | Calculate, Release, Approve, Payout, Export, Stats | Aufteilen in 2 Services |
| wise.service.ts | 1295 | Account Mgmt, Sync, Matching, Payouts, Webhooks | Aufteilen in 3 Services |
| workflow.service.ts | 1183 | Status Events, Emails, InboxItems, Batching | Aufteilen in 2 Services |
| whatsappMessage.service.ts | 1121 | Templates, Sending, Testing, Consent | Aufteilen in 2 Services |
| openai.service.ts | 1107 | Chat, Parse, OCR, Audio, Geocode, PDF | Aufteilen in 4 Services |
| mastr.service.ts | 1060 | SOAP Client + Data Mapping | OK (API-Wrapper) |
| netzanfrage.service.ts | 1013 | Preview, Send, Batch, Template | Aufteilen in 2 Services |
| emailMatcher.service.ts | 1002 | 6 Matching-Strategien + Scoring | OK (kohärent) |

### 10.4 Tight Coupling

| Service A | Service B | Problem |
|-----------|-----------|---------|
| autoInvoice | rechnung.routes | Importiert `getPublicInvoicePdfUrl()` aus Route-Datei |
| emailAutomation | 6+ Services | Direkte Imports statt Event-basiert |
| workflow/workflowV2 | Dual-Write | Zwei Systeme die synchron gehalten werden müssen |

---

## 11. Security & Quality Findings

### 11.1 Security

| Finding | Severity | Details |
|---------|----------|---------|
| ✅ JWT mit tokenVersion | - | Token-Invalidierung nach Logout funktioniert |
| ✅ RBAC mit Data Scoping | - | Umfassend implementiert in roles.ts (484 Z.) |
| ✅ Rate Limiting | - | 4 Limiter (global, auth, upload, AI) mit Redis |
| ✅ Verschlüsselte NB-Zugangsdaten | - | AES-256-CBC mit Master Key |
| ✅ DSGVO Consent Checks | - | endkundenContactGuard vor Email/WhatsApp |
| ✅ Security Audit Log | - | securityAudit.service.ts |
| ✅ Input Sanitization | - | lib/sanitize.ts |
| ✅ Helmet + CSP | - | Security Headers in index.ts |
| ⚠️ Fail-Open Consent | LOW | endkundenContactGuard erlaubt bei DB-Fehler |
| ⚠️ GraphQL String Interpolation | LOW | vnbdigital.service.ts (read-only API) |
| ⚠️ openaiTest.routes.ts in Prod | LOW | Test-Endpoints sollten entfernt werden |

### 11.2 Error Handling

| Aspekt | Status | Details |
|--------|--------|---------|
| Zentraler Error Handler | ✅ | errorHandler.ts mit Prisma-Error-Mapping |
| asyncHandler Wrapper | ✅ | Fängt unhandled Promise Rejections |
| Sentry Integration | ✅ | Unhandled Errors werden gemeldet |
| Health Check | ✅ | /api/health mit 10s Cache |
| Fire-and-Forget Risks | ⚠️ | nbTaskComment, auth session update, portalAuth visit |
| Silent Failures | ⚠️ | RAG-Context-Fehler in claudeAI/openai werden verschluckt |

### 11.3 Performance-Auffälligkeiten

| Finding | Severity | Details |
|---------|----------|---------|
| N+1 in predictionEngine | MEDIUM | DB-Queries pro Bottleneck in Loop |
| OpenAI Client per Request | MEDIUM | produkte.routes.ts erstellt neue Instanzen inline |
| In-Memory Caches ohne LRU | LOW | FIFO statt LRU in 6+ Caches |
| IMAP Polling statt Push | LOW | 60s Polling statt IMAP IDLE |
| factroCommentSync Rate Limit | LOW | setTimeout in Loop blockiert Event Loop |
| Fehlende DB-Indizes | REVIEW | query-patterns vs. aktuelle Indizes prüfen |

### 11.4 Fehlende Transaktionen (Kritisch)

| Operation | Service | Steps ohne Transaction |
|-----------|---------|----------------------|
| Auto-Invoice | autoInvoice.service | Load → Check → Price → PDF → PaymentLink → Email → Mark (7 Steps) |
| Mahnung + Kontosperre | mahnung.service | Create Mahnung → Update Rechnung → Lock Kunde → Suspend Users |
| Wise Payout | wise.service | Quote → Transfer → Fund (mit SCA) |
| Status-Transition | transitionService | Update Installation → Create Event → Create StatusHistory → Create Deadline |
| NB-Response Approve | nbResponseOrchestrator | Update Task → Send Email → Learn → Create Inbox Item |

---

## 12. Konsolidierungs-Empfehlung

### 12.1 Quick Wins (Niedrig Effort, Hoher Impact)

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 1 | `htmlStripper.util.ts` erstellen (4 Duplikate konsolidieren) | 2h | Wartbarkeit |
| 2 | `phoneNormalizer.util.ts` erstellen (8 Duplikate konsolidieren) | 1h | Konsistenz |
| 3 | `dateFormatter.util.ts` erstellen (9+ Duplikate konsolidieren) | 2h | Konsistenz |
| 4 | `openaiClientFactory.ts` erstellen (19 Initialisierungen konsolidieren) | 3h | Performance, Wartbarkeit |
| 5 | `CacheManager` Klasse (11 Cache-Patterns vereinheitlichen) | 4h | Wartbarkeit |
| 6 | openaiTest.routes.ts entfernen oder Feature-Flag gaten | 0.5h | Security |
| 7 | Dead Code `classifyWithLocalLLM()` in emailInbox entfernen | 0.5h | Sauberkeit |
| 8 | Error Response Format standardisieren (ApiError Klasse nutzen) | 4h | API-Konsistenz |

### 12.2 Mittelfristige Konsolidierung

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 9 | `claudeAI.service.ts` aufteilen in emailClassify, emailGenerate, qualityCheck, documentValidation | 1 Tag | Wartbarkeit |
| 10 | `wise.service.ts` aufteilen in wiseAccount, wiseSync, wiseMatching, wisePayout | 1 Tag | Wartbarkeit |
| 11 | `provision.service.ts` aufteilen in provisionCalc, provisionWorkflow | 0.5 Tag | Wartbarkeit |
| 12 | `prisma.$transaction()` für alle kritischen Multi-Step-Ops | 2 Tage | Datenintegrität |
| 13 | In-Memory State → Redis migrieren (Idempotency, Cooldowns) | 1 Tag | Restart-Resilienz |
| 14 | Pagination-Utility konsequent nutzen | 1 Tag | API-Konsistenz |
| 15 | Email-Kategorien zwischen OpenAI (11) und Ollama (10) angleichen | 2h | Dual-LLM Konsistenz |

### 12.3 Langfristige Architektur

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 16 | Event-basierte Architektur statt direkte Service-Aufrufe (emailAutomation) | 1 Woche | Entkopplung |
| 17 | Workflow V1/V2 Dual-Write eliminieren (nur V2) | 3 Tage | Komplexitätsreduktion |
| 18 | Prompts externalisieren (DB oder YAML statt inline) | 2 Tage | Konfigurierbarkeit |
| 19 | Job Queue (Bull/BullMQ) für async Verarbeitung statt Cron | 1 Woche | Reliability |
| 20 | Pricing aus DB laden statt hardcoded | 0.5 Tag | Flexibilität |

### 12.4 Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|---------------------|--------|-----------|
| Fehlende Transaktionen → Inkonsistente Daten | MITTEL | HOCH | #12 priorisieren |
| In-Memory State verloren bei Restart | HOCH | MITTEL | #13 |
| Wise Payout Race Condition | NIEDRIG | HOCH | Transaction + Idempotency Key |
| Email-Gateway Circuit Breaker nicht persistent | MITTEL | NIEDRIG | Redis-backed State |
| Mahnung deaktiviert → Offene Forderungen | BEKANNT | MITTEL | Email-Stubs implementieren |

### 12.5 Impact/Effort Matrix

```
                    LOW EFFORT          HIGH EFFORT
HIGH IMPACT    │ #1-7 (Quick Wins)  │ #12 (Transactions)
               │ #8 (Error Format)  │ #16 (Events)
               │                    │ #17 (V2 Migration)
───────────────┼────────────────────┼───────────────────
LOW IMPACT     │ #14 (Pagination)   │ #19 (Job Queue)
               │ #15 (LLM Sync)     │ #18 (Prompts extern)
               │ #20 (Pricing DB)   │
```

**Empfohlene Reihenfolge:**
1. Quick Wins (#1-7) → sofort
2. Transaktionen (#12) → nächste Woche
3. Service-Splitting (#9-11) → iterativ
4. Redis Migration (#13) → nach Service-Splitting
5. Workflow V2 Migration (#17) → nach Stabilisierung
6. Event-Architektur (#16) → langfristig

---

*Report erstellt am 2026-03-15 durch Deep Codebase Analyse*
*Backend: 335 TypeScript-Dateien, 100+ Services, 71 Route-Module, 80+ DB-Modelle*
*Frontend: 860+ Dateien, 532 Komponenten, 50+ Routes, 14 Feature-Module*

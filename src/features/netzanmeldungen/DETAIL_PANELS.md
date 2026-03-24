# Detail-Panel Zuordnung (Stand 2026-03-17)

## AKTIV

### CrmDetailPanel (`components/detail/CrmDetailPanel.tsx`)
- **Seite:** `/netzanmeldungen` (NetzanmeldungenEnterprise.tsx)
- **Verwendet für:** CRM-Projekte UND Wizard-Installationen
- **CRM-Mode:** Alle Tabs (Übersicht, Timeline, Angebot, NB-Komm, VDE, Tickets, Dokumente, Unterlagen, Kommentare, Montage)
- **Installation-Mode:** Reduzierte Tabs (Übersicht, NB-Komm, VDE, Tickets, Dokumente, Unterlagen, Kommentare)
- **Übersicht CRM:** `DetailUebersicht.tsx`
- **Übersicht Installation:** `InstallationUebersicht.tsx` (zeigt ALLE Wizard-Felder)

### Sub-Komponenten (AKTIV, in `components/detail/`)
- `DetailHeader.tsx` — Sticky Header mit Lifecycle-Bar
- `DetailTabs.tsx` — Tab-Leiste (dynamisch je nach Mode)
- `DetailUebersicht.tsx` — CRM-Projekt Übersicht
- `InstallationUebersicht.tsx` — Wizard-Installation Übersicht (ALLE Felder)
- `TabKommentare.tsx` — Kommentar-Thread
- `TabDokumente.tsx` — Dokumente (CRM + Installation)
- `TabNbKomm.tsx` — NB-Kommunikation (ein- und ausgehend)
- `TabVdeCenter.tsx` — VDE-Formulare + NA erstellen
- `TabAngebot.tsx` + `AngebotEditor.tsx` — Angebote mit Backend-Persistierung
- `TabTickets.tsx` — Ticket-System
- `TabTimeline.tsx` — Projekt-Timeline
- `TabUnterlagen.tsx` — Unterlagen-Checkliste
- `TabMontage.tsx` — Montage-Planung

---

## ARCHIVIERT (nicht mehr verwendet)

### DetailPanel (`components/DetailPanel/index.tsx`)
- **Status:** ARCHIVIERT — wird nicht mehr von aktiven Seiten importiert
- **War:** Slide-In Panel mit eigenem OverviewTab, TechTab, DocumentsTab etc.
- **Ersetzt durch:** CrmDetailPanel mit InstallationUebersicht
- **Hinweis:** Code bleibt erhalten als Referenz, wird aber nicht mehr gerendert

### DetailModal (`components/DetailModal/`)
- **Status:** ARCHIVIERT
- **War:** Modal-basiertes Detail-Panel (ältere Version)
- **Ersetzt durch:** CrmDetailPanel

### UnifiedDetailPanel (`core/panels/UnifiedDetailPanel.tsx`)
- **Status:** ARCHIVIERT
- **War:** Versuch einer einheitlichen Panel-Lösung mit Hooks
- **Ersetzt durch:** CrmDetailPanel
- **VITE_UNIFIED_PANEL_ENTERPRISE** Flag ist irrelevant geworden

---

## Seiten-Zuordnung

| Route | Seite | Detail-Panel |
|-------|-------|-------------|
| `/netzanmeldungen` | NetzanmeldungenEnterprise | CrmDetailPanel |
| `/netzanmeldungen/:id` | NetzanmeldungenEnterprise | CrmDetailPanel |
| `/projekte` | ProjektePage | (eigenes) |
| `/crm/produkte` | ProduktKatalogPage | — |

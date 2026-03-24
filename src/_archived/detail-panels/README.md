# Archived Detail Panels

These panels have been replaced by the **Unified Panel System** (`src/core/panels/`).

## Migration Status

| Old Panel | Location | Replaced By | Status | Date |
|-----------|----------|-------------|--------|------|
| DetailPanel (Enterprise) | `features/netzanmeldungen/components/DetailPanel/` | `UnifiedDetailPanel` | Feature-flagged | 2026-03-15 |
| DetailModal | `features/netzanmeldungen/components/DetailModal/` | `UnifiedDetailPanel` | Feature-flagged | 2026-03-15 |
| InstallationDetailModal | `components/InstallationDetailModal.tsx` | `UnifiedDetailPanel` | Feature-flagged | 2026-03-15 |
| InstallationDetailPanel (v2) | `modules/installations/detail-v2/` | `UnifiedDetailPanel` | Not imported (dead code) | – |
| HvLeadsTab DetailPanel | `features/hv-center/components/tabs/HvLeadsTab.tsx` | Gruppe B (PanelShell only) | Pending | – |

## Feature Flags

Set in `.env` or `.env.local`:

```env
VITE_UNIFIED_PANEL_ENTERPRISE=true   # NetzanmeldungenEnterprise.tsx
VITE_UNIFIED_PANEL_LEGACY=true       # NetzanmeldungenPage.tsx
VITE_UNIFIED_PANEL_ANLAGEN=true      # AnlagenPage.tsx
```

## How to rollback

Set the feature flag to `false` (or remove it) and the old panel will be used.

## Unified Panel Entry Point

```tsx
import { UnifiedDetailPanel } from 'src/core/panels/UnifiedDetailPanel';

<UnifiedDetailPanel
  installationId={123}
  onClose={() => {}}
  onUpdate={() => {}}
  initialTab="overview"
/>
```

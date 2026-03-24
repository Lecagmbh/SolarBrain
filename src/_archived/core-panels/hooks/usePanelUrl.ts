/**
 * URL synchronization for panels
 * Syncs entity ID and active tab to URL via pushState (no router dependency)
 */

import { useEffect, useCallback } from 'react';

interface UsePanelUrlOptions {
  /** Base path, e.g. '/netzanmeldungen' */
  basePath: string;
  entityId: string | number | null;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onEntityChange?: (entityId: string) => void;
  /** Set false to disable URL sync (e.g. for inline panels) */
  enabled?: boolean;
}

/**
 * Reads panel state from current URL
 */
function parseUrl(basePath: string): { entityId: string | null; tab: string | null } {
  const path = window.location.pathname;
  const prefix = basePath.endsWith('/') ? basePath : basePath + '/';

  if (!path.startsWith(prefix)) {
    return { entityId: null, tab: null };
  }

  const rest = path.slice(prefix.length);
  const parts = rest.split('/').filter(Boolean);
  const entityId = parts[0] ?? null;
  const tab = new URLSearchParams(window.location.search).get('tab');

  return { entityId, tab };
}

export function usePanelUrl({
  basePath,
  entityId,
  activeTab,
  onTabChange,
  onEntityChange,
  enabled = true,
}: UsePanelUrlOptions) {
  // Sync state → URL
  useEffect(() => {
    if (!enabled || !entityId) return;

    const targetPath = `${basePath}/${entityId}`;
    const params = new URLSearchParams(window.location.search);
    if (activeTab) params.set('tab', activeTab);

    const targetUrl = `${targetPath}?${params.toString()}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, [enabled, basePath, entityId, activeTab]);

  // Listen for popstate (back/forward)
  const handlePopState = useCallback(() => {
    if (!enabled) return;

    const { entityId: urlId, tab } = parseUrl(basePath);
    if (tab) onTabChange(tab);
    if (urlId && onEntityChange) onEntityChange(urlId);
  }, [enabled, basePath, onTabChange, onEntityChange]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, handlePopState]);
}

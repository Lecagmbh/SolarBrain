/**
 * Baunity usePreferences Hook
 * ============================
 * Zugriff auf Backend-gespeicherte User Preferences
 * - Preferences: Key-Value Einstellungen nach Kategorie
 * - Views: Gespeicherte Tabellen-Konfigurationen
 * - Filters: Gespeicherte Filter-Presets
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '../modules/api/client';
import { useAuth } from '../pages/AuthContext';

// Types
export interface UserPreferences {
  [category: string]: {
    [key: string]: unknown;
  };
}

export interface SavedView {
  id: number;
  name: string;
  isDefault: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedFilter {
  id: number;
  name: string;
  isDefault: boolean;
  filters: Record<string, unknown>;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// usePreferences - Access user preferences from AuthContext + API
// ═══════════════════════════════════════════════════════════════════════════

export function usePreferences() {
  const { preferences, setPreference } = useAuth();

  const getPreference = useCallback((category: string, key: string, defaultValue?: unknown) => {
    return preferences[category]?.[key] ?? defaultValue;
  }, [preferences]);

  const getCategoryPreferences = useCallback((category: string) => {
    return preferences[category] || {};
  }, [preferences]);

  return {
    preferences,
    getPreference,
    getCategoryPreferences,
    setPreference,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useSavedViews - Saved table configurations for a page
// ═══════════════════════════════════════════════════════════════════════════

export function useSavedViews(page: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load views for page
  const loadViews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/me/views/${page}`);
      setViews(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('[useSavedViews] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  // Get default view
  const defaultView = views.find(v => v.isDefault) || null;

  // Create new view
  const createView = useCallback(async (name: string, config: Record<string, unknown>, isDefault = false) => {
    try {
      const response = await api.post(`/me/views/${page}`, { name, config, isDefault });
      const newView = response.data;
      setViews(prev => isDefault
        ? [newView, ...prev.map(v => ({ ...v, isDefault: false }))]
        : [...prev, newView]
      );
      return newView;
    } catch (err: unknown) {
      console.error('[useSavedViews] Create failed:', err);
      throw err;
    }
  }, [page]);

  // Update view
  const updateView = useCallback(async (id: number, updates: Partial<SavedView>) => {
    try {
      const response = await api.put(`/me/views/${page}/${id}`, updates);
      const updated = response.data;
      setViews(prev => {
        const newViews = prev.map(v => v.id === id ? updated : v);
        if (updates.isDefault) {
          return newViews.map(v => v.id === id ? v : { ...v, isDefault: false });
        }
        return newViews;
      });
      return updated;
    } catch (err: unknown) {
      console.error('[useSavedViews] Update failed:', err);
      throw err;
    }
  }, [page]);

  // Delete view
  const deleteView = useCallback(async (id: number) => {
    try {
      await api.delete(`/me/views/${page}/${id}`);
      setViews(prev => prev.filter(v => v.id !== id));
    } catch (err: unknown) {
      console.error('[useSavedViews] Delete failed:', err);
      throw err;
    }
  }, [page]);

  // Set view as default
  const setDefaultView = useCallback(async (id: number) => {
    return updateView(id, { isDefault: true });
  }, [updateView]);

  return {
    views,
    defaultView,
    loading,
    error,
    reload: loadViews,
    createView,
    updateView,
    deleteView,
    setDefaultView,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useSavedFilters - Saved filter presets for a page
// ═══════════════════════════════════════════════════════════════════════════

export function useSavedFilters(page: string) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load filters for page
  const loadFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/me/filters/${page}`);
      setFilters(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('[useSavedFilters] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Get default filter
  const defaultFilter = filters.find(f => f.isDefault) || null;

  // Create new filter
  const createFilter = useCallback(async (name: string, filterConfig: Record<string, unknown>, isDefault = false) => {
    try {
      const response = await api.post(`/me/filters/${page}`, { name, filters: filterConfig, isDefault });
      const newFilter = response.data;
      setFilters(prev => isDefault
        ? [newFilter, ...prev.map(f => ({ ...f, isDefault: false }))]
        : [...prev, newFilter]
      );
      return newFilter;
    } catch (err: unknown) {
      console.error('[useSavedFilters] Create failed:', err);
      throw err;
    }
  }, [page]);

  // Update filter
  const updateFilter = useCallback(async (id: number, updates: Partial<SavedFilter>) => {
    try {
      const response = await api.put(`/me/filters/${page}/${id}`, updates);
      const updated = response.data;
      setFilters(prev => {
        const newFilters = prev.map(f => f.id === id ? updated : f);
        if (updates.isDefault) {
          return newFilters.map(f => f.id === id ? f : { ...f, isDefault: false });
        }
        return newFilters;
      });
      return updated;
    } catch (err: unknown) {
      console.error('[useSavedFilters] Update failed:', err);
      throw err;
    }
  }, [page]);

  // Delete filter
  const deleteFilter = useCallback(async (id: number) => {
    try {
      await api.delete(`/me/filters/${page}/${id}`);
      setFilters(prev => prev.filter(f => f.id !== id));
    } catch (err: unknown) {
      console.error('[useSavedFilters] Delete failed:', err);
      throw err;
    }
  }, [page]);

  // Set filter as default
  const setDefaultFilter = useCallback(async (id: number) => {
    return updateFilter(id, { isDefault: true });
  }, [updateFilter]);

  return {
    filters,
    defaultFilter,
    loading,
    error,
    reload: loadFilters,
    createFilter,
    updateFilter,
    deleteFilter,
    setDefaultFilter,
  };
}

// Default export
export default {
  usePreferences,
  useSavedViews,
  useSavedFilters,
};

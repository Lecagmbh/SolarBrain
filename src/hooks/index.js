/**
 * LECA Custom Hooks
 * Reusable React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Dimensions, AppState } from 'react-native';
import { dashboardApi, installationsApi } from '../api/client';

// ══════════════════════════════════════════════════════════════════════════
// useDebounce - Debounce values for search etc.
// ══════════════════════════════════════════════════════════════════════════

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ══════════════════════════════════════════════════════════════════════════
// useKeyboard - Track keyboard visibility
// ══════════════════════════════════════════════════════════════════════════

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isVisible, keyboardHeight, dismiss: Keyboard.dismiss };
}

// ══════════════════════════════════════════════════════════════════════════
// useDimensions - Track screen dimensions
// ══════════════════════════════════════════════════════════════════════════

export function useDimensions() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  return dimensions;
}

// ══════════════════════════════════════════════════════════════════════════
// useAppState - Track app foreground/background state
// ══════════════════════════════════════════════════════════════════════════

export function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);
  const previousState = useRef(appState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      previousState.current = appState;
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState]);

  return {
    current: appState,
    previous: previousState.current,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    becameActive: previousState.current !== 'active' && appState === 'active',
  };
}

// ══════════════════════════════════════════════════════════════════════════
// useRefresh - Pull-to-refresh helper
// ══════════════════════════════════════════════════════════════════════════

export function useRefresh(loadData) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return { refreshing, onRefresh };
}

// ══════════════════════════════════════════════════════════════════════════
// useDashboardData - Fetch dashboard data
// ══════════════════════════════════════════════════════════════════════════

export function useDashboardData() {
  const [stats, setStats] = useState(null);
  const [recentInstallations, setRecentInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, installationsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentInstallations(5),
      ]);
      setStats(statsData);
      setRecentInstallations(installationsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { refreshing, onRefresh } = useRefresh(loadData);

  return { stats, recentInstallations, loading, error, refreshing, onRefresh, reload: loadData };
}

// ══════════════════════════════════════════════════════════════════════════
// useInstallations - Paginated installations with search/filter
// ══════════════════════════════════════════════════════════════════════════

export function useInstallations(initialFilter = 'all') {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const debouncedSearch = useDebounce(search, 400);

  const loadInstallations = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;

    try {
      setError(null);
      const response = await installationsApi.getAll({
        limit: LIMIT,
        offset: currentOffset,
        status: filter !== 'all' ? filter : undefined,
        search: debouncedSearch || undefined,
      });

      if (reset) {
        setInstallations(response.data);
      } else {
        setInstallations(prev => [...prev, ...response.data]);
      }

      setTotal(response.total);
      setHasMore(response.data.length === LIMIT);
      setOffset(currentOffset + LIMIT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, debouncedSearch, filter]);

  // Load on filter/search change
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    loadInstallations(true);
  }, [debouncedSearch, filter]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadInstallations(false);
    }
  }, [loadingMore, hasMore, loading, loadInstallations]);

  const { refreshing, onRefresh } = useRefresh(() => {
    setOffset(0);
    return loadInstallations(true);
  });

  return {
    installations,
    loading,
    loadingMore,
    error,
    total,
    hasMore,
    search,
    setSearch,
    filter,
    setFilter,
    loadMore,
    refreshing,
    onRefresh,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// useMounted - Track if component is mounted
// ══════════════════════════════════════════════════════════════════════════

export function useMounted() {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return mounted;
}

// ══════════════════════════════════════════════════════════════════════════
// useInterval - setInterval hook
// ══════════════════════════════════════════════════════════════════════════

export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default {
  useDebounce,
  useKeyboard,
  useDimensions,
  useAppState,
  useRefresh,
  useDashboardData,
  useInstallations,
  useMounted,
  useInterval,
};

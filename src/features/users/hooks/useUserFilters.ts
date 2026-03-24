/**
 * Filter-, Search- und View-State für die Users-Seite
 * Search + Role-Filter wirken auf ALLE Views
 */

import { useState, useMemo, useCallback } from 'react';
import type { UserData, ViewMode, UserRole, SortField, SortDir } from '../types';

export function useUserFilters(users: UserData[]) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('alle');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Reset role filter when switching views
  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setRoleFilter(null);
  }, []);

  // Role chip click → filter within current view (no tab switch)
  const handleRoleFilter = useCallback((role: UserRole | null) => {
    setRoleFilter(role);
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  // Role counts (always from full user list)
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) {
      counts[u.role] = (counts[u.role] || 0) + 1;
    }
    return counts;
  }, [users]);

  // Stats (always from full user list)
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.active && !u.gesperrt).length,
    gesperrt: users.filter((u) => u.gesperrt).length,
    installationen: users.reduce((s, u) => s + (u._count?.installations || 0), 0),
  }), [users]);

  // Search-only filter (for specialized views – no role/active filter)
  const searchFiltered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.kunde?.firmenName || '').toLowerCase().includes(q) ||
      (u.kunde?.name || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  // Full filter: search + role + active (for table view)
  const baseFiltered = useMemo(() => {
    let result = users;

    // Role filter
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);

    // Active filter
    if (activeFilter !== null) result = result.filter((u) => u.active === activeFilter);

    // Search (name, email, firma)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        (u.name || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.kunde?.firmenName || '').toLowerCase().includes(q) ||
        (u.kunde?.name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, search, roleFilter, activeFilter]);

  // Sorted (for table view)
  const filtered = useMemo(() => {
    return [...baseFiltered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortField) {
        case 'name': av = (a.name || a.email).toLowerCase(); bv = (b.name || b.email).toLowerCase(); break;
        case 'email': av = a.email.toLowerCase(); bv = b.email.toLowerCase(); break;
        case 'role': av = a.role; bv = b.role; break;
        case 'lastLoginAt': av = a.lastLoginAt || ''; bv = b.lastLoginAt || ''; break;
        case 'createdAt': av = a.createdAt; bv = b.createdAt; break;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [baseFiltered, sortField, sortDir]);

  return {
    search, setSearch,
    roleFilter, setRoleFilter: handleRoleFilter,
    activeFilter, setActiveFilter,
    viewMode, setViewMode: handleViewChange,
    sortField, sortDir, toggleSort,
    roleCounts, stats,
    filtered,         // Sorted + all filters (for table view)
    viewFiltered: baseFiltered, // All filters without sort (for specialized views)
  };
}

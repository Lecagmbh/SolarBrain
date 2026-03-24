/**
 * NETZANMELDUNGEN ENTERPRISE - ZUSTAND STORE
 * Version 2.0 - Complete State Management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  InstallationListItem,
  InstallationStatus,
  Priority,
  ViewMode,
  GroupBy,
  SortBy,
  SortOrder,
  Toast,
  SavedView,
  KPIData,
  GridOperator,
  TeamMember,
  Task,
} from "../types";
import { computePriority, isOverdue, calculateEstimatedValue } from "../utils";

// ═══════════════════════════════════════════════════════════════════════════
// STORE NAME & MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

// 🔥 NEU: Letzten User tracken für User-Wechsel-Erkennung
const LAST_USER_KEY = "netzanmeldungen-last-user";

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("baunity_token") || localStorage.getItem("gridnetz_access_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId ? String(payload.userId) : null;
    }
  } catch (e) {}
  return null;
}

function getStoreName(): string {
  // Versuche User-ID aus localStorage Token zu extrahieren
  try {
    const token = localStorage.getItem("baunity_token") || localStorage.getItem("gridnetz_access_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.userId) {
        return `netzanmeldungen-store-v2-${payload.userId}`;
      }
    }
  } catch (e) {
    // Fallback bei Fehler
  }
  return "netzanmeldungen-store-v2-guest";
}

// 🔥 AUTO-MIGRATION: Lösche alte Store-Keys beim App-Start
function cleanupOldStores(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key === "netzanmeldungen-store" ||
        key === "netzanmeldungen-store-guest" ||
        (key.startsWith("netzanmeldungen-store-") && !key.includes("-v2-"))
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      // Old store removed during migration
    });
  } catch (e) {
    // Ignore errors
  }
}

// Führe Migration sofort aus
cleanupOldStores();

// ═══════════════════════════════════════════════════════════════════════════
// STORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NetzanmeldungenState {
  // Data
  items: InstallationListItem[];
  totalCount: number;
  gridOperators: GridOperator[];
  teamMembers: TeamMember[];
  tasks: Task[];
  
  // Loading States
  loading: boolean;
  error: string | null;
  
  // View Settings
  viewMode: ViewMode;
  groupBy: GroupBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
  focusMode: boolean;
  
  // Filters
  search: string;
  statusFilter: InstallationStatus[];
  gridOperatorFilter: string[];
  priorityFilter: Priority[];
  assignedToFilter: number[];
  createdByFilter: number[]; // 🔥 NEU: Filter nach Ersteller
  showOnlyWarnings: boolean;
  showOnlyPinned: boolean;
  showOnlyCritical: boolean;
  showOnlyOverdue: boolean;
  showOnlyUnassigned: boolean;
  showArchived: boolean; // Archiv-Ansicht (storniert/abgeschlossen)
  
  // Selection
  selectedId: number | string | null;
  selectedIds: Set<number>;
  pinnedIds: Set<number>;
  collapsedGroups: Set<string>;
  
  // Saved Views
  savedViews: SavedView[];
  activeViewId: string | null;
  
  // KPIs
  kpis: KPIData | null;
  
  // Toasts
  toasts: Toast[];
  
  // Actions - Data
  setItems: (items: InstallationListItem[], total?: number) => void;
  setGridOperators: (operators: GridOperator[]) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - View
  setViewMode: (mode: ViewMode) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setFocusMode: (focus: boolean) => void;
  
  // Actions - Filters
  setSearch: (search: string) => void;
  toggleStatusFilter: (status: InstallationStatus) => void;
  setStatusFilter: (statuses: InstallationStatus[]) => void;
  toggleGridOperatorFilter: (name: string) => void;
  setGridOperatorFilter: (names: string[]) => void;
  togglePriorityFilter: (priority: Priority) => void;
  setAssignedToFilter: (ids: number[]) => void;
  setCreatedByFilter: (ids: number[]) => void; // 🔥 NEU
  setShowOnlyWarnings: (show: boolean) => void;
  setShowOnlyPinned: (show: boolean) => void;
  setShowOnlyCritical: (show: boolean) => void;
  setShowOnlyOverdue: (show: boolean) => void;
  setShowOnlyUnassigned: (show: boolean) => void;
  setShowArchived: (show: boolean) => void;
  clearAllFilters: () => void;
  
  // Actions - Selection
  setSelectedId: (id: number | string | null) => void;
  toggleSelect: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  togglePin: (id: number) => void;
  toggleGroupCollapse: (key: string) => void;
  
  // Actions - Views
  saveCurrentView: (name: string, icon?: string) => void;
  loadView: (id: string) => void;
  deleteView: (id: string) => void;
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  
  // Actions - KPIs
  computeKPIs: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT VIEWS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_VIEWS: SavedView[] = [
  {
    id: "critical",
    name: "Kritische Fälle",
    icon: "🔴",
    isSystem: true,
    createdAt: new Date().toISOString(),
    state: {
      viewMode: "grid",
      groupBy: "status",
      sortBy: "priority",
      sortOrder: "desc",
      statusFilter: ["rueckfrage", "beim_nb"],
      gridOperatorFilter: [],
      priorityFilter: ["critical", "high"],
    },
  },
  {
    id: "my-tasks",
    name: "Meine Aufgaben",
    icon: "👤",
    isSystem: true,
    createdAt: new Date().toISOString(),
    state: {
      viewMode: "table",
      groupBy: "status",
      sortBy: "deadline",
      sortOrder: "asc",
      statusFilter: [],
      gridOperatorFilter: [],
      priorityFilter: [],
    },
  },
  {
    id: "by-nb",
    name: "Nach Netzbetreiber",
    icon: "🏢",
    isSystem: true,
    createdAt: new Date().toISOString(),
    state: {
      viewMode: "kanban",
      groupBy: "gridOperator",
      sortBy: "createdAt",
      sortOrder: "desc",
      statusFilter: [],
      gridOperatorFilter: [],
      priorityFilter: [],
    },
  },
  {
    id: "pipeline",
    name: "Pipeline",
    icon: "📊",
    isSystem: true,
    createdAt: new Date().toISOString(),
    state: {
      viewMode: "kanban",
      groupBy: "status",
      sortBy: "value",
      sortOrder: "desc",
      statusFilter: ["eingang", "beim_nb", "rueckfrage"],
      gridOperatorFilter: [],
      priorityFilter: [],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// STORE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export const useNetzanmeldungenStore = create<NetzanmeldungenState>()(
  persist(
    (set, get) => ({
      // Initial State
      items: [],
      totalCount: 0,
      gridOperators: [],
      teamMembers: [],
      tasks: [],
      loading: false,
      error: null,

      viewMode: "grid",
      groupBy: "workPriority", // 🔥 NEU: Standard ist jetzt Work-Priority-Gruppierung
      sortBy: "priority",
      sortOrder: "desc",
      focusMode: false,
      
      search: "",
      statusFilter: [],
      gridOperatorFilter: [],
      priorityFilter: [],
      assignedToFilter: [],
      createdByFilter: [], // 🔥 NEU
      showOnlyWarnings: false,
      showOnlyPinned: false,
      showOnlyCritical: false,
      showOnlyOverdue: false,
      showOnlyUnassigned: false,
      showArchived: false,
      
      selectedId: null,
      selectedIds: new Set(),
      pinnedIds: new Set(),
      collapsedGroups: new Set(),
      
      savedViews: DEFAULT_VIEWS,
      activeViewId: null,
      
      kpis: null,
      toasts: [],
      
      // Data Actions
      setItems: (items, total) => {
        set({ items, totalCount: total ?? items.length });
        get().computeKPIs();
      },
      
      setGridOperators: (operators) => set({ gridOperators: operators }),
      setTeamMembers: (members) => set({ teamMembers: members }),
      setTasks: (tasks) => set({ tasks }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // View Actions
      setViewMode: (viewMode) => set({ viewMode }),
      setGroupBy: (groupBy) => set({ groupBy }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === "asc" ? "desc" : "asc" })),
      setFocusMode: (focusMode) => set({ focusMode }),
      
      // Filter Actions
      setSearch: (search) => set({ search }),
      
      toggleStatusFilter: (status) => set((s) => {
        const current = [...s.statusFilter];
        const idx = current.indexOf(status);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(status);
        return { statusFilter: current };
      }),
      
      setStatusFilter: (statuses) => set({ statusFilter: statuses }),
      
      toggleGridOperatorFilter: (name) => set((s) => {
        const current = [...s.gridOperatorFilter];
        const idx = current.indexOf(name);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(name);
        return { gridOperatorFilter: current };
      }),
      
      setGridOperatorFilter: (names) => set({ gridOperatorFilter: names }),
      
      togglePriorityFilter: (priority) => set((s) => {
        const current = [...s.priorityFilter];
        const idx = current.indexOf(priority);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(priority);
        return { priorityFilter: current };
      }),
      
      setAssignedToFilter: (ids) => set({ assignedToFilter: ids }),
      setCreatedByFilter: (ids) => set({ createdByFilter: ids }), // 🔥 NEU
      setShowOnlyWarnings: (show) => set({ showOnlyWarnings: show }),
      setShowOnlyPinned: (show) => set({ showOnlyPinned: show }),
      setShowOnlyCritical: (show) => set({ showOnlyCritical: show }),
      setShowOnlyOverdue: (show) => set({ showOnlyOverdue: show }),
      setShowOnlyUnassigned: (show) => set({ showOnlyUnassigned: show }),
      setShowArchived: (show) => set({ showArchived: show, statusFilter: [] }), // Reset status filter when switching
      
      clearAllFilters: () => set({
        search: "",
        statusFilter: [],
        gridOperatorFilter: [],
        priorityFilter: [],
        assignedToFilter: [],
        createdByFilter: [], // 🔥 NEU
        showOnlyWarnings: false,
        showOnlyPinned: false,
        showOnlyCritical: false,
        showOnlyOverdue: false,
        showOnlyUnassigned: false,
        showArchived: false,
        activeViewId: null,
      }),
      
      // Selection Actions
      setSelectedId: (id) => set({ selectedId: id }),
      
      toggleSelect: (id) => set((s) => {
        const newSet = new Set(s.selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { selectedIds: newSet };
      }),
      
      selectAll: (ids) => set({ selectedIds: new Set(ids) }),
      clearSelection: () => set({ selectedIds: new Set() }),
      
      togglePin: (id) => set((s) => {
        const newSet = new Set(s.pinnedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { pinnedIds: newSet };
      }),
      
      toggleGroupCollapse: (key) => set((s) => {
        const newSet = new Set(s.collapsedGroups);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        return { collapsedGroups: newSet };
      }),
      
      // View Actions
      saveCurrentView: (name, icon) => set((s) => {
        const id = `custom-${Date.now()}`;
        const newView: SavedView = {
          id,
          name,
          icon,
          createdAt: new Date().toISOString(),
          state: {
            viewMode: s.viewMode,
            groupBy: s.groupBy,
            sortBy: s.sortBy,
            sortOrder: s.sortOrder,
            statusFilter: s.statusFilter,
            gridOperatorFilter: s.gridOperatorFilter,
            priorityFilter: s.priorityFilter,
          },
        };
        return { 
          savedViews: [...s.savedViews, newView],
          activeViewId: id,
        };
      }),
      
      loadView: (id) => {
        const view = get().savedViews.find(v => v.id === id);
        if (!view) return;
        
        set({
          viewMode: view.state.viewMode,
          groupBy: view.state.groupBy,
          sortBy: view.state.sortBy,
          sortOrder: view.state.sortOrder,
          statusFilter: view.state.statusFilter,
          gridOperatorFilter: view.state.gridOperatorFilter,
          priorityFilter: view.state.priorityFilter,
          activeViewId: id,
        });
      },
      
      deleteView: (id) => set((s) => ({
        savedViews: s.savedViews.filter(v => v.id !== id || v.isSystem),
        activeViewId: s.activeViewId === id ? null : s.activeViewId,
      })),
      
      // Toast Actions
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2);
        const duration = toast.duration ?? 4000;
        
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        
        if (duration > 0) {
          setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
          }, duration);
        }
      },
      
      removeToast: (id) => set((s) => ({ 
        toasts: s.toasts.filter(t => t.id !== id) 
      })),
      
      // KPI Computation
      computeKPIs: () => {
        const { items } = get();
        
        if (items.length === 0) {
          set({ kpis: null });
          return;
        }
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // By Status
        const byStatus: Record<InstallationStatus, number> = {
          eingang: 0,
          beim_nb: 0,
          rueckfrage: 0,
          genehmigt: 0,
          ibn: 0,
          fertig: 0,
          storniert: 0,
        };
        
        // By Priority
        const byPriority: Record<Priority, number> = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
        
        // By Grid Operator
        const byGridOperatorMap: Record<string, { count: number; totalDays: number; overdueCount: number }> = {};
        
        // By Team Member
        const byTeamMemberMap: Record<number, { name: string; active: number; completed: number; totalDays: number }> = {};
        
        let critical = 0;
        let overdue = 0;
        let needsAction = 0;
        let thisWeek = 0;
        let thisMonth = 0;
        let lastMonth = 0;
        let pipelineValue = 0;
        let completedValue = 0;
        let totalProcessingDays = 0;
        let completedCount = 0;
        
        const avgDaysPerStatus: Record<InstallationStatus, { total: number; count: number }> = {
          eingang: { total: 0, count: 0 },
          beim_nb: { total: 0, count: 0 },
          rueckfrage: { total: 0, count: 0 },
          genehmigt: { total: 0, count: 0 },
          ibn: { total: 0, count: 0 },
          fertig: { total: 0, count: 0 },
          storniert: { total: 0, count: 0 },
        };
        
        items.forEach((item) => {
          const status = (item.status || "eingang").toLowerCase().replace(/-/g, "_") as InstallationStatus;
          const priority = computePriority(item);
          const value = calculateEstimatedValue(item);
          const createdAt = new Date(item.createdAt);
          const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / 86400000);
          
          // Count by status
          byStatus[status] = (byStatus[status] || 0) + 1;
          
          // Count by priority
          byPriority[priority]++;
          
          // Critical & overdue
          if (priority === "critical") critical++;
          if (isOverdue(item)) overdue++;
          if (status === "rueckfrage") needsAction++;
          
          // Time-based counts
          if (createdAt >= weekAgo) thisWeek++;
          if (createdAt >= monthAgo) thisMonth++;
          if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) lastMonth++;
          
          // Value
          if (["eingang", "beim_nb", "rueckfrage", "genehmigt", "ibn"].includes(status)) {
            pipelineValue += value;
          }
          if (status === "fertig") {
            completedValue += value;
            completedCount++;
            totalProcessingDays += daysOld;
          }
          
          // By grid operator
          const nbName = item.gridOperator || "Kein Netzbetreiber";
          if (!byGridOperatorMap[nbName]) {
            byGridOperatorMap[nbName] = { count: 0, totalDays: 0, overdueCount: 0 };
          }
          byGridOperatorMap[nbName].count++;
          byGridOperatorMap[nbName].totalDays += daysOld;
          if (isOverdue(item)) byGridOperatorMap[nbName].overdueCount++;
          
          // By team member
          if (item.assignedToId) {
            if (!byTeamMemberMap[item.assignedToId]) {
              byTeamMemberMap[item.assignedToId] = { 
                name: item.assignedToName || "Unbekannt", 
                active: 0, 
                completed: 0, 
                totalDays: 0 
              };
            }
            if (status === "fertig") {
              byTeamMemberMap[item.assignedToId].completed++;
            } else if (status !== "storniert") {
              byTeamMemberMap[item.assignedToId].active++;
            }
            byTeamMemberMap[item.assignedToId].totalDays += daysOld;
          }
          
          // Days per status
          if (item.daysInCurrentStatus !== undefined) {
            avgDaysPerStatus[status].total += item.daysInCurrentStatus;
            avgDaysPerStatus[status].count++;
          }
        });
        
        // Compute averages
        const avgProcessingDays = completedCount > 0 
          ? Math.round(totalProcessingDays / completedCount) 
          : 0;
        
        const avgDaysPerStatusResult: Record<InstallationStatus, number> = {} as any;
        for (const [status, data] of Object.entries(avgDaysPerStatus)) {
          avgDaysPerStatusResult[status as InstallationStatus] = data.count > 0 
            ? Math.round(data.total / data.count) 
            : 0;
        }
        
        // Convert maps to arrays
        const byGridOperator = Object.entries(byGridOperatorMap)
          .map(([name, data]) => ({
            name,
            count: data.count,
            avgDays: Math.round(data.totalDays / data.count),
            overdueCount: data.overdueCount,
          }))
          .sort((a, b) => b.count - a.count);
        
        const byTeamMember = Object.entries(byTeamMemberMap)
          .map(([id, data]) => ({
            id: parseInt(id),
            name: data.name,
            active: data.active,
            completed: data.completed,
            avgDays: Math.round(data.totalDays / (data.active + data.completed)),
          }))
          .sort((a, b) => b.active - a.active);
        
        // Trend calculation
        const trend = lastMonth > 0 
          ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) 
          : 0;
        
        set({
          kpis: {
            total: items.length,
            byStatus,
            byCaseType: {} as any,
            byPriority,
            critical,
            overdue,
            needsAction,
            thisWeek,
            thisMonth,
            lastMonth,
            trend,
            avgProcessingDays,
            avgDaysPerStatus: avgDaysPerStatusResult,
            pipelineValue,
            completedValue,
            byGridOperator,
            byTeamMember,
          },
        });
      },
    }),
    {
      name: getStoreName(),
      // 🔥 NUR wirklich wichtige Dinge persistieren
      // viewMode, groupBy, sortBy etc. werden NICHT persistiert
      // um das Problem zu vermeiden, dass Einstellungen zwischen Usern geteilt werden
      partialize: (state) => ({
        // Nur gepinnte Items persistieren - das ist user-spezifisch und wichtig
        pinnedIds: Array.from(state.pinnedIds),
        // Gespeicherte Views (nur custom, nicht system)
        savedViews: state.savedViews.filter(v => !v.isSystem),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Sets
          if (Array.isArray(state.pinnedIds)) {
            state.pinnedIds = new Set(state.pinnedIds);
          }
          if (Array.isArray(state.collapsedGroups)) {
            state.collapsedGroups = new Set(state.collapsedGroups);
          }
          // Merge with default views
          if (state.savedViews) {
            state.savedViews = [
              ...DEFAULT_VIEWS,
              ...state.savedViews.filter(v => !DEFAULT_VIEWS.some(d => d.id === v.id)),
            ];
          }
        }
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useFilteredItems() {
  const store = useNetzanmeldungenStore();
  // This would typically use the filter/sort utilities
  // For now, return raw items
  return store.items;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 NEU: STORE CONSISTENCY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Löscht den Guest-Store nach Login
 * Wird aufgerufen wenn ein User eingeloggt ist aber noch der Guest-Store existiert
 */
export function clearGuestStore(): void {
  try {
    const guestKey = "netzanmeldungen-store-v2-guest";
    if (localStorage.getItem(guestKey)) {
      localStorage.removeItem(guestKey);
      // Guest store cleared after login
    }
  } catch (e) {
    console.warn("[Store] Failed to clear guest store:", e);
  }
}

/**
 * Prüft ob der aktuelle Store-Name mit dem eingeloggten User übereinstimmt
 * Gibt false zurück wenn ein Mismatch vorliegt (z.B. Store von anderem User)
 */
export function checkStoreConsistency(): boolean {
  try {
    const currentStoreName = getStoreName();
    const token = localStorage.getItem("baunity_token") || localStorage.getItem("gridnetz_access_token");
    
    // Wenn kein Token -> Konsistenz ok (Guest-Modus)
    if (!token) return true;
    
    // Wenn Token existiert aber Store-Name "guest" enthält -> Inkonsistent
    if (currentStoreName.includes("-guest")) {
      console.warn("[Store] Store inconsistency: User logged in but store is guest");
      return false;
    }
    
    // Prüfe ob der Store-Key im localStorage existiert
    const storedData = localStorage.getItem(currentStoreName);
    if (!storedData) {
      // Kein persistierter Store -> ok, wird neu erstellt
      return true;
    }
    
    return true;
  } catch (e) {
    console.warn("[Store] Consistency check failed:", e);
    return true; // Bei Fehler annehmen dass alles ok ist
  }
}

/**
 * 🔥 NEU: Prüft ob ein User-Wechsel stattgefunden hat und setzt ALLES zurück
 * Sollte beim Mount der NetzanmeldungenPage aufgerufen werden
 */
export function checkUserChangeAndReset(): boolean {
  try {
    const currentUserId = getCurrentUserId();
    const lastUserId = localStorage.getItem(LAST_USER_KEY);
    
    // User hat gewechselt (oder erster Login nach Guest)
    if (currentUserId && currentUserId !== lastUserId) {
      // User changed - performing full store reset
      
      // 🔥 WICHTIG: Alle netzanmeldungen-store Einträge im localStorage löschen
      // Das verhindert, dass Einstellungen zwischen Usern geteilt werden
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("netzanmeldungen-store")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        // Persisted store removed during user change
      });
      
      // Speichere neuen User
      localStorage.setItem(LAST_USER_KEY, currentUserId);
      
      // Setze alle Filter zurück
      useNetzanmeldungenStore.getState().clearAllFilters();
      
      // 🔥 Setze ALLES zurück, inkl. Ansicht-Einstellungen
      useNetzanmeldungenStore.setState({ 
        items: [], 
        totalCount: 0,
        selectedId: null,
        selectedIds: new Set(),
        // Ansicht-Einstellungen auf Default zurücksetzen
        viewMode: "grid",
        groupBy: "status",
        sortBy: "priority",
        sortOrder: "desc",
        focusMode: false,
        // Filter zurücksetzen
        search: "",
        statusFilter: [],
        gridOperatorFilter: [],
        priorityFilter: [],
        assignedToFilter: [],
        createdByFilter: [],
        showOnlyWarnings: false,
        showOnlyPinned: false,
        showOnlyCritical: false,
        showOnlyOverdue: false,
        showOnlyUnassigned: false,
        showArchived: false,
      });
      
      return true; // User hat gewechselt
    }
    
    // Speichere User-ID falls noch nicht gesetzt
    if (currentUserId && !lastUserId) {
      localStorage.setItem(LAST_USER_KEY, currentUserId);
    }
    
    return false; // Kein Wechsel
  } catch (e) {
    console.warn("[Store] User change check failed:", e);
    return false;
  }
}

/**
 * 🔥 NEU: Wird beim Logout aufgerufen um alles zurückzusetzen
 */
export function resetStoreOnLogout(): void {
  try {
    // Entferne last-user Marker
    localStorage.removeItem(LAST_USER_KEY);
    
    // 🔥 Alle netzanmeldungen-store Einträge löschen
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("netzanmeldungen-store")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Setze alle Filter zurück
    useNetzanmeldungenStore.getState().clearAllFilters();
    
    // Lösche Items und setze Ansicht zurück
    useNetzanmeldungenStore.setState({ 
      items: [], 
      totalCount: 0,
      selectedId: null,
      selectedIds: new Set(),
      search: "",
      viewMode: "grid",
      groupBy: "status",
      sortBy: "priority",
      sortOrder: "desc",
    });
    
    // Store reset on logout
  } catch (e) {
    console.warn("[Store] Logout reset failed:", e);
  }
}

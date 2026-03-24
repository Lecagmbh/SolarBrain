/**
 * Baunity USER BEHAVIOR TRACKING SDK
 * Trackt jede Aktion des Users für intelligente Vorschläge
 * 
 * USAGE:
 * import { tracker } from './userTracker';
 * tracker.init();
 * 
 * // Automatisch getrackt:
 * - Page Views
 * - Clicks
 * - Form Inputs
 * - Scrolling
 * - Time on Page
 * - Mouse Movement Patterns
 * - Keyboard Shortcuts
 * 
 * // Manuell tracken:
 * tracker.track('CUSTOM_EVENT', { data: 'here' });
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TrackingEvent {
  actionType: string;
  entityType?: string;
  entityId?: number;
  pagePath: string;
  componentName?: string;
  actionDetails?: Record<string, unknown>;
  durationMs?: number;
  timestamp: number;
}

interface UserSession {
  id: string;
  startTime: number;
  pageViews: number;
  events: number;
  lastActivity: number;
}

interface PageViewData {
  path: string;
  startTime: number;
  scrollDepth: number;
  interactions: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class UserBehaviorTracker {
  private session: UserSession | null = null;
  private currentPage: PageViewData | null = null;
  private eventQueue: TrackingEvent[] = [];
  private flushInterval: number | null = null;
  private isInitialized = false;
  private debugMode = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  init(options: { debug?: boolean } = {}) {
    if (this.isInitialized) return;
    
    this.debugMode = options.debug || false;
    this.initSession();
    this.setupEventListeners();
    this.startFlushInterval();
    this.isInitialized = true;
    
    this.log('🚀 User Behavior Tracker initialized');
  }

  private initSession() {
    let sessionId = sessionStorage.getItem('baunity_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('baunity_session_id', sessionId);
    }

    this.session = {
      id: sessionId,
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      lastActivity: Date.now()
    };
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  private setupEventListeners() {
    // Page View
    this.trackPageView();
    window.addEventListener('popstate', () => this.trackPageView());

    // Clicks
    document.addEventListener('click', (e) => this.handleClick(e), true);

    // Form Interactions
    document.addEventListener('change', (e) => this.handleFormChange(e), true);
    document.addEventListener('submit', (e) => this.handleFormSubmit(e), true);

    // Keyboard
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Scroll
    let scrollTimeout: number;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => this.handleScroll(), 150);
    }, { passive: true });

    // Focus/Blur (Tab visibility)
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Before Unload
    window.addEventListener('beforeunload', () => this.handleBeforeUnload());

    // Custom Events from App
    window.addEventListener('baunity:track', ((e: CustomEvent) => {
      this.track(e.detail.action, e.detail.data);
    }) as EventListener);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  private trackPageView() {
    // End previous page view
    if (this.currentPage) {
      this.track('PAGE_VIEW', {
        path: this.currentPage.path,
        duration: Date.now() - this.currentPage.startTime,
        scrollDepth: this.currentPage.scrollDepth,
        interactions: this.currentPage.interactions
      });
    }

    // Start new page view
    this.currentPage = {
      path: window.location.pathname,
      startTime: Date.now(),
      scrollDepth: 0,
      interactions: 0
    };

    if (this.session) {
      this.session.pageViews++;
    }
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Get component info
    const componentInfo = this.getComponentInfo(target);
    
    // Track button clicks
    if (target.matches('button, [role="button"], a, .clickable')) {
      this.track('CLICK', {
        element: target.tagName.toLowerCase(),
        text: (target.textContent || '').slice(0, 50).trim(),
        ...componentInfo
      });
    }

    // Track dropdown selections
    if (target.matches('select, [role="listbox"] *')) {
      this.track('CLICK', {
        element: 'select',
        ...componentInfo
      });
    }

    // Track table row clicks
    if (target.closest('tr[data-id], tr[data-entity]')) {
      const row = target.closest('tr') as HTMLElement;
      this.track('CLICK', {
        element: 'table-row',
        entityId: row.dataset.id || row.dataset.entity,
        ...componentInfo
      });
    }

    // Update interactions
    if (this.currentPage) {
      this.currentPage.interactions++;
    }
  }

  private handleFormChange(e: Event) {
    const target = e.target as HTMLElement;
    if (!target) return;

    const componentInfo = this.getComponentInfo(target);

    // Track filter changes
    if (target.closest('[data-filter], .filter-bar, .filter')) {
      const input = target as HTMLInputElement | HTMLSelectElement;
      this.track('FILTER', {
        field: input.name || input.id || componentInfo.componentName,
        value: this.sanitizeValue(input.value),
        ...componentInfo
      });
    }

    // Track sort changes
    if (target.closest('[data-sort], .sort-control')) {
      const input = target as HTMLSelectElement;
      this.track('SORT', {
        field: input.value,
        ...componentInfo
      });
    }

    // Track search inputs (debounced in real usage)
    if (target.matches('[type="search"], .search-input, [data-search]')) {
      const input = target as HTMLInputElement;
      if (input.value.length > 2) {
        this.track('SEARCH', {
          query: input.value.slice(0, 100),
          ...componentInfo
        });
      }
    }

    // Track status changes
    if (target.matches('[name="status"], .status-select, [data-status]')) {
      const input = target as HTMLSelectElement;
      this.track('STATUS_CHANGE', {
        newStatus: input.value,
        ...componentInfo
      });
    }
  }

  private handleFormSubmit(e: Event) {
    const form = e.target as HTMLFormElement;
    if (!form) return;

    const componentInfo = this.getComponentInfo(form);

    this.track('FORM_SUBMIT', {
      formId: form.id || form.name,
      ...componentInfo
    });
  }

  private handleKeydown(e: KeyboardEvent) {
    // Track keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      const shortcuts: Record<string, string> = {
        's': 'SAVE',
        'f': 'SEARCH',
        'n': 'NEW',
        'p': 'PRINT',
        'e': 'EXPORT'
      };

      if (shortcuts[e.key.toLowerCase()]) {
        this.track('KEYBOARD_SHORTCUT', {
          shortcut: `Ctrl+${e.key.toUpperCase()}`,
          action: shortcuts[e.key.toLowerCase()]
        });
      }
    }

    // Track Enter in search
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.matches('[type="search"], .search-input')) {
        this.track('SEARCH', {
          query: (target as HTMLInputElement).value.slice(0, 100),
          method: 'ENTER'
        });
      }
    }
  }

  private handleScroll() {
    if (!this.currentPage) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

    if (scrollPercent > this.currentPage.scrollDepth) {
      this.currentPage.scrollDepth = scrollPercent;
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.flush(); // Save data when user leaves tab
    } else {
      // User came back
      if (this.session) {
        this.session.lastActivity = Date.now();
      }
    }
  }

  private handleBeforeUnload() {
    this.trackPageView(); // End current page view
    this.flush(true); // Sync flush
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACKING API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Track a custom event
   */
  track(actionType: string, data: Record<string, unknown> = {}) {
    const event: TrackingEvent = {
      actionType,
      pagePath: window.location.pathname,
      timestamp: Date.now(),
      ...this.extractEntityInfo(data),
      actionDetails: data
    };

    this.eventQueue.push(event);
    
    if (this.session) {
      this.session.events++;
      this.session.lastActivity = Date.now();
    }

    this.log(`📊 Tracked: ${actionType}`, data);

    // Flush if queue is getting large
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  /**
   * Track entity view (Installation, Kunde, etc.)
   */
  trackEntityView(entityType: string, entityId: number, entityName?: string) {
    this.track('ENTITY_VIEW', {
      entityType,
      entityId,
      entityName
    });
  }

  /**
   * Track entity create
   */
  trackEntityCreate(entityType: string, entityId: number, data?: Record<string, unknown>) {
    this.track('CREATE', {
      entityType,
      entityId,
      ...data
    });
  }

  /**
   * Track entity update
   */
  trackEntityUpdate(entityType: string, entityId: number, changes: Record<string, unknown>) {
    this.track('UPDATE', {
      entityType,
      entityId,
      changes
    });
  }

  /**
   * Track entity delete
   */
  trackEntityDelete(entityType: string, entityId: number) {
    this.track('DELETE', {
      entityType,
      entityId
    });
  }

  /**
   * Track error
   */
  trackError(error: string, context?: Record<string, unknown>) {
    this.track('ERROR', {
      error,
      ...context
    });
  }

  /**
   * Track feature usage
   */
  trackFeature(feature: string, action: string, data?: Record<string, unknown>) {
    this.track('FEATURE_USE', {
      feature,
      action,
      ...data
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  private extractEntityInfo(data: Record<string, unknown>): Partial<TrackingEvent> {
    const result: Partial<TrackingEvent> = {};

    // Extract entity type from various sources
    if (data.entityType) {
      result.entityType = String(data.entityType);
    } else if (data.installationId) {
      result.entityType = 'Installation';
      result.entityId = Number(data.installationId);
    } else if (data.kundeId) {
      result.entityType = 'Kunde';
      result.entityId = Number(data.kundeId);
    } else if (data.documentId) {
      result.entityType = 'Document';
      result.entityId = Number(data.documentId);
    }

    if (data.entityId && !result.entityId) {
      result.entityId = Number(data.entityId);
    }

    return result;
  }

  private getComponentInfo(element: HTMLElement): { componentName?: string; entityType?: string; entityId?: number } {
    const result: { componentName?: string; entityType?: string; entityId?: number } = {};

    // Walk up the DOM to find component markers
    let current: HTMLElement | null = element;
    while (current) {
      // Check for data attributes
      if (current.dataset.component) {
        result.componentName = current.dataset.component;
      }
      if (current.dataset.entity) {
        result.entityType = current.dataset.entity;
      }
      if (current.dataset.entityId || current.dataset.id) {
        result.entityId = Number(current.dataset.entityId || current.dataset.id);
      }

      // Check for common class patterns
      if (!result.componentName) {
        const classes = current.className;
        if (typeof classes === 'string') {
          const match = classes.match(/(?:^|\s)([\w-]+(?:Page|Modal|Card|Form|Table|List|Panel|Widget))(?:\s|$)/i);
          if (match) {
            result.componentName = match[1];
          }
        }
      }

      current = current.parentElement;
    }

    return result;
  }

  private sanitizeValue(value: string): string {
    // Don't track sensitive data
    if (value.includes('@') || value.length > 20) {
      return '[REDACTED]';
    }
    return value;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA SENDING
  // ═══════════════════════════════════════════════════════════════════════════

  private startFlushInterval() {
    // Flush every 10 seconds
    this.flushInterval = window.setInterval(() => this.flush(), 10000);
  }

  private async flush(sync = false) {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = {
      sessionId: this.session?.id,
      events
    };

    const token = localStorage.getItem('baunity_token');
    if (!token) return;

    try {
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for page unload
        navigator.sendBeacon('/api/intelligence/track/batch', JSON.stringify(payload));
      } else {
        await fetch('/api/intelligence/track/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      this.log(`✅ Flushed ${events.length} events`);
    } catch (error) {
      // Re-add events to queue on error
      this.eventQueue = [...events, ...this.eventQueue];
      this.log('❌ Flush failed, events re-queued');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private log(...args: unknown[]) {
    if (this.debugMode) {
      console.log('[Tracker]', ...args);
    }
  }

  /**
   * Get session stats
   */
  getSessionStats() {
    return {
      ...this.session,
      currentPage: this.currentPage,
      queuedEvents: this.eventQueue.length
    };
  }

  /**
   * Destroy tracker
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
    this.isInitialized = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

export const tracker = new UserBehaviorTracker();

// Auto-init in browser
if (typeof window !== 'undefined') {
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tracker.init());
  } else {
    tracker.init();
  }
}

// Helper for manual tracking via window
declare global {
  interface Window {
    gridnetzTracker: UserBehaviorTracker;
  }
}

if (typeof window !== 'undefined') {
  window.gridnetzTracker = tracker;
}

export default tracker;

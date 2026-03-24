// ============================================
// FINANZEN MODULE - useToast Hook
// ============================================

import { useState, useCallback } from "react";
import type { Toast } from "../types";
import { generateId } from "../utils";

// ============================================
// HOOK
// ============================================

interface UseToastReturn {
  toasts: Toast[];
  showToast: (type: Toast["type"], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

export function useToast(defaultDuration = 4000): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    type: Toast["type"], 
    message: string, 
    duration = defaultDuration
  ) => {
    const id = generateId();
    const toast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [defaultDuration, removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string) => showToast("success", message), [showToast]);
  const error = useCallback((message: string) => showToast("error", message), [showToast]);
  const info = useCallback((message: string) => showToast("info", message), [showToast]);
  const warning = useCallback((message: string) => showToast("warning", message), [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
    success,
    error,
    info,
    warning,
  };
}

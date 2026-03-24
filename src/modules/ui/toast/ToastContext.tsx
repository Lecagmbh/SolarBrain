import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastContextType = {
  toasts: ToastItem[];
  push: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function push(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).slice(2);
    const toast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => remove(id), 5000);
  }

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * NOTIFICATION CENTER v2.0
 * Real-time notifications panel
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import React, { useState, useCallback, useEffect } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Mail,
  FileText,
  Zap,
  Check,
  Trash2,
  Settings,
} from "lucide-react";
import { Button, Badge } from "../../components/ui/UIComponents";
import { NOTIFICATIONS_KEY } from "../../../../../config/storage";
import "./notifications.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  category: "system" | "installation" | "email" | "document";
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } catch (e) {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  return {
    isOpen,
    open,
    close,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION BELL
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationBellProps {
  onClick: () => void;
  count: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, count }) => {
  return (
    <button className="header-action header-notification" onClick={onClick}>
      <Bell size={20} />
      {count > 0 && <span className="header-notification__badge">{count > 99 ? "99+" : count}</span>}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read) 
    : notifications;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle2 size={18} />;
      case "warning": return <AlertTriangle size={18} />;
      case "error": return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getCategoryIcon = (category: Notification["category"]) => {
    switch (category) {
      case "installation": return <Zap size={14} />;
      case "email": return <Mail size={14} />;
      case "document": return <FileText size={14} />;
      default: return <Info size={14} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Gerade eben";
    if (mins < 60) return `vor ${mins}m`;
    if (hours < 24) return `vor ${hours}h`;
    return `vor ${days}d`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-panel">
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header__left">
            <h2 className="notif-title">Benachrichtigungen</h2>
            {unreadCount > 0 && <Badge variant="error" size="sm">{unreadCount}</Badge>}
          </div>
          <div className="notif-header__right">
            <button className="notif-action" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="notif-filter">
          <button 
            className={`notif-filter__btn ${filter === "all" ? "notif-filter__btn--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Alle
          </button>
          <button 
            className={`notif-filter__btn ${filter === "unread" ? "notif-filter__btn--active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Ungelesen ({unreadCount})
          </button>
        </div>

        {/* List */}
        <div className="notif-list">
          {filteredNotifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={48} />
              <p>Keine Benachrichtigungen</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notif-item notif-item--${notif.type} ${!notif.read ? "notif-item--unread" : ""}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`notif-item__icon notif-item__icon--${notif.type}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="notif-item__content">
                  <div className="notif-item__header">
                    <span className="notif-item__title">{safeString(notif.title)}</span>
                    <span className="notif-item__category">{getCategoryIcon(notif.category)}</span>
                  </div>
                  <p className="notif-item__message">{safeString(notif.message)}</p>
                  <span className="notif-item__time">{formatTime(notif.timestamp)}</span>
                </div>
                <button 
                  className="notif-item__remove" 
                  onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notif-footer">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} icon={<Check size={14} />}>
              Alle als gelesen markieren
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} icon={<Trash2 size={14} />}>
              Alle löschen
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;

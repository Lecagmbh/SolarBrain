/**
 * NotificationsPage
 * Vollständige Liste aller Portal-Notifications.
 * Erreichbar über Bell-Dropdown "Alle anzeigen" (/portal/notifications).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, RefreshCw, MessageSquare, FileText, Info, CheckCircle2 } from "lucide-react";
import { usePortal } from "../PortalContext";
import { getPortalNotifications, markNotificationsRead, type PortalNotification } from "../api";
import "./notifications.css";

function getTypeIcon(type: string) {
  switch (type) {
    case "STATUS_CHANGE":
      return <RefreshCw size={16} />;
    case "NEW_MESSAGE":
    case "RUECKFRAGE":
      return <MessageSquare size={16} />;
    case "DOCUMENT_REQUEST":
    case "DOCUMENT_UPLOADED":
      return <FileText size={16} />;
    default:
      return <Info size={16} />;
  }
}

function getTypeIconClass(type: string): string {
  switch (type) {
    case "STATUS_CHANGE":
      return "notifications-page__item-icon--status";
    case "NEW_MESSAGE":
    case "RUECKFRAGE":
      return "notifications-page__item-icon--message";
    case "DOCUMENT_REQUEST":
    case "DOCUMENT_UPLOADED":
      return "notifications-page__item-icon--document";
    default:
      return "notifications-page__item-icon--system";
  }
}

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `Vor ${diffMin} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function NotificationsPage() {
  const { refreshNotifications } = usePortal();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPortalNotifications();
      setNotifications(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead("all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
    } catch {
      // Ignore
    }
  };

  const handleItemClick = async (notification: PortalNotification) => {
    if (!notification.read) {
      try {
        await markNotificationsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        refreshNotifications();
      } catch {
        // Ignore
      }
    }

    switch (notification.type) {
      case "NEW_MESSAGE":
      case "RUECKFRAGE":
        navigate("/portal/messages");
        break;
      case "DOCUMENT_REQUEST":
      case "DOCUMENT_UPLOADED":
        navigate("/portal/documents");
        break;
      default:
        navigate("/portal");
        break;
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-page__loading">Benachrichtigungen werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <h1 className="notifications-page__title">
          <Bell size={22} className="notifications-page__title-icon" />
          Benachrichtigungen
        </h1>
        {hasUnread && (
          <button className="notifications-page__mark-all" onClick={handleMarkAllRead}>
            <CheckCircle2 size={14} />
            Alle als gelesen markieren
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <div className="notifications-page__empty-icon"><Bell size={40} /></div>
          <div className="notifications-page__empty-text">Keine Benachrichtigungen</div>
          <div className="notifications-page__empty-hint">
            Hier erscheinen Benachrichtigungen zu Ihrem Vorgang
          </div>
        </div>
      ) : (
        <div className="notifications-page__list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notifications-page__item ${!n.read ? "notifications-page__item--unread" : ""}`}
              onClick={() => handleItemClick(n)}
            >
              <div className={`notifications-page__item-icon ${getTypeIconClass(n.type)}`}>
                {getTypeIcon(n.type)}
              </div>
              <div className="notifications-page__item-content">
                <div className="notifications-page__item-title">{n.title}</div>
                {n.message && (
                  <div className="notifications-page__item-message">{n.message}</div>
                )}
                <div className="notifications-page__item-time">{formatTime(n.createdAt)}</div>
              </div>
              <div className="notifications-page__item-right">
                {!n.read && <div className="notifications-page__unread-dot" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

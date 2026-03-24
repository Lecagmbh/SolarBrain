/**
 * NotificationBell Component
 * Glocke mit Badge + Dropdown für Portal-Notifications.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight, RefreshCw, MessageSquare, FileText, Info, CheckCircle2 } from "lucide-react";
import { usePortal } from "../PortalContext";
import { getPortalNotifications, markNotificationsRead, type PortalNotification } from "../api";
import "./notification-bell.css";

function getTypeIcon(type: string) {
  switch (type) {
    case "STATUS_CHANGE":
      return <RefreshCw size={14} />;
    case "NEW_MESSAGE":
    case "RUECKFRAGE":
      return <MessageSquare size={14} />;
    case "DOCUMENT_REQUEST":
    case "DOCUMENT_UPLOADED":
      return <FileText size={14} />;
    default:
      return <Info size={14} />;
  }
}

function getTypeIconClass(type: string): string {
  switch (type) {
    case "STATUS_CHANGE":
      return "notification-bell__item-icon--status";
    case "NEW_MESSAGE":
    case "RUECKFRAGE":
      return "notification-bell__item-icon--message";
    case "DOCUMENT_REQUEST":
    case "DOCUMENT_UPLOADED":
      return "notification-bell__item-icon--document";
    default:
      return "notification-bell__item-icon--system";
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `Vor ${diffMin} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}`;
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function NotificationBell() {
  const { unreadNotificationCount, refreshNotifications } = usePortal();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await getPortalNotifications();
      setNotifications(data.slice(0, 20));
    } catch {
      // Ignore errors
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

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
    // Mark as read
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

    setIsOpen(false);

    // Navigate based on type
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

  const handleShowAll = () => {
    setIsOpen(false);
    navigate("/portal/notifications");
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell__trigger" onClick={handleToggle} title="Benachrichtigungen">
        <Bell size={18} />
        {unreadNotificationCount > 0 && (
          <span className="notification-bell__badge">
            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-bell__backdrop" onClick={handleClose} />
          <div className="notification-bell__dropdown">
            <div className="notification-bell__header">
              <span className="notification-bell__header-title">Benachrichtigungen</span>
              {hasUnread && (
                <button className="notification-bell__mark-all" onClick={handleMarkAllRead}>
                  <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Alle gelesen
                </button>
              )}
            </div>

            <div className="notification-bell__list">
              {loadingList ? (
                <div className="notification-bell__empty">Laden...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <div className="notification-bell__empty-icon"><Bell size={32} /></div>
                  Keine Benachrichtigungen
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notification-bell__item ${!n.read ? "notification-bell__item--unread" : ""}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className={`notification-bell__item-icon ${getTypeIconClass(n.type)}`}>
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="notification-bell__item-content">
                      <div className="notification-bell__item-title">{n.title}</div>
                      {n.message && (
                        <div className="notification-bell__item-message">{n.message}</div>
                      )}
                      <div className="notification-bell__item-time">{formatRelativeTime(n.createdAt)}</div>
                    </div>
                    {!n.read && <div className="notification-bell__unread-dot" />}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-bell__footer">
                <button className="notification-bell__show-all" onClick={handleShowAll}>
                  Alle anzeigen <ArrowRight size={12} style={{ marginLeft: 4, verticalAlign: -1 }} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Baunity KANBAN BOARD                                                           ║
 * ║  Drag & Drop Pipeline für Netzanmeldungen                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Send,
  Clock,
  HelpCircle,
  CheckCircle2,
  Award,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Calendar,
  Building,
  User,
  AlertTriangle,
  Zap,
  Mail,
  Eye,
  Edit,
  GripVertical,
} from "lucide-react";
import { Button, Badge, Input, Avatar, Skeleton } from "../../components/ui/UIComponents";
import "./kanban.css";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Installation {
  id: number;
  publicId: string;
  customerName: string;
  location: string;
  status: string;
  gridOperator: string | null;
  createdAt: string;
  updatedAt: string;
  daysInStatus: number;
  priority: "low" | "medium" | "high" | "urgent";
  hasDocuments: boolean;
  hasUnreadEmails: boolean;
}

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  items: Installation[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const COLUMNS_CONFIG = [
  { key: "entwurf", label: "Entwurf", color: "#525866", icon: <FileText size={16} /> },
  { key: "eingereicht", label: "Eingereicht", color: "#3b82f6", icon: <Send size={16} /> },
  { key: "warten_auf_nb", label: "Beim Netzbetreiber", color: "#f59e0b", icon: <Clock size={16} /> },
  { key: "nachbesserung", label: "Rückfrage", color: "#ef4444", icon: <HelpCircle size={16} /> },
  { key: "nb_genehmigt", label: "Genehmigt", color: "#22c55e", icon: <CheckCircle2 size={16} /> },
  { key: "abgeschlossen", label: "Abgeschlossen", color: "#06b6d4", icon: <Award size={16} /> },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const getPriorityInfo = (priority: string) => {
  switch (priority) {
    case "urgent": return { color: "#ef4444", label: "Dringend" };
    case "high": return { color: "#f59e0b", label: "Hoch" };
    case "medium": return { color: "#3b82f6", label: "Mittel" };
    default: return { color: "#525866", label: "Normal" };
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface KanbanCardProps {
  item: Installation;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, item: Installation) => void;
  columnColor: string;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item, onClick, onDragStart, columnColor }) => {
  const priorityInfo = getPriorityInfo(item.priority);
  const isOverdue = item.daysInStatus > 5;

  return (
    <div
      className={`kanban-card ${isOverdue ? "kanban-card--overdue" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onClick={onClick}
    >
      {/* Priority Indicator */}
      {item.priority !== "low" && (
        <div
          className="kanban-card__priority"
          style={{ background: priorityInfo.color }}
          title={priorityInfo.label}
        />
      )}

      {/* Header */}
      <div className="kanban-card__header">
        <span className="kanban-card__id">{item.publicId}</span>
        <div className="kanban-card__badges">
          {item.hasUnreadEmails && (
            <span className="kanban-card__badge kanban-card__badge--email" title="Ungelesene E-Mails">
              <Mail size={12} />
            </span>
          )}
          {isOverdue && (
            <span className="kanban-card__badge kanban-card__badge--overdue" title="Überfällig">
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="kanban-card__customer">
        <Avatar name={item.customerName} size="sm" />
        <span className="kanban-card__customer-name">{item.customerName}</span>
      </div>

      {/* Meta */}
      <div className="kanban-card__meta">
        {item.gridOperator && (
          <span className="kanban-card__meta-item" title="Netzbetreiber">
            <Building size={12} />
            {item.gridOperator}
          </span>
        )}
        <span className="kanban-card__meta-item" title="Standort">
          {item.location}
        </span>
      </div>

      {/* Footer */}
      <div className="kanban-card__footer">
        <span className="kanban-card__date">
          <Calendar size={12} />
          {formatDate(item.updatedAt)}
        </span>
        {item.daysInStatus > 0 && (
          <span className={`kanban-card__days ${isOverdue ? "kanban-card__days--overdue" : ""}`}>
            {item.daysInStatus}d
          </span>
        )}
      </div>

      {/* Drag Handle */}
      <div className="kanban-card__drag-handle">
        <GripVertical size={14} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN COLUMN
// ═══════════════════════════════════════════════════════════════════════════════

interface KanbanColumnProps {
  column: KanbanColumn;
  onCardClick: (item: Installation) => void;
  onDragStart: (e: React.DragEvent, item: Installation) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnKey: string) => void;
  isDragOver: boolean;
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  column,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}) => {
  return (
    <div
      className={`kanban-column ${isDragOver ? "kanban-column--drag-over" : ""}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.key)}
    >
      {/* Column Header */}
      <div className="kanban-column__header">
        <div className="kanban-column__title">
          <span className="kanban-column__icon" style={{ color: column.color }}>
            {column.icon}
          </span>
          <span className="kanban-column__label">{column.label}</span>
          <span className="kanban-column__count" style={{ background: `${column.color}20`, color: column.color }}>
            {column.items.length}
          </span>
        </div>
        <button className="kanban-column__menu">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Column Content */}
      <div className="kanban-column__content">
        {column.items.length === 0 ? (
          <div className="kanban-column__empty">
            Keine Anmeldungen
          </div>
        ) : (
          column.items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
              onDragStart={onDragStart}
              columnColor={column.color}
            />
          ))
        )}
      </div>

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="kanban-column__drop-zone" style={{ borderColor: column.color }}>
          Hier ablegen
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<Installation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/installations?limit=200", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const items = (result.data || []).map((item: any) => ({
          id: item.id,
          publicId: item.publicId || `NA-${item.id}`,
          customerName: item.kunde?.name || item.anlagenanschrift?.name || "Unbekannt",
          location: item.anlagenanschrift ? `${item.anlagenanschrift.plz} ${item.anlagenanschrift.ort}` : "-",
          status: item.netzbetreiberStatus || "entwurf",
          gridOperator: item.netzbetreiber?.name || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          daysInStatus: calculateDaysInStatus(item.updatedAt),
          priority: calculatePriority(item),
          hasDocuments: (item.documents?.length || 0) > 0,
          hasUnreadEmails: false,
        }));
        setInstallations(items);
      } else {
        console.warn("Kanban: Keine Daten"); setInstallations([]);
      }
    } catch (err) {
      console.error("Kanban fetch error:", err);
      console.warn("Kanban: Keine Daten"); setInstallations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate days in status
  const calculateDaysInStatus = (updatedAt: string) => {
    const updated = new Date(updatedAt);
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate priority
  const calculatePriority = (item: any): Installation["priority"] => {
    const days = calculateDaysInStatus(item.updatedAt);
    if (item.netzbetreiberStatus === "nachbesserung" && days > 3) return "urgent";
    if (days > 7) return "high";
    if (days > 3) return "medium";
    return "low";
  };

  // Filter by search
  const filteredInstallations = useMemo(() => {
    if (!searchQuery) return installations;
    const q = searchQuery.toLowerCase();
    return installations.filter(
      (i) =>
        i.publicId.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        (i.gridOperator && i.gridOperator.toLowerCase().includes(q))
    );
  }, [installations, searchQuery]);

  // Group into columns
  const columns = useMemo((): KanbanColumn[] => {
    return COLUMNS_CONFIG.map((config) => ({
      ...config,
      items: filteredInstallations.filter((i) => i.status === config.key),
    }));
  }, [filteredInstallations]);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, item: Installation) => {
    setDraggingItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (columnKey: string) => {
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggingItem || draggingItem.status === columnKey) {
      setDraggingItem(null);
      return;
    }

    // Optimistic update
    setInstallations((prev) =>
      prev.map((i) =>
        i.id === draggingItem.id ? { ...i, status: columnKey } : i
      )
    );

    // API update
    try {
      await fetch(`/api/installations/${draggingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ netzbetreiberStatus: columnKey }),
      });
    } catch (err) {
      console.error("Status update failed:", err);
      // Revert on error
      fetchData();
    }

    setDraggingItem(null);
  };

  const handleCardClick = (item: Installation) => {
    navigate(`/archiv/${item.id}`);
  };

  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="kanban">
      {/* Header */}
      <div className="kanban-header">
        <div className="kanban-header__left">
          <h1 className="kanban-title">Kanban Board</h1>
          <Badge variant="purple">{installations.length} Anmeldungen</Badge>
        </div>
        <div className="kanban-header__right">
          <Input
            placeholder="Suchen..."
            icon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="kanban-search"
          />
          <Button variant="ghost" size="sm" icon={<Filter size={16} />}>
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} className={refreshing ? "spin" : ""} />}
            onClick={() => fetchData(true)}
          >
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="kanban-board">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.key}
            column={column}
            onCardClick={handleCardClick}
            onDragStart={handleDragStart}
            onDragOver={(e) => {
              handleDragOver(e);
              handleDragEnter(column.key);
            }}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.key && draggingItem?.status !== column.key}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="kanban-legend">
        <span className="kanban-legend__title">Legende:</span>
        <span className="kanban-legend__item">
          <span className="kanban-legend__dot" style={{ background: "#ef4444" }} />
          Dringend
        </span>
        <span className="kanban-legend__item">
          <span className="kanban-legend__dot" style={{ background: "#f59e0b" }} />
          Hohe Priorität
        </span>
        <span className="kanban-legend__item">
          <AlertTriangle size={14} className="text-error" />
          Überfällig (&gt;5 Tage)
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

const KanbanSkeleton: React.FC = () => (
  <div className="kanban">
    <div className="kanban-header">
      <Skeleton width={200} height={32} />
      <Skeleton width={200} height={36} />
    </div>
    <div className="kanban-board">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="kanban-column">
          <Skeleton height={40} className="mb-3" />
          <Skeleton height={120} className="mb-2" />
          <Skeleton height={120} className="mb-2" />
          <Skeleton height={120} />
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const getMockData = (): Installation[] => [
  { id: 1, publicId: "NA-2847", customerName: "Müller Solar GmbH", location: "76137 Karlsruhe", status: "nachbesserung", gridOperator: "E-Werk Mittelbaden", createdAt: "2024-12-15", updatedAt: "2024-12-19", daysInStatus: 5, priority: "urgent", hasDocuments: true, hasUnreadEmails: true },
  { id: 2, publicId: "NA-2846", customerName: "Schmidt Elektro", location: "76185 Karlsruhe", status: "warten_auf_nb", gridOperator: "EnBW", createdAt: "2024-12-14", updatedAt: "2024-12-17", daysInStatus: 7, priority: "high", hasDocuments: true, hasUnreadEmails: false },
  { id: 3, publicId: "NA-2845", customerName: "Weber PV Systems", location: "76133 Karlsruhe", status: "eingereicht", gridOperator: null, createdAt: "2024-12-18", updatedAt: "2024-12-20", daysInStatus: 4, priority: "medium", hasDocuments: false, hasUnreadEmails: false },
  { id: 4, publicId: "NA-2844", customerName: "Fischer Energie", location: "76131 Karlsruhe", status: "entwurf", gridOperator: null, createdAt: "2024-12-22", updatedAt: "2024-12-22", daysInStatus: 2, priority: "low", hasDocuments: false, hasUnreadEmails: false },
  { id: 5, publicId: "NA-2843", customerName: "Bauer Solar", location: "76227 Karlsruhe", status: "nb_genehmigt", gridOperator: "Stadtwerke Karlsruhe", createdAt: "2024-12-10", updatedAt: "2024-12-23", daysInStatus: 1, priority: "low", hasDocuments: true, hasUnreadEmails: false },
  { id: 6, publicId: "NA-2842", customerName: "Koch Photovoltaik", location: "76199 Karlsruhe", status: "abgeschlossen", gridOperator: "E-Werk Mittelbaden", createdAt: "2024-12-01", updatedAt: "2024-12-20", daysInStatus: 4, priority: "low", hasDocuments: true, hasUnreadEmails: false },
  { id: 7, publicId: "NA-2841", customerName: "Meier GmbH", location: "76149 Karlsruhe", status: "warten_auf_nb", gridOperator: "EnBW", createdAt: "2024-12-16", updatedAt: "2024-12-18", daysInStatus: 6, priority: "high", hasDocuments: true, hasUnreadEmails: true },
  { id: 8, publicId: "NA-2840", customerName: "Schneider Solar", location: "76139 Karlsruhe", status: "eingereicht", gridOperator: null, createdAt: "2024-12-21", updatedAt: "2024-12-21", daysInStatus: 3, priority: "medium", hasDocuments: true, hasUnreadEmails: false },
];

export default KanbanBoard;

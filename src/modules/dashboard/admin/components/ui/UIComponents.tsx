/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  Baunity UI COMPONENTS v3.0                                                     ║
 * ║  Complete UI component library                                               ║
 * ║  - Button, IconButton                                                        ║
 * ║  - Card, Badge, Avatar                                                       ║
 * ║  - Input, Select, Textarea                                                   ║
 * ║  - Modal, Tabs, Toast                                                        ║
 * ║  - Dropdown, Table                                                           ║
 * ║  - Progress, Skeleton, EmptyState                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { forwardRef, useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { X, ChevronDown, Check, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import "./ui-components.css";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className = "",
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={`ui-btn ui-btn--${variant} ui-btn--${size} ${loading ? "ui-btn--loading" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="ui-btn__spinner" />}
      {!loading && icon && <span className="ui-btn__icon">{icon}</span>}
      {children && <span className="ui-btn__text">{children}</span>}
      {!loading && iconRight && <span className="ui-btn__icon">{iconRight}</span>}
    </button>
  );
});

Button.displayName = "Button";

// ═══════════════════════════════════════════════════════════════════════════════
// ICON BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  children,
  variant = "ghost",
  size = "md",
  tooltip,
  className = "",
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={`ui-icon-btn ui-icon-btn--${variant} ui-icon-btn--${size} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
});

IconButton.displayName = "IconButton";

// ═══════════════════════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
  glow = false,
}) => {
  return (
    <div
      className={`ui-card ui-card--pad-${padding} ${hover ? "ui-card--hover" : ""} ${glow ? "ui-card--glow" : ""} ${onClick ? "ui-card--clickable" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`ui-card__header ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <h3 className={`ui-card__title ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`ui-card__description ${className}`}>{children}</p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`ui-card__content ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`ui-card__footer ${className}`}>{children}</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════════════════

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className = "",
}) => {
  return (
    <span className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`}>
      {dot && <span className="ui-badge__dot" />}
      {icon && <span className="ui-badge__icon">{icon}</span>}
      {children}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════════

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconRight,
  className = "",
  ...props
}, ref) => {
  return (
    <div className={`ui-input-wrap ${error ? "ui-input-wrap--error" : ""} ${className}`}>
      {label && <label className="ui-input__label">{label}</label>}
      <div className="ui-input__container">
        {icon && <span className="ui-input__icon ui-input__icon--left">{icon}</span>}
        <input
          ref={ref}
          className={`ui-input ${icon ? "ui-input--has-icon-left" : ""} ${iconRight ? "ui-input--has-icon-right" : ""}`}
          {...props}
        />
        {iconRight && <span className="ui-input__icon ui-input__icon--right">{iconRight}</span>}
      </div>
      {error && <span className="ui-input__error">{safeString(error)}</span>}
      {hint && !error && <span className="ui-input__hint">{hint}</span>}
    </div>
  );
});

Input.displayName = "Input";

// ═══════════════════════════════════════════════════════════════════════════════
// TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════════

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  className = "",
  ...props
}, ref) => {
  return (
    <div className={`ui-textarea-wrap ${error ? "ui-textarea-wrap--error" : ""} ${className}`}>
      {label && <label className="ui-textarea__label">{label}</label>}
      <textarea
        ref={ref}
        className="ui-textarea"
        {...props}
      />
      {error && <span className="ui-textarea__error">{safeString(error)}</span>}
      {hint && !error && <span className="ui-textarea__hint">{hint}</span>}
    </div>
  );
});

Textarea.displayName = "Textarea";

// ═══════════════════════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════════════════════

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  error,
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`ui-select-wrap ${error ? "ui-select-wrap--error" : ""} ${className}`}>
      {label && <label className="ui-select__label">{label}</label>}
      <div className="ui-select__container">
        <select
          className="ui-select"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="ui-select__chevron" size={16} />
      </div>
      {error && <span className="ui-select__error">{safeString(error)}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  status,
  className = "",
}) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // Generate consistent color from name
  const getColor = (str: string) => {
    const colors = ["#D4A843", "#EAD068", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6"];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      className={`ui-avatar ui-avatar--${size} ${className}`}
      style={!src ? { background: getColor(name || "?") } : undefined}
    >
      {src ? (
        <img src={src} alt={name} className="ui-avatar__img" />
      ) : (
        <span className="ui-avatar__initials">{initials}</span>
      )}
      {status && <span className={`ui-avatar__status ui-avatar__status--${status}`} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showValue?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showValue = false,
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`ui-progress ui-progress--${size} ${className}`}>
      <div className="ui-progress__track">
        <div
          className={`ui-progress__bar ui-progress__bar--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && <span className="ui-progress__value">{Math.round(percentage)}%</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  circle = false,
  className = "",
}) => {
  return (
    <div
      className={`ui-skeleton ${circle ? "ui-skeleton--circle" : ""} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`ui-empty ${className}`}>
      {icon && <div className="ui-empty__icon">{icon}</div>}
      <h3 className="ui-empty__title">{title}</h3>
      {description && <p className="ui-empty__description">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdrop = true,
  showCloseButton = true,
  footer,
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="ui-modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined}>
      <div 
        className={`ui-modal ui-modal--${size}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="ui-modal__header">
            {title && <h2 className="ui-modal__title">{title}</h2>}
            {showCloseButton && (
              <button className="ui-modal__close" onClick={onClose} aria-label="Schließen">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="ui-modal__content">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  className = "",
}) => {
  return (
    <div className={`ui-tabs ui-tabs--${variant} ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`ui-tabs__tab ${activeTab === tab.id ? "ui-tabs__tab--active" : ""}`}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.icon && <span className="ui-tabs__tab-icon">{tab.icon}</span>}
          <span className="ui-tabs__tab-label">{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ui-tabs__tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, isActive, className = "" }) => {
  if (!isActive) return null;
  return <div className={`ui-tabs__panel ${className}`} role="tabpanel">{children}</div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="ui-toast-container">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className={`ui-toast ui-toast--${toast.type}`}>
      <span className="ui-toast__icon">{icons[toast.type]}</span>
      <span className="ui-toast__message">{safeString(toast.message)}</span>
      <button className="ui-toast__close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "left",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className={`ui-dropdown ${className}`} ref={dropdownRef}>
      <div className="ui-dropdown__trigger" onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`ui-dropdown__menu ui-dropdown__menu--${align}`}>
          {items.map((item) => 
            item.divider ? (
              <div key={item.id} className="ui-dropdown__divider" />
            ) : (
              <button
                key={item.id}
                className={`ui-dropdown__item ${item.danger ? "ui-dropdown__item--danger" : ""}`}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
              >
                {item.icon && <span className="ui-dropdown__item-icon">{item.icon}</span>}
                <span className="ui-dropdown__item-label">{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════════════════════════

interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = "Keine Daten vorhanden",
  className = "",
}: TableProps<T>) {
  return (
    <div className={`ui-table-wrap ${className}`}>
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ width: col.width }}
                className={col.sortable ? "ui-table__th--sortable" : ""}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="ui-table__th-content">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="ui-table__sort-icon">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="ui-table__loading">Laden...</div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="ui-table__empty">{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr 
                key={String(item[keyField])} 
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? "ui-table__row--clickable" : ""}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item, idx) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKBOX
// ═══════════════════════════════════════════════════════════════════════════════

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  return (
    <label className={`ui-checkbox ${disabled ? "ui-checkbox--disabled" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="ui-checkbox__input"
      />
      <span className={`ui-checkbox__box ${checked ? "ui-checkbox__box--checked" : ""}`}>
        {checked && <Check size={12} />}
      </span>
      {label && <span className="ui-checkbox__label">{label}</span>}
    </label>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SWITCH / TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className = "",
}) => {
  return (
    <label className={`ui-switch ui-switch--${size} ${disabled ? "ui-switch--disabled" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="ui-switch__input"
      />
      <span className={`ui-switch__track ${checked ? "ui-switch__track--checked" : ""}`}>
        <span className="ui-switch__thumb" />
      </span>
      {label && <span className="ui-switch__label">{label}</span>}
    </label>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════════════════════════

interface DividerProps {
  className?: string;
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ className = "", label }) => {
  if (label) {
    return (
      <div className={`ui-divider ui-divider--labeled ${className}`}>
        <span className="ui-divider__label">{label}</span>
      </div>
    );
  }
  return <hr className={`ui-divider ${className}`} />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  className = "",
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={`ui-stat-card ui-stat-card--${variant} ${className}`}>
      <div className="ui-stat-card__header">
        <span className="ui-stat-card__label">{label}</span>
        {icon && <span className="ui-stat-card__icon">{icon}</span>}
      </div>
      <div className="ui-stat-card__value">{value}</div>
      {change !== undefined && (
        <div className={`ui-stat-card__change ${isPositive ? "ui-stat-card__change--up" : ""} ${isNegative ? "ui-stat-card__change--down" : ""}`}>
          {isPositive && "↑"}{isNegative && "↓"} {Math.abs(change)}%
          {changeLabel && <span className="ui-stat-card__change-label"> {changeLabel}</span>}
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  return (
    <div className={`ui-tooltip-wrap ui-tooltip-wrap--${position}`} data-tooltip={content}>
      {children}
    </div>
  );
};

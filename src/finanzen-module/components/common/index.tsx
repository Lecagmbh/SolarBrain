// ============================================
// FINANZEN MODULE - COMMON UI COMPONENTS
// ============================================

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertTriangle, Bell, AlertCircle, X } from "lucide-react";
import type { Toast } from "../../types";
import { formatCurrency } from "../../utils";

// ============================================
// ANIMATED NUMBER
// ============================================

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: "currency" | "number" | "percent";
  decimals?: number;
}

export function AnimatedNumber({ 
  value, 
  duration = 1200, 
  format = "currency",
  decimals = 0 
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * eased;
      
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formatted = (() => {
    switch (format) {
      case "currency":
        return formatCurrency(display);
      case "percent":
        return `${display.toFixed(decimals)}%`;
      default:
        return display.toFixed(decimals);
    }
  })();

  return <span className="fin-animated-number">{formatted}</span>;
}

// ============================================
// PROGRESS RING
// ============================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = "#EAD068",
  bgColor = "rgba(255,255,255,0.1)",
  showValue = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="fin-progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.5s ease-out",
          }}
        />
      </svg>
      {showValue && (
        <span className="fin-progress-ring__value">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// ============================================
// TOAST CONTAINER
// ============================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fin-toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const iconMap = {
    success: CheckCircle2,
    error: AlertTriangle,
    warning: AlertCircle,
    info: Bell,
  } as const;
  
  const Icon = iconMap[toast.type];

  return (
    <div
      className={`fin-toast fin-toast--${toast.type}`}
      onClick={() => onRemove(toast.id)}
      role="alert"
    >
      <Icon size={20} className="fin-toast__icon" />
      <span className="fin-toast__message">{safeString(toast.message)}</span>
      <button 
        className="fin-toast__close"
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        aria-label="Schließen"
      >
        <X size={16} />
      </button>
      <div 
        className="fin-toast__progress" 
        style={{ animationDuration: `${toast.duration || 4000}ms` }}
      />
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: number | string;
  className?: string;
}

export function Skeleton({ 
  width = "100%", 
  height = 20, 
  rounded = 8,
  className = "" 
}: SkeletonProps) {
  return (
    <div
      className={`fin-skeleton ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof rounded === "number" ? `${rounded}px` : rounded,
      }}
    />
  );
}

// ============================================
// SKELETON VARIANTS
// ============================================

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="fin-skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height={16}
          className="fin-skeleton-text__line"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="fin-skeleton-card">
      <Skeleton height={120} rounded={12} />
      <div className="fin-skeleton-card__content">
        <Skeleton width="70%" height={20} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="fin-skeleton-row">
      <Skeleton width={40} height={40} rounded={10} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={80} height={24} rounded={12} />
      <Skeleton width={100} height={16} />
    </div>
  );
}

// ============================================
// BADGE
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function Badge({ 
  children, 
  color = "#fff", 
  bg = "rgba(139, 92, 246, 0.15)",
  size = "md",
  pulse = false 
}: BadgeProps) {
  return (
    <span 
      className={`fin-badge fin-badge--${size} ${pulse ? "fin-badge--pulse" : ""}`}
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

// ============================================
// AVATAR
// ============================================

interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
}

export function Avatar({ name, size = 32, src }: AvatarProps) {
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="fin-avatar"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="fin-avatar fin-avatar--initials"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="fin-empty">
      {icon && <div className="fin-empty__icon">{icon}</div>}
      <h3 className="fin-empty__title">{title}</h3>
      {description && <p className="fin-empty__description">{description}</p>}
      {action && <div className="fin-empty__action">{action}</div>}
    </div>
  );
}

// ============================================
// SPINNER
// ============================================

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 32, color = "#EAD068" }: SpinnerProps) {
  return (
    <div
      className="fin-spinner"
      style={{
        width: size,
        height: size,
        borderTopColor: color,
      }}
    />
  );
}

// ============================================
// TREND INDICATOR
// ============================================

interface TrendProps {
  value: number;
  inverse?: boolean;
}

export function Trend({ value, inverse = false }: TrendProps) {
  const isPositive = inverse ? value < 0 : value > 0;
  
  return (
    <span className={`fin-trend ${isPositive ? "fin-trend--up" : "fin-trend--down"}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d={isPositive 
            ? "M7 3L12 8H9V11H5V8H2L7 3Z" 
            : "M7 11L2 6H5V3H9V6H12L7 11Z"
          }
          fill="currentColor"
        />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

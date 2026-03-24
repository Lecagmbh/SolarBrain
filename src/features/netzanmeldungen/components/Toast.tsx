import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  installationId?: string;
  onDismiss: () => void;
  duration?: number;
  onClick?: () => void;
}

export function Toast({
  message,
  installationId,
  onDismiss,
  duration = 2500,
  onClick,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className="gn-toast"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        opacity: visible ? 1 : 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 20px",
        background: "rgba(15,15,25,0.9)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#f8fafc",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "auto",
      }}
      onClick={onClick}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#3b82f6",
          animation: "gn-toast-pulse 1.5s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span>{message}</span>
      {installationId && (
        <span style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          {installationId} → Detail
        </span>
      )}
      <style>{`
        @keyframes gn-toast-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

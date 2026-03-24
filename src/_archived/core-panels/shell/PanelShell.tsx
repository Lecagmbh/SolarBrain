/**
 * PanelShell – Slide-over panel with overlay.
 * Uses inline styles only (no Tailwind) to avoid class generation issues.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PanelType } from '../types';

interface PanelShellProps {
  open: boolean;
  onClose: () => void;
  type?: PanelType;
  width?: string;
  children: ReactNode;
  className?: string;
}

export function PanelShell({
  open,
  onClose,
  type = 'slide-over',
  width,
  children,
}: PanelShellProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger slide-in on next frame
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: type === 'modal' ? 'center' : 'flex-end',
    alignItems: type === 'modal' ? 'center' : 'stretch',
    backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'transparent',
    transition: 'background-color 300ms ease',
    zIndex: 9999,
  };

  const panelStyle: React.CSSProperties = type === 'modal' ? {
    width: width ?? '680px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#09090b',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
    transform: visible ? 'scale(1)' : 'scale(0.95)',
    opacity: visible ? 1 : 0,
    transition: 'transform 300ms ease, opacity 300ms ease',
  } : {
    width: width ?? '1400px',
    maxWidth: '90vw',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#09090b',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
  };

  const content = (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

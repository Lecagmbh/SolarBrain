/**
 * PanelToast – Toast notification (inline styles)
 */

import { CheckCircle, XCircle } from 'lucide-react';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface PanelToastProps {
  toast: ToastState | null;
}

export function PanelToast({ toast }: PanelToastProps) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
      borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 10000,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      background: isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      color: isSuccess ? '#4ade80' : '#f87171',
      border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>
      {isSuccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {toast.message}
    </div>
  );
}

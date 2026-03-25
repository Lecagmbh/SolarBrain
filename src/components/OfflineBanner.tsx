import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

/**
 * Offline-Banner: Zeigt Offline-Status + wartende Formulare
 * Wird nur angezeigt wenn offline ODER Formulare in der Queue sind
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, lastEvent } = useOfflineQueue();

  // Nichts anzeigen wenn online und keine Queue
  if (isOnline && pendingCount === 0) return null;

  // Sync-Erfolg kurz anzeigen
  if (isOnline && pendingCount === 0 && lastEvent) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 13,
      fontWeight: 500,
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: isOnline ? '#1a2e05' : '#1c1917',
      borderTop: `1px solid ${isOnline ? 'rgba(132,204,22,0.2)' : 'rgba(212,168,67,0.2)'}`,
      color: isOnline ? '#bef264' : '#EAD068',
      transition: 'all 0.3s ease',
      // Safe area for mobile
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
    }}>
      {!isOnline ? (
        <>
          {/* Offline icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <span>
            Offline-Modus
            {pendingCount > 0 && ` — ${pendingCount} ${pendingCount === 1 ? 'Formular wartet' : 'Formulare warten'} auf Übertragung`}
          </span>
        </>
      ) : (
        <>
          {/* Syncing icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{pendingCount} {pendingCount === 1 ? 'Formular wird' : 'Formulare werden'} synchronisiert...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}

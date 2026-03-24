/**
 * RealtimeProvider
 * Aktiviert Echtzeit-Updates via WebSocket für die gesamte Anwendung
 */

import { type ReactNode } from 'react';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Aktiviere Echtzeit-Updates (WebSocket + React Query Integration)
  useRealtimeUpdates();

  return <>{children}</>;
}

export default RealtimeProvider;

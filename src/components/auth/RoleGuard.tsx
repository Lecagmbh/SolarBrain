/**
 * RoleGuard
 * =========
 * Prüft die User-Rolle und leitet bei fehlender Berechtigung um.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../pages/AuthContext';

type UserRole = 'ADMIN' | 'MANAGER' | 'MITARBEITER' | 'HANDELSVERTRETER' | 'KUNDE' | 'SUBUNTERNEHMER' | 'DEMO' | 'PARTNER';

interface RoleGuardProps {
  allowed: UserRole[];
  children: React.ReactNode;
  fallback?: string;
  /** Optional: Wenn gesetzt, müssen KUNDE-User eine dieser kundeIds haben */
  allowedKundeIds?: number[];
}

export function RoleGuard({ allowed, children, fallback = '/dashboard', allowedKundeIds }: RoleGuardProps) {
  const { user } = useAuth();
  const role = ((user?.role || 'KUNDE').toUpperCase()) as UserRole;

  if (!allowed.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  if (allowedKundeIds && role === 'KUNDE') {
    const kundeId = (user as any)?.kundeId as number | undefined;
    if (kundeId == null || !allowedKundeIds.includes(kundeId)) {
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}

export default RoleGuard;

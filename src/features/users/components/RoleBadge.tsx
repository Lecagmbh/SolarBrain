/**
 * Rollen-Badge mit Farbe
 */

import type { UserRole } from '../types';
import { ROLE_CONFIG } from '../constants';

export function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.DEMO;
  return (
    <span
      className="up-role-badge"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

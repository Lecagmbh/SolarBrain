/**
 * Admin Mode Panel
 * =================
 * Panel das angezeigt wird wenn ein Admin/Mitarbeiter eine Anlage für einen anderen User erstellt.
 * Enthält User-Selector und Info-Anzeige.
 */

import React from 'react';
import { AdminUserSelector } from './AdminUserSelector';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  kundeId: number | null;
  kundeName: string | null;
}

interface AdminModePanelProps {
  isAdmin: boolean;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminModePanel: React.FC<AdminModePanelProps> = ({
  isAdmin,
  selectedUser,
  onSelectUser,
  collapsed = false,
  onToggleCollapse,
}) => {
  if (!isAdmin) return null;

  const styles = {
    wrapper: {
      marginBottom: '24px',
      position: 'relative' as const,
      zIndex: 100,
    },
    panel: {
      background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08), rgba(139, 92, 246, 0.04))',
      border: '1px solid rgba(212, 168, 67, 0.25)',
      borderRadius: '12px',
      overflow: 'visible',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      cursor: onToggleCollapse ? 'pointer' : 'default',
      transition: 'background 150ms ease',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    icon: {
      width: '36px',
      height: '36px',
      background: 'rgba(212, 168, 67, 0.15)',
      border: '1px solid rgba(212, 168, 67, 0.3)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    headerText: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px',
    },
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#a5b4fc',
    },
    subtitle: {
      fontSize: '12px',
      color: '#71717a',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: selectedUser ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 191, 36, 0.12)',
      border: `1px solid ${selectedUser ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 500,
      color: selectedUser ? '#4ade80' : '#fbbf24',
    },
    badgeDot: {
      width: '6px',
      height: '6px',
      background: selectedUser ? '#4ade80' : '#fbbf24',
      borderRadius: '50%',
    },
    chevron: {
      fontSize: '18px',
      color: '#71717a',
      transition: 'transform 200ms ease',
      transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
    },
    content: {
      padding: '0 18px 18px',
      display: collapsed ? 'none' : 'block',
      overflow: 'visible',
      position: 'relative' as const,
    },
    divider: {
      height: '1px',
      background: 'rgba(212, 168, 67, 0.15)',
      margin: '0 18px 16px',
    },
    infoBox: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '12px 14px',
      background: 'rgba(59, 130, 246, 0.06)',
      border: '1px solid rgba(59, 130, 246, 0.12)',
      borderRadius: '8px',
      marginTop: '14px',
    },
    infoIcon: {
      fontSize: '14px',
      flexShrink: 0,
      marginTop: '1px',
    },
    infoText: {
      fontSize: '12px',
      color: '#a1a1aa',
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.panel}>
        {/* Header */}
        <div
          style={styles.header}
          onClick={onToggleCollapse}
        >
          <div style={styles.headerLeft}>
            <div style={styles.icon}>🔐</div>
            <div style={styles.headerText}>
              <div style={styles.title}>Admin-Modus</div>
              <div style={styles.subtitle}>
                {selectedUser
                  ? `Erstelle Anlage für ${selectedUser.name}`
                  : 'Erstelle Anlage für einen anderen Benutzer'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              {selectedUser ? 'User ausgewählt' : 'Kein User'}
            </div>
            {onToggleCollapse && (
              <span style={styles.chevron}>▼</span>
            )}
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <>
            <div style={styles.divider} />
            <div style={styles.content}>
              <AdminUserSelector
                selectedUser={selectedUser}
                onSelectUser={onSelectUser}
              />

              {!selectedUser && (
                <div style={styles.infoBox}>
                  <span style={styles.infoIcon}>💡</span>
                  <span style={styles.infoText}>
                    Wählen Sie einen Benutzer aus, für den Sie diese Anlage erstellen möchten.
                    Wenn kein Benutzer ausgewählt ist, wird die Anlage für Ihren eigenen Account erstellt.
                  </span>
                </div>
              )}

              {selectedUser && (
                <div style={{
                  ...styles.infoBox,
                  background: 'rgba(34, 197, 94, 0.06)',
                  borderColor: 'rgba(34, 197, 94, 0.12)',
                }}>
                  <span style={styles.infoIcon}>✓</span>
                  <span style={styles.infoText}>
                    Die Anlage wird für <strong style={{ color: '#4ade80' }}>{selectedUser.name}</strong> ({selectedUser.email}) erstellt.
                    Der Benutzer sieht diese Anlage in seinem Dashboard.
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminModePanel;

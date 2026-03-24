/**
 * CollapsibleSection - Wiederverwendbare aufklappbare Sektion
 * Wird in Step 4 und Step 5 für Progressive Disclosure eingesetzt.
 */

import React, { useState } from 'react';
import { styles } from '../steps/shared';

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  badge,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${styles.collapsible} ${isOpen ? styles.collapsibleOpen : ''}`}>
      <button
        type="button"
        className={styles.collapsibleTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.collapsibleTitle}>
          {icon && <span>{icon}</span>}
          <span>{title}</span>
          {badge && <span className={styles.optionalBadge}>{badge}</span>}
        </span>
        <span className={styles.collapsibleIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className={styles.collapsibleContent}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * BuilderSection - Generic section replacing .panel
 * Shows a colored marker on the timeline, title, summary value, and content.
 * Optionally collapsible.
 */

import React, { useState } from 'react';
import { styles } from '../steps/shared';

type SectionType = 'pv' | 'wr' | 'speicher' | 'verbraucher' | 'netz';

interface BuilderSectionProps {
  type: SectionType;
  title: string;
  summaryValue?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const BuilderSection: React.FC<BuilderSectionProps> = ({
  type,
  title,
  summaryValue,
  collapsible = false,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.builderSection}>
      <div className={styles.builderSectionMarker} data-type={type} />
      <div className={styles.builderSectionHeader}>
        <div className={styles.builderSectionLeft}>
          <span className={styles.builderSectionTitle}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {summaryValue && (
            <span className={styles.builderSectionValue}>{summaryValue}</span>
          )}
          {collapsible && (
            <button
              className={styles.builderSectionToggle}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? '▾ Einklappen' : '▸ Details einblenden'}
            </button>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && (
        <div className={styles.builderSectionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

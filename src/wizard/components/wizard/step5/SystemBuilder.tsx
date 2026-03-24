/**
 * SystemBuilder - Pipeline container with vertical energy flow line
 * Wraps BuilderSections in a visual timeline layout.
 */

import React from 'react';
import { styles } from '../steps/shared';

interface SystemBuilderProps {
  children: React.ReactNode;
}

export const SystemBuilder: React.FC<SystemBuilderProps> = ({ children }) => {
  return (
    <div className={styles.systemBuilder}>
      {children}
    </div>
  );
};

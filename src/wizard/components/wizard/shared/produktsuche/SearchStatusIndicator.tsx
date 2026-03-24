/**
 * Baunity Wizard - SearchStatusIndicator
 *
 * Zeigt den aktuellen Suchstatus an (lokale DB-Suche oder erweiterte KI-Suche).
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SearchStatusProps {
  stage: 'local' | 'smart';
}

export const SearchStatus: React.FC<SearchStatusProps> = ({ stage }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginTop: 8,
      background: stage === 'smart' ? 'rgba(168,85,247,0.06)' : 'rgba(99,139,255,0.06)',
      border: `1px solid ${stage === 'smart' ? 'rgba(168,85,247,0.12)' : 'rgba(99,139,255,0.12)'}`,
      borderRadius: 12,
    }}
  >
    <div style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: stage === 'smart' ? '#a855f7' : '#638bff',
          }}
        />
      ))}
    </div>
    <span style={{ color: stage === 'smart' ? '#a855f7' : '#638bff', fontSize: 12, fontWeight: 500 }}>
      {stage === 'smart' ? 'Erweiterte Suche (RAG + KI)...' : 'Suche in Datenbank...'}
    </span>
  </motion.div>
);

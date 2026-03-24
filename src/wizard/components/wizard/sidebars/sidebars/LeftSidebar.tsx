/**
 * GridNetz Wizard - Left Sidebar
 * ==============================
 * Progress Ring + Validation Status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { STEP_CONFIG } from '../../../types/wizard.types';
import { useVisibleSteps } from '../../../hooks/useVisibleSteps';

interface LeftSidebarProps {
  progress: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ progress }) => {
  const { data, currentStep, maxReachedStep, goToStep } = useWizardStore();
  const visibleSteps = useVisibleSteps();

  // Calculate circle properties
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get step status
  const getStepStatus = (stepNumber: number, index: number) => {
    if (stepNumber === currentStep) return 'current';
    if (index < visibleSteps.findIndex(s => s.number === currentStep)) return 'valid';
    if (stepNumber <= maxReachedStep) return 'accessible';
    return 'pending';
  };

  return (
    <aside className="wizard-sidebar-left">
      {/* Progress Ring */}
      <div className="wizard-progress-ring" style={{ position: 'relative' }}>
        <svg className="wizard-progress-ring-svg" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#638bff" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <circle
            className="wizard-progress-ring-bg"
            cx="80"
            cy="80"
            r={radius}
          />
          <motion.circle
            className="wizard-progress-ring-bar"
            cx="80"
            cy="80"
            r={radius}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="wizard-progress-ring-center">
          <motion.div
            className="wizard-progress-percent"
            key={Math.round(progress)}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(progress)}%
          </motion.div>
          <div className="wizard-progress-label">Fortschritt</div>
        </div>
      </div>

      {/* Validation List */}
      <div className="wizard-validation-section">
        <div className="wizard-validation-title">Schritte</div>
        <div className="wizard-validation-list">
          {visibleSteps.map((step, index) => {
            const config = STEP_CONFIG[step.number - 1];
            const status = getStepStatus(step.number, index);
            const isAccessible = step.number <= maxReachedStep;

            return (
              <motion.button
                key={step.number}
                className={`wizard-validation-item ${status}`}
                onClick={() => isAccessible && goToStep(step.number)}
                disabled={!isAccessible}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={isAccessible ? { x: 4 } : undefined}
                style={{
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span className={`wizard-validation-icon ${status === 'valid' ? 'valid' : status === 'current' ? 'pending' : 'pending'}`}>
                  {status === 'valid' ? '✓' : status === 'current' ? '●' : (index + 1)}
                </span>
                <span style={{ flex: 1 }}>{config.title}</span>
                {status === 'current' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#638bff',
                      boxShadow: '0 0 8px rgba(99,139,255,0.5)',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        marginTop: 'auto',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)',
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Schritt:</span>{' '}
          <span style={{ color: '#638bff', fontWeight: 600 }}>
            {visibleSteps.findIndex(s => s.number === currentStep) + 1} / {visibleSteps.length}
          </span>
        </div>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Kategorie:</span>{' '}
          <span style={{ color: '#22c55e', fontWeight: 500 }}>
            {data.step1.kategorie ?
              data.step1.kategorie.charAt(0).toUpperCase() + data.step1.kategorie.slice(1) :
              'Nicht gewählt'
            }
          </span>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;

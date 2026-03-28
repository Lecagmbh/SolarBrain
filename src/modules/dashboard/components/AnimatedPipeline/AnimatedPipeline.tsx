import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Phone, CheckCircle, XCircle } from 'lucide-react';
import { AnimatedCounter } from '../AnimatedCounter';
import { FlowingParticles } from './FlowingParticles';
import './animated-pipeline.css';

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  icon?: string;
}

interface AnimatedPipelineProps {
  stages: PipelineStage[];
  onStageClick?: (stageKey: string) => void;
  simplified?: boolean;
  className?: string;
}

// Stage configuration with icons and colors
const STAGE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgClass: string;
}> = {
  eingang: {
    icon: <Zap size={22} />,
    color: '#D4A843',
    bgClass: 'pipeline__stage-icon--eingang',
  },
  zu_kontaktieren: {
    icon: <Zap size={22} />,
    color: '#D4A843',
    bgClass: 'pipeline__stage-icon--eingang',
  },
  kontaktiert: {
    icon: <Phone size={22} />,
    color: '#3b82f6',
    bgClass: 'pipeline__stage-icon--beim-nb',
  },
  qualifiziert: {
    icon: <CheckCircle size={22} />,
    color: '#22c55e',
    bgClass: 'pipeline__stage-icon--genehmigt',
  },
  disqualifiziert: {
    icon: <XCircle size={22} />,
    color: '#ef4444',
    bgClass: 'pipeline__stage-icon--rueckfragen',
  },
};

// Emoji mapping for stages (fallback)
const STAGE_EMOJI: Record<string, string> = {
  eingang: '⚡',
  zu_kontaktieren: '⚡',
  kontaktiert: '📞',
  qualifiziert: '✅',
  disqualifiziert: '❌',
};

/**
 * AnimatedPipeline - Visualisiert den Workflow mit animierten Partikeln
 */
export function AnimatedPipeline({
  stages,
  onStageClick,
  simplified = false,
  className = '',
}: AnimatedPipelineProps) {
  // Calculate total for simplified view
  const totalActive = useMemo(() =>
    stages.reduce((sum, s) => sum + s.count, 0),
    [stages]
  );

  return (
    <motion.section
      className={`glass-card glass-card--no-hover pipeline ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header */}
      <div className="pipeline__header">
        <div className="pipeline__icon">
          <Activity />
        </div>
        <div>
          <h2 className="pipeline__title">Pipeline</h2>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="pipeline__stages">
        {/* Background connector line */}
        <div className="pipeline__connector" />

        {/* Flowing particles */}
        <FlowingParticles
          particleCount={6}
          duration={3}
          color="var(--dash-primary)"
        />

        {/* Stage nodes */}
        {stages.map((stage, index) => {
          const config = STAGE_CONFIG[stage.key];
          const isPulsing = stage.key === 'rueckfragen' && stage.count > 0;

          return (
            <motion.div
              key={stage.key}
              className="pipeline__stage"
              onClick={() => onStageClick?.(stage.key)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`pipeline__stage-icon ${config?.bgClass || ''} ${
                  isPulsing ? 'has-items' : ''
                }`}
                style={{ color: config?.color }}
              >
                {config?.icon || STAGE_EMOJI[stage.key] || '📌'}
              </div>

              <div className="pipeline__stage-content">
                <span className="pipeline__stage-count">
                  <AnimatedCounter
                    value={stage.count}
                    duration={1.2}
                    delay={0.2 + index * 0.1}
                  />
                </span>
                <span className="pipeline__stage-label">{stage.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Simplified total for customers */}
      {simplified && (
        <motion.div
          className="pipeline__summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm text-zinc-400">
            Gesamt: <AnimatedCounter value={totalActive} /> Anmeldungen
          </span>
        </motion.div>
      )}
    </motion.section>
  );
}

export default AnimatedPipeline;

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FlowingParticlesProps {
  particleCount?: number;
  duration?: number;
  color?: string;
}

/**
 * FlowingParticles - CSS-basierte animierte Partikel für die Pipeline
 * Performanter als Three.js für einfache Flows
 */
export function FlowingParticles({
  particleCount = 6,
  duration = 3,
  color = 'var(--dash-primary)',
}: FlowingParticlesProps) {
  // Use deterministic values based on index for React purity
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Deterministic pseudo-random based on index
      const seed = (i * 7 + 3) % 10;
      return {
        id: i,
        delay: (i / particleCount) * duration,
        size: 4 + (seed / 10) * 4, // 4-8px range
        yOffset: ((seed - 5) / 5) * 8, // -8 to 8px range
      };
    });
  }, [particleCount, duration]);

  return (
    <div className="pipeline__particles">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="flowing-particle"
          style={{
            width: particle.size,
            height: particle.size,
            background: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            top: `calc(50% + ${particle.yOffset}px)`,
          }}
          initial={{ left: '-5%', opacity: 0 }}
          animate={{
            left: ['−5%', '105%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.9, 1],
          }}
        />
      ))}
    </div>
  );
}

/**
 * PulsingDot - Einzelner pulsierender Punkt für Highlights
 */
export function PulsingDot({
  color = 'var(--dash-danger)',
  size = 8,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="pulsing-dot"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size}px ${color}`,
      }}
    >
      <span
        className="pulsing-dot__ring"
        style={{
          borderColor: color,
        }}
      />
    </span>
  );
}

export default FlowingParticles;

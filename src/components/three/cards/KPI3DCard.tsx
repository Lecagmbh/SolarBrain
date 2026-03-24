/**
 * KPI3DCard
 * =========
 * 3D-enhanced KPI card with tilt, float, and glow effects
 * Uses Framer Motion for smooth animations
 */

import React, { useRef, useState, useCallback, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { KPI3DCardProps } from '../types';
import { useThreeContextSafe } from '../core/ThreeProvider';
import { ANIMATION } from '../constants';

export const KPI3DCard: React.FC<KPI3DCardProps> = memo(
  ({
    label,
    value,
    icon,
    color,
    trend,
    onClick,
    glowIntensity = 0.5,
    floatAmplitude = 8,
  }) => {
    const threeCtx = useThreeContextSafe();
    const reducedMotion = threeCtx?.reducedMotion ?? false;

    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for tilt effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for smooth movement
    const springConfig = ANIMATION.spring;
    const rotateX = useSpring(
      useTransform(mouseY, [-0.5, 0.5], [8, -8]),
      springConfig
    );
    const rotateY = useSpring(
      useTransform(mouseX, [-0.5, 0.5], [-8, 8]),
      springConfig
    );
    const translateY = useSpring(isHovered ? -floatAmplitude : 0, springConfig);
    const scale = useSpring(isHovered ? 1.02 : 1, springConfig);

    // Handle mouse movement for tilt
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (reducedMotion || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        mouseX.set(x);
        mouseY.set(y);
      },
      [mouseX, mouseY, reducedMotion]
    );

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      mouseX.set(0);
      mouseY.set(0);
      setIsHovered(false);
    }, [mouseX, mouseY]);

    // Calculate glow color
    const glowOpacity = Math.round(glowIntensity * 0.4 * 255)
      .toString(16)
      .padStart(2, '0');
    const glowColor = `${color}${glowOpacity}`;

    // Trend display
    const showTrend = trend !== undefined && trend !== 0;
    const trendPositive = (trend ?? 0) > 0;

    return (
      <motion.div
        ref={cardRef}
        className="kpi-3d-card"
        style={{
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
          y: reducedMotion ? 0 : translateY,
          scale: reducedMotion ? 1 : scale,
          transformPerspective: 1000,
          transformStyle: 'preserve-3d',
          // @ts-ignore - CSS custom properties
          '--kpi-color': color,
          '--kpi-glow': glowColor,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileTap={reducedMotion ? {} : { scale: 0.98 }}
      >
        {/* Glow layer */}
        <div
          className="kpi-3d-card__glow"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="kpi-3d-card__content">
          <div
            className="kpi-3d-card__icon"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {icon}
          </div>
          <div className="kpi-3d-card__value">{value}</div>
          <div className="kpi-3d-card__label">{label}</div>
          {showTrend && (
            <div
              className={`kpi-3d-card__trend kpi-3d-card__trend--${trendPositive ? 'up' : 'down'}`}
            >
              {trendPositive ? '↑' : '↓'} {Math.abs(trend!)}%
            </div>
          )}
        </div>

        {/* Edge highlight */}
        <div
          className="kpi-3d-card__edge"
          style={{
            background: `linear-gradient(135deg, ${color}40 0%, transparent 50%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Border glow on hover */}
        <div
          className="kpi-3d-card__border"
          style={{
            borderColor: isHovered ? color : 'transparent',
            boxShadow: isHovered
              ? `0 20px 40px rgba(0,0,0,0.25), 0 0 30px ${glowColor}`
              : '0 4px 12px rgba(0,0,0,0.15)',
          }}
        />
      </motion.div>
    );
  }
);

KPI3DCard.displayName = 'KPI3DCard';

export default KPI3DCard;

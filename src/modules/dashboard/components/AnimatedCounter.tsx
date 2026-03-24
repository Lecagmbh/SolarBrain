import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatNumber?: boolean;
}

/**
 * AnimatedCounter - Zählt Zahlen animiert hoch
 * Verwendet Framer Motion Springs für flüssige Animationen
 */
export function AnimatedCounter({
  value,
  duration = 1.5,
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
  formatNumber = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Spring animation für smooth counting
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  // Transform spring value to rounded number
  const display = useTransform(spring, (current) => {
    const rounded = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current);

    if (formatNumber && typeof rounded === 'number') {
      return new Intl.NumberFormat('de-DE').format(rounded);
    }
    if (formatNumber && typeof rounded === 'string') {
      const num = parseFloat(rounded);
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
    return rounded.toString();
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInView, value, spring, delay, hasAnimated]);

  // Update value wenn sich value ändert (nach initial animation)
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
    }
  }, [value, spring, hasAnimated]);

  return (
    <span ref={ref} className={`counter-value ${className}`}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

/**
 * SimpleCounter - Lightweight alternative ohne Framer Motion
 * Für viele gleichzeitige Counters (Performance)
 */
export function SimpleCounter({
  value,
  duration = 1500,
  className = '',
  prefix = '',
  suffix = '',
  formatNumber = true,
}: Omit<AnimatedCounterProps, 'decimals' | 'delay'> & { duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValue = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    // Store previous value for transitions
    const fromValue = previousValue.current;
    previousValue.current = value;

    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromValue + eased * (value - fromValue));

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInView, value, duration]);

  const formatted = formatNumber
    ? new Intl.NumberFormat('de-DE').format(displayValue)
    : displayValue.toString();

  return (
    <span ref={ref} className={`counter-value ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;

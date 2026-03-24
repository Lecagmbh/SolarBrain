/**
 * CountUp Animation Hook + Component
 */
import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startTime = useRef(0);
  const rafId = useRef(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

export function CountUp({ to, duration = 1400, locale }: { to: number; duration?: number; locale?: boolean }) {
  const v = useCountUp(to, duration);
  return <>{locale ? v.toLocaleString("de-DE") : v}</>;
}

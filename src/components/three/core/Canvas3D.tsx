/**
 * Canvas3D
 * ========
 * Wrapper around React Three Fiber Canvas with fallback support
 */

import React, { Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThreeContext } from './ThreeProvider';

interface Canvas3DProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Fallback component for non-WebGL browsers
const FallbackRenderer: React.FC<{
  fallback?: React.ReactNode;
  className?: string;
}> = ({ fallback, className }) => {
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={className} style={{ background: 'transparent' }}>
      {/* Empty fallback - just transparent */}
    </div>
  );
};

export const Canvas3D: React.FC<Canvas3DProps> = memo(
  ({ children, fallback, className, style }) => {
    const { webglSupported, performanceTier, reducedMotion } = useThreeContext();

    // No WebGL support - render fallback
    if (!webglSupported) {
      return <FallbackRenderer fallback={fallback} className={className} />;
    }

    const isLowEnd = performanceTier.tier === 'low';

    return (
      <Canvas
        className={className}
        style={style}
        gl={{
          antialias: !isLowEnd,
          powerPreference: isLowEnd ? 'low-power' : 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        dpr={isLowEnd ? 1 : [1, 2]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        flat // Disable tone mapping for better performance
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    );
  }
);

Canvas3D.displayName = 'Canvas3D';

export default Canvas3D;

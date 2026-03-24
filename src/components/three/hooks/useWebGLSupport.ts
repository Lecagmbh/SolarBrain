/**
 * useWebGLSupport Hook
 * ====================
 * Detects WebGL capabilities
 */

import { useState, useEffect } from 'react';
import type { WebGLCapabilities } from '../types';

export function detectWebGLCapabilities(): WebGLCapabilities {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      version: 0,
      maxTextureSize: 0,
      maxVertexUniforms: 0,
      renderer: 'ssr',
      vendor: 'ssr',
    };
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return {
      supported: false,
      version: 0,
      maxTextureSize: 0,
      maxVertexUniforms: 0,
      renderer: 'none',
      vendor: 'none',
    };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

  return {
    supported: true,
    version: gl instanceof WebGL2RenderingContext ? 2 : 1,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
  };
}

export function useWebGLSupport(): WebGLCapabilities {
  const [capabilities, setCapabilities] = useState<WebGLCapabilities>(() => ({
    supported: true, // Optimistic default
    version: 2,
    maxTextureSize: 4096,
    maxVertexUniforms: 256,
    renderer: 'pending',
    vendor: 'pending',
  }));

  useEffect(() => {
    setCapabilities(detectWebGLCapabilities());
  }, []);

  return capabilities;
}

export default useWebGLSupport;

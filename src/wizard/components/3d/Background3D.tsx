/**
 * Baunity 3D Background - Animated gradient orbs with parallax
 */

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const Background3D: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 20);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 20);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0f1a]">
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Animated Orbs - using springX/springY */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px]" 
        style={{ x: springX, y: springY, left: '10%', top: '20%' }} 
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px]" 
        style={{ x: springX, y: springY, right: '10%', bottom: '20%' }} 
      />
      <motion.div 
        className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[80px]" 
        style={{ x: springX, y: springY, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} 
      />
    </div>
  );
};

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev < 100 ? prev + 5 : 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0f1a]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl mb-6">
          ⚡
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Baunity Wizard</h1>
        <p className="text-white/50 mb-6">Lade Intelligence Engine...</p>
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Background3D;

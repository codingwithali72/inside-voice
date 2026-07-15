import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BackgroundEffect() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: -1,
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      {/* Ambient glowing orbs */}
      <motion.div
        animate={{
          x: ['-20%', '120%', '-20%'],
          y: ['-10%', '110%', '-10%'],
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, var(--accent-blue-glow) 0%, transparent 60%)',
          borderRadius: '50%', filter: 'blur(80px)'
        }}
      />
      
      <motion.div
        animate={{
          x: ['120%', '-20%', '120%'],
          y: ['110%', '-10%', '110%'],
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, var(--accent-cyan-glow) 0%, transparent 60%)',
          borderRadius: '50%', filter: 'blur(80px)'
        }}
      />

      {/* Grid overlay for 'museum' feel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
      }} />
    </div>
  );
}

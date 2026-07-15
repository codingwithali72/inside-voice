import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FrameSplitting({ onNext }) {
  const [phase, setPhase] = useState('full'); // full -> split -> zoomed

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('split'), 2000);
    const t2 = setTimeout(() => setPhase('zoomed'), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const frames = Array.from({ length: 12 });

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 4: Frame Splitting</h2>
        <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)', minHeight: '60px' }}>
          {phase === 'full' && "The computer does not analyze an entire sentence at once."}
          {phase === 'split' && "Instead, it divides the recording into many tiny overlapping windows..."}
          {phase === 'zoomed' && "...typically around 20–30 milliseconds each. Each frame is processed independently."}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', marginBottom: '3rem', position: 'relative' }}>
          
          {phase === 'full' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: '600px',
                height: '100px',
                background: 'linear-gradient(90deg, transparent, var(--accent-blue-glow), transparent)',
                border: '1px solid var(--accent-blue)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Continuous Waveform
            </motion.div>
          )}

          {phase === 'split' && (
            <div style={{ display: 'flex', gap: '4px', width: '600px', justifyContent: 'center' }}>
              {frames.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: i % 2 === 0 ? -10 : 10, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                  style={{
                    width: '45px',
                    height: '100px',
                    background: 'var(--accent-blue-glow)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '4px'
                  }}
                />
              ))}
            </div>
          )}

          {phase === 'zoomed' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              style={{
                width: '100px',
                height: '100px',
                background: 'var(--accent-cyan-glow)',
                border: '2px solid var(--accent-cyan)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Frame #5</span>
              <span style={{ fontSize: '0.5rem', opacity: 0.8 }}>25ms</span>
            </motion.div>
          )}

        </div>

        {phase === 'zoomed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button className="btn-primary" onClick={onNext}>Continue</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

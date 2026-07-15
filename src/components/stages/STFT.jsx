import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function STFT({ onNext }) {
  const [phase, setPhase] = useState('start'); // start -> transform -> finish

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transform'), 2000);
    const t2 = setTimeout(() => setPhase('finish'), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '900px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 5: Short-Time Fourier Transform</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          The STFT converts each frame from the Time Domain into the Frequency Domain.<br/>
          Instead of asking <em>'When did the sound occur?'</em>, the computer now asks <em>'Which frequencies exist inside this tiny frame?'</em>
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3rem 0', padding: '0 2rem' }}>
          
          {/* Time Domain Frame */}
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Time Domain (Frame)</h4>
            <div style={{
              width: '150px', height: '150px', border: '1px solid var(--glass-border)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10, 132, 255, 0.1)', overflow: 'hidden', position: 'relative'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,50 Q25,10 50,50 T100,50" fill="none" stroke="var(--accent-blue)" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Transformation Arrow */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={phase === 'transform' || phase === 'finish' ? { width: '100%', opacity: 1 } : {}}
              transition={{ duration: 1.5 }}
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
                position: 'relative'
              }}
            >
              <motion.div
                animate={phase === 'transform' || phase === 'finish' ? { x: ['0%', '100%'] } : {}}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                  position: 'absolute', right: 0, top: '-8px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 15px var(--accent-cyan-glow)'
                }}
              />
            </motion.div>
          </div>

          {/* Frequency Domain Spectrum */}
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Frequency Domain</h4>
            <div style={{
              width: '150px', height: '150px', border: '1px solid var(--glass-border)',
              borderRadius: '8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              background: 'rgba(50, 173, 230, 0.1)', padding: '10px', gap: '4px'
            }}>
              {[20, 50, 90, 40, 15, 60, 30, 10].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={phase === 'finish' ? { height: `${h}%` } : { height: 0 }}
                  transition={{ delay: i * 0.1 + 0.5, type: 'spring' }}
                  style={{
                    width: '12px',
                    background: i === 2 ? 'var(--accent-cyan)' : 'var(--accent-blue)', // Highlight dominant
                    borderRadius: '2px 2px 0 0',
                    boxShadow: i === 2 ? '0 0 10px var(--accent-cyan-glow)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {phase === 'finish' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem', fontWeight: 500 }}>
              The tallest peak represents the Dominant Frequency.
            </p>
            <button className="btn-primary" onClick={onNext}>Continue</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

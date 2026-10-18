import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';

export default function AIModel({ onNext, transcribedText }) {
  const cleanText = (transcribedText || '').trim() || "understand";
  const words = cleanText.split(/\s+/).filter(Boolean);
  const firstWord = (words[0] || "speech").toLowerCase();

  // Generate phonemes from the first word of the user's speech
  const chars = firstWord.replace(/[^a-z]/g, '').slice(0, 3) || 'spe';
  const phonemes = [
    { symbol: `/${chars[0] || 's'}/`, conf: '98%', width: '64px', color: 'var(--accent-cyan)' },
    { symbol: `/${chars[1] || 'p'}/`, conf: '89%', width: '48px', color: 'var(--accent-blue)' },
    { symbol: `/${chars[2] || 'i'}/`, conf: '74%', width: '32px', color: 'var(--text-secondary)' }
  ];

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '900px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 7: AI Speech Model</h2>
        <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          The Log-Mel Spectrogram is sent into a trained Transformer-based Speech Recognition model.
          The model scans audio patterns to predict acoustic phoneme probabilities for your spoken words.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', margin: '3rem 0', flexWrap: 'wrap' }}>
          
          {/* Input: Spectrogram Icon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
          >
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(45deg, #FF9500, #FF2D55)', borderRadius: '8px' }}></div>
            <div style={{ fontSize: '0.8rem', marginTop: '10px', color: 'var(--text-secondary)' }}>Spectrogram</div>
          </motion.div>

          <ArrowRight color="var(--text-secondary)" />

          {/* Model Architecture */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[1, 2, 3].map((layer, i) => (
              <motion.div
                key={layer}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.3, duration: 0.5 }}
                style={{
                  width: '80px',
                  height: '120px',
                  background: 'rgba(10, 132, 255, 0.1)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Flowing particles */}
                <motion.div
                  animate={{ y: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear', delay: i * 0.2 }}
                  style={{ position: 'absolute', width: '100%', height: '40px', background: 'linear-gradient(0deg, transparent, var(--accent-blue-glow), transparent)' }}
                />
                <span style={{ fontSize: '0.8rem', zIndex: 1, fontWeight: 'bold' }}>Encoder<br/>Layer {layer}</span>
              </motion.div>
            ))}
          </div>

          <ArrowRight color="var(--text-secondary)" />

          {/* Output: Probabilities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'left', minWidth: '170px' }}
          >
            <div style={{ fontSize: '0.8rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>Phoneme Probabilities</div>
            {phonemes.map((ph, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: idx === phonemes.length - 1 ? 0 : '6px' }}>
                <span style={{ width: '24px', fontFamily: 'monospace', fontWeight: 600 }}>{ph.symbol}</span>
                <div style={{ width: ph.width, height: '6px', background: ph.color, borderRadius: '3px' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ph.conf}</span>
              </div>
            ))}
          </motion.div>

        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          <button className="btn-primary" onClick={onNext} style={{ marginTop: '1.5rem' }}>Continue</button>
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export default function FrequencyDomain({ onNext }) {
  const canvasRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState({ x: 0, y: 0, freq: 0, type: '' });
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Synthetic frequency data representing speech
    const freqs = Array.from({ length: 60 }, (_, i) => {
      const freqHz = i * 100; // 0 to 6000Hz
      let amp = Math.random() * 0.1;
      // Fundamental F0 (~120Hz male, ~200Hz female) - Let's put a peak at 200Hz
      if (i === 2) amp = 0.9;
      // Harmonics at multiples (400, 600, 800)
      if (i === 4) amp = 0.6;
      if (i === 6) amp = 0.4;
      if (i === 8) amp = 0.2;
      return { freq: freqHz, amp };
    });

    let frame = 0;
    let reqId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(40, height - 20);
      ctx.lineTo(width - 10, height - 20);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '12px Inter';
      ctx.fillText('Amplitude', 10, 20);
      ctx.fillText('Frequency (Hz) →', width - 110, height - 5);

      // Draw peaks
      const barWidth = (width - 60) / freqs.length;
      freqs.forEach((data, i) => {
        const x = 45 + i * barWidth;
        const currentAmp = data.amp * (0.9 + Math.sin(frame * 0.1 + i) * 0.1); // subtle breathing
        const h = currentAmp * (height - 40);
        const y = height - 20 - h;
        
        ctx.fillStyle = (i === 2) ? 'var(--accent-cyan)' : 'var(--accent-blue)';
        if (i === 4 || i === 6 || i === 8) ctx.fillStyle = '#FF9500'; // Harmonics color

        ctx.fillRect(x, y, barWidth - 2, h);
      });

      frame++;
      reqId = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      if (mx > 40 && mx < width - 10 && my > 10 && my < height - 20) {
        const barWidth = (width - 60) / freqs.length;
        const index = Math.floor((mx - 45) / barWidth);
        
        if (index >= 0 && index < freqs.length) {
          const isFundamental = index === 2;
          const isHarmonic = [4, 6, 8].includes(index);
          let type = 'Background / Noise';
          if (isFundamental) type = 'Fundamental Frequency (Pitch)';
          if (isHarmonic) type = 'Harmonic (Timbre)';

          setTooltipInfo({ x: e.clientX, y: e.clientY - 40, freq: freqs[index].freq, type });
          setShowTooltip(true);
          return;
        }
      }
      setShowTooltip(false);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => setShowTooltip(false));

    return () => {
      cancelAnimationFrame(reqId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '900px' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Stage 4: Frequency Domain</h2>
        
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          By applying a mathematical transform, we view the audio by <strong>Pitch</strong> instead of Time.<br/>
          Hover over the peaks. The tallest peak is your Fundamental Frequency, giving your voice its core pitch.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <canvas ref={canvasRef} width="800" height="250" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', cursor: 'crosshair', border: '1px solid var(--glass-border)' }}></canvas>
        </div>

        {showTooltip && (
          <div style={{
            position: 'fixed',
            left: tooltipInfo.x + 10,
            top: tooltipInfo.y,
            background: 'var(--bg-tertiary)',
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{tooltipInfo.freq} Hz</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tooltipInfo.type}</div>
          </div>
        )}

        <motion.div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button className="btn-secondary" onClick={() => setShowMore(!showMore)}>
              <Info size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
              Why Frequency Domain?
            </button>
            <button className="btn-primary" onClick={onNext}>Continue</button>
          </div>

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', textAlign: 'left' }}
              >
                <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Engineering Significance</h4>
                <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
                  <li><strong>Pitch Detection:</strong> Identifying the exact musical note or vocal tone.</li>
                  <li><strong>Noise Cancellation:</strong> Filtering out constant hums (like an AC unit at 60Hz).</li>
                  <li><strong>Vowel Recognition:</strong> Different vowels have distinct harmonic patterns called formants.</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

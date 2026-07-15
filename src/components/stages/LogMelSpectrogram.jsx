import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export default function LogMelSpectrogram({ onNext }) {
  const canvasRef = useRef(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let time = 0;
    let reqId;

    // Create a color map function (magma/inferno like)
    const getColor = (value) => {
      // value from 0 to 1
      const r = Math.floor(value * 255);
      const g = Math.floor(Math.pow(value, 2) * 200);
      const b = Math.floor(Math.pow(value, 3) * 150);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const draw = () => {
      // Shift canvas left
      const imageData = ctx.getImageData(1, 0, width - 1, height);
      ctx.putImageData(imageData, 0, 0);

      // Draw new column on the right
      for (let y = 0; y < height; y++) {
        // Generate pseudo-spectrogram data
        const freqY = y / height;
        const noise = Math.random() * 0.2;
        
        // Simulating speech formants
        let intensity = noise;
        if (Math.abs(freqY - 0.8) < 0.05) intensity += Math.sin(time * 0.1) * 0.5 + 0.5; // F1
        if (Math.abs(freqY - 0.5) < 0.05) intensity += Math.sin(time * 0.15) * 0.4 + 0.4; // F2
        if (Math.abs(freqY - 0.3) < 0.05) intensity += Math.sin(time * 0.05) * 0.3 + 0.3; // F3
        
        intensity = Math.min(1, Math.max(0, intensity)); // clamp
        
        ctx.fillStyle = getColor(intensity);
        ctx.fillRect(width - 1, y, 1, 1);
      }

      time += 0.5;
      reqId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(reqId);
  }, []);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '900px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 6: Log-Mel Spectrogram</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Humans do not hear every frequency equally. 
          To better represent human hearing, the frequency spectrum is converted into a Log-Mel Spectrogram.
          This representation captures the most important information needed for speech recognition.
        </p>

        <div style={{ position: 'relative', margin: '2rem auto', width: 'max-content' }}>
          <div style={{ position: 'absolute', left: '-40px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Frequency</div>
          <canvas ref={canvasRef} width="700" height="250" style={{ borderRadius: '8px', border: '1px solid var(--glass-border)' }}></canvas>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px' }}>Time →</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => setShowMore(!showMore)}>
            <Info size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
            Learn More
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
              <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>How to read a Spectrogram</h4>
              <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
                <li><strong>Horizontal Axis:</strong> Time (flowing left to right).</li>
                <li><strong>Vertical Axis:</strong> Frequency (Pitch). Lower frequencies are at the bottom.</li>
                <li><strong>Color Intensity:</strong> Brightness indicates the amplitude (loudness) of that frequency at that specific time.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

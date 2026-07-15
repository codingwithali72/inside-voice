import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function DigitalAudio({ onNext }) {
  const canvasRef = useRef(null);
  const [animationPhase, setAnimationPhase] = useState('analog'); // analog -> converting -> digital

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let frame = 0;
    let reqId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw center line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 3;
      
      if (animationPhase === 'analog' || animationPhase === 'converting') {
        ctx.strokeStyle = '#0A84FF';
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + frame * 0.05) * 50 * Math.sin(x * 0.01);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (animationPhase === 'digital' || animationPhase === 'converting') {
        ctx.fillStyle = '#32ADE6';
        const step = animationPhase === 'converting' ? 20 : 10;
        for (let x = 0; x < width; x += step) {
          const y = height / 2 + Math.sin(x * 0.05 + frame * 0.05) * 50 * Math.sin(x * 0.01);
          
          if (animationPhase === 'digital') {
            // Draw stem
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(50, 173, 230, 0.3)';
            ctx.lineWidth = 1;
            ctx.moveTo(x, height / 2);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          
          // Draw sample dot
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frame++;
      reqId = requestAnimationFrame(draw);
    };

    draw();

    // Sequence the animation
    const t1 = setTimeout(() => setAnimationPhase('converting'), 3000);
    const t2 = setTimeout(() => setAnimationPhase('digital'), 6000);

    return () => {
      cancelAnimationFrame(reqId);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [animationPhase]);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Stage 2: Digital Audio</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          The computer cannot understand continuous air vibrations.
          It converts your voice into thousands of digital samples every second.
          This digital representation is called PCM audio.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <canvas ref={canvasRef} width="600" height="200" style={{ background: '#000', borderRadius: '8px' }}></canvas>
        </div>

        <div style={{ textAlign: 'center', minHeight: '60px' }}>
          {animationPhase === 'analog' && <p>Continuous Analog Signal...</p>}
          {animationPhase === 'converting' && <p className="accent-text">Sampling...</p>}
          {animationPhase === 'digital' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem', fontWeight: 600 }}>Digitized successfully!</p>
              <button className="btn-primary" onClick={onNext}>Continue</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

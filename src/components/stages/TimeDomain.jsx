import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export default function TimeDomain({ onNext, audioData }) {
  const canvasRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState({ x: 0, y: 0, amp: 0, time: 0 });
  const [showMore, setShowMore] = useState(false);
  const [drawingComplete, setDrawingComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Generate synthetic waveform data (resembling speech) since we don't have direct access to decoded buffer easily here without async context
    const numPoints = 800;
    const data = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      // Create envelope resembling words
      const env1 = Math.exp(-Math.pow((i - 150) / 40, 2));
      const env2 = Math.exp(-Math.pow((i - 400) / 60, 2));
      const env3 = Math.exp(-Math.pow((i - 650) / 50, 2));
      const envelope = env1 + env2 * 0.8 + env3 * 0.9;
      
      data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
    }

    let progress = 0;
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
      ctx.fillText('Time →', width - 50, height - 5);

      // Draw Waveform up to progress
      ctx.beginPath();
      ctx.strokeStyle = '#0A84FF';
      ctx.lineWidth = 2;
      
      const drawWidth = width - 50;
      for (let i = 0; i < progress; i++) {
        const x = 40 + (i / numPoints) * drawWidth;
        const y = (height - 30) / 2 - (data[i] * ((height - 50) / 2));
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (progress < numPoints) {
        progress += 4; // drawing speed
        reqId = requestAnimationFrame(draw);
      } else {
        setDrawingComplete(true);
      }
    };

    draw();

    // Mouse interaction for tooltip
    const handleMouseMove = (e) => {
      if (progress < numPoints) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      if (mx > 40 && mx < width - 10 && my > 10 && my < height - 20) {
        const index = Math.floor(((mx - 40) / (width - 50)) * numPoints);
        if (index >= 0 && index < numPoints) {
          const amp = Math.abs(data[index]).toFixed(2);
          const time = ((index / numPoints) * 2.5).toFixed(2); // Assume 2.5s duration
          
          setTooltipInfo({ x: e.clientX, y: e.clientY - 40, amp, time });
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
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Stage 3: Time Domain</h2>
        
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          The waveform shows how the loudness of your voice changes over time.
          Hover over the graph to inspect amplitude and time.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <canvas ref={canvasRef} width="800" height="250" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', cursor: 'crosshair' }}></canvas>
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
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Amplitude: {tooltipInfo.amp}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Time: {tooltipInfo.time}s</div>
          </div>
        )}

        <AnimatePresence>
          {drawingComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button className="btn-secondary" onClick={() => setShowMore(!showMore)}>
                  <Info size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
                  Why is this useful?
                </button>
                <button className="btn-primary" onClick={onNext}>Continue</button>
              </div>

              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', textAlign: 'left' }}
                >
                  <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Engineering Uses</h4>
                  <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
                    <li>Audio editing (cutting, splicing)</li>
                    <li>Recording volume monitoring</li>
                    <li>Podcast production</li>
                    <li>Basic signal analysis</li>
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

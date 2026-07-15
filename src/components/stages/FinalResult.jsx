import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';

export default function FinalResult({ onNext, reset, audioData, transcribedText }) {
  const playAudio = () => {
    if (audioData && audioData.url) {
      const audio = new Audio(audioData.url);
      audio.play();
    }
  };

  const finalSentence = transcribedText ? transcribedText : "Hello Everyone Welcome to Inside Voice";

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 9: Final Result</h2>
        <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          Your voice has successfully been transformed into text through the modern AI pipeline.
        </p>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, rgba(10,132,255,0.1), rgba(50,173,230,0.05))',
            border: '1px solid var(--accent-blue)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 10px 40px rgba(10, 132, 255, 0.15)'
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem', color: '#fff', textTransform: 'capitalize' }}>
            "{finalSentence}"
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>98.7%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Language</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>English (US)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processing Time</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>245ms</div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn-secondary" onClick={playAudio} disabled={!audioData} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} /> Replay Original Audio
          </button>
          <button className="btn-primary" onClick={onNext}>Explore Timeline & Real-world Uses</button>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <button onClick={reset} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto', fontFamily: 'inherit', fontSize: '1rem' }}>
            <RotateCcw size={14} /> Restart Journey
          </button>
        </div>
      </div>
    </div>
  );
}

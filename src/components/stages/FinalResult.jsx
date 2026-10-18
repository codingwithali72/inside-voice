import { motion } from 'framer-motion';
import { Play, RotateCcw, CheckCircle, Volume2, ArrowRight } from 'lucide-react';

export default function FinalResult({ onNext, reset, audioData, transcribedText }) {
  const playAudio = () => {
    if (audioData && audioData.url) {
      const audio = new Audio(audioData.url);
      audio.play().catch(e => console.warn("Audio playback issue:", e));
    } else if ('speechSynthesis' in window && finalSentence) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(finalSentence);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const rawSentence = (transcribedText || '').trim();
  // Format with capitalized first letter
  const finalSentence = rawSentence ? (rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1)) : "Voice recognized";

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '820px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 9: Final Result</h2>
        <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
          Your acoustic voice vibrations have successfully journeyed through the entire AI speech recognition pipeline.
        </p>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.7 }}
          style={{
            background: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(50,173,230,0.06))',
            border: '1px solid var(--accent-blue)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
            boxShadow: '0 12px 40px rgba(10, 132, 255, 0.18)'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            <CheckCircle size={16} /> Recognized Voice Text
          </div>

          <div style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            marginBottom: '1.75rem',
            color: '#ffffff',
            lineHeight: 1.35,
            wordBreak: 'break-word'
          }}>
            "{finalSentence}"
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>98.9%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Acoustic Model</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>Transformer</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pipeline Latency</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>245ms</div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={playAudio}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Volume2 size={18} /> Play Voice Text
          </button>
          <button
            className="btn-primary"
            onClick={onNext}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Explore Interactive Timeline <ArrowRight size={18} />
          </button>
        </div>
        
        <div style={{ marginTop: '2.5rem' }}>
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: '0 auto',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <RotateCcw size={15} /> Restart Journey with New Voice Input
          </button>
        </div>
      </div>
    </div>
  );
}

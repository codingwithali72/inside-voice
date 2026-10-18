import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function LanguageUnderstanding({ onNext, transcribedText }) {
  const [textIndex, setTextIndex] = useState(0);
  
  // Safely parse words from the actual user's speech
  const cleanText = (transcribedText || '').trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : ["Voice", "input"];
  
  const progression = ["Listening & decoding context..."];
  let currentString = "";
  for (let i = 0; i < words.length; i++) {
    currentString += (i === 0 ? "" : " ") + words[i];
    progression.push(currentString);
  }

  useEffect(() => {
    if (textIndex < progression.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, textIndex === 0 ? 900 : 400);
      return () => clearTimeout(timer);
    }
  }, [textIndex, progression.length]);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '820px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 8: Language Understanding</h2>
        <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
          The language model evaluates surrounding tokens to disambiguate homophones and ensure grammatical coherence in your phrase.
        </p>

        {/* Real-time Word Stream */}
        <div style={{
          minHeight: '130px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-tertiary)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          margin: '2rem 0',
          position: 'relative',
          overflow: 'hidden',
          padding: '1.5rem'
        }}>
          {/* Subtle background pulse */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, var(--accent-blue-glow) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{
                fontSize: '1.6rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                padding: '0 20px',
                color: textIndex === 0 ? 'var(--text-secondary)' : '#ffffff'
              }}
            >
              {progression[textIndex]}
              {textIndex < progression.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ display: 'inline-block', marginLeft: '6px', color: 'var(--accent-cyan)' }}
                >
                  |
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic Contextual Token Badges */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {words.map((word, idx) => {
            const isProcessed = textIndex > idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isProcessed ? 1 : 0.4,
                  scale: isProcessed ? 1 : 0.95,
                  borderColor: isProcessed ? 'var(--accent-cyan)' : 'var(--glass-border)',
                  background: isProcessed ? 'rgba(50, 173, 230, 0.15)' : 'var(--glass-bg)'
                }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: isProcessed ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {isProcessed && <CheckCircle2 size={13} color="var(--accent-cyan)" />}
                <span>{word}</span>
              </motion.div>
            );
          })}
        </div>

        {textIndex === progression.length - 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <button className="btn-primary" onClick={onNext} style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} /> See Final Result
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

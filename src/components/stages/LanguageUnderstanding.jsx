import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageUnderstanding({ onNext, transcribedText }) {
  const [textIndex, setTextIndex] = useState(0);
  
  // Create a progression array based on the actual transcribed text
  const words = transcribedText ? transcribedText.split(' ') : ["Hello", "Everyone", "Welcome", "to", "Inside", "Voice"];
  const progression = ["Listening..."];
  
  let currentString = "";
  for (let i = 0; i < words.length; i++) {
    currentString += (i === 0 ? "" : " ") + words[i];
    progression.push(currentString);
  }

  useEffect(() => {
    if (textIndex < progression.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, textIndex === 0 ? 1500 : 600); // slightly faster reveal
      return () => clearTimeout(timer);
    }
  }, [textIndex, progression.length]);

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 8: Language Understanding</h2>
        <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          The model predicts words using both sound and context.<br/>
          By looking at surrounding words, it corrects errors and improves recognition accuracy dynamically.
        </p>

        <div style={{
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-tertiary)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          margin: '2rem 0',
          position: 'relative',
          overflow: 'hidden'
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
              transition={{ duration: 0.3 }}
              style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.02em', padding: '0 20px' }}
            >
              {progression[textIndex]}
              {textIndex < progression.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ display: 'inline-block', marginLeft: '5px', color: 'var(--accent-cyan)' }}
                >
                  |
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {textIndex === progression.length - 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <button className="btn-primary" onClick={onNext} style={{ marginTop: '1rem' }}>See Final Result</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function Home({ onNext }) {
  return (
    <div className="stage-container" style={{ textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto',
          boxShadow: '0 0 40px var(--accent-blue-glow)',
          animation: 'pulseGlow 4s infinite'
        }}>
          <Mic size={48} color="var(--accent-blue)" />
        </div>
        
        <h1 className="gradient-text" style={{ marginBottom: '1rem' }}>Inside Voice</h1>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          See How Computers Understand Human Speech.
          <br /><br />
          <span style={{ fontSize: '1.1rem', fontWeight: 400 }}>
            Follow your voice through every stage of modern speech recognition. 
            Speak once. Watch your voice travel through the complete recognition pipeline.
          </span>
        </h3>
        
        <button className="btn-primary" onClick={onNext} style={{ padding: '16px 40px', fontSize: '1.2rem' }}>
          Start Journey
        </button>
      </motion.div>
    </div>
  );
}

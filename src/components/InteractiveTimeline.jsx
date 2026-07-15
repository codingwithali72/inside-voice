import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity, Waves, SplitSquareHorizontal, LineChart, LayoutGrid, Brain, MessageSquare, CheckCircle, RotateCcw, ActivitySquare } from 'lucide-react';

const timelineSteps = [
  { id: 1, title: 'Voice', icon: Mic, desc: 'Acoustic waves created by your vocal cords.' },
  { id: 2, title: 'Digital Audio', icon: Activity, desc: 'Continuous waves digitized into discrete samples (PCM).' },
  { id: 3, title: 'Time Domain', icon: Waves, desc: 'Amplitude mapped over time in the Time Domain.' },
  { id: 4, title: 'Frequency Domain', icon: ActivitySquare, desc: 'Analyzing the dominant pitch and harmonics of the sound.' },
  { id: 5, title: 'Frames', icon: SplitSquareHorizontal, desc: 'Dividing audio into tiny 25ms overlapping windows.' },
  { id: 6, title: 'STFT', icon: LineChart, desc: 'Extracting the frequencies present in each frame.' },
  { id: 7, title: 'Log-Mel Spectrogram', icon: LayoutGrid, desc: 'A visual heat map scaled to mimic human hearing.' },
  { id: 8, title: 'Transformer Model', icon: Brain, desc: 'Neural network finding patterns and predicting phonemes.' },
  { id: 9, title: 'Language Understanding', icon: MessageSquare, desc: 'Using context to form grammatically correct sentences.' },
  { id: 10, title: 'Recognized Text', icon: CheckCircle, desc: 'The final, accurate text output.' }
];

const applications = [
  { title: 'Google Assistant / Siri', desc: 'Personal voice assistants on smart devices.' },
  { title: 'ChatGPT Voice', desc: 'Real-time conversational AI.' },
  { title: 'Automatic Captions', desc: 'Accessibility for videos and live streams.' },
  { title: 'Medical Dictation', desc: 'Fast charting for doctors.' },
  { title: 'Voice Search', desc: 'Hands-free web navigation.' },
  { title: 'Meeting Transcription', desc: 'Automated minutes and notes.' }
];

export default function InteractiveTimeline({ reset }) {
  const [selectedStep, setSelectedStep] = useState(null);

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="gradient-text" style={{ marginBottom: '1rem' }}>The Complete Journey</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          You have seen how a computer transforms human speech into text. Click on any stage below to review what happens and why it is necessary.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>
        {timelineSteps.map((step, index) => {
          const Icon = step.icon;
          const isSelected = selectedStep?.id === step.id;
          
          return (
            <motion.div
              key={step.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedStep(isSelected ? null : step)}
              style={{
                background: isSelected ? 'rgba(10, 132, 255, 0.2)' : 'var(--glass-bg)',
                border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                borderRadius: '12px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 20px var(--accent-blue-glow)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                <Icon size={32} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{step.title}</div>
              
              {/* Connector line except for last item */}
              {index < timelineSteps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--glass-border)'
                }}>
                  →
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedStep && (
          <motion.div
            key={selectedStep.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', marginBottom: '4rem' }}
          >
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <selectedStep.icon /> {selectedStep.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
              {selectedStep.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Real World Applications</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {applications.map((app, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{app.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{app.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '5rem', paddingBottom: '3rem' }}>
        <button className="btn-primary" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto', padding: '16px 32px' }}>
          <RotateCcw size={20} /> Restart The Journey
        </button>
      </div>
    </div>
  );
}

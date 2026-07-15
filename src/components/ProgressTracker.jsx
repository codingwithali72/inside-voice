import { Mic, Waves, Activity, SplitSquareHorizontal, LineChart, LayoutGrid, Brain, MessageSquare, CheckCircle, ActivitySquare } from 'lucide-react';

const steps = [
  { id: 1, label: 'Capture Voice', icon: Mic },
  { id: 2, label: 'Digital Audio', icon: Activity },
  { id: 3, label: 'Time Domain', icon: Waves },
  { id: 4, label: 'Frequency Domain', icon: ActivitySquare },
  { id: 5, label: 'Frames', icon: SplitSquareHorizontal },
  { id: 6, label: 'STFT', icon: LineChart },
  { id: 7, label: 'Spectrogram', icon: LayoutGrid },
  { id: 8, label: 'AI Model', icon: Brain },
  { id: 9, label: 'Understanding', icon: MessageSquare },
  { id: 10, label: 'Text', icon: CheckCircle },
];

export default function ProgressTracker({ currentStage }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '1.5rem',
      zIndex: 100,
      background: 'rgba(5, 5, 5, 0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    }}>
      {steps.map((step) => {
        const Icon = step.icon;
        const isActive = currentStage === step.id;
        const isPast = currentStage > step.id;
        
        return (
          <div key={step.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: isActive || isPast ? 1 : 0.4,
            transition: 'all 0.3s ease',
            color: isActive ? 'var(--accent-cyan)' : isPast ? 'var(--accent-blue)' : 'var(--text-secondary)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? 'var(--glass-bg)' : 'transparent',
              border: `2px solid ${isActive ? 'var(--accent-cyan)' : isPast ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
              boxShadow: isActive ? '0 0 15px var(--accent-cyan-glow)' : 'none'
            }}>
              <Icon size={18} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 600 : 400 }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

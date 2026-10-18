import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Globe } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText, transcribedText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState(transcribedText || '');
  const [hasRecorded, setHasRecorded] = useState(Boolean(transcribedText));
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startRecording = () => {
    stopEverything();
    setSpeechError('');
    setSpokenText('');
    setTranscribedText('');
    isRecordingRef.current = true;
    setIsRecording(true);
    setHasRecorded(false);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.');
      setIsRecording(false);
      isRecordingRef.current = false;
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stays active without terminating
      recognition.interimResults = true; // Syllable-by-syllable live words
      recognition.lang = selectedLang;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript;
        }
        if (full) {
          setSpokenText(full);
          setTranscribedText(full);
        }
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition notice:', e.error);
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic access in your browser address bar.');
        } else if (e.error === 'network') {
          setSpeechError('Network error reaching speech recognition service. Please check internet connection.');
        }
      };

      recognition.onend = () => {
        // If Chrome pauses but user didn't click stop, keep listening
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (err) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      drawAnimatedWave();
    } catch (err) {
      console.error('Recognition error:', err);
      setSpeechError('Could not start speech recognition: ' + err.message);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setHasRecorded(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Organic, glowing voice visualizer with zero hardware conflicts
  const drawAnimatedWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let phase = 0;

    const render = () => {
      phase += 0.08;
      ctx.fillStyle = 'rgba(5, 5, 5, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Center guide line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Glowing voice harmonic layers
      const layers = [
        { color: 'rgba(10, 132, 255, 0.35)', amp: 30, freq: 0.02, speed: 1.0 },
        { color: 'rgba(50, 173, 230, 0.6)', amp: 42, freq: 0.03, speed: 1.4 },
        { color: '#32ADE6', amp: 24, freq: 0.045, speed: 1.8 }
      ];

      layers.forEach((l) => {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = l.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0A84FF';

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height / 2 + Math.sin(x * l.freq + phase * l.speed) * l.amp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      if (isRecordingRef.current) {
        animationRef.current = requestAnimationFrame(render);
      }
    };
    render();
  };

  const handleContinue = () => {
    const text = spokenText.trim();
    if (text) {
      setTranscribedText(text);
      onNext();
    }
  };

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '820px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Stage 1: Capturing Your Voice</h2>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Click start and speak naturally. Every word you say will appear live below.
        </p>

        {/* Accent / Dialect Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <Globe size={15} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recognition Model:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: '#fff',
              padding: '4px 10px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: isRecording ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="en-IN" style={{ background: '#1c1c1e', color: '#fff' }}>🇮🇳 English (India) - Recommended</option>
            <option value="en-US" style={{ background: '#1c1c1e', color: '#fff' }}>🇺🇸 English (US)</option>
            <option value="en-GB" style={{ background: '#1c1c1e', color: '#fff' }}>🇬🇧 English (UK)</option>
          </select>
        </div>

        {speechError && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 69, 58, 0.15)', border: '1px solid rgba(255, 69, 58, 0.4)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#ff453a' }}>
            {speechError}
          </div>
        )}

        {/* Waveform Canvas */}
        <canvas
          ref={canvasRef}
          width="650"
          height="130"
          style={{
            background: '#050505',
            display: isRecording || hasRecorded ? 'block' : 'none',
            margin: '0 auto 1.5rem auto',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            width: '100%',
            maxWidth: '650px'
          }}
        />

        {/* Start / Stop Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          {!isRecording ? (
            <button
              className="btn-primary"
              onClick={startRecording}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '1rem 2.5rem', fontSize: '1.15rem' }}
            >
              <Mic size={22} /> {hasRecorded ? 'Record Again' : 'Start Recording'}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={stopRecording}
              style={{
                background: 'linear-gradient(135deg, #ff453a 0%, #d70015 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '1rem 2.5rem',
                fontSize: '1.15rem',
                boxShadow: '0 4px 16px rgba(255, 69, 58, 0.4)'
              }}
            >
              <Square size={20} /> Stop Recording
            </button>
          )}
        </div>

        {/* Live Speech Text Display */}
        <div style={{
          width: '100%',
          maxWidth: '650px',
          margin: '0 auto 2rem auto',
          padding: '1.5rem',
          background: 'rgba(10, 132, 255, 0.08)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.85rem', color: isRecording ? '#30d158' : 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isRecording && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#30d158', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
            {isRecording ? 'Listening live... Speak as much as you want' : 'Captured Text:'}
          </div>

          <textarea
            value={spokenText}
            onChange={(e) => {
              setSpokenText(e.target.value);
              setTranscribedText(e.target.value);
            }}
            placeholder={isRecording ? "Listening to your words in real time..." : "Your spoken words will appear here. You can also edit or type directly."}
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.35rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              lineHeight: 1.4,
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        {/* Continue Button */}
        {spokenText.trim() && !isRecording && (
          <button
            className="btn-primary"
            onClick={handleContinue}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.85rem 2.2rem', fontSize: '1.1rem' }}
          >
            <Check size={20} /> Continue Journey
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, RotateCcw } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText, transcribedText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState(transcribedText || '');
  const [hasRecorded, setHasRecorded] = useState(Boolean(transcribedText));
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
    }
  };

  const startRecording = async () => {
    setSpokenText('');
    setTranscribedText('');
    audioChunksRef.current = [];
    setIsRecording(true);
    setHasRecorded(false);

    // 1. Web Speech API - Voice to Text
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSpokenText(transcript);
          setTranscribedText(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech error:', event.error);
      };

      recognition.onend = () => {
        // If user is still recording, keep it active
        if (recognitionRef.current === recognition && isRecording) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }

    // 2. Microphone audio stream & Waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioData({ blob, url });
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();

      drawWave();
    } catch (err) {
      console.warn('Mic audio stream notice:', err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const drawWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);

    const render = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(data);
      
      ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#32ADE6';
      ctx.beginPath();
      const slice = width / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
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
        <h2 style={{ marginBottom: '1rem' }}>Stage 1: Capturing Your Voice</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Click start and speak anything into your microphone.
        </p>

        {/* Waveform Canvas */}
        <canvas
          ref={canvasRef}
          width="650"
          height="140"
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

        {/* Buttons: Start / Stop */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
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

        {/* Live / Captured Text Box */}
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
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isRecording ? '🔴 Listening... (speak now)' : 'What was heard:'}
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
              fontSize: '1.3rem',
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

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Volume2 } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText, transcribedText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState(transcribedText || '');
  const [hasRecorded, setHasRecorded] = useState(Boolean(transcribedText));
  const [micVolume, setMicVolume] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    isRecordingActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
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
    stopEverything();
    setSpokenText('');
    setTranscribedText('');
    audioChunksRef.current = [];
    isRecordingActiveRef.current = true;
    setIsRecording(true);
    setHasRecorded(false);

    // 1. Web Speech API - True continuous speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stays active for long sentences and continuous speech
      recognition.interimResults = true; // Live instant words while speaking

      recognition.onresult = (event) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript;
        }
        if (fullText) {
          setSpokenText(fullText);
          setTranscribedText(fullText);
        }
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition notice:', e.error);
      };

      recognition.onend = () => {
        // If Chrome stops after a long silence but user is still in recording mode, restart
        if (isRecordingActiveRef.current) {
          try {
            recognition.start();
          } catch (err) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start notice:', err);
      }
    }

    // 2. Microphone stream with AGC (Automatic Gain Control) & Waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true, // Automatically amplifies quiet and conversational voices
          echoCancellation: true,
          noiseSuppression: false
        }
      });
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
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
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
      console.warn('Mic stream notice:', err);
    }
  };

  const stopRecording = () => {
    isRecordingActiveRef.current = false;
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

      // Simple mic volume visualizer
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const diff = (data[i] - 128) / 128;
        sum += diff * diff;
      }
      const vol = Math.min(100, Math.round(Math.sqrt(sum / data.length) * 300));
      setMicVolume(vol);

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

      if (isRecordingActiveRef.current) {
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
        <p style={{ marginBottom: '1.75rem', color: 'var(--text-secondary)' }}>
          Click start and say any sentence into your microphone.
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

        {/* Start / Stop Button & Volume Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '320px' }}>
              <Volume2 size={16} color="var(--accent-cyan)" />
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(5, micVolume)}%`, background: 'var(--accent-cyan)', transition: 'width 0.1s' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Hearing you</span>
            </div>
          )}

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

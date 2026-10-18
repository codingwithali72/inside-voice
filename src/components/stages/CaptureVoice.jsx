import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Edit3, RotateCcw, Volume2, Sparkles } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText, transcribedText }) {
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'recording' | 'finished'
  const [streamError, setStreamError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Real-time speech states
  const [liveTranscript, setLiveTranscript] = useState('');
  const [capturedText, setCapturedText] = useState(transcribedText || '');
  const [isEditing, setIsEditing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    return () => {
      isRecordingRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        try { mediaRecorder.current.stop(); } catch (e) {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (audioContext.current && audioContext.current.state !== 'closed') {
        try { audioContext.current.close(); } catch (e) {}
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setStreamError(false);
      setErrorMessage('');
      setLiveTranscript('');
      accumulatedTranscriptRef.current = '';
      audioChunks.current = [];
      isRecordingRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);

      const bufferLength = analyser.current.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);

      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioData({ blob: audioBlob, url: audioUrl });
        stream.getTracks().forEach(track => track.stop());
      };

      // Set up Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = 0; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }

          const combined = (final + interim).trim();
          if (combined) {
            accumulatedTranscriptRef.current = combined;
            setLiveTranscript(combined);
            setCapturedText(combined);
            setTranscribedText(combined);
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition notice:", event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Speech recognition permission blocked by browser.');
          } else if (event.error === 'network') {
            console.warn('Network issue reaching speech recognition service. Manual editing available.');
          }
        };

        recognition.onend = () => {
          // Restart if still marked as recording (Chrome ends automatically on pauses)
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch (err) {
              // Ignore if already active
            }
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.warn('Recognition start exception:', e);
        }
      } else {
        setSpeechSupported(false);
      }

      mediaRecorder.current.start();
      setRecordingStatus('recording');
      drawWaveform();
    } catch (err) {
      console.error("Error accessing mic:", err);
      setStreamError(true);
      setErrorMessage('Microphone access denied or not found. Please check permissions.');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try { mediaRecorder.current.stop(); } catch (e) {}
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setRecordingStatus('finished');

    // If speech was captured, ensure it's propagated
    const finalSpoken = accumulatedTranscriptRef.current.trim() || liveTranscript.trim() || capturedText.trim();
    if (finalSpoken) {
      setCapturedText(finalSpoken);
      setTranscribedText(finalSpoken);
    } else {
      // Default placeholder if the mic was completely silent or offline
      const fallback = "Understand what I said";
      setCapturedText(fallback);
      setTranscribedText(fallback);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setCapturedText(val);
    setTranscribedText(val);
  };

  const handleContinue = () => {
    const textToCommit = (capturedText || '').trim() || "Understand what I said";
    setTranscribedText(textToCommit);
    onNext();
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyser.current || !dataArray.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyser.current.getByteTimeDomainData(dataArray.current);
    ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#32ADE6';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0A84FF';
    ctx.beginPath();

    const sliceWidth = (width * 1.0) / dataArray.current.length;
    let x = 0;

    for (let i = 0; i < dataArray.current.length; i++) {
      const v = dataArray.current[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isRecordingRef.current) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '820px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 1: Capturing Your Voice</h2>
        
        {streamError ? (
          <div style={{ padding: '2rem', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.3)', margin: '2rem 0' }}>
            <p style={{ color: '#ff453a', fontWeight: 500, marginBottom: '1rem' }}>{errorMessage || 'Microphone access denied.'}</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You can still type what you would say to test the pipeline:
            </p>
            <input
              type="text"
              value={capturedText}
              onChange={handleTextChange}
              placeholder="e.g. Understand what I said"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--accent-blue)',
                color: '#fff',
                fontSize: '1.1rem',
                marginBottom: '1.5rem',
                outline: 'none'
              }}
            />
            <button className="btn-primary" onClick={handleContinue}>
              Continue with this phrase
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '2rem' }}>
              Speak any phrase into your microphone. Your voice will travel through the entire AI speech recognition pipeline.
            </p>
            
            {/* Waveform Canvas */}
            <canvas
              ref={canvasRef}
              width="650"
              height="140"
              style={{
                background: '#050505',
                display: recordingStatus === 'idle' ? 'none' : 'block',
                margin: '0 auto 1.5rem auto',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                width: '100%',
                maxWidth: '650px'
              }}
            />
            
            {/* IDLE STATE */}
            {recordingStatus === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={startRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    fontSize: '1.15rem'
                  }}
                >
                  <Mic size={22} /> Start Recording
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Say anything, e.g. <em>"Understand what I said"</em> or <em>"Testing speech recognition"</em>
                </span>
              </div>
            )}
            
            {/* RECORDING STATE */}
            {recordingStatus === 'recording' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--accent-cyan)',
                  marginBottom: '1rem',
                  fontWeight: 500
                }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ff453a',
                    boxShadow: '0 0 10px #ff453a',
                    animation: 'pulse 1.2s infinite'
                  }} />
                  Recording live audio...
                </div>

                {/* Live Speech Recognition Box */}
                <div style={{
                  width: '100%',
                  maxWidth: '650px',
                  padding: '1rem 1.25rem',
                  background: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.3)',
                  borderRadius: '10px',
                  marginBottom: '1.5rem',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  {liveTranscript ? (
                    <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 500 }}>
                      "{liveTranscript}"
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Listening to your voice... speak now
                    </span>
                  )}
                </div>

                <button
                  className="btn-primary"
                  onClick={stopRecording}
                  style={{
                    background: 'linear-gradient(135deg, #ff453a 0%, #d70015 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    margin: '0 auto',
                    boxShadow: '0 4px 14px 0 rgba(255, 69, 58, 0.4)'
                  }}
                >
                  <Square size={20} /> Stop Recording
                </button>
              </div>
            )}

            {/* FINISHED STATE */}
            {recordingStatus === 'finished' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '650px', margin: '0 auto' }}>
                <div style={{
                  width: '100%',
                  padding: '1.5rem',
                  background: 'rgba(10, 132, 255, 0.1)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: '14px',
                  marginBottom: '1.75rem',
                  textAlign: 'left',
                  boxShadow: '0 8px 24px rgba(10, 132, 255, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Sparkles size={16} /> Captured Voice Text
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <Edit3 size={14} /> {isEditing ? 'Done' : 'Edit Text'}
                    </button>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={capturedText}
                      onChange={handleTextChange}
                      placeholder="Type what you said..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid var(--accent-cyan)',
                        color: '#fff',
                        fontSize: '1.15rem',
                        fontWeight: 500,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '1.3rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      "{capturedText || 'Understand what I said'}"
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}>
                    This exact phrase will be traced step-by-step through the pipeline to the final result.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={startRecording}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                  >
                    <RotateCcw size={16} /> Re-record Voice
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleContinue}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}
                  >
                    <Check size={18} /> Continue Journey
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

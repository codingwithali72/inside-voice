import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Edit3, RotateCcw, Volume2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText, transcribedText }) {
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'recording' | 'processing' | 'finished' | 'no_speech'
  const [streamError, setStreamError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Real-time speech states
  const [liveTranscript, setLiveTranscript] = useState('');
  const [capturedText, setCapturedText] = useState(transcribedText || '');
  const [isEditing, setIsEditing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micVolume, setMicVolume] = useState(0);

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
  const audioStreamRef = useRef(null);
  const stopResolverRef = useRef(null);

  useEffect(() => {
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
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext.current && audioContext.current.state !== 'closed') {
        try { audioContext.current.close(); } catch (e) {}
      }
    };
  }, []);

  const startRecording = () => {
    setStreamError(false);
    setErrorMessage('');
    setLiveTranscript('');
    setMicVolume(0);
    accumulatedTranscriptRef.current = '';
    audioChunks.current = [];
    isRecordingRef.current = true;

    // 1. Initialize and start SpeechRecognition SYNCHRONOUSLY to preserve user gesture activation token
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
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
            setErrorMessage('Microphone access for speech recognition was blocked by the browser.');
          } else if (event.error === 'network') {
            setErrorMessage('Browser speech recognition cloud service timed out or was blocked.');
          }
        };

        recognition.onend = () => {
          // If still recording, keep recognition going (Chrome pauses on brief silence)
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch (err) {}
          } else if (stopResolverRef.current) {
            stopResolverRef.current();
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Synchronous speech start error:", err);
      }
    } else {
      setSpeechSupported(false);
    }

    // 2. Start hardware microphone capture & canvas visualizer in parallel
    initMicrophoneStream();
  };

  const initMicrophoneStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext.current = new AudioCtx();
      
      // Ensure AudioContext is actively resumed
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }

      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 512;
      analyser.current.smoothingTimeConstant = 0.7;
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

      mediaRecorder.current.start();
      setRecordingStatus('recording');
      drawWaveform();
    } catch (err) {
      console.error("Error accessing mic:", err);
      setStreamError(true);
      setErrorMessage('Microphone access denied. Please allow microphone permissions.');
      isRecordingRef.current = false;
    }
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    setRecordingStatus('processing');

    // Stop MediaRecorder
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try { mediaRecorder.current.stop(); } catch (e) {}
    }

    // Allow speech recognition engine up to 1200ms to flush its final phrase
    if (recognitionRef.current) {
      await new Promise(resolve => {
        stopResolverRef.current = resolve;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          resolve();
        }
        setTimeout(resolve, 1200);
      });
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const finalResult = (accumulatedTranscriptRef.current || liveTranscript || '').trim();
    if (finalResult) {
      setCapturedText(finalResult);
      setTranscribedText(finalResult);
      setRecordingStatus('finished');
    } else {
      // Honestly report no speech detected — DO NOT inject any fake fallback text!
      setCapturedText('');
      setRecordingStatus('no_speech');
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyser.current || !dataArray.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyser.current.getByteTimeDomainData(dataArray.current);

    // Calculate volume level for responsive feedback
    let sumSquares = 0;
    for (let i = 0; i < dataArray.current.length; i++) {
      const deviation = (dataArray.current[i] - 128) / 128;
      sumSquares += deviation * deviation;
    }
    const rms = Math.sqrt(sumSquares / dataArray.current.length);
    const calculatedVolume = Math.min(100, Math.round(rms * 250));
    setMicVolume(calculatedVolume);

    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw center reference guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw glowing speech waveform
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#32ADE6';
    ctx.shadowBlur = 10;
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

  const handleContinue = () => {
    const textToCommit = (capturedText || '').trim();
    if (textToCommit) {
      setTranscribedText(textToCommit);
      onNext();
    }
  };

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '820px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 1: Capturing Your Voice</h2>
        
        {streamError ? (
          <div style={{ padding: '2rem', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.3)', margin: '2rem 0' }}>
            <p style={{ color: '#ff453a', fontWeight: 600, marginBottom: '0.5rem' }}>{errorMessage || 'Microphone access denied.'}</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Please allow microphone access in your browser bar, or enter your sentence manually:
            </p>
            <input
              type="text"
              value={capturedText}
              onChange={e => { setCapturedText(e.target.value); setTranscribedText(e.target.value); }}
              placeholder="Type your phrase here..."
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
            <button className="btn-primary" onClick={handleContinue} disabled={!capturedText.trim()}>
              Continue with this phrase
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '2rem' }}>
              Speak any phrase into your microphone. Your actual spoken words will be tracked through the entire AI speech recognition pipeline.
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
                    padding: '1rem 2.2rem',
                    fontSize: '1.15rem'
                  }}
                >
                  <Mic size={22} /> Start Recording
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Click, then speak into your microphone in your natural voice.
                </span>
              </div>
            )}
            
            {/* RECORDING STATE */}
            {recordingStatus === 'recording' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* Audio Level Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', width: '100%', maxWidth: '400px' }}>
                  <Volume2 size={18} color="var(--accent-cyan)" />
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${micVolume}%`,
                        background: micVolume > 60 ? 'var(--accent-cyan)' : 'var(--accent-blue)',
                        transition: 'width 0.1s ease',
                        boxShadow: '0 0 10px var(--accent-cyan-glow)'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '40px' }}>
                    {micVolume > 5 ? 'Active' : 'Listening'}
                  </span>
                </div>

                {/* Real-time Live Speech Box */}
                <div style={{
                  width: '100%',
                  maxWidth: '650px',
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(10, 132, 255, 0.12)',
                  border: '1px solid rgba(50, 173, 230, 0.4)',
                  borderRadius: '12px',
                  marginBottom: '1.75rem',
                  minHeight: '65px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(10, 132, 255, 0.15)'
                }}>
                  {liveTranscript ? (
                    <span style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 600 }}>
                      "{liveTranscript}"
                    </span>
                  ) : (
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff453a', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                      Listening to your voice... Speak now!
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
                    padding: '0.85rem 2rem',
                    fontSize: '1.05rem',
                    boxShadow: '0 4px 16px 0 rgba(255, 69, 58, 0.45)'
                  }}
                >
                  <Square size={18} /> Stop Recording
                </button>
              </div>
            )}

            {/* PROCESSING STATE */}
            {recordingStatus === 'processing' && (
              <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={36} className="animate-spin" color="var(--accent-cyan)" />
                <div style={{ fontSize: '1.15rem', fontWeight: 500, color: '#fff' }}>
                  Finalizing speech recognition...
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Decoding acoustic tokens from your audio
                </div>
              </div>
            )}

            {/* NO SPEECH DETECTED HONEST STATE */}
            {recordingStatus === 'no_speech' && (
              <div style={{
                width: '100%',
                maxWidth: '650px',
                margin: '0 auto',
                padding: '2rem',
                background: 'rgba(255, 149, 0, 0.1)',
                border: '1px solid rgba(255, 149, 0, 0.35)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ff9f0a', marginBottom: '0.75rem', fontWeight: 600, fontSize: '1.1rem' }}>
                  <AlertCircle size={22} /> No Clear Speech Detected
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  The microphone did not register any spoken words. Please speak louder, closer to your microphone, or enter what you said:
                </p>

                <input
                  type="text"
                  value={capturedText}
                  onChange={e => { setCapturedText(e.target.value); setTranscribedText(e.target.value); }}
                  placeholder="Type your phrase here..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid var(--glass-border)',
                    color: '#fff',
                    fontSize: '1.15rem',
                    marginBottom: '1.5rem',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={startRecording}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <RotateCcw size={16} /> Try Recording Again
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleContinue}
                    disabled={!capturedText.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: capturedText.trim() ? 1 : 0.5 }}
                  >
                    <Check size={18} /> Continue with Entered Phrase
                  </button>
                </div>
              </div>
            )}

            {/* FINISHED STATE WITH REAL CAPTURED SPEECH */}
            {recordingStatus === 'finished' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '650px', margin: '0 auto' }}>
                <div style={{
                  width: '100%',
                  padding: '1.75rem',
                  background: 'rgba(10, 132, 255, 0.12)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: '16px',
                  marginBottom: '1.75rem',
                  textAlign: 'left',
                  boxShadow: '0 8px 30px rgba(10, 132, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>
                      <Sparkles size={18} /> Captured Voice Text
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
                        gap: '5px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Edit3 size={15} /> {isEditing ? 'Done' : 'Edit Text'}
                    </button>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={capturedText}
                      onChange={e => { setCapturedText(e.target.value); setTranscribedText(e.target.value); }}
                      placeholder="Type what you said..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '1px solid var(--accent-cyan)',
                        color: '#fff',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      "{capturedText}"
                    </div>
                  )}

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    Your exact words will be carried step-by-step through the frequency domain, STFT, transformer network, and final result.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={startRecording}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.4rem' }}
                  >
                    <RotateCcw size={16} /> Re-record Voice
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleContinue}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
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

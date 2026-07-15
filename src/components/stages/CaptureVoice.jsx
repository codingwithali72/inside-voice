import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

export default function CaptureVoice({ onNext, setAudioData, setTranscribedText }) {
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, finished
  const [streamError, setStreamError] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const recognitionRef = useRef(null);
  const currentTranscript = useRef("");

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
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
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioData({ blob: audioBlob, url: audioUrl });
        stream.getTracks().forEach(track => track.stop());
      };

      // Set up Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            finalTranscript += event.results[i][0].transcript;
          }
          currentTranscript.current = finalTranscript;
          setTranscribedText(finalTranscript);
        };
        
        recognitionRef.current.start();
      } else {
        setTranscribedText("Speech recognition not supported in this browser.");
      }

      mediaRecorder.current.start();
      setRecordingStatus('recording');
      drawWaveform();
    } catch (err) {
      console.error("Error accessing mic:", err);
      setStreamError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setRecordingStatus('finished');
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyser.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyser.current.getByteTimeDomainData(dataArray.current);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#32ADE6';
    ctx.beginPath();

    const sliceWidth = width * 1.0 / dataArray.current.length;
    let x = 0;

    for (let i = 0; i < dataArray.current.length; i++) {
      const v = dataArray.current[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  return (
    <div className="stage-container">
      <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Stage 1: Capturing Your Voice</h2>
        
        {streamError ? (
          <p style={{ color: '#ff453a' }}>Microphone access denied. Please allow access to continue.</p>
        ) : (
          <>
            <p style={{ marginBottom: '2rem' }}>
              When you speak, your vocal cords create vibrations in the air. 
              The microphone converts these vibrations into electrical signals.
            </p>
            
            <canvas ref={canvasRef} width="600" height="150" style={{ background: '#050505', marginBottom: '2rem', display: recordingStatus === 'idle' ? 'none' : 'block', margin: '0 auto 2rem auto', border: '1px solid var(--glass-border)' }}></canvas>
            
            {recordingStatus === 'idle' && (
              <button className="btn-primary" onClick={startRecording} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                <Mic size={20} /> Start Recording
              </button>
            )}
            
            {recordingStatus === 'recording' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Speak clearly into the microphone...</div>
                <button className="btn-primary" onClick={stopRecording} style={{ background: 'linear-gradient(135deg, #ff453a 0%, #d70015 100%)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', boxShadow: '0 4px 14px 0 rgba(255, 69, 58, 0.4)' }}>
                  <Square size={20} /> Stop Recording
                </button>
              </div>
            )}

            {recordingStatus === 'finished' && (
              <div style={{ animation: 'float 3s ease-in-out infinite' }}>
                <button className="btn-primary" onClick={onNext}>Continue Journey</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

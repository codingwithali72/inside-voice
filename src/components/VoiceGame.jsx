import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, RotateCcw, Trophy, Play, Sliders, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceGame({ onBack }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('voice_game_high_score') || '0', 10);
  });
  const [micActive, setMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // Sensitivity settings
  const [sensitivity, setSensitivity] = useState(2.5); // Multiplier
  const [runThreshold, setRunThreshold] = useState(12); // Volume needed to run
  const [jumpThreshold, setJumpThreshold] = useState(38); // Volume needed to jump
  const [showSettings, setShowSettings] = useState(false);

  // Audio refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Game state refs (for 60fps canvas loop)
  const gameStateRef = useRef({
    player: {
      x: 120,
      y: 200,
      width: 36,
      height: 48,
      vy: 0,
      isGrounded: false,
      rotation: 0
    },
    gravity: 0.75,
    cameraX: 0,
    speed: 0,
    blocks: [],
    score: 0,
    running: false
  });

  useEffect(() => {
    return () => {
      stopMicrophone();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Stop microphone cleanly
  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setMicActive(false);
    setMicVolume(0);
  };

  // Start microphone for voice control
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
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
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicActive(true);
      return true;
    } catch (err) {
      console.warn('Microphone error in game:', err);
      alert('Microphone access is required for voice control. You can also use keyboard Arrow keys.');
      return false;
    }
  };

  // Generate ground platforms with gaps
  const initBlocks = () => {
    const blocks = [];
    let currentX = 0;
    
    // Starting safe runway
    blocks.push({ x: 0, y: 140, width: 380, height: 140 });
    currentX = 380;

    // Generate 150 consecutive blocks with gaps
    for (let i = 0; i < 150; i++) {
      const gap = 70 + Math.random() * 85; // Gap to jump across
      const width = 110 + Math.random() * 160; // Platform width
      const height = Math.max(90, Math.min(220, 120 + (Math.random() - 0.5) * 100)); // Platform height

      blocks.push({
        x: currentX + gap,
        y: height,
        width: width,
        height: height
      });

      currentX += gap + width;
    }
    return blocks;
  };

  const startGame = async () => {
    if (!micActive) {
      const ok = await startMicrophone();
      if (!ok) return;
    }

    const blocks = initBlocks();
    gameStateRef.current = {
      player: {
        x: 120,
        y: 180,
        width: 36,
        height: 48,
        vy: 0,
        isGrounded: false,
        rotation: 0
      },
      gravity: 0.75,
      cameraX: 0,
      speed: 0,
      blocks: blocks,
      score: 0,
      running: true
    };

    setScore(0);
    setGameOver(false);
    setIsPlaying(true);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    runGameLoop();
  };

  const playJumpSound = () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioContextRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, audioContextRef.current.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioContextRef.current.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.15);
      }
    } catch (e) {}
  };

  const runGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const game = gameStateRef.current;
    if (!game.running) return;

    // 1. Measure Microphone Voice Volume
    let currentVolume = 0;
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const diff = (data[i] - 128) / 128;
        sum += diff * diff;
      }
      const rms = Math.sqrt(sum / data.length);
      currentVolume = Math.min(100, Math.round(rms * sensitivity * 280));
      setMicVolume(currentVolume);
    }

    // 2. React to Voice: RUN vs JUMP
    const player = game.player;

    // RUN: Volume > runThreshold -> moves world forward
    if (currentVolume >= runThreshold) {
      const runPower = Math.min(8.5, 2.5 + ((currentVolume - runThreshold) / 25) * 4);
      game.speed = runPower;
      player.rotation = Math.sin(Date.now() / 80) * 0.15; // Running bounce
    } else {
      game.speed = Math.max(0, game.speed - 0.3); // Decelerate
      player.rotation = 0;
    }

    // JUMP: Volume >= jumpThreshold -> leaps into air!
    if (currentVolume >= jumpThreshold && player.isGrounded) {
      const jumpPower = Math.min(15.5, 9.5 + ((currentVolume - jumpThreshold) / 40) * 6);
      player.vy = jumpPower;
      player.isGrounded = false;
      playJumpSound();
    }

    // Update Camera / World scroll
    game.cameraX += game.speed;
    game.score += game.speed * 0.1;
    setScore(Math.floor(game.score));

    // Physics
    player.vy -= game.gravity;
    player.y += player.vy;

    // Platform Collision Detection
    player.isGrounded = false;
    const playerWorldX = player.x + game.cameraX;

    for (const b of game.blocks) {
      // Check horizontal alignment
      if (playerWorldX + player.width > b.x && playerWorldX < b.x + b.width) {
        // Landing on platform top
        if (player.y >= b.height - 18 && player.y + player.vy <= b.height) {
          player.y = b.height;
          player.vy = 0;
          player.isGrounded = true;
          break;
        }
      }
    }

    // Check Pit Death
    if (player.y < -40) {
      // Game Over!
      game.running = false;
      setIsPlaying(false);
      setGameOver(true);
      const finalScore = Math.floor(game.score);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('voice_game_high_score', finalScore.toString());
      }
      return;
    }

    // --- RENDER CANVAS ---
    ctx.clearRect(0, 0, width, height);

    // Deep Dark Cyber Background
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridOffset = game.cameraX % 40;
    for (let x = -gridOffset; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Save for camera offset
    ctx.save();
    ctx.translate(-game.cameraX, 0);

    // Draw Blocks / Platforms
    for (const b of game.blocks) {
      // Frustum culling: only draw visible blocks
      if (b.x + b.width < game.cameraX - 100 || b.x > game.cameraX + width + 100) continue;

      const screenY = height - b.height;

      // Platform body
      ctx.fillStyle = '#121726';
      ctx.fillRect(b.x, screenY, b.width, b.height);

      // Glowing top platform edge
      ctx.fillStyle = '#0A84FF';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#0A84FF';
      ctx.fillRect(b.x, screenY, b.width, 4);

      // Inner platform border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(b.x, screenY, b.width, b.height);
    }

    ctx.restore();

    // Draw Player (The Musical Eighth Note Character)
    const playerScreenY = height - player.y - player.height;

    ctx.save();
    ctx.translate(player.x + player.width / 2, playerScreenY + player.height / 2);
    ctx.rotate(player.rotation);

    // Note head (circle)
    ctx.fillStyle = '#32ADE6';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#32ADE6';
    ctx.beginPath();
    ctx.ellipse(-6, 12, 11, 8, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Note stem
    ctx.fillRect(2, -18, 4, 30);

    // Note flag (waving eighth note banner)
    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.quadraticCurveTo(18, -12, 14, -2);
    ctx.quadraticCurveTo(10, -8, 6, -10);
    ctx.fill();

    // Cute animated eyes
    ctx.fillStyle = '#060810';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-8, 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-9, 9, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Next frame
    animFrameRef.current = requestAnimationFrame(runGameLoop);
  };

  // Keyboard controls fallback for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStateRef.current.running) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        const player = gameStateRef.current.player;
        if (player.isGrounded) {
          player.vy = 12.5;
          player.isGrounded = false;
          playJumpSound();
        }
      }
      if (e.code === 'ArrowRight') {
        gameStateRef.current.speed = 5.5;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackToMain = () => {
    stopMicrophone();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onBack();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', position: 'relative' }}>
      
      {/* Top Header / Back Button */}
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={handleBackToMain}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: '#fff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <ArrowLeft size={18} /> Back to Inside Voice
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff9f0a', fontSize: '1rem', fontWeight: 600 }}>
            <Trophy size={18} /> High Score: {highScore}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? 'rgba(10, 132, 255, 0.25)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Sliders size={16} /> Mic Settings
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '900px', padding: '1.5rem', position: 'relative', textAlign: 'center' }}>
        
        {/* Title & Instructions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }} className="gradient-text">
              Voice Control Runner
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Inspired by <em>fz-lyu/voice-control-game</em>. Speak softly to run, shout loud to jump!
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              Score: <span style={{ color: 'var(--accent-cyan)' }}>{score}</span>
            </div>
          </div>
        </div>

        {/* Live Audio Reaction HUD Bar */}
        <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '10px', padding: '10px 16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px' }}>
            {micActive ? <Mic size={18} color="#30d158" /> : <MicOff size={18} color="var(--text-secondary)" />}
            <span style={{ fontSize: '0.8rem', color: micActive ? '#30d158' : 'var(--text-secondary)', fontWeight: 600 }}>
              {micActive ? 'Mic Live' : 'Mic Off'}
            </span>
          </div>

          {/* Volume Meter with Jump & Run marker zones */}
          <div style={{ flex: 1, position: 'relative', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '7px', overflow: 'hidden' }}>
            {/* Run zone threshold marker */}
            <div style={{ position: 'absolute', left: `${runThreshold}%`, top: 0, bottom: 0, width: '2px', background: '#30d158', zIndex: 2 }} title="Run Threshold" />
            {/* Jump zone threshold marker */}
            <div style={{ position: 'absolute', left: `${jumpThreshold}%`, top: 0, bottom: 0, width: '2px', background: '#ff453a', zIndex: 2 }} title="Jump Threshold" />

            {/* Live Volume Fill */}
            <div
              style={{
                height: '100%',
                width: `${micVolume}%`,
                background: micVolume >= jumpThreshold ? 'linear-gradient(90deg, #ff9f0a, #ff453a)' : micVolume >= runThreshold ? 'linear-gradient(90deg, #0A84FF, #32ADE6)' : 'rgba(255,255,255,0.3)',
                transition: 'width 0.05s ease',
                boxShadow: micVolume >= jumpThreshold ? '0 0 12px #ff453a' : 'none'
              }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', minWidth: '95px', textAlign: 'right', fontWeight: 600, color: micVolume >= jumpThreshold ? '#ff453a' : micVolume >= runThreshold ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
            {micVolume >= jumpThreshold ? '🚀 JUMP!' : micVolume >= runThreshold ? '🏃 RUNNING' : '💤 SILENT'}
          </div>
        </div>

        {/* Collapsible Sensitivity Settings */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'left', border: '1px solid var(--glass-border)' }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
              Microphone Sensitivity Tuning
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mic Gain Multiplier ({sensitivity}x)</label>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={sensitivity}
                  onChange={e => setSensitivity(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#30d158' }}>Walk/Run Sound Threshold ({runThreshold}%)</label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={runThreshold}
                  onChange={e => setRunThreshold(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#ff453a' }}>Jump Scream/Loud Threshold ({jumpThreshold}%)</label>
                <input
                  type="range"
                  min="25"
                  max="70"
                  value={jumpThreshold}
                  onChange={e => setJumpThreshold(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Canvas Display */}
        <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <canvas
            ref={canvasRef}
            width="860"
            height="380"
            style={{ width: '100%', height: 'auto', display: 'block', background: '#060810' }}
          />

          {/* Idle / Start Overlay */}
          {!isPlaying && !gameOver && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(6, 8, 16, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                Ready to play with your voice?
              </div>
              <div style={{ maxWidth: '480px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                • <strong>Whisper or Hum softly:</strong> Your note character runs forward.<br/>
                • <strong>Shout or Say "JUMP!":</strong> Your character leaps high across the gap!
              </div>
              <button
                className="btn-primary"
                onClick={startGame}
                style={{ padding: '0.9rem 2.5rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Play size={20} /> Start Voice Game
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(6, 8, 16, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff453a' }}>
                Game Over!
              </div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                Final Score: <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{score}</span>
              </div>
              {score >= highScore && score > 0 && (
                <div style={{ color: '#ff9f0a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={18} /> New Personal Best!
                </div>
              )}
              <button
                className="btn-primary"
                onClick={startGame}
                style={{ marginTop: '0.5rem', padding: '0.85rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RotateCcw size={18} /> Play Again
              </button>
            </div>
          )}
        </div>

        {/* Bottom Quick Controls Guide */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>🗣️ <strong>Voice:</strong> Soft = Run | Loud = Jump</span>
          <span>⌨️ <strong>Keyboard Alternative:</strong> Arrow Right = Run | Space / Up = Jump</span>
        </div>
      </div>
    </div>
  );
}

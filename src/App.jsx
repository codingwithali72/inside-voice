import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './components/Home';
import CaptureVoice from './components/stages/CaptureVoice';
import DigitalAudio from './components/stages/DigitalAudio';
import TimeDomain from './components/stages/TimeDomain';
import FrequencyDomain from './components/stages/FrequencyDomain';
import FrameSplitting from './components/stages/FrameSplitting';
import STFT from './components/stages/STFT';
import LogMelSpectrogram from './components/stages/LogMelSpectrogram';
import AIModel from './components/stages/AIModel';
import LanguageUnderstanding from './components/stages/LanguageUnderstanding';
import FinalResult from './components/stages/FinalResult';
import InteractiveTimeline from './components/InteractiveTimeline';
import ProgressTracker from './components/ProgressTracker';
import BackgroundEffect from './components/BackgroundEffect';

function App() {
  const [currentStage, setCurrentStage] = useState(0);
  const [audioData, setAudioData] = useState(null); 
  const [transcribedText, setTranscribedText] = useState(""); 
  
  const nextStage = () => setCurrentStage(prev => prev + 1);
  const resetJourney = () => {
    setCurrentStage(0);
    setAudioData(null);
    setTranscribedText("");
  };

  const renderStage = () => {
    switch (currentStage) {
      case 0:
        return <Home onNext={nextStage} />;
      case 1:
        return (
          <CaptureVoice
            onNext={nextStage}
            setAudioData={setAudioData}
            setTranscribedText={setTranscribedText}
            transcribedText={transcribedText}
          />
        );
      case 2:
        return <DigitalAudio onNext={nextStage} />;
      case 3:
        return <TimeDomain onNext={nextStage} audioData={audioData} />;
      case 4:
        return <FrequencyDomain onNext={nextStage} />;
      case 5:
        return <FrameSplitting onNext={nextStage} />;
      case 6:
        return <STFT onNext={nextStage} />;
      case 7:
        return <LogMelSpectrogram onNext={nextStage} />;
      case 8:
        return <AIModel onNext={nextStage} transcribedText={transcribedText} />;
      case 9:
        return <LanguageUnderstanding onNext={nextStage} transcribedText={transcribedText} />;
      case 10:
        return (
          <FinalResult
            onNext={nextStage}
            reset={resetJourney}
            audioData={audioData}
            transcribedText={transcribedText}
          />
        );
      case 11:
        return <InteractiveTimeline reset={resetJourney} />;
      default:
        return <Home onNext={nextStage} />;
    }
  };

  return (
    <div className="app-container">
      <BackgroundEffect />
      
      {currentStage > 0 && currentStage < 11 && (
        <ProgressTracker currentStage={currentStage} />
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', height: '100%' }}
        >
          {renderStage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;

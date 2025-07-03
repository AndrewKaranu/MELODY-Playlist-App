import React, { useState, useEffect, useRef } from 'react';
import './styles/VoiceAvatar.css';

const VoiceAvatar = ({ 
  isListening = false, 
  isSpeaking = false, 
  audioLevel = 0,
  currentEmotion = 'neutral',
  userName = 'User'
}) => {
  const [eyeBlink, setEyeBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const blinkTimer = useRef(null);
  const mouthTimer = useRef(null);

  // Random eye blinking
  useEffect(() => {
    const blink = () => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
      
      // Schedule next blink
      const nextBlink = Math.random() * 3000 + 2000; // 2-5 seconds
      blinkTimer.current = setTimeout(blink, nextBlink);
    };

    blink();
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, []);

  // Mouth animation based on audio level
  useEffect(() => {
    if (isSpeaking && audioLevel > 0) {
      const normalizedLevel = Math.min(audioLevel / 100, 1);
      setMouthOpen(normalizedLevel * 0.8 + 0.2); // 0.2-1.0 range
    } else if (isListening) {
      // Subtle mouth movement when listening
      setMouthOpen(0.1 + Math.sin(Date.now() / 1000) * 0.05);
    } else {
      setMouthOpen(0);
    }
  }, [isSpeaking, isListening, audioLevel]);

  // Get emotion-based colors and expressions
  const getEmotionStyles = () => {
    switch (currentEmotion) {
      case 'happy':
        return {
          faceColor: '#13aa52',
          eyeStyle: 'happy',
          mouthStyle: 'smile'
        };
      case 'excited':
        return {
          faceColor: '#0f8c3f',
          eyeStyle: 'excited',
          mouthStyle: 'excited'
        };
      case 'thinking':
        return {
          faceColor: '#13aa52',
          eyeStyle: 'focused',
          mouthStyle: 'small'
        };
      case 'listening':
        return {
          faceColor: '#1db954',
          eyeStyle: 'attentive',
          mouthStyle: 'neutral'
        };
      default:
        return {
          faceColor: '#13aa52',
          eyeStyle: 'neutral',
          mouthStyle: 'neutral'
        };
    }
  };

  const emotionStyles = getEmotionStyles();

  return (
    <div className="voice-avatar-container">
      <div className="avatar-header">
        <h3>🎵 MELODY</h3>
        <p>Your AI Music Companion</p>
      </div>
      
      <div className={`avatar-wrapper ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
        {/* Audio level rings */}
        {(isListening || isSpeaking) && (
          <div className="audio-rings">
            <div className="ring ring-1" style={{ opacity: audioLevel > 20 ? 0.6 : 0.2 }} />
            <div className="ring ring-2" style={{ opacity: audioLevel > 40 ? 0.4 : 0.1 }} />
            <div className="ring ring-3" style={{ opacity: audioLevel > 60 ? 0.3 : 0.05 }} />
          </div>
        )}
        
        {/* Main avatar face */}
        <div 
          className="avatar-face"
          style={{ 
            backgroundColor: emotionStyles.faceColor,
            transform: `scale(${1 + (audioLevel / 1000)})` // Subtle scaling with audio
          }}
        >
          {/* Eyes */}
          <div className={`eye eye-left ${emotionStyles.eyeStyle} ${eyeBlink ? 'blink' : ''}`}>
            <div className="pupil" />
            <div className="eye-shine" />
          </div>
          <div className={`eye eye-right ${emotionStyles.eyeStyle} ${eyeBlink ? 'blink' : ''}`}>
            <div className="pupil" />
            <div className="eye-shine" />
          </div>
          
          {/* Mouth */}
          <div 
            className={`mouth ${emotionStyles.mouthStyle}`}
            style={{
              transform: `scaleY(${1 + mouthOpen})`,
              height: `${8 + mouthOpen * 20}px`
            }}
          />
          
          {/* Cheeks for happy emotion */}
          {currentEmotion === 'happy' && (
            <>
              <div className="cheek cheek-left" />
              <div className="cheek cheek-right" />
            </>
          )}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="avatar-status">
        {isListening && (
          <div className="status-indicator listening">
            <span className="status-dot" />
            Listening...
          </div>
        )}
        {isSpeaking && (
          <div className="status-indicator speaking">
            <span className="status-dot" />
            Speaking...
          </div>
        )}
        {!isListening && !isSpeaking && (
          <div className="status-indicator idle">
            <span className="status-dot" />
            Ready to chat
          </div>
        )}
      </div>
      
      {/* Voice level visualization */}
      <div className="voice-level-container">
        <div className="voice-level-bars">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="voice-bar"
              style={{
                height: `${Math.max(5, (audioLevel / 100) * 40 * Math.random())}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceAvatar;

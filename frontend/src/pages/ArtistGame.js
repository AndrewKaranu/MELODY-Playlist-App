import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './styles/ArtistGame.css';

const ArtistGame = () => {
  const [gameState, setGameState] = useState('start');
  const [currentArtist, setCurrentArtist] = useState(null);
  const [nextArtist, setNextArtist] = useState(null);
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (gameState === 'playing' && currentArtist && currentArtist.previewUrl) {
      audioRef.current = new Audio(currentArtist.previewUrl);
      audioRef.current.volume = isMuted ? 0 : 1;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentArtist, gameState, isMuted]);

  const startGame = async () => {
    try {
      const response = await axios.post('/api/game/start', {}, { withCredentials: true });
      setCurrentArtist(response.data.currentArtist);
      setNextArtist(response.data.nextArtist);
      setGameState('playing');
      setScore(0);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const makeGuess = async (chosenArtist) => {
    try {
      const choice = chosenArtist.id === currentArtist.id ? 'current' : 'next';
      const response = await axios.get(`/api/game/next-artist?choice=${choice}`, { withCredentials: true });
      
      console.log('Server response:', response.data);
      if (response.data.correct) {
        setScore(response.data.score);
        setCurrentArtist(response.data.currentArtist);
        setNextArtist(response.data.nextArtist);
        if (!response.data.nextArtist) {
          setGameState('end');
        }
      } else {
        setGameState('end');
        setScore(response.data.finalScore || response.data.score);
      }
    } catch (error) {
      console.error('Error making guess:', error);
    }
  };
  
  const endGame = async () => {
    try {
      await axios.post('/api/game/end', {}, { withCredentials: true });
      setGameState('start');
      setScore(0);
      setCurrentArtist(null);
      setNextArtist(null);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 1 : 0;
    }
  };

  const playPreview = (artist) => {
    if (audioRef.current && !isMuted) {
      audioRef.current.src = artist.previewUrl;
      audioRef.current.play();
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="artist-game">
      {gameState === 'start' && (
        <button onClick={startGame}>Start Game</button>
      )}
      {gameState === 'playing' && currentArtist && nextArtist && (
        <>
          <div className="artist-container">
            <div className="artist-card" 
                 onMouseEnter={() => playPreview(currentArtist)} 
                 onMouseLeave={stopPreview}
                 onClick={() => makeGuess(currentArtist)}>
              <img src={currentArtist.imageUrl} alt={currentArtist.name} />
              <h2>{currentArtist.name}</h2>
              <p>{currentArtist.monthlyListeners} monthly listeners</p>
            </div>
            <div className="artist-card"
                 onMouseEnter={() => playPreview(nextArtist)}
                 onMouseLeave={stopPreview}
                 onClick={() => makeGuess(nextArtist)}>
              <img src={nextArtist.imageUrl} alt={nextArtist.name} />
              <h2>{nextArtist.name}</h2>
              <p>? monthly listeners</p>
            </div>
          </div>
          <p>Score: {score}</p>
        </>
      )}
      {gameState === 'end' && (
        <>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <button onClick={endGame}>Play Again</button>
        </>
      )}
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
    </div>
  );
};

export default ArtistGame;
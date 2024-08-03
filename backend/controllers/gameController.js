const { getTopArtists } = require('../utils/spotifyUtils');
const axios = require('axios');
const User = require('../models/userModel'); // Add this line to import the User model

let gameState = {};

async function fetchRandomArtists(accessToken, count = 20) {
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: 'year:2020-2023',
        type: 'artist',
        limit: count,
        market: 'US'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        monthlyListeners: artist.monthlyListeners,
        previewUrl: ''
      }));
  } catch (error) {
    console.error('Error fetching random artists:', error);
    return [];
  }
}

exports.startGame = async (req, res) => {
  const { spotifyId } = req.session.user;
  try {
    const user = await User.findOne({ spotifyId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const accessToken = user.accessToken;

    const topArtists = await getTopArtists(spotifyId, accessToken);
    const randomArtists = await fetchRandomArtists(accessToken);
    gameState[spotifyId] = {
      artists: [...topArtists, ...randomArtists],
      currentIndex: 0,
      score: 0
    };
    res.json({ 
      message: 'Game started', 
      currentArtist: gameState[spotifyId].artists[0],
      nextArtist: gameState[spotifyId].artists[1]
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};
  
exports.getNextArtist = async (req, res) => {
    const { spotifyId } = req.session.user;
    const { choice } = req.query;
    
    console.log('getNextArtist called with choice:', choice);
    console.log('Current game state:', gameState[spotifyId]);
  
    if (!gameState[spotifyId]) {
      return res.status(400).json({ error: 'No active game' });
    }
  
    const currentArtist = gameState[spotifyId].artists[gameState[spotifyId].currentIndex];
    const nextArtist = gameState[spotifyId].artists[gameState[spotifyId].currentIndex + 1];
  
    console.log('Current artist:', currentArtist);
    console.log('Next artist:', nextArtist);
  
    if (!nextArtist) {
      return res.json({ message: 'Game over', finalScore: gameState[spotifyId].score });
    }
  
    const isCorrect = (choice === 'current' && currentArtist.monthlyListeners > nextArtist.monthlyListeners) ||
                      (choice === 'next' && nextArtist.monthlyListeners > currentArtist.monthlyListeners);
  
    console.log('Is correct:', isCorrect);
  
    if (isCorrect) {
      gameState[spotifyId].score++;
      gameState[spotifyId].currentIndex++;
      const newNextArtist = gameState[spotifyId].artists[gameState[spotifyId].currentIndex + 1];
      res.json({
        correct: true,
        score: gameState[spotifyId].score,
        currentArtist: nextArtist,
        nextArtist: newNextArtist || null
      });
    } else {
      res.json({
        correct: false,
        finalScore: gameState[spotifyId].score,
        currentArtist: currentArtist,
        nextArtist: nextArtist
      });
    }
  };
exports.endGame = (req, res) => {
  const { spotifyId } = req.session.user;
  if (gameState[spotifyId]) {
    const finalScore = gameState[spotifyId].score;
    delete gameState[spotifyId];
    res.json({ message: 'Game ended', finalScore });
  } else {
    res.status(400).json({ error: 'No active game' });
  }
};


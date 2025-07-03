const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../controllers/spotifyController');
const { getAccessToken } = require('../utils/spotifyUtils');
const {
  playTrack,
  pausePlayback,
  resumePlayback,
  skipToNext,
  skipToPrevious,
  seekToPosition,
  setVolume,
  addToQueue,
  getCurrentlyPlaying,
  getUserDevices,
  transferPlayback,
  setShuffle,
  setRepeat
} = require('../utils/spotifyPlaybackUtils');

// Get currently playing track
router.get('/currently-playing', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const accessToken = await getAccessToken(spotifyId);
    const result = await getCurrentlyPlaying(accessToken);
    res.json(result);
  } catch (error) {
    console.error('Error getting currently playing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Play a specific track
router.post('/play', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { trackId, deviceId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await playTrack(accessToken, trackId, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error playing track:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause playback
router.post('/pause', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { deviceId } = req.body;
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await pausePlayback(accessToken, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error pausing playback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume playback
router.post('/resume', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { deviceId } = req.body;
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await resumePlayback(accessToken, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error resuming playback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Skip to next track
router.post('/next', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { deviceId } = req.body;
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await skipToNext(accessToken, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error skipping to next:', error);
    res.status(500).json({ error: error.message });
  }
});

// Skip to previous track
router.post('/previous', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { deviceId } = req.body;
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await skipToPrevious(accessToken, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error skipping to previous:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seek to position
router.post('/seek', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { positionMs, deviceId } = req.body;
    
    if (typeof positionMs !== 'number') {
      return res.status(400).json({ error: 'Position in milliseconds is required' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await seekToPosition(accessToken, positionMs, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error seeking to position:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set volume
router.post('/volume', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { volumePercent, deviceId } = req.body;
    
    if (typeof volumePercent !== 'number' || volumePercent < 0 || volumePercent > 100) {
      return res.status(400).json({ error: 'Volume percent must be a number between 0 and 100' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await setVolume(accessToken, volumePercent, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error setting volume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add to queue
router.post('/queue', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { trackId, deviceId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await addToQueue(accessToken, trackId, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available devices
router.get('/devices', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const accessToken = await getAccessToken(spotifyId);
    const result = await getUserDevices(accessToken);
    res.json(result);
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer playback to device
router.post('/transfer', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { deviceId, play = false } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await transferPlayback(accessToken, deviceId, play);
    res.json(result);
  } catch (error) {
    console.error('Error transferring playback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set shuffle mode
router.post('/shuffle', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { state, deviceId } = req.body;
    
    if (typeof state !== 'boolean') {
      return res.status(400).json({ error: 'Shuffle state must be a boolean' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await setShuffle(accessToken, state, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error setting shuffle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set repeat mode
router.post('/repeat', ensureAuthenticated, async (req, res) => {
  try {
    const { spotifyId } = req.session.user;
    const { state, deviceId } = req.body;
    
    if (!['track', 'context', 'off'].includes(state)) {
      return res.status(400).json({ error: 'Repeat state must be "track", "context", or "off"' });
    }
    
    const accessToken = await getAccessToken(spotifyId);
    const result = await setRepeat(accessToken, state, deviceId);
    res.json(result);
  } catch (error) {
    console.error('Error setting repeat:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

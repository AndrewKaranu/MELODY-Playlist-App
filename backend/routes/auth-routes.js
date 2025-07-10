//Authorization routes
const express = require('express');
const { login, callback, logout } = require('../controllers/spotifyController');
const router = express.Router();

// Login with Spotify
router.get('/spotify', login);

// Spotify callback
router.get('/spotify/callback', callback);

// Logout
router.get('/logout', logout);

// Get current user
router.get('/current-user', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.session.user);
  });

module.exports = router;

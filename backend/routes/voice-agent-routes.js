const express = require('express');
const router = express.Router();
const voiceAgentController = require('../controllers/voiceAgentController');
const { ensureAuthenticated } = require('../controllers/spotifyController');

// Initialize a new voice agent session
router.post('/initialize', ensureAuthenticated, (req, res) => {
  voiceAgentController.initializeVoiceSession(req, res);
});

// Get active sessions (for debugging)
router.get('/sessions', ensureAuthenticated, (req, res) => {
  voiceAgentController.getActiveSessions(req, res);
});

// Terminate a specific session
router.delete('/sessions/:sessionId', ensureAuthenticated, (req, res) => {
  voiceAgentController.terminateSession(req, res);
});

module.exports = router;

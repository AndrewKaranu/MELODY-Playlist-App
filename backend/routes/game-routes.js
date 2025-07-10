const express = require('express');
const router = express.Router();
const { startGame, getNextArtist, endGame } = require('../controllers/gameController');
const { ensureAuthenticated } = require('../controllers/playlistController');

router.post('/start', ensureAuthenticated, startGame);
router.get('/next-artist', ensureAuthenticated, getNextArtist);
router.post('/end', ensureAuthenticated, endGame);

module.exports = router;
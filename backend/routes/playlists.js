const express = require('express');
const router = express.Router();
const multer = require('multer');
const Playlist = require('../models/playlistModel');
const playlistStatuses = require('../utils/playlistStatus');
const User = require('../models/userModel');
const { 
  createPlaylist, 
  getUserPlaylists, 
  getPlaylist, 
  deletePlaylist, 
  updatePlaylist, 
  createPlaylistFromPrompt,
  ensureAuthenticated, 
  createPlaylistUsingHistory, 
  addTracksToPlaylistController, 
  searchForSongs, 
  searchForArtists, 
  createPlaylistUsingProvidedTracks, 
  createPlaylistUsingProvidedArtists, 
  createPlaylistFromImage,
  getTopTracksController,
  getTopArtistsController,
  getArtistTopTracksController,
  setPlaylistCoverController
} = require('../controllers/playlistController');

//Handle Uploads
const upload = multer({ dest: './public/tmp/' });

// Set playlist cover
router.post('/set-cover', ensureAuthenticated, upload.single('coverImage'), setPlaylistCoverController);

//GET top tracks
router.get('/toptracks', getTopTracksController);

//GET top artists
router.get('/topartists', getTopArtistsController);

//GET artist's top tracks
router.get('/artist-top-tracks', getArtistTopTracksController);

//GET tracks based on search query
router.get('/search', ensureAuthenticated, searchForSongs);

//GET artists based on search query
router.get('/searchArtists', ensureAuthenticated, searchForArtists);

//POST tracks to a playlist
router.post('/add-tracks', addTracksToPlaylistController);

//Get all created playlist
router.get('/', getUserPlaylists);

//Get single playlist
router.get('/:id', getPlaylist);

//POST a new playlist
router.post('/', createPlaylist);

//DELETE a playlist from app (spotify api does not support deletion)
router.delete('/:id', deletePlaylist);

//UPDATE a playlist
router.patch('/:id', updatePlaylist);

// Limit count
router.get('/limit', async (req, res) => {
    try {
      const user = await User.findOne({ spotifyId: req.session.user.spotifyId });
      res.json({
        playlistCount: user.playlistCount,
        lastResetDate: user.lastResetDate,
        isUnlimited: user.isUnlimited
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

//POST a playlist from prompt and no of songs
router.post('/create', ensureAuthenticated, upload.single('coverImage'), createPlaylistFromPrompt);

//POST a playlist from listening history and prompt
router.post('/createWithHistory', ensureAuthenticated, createPlaylistUsingHistory);

//POST a playlist from given tracks
router.post('/createWithTracks', ensureAuthenticated, createPlaylistUsingProvidedTracks);

// POST a playlist from given artists
router.post('/createWithArtists', ensureAuthenticated, createPlaylistUsingProvidedArtists);

//POST a playlist from an image
router.post('/upload-image', ensureAuthenticated, upload.single('file'), createPlaylistFromImage);

// Get playlist status
// In routes/playlist.js
router.get('/status/:tempId', async (req, res) => {
    try {
        const status = playlistStatuses.get(req.params.tempId);
        if (status) {
            res.json(status);
            if (status.status === 'complete' || status.status === 'error') {
                console.log(`Deleting status for tempId: ${req.params.tempId}`);
                playlistStatuses.delete(req.params.tempId);
            }
        } else {
            console.log(`Status not found for tempId: ${req.params.tempId}`);
            res.status(404).json({ error: 'Playlist status not found' });
        }
    } catch (error) {
        console.error('Error fetching playlist status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.use('*', (req, res) => {
  console.log(`Unmatched route in playlists router: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found in playlists router' });
});

module.exports = router;
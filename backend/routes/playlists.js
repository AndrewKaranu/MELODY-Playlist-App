//Playlist function routes
const express = require('express')

const router = express.Router()

const multer = require('multer');




const Playlist = require('../models/playlistModel')

const { createPlaylist, getUserPlaylists, getPlaylist, deletePlaylist, updatePlaylist, createPlaylistFromPrompt,ensureAuthenticated, createPlaylistUsingHistory, addTracksToPlaylistController, searchForSongs, searchForArtists, createPlaylistUsingProvidedTracks, createPlaylistUsingProvidedArtists, createPlaylistFromImage ,getTopTracksController,getTopArtistsController,setPlaylistCoverController } = require('../controllers/playlistController')

//Handle Uploads
var fileUpload = multer({ dest: './public/tmp/' }).single('file');
const upload = multer({ dest: './public/tmp/' });

// Set playlist cover
router.post('/set-cover', ensureAuthenticated, upload.single('coverImage'), setPlaylistCoverController);
//GET top tracks
router.get('/toptracks', getTopTracksController);

//GET top artists
router.get('/topartists', getTopArtistsController);

//GET tracks based on search query
router.get('/search',(req, res, next) => {
    console.log('Search route hit');
    next();
},ensureAuthenticated, searchForSongs);

//GET artists based on search query
router.get('/searchArtists',(req, res, next) => {
    console.log('Search route hit');
    next();
},ensureAuthenticated, searchForArtists);

//POST tracks to a playlist
router.post('/add-tracks', addTracksToPlaylistController);



//Get all created playlist
router.get('/', getUserPlaylists)

//Get single playlist
router.get('/:id', getPlaylist)

//POST a new playlist
router.post('/', createPlaylist)

//DELETE a playlist from app (spotify api does not support deletion)
router.delete('/:id', deletePlaylist)

//UPDATE a playlist
router.patch('/:id', updatePlaylist)

//POST a playlist from prompt and no of songs
router.post('/create', ensureAuthenticated, upload.single('coverImage'), createPlaylistFromPrompt);

//POST a playlist from listening history and prompt
router.post('/createWithHistory', ensureAuthenticated, createPlaylistUsingHistory);

//POST a playlist from given tracks
router.post('/createWithTracks', ensureAuthenticated, createPlaylistUsingProvidedTracks);

// POST a playlist from given artists
router.post('/createWithArtists', ensureAuthenticated, createPlaylistUsingProvidedArtists);

//POST a playlist from an image
router.post('/upload-image', ensureAuthenticated ,fileUpload, createPlaylistFromImage);



router.use('*', (req, res) => {
    console.log(`Unmatched route in playlists router: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found in playlists router' });
});






module.exports = router
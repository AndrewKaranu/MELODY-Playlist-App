const express = require('express');
const multer = require('multer');
const {  createPlaylistFromImage } = require('../controllers/playlistController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-image', upload.single('file'), createPlaylistFromImage);

module.exports = router;

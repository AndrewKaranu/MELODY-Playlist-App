const { response } = require('express')
const Playlist = require('../models/playlistModel')
const mongoose = require('mongoose')
const {viaPrompt, viaListeningHistory,viaProvidedTracks, viaProvidedArtists, imageToPrompt, generateImage} = require('../controllers/openaiController');
const { searchTrack, initializePlaylist, addTracksToPlaylist,getListeningHistory, searchBarTracks, searchBarArtists, getTopTracks, getTopArtists, setPlaylistCover} = require('../utils/spotifyUtils');
const User = require('../models/userModel'); // Adjust the path if necessary
const { processImageUrl, processUploadedFile } = require('../utils/openaiUtils');
const axios = require('axios');
const sharp = require('sharp');



// Get all playlists for a user
const getUserPlaylists = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const user = await User.findOne({ spotifyId: req.session.user.spotifyId }).populate('playlists');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.playlists);
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    res.status(500).json({ message: 'Error fetching playlists', error: error.message });
  }
};

//Get a single playlist -- work in this
const getPlaylist = async (req, res) =>{
    const { id } = req.params
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such playlist'})
    }
    const playlist = await Playlist.findById(id)

    if (!playlist) {
        return res.status(404).json({error: "No such playlist"})
    }

    res.status(200).json(playlist)
}

//Create Playlist
const createPlaylist = async (req, res) => {
    const { prompt, noOfSongs } = req.body;
  
    try {
      const playlistData = await viaPrompt(prompt, parseInt(noOfSongs, 10), res);
  
      if (!playlistData) {
        throw new Error("Failed to generate playlist data");
      }
  
      const playlist = await Playlist.create({
        title: playlistData.name,
        description: playlistData.description,
        prompt,
        songs: playlistData.songs,
        noOfSongs: playlistData.songs.length
      });
  
      res.status(200).json(playlist);
    } catch (error) {
      console.error("Error generating or saving playlist:", error);
  
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  };
  


// Delete a playlist
const deletePlaylist = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'No such playlist'});
  }

  try {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({error: "No such playlist"});
    }

    const user = await User.findById(playlist.userId);
    if (!user) {
      return res.status(404).json({error: "User not found"});
    }

    // Delete from Spotify
    await deletePlaylist(playlist.spotifyId, user.accessToken);

    // Remove playlist reference from user
    user.playlists = user.playlists.filter(playlistId => playlistId.toString() !== id);
    await user.save();

    // Delete from database
    await Playlist.findByIdAndDelete(id);

    res.status(200).json({message: "Playlist deleted successfully"});
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({error: "Error deleting playlist", details: error.message});
  }
};

//Check authentication
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'User not authenticated' });
};

//Update a playlist
const updatePlaylist = async (req, res) =>{
    const { id } = req.params
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such playlist'})
    }
    const playlist = await Playlist.findOneAndUpdate({_id: id}, {
        ...req.body
    })

    if (!playlist) {
        return res.status(400).json({error: "No such playlist"})
    }

    res.status(200).json(playlist)
}

//Get users top tracks
const getTopTracksController = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const timeRange = req.query.timeRange || 'medium_term'; // Use query params and provide a default
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const topTracks = await getTopTracks(spotifyId, timeRange);
    res.status(200).json({ message: 'Top tracks fetched successfully', topTracks });
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ message: 'Error fetching top tracks', error: error.message });
  }
};

// Get users top artists
const getTopArtistsController = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const timeRange = req.query.timeRange || 'medium_term'; // Use query params and provide a default
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const topArtists = await getTopArtists(spotifyId, timeRange);
    res.status(200).json({ message: 'Top artists fetched successfully', topArtists });
  } catch (error) {
    console.error('Error fetching top artists:', error);
    res.status(500).json({ message: 'Error fetching top artists', error: error.message });
  }
};

// Create playlist from prompt
const createPlaylistFromPrompt = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }
  
  const { prompt, noOfSongs, coverPrompt } = req.body;
  const coverImage = req.file;
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const accessToken = user.accessToken;

    console.log('Access token in playListController:', accessToken);
    console.log('Number of Songs:', noOfSongs);

    const playlistData = await viaPrompt(prompt, noOfSongs, res);
    console.log('Generated Playlist:', playlistData);

    const trackIdsPromises = playlistData.songs.map(song => searchTrack(song, accessToken));
    const trackIds = await Promise.all(trackIdsPromises);

    const validTrackIds = trackIds.filter(id => id !== null);

    if (validTrackIds.length === 0) {
      return res.status(404).json({ message: 'No valid tracks found for the generated playlist' });
    }

    const spotifyPlaylist = await initializePlaylist(spotifyId, playlistData.name, playlistData.description, accessToken);
    await addTracksToPlaylist(spotifyPlaylist.id, validTrackIds, accessToken);

    // Handle playlist cover
    let coverImageBase64;
    if (coverImage) {
      console.log('Cover image uploaded:', coverImage.path);
      coverImageBase64 = await processUploadedFile(coverImage.path);
    } else if (coverPrompt) {
      // Generate image using OpenAI
      const coverImageUrl = await generateImage(coverPrompt);
      console.log('Generated cover image URL:', coverImageUrl);
      
      // Download the image
      const response = await axios.get(coverImageUrl, { responseType: 'arraybuffer' });
      
      // Resize and compress the image
      const resizedImage = await sharp(response.data)
        .resize(256, 256) // Resize to 256x256
        .jpeg({ quality: 100 }) // Convert to JPEG with 80% quality
        .toBuffer();
      
      coverImageBase64 = resizedImage.toString('base64');
    }

    if (coverImageBase64) {
      console.log('Setting playlist cover');
      await setPlaylistCover(spotifyPlaylist.id, coverImageBase64, accessToken);
    }

    // Save playlist to database
    const playlist = new Playlist({
      title: playlistData.name,
      description: playlistData.description,
      prompt,
      noOfSongs: validTrackIds.length,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      spotifyId: spotifyPlaylist.id,
      userId: user._id,
      coverImage: coverPrompt ? 'Generated from prompt' : (coverImage ? coverImage.path : null)
    });

    await playlist.save();

    // Add playlist reference to user
    user.playlists.push(playlist._id);
    await user.save();

    res.status(200).json({ 
      message: 'Playlist created successfully', 
      playlistId: playlist._id, 
      spotifyUrl: playlist.spotifyUrl,
      // coverImage: coverImageUrl
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};

// Create playlist using listening history
const createPlaylistUsingHistory = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const { prompt, noOfSongs, timeRange } = req.body;
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const accessToken = user.accessToken;

    const listeningHistory = await getListeningHistory(spotifyId, timeRange);

    const playlistData = await viaListeningHistory(spotifyId, timeRange, prompt, noOfSongs, listeningHistory, res);

    const trackIdsPromises = playlistData.songs.map(song => searchTrack(song, accessToken));
    const trackIds = await Promise.all(trackIdsPromises);

    const validTrackIds = trackIds.filter(id => id !== null);

    if (validTrackIds.length === 0) {
      return res.status(404).json({ message: 'No valid tracks found for the generated playlist' });
    }

    const spotifyPlaylist = await initializePlaylist(spotifyId, playlistData.name, playlistData.description, accessToken);
    await addTracksToPlaylist(spotifyPlaylist.id, validTrackIds, accessToken);

    const playlist = new Playlist({
      title: playlistData.name,
      description: playlistData.description,
      prompt,
      noOfSongs: validTrackIds.length,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      spotifyId: spotifyPlaylist.id,
      userId: user._id
    });

    await playlist.save();

    user.playlists.push(playlist._id);
    await user.save();

    res.status(200).json({ message: 'Playlist created successfully', playlistId: playlist._id, spotifyUrl: playlist.spotifyUrl });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};

//via provided songs
const createPlaylistUsingProvidedTracks = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const { noOfSongs, providedTracks } = req.body;
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const accessToken = user.accessToken;

    const playlistData = await viaProvidedTracks(30 , providedTracks);

    const trackIdsPromises = playlistData.songs.map(song => searchTrack(song, accessToken));
    const trackIds = await Promise.all(trackIdsPromises);

    const validTrackIds = trackIds.filter(id => id !== null);

    if (validTrackIds.length === 0) {
      return res.status(404).json({ message: 'No valid tracks found for the generated playlist' });
    }

    const spotifyPlaylist = await initializePlaylist(spotifyId, playlistData.name, playlistData.description, accessToken);
    await addTracksToPlaylist(spotifyPlaylist.id, validTrackIds, accessToken);

    const playlist = new Playlist({
      title: playlistData.name,
      description: playlistData.description,
      noOfSongs: validTrackIds.length,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      spotifyId: spotifyPlaylist.id,
      userId: user._id
    });

    await playlist.save();

    user.playlists.push(playlist._id);
    await user.save();

    res.status(200).json({ message: 'Playlist created successfully', playlistId: playlist._id, spotifyUrl: playlist.spotifyUrl });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};

// via provided artists
const createPlaylistUsingProvidedArtists = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const { noOfSongs, providedArtists } = req.body;
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const accessToken = user.accessToken;

    const playlistData = await viaProvidedArtists(50 , providedArtists);

    const trackIdsPromises = playlistData.songs.map(song => searchTrack(song, accessToken));
    const trackIds = await Promise.all(trackIdsPromises);

    const validTrackIds = trackIds.filter(id => id !== null);

    if (validTrackIds.length === 0) {
      return res.status(404).json({ message: 'No valid artists found for the generated playlist' });
    }


    const spotifyPlaylist = await initializePlaylist(spotifyId, playlistData.name, playlistData.description, accessToken);
    await addTracksToPlaylist(spotifyPlaylist.id, trackIds, accessToken);

    const playlist = new Playlist({
      title: playlistData.name,
      description: playlistData.description,
      noOfSongs: trackIds.length,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      spotifyId: spotifyPlaylist.id,
      userId: user._id
    });

    await playlist.save();

    user.playlists.push(playlist._id);
    await user.save();

    res.status(200).json({ message: 'Playlist created successfully', playlistId: playlist._id, spotifyUrl: playlist.spotifyUrl });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};


//Create playlist via provided images
const createPlaylistFromImage = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const accessToken = user.accessToken;
    let prompt;

    // Handling an uploaded file
    if (req.file) {
      const filePath = req.file.path; // Assuming you're using something like multer for file uploads

      // Compress the image without resizing
      const compressedFilePath = `${filePath}-compressed.jpg`;
      await sharp(filePath)
        .resize({ width: 800 }) // Resize to a maximum width of 800px
        .grayscale() // Convert to grayscale
        .jpeg({ quality: 70 }) // Adjust quality as needed
        .toFile(compressedFilePath);

      prompt = await imageToPrompt(compressedFilePath, 'file');
    }
    // Handling a URL
    else if (req.body.imageUrl) {
      const imageUrl = req.body.imageUrl;
      prompt = await imageToPrompt(imageUrl, 'url');
    }
    else {
      // Assuming the image or URL is sent in the request body under 'imageData' if no file or imageUrl
      const { imageData } = req.body;
      prompt = await imageToPrompt(imageData);
    }

    // Proceed with the rest of the function using the prompt from imageToPrompt
    const { noOfSongs } = req.body;
    const playlistData = await viaPrompt(prompt, noOfSongs, accessToken);

    const trackIdsPromises = playlistData.songs.map(song => searchTrack(song, accessToken));
    const trackIds = await Promise.all(trackIdsPromises);

    const validTrackIds = trackIds.filter(id => id !== null);

    if (validTrackIds.length === 0) {
      return res.status(404).json({ message: 'No valid tracks found for the generated playlist' });
    }

    const spotifyPlaylist = await initializePlaylist(spotifyId, playlistData.name, playlistData.description, accessToken);
    await addTracksToPlaylist(spotifyPlaylist.id, validTrackIds, accessToken);

    // Save playlist to database
    const playlist = new Playlist({
      title: playlistData.name,
      description: playlistData.description,
      prompt,
      noOfSongs: validTrackIds.length,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      spotifyId: spotifyPlaylist.id,
      userId: user._id
    });

    await playlist.save();

    // Add playlist reference to user
    user.playlists.push(playlist._id);
    await user.save();

    res.status(200).json({ message: 'Playlist created successfully', playlistId: playlist._id, spotifyUrl: playlist.spotifyUrl });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};


const searchForSongs = async (req, res) => {
  const { query } = req.query;
  console.log('Search query:', query);
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const user = await User.findOne({ spotifyId: req.session.user.spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const tracks = await searchBarTracks(query, user.accessToken);
    res.status(200).json(tracks);
  } catch (error) {
    console.error('Error searching for tracks:', error);
    res.status(500).json({ error: error.message });
  }
};

const searchForArtists = async (req, res) => {
  const { query } = req.query;
  console.log('Search query for artists:', query);

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const user = await User.findOne({ spotifyId: req.session.user.spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    const artists = await searchBarArtists(query, user.accessToken);
    res.status(200).json(artists);
  } catch (error) {
    console.error('Error searching for artists:', error);
    res.status(500).json({ error: error.message });
  }
};

const addTracksToPlaylistController = async (req, res) => {
  const { playlistId, trackUris } = req.body;

  if (!playlistId || !trackUris || !Array.isArray(trackUris)) {
    return res.status(400).json({ error: 'Playlist ID and track URIs are required' });
  }

  try {
    const user = await User.findOne({ spotifyId: req.session.user.spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    await addTracksToPlaylist(playlistId, trackUris, user.accessToken);
    res.status(200).json({ message: 'Tracks added to playlist successfully' });
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    res.status(500).json({ error: error.message });
  }
};

const setPlaylistCoverController = async (req, res) => {
  if (!req.session || !req.session.user || !req.session.user.spotifyId) {
    return res.status(401).json({ message: 'User not authenticated or Spotify ID not found' });
  }

  const { playlistId, imageBase64, generateCover, prompt } = req.body;
  const spotifyId = req.session.user.spotifyId;

  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }

    let coverImageBase64 = imageBase64;

    if (generateCover) {
      // Generate image using OpenAI
      coverImageBase64 = await generateImage(prompt);
    }

    await setPlaylistCover(playlistId, coverImageBase64, user.accessToken);

    res.status(200).json({ message: 'Playlist cover set successfully' });
  } catch (error) {
    console.error('Error setting playlist cover:', error);
    res.status(500).json({ message: 'Error setting playlist cover', error: error.message });
  }
};



module.exports = {
  createPlaylist,
  createPlaylistUsingHistory,
  getUserPlaylists,
  getPlaylist,
  deletePlaylist,
  updatePlaylist,
  ensureAuthenticated,
  createPlaylistFromPrompt,
  searchForSongs,
  searchForArtists, 
  addTracksToPlaylistController,
  createPlaylistUsingProvidedTracks,
  createPlaylistUsingProvidedArtists,
  createPlaylistFromImage,
  getTopTracksController,
  getTopArtistsController,
  setPlaylistCoverController
};
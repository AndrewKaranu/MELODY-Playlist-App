const SpotifyWebApi = require('spotify-web-api-node');
const mongoose = require('mongoose');
const User = require('../models/userModel')
const axios = require('axios'); // Make sure axios is imported

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

async function getAccessToken(spotifyId) {
  console.log('Getting access token for Spotify ID:', spotifyId);
  try {
    const user = await User.findOne({ spotifyId: spotifyId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }
    return user.accessToken;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    throw error;
  }
}

// Used to find a track based on song name and artist - Used for implementing the playlist generation
async function searchTrack(trackInfo, accessToken) {
  console.log('Searching for track:', trackInfo);
  console.log('Access token in searchTrack:', accessToken);
  
  spotifyApi.setAccessToken(accessToken);

  try {
    const mainArtist = trackInfo.artist.split(/ft\.|feat\./i)[0].trim();
    let searchQuery = `track:${trackInfo.song} artist:${mainArtist}`;
    console.log('Search query (main artist):', searchQuery);

    let response = await spotifyApi.searchTracks(searchQuery);
    let tracks = response.body.tracks.items;

    if (tracks.length > 0) {
      console.log('Track found (main artist):', tracks[0].name, 'by', tracks[0].artists[0].name);
      return tracks[0].id;
    } else {
      searchQuery = `track:${trackInfo.song} artist:${trackInfo.artist}`;
      console.log('Search query (full artist):', searchQuery);

      response = await spotifyApi.searchTracks(searchQuery);
      tracks = response.body.tracks.items;

      if (tracks.length > 0) {
        console.log('Track found (full artist):', tracks[0].name, 'by', tracks[0].artists[0].name);
        return tracks[0].id;
      } else {
        console.log('No tracks found for:', searchQuery);
        return null;
      }
    }
  } catch (error) {
    console.error('Error searching track:', error);
    throw error;
  }
}

async function initializePlaylist(userId, name, description, accessToken) {
  console.log('Initializing playlist for user:', userId);
  console.log('Access token in initializePlaylist:', accessToken);
  
  if (!accessToken) {
    throw new Error('Access token is missing');
  }

  spotifyApi.setAccessToken(accessToken);

  try {
    const response = await spotifyApi.createPlaylist(name, { 'description': description, 'public': false });
    
    if (!response || !response.body) {
      throw new Error('Invalid response from Spotify API');
    }
    
    console.log('Playlist created:', response.body);
    return response.body;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

async function addTracksToPlaylist(playlistId, trackIds, accessToken) {
  console.log('Adding tracks to playlist:', playlistId);
  console.log('Access token in addTracksToPlaylist:', accessToken);
  
  spotifyApi.setAccessToken(accessToken);

  try {
    await spotifyApi.addTracksToPlaylist(playlistId, trackIds.map(id => `spotify:track:${id}`));
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    throw error;
  }
}

async function deletePlaylist(playlistId, accessToken) {
  console.log('Deleting playlist:', playlistId);
  console.log('Access token in deletePlaylist:', accessToken);
  
  spotifyApi.setAccessToken(accessToken);

  try {
    await spotifyApi.unfollowPlaylist(playlistId);
  } catch (error) {
    console.error('Error deleting playlist from Spotify:', error);
    throw error;
  }
}

//Getting listening history of a user for customized context during generation
const getListeningHistory = async (userId, timeRange = 'medium_term') => {
  try {
    const accessToken = await getAccessToken(userId);
    spotifyApi.setAccessToken(accessToken);

    const response = await spotifyApi.getMyTopTracks({ time_range: timeRange, limit: 50 });

    const tracks = response.body.items.map(track => ({
      song: track.name,
      artist: track.artists.map(artist => artist.name).join(', ')
    }));

    return tracks;
  } catch (error) {
    console.error('Error fetching listening history:', error);
    throw error;
  }
};

//Getting top tracks of a user for list image view
const getTopTracks = async (userId, timeRange = 'medium_term') => {
  try {
    const accessToken = await getAccessToken(userId);
    spotifyApi.setAccessToken(accessToken);

    const response = await spotifyApi.getMyTopTracks({ time_range: timeRange, limit: 30 });

    const tracks = response.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url,
      releaseDate: track.album.release_date
    }));

    return tracks;
  } catch (error) {
    console.error('Error fetching listening history:', error);
    throw error;
  }
};
//Getting top artists of a user for list image view
const getTopArtists = async (userId, timeRange = 'medium_term') => {
  try {
    const accessToken = await getAccessToken(userId);
    spotifyApi.setAccessToken(accessToken);

    // Ensure timeRange is valid
    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    const validTimeRange = validTimeRanges.includes(timeRange) ? timeRange : 'medium_term';

    const response = await spotifyApi.getMyTopArtists({ time_range: validTimeRange, limit: 30 });

    const artists = response.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      followers: artist.popularity
    }));

    return artists;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
};
// Used to search for tracks based on a query - Used for implementing the search bar
const searchBarTracks = async (query, accessToken) => {
  console.log('Searching tracks for autocomplete:', query);
  try {
    const url = `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url,
      releaseDate: track.album.release_date
    }));
  } catch (error) {
    console.error('Error searching tracks for autocomplete:', error);
    throw error;
  }
};

// Used to search for artists based on a query - Used for implementing the artist search bar
const searchBarArtists = async (query, accessToken) => {
  console.log('Searching artists for autocomplete:', query);
  try {
    const url = `https://api.spotify.com/v1/search?type=artist&limit=10&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      followers: artist.followers.total,
      genres: artist.genres.join(', ')
    }));
  } catch (error) {
    console.error('Error searching artists for autocomplete:', error);
    throw error;
  }
};

async function setPlaylistCover(playlistId, imageBase64, accessToken) {
  try {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/images`;
    
    // Check if imageBase64 is a valid base64 string
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      throw new Error('Invalid base64 image data');
    }

    // Check image size (base64 is roughly 4/3 times larger than the original file)
    const approximateFileSizeInKB = (imageBase64.length * 3/4) / 1024;
    if (approximateFileSizeInKB > 256) {
      throw new Error(`Image file is too large: ~${approximateFileSizeInKB.toFixed(2)}KB. Must be less than 256KB.`);
    }

    const response = await axios.put(url, imageBase64, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg'
      }
    });

    console.log('Playlist cover set successfully');
    return response.data;

  } catch (error) {
    console.error('Error setting playlist cover:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }

    // Log the first 100 characters of the imageBase64 for debugging
    console.error('First 100 characters of imageBase64:');

    throw error;
  }
}

module.exports = { searchTrack, initializePlaylist, addTracksToPlaylist, deletePlaylist, getAccessToken, getListeningHistory, searchBarTracks, searchBarArtists, getTopTracks, getTopArtists, setPlaylistCover };

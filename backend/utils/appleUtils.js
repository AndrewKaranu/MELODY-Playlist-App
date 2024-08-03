require('dotenv').config();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Function to generate a developer token
function generateDeveloperToken() {
  const token = jwt.sign({}, process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: process.env.APPLE_TEAM_ID,
    header: {
      alg: 'ES256',
      kid: process.env.APPLE_KEY_ID
    }
  });
  return token;
}

// Function to get an access token for a user
async function getUserToken(appleMusicId) {
  console.log('Getting access token for Apple Music ID:', appleMusicId);
  try {
    const user = await User.findOne({ appleMusicId: appleMusicId });
    if (!user || !user.accessToken) {
      throw new Error('User not found or access token missing');
    }
    return user.accessToken;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    throw error;
  }
}

// Function to search for a track on Apple Music
async function searchTrack(trackInfo, developerToken, userToken) {
  console.log('Searching for track:', trackInfo);
  
  const url = `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(trackInfo.song + ' ' + trackInfo.artist)}&types=songs&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': userToken
      }
    });
    
    const data = await response.json();
    if (data.results.songs && data.results.songs.data.length > 0) {
      console.log('Track found:', data.results.songs.data[0].attributes.name, 'by', data.results.songs.data[0].attributes.artistName);
      return data.results.songs.data[0].id;
    } else {
      console.log('No tracks found for:', trackInfo.song, 'by', trackInfo.artist);
      return null;
    }
  } catch (error) {
    console.error('Error searching track:', error);
    throw error;
  }
}

// Function to initialize a playlist on Apple Music
async function initializePlaylist(userId, name, description, developerToken, userToken) {
  console.log('Initializing playlist for user:', userId);

  const url = `https://api.music.apple.com/v1/me/library/playlists`;
  const body = {
    attributes: {
      name: name,
      description: description
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      console.log('Playlist created:', data.data[0].id);
      return data.data[0];
    } else {
      throw new Error('Invalid response from Apple Music API');
    }
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

// Function to add tracks to a playlist on Apple Music
async function addTracksToPlaylist(playlistId, trackIds, developerToken, userToken) {
  console.log('Adding tracks to playlist:', playlistId);

  const url = `https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`;
  const body = {
    data: trackIds.map(id => ({
      id: id,
      type: 'songs'
    }))
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    throw error;
  }
}

// Function to delete a playlist on Apple Music
async function deletePlaylist(playlistId, developerToken, userToken) {
  console.log('Deleting playlist:', playlistId);

  const url = `https://api.music.apple.com/v1/me/library/playlists/${playlistId}`;

  try {
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': userToken
      }
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

// Function to get listening history on Apple Music
const getListeningHistory = async (userId, developerToken, userToken, timeRange = 'recent') => {
  console.log('Getting listening history for user:', userId);

  const url = `https://api.music.apple.com/v1/me/recent/played/tracks`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${developerToken}`,
        'Music-User-Token': userToken
      }
    });

    const data = await response.json();
    const tracks = data.data.map(track => ({
      song: track.attributes.name,
      artist: track.attributes.artistName
    }));

    return tracks;
  } catch (error) {
    console.error('Error fetching listening history:', error);
    throw error;
  }
};

module.exports = {
  generateDeveloperToken,
  getUserToken,
  searchTrack,
  initializePlaylist,
  addTracksToPlaylist,
  deletePlaylist,
  getListeningHistory
};

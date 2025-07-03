const axios = require('axios');

/**
 * Spotify Playback Control Utilities
 * These functions interact with Spotify's Web Playback API to control music playback
 */

// Base URL for Spotify Web API
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Play a specific track on Spotify
 * @param {string} accessToken - User's Spotify access token
 * @param {string} trackId - Spotify track ID
 * @param {string} deviceId - Optional device ID to play on
 * @returns {Object} Response from Spotify API
 */
async function playTrack(accessToken, trackId, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`;
    
    const response = await axios.put(url, {
      uris: [`spotify:track:${trackId}`]
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Successfully started playing track: ${trackId}`);
    return { success: true, message: 'Track started playing', trackId };
  } catch (error) {
    console.error('Error playing track:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found. Please open Spotify on a device first.');
    } else if (error.response?.status === 403) {
      throw new Error('Premium subscription required for playback control.');
    } else {
      throw new Error(`Failed to play track: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Pause current playback
 * @param {string} accessToken - User's Spotify access token
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function pausePlayback(accessToken, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Playback paused successfully');
    return { success: true, message: 'Playback paused' };
  } catch (error) {
    console.error('Error pausing playback:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found or nothing is currently playing.');
    } else {
      throw new Error(`Failed to pause playback: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Resume paused playback
 * @param {string} accessToken - User's Spotify access token
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function resumePlayback(accessToken, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Playback resumed successfully');
    return { success: true, message: 'Playback resumed' };
  } catch (error) {
    console.error('Error resuming playback:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found.');
    } else {
      throw new Error(`Failed to resume playback: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Skip to next track
 * @param {string} accessToken - User's Spotify access token
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function skipToNext(accessToken, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`;
    
    await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Skipped to next track successfully');
    return { success: true, message: 'Skipped to next track' };
  } catch (error) {
    console.error('Error skipping to next track:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found or nothing is currently playing.');
    } else {
      throw new Error(`Failed to skip to next track: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Skip to previous track
 * @param {string} accessToken - User's Spotify access token
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function skipToPrevious(accessToken, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`;
    
    await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Skipped to previous track successfully');
    return { success: true, message: 'Skipped to previous track' };
  } catch (error) {
    console.error('Error skipping to previous track:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found or nothing is currently playing.');
    } else {
      throw new Error(`Failed to skip to previous track: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Seek to a specific position in the current track
 * @param {string} accessToken - User's Spotify access token
 * @param {number} positionMs - Position in milliseconds
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function seekToPosition(accessToken, positionMs, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/seek?position_ms=${positionMs}${deviceId ? `&device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Seeked to position: ${positionMs}ms`);
    return { success: true, message: `Seeked to ${Math.floor(positionMs / 1000)} seconds`, positionMs };
  } catch (error) {
    console.error('Error seeking to position:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found or nothing is currently playing.');
    } else {
      throw new Error(`Failed to seek to position: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Set playback volume
 * @param {string} accessToken - User's Spotify access token
 * @param {number} volumePercent - Volume percentage (0-100)
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function setVolume(accessToken, volumePercent, deviceId = null) {
  try {
    if (volumePercent < 0 || volumePercent > 100) {
      throw new Error('Volume must be between 0 and 100');
    }

    const url = `${SPOTIFY_API_BASE}/me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Volume set to: ${volumePercent}%`);
    return { success: true, message: `Volume set to ${volumePercent}%`, volume: volumePercent };
  } catch (error) {
    console.error('Error setting volume:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found.');
    } else {
      throw new Error(`Failed to set volume: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Add a track to the playback queue
 * @param {string} accessToken - User's Spotify access token
 * @param {string} trackId - Spotify track ID
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function addToQueue(accessToken, trackId, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/queue?uri=spotify:track:${trackId}${deviceId ? `&device_id=${deviceId}` : ''}`;
    
    await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Added track to queue: ${trackId}`);
    return { success: true, message: 'Track added to queue', trackId };
  } catch (error) {
    console.error('Error adding to queue:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('No active device found.');
    } else {
      throw new Error(`Failed to add track to queue: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Get currently playing track information
 * @param {string} accessToken - User's Spotify access token
 * @returns {Object} Currently playing track information
 */
async function getCurrentlyPlaying(accessToken) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/currently-playing`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 204 || !response.data || !response.data.item) {
      return { 
        success: true, 
        message: 'Nothing is currently playing',
        isPlaying: false,
        track: null 
      };
    }

    const track = response.data.item;
    const currentlyPlaying = {
      success: true,
      isPlaying: response.data.is_playing,
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        album: track.album.name,
        duration_ms: track.duration_ms,
        progress_ms: response.data.progress_ms,
        external_urls: track.external_urls,
        preview_url: track.preview_url,
        image: track.album.images[0]?.url
      },
      device: response.data.device ? {
        id: response.data.device.id,
        name: response.data.device.name,
        type: response.data.device.type,
        volume_percent: response.data.device.volume_percent
      } : null
    };

    console.log('Currently playing:', currentlyPlaying.track.name, 'by', currentlyPlaying.track.artists.join(', '));
    return currentlyPlaying;
  } catch (error) {
    console.error('Error getting currently playing:', error.response?.data || error.message);
    
    if (error.response?.status === 204) {
      return { 
        success: true, 
        message: 'Nothing is currently playing',
        isPlaying: false,
        track: null 
      };
    } else {
      throw new Error(`Failed to get currently playing track: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

/**
 * Get user's available devices
 * @param {string} accessToken - User's Spotify access token
 * @returns {Object} List of available devices
 */
async function getUserDevices(accessToken) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/devices`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const devices = response.data.devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      is_active: device.is_active,
      is_private_session: device.is_private_session,
      is_restricted: device.is_restricted,
      volume_percent: device.volume_percent
    }));

    console.log(`Found ${devices.length} available devices`);
    return { success: true, devices };
  } catch (error) {
    console.error('Error getting devices:', error.response?.data || error.message);
    throw new Error(`Failed to get devices: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Transfer playback to a specific device
 * @param {string} accessToken - User's Spotify access token
 * @param {string} deviceId - Device ID to transfer to
 * @param {boolean} play - Whether to start playing immediately
 * @returns {Object} Response from Spotify API
 */
async function transferPlayback(accessToken, deviceId, play = false) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player`;
    
    await axios.put(url, {
      device_ids: [deviceId],
      play: play
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Transferred playback to device: ${deviceId}`);
    return { success: true, message: 'Playback transferred', deviceId };
  } catch (error) {
    console.error('Error transferring playback:', error.response?.data || error.message);
    throw new Error(`Failed to transfer playback: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Set shuffle mode
 * @param {string} accessToken - User's Spotify access token
 * @param {boolean} state - Shuffle state (true/false)
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function setShuffle(accessToken, state, deviceId = null) {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player/shuffle?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Shuffle ${state ? 'enabled' : 'disabled'}`);
    return { success: true, message: `Shuffle ${state ? 'enabled' : 'disabled'}`, shuffle: state };
  } catch (error) {
    console.error('Error setting shuffle:', error.response?.data || error.message);
    throw new Error(`Failed to set shuffle: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Set repeat mode
 * @param {string} accessToken - User's Spotify access token
 * @param {string} state - Repeat state ('track', 'context', 'off')
 * @param {string} deviceId - Optional device ID
 * @returns {Object} Response from Spotify API
 */
async function setRepeat(accessToken, state, deviceId = null) {
  try {
    if (!['track', 'context', 'off'].includes(state)) {
      throw new Error('Repeat state must be "track", "context", or "off"');
    }

    const url = `${SPOTIFY_API_BASE}/me/player/repeat?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`;
    
    await axios.put(url, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Repeat mode set to: ${state}`);
    return { success: true, message: `Repeat mode set to ${state}`, repeat: state };
  } catch (error) {
    console.error('Error setting repeat:', error.response?.data || error.message);
    throw new Error(`Failed to set repeat: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
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
};

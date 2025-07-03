const axios = require('axios');

// Last.fm API configuration
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || 'your_lastfm_api_key_here';
const LASTFM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

/**
 * Music Discovery Utilities using Last.fm API
 * Provides advanced music search and recommendation capabilities
 */

/**
 * Search for tracks by genre, mood, or descriptive terms
 * @param {string} query - Search query (e.g., "modern jazz", "upbeat pop", "90s rock")
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Array} Array of track objects with name, artist, and additional info
 */
async function searchTracksByQuery(query, limit = 10) {
  try {
    console.log(`Searching Last.fm for: "${query}"`);
    
    // Use Last.fm track.search method
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'track.search',
        track: query,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: limit
      }
    });

    if (response.data && response.data.results && response.data.results.trackmatches) {
      const tracks = response.data.results.trackmatches.track;
      return Array.isArray(tracks) ? tracks.slice(0, limit) : [tracks];
    }
    
    return [];
  } catch (error) {
    console.error('Error searching tracks by query:', error.message);
    return [];
  }
}

/**
 * Get top tracks by tag/genre
 * @param {string} tag - Genre or tag (e.g., "jazz", "rock", "electronic")
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Array} Array of track objects
 */
async function getTopTracksByTag(tag, limit = 10) {
  try {
    console.log(`Getting top tracks for tag: "${tag}"`);
    
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'tag.gettoptracks',
        tag: tag,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: limit
      }
    });

    if (response.data && response.data.tracks && response.data.tracks.track) {
      const tracks = response.data.tracks.track;
      return Array.isArray(tracks) ? tracks.slice(0, limit) : [tracks];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting top tracks by tag:', error.message);
    return [];
  }
}

/**
 * Get similar tracks to a given artist
 * @param {string} artist - Artist name
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Array} Array of track objects
 */
async function getSimilarArtistTracks(artist, limit = 10) {
  try {
    console.log(`Getting tracks similar to artist: "${artist}"`);
    
    // First get similar artists
    const similarResponse = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'artist.getsimilar',
        artist: artist,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 5
      }
    });

    if (similarResponse.data && similarResponse.data.similarartists && similarResponse.data.similarartists.artist) {
      const similarArtists = Array.isArray(similarResponse.data.similarartists.artist) 
        ? similarResponse.data.similarartists.artist 
        : [similarResponse.data.similarartists.artist];
      
      // Get top tracks from similar artists
      const allTracks = [];
      for (const simArtist of similarArtists.slice(0, 3)) {
        const tracksResponse = await axios.get(LASTFM_BASE_URL, {
          params: {
            method: 'artist.gettoptracks',
            artist: simArtist.name,
            api_key: LASTFM_API_KEY,
            format: 'json',
            limit: 3
          }
        });
        
        if (tracksResponse.data && tracksResponse.data.toptracks && tracksResponse.data.toptracks.track) {
          const tracks = Array.isArray(tracksResponse.data.toptracks.track) 
            ? tracksResponse.data.toptracks.track 
            : [tracksResponse.data.toptracks.track];
          allTracks.push(...tracks);
        }
      }
      
      return allTracks.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting similar artist tracks:', error.message);
    return [];
  }
}

/**
 * Get top tracks from a specific time period
 * @param {string} period - Time period ("7day", "1month", "3month", "6month", "12month", "overall")
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Array} Array of track objects
 */
async function getTopTracks(period = 'overall', limit = 10) {
  try {
    console.log(`Getting top tracks for period: "${period}"`);
    
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'chart.gettoptracks',
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: limit
      }
    });

    if (response.data && response.data.tracks && response.data.tracks.track) {
      const tracks = response.data.tracks.track;
      return Array.isArray(tracks) ? tracks.slice(0, limit) : [tracks];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting top tracks:', error.message);
    return [];
  }
}

/**
 * Search for tracks by artist and get their top songs
 * @param {string} artist - Artist name
 * @param {number} limit - Number of results to return (default: 10)
 * @returns {Array} Array of track objects
 */
async function getArtistTopTracks(artist, limit = 10) {
  try {
    console.log(`Getting top tracks for artist: "${artist}"`);
    
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'artist.gettoptracks',
        artist: artist,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: limit
      }
    });

    if (response.data && response.data.toptracks && response.data.toptracks.track) {
      const tracks = response.data.toptracks.track;
      return Array.isArray(tracks) ? tracks.slice(0, limit) : [tracks];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting artist top tracks:', error.message);
    return [];
  }
}

/**
 * Intelligent music search that tries multiple strategies
 * @param {string} query - Search query (e.g., "modern jazz hits", "upbeat 80s music", "artist similar to radiohead")
 * @param {number} limit - Number of results to return (default: 8)
 * @returns {Object} Search results with tracks and search strategy used
 */
async function intelligentMusicSearch(query, limit = 8) {
  try {
    console.log(`Performing intelligent music search for: "${query}"`);
    
    const queryLower = query.toLowerCase();
    let tracks = [];
    let strategy = '';
    
    // Strategy 1: Check if query contains "similar to" or "like"
    const similarMatch = queryLower.match(/(?:similar to|like|sounds like)\s+(.+)/);
    if (similarMatch) {
      const artist = similarMatch[1].trim();
      tracks = await getSimilarArtistTracks(artist, limit);
      strategy = `Similar to ${artist}`;
    }
    
    // Strategy 2: Check if query is asking for artist's top tracks
    else if (queryLower.includes('top') || queryLower.includes('best') || queryLower.includes('hits')) {
      const artistMatch = queryLower.match(/(?:top|best|hits).*(?:by|from)\s+(.+)/);
      if (artistMatch) {
        const artist = artistMatch[1].trim();
        tracks = await getArtistTopTracks(artist, limit);
        strategy = `Top tracks by ${artist}`;
      } else {
        // Extract potential genre/tag
        const words = query.split(' ').filter(word => 
          !['top', 'best', 'hits', 'songs', 'tracks', 'music'].includes(word.toLowerCase())
        );
        if (words.length > 0) {
          const tag = words.join(' ');
          tracks = await getTopTracksByTag(tag, limit);
          strategy = `Top ${tag} tracks`;
        }
      }
    }
    
    // Strategy 3: Check for genre/tag requests
    else if (queryLower.includes('jazz') || queryLower.includes('rock') || queryLower.includes('pop') || 
             queryLower.includes('electronic') || queryLower.includes('hip hop') || queryLower.includes('classical')) {
      const genreMatch = queryLower.match(/(jazz|rock|pop|electronic|hip hop|rap|classical|blues|country|folk|reggae|punk|metal)/);
      if (genreMatch) {
        const genre = genreMatch[1];
        tracks = await getTopTracksByTag(genre, limit);
        strategy = `${genre} recommendations`;
      }
    }
    
    // Strategy 4: Fallback to general search
    if (tracks.length === 0) {
      tracks = await searchTracksByQuery(query, limit);
      strategy = `General search`;
    }
    
    // Clean up and format track data
    const formattedTracks = tracks.map(track => ({
      name: track.name,
      artist: track.artist?.name || track.artist,
      playcount: track.playcount || 0,
      listeners: track.listeners || 0,
      url: track.url || ''
    }));
    
    return {
      tracks: formattedTracks,
      strategy,
      query,
      count: formattedTracks.length
    };
    
  } catch (error) {
    console.error('Error in intelligent music search:', error.message);
    return {
      tracks: [],
      strategy: 'Error',
      query,
      count: 0,
      error: error.message
    };
  }
}

module.exports = {
  searchTracksByQuery,
  getTopTracksByTag,
  getSimilarArtistTracks,
  getTopTracks,
  getArtistTopTracks,
  intelligentMusicSearch
};

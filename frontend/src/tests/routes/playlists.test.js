const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/userModel');
const Playlist = require('../../models/playlistModel');

// Create a simple test app just for testing basic routes
const app = express();
app.use(express.json());

// Simple mock routes for testing
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await Playlist.find({});
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('Playlist API Routes', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for each test
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      spotifyId: 'test_spotify_123',
      accessToken: 'mock_token',
      refreshToken: 'mock_refresh_token'
    });
    await testUser.save();
  });

  describe('GET /api/playlists', () => {
    it('should return empty array when no playlists exist', async () => {
      const response = await request(app)
        .get('/api/playlists');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return playlists when they exist', async () => {
      // Create a test playlist
      const playlist = new Playlist({
        title: 'Test Playlist',
        description: 'A test playlist',
        noOfSongs: 5,
        spotifyUrl: 'https://open.spotify.com/playlist/test123',
        spotifyId: 'test123',
        userId: testUser._id
      });
      await playlist.save();

      const response = await request(app)
        .get('/api/playlists');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Playlist');
      expect(response.body[0].userId).toBe(testUser._id.toString());
    });
  });

  describe('GET /api/playlists/:id', () => {
    it('should return specific playlist', async () => {
      const playlist = new Playlist({
        title: 'Specific Playlist',
        description: 'A specific test playlist',
        noOfSongs: 8,
        spotifyUrl: 'https://open.spotify.com/playlist/specific123',
        spotifyId: 'specific123',
        userId: testUser._id
      });
      await playlist.save();

      const response = await request(app)
        .get(`/api/playlists/${playlist._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Specific Playlist');
      expect(response.body._id).toBe(playlist._id.toString());
    });
  });

  describe('DELETE /api/playlists/:id', () => {
    it('should delete existing playlist', async () => {
      const playlist = new Playlist({
        title: 'To Delete',
        description: 'Will be deleted',
        noOfSongs: 3,
        spotifyUrl: 'https://open.spotify.com/playlist/delete123',
        spotifyId: 'delete123',
        userId: testUser._id
      });
      await playlist.save();

      const response = await request(app)
        .delete(`/api/playlists/${playlist._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Playlist deleted successfully');
      
      // Verify playlist was deleted from database
      const deletedPlaylist = await Playlist.findById(playlist._id);
      expect(deletedPlaylist).toBeNull();
    });
  });
});
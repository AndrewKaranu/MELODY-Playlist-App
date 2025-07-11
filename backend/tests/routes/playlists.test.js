const request = require('supertest');
const express = require('express');
const User = require('../../models/userModel');
const Playlist = require('../../models/playlistModel');

const app = express();
app.use(express.json());

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
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('Playlist API Routes', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      spotifyId: 'test_spotify_123',
      accessToken: 'mock_token',
      refreshToken: 'mock_refresh_token'
    });
    await testUser.save();
  });

  it('should handle playlist CRUD operations', async () => {
    // Test empty list
    let response = await request(app).get('/api/playlists');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);

    // Create and test playlist
    const playlist = new Playlist({
      title: 'Test Playlist',
      description: 'Test',
      noOfSongs: 5,
      spotifyUrl: 'https://open.spotify.com/playlist/test123',
      spotifyId: 'test123',
      userId: testUser._id
    });
    await playlist.save();

    // Test get all
    response = await request(app).get('/api/playlists');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Test Playlist');

    // Test get by ID
    response = await request(app).get(`/api/playlists/${playlist._id}`);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Test Playlist');

    // Test delete
    response = await request(app).delete(`/api/playlists/${playlist._id}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Playlist deleted successfully');
  });
});
const User = require('../../models/userModel');
const mongoose = require('mongoose');

describe('User Model', () => {
  it('should create user with required fields', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      spotifyId: 'spotify123'
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    expect(savedUser.username).toBe('testuser');
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.spotifyId).toBe('spotify123');
    expect(savedUser.playlistCount).toBe(0);
    expect(savedUser.isUnlimited).toBe(false);
    expect(savedUser.lastResetDate).toBeDefined();
  });

  it('should fail validation without required fields', async () => {
    const user = new User({
      username: 'testuser'
      // Missing email and spotifyId
    });
    
    await expect(user.save()).rejects.toThrow();
  });

  it('should enforce daily limit for regular users', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      spotifyId: 'spotify123',
      playlistCount: 10,
      isUnlimited: false
    });
    
    const canCreate = await user.checkDailyLimit();
    expect(canCreate).toBe(false);
  });

  it('should allow unlimited playlists for premium users', async () => {
    const user = new User({
      username: 'premiumuser',
      email: 'premium@example.com',
      spotifyId: 'spotify456',
      playlistCount: 15,
      isUnlimited: true
    });
    
    const canCreate = await user.checkDailyLimit();
    expect(canCreate).toBe(true);
  });
});
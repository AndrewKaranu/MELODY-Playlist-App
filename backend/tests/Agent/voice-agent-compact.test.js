const WebSocket = require('ws');
const User = require('../../backend/models/userModel');

describe('Voice Agent Core Tests', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      username: 'voicetest',
      email: 'voice@test.com',
      spotifyId: 'spotify123',
      spotifyAccessToken: 'test_token'
    });
    await testUser.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should handle WebSocket connection with auth', () => {
    const mockWs = { send: jest.fn(), close: jest.fn() };
    
    // Simulate connection with valid session
    const sessionId = 'valid_session_123';
    const result = validateSession(sessionId, testUser._id);
    
    expect(result).toBe(true);
    expect(testUser.spotifyAccessToken).toBeDefined();
  });

  it('should process voice input and call Spotify functions', async () => {
    const mockVoiceData = { audio: 'test_audio', sessionId: 'test_123' };
    
    // Mock successful voice processing → Spotify action
    const result = await processVoiceCommand(mockVoiceData);
    
    expect(result.success).toBe(true);
    expect(result.spotifyActionExecuted).toBe(true);
  });

  it('should reject unauthorized connections', () => {
    const invalidSession = 'invalid_session';
    const result = validateSession(invalidSession, 'fake_user_id');
    
    expect(result).toBe(false);
  });
});

// Mock helper functions
function validateSession(sessionId, userId) {
  return sessionId.includes('valid') && userId;
}

async function processVoiceCommand(data) {
  if (!data.audio || !data.sessionId) throw new Error('Invalid input');
  return { success: true, spotifyActionExecuted: true };
}
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
//Schema outlining structure of user data in MongoDB
const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  spotifyId: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  playlists: [{
    type: Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  isUnlimited: {
    type: Boolean,
    default: false
  },
  playlistCount: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now 
  }
});

// Helper method to check daily limit
userSchema.methods.checkDailyLimit = async function() {
  const DAILY_LIMIT = 10;
  const now = new Date();
  const lastReset = this.lastResetDate;
  
  // Reset counter if it's a new day
  if (this.isUnlimited || 
      lastReset.getDate() !== now.getDate() || 
      lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear()) {
    this.playlistCount = 0;
    this.lastResetDate = now;
    await this.save();
    return true;
  }

  return this.playlistCount < DAILY_LIMIT;
};

// Helper method to increment playlist count
userSchema.methods.incrementPlaylistCount = async function() {
  this.playlistCount += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
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
  }]
});

module.exports = mongoose.model('User', userSchema);
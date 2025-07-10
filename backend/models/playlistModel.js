const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Schema outlining structure of playlist data in MongoDB
const playlistSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
  },
  noOfSongs: {
    type: Number,
    required: true
  },
  spotifyUrl: {
    type: String,
    required: true
  },
  spotifyId: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: { 
    type: String 
  }
}, {timestamps: true});

module.exports = mongoose.model('Playlist', playlistSchema);
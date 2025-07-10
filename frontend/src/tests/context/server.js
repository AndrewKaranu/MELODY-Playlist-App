const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');


// Env
require('dotenv').config();

// Express app
const app = express();

// CORS Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}));



// Routes import
const playlistsRoutes = require('./routes/playlists');
const authRoutes = require('./routes/auth-routes');
const imageRoutes = require('./routes/image-routes');
const gameRoutes = require('./routes/game-routes');

//MonboDB Session Store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions'
});

// Catch errors
store.on('error', function(error) {
  console.error('MongoDB session store error:', error);
});

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SUPER_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // Session max age (e.g., 1 day)
  }
}));



// Request Log Middleware
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  next();
});



// Routes
app.use('/api/playlists', playlistsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/game', gameRoutes);



// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Listen for requests
    app.listen(process.env.PORT, () => {
      console.log('Connected to db and Listening on port 4000');
    });
  })
  .catch((error) => {
    console.log(error);
  });

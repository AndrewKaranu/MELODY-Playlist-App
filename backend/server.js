const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Env
require('dotenv').config();

// Express app
const app = express();
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ server });

// Import voice agent controller
const voiceAgentController = require('./controllers/voiceAgentController');

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
const voiceAgentRoutes = require('./routes/voice-agent-routes');
const playbackRoutes = require('./routes/playback-routes');

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
app.use('/api/voice-agent', voiceAgentRoutes);
app.use('/api/playback', playbackRoutes);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId) {
    ws.close(1000, 'Session ID required');
    return;
  }
  
  console.log(`WebSocket connection established for session: ${sessionId}`);
  voiceAgentController.handleWebSocketConnection(ws, sessionId);
});

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Listen for requests
    server.listen(process.env.PORT, () => {
      console.log('Connected to db and listening on port 4000');
      console.log('WebSocket server ready for voice agent connections');
    });
  })
  .catch((error) => {
    console.log(error);
  });

require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const User = require('../models/userModel');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

// Define scopes
const scopes = [
  'user-read-email',
  'user-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-recently-played',
  'user-top-read',
  'ugc-image-upload',
  'user-follow-read',
  'user-library-read'
];

// Redirect to Spotify for login
exports.login = (req, res) => {
  const state = generateRandomString(16);
  req.session.state = state;
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
};

// Callback from Spotify after login
exports.callback = async (req, res) => {
  const { code, state } = req.query;

  if (state === null || state !== req.session.state) {
    return res.redirect('/#' + new URLSearchParams({ error: 'state_mismatch' }).toString());
  }
  req.session.state = null;

  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    const me = await spotifyApi.getMe();
    const { id, display_name, email } = me.body;

    let user = await User.findOne({ spotifyId: id });

    if (!user) {
      user = new User({
        spotifyId: id,
        username: display_name,
        email: email,
        accessToken: access_token,
        refreshToken: refresh_token
      });
    } else {
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.username = display_name;
      user.email = email;
    }

    await user.save();
    console.log('User saved with access token:', user);

    req.session.user = {
      spotifyId: user.spotifyId,
      username: user.username,
      email: user.email,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in
    };

    console.log('Session after setting user:', req.session);

    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Error getting Tokens:', JSON.stringify(error));
    res.status(500).send('Error during authentication');
  }
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'User not authenticated' });
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Error logging out');
    res.redirect('http://localhost:3000/'); // Redirect to frontend
  });
};

// Helper function to generate a random string
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
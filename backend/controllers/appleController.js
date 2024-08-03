require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate Apple Developer Token
function generateDeveloperToken() {
  const token = jwt.sign({}, process.env.APPLE_PRIVATE_KEY, {
    algorithm: 'ES256',
    expiresIn: '180d', // 6 months
    audience: 'https://music.apple.com',
    issuer: process.env.APPLE_TEAM_ID,
    header: {
      alg: 'ES256',
      kid: process.env.APPLE_KEY_ID,
    }
  });
  return token;
}

// Redirect to Apple Music for login
exports.login = (req, res) => {
  const state = generateRandomString(16);
  req.session.state = state;

  // Apple Music doesn't have a predefined authorization URL like Spotify.
  // You must handle the MusicKit configuration on the frontend.

  res.redirect(`http://localhost:3000/apple-login?state=${state}`); // Frontend will handle MusicKit login
};

// Callback from Apple Music after login
exports.callback = async (req, res) => {
  const { musicUserToken, state } = req.query;

  if (state === null || state !== req.session.state) {
    return res.redirect('/#' + new URLSearchParams({ error: 'state_mismatch' }).toString());
  }
  req.session.state = null;

  if (!musicUserToken) {
    return res.status(400).send('Music user token is missing');
  }

  const developerToken = generateDeveloperToken();

  try {
    // Exchange music user token for user info (handle this on the frontend or here if possible)
    const userInfo = await getUserInfoFromAppleMusic(musicUserToken, developerToken); // You'll need to implement this function

    const { id, name, email } = userInfo; // Adjust this according to Apple's user info response

    let user = await User.findOne({ appleMusicId: id });

    if (!user) {
      user = new User({
        appleMusicId: id,
        username: name,
        email: email,
        appleMusicAccessToken: musicUserToken,
      });
    } else {
      user.appleMusicAccessToken = musicUserToken;
      user.username = name;
      user.email = email;
    }

    await user.save();
    console.log('User saved with access token:', user);

    req.session.user = {
      appleMusicId: user.appleMusicId,
      username: user.username,
      email: user.email,
      appleMusicAccessToken: musicUserToken,
    };

    console.log('Session after setting user:', req.session);

    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Error during authentication:', error);
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

// Implement the function to get user info from Apple Music
async function getUserInfoFromAppleMusic(musicUserToken, developerToken) {
  // Use Apple Music API to get user info
  // Refer to Apple Music API documentation for the correct endpoints and data format
  // Example:
  // const response = await fetch('https://api.music.apple.com/v1/me', {
  //   headers: {
  //     'Authorization': `Bearer ${developerToken}`,
  //     'Music-User-Token': musicUserToken
  //   }
  // });
  // const data = await response.json();
  // return data;

  // This is just a placeholder. You'll need to implement the actual API call and response handling.
}

module.exports = {
  login,
  callback,
  ensureAuthenticated,
  logout,
  generateDeveloperToken,
  getUserInfoFromAppleMusic
};

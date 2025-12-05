const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

// Initiate OAuth
router.get('/airtable', (req, res) => {
  const authUrl = `https://airtable.com/oauth2/v1/authorize?client_id=${process.env.AIRTABLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.AIRTABLE_REDIRECT_URI)}&response_type=code&scope=data.records:read data.records:write schema.bases:read webhook:manage`;
  res.redirect(authUrl);
});

// OAuth Callback
router.get('/airtable/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://airtable.com/oauth2/v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        client_id: process.env.AIRTABLE_CLIENT_ID,
        client_secret: process.env.AIRTABLE_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { id, email } = userResponse.data;

    // Save or update user
    let user = await User.findOne({ airtableUserId: id });
    if (user) {
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiry = new Date(Date.now() + expires_in * 1000);
    } else {
      user = new User({
        airtableUserId: id,
        email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000)
      });
    }
    await user.save();

    // Redirect to frontend with user ID
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?userId=${user._id}`);
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const { userId } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: 'No refresh token available' });
    }

    const tokenResponse = await axios.post(
      'https://airtable.com/oauth2/v1/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken,
        client_id: process.env.AIRTABLE_CLIENT_ID,
        client_secret: process.env.AIRTABLE_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    user.accessToken = access_token;
    user.refreshToken = refresh_token;
    user.tokenExpiry = new Date(Date.now() + expires_in * 1000);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const user = await User.findById(userId).select('-accessToken -refreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

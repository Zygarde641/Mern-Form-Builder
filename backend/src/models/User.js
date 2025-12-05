const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  airtableUserId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  accessToken: { type: String, required: true },
  refreshToken: String,
  tokenExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

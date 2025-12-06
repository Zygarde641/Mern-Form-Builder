require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const AIRTABLE_CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const AIRTABLE_CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;
const AIRTABLE_REDIRECT_URI = process.env.AIRTABLE_REDIRECT_URI;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const AIRTABLE_AUTH_URL = "https://airtable.com/oauth2/v1/authorize";
const AIRTABLE_TOKEN_URL = "https://airtable.com/oauth2/v1/token";

// Store state and PKCE tokens temporarily (in production, use Redis or database)
const stateStore = new Map();

// PKCE helper functions
function generateCodeVerifier() {
  // Generate random 64-byte string, base64url encoded (86 chars)
  return crypto.randomBytes(64).toString("base64url");
}

function generateCodeChallenge(verifier) {
  // SHA256 hash of verifier, base64url encoded
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "FormFlow API" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/auth/airtable", (req, res) => {
  // Generate random state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");
  
  // Generate PKCE code_verifier and code_challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Store state and code_verifier with timestamp (expires in 10 minutes)
  stateStore.set(state, { 
    createdAt: Date.now(),
    codeVerifier: codeVerifier
  });
  
  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of stateStore.entries()) {
    if (value.createdAt < tenMinutesAgo) {
      stateStore.delete(key);
    }
  }

  const params = new URLSearchParams({
    client_id: AIRTABLE_CLIENT_ID,
    response_type: "code",
    redirect_uri: AIRTABLE_REDIRECT_URI,
    scope: "data.records:read data.records:write schema.bases:read webhook:manage",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`${AIRTABLE_AUTH_URL}?${params.toString()}`);
});

app.get("/auth/airtable/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    return res.status(400).json({ success: false, error });
  }

  // Verify state parameter
  if (!state || !stateStore.has(state)) {
    return res.status(400).json({ success: false, error: "Invalid state parameter" });
  }
  
  // Get stored data and remove used state
  const storedData = stateStore.get(state);
  const codeVerifier = storedData.codeVerifier;
  stateStore.delete(state);

  if (!code) {
    return res
      .status(400)
      .json({ success: false, error: "Missing authorization code" });
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: AIRTABLE_CLIENT_ID,
      client_secret: AIRTABLE_CLIENT_SECRET,
      redirect_uri: AIRTABLE_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await axios.post(AIRTABLE_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokens = tokenResponse.data;

    res.json({
      success: true,
      tokens,
    });
  } catch (e) {
    console.error("Token exchange failed:", e.response?.data || e.message);
    res.status(500).json({
      success: false,
      error: "Failed to exchange code for token",
      details: e.response?.data || e.message,
    });
  }
});

app.post("/webhook/airtable", (req, res) => {
  const signature = req.header("x-airtable-webhook-signature");
  if (!signature || !WEBHOOK_SECRET) {
    return res.status(401).end();
  }

  res.status(200).json({ success: true });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

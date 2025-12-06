// backend/src/backend.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const AIRTABLE_CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const AIRTABLE_CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;
const AIRTABLE_REDIRECT_URI = process.env.AIRTABLE_REDIRECT_URI;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const AIRTABLE_AUTH_URL = "https://airtable.com/oauth2/v1/authorize";
const AIRTABLE_TOKEN_URL = "https://airtable.com/oauth2/v1/token";

router.get("/auth/airtable", (req, res) => {
  const params = new URLSearchParams({
    client_id: AIRTABLE_CLIENT_ID,
    response_type: "code",
    redirect_uri: AIRTABLE_REDIRECT_URI,
    scope: "data.records:read data.records:write schema.bases:read webhook:manage",
  });

  res.redirect(`${AIRTABLE_AUTH_URL}?${params.toString()}`);
});

router.get("/auth/airtable/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ success: false, error });
  }

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

router.post("/webhook/airtable", (req, res) => {
  const signature = req.header("x-airtable-webhook-signature");
  if (!signature || !WEBHOOK_SECRET) {
    return res.status(401).end();
  }

  res.status(200).json({ success: true });
});

module.exports = router;

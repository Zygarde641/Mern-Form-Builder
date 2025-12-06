require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();

app.use(bodyParser.json());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true
  })
);

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.MONGO_URI;

if (mongoUri) {
  mongoose
    .connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error', err));
}

const baseRedirectUri = (process.env.AIRTABLE_REDIRECT_URI || '').replace(
  /\/$/,
  ''
);
const airtableCallbackPath = '/auth/airtable/callback';
const airtableRedirectUri = baseRedirectUri + airtableCallbackPath;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Mern Form Builder API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/auth/airtable', (req, res) => {
  const scopes =
    'data.records:read data.records:write schema.bases:read webhook:manage';
  const params = new URLSearchParams({
    client_id: process.env.AIRTABLE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: airtableRedirectUri,
    scope: scopes
  });
  const url = 'https://airtable.com/oauth2/v1/authorize?' + params.toString();
  res.redirect(url);
});

app.get(airtableCallbackPath, async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.AIRTABLE_CLIENT_ID,
      client_secret: process.env.AIRTABLE_CLIENT_SECRET,
      redirect_uri: airtableRedirectUri
    });

    const tokenResponse = await axios.post(
      'https://airtable.com/oauth2/v1/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const data = tokenResponse.data;

    if (process.env.FRONTEND_URL) {
      const url = new URL(process.env.FRONTEND_URL);
      url.searchParams.set('access_token', data.access_token || '');
      if (data.refresh_token) {
        url.searchParams.set('refresh_token', data.refresh_token);
      }
      return res.redirect(url.toString());
    }

    return res.json(data);
  } catch (err) {
    console.error(
      'Error exchanging Airtable code',
      err.response ? err.response.data : err.message
    );
    return res.status(500).send('Failed to complete Airtable OAuth');
  }
});

app.post('/webhooks/airtable', (req, res) => {
  const signature =
    req.headers['x-airtable-signature'] ||
    req.headers['x-airtable-webhook-signature'];

  if (process.env.WEBHOOK_SECRET) {
    const payload = JSON.stringify(req.body);
    const digest = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== digest) {
      return res.status(401).send('Invalid signature');
    }
  }

  console.log('Received Airtable webhook', req.body);
  res.status(200).json({ received: true });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

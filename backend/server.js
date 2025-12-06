// server.js (example)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'   // set to your Vercel domain in env
}));

app.get('/health', (req, res) => res.json({ ok: true }));

// Example DB connect (Mongo)
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) console.warn('MONGO_URI not set — database will fail to connect');
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('Mongo connected'))
  .catch(err => console.error('Mongo connect error', err));

// your routes here
// app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

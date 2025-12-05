# Airtable Dynamic Form Builder

A full-stack MERN application for creating dynamic forms connected to Airtable bases with OAuth authentication, conditional logic, and real-time webhook synchronization.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Axios |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Authentication | Airtable OAuth 2.0 |
| Integration | Airtable REST API, Webhooks |

## Features

- **Airtable OAuth 2.0** - Secure token-based authentication with automatic refresh
- **Dynamic Form Builder** - Auto-generates forms from Airtable table schemas
- **Conditional Logic** - Show/hide questions based on previous answers (AND/OR operators)
- **Webhook Sync** - Real-time synchronization when Airtable records change
- **Supported Fields** - Single/Multi-line Text, Single/Multiple Select, Attachments

## Project Structure

```
├── backend/
│   └── src/
│       ├── models/         # Mongoose schemas (User, Form, Response)
│       ├── routes/         # API endpoints (auth, forms, responses, webhooks)
│       ├── utils/          # Conditional logic evaluation
│       └── server.js       # Express server entry point
└── frontend/
    └── src/
        ├── pages/          # React pages (Login, Dashboard, FormBuilder, FormViewer)
        ├── services/       # API client
        └── utils/          # Shared utilities
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Airtable OAuth App ([Create here](https://airtable.com/create/oauth))

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env    # Configure your environment variables
npm run dev             # Runs on http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev             # Runs on http://localhost:5173
```

### Environment Variables

**Backend (.env)**
```
MONGODB_URI=your_mongodb_uri
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:5000/auth/airtable/callback
FRONTEND_URL=http://localhost:5173
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/airtable` | Initiate OAuth flow |
| GET | `/api/forms/bases` | Fetch user's Airtable bases |
| POST | `/api/forms` | Create new form |
| GET | `/api/forms/:id` | Get form by ID |
| POST | `/api/responses` | Submit form response |
| POST | `/webhooks/airtable` | Handle Airtable webhooks |

## Architecture Highlights

- **Conditional Logic Engine** - Identical implementation on frontend and backend ensures consistent behavior
- **Soft Delete Pattern** - Webhook-triggered deletions mark records as `deletedInAirtable: true` instead of hard deleting
- **Token Management** - Automatic OAuth token refresh with secure database storage

# RepuFlow

RepuFlow is a reputation management tool for small service businesses. It helps business owners monitor their Google reviews and send review requests to customers — all from a simple dashboard.

---

## The Problem

Small trades businesses (plumbers, electricians, contractors) rely heavily on word of mouth and Google reviews to get new customers. Most of them know reviews matter but never ask for them — they forget, feel awkward, or just don't have a system. The tools that exist (Birdeye, Podium) are built for enterprise and cost hundreds of dollars a month.

RepuFlow is built for the one-person trades operation that just wants to know what their customers are saying and make it easy to ask for more reviews.

---

## What It Does

- Business owners sign up and search for their business by name — RepuFlow pulls their Google listing automatically
- Their existing reviews are displayed on a dashboard with sentiment scoring (positive, neutral, negative)
- They can add customers and send them a review request via SMS with one tap
- Negative reviews trigger an alert so the owner can respond before it becomes a bigger issue

---

## Tech Stack

- **Frontend** — React + Vite
- **Backend** — Node.js + Express
- **Database + Auth** — Supabase (PostgreSQL)
- **SMS** — Twilio (planned)
- **Review Data** — Google Places API (New)
- **Sentiment Analysis** — VADER (planned)

---

## Current Status

This project is actively in development. Here's what's working:

**Done:**
- User authentication — signup, login, logout via Supabase Auth
- Protected routing — unauthenticated users are redirected to login
- Business search — Google Places autocomplete lets users find and select their business by name
- Review fetching — Google Places details route returns reviews, rating, address, and phone number for any selected business
- Secure API proxy — all Google API calls go through the Express backend so API keys are never exposed to the browser

**In progress:**
- Saving selected business to the database
- Customer management (adding customers to send review requests to)
- SMS review request sending via Twilio
- Dashboard with sentiment-scored review display
- Negative review alerts

**Known limitations:**
- Google's Places API returns a maximum of 5 reviews per business. This is a hard limit set by Google and applies to all applications using their official API. For a production version of RepuFlow, a third party service like Outscraper would be used to fetch the full review history. For the purposes of this demo, 5 reviews are sufficient to demonstrate the sentiment analysis and dashboard functionality.

---

## Running Locally

**Prerequisites:** Node.js, a Supabase account, a Google Cloud account with Places API enabled

**Clone the repo:**
```bash
git clone https://github.com/YOURUSERNAME/RepuFlow.git
cd RepuFlow
```

**Set up the server:**
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_PLACES_KEY=your_google_places_api_key
PORT=8080

**Set up the client:**
```bash
cd client
npm install
```

Create a `.env` file in the `client` folder:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

**Run the server:**
```bash
cd server
node index.js
```

**Run the client:**
```bash
cd client
npm run dev
```

The app will be running at `http://localhost:5173` and the API at `http://localhost:8080`.

---

## Database Schema

Three tables in Supabase:

**businesses** — stores each user's business, linked to their auth account via `user_id` and identified on Google via `place_id`

**customers** — stores the contacts each business wants to send review requests to, linked to a business via `business_id`

**review_requests** — logs every review request sent, tracking which customer received it, which business sent it, when it was sent, and whether it succeeded

---

## Architecture Notes

All external API calls (Google Places) are proxied through the Express backend rather than called directly from the browser. This keeps API keys off the client entirely. The pattern is straightforward — the React frontend calls your own Express server, the server calls the external API with the key stored in its environment, and returns the result. This is standard practice for any production application handling sensitive credentials.
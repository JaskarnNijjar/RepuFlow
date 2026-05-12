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
- **SMS** — Twilio
- **Review Data** — Google Places API (New)
- **Sentiment Analysis** — VADER
- **AI Summaries** — Groq API (Llama 3.1 8B)

---

## Current Status

This project is actively in development. Here's what's working:

**Done:**
- User authentication — signup, login, logout via Supabase Auth
- Protected routing — unauthenticated users are redirected to login
- Business search — Google Places autocomplete lets users find and select their business by name
- Review fetching — Google Places details route returns reviews, rating, address, and phone number for any selected business
- Secure API proxy — all Google API calls go through the Express backend so API keys are never exposed to the browser
- Sentiment scoring — every review is scored by VADER and classified as positive, neutral, or negative based on its compound score
- AI review summary — all review texts are sent to the Groq API (Llama 3.1 8B Instant) with an analyst prompt, which returns a plain-prose paragraph covering what customers consistently praise, recurring complaints, and an overall sentiment verdict
- Saving selected business to the database — when a user claims their business, it is saved to the businesses table in Supabase tied to their user account
- Customer management — business owners can add customers by name and phone number from the dashboard; customers are stored in the database linked to their business
- SMS review request sending via Twilio — owners can send a personalized review request SMS to any customer with one click; each request is logged in the review_requests table
- Dashboard with sentiment-scored review display — the dashboard shows all fetched reviews with sentiment labels and an overall sentiment meter (gradient bar from negative to positive based on average star rating)
- Public business search and profile — anyone can search for any business and view its review profile without logging in; the profile shows reviews, sentiment meter, and AI summary
- Business claiming — authenticated users can claim a business listing from the public profile page; includes a disclaimer modal requiring users to certify ownership before proceeding

**Known limitations:**
- Google's Places API returns a maximum of 5 reviews per business. This is a hard limit set by Google and applies to all applications using their official API. For a production version of RepuFlow, a third-party service like Outscraper would be used to fetch the full review history. For the purposes of this demo, 5 reviews are sufficient to demonstrate the sentiment analysis and AI summary functionality.
- The AI summary is generated from only the reviews returned by the Google Places API (max 5). A production version would feed a much larger review corpus to the model for a more representative analysis.
- Groq's free tier has rate limits. For a production deployment, this would be handled with a queuing strategy or a paid tier.
- Twilio trial accounts prefix all messages with "Sent from your Twilio trial account" and can only send to verified phone numbers. Both restrictions are lifted on a paid account.
- Business ownership verification currently uses an honor system — users check a box confirming they are the authorized owner. A production version would use Google Business Profile OAuth to verify ownership programmatically.
- The sentiment meter uses average star ratings normalized to a -1 to 1 scale rather than pure NLP scoring, since star ratings are a more reliable signal than text tone alone. VADER compound scores are still computed and used for per-review sentiment labels.
- AI review summarization uses Groq's free tier (Llama 3.1 8B Instant). Summaries are cached per Place ID to avoid redundant API calls and stay within rate limits.

---

## Running Locally

**Prerequisites:** Node.js, a Supabase account, a Google Cloud account with Places API enabled, a Groq account (free at console.groq.com)

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
GROQ_API_KEY=your_groq_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
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
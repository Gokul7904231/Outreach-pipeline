# AI-Powered B2B Cold Outreach Pipeline 🚀

An end-to-end B2B outbound campaign automation platform designed for modern growth and sales teams. The dashboard allows users to find prospects, generate personalized outreach messages using Google Gemini AI, and dispatch emails via Brevo.

---

## 🛠️ Technology Stack & Architecture

```
        ┌──────────────────────────────────────────┐
        │            React Dashboard               │
        │             (Vite + CSS)                 │
        └────────────────────┬─────────────────────┘
                             │
                             ▼ (Axios HTTP API)
        ┌──────────────────────────────────────────┐
        │            Express Backend               │
        │             (Node.js REST)               │
        └────────────────────┬─────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼ (Sourcing)       ▼ (Personalization)▼ (Delivery)
     ┌──────────┐       ┌──────────┐       ┌──────────┐
     │ Prospeo  │       │  Google  │       │  Brevo   │
     │   API    │       │  Gemini  │       │  SMTP    │
     └────┬─────┘       └────┬─────┘       └────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  db.json Logs   │
                    │  (Local Storage)│
                    └─────────────────┘
```

---

## 🌟 Key Features

1. **Prospect Search & Enrichment**: Sourced via Prospeo API. Filter by job titles, names, and companies, with single-click email discovery.
2. **AI Email Personalization**: An SDR Copilot driven by Google Gemini API (`gemini-1.5-flash`) that crafts contextual, high-conversion cold emails in under 150 words using Lead details and custom tone selectors.
3. **Outbound Dispatch**: Integrated with Brevo's Transactional SMTP Relay to send authenticated cold emails.
4. **Seamless Mock Fallback Mode**: If any API keys are missing or invalid, the app switches to an offline simulation mode. This allows recruiters, peers, and developers to test the application instantly without rate limits or key failures.
5. **Campaign Logs**: A complete audit trail tracking delivery timestamps, recipient companies, dispatch statuses, and the exact AI-generated email payload.
6. **API Status Diagnostics**: A health check dashboard showing the connectivity status of all third-party integrations in real-time.

---

## ⚡ Setup & Run Instructions

### 1. Configure Backend Variables
Navigate to `/backend` and create or verify the `.env` configuration file:

```env
PORT=5000

# Sourcing API Key
PROSPEO_API_KEY=your_prospeo_api_key

# AI Copilot API Key
GEMINI_API_KEY=your_gemini_api_key

# Delivery SMTP API Key & Senders
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_verified_sender_email
SENDER_NAME=your_sender_name
```
*Note: If any key is left blank, the respective service automatically runs in Mock Mode.*

### 2. Start the Backend Server
```bash
cd backend
npm install
npm start
```
The server will boot up at `http://localhost:5000` with the health check available at `http://localhost:5000/api/health`.

### 3. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
The React development server will start at `http://localhost:5173`. Open this URL in your browser to view and test the application!

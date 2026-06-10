# 🤖 AI HRMS — AI-Powered Human Resource Management System

A next-generation, full-stack **MERN** HRMS that uses AI to streamline and automate HR
operations: employee management, attendance, payroll, performance tracking, and a fully
**automated AI recruitment pipeline** (resume screening + conversational/voice screening).

Built for the theme: **"Build the Future of HR Management with AI-Powered Solutions."**

---

## 🌐 Live Demo

### 👉 **[https://ai-hrms-mx2e.onrender.com](https://ai-hrms-mx2e.onrender.com)**

**Demo logins** — password for all accounts: **`password123`**

| Role | Email |
|------|-------|
| Management Admin | `admin@hrms.com` |
| Senior Manager | `manager@hrms.com` |
| HR Recruiter | `recruiter@hrms.com` |
| Employee | `employee@hrms.com` |

> 🧑‍💼 **Public careers portal** (apply + AI screening, no login): **[/careers](https://ai-hrms-mx2e.onrender.com/careers)**
>
> ⏳ *Hosted on a free tier — the first load after idle may take ~30–50s to wake up.*

---

## ✨ Features

### Core HRMS
- **Employee data management** — searchable, paginated directory (built to scale to 5,000+).
- **Attendance** — check-in / check-out, worked hours, team view, live updates via WebSockets.
- **Leave management** — apply, approve/reject workflow.
- **Payroll** — one-click monthly payroll generation, payslips, mark-as-paid.
- **Performance** — reviews, 1–5 ratings, KPI tracking, goals.

### AI-Powered
- **Automated resume screening** — applicants are scored 0–100 against the job with
  matched/missing skills, strengths, concerns and a recommendation — **no human in the loop**.
- **AI conversational + voice screening** — an AI recruiter conducts a screening interview;
  speech-to-text and text-to-speech via the browser Web Speech API.
- **AI HR assistant** — a floating chatbot (with voice) available to every logged-in user.
- **Provider-agnostic & free** — uses any OpenAI-compatible API (default **Groq**, free tier).
  If no API key is set, it **automatically falls back to a local heuristic** so everything still runs.

### Multi-role access & dashboards
| Role | Access |
|------|--------|
| **Management Admin** | Everything — company-wide + personal dashboards, employee/payroll management |
| **Senior Manager** | Company + team dashboards, leave approvals, performance reviews |
| **HR Recruiter** | AI recruitment suite, employee directory, attendance |
| **Employee** | Personal dashboard, attendance, leave, payslips, reviews |

- **Personalized dashboards** — each user sees their own activity; admins/managers also see
  **company-wide** analytics (headcount by department, role distribution, attendance rate,
  payroll totals, recruitment funnel) with charts.
- **Scalability** — pagination, DB indexes, connection pooling, rate limiting, and Socket.io
  rooms for targeted real-time updates.
- **Responsive UI** — clean Tailwind design that works on web and mobile.

---

## 🧱 Tech Stack
- **Frontend:** React 18 + Vite, React Router, Tailwind CSS, Recharts, Socket.io-client, Axios
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT auth, Socket.io, Multer, pdf-parse
- **AI:** OpenAI-compatible Chat Completions (Groq by default) + Web Speech API for voice

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (tested on Node 26)
- **MongoDB** running locally, or a free **MongoDB Atlas** cluster

Install MongoDB locally (macOS):
```bash
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
```
…or use Docker:
```bash
docker run -d --name hrms-mongo -p 27017:27017 mongo:7
```

### 1. Install dependencies
```bash
# from the project root
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
```
Edit `server/.env` if needed. To enable real AI screening, get a **free** Groq key at
<https://console.groq.com/keys> and set:
```env
AI_API_KEY=gsk_your_key_here
```
> Leave `AI_API_KEY` empty to run in heuristic-fallback mode (no external calls required).

### 3. Seed demo data
```bash
npm run seed
```
This creates 4 demo accounts (one per role) plus ~40 employees, attendance, payroll,
performance reviews, jobs and pre-screened candidates.

### 4. Run (server + client together)
```bash
npm run dev
```
This starts the API and the web app together; Vite prints the local web address in your
terminal. Log in with the [demo credentials](#-live-demo) above.

> 🌐 Prefer not to run it locally? Use the hosted version: **[https://ai-hrms-mx2e.onrender.com](https://ai-hrms-mx2e.onrender.com)**

---

## 🗂️ Project Structure
```
fwc/
├── package.json            # root scripts (concurrently runs both apps)
├── server/                 # Express + MongoDB API
│   ├── .env.example
│   └── src/
│       ├── index.js        # HTTP + Socket.io entry
│       ├── app.js          # Express app + middleware + routes
│       ├── config/         # db connection, role definitions
│       ├── models/         # User, Attendance, LeaveRequest, Payroll, Performance, Job, Candidate
│       ├── middleware/      # auth (JWT + RBAC), error handling, asyncHandler
│       ├── controllers/    # auth, employee, attendance, leave, payroll, performance, recruitment, dashboard, ai
│       ├── routes/         # one router per domain
│       ├── services/       # aiService (Groq + fallback), resumeParser (pdf-parse)
│       ├── sockets/        # Socket.io setup + role/user emit helpers
│       └── utils/          # token signing, seed script
└── client/                 # React + Vite + Tailwind SPA
    └── src/
        ├── api/            # axios client, socket client
        ├── context/        # AuthContext
        ├── hooks/          # useSpeech (Web Speech API)
        ├── components/     # Layout, UI primitives, AssistantWidget
        └── pages/          # Login, Dashboard, Employees, Attendance, Leave,
                            #   Payroll, Performance, Recruitment, CandidateDetail, CareerApply
```

---

## 🔌 Key API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/dashboard/me` | Personal dashboard |
| GET | `/api/dashboard/company` | Company-wide dashboard (management) |
| GET | `/api/employees` | Paginated/searchable directory |
| POST | `/api/attendance/check-in` / `check-out` | Mark attendance |
| POST | `/api/leave` · `PUT /api/leave/:id/review` | Apply / approve leave |
| POST | `/api/payroll/generate` | Generate monthly payroll |
| POST | `/api/recruitment/jobs/:jobId/apply` | Apply + **auto AI screening** |
| POST | `/api/recruitment/candidates/:id/interview` | One turn of AI screening interview |
| POST | `/api/ai/assistant` | HR assistant chatbot |

---

## ⚙️ Notes
- **Voice features** (mic + speech) use the browser Web Speech API — best in Chrome/Edge.
- The app runs end-to-end **without any AI key** thanks to the heuristic fallback; add a key
  for genuine LLM-quality screening and conversation.
- For Atlas, paste your SRV connection string into `MONGO_URI` in `server/.env`.

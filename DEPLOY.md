# 🚀 Deploy AI HRMS to a Live URL (free)

Architecture: **one Render web service** runs Express, which serves both the API and the
built React app (same origin — no CORS/proxy needed). Data lives in **MongoDB Atlas** (free),
and AI uses your **Groq** key.

Total time: ~15 minutes. Cost: ₹0.

---

## Step 1 — MongoDB Atlas (free database)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up.
2. **Create a free cluster** → choose the **M0 (Free)** tier → pick any cloud/region → Create.
3. **Database Access** → *Add New Database User* → set a username + password (save them).
4. **Network Access** → *Add IP Address* → **Allow Access from Anywhere** (`0.0.0.0/0`).
   *(Render's IPs are dynamic, so this is the simplest option for a demo.)*
5. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add the database name `ai_hrms` before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai_hrms?retryWrites=true&w=majority
   ```
   Keep this string handy — you'll use it as `MONGO_URI`.

---

## Step 2 — Seed the cloud database (one time, from your machine)

Populate Atlas with the demo accounts + sample data:

```bash
cd /Users/aman/Desktop/fwc/server
MONGO_URI="<your-atlas-string-from-step-1>" npm run seed
```

You should see "✅ Seed complete!" with the 4 demo logins.

---

## Step 3 — Deploy to Render

### Option A — Blueprint (uses the included render.yaml, fastest)
1. Go to <https://dashboard.render.com> and sign up (GitHub login is easiest).
2. **New → Blueprint** → connect your GitHub → pick **`jaiswalaman2020/AI_HRMS`**.
3. Render reads `render.yaml` and shows one service. Click **Apply**.
4. When prompted, fill in the two secret env vars:
   - `MONGO_URI` → your Atlas string from Step 1
   - `AI_API_KEY` → your Groq key (`gsk_...`)
   - *(`JWT_SECRET` is auto-generated; `AI_BASE_URL` / `AI_MODEL` / `NODE_ENV` are preset.)*
5. Click **Create / Deploy**.

### Option B — Manual (if you prefer clicking through)
1. **New → Web Service** → connect the repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
   - **Instance Type:** Free
3. **Environment → Add** these variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas string |
   | `JWT_SECRET` | any long random string |
   | `AI_API_KEY` | your Groq key |
   | `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
   | `AI_MODEL` | `llama-3.3-70b-versatile` |
4. **Create Web Service.**

---

## Step 4 — Get your live link 🎉

- The first build takes ~3–5 minutes. Watch the **Logs** tab; success looks like:
  `🚀 AI-HRMS API running on http://localhost:10000`
- Your public URL appears at the top, e.g. **`https://ai-hrms.onrender.com`**.
- Open it → log in with `admin@hrms.com` / `password123`.
- **This is the link you share.** The careers portal is at `https://<your-url>/careers`.

---

## ⚠️ Things to know
- **Cold start:** Render's free tier sleeps after ~15 min idle, so the first visit after a
  pause can take ~30–50 s to wake. Open it a minute before demoing.
- **Don't lose the demo data:** if you ever want to re-seed, re-run Step 2.
- **Voice features** need HTTPS (Render provides it automatically) and Chrome/Edge.
- **Security note:** `0.0.0.0/0` on Atlas and the demo passwords are fine for a hackathon
  demo, not for real production.

---

## Alternative hosts (same single-service model)
The same repo deploys the same way on:
- **Railway** (<https://railway.app>) — New Project → Deploy from GitHub → add the env vars.
- **Fly.io** / **Cyclic** — set build `npm run build`, start `npm start`, same env vars.

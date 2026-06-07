# 🎬 AI HRMS — Complete Demo Guide

A click-by-click walkthrough of **every feature**, organised as a demo script you can
follow live. Estimated time: ~12–15 minutes for the full tour.

---

## 0. Start the platform

```bash
cd /Users/aman/Desktop/fwc
npm run seed     # (optional) reset to fresh demo data
npm run dev      # API → :5050, web → :5173
```

Open **http://localhost:5173**.

### Demo accounts (password for all: `password123`)
| Role | Email | What to show |
|------|-------|--------------|
| Management Admin | `admin@hrms.com` | Everything — company analytics, employees, payroll |
| Senior Manager | `manager@hrms.com` | Team oversight, leave approvals, performance reviews |
| HR Recruiter | `recruiter@hrms.com` | AI recruitment suite |
| Employee | `employee@hrms.com` | Self-service: attendance, leave, payslips, reviews |

> 💡 On the login page, click any of the **quick demo login** cards to auto-fill credentials.

---

## 1. The Login & Multi-Role System  (30s)

1. Land on the split-screen login. Note the branded marketing panel listing the AI features.
2. Click the **Management Admin** quick-login card → it fills the form → **Sign in**.
3. Point out: the sidebar that appears is **tailored to the role** — an admin sees all 7
   modules; an employee will see far fewer.

**Talking point:** *"Access is enforced both in the UI and on the API with JWT + role-based
middleware — an employee literally gets a 403 if they call an admin endpoint."*

---

## 2. Admin Dashboard — Company-Wide + Personal  (2 min)

Logged in as **admin@hrms.com**, you land on the Dashboard. Walk through the three bands:

**A. Company Overview** (admins/managers only)
- 8 live KPI cards: Total Employees, Present Today, Attendance Rate %, Open Positions,
  Avg Performance, On Leave, Shortlisted, Last Payroll total.
- **Headcount by Department** bar chart.
- **Users by Role** pie chart.

**B. Recruitment (AI)** band
- Candidate pipeline bar chart (applied → screened → shortlisted → …).
- **Top AI-Ranked Candidates** list with fit scores.

**C. My Activity** (every user has this)
- Today's attendance status, days present, pending leaves, latest net pay.
- Latest performance review with rating + KPI bars.

**Talking point:** *"Every role gets a personalized 'My Activity' view; management
additionally gets company-wide analytics — all computed server-side with MongoDB
aggregation pipelines."*

---

## 3. Employee Management  (1.5 min)

Sidebar → **Employees**.

1. Show the count ("44 people in the organisation").
2. **Search** — type a name or `EMP0012`; results filter live (debounced).
3. **Filter by department** — pick "Engineering" from the dropdown.
4. **Pagination** — page through with Prev/Next (12 per page; built to scale to thousands).
5. Click **+ Add Employee** (admin only):
   - Fill name/email/password, pick a **role**, department, designation, salary → **Create**.
   - The new person appears in the list with an auto-generated `EMP####` ID.

**Talking point:** *"Listing is paginated and indexed so it stays fast at 5,000+ employees.
Only admins can create accounts or assign privileged roles."*

---

## 4. Attendance + Real-Time Updates  (1.5 min)

Sidebar → **Attendance**.

1. Top card shows today's status. Click **Check In** → time stamps instantly.
2. (Later) **Check Out** → it computes worked hours.
3. As admin/HR you also see **team stats** (records today, present/remote, on leave) and a
   live **Team — Today** table.

**🔴 Real-time demo (impressive):**
- Open a second browser/incognito window, log in as `employee@hrms.com`, and **Check In**.
- Switch back to the admin window — the company dashboard's attendance numbers update
  **without a refresh** (Socket.io pushes the change to management dashboards).

**Talking point:** *"Attendance events are pushed over WebSockets to role-scoped rooms, so
managers see presence update live."*

---

## 5. Leave Management  (1 min)

Sidebar → **Leave**.

1. Click **+ Apply for Leave** → choose type (casual/sick/earned/unpaid), dates, reason → submit.
2. As **admin/manager**, the **Pending Approvals** section lists requests with employee,
   type, dates, reason.
3. Click **Approve** or **Reject** — status updates immediately.
4. Switch to the applying employee to show the status reflected in *My Leave Requests*.

**Talking point:** *"Full apply → review workflow; employees track status, managers act on a queue."*

---

## 6. Payroll  (1.5 min)

Sidebar → **Payroll**.

1. As **admin**, click **Generate <Month> payroll** → it processes payslips for all active
   employees (basic + 20% allowance − 10% tax = net).
2. The company table fills in: per-employee basic / allowances / tax / net / status.
3. Click **Mark paid** on a row → status flips to *paid*; the "Paid" KPI increments.
4. Use the **month dropdown** to view other months.
5. Switch to **employee@hrms.com** → **Payroll** → they see only **their own payslips**.

**Talking point:** *"One-click bulk payroll generation using a Mongo bulkWrite; employees get
a private payslip history."*

---

## 7. Performance  (1.5 min)

Sidebar → **Performance**.

1. As **manager/admin**, click **+ New Review**:
   - Select an employee, set period (e.g. `2026-Q2`).
   - Slide the **overall rating** (1–5) and the **KPI sliders** (productivity/quality/teamwork).
   - Add feedback → **Publish Review**.
2. It appears in **Team Reviews**.
3. Switch to that **employee** → **Performance** → they see the published review with rating
   badge, KPI progress bars, goals and feedback.

**Talking point:** *"Managers run structured reviews; employees see their published results
with visual KPI tracking."*

---

## 8. ⭐ AI Recruitment — the centerpiece  (4 min)

This is the headline feature. Log in as **recruiter@hrms.com** (or stay as admin) →
sidebar → **Recruitment (AI)**.

### 8a. AI status + posting a job
- Top banner shows **● AI online** + the model name (your Groq key is active).
- Click **+ Post Job** → title, department, description, **required skills** (comma-separated,
  e.g. `react, node.js, mongodb`), min experience → **Post Job**.

### 8b. Candidate applies → automated resume screening + AI interview (no human in the loop)
This is the **candidate's** experience. Open the **public careers portal**
(the "Open careers portal ↗" link, or **http://localhost:5173/careers** — no login needed):
1. Pick a role on the left.
2. Fill name/email, years of experience, and either **upload a PDF résumé** or **paste résumé text**.
   - *Tip for a strong score:* paste text mentioning the job's required skills.
3. Click **Apply & get instant AI feedback**.
4. 🎉 Within a second the candidate sees a **live AI evaluation**: a **fit score ring (0–100)**,
   a recommendation badge (strong_yes / yes / maybe / no), and matched skills — **generated
   automatically, with no recruiter involved.**
5. **🎙️ Right below, the candidate takes their AI Screening Interview:**
   - Click **Start AI Interview** — the AI recruiter asks the first question and **speaks it
     aloud** (🔊 Voice on by default).
   - The candidate answers by **typing**, or by clicking the **🎤 mic and talking** — speech is
     transcribed via the Web Speech API.
   - The AI runs a multi-turn conversation and shows a ✅ "interview complete" message at the end.

**Talking point:** *"The whole first round is candidate self-service: they apply, get an instant
unbiased AI fit score, and complete a conversational + voice screening interview with the AI —
no recruiter needed until review time."*

### 8c. Recruiter reviews & ranks candidates
Now switch to the **recruiter** view → **Recruitment** page:
1. Select the job → candidates are **ranked by AI fit score** (highest first), each with a
   score ring, recommendation badge and pipeline stage.
2. Click a candidate to open **Candidate Detail**:
   - Full **AI Screening Result**: score, recommendation, summary, **matched / missing skills,
     strengths, concerns**.
   - **↻ Re-screen** button to re-run the AI evaluation.
   - **🎙️ AI Screening Interview** — the transcript the **candidate** completed, shown
     **read-only** for review (recruiters don't conduct it).
   - **Pipeline Stage** controls (applied → shortlisted → interview → offer → hired / rejected).

**Talking point:** *"Recruiters spend their time reviewing AI-ranked candidates and reading the
interview transcripts — the screening itself is fully automated and candidate-driven."*

---

## 9. 🤖 AI HR Assistant (floating, voice-enabled)  (1 min)

Available on **every** page once logged in (bottom-right 🤖 button):
1. Click it to open the chat.
2. Ask something HR-ish: *"How do I apply for sick leave?"* or *"When is payroll processed?"*
3. Toggle **🔊 Voice** to have answers read aloud; use the **🎤 mic** to ask by voice.

**Talking point:** *"A context-aware assistant (it knows your name, role and department) is one
click away anywhere in the app."*

---

## 10. Responsiveness & polish  (30s)

- Resize the browser narrow (or open dev-tools device mode) → the sidebar collapses into a
  **hamburger menu**; cards and tables reflow. Fully responsive for web + mobile.
- Log out (top-right) → returns to login; the JWT session is cleared.

---

## 🎯 Suggested 5-minute demo order (if short on time)
1. **Login** as admin → show role-tailored nav. *(20s)*
2. **Admin Dashboard** → company KPIs + charts. *(60s)*
3. **Careers portal** → apply with a résumé → **instant AI score**. *(90s)*
4. **Recruitment** → ranked candidates → open one → **AI voice interview**. *(90s)*
5. **AI Assistant** → ask a question by voice. *(40s)*

---

## 🧩 Feature → where to find it (cheat sheet)
| Requirement | Where in the app |
|-------------|------------------|
| Employee data management | Employees page |
| Attendance | Attendance page (+ live team view) |
| Payroll | Payroll page |
| Performance tracking | Performance page |
| AI resume screening (no human) | Careers portal apply + Recruitment/Candidate detail |
| AI conversation & voice screening | Careers portal → candidate takes it; recruiter reviews transcript in Candidate Detail |
| Multi-role login (4 roles) | Login + role-filtered sidebar / RBAC |
| Personalized dashboards | Dashboard → "My Activity" (all users) |
| Admin individual + company dashboards | Dashboard → "Company Overview" (admin/manager) |
| Scalability (5,000+) | Pagination, indexes, pooling, rate limiting, sockets |
| Responsive web + mobile | Collapsible layout everywhere |

#  Spendly — Personal Finance Dashboard

Track your money, own your future. A full-stack personal finance web app built with **React + FastAPI (Python)**.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Recharts, React Router v6 |
| Backend    | FastAPI (Python)                    |
| Database   | SQLite (local) → PostgreSQL (cloud) |
| Auth       | JWT (python-jose + passlib)         |
| Hosting    | Vercel (frontend) + Railway (backend) — both FREE |

---

## Features

- Login / Register with JWT auth
- Overview dashboard with animated charts
- Transactions — add, delete, search, filter
- Smart auto-categorizer (Zomato → Food, Ola → Transport)
- Budgets per category per month + copy last month
- Savings Goals with monthly tip calculator
- Analytics — trends, deep dive, smart insights, CSV export
- In-app notifications (budget alerts)
- Dark / Light theme toggle

---

## Setup on Windows

### Step 1 — Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version
3. Install it (keep all defaults)
4. Open Command Prompt and verify: `node --version`

### Step 2 — Start the Python Backend

```cmd
cd spendly\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

### Step 3 — Start the React Frontend

Open a **new** Command Prompt window:

```cmd
cd spendly\frontend

# Install dependencies (first time only)
npm install

# Start the app
npm start
```

Frontend opens at: http://localhost:3000

### Step 4 — Use the app
1. Open http://localhost:3000
2. Click "Create one free" to register
3. Start adding transactions!

---

## Deploy for Free (Go Live)

### Backend → Railway
1. Go to https://railway.app — sign up free
2. New Project → Deploy from GitHub
3. Point to the `backend/` folder
4. Add environment variable: `SECRET_KEY=your-secret-key-here`
5. Railway gives you a public URL like `https://spendly-api.up.railway.app`

### Frontend → Vercel
1. Go to https://vercel.com — sign up free
2. Import your GitHub repo
3. Set root directory to `frontend/`
4. Add environment variable: `REACT_APP_API_URL=https://your-railway-url.up.railway.app`
5. Deploy — Vercel gives you `https://spendly.vercel.app`

---

## Project Structure

```
spendly/
├── backend/
│   ├── main.py           ← FastAPI app entry point
│   ├── database.py       ← SQLite schema + init
│   ├── auth_utils.py     ← JWT auth helpers
│   ├── helpers.py        ← Auto-categorizer, notifications
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py       ← /auth/register, /auth/login
│       ├── transactions.py
│       ├── budgets.py
│       ├── goals.py
│       └── analytics.py
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── package.json
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css      ← Global theme + animations
        ├── context/
        │   ├── AuthContext.js
        │   └── ThemeContext.js
        ├── utils/
        │   └── api.js     ← Axios instance with auth token
        ├── components/
        │   ├── Layout.js  ← Sidebar + topbar
        │   └── UI.js      ← Reusable components
        └── pages/
            ├── Login.js
            ├── Register.js
            ├── Overview.js
            ├── Transactions.js
            ├── Budgets.js
            └── Analytics.js
```

---

## Author
Built by Sumit Malu · Pune, India

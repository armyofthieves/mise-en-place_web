# Mise en Place 🍴

A personal meal planning app — recipe bank, weekly rotation, smart split shopping lists.

**Stack:** Django REST Framework · PostgreSQL · React · TypeScript · Vite

---

## Prerequisites

Before you start, make sure you have these installed:

| Tool | Check | Install |
|------|-------|---------|
| Python 3.11+ | `python3 --version` | [python.org](https://python.org) |
| Node.js 18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| PostgreSQL 14+ | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| Git | `git --version` | [git-scm.com](https://git-scm.com) |

---

## 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

## 2. Create the PostgreSQL database

```bash
# Start postgres if it isn't running (Mac with Homebrew)
brew services start postgresql@14

# Create the database
createdb mep_db
```

> **Windows / Linux:** Open pgAdmin or run `psql -U postgres` then type `CREATE DATABASE mep_db;`

---

## 3. Set up the backend

```bash
cd backend
```

### Create a virtual environment

```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt. You'll need to run `source venv/bin/activate` every time you open a new terminal for the backend.

### Install Python dependencies

```bash
pip install -r requirements.txt
```

### Create your environment file

```bash
cp .env.example .env
```

Now open `.env` in your editor and fill it in:

```env
SECRET_KEY=any-long-random-string-you-make-up-right-now
DEBUG=True
DATABASE_URL=postgres://localhost/mep_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> **Getting your Anthropic API key:** Go to [console.anthropic.com](https://console.anthropic.com), sign in, and create an API key under "API Keys". This powers the recipe URL parser.

### Run database migrations

```bash
python manage.py migrate
```

You should see a series of `OK` messages. This creates all the tables in your database.

### (Optional) Create an admin account

```bash
python manage.py createsuperuser
```

This lets you log into `http://localhost:8000/admin` to inspect your data directly.

### Start the backend server

```bash
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

Leave this terminal running. Open a new terminal for the next steps.

---

## 4. Set up the frontend

In a **new terminal tab/window:**

```bash
cd frontend
```

### Install Node dependencies

```bash
npm install
```

### Create your environment file

```bash
cp .env.example .env
```

The default contents are fine for local development:

```env
VITE_API_URL=http://localhost:8000/api
```

### Start the frontend dev server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

---

## 5. Open the app

Go to **[http://localhost:5173](http://localhost:5173)** in your browser.

You'll see the login screen. Click **Register** to create your account, then you're in.

---

## Daily Development Workflow

Every time you want to work on the project, you need two terminals running:

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Pushing to GitHub

```bash
# From the root of the project
git add .
git commit -m "your message here"
git push origin main
```

---

## Project Structure

```
mise-en-place/
├── backend/
│   ├── mep_api/
│   │   ├── apps/
│   │   │   ├── recipes/       # Recipe CRUD, ingredients, AI parser
│   │   │   ├── menus/         # Weekly menus, day assignments, generate
│   │   │   └── users/         # Auth, pantry items
│   │   └── core/              # Settings, root URLs, WSGI
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client with JWT auto-refresh
│   │   ├── types/             # Shared TypeScript interfaces
│   │   ├── features/          # One folder per tab
│   │   │   ├── auth/          # Login / Register page
│   │   │   ├── recipes/       # Recipe bank, add recipe, detail view
│   │   │   ├── rotation/      # Starred recipes grouped by rating
│   │   │   ├── menu/          # Weekly menu generator
│   │   │   ├── shopping/      # Split shopping lists with checkboxes
│   │   │   └── pantry/        # Pantry staples management
│   │   ├── components/        # Shared UI primitives (buttons, modals, etc.)
│   │   ├── hooks/             # useAuth, custom hooks
│   │   └── lib/               # Theme constants, helpers
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
└── README.md
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user |
| GET/POST | `/api/auth/pantry/` | List / add pantry items |
| DELETE | `/api/auth/pantry/:id/` | Remove pantry item |
| GET/POST | `/api/recipes/` | List / create recipes |
| GET/PATCH/DELETE | `/api/recipes/:id/` | Recipe detail |
| POST | `/api/recipes/parse/` | AI parse from URL or text |
| GET/POST | `/api/menus/` | List / create weekly menus |
| POST | `/api/menus/generate/` | Auto-generate shuffled menu |
| PATCH | `/api/menus/:id/days/:day/` | Swap a single day's meal |

---

## Troubleshooting

**`createdb: command not found`**
PostgreSQL isn't in your PATH. On Mac with Homebrew: `export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"`

**`pip install` fails with errors**
Make sure your virtual environment is active — you should see `(venv)` in your prompt.

**`python manage.py migrate` fails with "connection refused"**
PostgreSQL isn't running. On Mac: `brew services start postgresql@14`

**Frontend shows a blank page or API errors in the console**
Make sure the backend is running on port 8000 and your frontend `.env` has `VITE_API_URL=http://localhost:8000/api`

**Recipe URL parser returns an error**
Check that `ANTHROPIC_API_KEY` is set correctly in `backend/.env` and that you have API credits on your Anthropic account.

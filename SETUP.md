# Food AI Rescue — Setup Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **MySQL** 8+ or **MariaDB** 10.4+ (with MySQL compatibility)
- **npm** (comes with Node.js)

---

## 1. Database Setup

### Create the database

Open MySQL CLI or phpMyAdmin and create the database:

```sql
CREATE DATABASE foodairescue;
```

### Import the schema

```bash
cd server
mysql -u root -p foodairescue < foodairescue.sql
```

Or via phpMyAdmin: import `server/foodairescue.sql` into the `foodairescue` database.

### Run migrations

```bash
cd server
node check_db.cjs
node migrate_db.cjs
```

---

## 2. Environment Configuration

### Backend `.env`

Create/edit `server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=foodairescue
PORT=5000

# Gemini AI (required for food quality analysis — must be added)
GEMINI_API_KEY=your_google_gemini_api_key
```

> If your MySQL has no password, leave `DB_PASSWORD=` empty.

### Frontend `.env`

Create/edit `.env` in the project root:

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

> To get a Gemini API key: [Google AI Studio](https://aistudio.google.com/apikey)
> The API key in `server/.env` (`GEMINI_API_KEY`) is **required** for AI food analysis to work. The frontend `.env` key is optional (frontend no longer calls Gemini directly).

---

## 3. Running the App

You need **two terminals** open — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd server
npm install          # only needed once
npm run dev         # starts on port 5000
```

### Terminal 2 — Frontend

```bash
npm install          # only needed once
npm run dev         # starts on port 5173
```

### Open the app

```
http://localhost:5173
```

The frontend connects to the backend at `http://localhost:5000/api`.

---

## 4. Default Login Accounts

After importing `server/dataDumy.sql`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Provider | provider@far.com | password123 |
| Receiver | receiver@far.com | password123 |
| Volunteer | volunteer@far.com | password123 |
| Admin | admin@far.com | password123 |

---

## 5. Troubleshooting

### "Connection refused" errors
- Make sure the backend is running (`npm run dev` in the `server` folder)
- Check the backend terminal for `Server running on port 5000`

### "Module not found" errors
- Run `npm install` in both the root and `server` directories

### Database connection errors
- Verify MySQL is running
- Double-check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `server/.env`
- Make sure the `foodairescue` database exists

### Port already in use
- If port 5000 is taken: change `PORT` in `server/.env`
- If port 5173 is taken: Vite will automatically use the next available port (e.g., 5174)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Food AI Rescue (FAR)** — An Indonesian-language food rescue platform connecting food providers (restaurants/cafes) with receivers (individuals/communities) via volunteers, with AI-powered food quality analysis and gamification (points, badges, tiers).

## Dev Commands

### Frontend (root directory)
```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build
npm run lint     # TypeScript type check
```

### Backend (server directory)
```bash
cd server && npm start    # Production (node index.js)
cd server && npm run dev # Development with nodemon (port 5000)
```

### Prerequisites
- **Frontend `.env`**: Requires `VITE_GEMINI_API_KEY` for AI features (Gemini API)
- **Backend `.env`**: Requires MySQL credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) and optionally Google OAuth2 for Drive integration
- **Database**: MySQL database named `foodairescue` must exist; schema is in `server/foodairescue.sql`

## Architecture

### Frontend
- **React 19 + TypeScript** SPA, bundled with Vite
- **No React Router** — navigation is entirely state-driven via `currentView` string in `App.tsx`. Role-specific dashboards render based on `role` state.
- **State management**: All global state lives in `App.tsx` and is passed down as props. There is no Redux, Zustand, or Context (except `AuthContext.tsx` for legacy components).
- **API layer**: `services/db.ts` wraps all backend calls. It sends `POST http://localhost:5000/api` with `{ action, data }` shape.
- **AI service**: Food quality analysis (`ANALYZE_FOOD`) is proxied through the backend (`server/index.js`) to avoid CORS. The backend calls `gemini-2.5-flash` and parses the JSON text response. Social impact calculation is done server-side after AI response.

### Backend
- **Express.js** (CommonJS, `server/index.js`) acting as a REST API proxy
- **Single endpoint**: `POST /api` with an `action` dispatcher pattern. Every action is handled by a named function (e.g., `REGISTER_USER` → `registerUser()`). This mirrors a legacy Google Apps Script architecture.
- **Database**: MySQL via `mysql2/promise` connection pool (`server/db.js`)
- **File uploads**: Stored locally under `server/assets/` (subfolders: `fotoProfil/`, `reports/`, `reviews/`), processed with `sharp` for compression
- **Role mapping**: Frontend uses camelCase roles (`provider`, `receiver`, `volunteer`, `admin_manager`, `super_admin`) but database stores uppercase enums (`DONATUR`, `PENERIMA`, `RELAWAN`, `ADMIN`, `SUPER_ADMIN`). The backend handles bidirectional mapping.

### Data Flow
1. Frontend `services/db.ts` → POST to `http://localhost:5000/api` with action name
2. Backend `index.js` router → calls the appropriate handler function
3. Handler reads/writes MySQL, returns `{ status: 'success', data: result }`
4. Frontend unwraps `json.data`

### View Structure
Each role has a dedicated index component under `view/{role}/index.tsx`:
- `view/provider/` — Dashboard, inventory management, reports, reviews
- `view/receiver/` — Browse available food, claim, saved items
- `view/volunteer/` — Mission acceptance, delivery tracking
- `view/admin/` — User management, moderation, broadcast, impact analytics
- `view/profile/` — Shared profile/account management across all roles
- `view/common/` — Notifications, onboarding tour, verification modals

### Key Transformations
- `utils/transformers.ts` — Date parsing (handles legacy Google Sheets date formats like `1899-12-30` for time-only values), food expiry checking (WIB timezone)
- `server/index.js` — Maps DB snake_case columns to camelCase on every response

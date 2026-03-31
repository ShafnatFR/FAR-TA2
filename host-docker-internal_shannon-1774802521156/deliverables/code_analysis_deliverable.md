# Penetration Test Scope & Boundaries

**Primary Directive:** Your analysis is strictly limited to the **network-accessible attack surface** of the application. All subsequent tasks must adhere to this scope. Before reporting any finding (e.g., an entry point, a vulnerability sink), you must first verify it meets the "In-Scope" criteria.

### In-Scope: Network-Reachable Components
A component is considered **in-scope** if its execution can be initiated, directly or indirectly, by a network request that the deployed application server is capable of receiving. This includes:
- Publicly exposed web pages and API endpoints.
- Endpoints requiring authentication via the application's standard login mechanisms.
- Any developer utility, debug console, or script that has been mistakenly exposed through a route or is otherwise callable from other in-scope, network-reachable code.

### Out-of-Scope: Locally Executable Only
A component is **out-of-scope** if it **cannot** be invoked through the running application's network interface and requires an execution context completely external to the application's request-response cycle. This includes tools that must be run via:
- A command-line interface (e.g., `go run ./cmd/...`, `python scripts/...`).
- A development environment's internal tooling (e.g., a "run script" button in an IDE).
- CI/CD pipeline scripts or build tools (e.g., Dagger build definitions).
- Database migration scripts, backup tools, or maintenance utilities.
- Local development servers, test harnesses, or debugging utilities.
- Static files or scripts that require manual opening in a browser (not served by the application).

---
## 1. Executive Summary

The Food AI Rescue (FAR-TA2) platform is a hybrid React/Express.js application with a critical security posture that renders it unsuitable for production deployment without immediate remediation. The application exhibits **multiple critical vulnerabilities** across authentication, authorization, data protection, and input handling domains. Most severely, all API endpoints operate without authentication validation, exposing the complete application dataset—including plaintext passwords, PII, GPS coordinates, and business transaction data—to any unauthenticated network attacker. The authentication mechanism relies entirely on localStorage-based session storage with no cryptographic verification, no server-side session validation, and no token expiration controls. SQL injection vulnerabilities exist in dynamic table name interpolation, and sensitive credentials (API keys, OAuth tokens, database credentials) are hardcoded in source files and committed to version control. The attack surface is extensive: a single POST endpoint (`/api`) handles all business logic with 29+ distinct actions, all accessible without authentication, providing complete control over user data, food inventory, claims processing, and administrative functions. An external attacker can enumerate all users, access any address with GPS coordinates, manipulate food inventory, process fraudulent claims, and execute administrative broadcasts—all without credentials.

---
## 2. Architecture & Technology Stack

**Framework & Language:** The application uses a React 19.2.4 SPA frontend built with TypeScript 5.8.2 and bundled via Vite 6.2.0, communicating with an Express.js 5.2.1 backend server on Node.js. The frontend is mobile-first, served as static assets, and communicates exclusively via a single POST endpoint at `/api` using a JSON action-dispatch pattern. All business logic executes server-side in Express, with MySQL 10.4.32 as the persistent datastore via the mysql2/promise driver. Key security-relevant libraries include Sharp 0.34.5 for server-side image processing, GoogleGenAI for Gemini AI integration, and googleapis for Google Drive OAuth2. The frontend loads Tailwind CSS via CDN, React Leaflet for mapping, and Lucide React for icons. The technology stack reveals minimal production-hardening: no security frameworks (helmet, express-rate-limit), no JWT library (jsonwebtoken), and no server-side session store.

**Architectural Pattern:** The application follows a client-server SPA pattern with a stateless API backend and client-side state management. The Express server acts as a central action dispatcher—a single `POST /api` endpoint receives `{ action, data }` JSON payloads and routes to corresponding handler functions. This monolithic API design means every business operation (user management, food inventory, claims, reviews, reports, AI analysis, file uploads, broadcasts) flows through one unguarded endpoint. Session state lives entirely in the browser's localStorage/sessionStorage as a serialized user object. No middleware chain enforces authentication, authorization, rate limiting, or security headers. The role-based access control (RBAC) exists only as a client-side UI gating mechanism—sensitive server operations like `UPDATE_REPORT_STATUS`, `SEND_BROADCAST`, and `UPDATE_SETTINGS` carry no server-side role verification. The trust boundary between client and server is completely unenforced.

**Critical Security Components:** The security architecture is critically deficient across all layers. Passwords are stored and compared in plaintext (no hashing) directly in MySQL. The MySQL database uses the root user with an empty password (`DB_PASSWORD=` in `server/.env`). Session tokens are not implemented—instead, the full user object (id, name, email, role, status, points, avatar) is serialized to localStorage as `far_session`. The CORS middleware is configured as `cors()` with no origin restrictions. The body parser accepts up to 50MB JSON payloads. Static assets (including uploaded user files) are served from `/assets/*` without access controls. The role mapping (`provider`→`DONATUR`, `receiver`→`PENERIMA`, etc.) occurs client-side with no server validation. Debug console logging throughout the codebase exposes API keys, user IDs, and system internals.

---
## 3. Authentication & Authorization Deep Dive

### Authentication Mechanisms

The application implements **no meaningful server-side authentication**. All 29+ API actions are accessible to unauthenticated requesters. The authentication "flow" consists of a client-side email/password check against the MySQL database, but this check is performed without password hashing, without rate limiting, and without any server-side session establishment.

**REGISTER_USER Action** (`server/index.js` lines 110–121):
```javascript
async function registerUser(data) {
    const { name, email, password, role, phone, avatar } = data;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email ini sudah terdaftar.');
    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, phone, avatar, points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, mapRole(role), phone, avatar, 0, 'ACTIVE']
    );
```
Passwords are inserted directly without hashing. The role parameter from the client is accepted and mapped via `mapRole()`, allowing any user to self-register with any role including `admin_manager` and `super_admin`.

**LOGIN_USER Action** (`server/index.js` lines 123–134):
```javascript
async function loginUser(data) {
    const { email, password } = data;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) throw new Error('Email atau Password salah.');
    const user = rows[0];
    delete user.password;
    const reverseRole = Object.keys(ROLE_MAP).find(key => ROLE_MAP[key] === user.role);
    if (reverseRole) user.role = reverseRole;
    user.isNewUser = true;
    return user;
}
```
Plaintext password comparison in SQL. No failed login tracking, no account lockout, no brute-force protection.

**All API Endpoints Requiring Authentication:** NONE. Every endpoint—including `GET_USERS`, `UPSERT_USER`, `DELETE_ADDRESS`, `DELETE_FOOD_ITEM`, `PROCESS_CLAIM`, `UPDATE_CLAIM_STATUS`, `SEND_BROADCAST`, `UPDATE_SETTINGS`, and `UPDATE_REPORT_STATUS`—accepts requests without any session or token validation.

### Session Management and Token Security

**Client-Side Session Storage** (`App.tsx` lines 67–87, 268–274):
```javascript
const savedSession = localStorage.getItem('far_session') || sessionStorage.getItem('far_session');
if (savedSession) {
    const parsedUser = JSON.parse(savedSession);
    setRole(parsedUser.role);
    setCurrentUser(parsedUser);
    setCurrentView('dashboard');
}
```
Session data (user object) is stored in localStorage without encryption, without cryptographic signing, and without HttpOnly, Secure, or SameSite flags. The `far_session` key contains the complete user record including role designation. An XSS vulnerability or local browser access immediately exposes the full session. No server-side session store exists—the server never validates session existence or authenticity. Session data on the server consists solely of an in-memory `appSettings` object. The `handleLogout` function (`App.tsx` lines 318–329) clears localStorage client-side only—no invalidation message is sent to the server.

**Session Cookie Flags:** NOT CONFIGURED. No `HttpOnly`, `Secure`, or `SameSite` attributes are set on any cookie because the application uses localStorage, not cookies. For any future cookie-based session, the current codebase has no mechanism to set these flags.

### Authorization Model

**No Server-Side Authorization Exists.** The Express server contains zero middleware that validates user identity, checks session validity, or enforces role-based permissions. Every action handler trusts the client-supplied `data` object implicitly.

**Role-Based Access Control Implementation** (`server/index.js` lines 98–106):
```javascript
const ROLE_MAP = {
    'provider': 'DONATUR',
    'receiver': 'PENERIMA',
    'volunteer': 'RELAWAN',
    'admin_manager': 'ADMIN',
    'super_admin': 'SUPER_ADMIN'
};
const mapRole = (role) => ROLE_MAP[role] || role;
```
The server maps frontend role names to database role names but performs no authorization check. Any client can send `role: 'super_admin'` in registration and gain admin access at the client rendering level, and the server will store this role without verification.

**Critical Authorization Failures:**
- `UPSERT_USER` (line 34): Any user can modify any other user's profile by supplying a different `userId`
- `UPDATE_ADDRESS` / `DELETE_ADDRESS` (lines 38–39): No ownership verification
- `PROCESS_CLAIM` / `UPDATE_CLAIM_STATUS` (lines 48–49): No role or ownership check
- `SEND_BROADCAST` (line 57): No admin role check
- `UPDATE_SETTINGS` (lines 60–63): No admin role check
- `UPDATE_REPORT_STATUS` (line 53): No admin role check

### Multi-Tenancy Security

The application supports multiple user roles (provider, receiver, volunteer, admin) but enforces no tenant isolation at the database or API level. All users query the same `users`, `addresses`, `food_items`, and `claims` tables without tenant scoping. A provider can query `GET_USERS` and retrieve all registered users including admins. There is no multi-tenancy model implemented.

### SSO/OAuth/OIDC Flows

No OAuth2/OIDC authentication flow is implemented for user login. The Google OAuth2 credentials in `server/.env` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) are configured for Google Drive integration, not authentication. There are no OAuth callback endpoints, no `state` parameter validation, and no `nonce` verification. The OAuth tokens appear to be unused dead code in the authentication flow.

---
## 4. Data Security & Storage

### Database Security

**Database:** MySQL 10.4.32 via mysql2/promise connection pool. **CRITICAL:** The connection uses the root MySQL user with an empty password (`DB_PASSWORD=` in `server/.env` lines 1–4). Any process on the localhost can connect to the database with full root privileges.

**Connection Configuration** (`server/db.js` lines 1–14):
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

**Query Safety:** Most queries use parameterized placeholders (`?`), which provides protection against SQL injection for value parameters. However, two critical functions bypass this protection through direct string interpolation:

1. **`getAllData(table)`** (`server/index.js` lines 136–138):
```javascript
async function getAllData(table) {
    const [rows] = await db.query(`SELECT * FROM ${table}`);
    return rows;
}
```
This function is called by `GET_USERS`, `GET_FAQS`, `GET_NOTIFICATIONS`, `GET_BADGES`, and `GET_INVENTORY` actions. An attacker controlling the `table` parameter can extract any database table's contents, including `information_schema`, `mysql`, and application tables.

2. **`deleteData(table, id)`** (`server/index.js` lines 339–342):
```javascript
async function deleteData(table, id) {
    const tableName = table === 'inventory' ? 'food_items' : table;
    await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
}
```
Table names are directly interpolated. While there is a partial allowlist for `inventory`→`food_items`, other table names pass through unchecked.

**Database Schema** (`server/foodairescue.sql`): Contains 12 tables including `users` (with plaintext password column), `addresses` (with GPS coordinates), `food_items`, `claims`, `reviews` (with JSON media field), `reports`, `ai_verifications`, `notifications`, `point_histories`, and `badges`. All tables use `utf8mb4_general_ci` collation.

### Data Flow Security

**Sensitive Data Paths:**
- User registration: email, name, phone, and plaintext password flow from client → `server/index.js` → MySQL `users` table. No encryption in transit (no TLS configured on server), no hashing at rest.
- Address data: GPS coordinates (latitude/longitude), full address, contact name, and contact phone flow from client → stored in `addresses` table. No encryption.
- Session data: Full user object stored in localStorage (`far_session`) without signing or encryption. Accessible via XSS.
- File uploads: Base64-encoded images uploaded via `UPLOAD_IMAGE` action → `fileService.js` → stored in `server/assets/` directory → served via `/assets/*` static endpoint. No virus scanning, no content-type validation beyond MIME prefix checking.
- API keys: Gemini API key hardcoded in `services/ai.ts` line 43 (`AIzaSyAZdiUhA49KL7s7Egj-QzO2AZ3yB6GDO9M`), duplicated in `server/.env` and frontend `.env`. Key is bundled into client-side JavaScript via Vite's define plugin (`vite.config.ts` lines 13–15).
- Google OAuth2 tokens: Refresh token, client ID, and client secret stored in plaintext in `server/.env` and committed to version control.

**Data Protection Mechanisms:** NONE. No field-level encryption, no encryption at rest, no encryption in transit. No data masking or redaction for sensitive fields in API responses. Debug logging (`console.log`) throughout the codebase logs user IDs, API keys, and system operations to stdout.

### Multi-Tenant Data Isolation

No tenant isolation exists. All users across all roles share the same database schema and API endpoints. There is no `tenant_id` column, no schema separation, and no row-level security. A user with the `provider` role can, through the `GET_USERS` action (which exposes all users), retrieve personal data for admin users and other providers.

---
## 5. Attack Surface Analysis

### External Entry Points

**Primary API Endpoint — `POST /api`** (`server/index.js` line 21): The sole network-accessible API, accepting `{ action: string, data: object }` with a 50MB JSON body limit. All 29+ actions are unauthenticated and accessible to any network caller. This is the primary attack vector for all server-side operations.

| Action | Line | Description | Auth Required | Privilege Escalation Risk |
|--------|------|-------------|----------------|---------------------------|
| REGISTER_USER | 28 | Create new user account | NO | Can register as admin/super_admin |
| LOGIN_USER | 29 | Authenticate user | NO | Brute-forceable, no rate limit |
| GET_USERS | 30–33 | Retrieve all users | NO | Full user enumeration |
| UPSERT_USER | 34 | Create/update user | NO | Modify any user's profile |
| GET_ADDRESSES | 36 | Get user addresses | NO | All addresses + GPS coords |
| ADD_ADDRESS | 37 | Add address | NO | Inject addresses for any user |
| UPDATE_ADDRESS | 38 | Update address | NO | Modify any address record |
| DELETE_ADDRESS | 39 | Delete address | NO | Delete any address record |
| GET_INVENTORY | 41 | Get food inventory | NO | Full inventory disclosure |
| ADD_FOOD_ITEM | 42 | Add food item | NO | Inventory pollution |
| UPDATE_FOOD_STOCK | 43 | Update stock quantity | NO | Stock manipulation |
| UPDATE_FOOD_ITEM | 44 | Update food item | NO | Modify any food item |
| DELETE_FOOD_ITEM | 45 | Delete food item | NO | Remove any food item |
| GET_CLAIMS | 47 | Get claim history | NO | Full claims enumeration |
| PROCESS_CLAIM | 48 | Process food claim | NO | Fraudulent claim processing |
| UPDATE_CLAIM_STATUS | 49 | Update claim status | NO | Status manipulation |
| VERIFY_ORDER_QR | 50 | Verify QR code | NO | QR validation bypass |
| SUBMIT_REVIEW | 51 | Submit review | NO | Review manipulation |
| SUBMIT_REPORT | 52 | Submit report | NO | Report flooding |
| UPDATE_REPORT_STATUS | 53 | Update report | NO | Admin action, no auth |
| GET_FAQS | 55 | Get FAQ content | NO | Low risk |
| GET_NOTIFICATIONS | 56 | Get notifications | NO | Notification enumeration |
| SEND_BROADCAST | 57 | Send broadcast | NO | Admin action, no auth |
| GET_SETTINGS | 59 | Get app settings | NO | Settings disclosure |
| UPDATE_SETTINGS | 60–63 | Update settings | NO | Admin action, no auth |
| GET_SOCIAL_IMPACT | 65 | Get impact metrics | NO | Metrics disclosure |
| GET_IMPACT_CHART | 66 | Get impact chart | NO | Metrics disclosure |
| GET_FOOD_REQUESTS | 68 | Get food requests | NO | Request enumeration |
| ADD_FOOD_REQUEST | 69 | Add food request | NO | Request injection |
| DELETE_FOOD_REQUEST | 70 | Delete food request | NO | Delete any request |
| GET_POINT_HISTORY | 72 | Get point history | NO | Point history disclosure |
| GET_BADGES | 73 | Get badges | NO | Low risk |
| ANALYZE_FOOD | 75–77 | AI food quality analysis | NO | Gemini API abuse, prompt injection |
| UPLOAD_IMAGE | 79–84 | Upload image (Base64) | NO | File upload, potential RCE path |

**Static Asset Server — `GET /assets/*`** (`server/index.js` line 14): Serves uploaded files from `server/assets/` directory. No access controls. Files include profile photos (`fotoProfil/`), user images (`profiles/`), and food item images (`inventory/`). An attacker can enumerate uploaded files by varying the URL.

**Frontend Dev Server — `GET /*`** (`vite.config.ts`): Vite development server on port 3000, listening on `0.0.0.0`. In production, this would serve the compiled React SPA. Serves all routes as client-side rendered. No SSR XSS vectors identified.

**Backend Server — `POST /api`** (`server/index.js`): Express server on port 5000 (or `PORT` env var). The entire server-side attack surface.

### Internal Service Communication

The application is a single monolithic service with no internal microservices. However, it integrates with external services whose credentials are exposed:

- **Google Gemini AI API**: API key hardcoded in multiple locations. Used for food quality analysis via `ANALYZE_FOOD` action (`server/index.js` lines 740–867). User-controlled food names, ingredients, and descriptions are interpolated directly into the AI prompt—a prompt injection vector.
- **Google Drive API**: OAuth2 credentials stored in `server/.env`. Configured for file storage but not actively invoked in the reviewed code.
- **OpenStreetMap Nominatim API**: Called from the frontend (`view/profile/components/AddressList.tsx` lines 68, 100) for geocoding. User-supplied coordinates and addresses are embedded in API URLs.

### Input Validation Patterns

Input validation is minimal and inconsistent. The `upsertUser` function (`server/index.js` lines 150–169) uses a column allowlist for user profile fields, but phone numbers are only stripped of non-digit characters (no length or format validation), and email validation checks only for the `@` character. No schema validation middleware exists on any endpoint. The `bodyParser.json({ limit: '50mb' })` configuration allows very large payloads with no content-type validation. File upload MIME type detection relies on parsing the base64 header string rather than magic byte verification.

### Background Processing

No background job queue exists. All operations execute synchronously within the HTTP request-response cycle. The `ANALYZE_FOOD` action makes a synchronous call to the Gemini API, which could block the thread and create a denial-of-service vector.

### Notable Out-of-Scope Components

- `server/dataDumy.sql`: Local database seed script, not network-accessible.
- `node_modules/`: NPM dependencies, not network-accessible.
- Build scripts and Vite configuration files executed at build time.
- Test accounts and credentials in `dataDumy.sql` are in-scope for credential stuffing but the file itself is not network-accessible.

---
## 6. Infrastructure & Operational Security

### Secrets Management

**CRITICAL FAILURE:** Secrets are stored in plaintext `.env` files and hardcoded directly in source files, with no encryption, no rotation mechanism, and no secret vault.

Exposed secrets include:
- **Gemini API Key**: `AIzaSyAZdiUhA49KL7s7Egj-QzO2AZ3yB6GDO9M` — found in `services/ai.ts` (hardcoded line 43), `server/.env` (line 8), frontend `.env` (line 1), and `vite.config.ts` (via define plugin). The key is bundled into client-side JavaScript by Vite.
- **Google OAuth2 Credentials** (`server/.env` lines 12–14): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` are stored in plaintext. The refresh token grants persistent access to the associated Google account.
- **MySQL Root Password**: Empty string (`DB_PASSWORD=`). The database has no password.
- **OAuth Folder ID**: Google Drive folder ID in `server/.env` line 11.
- The `.env` files are NOT in `.gitignore` and are committed to the git repository, making all secrets accessible to anyone with repository access.

### Configuration Security

**CORS** (`server/index.js` line 12): Configured as `app.use(cors())` with default permissive settings. Any origin can make requests to the API on behalf of any user.

**Security Headers:** No security headers are configured. The middleware stack consists only of CORS, body-parser, and static file serving. There is no `helmet.js` or equivalent. No `Strict-Transport-Security` (HSTS), no `X-Frame-Options`, no `X-Content-Type-Options`, no `Content-Security-Policy`, and no `Referrer-Policy`.

**Environment Separation:** Development configuration is not separated from deployment configuration. Both `vite.config.ts` and `server/index.js` are configured for development with `host: '0.0.0.0'` exposure.

**Infrastructure Configuration Files:** No Nginx, Kubernetes, Docker, or CDN configuration files were found. The application runs as a bare Node.js process with no reverse proxy, no containerization, and no orchestrated deployment manifests.

### External Dependencies

Key third-party service dependencies with security implications:
- **@google/genai 1.47.0** (server) / **@google/generative-ai 0.21.0** (client): Gemini AI SDK. API key exposure is the primary risk.
- **googleapis 171.4.0**: Google API client library. OAuth2 tokens exposed.
- **sharp 0.34.5**: Image processing library. Processes untrusted image data (potential image processing vulnerabilities).
- **leaflet 5.0.0** + **react-leaflet 1.9.4**: Map rendering. Client-side only.
- **tailwindcss (CDN)**: Third-party CSS loaded from CDN. No SRI hash verification identified.

### Monitoring & Logging

**No security monitoring or SIEM integration exists.** Debug logging via `console.log` and `console.error` is present throughout the codebase (`server/index.js` lines 23, 92, 232, 537–539; `services/ai.ts` lines 183–187). Log output includes action names, user IDs, error messages, and API key presence indicators. No structured logging, no log aggregation, no alerting thresholds, and no audit trail for security-relevant events (login attempts, privilege escalation, data export).

---
## 7. Overall Codebase Indexing

The FAR-TA2 codebase is organized as a monorepo-style structure with two distinct application layers: a React TypeScript SPA frontend at the repository root and an Express.js CommonJS backend in the `/server` subdirectory. The frontend follows a component-based architecture under `/view`, with subdirectories organized by user role (`admin/`, `auth/`, `profile/`, `provider/`, `receiver/`, `volunteer/`) plus shared UI components under `/view/components/`. Supporting utilities and services reside in `/services` (API client `db.ts`, AI service `ai.ts`), `/utils` (image optimizer, map utilities), and `/constants.ts` (role constants, category constants, tier definitions). The `/types.ts` file at the root defines TypeScript interfaces for all data structures, serving as the primary type contract across the client.

The backend (`/server`) is a minimal Express application with three primary files: `index.js` (871 lines, the entire API server including all route handlers, database operations, and business logic), `db.js` (MySQL connection pool), and `fileService.js` (Base64 image upload and deletion via Sharp). The database schema is defined in `server/foodairescue.sql`, and seed/test data exists in `server/dataDumy.sql`. No ORM is used—raw mysql2 queries with mixed parameterized and interpolated SQL are present throughout. The build system uses Vite for the frontend with no production build configuration present, and `npm` scripts with `nodemon` for backend development. TypeScript configuration targets ES2022 with JSX support. No test framework is configured. No API documentation (OpenAPI/Swagger) exists—the entire API contract is implicit in the action-dispatch switch statement in `server/index.js`. The `.gitignore` does not exclude `.env` files, meaning sensitive configuration is committed to the repository. This structure makes security-relevant components highly discoverable: all authentication logic is in `server/index.js` lines 110–134, all file operations in `server/fileService.js`, and all frontend API calls in `services/db.ts`.

---
## 8. Critical File Paths

- **Configuration:**
  - `/repos/FAR-TA2/.env` — Frontend environment variables (Vite-exposed Gemini API key)
  - `/repos/FAR-TA2/server/.env` — Backend environment variables (DB credentials, Gemini API key, Google OAuth2 tokens)
  - `/repos/FAR-TA2/vite.config.ts` — Vite bundler config (API key exposure via define plugin, 0.0.0.0 host binding)
  - `/repos/FAR-TA2/server/foodairescue.sql` — Complete MySQL schema (plaintext password field, PII fields, GPS coordinates)
  - `/repos/FAR-TA2/server/dataDumy.sql` — Test data with plaintext passwords committed to repository

- **Authentication & Authorization:**
  - `/repos/FAR-TA2/server/index.js` lines 21–95 — Main API endpoint dispatcher (no auth middleware)
  - `/repos/FAR-TA2/server/index.js` lines 98–106 — Role mapping constants (ROLE_MAP, mapRole)
  - `/repos/FAR-TA2/server/index.js` lines 110–134 — registerUser() and loginUser() (plaintext passwords)
  - `/repos/FAR-TA2/server/index.js` lines 150–169 — upsertUser() (column allowlist bypass via dynamic keys)
  - `/repos/FAR-TA2/App.tsx` lines 67–87 — Session restoration from localStorage (no server validation)
  - `/repos/FAR-TA2/App.tsx` lines 268–291 — Session persistence to localStorage/sessionStorage

- **API & Routing:**
  - `/repos/FAR-TA2/server/index.js` line 21 — POST /api main router
  - `/repos/FAR-TA2/server/index.js` lines 79–84 — UPLOAD_IMAGE action handler
  - `/repos/FAR-TA2/server/index.js` lines 740–867 — ANALYZE_FOOD (Gemini AI, prompt injection)
  - `/repos/FAR-TA2/services/db.ts` — Frontend API client (all 30+ action dispatchers)
  - `/repos/FAR-TA2/view/auth/Login.tsx` — Login UI
  - `/repos/FAR-TA2/view/auth/Register.tsx` — Registration UI (role self-assignment)

- **Data Models & DB Interaction:**
  - `/repos/FAR-TA2/server/db.js` — MySQL connection pool (root/empty password)
  - `/repos/FAR-TA2/server/index.js` lines 136–138 — getAllData() (SQL injection via table name interpolation)
  - `/repos/FAR-TA2/server/index.js` lines 339–342 — deleteData() (SQL injection via table name)
  - `/repos/FAR-TA2/server/index.js` lines 186–202 — upsertUser address sync (dynamic SQL column names)
  - `/repos/FAR-TA2/server/foodairescue.sql` — Full schema with 12 tables

- **Dependency Manifests:**
  - `/repos/FAR-TA2/package.json` — Frontend dependencies (@google/generative-ai client, leaflet, react-leaflet)
  - `/repos/FAR-TA2/server/package.json` — Backend dependencies (express, mysql2, sharp, @google/genai, googleapis)
  - `/repos/FAR-TA2/package-lock.json` — Locked dependency versions

- **Sensitive Data & Secrets Handling:**
  - `/repos/FAR-TA2/services/ai.ts` line 43 — Hardcoded Gemini API key in source
  - `/repos/FAR-TA2/server/index.js` lines 742–750 — GEMINI_API_KEY loading from env
  - `/repos/FAR-TA2/server/fileService.js` — File upload/delete operations (no path traversal protection)

- **Middleware & Input Validation:**
  - `/repos/FAR-TA2/server/index.js` line 12 — CORS middleware (wide open)
  - `/repos/FAR-TA2/server/index.js` line 13 — bodyParser (50MB limit, no content validation)
  - `/repos/FAR-TA2/server/index.js` line 14 — Static asset serving (/assets/*, no access controls)
  - `/repos/FAR-TA2/server/fileService.js` lines 23–65 — uploadToFileSystem() (MIME prefix only, no magic byte check)

- **Logging & Monitoring:**
  - `/repos/FAR-TA2/server/index.js` line 23 — Action dispatch logging
  - `/repos/FAR-TA2/server/index.js` line 92 — Error logging (exposes stack traces)
  - `/repos/FAR-TA2/services/ai.ts` lines 183–187 — API key presence logging

- **Infrastructure & Deployment:**
  - `/repos/FAR-TA2/vite.config.ts` — Frontend dev server (0.0.0.0:3000)
  - No Docker, Kubernetes, Nginx, or CI/CD configuration files found

---
## 9. XSS Sinks and Render Contexts

**Network Surface Focus:** Only XSS sinks in network-accessible web application components are reported. Local-only scripts, build tools, and developer utilities are excluded.

**Assessment Result:** The React SPA architecture provides inherent protection against most classical XSS vectors through JSX's default escaping of string content. No usage of dangerous React patterns (e.g., `dangerouslySetInnerHTML`, `innerHTML` assignments) was identified in network-accessible components. The frontend uses standard JSX `{variable}` interpolation exclusively, which React escapes by default.

**However, the following contextual risks exist:**

**Stored XSS via Profile Fields (Server-Side Rendering Risk):** If any future backend-rendered template or third-party integration reads from `users.name`, `users.phone`, or `addresses.full_address` without sanitization, stored XSS is trivially achievable because all user inputs are stored with zero sanitization or output encoding. File: `server/index.js` lines 110–121, 150–169. User-supplied fields (name, phone, address) are inserted directly into the database without sanitization or length limits.

**Dangerous jQuery Sinks (Not Found):** No usage of jQuery `.html()`, `.append()`, `.prepend()`, `.after()`, `.before()`, `.replaceWith()`, or `.wrap()` methods was found in the network-accessible codebase. The frontend uses no jQuery.

**Document.write / createContextualFragment (Not Found):** No usage of `document.write()`, `document.writeln()`, or `Range.createContextualFragment()` found in network-accessible components.

**innerHTML / outerHTML Assignments (Not Found):** No direct `innerHTML` or `outerHTML` assignments found in network-accessible React components. React's JSX compiler prevents these patterns.

**Event Handler Attributes (Potential for XSS if Quoted Contexts Break):** React components use standard JSX event handlers (onClick, onChange, etc.). These are inherently safe because React escapes attribute values. No dynamic event handler construction from user input was identified.

**eval() / Function() / setTimeout with String (Not Found in Network Surface):** No `eval()`, `new Function()`, or string-based `setTimeout`/`setInterval` usage found in network-accessible components. The only `eval`-like pattern is the AI prompt injection vector in `server/index.js` (see Section 10), which is a prompt injection rather than traditional XSS.

**CSS Property Injection (Low Risk):** No dynamic CSS property assignments from user input found in network-accessible components. React's inline style syntax uses object notation, which prevents injection.

**URL Context (Low Risk):** No `location.href` assignments, `window.open()` with dynamic URLs, or `history.pushState()` with user-controlled URLs found in network-accessible components. The `window.open()` calls found are for static WhatsApp URLs (`https://wa.me/`).

**Primary XSS Attack Vector — localStorage Session Theft:** While not a traditional XSS sink, the storage of the complete user object (including role) in localStorage without cryptographic protection means any XSS vulnerability (even in third-party dependencies or CDN-loaded scripts) would enable full session hijacking, privilege escalation, and data exfiltration. The session object can be modified client-side and no server-side verification exists to detect tampering.

---
## 10. SSRF Sinks

**Network Surface Focus:** Only SSRF sinks in web app pages or publicly facing components are reported. Local-only utilities, build scripts, and CLI applications are excluded.

### Server-Side SSRF Sinks

**1. Gemini AI API Call — `analyzeFood()` Function** (`server/index.js` lines 740–867):
```javascript
async function analyzeFood(data) {
    const { inputLabels, imageBase64, context } = data;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      DATA INPUT:
      - Nama: ${context?.foodName}
      - Bahan: ${context?.ingredients}
      - Waktu Masak: ${context?.madeTime}
      - Berat Total: ${context?.weightGram} gram
    `;
    const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
```
**User-Controlled Parameters:** `context.foodName`, `context.ingredients`, `context.madeTime`, `context.weightGram` (all strings interpolated directly into the prompt). The `inputLabels` array is also user-controlled. While this is a prompt injection rather than a traditional SSRF (no HTTP request is made to a user-supplied URL), an attacker can manipulate the AI model's behavior, extract prior conversation context, and cause resource exhaustion with extremely long inputs. The Gemini API key is exposed and could be abused for attacker-controlled prompts at the application owner's expense.

**2. File URL Parsing in deleteFile() — Indirect SSRF Risk** (`server/fileService.js` lines 70–96):
```javascript
async function deleteFile(fileUrl) {
    let relativePath = fileUrl;
    try {
        if (fileUrl.startsWith('http')) {
            const urlObj = new URL(fileUrl);
            relativePath = urlObj.pathname;
        }
    } catch (e) { }
    if (!relativePath.startsWith('/assets/')) return;
    const cleanPath = relativePath.replace('/assets/', '');
    const filePath = path.join(ASSETS_DIR, cleanPath);
    if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
}
```
**User-Controlled Parameter:** `fileUrl` passed from client via the DELETE_FOOD_ITEM, DELETE_ADDRESS, and DELETE_FOOD_REQUEST actions. If `fileUrl` starts with `http://` or `https://`, the URL is parsed and its pathname is extracted. While the code then checks for `/assets/` prefix, the initial URL parsing could trigger DNS resolution to arbitrary domains if the `fileUrl` value reaches this code path. This is reachable via the API's `DELETE_ADDRESS`, `DELETE_FOOD_ITEM`, and `DELETE_FOOD_REQUEST` actions.

### Client-Side SSRF Sinks (Informational for Browser-Based Attacks)

**3. OpenStreetMap Nominatim Reverse Geocoding** (`view/profile/components/AddressList.tsx` lines 66–78):
```typescript
const reverseGeocode = async (lat: number, lng: number) => {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
```
**User-Controlled Parameters:** `lat` and `lng` coordinates from the user's map interaction. These values are embedded directly into the Nominatim API URL. An attacker controlling these values could cause the browser to make requests to Nominatim with manipulated coordinates. Nominatim enforces strict usage policies; however, this pattern is a client-side SSRF-like risk.

**4. OpenStreetMap Nominatim Address Search** (`view/profile/components/AddressList.tsx` lines 95–114):
```typescript
const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.fullAddress)}&limit=1`
);
```
**User-Controlled Parameters:** `formData.fullAddress` (user-typed address string). The value is URL-encoded but directly embedded in the API request URL. An attacker could inject CRLF characters via `encodeURIComponent` bypass attempts, though modern browsers provide protection.

**5. Image URL Optimization** (`utils/imageOptimizer.ts` lines 6–19):
```typescript
export const optimizeUnsplashUrl = (url: string, width: number = 1080): string => {
  if (!url || !url.includes('images.unsplash.com')) return url;
  const urlObj = new URL(url);
  urlObj.searchParams.set('w', width.toString());
  return urlObj.toString();
}
```
**User-Controlled Parameter:** `url` parameter sourced from the database. The function restricts processing to the `images.unsplash.com` domain, providing partial protection. However, if an attacker can control the stored image URL in the database (via ADD_FOOD_ITEM or UPDATE_FOOD_ITEM actions, both unauthenticated), they could cause the client to load arbitrary URLs from the Unsplash CDN, potentially exploiting CDN vulnerabilities or causing resource exhaustion.

### SSRF-Related Findings

**6. Dynamic Table Name in getAllData() — Data Exfiltration Vector** (`server/index.js` lines 136–138):
```javascript
async function getAllData(table) {
    const [rows] = await db.query(`SELECT * FROM ${table}`);
    return rows;
}
```
This is reachable via multiple unauthenticated API actions (GET_USERS, GET_INVENTORY, GET_FAQS, GET_NOTIFICATIONS, GET_BADGES). An attacker can query `information_schema.tables`, `information_schema.columns`, and `mysql` system tables to map the entire database structure and exfiltrate all data. This functions as an information disclosure SSRF equivalent at the database layer.

**7. Vite Define Plugin — API Key Injection into Client Bundle** (`vite.config.ts` lines 13–15):
```typescript
define: {
    'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```
While not a traditional SSRF sink, this mechanism replaces environment variable references at build time, injecting the API key directly into the client bundle. Any user-controllable value in `env.GEMINI_API_KEY` would be reflected into all client-side JavaScript.

**No SSRF Protection Libraries Present:** No `ssrf-filter`, `helmet`, or similar SSRF protection middleware is installed or configured. No URL allowlisting, no DNS rebinding protection, no domain restriction middleware exists.









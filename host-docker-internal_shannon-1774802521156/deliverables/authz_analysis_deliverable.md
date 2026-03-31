# Authorization Analysis Report

## 1. Executive Summary

- **Analysis Status:** Complete
- **Key Outcome:** The FAR-TA2 application has **zero authentication and authorization enforcement** on all 34+ API endpoints. Every endpoint is accessible to any external attacker without credentials. The entire Express server (`server/index.js`) lacks a single authentication middleware, session validation, role check, or ownership guard. The exploitation queue contains **28 confirmed vulnerabilities** across horizontal, vertical, and context/workflow categories, all exploitable externally via HTTP.
- **Purpose of this Document:** This report provides strategic context, architectural intelligence, and vulnerability pattern analysis necessary to effectively exploit the authorization flaws documented in the exploitation queue. It is intended to be read alongside the `authz_exploitation_queue.json` deliverable.

---

## 2. Dominant Vulnerability Patterns

### Pattern 1: Complete Absence of Authentication Middleware (Horizontal | Vertical | Context)

- **Description:** The entire Express API (`server/index.js:21-22`) processes requests without any identity verification. No middleware validates authentication tokens, session IDs, or user identity. Every endpoint handler receives requests unconditionally.
- **Implication:** The distinction between "authenticated" and "unauthenticated" users is non-existent. Any HTTP client can invoke any action.
- **Root Cause:** `app.post('/api')` at `server/index.js:21` has only `cors()` and `bodyParser.json()` middleware registered before the route handler. Zero `requireAuth`, JWT verification, session cookie check, or equivalent.
- **Representative:** AUTHZ-VULN-01 through AUTHZ-VULN-28 (all vulnerabilities)

### Pattern 2: Missing Ownership Validation on ID Parameters (Horizontal)

- **Description:** All endpoint handlers that accept object IDs (`id`, `userId`, `providerId`, `receiverId`, `claimId`) treat them as trusted input. No handler verifies that the requesting user owns or is authorized to access the referenced resource.
- **Implication:** Any user can read, modify, or delete any other user's resources by specifying the target ID.
- **Root Cause:** `server/index.js` handlers directly use ID parameters from `req.body.data` in SQL queries without joining against a user identity. The session is never consulted for authorization decisions.
- **Representative:** AUTHZ-VULN-03, AUTHZ-VULN-04, AUTHZ-VULN-06, AUTHZ-VULN-07, AUTHZ-VULN-10, AUTHZ-VULN-11

### Pattern 3: Unenforced Role-Based Access Control (Vertical)

- **Description:** Despite storing a `role` field in the `users` table, no server-side code checks roles before processing requests. The `ROLE_MAP` constant (`server/index.js:98-106`) is used only for string normalization during registration/login, never for authorization decisions.
- **Implication:** Any user can self-register as `super_admin`, send broadcasts, modify settings, or manage reports without any elevated privileges.
- **Root Cause:** Zero occurrences of `if (role === 'super_admin')` or equivalent in `server/index.js`. The server trusts the client-side session entirely.
- **Representative:** AUTHZ-VULN-12, AUTHZ-VULN-13, AUTHZ-VULN-14, AUTHZ-VULN-15

### Pattern 4: Context-Invariant Workflow State (Context/Workflow)

- **Description:** Multi-step workflows (food donation, claim processing, review submission, QR verification) do not validate prior state. Each step can be invoked independently without confirming that preceding steps were completed by the same authenticated user.
- **Implication:** Callers can jump to any workflow step, skip authorization gates, or inject false state transitions.
- **Root Cause:** Each action handler is independent. No workflow state machine tracks which user completed which step.
- **Representative:** AUTHZ-VULN-19, AUTHZ-VULN-20, AUTHZ-VULN-21, AUTHZ-VULN-22

### Pattern 5: Path Traversal in File Operations (Vertical)

- **Description:** `uploadToFileSystem()` and `deleteFile()` in `server/fileService.js` accept user-controlled `filename`, `folderType`, and `fileUrl` parameters without sanitizing `..` path traversal sequences. `path.join()` normalizes but does not reject traversal.
- **Implication:** Arbitrary file write and delete on the server filesystem, enabling web shell deployment and server compromise.
- **Root Cause:** No allowlist of permitted directories, no validation that resolved path stays within `ASSETS_DIR`, no rejection of `..` in filenames.
- **Representative:** AUTHZ-VULN-24, AUTHZ-VULN-25

---

## 3. Strategic Intelligence for Exploitation

### 3.1 Session Management Architecture

- **Mechanism:** Client-side session storage in `localStorage`/`sessionStorage` as `far_session` key (`App.tsx:271-274`). Stores the complete user object as JSON including `id`, `role`, `email`, `name`, `points`, `status`, `phone`, `avatar`, and `address`.
- **Server Validation:** **None.** The server never validates `far_session`. The `db.ts` service (`services/db.ts:8`) sends no authentication headers.
- **Session Lifetime:** Persists until manual logout (client-side only). No server-side expiration.
- **Logout:** Client-side only (`App.tsx:318-321`). No server-side session invalidation.
- **Critical Finding:** Session is a JSON blob trusted entirely by the client. The server has no concept of sessions — each request is stateless and anonymous from the server's perspective. Role switching is trivial: modify `far_session.role` in localStorage.

### 3.2 Role/Permission Model

- **Roles Defined:** `receiver`, `provider`, `volunteer`, `admin_manager`, `super_admin` (stored as `PENERIMA`, `DONATUR`, `RELAWAN`, `ADMIN`, `SUPER_ADMIN` in database).
- **Role Storage:** MySQL `users.role` column + `localStorage.far_session.role`.
- **Server-Side Enforcement:** **Zero.** No `requireRole`, `requireAdmin`, or equivalent middleware exists anywhere.
- **Client-Side Enforcement:** `App.tsx:678-698` — role checks only for UI rendering, no security value.
- **Role Map:** `server/index.js:98-106` — `ROLE_MAP` and `mapRole()` used only for string normalization, never for authorization.
- **Critical Finding:** The privilege hierarchy (`anon → receiver → provider → volunteer → admin_manager → super_admin`) is a design document with no enforcement. Any actor at any level can perform any action.

### 3.3 Resource Access Patterns

- **API Design:** Single `POST /api` endpoint accepting `{ action, data }` RPC-style requests (`server/index.js:21-95`).
- **ID Parameter Handling:** All ID parameters (`id`, `userId`, `providerId`, `receiverId`, `claimId`, `foodId`) are read from `data` object in request body and passed directly to SQL queries without binding to a user identity.
- **Query Filtering:** When optional filters are omitted, many queries return ALL records across ALL users (e.g., `GET_USERS`, `GET_ADDRESSES`, `GET_CLAIMS`, `GET_NOTIFICATIONS`, `GET_INVENTORY`, `GET_FOOD_REQUESTS`).
- **Critical Finding:** The server uses a flat data model with no row-level security. There is no `WHERE user_id = ?` clause in handlers that would restrict data to the requesting user.

### 3.4 Workflow Implementation

- **Multi-Step Flows:** Food donation (ADD_FOOD_ITEM → PROCESS_CLAIM → UPDATE_CLAIM_STATUS → VERIFY_ORDER_QR → SUBMIT_REVIEW), report submission (SUBMIT_REPORT → UPDATE_REPORT_STATUS), address management (ADD_ADDRESS → UPDATE_ADDRESS → DELETE_ADDRESS).
- **State Tracking:** Each step is a separate action handler with no workflow state machine. No step validates that prior steps were completed.
- **No Nonces/Tokens:** No CSRF tokens, workflow tokens, or state hashes protect any state-changing operation.
- **Critical Finding:** Each workflow action is independently accessible without context from prior steps. An attacker can skip directly to any step.

### 3.5 File Operation Architecture

- **Upload Path:** `POST /api` → `UPLOAD_IMAGE` action → `server/index.js:79-84` → `uploadToFileSystem()` in `server/fileService.js:23-65`.
- **Delete Path (via user update):** `UPSERT_USER` → avatar change triggers `deleteFile()` in `server/fileService.js:70-96`.
- **Storage:** `server/assets/` subdirectories: `fotoProfil/`, `reports/`, `reviews/`, `inventory/`.
- **Serving:** `GET /assets/*` — static file serving with no access control (`server/index.js:14`).
- **Critical Finding:** Any uploaded file is immediately accessible to the entire internet via `GET /assets/*` without authentication.

---

## 4. Guards Directory — What Guards Exist (None)

| Guard | Location | Effective Coverage | Notes |
|-------|----------|-------------------|-------|
| `cors()` | `server/index.js:12` | Network only | Permissive CORS accepts all origins. No auth value. |
| `bodyParser.json()` | `server/index.js:13` | Protocol only | Parses JSON bodies. No auth value. |
| `role-based rendering` | `App.tsx:678-698` | UI only | Client-side role checks for view rendering. No server enforcement. |
| **NONE (all business logic)** | `server/index.js:21-867` | **Zero** | Every action handler processes unconditionally. |

**Conclusion:** No authorization guard exists anywhere in the server-side code. The `cors()` and `bodyParser.json()` middleware provide only network and protocol-layer functions, not authorization.

---

## 5. Vectors Analyzed and Confirmed Secure

No vectors were confirmed as secure. Every endpoint analyzed has at least one authorization vulnerability. The following are explicitly NOT security controls (documented here to prevent false positives from the exploitation phase):

| Endpoint / Pattern | Why It Is NOT a Guard | Verdict |
|--------------------|-----------------------|---------|
| Client-side `far_session` role check | Only client-side; server never validates | VULNERABLE |
| `ROLE_MAP` constant (`server/index.js:98-106`) | Used only for string normalization; not checked before actions | VULNERABLE |
| `App.tsx:678-698` role-based view rendering | UI-only; server has no awareness | VULNERABLE |
| Client-side form validation (`Register.tsx`) | No server-side enforcement | VULNERABLE |
| `getAllData('notifications')` returning all records | Correct behavior for the unauthenticated design, but unintended exposure | VULNERABLE |
| `path.join()` normalizing paths | Normalizes but does not reject `..` traversal | VULNERABLE |
| Column allowlist in `upsertUser` (`server/index.js:150`) | Allowlist includes `role`, `password`, `points`, `status` — all modifiable by any caller | VULNERABLE |

---

## 6. Analysis Constraints and Blind Spots

### 6.1 Untraced Microservice Calls

- The Express server makes outbound HTTPS calls to the Google Gemini AI API (`generativelanguage.googleapis.com`). Authorization within that external service cannot be analyzed — it relies on an API key embedded in the request.
- The application also makes client-side requests to OpenStreetMap Nominatim for geocoding. This is a third-party service with its own authorization model.

### 6.2 Database-Level Authorization

- The MySQL database is accessed using the `root` account with no password (`DB_PASSWORD=` in `server/.env`). If any SQL injection existed, it would yield full database privileges. However, the reconnaissance phase assessed SQL injection as not directly exploitable (table names are hardcoded in case statements).
- There is no row-level security, column-level security, or stored procedure authorization — the database layer provides zero authorization defense.

### 6.3 Future Code Additions

- The codebase structure uses a simple action dispatcher pattern. New action handlers added to `server/index.js` would inherit the same vulnerability pattern (no auth middleware) unless explicitly secured. The exploitation team should check for newly added endpoints if the codebase changes.

### 6.4 Frontend SPA as Attack Surface

- The React SPA at port 4173 cannot be used for authentication (API URL hardcoded to `localhost:5000`), but it remains relevant for exploitation. Browser-based attacks (XSS, CSRF) that could steal the `far_session` localStorage value would enable session hijacking. However, no stored XSS was confirmed in React-rendered contexts.

### 6.5 Scope Limitation: host.docker.internal vs. Public Internet

- The target application is deployed at `http://host.docker.internal:4173` (frontend) and `http://host.docker.internal:5000` (API). The reconnaissance confirmed these are accessible from the attacker's network position. The exploitation phase should confirm reachability.
- All 28 vulnerabilities in the exploitation queue are externally exploitable — no internal network access, VPN, or direct server access is required beyond reaching the HTTP endpoints.

---

## 7. Vulnerability Summary

### By Category

| Category | Count | Highest Severity |
|----------|-------|----------------|
| Horizontal Privilege Escalation | 17 | CRITICAL (data breach, account takeover) |
| Vertical Privilege Escalation | 7 | CRITICAL (full system compromise, path traversal) |
| Context/Workflow Bypass | 4 | HIGH (workflow manipulation, fraud enablement) |
| **Total** | **28** | **CRITICAL** |

### By Confidence

| Confidence | Count |
|------------|-------|
| High | 28 |
| Medium | 0 |
| Low | 0 |

### By Externally Exploitable

| Exploitable | Count |
|-------------|-------|
| Yes (via HTTP to API) | 28 |
| No (requires internal access) | 0 |

### Architectural Root Cause

**The entire application has no authentication middleware.** Every Express route handler processes requests unconditionally. The absence of a single `requireAuth` or `requireRole` middleware in `server/index.js` means that no endpoint — including `REGISTER_USER`, `SEND_BROADCAST`, `UPDATE_SETTINGS`, `GET_USERS`, and every other action — validates user identity or role before executing business logic. This is the single architectural failure from which all 28 vulnerabilities derive.

---

## 8. Secure by Design: Validated Components

No components were found to have robust authorization controls. The following represent the closest approximations to secure design, but none meet the bar for exclusion from the exploitation queue:

| Component | Closest Secure Feature | Why Not Secure |
|-----------|----------------------|----------------|
| Column allowlist in `upsertUser` | Restricts which fields can be updated | `role`, `password`, `points`, `status` are all in the allowlist and modifiable by any caller |
| `mapRole()` normalization | Translates role strings | Used only for case normalization, never checked for authorization |
| Client-side role rendering | Shows different UI based on role | Server never enforces, client can modify localStorage |
| `path.join()` in file operations | Normalizes path separators | Does not reject `..` sequences; allows traversal |
| FK constraints on food_items | Prevents some deletions | Does not prevent unauthorized modification or creation |

---

*Report generated by Authorization Analysis Specialist — Phase: Authorization Analysis (Pre-Exploitation)*
*Application: Food AI Rescue (FAR-TA2)*
*Analysis Confidence: All findings rated HIGH confidence based on direct code inspection of `server/index.js`, `server/fileService.js`, `App.tsx`, `services/db.ts`*

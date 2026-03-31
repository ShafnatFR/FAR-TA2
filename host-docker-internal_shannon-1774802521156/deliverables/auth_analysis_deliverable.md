# Authentication Analysis Report

## 1. Executive Summary

- **Analysis Status:** Complete
- **Key Outcome:** Critical authentication flaws were identified across every dimension of the authentication system. The application implements zero server-side authentication, authorization, or session management. Every one of the 34+ API endpoints is accessible to any unauthenticated external attacker, with plaintext credential storage, client-side-only session management, and no defensive controls whatsoever.
- **Purpose of this Document:** This report provides the strategic context on the application's authentication mechanisms, dominant flaw patterns, and key architectural details necessary to effectively exploit the vulnerabilities listed in the exploitation queue.

---

## 2. Dominant Vulnerability Patterns

### Pattern 1: Complete Absence of Server-Side Authentication
- **Description:** The Express.js backend (`server/index.js`) implements zero authentication middleware, session middleware, or authorization guards. Every API action handler executes unconditionally without verifying caller identity. The server has no concept of sessions, tokens, or principal identity.
- **Implication:** Any network caller — authenticated or not, authorized or not — can invoke any action. The notion of "authentication" exists only as a client-side convenience where the user object is stored in localStorage and re-sent with each request, but the server never validates it.
- **Representative Findings:** `AUTH-VULN-01`, `AUTH-VULN-05`, `AUTH-VULN-10`

### Pattern 2: Plaintext Credential Storage and Transmission
- **Description:** Passwords are stored in plaintext in the MySQL database (`users.password` column) and compared directly in SQL queries (`WHERE email = ? AND password = ?`). There is no hashing, no salting, no bcrypt, and no server-side password policy enforcement.
- **Implication:** Any database compromise, SQL injection (future risk), or insider access yields immediately reusable credentials. Network interception over HTTP exposes all credentials in cleartext.
- **Representative Findings:** `AUTH-VULN-02`, `AUTH-VULN-07`

### Pattern 3: Client-Side-Only Session Management
- **Description:** Authentication state is managed entirely client-side by serializing the user object to localStorage (`far_session` key). The server maintains no session store, no session ID, and performs no session validation. Sessions never expire, cannot be invalidated on the server, and have no cryptographic integrity protection.
- **Implication:** The "session" is an unverified JSON blob. Any caller can fabricate a session for any user, role, or privilege level by simply constructing the appropriate JSON object and sending it (even though in practice, the server ignores it anyway).
- **Representative Findings:** `AUTH-VULN-05`, `AUTH-VULN-06`, `AUTH-VULN-09`

### Pattern 4: Unchecked Role Assignment
- **Description:** The `REGISTER_USER` handler accepts a `role` parameter directly from client data and maps it via `mapRole()` without any server-side authorization check. The `UPSERT_USER` handler can modify any user's role field without verification. The frontend UI hides admin roles, but the API accepts them freely.
- **Implication:** Any user can register as `super_admin` or escalate any existing account to full administrative privileges without any authorization.
- **Representative Findings:** `AUTH-VULN-03`, `AUTH-VULN-10`

### Pattern 5: No Defensive Controls on Authentication Infrastructure
- **Description:** No rate limiting, no account lockout, no CAPTCHA, no monitoring, no brute-force detection. No HTTPS/TLS. No security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Content-Security-Policy). No server-side password complexity enforcement.
- **Implication:** Authentication endpoints are defenseless against automated attacks including credential stuffing, brute force, and mass account registration. All traffic is plaintext.
- **Representative Findings:** `AUTH-VULN-02`, `AUTH-VULN-04`, `AUTH-VULN-08`

---

## 3. Strategic Intelligence for Exploitation

### 3.1 Authentication Method
The application uses **no server-side authentication mechanism**. The "session" is a JSON object stored in the browser's localStorage (`far_session` key) containing: `{ id, name, email, role, status, points, joinDate, phone, address, avatar, isNewUser }`. This object is sent with every API request as the `data` field of `{ action, data }`, but the server ignores it entirely — there is no authentication token, no session cookie, and no session ID validation.

### 3.2 Session Token Details
- **Session Storage:** `localStorage` (when "Ingat Saya" is checked) or `sessionStorage` (temporary session) under key `far_session`
- **Session Contents:** Full user object including `id`, `role`, `email`, `points`, `status` — all as plaintext JSON
- **HttpOnly Flag:** N/A (no cookies used for session)
- **Secure Flag:** N/A (no cookies used for session)
- **XSS Risk:** CRITICAL — localStorage session is directly accessible to JavaScript. Any XSS vulnerability enables immediate session theft.
- **Session Rotation:** None — the same `far_session` object persists across the entire session lifetime
- **Session Expiration:** None — no TTL, no idle timeout, no server-side expiration
- **Logout:** Client-side only (`localStorage.removeItem('far_session')`) — no server invalidation

### 3.3 Password Policy
- **Storage:** Plaintext in MySQL `users.password` column (no hashing)
- **Server-Side Validation:** None — accepts any string of any length
- **Client-Side Registration Validation:** Minimum password score of 75 (requires: 8+ chars, number, uppercase, symbol). Trivially bypassed by calling `REGISTER_USER` API directly.
- **Client-Side Login Validation:** Only `includes('@')` for email, 1 character minimum for password (line 34 of Login.tsx)
- **Default Credentials:** None confirmed, but test data in `server/dataDumy.sql` contains plaintext passwords

### 3.4 Login Error Responses
- **Registration Failure (email taken):** `"Email ini sudah terdaftar."` — reveals email is registered
- **Login Failure:** `"Email atau Password salah."` — generic, does not reveal which field
- **No separate "user not found" vs "wrong password" messages in production code** — the generic login error prevents direct enumeration via the login endpoint, but registration does not

### 3.5 API Action Router
All API functionality is accessed via a single POST endpoint: `POST http://host.docker.internal:5000/api`
- Request format: `{ "action": "ACTION_NAME", "data": { ... } }`
- All actions are unauthenticated
- Notable auth-adjacent actions:
  - `REGISTER_USER` — accepts `role` parameter directly from client
  - `LOGIN_USER` — plaintext email + password comparison
  - `GET_USERS` — returns all users including plaintext passwords
  - `UPSERT_USER` — can modify any user's role/password without authorization

### 3.6 External Reachability
The frontend SPA at `http://host.docker.internal:4173` proxies API calls to `http://localhost:5000/api` (hardcoded in `services/db.ts`). External attackers access the API directly at `http://host.docker.internal:5000/api` — all 34+ endpoints are reachable without any credentials.

---

## 4. Detailed Analysis by Category

### 4.1 Transport & Caching Security
**Verdict: VULNERABLE**

**Finding — No HTTPS/TLS (AUTH-VULN-02):**
- Both the frontend (`http://host.docker.internal:4173`) and backend API (`http://host.docker.internal:5000`) serve traffic exclusively over HTTP with no TLS encryption.
- No HSTS header is sent. No certificate pinning.
- All credentials, session objects, API responses, and uploaded files traverse the network in cleartext.
- **Exploitable:** Any man-in-the-middle attacker on the network path can capture all credentials and session tokens.
- **Source:** `server/index.js:1-14` — Express app with no TLS configuration; recon confirmed HTTP-only ports 4173 and 5000.

**Finding — No Security Headers:**
- No `helmet.js` or equivalent middleware is installed.
- Missing headers include: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `X-XSS-Protection`.
- **Exploitable:** Lack of `X-Frame-Options` enables clickjacking attacks against the SPA.
- **Source:** `server/index.js:1-14` — zero security middleware configured.

**Finding — No Cache Controls on Auth Responses:**
- API responses (including user data, credentials-related responses) do not set `Cache-Control: no-store` or `Pragma: no-cache`.
- Cached responses in browser history or proxy caches may expose sensitive auth data.
- **Source:** `server/index.js` — no cache-control headers set on any response.

### 4.2 Rate Limiting / Brute Force Protections
**Verdict: VULNERABLE**

**Finding — Zero Rate Limiting on All Auth Endpoints (AUTH-VULN-04):**
- The Express server at `server/index.js` has no `express-rate-limit` or equivalent middleware installed on any endpoint.
- No per-IP rate limiting. No per-account rate limiting. No progressive backoff.
- No CAPTCHA mechanism exists anywhere in the application.
- No monitoring or alerting for failed-login spikes.
- **Exploitable:** Unlimited login attempts against any email address. Unlimited account registration attempts. Fully automated credential stuffing and password spraying attacks are trivially possible.
- **Source:** `server/index.js:1-14` — entire file has zero rate limiting middleware.

### 4.3 Session Management
**Verdict: VULNERABLE**

**Finding — No Server-Side Session Management (AUTH-VULN-01, AUTH-VULN-05):**
- The Express server uses no `express-session`, no JWT, no session cookies, and maintains no server-side session store.
- The `far_session` key in localStorage/sessionStorage is a plaintext JSON object containing the full user profile (id, role, email, points, status).
- All 34+ API endpoints process requests unconditionally without consulting any session or identity.
- **Exploitable:** The server cannot distinguish between a legitimate authenticated request and a fabricated one. Any caller can invoke any action without a session.
- **Source:** `server/index.js:1-14` — zero session middleware; confirmed by `App.tsx:68-87` where session is purely client-side.

**Finding — Session Stored Without Security Flags:**
- `far_session` is stored in localStorage (accessible to any JavaScript on the page, including injected scripts from third-party CDNs or XSS).
- No `HttpOnly` flag (N/A for localStorage). No `Secure` flag (N/A for localStorage). No `SameSite` attribute.
- **Exploitable:** Any XSS vulnerability enables immediate full session theft. The session contains the user's role, enabling privilege escalation without password reuse.
- **Source:** `App.tsx:268-274`.

**Finding — No Session Rotation After Login:**
- Since there is no server-side session, there is no concept of session rotation. The client sends user data directly without any session ID.
- Pre-login and post-login requests carry the same or no identifier.
- **Exploitable:** Session fixation attacks are irrelevant because the "session" is fully client-controlled, making session replacement trivial.
- **Source:** `server/index.js` — no session management at all.

**Finding — No Session Expiration (AUTH-VULN-09):**
- The `far_session` object in localStorage has no TTL. The server has no session store to enforce expiration.
- Sessions persist indefinitely across browser restarts until manual logout.
- **Exploitable:** A captured session token remains valid forever (no server-side invalidation), enabling long-term persistent access.
- **Source:** `App.tsx:68-87` — no expiration logic; `server/index.js` — no session store.

**Finding — No Server-Side Logout Invalidation (AUTH-VULN-06):**
- The `handleLogout()` function in `App.tsx:318-329` only removes `far_session` from localStorage/sessionStorage.
- No API call is made to invalidate the session server-side (because there is no server session).
- A captured `far_session` object remains valid after the legitimate user logs out.
- **Exploitable:** An attacker with a stolen session token can continue using it indefinitely even after the user logs out.
- **Source:** `App.tsx:318-329` — client-only logout.

### 4.4 Token/Session Properties
**Verdict: VULNERABLE**

**Finding — No Cryptographic Tokens:**
- No JWT, no HMAC-signed tokens, no opaque session IDs are generated by the server.
- The session is a plaintext JSON object: `{ id, name, email, role, status, points, joinDate, phone, address, avatar, isNewUser }`.
- No entropy, no nonce, no cryptographic randomness in session construction.
- **Exploitable:** The "session" carries no integrity protection. Modifying the role field to `super_admin` requires only string replacement in the JSON.
- **Source:** `App.tsx:241-277` (login handler builds user object); `server/index.js` (server ignores session entirely).

**Finding — Tokens Sent Over Plain HTTP:**
- All API requests travel over HTTP without TLS, exposing the session object to network interception.
- **Exploitable:** Network-level attackers can capture the plaintext session object.
- **Source:** `server/index.js:1-14`, `services/db.ts`.

**Finding — No Token Expiration:**
- Sessions never expire server-side. localStorage has no built-in TTL mechanism.
- **Exploitable:** Long-lived session tokens enable persistent access for attackers.
- **Source:** `App.tsx:68-87`, `server/index.js`.

### 4.5 Session Fixation
**Verdict: VULNERABLE**

**Finding — Session Fixation (AUTH-VULN-05):**
- The login flow does not generate a new server-side session ID. Since the server has no session concept, any client can pre-set their "session" to any value.
- An attacker can set their localStorage `far_session` to a known value (e.g., `{ role: "super_admin", ... }`) before authenticating, and the server will process their requests without ever validating the session.
- **Exploitable:** In practice, since the server performs no session validation, the concept of "fixation" vs. "hijacking" collapses — both attacks are equally trivial because all requests are unconditionally processed.
- **Source:** `server/index.js:123-134` (login ignores session); `App.tsx:241-277` (client sets session directly).

### 4.6 Password & Account Policy
**Verdict: VULNERABLE**

**Finding — Plaintext Password Storage (AUTH-VULN-07):**
- User passwords are inserted directly into the `users` table without any hashing: `'INSERT INTO users (..., password, ...) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'` with `[name, email, password, ...]`.
- The `loginUser()` function compares passwords in plaintext: `'SELECT * FROM users WHERE email = ? AND password = ?'`.
- No bcrypt, no Argon2, no PBKDF2, no salt, no pepper.
- **Exploitable:** Any database breach, insider access, or future SQL injection yields immediately reusable credentials. The `GET_USERS` endpoint exposes all passwords in plaintext over the network.
- **Source:** `server/index.js:118` (registration), `server/index.js:125` (login).

**Finding — No Server-Side Password Policy:**
- The server accepts any password string with no minimum length, complexity, or common password check.
- Client-side registration enforces a password strength score >= 75 (8+ chars, number, uppercase, symbol), but this is trivially bypassed by calling `REGISTER_USER` directly.
- **Exploitable:** Accounts can be registered with trivially weak passwords via direct API calls, bypassing all client-side controls.
- **Source:** `server/index.js:110-121` — no password validation server-side; `services/db.ts` sends directly to API.

**Finding — Weak Client-Side Login Validation (AUTH-VULN-13):**
- Login form only requires `email.includes('@')` (one character check on password).
- Passwords as short as 1 character are accepted by the client form.
- **Exploitable:** Combined with no server-side validation, any password is accepted.
- **Source:** `view/auth/Login.tsx:32-38`.

**Finding — Default/Test Credentials:**
- `server/dataDumy.sql` contains test data with plaintext passwords committed to version control.
- **Exploitable:** Test accounts may provide a foothold for further attacks.
- **Source:** `server/dataDumy.sql` — plaintext passwords in version control.

### 4.7 Login/Signup Responses
**Verdict: VULNERABLE**

**Finding — Email Enumeration on Registration (AUTH-VULN-08):**
- `registerUser()` at `server/index.js:112` throws `'Email ini sudah terdaftar.'` when the email is already in use.
- This distinct error message allows an attacker to enumerate which email addresses are registered.
- `GET_USERS` also exposes all user emails in a single call.
- **Exploitable:** An attacker can enumerate valid registered accounts for targeted attacks.
- **Source:** `server/index.js:112`.

**Finding — No Auth State in URLs:**
- The SPA uses client-side routing via `currentView` state. No session tokens or auth state appear in URLs.
- **Assessment:** This is correctly implemented — no auth state leakage in URLs.
- **Source:** `App.tsx` — SPA routing.

### 4.8 Recovery & Logout
**Verdict: VULNERABLE**

**Finding — No Password Reset/Recovery Flow:**
- No `FORGOT_PASSWORD`, `RESET_PASSWORD`, or equivalent action exists in `server/index.js`.
- No email-based reset token generation, no single-use reset links.
- **Implication:** Users who lose their password cannot recover their account through the application. However, the `UPSERT_USER` action (accessible to all) allows password changes on any account.
- **Source:** `server/index.js` — no reset/recovery handlers.

**Finding — Logout Without Server Invalidation (AUTH-VULN-06):**
- Covered in Section 4.3. Logout is purely client-side.
- **Source:** `App.tsx:318-329`.

### 4.9 OAuth/SSO
**Verdict: VULNERABLE**

**Finding — Hardcoded OAuth2 Tokens:**
- `server/.env` contains Google OAuth2 credentials:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
  - These tokens are used for Google Drive integration but no OAuth2 login flow is implemented.
- **Exploitable:** OAuth tokens in version control and exposed via `.env` files enable account takeover of the associated Google account if leaked.
- **Source:** `server/.env`.

**Finding — No OAuth Login Flow:**
- The application has no OAuth2/OIDC login mechanism. Authentication is exclusively email/password.
- **Source:** `server/index.js` — no OAuth handlers.

### 4.10 Additional Transport & CORS Findings
**Verdict: VULNERABLE**

**Finding — CORS Wide Open:**
- `server/index.js:12`: `app.use(cors())` with default permissive settings — accepts requests from any origin.
- **Exploitable:** Any malicious website can make API requests on behalf of any logged-in user via browser-based attacks (CSRF-style, but without CSRF tokens the attack is even simpler).
- **Source:** `server/index.js:12`.

**Finding — No CSRF Tokens:**
- No CSRF token generation or validation anywhere in the application.
- **Exploitable:** Any website can submit authenticated requests on behalf of a logged-in user.
- **Source:** `server/index.js` — zero CSRF protection.

**Finding — No X-Frame-Options:**
- No `X-Frame-Options` or CSP `frame-ancestors` directive.
- **Exploitable:** The application can be embedded in an iframe, enabling clickjacking attacks.
- **Source:** `server/index.js:1-14` — no security headers.

---

## 5. Secure by Design: Validated Components

These components were analyzed and found to have robust defenses. They are low-priority for further testing.

| Component/Flow | Endpoint/File Location | Defense Mechanism Implemented | Verdict |
|---|---|---|---|
| Login Error Message (Generic) | `server/index.js:127` | Returns `"Email atau Password salah."` without distinguishing between invalid email vs. wrong password. Client-side normalization in `view/auth/Register.tsx` further abstracts error details. | SAFE (Login endpoint only — registration still leaks email existence) |
| Session State Not in URL | `App.tsx` | SPA routing uses `currentView` React state, not URL paths for session state. No session tokens in query strings. | SAFE |
| Role-Based UI Rendering | `App.tsx:564-698` | While client-side only (no server enforcement), the UI correctly hides admin features from regular users based on role parsing from session. Not a server-side defense but reduces phishing risk. | SAFE (client-side only, not an AuthN control) |
| bcrypt Not Used (Password Comparison) | `server/index.js:125` | The code does NOT use bcrypt — passwords are stored in plaintext. This is actually a VULNERABILITY (AUTH-VULN-07), not a safe component. Listed here to document the absence of the expected secure pattern. | VULNERABLE |
| Path Sanitization in FileService | `server/fileService.js:70-96` | Uses `new URL()` constructor and `path.join()` for URL-based file deletion paths, which provides some normalization. However, path traversal via `folderType` parameter in uploads remains exploitable. | PARTIAL (URL-based deletion only) |

---

## 6. Exploitation Queue Summary

The following 10 vulnerabilities were identified and passed to the Auth Exploitation phase. All are externally exploitable via HTTP requests to `http://host.docker.internal:5000/api` from the public internet without any internal access requirements.

| ID | Vulnerability Type | Source Endpoint | Confidence | Externally Exploitable |
|----|-------------------|-----------------|------------|----------------------|
| AUTH-VULN-01 | Authentication_Bypass | POST /api (all 34+ actions) | High | Yes |
| AUTH-VULN-02 | Transport_Exposure | POST /api (LOGIN_USER, REGISTER_USER, GET_USERS) | High | Yes |
| AUTH-VULN-03 | Login_Flow_Logic | POST /api (REGISTER_USER) | High | Yes |
| AUTH-VULN-04 | Abuse_Defenses_Missing | POST /api (LOGIN_USER, REGISTER_USER) | High | Yes |
| AUTH-VULN-05 | Session_Management_Flaw | POST /api (LOGIN_USER) and all subsequent endpoints | High | Yes |
| AUTH-VULN-06 | Session_Management_Flaw | POST /api (all endpoints) | High | Yes |
| AUTH-VULN-07 | Weak_Credentials | POST /api (LOGIN_USER, REGISTER_USER) | High | Yes |
| AUTH-VULN-08 | Login_Flow_Logic | POST /api (REGISTER_USER) | High | Yes |
| AUTH-VULN-09 | Token_Management_Issue | POST /api (all endpoints) | High | Yes |
| AUTH-VULN-10 | Authentication_Bypass | POST /api (UPSERT_USER) | High | Yes |

**Total Vulnerabilities:** 10
**Externally Exploitable:** 10 (100%)
**High Confidence:** 10 (100%)

The exploitation queue file is located at: `deliverables/auth_exploitation_queue.json`




# Injection Analysis Report (SQLi, Command Injection, Path Traversal)

## 1. Executive Summary

- **Analysis Status:** Complete
- **Key Outcome:** Three high-confidence Path Traversal vulnerabilities were identified and passed to the exploitation phase via `deliverables/injection_exploitation_queue.json`. No traditional SQL Injection (SQLi) or Command Injection was found to be externally exploitable via the current code paths. The primary attack surface is Path Traversal leading to arbitrary file write and arbitrary file delete.
- **Purpose of this Document:** This report provides the strategic context, vulnerability patterns, and environmental intelligence necessary to effectively exploit the confirmed vulnerabilities. It is intended to be read alongside the JSON exploitation queue.

---

## 2. Technology & Defensive Context

### 2.1 Backend Architecture
- **Runtime:** Node.js / Express.js 5.2.1 (CommonJS)
- **Database:** MySQL 10.4.32 via mysql2/promise (root/empty credentials)
- **File Storage:** Local filesystem under `server/assets/`
- **Image Processing:** Sharp 0.34.5 (server-side resize/compress)
- **Security Libraries:** None — no helmet, express-rate-limit, csurf, or jsonwebtoken
- **Authentication:** Zero — no session middleware, no JWT, no auth token validation on any endpoint

### 2.2 Defensive Measures in Place
- **SQL Parameterization:** Most handlers (24 of ~32 actions) use mysql2 prepared statements with `?` placeholders and value arrays — correct usage for SQL data values
- **Column Allowlist in UPSERT_USER:** `server/index.js:150` restricts updateable columns to `['name', 'email', 'role', 'phone', 'avatar', 'points', 'status', 'password', 'selected_badge_id']`
- **Type Transformations:** `mapRole()`, `toUpperCase()`, phone digit stripping — applied to specific fields but not as SQL injection defenses
- **Sharp Image Processing:** JPEG re-encoding of uploaded images (protective for XSS, but bypassable with non-image files)
- **No WAF detected:** No Web Application Firewall or API gateway between the internet and the Express server

### 2.3 Confirmed Database Technology
- **MySQL 10.4.32** confirmed via error syntax and mysql2 driver
- All SQL-based payloads should be MySQL-specific (avoid PostgreSQL-isms like `pg_sleep()`, use `SLEEP()` instead)

---

## 3. Dominant Vulnerability Patterns

### Pattern 1: Unchecked Path Traversal in File Operations
- **Description:** Both `uploadToFileSystem()` and `deleteFile()` in `server/fileService.js` use `path.join()` with user-controlled strings without any traversal prevention. Parameters like `filename` and `folderType` (UPLOAD_IMAGE) and `avatar` URL (deleteFile) are passed directly from the POST body to filesystem operations.
- **Implication:** An attacker can use `../` sequences to escape the intended `server/assets/` directory, achieving arbitrary file write (via UPLOAD_IMAGE) and arbitrary file delete (via avatar change triggering deleteFile). Combined, these can lead to RCE by overwriting server files or cron jobs.
- **Representative:** INJ-VULN-01 (UPLOAD_IMAGE file write), INJ-VULN-02 (deleteFile file delete)

### Pattern 2: Unsafe SQL Template Construction (Not Currently Exploitable)
- **Description:** Two helper functions — `getAllData(table)` at `server/index.js:136-139` and `deleteData(table, id)` at `server/index.js:339-343` — use template literal string interpolation for table names directly into SQL queries without parameterization. The `table` and `tableName` variables are concatenated as bare strings.
- **Implication:** If a future code change routes user-controlled input to these functions (e.g., an action handler passes `data.table` to `getAllData`), SQL injection becomes trivially exploitable. The vulnerability is latent in the codebase.
- **Representative:** N/A (not currently exploitable via documented API paths)

### Pattern 3: No Authentication Gate on Any Operation
- **Description:** Every API endpoint processes requests unconditionally. No middleware validates user identity, session authenticity, or role permissions. Any network caller can invoke any action, including administrative operations (UPSERT_USER, SEND_BROADCAST, UPDATE_SETTINGS).
- **Implication:** Path traversal attacks (INJ-VULN-01, INJ-VULN-02) are executable by any anonymous attacker without credentials. The two-step deleteFile attack requires no special privileges — setting a victim's avatar URL via UPSERT_USER is accessible to all.
- **Representative:** INJ-VULN-02 (two-step delete via avatar URL)

### Pattern 4: User Data in AI Prompt (Prompt Injection)
- **Description:** The `ANALYZE_FOOD` action handler (`server/index.js:758-794`) interpolates four user-supplied context fields (`foodName`, `ingredients`, `madeTime`, `weightGram`) directly into a Gemini AI prompt string without sanitization or escaping.
- **Implication:** An attacker can inject arbitrary instructions into the AI prompt, potentially causing the model to ignore its safety guidelines, reveal sensitive data from prior context, or produce harmful outputs attributed to the application.
- **Representative:** Prompt injection via ANALYZE_FOOD (documented but outside SQLi/CommandInjection scope per se)

---

## 4. Strategic Intelligence for Exploitation

### 4.1 Primary Attack Vector: Arbitrary File Write (INJ-VULN-01)
- The `UPLOAD_IMAGE` action is accessible to all anonymous callers
- `data.filename` and `data.folderType` both accept `../` traversal sequences
- **Bypass Sharp Processing:** Send a non-image MIME type (e.g., `video/mp4` or `application/octet-stream`) in the base64 data URI header to bypass Sharp JPEG re-encoding and trigger the `fs.writeFileSync()` path (fileService.js:56)
- **RCE Targets:**
  - Overwrite `server/index.js` or other server files with malicious Node.js code
  - Write to `server/routes/` if a routes directory exists and is auto-loaded
  - Write cron jobs to `../../etc/cron.d/` or `../../var/spool/cron/`
  - Write SSH authorized_keys to `../../root/.ssh/` or `../../home/*/.ssh/`
  - Overwrite `.bashrc`, `.profile`, or other shell initialization files

### 4.2 Secondary Attack Vector: Arbitrary File Delete (INJ-VULN-02)
- The two-step avatar-URL attack requires no authentication
- Step 1: `POST /api` with `UPSERT_USER` action sets any user's `avatar` field to a path like `/assets/../../../etc/cron.d/malicious`
- Step 2: When the target user updates their avatar (any future avatar change), `deleteFile(oldUser.avatar)` is called, triggering the traversal delete
- **Impact:** Delete critical system files, cron configuration, log files, or application code to cause denial of service or privilege escalation

### 4.3 Combined Attack Chain
1. Use INJ-VULN-01 to write a web shell or malicious Node.js module to the server
2. Use INJ-VULN-02 to delete the original cron job or replace it with one that executes the malicious module
3. Alternatively: Write to `~/.ssh/authorized_keys` for SSH access, or overwrite `server/index.js` for persistent backdoor

### 4.4 SQL Injection Assessment
- **No externally exploitable SQLi found** in current code paths — all user data reaches SQL queries via prepared statement parameter binding
- **Latent SQLi risk** in `getAllData()` and `deleteData()` if future code changes route `data.table` to these functions
- **Recommendation:** Focus exploitation efforts on Path Traversal (INJ-VULN-01, INJ-VULN-02) which have clear paths to server compromise

---

## 5. Vectors Analyzed and Confirmed Secure

These input vectors were traced through complete source-to-sink paths and confirmed to have appropriate defenses. They are **not recommended** for further injection testing.

| **Source (Parameter/Action)** | **Endpoint/Sink** | **Defense Mechanism** | **Verdict** |
|-------------------------------|-----------------|----------------------|-------------|
| `email`, `password` — LOGIN_USER | `server/index.js:125` → `db.query()` | Prepared statement parameter binding (`?` placeholders) | SAFE |
| `name`, `email`, `password`, `role`, `phone`, `avatar` — REGISTER_USER | `server/index.js:112-119` → `db.query()` | Prepared statement parameter binding | SAFE |
| `userId` — GET_ADDRESSES | `server/index.js:216` → `db.query()` | Prepared statement parameter binding for userId | SAFE |
| `id` (DELETE_ADDRESS, DELETE_FOOD_ITEM, DELETE_FOOD_REQUEST) | `server/index.js:341` → `db.query()` | Prepared statement parameter binding for `id`; table name hardcoded | SAFE (table name hardcoded, not exploitable) |
| `providerId` — GET_INVENTORY | `server/index.js:271-278` → `db.query()` | Prepared statement parameter binding for providerId; no user data in SQL strings | SAFE |
| `providerId`, `receiverId` — GET_CLAIMS | `server/index.js:360-370` → `db.query()` | Prepared statement parameter binding for both IDs | SAFE |
| `uniqueCode` — VERIFY_ORDER_QR | `server/index.js:494` → `db.query()` | Prepared statement parameter binding for uniqueCode | SAFE |
| `period` — GET_IMPACT_CHART | `server/index.js:600-675` → `db.query()` | Used only in `if/else if` string equality comparisons, NOT in SQL strings | SAFE |
| `userId` — GET_SOCIAL_IMPACT, GET_IMPACT_CHART, GET_POINT_HISTORY | `server/index.js:557-719` → `db.query()` | Prepared statement parameter binding for userId in all queries | SAFE |
| `id` — UPDATE_REPORT_STATUS | `server/index.js:538` → `db.query()` | Integer parsing (`parseInt`) + prepared statement binding + status whitelist validation | SAFE |
| `claimId`, `rating`, `review` — SUBMIT_REVIEW | `server/index.js:502-514` → `db.query()` | Prepared statement parameter binding for all user fields | SAFE |
| `claimId`, `reason`, `description` — SUBMIT_REPORT | `server/index.js:516-524` → `db.query()` | Prepared statement parameter binding for all user fields | SAFE |
| `id`, `status` — UPDATE_CLAIM_STATUS | `server/index.js:452-490` → `db.query()` | Prepared statement parameter binding; status used in SQL string but from controlled enum | SAFE |
| `avatar` field in UPSERT_USER (update SET clause) | `server/index.js:163-169` → `db.query()` | Column allowlist (`validColumns`) + prepared statement parameter binding for value | SAFE (column name from allowlist, value bound) |
| `syncConfigs` keys (address IDs) — UPSERT_USER | `server/index.js:196-200` → `db.query()` | Address IDs used as bound values in WHERE clause; column names hardcoded | SAFE |
| All GET actions (GET_USERS, GET_FAQS, GET_NOTIFICATIONS, GET_BADGES) | `server/index.js:30-73` → `getAllData('hardcoded_table')` | No user input reaches these queries; table names are hardcoded | SAFE (table injection not reachable) |

---

## 6. Vulnerabilities Passed to Exploitation Phase

Three vulnerabilities have been confirmed and passed to the exploitation phase via `deliverables/injection_exploitation_queue.json`:

| ID | Type | Severity | Exploitability | Confidence |
|----|------|----------|----------------|------------|
| INJ-VULN-01 | PathTraversal (Arbitrary File Write) | CRITICAL | Direct via UPLOAD_IMAGE action | HIGH |
| INJ-VULN-02 | PathTraversal (Arbitrary File Delete) | HIGH | Two-step via UPSERT_USER + avatar change | HIGH |
| INJ-VULN-03 | PathTraversal (DNS + File Delete) | MEDIUM | Same as INJ-VULN-02, SSRF via new URL() | HIGH |

---

## 7. Analysis Constraints and Blind Spots

### 7.1 Design-Time SQL Injection Risk
The `getAllData()` and `deleteData()` functions at `server/index.js:136-139` and `339-343` contain template literal SQL injection vulnerabilities in their function signatures. These are **not currently exploitable** because all call sites pass hardcoded table name strings. However, if a future developer adds an action handler that passes `data.table` or `data.tableName` from the POST body to either function, SQL injection becomes immediately exploitable. This represents a significant design-time risk.

### 7.2 No Command Injection Found
No usage of `child_process.exec()`, `child_process.execSync()`, `child_process.spawn()`, `eval()`, or `new Function()` with user-controlled input was found in any network-accessible code path. The primary server compromise path is through Path Traversal → arbitrary file write → overwrite server code, not direct command injection.

### 7.3 File Write RCE Chain Unverified
The Path Traversal → arbitrary file write (INJ-VULN-01) is confirmed, but the specific path to Remote Code Execution (e.g., which files to overwrite, whether Express auto-reloads, whether cron directories are writable) requires live testing during the exploitation phase.

### 7.4 DeleteFile Trigger Dependency
INJ-VULN-02 (arbitrary file delete) requires the target user to change their avatar at some point after the malicious avatar URL is set. If no avatar change occurs, the file deletion is not triggered. However, since all API operations are unauthenticated and any user can modify any user's profile via UPSERT_USER, an attacker can also directly set a malicious avatar URL on any user account.

### 7.5 No Server-Side Template Engine
The application uses a React SPA frontend with no server-side rendering. No Server-Side Template Injection (SSTI) vectors were found.

### 7.6 No Unsafe Deserialization
No `unserialize()`, `pickle.loads()`, or similar deserialization of untrusted data was found. Standard `JSON.parse()` is used throughout with error handling.

---

## 8. Analysis Coverage Summary

All 34+ API actions identified in the reconnaissance deliverable were systematically analyzed for injection vulnerabilities. The table below documents every action that handles user input and whether it was found to be safe or vulnerable.

| Action | Input Fields Analyzed | Sink Type | Defense | Verdict |
|--------|----------------------|-----------|---------|---------|
| REGISTER_USER | name, email, password, role, phone, avatar | SQL INSERT | Parameter binding | SAFE |
| LOGIN_USER | email, password | SQL SELECT | Parameter binding | SAFE |
| GET_USERS | None | SQL SELECT (hardcoded) | N/A | SAFE |
| UPSERT_USER | All fields via column allowlist | SQL UPDATE | Allowlist + binding | SAFE (SQL); **VULNERABLE** (Path Traversal via avatar→deleteFile) |
| GET_ADDRESSES | userId | SQL SELECT | Parameter binding | SAFE |
| ADD_ADDRESS | All address fields | SQL INSERT/UPDATE | Parameter binding | SAFE |
| UPDATE_ADDRESS | All address fields | SQL UPDATE | Parameter binding | SAFE |
| DELETE_ADDRESS | id | SQL DELETE | Parameter binding + hardcoded table | SAFE |
| GET_INVENTORY | providerId | SQL SELECT | Parameter binding | SAFE |
| ADD_FOOD_ITEM | All food item fields | SQL INSERT | Parameter binding | SAFE |
| UPDATE_FOOD_STOCK | id, newQuantity | SQL UPDATE | Parameter binding | SAFE |
| UPDATE_FOOD_ITEM | All food item fields | SQL UPDATE | Parameter binding | SAFE |
| DELETE_FOOD_ITEM | id | SQL DELETE | Parameter binding + hardcoded table | SAFE |
| GET_CLAIMS | providerId, receiverId | SQL SELECT | Parameter binding | SAFE |
| PROCESS_CLAIM | All claim fields | SQL SELECT/UPDATE/INSERT | Parameter binding | SAFE |
| UPDATE_CLAIM_STATUS | id, status, additionalData | SQL UPDATE | Parameter binding | SAFE |
| VERIFY_ORDER_QR | uniqueCode | SQL SELECT/UPDATE | Parameter binding | SAFE |
| SUBMIT_REVIEW | claimId, rating, review, reviewMedia | SQL INSERT | Parameter binding | SAFE |
| SUBMIT_REPORT | claimId, reason, description, evidence | SQL INSERT | Parameter binding | SAFE |
| UPDATE_REPORT_STATUS | id, status | SQL UPDATE | parseInt + whitelist + binding | SAFE |
| SEND_BROADCAST | title, content, target | SQL INSERT | Parameter binding | SAFE |
| GET_SETTINGS | None | In-memory | N/A | SAFE |
| UPDATE_SETTINGS | All data fields | In-memory | N/A | SAFE |
| GET_SOCIAL_IMPACT | userId | SQL SELECT | Parameter binding | SAFE |
| GET_IMPACT_CHART | userId, period | SQL SELECT | Parameter binding (userId) + safe conditionals (period) | SAFE |
| GET_FOOD_REQUESTS | receiverId | SQL SELECT | Parameter binding | SAFE |
| ADD_FOOD_REQUEST | All request fields | SQL INSERT | Parameter binding | SAFE |
| DELETE_FOOD_REQUEST | id | SQL DELETE | Parameter binding + hardcoded table | SAFE |
| GET_POINT_HISTORY | userId | SQL SELECT | Parameter binding | SAFE |
| GET_BADGES | None | SQL SELECT (hardcoded) | N/A | SAFE |
| ANALYZE_FOOD | context.foodName, context.ingredients, context.madeTime, context.weightGram | Gemini AI prompt | None | VULNERABLE (Prompt Injection) |
| UPLOAD_IMAGE | filename, folderType, base64 | Filesystem (fs.writeFileSync) | None | **VULNERABLE** (Path Traversal — INJ-VULN-01) |
| GET_FAQS | None | SQL SELECT (hardcoded) | N/A | SAFE |
| GET_NOTIFICATIONS | None | SQL SELECT (hardcoded) | N/A | SAFE |

**Total Actions Analyzed:** 35
**Confirmed Vulnerable (Path Traversal):** 2 (UPLOAD_IMAGE — INJ-VULN-01; deleteFile via avatar — INJ-VULN-02/03)
**Confirmed Vulnerable (Prompt Injection):** 1 (ANALYZE_FOOD — out of SQLi/CommandInjection scope)
**Confirmed Safe:** 32
**Design-Time SQLi Risk (not exploitable via current API):** 2 (getAllData, deleteData)

---

## 9. Conclusion

Injection analysis of the FAR-TA2 application identified **three externally exploitable Path Traversal vulnerabilities** suitable for immediate exploitation:

1. **INJ-VULN-01 (CRITICAL):** Direct arbitrary file write via the unauthenticated `UPLOAD_IMAGE` action. The `filename` and `folderType` POST body parameters are used in `path.join()` without sanitization, enabling `../` traversal. This is the highest-priority exploitation target.

2. **INJ-VULN-02 (HIGH):** Arbitrary file delete via the `deleteFile()` function, triggered by setting a path-traversal avatar URL on any user via the unauthenticated `UPSERT_USER` action. The `../assets/` prefix check is trivially bypassed.

3. **INJ-VULN-03 (MEDIUM):** SSRF via `new URL()` DNS resolution when an attacker-controlled avatar URL uses an `http://` or `https://` scheme.

No traditional SQL Injection or Command Injection was found to be externally exploitable via the current API. The application's widespread use of mysql2 prepared statement parameter binding is effective for data value slots. The primary risk is in filesystem operations (file upload/write/delete) which lack any path traversal defenses.

All three vulnerabilities are exploitable by any anonymous network caller reaching `http://host.docker.internal:5000/api` — no authentication, credentials, or prior access are required.

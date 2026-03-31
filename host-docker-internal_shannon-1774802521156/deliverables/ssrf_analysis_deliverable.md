# SSRF Analysis Report

## 1. Executive Summary

- **Analysis Status:** Complete
- **Key Outcome:** No exploitable server-side request forgery vulnerabilities were identified. The application does not make outbound HTTP requests to user-controlled URLs. The single URL-parsing operation found (`new URL()` in `fileService.js`) performs only synchronous URL parsing with zero network I/O; the parsed URL is never dereferenced into an actual HTTP request.
- **Purpose of this Document:** This report provides the strategic context on the application's outbound request mechanisms, validates secure patterns, and documents why the pre-reconnaissance SSRF flag was a false positive.

## 2. Methodology

- **Backward Taint Analysis** was applied to every SSRF sink reported in the pre-reconnaissance deliverable (Section 10 / Section 9.7).
- Every API action handler in `server/index.js` was traced for HTTP client usage.
- All URL constructors (`new URL()`) were analyzed for whether the result feeds into a network request.
- The complete data flow from user input to outbound request was mapped for each potential sink.

## 3. SSRF Sinks Analyzed

### 3.1 `fileService.js:deleteFile()` — `new URL(fileUrl)` Parsing

**Location:** `server/fileService.js`, lines 70–96

**Reconnaissance Classification:** SSRF — "DNS resolution occurs on attacker-controlled URL"

**Backward Taint Analysis:**
- **Sink:** `new URL(fileUrl)` — URL parsing only
- **Source:** `fileUrl` originates from `oldUser.avatar` (database) → populated via `UPSERT_USER` action where the `avatar` field is accepted from client data (`server/index.js:150`, `validColumns` include `'avatar'`)
- **Path:** User → `avatar` field in `UPSERT_USER` → stored in MySQL → on next avatar change → `deleteFile(oldUser.avatar)` → `new URL(oldUser.avatar)` → `pathname` extracted → validated against `startsWith('/assets/')` → local `fs.unlinkSync()`
- **Sanitization:** The `startsWith('/assets/')` check on the extracted pathname provides a defensive layer. If the avatar URL's pathname does not start with `/assets/`, the function returns early with no file operation.
- **Critical Finding:** `new URL()` in Node.js is a **synchronous URL parsing utility**. It performs zero network I/O — no DNS resolution, no TCP connection, no HTTP request. It only decomposes the URL string into its component parts (protocol, hostname, port, pathname, query, etc.). The URL object is immediately discarded after `pathname` extraction. **No HTTP request is made.**
- **Verdict:** Not vulnerable. The reconnaissance flagged this as "DNS resolution" — this is incorrect. URL parsing ≠ URL fetching.

---

### 3.2 `server/index.js` — Gemini AI API Call (`analyzeFood`)

**Location:** `server/index.js`, lines 75–77, 740–867

**Action:** `ANALYZE_FOOD`

**Backward Taint Analysis:**
- **Sink:** `ai.models.generateContent({...})` — outbound HTTPS request to `generativelanguage.googleapis.com`
- **Source:** `data.inputLabels[]`, `data.context` (foodName, ingredients, etc.), `data.imageBase64`
- **Path:** All user input is embedded as text content within the prompt structure. The SDK constructs a fixed endpoint URL internally; user input never reaches the URL path or hostname.
- **Sanitization:** N/A — user text input is sent as content data to Google's fixed API endpoint, not as URL manipulation.
- **Verdict:** Not vulnerable (SSRF). This is a legitimate outbound API call where user input is content/prompt data only, not URL manipulation.

---

### 3.3 `server/index.js` — `UPLOAD_IMAGE` Action

**Location:** `server/index.js`, lines 79–84

**Action:** `UPLOAD_IMAGE`

**Backward Taint Analysis:**
- **Sink:** `uploadToFileSystem(data.base64, data.filename, targetFolder)` — local filesystem write
- **Path:** User-supplied `base64`, `filename`, `folderType` → saved to `server/assets/` via `fs.writeFileSync()`. No outbound HTTP request.
- **Verdict:** Not SSRF. Local file operation only (path traversal risk exists but is out of SSRF scope).

---

### 3.4 Client-Side URL Fetching (Out of Scope for Server-Side SSRF)

The following outbound requests were identified but are client-side only — they originate from the React SPA running in the user's browser, not from the server:

| Location | Pattern | Risk |
|---|---|---|
| `view/profile/components/AddressList.tsx:68` | `fetch()` to OSM Nominatim reverse geocoding | Client-side only |
| `view/profile/components/AddressList.tsx:100` | `fetch()` to OSM Nominatim search | Client-side only |
| `utils/imageOptimizer.ts:10` | `new URL(url)` for Unsplash URL manipulation | Client-side only |
| `services/db.ts:14` | `fetch(API_URL)` to hardcoded `localhost:5000` | Client-side only |

None of these represent server-side request forgery risk.

## 4. Dominant Vulnerability Patterns

**No SSRF vulnerability patterns were identified.** The application does not construct outbound HTTP requests from user-controlled URLs at the server level.

The reconnaissance report's sole SSRF flag (`fileService.js:409-413`) was based on a misidentification:
- The reference `fileService.js:409-413` does not exist (the file has 99 lines total).
- `new URL()` is URL parsing, not URL fetching — it triggers zero network I/O in Node.js.
- No HTTP client library is invoked based on the parsed URL.

## 5. Strategic Intelligence for Exploitation

- **HTTP Client Library:** No generic HTTP client libraries (`axios`, `got`, `node-fetch`, etc.) are used in server-side request paths.
- **AI Integration:** `@google/genai` SDK is used for Gemini API calls — fixed endpoint, no URL injection.
- **Image Processing:** Sharp library processes locally-uploaded base64 image data only.
- **File Operations:** All file handling is local filesystem operations.
- **Network Architecture:** The Express server at port 5000 has no proxy, redirect, or webhook relay functionality.

## 6. Secure by Design: Validated Components

| Component/Flow | Endpoint/File Location | Defense Mechanism | Verdict |
|---|---|---|---|
| `deleteFile()` URL parsing | `server/fileService.js:70-96` | `new URL()` is synchronous parse-only; `startsWith('/assets/')` pathname check; no HTTP request made | SAFE |
| `analyzeFood()` Gemini API | `server/index.js:740-867` | User input is content data only; SDK uses fixed endpoint; no URL injection possible | SAFE |
| `UPLOAD_IMAGE` action | `server/index.js:79-84` | Saves to local filesystem only; no outbound HTTP | SAFE |
| Sharp image processing | `server/fileService.js:38-53` | Processes local base64 buffers only; no remote URL fetch | SAFE |
| `upsertUser()` avatar field | `server/index.js:150 | Avatar stored as string; consumed only by `deleteFile()` which does not fetch URLs | SAFE |

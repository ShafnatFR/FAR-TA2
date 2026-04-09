# Upgrade FAR PWA – Four Core Requirements

**File:** `implementation_plan.md`

---

## 1️⃣ Database & RBAC Refactor
- **Expand `users.role` ENUM** to six roles:
  - `individual_donor`
  - `corporate_donor`
  - `recipient`
  - `volunteer`
  - `admin`
  - `super_admin`
- **Add migration** (`ALTER TABLE …` or versioned `migrations/001_add_roles.sql`).
- **Update TypeScript types** in `FAR-TA2/types.ts`.
- **Adjust RBAC logic** in `FAR-TA2/App.tsx` and any auth middleware.

---

## 2️⃣ Stock‑Based Pickup Logic
- **Front‑end:** In the food‑item claim component, disable the "Volunteer Delivery" option when `stock < 5` and display a glass‑morphism modal with COD/WhatsApp instructions.
- **Back‑end:** In `server/index.js` → `processClaim`, reject claims with `deliveryMethod: 'volunteer'` if stock is below 5 and return a clear error JSON.
- **Service layer:** Propagate the error via `FAR-TA2/services/db.ts` for UI feedback.

---

## 3️⃣ Gemini AI for Corporate Donors
- **New service:** `services/aiCorporate.ts` exposing:
  - `generateRecipe`
  - `designPackaging`
  - `writeCSRCopy`
- **New endpoint:** `POST /api/ai/corporate` (or sub‑paths) in `server/index.js` with role check `req.user.role === 'corporate_donor'`.
- **Front‑end UI:** New `CorporateDonorDashboard.tsx` component with buttons/forms for each AI feature.

---

## 4️⃣ QR Scan & Gamified Points
- **Front‑end component:** `QRScanner.tsx` using the camera API, styled with glass‑morphism and subtle micro‑animations.
- **Back‑end:** Extend `verifyOrderQR` to call `addPoints(userId, QR_HANDOVER_POINTS)` after successful verification.
- **Points service:** `services/points.ts` with `addPoints` / `getUserPoints` helpers; add `points` column to `users` if missing.
- **Constants:** Add `QR_HANDOVER_POINTS = 50` (or user‑specified) in `constants.ts`.
- **UI feedback:** Animated confetti and point tally update after a successful hand‑over.

---

## 📋 Open Questions (User Review Required)
> **[!IMPORTANT]** Please confirm:
> - **Migration style:** Single script vs. versioned migrations?
> - **Point values:** Desired points for QR hand‑over?
> - **AI endpoint design:** Single endpoint with action parameter or separate sub‑paths?
> - **QR UI design preference:** Full‑screen scanner or modal overlay?

---

## ✅ Verification Plan
### Automated Tests
- Run migration on a fresh test DB; verify all six roles exist.
- Unit‑test RBAC routing for each role.
- Simulate claim with `stock = 3`; ensure back‑end rejects volunteer delivery and front‑end disables the button.
- Call corporate AI endpoint with corporate token (expect success) and with non‑corporate token (expect 403).
- Mock QR payload; verify `addPoints` updates DB and response includes new total.

### Manual Checks
- Local dev (`npm run dev`): log in as each role, test UI flows, watch point animation after QR scan.

---

*Once you approve the above decisions, I will create a `task.md` checklist and start implementation.*

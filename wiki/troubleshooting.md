# 🔧 Troubleshooting

Common issues encountered when developing or operating `job-admin`.

---

## 🌐 CORS errors against the backend API

**Symptom**: requests to `VITE_API_URL` fail in the browser console with `... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header...`, even though the request appears to reach the backend (visible in backend logs / Network tab shows the response).

**Causes & checks**:

1. **`VITE_API_URL` mismatch** — confirm `.env.local` points at the correct backend host/port and includes the `/api` suffix (see [environment.md](environment.md)). A trailing slash mismatch (`/api` vs `/api/`) is usually fine for Axios but double-check if the backend's CORS allowlist is doing exact-string matching on `Origin`.
2. **Backend CORS allowlist** — the backend (Phase 1, sibling repo) must explicitly allow the admin panel's origin (`http://localhost:5174` in dev, the production admin domain in prod). This is a backend-side config, not something fixable in `job-admin`.
3. **Preflight (`OPTIONS`) failures** — if you've added new custom headers to `api.js` interceptors, ensure the backend's CORS config allows those headers (`Access-Control-Allow-Headers`).
4. **Credentials** — if the backend ever moves to cookie-based auth (currently it's a Bearer token in `Authorization`, not cookies), `axios.create` would need `withCredentials: true` and the backend would need `Access-Control-Allow-Credentials: true` plus a non-wildcard `Access-Control-Allow-Origin`.

---

## 🔑 Auth token expiry / 401 handling

The Axios instance in `src/utils/api.js` has a response interceptor that automatically handles `401 Unauthorized`:

1. On a `401` from any endpoint **other than** `/auth/*`, and only if the request hasn't already been retried (`_retry` flag), it:
   - Reads `refreshToken` from the `hwa_admin_session` localStorage entry.
   - POSTs to `/auth/refresh` with `{ refreshToken }`.
   - On success: updates `hwa_admin_session` with the new `token`/`refreshToken`, retries the original request with the new `Authorization` header.
   - On failure (refresh itself returns an error): clears `hwa_admin_session` from `localStorage` and calls `window.location.reload()`, which causes `ProtectedRoute` to redirect to `/login` since `admin` will be `null`.

**Common symptoms & what they mean**:

- **Stuck on a blank/loading screen after a 401** — check whether `/auth/refresh` itself is returning a non-2xx (e.g. the refresh token is also expired/revoked). In that case the page should reload to `/login`; if it doesn't, check for a JS error thrown before `window.location.reload()` is reached.
- **"Logged out" immediately after login** — verify the backend's `/auth/login` response includes both `token` and `refreshToken` under `response.data.data`. `AuthContext.login` destructures exactly `{ user, token, refreshToken }`.
- **Repeated 401 loops** — the `_retry` flag should prevent infinite refresh loops for a *single* request, but if multiple requests are in-flight when the token expires, each will independently attempt a refresh. This isn't currently deduplicated. If you see a burst of `/auth/refresh` calls, this is the cause — not a bug introduced by recent changes, but worth keeping in mind if the backend rate-limits `/auth/refresh`.

**One-session-per-account**: per the backend's design (mirrors the FE job-tracker client), logging in on a second device/tab invalidates the first session's tokens. If an admin reports being unexpectedly logged out, check whether they (or someone with their credentials) logged in elsewhere.

---

## 📄 CSV import format issues (`MembersMgmt.jsx`)

The "Upload CSV" flow in `MembersMgmt.jsx` uses PapaParse with `header: true, skipEmptyLines: true`.

**Required columns**:
- `email` (or `Email`) — **required**. Rows without a resolvable email are dropped.
- `name` (or `Name`) — optional. If missing, falls back to the local-part of the email (`email.split('@')[0]`), or `"Unknown User"` if email is also missing (though such rows are dropped anyway).

**Common issues**:

- **"CSV is empty or format is invalid"** — PapaParse returned zero rows. Usually means the file has no header row, or the header row doesn't match what's expected (case-sensitive checks for `email`/`Email` and `name`/`Name` — other casings like `EMAIL` or `E-mail` won't match).
- **"Could not find a valid 'email' column"** — the header row parsed, but every row lacked an `email`/`Email` value. Check for typos in the header or stray BOM/encoding characters (e.g. a UTF-8 BOM at the start of the file can make the first header cell read as `"﻿email"` instead of `"email"`).
- **Non-`.csv` file rejected outright** — `parseFile` checks `file.name.endsWith('.csv')` before calling PapaParse. `.xlsx`/`.xls` files are not supported and will be rejected at this check, before PapaParse even runs.
- **Duplicate emails / existing members** — client-side parsing doesn't dedupe against existing members; the backend's `/batch-members` endpoint is responsible for handling duplicates (Phase 1, sibling repo). If an import "succeeds" but member counts don't change as expected, check the backend response/logs for per-row validation errors.

**Debugging tip**: the parsed (pre-submit) rows are shown in the modal's preview table before the user clicks "Import N Members" — if the preview looks wrong, the issue is in the CSV file itself or the column-matching logic in `parseFile`, not the API call.

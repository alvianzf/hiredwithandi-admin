# 🏗️ Architecture

The HiredWithAndi Admin Panel (`job-admin`) is a React 18 + Vite SPA. It is intentionally lightweight: there's no Redux/Zustand — global state is limited to authentication via `AuthContext`, and each page manages its own data fetching/local state.

## 📁 Project Structure

```text
src/
├── components/
│   ├── AdminLayout.jsx   # Sidebar + header shell, profile/password modal, dark mode toggle
│   ├── CustomSelect.jsx  # Theme-aware dropdown replacement for <select>
│   ├── Tooltip.jsx       # Portal-based hover tooltip
│   └── MemberRow.jsx     # Memoized <tr> for the Members table (see component_reference.md)
├── context/
│   └── AuthContext.jsx   # Session state, login/logout, profile updates
├── pages/
│   ├── Dashboard.jsx          # Org-admin analytics overview
│   ├── SuperDashboard.jsx     # Superadmin platform-wide overview
│   ├── MembersMgmt.jsx        # Org-admin member/batch management + CSV import
│   ├── MemberView.jsx         # Individual member profile + job tracker pipeline
│   ├── OrganizationsMgmt.jsx  # Superadmin: organizations + their batches/admins
│   ├── PlatformUsers.jsx      # Superadmin: global user registry across all orgs
│   ├── Login.jsx               # Auth gateway (login + first-time password setup)
│   └── NotFound.jsx            # 404 catch-all
├── utils/
│   └── api.js            # Centralized Axios instance + interceptors
├── App.jsx                # Routing (lazy-loaded routes) + ProtectedRoute
├── main.jsx               # Entry point — wraps App in BrowserRouter + AuthProvider
└── index.css              # Theme tokens (CSS custom properties), glassmorphism utilities
```

---

## 🔐 Authentication & State Management

`src/context/AuthContext.jsx` is the only global state provider. It exposes:

- `admin` — the current session object (`{ id, name, email, role, isSuperadmin, isDisabled, organization, token, refreshToken, ... }`), persisted to `localStorage` under `hwa_admin_session`.
- `login(email, password)` — POST `/auth/login`; rejects non-`ADMIN`/`SUPERADMIN` roles client-side.
- `checkEmail(email)` — POST `/auth/check-email`, used by `Login.jsx` to decide whether to show a password field or a "set up password" flow.
- `setupPassword(email, password)` — POST `/auth/setup-password`, for first-time admin password creation.
- `logout()` — clears session from state + `localStorage`.
- `updateProfile(formDataOrFields)` — PATCH `/profile`, supports `FormData` for avatar uploads.
- `loading` — true while the initial session check (from `localStorage`) runs.

`admin.isDisabled` is derived at login time from `user.isDisabled || user.status === 'DISABLED' || user.organization?.status === 'DISABLED'`. Pages use this flag to render a read-only banner (in `AdminLayout`) and hide mutation actions (e.g. Edit/Reset/Disable buttons in `MembersMgmt`).

Each page (`MembersMgmt`, `PlatformUsers`, `OrganizationsMgmt`, `Dashboard`) manages its own data fetching with `useState`/`useEffect`/`useCallback` — there is currently **no shared cross-page data cache** (members/batches/orgs are refetched per page). This is a known piece of deferred technical debt; see [performance.md](performance.md).

---

## 🌐 API Integration

All requests go through the centralized Axios instance in `src/utils/api.js`:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});
```

### Interceptors

- **Request**: reads `hwa_admin_session` from `localStorage` and attaches `Authorization: Bearer <token>` if present.
- **Response**: on a `401` (excluding `/auth/*` endpoints, and only once per request via `_retry`), attempts a token refresh via `POST /auth/refresh` using the stored `refreshToken`. On success, it retries the original request with the new token. On failure, it clears the session and reloads the page (forcing a redirect to `/login`).

See [troubleshooting.md](troubleshooting.md) for what this means in practice when debugging 401s/CORS.

---

## 🚦 Routing (`App.jsx`)

Routing uses `react-router-dom` v7 with **route-level code splitting** via `React.lazy` + a single `Suspense` boundary:

```javascript
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const MembersMgmt = React.lazy(() => import("./pages/MembersMgmt"));
const MemberView = React.lazy(() => import("./pages/MemberView"));
const Login = React.lazy(() => import("./pages/Login"));
const SuperDashboard = React.lazy(() => import("./pages/SuperDashboard"));
const OrganizationsMgmt = React.lazy(() => import("./pages/OrganizationsMgmt"));
const PlatformUsers = React.lazy(() => import("./pages/PlatformUsers"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
```

### Route table

| Path | Component | Access |
| :--- | :--- | :--- |
| `/login` | `Login` | Public |
| `/` | `DashboardRouter` → `SuperDashboard` or `Dashboard` | Protected, role-conditional |
| `/members` | `MembersMgmt` (or redirect to `/platform-users` for superadmins) | Protected, org admin |
| `/members/:id` | `MemberView` | Protected |
| `/organizations` | `OrganizationsMgmt` (else redirect to `/`) | Protected, superadmin only |
| `/platform-users` | `PlatformUsers` (else redirect to `/`) | Protected, superadmin only |
| `*` | `NotFound` | Public |

`ProtectedRoute` blocks rendering until `AuthContext.loading` resolves, then redirects to `/login` if `admin` is null. All protected routes render inside `AdminLayout`, which provides the sidebar/header chrome via an `<Outlet />`.

---

## 🧱 Layout Shell (`AdminLayout.jsx`)

`AdminLayout` wraps every authenticated page and provides:

- **Sidebar navigation** — role-conditional links (Superadmin: System Overview / Organizations / Platform Users; Org Admin: Dashboard / Members & Batches), collapsible via a hamburger toggle.
- **Header** — dark/light mode toggle (persists by adding/removing the `dark` class on `<html>`), and a profile menu.
- **Profile modal** — view-only name/email/role/org fields, avatar upload (`updateProfile` with `FormData`), and an inline password-change form (`POST /auth/change-password`).
- **Disabled-account banner** — shown when `admin.isDisabled` is true, informing the admin the view is read-only.

---

## 📦 Lazy Loading

Route-level code splitting is already in place (see above). [performance.md](performance.md) documents the additional **vendor chunk splitting** configured in `vite.config.js` (Phase 3 addition).

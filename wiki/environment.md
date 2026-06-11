# 🌱 Environment & Local Setup

## 📋 Requirements

- Node.js 20+ (the production deployment guide uses `nvm install 20`)
- npm

## 🔑 Environment Variables

There is currently **no `.env.example` file** in this repo. The single environment variable consumed by the app is:

| Variable | Used in | Default if unset | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `src/utils/api.js` (Axios `baseURL`), `src/components/AdminLayout.jsx` (avatar URL resolution) | `http://localhost:3000/api` | Base URL of the backend API |

To configure it locally, create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:3000/api
```

For production, this should point at the deployed backend's `/api` path, e.g.:

```env
VITE_API_URL=https://your-api-domain.com/api
```

> **Note**: `AdminLayout.jsx` strips a trailing `/api` (or `/api/`) from `VITE_API_URL` when constructing absolute avatar URLs (`avatarUrl.startsWith('/')` case), so `VITE_API_URL` should always include the `/api` suffix.

---

## 🖥️ Dev Server

Configured in `vite.config.js`:

```javascript
server: {
  port: 5174,
}
```

Run the dev server:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5174`.

---

## 🏗️ Build & Preview

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

`npm run build` runs `vite build`, which applies the vendor chunk splitting described in [performance.md](performance.md).

## 🧹 Linting

```bash
npm run lint       # eslint .
```

Note: there are some pre-existing lint findings in the codebase (mostly `react/prop-types` on components that don't declare PropTypes, e.g. `Tooltip.jsx`, and a couple of `no-unused-vars`). These are tracked as known issues and are not regressions — see [troubleshooting.md](troubleshooting.md) if you're trying to determine whether a lint error is new.

---

## 🔐 Default / Test Credentials

Per the project README, when pointed at a backend with seed data, the following mock credentials are available:

- **Org Admin**: `test@example.com` / `User#123`
- **Global Superadmin**: `superadmin@example.com` / `Superadmin#123`

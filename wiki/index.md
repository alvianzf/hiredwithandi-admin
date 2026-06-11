# 📖 HiredWithAndi Admin Wiki

Welcome to the official documentation for the **HiredWithAndi Admin Panel** (`job-admin`). This wiki provides in-depth technical details, architectural notes, and operational guidance for developers working on the organization-facing admin dashboard.

## 📂 Wiki Sections

| Section | Description |
| :--- | :--- |
| [🏗️ Architecture](architecture.md) | Project structure, routing, state management, and API integration. |
| [🌱 Environment](environment.md) | Required env vars, dev server config, and how to run/build the app. |
| [🧩 Component Reference](component_reference.md) | Shared UI primitives (`CustomSelect`, `Tooltip`, `AdminLayout`, `MemberRow`). |
| [⚡ Performance](performance.md) | Vendor chunk splitting, row memoization patterns, and dead-code removal notes. |
| [🚀 Deployment](deployment.md) | Ubuntu VPS deployment guide (Nginx + PM2). |
| [🔧 Troubleshooting](troubleshooting.md) | CORS, auth/401 handling, and CSV import issues. |

---

## 🚀 Quick Start

If you are new to the project, see [environment.md](environment.md) for setup instructions, then refer to [README.md](../README.md) for the broader product overview.

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite 5)
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7 (lazy-loaded routes)
- **Networking**: Axios with request/response interceptors
- **CSV Parsing**: PapaParse (batch member import)
- **Notifications**: Sonner
- **Dialogs**: SweetAlert2
- **State Management**: React Context API (`AuthContext`) + local component state

## 👥 Audience Roles

The admin panel serves two distinct roles:

- **Org Admin** (`ADMIN`): Manages members, batches, and views org-level analytics (`Dashboard`, `MembersMgmt`, `MemberView`).
- **Superadmin** (`SUPERADMIN`): Manages organizations and platform-wide users (`SuperDashboard`, `OrganizationsMgmt`, `PlatformUsers`). Superadmins do **not** have access to individual member job-tracker details.

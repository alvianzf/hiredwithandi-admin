# HiredWithAndi Admin Panel

![App Preview](https://via.placeholder.com/800x400.png?text=HiredWithAndi+Admin)

The **HiredWithAndi Admin Panel** is a React + Vite organization-oriented analytics dashboard built to complement the student-facing LearnWithAndi/HiredWithAndi ecosystem.

It is designed to give Bootcamps, Universities, and Organizational partners an aggregated view of how their students are performing on the job-hunting market, offering metrics on application velocity, job stage pipelines, and job fit alignment.

## Features

- **Multi-Tenant Architecture**: Login context specifically ties admins to their organization (e.g. _LearnWithAndi_, _Bootcamp B_) ensuring data privacy.
- **Global Superadmin Console**:
  - Manage all active organizations, including provisioning organizational administrators.
  - Traverse all platform users across all organizations and globally edit/disable accounts. _Note: Superadmins do not have access to view individual student tracker details._
  - View platform-wide statistics limited to _Total Active Organizations_ and _Total Platform Users_.
- **Analytics Dashboard**:
  - Summary views on _Total/Active Users_, and mock _Job Offers_.
  - Global average timeline aggregations showing the velocity of students moving from _Wishlist → Applied → Interviewing → Offered_.
  - Global **Job Fit Percentage** tracking (Median, Average, Highest/Lowest) across all students within the organization.
- **Student Management Console**:
  - Filterable directory of all student users inside the admin's organization.
  - CRUD operations: Edit user details, toggle account _Active/Disabled_ state, single-user creation forms.
  - **Batch CSV Upload** using `papaparse` for fast mass-onboarding.
- **Individual Student Drill-Down**:
  - View a recreation of the student's _Job Tracker Pipeline_ with full Kanban visualizations representing their job hunting status.
  - Instantly export their status reporting to **PDF** using `html2canvas` and `jsPDF`.
- **Dynamic Theming**: True dark/light mode toggle with state persistence built using Tailwind CSS v4 and vanilla custom CSS properties supporting an AdminLTE aesthetic layered with _Glassmorphism_.

## Tech Stack

- **React 18** (`react`, `react-dom`)
- **Vite.js** (Fast build tool and dev server)
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin for atomic styling)
- **React Router DOM** (SPA routing and `ProtectedRoute` mapping)
- **Papaparse** (Client-side CSV parsing)
- **jsPDF / html2canvas** (PDF generation of HTML objects)
- **React Icons** (Feather icons suite)
- **LocalStorage Data Persistence** (Simulated mocked database)

## Running the Application Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/alvianzf/hiredwithandi-admin.git
   cd hiredwithandi-admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The site defaults to `http://localhost:5173`.

4. **Login Instructions**
   Because this application relies on a Mock DB using `localStorage`, upon your first boot, an initialization script maps data to your browser. Use the default Mock Credentials:
   - **Org Admin:** `test@example.com` / `User#123`
   - **Global Superadmin:** `superadmin@example.com` / `Superadmin#123`

## Project Structure

```
src/
├── components/          # Reusable UI parts (e.g., AdminLayout, Sidebar)
├── context/             # Global Providers (AuthContext handling mock login/sessions)
├── pages/
│   ├── Dashboard.jsx        # Org-admin overview metrics
│   ├── Login.jsx            # Auth gateway
│   ├── OrganizationsMgmt.jsx # Superadmin tenant management
│   ├── PlatformUsers.jsx    # Superadmin global user registry
│   ├── StudentsMgmt.jsx     # Org-admin student data table & Modals
│   ├── StudentView.jsx      # Individual student profile & PDF Generator
│   ├── SuperDashboard.jsx   # Superadmin system overview
├── utils/
│   ├── MockData.js      # Data seed arrays (Admins, Organizations, Students)
├── App.jsx              # Main routing & protected route wrappers
├── main.jsx             # React entrypoint
└── index.css            # Global CSS, darkmode classes, and Glassmorphism utilities
```

## Contributing

Because the backend API is not yet attached, new data models should be prototyped inside `src/utils/MockData.js` returning to `localStorage` wrappers inside `loadStudents()` or similar functions.

_Ensure you use the default `learnwithandi` Yellow `#FFC107` and Red `#DC3545` hex codes for key visual elements!_

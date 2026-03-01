# HiredWithAndi Admin Panel

![CI/CD](https://github.com/alvianzf/hiredwithandi-admin/actions/workflows/ci-cd.yml/badge.svg)

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

---

## 🚀 Ubuntu VPS Setup Guide (Nginx + PM2)

This guide assumes a fresh Ubuntu 22.04/24.04 LTS server.

### 1. System Update & Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

### 2. Node.js Installation (nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 3. Application Deployment

```bash
git clone https://github.com/alvianzf/hiredwithandi-admin.git
cd hiredwithandi-admin
npm install
```

Create `.env.local` file:

```bash
nano .env.local
```

Add your production API URL:

```env
VITE_API_URL=https://your-api-domain.com/api
```

### 4. Build for Production

```bash
npm run build
```

### 5. Serving with PM2

We use PM2 to serve the static files:

```bash
npm install -g pm2
pm2 serve dist 5174 --name hwa-admin --spa
pm2 save
pm2 startup
```

### 6. Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/hwa-admin
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your_admin_domain_or_ip;

    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/hwa-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

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

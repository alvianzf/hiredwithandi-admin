# 🚀 Deployment

`job-admin` is a static SPA built with Vite. The documented deployment target is an **Ubuntu VPS using PM2 + Nginx**, matching the convention used for the sibling FE repo.

## 🏗️ Build

```bash
npm install
npm run build
```

This generates a static `dist/` folder. With the [Phase 3 `manualChunks` config](performance.md#1-vendor-chunk-splitting-viteconfigjs), `dist/assets/` will contain `vendor-react-*.js`, `vendor-papaparse-*.js`, `vendor-icons-*.js`, `vendor-*.js`, plus per-route chunks (`Dashboard-*.js`, `MembersMgmt-*.js`, `MemberView-*.js`, etc.).

---

## 🖥️ Ubuntu VPS Setup (Nginx + PM2)

This guide assumes a fresh Ubuntu 22.04/24.04 LTS server.

### 1. System update & dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

### 2. Node.js installation (nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 3. Application deployment

```bash
git clone https://github.com/alvianzf/hiredwithandi-admin.git
cd hiredwithandi-admin
npm install
```

Create `.env.local` with the production API URL (see [environment.md](environment.md)):

```bash
nano .env.local
```

```env
VITE_API_URL=https://your-api-domain.com/api
```

### 4. Build for production

```bash
npm run build
```

### 5. Serve with PM2

```bash
npm install -g pm2
pm2 serve dist 5174 --name hwa-admin --spa
pm2 save
pm2 startup
```

The `--spa` flag ensures all unmatched routes fall back to `index.html`, which is required for `react-router-dom` client-side routing (e.g. direct navigation to `/members/:id`).

### 6. Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/hwa-admin
```

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

For HTTPS, use Certbot (`sudo apt install certbot python3-certbot-nginx`) to provision a TLS certificate against `server_name`.

---

## 🔄 Redeploying after changes

```bash
git pull
npm install   # only needed if package.json/package-lock.json changed
npm run build
pm2 restart hwa-admin
```

Since `pm2 serve dist ...` serves the static `dist/` folder by reference, a fresh `npm run build` followed by `pm2 restart hwa-admin` (or just letting PM2 keep serving — static files are picked up immediately, but a restart clears any in-memory cache) is sufficient. No database migrations are involved on the frontend side.

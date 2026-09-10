# 🚀 Self-Hosting Guide for CRR (Conference Research Repository)

This document provides a step-by-step guide to deploying and hosting the CRR application on your own Linux server (Ubuntu/Debian, VPS, or dedicated server).

---

## 🛠 Option 1: Docker & Docker Compose (Recommended)

Docker packages MongoDB, the Node.js Express backend, and the Nginx-served React frontend into isolated, production-optimized containers.

### 1. Prerequisites on the Server
Install Docker and Docker Compose on your server:
```bash
# Update and install Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Log out and log back in or run:
newgrp docker
```

### 2. Clone/Upload Your Project Files
Upload your project files to the server (e.g. `/opt/crr` or `~/crr`):
```bash
cd /opt/crr
```

### 3. Configure Environment Variables
Create your production `.env` file from the template:
```bash
cp .env.example .env
nano .env
```
Key settings to customize in `.env`:
- `JWT_SECRET`: A long random string (e.g. `openssl rand -hex 32`)
- `MONGO_INITDB_ROOT_PASSWORD`: A secure password for MongoDB
- `CLIENT_URL`: `https://yourdomain.com` (or `http://YOUR_SERVER_IP`)
- `HTTP_PORT`: `80` (or `8080` if placing behind a host reverse proxy)

### 4. Build and Start the Containers
```bash
# Build and run in detached mode
docker compose up -d --build

# Check status
docker compose ps

# View real-time logs
docker compose logs -f
```

### 5. Seed Initial Admin Account
Once the containers are running:
```bash
docker compose exec backend node scripts/seedAdmin.js
```

---

## 🖥 Option 2: Traditional VPS Setup (PM2 + Nginx + MongoDB)

If you prefer running services directly on the host without Docker:

### 1. Install Node.js 20+, MongoDB, PM2, and Nginx
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2 process manager
sudo npm install -g pm2

# Install MongoDB
sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Configure & Build Backend
```bash
cd backend
npm ci --production
cp .env .env.production
nano .env.production  # Set MONGO_URI, JWT_SECRET, CLIENT_URL, etc.

# Seed admin
node scripts/seedAdmin.js

# Start backend using PM2
pm2 start server.js --name "crr-backend"
pm2 save
pm2 startup
```

### 3. Build Frontend Static Assets
```bash
cd ../frontend
npm ci
npm run build
```
The compiled files will be located in `frontend/dist/`.

### 4. Configure Nginx
Create `/etc/nginx/sites-available/crr`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend Static Files
    location / {
        root /opt/crr/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Dynamic XML Sitemap
    location = /sitemap.xml {
        proxy_pass http://localhost:5000/sitemap.xml;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
    }

    # Uploads (PDFs & Documents)
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & test config:
```bash
sudo ln -s /etc/nginx/sites-available/crr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Free HTTPS SSL Certificate (Certbot)

To secure your server with Let's Encrypt SSL:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will configure automatic SSL renewal cron jobs.

---

## 💾 Backups and Data Retention

### 1. MongoDB Database Backup
```bash
# Docker setup
docker compose exec mongodb mongodump --archive=/data/db/backup_$(date +%F).archive --db crr_db

# Direct VPS setup
mongodump --db crr_db --out /var/backups/crr_db_$(date +%F)
```

### 2. User Uploaded Files Backup
Ensure you back up the `backend/uploads` directory regularly (e.g. with `rsync` or AWS S3 / cron script).

---

## 🛡️ Production Security Checklist
- [ ] Set `JWT_SECRET` to a strong 64-character random string.
- [ ] Restrict open ports with `ufw` (`sudo ufw allow 22`, `sudo ufw allow 80`, `sudo ufw allow 443`, `sudo ufw enable`).
- [ ] Configure `CLIENT_URL` in `backend/.env` with your actual HTTPS domain.
- [ ] Set up automated cron backups for MongoDB and PDF uploads.

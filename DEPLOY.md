# Deploy to VPS (Ubuntu) — adspark.indicrm.io

This app runs in Docker and uses your **existing remote PostgreSQL** (no Postgres container). Nginx on the VPS will reverse-proxy the domain to the app.

---

## 1. Prerequisites on the VPS

- Ubuntu server with Docker and (optionally) Docker Compose
- Nginx installed
- Domain **adspark.indicrm.io** pointing to the VPS public IP (A record)

### Install Docker (if not already installed)

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in (or new shell) so docker runs without sudo
```

---

## 2. Deploy the app

### Option A: Build and run on the VPS

```bash
# Create app directory
sudo mkdir -p /var/www/adspark && sudo chown $USER:$USER /var/www/adspark
cd /var/www/adspark

# Clone your repo (or upload project files)
git clone <your-repo-url> .
# Or: copy files via scp/rsync from your machine

# Create production env file (use your real values)
nano .env.production
```

Put this in `.env.production` (replace with your real values):

```env
# Remote PostgreSQL
POSTGRES_HOST=31.97.60.84
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=postgres

# Login
LOGIN_USERNAME=admin
LOGIN_PASSWORD=your_secure_password
SESSION_SECRET=your_long_random_session_secret
```

Then build and run:

```bash
docker build -t adspark-app .
docker run -d \
  --name adspark \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  adspark-app
```

### Option B: Using Docker Compose

```bash
cd /var/www/adspark
# Ensure .env.production exists (same content as above)
docker compose --env-file .env.production up -d --build
```

---

## 3. Nginx configuration for adspark.indicrm.io

Create a site config and enable it:

```bash
sudo nano /etc/nginx/sites-available/adspark.indicrm.io
```

Paste (adjust `server_name` if needed):

```nginx
server {
    listen 80;
    server_name adspark.indicrm.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/adspark.indicrm.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. HTTPS with Let's Encrypt (recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d adspark.indicrm.io
```

Follow the prompts. Certbot will adjust the Nginx config for HTTPS and auto-renewal.

---

## 5. Useful commands

| Task | Command |
|------|--------|
| View logs | `docker logs -f adspark` (or `docker compose logs -f app`) |
| Restart app | `docker restart adspark` |
| Rebuild and run (Option A) | `docker build -t adspark-app . && docker stop adspark && docker rm adspark && docker run -d --name adspark --restart unless-stopped -p 3000:3000 --env-file .env.production adspark-app` |
| Rebuild and run (Option B) | `docker compose --env-file .env.production up -d --build` |
| Stop app | `docker stop adspark` or `docker compose down` |

---

## 6. Checklist

- [ ] **DNS**: `adspark.indicrm.io` A record points to the VPS IP
- [ ] **.env.production** on the server has correct Postgres and login vars
- [ ] Container is running: `docker ps` shows `adspark` (or compose service)
- [ ] Nginx is enabled and reloaded; `curl -I http://adspark.indicrm.io` returns 200 or 302
- [ ] HTTPS: certbot run for `adspark.indicrm.io`

After that, open **https://adspark.indicrm.io** (or http if you skipped certbot) and you should see the login page.

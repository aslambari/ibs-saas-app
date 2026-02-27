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

Put this in `.env.production` (replace with your real values). If the password has special characters (`#`, spaces, `"`, `$`), wrap the value in double quotes, e.g. `POSTGRES_PASSWORD="Ciitdc#123"`:

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
  -p 3011:3011 \
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

Paste (or copy from the repo file `nginx-adspark.conf`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name adspark.indicrm.io;

    location / {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

**Important:** Do **not** add a `root` or `index` directive in this server block. This vhost should only proxy; a `root` can cause 403 Forbidden.

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
| Rebuild and run (Option A) | `docker build -t adspark-app . && docker stop adspark && docker rm adspark && docker run -d --name adspark --restart unless-stopped -p 3011:3011 --env-file .env.production adspark-app` |
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

---

## 7. Troubleshooting 403 Forbidden

If you see **403 Forbidden** (“You don't have permission…” / “ErrorDocument…”), the request is usually **not** reaching the Next.js app.

### Step 1: Confirm the app is running and listening

On the VPS:

```bash
docker ps
curl -sI http://127.0.0.1:3011
```

- `docker ps` should list the `adspark` (or `app`) container.
- `curl` should return `HTTP/1.1 302` or `200` (redirect to login or the app). If you see `Connection refused`, the app is not listening on 3011 — fix Docker first (rebuild/run, check `docker logs adspark`).

### Step 2: Check which web server is handling the domain

The “ErrorDocument” wording often comes from **Apache**. Check what is bound to port 80/443:

```bash
sudo ss -tlnp | grep -E ':80|:443'
# or
sudo netstat -tlnp | grep -E ':80|:443'
```

- If **Apache** (httpd/apache2) is listening on 80/443, the domain may be served by Apache, not Nginx. Either:
  - Disable Apache and use only Nginx for this VPS, or
  - Configure Apache as the reverse proxy to `http://127.0.0.1:3011` for `adspark.indicrm.io` (virtual host with `ProxyPass` / `ProxyPassReverse`).

### Step 3: Fix Nginx config (if Nginx is the one in front)

- Remove any `root` or `index` from the `adspark.indicrm.io` server block; this block should **only** proxy.
- Ensure the config is enabled and no typo in `server_name`:

```bash
sudo ln -sf /etc/nginx/sites-available/adspark.indicrm.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

- If you have a **default** server that uses `root` and has strict permissions, requests might hit it and return 403. Make sure `adspark.indicrm.io` resolves to this server block (correct `server_name`) and that this config is loaded (e.g. in `sites-enabled`).

### Step 4: Test from the server

```bash
curl -sI -H "Host: adspark.indicrm.io" http://127.0.0.1/
```

If this returns 403, the problem is Nginx (or Apache) config. If it returns 302/200, the proxy is OK and the issue may be DNS or HTTPS/cache — try in a private window or another device.

---

## 8. Troubleshooting PostgreSQL “password authentication failed”

If the app returns `{"error":"password authentication failed for user \"postgres\""}` on the server but works locally, check the following.

### 1. Ensure the container gets the env file

Run from the **same directory** that contains `.env.production`:

```bash
cd /var/www/adspark
docker run -d --name adspark --restart unless-stopped -p 3011:3011 --env-file .env.production adspark-app
```

With Docker Compose, also run from the app directory:

```bash
cd /var/www/adspark
docker compose --env-file .env.production up -d --build
```

Verify variables are inside the container (password will be visible; use only on a trusted server):

```bash
docker exec adspark env | grep POSTGRES
```

You should see `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc. If any are missing, fix the path to `--env-file` or the contents of `.env.production`.

### 2. Password with special characters

If the Postgres password contains `#`, spaces, quotes, or `$`, the value in `.env.production` can be misread. Use **double quotes** around the value and escape any `"` inside with `\"`:

```env
POSTGRES_PASSWORD="Ciitdc#123"
```

Or, if the password has double quotes:

```env
POSTGRES_PASSWORD="pass\"word"
```

No spaces around `=`. After editing, recreate the container so it picks up the new env.

### 3. Allow the VPS IP on the Postgres server

The database at `POSTGRES_HOST` must allow connections from your **VPS IP**. If it only allows your office/home IP, you’ll get auth or connection errors from the server.

- **Firewall:** On the machine that runs Postgres, open port 5432 for the VPS IP (or for the whole subnet if acceptable).
- **Postgres `pg_hba.conf`:** Add a line so the VPS can connect, for example:

  ```
  host    postgres    postgres    <VPS_IP>/32    md5
  ```

  Or for any IP (less secure):

  ```
  host    all    all    0.0.0.0/0    md5
  ```

  Reload Postgres after changing `pg_hba.conf` (e.g. `sudo systemctl reload postgresql`).

- **Postgres `listen_addresses`:** Ensure it’s not only `localhost` (e.g. `listen_addresses = '*'` or the DB server’s LAN IP).

Then test from the VPS:

```bash
docker exec -it adspark sh -c 'apk add --no-cache postgresql-client 2>/dev/null; PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1"'
```

If this fails, the problem is network or Postgres config on the DB server, not the app.

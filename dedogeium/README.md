# Dedogeium Server

This folder contains a small Node/Express server used to centralize Dedogeium player data for admin viewing.

Quick start (local):

1. Open a PowerShell terminal in this folder.
2. Install dependencies:

```powershell
npm install
```

3. Run the server:

```powershell
npm start
```

The server listens on `PORT` (default `3000`) and stores data in `DATA_DIR` (default `%PROGRAMDATA%\dedogeium_server_data`).

Configuration:
- The browser now prefers the same origin you opened the page from, then falls back to a saved server URL if needed.
- You can set environment variables in a `.env` or system env: `PORT` and `DATA_DIR`.
- To hard-code one default public server for the site, set `window.DEDOGEIUM_DEFAULT_SERVER_URL` in `server_defaults.js`.
- Example: `window.DEDOGEIUM_DEFAULT_SERVER_URL = "https://your-domain.com/dedogeium";`
- Cloudflare Quick Tunnel URLs are temporary. If you want one constant public URL, use a hosted server, a reverse proxy on your own domain, or a named Cloudflare Tunnel.

Caddy reverse proxy:

- A ready-to-use `Caddyfile` is included for `api.ryancherches.com`.
- It proxies all requests on that subdomain to the local Node backend at `127.0.0.1:3000`.
- This is the recommended setup when `ryancherches.com` itself stays on GitHub Pages for the static site.
- Install Caddy, then run `install_caddy_service.ps1` from an Administrator PowerShell.
- After Caddy starts, verify:
  - `https://api.ryancherches.com/api/health`
  - `https://api.ryancherches.com/api/arena/discover`

Arena combat:

- Start the Dedogeium server on one machine in the local network with `npm start`.
- Each player should log in, open `/arena/`, and press `Search LAN Players`.
- Active players will appear in the arena list, where they can challenge each other and fight in a turn-based PvP match.
- For free cross-network play, the easiest option is to open Dedogeium through a free Tailscale address or another tunnel/public URL. When the arena page is opened from that address, it will automatically try to use the same server.

Free Cloudflare Quick Tunnel:

- Start Dedogeium with `npm start`.
- In a second terminal, run `npm run tunnel:quick`.
- The script will create a temporary public `trycloudflare.com` link that forwards to your local Dedogeium server.
- The tunnel script will print a clear `Arena URL` line that you can copy and share.
- Share that public link with other players and have them open `/arena/` from the same address.
- Keep both terminals open while you play. The Quick Tunnel is temporary and meant for testing.

One-command public arena shortcut:

- Run `npm run arena:public`.
- This shortcut starts Dedogeium on port `3000` if it is not already running, then opens a Cloudflare Quick Tunnel for it.
- It prints the public Dedogeium URL and the exact `Arena URL` to share.
- When you stop the tunnel with `Ctrl+C`, the shortcut also stops the Dedogeium server if it started it for you.

Optional Basic auth:

- To require a username/password for the admin endpoints, set `ADMIN_USER` and `ADMIN_PASS` as environment variables for the server process. Example (PowerShell):

```powershell
$env:ADMIN_USER = 'admin'
$env:ADMIN_PASS = 's3cret'
npm start
```

When set, clients must send HTTP Basic auth (username:password) to access `/api/players`, `/api/player`, and `/api/merge`. Health check `/api/health` remains public.

Install as Windows service (one option):
 - Run `install_service.ps1` from this folder in an elevated PowerShell. The script will try to use `nssm` if present, otherwise falls back to `sc.exe`.

Docker:

Build and run with Docker (optional):

```bash
docker build -t dedogeium .
docker compose up -d
```

Data volume:

- The container stores persistent data under the container path `/data` which is mapped to the host `./data` by the provided `docker-compose.yml`.
- Make sure the `./data` folder exists and is writable by Docker. The server will create `players.json` inside that directory.

Health check:

- The image includes a Docker `HEALTHCHECK` that queries `/api/health`. Docker Compose also defines a service healthcheck and a `restart: unless-stopped` policy to keep the service running.
- You can view container health with:

```bash
docker ps
```

and inspect health details with:

```bash
docker inspect --format='{{json .State.Health}}' <container-id>
```

Backups:

Use the provided `backup_players.ps1` to snapshot the `players.json` file into `backups/` with a timestamp.

Security note:
 - This scaffold is intentionally minimal. Do not expose the server publicly without adding authentication, HTTPS, and proper rate-limiting.

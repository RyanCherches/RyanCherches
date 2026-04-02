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
- Edit `server_config.js` on each client to point `window.SERVER_URL` to `http://<server-ip>:3000`.
- You can set environment variables in a `.env` or system env: `PORT` and `DATA_DIR`.

LAN combat arena:

- Start the Dedogeium server on one machine in the local network with `npm start`.
- Edit `server_config.js` on every client so `window.SERVER_URL` points to that machine, for example `http://192.168.1.100:3000`.
- Each player should log in, open `/arena/`, and press `Search LAN Players`.
- Active players will appear in the arena list, where they can challenge each other and fight in a turn-based PvP match.

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

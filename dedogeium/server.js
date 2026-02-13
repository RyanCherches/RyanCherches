const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
// Store server data in a machine-wide location so all local accounts share it.
const PROGRAM_DATA = process.env.PROGRAMDATA || (process.platform === 'win32' ? 'C:\\ProgramData' : '/var/local');
const DATA_DIR = path.join(PROGRAM_DATA, 'dedogeium_server_data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Optional Basic auth: set ADMIN_USER and ADMIN_PASS env vars to enable.
const ADMIN_USER = process.env.ADMIN_USER || null;
const ADMIN_PASS = process.env.ADMIN_PASS || null;

function requireAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASS) return next(); // auth disabled
  const auth = req.headers['authorization'];
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Dedogeium"');
    return res.status(401).json({ error: 'Authorization required' });
  }
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return res.status(400).json({ error: 'Bad Authorization header' });
  let creds;
  try {
    creds = Buffer.from(parts[1], 'base64').toString('utf8');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid auth encoding' });
  }
  const idx = creds.indexOf(':');
  if (idx < 0) return res.status(400).json({ error: 'Invalid auth format' });
  const user = creds.slice(0, idx);
  const pass = creds.slice(idx + 1);
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Dedogeium"');
  return res.status(401).json({ error: 'Invalid credentials' });
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, JSON.stringify({}), 'utf8');

function readPlayers() {
  try {
    const raw = fs.readFileSync(PLAYERS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) { return {}; }
}

function writePlayers(obj) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

app.get('/api/players', requireAuth, (req, res) => {
  res.json(readPlayers());
});

app.post('/api/player', requireAuth, (req, res) => {
  const { username, player } = req.body || {};
  if (!username || !player) return res.status(400).json({ error: 'username and player required' });
  const name = String(username).trim().toLowerCase();
  const players = readPlayers();
  const np = player || {};
  const ep = players[name] || { firstSeen: null, lastSeen: null, visits: 0, inventory: [] };

  ep.firstSeen = ep.firstSeen ? Math.min(ep.firstSeen, np.firstSeen || ep.firstSeen) : (np.firstSeen || ep.firstSeen);
  ep.lastSeen = ep.lastSeen ? Math.max(ep.lastSeen, np.lastSeen || ep.lastSeen) : (np.lastSeen || ep.lastSeen);
  ep.visits = (ep.visits || 0) + (np.visits || 0);
  if (!ep.password && np.password) ep.password = np.password;

  const existingInv = ep.inventory || [];
  const newInv = np.inventory || [];
  const map = {};
  existingInv.concat(newInv).forEach(it => { if (it && it.id) map[it.id] = it; });
  ep.inventory = Object.values(map);

  players[name] = ep;
  writePlayers(players);
  res.json({ ok: true, player: ep });
});

app.post('/api/merge', requireAuth, (req, res) => {
  const payload = req.body || {};
  const players = readPlayers();
  Object.keys(payload).forEach(name => {
    const np = payload[name] || {};
    const ep = players[name] || { firstSeen: null, lastSeen: null, visits: 0, inventory: [] };
    ep.firstSeen = ep.firstSeen ? Math.min(ep.firstSeen, np.firstSeen || ep.firstSeen) : (np.firstSeen || ep.firstSeen);
    ep.lastSeen = ep.lastSeen ? Math.max(ep.lastSeen, np.lastSeen || ep.lastSeen) : (np.lastSeen || ep.lastSeen);
    ep.visits = (ep.visits || 0) + (np.visits || 0);
    if (!ep.password && np.password) ep.password = np.password;
    const existingInv = ep.inventory || [];
    const newInv = np.inventory || [];
    const map = {};
    existingInv.concat(newInv).forEach(it => { if (it && it.id) map[it.id] = it; });
    ep.inventory = Object.values(map);
    players[name] = ep;
  });
  writePlayers(players);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }));

// Bind to all interfaces so other local user accounts and machines on the LAN can reach it.
app.listen(port, '0.0.0.0', () => console.log(`Dedogeium admin server running on http://0.0.0.0:${port} (data: ${PLAYERS_FILE})`));

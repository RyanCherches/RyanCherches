const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();

// Store server data in a machine-wide location so all local accounts share it.
const PROGRAM_DATA = process.env.PROGRAMDATA || (process.platform === 'win32' ? 'C:\\ProgramData' : '/var/local');
const DEFAULT_DATA_DIR = path.join(PROGRAM_DATA, 'dedogeium_server_data');
const LOCAL_FALLBACK_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = resolveWritableDataDir();
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const ARENA_FILE = path.join(DATA_DIR, 'arena.json');
const port = process.env.PORT || 3000;

const PRESENCE_TTL_MS = 30 * 1000;
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const RESOLVED_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MATCH_RETENTION_MS = 6 * 60 * 60 * 1000;

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

function resolveWritableDataDir() {
  const candidates = [];
  if (process.env.DATA_DIR) candidates.push(process.env.DATA_DIR);
  candidates.push(DEFAULT_DATA_DIR);
  candidates.push(LOCAL_FALLBACK_DATA_DIR);

  let lastError = null;
  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      const probeFile = path.join(candidate, '.dedogeium-write-test');
      fs.writeFileSync(probeFile, 'ok', 'utf8');
      fs.unlinkSync(probeFile);
      return candidate;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Could not find a writable data directory for Dedogeium.');
}

function getLanUrls(listenPort) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') return;
      urls.push(`http://${entry.address}:${listenPort}`);
    });
  });

  return Array.from(new Set(urls)).sort();
}

function requireAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASS) return next(); // auth disabled
  const auth = req.headers.authorization;
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

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, JSON.stringify({}), 'utf8');
  if (!fs.existsSync(ARENA_FILE)) {
    fs.writeFileSync(ARENA_FILE, JSON.stringify({ presence: {}, challenges: {}, matches: {} }, null, 2), 'utf8');
  }
}

function readPlayers() {
  try {
    const raw = fs.readFileSync(PLAYERS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writePlayers(obj) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function sanitizeProfile(profile, username) {
  const source = profile || {};
  const safeName = normalizeUsername(username || source.username || source.displayName || 'doge');
  const displayName = String(source.displayName || safeName || 'doge').slice(0, 32);
  const damage = Math.round(clampNumber(source.damage, 10, 600, 20));
  const maxHealth = Math.round(clampNumber(source.maxHealth, 100, 5000, 500));
  const avatar = typeof source.avatar === 'string' && source.avatar ? source.avatar : 'Im just a chill guy no background.png';
  const title = typeof source.title === 'string' && source.title ? source.title.slice(0, 64) : 'Arena Fighter';
  return {
    username: safeName,
    displayName,
    damage,
    maxHealth,
    avatar,
    title,
  };
}

function ensureArenaShape(state) {
  if (!state || typeof state !== 'object') return { presence: {}, challenges: {}, matches: {} };
  if (!state.presence || typeof state.presence !== 'object') state.presence = {};
  if (!state.challenges || typeof state.challenges !== 'object') state.challenges = {};
  if (!state.matches || typeof state.matches !== 'object') state.matches = {};
  return state;
}

function pruneArenaState(state) {
  const now = Date.now();
  const safeState = ensureArenaShape(state);

  Object.keys(safeState.presence).forEach((username) => {
    const entry = safeState.presence[username];
    if (!entry || !entry.lastSeen || now - entry.lastSeen > PRESENCE_TTL_MS) {
      delete safeState.presence[username];
    }
  });

  Object.keys(safeState.challenges).forEach((id) => {
    const challenge = safeState.challenges[id];
    if (!challenge) {
      delete safeState.challenges[id];
      return;
    }
    const age = now - (challenge.lastUpdated || challenge.createdAt || now);
    if (challenge.status === 'pending' && age > CHALLENGE_TTL_MS) {
      challenge.status = 'expired';
      challenge.lastUpdated = now;
    }
    if (challenge.status !== 'pending' && age > RESOLVED_CHALLENGE_TTL_MS) {
      delete safeState.challenges[id];
    }
  });

  Object.keys(safeState.matches).forEach((id) => {
    const match = safeState.matches[id];
    if (!match) {
      delete safeState.matches[id];
      return;
    }
    const age = now - (match.updatedAt || match.createdAt || now);
    if (age > MATCH_RETENTION_MS) {
      delete safeState.matches[id];
    }
  });

  return safeState;
}

function readArenaState() {
  try {
    const raw = fs.readFileSync(ARENA_FILE, 'utf8');
    return pruneArenaState(JSON.parse(raw || '{}'));
  } catch (e) {
    return pruneArenaState({ presence: {}, challenges: {}, matches: {} });
  }
}

function writeArenaState(state) {
  fs.writeFileSync(ARENA_FILE, JSON.stringify(pruneArenaState(state), null, 2), 'utf8');
}

function getPlayerChallengeStatus(state, viewer, opponent) {
  const challengeList = Object.values(state.challenges);
  const matchList = Object.values(state.matches);

  const activeMatch = matchList.find((match) => {
    if (!match || match.status !== 'active') return false;
    const usernames = [match.players.one.username, match.players.two.username];
    return usernames.includes(viewer) && usernames.includes(opponent);
  });
  if (activeMatch) return { type: 'in-match', matchId: activeMatch.id };

  const incoming = challengeList.find((challenge) => challenge && challenge.status === 'pending' && challenge.from === opponent && challenge.to === viewer);
  if (incoming) return { type: 'incoming-challenge', challengeId: incoming.id };

  const outgoing = challengeList.find((challenge) => challenge && challenge.status === 'pending' && challenge.from === viewer && challenge.to === opponent);
  if (outgoing) return { type: 'outgoing-challenge', challengeId: outgoing.id };

  return { type: 'ready', challengeId: null };
}

function publicPresence(entry, viewer, state) {
  const profile = sanitizeProfile(entry.profile, entry.username);
  const status = viewer ? getPlayerChallengeStatus(state, viewer, entry.username) : { type: 'ready', challengeId: null };
  return {
    username: entry.username,
    displayName: profile.displayName,
    lastSeen: entry.lastSeen,
    profile,
    status,
  };
}

function publicChallenge(challenge) {
  return {
    id: challenge.id,
    from: challenge.from,
    to: challenge.to,
    status: challenge.status,
    createdAt: challenge.createdAt,
    lastUpdated: challenge.lastUpdated,
    matchId: challenge.matchId || null,
    fromProfile: sanitizeProfile(challenge.fromProfile, challenge.from),
    toProfile: sanitizeProfile(challenge.toProfile, challenge.to),
  };
}

function publicMatch(match, viewer) {
  return {
    id: match.id,
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    startedAt: match.startedAt,
    currentTurn: match.currentTurn,
    winner: match.winner || null,
    players: match.players,
    canAttack: viewer ? match.status === 'active' && match.currentTurn === viewer : false,
    log: Array.isArray(match.log) ? match.log.slice(-12) : [],
  };
}

function buildArenaOverview(state, username) {
  const safeUser = normalizeUsername(username);
  const players = Object.values(state.presence)
    .filter((entry) => entry && entry.username !== safeUser)
    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
    .map((entry) => publicPresence(entry, safeUser, state));

  const incomingChallenges = Object.values(state.challenges)
    .filter((challenge) => challenge && challenge.status === 'pending' && challenge.to === safeUser)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(publicChallenge);

  const outgoingChallenges = Object.values(state.challenges)
    .filter((challenge) => challenge && challenge.status === 'pending' && challenge.from === safeUser)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(publicChallenge);

  const activeMatch = Object.values(state.matches)
    .filter((match) => match && match.status === 'active')
    .find((match) => match.players.one.username === safeUser || match.players.two.username === safeUser);

  const recentMatches = Object.values(state.matches)
    .filter((match) => match && match.status !== 'active' && (match.players.one.username === safeUser || match.players.two.username === safeUser))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 3)
    .map((match) => publicMatch(match, safeUser));

  return {
    self: state.presence[safeUser] ? publicPresence(state.presence[safeUser], safeUser, state) : null,
    players,
    incomingChallenges,
    outgoingChallenges,
    activeMatch: activeMatch ? publicMatch(activeMatch, safeUser) : null,
    recentMatches,
  };
}

function buildMatchPlayers(fromProfile, toProfile) {
  return {
    one: {
      username: fromProfile.username,
      displayName: fromProfile.displayName,
      avatar: fromProfile.avatar,
      title: fromProfile.title,
      damage: fromProfile.damage,
      maxHealth: fromProfile.maxHealth,
      currentHealth: fromProfile.maxHealth,
    },
    two: {
      username: toProfile.username,
      displayName: toProfile.displayName,
      avatar: toProfile.avatar,
      title: toProfile.title,
      damage: toProfile.damage,
      maxHealth: toProfile.maxHealth,
      currentHealth: toProfile.maxHealth,
    },
  };
}

function findActiveMatchForUsername(state, username) {
  return Object.values(state.matches).find((match) => {
    if (!match || match.status !== 'active') return false;
    return match.players.one.username === username || match.players.two.username === username;
  });
}

function rollAttackDamage(baseDamage) {
  const spread = Math.max(3, Math.round(baseDamage * 0.25));
  const variance = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  return Math.max(1, Math.round(baseDamage + variance));
}

function updatePresence(state, username, profile, req) {
  const safeUser = normalizeUsername(username);
  const nextProfile = sanitizeProfile(profile, safeUser);
  state.presence[safeUser] = {
    username: safeUser,
    profile: nextProfile,
    displayName: nextProfile.displayName,
    lastSeen: Date.now(),
    ip: req.ip,
  };
}

ensureDataFiles();

app.get('/api/players', requireAuth, (req, res) => {
  res.json(readPlayers());
});

app.post('/api/player', requireAuth, (req, res) => {
  const { username, player } = req.body || {};
  if (!username || !player) return res.status(400).json({ error: 'username and player required' });
  const name = normalizeUsername(username);
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
  existingInv.concat(newInv).forEach((it) => {
    if (it && it.id) map[it.id] = it;
  });
  ep.inventory = Object.values(map);

  players[name] = ep;
  writePlayers(players);
  res.json({ ok: true, player: ep });
});

app.post('/api/merge', requireAuth, (req, res) => {
  const payload = req.body || {};
  const players = readPlayers();
  Object.keys(payload).forEach((name) => {
    const np = payload[name] || {};
    const ep = players[name] || { firstSeen: null, lastSeen: null, visits: 0, inventory: [] };
    ep.firstSeen = ep.firstSeen ? Math.min(ep.firstSeen, np.firstSeen || ep.firstSeen) : (np.firstSeen || ep.firstSeen);
    ep.lastSeen = ep.lastSeen ? Math.max(ep.lastSeen, np.lastSeen || ep.lastSeen) : (np.lastSeen || ep.lastSeen);
    ep.visits = (ep.visits || 0) + (np.visits || 0);
    if (!ep.password && np.password) ep.password = np.password;
    const existingInv = ep.inventory || [];
    const newInv = np.inventory || [];
    const map = {};
    existingInv.concat(newInv).forEach((it) => {
      if (it && it.id) map[it.id] = it;
    });
    ep.inventory = Object.values(map);
    players[name] = ep;
  });
  writePlayers(players);
  res.json({ ok: true });
});

app.get('/api/arena/discover', (req, res) => {
  const state = readArenaState();
  writeArenaState(state);
  res.json({
    ok: true,
    serverName: os.hostname(),
    serverTime: Date.now(),
    playersOnline: Object.keys(state.presence).length,
  });
});

app.post('/api/arena/presence', (req, res) => {
  const { username, profile } = req.body || {};
  const safeUser = normalizeUsername(username);
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  updatePresence(state, safeUser, profile, req);
  writeArenaState(state);

  res.json({
    ok: true,
    server: {
      name: os.hostname(),
      now: Date.now(),
      playersOnline: Object.keys(state.presence).length,
    },
    ...buildArenaOverview(state, safeUser),
  });
});

app.get('/api/arena/state/:username', (req, res) => {
  const safeUser = normalizeUsername(req.params.username);
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  writeArenaState(state);
  res.json({
    ok: true,
    server: {
      name: os.hostname(),
      now: Date.now(),
      playersOnline: Object.keys(state.presence).length,
    },
    ...buildArenaOverview(state, safeUser),
  });
});

app.post('/api/arena/challenge', (req, res) => {
  const { from, to, profile } = req.body || {};
  const safeFrom = normalizeUsername(from);
  const safeTo = normalizeUsername(to);

  if (!safeFrom || !safeTo) return res.status(400).json({ error: 'from and to are required' });
  if (safeFrom === safeTo) return res.status(400).json({ error: 'You cannot challenge yourself' });

  const state = readArenaState();
  if (!state.presence[safeTo]) {
    return res.status(404).json({ error: 'Target player is not currently active on this LAN server' });
  }
  if (findActiveMatchForUsername(state, safeFrom) || findActiveMatchForUsername(state, safeTo)) {
    return res.status(400).json({ error: 'One of these players is already in an active match' });
  }

  updatePresence(state, safeFrom, profile, req);

  const existing = Object.values(state.challenges).find((challenge) => {
    if (!challenge || challenge.status !== 'pending') return false;
    const sameDirection = challenge.from === safeFrom && challenge.to === safeTo;
    const reversedDirection = challenge.from === safeTo && challenge.to === safeFrom;
    return sameDirection || reversedDirection;
  });

  if (existing) {
    writeArenaState(state);
    return res.json({ ok: true, reused: true, challenge: publicChallenge(existing) });
  }

  const fromProfile = sanitizeProfile(profile || state.presence[safeFrom]?.profile, safeFrom);
  const toProfile = sanitizeProfile(state.presence[safeTo].profile, safeTo);
  const challenge = {
    id: makeId('challenge'),
    from: safeFrom,
    to: safeTo,
    status: 'pending',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    fromProfile,
    toProfile,
    matchId: null,
  };

  state.challenges[challenge.id] = challenge;
  writeArenaState(state);
  res.json({ ok: true, challenge: publicChallenge(challenge) });
});

app.post('/api/arena/challenge/:id/respond', (req, res) => {
  const { username, accept, profile } = req.body || {};
  const safeUser = normalizeUsername(username);
  const challengeId = req.params.id;
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  const challenge = state.challenges[challengeId];
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge.to !== safeUser) return res.status(403).json({ error: 'Only the challenged player can respond' });
  if (challenge.status !== 'pending') return res.status(400).json({ error: 'Challenge is no longer pending' });

  updatePresence(state, safeUser, profile, req);
  if (findActiveMatchForUsername(state, challenge.from) || findActiveMatchForUsername(state, challenge.to)) {
    return res.status(400).json({ error: 'One of these players is already in an active match' });
  }

  if (!accept) {
    challenge.status = 'declined';
    challenge.lastUpdated = Date.now();
    writeArenaState(state);
    return res.json({ ok: true, challenge: publicChallenge(challenge) });
  }

  const fromProfile = sanitizeProfile(state.presence[challenge.from]?.profile || challenge.fromProfile, challenge.from);
  const toProfile = sanitizeProfile(profile || state.presence[challenge.to]?.profile || challenge.toProfile, challenge.to);
  const firstTurn = Math.random() < 0.5 ? fromProfile.username : toProfile.username;
  const match = {
    id: makeId('match'),
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startedAt: Date.now(),
    currentTurn: firstTurn,
    winner: null,
    players: buildMatchPlayers(fromProfile, toProfile),
    log: [
      {
        type: 'system',
        text: `${fromProfile.displayName} challenged ${toProfile.displayName}. Arena battle started.`,
        at: Date.now(),
      },
      {
        type: 'system',
        text: `${firstTurn === fromProfile.username ? fromProfile.displayName : toProfile.displayName} attacks first.`,
        at: Date.now(),
      },
    ],
  };

  challenge.status = 'accepted';
  challenge.lastUpdated = Date.now();
  challenge.matchId = match.id;
  challenge.toProfile = toProfile;

  state.matches[match.id] = match;
  writeArenaState(state);
  res.json({ ok: true, challenge: publicChallenge(challenge), match: publicMatch(match, safeUser) });
});

app.get('/api/arena/match/:id', (req, res) => {
  const match = readArenaState().matches[req.params.id];
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const viewer = normalizeUsername(req.query.username || '');
  res.json({ ok: true, match: publicMatch(match, viewer) });
});

app.post('/api/arena/match/:id/attack', (req, res) => {
  const { username } = req.body || {};
  const safeUser = normalizeUsername(username);
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  const match = state.matches[req.params.id];
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status !== 'active') return res.status(400).json({ error: 'Match is already over' });
  if (match.currentTurn !== safeUser) return res.status(400).json({ error: 'It is not your turn' });

  const attackerKey = match.players.one.username === safeUser ? 'one' : match.players.two.username === safeUser ? 'two' : null;
  if (!attackerKey) return res.status(403).json({ error: 'You are not part of this match' });
  const defenderKey = attackerKey === 'one' ? 'two' : 'one';
  const attacker = match.players[attackerKey];
  const defender = match.players[defenderKey];

  const damage = rollAttackDamage(attacker.damage);
  defender.currentHealth = Math.max(0, defender.currentHealth - damage);
  match.updatedAt = Date.now();
  match.log.push({
    type: 'attack',
    attacker: attacker.username,
    defender: defender.username,
    damage,
    text: `${attacker.displayName} hit ${defender.displayName} for ${damage}.`,
    at: match.updatedAt,
  });

  if (defender.currentHealth <= 0) {
    match.status = 'finished';
    match.winner = attacker.username;
    match.currentTurn = null;
    match.log.push({
      type: 'system',
      text: `${attacker.displayName} won the arena fight.`,
      at: match.updatedAt,
    });
  } else {
    match.currentTurn = defender.username;
  }

  writeArenaState(state);
  res.json({ ok: true, match: publicMatch(match, safeUser) });
});

app.post('/api/arena/match/:id/forfeit', (req, res) => {
  const { username } = req.body || {};
  const safeUser = normalizeUsername(username);
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  const match = state.matches[req.params.id];
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status !== 'active') return res.status(400).json({ error: 'Match is already over' });

  const playerOne = match.players.one.username;
  const playerTwo = match.players.two.username;
  if (safeUser !== playerOne && safeUser !== playerTwo) {
    return res.status(403).json({ error: 'You are not part of this match' });
  }

  const winner = safeUser === playerOne ? playerTwo : playerOne;
  const quitter = safeUser === playerOne ? match.players.one : match.players.two;
  const victor = winner === playerOne ? match.players.one : match.players.two;

  match.status = 'finished';
  match.winner = winner;
  match.currentTurn = null;
  match.updatedAt = Date.now();
  match.log.push({
    type: 'system',
    text: `${quitter.displayName} forfeited. ${victor.displayName} wins.`,
    at: match.updatedAt,
  });

  writeArenaState(state);
  res.json({ ok: true, match: publicMatch(match, safeUser) });
});

app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }));

app.use(express.static(__dirname));

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (!/^[A-Za-z0-9_-]+$/.test(page)) return next();

  const htmlFile = path.join(__dirname, `${page}.html`);
  if (!fs.existsSync(htmlFile)) return next();

  res.sendFile(htmlFile);
});

// Bind to all interfaces so other local user accounts and machines on the LAN can reach it.
app.listen(port, '0.0.0.0', () => {
  const lanUrls = getLanUrls(port);
  console.log(`Dedogeium server running on port ${port}`);
  console.log(`Local: http://127.0.0.1:${port}`);
  lanUrls.forEach((url) => console.log(`LAN:   ${url}`));
  console.log(`Arena: http://127.0.0.1:${port}/arena/`);
  if (lanUrls.length) {
    console.log(`Arena: ${lanUrls[0]}/arena/`);
  }
  console.log(`Data:  ${DATA_DIR}`);
});

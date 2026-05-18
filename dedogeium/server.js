const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();

// Store server data in a machine-wide location so all local accounts share it.
const PROGRAM_DATA = process.env.PROGRAMDATA || (process.platform === 'win32' ? 'C:\\ProgramData' : '/var/local');
const DEFAULT_DATA_DIR = path.join(PROGRAM_DATA, 'dedogeium_server_data');
const LOCAL_FALLBACK_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = resolveWritableDataDir();
const LEGACY_PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const ARENA_FILE = path.join(DATA_DIR, 'arena.json');
const DATABASE_FILE = path.join(DATA_DIR, 'dedogeium.sqlite');
const LEADERBOARD_SNAPSHOT_FILE = path.join(DATA_DIR, 'leaderboard.json');
const port = process.env.PORT || 3000;

const PRESENCE_TTL_MS = 30 * 1000;
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const RESOLVED_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MATCH_RETENTION_MS = 6 * 60 * 60 * 1000;
const SPECIAL_METER_MAX = 100;
const NORMAL_ATTACK_SPECIAL_GAIN = 25;
const PLAYER_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 4;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Optional Basic auth: set ADMIN_USER and ADMIN_PASS env vars to enable.
const ADMIN_USER = process.env.ADMIN_USER || null;
const ADMIN_PASS = process.env.ADMIN_PASS || null;

const db = openDatabase();
refreshLeaderboardSnapshot();

function resolveWritableDataDir() {
  const candidates = [];
  if (process.env.DATA_DIR) candidates.push(process.env.DATA_DIR);
  candidates.push(DEFAULT_DATA_DIR);
  candidates.push(LOCAL_FALLBACK_DATA_DIR);

  let lastError = null;
  for (const candidate of candidates) {
    let probeDatabase = null;
    try {
      fs.mkdirSync(candidate, { recursive: true });
      const probeFile = path.join(candidate, '.dedogeium-write-test');
      fs.writeFileSync(probeFile, 'ok', 'utf8');
      fs.unlinkSync(probeFile);
      probeDatabase = new DatabaseSync(path.join(candidate, 'dedogeium.sqlite'));
      probeDatabase.exec(`
        CREATE TABLE IF NOT EXISTS __write_probe (id INTEGER);
        INSERT INTO __write_probe DEFAULT VALUES;
        DELETE FROM __write_probe;
      `);
      probeDatabase.close();
      probeDatabase = null;
      return candidate;
    } catch (error) {
      lastError = error;
    } finally {
      if (probeDatabase) {
        try {
          probeDatabase.close();
        } catch (error) {
          lastError = error;
        }
      }
    }
  }

  throw lastError || new Error('Could not find a writable data directory for Dedogeium.');
}

function openDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new DatabaseSync(DATABASE_FILE);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT,
      password_salt TEXT,
      player_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_login_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_auth_tokens_username ON auth_tokens(username);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiry ON auth_tokens(expires_at);
  `);

  migrateLegacyPlayers(database);
  return database;
}

function migrateLegacyPlayers(database) {
  if (!fs.existsSync(LEGACY_PLAYERS_FILE)) return;

  let legacyPlayers;
  try {
    legacyPlayers = JSON.parse(fs.readFileSync(LEGACY_PLAYERS_FILE, 'utf8') || '{}');
  } catch (error) {
    return;
  }

  if (!legacyPlayers || typeof legacyPlayers !== 'object') return;

  const selectUser = database.prepare('SELECT username, password_hash, password_salt, player_json, created_at, updated_at, last_login_at FROM users WHERE username = ?');
  const insertUser = database.prepare(`
    INSERT INTO users (username, password_hash, password_salt, player_json, created_at, updated_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateUser = database.prepare(`
    UPDATE users
    SET password_hash = ?,
        password_salt = ?,
        player_json = ?,
        updated_at = ?,
        last_login_at = ?
    WHERE username = ?
  `);

  try {
    database.exec('BEGIN');
    Object.entries(legacyPlayers).forEach(([username, rawRecord]) => {
      const safeUsername = normalizeUsername(username);
      if (!safeUsername) return;

      const legacyRecord = rawRecord && typeof rawRecord === 'object' ? { ...rawRecord } : {};
      const legacyPassword = typeof legacyRecord.password === 'string' && legacyRecord.password
        ? legacyRecord.password
        : null;
      delete legacyRecord.password;

      const existingRow = selectUser.get(safeUsername);
      const mergedRecord = mergePlayerRecords(existingRow ? parsePlayerRecord(existingRow.player_json, safeUsername) : null, legacyRecord, safeUsername);
      const createdAt = Number(mergedRecord.firstSeen) || Number(legacyRecord.firstSeen) || Date.now();
      const updatedAt = Number(mergedRecord.lastSeen) || Number(legacyRecord.lastSeen) || Date.now();
      const loginAt = Number(existingRow && existingRow.last_login_at) || updatedAt;
      const currentHash = existingRow && existingRow.password_hash ? String(existingRow.password_hash) : null;
      const currentSalt = existingRow && existingRow.password_salt ? String(existingRow.password_salt) : null;
      let passwordHash = currentHash;
      let passwordSalt = currentSalt;

      if (!passwordHash && legacyPassword) {
        const hashed = hashPassword(legacyPassword);
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
      }

      if (existingRow) {
        updateUser.run(passwordHash, passwordSalt, JSON.stringify(mergedRecord), Date.now(), loginAt, safeUsername);
      } else {
        insertUser.run(safeUsername, passwordHash, passwordSalt, JSON.stringify(mergedRecord), createdAt, updatedAt, loginAt);
      }
    });
    database.exec('COMMIT');
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      // The original migration error is the useful one to surface.
    }
    throw error;
  }
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

function requireAdminAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASS) return next();
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
  } catch (error) {
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

function parseBearerToken(req) {
  const auth = String(req.headers.authorization || '');
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return '';
  return parts[1].trim();
}

function requirePlayerAuth(req, res, next) {
  pruneExpiredTokens();
  const token = parseBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Login required' });
  }
  const authRow = db.prepare('SELECT username, expires_at FROM auth_tokens WHERE token = ?').get(token);
  if (!authRow || Number(authRow.expires_at) <= Date.now()) {
    if (authRow) {
      db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
    }
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const userRow = getUserRow(authRow.username);
  if (!userRow) {
    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
    return res.status(401).json({ error: 'Account not found' });
  }

  req.player = {
    token,
    username: normalizeUsername(authRow.username),
    userRow,
  };
  next();
}

function ensureArenaFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ARENA_FILE)) {
    fs.writeFileSync(ARENA_FILE, JSON.stringify({ presence: {}, challenges: {}, matches: {} }, null, 2), 'utf8');
  }
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_-]{3,32}$/.test(username);
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function normalizePlayerTitle(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 64) : '';
}

function sanitizeProfile(profile, username) {
  const source = profile || {};
  const safeName = normalizeUsername(username || source.username || source.displayName || 'doge');
  const displayName = String(source.displayName || safeName || 'doge').slice(0, 32);
  const damage = Math.round(clampNumber(source.damage, 10, 600, 20));
  const maxHealth = Math.round(clampNumber(source.maxHealth, 100, 5000, 500));
  const avatar = typeof source.avatar === 'string' && source.avatar ? source.avatar : 'Im just a chill guy no background.png';
  const title = normalizePlayerTitle(source.title) || 'Arena Fighter';
  return {
    username: safeName,
    displayName,
    damage,
    maxHealth,
    avatar,
    title,
  };
}

function getDefaultLeaderboardDay() {
  return {
    peakAttack: 0,
    peakHealth: 0,
    victoriesPeople: 0,
    victoriesComputer: 0,
    timePlayedMs: 0,
  };
}

function getDefaultLeaderboardAllTime() {
  return {
    peakAttack: 0,
    peakHealth: 0,
    victoriesPeople: 0,
    victoriesComputer: 0,
    timePlayedMs: 0,
  };
}

function normalizeLeaderboardDay(rawDay) {
  const source = rawDay && typeof rawDay === 'object' ? rawDay : {};
  return {
    peakAttack: Math.max(0, Math.round(Number(source.peakAttack) || 0)),
    peakHealth: Math.max(0, Math.round(Number(source.peakHealth) || 0)),
    victoriesPeople: Math.max(0, Math.round(Number(source.victoriesPeople) || 0)),
    victoriesComputer: Math.max(0, Math.round(Number(source.victoriesComputer) || 0)),
    timePlayedMs: Math.max(0, Math.round(Number(source.timePlayedMs) || 0)),
  };
}

function normalizeLeaderboardAllTime(rawAllTime) {
  const source = rawAllTime && typeof rawAllTime === 'object' ? rawAllTime : {};
  return {
    peakAttack: Math.max(0, Math.round(Number(source.peakAttack) || 0)),
    peakHealth: Math.max(0, Math.round(Number(source.peakHealth) || 0)),
    victoriesPeople: Math.max(0, Math.round(Number(source.victoriesPeople) || 0)),
    victoriesComputer: Math.max(0, Math.round(Number(source.victoriesComputer) || 0)),
    timePlayedMs: Math.max(0, Math.round(Number(source.timePlayedMs) || 0)),
  };
}

function normalizeLeaderboardState(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const days = {};
  Object.entries(source.days && typeof source.days === 'object' ? source.days : {}).forEach(([dateKey, rawDay]) => {
    days[dateKey] = normalizeLeaderboardDay(rawDay);
  });
  return {
    days,
    allTime: normalizeLeaderboardAllTime(source.allTime),
    claimedRewards: source.claimedRewards && typeof source.claimedRewards === 'object' ? { ...source.claimedRewards } : {},
    updatedAt: Math.max(0, Math.round(Number(source.updatedAt) || 0)),
  };
}

function normalizeLeaderboardBan(rawBan) {
  if (!rawBan || typeof rawBan !== 'object') return null;
  const permanent = rawBan.permanent === true;
  const until = permanent ? null : Math.max(0, Math.round(Number(rawBan.until) || 0));
  const active = rawBan.active !== false && (permanent || until > 0);
  if (!active && !rawBan.reason && !rawBan.bannedAt) return null;
  return {
    active,
    permanent,
    until,
    reason: typeof rawBan.reason === 'string' ? rawBan.reason.slice(0, 160) : '',
    bannedAt: Math.max(0, Math.round(Number(rawBan.bannedAt) || 0)),
    bannedBy: typeof rawBan.bannedBy === 'string' ? rawBan.bannedBy.slice(0, 64) : 'admin',
  };
}

function isLeaderboardBanActive(rawBan, now = Date.now()) {
  const ban = normalizeLeaderboardBan(rawBan);
  if (!ban || ban.active === false) return false;
  return ban.permanent || (Number(ban.until) || 0) > now;
}

function createLeaderboardBan(options = {}) {
  const now = Date.now();
  const permanent = options.permanent === true;
  const durationMs = Math.max(0, Math.round(Number(options.durationMs) || 0));
  const requestedUntil = Math.max(0, Math.round(Number(options.until) || 0));
  const until = permanent ? null : (requestedUntil || (durationMs ? now + durationMs : 0));
  if (!permanent && (!until || until <= now)) {
    throw new Error('Temporary leaderboard bans need a future expiration time.');
  }
  return {
    active: true,
    permanent,
    until,
    reason: typeof options.reason === 'string' ? options.reason.trim().slice(0, 160) : '',
    bannedAt: now,
    bannedBy: typeof options.bannedBy === 'string' && options.bannedBy ? options.bannedBy.slice(0, 64) : 'admin',
  };
}

function normalizeProfileStats(rawProfile, username) {
  const source = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
  const safeUsername = normalizeUsername(username || source.username || source.displayName || 'doge');
  return {
    username: safeUsername,
    displayName: String(source.displayName || safeUsername || 'doge').slice(0, 32),
    title: normalizePlayerTitle(source.title),
    attack: Math.max(0, Math.round(Number(source.attack) || 0)),
    health: Math.max(0, Math.round(Number(source.health) || 0)),
    avatar: typeof source.avatar === 'string' ? source.avatar : '',
    updatedAt: Math.max(0, Math.round(Number(source.updatedAt) || 0)),
  };
}

function ensurePlayerRecordShape(rawRecord, username) {
  const source = rawRecord && typeof rawRecord === 'object' ? { ...rawRecord } : {};
  delete source.password;
  const safeUsername = normalizeUsername(username || source.username || (source.profileStats && source.profileStats.username) || '');
  const recordTitle = normalizePlayerTitle(source.title);
  const rawProfileStats = source.profileStats && typeof source.profileStats === 'object' ? source.profileStats : {};
  const profileStats = normalizeProfileStats({
    ...rawProfileStats,
    title: rawProfileStats.title || recordTitle,
  }, safeUsername);
  const resolvedTitle = recordTitle || profileStats.title;

  return {
    ...source,
    firstSeen: Number.isFinite(Number(source.firstSeen)) ? Number(source.firstSeen) : null,
    lastSeen: Number.isFinite(Number(source.lastSeen)) ? Number(source.lastSeen) : null,
    visits: Math.max(0, Math.round(Number(source.visits) || 0)),
    inventory: Array.isArray(source.inventory) ? source.inventory : [],
    title: resolvedTitle,
    profileStats: {
      ...profileStats,
      title: profileStats.title || resolvedTitle,
    },
    leaderboard: normalizeLeaderboardState(source.leaderboard),
    leaderboardBan: normalizeLeaderboardBan(source.leaderboardBan),
  };
}

function parsePlayerRecord(rawJson, username) {
  try {
    return ensurePlayerRecordShape(JSON.parse(rawJson || '{}'), username);
  } catch (error) {
    return ensurePlayerRecordShape({}, username);
  }
}

function getBasePlayerRecord() {
  return {
    firstSeen: null,
    lastSeen: null,
    visits: 0,
    inventory: [],
    profileStats: normalizeProfileStats({}, ''),
    leaderboard: normalizeLeaderboardState({}),
  };
}

function mergePlayerRecords(existingRecord, incomingRecord, username) {
  const safeUsername = normalizeUsername(username);
  const existing = ensurePlayerRecordShape(existingRecord || getBasePlayerRecord(), safeUsername);
  const incoming = incomingRecord && typeof incomingRecord === 'object' ? { ...incomingRecord } : {};
  delete incoming.password;
  delete incoming.leaderboardBan;

  const merged = ensurePlayerRecordShape(existing, safeUsername);
  merged.firstSeen = merged.firstSeen
    ? Math.min(merged.firstSeen, Number(incoming.firstSeen) || merged.firstSeen)
    : (Number(incoming.firstSeen) || merged.firstSeen);
  merged.lastSeen = merged.lastSeen
    ? Math.max(merged.lastSeen, Number(incoming.lastSeen) || merged.lastSeen)
    : (Number(incoming.lastSeen) || merged.lastSeen);
  merged.visits = Math.max(merged.visits || 0, Number(incoming.visits) || 0);

  const existingInv = Array.isArray(merged.inventory) ? merged.inventory : [];
  const newInv = Array.isArray(incoming.inventory) ? incoming.inventory : [];
  const inventoryById = {};
  existingInv.concat(newInv).forEach((item) => {
    if (item && item.id) inventoryById[item.id] = item;
  });
  merged.inventory = Object.values(inventoryById);

  if (incoming.profileStats && typeof incoming.profileStats === 'object') {
    const existingUpdated = Number(merged.profileStats && merged.profileStats.updatedAt) || 0;
    const incomingUpdated = Number(incoming.profileStats.updatedAt) || 0;
    if (!merged.profileStats || incomingUpdated >= existingUpdated) {
      merged.profileStats = normalizeProfileStats(incoming.profileStats, safeUsername);
    }
  }

  const incomingTitle = normalizePlayerTitle(incoming.title || (incoming.profileStats && incoming.profileStats.title));
  if (incomingTitle) {
    merged.title = incomingTitle;
    merged.profileStats = {
      ...normalizeProfileStats(merged.profileStats, safeUsername),
      title: incomingTitle,
    };
  }

  if (incoming.leaderboard && typeof incoming.leaderboard === 'object') {
    const existingUpdated = Number(merged.leaderboard && merged.leaderboard.updatedAt) || 0;
    const incomingUpdated = Number(incoming.leaderboard.updatedAt) || 0;
    if (!merged.leaderboard || incomingUpdated >= existingUpdated) {
      merged.leaderboard = normalizeLeaderboardState(incoming.leaderboard);
    }
  }

  return merged;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getArenaProfileStatsFromPlayer(player, username, now) {
  return normalizeProfileStats({
    username,
    displayName: player && player.displayName ? player.displayName : username,
    title: player && player.title ? player.title : 'Arena Fighter',
    attack: player && player.damage ? player.damage : 20,
    health: player && player.maxHealth ? player.maxHealth : 500,
    avatar: player && player.avatar ? player.avatar : 'Im just a chill guy no background.png',
    updatedAt: now,
  }, username);
}

function upsertUserRecord(username, record, options = {}) {
  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return null;

  const safeRecord = ensurePlayerRecordShape(record, safeUsername);
  const existing = getUserRow(safeUsername);
  const now = Date.now();
  if (existing) {
    db.prepare('UPDATE users SET player_json = ?, updated_at = ? WHERE username = ?')
      .run(JSON.stringify(safeRecord), now, safeUsername);
    refreshLeaderboardSnapshot();
    return safeRecord;
  }

  db.prepare(`
    INSERT INTO users (username, password_hash, password_salt, player_json, created_at, updated_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    safeUsername,
    options.passwordHash || null,
    options.passwordSalt || null,
    JSON.stringify(safeRecord),
    Number(safeRecord.firstSeen) || now,
    now,
    options.lastLoginAt || null,
  );
  refreshLeaderboardSnapshot();
  return safeRecord;
}

function recordArenaPvpVictory(username, arenaPlayer) {
  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return;

  const now = Date.now();
  const existing = getStoredPlayerRecord(safeUsername);
  const record = ensurePlayerRecordShape(existing || getBasePlayerRecord(), safeUsername);
  const dateKey = getLocalDateKey(new Date(now));
  const day = normalizeLeaderboardDay(record.leaderboard.days[dateKey]);
  const profileStats = getArenaProfileStatsFromPlayer(arenaPlayer, safeUsername, now);

  day.peakAttack = Math.max(day.peakAttack, profileStats.attack);
  day.peakHealth = Math.max(day.peakHealth, profileStats.health);
  day.victoriesPeople += 1;

  record.leaderboard.days[dateKey] = day;
  record.leaderboard.allTime.peakAttack = Math.max(record.leaderboard.allTime.peakAttack, profileStats.attack);
  record.leaderboard.allTime.peakHealth = Math.max(record.leaderboard.allTime.peakHealth, profileStats.health);
  record.leaderboard.allTime.victoriesPeople += 1;
  record.leaderboard.updatedAt = now;
  record.profileStats = profileStats;
  record.profileStats.updatedAt = now;
  record.firstSeen = record.firstSeen || now;
  record.lastSeen = now;
  record.visits = Math.max(1, Number(record.visits) || 0);

  upsertUserRecord(safeUsername, record);
}

function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(String(password), salt, PASSWORD_KEY_LENGTH);
  return {
    salt: salt.toString('hex'),
    hash: derivedKey.toString('hex'),
  };
}

function verifyPassword(password, saltHex, hashHex) {
  if (!saltHex || !hashHex) return false;
  const calculated = hashPassword(password, saltHex).hash;
  const left = Buffer.from(calculated, 'hex');
  const right = Buffer.from(hashHex, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createAuthToken(username) {
  pruneExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + PLAYER_TOKEN_TTL_MS;
  db.prepare('INSERT INTO auth_tokens (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    normalizeUsername(username),
    now,
    expiresAt,
  );
  return {
    token,
    expiresAt,
  };
}

function pruneExpiredTokens() {
  db.prepare('DELETE FROM auth_tokens WHERE expires_at <= ?').run(Date.now());
}

function getUserRow(username) {
  const safeUsername = normalizeUsername(username);
  if (!safeUsername) return null;
  return db.prepare('SELECT username, password_hash, password_salt, player_json, created_at, updated_at, last_login_at FROM users WHERE username = ?')
    .get(safeUsername) || null;
}

function getStoredPlayerRecord(username) {
  const row = getUserRow(username);
  if (!row) return null;
  return parsePlayerRecord(row.player_json, row.username);
}

function getAllPlayerRecords() {
  const rows = db.prepare('SELECT username, player_json FROM users ORDER BY username ASC').all();
  return rows.reduce((accumulator, row) => {
    const safeUsername = normalizeUsername(row.username);
    if (!safeUsername) return accumulator;
    accumulator[safeUsername] = parsePlayerRecord(row.player_json, safeUsername);
    return accumulator;
  }, {});
}

function getPublicLeaderboardPayload() {
  const rows = db.prepare('SELECT username, player_json FROM users ORDER BY username ASC').all();
  return rows.reduce((accumulator, row) => {
    const safeUsername = normalizeUsername(row.username);
    if (!safeUsername) return accumulator;
    const record = parsePlayerRecord(row.player_json, safeUsername);
    if (isLeaderboardBanActive(record.leaderboardBan)) return accumulator;
    const title = record.profileStats.title || record.title || '';
    accumulator[safeUsername] = {
      title,
      profileStats: {
        ...record.profileStats,
        title,
      },
      leaderboard: record.leaderboard,
    };
    return accumulator;
  }, {});
}

function buildLeaderboardSnapshotPayload() {
  return {
    ok: true,
    players: getPublicLeaderboardPayload(),
    updatedAt: Date.now(),
  };
}

function refreshLeaderboardSnapshot() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      LEADERBOARD_SNAPSHOT_FILE,
      JSON.stringify(buildLeaderboardSnapshotPayload(), null, 2),
      'utf8',
    );
  } catch (error) {
    console.error('Could not update leaderboard snapshot:', error && error.message ? error.message : error);
  }
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
  } catch (error) {
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
  const viewerKey = viewer
    ? match.players.one.username === viewer ? 'one' : match.players.two.username === viewer ? 'two' : null
    : null;
  const viewerPlayer = viewerKey ? match.players[viewerKey] : null;
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
    canSpecial: Boolean(
      viewer &&
      match.status === 'active' &&
      match.currentTurn === viewer &&
      viewerPlayer &&
      (viewerPlayer.specialMeter || 0) >= SPECIAL_METER_MAX
    ),
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
      specialMeter: 0,
    },
    two: {
      username: toProfile.username,
      displayName: toProfile.displayName,
      avatar: toProfile.avatar,
      title: toProfile.title,
      damage: toProfile.damage,
      maxHealth: toProfile.maxHealth,
      currentHealth: toProfile.maxHealth,
      specialMeter: 0,
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

function rollSpecialDamage(baseDamage) {
  const minDamage = Math.round(baseDamage * 1.7);
  const maxDamage = Math.round(baseDamage * 2.35);
  const spread = Math.max(6, maxDamage - minDamage);
  return minDamage + Math.floor(Math.random() * (spread + 1));
}

function applyArenaAttack(match, safeUser, kind) {
  if (match.status !== 'active') return { error: 'Match is already over' };
  if (match.currentTurn !== safeUser) return { error: 'It is not your turn' };

  const attackerKey = match.players.one.username === safeUser ? 'one' : match.players.two.username === safeUser ? 'two' : null;
  if (!attackerKey) return { error: 'You are not part of this match', status: 403 };
  const defenderKey = attackerKey === 'one' ? 'two' : 'one';
  const attacker = match.players[attackerKey];
  const defender = match.players[defenderKey];
  const isSpecial = kind === 'special';

  if (isSpecial && (attacker.specialMeter || 0) < SPECIAL_METER_MAX) {
    return { error: 'Your special attack is not ready yet' };
  }

  const damage = isSpecial ? rollSpecialDamage(attacker.damage) : rollAttackDamage(attacker.damage);
  defender.currentHealth = Math.max(0, defender.currentHealth - damage);
  attacker.specialMeter = isSpecial
    ? 0
    : Math.min(SPECIAL_METER_MAX, (attacker.specialMeter || 0) + NORMAL_ATTACK_SPECIAL_GAIN);
  match.updatedAt = Date.now();
  match.log.push({
    type: 'attack',
    kind: isSpecial ? 'special' : 'normal',
    attacker: attacker.username,
    defender: defender.username,
    damage,
    text: isSpecial
      ? `${attacker.displayName} unleashed a special attack on ${defender.displayName} for ${damage}.`
      : `${attacker.displayName} hit ${defender.displayName} for ${damage}.`,
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

  return { match };
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

ensureArenaFile();

app.post('/api/auth/register', (req, res) => {
  pruneExpiredTokens();
  const username = normalizeUsername(req.body && req.body.username);
  const password = String(req.body && req.body.password || '');

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-32 characters and only use letters, numbers, underscores, or hyphens.' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  const existing = getUserRow(username);
  const hashed = hashPassword(password);
  const now = Date.now();
  let record = existing ? parsePlayerRecord(existing.player_json, username) : getBasePlayerRecord();
  record.firstSeen = record.firstSeen || now;
  record.lastSeen = now;
  record.visits = Math.max(1, Number(record.visits) || 0);
  if (!record.profileStats || !record.profileStats.username) {
    record.profileStats = normalizeProfileStats({
      username,
      displayName: username,
      updatedAt: now,
    }, username);
  }

  if (existing && existing.password_hash && existing.password_salt) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  if (existing) {
    db.prepare(`
      UPDATE users
      SET password_hash = ?,
          password_salt = ?,
          player_json = ?,
          updated_at = ?,
          last_login_at = ?
      WHERE username = ?
    `).run(
      hashed.hash,
      hashed.salt,
      JSON.stringify(ensurePlayerRecordShape(record, username)),
      now,
      now,
      username,
    );
  } else {
    upsertUserRecord(username, record, {
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
      lastLoginAt: now,
    });
    db.prepare('UPDATE users SET last_login_at = ? WHERE username = ?').run(now, username);
  }

  const session = createAuthToken(username);
  res.json({
    ok: true,
    username,
    token: session.token,
    expiresAt: session.expiresAt,
  });
});

app.post('/api/auth/login', (req, res) => {
  pruneExpiredTokens();
  const username = normalizeUsername(req.body && req.body.username);
  const password = String(req.body && req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const userRow = getUserRow(username);
  if (!userRow || !userRow.password_hash || !userRow.password_salt) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (!verifyPassword(password, String(userRow.password_salt), String(userRow.password_hash))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const record = parsePlayerRecord(userRow.player_json, username);
  const now = Date.now();
  record.firstSeen = record.firstSeen || now;
  record.lastSeen = now;
  record.visits = Math.max(1, Number(record.visits) || 0);
  upsertUserRecord(username, record);
  db.prepare('UPDATE users SET last_login_at = ? WHERE username = ?').run(now, username);

  const session = createAuthToken(username);
  res.json({
    ok: true,
    username,
    token: session.token,
    expiresAt: session.expiresAt,
  });
});

app.get('/api/auth/session', requirePlayerAuth, (req, res) => {
  res.json({
    ok: true,
    username: req.player.username,
    expiresAt: db.prepare('SELECT expires_at FROM auth_tokens WHERE token = ?').get(req.player.token).expires_at,
  });
});

app.post('/api/auth/logout', requirePlayerAuth, (req, res) => {
  db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(req.player.token);
  res.json({ ok: true });
});

app.get('/leaderboard.json', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  refreshLeaderboardSnapshot();
  if (fs.existsSync(LEADERBOARD_SNAPSHOT_FILE)) {
    return res.sendFile(LEADERBOARD_SNAPSHOT_FILE);
  }
  res.json(buildLeaderboardSnapshotPayload());
});

app.get('/api/leaderboard', (req, res) => {
  res.json({
    ok: true,
    players: getPublicLeaderboardPayload(),
  });
});

app.get('/api/players', requireAdminAuth, (req, res) => {
  res.json(getAllPlayerRecords());
});

app.post('/api/admin/leaderboard-ban', requireAdminAuth, (req, res) => {
  const safeUsername = normalizeUsername(req.body && req.body.username);
  if (!safeUsername) {
    return res.status(400).json({ error: 'username required' });
  }

  const existing = getStoredPlayerRecord(safeUsername);
  if (!existing) {
    return res.status(404).json({ error: 'Player not found' });
  }

  let leaderboardBan;
  try {
    leaderboardBan = createLeaderboardBan({
      permanent: req.body && req.body.permanent === true,
      until: req.body && req.body.until,
      durationMs: req.body && req.body.durationMs,
      reason: req.body && req.body.reason,
      bannedBy: ADMIN_USER || 'admin',
    });
  } catch (error) {
    return res.status(400).json({ error: error && error.message ? error.message : 'Invalid leaderboard ban' });
  }

  const record = ensurePlayerRecordShape(existing, safeUsername);
  record.leaderboardBan = leaderboardBan;
  const player = upsertUserRecord(safeUsername, record);
  res.json({ ok: true, username: safeUsername, leaderboardBan: player.leaderboardBan, player });
});

app.post('/api/admin/leaderboard-unban', requireAdminAuth, (req, res) => {
  const safeUsername = normalizeUsername(req.body && req.body.username);
  if (!safeUsername) {
    return res.status(400).json({ error: 'username required' });
  }

  const existing = getStoredPlayerRecord(safeUsername);
  if (!existing) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const record = ensurePlayerRecordShape(existing, safeUsername);
  record.leaderboardBan = null;
  const player = upsertUserRecord(safeUsername, record);
  res.json({ ok: true, username: safeUsername, leaderboardBan: null, player });
});

app.post('/api/player', requirePlayerAuth, (req, res) => {
  const { username, player } = req.body || {};
  if (!username || !player) return res.status(400).json({ error: 'username and player required' });

  const safeUsername = normalizeUsername(username);
  if (safeUsername !== req.player.username) {
    return res.status(403).json({ error: 'You can only update your own player record.' });
  }

  const existing = getStoredPlayerRecord(safeUsername);
  const merged = mergePlayerRecords(existing, player, safeUsername);
  upsertUserRecord(safeUsername, merged);
  res.json({ ok: true, player: merged });
});

app.post('/api/merge', requireAdminAuth, (req, res) => {
  const payload = req.body || {};
  Object.keys(payload).forEach((username) => {
    const safeUsername = normalizeUsername(username);
    if (!safeUsername) return;
    const existing = getStoredPlayerRecord(safeUsername);
    const merged = mergePlayerRecords(existing, payload[username], safeUsername);
    upsertUserRecord(safeUsername, merged);
  });
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
    return res.status(404).json({ error: 'Target player is not currently active on this arena server' });
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
  const result = applyArenaAttack(match, safeUser, 'normal');
  if (result.error) return res.status(result.status || 400).json({ error: result.error });

  if (match.status === 'finished' && match.winner) {
    const winnerPlayer = match.players.one.username === match.winner ? match.players.one : match.players.two;
    recordArenaPvpVictory(match.winner, winnerPlayer);
  }

  writeArenaState(state);
  res.json({ ok: true, match: publicMatch(match, safeUser) });
});

app.post('/api/arena/match/:id/special', (req, res) => {
  const { username } = req.body || {};
  const safeUser = normalizeUsername(username);
  if (!safeUser) return res.status(400).json({ error: 'username required' });

  const state = readArenaState();
  const match = state.matches[req.params.id];
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const result = applyArenaAttack(match, safeUser, 'special');
  if (result.error) return res.status(result.status || 400).json({ error: result.error });

  if (match.status === 'finished' && match.winner) {
    const winnerPlayer = match.players.one.username === match.winner ? match.players.one : match.players.two;
    recordArenaPvpVictory(match.winner, winnerPlayer);
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

  recordArenaPvpVictory(winner, victor);

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
  console.log(`DB:    ${DATABASE_FILE}`);
});

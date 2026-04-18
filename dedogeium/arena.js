const refreshBtn = document.getElementById("refresh-btn");
const playerNameEl = document.getElementById("player-name");
const playerTitleEl = document.getElementById("player-title");
const playerAvatarEl = document.getElementById("player-avatar");
const playerDamageEl = document.getElementById("player-damage");
const playerHealthEl = document.getElementById("player-health");
const playerEquippedEl = document.getElementById("player-equipped");
const connectionStatusEl = document.getElementById("connection-status");
const playerCurrencyEl = document.getElementById("player-currency");
const playersOnlineEl = document.getElementById("players-online");
const playersListEl = document.getElementById("players-list");
const incomingListEl = document.getElementById("incoming-list");
const outgoingListEl = document.getElementById("outgoing-list");
const battleStageEl = document.getElementById("battle-stage");
const turnBadgeEl = document.getElementById("turn-badge");
const attackBtn = document.getElementById("attack-btn");
const specialBtn = document.getElementById("special-btn");
const forfeitBtn = document.getElementById("forfeit-btn");
const battleLogEl = document.getElementById("battle-log");
const recentMatchesEl = document.getElementById("recent-matches");
const serverUrlInput = document.getElementById("server-url");
const saveServerBtn = document.getElementById("save-server-btn");

const pageOrigin = window.location.origin && window.location.origin !== "null" ? window.location.origin : "";
const serverStorageKey = window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl";
const attackEffectDurationMs = 820;
let serverBase = "";
let serverCandidates = [];

const arenaState = {
    username: null,
    profile: null,
    overview: null,
    activeMatchId: null,
    refreshInFlight: false,
    refreshTimer: null,
    lastMatchId: null,
    lastAnimatedAttackKey: null,
    lastWinnerKey: null,
    audioContext: null,
    battleMusic: null,
};

const rarityBonuses = {
    "Doge": {
        "Common": { damage: 2, health: 50 },
        "Uncommon": { damage: 5, health: 100 },
        "Rare": { damage: 10, health: 150 },
        "Epic": { damage: 20, health: 250 },
        "Legendary": { damage: 40, health: 400 },
        "Godly": { damage: 80, health: 600 },
        "Mythic": { damage: 120, health: 900 },
        "rick astley": { damage: 35, health: 350 },
    },
    "Fire Doge": {
        "Common": { damage: 4, health: 100 },
        "Uncommon": { damage: 8, health: 160 },
        "Rare": { damage: 15, health: 240 },
        "Epic": { damage: 30, health: 375 },
        "Legendary": { damage: 60, health: 600 },
        "Godly": { damage: 120, health: 900 },
        "Mythic": { damage: 170, health: 1200 },
    },
};

function getArenaCurrency() {
    return Number(localStorage.getItem("currency") || "0");
}

function setArenaCurrency(value) {
    const normalized = Number(value) || 0;
    localStorage.setItem("currency", String(Math.max(0, normalized)));
    if (playerCurrencyEl) playerCurrencyEl.textContent = String(Math.max(0, normalized));
}

function addArenaCurrency(amount) {
    const numericAmount = Number(amount) || 0;
    const appliedAmount = window.DedogeiumSystems && typeof window.DedogeiumSystems.getAdjustedCurrencyReward === "function"
        ? window.DedogeiumSystems.getAdjustedCurrencyReward(numericAmount)
        : numericAmount;
    setArenaCurrency(getArenaCurrency() + appliedAmount);
    return appliedAmount;
}

function showArenaRewardMessage(message, isError = false) {
    if (!connectionStatusEl) return;
    const prevText = connectionStatusEl.textContent;
    const prevColor = connectionStatusEl.style.color;
    connectionStatusEl.textContent = message;
    connectionStatusEl.style.color = isError ? "#b91c1c" : "#124559";
    setTimeout(() => {
        if (connectionStatusEl.textContent === message) {
            connectionStatusEl.textContent = prevText;
            connectionStatusEl.style.color = prevColor;
        }
    }, 4000);
}

function awardArenaWinCurrency(winnerKey) {
    if (!winnerKey) return;
    const lastRewardedKey = localStorage.getItem("dedogeium_lastArenaRewardKey");
    if (lastRewardedKey === winnerKey) return;
    const reward = 20;
    const actualReward = addArenaCurrency(reward);
    localStorage.setItem("dedogeium_lastArenaRewardKey", winnerKey);
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.recordPvpVictory === "function") {
        window.DedogeiumSystems.recordPvpVictory();
    }
    showArenaRewardMessage(`Victory +${actualReward} coins!`, false);
}

function normalizeServerUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        const parsed = new URL(withProtocol);
        const normalizedPath = parsed.pathname && parsed.pathname !== "/"
            ? parsed.pathname.replace(/\/+$/, "")
            : "";
        return `${parsed.protocol}//${parsed.host}${normalizedPath}`;
    } catch (error) {
        return "";
    }
}

function getSiteServerCandidate() {
    const configuredSiteBase = normalizeServerUrl(window.DEDOGEIUM_SITE_SERVER_BASE || "");
    if (configuredSiteBase) return configuredSiteBase;
    const allowOriginServer = typeof window.DEDOGEIUM_ALLOW_ORIGIN_SERVER === "boolean"
        ? window.DEDOGEIUM_ALLOW_ORIGIN_SERVER
        : true;
    return allowOriginServer ? pageOrigin : "";
}

function buildServerCandidates(extraValues) {
    const values = [
        ...(Array.isArray(extraValues) ? extraValues : []),
        window.SERVER_URL,
        ...(Array.isArray(window.DEDOGEIUM_SERVER_CANDIDATES) ? window.DEDOGEIUM_SERVER_CANDIDATES : []),
        localStorage.getItem(serverStorageKey),
        getSiteServerCandidate(),
    ];
    return Array.from(new Set(values.map(normalizeServerUrl).filter(Boolean)));
}

function applyServerBase(nextUrl, persist) {
    const normalized = normalizeServerUrl(nextUrl);
    if (!normalized) return "";
    serverBase = normalized;
    serverCandidates = buildServerCandidates([normalized]);
    window.SERVER_URL = normalized;
    window.DEDOGEIUM_SERVER_CANDIDATES = serverCandidates;
    if (persist !== false) {
        localStorage.setItem(serverStorageKey, normalized);
    }
    syncServerInput();
    return normalized;
}

function initializeServerBase() {
    const resolved = buildServerCandidates()[0] || "";
    if (resolved) {
        applyServerBase(resolved, true);
        return;
    }
    serverCandidates = [];
    syncServerInput();
}

function getCurrentUsername() {
    const keys = ["Username", "Uabcd", "username", "playerName"];
    for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) return String(value).trim().toLowerCase();
    }
    return "";
}

function assetUrl(fileName) {
    if (!fileName) return "";
    if (/^https?:\/\//i.test(fileName)) return fileName;
    const clean = String(fileName).replace(/^\/+/, "");
    if (serverBase) return `${serverBase}/${encodeURI(clean)}`;
    const routeBase = window.location.pathname.includes("/arena/") ? "../" : "";
    return `${routeBase}${clean}`;
}

function getAvatar() {
    return localStorage.getItem("aprilFoolsEnabled") === "true"
        ? assetUrl("rick astley doge.png")
        : assetUrl("Im just a chill guy no background.png");
}

function getStoredNumber(keys) {
    for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value !== null) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) return parsed;
        }
    }
    return 0;
}

function getEquippedItems() {
    try {
        return JSON.parse(localStorage.getItem("equippedItems")) || [];
    } catch (error) {
        return [];
    }
}

function getItemBonus(item) {
    const itemType = item && item.name === "Fire Doge" ? "Fire Doge" : "Doge";
    const group = rarityBonuses[itemType] || {};
    return group[item && item.rarity] || { damage: 0, health: 0 };
}

function buildProfile() {
    const username = getCurrentUsername();
    const equippedItems = getEquippedItems();
    let totalDamage = 20;
    let totalHealth = 500;

    equippedItems.forEach((item) => {
        const bonus = getItemBonus(item);
        totalDamage += bonus.damage;
        totalHealth += bonus.health;
    });

    totalHealth += getStoredNumber(["playerHP", "totalHP", "hpTotal", "total_hp", "hp"]);

    return {
        username,
        displayName: username || "doge",
        title: equippedItems.length ? "Geared Arena Fighter" : "Fresh Arena Fighter",
        damage: totalDamage,
        maxHealth: totalHealth,
        avatar: getAvatar(),
        equippedCount: equippedItems.length,
    };
}

function setConnectionStatus(message, isError) {
    connectionStatusEl.textContent = message;
    connectionStatusEl.style.color = isError ? "#b91c1c" : "#124559";
}

function syncServerInput() {
    if (!serverUrlInput) return;
    serverUrlInput.value = serverBase || "";
}

function saveServerUrl() {
    const nextUrl = normalizeServerUrl(serverUrlInput ? serverUrlInput.value : "");
    if (!nextUrl) {
        setConnectionStatus("Enter a server URL like https://your-server.example or http://192.168.1.100:3000 first.", true);
        return;
    }
    applyServerBase(nextUrl, true);
    setConnectionStatus(`Arena server saved as ${nextUrl}.`, false);
    refreshArena(true);
}

function hasConfiguredServer() {
    return Boolean(serverBase);
}

async function api(path, options = {}) {
    if (!hasConfiguredServer()) {
        throw new Error("Set the Arena Server URL first.");
    }

    const candidates = buildServerCandidates([serverBase]);
    let lastError = null;

    for (const candidate of candidates) {
        const isLastCandidate = candidate === candidates[candidates.length - 1];
        try {
            const response = await fetch(`${candidate}${path}`, {
                method: options.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                if (candidate !== serverBase) {
                    applyServerBase(candidate, true);
                }
                return data;
            }

            const message = data && data.error ? data.error : "The arena server request failed.";
            const shouldFallback = [404, 502, 503, 504].includes(response.status) && !isLastCandidate;
            if (shouldFallback) {
                const retryableError = new Error(message);
                retryableError.retryable = true;
                throw retryableError;
            }
            throw new Error(message);
        } catch (error) {
            lastError = error;
            const shouldRetry = !isLastCandidate && (error && error.retryable === true || error && error.name === "TypeError");
            if (!shouldRetry) {
                throw error;
            }
        }
    }

    throw lastError || new Error("The arena server request failed.");
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return "just now";
    const diffSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (diffSeconds < 5) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours}h ago`;
}

function renderSelf(profile) {
    playerNameEl.textContent = profile.username || "Not logged in";
    playerTitleEl.textContent = profile.title;
    playerAvatarEl.src = profile.avatar;
    playerDamageEl.textContent = String(profile.damage);
    playerHealthEl.textContent = String(profile.maxHealth);
    playerEquippedEl.textContent = String(profile.equippedCount);
    if (playerCurrencyEl) playerCurrencyEl.textContent = String(getArenaCurrency());
}

function createEmptyState(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.textContent = message;
    return wrapper;
}

function getAudioContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!arenaState.audioContext) {
        arenaState.audioContext = new AudioContextCtor();
    }
    if (arenaState.audioContext.state === "suspended") {
        arenaState.audioContext.resume().catch(() => {});
    }
    return arenaState.audioContext;
}

function playTone(frequency, startAt, duration, volume, type) {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
}

function playAttackSound(damage) {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    playTone(220, now, 0.12, 0.08, "square");
    playTone(Math.min(880, 320 + damage), now + 0.05, 0.16, 0.05, "sawtooth");
}

function playSpecialSound(damage) {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    playTone(180, now, 0.18, 0.07, "sawtooth");
    playTone(360, now + 0.06, 0.18, 0.06, "square");
    playTone(Math.min(1200, 500 + damage), now + 0.12, 0.28, 0.08, "triangle");
}

function playVictorySound() {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    playTone(392, now, 0.16, 0.06, "triangle");
    playTone(523.25, now + 0.12, 0.18, 0.06, "triangle");
    playTone(659.25, now + 0.24, 0.24, 0.07, "triangle");
}

function ensureBattleMusicPlaying() {
    if (!hasConfiguredServer()) return;
    if (!arenaState.battleMusic) {
        arenaState.battleMusic = new Audio(assetUrl("during fight.mp3"));
        arenaState.battleMusic.loop = true;
    }
    const nextSrc = assetUrl("during fight.mp3");
    if (arenaState.battleMusic.src !== nextSrc) {
        arenaState.battleMusic.src = nextSrc;
        arenaState.battleMusic.loop = true;
    }
    const volume = Math.min(1, Math.max(0, (Number(localStorage.getItem("musicVolume")) || 45) / 100));
    arenaState.battleMusic.volume = volume * 0.35;
    arenaState.battleMusic.play().catch(() => {});
}

function stopBattleMusic() {
    if (!arenaState.battleMusic) return;
    arenaState.battleMusic.pause();
}

function renderPlayers(players) {
    playersListEl.innerHTML = "";
    if (!players.length) {
        playersListEl.appendChild(createEmptyState("No opponents are online yet. If another device is open, make sure it is on the arena page and logged in with a different username."));
        return;
    }

    players.forEach((player) => {
        const card = document.createElement("div");
        card.className = "player-row";

        const challengeDisabled = player.status.type !== "ready";
        let buttonLabel = "Challenge";
        if (player.status.type === "incoming-challenge") buttonLabel = "Check Inbox";
        if (player.status.type === "outgoing-challenge") buttonLabel = "Challenge Sent";
        if (player.status.type === "in-match") buttonLabel = "In Match";

        card.innerHTML = `
            <div class="row-top">
                <div>
                    <p class="fighter-name">${player.profile.displayName}</p>
                    <p class="meta-line">${player.profile.title}</p>
                </div>
                <span class="badge">${player.status.type.replace(/-/g, " ")}</span>
            </div>
            <p class="meta-line">Damage ${player.profile.damage} | Health ${player.profile.maxHealth}</p>
            <p class="meta-line">Seen ${formatTimeAgo(player.lastSeen)}</p>
        `;

        const buttonRow = document.createElement("div");
        buttonRow.className = "button-row";
        const challengeBtn = document.createElement("button");
        challengeBtn.type = "button";
        challengeBtn.textContent = buttonLabel;
        challengeBtn.disabled = challengeDisabled;
        challengeBtn.addEventListener("click", () => sendChallenge(player.username));
        buttonRow.appendChild(challengeBtn);
        card.appendChild(buttonRow);
        playersListEl.appendChild(card);
    });
}

function renderIncomingChallenges(challenges) {
    incomingListEl.innerHTML = "";
    if (!challenges.length) {
        incomingListEl.appendChild(createEmptyState("No one is challenging you right now."));
        return;
    }

    challenges.forEach((challenge) => {
        const card = document.createElement("div");
        card.className = "challenge-card";
        card.innerHTML = `
            <div class="challenge-top">
                <div>
                    <p class="fighter-name">${challenge.fromProfile.displayName}</p>
                    <p class="meta-line">${challenge.fromProfile.title}</p>
                </div>
                <span class="badge">pending</span>
            </div>
            <p class="meta-line">Damage ${challenge.fromProfile.damage} | Health ${challenge.fromProfile.maxHealth}</p>
            <p class="meta-line">Sent ${formatTimeAgo(challenge.createdAt)}</p>
        `;

        const buttonRow = document.createElement("div");
        buttonRow.className = "button-row";

        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.textContent = "Accept";
        acceptBtn.addEventListener("click", () => respondToChallenge(challenge.id, true));

        const declineBtn = document.createElement("button");
        declineBtn.type = "button";
        declineBtn.textContent = "Decline";
        declineBtn.className = "secondary";
        declineBtn.addEventListener("click", () => respondToChallenge(challenge.id, false));

        buttonRow.appendChild(acceptBtn);
        buttonRow.appendChild(declineBtn);
        card.appendChild(buttonRow);
        incomingListEl.appendChild(card);
    });
}

function renderOutgoingChallenges(challenges) {
    outgoingListEl.innerHTML = "";
    if (!challenges.length) {
        outgoingListEl.appendChild(createEmptyState("You have not challenged anyone yet."));
        return;
    }

    challenges.forEach((challenge) => {
        const card = document.createElement("div");
        card.className = "challenge-card";
        card.innerHTML = `
            <div class="challenge-top">
                <div>
                    <p class="fighter-name">${challenge.toProfile.displayName}</p>
                    <p class="meta-line">${challenge.toProfile.title}</p>
                </div>
                <span class="badge">${challenge.status}</span>
            </div>
            <p class="meta-line">Damage ${challenge.toProfile.damage} | Health ${challenge.toProfile.maxHealth}</p>
            <p class="meta-line">Waiting ${formatTimeAgo(challenge.createdAt)}</p>
        `;
        outgoingListEl.appendChild(card);
    });
}

function createFighterCard(fighter, options) {
    const isTurn = options.isTurn;
    const isSelf = options.isSelf;
    const isWinner = options.isWinner;
    const isLoser = options.isLoser;
    const currentPercent = Math.max(0, Math.min(100, (fighter.currentHealth / fighter.maxHealth) * 100));
    const card = document.createElement("article");
    card.className = "fighter-card stage-fighter";
    if (isTurn) card.classList.add("turn-focus");
    if (isSelf) card.classList.add("self-fighter");
    if (isWinner) card.classList.add("is-victorious");
    if (isLoser) card.classList.add("is-defeated");
    card.dataset.username = fighter.username;
    card.dataset.side = options.side;
    card.innerHTML = `
        <div class="fighter-aura"></div>
        <div class="fighter-top">
            <img class="fighter-art" src="${fighter.avatar}" alt="${fighter.displayName}">
            <div class="fighter-info">
                <p class="fighter-name">${fighter.displayName}</p>
                <p class="meta-line">${fighter.title}</p>
                <p class="meta-line">Damage ${fighter.damage}</p>
                <p class="stance-line">${isTurn ? "Charging attack" : "Holding position"}</p>
            </div>
        </div>
        <div class="health-track">
            <div class="health-bar" style="width:${currentPercent}%"></div>
        </div>
        <div class="special-track">
            <div class="special-bar" style="width:${Math.max(0, Math.min(100, fighter.specialMeter || 0))}%"></div>
        </div>
        <div class="fighter-footer">
            <p class="meta-line">${fighter.currentHealth} / ${fighter.maxHealth} HP</p>
            <span class="badge ${isTurn ? "" : "muted"}">${isSelf ? "You" : "Opponent"}</span>
            <span class="badge ${(fighter.specialMeter || 0) >= 100 ? "" : "muted"}">Special ${fighter.specialMeter || 0}%</span>
        </div>
    `;
    return card;
}

function renderBattleLog(log) {
    battleLogEl.innerHTML = "";
    if (!Array.isArray(log) || !log.length) {
        battleLogEl.appendChild(createEmptyState("No swings yet."));
        return;
    }

    log.slice().reverse().forEach((entry) => {
        const line = document.createElement("div");
        line.className = `log-entry ${entry.type === "system" ? "system" : "attack"}`.trim();
        line.textContent = entry.text;
        battleLogEl.appendChild(line);
    });
}

function findFighterNode(username) {
    return Array.from(battleStageEl.querySelectorAll(".stage-fighter")).find((node) => node.dataset.username === username) || null;
}

function clearStageFxClasses() {
    battleStageEl.classList.remove("is-striking", "is-special-striking", "fx-left-to-right", "fx-right-to-left", "victory-flash");
}

function triggerAttackEffect(match, attackEntry) {
    if (!attackEntry) return;
    const attackerNode = findFighterNode(attackEntry.attacker);
    const defenderNode = findFighterNode(attackEntry.defender);
    const damageBurst = battleStageEl.querySelector(".damage-burst");
    const directionClass = match.players.one.username === attackEntry.attacker ? "fx-left-to-right" : "fx-right-to-left";
    const isSpecial = attackEntry.kind === "special";

    clearStageFxClasses();
    void battleStageEl.offsetWidth;
    battleStageEl.classList.add(isSpecial ? "is-special-striking" : "is-striking", directionClass);
    if (attackerNode) attackerNode.classList.add("is-attacking");
    if (defenderNode) defenderNode.classList.add("is-hit");
    if (damageBurst) damageBurst.textContent = `${isSpecial ? "SPECIAL " : ""}-${attackEntry.damage}`;

    if (isSpecial) {
        playSpecialSound(attackEntry.damage);
    } else {
        playAttackSound(attackEntry.damage);
    }

    window.setTimeout(() => {
        battleStageEl.classList.remove("is-striking", "is-special-striking", directionClass);
        if (attackerNode) attackerNode.classList.remove("is-attacking");
        if (defenderNode) defenderNode.classList.remove("is-hit");
    }, attackEffectDurationMs);
}

function triggerVictoryEffect(match) {
    const winnerNode = findFighterNode(match.winner);
    const loserUsername = match.players.one.username === match.winner ? match.players.two.username : match.players.one.username;
    const loserNode = findFighterNode(loserUsername);
    battleStageEl.classList.add("victory-flash");
    if (winnerNode) winnerNode.classList.add("is-victorious");
    if (loserNode) loserNode.classList.add("is-defeated");
    playVictorySound();
}

function renderBattle(match, profile) {
    battleStageEl.innerHTML = "";

    if (!match) {
        stopBattleMusic();
        battleStageEl.className = "battle-stage empty-stage";
        battleStageEl.textContent = "Accept a challenge or send one to start fighting.";
        turnBadgeEl.textContent = "No active match";
        turnBadgeEl.className = "badge muted";
        attackBtn.disabled = true;
        if (specialBtn) specialBtn.disabled = true;
        forfeitBtn.disabled = true;
        renderBattleLog([]);
        arenaState.activeMatchId = null;
        arenaState.lastMatchId = null;
        arenaState.lastAnimatedAttackKey = null;
        arenaState.lastWinnerKey = null;
        return;
    }

    arenaState.activeMatchId = match.id;
    if (arenaState.lastMatchId !== match.id) {
        arenaState.lastMatchId = match.id;
        arenaState.lastAnimatedAttackKey = null;
        arenaState.lastWinnerKey = null;
    }

    if (match.status === "active") {
        ensureBattleMusicPlaying();
    } else {
        stopBattleMusic();
    }

    battleStageEl.className = `battle-stage live-stage ${match.status === "finished" ? "battle-finished" : ""}`;
    battleStageEl.innerHTML = `
        <div class="stage-atmosphere"></div>
        <div class="stage-gridlines"></div>
        <div class="center-emblem">
            <span>${match.status === "finished" ? "KO" : "VS"}</span>
            <small>${match.status === "finished" ? "Match over" : "Arena clash"}</small>
        </div>
        <div class="attack-fx" aria-hidden="true">
            <div class="attack-slash"></div>
            <div class="special-blast"></div>
            <div class="impact-ring"></div>
            <div class="damage-burst"></div>
        </div>
    `;

    const fighters = [match.players.one, match.players.two];
    fighters.forEach((fighter, index) => {
        const isSelf = fighter.username === arenaState.username;
        const isTurn = match.status === "active" && match.currentTurn === fighter.username;
        const isWinner = match.status === "finished" && match.winner === fighter.username;
        const isLoser = match.status === "finished" && match.winner && match.winner !== fighter.username;
        battleStageEl.appendChild(createFighterCard(fighter, {
            side: index === 0 ? "left" : "right",
            isTurn,
            isSelf,
            isWinner,
            isLoser,
        }));
    });

    const yourTurn = match.canAttack;
    const yourDisplayName = profile && profile.displayName ? profile.displayName : arenaState.username;
    const opponent = match.players.one.username === arenaState.username ? match.players.two : match.players.one;
    const badgeText = match.status === "finished"
        ? (match.winner === arenaState.username ? `Victory over ${opponent.displayName}` : `Defeat vs ${opponent.displayName}`)
        : yourTurn
            ? "Your turn"
            : "Enemy turn";
    turnBadgeEl.textContent = badgeText;
    turnBadgeEl.className = yourTurn ? "badge" : "badge muted";

    attackBtn.disabled = !yourTurn;
    if (specialBtn) specialBtn.disabled = !match.canSpecial;
    forfeitBtn.disabled = match.status !== "active";

    renderBattleLog(match.log || []);

    const latestAttack = (match.log || []).filter((entry) => entry.type === "attack").slice(-1)[0] || null;
    const attackKey = latestAttack ? `${match.id}:${latestAttack.at}:${latestAttack.damage}` : null;
    if (attackKey && arenaState.lastAnimatedAttackKey !== attackKey) {
        arenaState.lastAnimatedAttackKey = attackKey;
        triggerAttackEffect(match, latestAttack);
    }

    const winnerKey = match.status === "finished" ? `${match.id}:${match.winner}:${match.updatedAt}` : null;
    if (winnerKey && arenaState.lastWinnerKey !== winnerKey) {
        arenaState.lastWinnerKey = winnerKey;
        triggerVictoryEffect(match);
        if (match.winner === arenaState.username) {
            awardArenaWinCurrency(winnerKey);
        }
    }
}

function renderRecentMatches(matches) {
    recentMatchesEl.innerHTML = "";
    if (!matches.length) {
        recentMatchesEl.appendChild(createEmptyState("Your recent arena results will appear here."));
        return;
    }

    matches.forEach((match) => {
        const opponent = match.players.one.username === arenaState.username ? match.players.two : match.players.one;
        const didWin = match.winner === arenaState.username;
        const card = document.createElement("div");
        card.className = "recent-match-card";
        card.innerHTML = `
            <p class="fighter-name">${didWin ? "Victory" : "Defeat"} vs ${opponent.displayName}</p>
            <p class="meta-line">Finished ${formatTimeAgo(match.updatedAt)}</p>
        `;
        recentMatchesEl.appendChild(card);
    });
}

function renderOverview(data) {
    arenaState.overview = data;
    const opponentCount = Array.isArray(data.players) ? data.players.length : 0;
    const totalOnline = Number(data.server.playersOnline) || 0;
    if (opponentCount > 0) {
        playersOnlineEl.textContent = `${opponentCount} opponents | ${totalOnline} total`;
    } else if (totalOnline > 0) {
        playersOnlineEl.textContent = `0 opponents | ${totalOnline} total`;
    } else {
        playersOnlineEl.textContent = "0 online";
    }

    setConnectionStatus(`Connected to ${serverBase} on ${data.server.name}. Last sync ${new Date(data.server.now).toLocaleTimeString()}.`, false);
    renderPlayers(data.players || []);
    renderIncomingChallenges(data.incomingChallenges || []);
    renderOutgoingChallenges(data.outgoingChallenges || []);
    renderBattle(data.activeMatch || null, arenaState.profile);
    renderRecentMatches(data.recentMatches || []);
}

async function refreshArena(manual) {
    if (arenaState.refreshInFlight) return;
    arenaState.username = getCurrentUsername();
    arenaState.profile = buildProfile();
    renderSelf(arenaState.profile);

    if (!arenaState.username) {
        setConnectionStatus("Log in first so the arena can announce you to the LAN server.", true);
        playersListEl.innerHTML = "";
        playersListEl.appendChild(createEmptyState("Login is required before you can search for nearby players."));
        incomingListEl.innerHTML = "";
        incomingListEl.appendChild(createEmptyState("Login is required before you can receive challenges."));
        outgoingListEl.innerHTML = "";
        outgoingListEl.appendChild(createEmptyState("Login is required before you can send challenges."));
        renderBattle(null, null);
        renderRecentMatches([]);
        playersOnlineEl.textContent = "0 online";
        if (specialBtn) specialBtn.disabled = true;
        return;
    }

    if (!hasConfiguredServer()) {
        setConnectionStatus("Open the arena from your server link, or enter one manually first.", true);
        playersListEl.innerHTML = "";
        playersListEl.appendChild(createEmptyState("No server is configured yet. Open the arena from the server you want to use, or paste its URL above."));
        incomingListEl.innerHTML = "";
        incomingListEl.appendChild(createEmptyState("Challenges will appear after you connect to an arena server."));
        outgoingListEl.innerHTML = "";
        outgoingListEl.appendChild(createEmptyState("Connect to an arena server before sending challenges."));
        renderBattle(null, arenaState.profile);
        renderRecentMatches([]);
        playersOnlineEl.textContent = "0 online";
        if (specialBtn) specialBtn.disabled = true;
        return;
    }

    arenaState.refreshInFlight = true;
    refreshBtn.disabled = true;
    if (manual) setConnectionStatus("Scanning the arena server and locking in your fighter profile...", false);

    try {
        const data = await api("/api/arena/presence", {
            method: "POST",
            body: {
                username: arenaState.username,
                profile: arenaState.profile,
            },
        });
        renderOverview(data);
    } catch (error) {
        setConnectionStatus(`Arena server unavailable at ${serverBase}. ${error.message}`, true);
    } finally {
        arenaState.refreshInFlight = false;
        refreshBtn.disabled = false;
    }
}

async function sendChallenge(targetUsername) {
    getAudioContext();
    try {
        await api("/api/arena/challenge", {
            method: "POST",
            body: {
                from: arenaState.username,
                to: targetUsername,
                profile: arenaState.profile,
            },
        });
        setConnectionStatus(`Challenge sent to ${targetUsername}.`, false);
        await refreshArena(false);
    } catch (error) {
        setConnectionStatus(error.message, true);
    }
}

async function respondToChallenge(challengeId, accept) {
    getAudioContext();
    try {
        const data = await api(`/api/arena/challenge/${challengeId}/respond`, {
            method: "POST",
            body: {
                username: arenaState.username,
                accept,
                profile: arenaState.profile,
            },
        });
        if (accept && data.match) {
            ensureBattleMusicPlaying();
            renderBattle(data.match, arenaState.profile);
        }
        await refreshArena(false);
    } catch (error) {
        setConnectionStatus(error.message, true);
    }
}

async function attack() {
    if (!arenaState.activeMatchId) return;
    getAudioContext();
    try {
        const data = await api(`/api/arena/match/${arenaState.activeMatchId}/attack`, {
            method: "POST",
            body: {
                username: arenaState.username,
            },
        });
        renderBattle(data.match, arenaState.profile);
        await refreshArena(false);
    } catch (error) {
        setConnectionStatus(error.message, true);
    }
}

async function specialAttack() {
    if (!arenaState.activeMatchId) return;
    getAudioContext();
    try {
        const data = await api(`/api/arena/match/${arenaState.activeMatchId}/special`, {
            method: "POST",
            body: {
                username: arenaState.username,
            },
        });
        renderBattle(data.match, arenaState.profile);
        await refreshArena(false);
    } catch (error) {
        setConnectionStatus(error.message, true);
    }
}

async function forfeitMatch() {
    if (!arenaState.activeMatchId) return;
    getAudioContext();
    try {
        const data = await api(`/api/arena/match/${arenaState.activeMatchId}/forfeit`, {
            method: "POST",
            body: {
                username: arenaState.username,
            },
        });
        renderBattle(data.match, arenaState.profile);
        await refreshArena(false);
    } catch (error) {
        setConnectionStatus(error.message, true);
    }
}

function startAutoRefresh() {
    if (arenaState.refreshTimer) window.clearInterval(arenaState.refreshTimer);
    arenaState.refreshTimer = window.setInterval(() => {
        refreshArena(false);
    }, 4000);
}

refreshBtn.addEventListener("click", () => refreshArena(true));
attackBtn.addEventListener("click", attack);
if (specialBtn) {
    specialBtn.addEventListener("click", specialAttack);
}
forfeitBtn.addEventListener("click", forfeitMatch);
if (saveServerBtn) {
    saveServerBtn.addEventListener("click", saveServerUrl);
}
if (serverUrlInput) {
    serverUrlInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveServerUrl();
        }
    });
}

window.addEventListener("beforeunload", stopBattleMusic);

window.addEventListener("DOMContentLoaded", () => {
    initializeServerBase();
    arenaState.username = getCurrentUsername();
    arenaState.profile = buildProfile();
    renderSelf(arenaState.profile);
    syncServerInput();
    refreshArena(true);
    startAutoRefresh();
});

const promoCodeImg = document.getElementById("promo-code-img");
const popup = document.getElementById("popup");
const closeBtn = document.getElementById("close-btn");
const submitBtn = document.getElementById("submit-btn");
const promoInput = document.getElementById("promo-code");
const dailyRewardBtn = document.getElementById("daily-reward-btn");
const dailyRewardStreak = document.getElementById("daily-reward-streak");
const dailyRewardPreview = document.getElementById("daily-reward-preview");
const dailyRewardStatus = document.getElementById("daily-reward-status");
const dailyRewardDescription = document.getElementById("daily-reward-description");
const leaderboardScopeButtons = Array.from(document.querySelectorAll("[data-leaderboard-scope]"));
const leaderboardCategorySelect = document.getElementById("leaderboard-category");
const leaderboardPlayerRank = document.getElementById("leaderboard-player-rank");
const leaderboardPlayerValue = document.getElementById("leaderboard-player-value");
const leaderboardRewardPreview = document.getElementById("leaderboard-reward-preview");
const leaderboardClaimBtn = document.getElementById("leaderboard-claim-btn");
const leaderboardClaimStatus = document.getElementById("leaderboard-claim-status");
const leaderboardTableTitle = document.getElementById("leaderboard-table-title");
const leaderboardSource = document.getElementById("leaderboard-source");
const leaderboardList = document.getElementById("leaderboard-list");
const music = new Audio("rick roll.mp3");
const AUTH_TOKEN_STORAGE_KEY = "dedogeiumAuthToken";
const LEADERBOARD_CACHE_STORAGE_KEY = "dedogeiumLeaderboardCache";
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const leaderboardState = {
    scope: "daily",
    category: "attack",
    players: {},
    sourceLabel: "Loading shared leaderboard...",
    serverAvailable: false,
    mode: "loading",
    claimsEnabled: false,
    emptyMessage: "Loading leaderboard...",
    claimMessage: "",
    claimError: false,
};

music.loop = true;
music.volume = Math.min(1, Math.max(0, musicVolume / 100));

const today = new Date();
const isAprilFools = today.getMonth() === 3 && today.getDate() === 1;
if (isAprilFools) {
  music.play().catch(() => {});
}

function openPopup() {
    if (!popup) return;
    popup.classList.add("is-open");
    if (promoInput) promoInput.focus();
}

function closePopup() {
    if (!popup) return;
    popup.classList.remove("is-open");
    if (promoInput) promoInput.value = "";
}

function escapeLeaderboardText(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }[character]));
}

function getLeaderboardEntryTitle(entry) {
    if (!entry || typeof entry !== "object") return "";
    const title = entry.title
        || (entry.record && entry.record.profileStats && entry.record.profileStats.title)
        || (entry.record && entry.record.title)
        || "";
    return String(title || "").trim();
}

if (promoCodeImg) {
    promoCodeImg.addEventListener("click", openPopup);
}

if (closeBtn) {
    closeBtn.addEventListener("click", closePopup);
}

if (popup) {
    popup.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });
}

if (submitBtn) {
    submitBtn.addEventListener("click", () => {
        const code = promoInput ? promoInput.value.trim() : "";
        if (!code) {
            alert("Please enter a promo code first.");
            return;
        }
        if (code.toLowerCase() === "april fools") {
            alert("Congratulations! You have redeemed the code: april fools! If you go into your inventory and find the box and check it, you will have fully redeemed the code! No... I swear its not a rick roll.");
            localStorage.setItem("aprilFoolsEnabled", "true");
        } else if (code.toLowerCase() === "early gang") {
            const redeemed = localStorage.getItem("earlyGangRedeemed");
            if (redeemed) {
                alert("You have already redeemed the 'early gang' promo code.");
            } else {
                // Add currency
                const currentCurrency = Number(localStorage.getItem('currency') || 0);
                localStorage.setItem('currency', String(currentCurrency + 10000));

                // Add special doge
                const inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
                inventory.push({ name: 'Doge', rarity: 'Mythic', id: Date.now() + Math.random() });
                localStorage.setItem("inventory", JSON.stringify(inventory));

                // Set title
                const username = window.DedogeiumSystems ? window.DedogeiumSystems.getCurrentUsername() : "";
                if (username) {
                    const players = JSON.parse(localStorage.getItem("dedogeium_players") || "{}");
                    if (!players[username]) players[username] = {};
                    players[username].title = "early gang";
                    localStorage.setItem("dedogeium_players", JSON.stringify(players));
                }

                localStorage.setItem("earlyGangRedeemed", "true");
                alert("Congratulations! You redeemed the 'early gang' promo code and received 10,000 currency, a Mythic Doge, and the 'early gang' title!");
            }
        } else {
            alert("Invalid promo code. Please try again.");
        }
        closePopup();
    });
}

function pluralize(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
}

function formatRewardPreview(reward) {
    if (!reward) return "No reward available";

    const parts = [];
    if (reward.currency) {
        parts.push(`${reward.currency} currency`);
    }

    const boosts = reward.boosts && typeof reward.boosts === "object" ? reward.boosts : {};
    Object.entries(boosts).forEach(([boostKey, count]) => {
        const boostDefinition = window.DedogeiumSystems
            && window.DedogeiumSystems.BOOST_DEFINITIONS
            && window.DedogeiumSystems.BOOST_DEFINITIONS[boostKey];
        const label = boostDefinition ? boostDefinition.label : `${boostKey} boost`;
        parts.push(`${pluralize(count, "charge")} of ${label}`);
    });

    return parts.join(" + ");
}

function formatCountdown(msRemaining) {
    const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderDailyReward(message) {
    if (!window.DedogeiumSystems || !dailyRewardBtn) return;

    const snapshot = window.DedogeiumSystems.getDailyRewardSnapshot();
    if (dailyRewardStreak) {
        dailyRewardStreak.textContent = `${snapshot.currentStreak} ${snapshot.currentStreak === 1 ? "day" : "days"}`;
    }
    if (dailyRewardPreview) {
        dailyRewardPreview.textContent = formatRewardPreview(snapshot.reward);
    }
    if (dailyRewardDescription) {
        dailyRewardDescription.textContent = `Day ${snapshot.reward.dayInCycle} reward: ${formatRewardPreview(snapshot.reward)}.`;
    }

    if (snapshot.canClaim) {
        dailyRewardBtn.disabled = false;
        dailyRewardBtn.textContent = `Claim Day ${snapshot.reward.dayInCycle}`;
        if (dailyRewardStatus) {
            dailyRewardStatus.textContent = message || (snapshot.currentStreak > 0
                ? "You can claim now to keep your streak going."
                : "Your first daily reward is ready.");
        }
        return;
    }

    dailyRewardBtn.disabled = true;
    dailyRewardBtn.textContent = "Claimed Today";
    if (dailyRewardStatus) {
        dailyRewardStatus.textContent = message || `Come back in ${formatCountdown(snapshot.nextClaimAt - Date.now())} for the next reward.`;
    }
}

if (dailyRewardBtn && window.DedogeiumSystems) {
    renderDailyReward();
    window.setInterval(() => {
        renderDailyReward();
    }, 1000);

    dailyRewardBtn.addEventListener("click", () => {
        const result = window.DedogeiumSystems.claimDailyReward();
        if (!result.ok) {
            renderDailyReward(result.error);
            return;
        }

        renderDailyReward(`Claimed ${formatRewardPreview(result.reward)}.`);
    });
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

function buildApiBaseCandidates(serverBase) {
    const normalized = normalizeServerUrl(serverBase);
    if (!normalized) return [];
    try {
        const parsed = new URL(normalized);
        const path = parsed.pathname && parsed.pathname !== "/"
            ? parsed.pathname.replace(/\/+$/, "")
            : "";
        const candidates = [
            `${parsed.origin}${path}/api`,
            `${parsed.origin}/api`,
        ];
        return Array.from(new Set(candidates));
    } catch (error) {
        return [`${normalized}/api`];
    }
}

function buildLeaderboardSourceCandidates(serverBase) {
    const normalized = normalizeServerUrl(serverBase);
    if (!normalized) return [];
    try {
        const parsed = new URL(normalized);
        const path = parsed.pathname && parsed.pathname !== "/"
            ? parsed.pathname.replace(/\/+$/, "")
            : "";
        return Array.from(new Set([
            `${parsed.origin}${path}/leaderboard.json`,
            `${parsed.origin}/leaderboard.json`,
            ...buildApiBaseCandidates(normalized).map((apiBase) => `${apiBase}/leaderboard`),
        ]));
    } catch (error) {
        return [`${normalized}/leaderboard.json`, `${normalized}/api/leaderboard`];
    }
}

function getLeaderboardRecordUpdatedAt(record) {
    if (!record || typeof record !== "object") return 0;
    return Math.max(
        Number(record.lastSeen) || 0,
        Number(record.profileStats && record.profileStats.updatedAt) || 0,
        Number(record.leaderboard && record.leaderboard.updatedAt) || 0,
    );
}

function mergeLeaderboardPlayers(...playerMaps) {
    const merged = {};
    playerMaps.forEach((playerMap) => {
        if (!playerMap || typeof playerMap !== "object") return;
        Object.entries(playerMap).forEach(([username, record]) => {
            if (!username || !record || typeof record !== "object") return;
            const existing = merged[username];
            if (!existing || getLeaderboardRecordUpdatedAt(record) >= getLeaderboardRecordUpdatedAt(existing)) {
                merged[username] = record;
            }
        });
    });
    return merged;
}

function getLocalLeaderboardPlayers() {
    if (!window.DedogeiumSystems || typeof window.DedogeiumSystems.readPlayerRecords !== "function") {
        return {};
    }
    try {
        const players = window.DedogeiumSystems.readPlayerRecords();
        return players && typeof players === "object" ? players : {};
    } catch (error) {
        return {};
    }
}

function readCachedLeaderboardPlayers() {
    try {
        const cached = JSON.parse(localStorage.getItem(LEADERBOARD_CACHE_STORAGE_KEY) || "{}");
        return cached && cached.players && typeof cached.players === "object" ? cached.players : {};
    } catch (error) {
        return {};
    }
}

function writeCachedLeaderboardPlayers(players) {
    try {
        localStorage.setItem(LEADERBOARD_CACHE_STORAGE_KEY, JSON.stringify({
            players: players && typeof players === "object" ? players : {},
            updatedAt: Date.now(),
        }));
    } catch (error) {
        // Ignore cache write failures.
    }
}

function getLeaderboardPlayersFromPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.players && typeof payload.players === "object") {
        return payload.players;
    }
    return null;
}

function getSiteServerCandidate() {
    const configuredSiteBase = normalizeServerUrl(window.DEDOGEIUM_SITE_SERVER_BASE || "");
    if (configuredSiteBase) return configuredSiteBase;
    const allowOriginServer = typeof window.DEDOGEIUM_ALLOW_ORIGIN_SERVER === "boolean"
        ? window.DEDOGEIUM_ALLOW_ORIGIN_SERVER
        : true;
    return allowOriginServer && window.location.origin && window.location.origin !== "null"
        ? window.location.origin
        : "";
}

function getCurrentUsername() {
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.getCurrentUsername === "function") {
        return window.DedogeiumSystems.getCurrentUsername();
    }
    return "";
}

function getAuthToken() {
    return String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim();
}

function getLoginUrl() {
    const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    return `../login/?next=${encodeURIComponent(nextPath)}`;
}

function redirectToDedogeiumLogin() {
    window.location.href = getLoginUrl();
}

async function requireDedogeiumLogin() {
    const username = getCurrentUsername();
    const token = getAuthToken();
    if (!username || !token) {
        redirectToDedogeiumLogin();
        return false;
    }

    const storageKey = window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl";
    const serverBase = normalizeServerUrl(window.SERVER_URL || localStorage.getItem(storageKey) || getSiteServerCandidate());
    if (!serverBase) {
        return true;
    }

    try {
        for (const apiBase of buildApiBaseCandidates(serverBase)) {
            const response = await fetch(`${apiBase}/auth/session`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (response.ok) {
                return true;
            }
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
                redirectToDedogeiumLogin();
                return false;
            }
        }
    } catch (error) {
        // Keep the page usable if the server is temporarily offline.
    }

    return true;
}

async function fetchServerPlayers() {
    const localPlayers = getLocalLeaderboardPlayers();
    const cachedPlayers = readCachedLeaderboardPlayers();
    const storageKey = window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl";
    const serverBase = normalizeServerUrl(window.SERVER_URL || localStorage.getItem(storageKey) || getSiteServerCandidate());
    const mergedFallbackPlayers = mergeLeaderboardPlayers(cachedPlayers, localPlayers);

    if (!serverBase) {
        if (Object.keys(mergedFallbackPlayers).length) {
            const usingCache = Object.keys(cachedPlayers).length > 0;
            return {
                players: mergedFallbackPlayers,
                sourceLabel: usingCache ? "Shared leaderboard cache + this device" : "This device leaderboard",
                serverAvailable: false,
                mode: usingCache ? "cached" : "local",
                claimsEnabled: true,
                emptyMessage: usingCache
                    ? "No cached leaderboard stats are available for this category yet."
                    : "Play Dedogeium on this device to start filling in the leaderboard.",
            };
        }
        return {
            players: {},
            sourceLabel: "Leaderboard unavailable",
            serverAvailable: false,
            mode: "offline",
            claimsEnabled: false,
            emptyMessage: "Open Dedogeium through a server URL or keep playing here to start tracking leaderboard stats.",
        };
    }

    try {
        const leaderboardCandidates = buildLeaderboardSourceCandidates(serverBase);
        for (const requestUrl of leaderboardCandidates) {
            try {
                const leaderboardResponse = await fetch(requestUrl);
                if (leaderboardResponse.ok) {
                    const payload = await leaderboardResponse.json();
                    const sharedPlayers = getLeaderboardPlayersFromPayload(payload);
                    if (!sharedPlayers) {
                        continue;
                    }
                    writeCachedLeaderboardPlayers(sharedPlayers);
                    return {
                        players: mergeLeaderboardPlayers(cachedPlayers, localPlayers, sharedPlayers),
                        sourceLabel: requestUrl.includes("/api/")
                            ? "Shared SQL leaderboard"
                            : "Shared SQL leaderboard snapshot",
                        serverAvailable: true,
                        mode: "shared",
                        claimsEnabled: true,
                        emptyMessage: "No shared leaderboard stats have been recorded for this category yet.",
                    };
                }
            } catch (error) {
                // Try the next snapshot or API candidate.
            }
        }

        if (Object.keys(cachedPlayers).length) {
            return {
                players: mergedFallbackPlayers,
                sourceLabel: "Shared leaderboard cache",
                serverAvailable: false,
                mode: "cached",
                claimsEnabled: true,
                emptyMessage: "The live server is down, so this page is showing the last synced leaderboard snapshot.",
            };
        }
        if (Object.keys(localPlayers).length) {
            return {
                players: localPlayers,
                sourceLabel: "This device leaderboard",
                serverAvailable: false,
                mode: "local",
                claimsEnabled: true,
                emptyMessage: "The live server is down, so this page is showing only stats from this device.",
            };
        }
        return {
            players: {},
            sourceLabel: "Leaderboard unavailable",
            serverAvailable: false,
            mode: "offline",
            claimsEnabled: false,
            emptyMessage: "The Dedogeium server did not return any leaderboard data.",
        };
    } catch (error) {
        if (Object.keys(cachedPlayers).length) {
            return {
                players: mergedFallbackPlayers,
                sourceLabel: "Shared leaderboard cache",
                serverAvailable: false,
                mode: "cached",
                claimsEnabled: true,
                emptyMessage: "Could not reach the live server, so this page is showing the last synced leaderboard snapshot.",
            };
        }
        if (Object.keys(localPlayers).length) {
            return {
                players: localPlayers,
                sourceLabel: "This device leaderboard",
                serverAvailable: false,
                mode: "local",
                claimsEnabled: true,
                emptyMessage: "Could not reach the live server, so this page is showing only stats from this device.",
            };
        }
        return {
            players: {},
            sourceLabel: "Leaderboard unavailable",
            serverAvailable: false,
            mode: "offline",
            claimsEnabled: false,
            emptyMessage: "Could not reach the Dedogeium leaderboard right now.",
        };
    }
}

function getFinishedPeriodLabel(scope) {
    if (scope === "monthly") return "Last month";
    if (scope === "weekly") return "Last week";
    if (scope === "daily") return "Yesterday";
    return "Finished season";
}

function formatLeaderboardValue(category, value) {
    const numericValue = Number(value) || 0;
    if (category === "time_played") {
        const totalSeconds = Math.max(0, Math.floor(numericValue / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    return numericValue.toLocaleString();
}

function formatLeaderboardReward(reward) {
    if (!reward) return "No reward available";
    const parts = [];
    if (reward.currency) parts.push(`${reward.currency} currency`);
    if (reward.item) parts.push(`${reward.item.rarity} ${reward.item.name}`);
    return `${reward.label}: ${parts.join(" + ")}`;
}

function setClaimStatus(message, isError = false) {
    leaderboardState.claimMessage = message || "";
    leaderboardState.claimError = Boolean(isError);
    if (!leaderboardClaimStatus) return;
    leaderboardClaimStatus.textContent = leaderboardState.claimMessage;
    leaderboardClaimStatus.style.color = leaderboardState.claimError ? "#b91c1c" : "#166534";
}

function renderLeaderboard() {
    if (!window.DedogeiumSystems || !leaderboardList) return;

    const categoryLabel = window.DedogeiumSystems.LEADERBOARD_CATEGORY_DEFINITIONS[leaderboardState.category]
        ? window.DedogeiumSystems.LEADERBOARD_CATEGORY_DEFINITIONS[leaderboardState.category].label
        : leaderboardState.category;
    const scopeLabel = leaderboardState.scope === "all_time"
        ? "All Time"
        : leaderboardState.scope.charAt(0).toUpperCase() + leaderboardState.scope.slice(1);

    const entries = window.DedogeiumSystems.buildLeaderboardEntries(leaderboardState.players, leaderboardState.scope, leaderboardState.category);
    const claimEntries = typeof window.DedogeiumSystems.buildCompletedLeaderboardEntries === "function"
        ? window.DedogeiumSystems.buildCompletedLeaderboardEntries(leaderboardState.players, leaderboardState.scope, leaderboardState.category)
        : [];
    const currentUsername = getCurrentUsername();
    const rankedEntries = entries.filter((entry) => entry.value > 0);
    const currentEntry = currentUsername ? entries.find((entry) => entry.username === currentUsername) : null;
    const finishedEntry = currentUsername ? claimEntries.find((entry) => entry.username === currentUsername) : null;
    const finishedPeriodLabel = getFinishedPeriodLabel(leaderboardState.scope);
    const leaderboardUnavailable = leaderboardState.mode === "offline";
    let visibleEntries = rankedEntries.slice(0, 10);

    if (currentEntry && currentEntry.value > 0 && !visibleEntries.some((entry) => entry.username === currentEntry.username)) {
        visibleEntries = visibleEntries.concat(currentEntry);
    }

    if (leaderboardTableTitle) {
        leaderboardTableTitle.textContent = `${scopeLabel} ${categoryLabel}`;
    }
    if (leaderboardSource) {
        leaderboardSource.textContent = leaderboardState.sourceLabel;
    }

    if (leaderboardUnavailable) {
        if (leaderboardPlayerRank) {
            leaderboardPlayerRank.textContent = "Leaderboard unavailable";
        }
        if (leaderboardPlayerValue) {
            leaderboardPlayerValue.textContent = leaderboardState.emptyMessage;
        }
        if (leaderboardRewardPreview) {
            leaderboardRewardPreview.textContent = "Rewards pay out after finished daily, weekly, and monthly periods.";
        }
        if (leaderboardClaimBtn) {
            leaderboardClaimBtn.disabled = true;
        }
    } else if (currentEntry && currentEntry.value > 0) {
        if (leaderboardPlayerRank) {
            leaderboardPlayerRank.textContent = leaderboardState.serverAvailable
                ? `#${currentEntry.rank} live in ${scopeLabel}`
                : `#${currentEntry.rank} in ${scopeLabel}`;
        }
        if (leaderboardPlayerValue) {
            leaderboardPlayerValue.textContent = `Current ${categoryLabel}: ${formatLeaderboardValue(leaderboardState.category, currentEntry.value)}`;
        }
        if (leaderboardRewardPreview) {
            if (leaderboardState.scope === "all_time") {
                leaderboardRewardPreview.textContent = "All-time is for bragging rights. Rewards only pay out for finished daily, weekly, and monthly races.";
            } else if (finishedEntry && finishedEntry.value > 0) {
                const rewardPreview = window.DedogeiumSystems.getLeaderboardRewardPreview(leaderboardState.scope, finishedEntry.rank);
                leaderboardRewardPreview.textContent = rewardPreview
                    ? `${finishedPeriodLabel}: ${formatLeaderboardReward(rewardPreview)}`
                    : `${finishedPeriodLabel}: outside the reward ranks`;
            } else {
                leaderboardRewardPreview.textContent = `${finishedPeriodLabel}: no tracked reward finish yet`;
            }
        }
        if (leaderboardClaimBtn) {
            const rewardPreview = finishedEntry && finishedEntry.value > 0
                ? window.DedogeiumSystems.getLeaderboardRewardPreview(leaderboardState.scope, finishedEntry.rank)
                : null;
            leaderboardClaimBtn.disabled = !leaderboardState.claimsEnabled || leaderboardState.scope === "all_time" || !rewardPreview;
        }
    } else {
        if (leaderboardPlayerRank) {
            leaderboardPlayerRank.textContent = currentUsername ? "Unranked right now" : "Sign in to compete";
        }
        if (leaderboardPlayerValue) {
            leaderboardPlayerValue.textContent = currentUsername
                ? `Play more to place in ${scopeLabel.toLowerCase()} ${categoryLabel.toLowerCase()}.`
                : "Log in with a username so your stats can be tracked.";
        }
        if (leaderboardRewardPreview) {
            if (leaderboardState.scope === "all_time") {
                leaderboardRewardPreview.textContent = "All-time is for bragging rights only.";
            } else if (finishedEntry && finishedEntry.value > 0) {
                const rewardPreview = window.DedogeiumSystems.getLeaderboardRewardPreview(leaderboardState.scope, finishedEntry.rank);
                leaderboardRewardPreview.textContent = rewardPreview
                    ? `${finishedPeriodLabel}: ${formatLeaderboardReward(rewardPreview)}`
                    : `${finishedPeriodLabel}: outside the reward ranks`;
            } else {
                leaderboardRewardPreview.textContent = `${finishedPeriodLabel}: no reward available`;
            }
        }
        if (leaderboardClaimBtn) {
            const rewardPreview = finishedEntry && finishedEntry.value > 0
                ? window.DedogeiumSystems.getLeaderboardRewardPreview(leaderboardState.scope, finishedEntry.rank)
                : null;
            leaderboardClaimBtn.disabled = !leaderboardState.claimsEnabled || leaderboardState.scope === "all_time" || !rewardPreview;
        }
    }

    leaderboardList.innerHTML = "";
    if (!visibleEntries.length) {
        const empty = document.createElement("div");
        empty.className = "leaderboard-empty";
        empty.textContent = leaderboardState.emptyMessage
            || "No leaderboard stats have been recorded for this category yet.";
        leaderboardList.appendChild(empty);
    } else {
        visibleEntries.forEach((entry) => {
            const entryTitle = getLeaderboardEntryTitle(entry);
            const metaLabel = entry.username === currentUsername
                ? (entryTitle ? `You - ${entryTitle}` : "You")
                : (entryTitle || "Leaderboard contender");
            const row = document.createElement("div");
            row.className = `leaderboard-row ${entry.username === currentUsername ? "is-current-player" : ""}`;
            row.innerHTML = `
                <span class="leaderboard-rank">#${entry.rank}</span>
                <div>
                    <p class="leaderboard-player-name">${escapeLeaderboardText(entry.displayName)}</p>
                    <p class="leaderboard-player-meta">${escapeLeaderboardText(metaLabel)}</p>
                </div>
                <div class="leaderboard-value">${formatLeaderboardValue(leaderboardState.category, entry.value)}</div>
            `;
            leaderboardList.appendChild(row);
        });
    }

    setClaimStatus(leaderboardState.claimMessage, leaderboardState.claimError);
}

async function refreshLeaderboard(message, isError = false) {
    if (!window.DedogeiumSystems) return;
    if (typeof window.DedogeiumSystems.recordCurrentProfileSnapshot === "function") {
        window.DedogeiumSystems.recordCurrentProfileSnapshot();
    }

    const serverPayload = await fetchServerPlayers();
    leaderboardState.players = serverPayload.players || {};
    leaderboardState.sourceLabel = serverPayload.sourceLabel;
    leaderboardState.serverAvailable = Boolean(serverPayload.serverAvailable);
    leaderboardState.mode = serverPayload.mode || "offline";
    leaderboardState.claimsEnabled = Boolean(serverPayload.claimsEnabled);
    leaderboardState.emptyMessage = serverPayload.emptyMessage || "No leaderboard data is available right now.";
    if (message) {
        setClaimStatus(message, isError);
    }
    renderLeaderboard();
}

if (leaderboardScopeButtons.length) {
    leaderboardScopeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            leaderboardState.scope = button.dataset.leaderboardScope || "daily";
            setClaimStatus("", false);
            leaderboardScopeButtons.forEach((entry) => {
                entry.classList.toggle("is-active", entry === button);
            });
            renderLeaderboard();
        });
    });
}

if (leaderboardCategorySelect) {
    leaderboardCategorySelect.addEventListener("change", () => {
        leaderboardState.category = leaderboardCategorySelect.value || "attack";
        setClaimStatus("", false);
        renderLeaderboard();
    });
}

if (leaderboardClaimBtn) {
    leaderboardClaimBtn.addEventListener("click", async () => {
        if (!leaderboardState.claimsEnabled) {
            setClaimStatus("Leaderboard rewards are unavailable until leaderboard data loads.", true);
            return;
        }
        if (leaderboardState.scope === "all_time") {
            setClaimStatus("All-time is a permanent ladder, so it does not have a finished reward payout.", true);
            return;
        }

        const entries = typeof window.DedogeiumSystems.buildCompletedLeaderboardEntries === "function"
            ? window.DedogeiumSystems.buildCompletedLeaderboardEntries(leaderboardState.players, leaderboardState.scope, leaderboardState.category)
            : [];
        const currentEntry = entries.find((entry) => entry.username === getCurrentUsername());
        if (!currentEntry) {
            setClaimStatus(`You do not have a finished ${getFinishedPeriodLabel(leaderboardState.scope).toLowerCase()} placement to claim from yet.`, true);
            return;
        }

        const result = window.DedogeiumSystems.claimLeaderboardReward(leaderboardState.scope, leaderboardState.category, currentEntry.rank);
        if (!result.ok) {
            setClaimStatus(result.error || "Could not claim that leaderboard reward.", true);
            renderLeaderboard();
            return;
        }

        const rewardText = formatLeaderboardReward(result.reward);
        await refreshLeaderboard(`Claimed ${rewardText}.`, false);
    });
}

async function initializeHomePage() {
    const allowed = await requireDedogeiumLogin();
    if (!allowed) return;

    refreshLeaderboard();
    window.setInterval(() => {
        refreshLeaderboard();
    }, 30000);
}

initializeHomePage();

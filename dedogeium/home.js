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
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const leaderboardState = {
    scope: "daily",
    category: "attack",
    players: {},
    sourceLabel: "Loading shared leaderboard...",
    serverAvailable: false,
    claimMessage: "",
    claimError: false,
};

music.loop = true;
music.volume = Math.min(1, Math.max(0, musicVolume / 100));
music.play().catch(() => {});

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

async function fetchServerPlayers() {
    const storageKey = window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl";
    const serverBase = normalizeServerUrl(window.SERVER_URL || localStorage.getItem(storageKey) || getSiteServerCandidate());
    if (!serverBase) {
        return {
            players: {},
            sourceLabel: "Shared leaderboard unavailable",
            serverAvailable: false,
            emptyMessage: "Connect to a Dedogeium server to load the shared leaderboard.",
        };
    }

    try {
        const response = await fetch(`${serverBase}/api/players`);
        if (!response.ok) {
            return {
                players: {},
                sourceLabel: "Shared leaderboard unavailable",
                serverAvailable: false,
                emptyMessage: "The shared Dedogeium server did not return leaderboard data.",
            };
        }
        const players = await response.json();
        return {
            players: players && typeof players === "object" ? players : {},
            sourceLabel: "Shared server leaderboard",
            serverAvailable: true,
            emptyMessage: "No shared leaderboard stats have been recorded for this category yet.",
        };
    } catch (error) {
        return {
            players: {},
            sourceLabel: "Shared leaderboard unavailable",
            serverAvailable: false,
            emptyMessage: "Could not reach the shared Dedogeium server right now.",
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

    if (!leaderboardState.serverAvailable) {
        if (leaderboardPlayerRank) {
            leaderboardPlayerRank.textContent = "Shared leaderboard offline";
        }
        if (leaderboardPlayerValue) {
            leaderboardPlayerValue.textContent = "Open Dedogeium through a server URL to join the shared leaderboard.";
        }
        if (leaderboardRewardPreview) {
            leaderboardRewardPreview.textContent = "Rewards pay out after finished daily, weekly, and monthly periods.";
        }
        if (leaderboardClaimBtn) {
            leaderboardClaimBtn.disabled = true;
        }
    } else if (currentEntry && currentEntry.value > 0) {
        if (leaderboardPlayerRank) {
            leaderboardPlayerRank.textContent = `#${currentEntry.rank} live in ${scopeLabel}`;
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
            leaderboardClaimBtn.disabled = leaderboardState.scope === "all_time" || !rewardPreview;
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
            leaderboardClaimBtn.disabled = leaderboardState.scope === "all_time" || !rewardPreview;
        }
    }

    leaderboardList.innerHTML = "";
    if (!visibleEntries.length) {
        const empty = document.createElement("div");
        empty.className = "leaderboard-empty";
        empty.textContent = leaderboardState.serverAvailable
            ? "No shared leaderboard stats have been recorded for this category yet. Play some levels or arena matches to start filling it in."
            : "The shared leaderboard is unavailable right now.";
        leaderboardList.appendChild(empty);
    } else {
        visibleEntries.forEach((entry) => {
            const row = document.createElement("div");
            row.className = `leaderboard-row ${entry.username === currentUsername ? "is-current-player" : ""}`;
            row.innerHTML = `
                <span class="leaderboard-rank">#${entry.rank}</span>
                <div>
                    <p class="leaderboard-player-name">${entry.displayName}</p>
                    <p class="leaderboard-player-meta">${entry.username === currentUsername ? "You" : "Leaderboard contender"}</p>
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
        if (!leaderboardState.serverAvailable) {
            setClaimStatus("The shared leaderboard is offline right now, so rewards cannot be claimed yet.", true);
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

refreshLeaderboard();
window.setInterval(() => {
    refreshLeaderboard();
}, 30000);

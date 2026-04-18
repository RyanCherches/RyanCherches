(function () {
    const STORAGE_KEY = "dedogeiumProgressionV1";
    const DAILY_REWARD_STORAGE_KEY = "dedogeiumDailyRewardV1";
    const PLAYER_RECORDS_STORAGE_KEY = "dedogeium_players";
    const BASE_EQUIP_SLOTS = 5;
    const MAX_EXTRA_SLOTS = 5;
    const NON_DOGE_SHOP_PRICE_MULTIPLIER = 3;
    const LEADERBOARD_RETENTION_DAYS = 400;
    const LEADERBOARD_TICK_MS = 15000;
    const EXTRA_SLOT_BASE_COST = 2500;
    const USERNAME_STORAGE_KEYS = ["Username", "Uabcd", "username", "playerName"];
    const PASSWORD_STORAGE_KEYS = ["Password", "Pabc", "password", "pass", "pwd"];
    const BOOST_BASE_COSTS = {
        currency: 350,
        luck: 500,
    };
    const PROFILE_STAT_BONUSES = {
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
    const LEADERBOARD_CATEGORY_DEFINITIONS = {
        attack: {
            key: "attack",
            label: "Attack",
            dayKey: "peakAttack",
            allTimeKey: "peakAttack",
            aggregation: "max",
        },
        health: {
            key: "health",
            label: "Health",
            dayKey: "peakHealth",
            allTimeKey: "peakHealth",
            aggregation: "max",
        },
        pvp_wins: {
            key: "pvp_wins",
            label: "Victories vs People",
            dayKey: "victoriesPeople",
            allTimeKey: "victoriesPeople",
            aggregation: "sum",
        },
        computer_wins: {
            key: "computer_wins",
            label: "Victories vs Computer",
            dayKey: "victoriesComputer",
            allTimeKey: "victoriesComputer",
            aggregation: "sum",
        },
        time_played: {
            key: "time_played",
            label: "Time Played",
            dayKey: "timePlayedMs",
            allTimeKey: "timePlayedMs",
            aggregation: "sum",
        },
    };
    const LEADERBOARD_REWARD_TIERS = {
        daily: [
            { maxRank: 1, currency: 150, item: { name: "Doge", rarity: "Rare" }, label: "Daily champion reward" },
            { maxRank: 3, currency: 90, item: { name: "Doge", rarity: "Uncommon" }, label: "Daily podium reward" },
            { maxRank: 10, currency: 45, item: { name: "Doge", rarity: "Common" }, label: "Daily top 10 reward" },
        ],
        weekly: [
            { maxRank: 1, currency: 400, item: { name: "Fire Doge", rarity: "Epic" }, label: "Weekly champion reward" },
            { maxRank: 3, currency: 220, item: { name: "Doge", rarity: "Rare" }, label: "Weekly podium reward" },
            { maxRank: 10, currency: 120, item: { name: "Doge", rarity: "Uncommon" }, label: "Weekly top 10 reward" },
        ],
        monthly: [
            { maxRank: 1, currency: 900, item: { name: "Fire Doge", rarity: "Legendary" }, label: "Monthly champion reward" },
            { maxRank: 3, currency: 500, item: { name: "Doge", rarity: "Epic" }, label: "Monthly podium reward" },
            { maxRank: 10, currency: 250, item: { name: "Doge", rarity: "Rare" }, label: "Monthly top 10 reward" },
        ],
        all_time: [
            { maxRank: 1, currency: 1500, item: { name: "Fire Doge", rarity: "Godly" }, label: "All-time champion reward" },
            { maxRank: 3, currency: 800, item: { name: "Doge", rarity: "Legendary" }, label: "All-time podium reward" },
            { maxRank: 10, currency: 400, item: { name: "Fire Doge", rarity: "Rare" }, label: "All-time top 10 reward" },
        ],
    };
    const BOOST_DEFINITIONS = {
        currency: {
            key: "currency",
            label: "Currency Boost",
            description: "Doubles currency rewards while active.",
            durationMs: 10 * 60 * 1000,
            multiplier: 2,
        },
        luck: {
            key: "luck",
            label: "Luck Boost",
            description: "Shifts drop odds toward better rarities while active.",
            durationMs: 10 * 60 * 1000,
            luckShift: 0.22,
        },
    };
    const DAILY_REWARD_CYCLE = [
        { currency: 25 },
        { currency: 40 },
        { currency: 60, boosts: { currency: 1 } },
        { currency: 80 },
        { currency: 110, boosts: { luck: 1 } },
        { currency: 145 },
        { currency: 200, boosts: { currency: 1, luck: 1 } },
    ];
    let leaderboardTickStarted = false;
    let leaderboardLastTickAt = Date.now();
    const pendingSyncTimers = {};

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getDefaultState() {
        return {
            extraSlots: 0,
            boostInventory: {
                currency: 0,
                luck: 0,
            },
            boostPurchaseCounts: {
                currency: 0,
                luck: 0,
            },
            activeBoosts: {
                currency: {
                    remainingMs: 0,
                    running: false,
                    startedAt: null,
                },
                luck: {
                    remainingMs: 0,
                    running: false,
                    startedAt: null,
                },
            },
        };
    }

    function readRawState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        } catch (error) {
            return null;
        }
    }

    function readDailyRewardState() {
        try {
            return JSON.parse(localStorage.getItem(DAILY_REWARD_STORAGE_KEY) || "null");
        } catch (error) {
            return null;
        }
    }

    function normalizeBoostState(boostState) {
        const safeBoost = boostState && typeof boostState === "object" ? boostState : {};
        return {
            remainingMs: Math.max(0, Math.floor(Number(safeBoost.remainingMs) || 0)),
            running: Boolean(safeBoost.running),
            startedAt: Number.isFinite(Number(safeBoost.startedAt)) ? Number(safeBoost.startedAt) : null,
        };
    }

    function normalizeState(rawState) {
        const fallback = getDefaultState();
        const safeState = rawState && typeof rawState === "object" ? rawState : {};
        return {
            extraSlots: Math.max(0, Math.min(MAX_EXTRA_SLOTS, Math.floor(Number(safeState.extraSlots) || 0))),
            boostInventory: {
                currency: Math.max(0, Math.floor(Number(safeState.boostInventory && safeState.boostInventory.currency) || 0)),
                luck: Math.max(0, Math.floor(Number(safeState.boostInventory && safeState.boostInventory.luck) || 0)),
            },
            boostPurchaseCounts: {
                currency: Math.max(0, Math.floor(Number(safeState.boostPurchaseCounts && safeState.boostPurchaseCounts.currency) || 0)),
                luck: Math.max(0, Math.floor(Number(safeState.boostPurchaseCounts && safeState.boostPurchaseCounts.luck) || 0)),
            },
            activeBoosts: {
                currency: normalizeBoostState(safeState.activeBoosts && safeState.activeBoosts.currency),
                luck: normalizeBoostState(safeState.activeBoosts && safeState.activeBoosts.luck),
            },
            meta: fallback.meta,
        };
    }

    function writeState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function writeDailyRewardState(state) {
        localStorage.setItem(DAILY_REWARD_STORAGE_KEY, JSON.stringify(state));
    }

    function syncBoostState(state, boostKey, now) {
        const boost = state.activeBoosts[boostKey];
        if (!boost.running || !boost.startedAt) {
            boost.running = false;
            boost.startedAt = null;
            return;
        }

        const elapsed = Math.max(0, now - boost.startedAt);
        boost.remainingMs = Math.max(0, boost.remainingMs - elapsed);
        if (boost.remainingMs <= 0) {
            boost.remainingMs = 0;
            boost.running = false;
            boost.startedAt = null;
            return;
        }

        boost.startedAt = now;
    }

    function getSyncedState() {
        const state = normalizeState(readRawState());
        const now = Date.now();
        syncBoostState(state, "currency", now);
        syncBoostState(state, "luck", now);
        writeState(state);
        return state;
    }

    function updateState(mutator) {
        const state = getSyncedState();
        const result = mutator(state) || {};
        writeState(state);
        return {
            state,
            ...result,
        };
    }

    function getBoostDefinition(boostKey) {
        return BOOST_DEFINITIONS[boostKey] || null;
    }

    function getScaledShopPrice(baseCost, purchaseCount) {
        const normalizedBaseCost = Math.max(0, Math.floor(Number(baseCost) || 0));
        const normalizedPurchaseCount = Math.max(0, Math.floor(Number(purchaseCount) || 0));
        return Math.round(normalizedBaseCost * Math.pow(NON_DOGE_SHOP_PRICE_MULTIPLIER, normalizedPurchaseCount));
    }

    function getDefaultDailyRewardState() {
        return {
            lastClaimDate: null,
            streak: 0,
        };
    }

    function normalizeDailyRewardState(rawState) {
        const safeState = rawState && typeof rawState === "object" ? rawState : {};
        const lastClaimDate = typeof safeState.lastClaimDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(safeState.lastClaimDate)
            ? safeState.lastClaimDate
            : null;
        return {
            lastClaimDate,
            streak: Math.max(0, Math.floor(Number(safeState.streak) || 0)),
        };
    }

    function getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDateKey(dateKey) {
        if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            return null;
        }
        const [year, month, day] = dateKey.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function getDayDifference(fromDateKey, toDateKey) {
        const fromDate = parseDateKey(fromDateKey);
        const toDate = parseDateKey(toDateKey);
        if (!fromDate || !toDate) return null;
        return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    }

    function getStartOfNextDay(now = new Date()) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    }

    function getDailyRewardForStreak(streak) {
        const safeStreak = Math.max(1, Math.floor(Number(streak) || 1));
        const cycleIndex = (safeStreak - 1) % DAILY_REWARD_CYCLE.length;
        const reward = deepClone(DAILY_REWARD_CYCLE[cycleIndex]);
        reward.streak = safeStreak;
        reward.dayInCycle = cycleIndex + 1;
        return reward;
    }

    function addCurrencyDirect(amount) {
        const currentCurrency = Number(localStorage.getItem("currency") || "0");
        const nextCurrency = Math.max(0, currentCurrency + Math.round(Number(amount) || 0));
        localStorage.setItem("currency", String(nextCurrency));
        return nextCurrency;
    }

    function grantDailyRewardBoosts(boosts) {
        if (!boosts || typeof boosts !== "object") return;
        Object.entries(boosts).forEach(([boostKey, count]) => {
            const chargeCount = Math.max(0, Math.floor(Number(count) || 0));
            if (!chargeCount) return;
            buyBoostCharge(boostKey, chargeCount);
        });
    }

    function getPendingDailyRewardInfo(state, todayKey) {
        const dayDifference = state.lastClaimDate ? getDayDifference(state.lastClaimDate, todayKey) : null;
        const canClaim = state.lastClaimDate !== todayKey;
        let nextStreak = 1;

        if (canClaim) {
            nextStreak = dayDifference === 1 ? state.streak + 1 : 1;
        } else {
            nextStreak = state.streak + 1;
        }

        return {
            canClaim,
            nextStreak: Math.max(1, nextStreak),
        };
    }

    function formatDuration(ms) {
        const totalSeconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    function isBoostActive(boostKey) {
        const state = getSyncedState();
        const boost = state.activeBoosts[boostKey];
        return Boolean(boost && boost.running && boost.remainingMs > 0);
    }

    function getAdjustedCurrencyReward(amount) {
        const numericAmount = Number(amount || 0);
        if (numericAmount <= 0) return numericAmount;
        if (!isBoostActive("currency")) return Math.round(numericAmount);
        const definition = getBoostDefinition("currency");
        return Math.round(numericAmount * definition.multiplier);
    }

    function getAdjustedRarityWeights(weights) {
        const safeWeights = Array.isArray(weights) ? weights.map((value) => Number(value) || 0) : [];
        if (!safeWeights.length || !isBoostActive("luck")) {
            return safeWeights;
        }

        const shiftRate = getBoostDefinition("luck").luckShift;
        const nextWeights = safeWeights.slice();
        for (let i = 0; i < nextWeights.length - 1; i += 1) {
            const shiftAmount = nextWeights[i] * shiftRate;
            nextWeights[i] -= shiftAmount;
            nextWeights[i + 1] += shiftAmount;
        }
        return nextWeights;
    }

    function getMaxEquipSlots() {
        return BASE_EQUIP_SLOTS + getSyncedState().extraSlots;
    }

    function buyExtraSlot() {
        return updateState((state) => {
            if (state.extraSlots >= MAX_EXTRA_SLOTS) {
                return { ok: false, error: "You already bought the maximum number of extra slots." };
            }
            state.extraSlots += 1;
            return { ok: true };
        });
    }

    function buyBoostCharge(boostKey, count) {
        return updateState((state) => {
            if (!getBoostDefinition(boostKey)) {
                return { ok: false, error: "Unknown boost type." };
            }
            const chargeCount = Math.max(1, Math.floor(Number(count) || 1));
            state.boostInventory[boostKey] += chargeCount;
            state.boostPurchaseCounts[boostKey] = (state.boostPurchaseCounts[boostKey] || 0) + chargeCount;
            return { ok: true };
        });
    }

    function getExtraSlotCost() {
        return getScaledShopPrice(EXTRA_SLOT_BASE_COST, getSyncedState().extraSlots);
    }

    function getBoostChargeCost(boostKey) {
        const baseCost = BOOST_BASE_COSTS[boostKey];
        if (!baseCost) return 0;
        const state = getSyncedState();
        return getScaledShopPrice(baseCost, state.boostPurchaseCounts[boostKey] || 0);
    }

    function startBoost(boostKey) {
        return updateState((state) => {
            const definition = getBoostDefinition(boostKey);
            const boost = state.activeBoosts[boostKey];
            if (!definition || !boost) {
                return { ok: false, error: "Unknown boost type." };
            }
            if (boost.running && boost.remainingMs > 0) {
                return { ok: false, error: `${definition.label} is already running.` };
            }
            if (boost.remainingMs <= 0) {
                if ((state.boostInventory[boostKey] || 0) <= 0) {
                    return { ok: false, error: `You do not have any ${definition.label.toLowerCase()} charges left.` };
                }
                state.boostInventory[boostKey] -= 1;
                boost.remainingMs = definition.durationMs;
            }
            boost.running = true;
            boost.startedAt = Date.now();
            return { ok: true };
        });
    }

    function stopBoost(boostKey) {
        return updateState((state) => {
            const definition = getBoostDefinition(boostKey);
            const boost = state.activeBoosts[boostKey];
            if (!definition || !boost) {
                return { ok: false, error: "Unknown boost type." };
            }
            if (!boost.running) {
                return { ok: false, error: `${definition.label} is not running.` };
            }
            boost.running = false;
            boost.startedAt = null;
            return { ok: true };
        });
    }

    function getProgressionSnapshot() {
        const state = getSyncedState();
        return {
            state: deepClone(state),
            boostDefinitions: deepClone(BOOST_DEFINITIONS),
            baseEquipSlots: BASE_EQUIP_SLOTS,
            maxExtraSlots: MAX_EXTRA_SLOTS,
        };
    }

    function getDailyRewardSnapshot() {
        const state = normalizeDailyRewardState(readDailyRewardState() || getDefaultDailyRewardState());
        const now = new Date();
        const todayKey = getLocalDateKey(now);
        const pendingInfo = getPendingDailyRewardInfo(state, todayKey);
        return {
            state: deepClone(state),
            todayKey,
            canClaim: pendingInfo.canClaim,
            currentStreak: state.streak,
            reward: getDailyRewardForStreak(pendingInfo.nextStreak),
            nextClaimAt: getStartOfNextDay(now),
        };
    }

    function claimDailyReward() {
        const state = normalizeDailyRewardState(readDailyRewardState() || getDefaultDailyRewardState());
        const todayKey = getLocalDateKey();
        const pendingInfo = getPendingDailyRewardInfo(state, todayKey);

        if (!pendingInfo.canClaim) {
            return {
                ok: false,
                error: "You already claimed today's reward.",
                snapshot: getDailyRewardSnapshot(),
            };
        }

        const reward = getDailyRewardForStreak(pendingInfo.nextStreak);
        addCurrencyDirect(reward.currency || 0);
        grantDailyRewardBoosts(reward.boosts);

        state.lastClaimDate = todayKey;
        state.streak = reward.streak;
        writeDailyRewardState(state);

        return {
            ok: true,
            reward: deepClone(reward),
            snapshot: getDailyRewardSnapshot(),
        };
    }

    function getStoredString(keys) {
        const safeKeys = Array.isArray(keys) ? keys : [];
        for (const key of safeKeys) {
            const value = localStorage.getItem(key);
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    }

    function normalizeUsername(value) {
        return String(value || "").trim().toLowerCase();
    }

    function getCurrentUsername() {
        return normalizeUsername(getStoredString(USERNAME_STORAGE_KEYS));
    }

    function getCurrentPassword() {
        return getStoredString(PASSWORD_STORAGE_KEYS);
    }

    function readPlayerRecords() {
        try {
            return JSON.parse(localStorage.getItem(PLAYER_RECORDS_STORAGE_KEY) || "{}");
        } catch (error) {
            return {};
        }
    }

    function writePlayerRecords(players) {
        localStorage.setItem(PLAYER_RECORDS_STORAGE_KEY, JSON.stringify(players));
    }

    function getStoredInventory() {
        try {
            return JSON.parse(localStorage.getItem("inventory") || "[]");
        } catch (error) {
            return [];
        }
    }

    function getStoredEquippedItems() {
        try {
            return JSON.parse(localStorage.getItem("equippedItems") || "[]");
        } catch (error) {
            return [];
        }
    }

    function getProfileItemBonus(item) {
        const itemType = item && item.name === "Fire Doge" ? "Fire Doge" : "Doge";
        const group = PROFILE_STAT_BONUSES[itemType] || {};
        return group[item && item.rarity] || { damage: 0, health: 0 };
    }

    function getCurrentCombatProfile() {
        const username = getCurrentUsername();
        const displayName = getStoredString(["Username", "username", "playerName", "Uabcd"]) || username || "doge";
        const equippedItems = getStoredEquippedItems();
        let attack = 20;
        let health = 500;

        equippedItems.forEach((item) => {
            const bonus = getProfileItemBonus(item);
            attack += bonus.damage;
            health += bonus.health;
        });

        health += Math.max(0, Math.round(Number(localStorage.getItem("playerHP") || localStorage.getItem("totalHP") || localStorage.getItem("hp") || 0) || 0));

        return {
            username,
            displayName,
            attack: Math.max(0, Math.round(attack)),
            health: Math.max(0, Math.round(health)),
            equippedCount: equippedItems.length,
            currency: Math.max(0, Math.round(Number(localStorage.getItem("currency") || "0") || 0)),
            updatedAt: Date.now(),
        };
    }

    function getDefaultLeaderboardDay() {
        return {
            timePlayedMs: 0,
            peakAttack: 0,
            peakHealth: 0,
            victoriesPeople: 0,
            victoriesComputer: 0,
        };
    }

    function getDefaultLeaderboardAllTime() {
        return {
            timePlayedMs: 0,
            peakAttack: 0,
            peakHealth: 0,
            victoriesPeople: 0,
            victoriesComputer: 0,
        };
    }

    function getDefaultLeaderboardState() {
        return {
            updatedAt: null,
            days: {},
            allTime: getDefaultLeaderboardAllTime(),
            claimedRewards: {},
        };
    }

    function normalizeLeaderboardDay(rawDay) {
        const safeDay = rawDay && typeof rawDay === "object" ? rawDay : {};
        return {
            timePlayedMs: Math.max(0, Math.floor(Number(safeDay.timePlayedMs) || 0)),
            peakAttack: Math.max(0, Math.floor(Number(safeDay.peakAttack) || 0)),
            peakHealth: Math.max(0, Math.floor(Number(safeDay.peakHealth) || 0)),
            victoriesPeople: Math.max(0, Math.floor(Number(safeDay.victoriesPeople) || 0)),
            victoriesComputer: Math.max(0, Math.floor(Number(safeDay.victoriesComputer) || 0)),
        };
    }

    function normalizeLeaderboardAllTime(rawAllTime) {
        const safeAllTime = rawAllTime && typeof rawAllTime === "object" ? rawAllTime : {};
        return {
            timePlayedMs: Math.max(0, Math.floor(Number(safeAllTime.timePlayedMs) || 0)),
            peakAttack: Math.max(0, Math.floor(Number(safeAllTime.peakAttack) || 0)),
            peakHealth: Math.max(0, Math.floor(Number(safeAllTime.peakHealth) || 0)),
            victoriesPeople: Math.max(0, Math.floor(Number(safeAllTime.victoriesPeople) || 0)),
            victoriesComputer: Math.max(0, Math.floor(Number(safeAllTime.victoriesComputer) || 0)),
        };
    }

    function pruneLeaderboardDays(days, now = new Date()) {
        const safeDays = days && typeof days === "object" ? days : {};
        const todayKey = getLocalDateKey(now);
        const nextDays = {};
        Object.entries(safeDays).forEach(([dateKey, rawDay]) => {
            const diff = getDayDifference(dateKey, todayKey);
            if (diff === null || diff < 0 || diff >= LEADERBOARD_RETENTION_DAYS) {
                return;
            }
            nextDays[dateKey] = normalizeLeaderboardDay(rawDay);
        });
        return nextDays;
    }

    function normalizeLeaderboardState(rawState) {
        const safeState = rawState && typeof rawState === "object" ? rawState : {};
        return {
            updatedAt: Number.isFinite(Number(safeState.updatedAt)) ? Number(safeState.updatedAt) : null,
            days: pruneLeaderboardDays(safeState.days),
            allTime: normalizeLeaderboardAllTime(safeState.allTime),
            claimedRewards: safeState.claimedRewards && typeof safeState.claimedRewards === "object"
                ? { ...safeState.claimedRewards }
                : {},
        };
    }

    function normalizeProfileStats(rawStats, fallbackUsername) {
        const safeStats = rawStats && typeof rawStats === "object" ? rawStats : {};
        return {
            username: normalizeUsername(safeStats.username || fallbackUsername),
            displayName: String(safeStats.displayName || fallbackUsername || "doge"),
            attack: Math.max(0, Math.floor(Number(safeStats.attack) || 0)),
            health: Math.max(0, Math.floor(Number(safeStats.health) || 0)),
            equippedCount: Math.max(0, Math.floor(Number(safeStats.equippedCount) || 0)),
            currency: Math.max(0, Math.floor(Number(safeStats.currency) || 0)),
            updatedAt: Number.isFinite(Number(safeStats.updatedAt)) ? Number(safeStats.updatedAt) : null,
        };
    }

    function ensurePlayerRecordShape(rawRecord, username) {
        const safeRecord = rawRecord && typeof rawRecord === "object" ? rawRecord : {};
        const safeUsername = normalizeUsername(username || safeRecord.username);
        return {
            ...safeRecord,
            firstSeen: Number.isFinite(Number(safeRecord.firstSeen)) ? Number(safeRecord.firstSeen) : null,
            lastSeen: Number.isFinite(Number(safeRecord.lastSeen)) ? Number(safeRecord.lastSeen) : null,
            visits: Math.max(0, Math.floor(Number(safeRecord.visits) || 0)),
            inventory: Array.isArray(safeRecord.inventory) ? safeRecord.inventory : [],
            password: typeof safeRecord.password === "string" ? safeRecord.password : "",
            profileStats: normalizeProfileStats(safeRecord.profileStats, safeUsername),
            leaderboard: normalizeLeaderboardState(safeRecord.leaderboard),
        };
    }

    function getDayBucket(record, dateKey) {
        const nextDay = normalizeLeaderboardDay(record.leaderboard.days[dateKey]);
        record.leaderboard.days[dateKey] = nextDay;
        return nextDay;
    }

    function applyProfilePeaks(record, dateKey) {
        const day = getDayBucket(record, dateKey);
        const profile = normalizeProfileStats(record.profileStats, record.profileStats && record.profileStats.username);
        day.peakAttack = Math.max(day.peakAttack, profile.attack);
        day.peakHealth = Math.max(day.peakHealth, profile.health);
        record.leaderboard.allTime.peakAttack = Math.max(record.leaderboard.allTime.peakAttack, profile.attack);
        record.leaderboard.allTime.peakHealth = Math.max(record.leaderboard.allTime.peakHealth, profile.health);
        record.profileStats = profile;
        return day;
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
            return Array.from(new Set([
                `${parsed.origin}${path}/api`,
                `${parsed.origin}/api`,
            ]));
        } catch (error) {
            return [`${normalized}/api`];
        }
    }

    function getSyncServerBase() {
        const storageKey = window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl";
        const siteServerBase = normalizeServerUrl(window.DEDOGEIUM_SITE_SERVER_BASE || "");
        const allowOriginServer = typeof window.DEDOGEIUM_ALLOW_ORIGIN_SERVER === "boolean"
            ? window.DEDOGEIUM_ALLOW_ORIGIN_SERVER
            : true;
        const candidates = [
            window.SERVER_URL,
            localStorage.getItem(storageKey),
            siteServerBase,
            allowOriginServer && window.location && window.location.origin && window.location.origin !== "null"
                ? window.location.origin
                : "",
        ];
        for (const candidate of candidates) {
            const normalized = normalizeServerUrl(candidate);
            if (normalized) return normalized;
        }
        return "";
    }

    async function syncPlayerRecordToServer(username, record) {
        const safeUsername = normalizeUsername(username);
        const serverBase = getSyncServerBase();
        if (!safeUsername || !serverBase || typeof fetch !== "function") return false;

        for (const apiBase of buildApiBaseCandidates(serverBase)) {
            try {
                const response = await fetch(`${apiBase}/player`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: safeUsername, player: record }),
                });
                if (response.ok) return true;
            } catch (error) {
                // Try the next API base candidate.
            }
        }
        return false;
    }

    function schedulePlayerRecordSync(username, record) {
        const safeUsername = normalizeUsername(username);
        if (!safeUsername) return;
        if (pendingSyncTimers[safeUsername]) {
            clearTimeout(pendingSyncTimers[safeUsername]);
        }
        pendingSyncTimers[safeUsername] = setTimeout(() => {
            delete pendingSyncTimers[safeUsername];
            syncPlayerRecordToServer(safeUsername, record);
        }, 1200);
    }

    function updateCurrentPlayerRecord(mutator, options = {}) {
        const username = getCurrentUsername();
        if (!username) {
            return { ok: false, error: "No username found for this player yet." };
        }

        const players = readPlayerRecords();
        const record = ensurePlayerRecordShape(players[username], username);
        const now = Date.now();

        if (!record.firstSeen) {
            record.firstSeen = now;
        }
        record.lastSeen = now;
        if (!record.visits) {
            record.visits = 1;
        }

        const password = getCurrentPassword();
        if (password && !record.password) {
            record.password = password;
        }

        record.inventory = getStoredInventory();
        record.profileStats = getCurrentCombatProfile();
        record.leaderboard.allTime.victoriesComputer = Math.max(
            record.leaderboard.allTime.victoriesComputer,
            Math.max(0, (Number(localStorage.getItem("completedLevel") || "0") || 0) - 1)
        );

        const result = typeof mutator === "function" ? (mutator(record, now) || {}) : {};
        if (result.ok === false) {
            return result;
        }

        record.leaderboard.days = pruneLeaderboardDays(record.leaderboard.days, new Date(now));
        record.leaderboard.updatedAt = now;
        record.profileStats.updatedAt = now;
        players[username] = record;
        writePlayerRecords(players);

        if (options.sync !== false) {
            schedulePlayerRecordSync(username, record);
        }

        return {
            ok: true,
            player: deepClone(record),
            players: deepClone(players),
            ...result,
        };
    }

    function recordCurrentProfileSnapshot() {
        return updateCurrentPlayerRecord((record, now) => {
            const dateKey = getLocalDateKey(new Date(now));
            applyProfilePeaks(record, dateKey);
            return { ok: true };
        });
    }

    function recordTimePlayed(ms) {
        const amount = Math.max(0, Math.round(Number(ms) || 0));
        if (!amount) {
            return { ok: false, error: "No time to record." };
        }

        return updateCurrentPlayerRecord((record, now) => {
            const dateKey = getLocalDateKey(new Date(now));
            const day = applyProfilePeaks(record, dateKey);
            day.timePlayedMs += amount;
            record.leaderboard.allTime.timePlayedMs += amount;
            return { ok: true };
        });
    }

    function recordComputerVictory() {
        return updateCurrentPlayerRecord((record, now) => {
            const dateKey = getLocalDateKey(new Date(now));
            const day = applyProfilePeaks(record, dateKey);
            day.victoriesComputer += 1;
            record.leaderboard.allTime.victoriesComputer += 1;
            return { ok: true };
        });
    }

    function recordPvpVictory() {
        return updateCurrentPlayerRecord((record, now) => {
            const dateKey = getLocalDateKey(new Date(now));
            const day = applyProfilePeaks(record, dateKey);
            day.victoriesPeople += 1;
            record.leaderboard.allTime.victoriesPeople += 1;
            return { ok: true };
        });
    }

    function getStartOfWeek(date = new Date()) {
        const dayIndex = date.getDay();
        const normalized = dayIndex === 0 ? 6 : dayIndex - 1;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - normalized);
    }

    function getStartOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function getEndOfWeek(date = new Date()) {
        const start = getStartOfWeek(date);
        return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    }

    function getEndOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    function getDateKeysBetween(startDate, endDate) {
        const keys = [];
        const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        while (cursor.getTime() <= last.getTime()) {
            keys.push(getLocalDateKey(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        return keys;
    }

    function getLeaderboardPeriodBounds(scope, now = new Date()) {
        const safeScope = String(scope || "daily").toLowerCase();
        const safeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (safeScope === "all_time") return null;
        if (safeScope === "monthly") {
            return {
                start: getStartOfMonth(safeDate),
                end: getEndOfMonth(safeDate),
            };
        }
        if (safeScope === "weekly") {
            return {
                start: getStartOfWeek(safeDate),
                end: getEndOfWeek(safeDate),
            };
        }
        return {
            start: safeDate,
            end: safeDate,
        };
    }

    function getDateKeysForScope(scope, now = new Date()) {
        const bounds = getLeaderboardPeriodBounds(scope, now);
        if (!bounds) return [];
        return getDateKeysBetween(bounds.start, bounds.end);
    }

    function getLeaderboardPeriodKey(scope, now = new Date()) {
        const safeScope = String(scope || "daily").toLowerCase();
        if (safeScope === "all_time") return "all-time";
        if (safeScope === "monthly") {
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }
        if (safeScope === "weekly") {
            return getLocalDateKey(getStartOfWeek(now));
        }
        return getLocalDateKey(now);
    }

    function getCompletedLeaderboardReferenceDate(scope, now = new Date()) {
        const safeScope = String(scope || "daily").toLowerCase();
        const safeNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (safeScope === "all_time") return null;
        if (safeScope === "monthly") {
            return new Date(safeNow.getFullYear(), safeNow.getMonth() - 1, 1);
        }
        if (safeScope === "weekly") {
            const currentWeekStart = getStartOfWeek(safeNow);
            return new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - 1);
        }
        return new Date(safeNow.getFullYear(), safeNow.getMonth(), safeNow.getDate() - 1);
    }

    function getCompletedLeaderboardPeriodKey(scope, now = new Date()) {
        const referenceDate = getCompletedLeaderboardReferenceDate(scope, now);
        if (!referenceDate) return "";
        return getLeaderboardPeriodKey(scope, referenceDate);
    }

    function getLeaderboardMetricValueForRecord(record, scope, category, now = new Date()) {
        const definition = LEADERBOARD_CATEGORY_DEFINITIONS[category];
        if (!definition) return 0;
        const safeRecord = ensurePlayerRecordShape(record, record && record.profileStats && record.profileStats.username);

        if (String(scope || "").toLowerCase() === "all_time") {
            return Number(safeRecord.leaderboard.allTime[definition.allTimeKey] || 0);
        }

        const values = getDateKeysForScope(scope, now).map((dateKey) => {
            const day = safeRecord.leaderboard.days[dateKey];
            return Number(day && day[definition.dayKey] ? day[definition.dayKey] : 0);
        });

        if (definition.aggregation === "max") {
            return values.reduce((maxValue, value) => Math.max(maxValue, value), 0);
        }

        return values.reduce((sum, value) => sum + value, 0);
    }

    function buildLeaderboardEntries(playerMap, scope, category, now = new Date()) {
        const safePlayers = playerMap && typeof playerMap === "object" ? playerMap : {};
        return Object.entries(safePlayers)
            .map(([username, record]) => {
                const safeRecord = ensurePlayerRecordShape(record, username);
                return {
                    username,
                    displayName: safeRecord.profileStats.displayName || username,
                    value: getLeaderboardMetricValueForRecord(safeRecord, scope, category, now),
                    record: safeRecord,
                };
            })
            .sort((left, right) => {
                if (right.value !== left.value) return right.value - left.value;
                return String(left.displayName).localeCompare(String(right.displayName));
            })
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));
    }

    function buildCompletedLeaderboardEntries(playerMap, scope, category, now = new Date()) {
        const referenceDate = getCompletedLeaderboardReferenceDate(scope, now);
        if (!referenceDate) return [];
        return buildLeaderboardEntries(playerMap, scope, category, referenceDate);
    }

    function getLeaderboardRewardPreview(scope, rank) {
        const safeScope = String(scope || "daily").toLowerCase();
        if (safeScope === "all_time") return null;
        const safeRank = Math.max(1, Math.floor(Number(rank) || 0));
        if (!safeRank) return null;
        const tiers = LEADERBOARD_REWARD_TIERS[safeScope] || [];
        const tier = tiers.find((candidate) => safeRank <= candidate.maxRank);
        return tier ? deepClone(tier) : null;
    }

    function createInventoryRewardItem(template) {
        return {
            ...template,
            id: Date.now() + Math.floor(Math.random() * 1000),
        };
    }

    function claimLeaderboardReward(scope, category, rank) {
        const safeScope = String(scope || "daily").toLowerCase();
        const safeCategory = String(category || "attack").toLowerCase();
        if (safeScope === "all_time") {
            return { ok: false, error: "All-time standings do not pay out rewards because that ladder never ends." };
        }
        const reward = getLeaderboardRewardPreview(safeScope, rank);

        if (!reward) {
            return { ok: false, error: "You were outside the reward ranks for the last completed leaderboard period." };
        }

        return updateCurrentPlayerRecord((record, now) => {
            const periodKey = getCompletedLeaderboardPeriodKey(safeScope, new Date(now));
            if (!periodKey) {
                return { ok: false, error: "That leaderboard reward is not ready to claim yet." };
            }
            const claimKey = `${safeScope}:${safeCategory}:${periodKey}`;
            if (record.leaderboard.claimedRewards[claimKey]) {
                return { ok: false, error: "You already claimed this reward for the last finished leaderboard period." };
            }

            addCurrencyDirect(reward.currency || 0);

            const inventory = getStoredInventory();
            const grantedItems = reward.item ? [createInventoryRewardItem(reward.item)] : [];
            grantedItems.forEach((item) => inventory.push(item));
            localStorage.setItem("inventory", JSON.stringify(inventory));
            record.inventory = inventory;
            record.leaderboard.claimedRewards[claimKey] = now;

            return {
                ok: true,
                reward: {
                    ...reward,
                    rank: Math.max(1, Math.floor(Number(rank) || 0)),
                    claimKey,
                    items: deepClone(grantedItems),
                },
            };
        });
    }

    function getCurrentPlayerRecord() {
        const username = getCurrentUsername();
        if (!username) return null;
        const players = readPlayerRecords();
        if (!players[username]) return null;
        return deepClone(ensurePlayerRecordShape(players[username], username));
    }

    function startLeaderboardTracking() {
        if (leaderboardTickStarted || typeof window === "undefined") return;
        leaderboardTickStarted = true;
        leaderboardLastTickAt = Date.now();
        recordCurrentProfileSnapshot();

        const tick = () => {
            const now = Date.now();
            if (typeof document !== "undefined" && document.hidden) {
                leaderboardLastTickAt = now;
                return;
            }
            const delta = Math.min(LEADERBOARD_TICK_MS, Math.max(0, now - leaderboardLastTickAt));
            leaderboardLastTickAt = now;
            if (delta > 0) {
                recordTimePlayed(delta);
            } else {
                recordCurrentProfileSnapshot();
            }
        };

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", () => {
                if (!document.hidden) {
                    leaderboardLastTickAt = Date.now();
                    recordCurrentProfileSnapshot();
                } else {
                    leaderboardLastTickAt = Date.now();
                }
            });
        }

        window.addEventListener("beforeunload", () => {
            const now = Date.now();
            const delta = Math.min(LEADERBOARD_TICK_MS, Math.max(0, now - leaderboardLastTickAt));
            leaderboardLastTickAt = now;
            if (delta > 0) {
                recordTimePlayed(delta);
            }
        });

        window.setInterval(tick, LEADERBOARD_TICK_MS);
    }

    window.DedogeiumSystems = {
        STORAGE_KEY,
        DAILY_REWARD_STORAGE_KEY,
        PLAYER_RECORDS_STORAGE_KEY,
        BOOST_DEFINITIONS: deepClone(BOOST_DEFINITIONS),
        DAILY_REWARD_CYCLE: deepClone(DAILY_REWARD_CYCLE),
        LEADERBOARD_CATEGORY_DEFINITIONS: deepClone(LEADERBOARD_CATEGORY_DEFINITIONS),
        LEADERBOARD_REWARD_TIERS: deepClone(LEADERBOARD_REWARD_TIERS),
        NON_DOGE_SHOP_PRICE_MULTIPLIER,
        EXTRA_SLOT_BASE_COST,
        BOOST_BASE_COSTS: deepClone(BOOST_BASE_COSTS),
        BASE_EQUIP_SLOTS,
        MAX_EXTRA_SLOTS,
        getProgressionSnapshot,
        getDailyRewardSnapshot,
        claimDailyReward,
        getAdjustedCurrencyReward,
        getAdjustedRarityWeights,
        getMaxEquipSlots,
        getExtraSlotCost,
        getBoostChargeCost,
        isBoostActive,
        buyExtraSlot,
        buyBoostCharge,
        startBoost,
        stopBoost,
        formatDuration,
        getCurrentUsername,
        getCurrentCombatProfile,
        getCurrentPlayerRecord,
        readPlayerRecords,
        recordCurrentProfileSnapshot,
        recordTimePlayed,
        recordComputerVictory,
        recordPvpVictory,
        getDateKeysForScope,
        getLeaderboardPeriodKey,
        getCompletedLeaderboardReferenceDate,
        getCompletedLeaderboardPeriodKey,
        getLeaderboardMetricValueForRecord,
        buildLeaderboardEntries,
        buildCompletedLeaderboardEntries,
        getLeaderboardRewardPreview,
        claimLeaderboardReward,
    };

    startLeaderboardTracking();
})();

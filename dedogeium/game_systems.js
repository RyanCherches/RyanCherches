(function () {
    const STORAGE_KEY = "dedogeiumProgressionV1";
    const DAILY_REWARD_STORAGE_KEY = "dedogeiumDailyRewardV1";
    const BASE_EQUIP_SLOTS = 5;
    const MAX_EXTRA_SLOTS = 5;
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
            return { ok: true };
        });
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

    window.DedogeiumSystems = {
        STORAGE_KEY,
        DAILY_REWARD_STORAGE_KEY,
        BOOST_DEFINITIONS: deepClone(BOOST_DEFINITIONS),
        DAILY_REWARD_CYCLE: deepClone(DAILY_REWARD_CYCLE),
        BASE_EQUIP_SLOTS,
        MAX_EXTRA_SLOTS,
        getProgressionSnapshot,
        getDailyRewardSnapshot,
        claimDailyReward,
        getAdjustedCurrencyReward,
        getAdjustedRarityWeights,
        getMaxEquipSlots,
        isBoostActive,
        buyExtraSlot,
        buyBoostCharge,
        startBoost,
        stopBoost,
        formatDuration,
    };
})();

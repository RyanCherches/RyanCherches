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
    const AUTH_TOKEN_STORAGE_KEY = "dedogeiumAuthToken";
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
        "Soccer Ball": {
            "Common": { damage: 2, health: 120 },
            "Uncommon": { damage: 4, health: 180 },
            "Rare": { damage: 7, health: 260 },
            "Epic": { damage: 11, health: 360 },
            "Legendary": { damage: 16, health: 500 },
            "Godly": { damage: 24, health: 700 },
            "Mythic": { damage: 30, health: 850 },
        },
    };
    const LEVEL_BATTLE_CONFIGS = {
        1: {
            ability: {
                name: "Resolve Pulse",
                variant: "pulse",
                primaryColor: "#88ffc5",
                secondaryColor: "#ffe28c",
                accentColor: "#f7fff8",
                firstTurn: 2,
                cooldown: 3,
                damageMultiplier: 1.18,
                healPercent: 0.08,
                nextPlayerDamageMultiplier: 0.88,
            },
        },
        2: {
            ability: {
                name: "Ember Tackle",
                variant: "arc",
                primaryColor: "#ff874f",
                secondaryColor: "#ffd36a",
                accentColor: "#fff3de",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.34,
                enemyDamageBoost: 6,
            },
        },
        3: {
            ability: {
                name: "Phantom Drift",
                variant: "storm",
                primaryColor: "#78d7ff",
                secondaryColor: "#9189ff",
                accentColor: "#eef7ff",
                firstTurn: 3,
                cooldown: 2,
                damageMultiplier: 1.15,
                nextPlayerDamageMultiplier: 0.74,
            },
        },
        4: {
            ability: {
                name: "Prism Nova",
                variant: "nova",
                primaryColor: "#ff7a59",
                secondaryColor: "#82ffe4",
                accentColor: "#fff6a8",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.42,
                healPercent: 0.1,
            },
        },
        5: {
            ability: {
                name: "Pack Mirage",
                variant: "storm",
                primaryColor: "#9af4ff",
                secondaryColor: "#f2f4ff",
                accentColor: "#7effb8",
                firstTurn: 2,
                cooldown: 3,
                damageMultiplier: 1.28,
                nextPlayerDamageMultiplier: 0.82,
            },
        },
        6: {
            ability: {
                name: "Flame Wheel",
                variant: "arc",
                primaryColor: "#ff6138",
                secondaryColor: "#ffcb53",
                accentColor: "#fff6da",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.4,
                enemyDamageBoost: 10,
            },
        },
        7: {
            ability: {
                name: "Inferno Stampede",
                variant: "storm",
                primaryColor: "#ff5132",
                secondaryColor: "#ffbf40",
                accentColor: "#ffe9cf",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.56,
                flatDamage: 28,
            },
        },
        8: {
            ability: {
                name: "Apex Supernova",
                variant: "nova",
                primaryColor: "#ff6565",
                secondaryColor: "#ffd257",
                accentColor: "#fefeff",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.78,
                healPercent: 0.12,
                enemyDamageBoost: 18,
            },
        },
        9: {
            ability: {
                name: "Curve Shot",
                variant: "arc",
                primaryColor: "#8dff84",
                secondaryColor: "#ffffff",
                accentColor: "#2f2f2f",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.55,
                nextPlayerDamageMultiplier: 0.78,
            },
        },
        10: {
            ability: {
                name: "Rocket Tackle",
                variant: "storm",
                primaryColor: "#d1ff5b",
                secondaryColor: "#f3fff8",
                accentColor: "#202020",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.72,
                enemyDamageBoost: 14,
            },
        },
        11: {
            ability: {
                name: "Captain's Whistle",
                variant: "pulse",
                primaryColor: "#72f7ff",
                secondaryColor: "#ffd76a",
                accentColor: "#ffffff",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 1.48,
                healPercent: 0.16,
                nextPlayerDamageMultiplier: 0.74,
            },
        },
        12: {
            ability: {
                name: "Meteor Bicycle Kick",
                variant: "nova",
                primaryColor: "#fff0b8",
                secondaryColor: "#8dff84",
                accentColor: "#1d1d1d",
                firstTurn: 2,
                cooldown: 2,
                damageMultiplier: 2.05,
                flatDamage: 48,
                enemyDamageBoost: 20,
            },
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
    const SKILL_STATE_STORAGE_KEY = "dedogeiumSkillStateV1";
    const SKILL_MODE_OPTIONS = ["auto", "manual"];
    const SKILL_UPGRADE_COST_MULTIPLIER = 1.55;
    const SKILL_CATALOG = [
        {
            id: "healing_pulse",
            label: "Healing Pulse",
            description: "Restore a chunk of your health when the fight gets rough.",
            kind: "heal",
            cost: 220,
            upgradeBaseCost: 180,
            maxLevel: 5,
            unlockTurn: 2,
            healAmount: 140,
            healAmountPerLevel: 55,
        },
        {
            id: "iron_guard",
            label: "Iron Guard",
            description: "Brace yourself and cut the next enemy hit down hard.",
            kind: "shield",
            cost: 520,
            upgradeBaseCost: 280,
            maxLevel: 4,
            unlockTurn: 2,
            enemyMultiplier: 0.45,
            enemyMultiplierPerLevel: -0.07,
        },
        {
            id: "rage_drive",
            label: "Rage Drive",
            description: "Charge your next strike with a heavy damage boost.",
            kind: "empower",
            cost: 980,
            upgradeBaseCost: 420,
            maxLevel: 5,
            unlockTurn: 3,
            bonusDamage: 150,
            bonusDamagePerLevel: 75,
        },
        {
            id: "blood_fang",
            label: "Blood Fang",
            description: "Prime your next strike to siphon health from the damage it deals.",
            kind: "lifesteal",
            cost: 1450,
            upgradeBaseCost: 520,
            maxLevel: 4,
            unlockTurn: 4,
            lifestealPercent: 5,
            lifestealPercentPerLevel: 5,
        },
        {
            id: "phoenix_core",
            label: "Phoenix Core",
            description: "A rare late-fight surge that heals you and powers the next swing.",
            kind: "hybrid",
            cost: 2200,
            upgradeBaseCost: 880,
            maxLevel: 4,
            unlockTurn: 5,
            healAmount: 200,
            healAmountPerLevel: 70,
            bonusDamage: 240,
            bonusDamagePerLevel: 85,
        },
    ];
    const DEFAULT_AUTO_SKILL_SETTINGS = {
        aggression: "balanced",
        healThreshold: 45,
        guardThreshold: 55,
        finisherThreshold: 32,
        maxAutoSkillsPerBattle: 2,
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

    function getSkillDefinition(skillId) {
        return SKILL_CATALOG.find((skill) => skill.id === skillId) || null;
    }

    function getDefaultSkillState() {
        return {
            mode: "auto",
            ownedSkills: [],
            skillLevels: {},
            manualLoadout: [],
            autoSettings: { ...DEFAULT_AUTO_SKILL_SETTINGS },
            autoRules: {},
        };
    }

    function readRawSkillState() {
        try {
            return JSON.parse(localStorage.getItem(SKILL_STATE_STORAGE_KEY) || "null");
        } catch (error) {
            return null;
        }
    }

    function normalizeSkillMode(mode) {
        return SKILL_MODE_OPTIONS.includes(mode) ? mode : "auto";
    }

    function clampPercent(value, fallback) {
        return Math.max(0, Math.min(100, Math.round(Number.isFinite(Number(value)) ? Number(value) : fallback)));
    }

    function clampPositiveInt(value, fallback, max = 99) {
        return Math.max(0, Math.min(max, Math.round(Number.isFinite(Number(value)) ? Number(value) : fallback)));
    }

    function getSkillMaxLevel(definition) {
        return Math.max(1, clampPositiveInt(definition && definition.maxLevel, 1, 10));
    }

    function getSkillKindLabel(kind) {
        if (kind === "heal") return "Heal";
        if (kind === "shield") return "Shield";
        if (kind === "empower") return "Damage";
        if (kind === "lifesteal") return "Lifesteal";
        return "Hybrid";
    }

    function scaleSkillValue(baseValue, perLevel, level, options = {}) {
        const safeBaseValue = Number(baseValue);
        if (!Number.isFinite(safeBaseValue)) return 0;
        const safePerLevel = Number.isFinite(Number(perLevel)) ? Number(perLevel) : 0;
        const safeLevel = Math.max(1, Math.round(Number(level) || 1));
        let nextValue = safeBaseValue + (safePerLevel * (safeLevel - 1));
        if (Number.isFinite(Number(options.min))) {
            nextValue = Math.max(Number(options.min), nextValue);
        }
        if (Number.isFinite(Number(options.max))) {
            nextValue = Math.min(Number(options.max), nextValue);
        }
        if (Number.isFinite(Number(options.precision))) {
            nextValue = Number(nextValue.toFixed(Number(options.precision)));
        } else {
            nextValue = Math.round(nextValue);
        }
        return nextValue;
    }

    function joinSkillPhrases(parts) {
        if (!parts.length) return "";
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
        return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
    }

    function sentenceCase(text) {
        if (!text) return "";
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    }

    function getSkillEffectSummary(skill) {
        const parts = [];
        if (Number(skill.healAmount || 0) > 0) {
            parts.push(`restore ${skill.healAmount} health`);
        }
        if (Number(skill.enemyMultiplier || 0) > 0 && Number(skill.enemyMultiplier || 0) < 1) {
            parts.push(`cut the next enemy hit to ${Math.round(Number(skill.enemyMultiplier) * 100)}% damage`);
        }
        if (Number(skill.bonusDamage || 0) > 0) {
            parts.push(`add +${skill.bonusDamage} damage to the next strike`);
        }
        if (Number(skill.lifestealPercent || 0) > 0) {
            parts.push(`steal ${skill.lifestealPercent}% of damage dealt as health on the next strike`);
        }
        return parts.length ? `${sentenceCase(joinSkillPhrases(parts))}.` : "No combat effect.";
    }

    function resolveSkillDefinition(skillOrId, level = 1) {
        const definition = typeof skillOrId === "string" ? getSkillDefinition(skillOrId) : skillOrId;
        if (!definition) return null;
        const maxLevel = getSkillMaxLevel(definition);
        const safeLevel = Math.max(1, Math.min(maxLevel, clampPositiveInt(level, 1, maxLevel)));
        const resolved = {
            ...definition,
            level: safeLevel,
            maxLevel,
            healAmount: Number.isFinite(Number(definition.healAmount))
                ? scaleSkillValue(definition.healAmount, definition.healAmountPerLevel, safeLevel, { min: 0 })
                : 0,
            enemyMultiplier: Number.isFinite(Number(definition.enemyMultiplier))
                ? scaleSkillValue(definition.enemyMultiplier, definition.enemyMultiplierPerLevel, safeLevel, { min: 0.12, max: 1, precision: 2 })
                : null,
            bonusDamage: Number.isFinite(Number(definition.bonusDamage))
                ? scaleSkillValue(definition.bonusDamage, definition.bonusDamagePerLevel, safeLevel, { min: 0 })
                : 0,
            lifestealPercent: Number.isFinite(Number(definition.lifestealPercent))
                ? scaleSkillValue(definition.lifestealPercent, definition.lifestealPercentPerLevel, safeLevel, { min: 0, max: 100 })
                : 0,
        };
        resolved.kindLabel = getSkillKindLabel(resolved.kind);
        resolved.effectSummary = getSkillEffectSummary(resolved);
        return resolved;
    }

    function getOwnedSkillLevel(state, skillId, definition = getSkillDefinition(skillId)) {
        if (!definition || !state || !Array.isArray(state.ownedSkills) || !state.ownedSkills.includes(skillId)) {
            return 0;
        }
        const maxLevel = getSkillMaxLevel(definition);
        return Math.max(1, Math.min(maxLevel, clampPositiveInt(state.skillLevels && state.skillLevels[skillId], 1, maxLevel)));
    }

    function getResolvedOwnedSkillDefinition(state, skillId) {
        const definition = getSkillDefinition(skillId);
        if (!definition) return null;
        const level = getOwnedSkillLevel(state, skillId, definition);
        if (!level) return null;
        return resolveSkillDefinition(definition, level);
    }

    function getSkillUpgradeCost(skillOrId, currentLevel) {
        const definition = typeof skillOrId === "string" ? getSkillDefinition(skillOrId) : skillOrId;
        if (!definition) return null;
        const maxLevel = getSkillMaxLevel(definition);
        const safeCurrentLevel = Math.max(1, Math.min(maxLevel, clampPositiveInt(currentLevel, 1, maxLevel)));
        if (safeCurrentLevel >= maxLevel) return null;
        const baseCost = Math.max(1, Math.round(Number(definition.upgradeBaseCost) || Math.max(120, Number(definition.cost || 0) * 0.7)));
        return Math.round(baseCost * Math.pow(SKILL_UPGRADE_COST_MULTIPLIER, safeCurrentLevel - 1));
    }

    function buildSkillCatalogSnapshot(state) {
        return SKILL_CATALOG.map((definition) => {
            const owned = state.ownedSkills.includes(definition.id);
            const currentLevel = owned ? getOwnedSkillLevel(state, definition.id, definition) : 0;
            const currentSkill = resolveSkillDefinition(definition, currentLevel || 1);
            const nextSkill = owned && currentLevel < currentSkill.maxLevel
                ? resolveSkillDefinition(definition, currentLevel + 1)
                : null;
            return {
                ...currentSkill,
                owned,
                currentLevel,
                isMaxLevel: owned && currentLevel >= currentSkill.maxLevel,
                nextLevel: nextSkill ? nextSkill.level : null,
                nextUpgradeCost: nextSkill ? getSkillUpgradeCost(definition, currentLevel) : null,
                nextEffectSummary: nextSkill ? nextSkill.effectSummary : "",
            };
        });
    }

    function normalizeSkillRule(rawRule, definition) {
        const safeRule = rawRule && typeof rawRule === "object" ? rawRule : {};
        return {
            enabled: safeRule.enabled !== false,
            minTurn: Math.max(definition.unlockTurn, clampPositiveInt(safeRule.minTurn, definition.unlockTurn, 20)),
            hpThreshold: clampPercent(safeRule.hpThreshold, definition.kind === "shield" ? 60 : 45),
        };
    }

    function normalizeSkillState(rawState) {
        const fallback = getDefaultSkillState();
        const safeState = rawState && typeof rawState === "object" ? rawState : {};
        const ownedSkills = Array.isArray(safeState.ownedSkills)
            ? Array.from(new Set(safeState.ownedSkills.filter((skillId) => Boolean(getSkillDefinition(skillId)))))
            : [];
        const skillLevels = {};
        const autoRules = {};
        ownedSkills.forEach((skillId) => {
            const definition = getSkillDefinition(skillId);
            skillLevels[skillId] = Math.max(1, Math.min(getSkillMaxLevel(definition), clampPositiveInt(safeState.skillLevels && safeState.skillLevels[skillId], 1, getSkillMaxLevel(definition))));
            autoRules[skillId] = normalizeSkillRule(safeState.autoRules && safeState.autoRules[skillId], definition);
        });

        return {
            mode: normalizeSkillMode(safeState.mode),
            ownedSkills,
            skillLevels,
            manualLoadout: Array.isArray(safeState.manualLoadout)
                ? Array.from(new Set(safeState.manualLoadout.filter((skillId) => ownedSkills.includes(skillId)))).slice(0, 3)
                : [],
            autoSettings: {
                aggression: ["balanced", "aggressive", "emergency"].includes(safeState.autoSettings && safeState.autoSettings.aggression)
                    ? safeState.autoSettings.aggression
                    : fallback.autoSettings.aggression,
                healThreshold: clampPercent(safeState.autoSettings && safeState.autoSettings.healThreshold, fallback.autoSettings.healThreshold),
                guardThreshold: clampPercent(safeState.autoSettings && safeState.autoSettings.guardThreshold, fallback.autoSettings.guardThreshold),
                finisherThreshold: clampPercent(safeState.autoSettings && safeState.autoSettings.finisherThreshold, fallback.autoSettings.finisherThreshold),
                maxAutoSkillsPerBattle: Math.max(1, clampPositiveInt(safeState.autoSettings && safeState.autoSettings.maxAutoSkillsPerBattle, fallback.autoSettings.maxAutoSkillsPerBattle, 6)),
            },
            autoRules,
        };
    }

    function writeSkillState(state) {
        localStorage.setItem(SKILL_STATE_STORAGE_KEY, JSON.stringify(state));
    }

    function getStoredCurrencyAmount() {
        return Math.max(0, Math.round(Number(localStorage.getItem("currency") || "0") || 0));
    }

    function setStoredCurrencyAmount(amount) {
        localStorage.setItem("currency", String(Math.max(0, Math.round(Number(amount) || 0))));
    }

    function getSkillStateSnapshot() {
        const state = normalizeSkillState(readRawSkillState());
        writeSkillState(state);
        return {
            state: deepClone(state),
            catalog: buildSkillCatalogSnapshot(state),
        };
    }

    function updateSkillState(mutator) {
        const state = normalizeSkillState(readRawSkillState());
        const result = typeof mutator === "function" ? (mutator(state) || {}) : {};
        if (result && result.ok === false) {
            return {
                ...result,
                state: deepClone(state),
                catalog: buildSkillCatalogSnapshot(state),
            };
        }
        writeSkillState(state);
        return {
            ok: true,
            state: deepClone(state),
            catalog: buildSkillCatalogSnapshot(state),
            ...result,
        };
    }

    function buySkill(skillId) {
        return updateSkillState((state) => {
            const definition = getSkillDefinition(skillId);
            if (!definition) {
                return { ok: false, error: "That skill does not exist." };
            }
            if (state.ownedSkills.includes(skillId)) {
                return { ok: false, error: "You already bought that skill." };
            }
            const currentCurrency = getStoredCurrencyAmount();
            if (currentCurrency < definition.cost) {
                return { ok: false, error: "Not enough currency." };
            }

            setStoredCurrencyAmount(currentCurrency - definition.cost);
            state.ownedSkills.push(skillId);
            state.skillLevels[skillId] = 1;
            state.autoRules[skillId] = normalizeSkillRule({}, definition);
            if (state.manualLoadout.length < 3) {
                state.manualLoadout.push(skillId);
            }
            return {
                purchasedSkillId: skillId,
                spentCurrency: definition.cost,
                currency: getStoredCurrencyAmount(),
            };
        });
    }

    function upgradeSkill(skillId) {
        return updateSkillState((state) => {
            if (!state.ownedSkills.includes(skillId)) {
                return { ok: false, error: "Buy that skill first." };
            }
            const definition = getSkillDefinition(skillId);
            if (!definition) {
                return { ok: false, error: "That skill does not exist." };
            }
            const currentLevel = getOwnedSkillLevel(state, skillId, definition);
            const nextCost = getSkillUpgradeCost(definition, currentLevel);
            if (!nextCost) {
                return { ok: false, error: "That skill is already maxed out." };
            }
            const currentCurrency = getStoredCurrencyAmount();
            if (currentCurrency < nextCost) {
                return { ok: false, error: "Not enough currency." };
            }

            setStoredCurrencyAmount(currentCurrency - nextCost);
            state.skillLevels[skillId] = currentLevel + 1;
            return {
                upgradedSkillId: skillId,
                newLevel: state.skillLevels[skillId],
                spentCurrency: nextCost,
                currency: getStoredCurrencyAmount(),
            };
        });
    }

    function setSkillMode(mode) {
        return updateSkillState((state) => {
            state.mode = normalizeSkillMode(mode);
            return { mode: state.mode };
        });
    }

    function setManualSkillLoadout(loadout) {
        return updateSkillState((state) => {
            const nextLoadout = Array.isArray(loadout)
                ? Array.from(new Set(loadout.filter((skillId) => state.ownedSkills.includes(skillId)))).slice(0, 3)
                : [];
            state.manualLoadout = nextLoadout;
            return { manualLoadout: deepClone(nextLoadout) };
        });
    }

    function updateAutoSkillSettings(patch) {
        return updateSkillState((state) => {
            const safePatch = patch && typeof patch === "object" ? patch : {};
            if (safePatch.aggression) {
                state.autoSettings.aggression = ["balanced", "aggressive", "emergency"].includes(safePatch.aggression)
                    ? safePatch.aggression
                    : state.autoSettings.aggression;
            }
            if (Object.prototype.hasOwnProperty.call(safePatch, "healThreshold")) {
                state.autoSettings.healThreshold = clampPercent(safePatch.healThreshold, state.autoSettings.healThreshold);
            }
            if (Object.prototype.hasOwnProperty.call(safePatch, "guardThreshold")) {
                state.autoSettings.guardThreshold = clampPercent(safePatch.guardThreshold, state.autoSettings.guardThreshold);
            }
            if (Object.prototype.hasOwnProperty.call(safePatch, "finisherThreshold")) {
                state.autoSettings.finisherThreshold = clampPercent(safePatch.finisherThreshold, state.autoSettings.finisherThreshold);
            }
            if (Object.prototype.hasOwnProperty.call(safePatch, "maxAutoSkillsPerBattle")) {
                state.autoSettings.maxAutoSkillsPerBattle = Math.max(1, clampPositiveInt(safePatch.maxAutoSkillsPerBattle, state.autoSettings.maxAutoSkillsPerBattle, 6));
            }
            return { autoSettings: deepClone(state.autoSettings) };
        });
    }

    function updateAutoSkillRule(skillId, patch) {
        return updateSkillState((state) => {
            if (!state.ownedSkills.includes(skillId)) {
                return { ok: false, error: "Buy that skill first." };
            }
            const definition = getSkillDefinition(skillId);
            const existing = normalizeSkillRule(state.autoRules[skillId], definition);
            const safePatch = patch && typeof patch === "object" ? patch : {};
            state.autoRules[skillId] = {
                enabled: Object.prototype.hasOwnProperty.call(safePatch, "enabled") ? Boolean(safePatch.enabled) : existing.enabled,
                minTurn: Math.max(definition.unlockTurn, clampPositiveInt(safePatch.minTurn, existing.minTurn, 20)),
                hpThreshold: clampPercent(safePatch.hpThreshold, existing.hpThreshold),
            };
            return { autoRule: deepClone(state.autoRules[skillId]) };
        });
    }

    function getOwnedSkillDefinitions(state) {
        return state.ownedSkills
            .map((skillId) => getResolvedOwnedSkillDefinition(state, skillId))
            .filter(Boolean);
    }

    function skillHasHealing(skill) {
        return Number(skill && skill.healAmount || 0) > 0 || Number(skill && skill.lifestealPercent || 0) > 0;
    }

    function skillHasGuard(skill) {
        return Number(skill && skill.enemyMultiplier || 0) > 0 && Number(skill && skill.enemyMultiplier || 0) < 1;
    }

    function skillHasDamage(skill) {
        return Number(skill && skill.bonusDamage || 0) > 0;
    }

    function createBattleSkillsController(options) {
        const getCombatZone = options && typeof options.getCombatZone === "function"
            ? options.getCombatZone
            : () => options && options.combatZone;
        const getHealth = options && options.getHealth;
        const getMaxHealth = options && options.getMaxHealth;
        const setHealth = options && options.setHealth;
        const getEnemyHealth = options && options.getEnemyHealth;
        const getEnemyMaxHealth = options && options.getEnemyMaxHealth;
        const updateHealthUi = options && options.updateHealthUi;
        const updateCombatMessage = options && options.updateCombatMessage;
        const isPlayerTurn = options && options.isPlayerTurn;
        const isBattleActive = options && options.isBattleActive;

        let snapshot = getSkillStateSnapshot();
        let battleState = {
            currentTurn: 1,
            usedSkills: {},
            pendingPlayerBonus: 0,
            pendingLifestealPercent: 0,
            pendingEnemyMultiplier: 1,
            autoUses: 0,
            active: false,
        };

        function refreshSnapshot() {
            snapshot = getSkillStateSnapshot();
            return snapshot;
        }

        function getHpPercent() {
            const maxHealth = Math.max(1, Number(getMaxHealth ? getMaxHealth() : 1) || 1);
            return (Math.max(0, Number(getHealth ? getHealth() : 0) || 0) / maxHealth) * 100;
        }

        function getEnemyHpPercent() {
            const maxHealth = Math.max(1, Number(getEnemyMaxHealth ? getEnemyMaxHealth() : 1) || 1);
            return (Math.max(0, Number(getEnemyHealth ? getEnemyHealth() : 0) || 0) / maxHealth) * 100;
        }

        function ensureUi() {
            const combatZone = getCombatZone();
            if (!combatZone) return null;
            let root = combatZone.querySelector(".skill-control-panel");
            if (root) return root;

            root = document.createElement("div");
            root.className = "skill-control-panel";
            root.innerHTML = `
                <div class="skill-panel-head">
                    <span class="skill-panel-title">Skills</span>
                    <span class="skill-panel-mode" id="battle-skill-mode-label"></span>
                </div>
                <div class="skill-status" id="battle-skill-status">No skills active.</div>
                <div class="skill-button-row" id="battle-skill-buttons"></div>
            `;
            combatZone.appendChild(root);
            return root;
        }

        function setStatus(text) {
            const combatZone = getCombatZone();
            const statusNode = combatZone ? combatZone.querySelector("#battle-skill-status") : null;
            if (statusNode) {
                statusNode.textContent = text || "No skills active.";
            }
        }

        function renderUi() {
            const combatZone = getCombatZone();
            if (!combatZone) return;
            ensureUi();
            const modeLabel = combatZone.querySelector("#battle-skill-mode-label");
            const buttonRow = combatZone.querySelector("#battle-skill-buttons");
            if (!buttonRow) return;

            const state = refreshSnapshot().state;
            const ownedSkills = getOwnedSkillDefinitions(state);
            modeLabel.textContent = state.mode === "auto" ? "Auto mode" : "Manual mode";
            buttonRow.innerHTML = "";

            if (!ownedSkills.length) {
                setStatus("Buy skills on the Skills page to use them in battle.");
                return;
            }

            if (state.mode === "auto") {
                const summary = `Auto ${state.autoSettings.aggression} | Heal ${state.autoSettings.healThreshold}% | Guard ${state.autoSettings.guardThreshold}% | Finisher ${state.autoSettings.finisherThreshold}%`;
                setStatus(summary);
                return;
            }

            const loadout = state.manualLoadout
                .map((skillId) => getResolvedOwnedSkillDefinition(state, skillId))
                .filter(Boolean);
            if (!loadout.length) {
                setStatus("Pick up to 3 manual skills on the Skills page.");
                return;
            }

            loadout.forEach((skill) => {
                const isUnlocked = battleState.currentTurn >= skill.unlockTurn;
                const isUsed = Boolean(battleState.usedSkills[skill.id]);
                const button = document.createElement("button");
                button.type = "button";
                button.className = "skill-button";
                button.disabled = !battleState.active || !isPlayerTurn || !isPlayerTurn() || !isBattleActive || !isBattleActive() || !isUnlocked || isUsed;
                button.innerHTML = `
                    <span class="skill-button-name">${skill.label}</span>
                    <span class="skill-button-meta">Turn ${skill.unlockTurn} | Lv ${skill.level}</span>
                `;
                button.addEventListener("click", () => {
                    useSkill(skill.id, "manual");
                });
                buttonRow.appendChild(button);
            });

            setStatus(`Turn ${battleState.currentTurn}. Use a skill before your timed strike.`);
        }

        function applySkill(skillId, source) {
            const state = refreshSnapshot().state;
            if (!state.ownedSkills.includes(skillId)) {
                return { ok: false, error: "Skill not owned." };
            }

            const skill = getResolvedOwnedSkillDefinition(state, skillId);
            if (!skill) {
                return { ok: false, error: "Skill not found." };
            }
            if (battleState.usedSkills[skill.id]) {
                return { ok: false, error: "That skill was already used this battle." };
            }
            if (battleState.currentTurn < skill.unlockTurn) {
                return { ok: false, error: `That skill unlocks on turn ${skill.unlockTurn}.` };
            }

            let message = "";
            if (skillHasHealing(skill) && Number(skill.healAmount || 0) > 0 && typeof setHealth === "function") {
                const nextHealth = Math.min(Number(getMaxHealth ? getMaxHealth() : 0) || 0, (Number(getHealth ? getHealth() : 0) || 0) + (skill.healAmount || 0));
                setHealth(nextHealth);
                message = `${skill.label} restored ${skill.healAmount} health.`;
            }
            if (skillHasGuard(skill)) {
                battleState.pendingEnemyMultiplier = Math.min(battleState.pendingEnemyMultiplier, Number(skill.enemyMultiplier || 0.45));
                message = message ? `${message} Your guard is up for the next enemy hit.` : `${skill.label} will cut the next enemy hit.`;
            }
            if (skillHasDamage(skill)) {
                battleState.pendingPlayerBonus += Number(skill.bonusDamage || 0);
                message = message ? `${message} Your next hit gains +${skill.bonusDamage} damage.` : `${skill.label} charged your next strike with +${skill.bonusDamage} damage.`;
            }
            if (Number(skill.lifestealPercent || 0) > 0) {
                battleState.pendingLifestealPercent += Number(skill.lifestealPercent || 0);
                message = message
                    ? `${message} Your next hit will steal ${skill.lifestealPercent}% of the damage it deals as health.`
                    : `${skill.label} primed your next hit to steal ${skill.lifestealPercent}% of the damage it deals as health.`;
            }

            battleState.usedSkills[skill.id] = true;
            if (source === "auto") {
                battleState.autoUses += 1;
            }
            if (typeof updateHealthUi === "function") {
                updateHealthUi();
            }
            if (typeof updateCombatMessage === "function") {
                updateCombatMessage(message);
            }
            renderUi();
            return { ok: true, message };
        }

        function getAutoCandidate(phase) {
            const state = refreshSnapshot().state;
            if (state.mode !== "auto") return null;
            if (battleState.autoUses >= state.autoSettings.maxAutoSkillsPerBattle) return null;

            const ownedSkills = getOwnedSkillDefinitions(state).filter((skill) => {
                if (battleState.usedSkills[skill.id]) return false;
                const rule = state.autoRules[skill.id] || normalizeSkillRule({}, skill);
                if (!rule.enabled) return false;
                if (battleState.currentTurn < rule.minTurn) return false;
                return true;
            });
            if (!ownedSkills.length) return null;

            const hpPercent = getHpPercent();
            const enemyHpPercent = getEnemyHpPercent();

            if (phase === "player") {
                const healSkill = ownedSkills.find((skill) => {
                    const rule = state.autoRules[skill.id];
                    return skillHasHealing(skill)
                        && hpPercent <= Math.min(state.autoSettings.healThreshold, rule.hpThreshold);
                });
                if (healSkill) return healSkill;

                const attackSkills = ownedSkills.filter((skill) => skillHasDamage(skill));
                if (!attackSkills.length) return null;
                if (state.autoSettings.aggression === "aggressive") {
                    return attackSkills.sort((a, b) => b.unlockTurn - a.unlockTurn)[0];
                }
                if (enemyHpPercent <= state.autoSettings.finisherThreshold || hpPercent <= state.autoSettings.healThreshold) {
                    return attackSkills.sort((a, b) => b.unlockTurn - a.unlockTurn)[0];
                }
                return null;
            }

            if (phase === "enemy") {
                return ownedSkills.find((skill) => {
                    const rule = state.autoRules[skill.id];
                    return skillHasGuard(skill)
                        && hpPercent <= Math.min(state.autoSettings.guardThreshold, rule.hpThreshold);
                }) || null;
            }

            return null;
        }

        function maybeRunAutoSkill(phase) {
            const skill = getAutoCandidate(phase);
            if (!skill) return null;
            return applySkill(skill.id, "auto");
        }

        function useSkill(skillId, source = "manual") {
            const result = applySkill(skillId, source);
            if (!result.ok && typeof updateCombatMessage === "function") {
                updateCombatMessage(result.error || "That skill could not be used.");
            }
            return result;
        }

        function startBattle() {
            battleState = {
                currentTurn: 1,
                usedSkills: {},
                pendingPlayerBonus: 0,
                pendingLifestealPercent: 0,
                pendingEnemyMultiplier: 1,
                autoUses: 0,
                active: true,
            };
            ensureUi();
            renderUi();
        }

        function onPlayerTurnStart(turnNumber) {
            battleState.active = true;
            battleState.currentTurn = Math.max(1, Math.round(Number(turnNumber) || battleState.currentTurn || 1));
            renderUi();
            maybeRunAutoSkill("player");
        }

        function onEnemyTurnStart(turnNumber) {
            battleState.currentTurn = Math.max(1, Math.round(Number(turnNumber) || battleState.currentTurn || 1));
            maybeRunAutoSkill("enemy");
            renderUi();
        }

        function consumePlayerDamageBonus() {
            const bonus = battleState.pendingPlayerBonus;
            battleState.pendingPlayerBonus = 0;
            renderUi();
            return bonus;
        }

        function applyPlayerLifesteal(damageDealt) {
            const percent = Math.max(0, Number(battleState.pendingLifestealPercent) || 0);
            battleState.pendingLifestealPercent = 0;
            if (!percent || typeof setHealth !== "function") {
                renderUi();
                return { healed: 0, lifestealPercent: percent };
            }

            const currentHealth = Math.max(0, Number(getHealth ? getHealth() : 0) || 0);
            const maxHealth = Math.max(0, Number(getMaxHealth ? getMaxHealth() : 0) || 0);
            const damage = Math.max(0, Math.round(Number(damageDealt) || 0));
            const rawHeal = Math.max(0, Math.round((damage * percent) / 100));
            const nextHealth = Math.min(maxHealth, currentHealth + rawHeal);
            const healed = Math.max(0, nextHealth - currentHealth);
            if (healed > 0) {
                setHealth(nextHealth);
            }
            renderUi();
            return { healed, lifestealPercent: percent };
        }

        function applyIncomingEnemyDamage(baseDamage) {
            const adjusted = Math.max(1, Math.round(Number(baseDamage || 0) * battleState.pendingEnemyMultiplier));
            battleState.pendingEnemyMultiplier = 1;
            renderUi();
            return adjusted;
        }

        function endBattle() {
            battleState.active = false;
            battleState.pendingLifestealPercent = 0;
            renderUi();
        }

        return {
            ensureUi,
            renderUi,
            startBattle,
            onPlayerTurnStart,
            onEnemyTurnStart,
            consumePlayerDamageBonus,
            applyPlayerLifesteal,
            applyIncomingEnemyDamage,
            useSkill,
            endBattle,
        };
    }

    function createBattleEffectsController(options) {
        const game = options && options.game;
        const battleRow = options && options.battleRow;
        const playerContainer = options && options.playerContainer;
        const enemyContainer = options && options.enemyContainer;
        const crystalAttack = options && options.crystalAttack;
        const projectileVariantClasses = ["boss-attack", "empowered", "variant-arc", "variant-storm", "variant-pulse", "variant-nova"];
        let animationTimeoutId = null;
        let specialTimeoutId = null;

        function ensureEffectsLayer() {
            if (!battleRow) return null;
            let effectsLayer = battleRow.querySelector("#battle-effects");
            if (effectsLayer) return effectsLayer;

            effectsLayer = document.createElement("div");
            effectsLayer.id = "battle-effects";
            effectsLayer.innerHTML = `
                <div class="impact-ring"></div>
                <div class="impact-core"></div>
                <div class="impact-shock"></div>
                <div id="damage-burst" class="damage-burst"></div>
                <div class="ability-overlay" aria-hidden="true">
                    <div class="ability-flare"></div>
                    <div class="ability-rings"></div>
                    <div class="ability-sparks"></div>
                    <div class="ability-label"></div>
                </div>
            `;
            battleRow.appendChild(effectsLayer);
            return effectsLayer;
        }

        function clearSpecialAbility() {
            if (specialTimeoutId) {
                clearTimeout(specialTimeoutId);
                specialTimeoutId = null;
            }
            const overlay = battleRow ? battleRow.querySelector(".ability-overlay") : null;
            if (!overlay) return;
            overlay.className = "ability-overlay";
            overlay.style.removeProperty("--ability-primary");
            overlay.style.removeProperty("--ability-secondary");
            overlay.style.removeProperty("--ability-accent");
            const label = overlay.querySelector(".ability-label");
            if (label) {
                label.textContent = "";
            }
        }

        function clearBattleAnimation(options = {}) {
            const keepAbility = Boolean(options.keepAbility);
            if (animationTimeoutId) {
                clearTimeout(animationTimeoutId);
                animationTimeoutId = null;
            }

            if (game) {
                game.classList.remove("player-striking", "enemy-striking", "boss-striking");
            }
            if (playerContainer) {
                playerContainer.classList.remove("is-attacking", "is-hit", "boss-casting");
            }
            if (enemyContainer) {
                enemyContainer.classList.remove("is-attacking", "is-hit", "boss-casting");
            }

            const effectsLayer = battleRow ? battleRow.querySelector("#battle-effects") : null;
            if (effectsLayer) {
                effectsLayer.className = "";
                effectsLayer.style.removeProperty("--impact-primary");
                effectsLayer.style.removeProperty("--impact-secondary");
                effectsLayer.style.removeProperty("--impact-accent");
            }

            const damageBurst = battleRow ? battleRow.querySelector("#damage-burst") : null;
            if (damageBurst) {
                damageBurst.className = "damage-burst";
                damageBurst.textContent = "";
            }

            if (crystalAttack) {
                crystalAttack.classList.remove("attack-strike", "enemy-attack-strike", ...projectileVariantClasses);
                crystalAttack.style.display = "none";
                crystalAttack.style.removeProperty("--projectile-primary");
                crystalAttack.style.removeProperty("--projectile-secondary");
                crystalAttack.style.removeProperty("--projectile-accent");
            }

            if (!keepAbility) {
                clearSpecialAbility();
            }
        }

        function triggerBattleAnimation(attacker, hit, accuracy, effectOptions = {}) {
            if (!game || !battleRow) return;

            const effectsLayer = ensureEffectsLayer();
            const attackerContainer = attacker === "player" ? playerContainer : enemyContainer;
            const defenderContainer = attacker === "player" ? enemyContainer : playerContainer;
            const strikeClass = attacker === "player" ? "player-striking" : "enemy-striking";
            const burstSideClass = attacker === "player" ? "enemy-side" : "player-side";
            const projectileClass = attacker === "player" ? "attack-strike" : "enemy-attack-strike";
            const damageBurst = battleRow.querySelector("#damage-burst");
            const variant = ["arc", "storm", "pulse", "nova"].includes(String(effectOptions.variant || "").toLowerCase())
                ? String(effectOptions.variant).toLowerCase()
                : "";
            const hasBossStyle = attacker === "enemy" && (Boolean(effectOptions.isBossAttack) || Boolean(variant));
            const isEmpowered = hasBossStyle && Boolean(effectOptions.empowered);
            const durationMs = Math.max(780, Math.round(Number(effectOptions.durationMs) || 0) || 780);

            clearBattleAnimation({ keepAbility: true });
            void game.offsetWidth;
            game.classList.add(strikeClass);
            if (hasBossStyle) game.classList.add("boss-striking");
            if (attackerContainer) attackerContainer.classList.add("is-attacking");
            if (hasBossStyle && attackerContainer) attackerContainer.classList.add("boss-casting");
            if (defenderContainer) defenderContainer.classList.add("is-hit");

            if (effectsLayer && hasBossStyle) {
                effectsLayer.className = `boss-impact${variant ? ` variant-${variant}` : ""}${isEmpowered ? " empowered" : ""}`;
                effectsLayer.style.setProperty("--impact-primary", effectOptions.primaryColor || "#8dff84");
                effectsLayer.style.setProperty("--impact-secondary", effectOptions.secondaryColor || "#ffffff");
                effectsLayer.style.setProperty("--impact-accent", effectOptions.accentColor || "#202020");
            }

            if (crystalAttack) {
                crystalAttack.style.display = "block";
                if (hasBossStyle) {
                    crystalAttack.style.setProperty("--projectile-primary", effectOptions.primaryColor || "#8dff84");
                    crystalAttack.style.setProperty("--projectile-secondary", effectOptions.secondaryColor || "#ffffff");
                    crystalAttack.style.setProperty("--projectile-accent", effectOptions.accentColor || "#202020");
                    crystalAttack.classList.add("boss-attack");
                    if (variant) crystalAttack.classList.add(`variant-${variant}`);
                    if (isEmpowered) crystalAttack.classList.add("empowered");
                }
                crystalAttack.classList.add(projectileClass);
            }

            if (damageBurst) {
                damageBurst.textContent = `${accuracy >= 0.92 ? "CRIT " : ""}-${hit}`;
                damageBurst.className = `damage-burst show ${burstSideClass}${accuracy >= 0.92 ? " crit" : ""}${hasBossStyle ? " boss" : ""}${isEmpowered ? " empowered" : ""}`;
            }

            animationTimeoutId = window.setTimeout(clearBattleAnimation, durationMs);
        }

        function triggerSpecialAbility(options = {}) {
            if (!battleRow) return;

            ensureEffectsLayer();
            const overlay = battleRow.querySelector(".ability-overlay");
            const label = overlay ? overlay.querySelector(".ability-label") : null;
            if (!overlay) return;

            clearSpecialAbility();
            void overlay.offsetWidth;
            overlay.className = `ability-overlay is-active variant-${options.variant || "pulse"} from-${options.attacker === "player" ? "player" : "enemy"}`;
            overlay.style.setProperty("--ability-primary", options.primaryColor || "#7effb8");
            overlay.style.setProperty("--ability-secondary", options.secondaryColor || "#ffd76a");
            overlay.style.setProperty("--ability-accent", options.accentColor || "#ffffff");
            if (label) {
                label.textContent = options.label || "Special Move";
            }

            specialTimeoutId = window.setTimeout(clearSpecialAbility, 1100);
        }

        return {
            ensureEffectsLayer,
            clearBattleAnimation,
            clearSpecialAbility,
            triggerBattleAnimation,
            triggerSpecialAbility,
        };
    }

    function getLevelBattleConfig(level) {
        const safeLevel = Math.max(1, Math.floor(Number(level) || 0));
        const config = LEVEL_BATTLE_CONFIGS[safeLevel];
        return config ? deepClone(config) : null;
    }

    function getEnemyAbilityForTurn(level, battleTurn) {
        const config = getLevelBattleConfig(level);
        const ability = config && config.ability;
        if (!ability) return null;

        const safeTurn = Math.max(1, Math.floor(Number(battleTurn) || 0));
        const firstTurn = Math.max(1, Math.floor(Number(ability.firstTurn) || 1));
        const cooldown = Math.max(1, Math.floor(Number(ability.cooldown) || 1));
        if (safeTurn < firstTurn) return null;
        if ((safeTurn - firstTurn) % cooldown !== 0) return null;
        return deepClone(ability);
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

    function getAuthToken() {
        return getStoredString([AUTH_TOKEN_STORAGE_KEY]);
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

    function getEquippedItemType(item) {
        if (item && item.name === "Fire Doge") {
            return "Fire Doge";
        }
        if (item && item.name === "Soccer Ball") {
            return "Soccer Ball";
        }
        return "Doge";
    }

    function getProfileItemBonus(item) {
        const itemType = getEquippedItemType(item);
        const group = PROFILE_STAT_BONUSES[itemType] || {};
        return group[item && item.rarity] || { damage: 0, health: 0 };
    }

    function hasEquippedItemByName(itemName) {
        return getStoredEquippedItems().some((item) => item && item.name === itemName);
    }

    function getEquippedSoccerBallItem() {
        return getStoredEquippedItems().find((item) => item && item.name === "Soccer Ball") || null;
    }

    function getSoccerBallImageForRarity(rarity) {
        return rarity === "Godly" || rarity === "Mythic"
            ? "soccer-ball-final.svg"
            : "soccer-ball-basic.svg";
    }

    function getSoccerBallProjectileClass(rarity) {
        return rarity === "Godly" || rarity === "Mythic"
            ? "world-ball-attack"
            : "soccer-ball-attack";
    }

    function syncSoccerBallVisual(container, options = {}) {
        if (!container || !container.querySelector) {
            return false;
        }

        const className = options.className || "equipped-soccer-ball";
        const selector = `.${className.trim().split(/\s+/).join(".")}`;
        const existingBall = container.querySelector(selector);
        const equippedBallItem = getEquippedSoccerBallItem();
        if (!equippedBallItem) {
            if (existingBall) {
                existingBall.remove();
            }
            return false;
        }

        const soccerBall = existingBall || document.createElement("img");
        soccerBall.src = options.imageSrc || getSoccerBallImageForRarity(equippedBallItem.rarity);
        soccerBall.alt = options.alt || "Equipped soccer ball";
        soccerBall.className = className;

        if (!existingBall) {
            const beforeNode = options.beforeSelector ? container.querySelector(options.beforeSelector) : null;
            if (beforeNode) {
                container.insertBefore(soccerBall, beforeNode);
            } else {
                container.appendChild(soccerBall);
            }
        }

        return true;
    }

    function getCurrentCombatProfile() {
        const username = getCurrentUsername();
        const displayName = getStoredString(["Username", "username", "playerName", "Uabcd"]) || username || "doge";
        const players = readPlayerRecords();
        const playerRecord = username && players[username] && typeof players[username] === "object" ? players[username] : {};
        const title = normalizePlayerTitle(playerRecord.title || (playerRecord.profileStats && playerRecord.profileStats.title));
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
            title,
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
            title: normalizePlayerTitle(safeStats.title),
            attack: Math.max(0, Math.floor(Number(safeStats.attack) || 0)),
            health: Math.max(0, Math.floor(Number(safeStats.health) || 0)),
            equippedCount: Math.max(0, Math.floor(Number(safeStats.equippedCount) || 0)),
            currency: Math.max(0, Math.floor(Number(safeStats.currency) || 0)),
            updatedAt: Number.isFinite(Number(safeStats.updatedAt)) ? Number(safeStats.updatedAt) : null,
        };
    }

    function normalizePlayerTitle(value) {
        return typeof value === "string" && value.trim() ? value.trim().slice(0, 64) : "";
    }

    function normalizeLeaderboardBan(rawBan) {
        if (!rawBan || typeof rawBan !== "object") return null;
        const permanent = rawBan.permanent === true;
        const until = permanent ? null : Math.max(0, Math.round(Number(rawBan.until) || 0));
        const active = rawBan.active !== false && (permanent || until > 0);
        if (!active && !rawBan.reason && !rawBan.bannedAt) return null;
        return {
            active,
            permanent,
            until,
            reason: typeof rawBan.reason === "string" ? rawBan.reason.slice(0, 160) : "",
            bannedAt: Math.max(0, Math.round(Number(rawBan.bannedAt) || 0)),
            bannedBy: typeof rawBan.bannedBy === "string" ? rawBan.bannedBy.slice(0, 64) : "admin",
        };
    }

    function isLeaderboardBanActive(rawBan, now = Date.now()) {
        const ban = normalizeLeaderboardBan(rawBan);
        if (!ban || ban.active === false) return false;
        return ban.permanent || (Number(ban.until) || 0) > now;
    }

    function ensurePlayerRecordShape(rawRecord, username) {
        const safeRecord = rawRecord && typeof rawRecord === "object" ? rawRecord : {};
        const safeUsername = normalizeUsername(username || safeRecord.username);
        const recordTitle = normalizePlayerTitle(safeRecord.title);
        const rawProfileStats = safeRecord.profileStats && typeof safeRecord.profileStats === "object" ? safeRecord.profileStats : {};
        const profileStats = normalizeProfileStats({
            ...rawProfileStats,
            title: rawProfileStats.title || recordTitle,
        }, safeUsername);
        const resolvedTitle = recordTitle || profileStats.title;
        return {
            ...safeRecord,
            firstSeen: Number.isFinite(Number(safeRecord.firstSeen)) ? Number(safeRecord.firstSeen) : null,
            lastSeen: Number.isFinite(Number(safeRecord.lastSeen)) ? Number(safeRecord.lastSeen) : null,
            visits: Math.max(0, Math.floor(Number(safeRecord.visits) || 0)),
            inventory: Array.isArray(safeRecord.inventory) ? safeRecord.inventory : [],
            password: typeof safeRecord.password === "string" ? safeRecord.password : "",
            title: resolvedTitle,
            profileStats: {
                ...profileStats,
                title: profileStats.title || resolvedTitle,
            },
            leaderboard: normalizeLeaderboardState(safeRecord.leaderboard),
            leaderboardBan: normalizeLeaderboardBan(safeRecord.leaderboardBan),
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
        const authToken = getAuthToken();
        if (!safeUsername || !serverBase || typeof fetch !== "function" || !authToken) return false;

        for (const apiBase of buildApiBaseCandidates(serverBase)) {
            try {
                const response = await fetch(`${apiBase}/player`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}`,
                    },
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

    function recordComputerVictory(amount = 1) {
        const points = Math.max(0, Math.floor(Number(amount) || 0));
        return updateCurrentPlayerRecord((record, now) => {
            const dateKey = getLocalDateKey(new Date(now));
            const day = applyProfilePeaks(record, dateKey);
            day.victoriesComputer += points;
            record.leaderboard.allTime.victoriesComputer += points;
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
            .filter(([, record]) => !isLeaderboardBanActive(record && record.leaderboardBan))
            .map(([username, record]) => {
                const safeRecord = ensurePlayerRecordShape(record, username);
                return {
                    username,
                    displayName: safeRecord.profileStats.displayName || username,
                    title: safeRecord.profileStats.title || safeRecord.title || "",
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
        SKILL_STATE_STORAGE_KEY,
        BOOST_DEFINITIONS: deepClone(BOOST_DEFINITIONS),
        SKILL_CATALOG: deepClone(SKILL_CATALOG),
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
        getSkillStateSnapshot,
        buySkill,
        upgradeSkill,
        setSkillMode,
        setManualSkillLoadout,
        updateAutoSkillSettings,
        updateAutoSkillRule,
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
        getLevelBattleConfig,
        getEnemyAbilityForTurn,
        hasEquippedItemByName,
        getEquippedSoccerBallItem,
        getSoccerBallImageForRarity,
        getSoccerBallProjectileClass,
        syncSoccerBallVisual,
        createBattleSkillsController,
        createBattleEffectsController,
    };

    startLeaderboardTracking();
})();

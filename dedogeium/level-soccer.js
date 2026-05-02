const yes_no = document.getElementById("yes-no");
const yes_btn = document.getElementById("ok-btn");
const cancel_btn = document.getElementById("cancel-btn");
const enemy_hlth_element = document.getElementById("enemy-hlth");
const hlth_element = document.getElementById("hlth");
const victory = document.getElementById("victory");
const home = document.getElementById("bye-btn");
const maybe_vic = document.getElementById("maybe-vic");
const speech_good = document.getElementById("speech-good");
const speech_bad = document.getElementById("speech-bad");
const skipBtn = document.getElementById("skip-btn");
const crystal_attack = document.getElementById("crystal_attack");
const beforeFightAudio = new Audio("before fight.mp3");
const duringFightAudio = new Audio("during fight.mp3");
const postDialogueWinAudio = new Audio("postDialogueWin.mp3");
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const musicVolumeNormalized = Math.min(1, Math.max(0, musicVolume / 100));
beforeFightAudio.volume = musicVolumeNormalized;
duringFightAudio.volume = musicVolumeNormalized;
postDialogueWinAudio.volume = musicVolumeNormalized;

const currentLevel = Number(document.body.dataset.level || "9");
const aprilFoolsEnabled = localStorage.getItem("aprilFoolsEnabled") === "true";
const skipAllDialogueEnabled = localStorage.getItem("skipAllDialogueEnabled") === "true";
const playerImg = document.getElementById("player-img");
const enemyImg = document.getElementById("enemy-img");
const game = document.getElementById("game");
const battleRow = document.getElementById("battle-row");
const playerContainer = document.querySelector(".character-container.player");
const enemyContainer = document.querySelector(".character-container.enemy");
const battleEffects = window.DedogeiumSystems && typeof window.DedogeiumSystems.createBattleEffectsController === "function"
    ? window.DedogeiumSystems.createBattleEffectsController({
        game,
        battleRow,
        playerContainer,
        enemyContainer,
        crystalAttack: crystal_attack,
    })
    : null;
const dialogueVoice = window.DedogeiumDialogueVoice || null;
if (dialogueVoice && typeof dialogueVoice.registerMusicAudio === "function") {
    dialogueVoice.registerMusicAudio(beforeFightAudio, { baseVolume: musicVolumeNormalized });
    dialogueVoice.registerMusicAudio(duringFightAudio, { baseVolume: musicVolumeNormalized });
    dialogueVoice.registerMusicAudio(postDialogueWinAudio, { baseVolume: musicVolumeNormalized });
}
const dialogueVoiceMap = {
    good: { characterKey: "dedogeium-player", team: "player" },
    bad: { characterKey: `level${currentLevel}-enemy`, team: "enemy" },
};

const SOCCER_LEVELS = {
    9: {
        enemyName: "Rookie Match Doge",
        enemyImage: "soccer-doge-rookie.png",
        projectileImage: "soccer-ball-basic.svg",
        projectileClass: "soccer-ball-attack",
        enemyHealth: 2400,
        enemyDamage: 220,
        rewardItemName: "Soccer Ball",
        rewardWeights: [18, 24, 26, 18, 10, 4],
        victoryCurrency: 95,
        attackVisual: {
            variant: "arc",
            primaryColor: "#8dff84",
            secondaryColor: "#ffffff",
            accentColor: "#2f2f2f",
        },
        shopItems: [
            { label: "Rare Doge", cost: 80, item: { name: "Doge", rarity: "Rare" } },
            { label: "Epic Doge", cost: 160, item: { name: "Doge", rarity: "Epic" } },
            { label: "Rare Fire Doge", cost: 220, item: { name: "Fire Doge", rarity: "Rare" } },
        ],
        dialogue: [
            { speaker: "good", text: "So you are the soccer doge everybody keeps talking about?" },
            { speaker: "bad", text: "Rookie Match Doge. Fresh on the pitch, deadly on the first touch." },
            { speaker: "good", text: "You talk big for a first form." },
            { speaker: "bad", text: "Then stand in goal and watch my curve break your confidence." },
        ],
        postDialogueWin: [
            { speaker: "bad", text: "You read the curve... not bad for someone I almost embarrassed." },
            { speaker: "good", text: "Come back stronger. I want the next evolution too." },
        ],
        postDialogueLose: [
            { speaker: "bad", text: "The pitch belongs to whoever owns the tempo, and right now that is me." },
            { speaker: "good", text: "Then next time I am stealing the tempo before you even kick off." },
        ],
    },
    10: {
        enemyName: "Striker Boost Doge",
        enemyImage: "soccer-doge-striker.png",
        projectileImage: "soccer-ball-basic.svg",
        projectileClass: "soccer-ball-attack",
        enemyHealth: 2900,
        enemyDamage: 270,
        rewardItemName: "Soccer Ball",
        rewardWeights: [10, 18, 24, 24, 16, 8],
        victoryCurrency: 125,
        attackVisual: {
            variant: "storm",
            primaryColor: "#d1ff5b",
            secondaryColor: "#f3fff8",
            accentColor: "#202020",
        },
        shopItems: [
            { label: "Epic Doge", cost: 180, item: { name: "Doge", rarity: "Epic" } },
            { label: "Legendary Doge", cost: 320, item: { name: "Doge", rarity: "Legendary" } },
            { label: "Epic Fire Doge", cost: 440, item: { name: "Fire Doge", rarity: "Epic" } },
        ],
        dialogue: [
            { speaker: "good", text: "You leveled up and somehow got even more annoying." },
            { speaker: "bad", text: "Striker Boost Doge does not chase the play. I end it." },
            { speaker: "good", text: "So this form is just pure offense?" },
            { speaker: "bad", text: "Pure pressure. Pure speed. Pure shots your guard cannot hold." },
        ],
        postDialogueWin: [
            { speaker: "bad", text: "I threw the whole attack line at you, and you still would not fold." },
            { speaker: "good", text: "Fast is dangerous, but reckless speed still leaves openings." },
        ],
        postDialogueLose: [
            { speaker: "bad", text: "Feel that burst? That is what happens when a striker smells weakness." },
            { speaker: "good", text: "Next round I am reading the dash before your cleats leave the ground." },
        ],
    },
    11: {
        enemyName: "Captain Command Doge",
        enemyImage: "soccer-doge-captain.png",
        projectileImage: "soccer-ball-basic.svg",
        projectileClass: "soccer-ball-attack",
        enemyHealth: 3500,
        enemyDamage: 330,
        rewardItemName: "Soccer Ball",
        rewardWeights: [4, 12, 20, 28, 22, 14],
        victoryCurrency: 165,
        attackVisual: {
            variant: "pulse",
            primaryColor: "#72f7ff",
            secondaryColor: "#ffd76a",
            accentColor: "#ffffff",
        },
        shopItems: [
            { label: "Legendary Doge", cost: 360, item: { name: "Doge", rarity: "Legendary" } },
            { label: "Godly Doge", cost: 620, item: { name: "Doge", rarity: "Godly" } },
            { label: "Legendary Fire Doge", cost: 780, item: { name: "Fire Doge", rarity: "Legendary" } },
        ],
        dialogue: [
            { speaker: "good", text: "Now you have the captain band too?" },
            { speaker: "bad", text: "Captain Command Doge does not wear it for style. I command the whole field." },
            { speaker: "good", text: "Meaning the heals, the pressure, and the cheap shots are all yours?" },
            { speaker: "bad", text: "Every whistle is an order. Every order ends with you on the turf." },
        ],
        postDialogueWin: [
            { speaker: "bad", text: "A captain who cannot close the match deserves to lose the armband." },
            { speaker: "good", text: "You made every second feel like overtime. That was brutal." },
        ],
        postDialogueLose: [
            { speaker: "bad", text: "Leaders do not panic when the game turns ugly. They make the ugliness useful." },
            { speaker: "good", text: "Then I need to stop letting your pressure run the whole match." },
        ],
    },
    12: {
        enemyName: "World Star Doge",
        enemyImage: "soccer-doge-world.png",
        projectileImage: "soccer-ball-final.svg",
        projectileClass: "world-ball-attack",
        enemyHealth: 4300,
        enemyDamage: 410,
        rewardItemName: "Soccer Ball",
        rewardWeights: [0, 4, 12, 26, 30, 28],
        victoryCurrency: 220,
        attackVisual: {
            variant: "nova",
            primaryColor: "#fff0b8",
            secondaryColor: "#8dff84",
            accentColor: "#1d1d1d",
        },
        shopItems: [
            { label: "Godly Doge", cost: 700, item: { name: "Doge", rarity: "Godly" } },
            { label: "Legendary Fire Doge", cost: 820, item: { name: "Fire Doge", rarity: "Legendary" } },
            { label: "Godly Fire Doge", cost: 1100, item: { name: "Fire Doge", rarity: "Godly" } },
        ],
        dialogue: [
            { speaker: "good", text: "Okay... you really do look like the final boss now." },
            { speaker: "bad", text: "World Star Doge. Stadium lights, world-class shot, and enough power to erase your highlight reel." },
            { speaker: "good", text: "Good. If I win here, I am saving that replay forever." },
            { speaker: "bad", text: "Then survive the bicycle kick, the meteor strike, and the roar of the whole arena." },
        ],
        postDialogueWin: [
            { speaker: "bad", text: "You cleared the entire evolution line... and stole the stage from me." },
            { speaker: "good", text: "Now that is a replay worth framing on the wall." },
        ],
        postDialogueLose: [
            { speaker: "bad", text: "Final forms do not flinch, and my shot does not miss once it leaves the sky." },
            { speaker: "good", text: "Then I am coming back with enough power to blast that star out of orbit." },
        ],
    },
};

const levelConfig = SOCCER_LEVELS[currentLevel] || SOCCER_LEVELS[9];
function getDedogeiumBasePath() {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const dedogeiumIndex = pathSegments.indexOf("dedogeium");
    if (dedogeiumIndex === -1) {
        return "/";
    }
    return `/${pathSegments.slice(0, dedogeiumIndex + 1).join("/")}/`;
}

const dedogeiumBasePath = getDedogeiumBasePath();
const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Godly"];
const rarityBonuses = {
    "Common": { damage: 2, health: 50 },
    "Uncommon": { damage: 5, health: 100 },
    "Rare": { damage: 10, health: 150 },
    "Epic": { damage: 20, health: 250 },
    "Legendary": { damage: 40, health: 400 },
    "Godly": { damage: 80, health: 600 },
};
const fireRarityBonuses = {
    "Common": { damage: 6, health: 125 },
    "Uncommon": { damage: 12, health: 165 },
    "Rare": { damage: 22, health: 275 },
    "Epic": { damage: 42, health: 550 },
    "Legendary": { damage: 85, health: 700 },
    "Godly": { damage: 100, health: 900 },
};
const soccerBallRarityBonuses = {
    "Common": { damage: 2, health: 120 },
    "Uncommon": { damage: 4, health: 180 },
    "Rare": { damage: 7, health: 260 },
    "Epic": { damage: 11, health: 360 },
    "Legendary": { damage: 16, health: 500 },
    "Godly": { damage: 24, health: 700 },
    "Mythic": { damage: 30, health: 850 },
};
const defaultPlayerProjectile = {
    image: "crystal attack.png",
    className: "",
};

const combat = {
    active: false,
    isPlayerTurn: false,
    pointerPos: 0,
    pointerDir: 1,
    speed: 3.8,
    intervalId: null,
    timeoutId: null,
    barWidth: 0,
    pointerWidth: 40,
    maxX: 0,
};

let inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
let battleTurn = 1;
let pendingPlayerDamageMultiplier = 1;
let equipmentBonusesApplied = false;
let enemy_health = levelConfig.enemyHealth;
const enemy_max_health = levelConfig.enemyHealth;
let max_health = 700;
let health = 700;
let damage = 60;
let enemy_damage = levelConfig.enemyDamage;
let levelShopMessage = "";
let levelShopMessageIsError = false;
let inCutscene = false;
let inPostDialogue = false;
let dialogueIndex = 0;
let postDialogueIndex = 0;
let activePostDialogue = [];
let pendingBattleResultAction = null;

const battleSkills = window.DedogeiumSystems && typeof window.DedogeiumSystems.createBattleSkillsController === "function"
    ? window.DedogeiumSystems.createBattleSkillsController({
        getCombatZone: () => document.getElementById("combat-zone"),
        getHealth: () => health,
        getMaxHealth: () => max_health,
        setHealth: (value) => { health = value; },
        getEnemyHealth: () => enemy_health,
        getEnemyMaxHealth: () => enemy_max_health,
        updateHealthUi: loadhealth,
        updateCombatMessage,
        isPlayerTurn: () => combat.isPlayerTurn,
        isBattleActive: () => combat.active,
    })
    : null;

function speakDialogueLine(line) {
    if (!line || !dialogueVoice) return;
    const voiceOptions = dialogueVoiceMap[line.speaker] || dialogueVoiceMap.good;
    dialogueVoice.speak(line.text, voiceOptions);
}

function stopDialogueVoice() {
    if (!dialogueVoice) return;
    dialogueVoice.stop();
}

function getItemBonus(item) {
    if (item && item.name === "Soccer Ball") {
        return soccerBallRarityBonuses[item.rarity] || { damage: 0, health: 0 };
    }
    if (item && item.name === "Fire Doge") {
        return fireRarityBonuses[item.rarity] || { damage: 0, health: 0 };
    }
    return rarityBonuses[item && item.rarity] || { damage: 0, health: 0 };
}

function getPlayerProjectileConfig() {
    if (!window.DedogeiumSystems || typeof window.DedogeiumSystems.getEquippedSoccerBallItem !== "function") {
        return defaultPlayerProjectile;
    }

    const equippedBall = window.DedogeiumSystems.getEquippedSoccerBallItem();
    if (!equippedBall) {
        return defaultPlayerProjectile;
    }

    return {
        image: window.DedogeiumSystems.getSoccerBallImageForRarity
            ? window.DedogeiumSystems.getSoccerBallImageForRarity(equippedBall.rarity)
            : "soccer-ball-basic.svg",
        className: window.DedogeiumSystems.getSoccerBallProjectileClass
            ? window.DedogeiumSystems.getSoccerBallProjectileClass(equippedBall.rarity)
            : "soccer-ball-attack",
    };
}

function getEnemyProjectileConfig() {
    return {
        image: levelConfig.projectileImage || "soccer-ball-basic.svg",
        className: levelConfig.projectileClass || "",
    };
}

function getEnemyAnimationOptions(ability) {
    const baseVisual = levelConfig.attackVisual || {};
    const activeVisual = ability || {};
    return {
        isBossAttack: true,
        empowered: Boolean(ability),
        variant: activeVisual.variant || baseVisual.variant || "pulse",
        primaryColor: activeVisual.primaryColor || baseVisual.primaryColor || "#8dff84",
        secondaryColor: activeVisual.secondaryColor || baseVisual.secondaryColor || "#ffffff",
        accentColor: activeVisual.accentColor || baseVisual.accentColor || "#202020",
        durationMs: ability ? 1020 : 900,
    };
}

function applyProjectileVisual(config) {
    if (!crystal_attack) return;
    crystal_attack.src = config.image;
    crystal_attack.classList.remove("soccer-ball-attack", "world-ball-attack");
    if (config.className) {
        crystal_attack.classList.add(config.className);
    }
}

function applyEquipmentBonuses() {
    if (equipmentBonusesApplied) return;

    const equippedItems = JSON.parse(localStorage.getItem("equippedItems") || "[]");
    let totalDamageBonus = 0;
    let totalHealthBonus = 0;

    equippedItems.forEach((item) => {
        const bonus = getItemBonus(item);
        totalDamageBonus += bonus.damage;
        totalHealthBonus += bonus.health;
    });

    damage += totalDamageBonus;
    max_health += totalHealthBonus;
    health = max_health;
    equipmentBonusesApplied = true;
}

function getLevelCurrency() {
    return Number(localStorage.getItem("currency") || "0");
}

function addLevelCurrency(amount) {
    const current = getLevelCurrency();
    const numericAmount = Number(amount || 0);
    const appliedAmount = window.DedogeiumSystems && typeof window.DedogeiumSystems.getAdjustedCurrencyReward === "function"
        ? window.DedogeiumSystems.getAdjustedCurrencyReward(numericAmount)
        : numericAmount;
    const newAmount = Math.max(0, current + appliedAmount);
    localStorage.setItem("currency", String(newAmount));
    return appliedAmount;
}

function addItemToInventory(item) {
    inventory.push(item);
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function generateRandomRarity() {
    const weights = window.DedogeiumSystems && typeof window.DedogeiumSystems.getAdjustedRarityWeights === "function"
        ? window.DedogeiumSystems.getAdjustedRarityWeights(levelConfig.rewardWeights)
        : levelConfig.rewardWeights;
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (let index = 0; index < rarities.length; index += 1) {
        cumulative += Number(weights[index]) || 0;
        if (roll <= cumulative) return rarities[index];
    }
    return rarities[rarities.length - 1];
}

function generateRewardItem() {
    return {
        name: levelConfig.rewardItemName,
        rarity: generateRandomRarity(),
        id: Date.now() + Math.floor(Math.random() * 1000),
    };
}

function getLevelShopContainer() {
    if (!victory) return null;
    let shopContainer = document.getElementById("level-shop");
    if (!shopContainer) {
        shopContainer = document.createElement("div");
        shopContainer.id = "level-shop";
        shopContainer.className = "level-shop";
        victory.insertBefore(shopContainer, home || null);
    }
    return shopContainer;
}

function setLevelShopMessage(message, isError = false) {
    levelShopMessage = message;
    levelShopMessageIsError = isError;
}

function buyLevelShopItem(shopItem) {
    if (getLevelCurrency() < shopItem.cost) {
        setLevelShopMessage("Not enough currency yet.", true);
        renderLevelShop();
        return;
    }

    addLevelCurrency(-shopItem.cost);
    addItemToInventory({ ...shopItem.item, id: Date.now() + Math.floor(Math.random() * 1000) });
    setLevelShopMessage(`Bought ${shopItem.label}!`);
    renderLevelShop();
}

function renderLevelShop() {
    const shopContainer = getLevelShopContainer();
    if (!shopContainer) return;

    const currency = getLevelCurrency();
    shopContainer.style.display = "block";
    shopContainer.innerHTML = "";

    const title = document.createElement("p");
    title.className = "level-shop-title";
    title.textContent = "Victory Shop";

    const currencyLine = document.createElement("p");
    currencyLine.className = "level-shop-currency";
    currencyLine.textContent = `Currency: ${currency}`;

    const list = document.createElement("div");
    list.className = "level-shop-list";

    levelConfig.shopItems.forEach((shopItem) => {
        const row = document.createElement("div");
        row.className = "level-shop-row";

        const label = document.createElement("div");
        label.className = "level-shop-item";
        label.textContent = `${shopItem.label} - ${shopItem.cost} currency`;

        const buyBtn = document.createElement("button");
        buyBtn.className = "level-shop-buy";
        buyBtn.textContent = "Buy";
        buyBtn.disabled = currency < shopItem.cost;
        buyBtn.addEventListener("click", () => {
            buyLevelShopItem(shopItem);
        });

        row.appendChild(label);
        row.appendChild(buyBtn);
        list.appendChild(row);
    });

    const message = document.createElement("p");
    message.className = "level-shop-message";
    message.style.color = levelShopMessageIsError ? "#c62828" : "#1b7f3a";
    message.textContent = levelShopMessage;

    shopContainer.appendChild(title);
    shopContainer.appendChild(currencyLine);
    shopContainer.appendChild(list);
    shopContainer.appendChild(message);
}

function hideLevelShop() {
    const shopContainer = document.getElementById("level-shop");
    if (shopContainer) {
        shopContainer.style.display = "none";
    }
}

function showVictoryReward(reward, rewardItem) {
    if (maybe_vic) {
        maybe_vic.innerHTML = `Victory! You earned ${reward} currency! You obtained: <br><strong>${rewardItem.name}</strong> <br><span style="color: gold;">[${rewardItem.rarity}]</span>`;
    }
    renderLevelShop();
    if (victory) victory.style.display = "block";
}

function showDefeatMessage(message) {
    if (maybe_vic) maybe_vic.textContent = message;
    hideLevelShop();
    if (victory) victory.style.display = "block";
}

function setDialogueButtonsVisible(visible) {
    const display = visible ? "inline-block" : "none";
    if (skipBtn) skipBtn.style.display = display;
}

function showDialogueLine(line) {
    speech_good.textContent = "";
    speech_bad.textContent = "";
    if (!line) return;
    if (line.speaker === "good") {
        speech_good.textContent = line.text;
    } else {
        speech_bad.textContent = line.text;
    }
    speakDialogueLine(line);
}

function startCutscene() {
    inCutscene = true;
    dialogueIndex = 0;
    if (skipAllDialogueEnabled || !levelConfig.dialogue.length) {
        endCutsceneAndStartBattle();
        return;
    }
    showDialogueLine(levelConfig.dialogue[0]);
    setDialogueButtonsVisible(true);
}

function showNextLine() {
    if (!inCutscene) return;
    dialogueIndex += 1;
    if (dialogueIndex < levelConfig.dialogue.length) {
        showDialogueLine(levelConfig.dialogue[dialogueIndex]);
        return;
    }
    endCutsceneAndStartBattle();
}

function startPostDialogue(lines, onComplete) {
    inPostDialogue = true;
    postDialogueIndex = 0;
    activePostDialogue = Array.isArray(lines) ? lines : [];
    pendingBattleResultAction = typeof onComplete === "function" ? onComplete : null;
    if (skipAllDialogueEnabled || !activePostDialogue.length) {
        endPostDialogue();
        return;
    }
    showDialogueLine(activePostDialogue[0]);
    setDialogueButtonsVisible(true);
}

function showNextPostLine() {
    if (!inPostDialogue) return;
    postDialogueIndex += 1;
    if (postDialogueIndex < activePostDialogue.length) {
        showDialogueLine(activePostDialogue[postDialogueIndex]);
        return;
    }
    endPostDialogue();
}

function endPostDialogue() {
    inPostDialogue = false;
    stopDialogueVoice();
    setDialogueButtonsVisible(false);
    activePostDialogue = [];
    const nextAction = pendingBattleResultAction;
    pendingBattleResultAction = null;
    if (nextAction) {
        nextAction();
        return;
    }
    if (victory) victory.style.display = "block";
}

function endCutsceneAndStartBattle() {
    inCutscene = false;
    stopDialogueVoice();
    setDialogueButtonsVisible(false);
    speech_good.textContent = "";
    speech_bad.textContent = "";
    enemy_hlth_element.style.display = "block";
    hlth_element.style.display = "block";
    applyEquipmentBonuses();
    loadhealth();
    setupCombatUI();
    if (battleEffects) battleEffects.ensureEffectsLayer();
    battleTurn = 1;
    if (battleSkills) battleSkills.startBattle();
    startPlayerTurn();
    beforeFightAudio.pause();
    duringFightAudio.loop = true;
    duringFightAudio.play();
}

function loadhealth() {
    enemy_health = Math.max(0, enemy_health);
    health = Math.max(0, health);
    enemy_hlth_element.textContent = `${enemy_health}/${enemy_max_health}`;
    hlth_element.textContent = `${health}/${max_health}`;
}

function setupCombatUI() {
    if (document.getElementById("combat-zone")) return;

    const combatZone = document.createElement("div");
    combatZone.id = "combat-zone";

    const bar = document.createElement("img");
    bar.id = "combat-bar";
    bar.src = "combat bar.png";
    bar.alt = "";

    const pointer = document.createElement("img");
    pointer.id = "combat-pointer";
    pointer.src = "combat pointer.png";
    pointer.alt = "";

    const message = document.createElement("div");
    message.id = "combat-message";

    combatZone.appendChild(bar);
    combatZone.appendChild(pointer);
    combatZone.appendChild(message);
    combatZone.addEventListener("pointerdown", (event) => {
        if (!combat.active || !combat.isPlayerTurn) return;
        event.preventDefault();
        handlePlayerStop();
    });
    document.body.appendChild(combatZone);
}

function showCombatUI(show) {
    const combatZone = document.getElementById("combat-zone");
    if (!combatZone) return;
    combatZone.style.display = show ? "block" : "none";
}

function updateCombatMessage(message, turnClass) {
    const combatZone = document.getElementById("combat-zone");
    const messageNode = document.getElementById("combat-message");
    if (combatZone) {
        combatZone.classList.remove("player-turn", "enemy-turn");
        if (turnClass) combatZone.classList.add(turnClass);
    }
    if (messageNode) {
        messageNode.textContent = message;
    }
}

function queueCombatTimeout(callback, delay) {
    if (combat.timeoutId) {
        clearTimeout(combat.timeoutId);
    }
    combat.timeoutId = window.setTimeout(callback, delay);
}

function startPlayerTurn() {
    const bar = document.getElementById("combat-bar");
    const pointer = document.getElementById("combat-pointer");
    if (!bar || !pointer) return;

    combat.isPlayerTurn = true;
    combat.active = true;
    showCombatUI(true);
    updateCombatMessage("Your turn. Press SPACE or tap the bar near the center for a stronger hit.", "player-turn");
    if (battleSkills) battleSkills.onPlayerTurnStart(battleTurn);

    const rect = bar.getBoundingClientRect();
    combat.barWidth = rect.width;
    combat.pointerWidth = pointer.clientWidth || combat.pointerWidth;
    combat.maxX = Math.max(0, combat.barWidth - combat.pointerWidth);
    combat.pointerPos = 0;
    combat.pointerDir = 1;
    pointer.style.left = "0px";

    if (combat.intervalId) {
        clearInterval(combat.intervalId);
    }
    combat.intervalId = setInterval(() => {
        if (!combat.active || !combat.isPlayerTurn) return;
        combat.pointerPos += combat.pointerDir * combat.speed;
        if (combat.pointerPos <= 0) {
            combat.pointerPos = 0;
            combat.pointerDir = 1;
        }
        if (combat.pointerPos >= combat.maxX) {
            combat.pointerPos = combat.maxX;
            combat.pointerDir = -1;
        }
        pointer.style.left = `${combat.pointerPos}px`;
    }, 12);
}

function calculatePlayerAccuracy() {
    if (combat.barWidth <= 0) return 0;
    const sweetSpotCenter = combat.barWidth * (904 / 1920);
    const pointerCenter = combat.pointerPos + (combat.pointerWidth / 2);
    const distance = Math.abs(pointerCenter - sweetSpotCenter);
    const maxDistance = Math.max(sweetSpotCenter, combat.barWidth - sweetSpotCenter);
    const ratio = Math.min(1, distance / maxDistance);
    return Math.max(0, 1 - ratio);
}

function calculateDamage(base, accuracy) {
    return Math.max(1, Math.round(base * (0.75 + 1.25 * accuracy)));
}

function enemyAccuracy() {
    if (Math.random() < 0.24) {
        return 0.84 + Math.random() * 0.16;
    }
    return 0.2 + Math.random() * 0.56;
}

function getEnemyAbilityForCurrentTurn() {
    return window.DedogeiumSystems && typeof window.DedogeiumSystems.getEnemyAbilityForTurn === "function"
        ? window.DedogeiumSystems.getEnemyAbilityForTurn(currentLevel, battleTurn)
        : null;
}

function applyPlayerAttackAdjustments(rawHit) {
    const hit = Math.max(1, Math.round(rawHit * pendingPlayerDamageMultiplier));
    const weakened = pendingPlayerDamageMultiplier < 0.999;
    pendingPlayerDamageMultiplier = 1;
    return { hit, weakened };
}

function triggerEnemySpecialAbility(baseHit) {
    const ability = getEnemyAbilityForCurrentTurn();
    if (!ability) {
        return {
            ability: null,
            healAmount: 0,
            hit: battleSkills ? battleSkills.applyIncomingEnemyDamage(baseHit) : baseHit,
        };
    }

    if (battleEffects && typeof battleEffects.triggerSpecialAbility === "function") {
        battleEffects.triggerSpecialAbility({
            attacker: "enemy",
            label: ability.name,
            variant: ability.variant,
            primaryColor: ability.primaryColor,
            secondaryColor: ability.secondaryColor,
            accentColor: ability.accentColor,
        });
    }

    const healAmount = ability.healPercent ? Math.round(enemy_max_health * ability.healPercent) : 0;
    if (healAmount > 0) {
        enemy_health = Math.min(enemy_max_health, enemy_health + healAmount);
    }
    if (ability.enemyDamageBoost) {
        enemy_damage += ability.enemyDamageBoost;
    }
    if (ability.nextPlayerDamageMultiplier) {
        pendingPlayerDamageMultiplier = Math.min(pendingPlayerDamageMultiplier, ability.nextPlayerDamageMultiplier);
    }

    const boostedHit = Math.max(1, Math.round(baseHit * (ability.damageMultiplier || 1)) + (ability.flatDamage || 0));
    return {
        ability,
        healAmount,
        hit: battleSkills ? battleSkills.applyIncomingEnemyDamage(boostedHit) : boostedHit,
    };
}

function formatEnemyAttackMessage(hit, accuracy, ability, healAmount) {
    if (!ability) {
        return `Enemy hit ${hit} damage with ${Math.round(accuracy * 100)}% accuracy.`;
    }

    const extras = [];
    if (healAmount > 0) extras.push(`healed ${healAmount}`);
    if (ability.enemyDamageBoost) extras.push("powered up");
    if (ability.nextPlayerDamageMultiplier && ability.nextPlayerDamageMultiplier < 1) extras.push("dulled your next hit");
    return `${ability.name}! Enemy hit ${hit} damage with ${Math.round(accuracy * 100)}% accuracy${extras.length ? ` and ${extras.join(" + ")}` : ""}.`;
}

function handlePlayerStop() {
    if (!combat.active || !combat.isPlayerTurn) return;

    clearInterval(combat.intervalId);
    combat.intervalId = null;
    combat.active = false;

    const accuracy = calculatePlayerAccuracy();
    const skillBonus = battleSkills ? battleSkills.consumePlayerDamageBonus() : 0;
    const rawHit = calculateDamage(damage, accuracy) + skillBonus;
    const attackResult = applyPlayerAttackAdjustments(rawHit);
    applyProjectileVisual(getPlayerProjectileConfig());
    if (battleEffects) battleEffects.triggerBattleAnimation("player", attackResult.hit, accuracy);
    enemy_health = Math.max(0, enemy_health - attackResult.hit);
    loadhealth();
    updateCombatMessage(
        `You hit ${attackResult.hit} damage with ${Math.round(accuracy * 100)}% accuracy.${attackResult.weakened ? " The enemy special softened the blow." : ""}`,
        "player-turn"
    );

    if (enemy_health <= 0) {
        queueCombatTimeout(() => finishBattle(true), 860);
        return;
    }

    damage *= 2;
    queueCombatTimeout(startEnemyTurn, 980);
}

function startEnemyTurn() {
    combat.isPlayerTurn = false;
    combat.active = false;
    showCombatUI(true);
    updateCombatMessage(`${levelConfig.enemyName} is charging up...`, "enemy-turn");
    if (battleSkills) battleSkills.onEnemyTurnStart(battleTurn);

    const accuracy = enemyAccuracy();
    const baseHit = calculateDamage(enemy_damage, accuracy);
    const abilityResult = triggerEnemySpecialAbility(baseHit);
    const hit = abilityResult.hit;
    queueCombatTimeout(() => {
        applyProjectileVisual(getEnemyProjectileConfig());
        if (battleEffects) battleEffects.triggerBattleAnimation("enemy", hit, accuracy, getEnemyAnimationOptions(abilityResult.ability));
        health = Math.max(0, health - hit);
        loadhealth();
        updateCombatMessage(formatEnemyAttackMessage(hit, accuracy, abilityResult.ability, abilityResult.healAmount), "enemy-turn");

        if (health <= 0) {
            queueCombatTimeout(() => finishBattle(false), 860);
            return;
        }

        enemy_damage *= 2;
        battleTurn += 1;
        queueCombatTimeout(startPlayerTurn, 980);
    }, 420);
}

function finishBattle(playerWon) {
    combat.active = false;
    combat.isPlayerTurn = false;
    clearInterval(combat.intervalId);
    combat.intervalId = null;
    if (combat.timeoutId) {
        clearTimeout(combat.timeoutId);
        combat.timeoutId = null;
    }

    showCombatUI(false);
    if (battleEffects) battleEffects.clearBattleAnimation();
    if (battleSkills) battleSkills.endBattle();

    if (playerWon) {
        const currentCompletedLevel = Number(localStorage.getItem("completedLevel") || "0");
        const unlockedLevel = currentLevel + 1;
        if (currentCompletedLevel < unlockedLevel) {
            localStorage.setItem("completedLevel", String(unlockedLevel));
        }
        if (window.DedogeiumSystems && typeof window.DedogeiumSystems.recordComputerVictory === "function") {
            window.DedogeiumSystems.recordComputerVictory();
        }
        const actualReward = addLevelCurrency(levelConfig.victoryCurrency);
        const rewardItem = generateRewardItem();
        addItemToInventory(rewardItem);
        postDialogueWinAudio.currentTime = 0;
        postDialogueWinAudio.play().catch(() => {});
        startPostDialogue(levelConfig.postDialogueWin, () => {
            showVictoryReward(actualReward, rewardItem);
        });
    } else {
        startPostDialogue(levelConfig.postDialogueLose, () => {
            showDefeatMessage("Defeated! Come back with stronger gear and sharper timing.");
        });
    }

    duringFightAudio.pause();
}

function initializeLevelPresentation() {
    document.title = `Level ${currentLevel}`;
    const promptTitle = document.querySelector(".prompt-title");
    const promptSubtitle = document.querySelector(".prompt-subtitle");
    if (promptTitle) {
        promptTitle.textContent = `Start Level ${currentLevel}?`;
    }
    if (promptSubtitle) {
        promptSubtitle.textContent = `Face ${levelConfig.enemyName} and watch for ${window.DedogeiumSystems && typeof window.DedogeiumSystems.getEnemyAbilityForTurn === "function" ? "special ability surges" : "special attacks"}.`;
    }
    if (enemyImg) {
        enemyImg.src = levelConfig.enemyImage;
        enemyImg.alt = levelConfig.enemyName;
    }
    if (crystal_attack) {
        applyProjectileVisual(getPlayerProjectileConfig());
    }
}

if (aprilFoolsEnabled) {
    if (playerImg) playerImg.src = "rick astley doge.png";
    beforeFightAudio.src = "rick roll.mp3";
    duringFightAudio.src = "rick roll.mp3";
}

initializeLevelPresentation();

home.addEventListener("click", () => {
    stopDialogueVoice();
    window.location.href = `${dedogeiumBasePath}adventure/`;
});

cancel_btn.addEventListener("click", () => {
    stopDialogueVoice();
    window.location.href = `${dedogeiumBasePath}adventure/`;
});

yes_btn.addEventListener("click", () => {
    yes_no.style.display = "none";
    startCutscene();
});

if (skipBtn) {
    skipBtn.addEventListener("click", () => {
        if (inCutscene) {
            showNextLine();
            return;
        }
        if (inPostDialogue) {
            showNextPostLine();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    if (!combat.active || !combat.isPlayerTurn) return;
    event.preventDefault();
    handlePlayerStop();
});

window.onload = () => {
    beforeFightAudio.loop = true;
    beforeFightAudio.play().catch(() => {});
};

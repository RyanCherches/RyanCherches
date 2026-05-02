const yes_no = document.getElementById("yes-no"); 
const yes_btn = document.getElementById("ok-btn");
const cancel_btn = document.getElementById("cancel-btn");
const enemy_hlth_element = document.getElementById("enemy-hlth");
const hlth_element = document.getElementById("hlth");
const victory = document.getElementById("victory");
const home = document.getElementById("bye-btn");
const speech_good = document.getElementById("speech-good");
const speech_bad = document.getElementById("speech-bad");
const skipBtn = document.getElementById("skip-btn");
const crystal_attack = document.getElementById("crystal_attack");
const beforeFightAudio = new Audio("before fight.mp3");
const duringFightAudio = new Audio("during fight.mp3");
const postDialogueWinAudio = null;
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const musicVolumeNormalized = Math.min(1, Math.max(0, musicVolume / 100));
beforeFightAudio.volume = musicVolumeNormalized;
duringFightAudio.volume = musicVolumeNormalized;
if (postDialogueWinAudio) postDialogueWinAudio.volume = musicVolumeNormalized;
const maybe_vic = document.getElementById("maybe-vic");
const completedLevel = Number(localStorage.getItem("completedLevel"));
const currentLevel = 5;
const aprilFoolsEnabled = localStorage.getItem("aprilFoolsEnabled") === "true";
const skipAllDialogueEnabled = localStorage.getItem("skipAllDialogueEnabled") === "true";
const playerImg = document.querySelector(".character-container.player img");
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
        crystalAttack: crystal_attack
    })
    : null;
let battleTurn = 1;
const battleSkills = window.DedogeiumSystems && typeof window.DedogeiumSystems.createBattleSkillsController === "function"
    ? window.DedogeiumSystems.createBattleSkillsController({
        getCombatZone: () => document.getElementById("combat-zone"),
        getHealth: () => health,
        getMaxHealth: () => max_health,
        setHealth: (value) => { health = value; },
        getEnemyHealth: () => enemy_health,
        getEnemyMaxHealth: () => enemy_max_health,
        updateHealthUi: loadhealth,
        updateCombatMessage: (text) => {
            const message = document.getElementById("combat-message");
            if (message) message.innerText = text;
        },
        isPlayerTurn: () => combat.isPlayerTurn,
        isBattleActive: () => combat.active,
    })
    : null;
let pendingPlayerDamageMultiplier = 1;

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

function formatEnemyAttackMessage(hit, acc, ability, healAmount) {
    if (!ability) {
        return `Enemy hit ${hit} (accuracy ${Math.round(acc * 100)}%).`;
    }

    const extras = [];
    if (healAmount > 0) extras.push(`healed ${healAmount}`);
    if (ability.enemyDamageBoost) extras.push("powered up");
    if (ability.nextPlayerDamageMultiplier && ability.nextPlayerDamageMultiplier < 1) extras.push("dulled your next hit");
    return `${ability.name}! Enemy hit ${hit} (accuracy ${Math.round(acc * 100)}%)${extras.length ? ` and ${extras.join(" + ")}` : ""}.`;
}
const dialogueVoice = window.DedogeiumDialogueVoice || null;
if (dialogueVoice && typeof dialogueVoice.registerMusicAudio === "function") {
    dialogueVoice.registerMusicAudio(beforeFightAudio, { baseVolume: musicVolumeNormalized });
    dialogueVoice.registerMusicAudio(duringFightAudio, { baseVolume: musicVolumeNormalized });
    if (postDialogueWinAudio) {
        dialogueVoice.registerMusicAudio(postDialogueWinAudio, { baseVolume: musicVolumeNormalized });
    }
}
const dialogueVoiceMap = {
    good: { characterKey: "dedogeium-player", team: "player" },
    bad: { characterKey: "level5-enemy", team: "enemy" },
};

function speakDialogueLine(line) {
    if (!line || !dialogueVoice) return;
    const voiceOptions = dialogueVoiceMap[line.speaker] || dialogueVoiceMap.good;
    dialogueVoice.speak(line.text, voiceOptions);
}

function stopDialogueVoice() {
    if (!dialogueVoice) return;
    dialogueVoice.stop();
}

if (aprilFoolsEnabled) {
    // April 1 only: swap main character + music to Rick Astley.
    if (playerImg) playerImg.src = "rick astley doge.png";
    beforeFightAudio.src = "rick roll.mp3";
    duringFightAudio.src = "rick roll.mp3";
}

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Godly"];
const rarityWeights = [20, 28, 30, 15, 6, 1];
function getDedogeiumBasePath() {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const dedogeiumIndex = pathSegments.indexOf("dedogeium");
    if (dedogeiumIndex === -1) {
        return "/";
    }
    return `/${pathSegments.slice(0, dedogeiumIndex + 1).join("/")}/`;
}

const dedogeiumBasePath = getDedogeiumBasePath();

home.addEventListener("click", function() {
    stopDialogueVoice();
    window.location.href = `${dedogeiumBasePath}adventure/`;
});

window.onload = function() {
    beforeFightAudio.loop = true;
    beforeFightAudio.play();
}

const rarityBonuses = {
    "Common": { damage: 2, health: 50 },
    "Uncommon": { damage: 5, health: 100 },
    "Rare": { damage: 10, health: 150 },
    "Epic": { damage: 20, health: 250 },
    "Legendary": { damage: 40, health: 400 },
    "Godly": { damage: 80, health: 600 }
};
const fireRarityBonuses = {
    "Common": { damage: 6, health: 125 },
    "Uncommon": { damage: 12, health: 165 },
    "Rare": { damage: 22, health: 275 },
    "Epic": { damage: 42, health: 550 },
    "Legendary": { damage: 85, health: 700 },
    "Godly": { damage: 100, health: 900 }
};
if (aprilFoolsEnabled) {
    playerImg.src = "rick astley doge.png";
}
function getItemBonus(item) {
    if (item && item.name === "Soccer Ball") {
        return { damage: 0, health: 0 };
    }
    if (item && item.name === "Fire Doge") {
        return fireRarityBonuses[item.rarity] || { damage: 0, health: 0 };
    }
    return rarityBonuses[item && item.rarity] || { damage: 0, health: 0 };
}

function applyEquipmentBonuses() {
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    let totalDamageBonus = 0;
    let totalHealthBonus = 0;
    
    equippedItems.forEach(item => {
        const bonus = getItemBonus(item);
        totalDamageBonus += bonus.damage;
        totalHealthBonus += bonus.health;
    });
    
    damage += totalDamageBonus;
    max_health += totalHealthBonus;
    health = max_health;
    
    console.log(`Equipment applied: +${totalDamageBonus} damage, +${totalHealthBonus} max health`);
}
const enemy_max_health = 1000;
let enemy_health = 1000;
let max_health = 500;
let health = 500;
let damage = 20;
let enemy_damage = 20;

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

const levelShopItems = [
    { label: "Common Doge", cost: 10, item: { name: "Doge", rarity: "Common" } },
    { label: "Uncommon Doge", cost: 20, item: { name: "Doge", rarity: "Uncommon" } },
    { label: "Rare Fire Doge", cost: 50, item: { name: "Fire Doge", rarity: "Rare" } }
];

let levelShopMessage = "";
let levelShopMessageIsError = false;

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

    levelShopItems.forEach((shopItem) => {
        const row = document.createElement("div");
        row.className = "level-shop-row";

        const label = document.createElement("div");
        label.className = "level-shop-item";
        label.textContent = `${shopItem.label} - ${shopItem.cost} currency`;

        const buyBtn = document.createElement("button");
        buyBtn.className = "level-shop-buy";
        buyBtn.textContent = "Buy";
        buyBtn.disabled = currency < shopItem.cost;
        buyBtn.addEventListener("click", function() {
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

cancel_btn.addEventListener("click", function() {
    stopDialogueVoice();
    window.location.href = `${dedogeiumBasePath}adventure/`;
});

let speechTimeoutId = null;

// cutscene/dialogue state
const rickdialogue = [
    { speaker: 'good', text: "Never gonna give you up." },
    { speaker: 'bad', text: "Stop. You are an old meme. Not to hate on you, but please don't do it." },
    { speaker: 'good', text: "Never gonna let you down." },
    { speaker: 'bad', text: "Yeah no thats it, lets battle, just get right into it, and I better not here a single word out of you." },
    { speaker: 'good', text: "Never" },
    { speaker: 'bad', text: "Please shut up. Just shut up." },
    { speaker: 'good', text: "ok:(" },
];
const dialogue = [
    { speaker: 'good', text: "Don't do it brother." },
    { speaker: 'bad', text: "I must do it brother, they are better than us." },
    { speaker: 'good', text: "I knew you were a traitor." },
    { speaker: 'bad', text: "I had no choice, they are clearly stronger than us." },
    { speaker: 'good', text: "That's called propaganda." },
    { speaker: 'bad', text: "You know what? Let's fight to see who is right." },
    { speaker: 'good', text: "I will get better gear over time; maybe we should do multiple fights or wait till the end." },
    { speaker: 'bad', text: "We'll decide along the way. Good luck, brother." }
];
const activeDialogue = aprilFoolsEnabled ? rickdialogue : dialogue;
let dialogueIndex = 0;
let inCutscene = false;

// post-battle dialogue (speaking after the fight)
const postDialogue = [
    { speaker: 'good', text: "I will win one day. I will get the best gear and beat you." },
    { speaker: 'bad', text: "Exuces. Exuces. Exuces." },
    { speaker: 'good', text: "You think your so cool, well lets find out soon." },
    { speaker: 'bad', text: "Well then see you soon." }
];
let postIndex = 0;
let inPostDialogue = false;
const postDialogueWin = [
    { speaker: 'good', text: "I told you I would beat you!" },
    { speaker: 'bad', text: "How much did you grind?" },
    { speaker: 'good', text: "Only for like 5 hours:)" },
    { speaker: 'bad', text: "bru... I will beat you next time though." }
];

function setDialogueButtonsVisible(visible) {
    const display = visible ? "inline-block" : "none";
    if (skipBtn) skipBtn.style.display = display;
}

function speech() {
    // clear any ongoing cutscene state and pending timeouts
    inCutscene = false;
    dialogueIndex = 0;
    if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
        speechTimeoutId = null;
    }
    stopDialogueVoice();
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    setDialogueButtonsVisible(false);
}

function showLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = activeDialogue[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
    speakDialogueLine(line);
}

function showPostLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = postDialogue[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
    speakDialogueLine(line);
}

function showPostWinLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = postDialogueWin[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
    speakDialogueLine(line);
}

function showNextLine() {
    if (!inCutscene) return;
    dialogueIndex++;
    if (dialogueIndex < activeDialogue.length) {
        showLine(dialogueIndex);
    } else {
        endCutsceneAndStartBattle();
    }
}

function showNextPostLine() {
    if (!inPostDialogue) return;
    postIndex++;
    if (postIndex < postDialogue.length) {
        showPostLine(postIndex);
    } else {
        endPostDialogue();
    }
}

function showNextPostWinLine() {
    if (!inPostDialogue) return;
    postIndex++;
    if (postIndex < postDialogueWin.length) {
        showPostWinLine(postIndex);
    } else {
        endPostDialogue();
    }
}

function startPostDialogue() {
    inPostDialogue = true;
    postIndex = 0;
    if (skipAllDialogueEnabled) {
        endPostDialogue();
        return;
    }
    showPostLine(0);
    setDialogueButtonsVisible(true);
}

function startPostDialogueWin() {
    inPostDialogue = true;
    postIndex = 0;
    if (skipAllDialogueEnabled) {
        endPostDialogue();
        return;
    }
    showPostWinLine(0);
    setDialogueButtonsVisible(true);
    if (postDialogueWinAudio) {
        postDialogueWinAudio.loop = false;
        postDialogueWinAudio.play().catch(() => {});
    }
}

function endPostDialogue() {
    inPostDialogue = false;
    stopDialogueVoice();
    setDialogueButtonsVisible(false);
    // show victory UI after post-dialogue finishes
    if (victory) victory.style.display = "block";
}

function startCutscene() {
    inCutscene = true;
    dialogueIndex = 0;
    if (skipAllDialogueEnabled) {
        endCutsceneAndStartBattle();
        return;
    }
    showLine(0);
    setDialogueButtonsVisible(true);
}

function endCutsceneAndStartBattle() {
    inCutscene = false;
    stopDialogueVoice();
    setDialogueButtonsVisible(false);
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    // begin the fight
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

// start cutscene on OK, instead of instantly starting the battle
yes_btn.addEventListener("click", function (){
    yes_no.style.display = "none";
    speech();
    startCutscene();
});

// skip button advances to the next line in the cutscene
if (skipBtn) {
    skipBtn.addEventListener('click', function() {
        if (inCutscene) {
            showNextLine();
            return;
        }
        if (inPostDialogue) {
            // check which dialogue we're in
            if (postIndex < postDialogueWin.length && health > 0) {
                showNextPostWinLine();
            } else {
                showNextPostLine();
            }
            return;
        }
    });
}


async function battleLoop() {
    while (enemy_health > 0 && health > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attack()
        loadhealth()
        if (enemy_health <= 0) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        enemy_attack()
        loadhealth()
        damage *= 2;
        enemy_damage *= 2;
    }
    const hasWon = enemy_health <= 0;
    const currentCompletedLevel = Number(localStorage.getItem("completedLevel")) || 0;
    if (hasWon && currentCompletedLevel < 6) {
        localStorage.setItem("completedLevel", 6);
    }
    // Award currency for victory
    let reward = 0;
    if (hasWon) {
        reward = 15 + (currentLevel - 2) * 10;
        reward = addLevelCurrency(reward);
    }
    // start post-battle dialogue (win or loss)
    duringFightAudio.pause();
    if (hasWon) {
        const rewardItem = generateRewardItem();
        addItemToInventory(rewardItem);
        if (maybe_vic) {
            maybe_vic.innerHTML = `Victory! You earned ${reward} currency! You obtained: <br><strong>${rewardItem.name}</strong> <br><span style="color: gold;">[${rewardItem.rarity}]</span>`;
        }
        renderLevelShop();
        startPostDialogueWin();
    } else {
        if (maybe_vic) maybe_vic.innerHTML = "Grind more gear to beat this level.";
        hideLevelShop();
        startPostDialogue();
    }
}
function loadhealth() {
    if (enemy_health <= 0) {
        enemy_health = 0;
    }
    if (health <= 0) {
        health = 0;
    }
    enemy_hlth_element.innerHTML = enemy_health +"/" + enemy_max_health;
    hlth_element.innerHTML = health +"/" + max_health;
    
}
function attack() {
    if (crystal_attack) {
        crystal_attack.style.display = "block";
        crystal_attack.classList.remove("attack-strike");
        void crystal_attack.offsetWidth; // trigger reflow to restart animation
        crystal_attack.classList.add("attack-strike");
    }
    enemy_health -= damage;
}
function enemy_attack() {
    if (crystal_attack) {
        crystal_attack.style.display = "none";
    }
    health -= enemy_damage;
}

function generateRandomRarity() {
    const weights = window.DedogeiumSystems && typeof window.DedogeiumSystems.getAdjustedRarityWeights === "function"
        ? window.DedogeiumSystems.getAdjustedRarityWeights(rarityWeights)
        : rarityWeights;
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < rarities.length; i++) {
        cumulative += Number(weights[i]) || 0;
        if (roll <= cumulative) return rarities[i];
    }
    return rarities[rarities.length - 1];
}

function generateRewardItem() {
    const randomRarity = generateRandomRarity();
    return {
        name: "Fire Doge",
        rarity: randomRarity,
        id: Date.now() + Math.floor(Math.random() * 1000)
    };
}

function addItemToInventory(item) {
    inventory.push(item);
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

const combat = {
    active: false,
    isPlayerTurn: true,
    pointerPos: 0,
    pointerDir: 1,
    speed: 3.5,
    intervalId: null,
    barWidth: 0,
    pointerWidth: 40,
    maxX: 0
};

function setupCombatUI() {
    const game = document.getElementById("game");
    if (!game) return;
    if (document.getElementById("combat-zone")) return;
    const combatZone = document.createElement("div");
    combatZone.id = "combat-zone";
    const bar = document.createElement("img");
    bar.id = "combat-bar";
    bar.src = "combat bar.png";
    const pointer = document.createElement("img");
    pointer.id = "combat-pointer";
    pointer.src = "combat pointer.png";
    const message = document.createElement("div");
    message.id = "combat-message";

    combatZone.appendChild(bar);
    combatZone.appendChild(pointer);
    combatZone.appendChild(message);
    document.body.appendChild(combatZone);
}

function showCombatUI(show) {
    const combatZone = document.getElementById("combat-zone");
    if (!combatZone) return;
    combatZone.style.display = show ? "block" : "none";
}

function startPlayerTurn() {
    combat.isPlayerTurn = true;
    combat.active = true;
    showCombatUI(true);

    const bar = document.getElementById("combat-bar");
    const pointer = document.getElementById("combat-pointer");
    const message = document.getElementById("combat-message");
    if (!bar || !pointer || !message) return;

    const rect = bar.getBoundingClientRect();
    combat.barWidth = rect.width;
    combat.pointerWidth = pointer.clientWidth || combat.pointerWidth;
    combat.maxX = Math.max(0, combat.barWidth - combat.pointerWidth);
    combat.pointerPos = 0;
    combat.pointerDir = 1;
    pointer.style.left = "0px";
    message.innerText = "Your turn! Press SPACE to stop pointer near center for higher damage.";
    if (battleSkills) battleSkills.onPlayerTurnStart(battleTurn);

    if (combat.intervalId) clearInterval(combat.intervalId);
    combat.intervalId = setInterval(() => {
        if (!combat.active || !combat.isPlayerTurn) return;
        combat.pointerPos += combat.pointerDir * combat.speed;
        if (combat.pointerPos <= 0) { combat.pointerPos = 0; combat.pointerDir = 1; }
        if (combat.pointerPos >= combat.maxX) { combat.pointerPos = combat.maxX; combat.pointerDir = -1; }
        pointer.style.left = `${combat.pointerPos}px`;
    }, 12);
}

function calculatePlayerAccuracy() {
    if (combat.barWidth <= 0) return 0;
    const sweetSpotCenter = combat.barWidth * (904 / 1920);
    const pointerCenter = combat.pointerPos + (combat.pointerWidth / 2);
    const dist = Math.abs(pointerCenter - sweetSpotCenter);
    const maxDistance = Math.max(sweetSpotCenter, combat.barWidth - sweetSpotCenter);
    const ratio = Math.min(1, dist / maxDistance);
    return Math.max(0, 1 - ratio);
}

function calculateDamage(base, acc) {
    return Math.max(1, Math.round(base * (0.75 + 1.25 * acc)));
}

function enemyAccuracy() {
    if (Math.random() < 0.2) {
        return 0.85 + Math.random() * 0.15;
    }
    return Math.random() * 0.6;
}

function handlePlayerStop() {
    if (!combat.active || !combat.isPlayerTurn) return;
    clearInterval(combat.intervalId);
    combat.intervalId = null;
    combat.active = false;

    const acc = calculatePlayerAccuracy();
    const skillBonus = battleSkills ? battleSkills.consumePlayerDamageBonus() : 0;
    const rawHit = calculateDamage(damage, acc) + skillBonus;
    const attackResult = applyPlayerAttackAdjustments(rawHit);
    if (battleEffects) battleEffects.triggerBattleAnimation("player", attackResult.hit, acc);
    enemy_health = Math.max(0, enemy_health - attackResult.hit);
    loadhealth();

    const message = document.getElementById("combat-message");
    if (message) message.innerText = `You hit ${attackResult.hit} (accuracy ${Math.round(acc * 100)}%).${attackResult.weakened ? " The enemy special softened the blow." : ""}`;

    if (enemy_health <= 0) {
        finishBattle(true);
        return;
    }

    damage *= 2;
    setTimeout(startEnemyTurn, 900);
}

function startEnemyTurn() {
    combat.isPlayerTurn = false;
    showCombatUI(true);
    const message = document.getElementById("combat-message");
    if (message) message.innerText = "Enemy is charging...";
    if (battleSkills) battleSkills.onEnemyTurnStart(battleTurn);

    const acc = enemyAccuracy();
    const baseHit = calculateDamage(enemy_damage, acc);
    const abilityResult = triggerEnemySpecialAbility(baseHit);
    const hit = abilityResult.hit;
    if (battleEffects) battleEffects.triggerBattleAnimation("enemy", hit, acc);
    health = Math.max(0, health - hit);
    loadhealth();
    if (message) message.innerText = formatEnemyAttackMessage(hit, acc, abilityResult.ability, abilityResult.healAmount);

    if (health <= 0) {
        finishBattle(false);
        return;
    }

    enemy_damage *= 2;
    battleTurn += 1;
    setTimeout(startPlayerTurn, 900);
}

function finishBattle(playerWon) {
    combat.active = false;
    combat.isPlayerTurn = false;
    clearInterval(combat.intervalId);
    combat.intervalId = null;
    showCombatUI(false);
    if (battleSkills) battleSkills.endBattle();

    if (playerWon) {
        const currentCompletedLevel = Number(localStorage.getItem("completedLevel")) || 0;
        if (currentCompletedLevel < 6) localStorage.setItem("completedLevel", "6");
        if (window.DedogeiumSystems && typeof window.DedogeiumSystems.recordComputerVictory === "function") {
            window.DedogeiumSystems.recordComputerVictory();
        }
        const reward = 15 + (currentLevel - 2) * 10;
        const actualReward = addLevelCurrency(reward);
        const rewardItem = generateRewardItem();
        addItemToInventory(rewardItem);
        showVictoryReward(actualReward, rewardItem);
    } else {
        showDefeatMessage("Defeated! Grind and try again.");
    }
    duringFightAudio.pause();
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        if (combat.active && combat.isPlayerTurn) { handlePlayerStop(); event.preventDefault(); }
    }
});



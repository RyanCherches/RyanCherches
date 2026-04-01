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
const postDialogueWinAudio = new Audio("postDialogueWin.mp3");
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const musicVolumeNormalized = Math.min(1, Math.max(0, musicVolume / 100));
beforeFightAudio.volume = musicVolumeNormalized;
duringFightAudio.volume = musicVolumeNormalized;
postDialogueWinAudio.volume = musicVolumeNormalized;
const maybe_vic = document.getElementById("maybe-vic");
const completedLevel = Number(localStorage.getItem("completedLevel"));
const aprilFoolsEnabled = localStorage.getItem("aprilFoolsEnabled") === "true";
const playerImg = document.querySelector(".character-container.player img");

if (aprilFoolsEnabled) {
    // April 1 only: swap main character + music to Rick Astley.
    if (playerImg) playerImg.src = "rick astley doge.png";
    beforeFightAudio.src = "rick roll.mp3";
    duringFightAudio.src = "rick roll.mp3";
}

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Godly"];
const rarityWeights = [75, 25, 0, 0, 0, 0];
home.addEventListener("click", function() {
    window.location.href = "adventure.html";
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
const enemy_max_health = 1200;
let enemy_health = 1200;
let max_health = 500;
let health = 500;
let damage = 20;
let enemy_damage = 20;

cancel_btn.addEventListener("click", function() {
    window.location.href = "adventure.html";
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
    { speaker: 'good', text: "I see you must be on fire!" },
    { speaker: 'bad', text: "Hahaha. That was so funny, I forgot to laugh." },
    { speaker: 'good', text: "Oh common. That was kinda funny." },
    { speaker: 'bad', text: "Lets move on. What brings you here?" },
    { speaker: 'good', text: "My stupid cousin who decided to switch sides." },
    { speaker: 'bad', text: "You know what? Let's fight to see if your cousin really is stupid." },
    { speaker: 'good', text: "Ok deal." },
];
const activeDialogue = aprilFoolsEnabled ? rickdialogue : dialogue;
let dialogueIndex = 0;
let inCutscene = false;

// post-battle dialogue (speaking after the fight)
const postDialogue = [
    { speaker: 'good', text: "I am just a little tired from my other battles. I need some sleep and better gear." },
    { speaker: 'bad', text: "Exuces. Exuces. Exuces." },
    { speaker: 'good', text: "You got me, but I will win sometime." },
    { speaker: 'bad', text: "Sure buddy. Then see you soon." }
];
let postIndex = 0;
let inPostDialogue = false;
const postDialogueWin = [
    { speaker: 'good', text: "I beat you!" },
    { speaker: 'bad', text: "There are many more people to fight against. Good luck. You will need it." },
];

function speech() {
    // clear any ongoing cutscene state and pending timeouts
    inCutscene = false;
    dialogueIndex = 0;
    if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
        speechTimeoutId = null;
    }
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    if (skipBtn) skipBtn.style.display = 'none';
}

function showLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = activeDialogue[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
}

function showPostLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = postDialogue[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
}

function showPostWinLine(index) {
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    const line = postDialogueWin[index];
    if (!line) return;
    if (line.speaker === 'good') speech_good.innerText = line.text;
    else speech_bad.innerText = line.text;
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
    showPostLine(0);
    if (skipBtn) skipBtn.style.display = 'inline-block';
}

function startPostDialogueWin() {
    inPostDialogue = true;
    postIndex = 0;
    showPostWinLine(0);
    if (skipBtn) skipBtn.style.display = 'inline-block';
    postDialogueWinAudio.loop = false;
    postDialogueWinAudio.play();
}

function endPostDialogue() {
    inPostDialogue = false;
    if (skipBtn) skipBtn.style.display = 'none';
    // show victory UI after post-dialogue finishes
    if (victory) victory.style.display = "block";
}

function startCutscene() {
    inCutscene = true;
    dialogueIndex = 0;
    showLine(0);
    if (skipBtn) skipBtn.style.display = 'inline-block';
}

function endCutsceneAndStartBattle() {
    inCutscene = false;
    if (skipBtn) skipBtn.style.display = 'none';
    speech_good.innerHTML = "";
    speech_bad.innerHTML = "";
    // begin the fight
    enemy_hlth_element.style.display = "block";
    hlth_element.style.display = "block";
    applyEquipmentBonuses();
    loadhealth();
    setupCombatUI();
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
    if (hasWon && currentCompletedLevel < 7) {
        localStorage.setItem("completedLevel", 7);
    }
    // start post-battle dialogue (win or loss)
    duringFightAudio.pause();
    if (hasWon) {
        const rewardItem = generateRewardItem();
        addItemToInventory(rewardItem);
        if (maybe_vic) {
            maybe_vic.innerHTML = `Victory! You obtained: <br><strong>${rewardItem.name}</strong> <br><span style="color: gold;">[${rewardItem.rarity}]</span>`;
        }
        startPostDialogueWin();
    } else {
        if (maybe_vic) maybe_vic.innerHTML = "Grind more gear to beat this level.";
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
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < rarities.length; i++) {
        cumulative += rarityWeights[i];
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
    if (combat.maxX <= 0) return 0;
    const center = combat.maxX / 2;
    const dist = Math.abs(combat.pointerPos - center);
    const ratio = Math.min(1, dist / center);
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
    const hit = calculateDamage(damage, acc);
    enemy_health = Math.max(0, enemy_health - hit);
    loadhealth();

    const message = document.getElementById("combat-message");
    if (message) message.innerText = `You hit ${hit} (accuracy ${Math.round(acc * 100)}%).`;

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

    const acc = enemyAccuracy();
    const hit = calculateDamage(enemy_damage, acc);
    health = Math.max(0, health - hit);
    loadhealth();
    if (message) message.innerText = `Enemy hit ${hit} (accuracy ${Math.round(acc * 100)}%).`;

    if (health <= 0) {
        finishBattle(false);
        return;
    }

    enemy_damage *= 2;
    setTimeout(startPlayerTurn, 900);
}

function finishBattle(playerWon) {
    combat.active = false;
    combat.isPlayerTurn = false;
    clearInterval(combat.intervalId);
    combat.intervalId = null;
    showCombatUI(false);

    if (playerWon) {
        const rewardItem = generateRewardItem();
        addItemToInventory(rewardItem);
        if (maybe_vic) maybe_vic.innerHTML = `Victory! You obtained: <br><strong>${rewardItem.name}</strong> <br><span style="color: gold;">[${rewardItem.rarity}]</span>`;
        if (victory) victory.style.display = "block";
    } else {
        if (maybe_vic) maybe_vic.innerHTML = "Defeated! Grind and try again.";
        if (victory) victory.style.display = "block";
    }
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        if (combat.active && combat.isPlayerTurn) { handlePlayerStop(); event.preventDefault(); }
    }
});


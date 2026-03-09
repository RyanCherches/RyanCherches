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
const maybe_vic = document.getElementById("maybe-vic");
const completedLevel = Number(localStorage.getItem("completedLevel"));

let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Godly"];
const rarityWeights = [20, 28, 30, 15, 6, 1];
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
const enemy_max_health = 1000;
let enemy_health = 1000;
let max_health = 500;
let health = 500;
let damage = 20;
let enemy_damage = 20;

cancel_btn.addEventListener("click", function() {
    window.location.href = "adventure.html";
});

let speechTimeoutId = null;

// cutscene/dialogue state
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
    const line = dialogue[index];
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
    if (dialogueIndex < dialogue.length) {
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
    battleLoop();
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

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
const beforeFightAudio = new Audio("before fight.mp3");
const duringFightAudio = new Audio("during fight.mp3");
const maybe_vic = document.getElementById("maybe-vic");
localStorage.getItem("completedLevel");

home.addEventListener("click", function() {
    window.location.href = "adventure.html";
});

window.onload = function() {
    beforeFightAudio.loop = true;
    beforeFightAudio.play();
}

const enemy_max_health = 300;
let enemy_health = 300;
const max_health = 500;
let health = 500;
let damage = 20;
let enemy_damage = 30;

cancel_btn.addEventListener("click", function() {
    window.location.href = "adventure.html";
    
});
let speechTimeoutId = null;

// cutscene/dialogue state
const dialogue = [
    { speaker: 'good', text: "I am here to show my brother who did the better choice." },
    { speaker: 'bad', text: "Oh I know your brother. He will be a big help" },
    { speaker: 'good', text: "May you give me something?" },
    { speaker: 'bad', text: "Only if you defeat me first(later update)." },
    { speaker: 'good', text: "Thats fine." },
    { speaker: 'bad', text: "Ok. Good luck" },
];
let dialogueIndex = 0;
let inCutscene = false;

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

function showNextLine() {
    if (!inCutscene) return;
    dialogueIndex++;
    if (dialogueIndex < dialogue.length) {
        showLine(dialogueIndex);
    } else {
        endCutsceneAndStartBattle();
    }
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
    loadhealth();
    battleLoop();
    beforeFightAudio.pause();
    duringFightAudio.loop = true;
    duringFightAudio.play();
}
yes_btn.addEventListener("click", function (){
    // yes_no.style.display = "none";
    // enemy_hlth_element.style.display = "block";
    // hlth_element.style.display = "block";
    // loadhealth();
    // battleLoop();
    // beforeFightAudio.pause();
    // duringFightAudio.loop = true;
    // duringFightAudio.play();
    yes_no.style.display = "none";
    speech();
    startCutscene();
});

// skip button advances to the next line in the cutscene
if (skipBtn) {
    skipBtn.addEventListener('click', function() {
        if (!inCutscene) return;
        showNextLine();
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
    localStorage.setItem("completedLevel", 3);
    victory.style.display = "block";
    if (enemy_health > 0) {
        maybe_vic.innerHTML = "One more level and you level up!";
    }
    duringFightAudio.pause();
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
    enemy_health -= damage;
}
function enemy_attack() {
    health -= enemy_damage;
}
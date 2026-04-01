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
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
const musicVolumeNormalized = Math.min(1, Math.max(0, musicVolume / 100));
beforeFightAudio.volume = musicVolumeNormalized;
duringFightAudio.volume = musicVolumeNormalized;
const completedLevel = Number(localStorage.getItem("completedLevel"));
const aprilFoolsEnabled = localStorage.getItem("aprilFoolsEnabled") === "true";
const playerImg = document.querySelector(".character-container.player img");

if (aprilFoolsEnabled) {
    // April 1 only: swap main character + music to Rick Astley.
    if (playerImg) playerImg.src = "rick astley doge.png";
    beforeFightAudio.src = "rick roll.mp3";
    duringFightAudio.src = "rick roll.mp3";
}
    
const routeBase = window.location.pathname.endsWith('.html') ? '' : '../';

home.addEventListener("click", function() {
    window.location.href = routeBase + "adventure/";
});

window.onload = function() {
    beforeFightAudio.loop = true;
    beforeFightAudio.play();
}

const enemy_max_health = 1000;
let enemy_health = 1000;
const max_health = 500;
let health = 500;
let damage = 20;
let enemy_damage = 20;

cancel_btn.addEventListener("click", function() {
    window.location.href = routeBase + "adventure/";
});

let speechTimeoutId = null;

// cutscene/dialogue state
const rickdialogue = [
    { speaker: 'good', text: "Never gonna give you up." },
    { speaker: 'bad', text: "stop. you are an old meme. Not to hate on you but just don't do it." },
    { speaker: 'good', text: "Never gonna let you down." },
    { speaker: 'bad', text: "Yeah no thats it, lets battle, just get right into it, and I better not here a single word out of you." },
    { speaker: 'good', text: "Never" },
    { speaker: 'bad', text: "Please shut up. Just shut up." },
    { speaker: 'good', text: "ok:(" },
]
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
    { speaker: 'bad', text: "Excuses. Exuces. Exuces." },
    { speaker: 'good', text: "You think your so cool, well lets find out soon." },
    { speaker: 'bad', text: "Well then see you soon." }
];
let postIndex = 0;
let inPostDialogue = false;

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

function startPostDialogue() {
    inPostDialogue = true;
    postIndex = 0;
    showPostLine(0);
    if (skipBtn) skipBtn.style.display = 'inline-block';
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
            showNextPostLine();
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
    Number(localStorage.getItem("completedLevel"));
    if (completedLevel < 2) {
        localStorage.setItem("completedLevel", 2);
    }
    // start post-battle dialogue that uses the same speaking placement
    startPostDialogue();
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


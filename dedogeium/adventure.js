const dogeAttack = document.getElementById("doge-attack");
const dogeAttack2 = document.getElementById("doge-attack2");
const dogeAttack3 = document.getElementById("doge-attack3");
const greenDoge = document.getElementById("green-doge");
const redDoge = document.getElementById("red-doge");
const blueDoge = document.getElementById("spooky-doge");
const rainbowDoge = document.getElementById("rainbow-doge");
const secondCousin = document.getElementById("second-cousin-doge");
const firstRed = document.getElementById("first-red-doge");
const firstBossRed = document.getElementById("firstboss-red-doge");
const finalBossRed = document.getElementById("finalboss-red-doge");
const music = new Audio("rick roll.mp3");
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;

const today = new Date();
const isAprilFools = today.getMonth() === 3 && today.getDate() === 1;

music.loop = true;
music.volume = Math.min(1, Math.max(0, musicVolume / 100));
if (isAprilFools) {
  music.play().catch(() => {});
}

let isHovering = false;
let offsetX = 0;
let offsetY3 = 0;

function getCompletedLevel() {
  return Number(localStorage.getItem("completedLevel") || "0");
}

function ensureAdventureSave() {
  if (localStorage.getItem("completedLevel") === null) {
    localStorage.setItem("completedLevel", "0");
  }
  if (localStorage.getItem("inventory") === null) {
    localStorage.setItem("inventory", JSON.stringify([]));
  }
}

function setLevelImage(element, unlockedSrc, lockedSrc, isUnlocked) {
  if (!element) return;
  element.src = isUnlocked ? unlockedSrc : lockedSrc;
}

function updateAdventureMap() {
  const completedLevel = getCompletedLevel();

  setLevelImage(greenDoge, "Im just a chill guy no background.png", "green doge locked.png", completedLevel >= 1);
  setLevelImage(redDoge, "first boss doge.png", "first boss doge locked.png", completedLevel >= 2);
  setLevelImage(blueDoge, "second boss doge.png", "second boss doge locked.png", completedLevel >= 3);
  setLevelImage(rainbowDoge, "final boss doge.png", "final boss doge locked.png", completedLevel >= 4);
  setLevelImage(secondCousin, "Im just a chill guy no background.png", "locked Im just a chill guy no background.png", completedLevel >= 5);
  setLevelImage(firstRed, "fire doge.png", "fire doge locked.png", completedLevel >= 6);
  setLevelImage(firstBossRed, "fire doge first boss.png", "first boss doge locked.png", completedLevel >= 7);
  setLevelImage(finalBossRed, "fire doge final boss.png", "final boss doge locked.png", completedLevel >= 8);

  document.querySelectorAll(".level-link").forEach((link) => {
    const requiredLevel = Number(link.dataset.requiredLevel || "0");
    link.classList.toggle("locked", completedLevel < requiredLevel);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  ensureAdventureSave();
  updateAdventureMap();

  document.querySelectorAll(".level-link").forEach((link) => {
    link.addEventListener("click", function (event) {
      const requiredLevel = Number(link.dataset.requiredLevel || "0");
      if (getCompletedLevel() >= requiredLevel) {
        return;
      }

      event.preventDefault();
      alert(link.dataset.lockMessage || "That level is still locked.");
    });
  });
});

dogeAttack.addEventListener("mouseenter", () => {
  dogeAttack.src = "doge attack.png";
  dogeAttack2.src = "doge attack.png";
  dogeAttack2.style.display = "block";
  dogeAttack3.src = "doge attack.png";
  dogeAttack3.style.display = "block";
  isHovering = true;

  const moveInterval = setInterval(() => {
    if (!isHovering) {
      clearInterval(moveInterval);
      return;
    }
    offsetX += 1;
    offsetY3 += 0.1;
    dogeAttack.style.transform = `translate(${offsetX}px)`;
    dogeAttack2.style.transform = `translate(${offsetX}px)`;
    dogeAttack3.style.transform = `translate(${offsetX}px, ${offsetY3}px)`;
  }, 1);
});

dogeAttack.addEventListener("mouseleave", () => {
  dogeAttack.src = "Im just a chill guy no background.png";
  dogeAttack2.src = "Im just a chill guy no background.png";
  dogeAttack2.style.display = "none";
  dogeAttack3.src = "Im just a chill guy no background.png";
  dogeAttack3.style.display = "none";
  isHovering = false;
  offsetX = 0;
  offsetY3 = 0;
  dogeAttack.style.transform = "translate(0, 0)";
  dogeAttack2.style.transform = "translate(0, 0)";
  dogeAttack3.style.transform = "translate(0, 0)";
});

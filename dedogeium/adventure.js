const dogeAttack = document.getElementById("doge-attack");
const dogeAttack2 = document.getElementById("doge-attack2");
const dogeAttack3 = document.getElementById("doge-attack3");
const redDoge = document.getElementById("red-doge");
const blueDoge = document.getElementById("spooky-doge");
const rainbowDoge = document.getElementById("rainbow-doge");
const secondGreen = document.getElementById("2green-doge")
const secondCousin = document.getElementById("second-green-doge")
const firstRed = document.getElementById("first-red-doge")
const firstBossRed = document.getElementById("firstboss-red-doge")
const finalBossRed = document.getElementById("finalboss-red-doge")
const completedLevel = Number(localStorage.getItem("completedLevel"));
const routeBase = window.location.pathname.includes('/index.html') ? '../' : '';
const music = new Audio("rick roll.mp3");
music.loop = true;
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
music.volume = Math.min(1, Math.max(0, musicVolume / 100));
music.play();
let isHovering = false;
let offsetX = 0;
let offsetY3 = 0;
console.log("Completed Level:", localStorage.getItem("completedLevel"));
if (completedLevel >= 2) {
  redDoge.src = "first boss doge.png";
} else {
  redDoge.src = "first boss doge locked.png";
}

if (completedLevel >= 3) {
  blueDoge.src = "second boss doge.png";
} else {
  blueDoge.src = "second boss doge locked.png";
}

if (completedLevel >= 4) {
  rainbowDoge.src = "final boss doge.png";
} else {
  rainbowDoge.src = "final boss doge locked.png";
}
if (completedLevel >= 5) {
  secondGreen.src = "im just a chill guy.png";
} else {
  secondGreen.src = "im just a chill guy locked.png";
}
if (completedLevel >= 6) {
  secondGreen.src = "im just a chill guy.png";
} else {
  secondGreen.src = "im just a chill guy locked.png";
}

document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("completedLevel") === null) {
    localStorage.setItem("completedLevel", "1");
    localStorage.setItem("inventory", JSON.stringify([]));
  }
  if (localStorage.getItem("seenTutorialPrompt") === null) {
    localStorage.setItem("seenTutorialPrompt", "true");
    const goToTutorial = confirm("First time here? Want to start the tutorial?");
    if (goToTutorial) {
      window.location.href = routeBase + "tutorial/";
      return;
    }
  }
  // else {
  //   if (localStorage.getItem("completedLevel") >= 2) {
  //     redDoge.src="red doge.png";
  //   }
  //   if (localStorage.getItem("completedLevel") >= 3) {
  //     blueDoge.src="spooky doge.png";
  //   }
  //   if (localStorage.getItem("completedLevel") >= 3) {
  //     rainbowDoge.src="rainbow doge.png";
  //   }
  // }
});
redDoge.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 2) {
    window.location.href = routeBase + "level2/";
  }
  else {
    alert("Complete Level 1 to unlock level 2!");
  }
});
blueDoge.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 3) {
    window.location.href = routeBase + "level3/";
  }
  else {
    alert("Complete Level 2 to unlock level 3!");
  }
});
rainbowDoge.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 4) {
    window.location.href = routeBase + "level4/";
  }
  else {
    alert("Complete Level 3 to unlock level 4!");
  }
});
secondCousin.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 5) {
    window.location.href = routeBase + "level5/";
    
  }
  else{
    alert("Complete level 4 to unlock level 5!");
  }
});
firstRed.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 6) {
    window.location.href = routeBase + "level6/";
    
  }
  else{
    alert("Complete level 5 to unlock level 6!");
  }
});
firstBossRed.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 7) {
    window.location.href = routeBase + "level7/";
    
  }
  else{
    alert("Complete level 6 to unlock level 7!");
  }
});
finalBossRed.addEventListener("click", function() {
  if (localStorage.getItem("completedLevel") >= 8) {
    window.location.href = routeBase + "level8/";
    
  }
  else{
    alert("Complete level 7 to unlock level 8!");
  }
});

dogeAttack.addEventListener("mouseenter", () => {
  dogeAttack.src = "doge attack.png";
  dogeAttack2.src = "doge attack.png";
  dogeAttack2.style.display="block";
  dogeAttack3.src = "doge attack.png";
  dogeAttack3.style.display="block";
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
  dogeAttack2.style.display="none";
  dogeAttack3.src = "Im just a chill guy no background.png";
  dogeAttack3.style.display="none";
  isHovering = false;
  offsetX = 0;
  offsetY3 = 0;
  dogeAttack.style.transform = `translate(0, 0)`;
  dogeAttack2.style.transform = `translate(0, 0)`;
  dogeAttack3.style.transform = `translate(0, 0)`;
});


const dogeAttack = document.getElementById("doge-attack");
const dogeAttack2 = document.getElementById("doge-attack2");
const dogeAttack3 = document.getElementById("doge-attack3");
let isHovering = false;
let offsetX = 0;
let offsetY3 = 0;

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
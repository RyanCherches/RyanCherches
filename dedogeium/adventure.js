const dogeAttack = document.getElementById("doge-attack");
let isHovering = false;
let offsetX = 0;

dogeAttack.addEventListener("mouseenter", () => {
  dogeAttack.src = "doge attack.png";
  isHovering = true;
  
  const moveInterval = setInterval(() => {
    if (!isHovering) {
      clearInterval(moveInterval);
      return;
    }
    offsetX += 1;
    dogeAttack.style.transform = `translate(${offsetX}px)`;
  }, 1);
});

dogeAttack.addEventListener("mouseleave", () => {
  dogeAttack.src = "Im just a chill guy no background.png";
  isHovering = false;
  offsetX = 0;
  offsetY = 0;
  dogeAttack.style.transform = `translate(0, 0)`;
});
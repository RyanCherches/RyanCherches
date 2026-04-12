const adminLog = document.getElementById("admin-log");
const dogeBattle = document.getElementById("doge-battle");
const dogeBlue = document.getElementById("doge-blue");
const dogeRed = document.getElementById("doge-red");
const dogeStatus = document.getElementById("doge-status");

if (adminLog) {
    adminLog.addEventListener("click", () => {
        window.location.href = "adminLogin/";
    });
}

const today = new Date();
const isAprilFools =
    today.getMonth() === 3 &&
    today.getDate() === 1;

if (isAprilFools) {
    alert("Today is April Fools. There might be a promo code hiding a Rick Astley surprise.");
}

if (dogeBattle && dogeBlue && dogeRed && dogeStatus) {
    const readyMessage = "Tap a doge to start the fight";
    const fightMessages = [
        "Blue Doge and Fire Doge are clashing",
        "The doges are charging straight at each other",
        "Impact! The arena is shaking"
    ];
    let isFightRunning = false;
    let fightTick;
    let fightReset;

    const startFight = () => {
        if (isFightRunning) {
            return;
        }

        isFightRunning = true;
        dogeBattle.classList.remove("is-fighting");
        dogeBlue.classList.remove("is-fighting");
        dogeRed.classList.remove("is-fighting");

        void dogeBattle.offsetWidth;

        dogeBattle.classList.add("is-fighting");
        dogeBlue.classList.add("is-fighting");
        dogeRed.classList.add("is-fighting");
        dogeStatus.textContent = fightMessages[0];

        clearTimeout(fightTick);
        clearTimeout(fightReset);

        fightTick = setTimeout(() => {
            dogeStatus.textContent = fightMessages[1];
        }, 360);

        fightReset = setTimeout(() => {
            dogeStatus.textContent = fightMessages[2];
        }, 760);

        setTimeout(() => {
            dogeBattle.classList.remove("is-fighting");
            dogeBlue.classList.remove("is-fighting");
            dogeRed.classList.remove("is-fighting");
            dogeStatus.textContent = readyMessage;
            isFightRunning = false;
        }, 1500);
    };

    dogeBlue.addEventListener("click", startFight);
    dogeRed.addEventListener("click", startFight);
}

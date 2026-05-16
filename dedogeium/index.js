const adminLog = document.getElementById("admin-log");
const dogeBattle = document.getElementById("doge-battle");
const dogeBlue = document.getElementById("doge-blue");
const dogeRed = document.getElementById("doge-red");
const dogeStatus = document.getElementById("doge-status");
const playNowLink = document.getElementById("play-now-link");
const dedogeiumLoginLink = document.getElementById("dedogeium-login-link");
const AUTH_TOKEN_STORAGE_KEY = "dedogeiumAuthToken";
const USERNAME_STORAGE_KEYS = ["Username", "Uabcd", "username", "playerName"];

function getStoredDedogeiumUsername() {
    for (const key of USERNAME_STORAGE_KEYS) {
        const value = localStorage.getItem(key);
        if (value) return String(value).trim().toLowerCase();
    }
    return "";
}

function getStoredDedogeiumToken() {
    return String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim();
}

function getProtectedTargetPath() {
    return "home/";
}

function getDedogeiumLoginHref() {
    return `login/?next=${encodeURIComponent(getProtectedTargetPath())}`;
}

function wireLoginAwareLinks() {
    const hasSession = Boolean(getStoredDedogeiumUsername() && getStoredDedogeiumToken());
    if (playNowLink) {
        playNowLink.href = hasSession ? getProtectedTargetPath() : getDedogeiumLoginHref();
        playNowLink.textContent = hasSession ? "Play now" : "Login to play";
    }
    if (dedogeiumLoginLink) {
        dedogeiumLoginLink.href = getDedogeiumLoginHref();
    }
}

wireLoginAwareLinks();

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

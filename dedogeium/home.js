const promoCodeImg = document.getElementById("promo-code-img");
const popup = document.getElementById("popup");
const closeBtn = document.getElementById("close-btn");
const submitBtn = document.getElementById("submit-btn");
const promoInput = document.getElementById("promo-code");
const dailyRewardBtn = document.getElementById("daily-reward-btn");
const dailyRewardStreak = document.getElementById("daily-reward-streak");
const dailyRewardPreview = document.getElementById("daily-reward-preview");
const dailyRewardStatus = document.getElementById("daily-reward-status");
const dailyRewardDescription = document.getElementById("daily-reward-description");
const music = new Audio("rick roll.mp3");
music.loop = true;
const storedMusicVolume = Number(localStorage.getItem("musicVolume"));
const musicVolume = Number.isFinite(storedMusicVolume) ? storedMusicVolume : 50;
music.volume = Math.min(1, Math.max(0, musicVolume / 100));
music.play();

function openPopup() {
    if (!popup) return;
    popup.classList.add("is-open");
    if (promoInput) promoInput.focus();
}

function closePopup() {
    if (!popup) return;
    popup.classList.remove("is-open");
    if (promoInput) promoInput.value = "";
}

if (promoCodeImg) {
    promoCodeImg.addEventListener("click", openPopup);
}

if (closeBtn) {
    closeBtn.addEventListener("click", closePopup);
}

if (popup) {
    popup.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });
}

if (submitBtn) {
    submitBtn.addEventListener("click", () => {
        const code = promoInput ? promoInput.value.trim() : "";
        if (!code) {
            alert("Please enter a promo code first.");
            return;
        }
        else if (code.toLowerCase() === "april fools") {
            alert("Congratulations! You have redeemed the code: april fools! If you go into your inventory and find the box and check it, you will have fully redeemed the code! No... I swear its not a rick roll.");
            // Enable April Fools mode
            localStorage.setItem("aprilFoolsEnabled", "true");
        } else {
            alert("Invalid promo code. Please try again.");
        }
        closePopup();
    });
}

function pluralize(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
}

function formatRewardPreview(reward) {
    if (!reward) return "No reward available";

    const parts = [];
    if (reward.currency) {
        parts.push(`${reward.currency} currency`);
    }

    const boosts = reward.boosts && typeof reward.boosts === "object" ? reward.boosts : {};
    Object.entries(boosts).forEach(([boostKey, count]) => {
        const boostDefinition = window.DedogeiumSystems
            && window.DedogeiumSystems.BOOST_DEFINITIONS
            && window.DedogeiumSystems.BOOST_DEFINITIONS[boostKey];
        const label = boostDefinition ? boostDefinition.label : `${boostKey} boost`;
        parts.push(`${pluralize(count, "charge")} of ${label}`);
    });

    return parts.join(" + ");
}

function formatCountdown(msRemaining) {
    const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderDailyReward(message) {
    if (!window.DedogeiumSystems || !dailyRewardBtn) return;

    const snapshot = window.DedogeiumSystems.getDailyRewardSnapshot();
    if (dailyRewardStreak) {
        dailyRewardStreak.textContent = `${snapshot.currentStreak} ${snapshot.currentStreak === 1 ? "day" : "days"}`;
    }
    if (dailyRewardPreview) {
        dailyRewardPreview.textContent = formatRewardPreview(snapshot.reward);
    }
    if (dailyRewardDescription) {
        dailyRewardDescription.textContent = `Day ${snapshot.reward.dayInCycle} reward: ${formatRewardPreview(snapshot.reward)}.`;
    }

    if (snapshot.canClaim) {
        dailyRewardBtn.disabled = false;
        dailyRewardBtn.textContent = `Claim Day ${snapshot.reward.dayInCycle}`;
        if (dailyRewardStatus) {
            dailyRewardStatus.textContent = message || (snapshot.currentStreak > 0
                ? "You can claim now to keep your streak going."
                : "Your first daily reward is ready.");
        }
        return;
    }

    dailyRewardBtn.disabled = true;
    dailyRewardBtn.textContent = "Claimed Today";
    if (dailyRewardStatus) {
        dailyRewardStatus.textContent = message || `Come back in ${formatCountdown(snapshot.nextClaimAt - Date.now())} for the next reward.`;
    }
}

if (dailyRewardBtn && window.DedogeiumSystems) {
    renderDailyReward();
    window.setInterval(() => {
        renderDailyReward();
    }, 1000);

    dailyRewardBtn.addEventListener("click", () => {
        const result = window.DedogeiumSystems.claimDailyReward();
        if (!result.ok) {
            renderDailyReward(result.error);
            return;
        }

        renderDailyReward(`Claimed ${formatRewardPreview(result.reward)}.`);
    });
}

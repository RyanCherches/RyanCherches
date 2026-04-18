const routeBase = window.location.pathname.includes("/index.html") ? "../" : "";
const completeTutorialBtn = document.getElementById("complete-tutorial-btn");
const tutorialStatus = document.getElementById("tutorial-status");
const tutorialProgressLabel = document.getElementById("tutorial-progress-label");
const highestLevelLabel = document.getElementById("highest-level-label");
const tutorialCurrency = document.getElementById("tutorial-currency");
const tutorialInventoryCount = document.getElementById("tutorial-inventory-count");
const tutorialEquippedCount = document.getElementById("tutorial-equipped-count");

function readListCount(storageKey) {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
        return 0;
    }
}

function ensureTutorialSave() {
    if (localStorage.getItem("completedLevel") === null) {
        localStorage.setItem("completedLevel", "0");
    }
    if (localStorage.getItem("inventory") === null) {
        localStorage.setItem("inventory", JSON.stringify([]));
    }
    if (localStorage.getItem("equippedItems") === null) {
        localStorage.setItem("equippedItems", JSON.stringify([]));
    }
    if (localStorage.getItem("currency") === null) {
        localStorage.setItem("currency", "0");
    }
}

function getCompletedLevel() {
    return Number(localStorage.getItem("completedLevel") || "0");
}

function getHighestLevelText(completedLevel) {
    if (completedLevel <= 0) {
        return "Tutorial only";
    }
    return `Level ${completedLevel}`;
}

function renderTutorialState(message) {
    const completedLevel = getCompletedLevel();
    const tutorialComplete = completedLevel >= 1;

    if (tutorialProgressLabel) {
        tutorialProgressLabel.textContent = tutorialComplete ? "Complete" : "Not finished";
    }
    if (highestLevelLabel) {
        highestLevelLabel.textContent = getHighestLevelText(completedLevel);
    }
    if (tutorialCurrency) {
        tutorialCurrency.textContent = String(Number(localStorage.getItem("currency") || "0"));
    }
    if (tutorialInventoryCount) {
        tutorialInventoryCount.textContent = `${readListCount("inventory")} doges`;
    }
    if (tutorialEquippedCount) {
        tutorialEquippedCount.textContent = `${readListCount("equippedItems")} doges`;
    }
    if (completeTutorialBtn) {
        completeTutorialBtn.textContent = tutorialComplete ? "Go to Adventure" : "Finish Tutorial and Unlock Level 1";
    }
    if (tutorialStatus) {
        tutorialStatus.textContent = message || (tutorialComplete
            ? "Tutorial finished. Level 1 is unlocked and ready."
            : "Finish this tutorial to unlock Level 1 on the adventure map.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    ensureTutorialSave();
    renderTutorialState();

    if (completeTutorialBtn) {
        completeTutorialBtn.addEventListener("click", function () {
            if (getCompletedLevel() < 1) {
                localStorage.setItem("completedLevel", "1");
            }
            localStorage.setItem("seenTutorialPrompt", "true");
            renderTutorialState("Level 1 unlocked. Sending you back to the adventure map...");
            window.setTimeout(function () {
                window.location.href = routeBase + "adventure/";
            }, 450);
        });
    }
});

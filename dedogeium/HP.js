// Load HP from localStorage (robust parsing with safe fallbacks)
const _storedHp = parseInt(localStorage.getItem('hpEarned'));
let hpEarned = Number.isFinite(_storedHp) ? _storedHp : 0;
const _storedTime = parseInt(localStorage.getItem('lastTimeOnPage'));
let lastTimeOnPage = Number.isFinite(_storedTime) ? _storedTime : Date.now();

// Update HP display
function updateHPDisplay() {
    const el = document.querySelector('#amount_earned h2');
    if (el) el.textContent = `HP earned: ${hpEarned}`;
}

// Calculate HP gained from time away
function calculateHPGained() {
    const currentTime = Date.now();
    const timeDiffMs = currentTime - lastTimeOnPage;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    const hpGained = Math.floor(timeDiffHours * 10);
    
    if (hpGained > 0) {
        hpEarned += hpGained;
        // add AFK-earned HP to the player's total HP
        addToPlayerHP(hpGained);
        lastTimeOnPage = currentTime;
        saveHP();
        updateHPDisplay();
    }
}

// Save HP to localStorage
function saveHP() {
    localStorage.setItem('hpEarned', hpEarned);
    localStorage.setItem('lastTimeOnPage', lastTimeOnPage);
}

// Gain 10 HP every hour while on the page
function gainHPPerHour() {
    hpEarned += 10;
    // add hourly HP to the player's total HP as well
    addToPlayerHP(10);
    lastTimeOnPage = Date.now();
    saveHP();
    updateHPDisplay();
}

// Add amount to the player's persistent total HP.
// Updates any existing common keys if present, otherwise uses 'playerHP'.
function addToPlayerHP(amount) {
    const candidates = ['playerHP', 'totalHP', 'hpTotal', 'total_hp', 'hp'];
    let updatedAny = false;
    candidates.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            const val = parseInt(localStorage.getItem(key)) || 0;
            localStorage.setItem(key, val + amount);
            updatedAny = true;
        }
    });
    if (!updatedAny) {
        const val = parseInt(localStorage.getItem('playerHP')) || 0;
        localStorage.setItem('playerHP', val + amount);
    }
}

// Initialize
window.addEventListener('load', () => {
    calculateHPGained();
    updateHPDisplay();
    
    // Gain 10 HP every hour (3600000 milliseconds)
    setInterval(gainHPPerHour, 3600000);
    // Auto-save HP to localStorage every 5 seconds
    setInterval(saveHP, 5000);
});

// Save HP before leaving the page
window.addEventListener('beforeunload', () => {
    lastTimeOnPage = Date.now();
    saveHP();
});

const volumeSlider = document.getElementById("music-volume");
const volumeValue = document.getElementById("music-volume-value");
const testMusicBtn = document.getElementById("test-music-btn");
const testSoundBtn = document.getElementById("test-sound-btn");
const skipAllDialogueCheckbox = document.getElementById("skip-all-dialogue");
const skipAllDialogueStatus = document.getElementById("skip-all-dialogue-status");
const spokenDialogueCheckbox = document.getElementById("spoken-dialogue");
const spokenDialogueStatus = document.getElementById("spoken-dialogue-status");
const splitBackgroundCheckbox = document.getElementById("split-background");
const splitBackgroundStatus = document.getElementById("split-background-status");
const SKIP_ALL_DIALOGUE_KEY = "skipAllDialogueEnabled";
const SPOKEN_DIALOGUE_KEY = "spokenDialogueEnabled";
const SPLIT_BG_KEY = "splitBackgroundEnabled";

const musicPreview = new Audio("rick roll.mp3");
musicPreview.loop = true;
let isMusicPlaying = false;

function clampVolume(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return 50;
    return Math.min(100, Math.max(0, number));
}

function updateVolumeDisplay(value) {
    if (volumeValue) {
        volumeValue.textContent = `${value}%`;
    }
}

function updateSkipAllDialogueStatus(enabled) {
    if (!skipAllDialogueStatus) return;
    skipAllDialogueStatus.textContent = enabled
        ? "All level dialogue will be skipped automatically."
        : "Level dialogue will play normally unless you tap Next.";
}

function updateSpokenDialogueStatus(enabled) {
    if (!spokenDialogueStatus) return;
    spokenDialogueStatus.textContent = enabled
        ? "Dialogue speech is on. The player keeps one voice, and enemies rotate voices."
        : "Dialogue speech is off.";
}

function updateSplitBackgroundStatus(enabled) {
    if (!splitBackgroundStatus) return;
    splitBackgroundStatus.textContent = enabled
        ? "Split background effect is on. Half blue, half red with color switching."
        : "Split background effect is off.";
}

const savedVolume = clampVolume(localStorage.getItem("musicVolume") ?? 50);
if (volumeSlider) {
    volumeSlider.value = savedVolume;
}
updateVolumeDisplay(savedVolume);
musicPreview.volume = savedVolume / 100;

const skipAllDialogueEnabled = localStorage.getItem(SKIP_ALL_DIALOGUE_KEY) === "true";
if (skipAllDialogueCheckbox) {
    skipAllDialogueCheckbox.checked = skipAllDialogueEnabled;
}
updateSkipAllDialogueStatus(skipAllDialogueEnabled);

const spokenDialogueEnabled = localStorage.getItem(SPOKEN_DIALOGUE_KEY) !== "false";
if (spokenDialogueCheckbox) {
    spokenDialogueCheckbox.checked = spokenDialogueEnabled;
}
updateSpokenDialogueStatus(spokenDialogueEnabled);

const splitBackgroundEnabled = localStorage.getItem(SPLIT_BG_KEY) === "true";
if (splitBackgroundCheckbox) {
    splitBackgroundCheckbox.checked = splitBackgroundEnabled;
}
updateSplitBackgroundStatus(splitBackgroundEnabled);

if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
        const value = clampVolume(volumeSlider.value);
        volumeSlider.value = value;
        localStorage.setItem("musicVolume", String(value));
        updateVolumeDisplay(value);
        musicPreview.volume = value / 100;
    });
}

if (testMusicBtn) {
    testMusicBtn.addEventListener("click", () => {
        if (!isMusicPlaying) {
            musicPreview.currentTime = 0;
            musicPreview.play();
            isMusicPlaying = true;
            testMusicBtn.textContent = "Pause Music";
        } else {
            musicPreview.pause();
            isMusicPlaying = false;
            testMusicBtn.textContent = "Play Music";
        }
    });
}

if (testSoundBtn) {
    testSoundBtn.addEventListener("click", () => {
        const volume = clampVolume(volumeSlider ? volumeSlider.value : savedVolume) / 100;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = Math.max(0.05, volume) * 0.6;
        osc.type = "sine";
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        osc.onended = () => ctx.close();
    });
}

if (skipAllDialogueCheckbox) {
    skipAllDialogueCheckbox.addEventListener("change", () => {
        const enabled = skipAllDialogueCheckbox.checked;
        localStorage.setItem(SKIP_ALL_DIALOGUE_KEY, String(enabled));
        updateSkipAllDialogueStatus(enabled);
    });
}

if (spokenDialogueCheckbox) {
    spokenDialogueCheckbox.addEventListener("change", () => {
        const enabled = spokenDialogueCheckbox.checked;
        localStorage.setItem(SPOKEN_DIALOGUE_KEY, String(enabled));
        updateSpokenDialogueStatus(enabled);
    });
}

if (splitBackgroundCheckbox) {
    splitBackgroundCheckbox.addEventListener("change", () => {
        const enabled = splitBackgroundCheckbox.checked;
        localStorage.setItem(SPLIT_BG_KEY, String(enabled));
        updateSplitBackgroundStatus(enabled);
    });
}

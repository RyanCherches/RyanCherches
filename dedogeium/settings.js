const volumeSlider = document.getElementById("music-volume");
const volumeValue = document.getElementById("music-volume-value");
const testMusicBtn = document.getElementById("test-music-btn");
const testSoundBtn = document.getElementById("test-sound-btn");

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

const savedVolume = clampVolume(localStorage.getItem("musicVolume") ?? 50);
if (volumeSlider) {
    volumeSlider.value = savedVolume;
}
updateVolumeDisplay(savedVolume);
musicPreview.volume = savedVolume / 100;

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

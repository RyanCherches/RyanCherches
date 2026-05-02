(function () {
    const SPOKEN_DIALOGUE_KEY = "spokenDialogueEnabled";
    const PLAYER_CHARACTER_KEY = "dedogeium-player";
    const DEFAULT_MUSIC_DUCK_MULTIPLIER = 0.32;
    const ENEMY_VOICE_PROFILES = {
        "level9-enemy": { rate: 0.94, pitch: 0.84, volume: 0.95 },
        "level10-enemy": { rate: 1.01, pitch: 0.78, volume: 0.97 },
        "level11-enemy": { rate: 0.88, pitch: 0.66, volume: 0.99 },
        "level12-enemy": { rate: 0.82, pitch: 0.58, volume: 1 },
    };
    let cachedVoices = [];
    let activeSpeechToken = 0;
    const registeredMusicAudios = new Map();

    function hashString(value) {
        let hash = 0;
        const input = String(value || "");
        for (let index = 0; index < input.length; index += 1) {
            hash = ((hash << 5) - hash) + input.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function isSpeechAvailable() {
        return typeof window !== "undefined"
            && "speechSynthesis" in window
            && typeof window.SpeechSynthesisUtterance !== "undefined";
    }

    function isEnabled() {
        return localStorage.getItem(SPOKEN_DIALOGUE_KEY) !== "false";
    }

    function sortVoices(voices) {
        return voices.slice().sort((voiceA, voiceB) => {
            const aEnglish = /en/i.test(voiceA.lang || "");
            const bEnglish = /en/i.test(voiceB.lang || "");
            if (aEnglish !== bEnglish) return aEnglish ? -1 : 1;
            if (voiceA.default !== voiceB.default) return voiceA.default ? -1 : 1;
            return String(voiceA.name || "").localeCompare(String(voiceB.name || ""));
        });
    }

    function loadVoices() {
        if (!isSpeechAvailable()) return [];
        cachedVoices = sortVoices(window.speechSynthesis.getVoices());
        return cachedVoices;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function isAudioLike(audio) {
        return Boolean(audio) && typeof audio.volume === "number";
    }

    function normalizeVolume(volume, fallback = 1) {
        const safeFallback = clamp(Number(fallback) || 0, 0, 1);
        const numericVolume = Number(volume);
        return Number.isFinite(numericVolume) ? clamp(numericVolume, 0, 1) : safeFallback;
    }

    function normalizeDuckMultiplier(multiplier) {
        const numericMultiplier = Number(multiplier);
        if (!Number.isFinite(numericMultiplier)) return DEFAULT_MUSIC_DUCK_MULTIPLIER;
        return clamp(numericMultiplier, 0, 1);
    }

    function applyMusicVolume(audio, entry, isDucked) {
        if (!isAudioLike(audio) || !entry) return;
        const nextVolume = isDucked
            ? normalizeVolume(entry.baseVolume * entry.duckMultiplier, entry.baseVolume)
            : entry.baseVolume;
        audio.volume = nextVolume;
    }

    function duckRegisteredMusic() {
        registeredMusicAudios.forEach((entry, audio) => {
            applyMusicVolume(audio, entry, true);
        });
    }

    function restoreRegisteredMusic() {
        registeredMusicAudios.forEach((entry, audio) => {
            applyMusicVolume(audio, entry, false);
        });
    }

    function registerMusicAudio(audio, options = {}) {
        if (!isAudioLike(audio)) return false;
        const entry = {
            baseVolume: normalizeVolume(options.baseVolume, audio.volume),
            duckMultiplier: normalizeDuckMultiplier(options.duckMultiplier),
        };
        registeredMusicAudios.set(audio, entry);
        applyMusicVolume(audio, entry, activeSpeechToken > 0);
        return true;
    }

    function unregisterMusicAudio(audio) {
        if (!isAudioLike(audio)) return false;
        const entry = registeredMusicAudios.get(audio);
        if (entry) {
            applyMusicVolume(audio, entry, false);
        }
        return registeredMusicAudios.delete(audio);
    }

    function getVoicePool() {
        if (!cachedVoices.length) {
            loadVoices();
        }
        return cachedVoices;
    }

    function chooseVoice(characterKey, team) {
        const voices = getVoicePool();
        if (!voices.length) return null;

        const playerIndex = hashString(`${PLAYER_CHARACTER_KEY}-voice`) % voices.length;
        if (team === "player") {
            return voices[playerIndex];
        }

        if (voices.length === 1) {
            return voices[0];
        }

        const enemyVoices = voices.filter((voice, index) => index !== playerIndex);
        return enemyVoices[hashString(characterKey) % enemyVoices.length];
    }

    function getSpeechTuning(characterKey, team) {
        if (team === "player") {
            return { rate: 1.02, pitch: 1.04, volume: 0.92 };
        }

        if (ENEMY_VOICE_PROFILES[characterKey]) {
            return ENEMY_VOICE_PROFILES[characterKey];
        }

        const hash = hashString(characterKey);
        return {
            rate: 0.88 + ((hash % 16) / 100),
            pitch: 0.66 + ((hash % 20) / 100),
            volume: 0.95,
        };
    }

    function speak(text, options = {}) {
        if (!isSpeechAvailable() || !isEnabled()) return false;

        const message = String(text || "").trim();
        if (!message) return false;

        const team = options.team === "enemy" || options.speaker === "bad" ? "enemy" : "player";
        const characterKey = options.characterKey || (team === "player" ? PLAYER_CHARACTER_KEY : "dedogeium-enemy");
        const utterance = new SpeechSynthesisUtterance(message);
        const selectedVoice = chooseVoice(characterKey, team);
        const tuning = getSpeechTuning(characterKey, team);
        const speechToken = activeSpeechToken + 1;

        activeSpeechToken = speechToken;
        duckRegisteredMusic();

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        utterance.rate = tuning.rate;
        utterance.pitch = tuning.pitch;
        utterance.volume = tuning.volume;
        utterance.onend = () => {
            if (activeSpeechToken !== speechToken) return;
            activeSpeechToken = 0;
            restoreRegisteredMusic();
        };
        utterance.onerror = () => {
            if (activeSpeechToken !== speechToken) return;
            activeSpeechToken = 0;
            restoreRegisteredMusic();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
    }

    function stop() {
        if (!isSpeechAvailable()) return;
        activeSpeechToken = 0;
        restoreRegisteredMusic();
        window.speechSynthesis.cancel();
    }

    if (isSpeechAvailable()) {
        loadVoices();
        if (typeof window.speechSynthesis.addEventListener === "function") {
            window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
        }
    }

    window.DedogeiumDialogueVoice = {
        SETTING_KEY: SPOKEN_DIALOGUE_KEY,
        isEnabled,
        registerMusicAudio,
        unregisterMusicAudio,
        speak,
        stop,
    };
})();

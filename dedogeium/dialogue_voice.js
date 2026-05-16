(function () {
    const SPOKEN_DIALOGUE_KEY = "spokenDialogueEnabled";
    const PLAYER_CHARACTER_KEY = "dedogeium-player";
    const DEFAULT_MUSIC_DUCK_MULTIPLIER = 0.32;
    const ENEMY_VOICE_PROFILES = {
        "level1-enemy": { rate: 0.98, pitch: 0.96, volume: 0.96 },
        "level2-enemy": { rate: 0.97, pitch: 0.94, volume: 0.96 },
        "level3-enemy": { rate: 0.96, pitch: 0.92, volume: 0.96 },
        "level4-enemy": { rate: 0.96, pitch: 0.9, volume: 0.97 },
        "level5-enemy": { rate: 0.99, pitch: 0.95, volume: 0.97 },
        "level6-enemy": { rate: 0.97, pitch: 0.93, volume: 0.97 },
        "level7-enemy": { rate: 0.96, pitch: 0.91, volume: 0.97 },
        "level8-enemy": { rate: 0.94, pitch: 0.88, volume: 0.98 },
        "level9-enemy": { rate: 0.99, pitch: 0.96, volume: 0.96 },
        "level10-enemy": { rate: 1, pitch: 0.94, volume: 0.97 },
        "level11-enemy": { rate: 0.96, pitch: 0.9, volume: 0.98 },
        "level12-enemy": { rate: 0.94, pitch: 0.87, volume: 0.99 },
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

    function getEnglishVoicePool(voices) {
        return voices.filter((voice) => /en/i.test(voice.lang || ""));
    }

    function chooseVoice(characterKey, team) {
        const voices = getVoicePool();
        if (!voices.length) return null;

        const englishVoices = getEnglishVoicePool(voices);
        const playerVoicePool = englishVoices.length ? englishVoices : voices;
        const selectedPlayerVoice = playerVoicePool[0] || voices[0];

        if (team === "player") {
            return selectedPlayerVoice;
        }

        if (voices.length === 1) {
            return voices[0];
        }

        const enemyVoices = voices.filter((voice) => voice !== selectedPlayerVoice);
        if (!enemyVoices.length) {
            return selectedPlayerVoice || voices[0];
        }

        const safeEnemyVoices = getEnglishVoicePool(enemyVoices);
        const pool = safeEnemyVoices.length ? safeEnemyVoices : enemyVoices;
        return pool[hashString(characterKey) % pool.length];
    }

    function getSpeechTuning(characterKey, team) {
        if (team === "player") {
            return { rate: 1, pitch: 1, volume: 0.92 };
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

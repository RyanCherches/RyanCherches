(function () {
    const SPOKEN_DIALOGUE_KEY = "spokenDialogueEnabled";
    const PLAYER_CHARACTER_KEY = "dedogeium-player";
    let cachedVoices = [];

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

        const hash = hashString(characterKey);
        return {
            rate: 0.9 + ((hash % 18) / 100),
            pitch: 0.72 + ((hash % 28) / 100),
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

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        utterance.rate = tuning.rate;
        utterance.pitch = tuning.pitch;
        utterance.volume = tuning.volume;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
    }

    function stop() {
        if (!isSpeechAvailable()) return;
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
        speak,
        stop,
    };
})();

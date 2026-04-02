(function configureDedogeiumServer() {
    const STORAGE_KEY = "dedogeiumServerUrl";
    const queryServer = new URLSearchParams(window.location.search).get("server");
    const routeOrigin = window.location.origin && window.location.origin !== "null"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    const savedServer = localStorage.getItem(STORAGE_KEY);

    function normalizeServerUrl(value) {
        const trimmed = String(value || "").trim();
        if (!trimmed) return "";
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        try {
            const parsed = new URL(withProtocol);
            return `${parsed.protocol}//${parsed.host}`;
        } catch (error) {
            return "";
        }
    }

    const currentServer = normalizeServerUrl(routeOrigin);
    const candidates = [
        normalizeServerUrl(queryServer),
        currentServer,
        normalizeServerUrl(savedServer),
    ].filter(Boolean);
    const uniqueCandidates = Array.from(new Set(candidates));
    const resolvedServer = uniqueCandidates[0] || "";

    window.DEDOGEIUM_SERVER_STORAGE_KEY = STORAGE_KEY;
    window.DEDOGEIUM_SERVER_CANDIDATES = uniqueCandidates;
    if (resolvedServer) {
        localStorage.setItem(STORAGE_KEY, resolvedServer);
    }
    window.SERVER_URL = resolvedServer || "";
})();

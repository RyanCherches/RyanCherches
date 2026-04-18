(function configureDedogeiumServer() {
    const STORAGE_KEY = "dedogeiumServerUrl";
    const queryServer = new URLSearchParams(window.location.search).get("server");
    const routeOrigin = window.location.origin && window.location.origin !== "null"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    const savedServer = localStorage.getItem(STORAGE_KEY);
    const defaultServer = window.DEDOGEIUM_DEFAULT_SERVER_URL || "";

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

    function isPrivateIpv4(hostname) {
        const match = String(hostname || "").match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (!match) return false;
        const first = Number(match[1]);
        const second = Number(match[2]);
        return first === 10
            || first === 127
            || (first === 192 && second === 168)
            || (first === 172 && second >= 16 && second <= 31);
    }

    function shouldUseCurrentOriginAsServer(value) {
        const normalized = normalizeServerUrl(value);
        if (!normalized) return false;
        try {
            const parsed = new URL(normalized);
            const hostname = String(parsed.hostname || "").toLowerCase();
            return hostname === "localhost"
                || hostname === "127.0.0.1"
                || hostname === "::1"
                || hostname.endsWith(".local")
                || isPrivateIpv4(hostname);
        } catch (error) {
            return false;
        }
    }

    const currentServer = normalizeServerUrl(routeOrigin);
    const normalizedSavedServer = normalizeServerUrl(savedServer);
    const allowOriginServer = shouldUseCurrentOriginAsServer(currentServer);
    const effectiveSavedServer = !allowOriginServer && normalizedSavedServer === currentServer
        ? ""
        : normalizedSavedServer;
    const candidates = [
        normalizeServerUrl(queryServer),
        effectiveSavedServer,
        normalizeServerUrl(defaultServer),
        allowOriginServer ? currentServer : "",
    ].filter(Boolean);
    const uniqueCandidates = Array.from(new Set(candidates));
    const resolvedServer = uniqueCandidates[0] || "";

    window.DEDOGEIUM_SERVER_STORAGE_KEY = STORAGE_KEY;
    window.DEDOGEIUM_SERVER_CANDIDATES = uniqueCandidates;
    window.DEDOGEIUM_ALLOW_ORIGIN_SERVER = allowOriginServer;
    window.DEDOGEIUM_SITE_ORIGIN = routeOrigin;
    if (resolvedServer) {
        localStorage.setItem(STORAGE_KEY, resolvedServer);
    } else if (!allowOriginServer && normalizedSavedServer === currentServer) {
        localStorage.removeItem(STORAGE_KEY);
    }
    window.SERVER_URL = resolvedServer || "";
})();

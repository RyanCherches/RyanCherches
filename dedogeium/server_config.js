(function configureDedogeiumServer() {
    const STORAGE_KEY = "dedogeiumServerUrl";
    const queryServer = new URLSearchParams(window.location.search).get("server");
    const routeOrigin = window.location.origin && window.location.origin !== "null"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    const savedServer = localStorage.getItem(STORAGE_KEY);
    const defaultServer = window.DEDOGEIUM_DEFAULT_SERVER_URL || "";
    const normalizedDefaultServer = normalizeServerUrl(defaultServer);
    const forceDefaultServer = window.DEDOGEIUM_FORCE_DEFAULT_SERVER === true && Boolean(normalizedDefaultServer);
    const scriptSrc = document.currentScript && document.currentScript.src ? document.currentScript.src : "";

    function normalizeServerUrl(value) {
        const trimmed = String(value || "").trim();
        if (!trimmed) return "";
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        try {
            const parsed = new URL(withProtocol);
            const normalizedPath = parsed.pathname && parsed.pathname !== "/"
                ? parsed.pathname.replace(/\/+$/, "")
                : "";
            return `${parsed.protocol}//${parsed.host}${normalizedPath}`;
        } catch (error) {
            return "";
        }
    }

    function getScriptBaseUrl() {
        if (!scriptSrc) return "";
        try {
            const parsed = new URL(scriptSrc, window.location.href);
            const path = parsed.pathname.replace(/\/[^/]*$/, "").replace(/\/+$/, "");
            return `${parsed.protocol}//${parsed.host}${path}`;
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

    function buildLocalPortCandidates(value) {
        const normalized = normalizeServerUrl(value);
        if (!normalized) return [];
        try {
            const parsed = new URL(normalized);
            if (!shouldUseCurrentOriginAsServer(normalized)) return [];
            const protocol = parsed.protocol || "http:";
            const hostname = parsed.hostname || "127.0.0.1";
            return Array.from(new Set([
                normalizeServerUrl(`${protocol}//${hostname}:3000`),
                normalizeServerUrl(`${protocol}//localhost:3000`),
                normalizeServerUrl(`${protocol}//127.0.0.1:3000`),
                normalizeServerUrl(`${protocol}//${hostname}:5000`),
                normalizeServerUrl(`${protocol}//localhost:5000`),
                normalizeServerUrl(`${protocol}//127.0.0.1:5000`),
            ].filter(Boolean)));
        } catch (error) {
            return [];
        }
    }

    const currentServer = normalizeServerUrl(getScriptBaseUrl() || routeOrigin);
    const originServer = normalizeServerUrl(routeOrigin);
    const normalizedSavedServer = normalizeServerUrl(savedServer);
    const allowOriginServer = shouldUseCurrentOriginAsServer(currentServer);
    const effectiveSavedServer = !allowOriginServer && (normalizedSavedServer === currentServer || normalizedSavedServer === originServer)
        ? ""
        : normalizedSavedServer;
    const localPreferredCandidates = forceDefaultServer
        ? [
            normalizedDefaultServer,
        ]
        : allowOriginServer
        ? [
            normalizeServerUrl(queryServer),
            currentServer,
            originServer,
            ...buildLocalPortCandidates(currentServer),
            ...buildLocalPortCandidates(originServer),
            effectiveSavedServer,
            normalizedDefaultServer,
        ]
        : [
            normalizeServerUrl(queryServer),
            effectiveSavedServer,
            normalizedDefaultServer,
            currentServer,
            originServer,
        ];

    const candidates = localPreferredCandidates.filter(Boolean);
    const uniqueCandidates = Array.from(new Set(candidates));
    const resolvedServer = uniqueCandidates[0] || "";

    window.DEDOGEIUM_SERVER_STORAGE_KEY = STORAGE_KEY;
    window.DEDOGEIUM_SERVER_CANDIDATES = uniqueCandidates;
    window.DEDOGEIUM_ALLOW_ORIGIN_SERVER = allowOriginServer;
    window.DEDOGEIUM_FORCE_DEFAULT_SERVER = forceDefaultServer;
    window.DEDOGEIUM_SITE_ORIGIN = routeOrigin;
    window.DEDOGEIUM_SITE_SERVER_BASE = currentServer;
    if (resolvedServer) {
        localStorage.setItem(STORAGE_KEY, resolvedServer);
    } else if (!allowOriginServer && (normalizedSavedServer === currentServer || normalizedSavedServer === originServer)) {
        localStorage.removeItem(STORAGE_KEY);
    }
    window.SERVER_URL = resolvedServer || "";
})();

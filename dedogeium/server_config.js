(function configureDedogeiumServer() {
    const STORAGE_KEY = "dedogeiumServerUrl";
    const queryServer = new URLSearchParams(window.location.search).get("server");
    const routeOrigin = window.location.origin && window.location.origin !== "null"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    const savedServer = localStorage.getItem(STORAGE_KEY);
    const fallbackServer = routeOrigin || "";
    const resolvedServer = queryServer || savedServer || fallbackServer;

    window.DEDOGEIUM_SERVER_STORAGE_KEY = STORAGE_KEY;
    window.SERVER_URL = resolvedServer ? resolvedServer.replace(/\/$/, "") : "";
})();

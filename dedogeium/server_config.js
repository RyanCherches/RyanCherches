(function configureDedogeiumServer() {
    const STORAGE_KEY = "dedogeiumServerUrl";
    const routeOrigin = window.location.origin && window.location.origin !== "null"
        ? window.location.origin.replace(/\/$/, "")
        : "";
    const savedServer = localStorage.getItem(STORAGE_KEY);
    const fallbackServer = routeOrigin || "http://localhost:3000";

    window.DEDOGEIUM_SERVER_STORAGE_KEY = STORAGE_KEY;
    window.SERVER_URL = (savedServer || fallbackServer).replace(/\/$/, "");
})();

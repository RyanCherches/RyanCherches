const SPLIT_BG_KEY = "splitBackgroundEnabled";
const SPLIT_BG_LEFT = "#0000FF";
const SPLIT_BG_RIGHT = "#FF0000";
const SPLIT_BG_SWITCH_MS = 1000;
const SPLIT_BG_MAX_DPR = 2;

let splitBackgroundState = null;

function syncEquippedBattleCompanion() {
    const playerBody = document.querySelector(".character-container.player .character-body");
    if (!playerBody || !window.DedogeiumSystems || typeof window.DedogeiumSystems.syncSoccerBallVisual !== "function") {
        return;
    }

    window.DedogeiumSystems.syncSoccerBallVisual(playerBody, {
        className: "equipped-battle-ball",
        alt: "Equipped soccer ball",
        beforeSelector: "#hlth",
    });
}

function initSplitBackground() {
    const enabled = localStorage.getItem(SPLIT_BG_KEY) === "true";

    destroySplitBackground();

    if (!enabled) {
        return;
    }

    createSplitBackground();
}

function destroySplitBackground() {
    if (splitBackgroundState?.intervalId) {
        window.clearInterval(splitBackgroundState.intervalId);
    }

    if (splitBackgroundState?.resizeHandler) {
        window.removeEventListener("resize", splitBackgroundState.resizeHandler);
    }

    const existing = document.getElementById("split-bg-container");
    if (existing) {
        existing.remove();
    }

    splitBackgroundState = null;
}

function createSplitBackground() {
    const container = document.createElement("div");
    container.id = "split-bg-container";
    container.className = "split-bg-container";

    const leftSide = document.createElement("div");
    leftSide.className = "split-bg-half split-bg-half--left";

    const rightSide = document.createElement("div");
    rightSide.className = "split-bg-half split-bg-half--right";

    const seam = document.createElement("div");
    seam.className = "split-bg-seam";

    const canvasA = document.createElement("canvas");
    canvasA.className = "split-bg-seam-canvas is-visible";

    const canvasB = document.createElement("canvas");
    canvasB.className = "split-bg-seam-canvas";

    seam.appendChild(canvasA);
    seam.appendChild(canvasB);
    container.appendChild(leftSide);
    container.appendChild(rightSide);
    container.appendChild(seam);
    document.body.insertBefore(container, document.body.firstChild);

    splitBackgroundState = {
        activeCanvasIndex: 0,
        canvases: [canvasA, canvasB],
        seed: 1,
        intervalId: null,
        resizeHandler: null
    };

    const resizeHandler = () => {
        resizeSplitBackground();
    };

    splitBackgroundState.resizeHandler = resizeHandler;
    window.addEventListener("resize", resizeHandler, { passive: true });

    resizeSplitBackground();
    primeSplitBackground();
    splitBackgroundState.intervalId = window.setInterval(switchSplitColors, SPLIT_BG_SWITCH_MS);
}

function primeSplitBackground() {
    if (!splitBackgroundState) {
        return;
    }

    drawSeamToCanvas(splitBackgroundState.canvases[0], splitBackgroundState.seed++);
    drawSeamToCanvas(splitBackgroundState.canvases[1], splitBackgroundState.seed++);
}

function resizeSplitBackground() {
    if (!splitBackgroundState) {
        return;
    }

    splitBackgroundState.canvases.forEach((canvas) => {
        const dpr = Math.min(window.devicePixelRatio || 1, SPLIT_BG_MAX_DPR);
        const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    });

    primeSplitBackground();
}

function switchSplitColors() {
    if (!splitBackgroundState) {
        return;
    }

    const nextIndex = splitBackgroundState.activeCanvasIndex === 0 ? 1 : 0;
    const currentCanvas = splitBackgroundState.canvases[splitBackgroundState.activeCanvasIndex];
    const nextCanvas = splitBackgroundState.canvases[nextIndex];

    drawSeamToCanvas(nextCanvas, splitBackgroundState.seed++);

    window.requestAnimationFrame(() => {
        currentCanvas.classList.remove("is-visible");
        nextCanvas.classList.add("is-visible");
        splitBackgroundState.activeCanvasIndex = nextIndex;
    });
}

function drawSeamToCanvas(canvas, seed) {
    const context = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, SPLIT_BG_MAX_DPR);

    if (!context || width === 0 || height === 0) {
        return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const random = createSeededRandom(seed);
    const profile = createRandomProfile(random);

    paintSoftBase(context, width, height, profile);
    paintColorClouds(context, width, height, random, 80, 60, 150, 0.28, profile, 0.09);
    paintColorClouds(context, width, height, random, 190, 24, 64, 0.18, profile, 0.14);
    paintSparkle(context, width, height, random, profile);
}

function createRandomProfile(random) {
    const hotspotCount = 4 + Math.floor(random() * 4);
    const hotspots = [];

    for (let index = 0; index < hotspotCount; index++) {
        const favorRed = random() < 0.5;
        hotspots.push({
            strength: (0.08 + random() * 0.14) * (favorRed ? 1 : -1),
            x: 0.05 + random() * 0.9,
            y: 0.08 + random() * 0.84,
            radius: 0.14 + random() * 0.24
        });
    }

    return {
        blueBoost: 0.25 + random() * 0.08,
        redBoost: 0.25 + random() * 0.08,
        drift: (random() - 0.5) * 0.03,
        edgeBiasStrength: 0.22 + random() * 0.06,
        highlightColor: random() < 0.5 ? "rgba(210, 224, 255, 0.09)" : "rgba(255, 220, 214, 0.09)",
        hotspots
    };
}

function paintSoftBase(context, width, height, profile) {
    const feather = context.createLinearGradient(0, 0, width, 0);
    feather.addColorStop(0, `rgba(0, 0, 255, ${profile.blueBoost})`);
    feather.addColorStop(0.2, `rgba(0, 0, 255, ${profile.blueBoost * 0.58})`);
    feather.addColorStop(0.42, "rgba(0, 0, 255, 0.08)");
    feather.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
    feather.addColorStop(0.58, "rgba(255, 0, 0, 0.08)");
    feather.addColorStop(0.8, `rgba(255, 0, 0, ${profile.redBoost * 0.58})`);
    feather.addColorStop(1, `rgba(255, 0, 0, ${profile.redBoost})`);

    context.fillStyle = feather;
    context.fillRect(0, 0, width, height);
}

function paintColorClouds(context, width, height, random, count, minRadius, maxRadius, maxAlpha, profile, noiseAmount) {
    for (let index = 0; index < count; index++) {
        const x = random() * width;
        const y = random() * height;
        const blend = getSeamBlend(x / width, profile.edgeBiasStrength);
        const hotspotBias = getHotspotBias(x / width, y / height, profile.hotspots);
        const shiftedBlend = Math.min(
            1,
            Math.max(0, blend + profile.drift + hotspotBias + (random() - 0.5) * noiseAmount)
        );
        const radius = minRadius + random() * (maxRadius - minRadius);
        const alpha = maxAlpha * (0.45 + random() * 0.55);

        paintCloud(context, x, y, radius, random() < shiftedBlend ? SPLIT_BG_RIGHT : SPLIT_BG_LEFT, alpha);
    }
}

function getSeamBlend(x, edgeBiasStrength) {
    return 0.5 + ((x - 0.5) * edgeBiasStrength);
}

function getHotspotBias(x, y, hotspots) {
    let bias = 0;

    hotspots.forEach((hotspot) => {
        const dx = x - hotspot.x;
        const dy = y - hotspot.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        if (distance >= hotspot.radius) {
            return;
        }

        const influence = 1 - (distance / hotspot.radius);
        bias += hotspot.strength * influence * influence;
    });

    return bias;
}

function paintCloud(context, x, y, radius, color, alpha) {
    const [red, green, blue] = hexToRgb(color);
    const bloomGradient = context.createRadialGradient(x, y, radius * 0.12, x, y, radius * 1.6);
    const gradient = context.createRadialGradient(x, y, radius * 0.06, x, y, radius);
    const bloomAlpha = Math.min(0.34, alpha * 0.95);
    const coreAlpha = Math.min(0.48, alpha * 1.35);
    const highlightAlpha = Math.min(0.28, alpha * 0.85);

    bloomGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${bloomAlpha})`);
    bloomGradient.addColorStop(0.58, `rgba(${red}, ${green}, ${blue}, ${bloomAlpha * 0.5})`);
    bloomGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

    context.fillStyle = bloomGradient;
    context.beginPath();
    context.arc(x, y, radius * 1.6, 0, Math.PI * 2);
    context.fill();

    gradient.addColorStop(0, `rgba(255, 255, 255, ${highlightAlpha})`);
    gradient.addColorStop(0.18, `rgba(${red}, ${green}, ${blue}, ${coreAlpha})`);
    gradient.addColorStop(0.5, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.78})`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
}

function paintSparkle(context, width, height, random, profile) {
    const highlight = context.createRadialGradient(width / 2, height * 0.5, 0, width / 2, height * 0.5, width * 0.35);
    highlight.addColorStop(0, profile.highlightColor);
    highlight.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.fillStyle = highlight;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 80; index++) {
        const size = 2 + random() * 4;
        const x = random() * width;
        const y = random() * height;
        const alpha = 0.015 + random() * 0.02;

        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }
}

function createSeededRandom(seed) {
    let value = seed >>> 0;

    return function seededRandom() {
        value += 0x6d2b79f5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
}

function hexToRgb(color) {
    const value = color.replace("#", "");
    return [
        Number.parseInt(value.slice(0, 2), 16),
        Number.parseInt(value.slice(2, 4), 16),
        Number.parseInt(value.slice(4, 6), 16)
    ];
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        syncEquippedBattleCompanion();
        initSplitBackground();
    });
} else {
    syncEquippedBattleCompanion();
    initSplitBackground();
}

window.initSplitBackground = initSplitBackground;

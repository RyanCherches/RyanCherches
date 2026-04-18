const aprilFoolsBox = document.getElementById('AprilFools-box');
const SHOP_CATALOG = [
    { label: 'Common Doge', cost: 50, item: { name: 'Doge', rarity: 'Common' } },
    { label: 'Uncommon Doge', cost: 150, item: { name: 'Doge', rarity: 'Uncommon' } },
    { label: 'Rare Doge', cost: 450, item: { name: 'Doge', rarity: 'Rare' } },
    { label: 'Epic Doge', cost: 1350, item: { name: 'Doge', rarity: 'Epic' } },
    { label: 'Legendary Doge', cost: 4000, item: { name: 'Doge', rarity: 'Legendary' } },
    { label: 'Godly Doge', cost: 12000, item: { name: 'Doge', rarity: 'Godly' } },
    { label: 'Common Fire Doge', cost: 200, item: { name: 'Fire Doge', rarity: 'Common' } },
    { label: 'Uncommon Fire Doge', cost: 600, item: { name: 'Fire Doge', rarity: 'Uncommon' } },
    { label: 'Rare Fire Doge', cost: 1800, item: { name: 'Fire Doge', rarity: 'Rare' } },
    { label: 'Epic Fire Doge', cost: 5400, item: { name: 'Fire Doge', rarity: 'Epic' } },
    { label: 'Legendary Fire Doge', cost: 16200, item: { name: 'Fire Doge', rarity: 'Legendary' } },
    { label: 'Godly Fire Doge', cost: 30000, item: { name: 'Fire Doge', rarity: 'Godly' } },
];
const SELL_RETURN_RATE = 0.5;
const SELL_VALUE_LOOKUP = SHOP_CATALOG.reduce((lookup, shopItem) => {
    lookup[`${shopItem.item.name}|${shopItem.item.rarity}`] = Math.max(1, Math.floor(shopItem.cost * SELL_RETURN_RATE));
    return lookup;
}, {});
const EXTRA_SLOT_COST = 2500;
const BOOST_SHOP_ITEMS = [
    { key: "currency", cost: 350 },
    { key: "luck", cost: 500 },
];

function getCurrentExtraSlotCost() {
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.getExtraSlotCost === "function") {
        return window.DedogeiumSystems.getExtraSlotCost();
    }
    return EXTRA_SLOT_COST;
}

function getCurrentBoostCost(boostKey, fallbackCost) {
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.getBoostChargeCost === "function") {
        return window.DedogeiumSystems.getBoostChargeCost(boostKey);
    }
    return fallbackCost;
}

function getCurrency() {
    return Number(localStorage.getItem('currency') || 0);
}

function setCurrency(amount) {
    const normalized = Math.max(0, Number(amount) || 0);
    localStorage.setItem('currency', String(normalized));
    const currencyEl = document.getElementById('currency-value');
    if (currencyEl) currencyEl.textContent = String(normalized);
}

function addCurrency(amount) {
    setCurrency(getCurrency() + Number(amount || 0));
}

function getStoredInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function setStoredInventory(inventory) {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function addStoredInventoryItem(item) {
    const inventory = getStoredInventory();
    inventory.push({ ...item, id: Date.now() + Math.floor(Math.random() * 1000) });
    setStoredInventory(inventory);
}

function getCustomizeProgressionSnapshot() {
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.getProgressionSnapshot === "function") {
        return window.DedogeiumSystems.getProgressionSnapshot();
    }
    return {
        state: {
            extraSlots: 0,
            boostInventory: { currency: 0, luck: 0 },
            activeBoosts: {
                currency: { remainingMs: 0, running: false, startedAt: null },
                luck: { remainingMs: 0, running: false, startedAt: null },
            },
        },
        boostDefinitions: {},
        baseEquipSlots: 5,
        maxExtraSlots: 5,
    };
}

function getCustomizeMaxEquipSlots() {
    if (window.DedogeiumSystems && typeof window.DedogeiumSystems.getMaxEquipSlots === "function") {
        return window.DedogeiumSystems.getMaxEquipSlots();
    }
    return 5;
}

console.log("Player currency:", getCurrency());
// Load inventory from localStorage and display items
window.addEventListener('DOMContentLoaded', function() {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    let equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    const listItemsContainer = document.querySelector(".list-items");
    const equipSlotsContainer = document.querySelector(".character-items");
    const statsContainer = document.querySelector(".stats");
    const aprilFoolsEnabled = localStorage.getItem("aprilFoolsEnabled") === "true";
    let selectedItemId = inventory[0] ? inventory[0].id : null;
    let inventoryActionMessage = "";
    let inventoryActionIsError = false;
    let boostMessage = "";
    let boostMessageIsError = false;
    let boostUiTimerId = null;
    
    if (aprilFoolsBox) {
        aprilFoolsBox.style.display = "block";
        const aprilFoolsCheckbox = document.getElementById('April-fools');
        if (aprilFoolsCheckbox) {
            aprilFoolsCheckbox.checked = aprilFoolsEnabled;
            setAprilFoolsMode(aprilFoolsEnabled);
            if (aprilFoolsEnabled) {
                ensureRickAstleyDoge(inventory);
            }
            aprilFoolsCheckbox.addEventListener("change", () => {
                const enabled = aprilFoolsCheckbox.checked;
                localStorage.setItem("aprilFoolsEnabled", String(enabled));
                setAprilFoolsMode(enabled);
                if (enabled) {
                    ensureRickAstleyDoge(inventory);
                    if (typeof window.refreshCustomizeInventoryUI === 'function') {
                        window.refreshCustomizeInventoryUI();
                    }
                } else {
                    if (typeof window.refreshCustomizeInventoryUI === 'function') {
                        window.refreshCustomizeInventoryUI();
                    }
                }
            });
        }
    }

    // remove any floating player HP badge (we'll show HP in the stats instead)
    const existingHpBadge = document.getElementById('player-hp');
    // if (existingHpBadge) existingHpBadge.remove();

    if (!listItemsContainer) return;
    
    // Map base doge rarity to image source
    const rarityImages = {
        "Common": "common doge.png",
        "Uncommon": "uncommon doge.svg",
        "Rare": "rare doge.png",
        "Epic": "epic doge.png",
        "Legendary": "legendary doge.png",
        "rick astley": "rick astley.webp",
        "Godly": "godly doge.png",
        "Mythic": "mythic doge.svg"
    };

    // Map fire doge rarity to image source
    const fireRarityImages = {
        "Common": "common fire doge.png",
        "Uncommon": "uncommon fire doge.png",
        "Rare": "rare fire doge.png",
        "Epic": "epic fire doge.png",
        "Legendary": "legendary fire doge.png",
        "Godly": "godly fire doge.png"
    };

    // Map doge type + rarity to stat bonuses (damage, health)
    const rarityBonuses = {
        "Doge": {
            "Common": { damage: 2, health: 50 },
            "Uncommon": { damage: 5, health: 100 },
            "Rare": { damage: 10, health: 150 },
            "Epic": { damage: 20, health: 250 },
            "Legendary": { damage: 40, health: 400 },
            "Godly": { damage: 80, health: 600 }
        },
        "Fire Doge": {
            "Common": { damage: 4, health: 100 },
            "Uncommon": { damage: 8, health: 160 },
            "Rare": { damage: 15, health: 240 },
            "Epic": { damage: 30, health: 375 },
            "Legendary": { damage: 60, health: 600 },
            "Godly": { damage: 120, health: 900 }
        }
    };

    function getItemImage(item) {
        const rarity = item && item.rarity;
        if (item && (item.name === "Rick Astley Doge" || item.name === "Rick Astley")) {
            return "rick astley.webp";
        }
        if (item && item.name === "Fire Doge" && fireRarityImages[rarity]) {
            return fireRarityImages[rarity];
        }
        return rarityImages[rarity] || "Im just a chill guy no background.png";
    }

    function getItemBonus(item) {
        const itemName = item && item.name === "Fire Doge" ? "Fire Doge" : "Doge";
        const bonusGroup = rarityBonuses[itemName] || {};
        return bonusGroup[item && item.rarity] || { damage: 0, health: 0 };
    }

    function ensureSelectedItemExists() {
        if (selectedItemId && inventory.some((item) => item.id === selectedItemId)) {
            return;
        }
        selectedItemId = inventory[0] ? inventory[0].id : null;
    }

    function getSelectedItem() {
        ensureSelectedItemExists();
        return inventory.find((item) => item.id === selectedItemId) || null;
    }

    function getItemSellValue(item) {
        const lookupKey = `${item && item.name ? item.name : "Doge"}|${item && item.rarity ? item.rarity : ""}`;
        if (Object.prototype.hasOwnProperty.call(SELL_VALUE_LOOKUP, lookupKey)) {
            return SELL_VALUE_LOOKUP[lookupKey];
        }

        const bonus = getItemBonus(item);
        const fallbackValue = Math.floor((bonus.damage * 20 + bonus.health * 2) * SELL_RETURN_RATE);
        return Math.max(25, fallbackValue || 25);
    }

    function getProgressionSnapshot() {
        return getCustomizeProgressionSnapshot();
    }

    function getMaxEquipSlots() {
        return getCustomizeMaxEquipSlots();
    }

    function renderEquipSlotSummary() {
        if (!statsContainer) return;
        let slotLine = document.getElementById("equip-slot-line");
        if (!slotLine) {
            slotLine = document.createElement("p");
            slotLine.id = "equip-slot-line";
            const currencyLine = document.getElementById("currency-value");
            if (currencyLine && currencyLine.parentElement) {
                currencyLine.parentElement.insertAdjacentElement("afterend", slotLine);
            } else {
                statsContainer.appendChild(slotLine);
            }
        }

        const snapshot = getProgressionSnapshot();
        slotLine.innerHTML = `Equip Slots: <span id="equip-slot-count">${getMaxEquipSlots()}</span> <small>(+${snapshot.state.extraSlots} bought)</small>`;
    }

    function renderEquipSlots() {
        if (!equipSlotsContainer) return;
        const maxSlots = getMaxEquipSlots();
        equipSlotsContainer.innerHTML = "";
        for (let i = 0; i < maxSlots; i += 1) {
            const slot = document.createElement("div");
            slot.className = "border";
            slot.id = `equip-slot-${i}`;
            slot.title = "Click equipped item to unequip";
            equipSlotsContainer.appendChild(slot);
        }
    }

    function setBoostMessage(message, isError = false) {
        boostMessage = message;
        boostMessageIsError = isError;
    }

    function ensureBoostControlPanel() {
        let panel = document.getElementById("boost-control-panel");
        if (panel) return panel;

        panel = document.createElement("section");
        panel.id = "boost-control-panel";

        const shopPanel = document.getElementById("shop-panel");
        if (shopPanel) {
            shopPanel.insertAdjacentElement("afterend", panel);
        } else if (listItemsContainer) {
            listItemsContainer.appendChild(panel);
        }
        return panel;
    }

    function handleBuyExtraSlot() {
        const extraSlotCost = getCurrentExtraSlotCost();
        if (getCurrency() < extraSlotCost) {
            setShopMessage("Not enough currency for an extra slot yet.", true);
            return;
        }
        const result = window.DedogeiumSystems && window.DedogeiumSystems.buyExtraSlot
            ? window.DedogeiumSystems.buyExtraSlot()
            : { ok: false, error: "Slot upgrades are unavailable right now." };

        if (!result.ok) {
            setShopMessage(result.error || "Could not buy another slot.", true);
            return;
        }

        addCurrency(-extraSlotCost);
        setShopMessage(`Bought an extra equip slot. You can now equip ${getMaxEquipSlots()} doges.`, false);
        if (typeof window.refreshCustomizeInventoryUI === "function") {
            window.refreshCustomizeInventoryUI();
        }
    }

    function handleBuyBoost(boostKey, fallbackCost) {
        const definition = window.DedogeiumSystems && window.DedogeiumSystems.BOOST_DEFINITIONS
            ? window.DedogeiumSystems.BOOST_DEFINITIONS[boostKey]
            : null;
        const boostCost = getCurrentBoostCost(boostKey, fallbackCost);
        if (!definition) {
            setShopMessage("That boost is unavailable right now.", true);
            return;
        }
        if (getCurrency() < boostCost) {
            setShopMessage(`Not enough currency for ${definition.label}.`, true);
            return;
        }

        const result = window.DedogeiumSystems.buyBoostCharge(boostKey, 1);
        if (!result.ok) {
            setShopMessage(result.error || `Could not buy ${definition.label}.`, true);
            return;
        }

        addCurrency(-boostCost);
        setShopMessage(`Bought 1 ${definition.label} charge. Start it from the boost controls whenever you want.`, false);
        buildBoostControlUI();
        buildShopUI();
    }

    window.customizeShopActions = {
        handleBuyExtraSlot,
        handleBuyBoost,
    };

    function handleStartBoost(boostKey) {
        const result = window.DedogeiumSystems.startBoost(boostKey);
        if (!result.ok) {
            setBoostMessage(result.error || "Could not start that boost.", true);
            buildBoostControlUI();
            return;
        }
        const definition = window.DedogeiumSystems.BOOST_DEFINITIONS[boostKey];
        setBoostMessage(`${definition.label} started. You can stop it any time and save the remaining time.`, false);
        buildBoostControlUI();
    }

    function handleStopBoost(boostKey) {
        const result = window.DedogeiumSystems.stopBoost(boostKey);
        if (!result.ok) {
            setBoostMessage(result.error || "Could not stop that boost.", true);
            buildBoostControlUI();
            return;
        }
        const definition = window.DedogeiumSystems.BOOST_DEFINITIONS[boostKey];
        setBoostMessage(`${definition.label} paused. The rest of its time is saved for later.`, false);
        buildBoostControlUI();
    }

    function buildBoostControlUI() {
        const panel = ensureBoostControlPanel();
        if (!panel || !window.DedogeiumSystems) return;

        const snapshot = getProgressionSnapshot();
        const definitions = snapshot.boostDefinitions || {};

        panel.innerHTML = `
            <h3>Boost Controls</h3>
            <p class="boost-intro">Bought boosts do not run on their own. Start them when you want, and stop them whenever you want.</p>
            <div class="boost-list"></div>
            <p class="boost-msg ${boostMessageIsError ? "error" : ""}">${boostMessage}</p>
        `;

        const boostList = panel.querySelector(".boost-list");
        ["currency", "luck"].forEach((boostKey) => {
            const boostState = snapshot.state.activeBoosts[boostKey];
            const boostInventory = snapshot.state.boostInventory[boostKey] || 0;
            const definition = definitions[boostKey];
            if (!definition) return;

            const row = document.createElement("div");
            row.className = "boost-row";
            row.innerHTML = `
                <div class="boost-copy">
                    <div class="boost-name">${definition.label}</div>
                    <div class="boost-description">${definition.description}</div>
                    <div class="boost-meta">
                        <span>Charges: ${boostInventory}</span>
                        <span>Status: ${boostState.running ? "Running" : boostState.remainingMs > 0 ? "Paused" : "Idle"}</span>
                        <span>Time left: ${window.DedogeiumSystems.formatDuration(boostState.remainingMs)}</span>
                    </div>
                </div>
                <div class="boost-actions">
                    <button type="button" class="inventory-btn boost-start-btn" ${boostState.running ? "disabled" : ""}>Start</button>
                    <button type="button" class="inventory-btn boost-stop-btn" ${boostState.running ? "" : "disabled"}>Stop</button>
                </div>
            `;

            const startBtn = row.querySelector(".boost-start-btn");
            const stopBtn = row.querySelector(".boost-stop-btn");
            if (startBtn) {
                startBtn.addEventListener("click", function () {
                    handleStartBoost(boostKey);
                });
            }
            if (stopBtn) {
                stopBtn.addEventListener("click", function () {
                    handleStopBoost(boostKey);
                });
            }
            boostList.appendChild(row);
        });
    }

    function renderSelectedItemPanel() {
        if (!listItemsContainer) return;

        let selectedPanel = document.getElementById("selected-doge-panel");
        if (!selectedPanel) {
            selectedPanel = document.createElement("section");
            selectedPanel.id = "selected-doge-panel";
            const titleBlock = listItemsContainer.firstElementChild;
            if (titleBlock) {
                titleBlock.insertAdjacentElement("afterend", selectedPanel);
            } else {
                listItemsContainer.prepend(selectedPanel);
            }
        }

        const selectedItem = getSelectedItem();
        if (!selectedItem) {
            selectedPanel.innerHTML = `
                <h3>Doge Stats</h3>
                <p class="selected-doge-empty">Click a doge from your inventory to view its stats and manage its gear.</p>
                <p class="inventory-action-msg ${inventoryActionIsError ? "error" : ""}">${inventoryActionMessage}</p>
            `;
            return;
        }

        const imageSource = getItemImage(selectedItem);
        const bonus = getItemBonus(selectedItem);
        const sellValue = getItemSellValue(selectedItem);
        const isEquipped = equippedItems.some((item) => item.id === selectedItem.id);

        selectedPanel.innerHTML = `
            <h3>Doge Stats</h3>
            <div class="selected-doge-card">
                <img src="${imageSource}" alt="${selectedItem.name || "Doge"} ${selectedItem.rarity}" class="selected-doge-image">
                <div class="selected-doge-copy">
                    <p class="selected-doge-name">${selectedItem.name || "Doge"}</p>
                    <p class="selected-doge-rarity">${selectedItem.rarity}</p>
                    <div class="selected-doge-stats">
                        <span>Damage +${bonus.damage}</span>
                        <span>Health +${bonus.health}</span>
                        <span>Sell value: ${sellValue}</span>
                        <span>${isEquipped ? "Equipped" : "Not equipped"}</span>
                    </div>
                    <div class="selected-doge-actions">
                        <button type="button" class="inventory-btn equip-btn">${isEquipped ? "Unequip" : "Equip"}</button>
                    </div>
                    <p class="inventory-action-msg ${inventoryActionIsError ? "error" : ""}">${inventoryActionMessage}</p>
                </div>
            </div>
        `;

        const equipBtn = selectedPanel.querySelector(".equip-btn");

        if (equipBtn) {
            equipBtn.addEventListener("click", function() {
                inventoryActionMessage = "";
                toggleEquipItem(selectedItem);
            });
        }
    }

    function sellInventoryItem(item) {
        const storedItem = inventory.find((entry) => entry.id === item.id);
        if (!storedItem) {
            inventoryActionMessage = "That doge is no longer in your inventory.";
            inventoryActionIsError = true;
            renderSelectedItemPanel();
            return;
        }

        const sellValue = getItemSellValue(storedItem);
        inventory = inventory.filter((entry) => entry.id !== storedItem.id);
        equippedItems = equippedItems.filter((entry) => entry.id !== storedItem.id);

        setStoredInventory(inventory);
        localStorage.setItem("equippedItems", JSON.stringify(equippedItems));
        addCurrency(sellValue);

        inventoryActionMessage = `Sold ${storedItem.name || "Doge"} (${storedItem.rarity}) for ${sellValue} currency.`;
        inventoryActionIsError = false;
        ensureSelectedItemExists();

        if (typeof window.refreshCustomizeInventoryUI === 'function') {
            window.refreshCustomizeInventoryUI();
        }
    }
    
    function renderInventoryList() {
        if (!listItemsContainer) return;
        ensureSelectedItemExists();
        const itemDivs = listItemsContainer.querySelectorAll(".item");
        itemDivs.forEach(div => div.remove());

        inventory.forEach((item, index) => {
            const imageSource = getItemImage(item);
            const bonus = getItemBonus(item);
            const sellValue = getItemSellValue(item);
            const itemDiv = document.createElement("div");
            itemDiv.className = "item";
            const isEquipped = equippedItems.some(eq => eq.id === item.id);
            if (isEquipped) {
                itemDiv.classList.add("equipped");
            }
            if (item.id === selectedItemId) {
                itemDiv.classList.add("selected");
            }
            itemDiv.innerHTML = `
                <img src="${imageSource}" height="50px">
                <p>${item.name || "Doge"} (${item.rarity})</p>
                <p class="item-mini-stats">DMG +${bonus.damage} | HP +${bonus.health}</p>
                <button type="button" class="item-sell-btn">Sell for ${sellValue}</button>
            `;
            itemDiv.style.cursor = "pointer";
            itemDiv.addEventListener("click", function() {
                selectedItemId = item.id;
                inventoryActionMessage = "";
                inventoryActionIsError = false;
                renderInventoryList();
                renderSelectedItemPanel();
            });

            const sellBtn = itemDiv.querySelector(".item-sell-btn");
            if (sellBtn) {
                sellBtn.addEventListener("click", function(event) {
                    event.stopPropagation();
                    sellInventoryItem(item);
                });
            }
            listItemsContainer.appendChild(itemDiv);
        });
    }

    function refreshCustomizeInventoryUI() {
        inventory = getStoredInventory();
        equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
        ensureSelectedItemExists();
        renderEquipSlots();
        renderEquipSlotSummary();
        renderInventoryList();
        renderSelectedItemPanel();
        displayEquippedItems(equippedItems, getItemImage, getItemBonus);
        setCurrency(getCurrency());
        buildExchangeUI();
        buildShopUI();
        buildBoostControlUI();
    }

    window.refreshCustomizeInventoryUI = refreshCustomizeInventoryUI;

    // Initial render
    refreshCustomizeInventoryUI();
    if (!boostUiTimerId) {
        boostUiTimerId = window.setInterval(function () {
            buildBoostControlUI();
            renderEquipSlotSummary();
        }, 1000);
    }

    // Register current player (so admin can see who accessed the game)
    try {
        registerCurrentPlayer(inventory);
    } catch (e) {
        console.error('Failed to register player', e);
    }
});

function setAprilFoolsMode(enabled) {
    const characterImg = document.querySelector(".display-character img");
    if (!characterImg) return;
    const normalSrc = characterImg.dataset.normalSrc || characterImg.src;
    characterImg.dataset.normalSrc = normalSrc;
    characterImg.src = enabled ? "rick astley.webp" : normalSrc;
}

function ensureRickAstleyDoge(inventoryOverride) {
    const inventory = inventoryOverride || JSON.parse(localStorage.getItem("inventory")) || [];
    const hasRick = inventory.some(it => it.name === "Rick Astley Doge" || it.name === "Rick Astley");
    if (hasRick) return false;
    inventory.push({ name: "Rick Astley Doge", rarity: "rick astley", id: Date.now() });
    localStorage.setItem("inventory", JSON.stringify(inventory));
    return true;
}

// Record the current player into a central players list stored at 'dedogeium_players'
function registerCurrentPlayer(inventory) {
    // try common keys where username might be stored
    const keys = ['Username', 'Uabcd', 'username', 'playerName'];
    let name = null;
    for (let k of keys) {
        const v = localStorage.getItem(k);
        if (v) { name = String(v).trim().toLowerCase(); break; }
    }
    if (!name) return; // no username known on this client

    // try common password keys (may not be present)
    const passKeys = ['Password', 'Pabc', 'password', 'pass', 'pwd'];
    let password = null;
    for (let k of passKeys) {
        const v = localStorage.getItem(k);
        if (v) { password = String(v); break; }
    }

    const players = JSON.parse(localStorage.getItem('dedogeium_players')) || {};
    const now = Date.now();
    if (!players[name]) {
        players[name] = { firstSeen: now, visits: 0, inventory: [] };
    }
    players[name].lastSeen = now;
    players[name].visits = (players[name].visits || 0) + 1;
    // store a snapshot of current inventory for the player
    players[name].inventory = inventory || JSON.parse(localStorage.getItem('inventory')) || [];
    // store password if found (note: this stores plaintext passwords in localStorage)
    if (password) players[name].password = password;

    localStorage.setItem('dedogeium_players', JSON.stringify(players));
    // also keep individual snapshot key for quick lookup
    localStorage.setItem('inventory_' + name, JSON.stringify(players[name].inventory));

    // also try to POST to central server (non-blocking)
    (async function(){
        try {
            const allowOriginServer = typeof window.DEDOGEIUM_ALLOW_ORIGIN_SERVER === "boolean"
                ? window.DEDOGEIUM_ALLOW_ORIGIN_SERVER
                : true;
            const originServer = allowOriginServer && window.location.origin && window.location.origin !== "null"
                ? window.location.origin
                : "";
            const server = (window.SERVER_URL || localStorage.getItem(window.DEDOGEIUM_SERVER_STORAGE_KEY || "dedogeiumServerUrl") || originServer || '').replace(/\/$/, '');
            if (!server) return;
            await fetch(server + '/api/player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, player: players[name] })
            });
        } catch (e) { /* ignore */ }
    })();
}

function buildExchangeUI() {
    const exchangeList = document.getElementById('exchange-list');
    const exchangeMsg = document.getElementById('exchange-msg');
    if (!exchangeList) return;

    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];

    // define exchange rules
    const exchanges = [
        { from: "Common", need: 2, to: "Uncommon" },
        { from: "Uncommon", need: 3, to: "Rare" },
        { from: "Rare", need: 4, to: "Epic" },
        { from: "Epic", need: 5, to: "Legendary" },
        { from: "Legendary", need: 6, to: "Godly" }
    ];

    function getItemType(item) {
        return item && item.name === "Fire Doge" ? "Fire Doge" : "Doge";
    }

    function countByRarity(itemType) {
        return inventory
            .filter(it => getItemType(it) === itemType)
            .reduce((acc, it) => {
                acc[it.rarity] = (acc[it.rarity] || 0) + 1;
                return acc;
            }, {});
    }

    function renderExchangeGroup(itemType) {
        const title = document.createElement('h4');
        title.innerText = itemType;
        title.style.margin = '10px 0 6px 0';
        exchangeList.appendChild(title);

        const counts = countByRarity(itemType);
        exchanges.forEach(rule => {
            const have = counts[rule.from] || 0;
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '8px';
            container.style.marginBottom = '6px';

            const label = document.createElement('div');
            label.innerText = `${rule.from} -> ${rule.to}  (Need ${rule.need})`;

            const count = document.createElement('div');
            count.innerText = `You have: ${have}`;

            const btn = document.createElement('button');
            btn.innerText = 'Exchange';
            btn.disabled = have < rule.need;
            btn.addEventListener('click', function() {
                const success = performExchange(itemType, rule.from, rule.need, rule.to);
                if (success) {
                    exchangeMsg.style.color = 'green';
                    exchangeMsg.innerText = `Exchanged ${rule.need} ${itemType} ${rule.from} for 1 ${itemType} ${rule.to}.`;
                    setTimeout(() => location.reload(), 600);
                } else {
                    exchangeMsg.style.color = 'red';
                    exchangeMsg.innerText = `Not enough ${itemType} ${rule.from}.`;
                }
            });

            container.appendChild(label);
            container.appendChild(count);
            container.appendChild(btn);
            exchangeList.appendChild(container);
        });
    }

    exchangeList.innerHTML = "";
    renderExchangeGroup("Doge");
    renderExchangeGroup("Fire Doge");
}

function performExchange(itemType, fromRarity, requiredCount, toRarity) {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const fromItems = inventory.filter(it => {
        const currentType = it && it.name === "Fire Doge" ? "Fire Doge" : "Doge";
        return it.rarity === fromRarity && currentType === itemType;
    });
    if (fromItems.length < requiredCount) return false;

    // remove the first `requiredCount` items of that rarity
    const toRemoveIds = fromItems.slice(0, requiredCount).map(it => it.id);
    inventory = inventory.filter(it => !toRemoveIds.includes(it.id));

    // create new item of `toRarity`
    const newItem = { name: itemType, rarity: toRarity, id: Date.now() + Math.floor(Math.random()*1000) };
    inventory.push(newItem);
    localStorage.setItem("inventory", JSON.stringify(inventory));
    return true;
}

function setShopMessage(message, isError = false) {
    const shopMsg = document.getElementById('shop-msg');
    if (!shopMsg) return;
    shopMsg.style.color = isError ? 'red' : 'green';
    shopMsg.textContent = message;
}

function buildShopUI() {
    const shopList = document.getElementById('shop-list');
    if (!shopList) return;
    shopList.innerHTML = '';
    const intro = document.createElement('p');
    intro.className = 'shop-intro';
    intro.textContent = 'Spend your battle currency here. Stronger doges cost a lot more, and boosts stay idle until you start them yourself.';
    shopList.appendChild(intro);

    const groups = [
        { title: 'Doge', items: SHOP_CATALOG.filter((item) => item.item.name === 'Doge') },
        { title: 'Fire Doge', items: SHOP_CATALOG.filter((item) => item.item.name === 'Fire Doge') }
    ];

    groups.forEach((group) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'shop-group';

        const title = document.createElement('h4');
        title.className = 'shop-group-title';
        title.textContent = group.title;
        groupEl.appendChild(title);

        group.items.forEach((shopItem) => {
            const row = document.createElement('div');
            row.className = 'shop-row';

            const labelWrap = document.createElement('div');
            labelWrap.className = 'shop-label-wrap';

            const label = document.createElement('div');
            label.className = 'shop-label';
            label.textContent = shopItem.label;

            const cost = document.createElement('div');
            cost.className = 'shop-cost';
            cost.textContent = `${shopItem.cost} currency`;

            const buyBtn = document.createElement('button');
            buyBtn.className = 'shop-buy-btn';
            buyBtn.textContent = 'Buy';
            buyBtn.disabled = getCurrency() < shopItem.cost;
            buyBtn.addEventListener('click', function() {
                if (getCurrency() < shopItem.cost) {
                    setShopMessage('Not enough currency. Beat more levels first.', true);
                    return;
                }
                addCurrency(-shopItem.cost);
                addStoredInventoryItem(shopItem.item);
                if (typeof window.refreshCustomizeInventoryUI === 'function') {
                    window.refreshCustomizeInventoryUI();
                }
                setShopMessage(`Bought ${shopItem.label}!`, false);
            });

            labelWrap.appendChild(label);
            labelWrap.appendChild(cost);
            row.appendChild(labelWrap);
            row.appendChild(buyBtn);
            groupEl.appendChild(row);
        });

        shopList.appendChild(groupEl);
    });

    if (window.DedogeiumSystems) {
        const snapshot = getCustomizeProgressionSnapshot();
        const upgradeGroup = document.createElement("div");
        upgradeGroup.className = "shop-group";

        const title = document.createElement("h4");
        title.className = "shop-group-title";
        title.textContent = "Upgrades";
        upgradeGroup.appendChild(title);

        const slotRow = document.createElement("div");
        slotRow.className = "shop-row";
        const extraSlotCost = getCurrentExtraSlotCost();
        slotRow.innerHTML = `
            <div class="shop-label-wrap">
                <div class="shop-label">Extra Equip Slot</div>
                <div class="shop-cost">${extraSlotCost} currency | Slots: ${getCustomizeMaxEquipSlots()} / ${snapshot.baseEquipSlots + snapshot.maxExtraSlots}</div>
            </div>
        `;

        const slotBtn = document.createElement("button");
        slotBtn.className = "shop-buy-btn";
        slotBtn.textContent = snapshot.state.extraSlots >= snapshot.maxExtraSlots ? "Maxed" : "Buy";
        slotBtn.disabled = getCurrency() < extraSlotCost || snapshot.state.extraSlots >= snapshot.maxExtraSlots;
        slotBtn.addEventListener("click", function () {
            if (window.customizeShopActions && typeof window.customizeShopActions.handleBuyExtraSlot === "function") {
                window.customizeShopActions.handleBuyExtraSlot();
            }
        });
        slotRow.appendChild(slotBtn);
        upgradeGroup.appendChild(slotRow);

        BOOST_SHOP_ITEMS.forEach((boostItem) => {
            const definition = snapshot.boostDefinitions[boostItem.key];
            const boostCost = getCurrentBoostCost(boostItem.key, boostItem.cost);
            const boostRow = document.createElement("div");
            boostRow.className = "shop-row";
            boostRow.innerHTML = `
                <div class="shop-label-wrap">
                    <div class="shop-label">${definition.label}</div>
                    <div class="shop-cost">${boostCost} currency | ${window.DedogeiumSystems.formatDuration(definition.durationMs)} per charge | Owned: ${snapshot.state.boostInventory[boostItem.key] || 0}</div>
                </div>
            `;

            const boostBtn = document.createElement("button");
            boostBtn.className = "shop-buy-btn";
            boostBtn.textContent = "Buy";
            boostBtn.disabled = getCurrency() < boostCost;
            boostBtn.addEventListener("click", function () {
                if (window.customizeShopActions && typeof window.customizeShopActions.handleBuyBoost === "function") {
                    window.customizeShopActions.handleBuyBoost(boostItem.key, boostItem.cost);
                }
            });
            boostRow.appendChild(boostBtn);
            upgradeGroup.appendChild(boostRow);
        });

        shopList.appendChild(upgradeGroup);
    }
}

function displayEquippedItems(equippedItems, getItemImage, getItemBonus) {
    // Clear all slots
    const maxSlots = window.DedogeiumSystems && typeof window.DedogeiumSystems.getMaxEquipSlots === "function"
        ? window.DedogeiumSystems.getMaxEquipSlots()
        : 5;

    for (let i = 0; i < maxSlots; i++) {
        const slot = document.getElementById(`equip-slot-${i}`);
        if (slot) {
            slot.innerHTML = "";
            slot.style.cursor = "pointer";
        }
    }

    // Display equipped items in their slots
    equippedItems.forEach((item, slotIndex) => {
        if (slotIndex < maxSlots) {
            const slot = document.getElementById(`equip-slot-${slotIndex}`);
            const imageSource = getItemImage(item);
            slot.innerHTML = `<img src="${imageSource}" height="50px"><p style="margin: 3px; font-size: 10px;">${item.name || "Doge"} (${item.rarity})</p>`;
            slot.style.cursor = "pointer";
            slot.addEventListener("click", function() {
                unequipItem(slotIndex);
            });
        }
    });

    // Update stats display
    let totalDamage = 0;
    let totalHealth = 0;
    equippedItems.forEach(item => {
        const bonus = getItemBonus(item);
        totalDamage += bonus.damage;
        totalHealth += bonus.health;
    });

    const damageDisplay = document.getElementById("equipped-damage");
    const healthDisplay = document.getElementById("equipped-defense");
    if (damageDisplay) damageDisplay.textContent = totalDamage;
    if (healthDisplay) {
        // add any AFK/player HP stored in localStorage to the equipment health
        const keys = ['playerHP', 'totalHP', 'hpTotal', 'total_hp', 'hp'];
        let playerHP = 0;
        for (let k of keys) {
            const v = localStorage.getItem(k);
            if (v !== null) { playerHP = parseInt(v) || 0; break; }
        }
        healthDisplay.textContent = totalHealth + playerHP;
    }
}

function toggleEquipItem(item, itemIndex) {
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    const isEquipped = equippedItems.some(eq => eq.id === item.id);
    const maxSlots = window.DedogeiumSystems && typeof window.DedogeiumSystems.getMaxEquipSlots === "function"
        ? window.DedogeiumSystems.getMaxEquipSlots()
        : 5;

    if (isEquipped) {
        // Unequip the item
        const filteredEquipped = equippedItems.filter(eq => eq.id !== item.id);
        localStorage.setItem("equippedItems", JSON.stringify(filteredEquipped));
    } else {
        // Equip the item (slot cap can be upgraded)
        if (equippedItems.length < maxSlots) {
            equippedItems.push(item);
            localStorage.setItem("equippedItems", JSON.stringify(equippedItems));
        } else {
            alert(`You can only equip ${maxSlots} items maximum!`);
            return;
        }
    }

    if (typeof window.refreshCustomizeInventoryUI === 'function') {
        window.refreshCustomizeInventoryUI();
        return;
    }
    location.reload();
}

function unequipItem(slotIndex) {
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    equippedItems.splice(slotIndex, 1);
    localStorage.setItem("equippedItems", JSON.stringify(equippedItems));
    if (typeof window.refreshCustomizeInventoryUI === 'function') {
        window.refreshCustomizeInventoryUI();
        return;
    }
    location.reload();
}

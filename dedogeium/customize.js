

// Load inventory from localStorage and display items
window.addEventListener('DOMContentLoaded', function() {
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    const listItemsContainer = document.querySelector(".list-items");
    
    if (!listItemsContainer) return;
    
    // Map rarity to image source
    const rarityImages = {
        "Common": "common doge.png",
        "Rare": "rare doge.png",
        "Epic": "epic doge.png",
        "Legendary": "legendary doge.png",
        "Godly": "godly doge.png"
    };
    
    // Get all item divs (skip the first one which is the h3)
    const itemDivs = listItemsContainer.querySelectorAll(".item");
    
    // Clear existing items and populate with inventory items
    itemDivs.forEach(div => div.remove());
    
    // Create and add inventory items to the list
    inventory.forEach((item) => {
        const imageSource = rarityImages[item.rarity] || "Im just a chill guy no background.png";
        const itemDiv = document.createElement("div");
        itemDiv.className = "item";
        itemDiv.innerHTML = `<img src="${imageSource}" height="50px"><p>${item.rarity}</p>`;
        listItemsContainer.appendChild(itemDiv);
    });
});

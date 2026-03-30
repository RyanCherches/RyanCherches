const promoCodeImg = document.getElementById("promo-code-img");
const popup = document.getElementById("popup");
const closeBtn = document.getElementById("close-btn");
const submitBtn = document.getElementById("submit-btn");
const promoInput = document.getElementById("promo-code");

function openPopup() {
    if (!popup) return;
    popup.classList.add("is-open");
    if (promoInput) promoInput.focus();
}

function closePopup() {
    if (!popup) return;
    popup.classList.remove("is-open");
    if (promoInput) promoInput.value = "";
}

if (promoCodeImg) {
    promoCodeImg.addEventListener("click", openPopup);
}

if (closeBtn) {
    closeBtn.addEventListener("click", closePopup);
}

if (popup) {
    popup.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });
}

if (submitBtn) {
    submitBtn.addEventListener("click", () => {
        const code = promoInput ? promoInput.value.trim() : "";
        if (!code) {
            alert("Please enter a promo code first.");
            return;
        }
        else if (code.toLowerCase() === "april fools") {
            alert("Congratulations! You have redeemed the code: april fools! If you go into your inventory and find the box and check it, you will have fully redeemed the code! No... I swear its not a rick roll.");
            // Here you can add code to actually give the player the item in the game
            let aprilFoolsDone = JSON.parse(localStorage.getItem("aprilFoolsDone")) || false;
            if (!aprilFoolsDone) {
                localStorage.setItem("aprilFoolsDone", "true");
            }
        } else {
            alert("Invalid promo code. Please try again.");
        }
        closePopup();
    });
}

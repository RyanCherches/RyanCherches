let currency = document.querySelector(".amount");
let picture = document.querySelector(".nugget");
let clicker = document.querySelector(".clicker");
let reset = document.querySelector(".reset");
let clicker_price_element = document.querySelector(".clicker_price");
let full_reset = document.querySelector(".full_reset");
let multiplier_div = document.querySelector(".multiplier");
let multiplier_text = document.querySelector(".multiplier_price");
let rebirth = document.querySelector(".rebirth");

// Load saved values from localStorage or use defaults
let score = parseInt(localStorage.getItem("score")) || 0;
let cps = parseInt(localStorage.getItem("cps")) || 0;
let clicker_price = parseInt(localStorage.getItem("clicker_price")) || 15;
let clicker_amount = parseInt(localStorage.getItem("clicker_amount")) || 0;
let clicked = parseFloat(localStorage.getItem("clicked")) || 0;
let multiplier = parseFloat(localStorage.getItem("multiplier")) || 1;
let multiplier_cost = parseInt(localStorage.getItem("multiplier_cost")) || 100;
let multiplier_amount = parseInt(localStorage.getItem("multiplier_amount")) || 0;
let rebirth_amount = parseInt(localStorage.getItem("rebirth_amount")) || 0;
let rebirth_cost = parseInt(localStorage.getItem("rebirth_cost")) || 10000;

// Display initial info
currency.innerHTML = "score = " + score;
clicker_price_element.innerHTML = clicker_price;
multiplier_text.innerHTML = multiplier_cost;
rebirth.innerHTML = "Rebirth = $" + rebirth_cost;

// 🧠 SAVE function
function save() {
    localStorage.setItem("score", score);
    localStorage.setItem("cps", cps);
    localStorage.setItem("clicker_price", clicker_price);
    localStorage.setItem("clicker_amount", clicker_amount);
    localStorage.setItem("clicked", clicked);
    localStorage.setItem("multiplier_cost", multiplier_cost);
    localStorage.setItem("multiplier", multiplier);
    localStorage.setItem("multiplier_amount", multiplier_amount);
    localStorage.setItem("rebirth_amount", rebirth_amount);
    localStorage.setItem("rebirth_cost", rebirth_cost);

    // Update visuals
    currency.innerHTML = "score = " + score;
    clicker_price_element.innerHTML = clicker_price;
    multiplier_text.innerHTML = multiplier_cost;
    rebirth.innerHTML = "Rebirth = $" + rebirth_cost;
}

// 🪙 Clicking the nugget
picture.addEventListener("click", function () {
    clicked += 0.1;
    score += 1 * multiplier;
    currency.innerHTML = "score = " + score;
    localStorage.setItem("score", score);
    localStorage.setItem("clicked", clicked);

    // Animation
    picture.style.transition = "transform 0.3s ease";
    picture.style.transform = "scale(" + clicked + ")";
    setTimeout(() => {
        picture.style.transform = "scale(1)";
    }, 200);
});

// 🔄 Reset button — clears progress but keeps multiplier
reset.addEventListener("click", function () {
    score = 0;
    cps = 0;
    clicker_price = 15;
    clicker_amount = 0;
    clicked = 0.5;
    save();
});

// ⚙️ Clicker upgrade
clicker.addEventListener("click", function () {
    if (score >= clicker_price) {
        score -= clicker_price;
        clicker_amount += 1;
        cps += 1;
        clicker_price = clicker_price * 2;
        save();
    }
});

// 💥 Full reset — wipes everything
full_reset.addEventListener("click", function () {
    score = 0;
    cps = 0;
    clicker_price = 15;
    clicker_amount = 0;
    multiplier = 1;
    multiplier_cost = 100;
    multiplier_amount = 0;
    clicked = 0.5;
    rebirth_amount = 0;
    rebirth_cost = 10000;
    localStorage.clear();
    save();
});

// ✨ Multiplier upgrade
multiplier_div.addEventListener("click", function () {
    if (score >= multiplier_cost) {
        score -= multiplier_cost;
        multiplier *= 2;
        multiplier_amount += 1;
        multiplier_cost *= 10;
        save();
    }
});

// 🔁 Automatic clicks every second
function autoclick() {
    score += cps * multiplier;
    currency.innerHTML = "score = " + score;
    localStorage.setItem("score", score);
}
setInterval(autoclick, 1000);

// 🔁 Rebirth
rebirth.addEventListener("click", function () {
    if (score >= rebirth_cost) {
        score = 0;
        multiplier *= 10;
        rebirth_amount += 1;
        rebirth_cost *= 10000;
        save();
    }
});

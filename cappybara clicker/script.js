let currency = document.querySelector(".amount");
let picture = document.querySelector(".nugget");
let clicker = document.querySelector(".clicker");
let reset = document.querySelector(".reset");
let clicker_price_element = document.querySelector(".clicker_price");
let full_reset = document.querySelector(".full_reset");
let multiplier_div = document.querySelector(".multiplier");
let multiplier = 1;
let multiplier_amount = 0;
let multiplier_cost = 1000;
let multiplier_text = document.querySelector(".multiplier_price");
let rebirth_amount = 0;
let rebirth_cost = 1000000
let rebirth = document.querySelector(".rebirth");
rebirth.innerHTML = "Rebirth = $" + rebirth_cost;

// Load saved values from localStorage or use defaults
let score = parseInt(localStorage.getItem("score")) || 0;
let cps = parseInt(localStorage.getItem("cps")) || 0;
let clicker_price = parseInt(localStorage.getItem("clicker_price")) || 15;
let clicker_amount = parseInt(localStorage.getItem("clicker_amount")) || 0;
let clicked = parseFloat(localStorage.getItem("clicked")) || 0.5;

rebirth.addEventListener("click", function () {
    if (score >= rebirth_cost) {
        score -= rebirth_cost;
        multiplier = multiplier * 10;
        rebirth_amount += 1;
        rebirth_cost = rebirth_cost * 10000;
        rebirth.innerHTML = "rebirth = $" + rebirth_cost;
        
    }
})

// Display current stats
currency.innerHTML = "score = " + score;
clicker_price_element.innerHTML = clicker_price;

// Clicking the nugget adds score
picture.addEventListener("click", function () {
    clicked += 0.1;
    score += 1 * multiplier;
    currency.innerHTML = "score = " + score;

    // Save all relevant data
    localStorage.setItem("score", score);
    localStorage.setItem("clicked", clicked);

    // Animation
    picture.style.transition = "transform 0.3s ease";
    picture.style.transform = "scale(" + clicked + ")";
    setTimeout(() => {
        picture.style.transform = "scale(1)";
    }, 200);
});

// Reset button — resets everything
reset.addEventListener("click", function () {
    clicked = 0.5;

    currency.innerHTML = "score = " + score;
    clicker_price_element.innerHTML = clicker_price;

    // Clear saved data
    localStorage.clear();
});

// Clicker upgrade
clicker.addEventListener("click", function () {
    if (score >= clicker_price) {
        score -= clicker_price;
        clicker_amount += 1;
        cps += 1;
        clicker_price = clicker_price * 2;

        // Update visuals
        currency.innerHTML = "score = " + score;
        clicker_price_element.innerHTML = clicker_price;

        // Save updated values
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
    }
});

// Automatic clicks every second
function autoclick() {
    score += cps * multiplier;
    currency.innerHTML = "score = " + score;
    localStorage.setItem("score", score);
}

let intervalId = setInterval(autoclick, 1000);


full_reset.addEventListener("click", function () {
    score = 0;
    cps = 0;
    clicker_price = 15;
    clicker_amount = 0;
    multiplier_price = 1000;
    multiplier_amount = 0;
    clicked = 0;
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
    multiplier_text.innerHTML = multiplier_cost;
})
multiplier_div.addEventListener("click", function () {
    if (score >= multiplier_cost) {
        multiplier = multiplier * 2;
        localStorage.setItem("multiplier", multiplier);
        score -= multiplier_cost
        multiplier_cost = multiplier_cost * 10;
        multiplier_text.innerHTML = multiplier_cost;
        multiplier_amount += 1;
    }
})
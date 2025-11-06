let currency = document.querySelector(".amount");
let picture = document.querySelector(".nugget");
let clicker = document.querySelector(".clicker");
let reset = document.querySelector(".reset");
let full_reset = document.querySelector(".full_reset");
let clicker_price_element = document.querySelector(".clicker_price");
let multiplier_div = document.querySelector(".multiplier");
let multiplier_text = document.querySelector(".multiplier_price");
let rebirth = document.querySelector(".rebirth");
let clicker_amount_button = document.querySelector(".clicker_amount");
let multiplier_amount_button = document.querySelector(".multiplier_amount");
let multiplier_clicker = document.querySelector(".clicker_multiplier");
let multiplier_clicker_amount_element = document.querySelector(".clicker_multiplier_amount");
let multiplier_clicker_price_element = document.querySelector(".clicker_multiplier_price");

// 🧩 Load saved values
let score = parseInt(localStorage.getItem("score")) || 0;
let cps = parseInt(localStorage.getItem("cps")) || 0;
let clicker_price = parseInt(localStorage.getItem("clicker_price")) || 15;
let clicker_amount = parseInt(localStorage.getItem("clicker_amount")) || 0;
let clicked = parseFloat(localStorage.getItem("clicked")) || 1;
let multiplier = parseFloat(localStorage.getItem("multiplier")) || 1;
let multiplier_cost = parseInt(localStorage.getItem("multiplier_cost")) || 100;
let multiplier_amount = parseInt(localStorage.getItem("multiplier_amount")) || 0;
let rebirth_amount = parseInt(localStorage.getItem("rebirth_amount")) || 0;
let rebirth_cost = parseInt(localStorage.getItem("rebirth_cost")) || 10000;
let multiplier_clicker_price = parseInt(localStorage.getItem("multiplier_clicker_price")) || 100;
let multiplier_clicker_amount = parseInt(localStorage.getItem("multiplier_clicker_amount")) || 0;
let spc = parseInt(localStorage.getItem("spc")) || 1;

// 🔢 Number formatter with words
function formatNumber(num) {
    if (num >= 1e15) return (num / 1e21).toFixed(2) + " Decillion";
    if (num >= 1e15) return (num / 1e21).toFixed(2) + " Nonillion";
    if (num >= 1e15) return (num / 1e21).toFixed(2) + " Octillion";
    if (num >= 1e15) return (num / 1e21).toFixed(2) + " Septilion";
    if (num >= 1e15) return (num / 1e21).toFixed(2) + " Sextillion";
    if (num >= 1e15) return (num / 1e18).toFixed(2) + " Quintillion";
    if (num >= 1e15) return (num / 1e15).toFixed(2) + " Quadrillion";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " Trillion";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " Billion";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " Million";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " Thousand";
    return Math.floor(num);
}

// 🧠 Update UI
function updateUI() {
  currency.innerHTML = "Score = " + formatNumber(score);
  clicker_price_element.innerHTML = formatNumber(clicker_price);
  multiplier_text.innerHTML = formatNumber(multiplier_cost);
  rebirth.innerHTML = "Rebirth = $" + formatNumber(rebirth_cost);
  clicker_amount_button.innerHTML = "amount = " + clicker_amount;
  multiplier_amount_button.innerHTML = "amount = " + multiplier_amount;
  multiplier_clicker_amount_element.innerHTML = "amount = " + multiplier_clicker_amount;
  multiplier_clicker_price_element.innerHTML = formatNumber(multiplier_clicker_price);
}

// 💾 Save all data
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
  localStorage.setItem("multiplier_clicker_price", multiplier_clicker_price);
  localStorage.setItem("multiplier_clicker_amount", multiplier_clicker_amount);
  localStorage.setItem("spc", spc);
  updateUI();
}

// 🪙 Clicking the nugget
picture.addEventListener("click", function () {
    clicked += 0.1;
    score += 1 * spc * multiplier;
    currency.innerHTML = "score = " + score;
    localStorage.setItem("score", score);
    localStorage.setItem("clicked", clicked);

    // Animation
    picture.style.transition = "transform 0.3s ease";
    picture.style.transform = "scale(" + clicked + ")";
    setTimeout(() => {
        picture.style.transform = "scale(1)";
    }, 200);

  save();
});

// ⚙️ Clicker upgrade
clicker.addEventListener("click", function () {
  if (score >= clicker_price) {
    score -= clicker_price;
    clicker_amount++;
    cps++;
    clicker_price *= 2;
    save();
  }
});

// ✨ Multiplier upgrade
multiplier_div.addEventListener("click", function () {
  if (score >= multiplier_cost) {
    score -= multiplier_cost;
    multiplier *= 2;
    multiplier_amount++;
    multiplier_cost *= 10;
    save();
  }
});

// ⚡ Multiplier Clicker upgrade
multiplier_clicker.addEventListener("click", function () {
  if (score >= multiplier_clicker_price) {
    score -= multiplier_clicker_price;
    multiplier_clicker_amount++;
    spc *= 2;
    multiplier_clicker_price *= 4;
    save();
  }
});

// 🔁 Automatic clicks
setInterval(() => {
  score += cps * multiplier;
  save();
}, 1000);

// 🔁 Rebirth
rebirth.addEventListener("click", function () {
  if (score >= rebirth_cost) {
    score = 0;
    multiplier *= 10;
    rebirth_amount++;
    rebirth_cost *= 10000;
    save();
  }
});

// 🔄 Reset picture size only
reset.addEventListener("click", function () {
  pictureScale = 1;
  picture.style.transition = "transform 0.3s ease";
  picture.style.transform = "scale(1)";
  save();
});

// 💥 Full reset everything
full_reset.addEventListener("click", function () {
  localStorage.clear();
  score = 0;
  cps = 0;
  clicker_price = 15;
  clicker_amount = 0;
  multiplier = 1;
  multiplier_cost = 100;
  multiplier_amount = 0;
  clicked = 1;
  rebirth_amount = 0;
  rebirth_cost = 10000;
  multiplier_clicker_price = 100;
  multiplier_clicker_amount = 0;
  spc = 1;
  pictureScale = 1;
  picture.style.transform = "scale(1)";
  save();
});

// 🚀 Initialize
updateUI();

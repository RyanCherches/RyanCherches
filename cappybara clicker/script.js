// script.js

/* ====== DOM nodes (safely queried) ====== */
const currency = document.querySelector(".amount");
const picture = document.querySelector(".nugget");
const clicker = document.querySelector(".clicker");
const reset = document.querySelector(".reset");
const full_reset = document.querySelector(".full_reset");
const clicker_price_element = document.querySelector(".clicker_price");
const multiplier_div = document.querySelector(".multiplier");
const multiplier_text = document.querySelector(".multiplier_price");
const rebirth = document.querySelector(".rebirth");
const clicker_amount_button = document.querySelector(".clicker_amount");
const multiplier_amount_button = document.querySelector(".multiplier_amount");
const multiplier_clicker = document.querySelector(".clicker_multiplier");
const multiplier_clicker_amount_element = document.querySelector(".clicker_multiplier_amount");
const multiplier_clicker_price_element = document.querySelector(".clicker_multiplier_price");
const doubler_clicker_speed = document.querySelector(".double_clicker_speed");
const double_clicker_power = document.querySelector(".double_clicker_power");
const double_multiplier = document.querySelector(".double_multiplier");

/* ====== Load saved values (with fallbacks) ====== */
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
let clicker_speed = parseInt(localStorage.getItem("clicker_speed")) || 1000;
let clicker_multiplier = parseInt(localStorage.getItem("clicker_multiplier")) || 1;
let multiplier_multiplier = parseInt(localStorage.getItem("multiplier_multiplier")) || 2;

/* ====== FIXED: Load real booleans correctly ====== */
let is_clicked_speed = localStorage.getItem("is_clicked_speed") === "true";
let is_clicked_clickpower = localStorage.getItem("is_clicked_clickpower") === "true";
let is_clicked_multiplierpower = localStorage.getItem("is_clicked_multiplierpower") === "true";

/* ====== Show/hide upgrade at page load (corrected) ====== */
document.addEventListener("DOMContentLoaded", function () {
  if (is_clicked_multiplierpower == true) {
    double_multiplier.style.display = "none";
  } else {
    double_multiplier.style.display = "";
  }

  if (is_clicked_clickpower == true) {
    double_clicker_power.style.display = "none";
  } else {
    double_clicker_power.style.display = "";
  }

  if (is_clicked_speed == true) {
    doubler_clicker_speed.style.display = "none";
  } else {
    doubler_clicker_speed.style.display = "";
  }
});

/* ====== Number formatter ====== */
function formatNumber(num) {
    if (num >= 1e63) return (num / 1e63).toFixed(2) + " Vigintillion";
    if (num >= 1e60) return (num / 1e60).toFixed(2) + " Novemdecillion";
    if (num >= 1e57) return (num / 1e57).toFixed(2) + " Octodecillion";
    if (num >= 1e54) return (num / 1e54).toFixed(2) + " Septendecillion";
    if (num >= 1e51) return (num / 1e51).toFixed(2) + " Sexdecillion";
    if (num >= 1e48) return (num / 1e48).toFixed(2) + " Quindecillion";
    if (num >= 1e45) return (num / 1e45).toFixed(2) + " Quattuordecillion";
    if (num >= 1e42) return (num / 1e42).toFixed(2) + " Tredecillion";
    if (num >= 1e39) return (num / 1e39).toFixed(2) + " Duodecillion";
    if (num >= 1e36) return (num / 1e36).toFixed(2) + " Undecillion";
    if (num >= 1e33) return (num / 1e33).toFixed(2) + " Decillion";
    if (num >= 1e30) return (num / 1e30).toFixed(2) + " Nonillion";
    if (num >= 1e27) return (num / 1e27).toFixed(2) + " Octillion";
    if (num >= 1e24) return (num / 1e24).toFixed(2) + " Septilion";
    if (num >= 1e21) return (num / 1e21).toFixed(2) + " Sextillion";
    if (num >= 1e18) return (num / 1e18).toFixed(2) + " Quintillion";
    if (num >= 1e15) return (num / 1e15).toFixed(2) + " Quadrillion";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " Trillion";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " Billion";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " Million";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " Thousand";
    return Math.floor(num);
}

/* ====== UI updates and save ====== */
function updateUI() {
  if (currency) currency.innerHTML = "Score = " + formatNumber(score);
  if (clicker_price_element) clicker_price_element.innerHTML = formatNumber(clicker_price);
  if (multiplier_text) multiplier_text.innerHTML = formatNumber(multiplier_cost);
  if (rebirth) rebirth.innerHTML = "Rebirth = $" + formatNumber(rebirth_cost);
  if (clicker_amount_button) clicker_amount_button.innerHTML = "amount = " + clicker_amount;
  if (multiplier_amount_button) multiplier_amount_button.innerHTML = "amount = " + multiplier_amount;
  if (multiplier_clicker_amount_element) multiplier_clicker_amount_element.innerHTML = "amount = " + multiplier_clicker_amount;
  if (multiplier_clicker_price_element) multiplier_clicker_price_element.innerHTML = formatNumber(multiplier_clicker_price);
}

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
  localStorage.setItem("clicker_speed", clicker_speed);

  /* ====== FIXED: save booleans correctly ====== */
  localStorage.setItem("is_clicked_speed", is_clicked_speed);
  localStorage.setItem("is_clicked_clickpower", is_clicked_clickpower);
  localStorage.setItem("is_clicked_multiplierpower", is_clicked_multiplierpower);

  updateUI();
}

/* ====== Click interaction ====== */
if (picture) {
  picture.addEventListener("click", function () {
    clicked += 0.1;
    score += 1 * spc * multiplier;

    if (currency) currency.innerHTML = "Score = " + formatNumber(score);
    localStorage.setItem("score", score);
    localStorage.setItem("clicked", clicked);

    picture.style.transition = "transform 0.18s ease";
    picture.style.transform = "scale(" + clicked + ")";

    setTimeout(() => {
      if (picture.matches(":hover")) {
        picture.style.removeProperty("transform");
      } else {
        picture.style.transform = "scale(1)";
      }
      picture.style.transition = "transform 0.4s ease";
    }, 180);

    save();
  });

  picture.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!picture.matches(":hover")) {
        picture.style.removeProperty("transform");
      }
    }, 100);
  });

  picture.addEventListener("mouseenter", () => {
    setTimeout(() => {
      if (picture.matches(":hover")) {
        picture.style.removeProperty("transform");
      }
    }, 50);
  });
}

/* ============================================
   FIX: Auto-clicker interval updates live
   ============================================ */
let clickerInterval = null;

function startClickerInterval() {
  if (clickerInterval) clearInterval(clickerInterval);

  clickerInterval = setInterval(() => {
    score += cps * multiplier * clicker_multiplier;
    save();
  }, clicker_speed);
}

startClickerInterval();

/* ====== Store / upgrades / rebirth logic ====== */
if (clicker) {
  clicker.addEventListener("click", function () {
    if (score >= clicker_price) {
      score -= clicker_price;
      clicker_amount++;
      cps++;
      clicker_price *= 2;
      save();
    }
  });
}

if (multiplier_div) {
  multiplier_div.addEventListener("click", function () {
    if (score >= multiplier_cost) {
      score -= multiplier_cost;
      multiplier *= multiplier_multiplier;
      multiplier_amount++;
      multiplier_cost *= 10;
      save();
    }
  });
}

if (multiplier_clicker) {
  multiplier_clicker.addEventListener("click", function () {
    if (score >= multiplier_clicker_price) {
      score -= multiplier_clicker_price;
      multiplier_clicker_amount++;
      spc *= multiplier_multiplier;
      multiplier_clicker_price *= 5;
      save();
    }
  });
}

/* ====== Doubler Clicker Speed ====== */
double_multiplier.addEventListener("click", function () {
  if (score >= 100000) {
    multiplier_multiplier += 2;
    score -= 100000;
    double_multiplier.style.display = "none";
    is_clicked_multiplierpower = true; // FIX
    save();
  }
});

double_clicker_power.addEventListener("click", function () {
  if (score >= 10000) {
    clicker_multiplier += 2;
    score -= 10000;
    double_clicker_power.style.display = "none";
    is_clicked_clickpower = true; // FIX
    save();
  }
});

doubler_clicker_speed.addEventListener("click", function () {
  if (score >= 1000) {
    clicker_speed = 500;
    startClickerInterval();

    doubler_clicker_speed.style.display = "none";
    is_clicked_speed = true;
    save();
  }
});

/* ====== Rebirth ====== */
if (rebirth) {
  rebirth.addEventListener("click", function () {
    if (score >= rebirth_cost) {
      clicker_speed = 1000;
      startClickerInterval();

      score = 0;
      multiplier *= 5;
      rebirth_amount++;
      rebirth_cost *= 10000;

      clicker_price = 15;
      multiplier_clicker_price = 100;
      multiplier_clicker_amount = 0;
      spc = 1;
      multiplier_cost = 100;
      multiplier_amount = 0;
      clicked = 1;
      cps = 0;
      clicker_amount = 0;

      is_clicked_speed = false;
      is_clicked_clickpower = false;
      is_clicked_multiplierpower = false;

      doubler_clicker_speed.style.display = "";
      double_clicker_power.style.display = "";
      double_multiplier.style.display = "";

      clicker_multiplier = 1;

      save();
    }
  });
}

/* ====== Reset picture size ====== */
if (reset) {
  reset.addEventListener("click", function () {
    clicked = 1;
    if (picture) {
      picture.style.transition = "transform 0.12s ease";
      picture.style.removeProperty("transform");
    }
    save();
  });
}

/* ====== Full reset ====== */
if (full_reset) {
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

    is_clicked_speed = false;
    is_clicked_clickpower = false;
    is_clicked_multiplierpower = false;

    doubler_clicker_speed.style.display = "";
    double_clicker_power.style.display = "";
    double_multiplier.style.display = "";

    clicker_speed = 1000;
    startClickerInterval();

    if (picture) {
      picture.style.transition = "transform 0.12s ease";
      picture.style.removeProperty("transform");
    }
    save();
  });
}

/* Initial UI render */
updateUI();

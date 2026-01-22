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
const background_music = document.querySelector(".sound");
const prestige_points_element = document.querySelector(".prestige-points");
const prestige_points_popup = document.querySelector(".prestige-points-popup");
const rebirthBtn = document.querySelector(".rebirth");
const rebirthPopup = document.querySelector(".rebirth-popup");
const closeRebirth = document.querySelector(".close-rebirth");
const rebirthpopup = document.querySelector(".rebirth-popup");
const cheaper_amount_element = document.querySelector(".cheaper_amount");
const cheaper_element = document.querySelector(".cheaper");
const cheaper_price_element = document.querySelector(".cost");


const music = new Audio("capybara-wictor.mp3");



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
let cheaper_bought = (localStorage.getItem("prestige_bought")) || 0;
let cheaper_price = 10 + (cheaper_bought * 10);
let cheaper_amount = (localStorage.getItem("cheaper_amount") !== null)
  ? parseFloat(localStorage.getItem("cheaper_amount"))
  : 0;

let prestige_points = (localStorage.getItem("prestige_points") !== null)
  ? parseInt(localStorage.getItem("prestige_points"), 10)
  : Math.floor(score / 10000);

/* ====== Prestige points live update ====== */
function update_prestige_points() {
  // read stored prestige (previous rebirths)
  const stored = (localStorage.getItem("prestige_points") !== null)
    ? parseInt(localStorage.getItem("prestige_points"), 10)
    : 0;

  // compute how many you'd gain right now from current score
  const potential = Math.floor(score / 10000);

  // keep the game's prestige_points variable synced to the stored total
  prestige_points = stored;

  // defensive DOM updates
  if (prestige_points_element) {
    // show total if you rebirthed now (stored + potential)
    prestige_points_element.innerHTML = "prestige-points=" + (stored + potential);
  }

  if (prestige_points_popup) {
    // show both current stored points and how many you'd gain on rebirth
    prestige_points_popup.innerHTML =
      "You have " + stored + " prestige points.";
  }
}

// initial render
update_prestige_points();

// update live (250ms is a responsive default)
const prestigeInterval = setInterval(update_prestige_points, 250);

update_prestige_points();
/* ====== FIXED: Load real booleans correctly ====== */
let is_clicked_speed = localStorage.getItem("is_clicked_speed") === "true";
let is_clicked_clickpower = localStorage.getItem("is_clicked_clickpower") === "true";
let is_clicked_multiplierpower = localStorage.getItem("is_clicked_multiplierpower") === "true";
let is_clicked_music = localStorage.getItem("is_clicked_music") === "true";

/* ====== Background music ====== */
background_music.addEventListener("click", function () {
  if (is_clicked_music == false) {
    background_music.innerHTML = "pause background music";
    music.volume = 0.5;
    music.loop = true;
    music.play();
    is_clicked_music = true;
    localStorage.setItem("is_clicked_music", is_clicked_music);
  }
  else{
    background_music.innerHTML = "play background music";
    music.pause();
    music.currentTime = 0;
    is_clicked_music = false;
    localStorage.setItem("is_clicked_music", is_clicked_music);
  }
  
});

cheaper_element.addEventListener("click", function () {
  if (prestige_points >= cheaper_price) {
    // increase discount by 1% and store with two decimals
    cheaper_amount = parseFloat((cheaper_amount + 0.01).toFixed(2));
    prestige_points -= cheaper_price;
    cheaper_bought += 1;
    prestige_points_element.innerHTML = "prestige-points=" + cheaper_price;
    cheaper_price += cheaper_bought * 5;
    cheaper_price_element.innerHTML = "Cost: " + cheaper_price + " Prestige Points";
    cheaper_amount_element.innerHTML = "discount = " + cheaper_amount;
    prestige_points_popup.innerHTML = "You have " + prestige_points + " prestige points.";
    localStorage.setItem("cheaper_amount", cheaper_amount);
    localStorage.setItem("prestige_bought", cheaper_bought);
    localStorage.setItem("prestige_points", prestige_points);
    localStorage.setItem("cheaper_price", cheaper_price);
    update_prestige_points();
    save();
  }
});
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
rebirthBtn.addEventListener("click", () => {
    rebirthPopup.classList.remove("hidden");
});

closeRebirth.addEventListener("click", () => {
    rebirthPopup.classList.add("hidden");
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
    return Math.floor(num).toString();
}

/* ====== Discount helper ====== */
function discounted(price) {
  const pct = Math.max(0, Math.min(cheaper_amount || 0, 0.99));
  // Use Math.ceil so players always pay at least 1 and prices remain integers
  const d = Math.ceil(price * (1 - pct));
  return Math.max(1, d);
}

/* ====== UI updates and save ====== */
function updateUI() {
  if (currency) currency.innerHTML = "Score = " + formatNumber(score);
  if (clicker_price_element) clicker_price_element.innerHTML = formatNumber(discounted(clicker_price));
  if (multiplier_text) multiplier_text.innerHTML = formatNumber(discounted(multiplier_cost));
  if (clicker_amount_button) clicker_amount_button.innerHTML = "amount = " + clicker_amount;
  if (multiplier_amount_button) multiplier_amount_button.innerHTML = "amount = " + multiplier_amount;
  if (multiplier_clicker_amount_element) multiplier_clicker_amount_element.innerHTML = "amount = " + multiplier_clicker_amount;
  if (multiplier_clicker_price_element) multiplier_clicker_price_element.innerHTML = formatNumber(discounted(multiplier_clicker_price));
  cheaper_amount_element.innerHTML = "discount = " + cheaper_amount;
  prestige_points_element.innerHTML = "prestige-points=" + prestige_points;

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
  localStorage.setItem("prestige_points", prestige_points);
  localStorage.setItem("cheaper_amount", cheaper_amount);
  prestige_points_popup.innerHTML = "You have " + prestige_points + " prestige points.";
  prestige_points_element.innerHTML = "prestige-points=" + prestige_points;
  cheaper_price_element.innerHTML = "Cost: " + cheaper_price + " Prestige Points";
  cheaper_amount_element.innerHTML = "discount = " + cheaper_amount;
  prestige_points_popup.innerHTML = "You have " + prestige_points + " prestige points.";
  localStorage.setItem("cheaper_amount", cheaper_amount);
  localStorage.setItem("prestige_bought", cheaper_bought);
  localStorage.setItem("prestige_points", prestige_points);
  localStorage.setItem("cheaper_price", cheaper_price);
  if (score < 1000) {
    picture.src = "cappy swim.png";
    picture.style.width = "250px";
    picture.style.height = "200px";
  }
  if (score >= 1000) {
    picture.src = "cappy.svg";
  }
  if (score >= 10000) {
    picture.src = "real_cappy.png";
    picture.style.height = "300px";
  }
  update_prestige_points();

  updateUI();
  update_prestige_points();
}
save();

/* ====== Click interaction ====== */
if (picture) {
  picture.addEventListener("click", function () {
    const clicksound = new Audio("Voicy_Real Capybara Barks.mp3");
    clicksound.volume = 0.7;
    clicksound.play();
    setTimeout(() => {
      clicksound.pause();
      clicksound.currentTime = 0;
    }, 1000);
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
    prestige_points_element.innerHTML = "prestige-points=" + prestige_points;
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
    const price = discounted(clicker_price);
    if (score >= price) {
      score -= price;
      clicker_amount++;
      cps++;
      clicker_price *= 2;
      save();
    }
  });
}

if (multiplier_div) {
  multiplier_div.addEventListener("click", function () {
    const price = discounted(multiplier_cost);
    if (score >= price) {
      score -= price;
      multiplier *= multiplier_multiplier;
      multiplier_amount++;
      multiplier_cost *= 10;
      save();
    }
  });
}

if (multiplier_clicker) {
  multiplier_clicker.addEventListener("click", function () {
    const price = discounted(multiplier_clicker_price);
    if (score >= price) {
      score -= price;
      multiplier_clicker_amount++;
      spc *= multiplier_multiplier;
      multiplier_clicker_price *= 5;
      save();
    }
  });
}

/* ====== Doubler Clicker Speed ====== */
double_multiplier.addEventListener("click", function () {
  const baseCost = 100000;
  const price = discounted(baseCost);
  if (score >= price) {
    multiplier_multiplier += 2;
    score -= price;
    double_multiplier.style.display = "none";
    is_clicked_multiplierpower = true;
    save();
  }
});

double_clicker_power.addEventListener("click", function () {
  const baseCost = 10000;
  const price = discounted(baseCost);
  if (score >= price) {
    clicker_multiplier += 2;
    score -= price;
    double_clicker_power.style.display = "none";
    is_clicked_clickpower = true;
    save();
  }
});

doubler_clicker_speed.addEventListener("click", function () {
  const baseCost = 1000;
  const price = discounted(baseCost);
  if (score >= price) {
    score -= price;
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

      // Calculate prestige gained from current score
      let gained = Math.floor(score / 10000);
      prestige_points += gained;

      // Save old prestige if needed
      localStorage.setItem("old_prestige_points", prestige_points);

      // Reset all stats
      score = 0;
      clicker_price = 15;
      multiplier_clicker_price = 100;
      multiplier_clicker_amount = 0;
      multiplier_cost = 100;
      multiplier_amount = 0;
      spc = 1;
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
      clicker_speed = 1000;
      startClickerInterval();

      // Update UI
      prestige_points_element.innerHTML = "prestige-points=" + prestige_points;

      save();
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
    cheaper_amount = 0;
    cheaper_bought = 0;
    cheaper_price = 10;
    prestige_points = 0;
    cheaper_price_element.innerHTML = "Cost: " + cheaper_price + " Prestige Points";
    cheaper_amount_element.innerHTML = "discount = " + cheaper_amount;
    prestige_points_popup.innerHTML = "You have " + prestige_points + " prestige points.";
    

    localStorage.setItem("cheaper_amount", cheaper_amount);
    localStorage.setItem("prestige_bought", cheaper_bought);
    localStorage.setItem("prestige_points", prestige_points);
    localStorage.setItem("cheaper_price", cheaper_price);

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

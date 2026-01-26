const yes_no = document.getElementById("yes-no"); 
const yes_btn = document.getElementById("ok-btn");
const cancel_btn = document.getElementById("cancel-btn");
const enemy_hlth_element = document.getElementById("enemy-hlth");
const hlth_element = document.getElementById("hlth");
const victory = document.getElementById("victory");
const home = document.getElementById("bye-btn");
home.addEventListener("click", function() {
    window.location.href = "adventure.html";
});

const enemy_max_health = 100;
let enemy_health = 100;
const max_health = 500;
let health = 500;
let damage = 10;
let enemy_damage = 20;

cancel_btn.addEventListener("click", function() {
    window.location.href = "adventure.html";
    
});
yes_btn.addEventListener("click", function (){
    yes_no.style.display = "none";
    enemy_hlth_element.style.display = "block";
    hlth_element.style.display = "block";
    loadhealth()
    battleLoop()
});

async function battleLoop() {
    while (enemy_health > 0 && health > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attack()
        loadhealth()
        if (enemy_health <= 0) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        enemy_attack()
        loadhealth()
        damage *= 2;
        enemy_damage *= 2;
    }
    victory.style.display = "block";
}
function loadhealth() {
    if (enemy_health <= 0) {
        enemy_health = 0;
    }
    if (health <= 0) {
        health = 0;
    }
    enemy_hlth_element.innerHTML = enemy_health +"/" + enemy_max_health;
    hlth_element.innerHTML = health +"/" + max_health;
    
}
function attack() {
    enemy_health -= damage;
}
function enemy_attack() {
    health -= enemy_damage;
}
document.addEventListener("DOMContentLoaded", function () {
    const CharacterMain = document.getElementById("main-character");
    const Spotlight1 = document.getElementById("spotlight");
    welcome(CharacterMain, Spotlight1);
});
function welcome(CharacterMain, Spotlight1) {
    setTimeout(function () {
        alert("Welcome to DeDogeium! Click OK to begin you tutorial!");
        const continueTutorial = prompt("would you like to continue with the tutorial? (yes or no)");
        const answer = (continueTutorial || "").trim().toLowerCase();
        if (answer === "yes") {
            alert("Press ok to move on, and if you want to skip the tutorial, then go back to adventure.html and click the first level to begin.");
            mainPlayers(CharacterMain, Spotlight1);
        } else {
            window.location.href = "adventure.html";
        }
    }, 50);
}
function mainPlayers(CharacterMain, Spotlight1) {
    CharacterMain.style.display = "block";
    Spotlight1.style.display = "block";
    setTimeout(function () {
        alert("This is your character. As you move on, you will get more items to upgrade your doge.")
    }, 50);
}

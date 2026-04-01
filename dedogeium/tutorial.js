const routeBase = window.location.pathname.endsWith('.html') ? '' : '../';

document.addEventListener("DOMContentLoaded", function () {
    const CharacterMain = document.getElementById("main-character");
    const CharacterEnemy = document.getElementById("enemy-character");
    const Spotlight1 = document.getElementById("spotlight");
    const Spotlight2 = document.getElementById("spotlight2");
    welcome(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2);
});
function welcome(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2) {
    setTimeout(function () {
        alert("Welcome to DeDogeium! Click OK to begin you tutorial!");
        const continueTutorial = prompt("would you like to continue with the tutorial? (yes or no)");
        const answer = (continueTutorial || "").trim().toLowerCase();
        if (answer === "yes") {
            mainPlayers(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2);
        } else {
            window.location.href = routeBase + "adventure/";
        }
    }, 50);
}
function mainPlayers(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2) {
    CharacterMain.style.display = "block";
    Spotlight1.style.display = "block";
    setTimeout(function () {
        alert("This is your character. As you move on, you will get more items to upgrade your doge.")
        enemyPlayers(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2);
    }, 50);
}
function enemyPlayers(CharacterMain, Spotlight1, CharacterEnemy, Spotlight2) {
    CharacterMain.style.display = "block";
    Spotlight1.style.display = "block";
    setTimeout(function () {
        Spotlight1.style.display = "none";
        Spotlight2.style.display = "block";
        CharacterMain.style.display = "none";
        CharacterEnemy.style.display = "block";
        setTimeout(function () {
            alert("This is your enemy. As you progress, you will fight stronger and stronger doges, so make sure to upgrade your doge to keep up with the competition! Also not all of your eneimes will be like this basic doge.")
        }, 25);
        endTutorial();
    }, 50);
}
function endTutorial() {
    setTimeout(function () {
        alert("This is the end of the tutorial! Click OK to start your adventure!");
        window.location.href = routeBase + "adventure/";
    }, 50);
}

// function showNextLine() {
//     dialogueIndex++;
//     if (dialogueIndex < dialogueLines.length) {
//         showLine(dialogueIndex);
//     } else {
//         endCutsceneAndStartBattle();
//     }
// }

// function showNextPostLine() {
//     postDialogueIndex++;
//     if (postDialogueIndex < postDialogueLines.length) {
//         showPostLine(postDialogueIndex);
//     } else {
//         endPostDialogue();
//     }
// }

// function startPostDialogue() {
//     inPostDialogue = true;
//     postDialogueIndex = 0;
//     showPostLine(0);
//     if (skipBtn) skipBtn.style.display = 'inline-block';
// }

// function startVictoryDialogue() {
//     inPostDialogue = true;
//     postDialogueIndex = 0;
//     showVictoryLine(0);
//     if (skipBtn) skipBtn.style.display = 'inline-block';
// }

// function startDefeatDialogue() {
//     inPostDialogue = true;
//     postDialogueIndex = 0;
//     showDefeatLine(0);
//     if (skipBtn) skipBtn.style.display = 'inline-block';
// }

// function endPostDialogue() {
//     inPostDialogue = false;
//     if (skipBtn) skipBtn.style.display = 'none';
//     // show victory UI after post-dialogue finishes
//     if (victory) victory.style.display = "block";
// }

// function endDefeatDialogue() {
//     inPostDialogue = false;
//     if (skipBtn) skipBtn.style.display = 'none';
//     // show defeat UI after post-dialogue finishes
//     if (defeat) defeat.style.display = "block";
// }


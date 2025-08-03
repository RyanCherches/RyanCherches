const only = document.getElementById('no'); // Replace 'yourElementId' with the actual ID of your element
if (only) { // Add a check to ensure the element was found
    only.innerHTML = "<h1>Only my advisor may pass(or you can just click, but please only look if you are my advisor)!</h1>";
} else {
    console.error("Element with ID 'no' not found.");
}
only.innerHTML = "<h1>Only my advisor may pass(or you can just click, but please only look if you are my advisor)!</h1>";
document.addEventListener('click', function() {
        only.innerHTML = "<p style='text-indent:40px;'>Before you start, I just wanted to say, you don't have to read all of this, it's a lot.</p><p style='text-indent:40px;'> Now you might have already saw my letter(if not please go back). This is technically part of my website. But because I don't want other people looking at this, you cant view this from my website.</p> <p style='text-indent:40px;'> If you want to visit it then click the link above. </p> <p style='text-indent:40px;'>I made this website like a year ago, and have been updating it ever since. It all started back when I was learning HTML. This was our project. All that was, was about worldle(Find out more by visiting my website;). It had 2 versions. The first one was right when we started, like the 5th lesson or something. Then I completely scrapped it and with the help of my teacher, I got it done. It wasn't that much different then what it is right now. I will have this link kept here for probably a long time(don't know yet). I hope you like my website.</p>";
});
/*document.addEventListener("DOMContentLoaded", function () {
    let letter = document.querySelector(".letter");
    let isAdmin = localStorage.getItem("isAdmin");

    if (isAdmin === "true" && letter) {
        letter.innerHTML = `
            <h1>Welcome, Advisor</h1>
            <p>This is the advisory letter meant only for you.</p>
        `;
    } else if (letter) {
        letter.innerHTML = `
            <h1>Access Denied</h1>
            <p>You must log in as "admin" to view this content.</p>
            <a href="login.html" class="link">Go back to login</a>
        `;
    }
});*/
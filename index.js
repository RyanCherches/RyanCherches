/*document.addEventListener("DOMContentLoaded", function () {
    const restricted = document.querySelector("#username");
    console.log("restricted input element:", restricted);
    const value = restricted.value;

    let button = document.querySelector(".login");

    if (button) {
        button.addEventListener('click', function () {
            let letter = document.querySelector(".letter");
            let whole = document.querySelector("html");
            whole.innerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Front Page</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" href="images/about.jpg" type="image/x-icon">
    <style>
        #vroom {
            transition: all 1s ease-in-out;
        }
        #vroom:hover {
            animation: goo 25s ease-in-out; 
        }
        @keyframes goo {
            25% {transform: translate(1000000px)};
        }
        /*.container_image1 {
            transition: all 1s ease-in-out;
        }
        .container_image1 {
            animation: massive 5s ease-in-out;
        }
        @keyframes massive {
            25% {transform: scale(100)};
        }*/

    /*</style>
</head>

<body>
    <header id="home-header">
        <h1 class="about-me" id="home">Home Page</h1>
    </header>
    <main>
        <br><br><br><br>
        <div class="similar" id="similar_websites">
            <div class="similar_container">
                <article>
                    <img src="images/world-svgrepo-com.svg" alt="worldle" id="container_image1">
                    <p>click to learn about worldle:</p>
                    <a href="worldle.html" class="link">worldle</a>
                </article>
                <article>
                    <img src="images/Ryan and Alan.jpg" alt="about me" id="container_image2">
                    <p>click to learn about me:) :</p>
                    <a href="me.html" class="link">About Me</a>
                </article>
            
                <article>
                    <img src="images/space.jpg" alt="image of space" class="container_image3" id="vroom">
                    <p>Click to learn about space:</p>
                    <a href="space.html"class="link">space</a>
                </article>
            </div>
            <br>
            <div class="similar_container">
                <article class="letter">
                    <!--<img src="images/letter.jpg" alt="image of letter" class="container_image4"><p>click ONLY if you are my advisor. ONLY!!!!!</p><a href="advisory letter.html" class="link">Advisory Letter for my advisor ONLY!</a>-->
                </article>
            </div>
        </div>
            <br><br><br>
    </main>
        <footer class="main__footer">
            <div class="footer1">
                <h2 id="footer-text">Front Page</h2>
            </div>
            <div class="footer2">
                <p>This website was made with the help of Kodland. Kodland is a company that helps young learners(like me) learn coding languages very easily. 
                </p>
                <div class="footer_links">
                    <a href="https://www.kodland.org/" target="_blank">The link to Kodland</a>
                    <a href="mailto:rfcherches13@gmail.com">rfcherches13@gmail.com</a>
                    </div>
                </div>
            </footer>
    <script src="script.js"></script>
</body>
</html>`
    });
        }
/*let letter = document.querySelector(".letter")
if (value === "admin") {
    window.location.href = 'https://google.com';
    // Save to localStorage
    localStorage.setItem("isAdmin", "true");

    // Optional: update UI
    letter.innerHTML = `
        <img src="images/letter.jpg" alt="image of letter" class="container_image4">
        <p>click ONLY if you are my advisor. ONLY!!!!!</p>
        <a href="advisory letter.html" class="link">Advisory Letter for my advisor ONLY!</a>
    `;

    // Redirect after short delay (optional)
    setTimeout(() => {
        window.location.href = "advisory letter.html";
    }, 1000); // 1 second delay
} else {
    localStorage.removeItem("isAdmin"); // Clear just in case
    console.log(letter); // This should output 'null' in the console
    letter.innerHTML = '';
}
});*/
/*const login = document.getElementsByClassName("login")[0];
login.addEventListener("click", function () {
    const username = document.getElementById("username").value;

    // Hide all content areas first
    document.getElementByID("admin").style.display = "none";

    // Show content based on username
    if (username === "admin") {
        document.getElementById("admin").style.display = "block";
    }
});*/
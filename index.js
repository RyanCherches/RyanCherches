/*document.addEventListener("DOMContentLoaded", function () {
    let restricted = document.querySelector("#username");
    console.log("restricted input element:", restricted);

    let button = document.querySelector(".login");

    if (button) {
        button.addEventListener('click', function () {
            let letter = document.querySelector(".letter");

            if (restricted && restricted.value === "admin") {
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
                letter.innerHTML = '';
            }
        });
    }
});*/
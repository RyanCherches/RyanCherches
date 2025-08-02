function changeBurgerMenu(){
    const headerNav =document.querySelector("#header-nav")
    console.log(headerNav.style.height)
    if (headerNav.style.height === "0px"){
        headerNav.style.height = "132px"
    }
    else {
        headerNav.style.height = "0px"
    }
}
only = document.querySelector("#no");
only.innerHTML = "<h1>Only my advisor may pass(or you can just click, but please only look if you are my advisor)!</h1>";
  document.addEventListener('click', function() {
        only.innerHTML = "<p style='text-indent:40px;'>Before you start, I just wanted to say, you don't have to read all of this, it's a lot.</p><p style='text-indent:40px;'> Now you might have already saw my letter(if not please go back). This is technically part of my website. But because I don't want other people looking at this, you cant view this from my website.</p> <p style='text-indent:40px;'> If you want to visit it then click the link above. </p> <p style='text-indent:40px;'>I made this website like a year ago, and have been updating it ever since. It all started back when I was learning HTML. This was our project. All that was, was about worldle(Find out more by visiting my website;). It had 2 versions. The first one was right when we started, like the 5th lesson or something. Then I completely scrapped it and with the help of my teacher, I got it done. It wasn't that much different then what it is right now. I will have this link kept here for probably a long time(don't know yet). I hope you like my website.</p>";
    });

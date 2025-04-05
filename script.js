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
document.getElementById("Play").addEventListener("click", function() {
    let mainPage = document.getElementById("main");
    mainPage.style.opacity = 0;
    mainPage.style.zIndex = 1;
    
    let game = document.getElementsByClassName("game");
    for(let count = 0; count < game.length; count++){
        game[count].style.opacity = 1;
        game[count].style.zIndex = 3;
    }
    let canvasOutput = document.getElementById("canvasOutput");
    canvasOutput.style.left = "60%";
    
});
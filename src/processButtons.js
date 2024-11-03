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
    document.getElementsByClassName("webgl")[0].style.top = "90px";
    
});

document.getElementById("Demo").addEventListener("click", function() {
    let mainPage = document.getElementById("main");
    mainPage.style.opacity = 0;
    mainPage.style.zIndex = 1;
    
    let game = document.getElementsByClassName("d_e_m_o");
    for(let count = 0; count < game.length; count++){
        game[count].style.opacity = 1;
        game[count].style.zIndex = 3;
    }
    let canvasOutput = document.getElementById("canvasOutput");
    canvasOutput.style.left = "60%";
    canvasOutput.style.zIndex = 4;

    let canvasMask = document.getElementById("canvasMask");
    canvasMask.style.top = "350px";
    canvasMask.style.left = "60%";

    document.getElementsByClassName("webgl")[0].style.top = "90px";
    
});

document.getElementById("Settings").addEventListener("click", function() {
    let mainPage = document.getElementById("main");
    mainPage.style.opacity = 0;
    mainPage.style.zIndex = 1;
    
    let settings = document.getElementsByClassName("SetBod");
    for(let count = 0; count < settings.length; count++){
        settings[count].style.opacity = 1;
        settings[count].style.zIndex = 3;
    }
    
});
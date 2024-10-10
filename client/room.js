import { io } from "socket.io-client";

import { DrawableCanvas } from "./drawableCanvas"

const socket = io("http://192.168.1.23:3000");

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get("name");
const roomId = urlParams.get("room-id");

if (!name || !roomId) {
    window.location = "./index.html";
}

const canvas = document.querySelector('[data-canvas]');
const wordElement = document.querySelector('[data-word]');
const messagesElement = document.querySelector('[data-messages]'); // Uncommented to use
const guessForm = document.querySelector('[data-guess-form]');
const guessInput = document.querySelector('[data-guess-input]');
const readyButton = document.querySelector('[data-ready-btn]');
const drawableCanvas = new DrawableCanvas(canvas, socket, roomId); // Pass roomId
const guessTemplate = document.querySelector('[data-guess-template]');


socket.emit("join-room", { name: name, roomId: roomId });

socket.on("start-guesser", () => {
    startRoundGuesser();
});

socket.on("start-drawer", (word) => {
    startRoundDrawer(word);
});



socket.on("guess", ({ user, data }) => {
    displayGuess(user, data);
});

socket.on("winner", (winnerName, winnerWord) => {
    endRound(winnerName, winnerWord);
});



endRound();
resizeCanvas()
setupHTMLEvents()

socket.on("correct-guess", (data) => {
    messagesElement.innerText = `${data.guesser} guessed the word correctly!`;
    messagesElement.style.color = 'red';
    endRound(data.guesser, data.word);
    resizeCanvas()
});


// Inside the submit-guess event listener
guessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const guess = guessInput.value.trim();
    if (guess === "") return;
    socket.emit("submit-guess", { guess: guess, roomId: roomId });
    displayGuess(name, guess);
    guessInput.value = ""; // Clear input field
});





function setupHTMLEvents() {

}

function displayGuess(guessName, guessText) {
    const guessElement = document.importNode(guessTemplate.content, true);
    const nameElement = guessElement.querySelector("[data-name]");
    const messageElement = guessElement.querySelector("[data-text]");
    nameElement.textContent = guessName;
    messageElement.textContent = guessText;
    messagesElement.appendChild(guessElement);
}


readyButton.addEventListener("click", () => {
    hide(readyButton);
    socket.emit("ready", { roomId: roomId });
});


window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    const CLIENT_DIMENSIONS = canvas.getBoundingClientRect();
    canvas.width = CLIENT_DIMENSIONS.width;
    canvas.height = CLIENT_DIMENSIONS.height;
}

function startRoundDrawer(word) {
    drawableCanvas.canDraw = true; // Allow drawing
    drawableCanvas.clearCanvas(); // Clear the canvas for the drawer
    messagesElement.innerText = "";
    wordElement.innerText = word;
}

function startRoundGuesser() {
    show(guessForm);
    hide(wordElement);
    drawableCanvas.canDraw = false; // Make the drawing area read-only for the guesser
    drawableCanvas.clearCanvas(); // Clear the canvas for the drawer
    messagesElement.innerText = "";
}


function endRound(name, word) {
    if (word && name) {
        wordElement.innerText = word
        show(wordElement)
        displayGuess(null, `${name} is the winner`)
    }
    show(readyButton)
    drawableCanvas.canDraw = false
    hide(guessForm);
}

function hide(element) {
    element.classList.add("hide");
}

function show(element) {
    element.classList.remove("hide");
}

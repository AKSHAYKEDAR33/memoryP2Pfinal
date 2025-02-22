const socket = io();
let playerId;
let timeLeft = 2000;
let timer;
let matchedPairs = 0;

const questionAnswerPairs = [
    { question: " Connecting link between annelida and anthropoda?", answer: "Peripatus" },
    { question: "Process of transfer of information for molecule to molecule of DNA to RNA?", answer: "Transcription" },
    { question: " What do we call the process of transfer of physical and mental characters from parents to the progeny?", answer: "Heredity" },
    { question: "Theory of Natural Selection?", answer: "Charles Darwin" }
];

function joinGame() {
    const username = document.getElementById("username").value.trim();
    if (username) {
        socket.emit("joinGame", { username });
    }
}

socket.on("playerAssigned", (data) => {
    playerId = data.id;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("playerInfo").innerText = `You are Player ${data.username}`;
});

socket.on("gameFull", () => {
    alert("Game is full! Try again later.");
});

socket.on("startGame", () => {
    startTimer();
    generateCards();
});

function startTimer() {
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            document.getElementById("timer").innerText = timeLeft;
        } else {
            clearInterval(timer);
            alert("Time's up!");
            socket.emit("submitGame", { playerId });
        }
    }, 1000);
}

function generateCards() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";

    let shuffledPairs = [];
    questionAnswerPairs.forEach(pair => {
        shuffledPairs.push({ text: pair.question, type: "question", pair: pair.answer });
        shuffledPairs.push({ text: pair.answer, type: "answer", pair: pair.question });
    });

    shuffledPairs.sort(() => Math.random() - 0.5);

    shuffledPairs.forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("card", "hidden");
        card.dataset.value = item.text;
        card.dataset.pair = item.pair;
        card.dataset.type = item.type;
        card.onclick = () => flipCard(card);
        card.innerText = "Click to Flip";
        gameBoard.appendChild(card);
    });
}

let flippedCards = [];

function flipCard(card) {
    if (flippedCards.length < 2 && !card.classList.contains("matched")) {
        card.innerText = card.dataset.value;
        card.classList.remove("hidden");
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 1000);
        }
    }
}

function checkMatch() {
    if (
        flippedCards[0].dataset.type !== flippedCards[1].dataset.type &&
        flippedCards[0].dataset.value === flippedCards[1].dataset.pair
    ) {
        flippedCards.forEach(card => card.classList.add("matched"));
        matchedPairs++;
        socket.emit("matchFound", { playerId });

        if (matchedPairs === questionAnswerPairs.length) {
            document.getElementById("submitBtn").disabled = false;
        }
    } else {
        flippedCards.forEach(card => {
            card.innerText = "Click to Flip";
            card.classList.add("hidden");
        });
    }
    flippedCards = [];
}

function submitGame() {
    clearInterval(timer);
    socket.emit("submitGame", { playerId });
}

socket.on("gameOver", (data) => {
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("resultScreen").style.display = "block";
    document.getElementById("winnerMessage").innerText = `Winner: ${data.winner}`;
});

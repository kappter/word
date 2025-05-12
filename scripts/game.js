// Wordle-like game initialization (for game.html)
function initializeWordleGame() {
    const gameContainer = document.getElementById("game-container");
    const loadingElement = document.getElementById("loading-game");
    if (!gameContainer || !loadingElement) return;

    loadWordParts().then(() => {
        const gameThemeType = document.getElementById("gameThemeType");
        const targetWord = generateWordAndDefinition("pre-root-suf", gameThemeType ? gameThemeType.value : "normal", { excludeExample: true }).word;
        let guesses = [];
        let currentGuess = "";
        const maxGuesses = 6;

        gameContainer.classList.remove("hidden");
        loadingElement.classList.add("hidden");

        const guessInput = document.getElementById("guess-input");
        const submitGuess = document.getElementById("submit-guess");
        const guessGrid = document.getElementById("guess-grid");

        if (!guessInput || !submitGuess || !guessGrid) {
            console.error("Required game elements missing.");
            return;
        }

        submitGuess.addEventListener("click", () => {
            if (currentGuess.length !== targetWord.split('-').length || guesses.length >= maxGuesses) return;

            guesses.push(currentGuess);
            const row = document.createElement("div");
            row.className = "guess-row";
            targetWord.split('-').forEach((part, index) => {
                const cell = document.createElement("div");
                cell.className = "guess-cell";
                cell.textContent = currentGuess.split('-')[index] || "";
                if (currentGuess.split('-')[index] === part) {
                    cell.classList.add("correct");
                } else if (targetWord.split('-').includes(currentGuess.split('-')[index])) {
                    cell.classList.add("present");
                } else {
                    cell.classList.add("absent");
                }
                row.appendChild(cell);
            });
            guessGrid.appendChild(row);

            if (currentGuess === targetWord) {
                alert("Congratulations! You guessed the word!");
                resetGame();
            } else if (guesses.length >= maxGuesses) {
                alert(`Game Over! The word was ${targetWord}.`);
                resetGame();
            }

            currentGuess = "";
            guessInput.value = "";
        });

        guessInput.addEventListener("input", (e) => {
            currentGuess = e.target.value.replace(/[^a-zA-Z-]/g, '').toLowerCase();
            if (currentGuess.split('-').length > targetWord.split('-').length) {
                currentGuess = currentGuess.split('-').slice(0, targetWord.split('-').length).join('-');
                guessInput.value = currentGuess;
            }
        });

        function resetGame() {
            guesses = [];
            currentGuess = "";
            guessGrid.innerHTML = "";
            guessInput.value = "";
            initializeWordleGame();
        }
    }).catch(error => {
        console.error("Game initialization failed:", error);
        loadingElement.textContent = "Failed to load game. Check console.";
    });
}

// Start Wordle game only on game.html
if (window.location.pathname.includes('game.html')) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeWordleGame);
    } else {
        initializeWordleGame();
    }
}

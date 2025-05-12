// [Insert the completed parseCSV, themes, definitionTemplates, exampleTemplates, and helper functions here from the previous response up to loadWordParts()]

// Function to load word parts
async function loadWordParts() {
    if (themesLoadedPromise) return themesLoadedPromise;

    themesLoadedPromise = new Promise(async (resolve, reject) => {
        const loadingElement = document.getElementById("loading-game");
        if (loadingElement) loadingElement.classList.remove("hidden");

        try {
            const response = await fetch("data/word_parts.csv");
            if (!response.ok) throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);

            const csvText = await response.text();
            const parsedData = parseCSV(csvText);

            // Initialize themes object
            themes.normal = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            const themesList = ['fantasy', 'astronomy', 'shakespearian', 'popculture', 'technical', 'math', 'geography'];
            themesList.forEach(theme => {
                themes[theme] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            });

            // Categorize parsed data into themes
            parsedData.forEach(entry => {
                const theme = entry.type || 'normal';
                if (themes[theme]) {
                    if (entry.part === 'prefix') {
                        themes[theme].prefixes.push(entry.term);
                        themes[theme].prefixDefs.push(entry.definition);
                    } else if (entry.part === 'root') {
                        themes[theme].roots.push(entry.term);
                        themes[theme].rootDefs.push(entry.definition);
                        themes[theme].rootPos.push(entry.pos || 'noun');
                    } else if (entry.part === 'suffix') {
                        themes[theme].suffixes.push(entry.term);
                        themes[theme].suffixDefs.push(entry.definition);
                    }
                }
            });

            // Ensure all themes have data
            Object.keys(themes).forEach(theme => {
                if (themes[theme].prefixes.length === 0 || themes[theme].roots.length === 0 || themes[theme].suffixes.length === 0) {
                    console.warn(`Theme ${theme} has insufficient data. Falling back to 'normal' theme.`);
                    themes[theme] = { ...themes.normal };
                }
            });

            console.log("Themes loaded successfully:", themes);
            if (loadingElement) loadingElement.classList.add("hidden");
            resolve();
        } catch (error) {
            console.error("Error loading word parts:", error);
            if (loadingElement) {
                loadingElement.textContent = "Failed to load word parts. Check console.";
                loadingElement.classList.remove("hidden");
            }
            reject(error);
        }
    });

    return themesLoadedPromise;
}

// [Insert the remaining index.html functions (updateDisplay, copyToClipboard, shuffleAmalgamations, etc.) here from the previous response]

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

// Guess the Real Word game initialization (for guess_real.html)
function initializeGuessRealGame() {
    const gameContainer = document.getElementById("game-container");
    const loadingElement = document.getElementById("loading-game");
    if (!gameContainer || !loadingElement) return;

    loadWordParts().then(() => {
        const gameThemeType = document.getElementById("gameThemeType");
        const wordDisplay = document.getElementById("word-display");
        const realBtn = document.getElementById("real-btn");
        const fakeBtn = document.getElementById("fake-btn");
        const scoreEl = document.getElementById("score");
        if (!wordDisplay || !realBtn || !fakeBtn || !scoreEl) {
            console.error("Required game elements missing.");
            return;
        }

        let score = 0;
        let currentWord = "";
        let isReal = false;

        gameContainer.classList.remove("hidden");
        loadingElement.classList.add("hidden");

        function newRound() {
            const { word: realWord } = generateWordAndDefinition("pre-root-suf", gameThemeType ? gameThemeType.value : "normal", { excludeExample: true });
            const fakeWord = generateWordAndDefinition("pre-root-suf", gameThemeType ? gameThemeType.value : "normal", { excludeExample: true }).word;
            currentWord = Math.random() > 0.5 ? realWord : fakeWord;
            isReal = currentWord === realWord;
            wordDisplay.textContent = currentWord;
        }

        realBtn.addEventListener("click", () => {
            if (isReal) {
                score++;
                alert("Correct! It's a real word.");
            } else {
                alert("Wrong! It's a fake word.");
            }
            scoreEl.textContent = `Score: ${score}`;
            newRound();
        });

        fakeBtn.addEventListener("click", () => {
            if (!isReal) {
                score++;
                alert("Correct! It's a fake word.");
            } else {
                alert("Wrong! It's a real word.");
            }
            scoreEl.textContent = `Score: ${score}`;
            newRound();
        });

        newRound();
    }).catch(error => {
        console.error("Game initialization failed:", error);
        loadingElement.textContent = "Failed to load game. Check console.";
    });
}

// Start Guess Real game only on guess_real.html
if (window.location.pathname.includes('guess_real.html')) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeGuessRealGame);
    } else {
        initializeGuessRealGame();
    }
}

// Event listener for DOM content loaded (for index.html)
document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();
    const themeType = document.getElementById("themeType");
    const permutationType = document.getElementById("permutationType");
    const generateButton = document.getElementById("generateButton");
    const copyButton = document.getElementById("copyButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const clearLikesButton = document.getElementById("clearLikesButton");

    if (themeType) {
        themeType.addEventListener("change", updateDisplay);
    }
    if (permutationType) {
        permutationType.addEventListener("change", updateDisplay);
    }
    if (generateButton) {
        generateButton.addEventListener("click", updateDisplay);
    }
    if (copyButton) {
        copyButton.addEventListener("click", copyToClipboard);
    }
    if (shuffleButton) {
        shuffleButton.addEventListener("click", shuffleAmalgamations);
    }
    if (clearLikesButton) {
        clearLikesButton.addEventListener("click", clearLikes);
    }
    updateDisplay();
    addPermutationClickHandlers();
    addLikedWordClickHandlers();
});

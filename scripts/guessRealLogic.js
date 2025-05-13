function initializeGuessGame() {
    const guessWordElement = document.getElementById("guess-word");
    const guessDefinitionElement = document.getElementById("guess-definition");
    const realButton = document.getElementById("real-button");
    const madeUpButton = document.getElementById("made-up-button");
    const guessMessageElement = document.getElementById("guess-message");
    const newWordButton = document.getElementById("new-word-button");

    if (!guessWordElement || !guessDefinitionElement || !realButton || !madeUpButton || !guessMessageElement || !newWordButton) {
        console.log("Guess game elements not found, skipping initialization.");
        return;
    }

    // List of real words with definitions (simplified for demo)
    const realWords = [
        { word: "happy", definition: "(adjective) Feeling or showing pleasure or contentment." },
        { word: "river", definition: "(noun) A large, flowing body of water that usually empties into a sea." },
        { word: "cloud", definition: "(noun) A visible mass of condensed water vapor floating in the atmosphere." }
    ];

    let currentWordData = null;
    let isReal = false;

    function startNewGame() {
        // Randomly decide if the word is real or made up
        isReal = Math.random() > 0.5;

        if (isReal) {
            // Select a real word
            currentWordData = realWords[Math.floor(Math.random() * realWords.length)];
        } else {
            // Generate a made-up word
            currentWordData = generateWordAndDefinition("pre-root-suf", "normal", { removeHyphens: true });
        }

        guessWordElement.textContent = currentWordData.word || "No word generated";
        guessDefinitionElement.textContent = currentWordData.definition || "No definition available";
        guessMessageElement.textContent = "";
    }

    realButton.addEventListener("click", () => {
        if (isReal) {
            guessMessageElement.textContent = "Correct! This is a real word.";
        } else {
            guessMessageElement.textContent = "Wrong! This is a made-up word.";
        }
    });

    madeUpButton.addEventListener("click", () => {
        if (!isReal) {
            guessMessageElement.textContent = "Correct! This is a made-up word.";
        } else {
            guessMessageElement.textContent = "Wrong! This is a real word.";
        }
    });

    newWordButton.addEventListener("click", startNewGame);

    // Start the first game
    startNewGame();
}

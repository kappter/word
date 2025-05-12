// gameLogic.js
function initializeWordleGame() {
    // Placeholder for Wordle game logic
    console.log("Initializing Wordle game...");
    const word = generateWordAndDefinition('pre-root-suf', 'normal', { removeHyphens: true }).word;
    // Add logic to set up the Wordle grid, handle guesses, etc.
}

function initializeGuessRealGame() {
    // Placeholder for Guess Real game logic
    console.log("Initializing Guess Real game...");
    const realWord = "acnestis"; // Example from your rare words list
    const fakeWord = generateWordAndDefinition('pre-root-suf', 'normal', { removeHyphens: true }).word;
    // Add logic to present real vs. fake words, handle user choices, etc.
}

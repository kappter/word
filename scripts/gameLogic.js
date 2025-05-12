// gameLogic.js
function initializeWordleGame() {
    try {
        console.log("Initializing Wordle game...");
        const wordData = generateWordAndDefinition('pre-root-suf', 'geography', { removeHyphens: true });
        window.wordleTarget = wordData.word;
        console.log(`Wordle target word: ${wordData.word}`);
        console.log(`Definition: ${wordData.definition}`);
    } catch (error) {
        console.error("Failed to initialize Wordle game:", error);
    }
}

function initializeGuessRealGame() {
    console.log("Initializing Guess Real game...");
    const realWord = "acnestis"; // Example from your rare words list
    const fakeWord = generateWordAndDefinition('pre-root-suf', 'normal', { removeHyphens: true }).word;
    // Add logic to present real vs. fake words, handle user choices, etc.
    window.guessRealTarget = { real: realWord, fake: fakeWord };
    console.log(`Guess Real targets: real=${realWord}, fake=${fakeWord}`);
}

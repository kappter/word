// gameLogic.js
function initializeWordleGame() {
    console.log("Initializing Wordle game...");
    const word = generateWordAndDefinition('pre-root-suf', 'geography', { removeHyphens: true }).word;
    window.wordleTarget = word;
    console.log(`Wordle target word: ${word}`);
}

function initializeGuessRealGame() {
    console.log("Initializing Guess Real game...");
    const realWord = "acnestis"; // Example from your rare words list
    const fakeWord = generateWordAndDefinition('pre-root-suf', 'normal', { removeHyphens: true }).word;
    // Add logic to present real vs. fake words, handle user choices, etc.
    window.guessRealTarget = { real: realWord, fake: fakeWord };
    console.log(`Guess Real targets: real=${realWord}, fake=${fakeWord}`);
}

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
// In gameLogic.js or a new uiHandler.js
function populateThemeDropdown() {
    const dropdown = document.getElementById('theme-dropdown');
    if (!dropdown) {
        console.warn('Theme dropdown element not found');
        return;
    }

    // Clear existing options
    dropdown.innerHTML = '<option value="" disabled selected>Select a theme</option>';

    // Populate with themes from wordGenerator.js
    const themes = window.themes || {}; // Ensure themes is accessible (global or passed)
    Object.keys(themes).forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1); // Capitalize for display
        dropdown.appendChild(option);
    });

    console.log('Theme dropdown populated with:', Object.keys(themes));
}

// Call this after loadWordParts in game.html
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadWordParts();
        initializeWordleGame();
        populateThemeDropdown(); // Add this line
    } catch (error) {
        console.error('Failed to start game:', error);
        const loadingElement = document.getElementById('loading-game');
        if (loadingElement) {
            loadingElement.textContent = 'Failed to start game. Check console.';
            loadingElement.classList.remove('hidden');
        }
    }
});

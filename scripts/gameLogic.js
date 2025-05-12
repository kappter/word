function initializeWordleGame() {
    if (!document.getElementById("wordle-game-container")) {
        console.log("Skipping Wordle game initialization on this page.");
        return;
    }

    console.log("Initializing Wordle game...");
    const themeDropdown = document.getElementById("theme-dropdown");
    let theme = themeDropdown ? themeDropdown.value : "normal";

    if (!theme || !window.themes || !window.themes[theme]) {
        console.warn(`Theme ${theme} not found or not loaded, defaulting to 'normal'.`);
        theme = "normal";
    }

    const wordData = generateWordAndDefinition("pre-root-suf", theme, { removeHyphens: true });
    console.log("Wordle target word:", wordData.word);
    console.log("Definition:", wordData.definition);
}

function populateThemeDropdown() {
    const themeDropdown = document.getElementById("theme-dropdown");
    if (!themeDropdown) {
        console.log("Theme dropdown element not found on this page.");
        return;
    }

    if (themeDropdown.options.length > 0) {
        console.log("Theme dropdown already populated, skipping.");
        return;
    }

    const themes = Object.keys(window.themes || {});
    themes.sort();
    themeDropdown.innerHTML = themes.map(theme => `<option value="${theme}">${theme.charAt(0).toUpperCase() + theme.slice(1)}</option>`).join("");
    console.log("Theme dropdown populated with:", themes);
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
    const themeDropdown = document.getElementById("theme-dropdown");
    if (!themeDropdown) {
        console.log("Theme dropdown element not found on this page.");
        return;
    }

    const themes = Object.keys(window.themes || {});
    themes.sort();
    themeDropdown.innerHTML = themes.map(theme => `<option value="${theme}">${theme.charAt(0).toUpperCase() + theme.slice(1)}</option>`).join("");
    console.log("Theme dropdown populated with:", themes);
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

document.addEventListener("DOMContentLoaded", () => {
    initializeWordleGame();
    populateThemeDropdown();
});

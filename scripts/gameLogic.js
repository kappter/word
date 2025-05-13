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

// New Definition Matching Game Logic
function initializeDefinitionGame() {
    const gameWordElement = document.getElementById("game-word");
    const definitionOptionsElement = document.getElementById("definition-options");
    const submitAnswerButton = document.getElementById("submit-answer");
    const gameMessageElement = document.getElementById("game-message");
    const newWordButton = document.getElementById("new-word-button");
    const themeDropdown = document.getElementById("theme-dropdown");

    if (!gameWordElement || !definitionOptionsElement || !submitAnswerButton || !gameMessageElement || !newWordButton || !themeDropdown) {
        console.log("Game elements not found, skipping initialization.");
        return;
    }

    let currentWordData = null;

    function startNewGame() {
        const theme = themeDropdown.value || "normal";
        currentWordData = generateWordAndDefinition("pre-root-suf", theme, { removeHyphens: true });
        gameWordElement.textContent = currentWordData.word || "No word generated";
        gameMessageElement.textContent = "";

        // Get definitions
        const correctDefinition = currentWordData.definition;
        const themeData = window.themes[theme] || {};
        const allParts = [...(themeData.prefixes || []), ...(themeData.roots || []), ...(themeData.suffixes || [])]
            .filter(item => item && item.term && item.def && item.def !== correctDefinition);
        const incorrectDefinitions = [];
        while (incorrectDefinitions.length < 2 && allParts.length > 0) {
            const randomIndex = Math.floor(Math.random() * allParts.length);
            const randomPart = allParts.splice(randomIndex, 1)[0];
            if (randomPart.def) incorrectDefinitions.push(randomPart.def);
        }

        const allDefinitions = [correctDefinition, ...incorrectDefinitions].sort(() => Math.random() - 0.5);
        definitionOptionsElement.innerHTML = "";
        allDefinitions.forEach((def, index) => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "definition";
            input.value = def;
            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${def}`));
            definitionOptionsElement.appendChild(label);
            definitionOptionsElement.appendChild(document.createElement("br"));
        });
    }

    submitAnswerButton.addEventListener("click", () => {
        if (!currentWordData || !currentWordData.definition) return;

        const selectedDefinition = document.querySelector("input[name='definition']:checked");
        if (!selectedDefinition) {
            gameMessageElement.textContent = "Please select a definition.";
            return;
        }

        if (selectedDefinition.value === currentWordData.definition) {
            gameMessageElement.textContent = "Correct! Well done!";
        } else {
            gameMessageElement.textContent = `Wrong! The correct definition is: ${currentWordData.definition}`;
        }
    });

    newWordButton.addEventListener("click", startNewGame);

    themeDropdown.addEventListener("change", startNewGame);

    // Start the first game
    startNewGame();
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

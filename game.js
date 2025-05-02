// Game state variables
let score = 0;
let misses = 0;
const maxMisses = 3;
let currentQuestionIndex = 0;
const questionsPerRound = 5;
let currentQuestions = []; // { word: '...', definition: '...', options: ['...', ...], answer: '...' }
let selectedGameTheme = 'all';

// DOM Elements
let gameThemeSelect, startGameButton, questionArea, definitionText, optionsList, feedbackText, scoreDisplay, missesDisplay, questionCounter, gameOverArea, finalScoreDisplay, playAgainButton, nextQuestionButton, themeSelectionArea;

// Function to get DOM elements
function getGameDOMElements() {
    gameThemeSelect = document.getElementById("gameThemeType");
    startGameButton = document.getElementById("startGameButton");
    questionArea = document.getElementById("questionArea");
    definitionText = document.getElementById("definitionText");
    optionsList = document.getElementById("optionsList");
    feedbackText = document.getElementById("feedbackText");
    scoreDisplay = document.getElementById("scoreDisplay");
    missesDisplay = document.getElementById("missesDisplay");
    questionCounter = document.getElementById("questionCounter");
    gameOverArea = document.getElementById("gameOverArea");
    finalScoreDisplay = document.getElementById("finalScoreDisplay");
    playAgainButton = document.getElementById("playAgainButton");
    nextQuestionButton = document.getElementById("nextQuestionButton");
    themeSelectionArea = document.getElementById("themeSelectionArea"); // Added theme selection area

    if (!gameThemeSelect || !startGameButton || !questionArea || !definitionText || !optionsList || !feedbackText || !scoreDisplay || !missesDisplay || !questionCounter || !gameOverArea || !finalScoreDisplay || !playAgainButton || !nextQuestionButton || !themeSelectionArea) {
        console.error("One or more game elements are missing!");
        return false;
    }
    return true;
}


// --- Game Logic Functions ---

// Generate questions for the current round
function generateQuestions(theme) {
    console.log(`Generating ${questionsPerRound} questions for theme: ${theme}`);
    currentQuestions = []; // Clear previous questions
    const wordType = 'pre-root-suf'; // Using a common structure for simplicity

    if (typeof themes === 'undefined' || Object.keys(themes).length === 0) {
         console.error("Themes object not available to generate questions.");
         alert("Error: Word data not loaded. Cannot start game.");
         return false;
    }

    let attempts = 0;
    const maxAttempts = questionsPerRound * 5; // Limit attempts to prevent infinite loops

    while (currentQuestions.length < questionsPerRound && attempts < maxAttempts) {
        attempts++;
        const { word, definition } = generateWordAndDefinition(wordType, theme);

        // Basic validation: ensure word and definition are generated and word hasn't been used yet
        if (word === "Error" || !definition || currentQuestions.some(q => q.word === word)) {
            console.warn(`Skipping invalid or duplicate word generation: ${word}`);
            continue; // Skip this attempt if generation failed or word is duplicate
        }

        // Generate distractors (simple approach: generate more words of the same theme)
        const options = [word];
        let distractorAttempts = 0;
        const maxDistractorAttempts = 20;
        while (options.length < 4 && distractorAttempts < maxDistractorAttempts) {
            distractorAttempts++;
            const { word: distractorWord } = generateWordAndDefinition(wordType, theme);
            if (distractorWord !== "Error" && !options.includes(distractorWord)) {
                options.push(distractorWord);
            }
        }

        // If we couldn't generate enough distractors, skip this question
        if (options.length < 4) {
            console.warn(`Could not generate enough distractors for word: ${word}. Skipping question.`);
            continue;
        }

        shuffleArray(options); // Randomize option order

        currentQuestions.push({
            word: word,
            definition: definition,
            options: options,
            answer: word
        });
    }

    if (currentQuestions.length < questionsPerRound) {
        console.error(`Failed to generate enough unique questions (${currentQuestions.length}/${questionsPerRound}) for theme '${theme}'.`);
        alert(`Could only generate ${currentQuestions.length} unique questions for this theme. Please try another theme.`);
        return false;
    }

     console.log("Generated questions:", currentQuestions);
     return true;
}

// Display the current question
function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        // This case should ideally not be reached if next button logic is correct
        console.log("Attempted to display question beyond round limit.");
        showGameOver("round_complete");
        return;
    }
    const q = currentQuestions[currentQuestionIndex];
    definitionText.textContent = q.definition;
    optionsList.innerHTML = ''; // Clear previous options
    q.options.forEach(option => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => handleAnswer(option, button);
        li.appendChild(button);
        optionsList.appendChild(li);
    });
    feedbackText.textContent = '';
    nextQuestionButton.style.display = 'none'; // Hide next button until answer is given
    questionArea.style.display = 'block';
    updateScoreboard();
}

// Handle the user's answer selection
function handleAnswer(selectedOption, selectedButton) {
    const correctAnswer = currentQuestions[currentQuestionIndex].answer;
    const buttons = optionsList.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = true; // Disable all options
        // Highlight correct answer
        if (button.textContent === correctAnswer) {
            button.classList.add('correct');
        }
    });

    if (selectedOption === correctAnswer) {
        score++;
        feedbackText.textContent = "Correct!";
        feedbackText.style.color = 'green';
    } else {
        misses++;
        feedbackText.textContent = `Incorrect. The answer was: ${correctAnswer}`;
        feedbackText.style.color = 'red';
        if (selectedButton) {
            selectedButton.classList.add('incorrect'); // Highlight the wrong selection
        }
    }
    updateScoreboard();

    if (misses >= maxMisses) {
        showGameOver("too_many_misses");
    } else if (currentQuestionIndex >= questionsPerRound - 1) {
        // Last question of the round answered (correctly or incorrectly)
        showGameOver("round_complete");
    } else {
         nextQuestionButton.style.display = 'block'; // Show next button
    }
}

// Update the score and misses display
function updateScoreboard() {
    scoreDisplay.textContent = score;
    missesDisplay.textContent = maxMisses - misses;
    // Ensure question index doesn't exceed round length for display
    const displayIndex = Math.min(currentQuestionIndex + 1, questionsPerRound);
    questionCounter.textContent = `${displayIndex} / ${questionsPerRound}`;
}

// Show the game over screen
function showGameOver(reason) {
     console.log("Game Over. Reason:", reason);
     questionArea.style.display = 'none';
     gameOverArea.style.display = 'block';
     finalScoreDisplay.textContent = score;
     nextQuestionButton.style.display = 'none';
}

// Reset the game state and UI for a new game
function resetGame() {
    score = 0;
    misses = 0;
    currentQuestionIndex = 0;
    currentQuestions = [];
    gameOverArea.style.display = 'none';
    questionArea.style.display = 'none';
    themeSelectionArea.style.display = 'block'; // Show theme selection again
    feedbackText.textContent = '';
    if (gameThemeSelect) gameThemeSelect.value = 'all'; // Reset dropdown selection
    updateScoreboard();
}

// Start a new game round
function startGame() {
    selectedGameTheme = gameThemeSelect.value;
    console.log(`Starting game with theme: ${selectedGameTheme}`);
    themeSelectionArea.style.display = 'none'; // Hide theme selection
    gameOverArea.style.display = 'none'; // Hide game over area

    score = 0;
    misses = 0;
    currentQuestionIndex = 0;

    if (generateQuestions(selectedGameTheme)) {
        questionArea.style.display = 'block'; // Show question area only if questions generated
        displayQuestion();
    } else {
        // Handle error if questions couldn't be generated
        // Alert was shown in generateQuestions
        resetGame(); // Go back to theme selection
    }
}

// Utility to shuffle array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Game page DOM fully loaded.");

    if (!getGameDOMElements()) {
        console.error("Failed to get all required game DOM elements. Game cannot start.");
        // Maybe display an error message to the user on the page itself
        document.body.innerHTML = "<h1>Error: Failed to load game elements.</h1>";
        return;
    }

    // Initial UI state
    questionArea.style.display = 'none';
    gameOverArea.style.display = 'none';
    nextQuestionButton.style.display = 'none';
    themeSelectionArea.style.display = 'block';

    // Add event listeners
    startGameButton.addEventListener('click', startGame);
    playAgainButton.addEventListener('click', resetGame);
    nextQuestionButton.addEventListener('click', () => {
         currentQuestionIndex++;
         displayQuestion();
    });

    // Wait for themes to be loaded by script.js
    console.log("Game page waiting for 'themesLoaded' event...");
    document.addEventListener('themesLoaded', () => {
        console.log("'themesLoaded' event received on game page.");
        if (typeof populateThemeDropdown === "function") {
             console.log("Populating game theme dropdown...");
             populateThemeDropdown(); // Call the function from script.js
        } else {
             console.error("populateThemeDropdown function is not available!");
             // Fallback or error message if needed
             if(gameThemeSelect) gameThemeSelect.innerHTML = '<option value="error">Error loading themes</option>';
        }
    }, { once: true }); // Run only once

     // Check if themes might already be loaded before this listener is added
     // This handles race conditions where script.js finishes loading before game.js listener is ready
     if (typeof themes !== 'undefined' && Object.keys(themes).length > 0) {
         console.log("Themes seem to be already loaded, attempting to populate dropdown immediately.");
         if (typeof populateThemeDropdown === "function") {
             populateThemeDropdown();
         } else {
             console.error("populateThemeDropdown function is not available even though themes are loaded!");
              if(gameThemeSelect) gameThemeSelect.innerHTML = '<option value="error">Error loading themes</option>';
         }
     } else {
         console.log("Themes not yet loaded, waiting for event.");
     }

});


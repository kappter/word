// Game state variables
let score = 0;
let misses = 0;
const maxMisses = 3;
let currentQuestionIndex = 0;
const questionsPerRound = 5;
let currentQuestions = []; // { word: '...', definition: '...', options: ['...', ...], answer: '...' }
let selectedGameTheme = 'all';

// DOM Elements
let gameThemeSelect, startGameButton, gamePlayArea, gameDefinition, choicesArea, feedbackText, scoreSpan, missesSpan, questionNumberSpan, gameOverDiv, finalScoreSpan, playAgainButton, nextQuestionButton, gameSetupArea;

// Function to get DOM elements
function getGameDOMElements() {
    gameThemeSelect = document.getElementById("gameThemeType");
    startGameButton = document.getElementById("startGameButton");
    gamePlayArea = document.getElementById("game-play"); // Corrected ID
    gameDefinition = document.getElementById("gameDefinition"); // Corrected ID
    choicesArea = document.getElementById("choices-area"); // Corrected ID
    feedbackText = document.getElementById("feedbackText");
    scoreSpan = document.getElementById("score"); // Corrected ID
    missesSpan = document.getElementById("misses"); // Corrected ID
    questionNumberSpan = document.getElementById("questionNumber"); // Corrected ID
    gameOverDiv = document.getElementById("game-over"); // Corrected ID
    finalScoreSpan = document.getElementById("finalScore"); // Corrected ID
    playAgainButton = document.getElementById("playAgainButton");
    nextQuestionButton = document.getElementById("nextQuestionButton");
    gameSetupArea = document.getElementById("game-setup"); // Corrected ID

    // Check all potentially null elements
    if (!gameThemeSelect || !startGameButton || !gamePlayArea || !gameDefinition || !choicesArea || !feedbackText || !scoreSpan || !missesSpan || !questionNumberSpan || !gameOverDiv || !finalScoreSpan || !playAgainButton || !nextQuestionButton || !gameSetupArea) {
        console.error("One or more game elements are missing! Check HTML IDs.");
        // Log which elements are missing
        console.log({ gameThemeSelect, startGameButton, gamePlayArea, gameDefinition, choicesArea, feedbackText, scoreSpan, missesSpan, questionNumberSpan, gameOverDiv, finalScoreSpan, playAgainButton, nextQuestionButton, gameSetupArea });
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
    const maxAttempts = questionsPerRound * 10; // Increased attempts limit

    while (currentQuestions.length < questionsPerRound && attempts < maxAttempts) {
        attempts++;
        const { word, definition } = generateWordAndDefinition(wordType, theme);

        // Basic validation: ensure word and definition are generated and word hasn't been used yet
        if (word === "Error" || !definition || currentQuestions.some(q => q.word === word)) {
            // console.warn(`Skipping invalid or duplicate word generation attempt: ${word}`);
            continue; // Skip this attempt if generation failed or word is duplicate
        }

        // Generate distractors (simple approach: generate more words of the same theme)
        const options = [word];
        let distractorAttempts = 0;
        const maxDistractorAttempts = 30; // Increased attempts
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
        alert(`Could only generate ${currentQuestions.length} unique questions for this theme. Please try another theme or 'All'.`);
        return false;
    }

     console.log("Generated questions:", currentQuestions);
     return true;
}

// Display the current question
function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        console.log("Attempted to display question beyond round limit.");
        showGameOver("round_complete");
        return;
    }
    const q = currentQuestions[currentQuestionIndex];
    gameDefinition.textContent = q.definition; // Use corrected variable
    choicesArea.innerHTML = ''; // Clear previous options using corrected variable
    q.options.forEach(option => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => handleAnswer(option, button);
        li.appendChild(button);
        choicesArea.appendChild(li); // Use corrected variable
    });
    feedbackText.textContent = '';
    feedbackText.parentElement.classList.add('hidden'); // Hide feedback area initially
    nextQuestionButton.style.display = 'none'; // Hide next button until answer is given
    gamePlayArea.classList.remove('hidden'); // Show game area using corrected variable
    updateScoreboard();
}

// Handle the user's answer selection
function handleAnswer(selectedOption, selectedButton) {
    const correctAnswer = currentQuestions[currentQuestionIndex].answer;
    const buttons = choicesArea.querySelectorAll('button'); // Use corrected variable
    buttons.forEach(button => {
        button.disabled = true; // Disable all options
        if (button.textContent === correctAnswer) {
            button.classList.add('correct');
        }
    });

    feedbackText.parentElement.classList.remove('hidden'); // Show feedback area

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
    scoreSpan.textContent = score; // Use corrected variable
    missesSpan.textContent = maxMisses - misses; // Use corrected variable
    const displayIndex = Math.min(currentQuestionIndex + 1, questionsPerRound);
    questionNumberSpan.textContent = `${displayIndex}`; // Use corrected variable (just the number)
}

// Show the game over screen
function showGameOver(reason) {
     console.log("Game Over. Reason:", reason);
     gamePlayArea.classList.add('hidden'); // Use corrected variable
     gameOverDiv.classList.remove('hidden'); // Use corrected variable
     finalScoreSpan.textContent = score; // Use corrected variable
     nextQuestionButton.style.display = 'none';
}

// Reset the game state and UI for a new game
function resetGame() {
    score = 0;
    misses = 0;
    currentQuestionIndex = 0;
    currentQuestions = [];
    gameOverDiv.classList.add('hidden'); // Use corrected variable
    gamePlayArea.classList.add('hidden'); // Use corrected variable
    gameSetupArea.classList.remove('hidden'); // Show theme selection again using corrected variable
    feedbackText.textContent = '';
    feedbackText.parentElement.classList.add('hidden');
    if (gameThemeSelect) gameThemeSelect.value = 'all'; // Reset dropdown selection
    updateScoreboard();
}

// Start a new game round
function startGame() {
    if (!gameThemeSelect) {
        console.error("Game theme select element not found!");
        return;
    }
    selectedGameTheme = gameThemeSelect.value;
    console.log(`Starting game with theme: ${selectedGameTheme}`);
    gameSetupArea.classList.add('hidden'); // Hide theme selection using corrected variable
    gameOverDiv.classList.add('hidden'); // Hide game over area using corrected variable

    score = 0;
    misses = 0;
    currentQuestionIndex = 0;

    if (generateQuestions(selectedGameTheme)) {
        gamePlayArea.classList.remove('hidden'); // Show question area only if questions generated, use corrected variable
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
        document.body.innerHTML = "<h1>Error: Failed to load game elements. Check console.</h1>";
        return;
    }

    // Initial UI state
    gamePlayArea.classList.add('hidden');
    gameOverDiv.classList.add('hidden');
    nextQuestionButton.style.display = 'none';
    gameSetupArea.classList.remove('hidden');
    feedbackText.parentElement.classList.add('hidden');

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
             if(gameThemeSelect) gameThemeSelect.innerHTML = '<option value="error">Error loading themes</option>';
        }
    }, { once: true }); // Run only once

     // Check if themes might already be loaded before this listener is added
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


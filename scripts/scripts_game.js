const wordList = ['apple', 'house', 'smile', 'river', 'cloud']; // Replace with larger dictionary
const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
let attempts = 0;
const maxAttempts = 6;

function validateGuess(guess) {
    if (guess.length !== 5 || !wordList.includes(guess.toLowerCase())) {
        return false;
    }
    return true;
}

function provideFeedback(guess) {
    const feedback = [];
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === targetWord[i]) {
            feedback.push('correct');
        } else if (targetWord.includes(guess[i])) {
            feedback.push('present');
        } else {
            feedback.push('absent');
        }
    }
    return feedback;
}

function handleGuess() {
    const input = document.getElementById('guess-input').value.toLowerCase();
    if (!validateGuess(input)) {
        alert('Please enter a valid 5-letter word.');
        return;
    }

    const feedback = provideFeedback(input);
    displayFeedback(input, feedback);
    attempts++;

    if (input === targetWord) {
        alert('Congratulations! You won!');
        resetGame();
    } else if (attempts >= maxAttempts) {
        alert(`Game Over! The word was ${targetWord}.`);
        resetGame();
    }
}

function displayFeedback(guess, feedback) {
    const row = document.createElement('div');
    row.className = 'guess-row';
    for (let i = 0; i < guess.length; i++) {
        const tile = document.createElement('span');
        tile.textContent = guess[i].toUpperCase();
        tile.className = `tile ${feedback[i]}`;
        row.appendChild(tile);
    }
    document.getElementById('game-container').appendChild(row);
}

function resetGame() {
    attempts = 0;
    document.getElementById('game-container').innerHTML = '';
    document.getElementById('guess-input').value = '';
}

document.getElementById('submit-guess').addEventListener('click', handleGuess);
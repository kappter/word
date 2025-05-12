const realWords = ['table', 'chair', 'light', 'water', 'stone']; // Replace with larger dictionary
const letters = 'abcdefghijklmnopqrstuvwxyz';
let score = 0;

function generateFakeWord(length) {
    let fakeWord = '';
    for (let i = 0; i < length; i++) {
        fakeWord += letters[Math.floor(Math.random() * letters.length)];
    }
    return fakeWord;
}

function getNextWord() {
    const isReal = Math.random() > 0.5;
    const word = isReal ? realWords[Math.floor(Math.random() * realWords.length)] : generateFakeWord(5);
    return { word, isReal };
}

function displayWord() {
    const { word, isReal } = getNextWord();
    document.getElementById('word-display').textContent = word.toUpperCase();
    document.getElementById('real-btn').onclick = () => checkGuess(true, isReal, word);
    document.getElementById('fake-btn').onclick = () => checkGuess(false, isReal, word);
}

function checkGuess(userGuess, isReal, word) {
    const correct = userGuess === isReal;
    if (correct) {
        score++;
        alert(`Correct! "${word}" is ${isReal ? 'real' : 'fake'}.`);
    } else {
        alert(`Incorrect! "${word}" is ${isReal ? 'real' : 'fake'}.`);
    }
    document.getElementById('score').textContent = `Score: ${score}`;
    displayWord();
}

document.addEventListener('DOMContentLoaded', displayWord);

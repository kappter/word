document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();

    const startButton = document.getElementById("startGameButton");
    const submitButton = document.getElementById("submitAnswerButton");
    const nextButton = document.getElementById("nextQuestionButton");
    const gameArea = document.getElementById("gameArea");
    const scoreDisplay = document.getElementById("score");
    const questionDisplay = document.getElementById("question");
    const answersList = document.getElementById("answers");
    const feedbackDisplay = document.getElementById("feedback");
    const gameThemeType = document.getElementById("gameThemeType");
    const gamePermutationType = document.getElementById("gamePermutationType");

    if (!startButton || !submitButton || !nextButton || !gameArea || !scoreDisplay || !questionDisplay || !answersList || !feedbackDisplay || !gameThemeType || !gamePermutationType) {
        console.error("One or more game elements are missing:", { startButton, submitButton, nextButton, gameArea, scoreDisplay, questionDisplay, answersList, feedbackDisplay, gameThemeType, gamePermutationType });
        return;
    }

    let score = 0;
    let currentQuestion = null;
    let answered = false;

    startButton.addEventListener("click", () => {
        console.log("Start game button clicked.");
        startGame();
    });

    submitButton.addEventListener("click", () => {
        console.log("Submit answer button clicked.");
        submitAnswer();
    });

    nextButton.addEventListener("click", () => {
        console.log("Next question button clicked.");
        generateQuestion();
    });

    gameThemeType.addEventListener("change", () => {
        if (currentQuestion) generateQuestion();
    });

    gamePermutationType.addEventListener("change", () => {
        if (currentQuestion) generateQuestion();
    });

    function startGame() {
        score = 0;
        scoreDisplay.textContent = `Score: ${score}`;
        gameArea.classList.remove("hidden");
        startButton.classList.add("hidden");
        generateQuestion();
    }

    function generateQuestion() {
        console.log("Generating new question...");
        const selectedTheme = gameThemeType.value;
        const selectedWordType = gamePermutationType.value;

        if (Object.keys(themes).length === 0 && selectedTheme !== 'all') {
            questionDisplay.textContent = "Please wait for data to load.";
            answersList.innerHTML = "";
            return;
        }

        // Generate the correct answer
        const correctAnswer = generateWordAndDefinition(selectedWordType, selectedTheme, { excludeExample: true });
        currentQuestion = {
            definition: correctAnswer.definition,
            correctWord: correctAnswer.word,
            pos: correctAnswer.pos,
            answers: [correctAnswer.word]
        };

        // Generate 3 incorrect answers
        while (currentQuestion.answers.length < 4) {
            const wrongAnswer = generateWordAndDefinition(selectedWordType, selectedTheme, { excludeExample: true });
            if (wrongAnswer.word && wrongAnswer.word !== currentQuestion.correctWord && !currentQuestion.answers.includes(wrongAnswer.word)) {
                currentQuestion.answers.push(wrongAnswer.word);
            }
        }

        // Shuffle answers
        currentQuestion.answers = currentQuestion.answers.sort(() => Math.random() - 0.5);

        // Display question and answers
        questionDisplay.textContent = currentQuestion.definition || "No definition available.";
        answersList.innerHTML = currentQuestion.answers
            .map(answer => `<li><button class="answer-btn" data-answer="${answer}">${answer}</button></li>`)
            .join('');

        feedbackDisplay.textContent = "";
        submitButton.classList.remove("hidden");
        nextButton.classList.add("hidden");
        answered = false;

        // Add event listeners to answer buttons
        const answerButtons = document.querySelectorAll(".answer-btn");
        answerButtons.forEach(button => {
            button.removeEventListener("click", selectAnswer);
            button.addEventListener("click", selectAnswer);
        });

        console.log("Question generated:", currentQuestion);
    }

    function selectAnswer(event) {
        if (answered) return;
        const selectedAnswer = event.target.getAttribute("data-answer");
        const answerButtons = document.querySelectorAll(".answer-btn");
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.getAttribute("data-answer") === currentQuestion.correctWord) {
                btn.classList.add("correct");
            }
            if (btn.getAttribute("data-answer") === selectedAnswer && selectedAnswer !== currentQuestion.correctWord) {
                btn.classList.add("incorrect");
            }
        });
        answered = true;
        submitButton.classList.add("hidden");
        nextButton.classList.remove("hidden");
    }

    function submitAnswer() {
        if (answered) return;
        const selectedButton = document.querySelector(".answer-btn.selected");
        if (!selectedButton) {
            feedbackDisplay.textContent = "Please select an answer.";
            return;
        }

        const selectedAnswer = selectedButton.getAttribute("data-answer");
        answered = true;

        if (selectedAnswer === currentQuestion.correctWord) {
            score += 10;
            feedbackDisplay.textContent = "Correct!";
            feedbackDisplay.className = "feedback correct";
            scoreDisplay.textContent = `Score: ${score}`;
        } else {
            feedbackDisplay.textContent = `Incorrect. The correct answer was "${currentQuestion.correctWord}".`;
            feedbackDisplay.className = "feedback incorrect";
        }

        const answerButtons = document.querySelectorAll(".answer-btn");
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.getAttribute("data-answer") === currentQuestion.correctWord) {
                btn.classList.add("correct");
            }
            if (btn.getAttribute("data-answer") === selectedAnswer && selectedAnswer !== currentQuestion.correctWord) {
                btn.classList.add("incorrect");
            }
        });

        submitButton.classList.add("hidden");
        nextButton.classList.remove("hidden");
    }
});
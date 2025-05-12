// uiHandler.js
function updateDisplay() {
    const generatedWordEl = document.getElementById('generatedWord');
    const likeMainWordButton = document.getElementById('likeMainWordButton');
    const pronunciationEl = document.getElementById('pronunciation');
    const wordDefinitionEl = document.getElementById('wordDefinition');
    const otherFormsEl = document.getElementById('otherForms');
    const amalgamationsEl = document.getElementById('amalgamations');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById('themeType');

    if (!permutationType || !themeType || !generatedWordEl || !likeMainWordButton || !pronunciationEl || !wordDefinitionEl || !otherFormsEl || !amalgamationsEl) {
        console.error("One or more required elements are missing:", { generatedWordEl, likeMainWordButton, pronunciationEl, wordDefinitionEl, otherFormsEl, amalgamationsEl, permutationType, themeType });
        return;
    }

    const selectedWordType = permutationType.value;
    const selectedTheme = themeType.value;

    if (Object.keys(themes).length === 0 && selectedTheme !== 'all') {
        generatedWordEl.textContent = "Loading...";
        likeMainWordButton.setAttribute('data-word', '');
        likeMainWordButton.textContent = '🤍';
        pronunciationEl.textContent = "";
        wordDefinitionEl.textContent = "Please wait for data to load.";
        otherFormsEl.innerHTML = "";
        amalgamationsEl.innerHTML = "<li>Loading...</li>";
        return;
    }

    const { word, definition, pronunciation, parts } = generateWordAndDefinition(selectedWordType, selectedTheme);
    generatedWordEl.textContent = word || "No word generated";
    likeMainWordButton.setAttribute('data-word', word);
    likeMainWordButton.textContent = getLikeStatus(word) ? '❤️' : '🤍';
    pronunciationEl.textContent = pronunciation;
    wordDefinitionEl.textContent = definition || "No definition available.";
    otherFormsEl.innerHTML = generateOtherForms(word, parts, selectedWordType, selectedTheme)
        .map(f => `<li>${f.word} (${f.pos}): ${f.def} ${f.example}</li>`).join('');
    amalgamationsEl.innerHTML = generateAmalgamations(parts, word)
        .map(a => `<li><span class="permutation" data-word="${a}">${a}</span> <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
    updateLikes();
    updateLikedWordsDisplay();
}

function copyToClipboard() {
    const generatedWord = document.getElementById('generatedWord')?.textContent || '';
    const wordDefinition = document.getElementById('wordDefinition')?.textContent || '';
    if (!generatedWord) return;

    const textToCopy = `Word: ${generatedWord}\nDefinition: ${wordDefinition}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = originalText; }, 1500);
        }
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text.');
    });
}

function shuffleAmalgamations() {
    const amalgamationsEl = document.getElementById('amalgamations');
    const generatedWordEl = document.getElementById('generatedWord');

    if (!amalgamationsEl || !generatedWordEl) {
        console.error("Required elements for shuffling are missing:", { amalgamationsEl, generatedWordEl });
        return;
    }

    const wordText = generatedWordEl.textContent;
    if (!wordText || wordText === "No word generated") {
        console.warn("No generated word available to shuffle.");
        amalgamationsEl.innerHTML = '<li>No word parts available to shuffle.</li>';
        return;
    }

    const parts = wordText.split('-');
    if (parts.length < 2 || parts[0] === "") {
        console.warn("Not enough parts to shuffle:", parts);
        amalgamationsEl.innerHTML = '<li>Not enough parts to shuffle.</li>';
        return;
    }

    const permutations = generateAmalgamations(parts, wordText);
    if (permutations.length === 0 || permutations[0] === "No permutations available") {
        amalgamationsEl.innerHTML = '<li>No permutations generated.</li>';
    } else {
        amalgamationsEl.innerHTML = permutations
            .map(a => `<li><span class="permutation" data-word="${a}">${a}</span> <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
    }
    updateLikes();
    updateLikedWordsDisplay();
    addPermutationClickHandlers();
}

function getLikeStatus(word) {
    return JSON.parse(localStorage.getItem('likedWords') || '{}')[word] || false;
}

function toggleLike(event) {
    const button = event.target;
    const word = button.getAttribute('data-word');
    const likedWords = JSON.parse(localStorage.getItem('likedWords') || '{}');
    likedWords[word] = !likedWords[word];
    localStorage.setItem('likedWords', JSON.stringify(likedWords));
    button.textContent = getLikeStatus(word) ? '❤️' : '🤍';
    updateLikedWordsDisplay();
}

function updateLikes() {
    const buttons = document.querySelectorAll('.like-btn');
    if (buttons.length === 0) {
        console.log("No like buttons found to update.");
        return;
    }
    buttons.forEach(button => {
        const word = button.getAttribute('data-word');
        button.textContent = getLikeStatus(word) ? '❤️' : '🤍';
        button.removeEventListener('click', toggleLike);
        button.addEventListener('click', toggleLike);
    });
}

function clearLikes() {
    localStorage.setItem('likedWords', JSON.stringify({}));
    updateLikes();
    updateLikedWordsDisplay();
}

function updateLikedWordsDisplay() {
    const likedWordsEl = document.getElementById('likedWords');
    if (!likedWordsEl) {
        console.error("Liked words element not found.");
        return;
    }

    const likedWords = JSON.parse(localStorage.getItem('likedWords') || '{}');
    const likedWordsList = Object.keys(likedWords).filter(word => likedWords[word]);
    
    if (likedWordsList.length === 0) {
        likedWordsEl.innerHTML = '<li>No liked words yet.</li>';
    } else {
        likedWordsEl.innerHTML = likedWordsList
            .map(word => `<li class="liked-word" data-word="${word}">${word}</li>`)
            .join('');
    }
    addLikedWordClickHandlers();
}

function addLikedWordClickHandlers() {
    const likedWords = document.querySelectorAll('.liked-word');
    likedWords.forEach(lw => {
        lw.removeEventListener('click', loadLikedWord);
        lw.addEventListener('click', loadLikedWord);
    });
}

function loadLikedWord(event) {
    const word = event.target.getAttribute('data-word');
    const generatedWordEl = document.getElementById('generatedWord');
    const likeMainWordButton = document.getElementById('likeMainWordButton');
    const pronunciationEl = document.getElementById('pronunciation');
    const wordDefinitionEl = document.getElementById('wordDefinition');
    const otherFormsEl = document.getElementById('otherForms');
    const amalgamationsEl = document.getElementById('amalgamations');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById('themeType');

    if (generatedWordEl && likeMainWordButton && pronunciationEl && wordDefinitionEl && otherFormsEl && amalgamationsEl && permutationType && themeType) {
        generatedWordEl.textContent = word;
        likeMainWordButton.setAttribute('data-word', word);
        likeMainWordButton.textContent = getLikeStatus(word) ? '❤️' : '🤍';
        pronunciationEl.textContent = generatePronunciation(word);

        const selectedWordType = 'pre-root-suf';
        const selectedTheme = themeType.value;

        const parts = word.split('-');
        let prefix = '', root1 = '', root2 = '', suffix = '';
        let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
        let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;
        let rootPos1 = 'noun', rootPos2 = 'noun';

        const themeData = selectedTheme === 'all' ? themes['normal'] : themes[selectedTheme];
        if (parts.length >= 1) prefix = parts[0] || '', prefixDef = themeData.prefixDefs[themeData.prefixes.indexOf(prefix)] || '';
        if (parts.length >= 2) {
            root1 = parts[1] || '';
            root1Index = themeData.roots.indexOf(root1);
            rootDef1 = themeData.rootDefs[root1Index] || '';
            rootPos1 = themeData.rootPos[root1Index] || 'noun';
        }
        if (parts.length >= 3) {
            root2 = parts[2] || '';
            root2Index = themeData.roots.indexOf(root2);
            rootDef2 = themeData.rootDefs[root2Index] || '';
            rootPos2 = themeData.rootPos[root2Index] || 'noun';
        }
        if (parts.length >= 3) suffix = parts[parts.length - 1] || '', suffixDef = themeData.suffixDefs[themeData.suffixes.indexOf(suffix)] || '';

        const pos = getPartOfSpeech(selectedWordType, suffixIndex, root1Index, root2Index, selectedTheme);
        const definition = generateSentenceDefinition(selectedWordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, suffix, root1, root2, rootPos1, rootPos2, selectedTheme);
        const example = generateExampleSentence(word, pos, selectedTheme, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2);
        wordDefinitionEl.textContent = `${definition} ${example}`;

        otherFormsEl.innerHTML = "";
        amalgamationsEl.innerHTML = generateAmalgamations(parts, word)
            .map(a => `<li><span class="permutation" data-word="${a}">${a}</span> <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
        updateLikes();
        updateLikedWordsDisplay();
    }
}

function addPermutationClickHandlers() {
    const permutations = document.querySelectorAll('.permutation');
    permutations.forEach(p => {
        p.removeEventListener('click', loadPermutation);
        p.addEventListener('click', loadPermutation);
    });
}

function loadPermutation(event) {
    const word = event.target.getAttribute('data-word');
    const generatedWordEl = document.getElementById('generatedWord');
    const likeMainWordButton = document.getElementById('likeMainWordButton');
    const pronunciationEl = document.getElementById('pronunciation');
    const wordDefinitionEl = document.getElementById('wordDefinition');
    const otherFormsEl = document.getElementById('otherForms');
    const amalgamationsEl = document.getElementById('amalgamations');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById('themeType');

    if (generatedWordEl && likeMainWordButton && pronunciationEl && wordDefinitionEl && otherFormsEl && amalgamationsEl && permutationType && themeType) {
        generatedWordEl.textContent = word;
        likeMainWordButton.setAttribute('data-word', word);
        likeMainWordButton.textContent = getLikeStatus(word) ? '❤️' : '🤍';
        pronunciationEl.textContent = generatePronunciation(word);

        const selectedWordType = permutationType.value;
        const selectedTheme = themeType.value;

        const parts = word.split('-');
        let prefix = '', root1 = '', root2 = '', suffix = '';
        let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
        let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;
        let rootPos1 = 'noun', rootPos2 = 'noun';

        const themeData = selectedTheme === 'all' ? themes['normal'] : themes[selectedTheme];
        if (parts.length >= 1) prefix = parts[0] || '', prefixDef = themeData.prefixDefs[themeData.prefixes.indexOf(prefix)] || '';
        if (parts.length >= 2) {
            root1 = parts[1] || '';
            root1Index = themeData.roots.indexOf(root1);
            rootDef1 = themeData.rootDefs[root1Index] || '';
            rootPos1 = themeData.rootPos[root1Index] || 'noun';
        }
        if (parts.length >= 3) {
            root2 = parts[2] || '';
            root2Index = themeData.roots.indexOf(root2);
            rootDef2 = themeData.rootDefs[root2Index] || '';
            rootPos2 = themeData.rootPos[root2Index] || 'noun';
        }
        if (parts.length >= 3) suffix = parts[parts.length - 1] || '', suffixDef = themeData.suffixDefs[themeData.suffixes.indexOf(suffix)] || '';

        const pos = getPartOfSpeech(selectedWordType, suffixIndex, root1Index, root2Index, selectedTheme);
        const definition = generateSentenceDefinition(selectedWordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, suffix, root1, root2, rootPos1, rootPos2, selectedTheme);
        const example = generateExampleSentence(word, pos, selectedTheme, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2);
        wordDefinitionEl.textContent = `${definition} ${example}`;

        otherFormsEl.innerHTML = "";
        amalgamationsEl.innerHTML = generateAmalgamations(parts, word)
            .map(a => `<li><span class="permutation" data-word="${a}">${a}</span> <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
        updateLikes();
        updateLikedWordsDisplay();
    }
}

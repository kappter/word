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

function updateDisplay() {
    // Get DOM elements
    const themeDropdown = document.getElementById("theme-dropdown");
    const permutationType = document.getElementById("permutationType");
    const generatedWordElement = document.getElementById("generatedWord");
    const pronunciationElement = document.getElementById("pronunciation");
    const wordDefinitionElement = document.getElementById("wordDefinition");
    const likeMainWordButton = document.getElementById("likeMainWordButton");
    const otherFormsElement = document.getElementById("otherForms");
    const amalgamationsElement = document.getElementById("amalgamations");

    // Validate elements
    const missingElements = [];
    if (!generatedWordElement) missingElements.push("generatedWordElement");
    if (!pronunciationElement) missingElements.push("pronunciationElement");
    if (!wordDefinitionElement) missingElements.push("wordDefinitionElement");
    if (!likeMainWordButton) missingElements.push("likeMainWordButton");
    if (!otherFormsElement) missingElements.push("otherFormsElement");
    if (!amalgamationsElement) missingElements.push("amalgamationsElement");

    if (missingElements.length > 0) {
        console.error(`Missing required elements: ${missingElements.join(", ")}`);
        return;
    }

    // Get selected values with fallbacks
    let theme = themeDropdown ? themeDropdown.value : "normal";
    const wordType = permutationType ? permutationType.value : "pre-root-suf";

    // Ensure theme is valid
    if (!theme) {
        console.warn("Theme is empty, defaulting to 'normal'.");
        theme = "normal";
    }

    // Check if themes are loaded
    if (!window.themes || !window.themes[theme]) {
        console.error(`Theme ${theme} not loaded.`);
        generatedWordElement.textContent = "Error: Theme not loaded";
        wordDefinitionElement.textContent = "";
        pronunciationElement.textContent = "";
        likeMainWordButton.dataset.word = "";
        otherFormsElement.innerHTML = "";
        amalgamationsElement.innerHTML = "";
        return;
    }

    // Generate word and definition
    const wordData = generateWordAndDefinition(wordType, theme, { removeHyphens: true });

    // Update main word display
    generatedWordElement.textContent = wordData.word || "No word generated";
    pronunciationElement.textContent = wordData.pronunciation || "";
    wordDefinitionElement.textContent = wordData.definition || "No definition available";
    likeMainWordButton.dataset.word = wordData.word || "";

    // Update other forms (e.g., plural, adjective forms)
    otherFormsElement.innerHTML = "";
    if (wordData.word) {
        const baseWord = wordData.word.toLowerCase();
        const otherForms = [];
        if (wordData.parts.suffix && wordData.parts.suffix.endsWith("y") && !["a", "e", "i", "o", "u"].includes(wordData.parts.root1?.slice(-1))) {
            otherForms.push(`${baseWord.slice(0, -1)}ies`); // Plural for y-ending words
        } else if (wordData.parts.suffix && ["s", "x", "z", "ch", "sh"].some(end => wordData.word.endsWith(end))) {
            otherForms.push(`${baseWord}es`); // Plural for s, x, z, ch, sh endings
        } else {
            otherForms.push(`${baseWord}s`); // Standard plural
        }
        if (wordData.parts.suffix && ["able", "ible"].some(suf => wordData.parts.suffix.includes(suf))) {
            otherForms.push(`${baseWord.slice(0, -4)}ity`); // Adjective to noun (e.g., readable -> readability)
        }
        otherFormsElement.innerHTML = otherForms.map(form => `<li>${form}</li>`).join("");
    }

    // Update amalgamations (playful combinations)
    amalgamationsElement.innerHTML = "";
    if (wordData.word && window.themes[theme]) {
        const { prefixes, roots, suffixes } = window.themes[theme];
        const maxAmalgamations = 3;
        const amalgamations = new Set();
        const validPrefixes = prefixes.filter(item => item && item.term);
        const validRoots = roots.filter(item => item && item.term);
        const validSuffixes = suffixes.filter(item => item && item.term);
        while (amalgamations.size < maxAmalgamations && (validPrefixes.length > 0 || validRoots.length > 0 || validSuffixes.length > 0)) {
            const randPrefix = validPrefixes.length > 0 ? validPrefixes[Math.floor(Math.random() * validPrefixes.length)].term : "";
            const randRoot = validRoots.length > 0 ? validRoots[Math.floor(Math.random() * validRoots.length)].term : "";
            const randSuffix = validSuffixes.length > 0 ? validSuffixes[Math.floor(Math.random() * validSuffixes.length)].term : "";
            const amalgamation = (randPrefix + randRoot + randSuffix)
                .replace(/^-/, "")
                .replace(/-$/, "")
                .replace(/-+/g, "-");
            if (amalgamation && amalgamation !== wordData.word) {
                amalgamations.add(amalgamation);
            }
        }
        amalgamationsElement.innerHTML = Array.from(amalgamations).map(am => `<li>${am}</li>`).join("");
    }
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

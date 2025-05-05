// Function to parse CSV content with handling for quoted fields
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
        console.error("CSV file is empty or only contains headers.");
        return [];
    }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const result = [];
    const expectedColumns = headers.length;

    if (!headers.includes("type") || !headers.includes("part") || !headers.includes("term") || !headers.includes("definition")) {
        console.error("CSV file is missing required headers (type, part, term, definition).");
        alert("CSV file is missing required headers (type, part, term, definition).");
        return [];
    }

    const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;

        let columns = [];
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(currentLine))) {
            let value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
            columns.push((value || "").trim());
            if (match[0].endsWith(",")) continue;
            if (match[0] === "" && regex.lastIndex === currentLine.length) break;
            if (regex.lastIndex === currentLine.length) break;
        }
        if (columns.length > expectedColumns && columns[columns.length - 1] === "") {
            columns.pop();
        }

        if (columns.length === expectedColumns) {
            const entry = {};
            let validEntry = true;
            headers.forEach((header, index) => {
                const value = columns[index];
                if ((header === "type" || header === "part" || header === "term") && !value) {
                    validEntry = false;
                }
                entry[header] = value;
            });

            if (validEntry && entry.type) {
                entry.type = entry.type.toLowerCase();
                if (!entry.type) {
                    validEntry = false;
                }
            } else if (validEntry && !entry.type) {
                validEntry = false;
            }

            if (validEntry) {
                const validParts = ["prefix", "root", "suffix"];
                if (!entry.part || !validParts.includes(entry.part.toLowerCase())) {
                    validEntry = false;
                } else {
                    entry.part = entry.part.toLowerCase();
                }
            }

            if (validEntry) {
                if (!entry.term) {
                    validEntry = false;
                }
            }

            if (validEntry) {
                result.push(entry);
            }
        }
    }
    console.log(`Successfully parsed ${result.length} valid entries from CSV.`);
    return result;
}

// Themes object (will be populated dynamically from CSV)
const themes = {};
let themesLoadedPromise = null;

// Function to load and organize data from word_parts.csv
async function loadWordParts() {
    if (themesLoadedPromise) return themesLoadedPromise;

    themesLoadedPromise = new Promise(async (resolve, reject) => {
        const loadingElement = document.getElementById("loading");
        if (loadingElement) loadingElement.classList.remove("hidden");

        try {
            const response = await fetch("data/word_parts.csv");
            if (!response.ok) throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);
            const csvText = await response.text();
            const data = parseCSV(csvText);

            for (const key in themes) delete themes[key];

            data.forEach(({ type, part, term, definition }) => {
                if (!themes[type]) {
                    themes[type] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], suffixes: [], suffixDefs: [] };
                }
                let cleanedTerm = term;
                if (part === "prefix") cleanedTerm = term.replace(/-+$/, "");
                else if (part === "suffix") cleanedTerm = term.replace(/^-+/, "");
                if (cleanedTerm) {
                    if (part === "prefix") {
                        themes[type].prefixes.push(cleanedTerm);
                        themes[type].prefixDefs.push(definition || "");
                    } else if (part === "root") {
                        themes[type].roots.push(cleanedTerm);
                        themes[type].rootDefs.push(definition || "");
                    } else if (part === "suffix") {
                        themes[type].suffixes.push(cleanedTerm);
                        themes[type].suffixDefs.push(definition || "");
                    }
                }
            });

            document.dispatchEvent(new CustomEvent('themesLoaded'));
            resolve(themes);
        } catch (error) {
            console.error("Error loading or processing word parts:", error);
            alert("Failed to load word parts data. Check console and ensure data/word_parts.csv is accessible.");
            reject(error);
        } finally {
            if (loadingElement) loadingElement.classList.add("hidden");
        }
    });

    return themesLoadedPromise;
}

function populateThemeDropdown() {
    const themeDropdown = document.getElementById("themeType") || document.getElementById("gameThemeType");
    if (!themeDropdown) return;

    themeDropdown.innerHTML = '';
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    themeDropdown.appendChild(allOption);

    Object.keys(themes).sort().forEach(themeKey => {
        const themeData = themes[themeKey];
        if (themeData && themeData.prefixes.length > 0 && themeData.roots.length > 0 && themeData.suffixes.length > 0) {
            const option = document.createElement("option");
            option.value = themeKey;
            option.text = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
            themeDropdown.appendChild(option);
        }
    });
    themeDropdown.value = "all";
}

function getRandomElement(arr) {
    if (!arr || arr.length === 0) return { element: null, index: -1 };
    const index = Math.floor(Math.random() * arr.length);
    return { element: arr[index], index: index };
}

function generateWordAndDefinition(wordType, themeKey, options = {}) {
    let prefix = '', root1 = '', root2 = '', suffix = '';
    let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
    let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;

    const allPrefixes = [], allPrefixDefs = [];
    const allRoots = [], allRootDefs = [];
    const allSuffixes = [], allSuffixDefs = [];

    if (themeKey === 'all') {
        Object.values(themes).forEach(themeData => {
            allPrefixes.push(...themeData.prefixes);
            allPrefixDefs.push(...themeData.prefixDefs);
            allRoots.push(...themeData.roots);
            allRootDefs.push(...themeData.rootDefs);
            allSuffixes.push(...themeData.suffixes);
            allSuffixDefs.push(...themeData.suffixDefs);
        });
    } else {
        if (!themes[themeKey] || !themes[themeKey].prefixes.length || !themes[themeKey].roots.length || !themes[themeKey].suffixes.length) {
            themeKey = 'normal';
        }
    }

    const getParts = (partType) => {
        const source = themeKey === 'all' ? { prefixes: allPrefixes, prefixDefs: allPrefixDefs, roots: allRoots, rootDefs: allRootDefs, suffixes: allSuffixes, suffixDefs: allSuffixDefs } : themes[themeKey];
        switch (partType) {
            case 'prefix': return { elements: source.prefixes, defs: source.prefixDefs };
            case 'root': return { elements: source.roots, defs: source.rootDefs };
            case 'suffix': return { elements: source.suffixes, defs: source.suffixDefs };
            default: return { elements: [], defs: [] };
        }
    };

    if (wordType === 'pre-root-suf' || wordType === 'pre-root') {
        const { elements, defs } = getParts('prefix');
        const result = getRandomElement(elements);
        prefix = result.element;
        prefixIndex = result.index;
        prefixDef = defs[prefixIndex] || '';
    }
    if (wordType.includes('root')) {
        const { elements, defs } = getParts('root');
        const result1 = getRandomElement(elements);
        root1 = result1.element;
        root1Index = result1.index;
        rootDef1 = defs[root1Index] || '';

        if (wordType === 'pre-root-root-suf' || wordType === 'root-root' || wordType === 'pre-root-root') {
            const result2 = getRandomElement(elements);
            root2 = result2.element;
            root2Index = result2.index;
            rootDef2 = defs[root2Index] || '';
        }
    }
    if (wordType.endsWith('suf')) {
        const { elements, defs } = getParts('suffix');
        const result = getRandomElement(elements);
        suffix = result.element;
        suffixIndex = result.index;
        suffixDef = defs[suffixIndex] || '';
    }

    const parts = [prefix, root1, root2, suffix].filter(part => part && part.trim() !== '');
    let word = parts.join('-').replace(/--+/g, '-');
    if (options.removeHyphens) {
        word = word.replace(/-/g, '');
    }
    const definition = generateSentenceDefinition(wordType, prefixDef, rootDef1, rootDef2, suffixDef, suffixIndex, themeKey === 'all' ? 'normal' : themeKey);
    const pronunciation = generatePronunciation(word);

    return { word, definition, pronunciation, parts };
}

function generatePronunciation(word) {
    return `/${word.replace(/-/g, ' / ')}/`;
}

function getPartOfSpeech(type, suffixIndex, theme) {
    if (type.endsWith('suf') && suffixIndex !== -1) {
        const source = theme === 'all' ? null : themes[theme];
        let suffix = '';
        if (source && source.suffixes.length > suffixIndex) suffix = source.suffixes[suffixIndex];

        if (['ly', 'th'].includes(suffix)) return 'adverb';
        if (['ize', 'ify', 'en', 'ate'].includes(suffix)) return 'verb';
        if (['ous', 'al', 'an', 'ile', 'ic', 'esque', 'ful', 'ious', 'ar', 'able', 'ible', 'ish', 'ive', 'less', 'some', 'y'].includes(suffix)) return 'adjective';
        if (['ics', 'ism', 'ist', 'ity', 'ty', 'ment', 'ness', 'ion', 'tion', 'sion', 'ship', 'dom', 'hood', 'logy', 'ology', 'phobia', 'philia', 'er', 'or', 'ant', 'ent', 'ard', 'ry', 'cy', 'tude'].includes(suffix)) return 'noun';
    }
    return 'noun';
}

function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, suffixIndex, theme) {
    let definition = `(${getPartOfSpeech(type, suffixIndex, theme)}) `;
    const partsDefs = [preDef, rootDef1, rootDef2, sufDef].filter(def => def && def.trim() !== '');

    if (partsDefs.length === 0) {
        definition += "A generated word.";
    } else if (partsDefs.length === 1) {
        definition += `Related to ${partsDefs[0]}.`;
    } else {
        let combined = partsDefs[0];
        for (let i = 1; i < partsDefs.length; i++) {
            combined += (i === partsDefs.length - 1 ? ' and ' : ', ') + partsDefs[i];
        }
        definition += `Pertaining to ${combined}.`;
    }

    const firstCharIndex = definition.indexOf(')') + 2;
    if (firstCharIndex < definition.length) {
        definition = definition.substring(0, firstCharIndex) + definition.charAt(firstCharIndex).toUpperCase() + definition.slice(firstCharIndex + 1);
    }

    return definition;
}

function generateOtherForms(word, parts, type, theme) {
    const forms = [];
    const pos = getPartOfSpeech(type, parts.length > 0 ? parts.findIndex(p => p === parts[parts.length - 1]) : -1, theme);

    if (parts.length > 0) {
        forms.push({ word: parts[0], pos: 'noun', def: `A concept or thing related to ${parts[0]}. Example: Its presence was noted.` });
    }
    if (parts.length > 1) {
        forms.push({ word: parts.slice(0, 2).join('-'), pos: pos, def: `Pertaining to ${parts.slice(0, 2).join(' and ')}. Example: It had a characteristic appearance.` });
    }
    if (parts.length > 2) {
        forms.push({ word: parts.slice(0, 3).join('-'), pos: 'noun', def: `A connection thing involving ${parts.slice(0, 3).join(' and ')}. Example: Its presence was noted.` });
    }

    return forms;
}

function generateAmalgamations(parts) {
    if (!parts || parts.length < 2) {
        console.warn("Not enough parts to generate amalgamations:", parts);
        return [];
    }
    const amalgamations = [];
    for (let i = 0; i < parts.length; i++) {
        for (let j = 0; j < parts.length; j++) {
            if (i !== j) {
                amalgamations.push(`${parts[i]}-${parts[j]}`);
            }
        }
    }
    const uniqueAmalgamations = [...new Set(amalgamations)].slice(0, 5); // Limit to 5 unique combinations
    console.log("Generated amalgamations:", uniqueAmalgamations);
    return uniqueAmalgamations;
}

function updateDisplay() {
    const generatedWordEl = document.getElementById('generatedWord');
    const pronunciationEl = document.getElementById('pronunciation');
    const wordDefinitionEl = document.getElementById('wordDefinition');
    const otherFormsEl = document.getElementById('otherForms');
    const amalgamationsEl = document.getElementById('amalgamations');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById('themeType');

    if (!permutationType || !themeType || !generatedWordEl || !pronunciationEl || !wordDefinitionEl || !otherFormsEl || !amalgamationsEl) {
        console.error("One or more required elements are missing:", { generatedWordEl, pronunciationEl, wordDefinitionEl, otherFormsEl, amalgamationsEl, permutationType, themeType });
        return;
    }

    const selectedWordType = permutationType.value;
    const selectedTheme = themeType.value;

    if (Object.keys(themes).length === 0 && selectedTheme !== 'all') {
        generatedWordEl.textContent = "Loading...";
        pronunciationEl.textContent = "";
        wordDefinitionEl.textContent = "Please wait for data to load.";
        otherFormsEl.innerHTML = "";
        amalgamationsEl.innerHTML = "";
        return;
    }

    const { word, definition, pronunciation, parts } = generateWordAndDefinition(selectedWordType, selectedTheme);
    generatedWordEl.textContent = word;
    pronunciationEl.textContent = pronunciation;
    wordDefinitionEl.textContent = definition;
    otherFormsEl.innerHTML = generateOtherForms(word, parts, selectedWordType, selectedTheme)
        .map(f => `<li>${f.word} (${f.pos}): ${f.def}</li>`).join('');
    amalgamationsEl.innerHTML = generateAmalgamations(parts)
        .map(a => `<li>${a} <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
    updateLikes();
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
    if (!wordText) {
        console.warn("No generated word available to shuffle.");
        amalgamationsEl.innerHTML = '<li>No word parts available to shuffle.</li>';
        return;
    }

    const parts = wordText.split('-');
    if (parts.length < 2) {
        console.warn("Not enough parts to shuffle:", parts);
        amalgamationsEl.innerHTML = '<li>Not enough parts to shuffle.</li>';
        return;
    }

    const newAmalgamations = generateAmalgamations(parts);
    if (newAmalgamations.length === 0) {
        amalgamationsEl.innerHTML = '<li>No amalgamations generated.</li>';
    } else {
        amalgamationsEl.innerHTML = newAmalgamations
            .map(a => `<li>${a} <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
    }
    updateLikes();
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
}

function updateLikes() {
    const buttons = document.querySelectorAll('.like-btn');
    if (buttons.length === 0) {
        console.warn("No like buttons found to update.");
    }
    buttons.forEach(button => {
        const word = button.getAttribute('data-word');
        button.textContent = getLikeStatus(word) ? '❤️' : '🤍';
        button.removeEventListener('click', toggleLike); // Prevent duplicate listeners
        button.addEventListener('click', toggleLike);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();

    const generateButton = document.getElementById("generateButton");
    const copyButton = document.getElementById("copyButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const permutationType = document.getElementById("permutationType");
    const themeType = document.getElementById("themeType");

    if (!generateButton || !copyButton || !shuffleButton || !permutationType || !themeType) {
        console.error("One or more interactive elements are missing:", { generateButton, copyButton, shuffleButton, permutationType, themeType });
        return;
    }

    generateButton.addEventListener("click", updateDisplay);
    copyButton.addEventListener("click", copyToClipboard);
    shuffleButton.addEventListener("click", () => {
        console.log("Shuffle button clicked.");
        shuffleAmalgamations();
    });
    permutationType.addEventListener("change", updateDisplay);
    themeType.addEventListener("change", updateDisplay);
    updateDisplay();
});
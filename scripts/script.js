// Declare themesLoadedPromise at the top level
let themesLoadedPromise = null;

// Themes object (will be populated dynamically from CSV)
const themes = {};

// Possible endings for noun definitions to add variety
const nounEndings = ["traits", "properties", "attributes", "features", "essence", "characteristics", "nature"];

// Noun subjects based on suffix for more meaningful definitions
const nounSubjects = {
    default: "thing",
    ist: "person who specializes in",
    ism: "belief or practice of",
    ity: "state or quality of",
    ment: "result or process of",
    ness: "quality or condition of",
    ion: "action or process of",
    tion: "act or result of",
    sion: "state or act of",
    ship: "status or role of",
    dom: "realm or condition of",
    hood: "state or group of",
    er: "person or thing that",
    or: "person or thing that",
    ant: "person or thing that",
    ent: "person or thing that",
    ard: "person characterized by",
    ry: "practice or place of",
    cy: "state or quality of",
    tude: "condition or attitude of"
};

// Semantic categories for roots to adjust definitions
const rootSemanticCategories = {
    "lumen": { category: "action", actionForm: "illuminating", entityForm: "light" },
    "geo": { category: "concept", actionForm: "shaping", entityForm: "earth" },
    "form": { category: "action", actionForm: "shaping", entityForm: "structure" },
    "aqua": { category: "entity", actionForm: "flowing", entityForm: "water" },
    "chrono": { category: "concept", actionForm: "measuring", entityForm: "time" },
    "psych": { category: "concept", actionForm: "understanding", entityForm: "mind" },
    "therm": { category: "concept", actionForm: "heating", entityForm: "heat" },
    "default": { category: "entity", actionForm: "being", entityForm: "entity" }
};

// [Insert definitionTemplates, exampleTemplates, parseCSV, generateExampleSentence, generateSentenceDefinition, generatePronunciation, getPartOfSpeech, generateOtherForms, getPermutations, generateAmalgamations from the previous response here]

// Function to generate word and definition (used by index.html and games)
function generateWordAndDefinition(wordType, themeKey, options = {}) {
    let prefix = '', root1 = '', root2 = '', suffix = '';
    let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
    let rootPos1 = '', rootPos2 = '';
    let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;

    const allPrefixes = [], allPrefixDefs = [];
    const allRoots = [], allRootDefs = [], allRootPos = [];
    const allSuffixes = [], allSuffixDefs = [];

    if (themeKey === 'all') {
        Object.values(themes).forEach(themeData => {
            allPrefixes.push(...themeData.prefixes);
            allPrefixDefs.push(...themeData.prefixDefs);
            allRoots.push(...themeData.roots);
            allRootDefs.push(...themeData.rootDefs);
            allRootPos.push(...themeData.rootPos);
            allSuffixes.push(...themeData.suffixes);
            allSuffixDefs.push(...themeData.suffixDefs);
        });
    } else {
        if (!themes[themeKey] || !themes[themeKey].prefixes.length || !themes[themeKey].roots.length || !themes[themeKey].suffixes.length) {
            themeKey = 'normal';
        }
    }

    console.log(`Generating word for theme: ${themeKey}, wordType: ${wordType}`, { prefixes: themeKey === 'all' ? allPrefixes : themes[themeKey]?.prefixes, roots: themeKey === 'all' ? allRoots : themes[themeKey]?.roots, suffixes: themeKey === 'all' ? allSuffixes : themes[themeKey]?.suffixes });

    const getParts = (partType) => {
        const source = themeKey === 'all' ? { prefixes: allPrefixes, prefixDefs: allPrefixDefs, roots: allRoots, rootDefs: allRootDefs, pos: allRootPos, suffixes: allSuffixes, suffixDefs: allSuffixDefs } : themes[themeKey];
        switch (partType) {
            case 'prefix': return { elements: source.prefixes, defs: source.prefixDefs };
            case 'root': return { elements: source.roots, defs: source.rootDefs, pos: source.pos };
            case 'suffix': return { elements: source.suffixes, defs: source.suffixDefs };
            default: return { elements: [], defs: [], pos: [] };
        }
    };

    if (wordType === 'pre-root-suf' || wordType === 'pre-root') {
        const { elements, defs } = getParts('prefix');
        const result = getRandomElement(elements);
        prefix = result.element;
        prefixIndex = result.index;
        prefixDef = themeKey === 'all' ? allPrefixDefs[prefixIndex] || '' : defs[prefixIndex] || '';
    }
    if (wordType.includes('root')) {
        const { elements, defs, pos } = getParts('root');
        const result1 = getRandomElement(elements);
        root1 = result1.element;
        root1Index = result1.index;
        rootDef1 = themeKey === 'all' ? allRootDefs[root1Index] || '' : defs[root1Index] || '';
        rootPos1 = themeKey === 'all' ? allRootPos[root1Index] || 'noun' : pos[root1Index] || 'noun';

        if (wordType === 'pre-root-root-suf' || wordType === 'root-root' || wordType === 'pre-root-root') {
            const result2 = getRandomElement(elements);
            root2 = result2.element;
            root2Index = result2.index;
            rootDef2 = themeKey === 'all' ? allRootDefs[root2Index] || '' : defs[root2Index] || '';
            rootPos2 = themeKey === 'all' ? allRootPos[root2Index] || 'noun' : pos[root2Index] || 'noun';
        }
    }
    if (wordType.endsWith('suf')) {
        const { elements, defs } = getParts('suffix');
        const result = getRandomElement(elements);
        suffix = result.element;
        suffixIndex = result.index;
        suffixDef = themeKey === 'all' ? allSuffixDefs[suffixIndex] || '' : defs[suffixIndex] || '';
    }

    const parts = [prefix, root1, root2, suffix].filter(part => part && part.trim() !== '');
    let word = parts.length > 0 ? parts.join('-').replace(/--+/g, '-') : '';
    if (options.removeHyphens && word) {
        word = word.replace(/-/g, '');
    }
    const pos = getPartOfSpeech(wordType, suffixIndex, root1Index, root2Index, themeKey === 'all' ? 'normal' : themeKey);
    const definition = generateSentenceDefinition(wordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, suffix, root1, root2, rootPos1, rootPos2, themeKey === 'all' ? 'normal' : themeKey);
    const example = options.excludeExample ? '' : generateExampleSentence(word, pos, themeKey, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2);
    const pronunciation = generatePronunciation(word);

    return {
        word,
        definition: `${definition} ${example}`.trim(),
        pronunciation,
        parts
    };
}

// Helper function to get a random element with its index
function getRandomElement(array) {
    if (!array || array.length === 0) return { element: '', index: -1 };
    const index = Math.floor(Math.random() * array.length);
    return { element: array[index], index };
}

// Function to load word parts
async function loadWordParts() {
    if (themesLoadedPromise) return themesLoadedPromise;

    themesLoadedPromise = new Promise(async (resolve, reject) => {
        const loadingElement = document.getElementById("loading-game");
        if (loadingElement) loadingElement.classList.remove("hidden");

        try {
            const response = await fetch("data/word_parts.csv");
            if (!response.ok) throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);

            const csvText = await response.text();
            const parsedData = parseCSV(csvText);

            // Initialize themes object
            themes.normal = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            const themesList = ['fantasy', 'astronomy', 'shakespearian', 'popculture', 'technical', 'math', 'geography'];
            themesList.forEach(theme => {
                themes[theme] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            });

            // Categorize parsed data into themes
            parsedData.forEach(entry => {
                const theme = entry.type || 'normal';
                if (themes[theme]) {
                    if (entry.part === 'prefix') {
                        themes[theme].prefixes.push(entry.term);
                        themes[theme].prefixDefs.push(entry.definition);
                    } else if (entry.part === 'root') {
                        themes[theme].roots.push(entry.term);
                        themes[theme].rootDefs.push(entry.definition);
                        themes[theme].rootPos.push(entry.pos || 'noun');
                    } else if (entry.part === 'suffix') {
                        themes[theme].suffixes.push(entry.term);
                        themes[theme].suffixDefs.push(entry.definition);
                    }
                }
            });

            // Ensure all themes have data
            Object.keys(themes).forEach(theme => {
                if (themes[theme].prefixes.length === 0 || themes[theme].roots.length === 0 || themes[theme].suffixes.length === 0) {
                    console.warn(`Theme ${theme} has insufficient data. Falling back to 'normal' theme.`);
                    themes[theme] = { ...themes.normal };
                }
            });

            console.log("Themes loaded successfully:", themes);
            if (loadingElement) loadingElement.classList.add("hidden");
            resolve();
        } catch (error) {
            console.error("Error loading word parts:", error);
            if (loadingElement) {
                loadingElement.textContent = "Failed to load word parts. Check console.";
                loadingElement.classList.remove("hidden");
            }
            reject(error);
        }
    });

    return themesLoadedPromise;
}

// [Insert updateDisplay, copyToClipboard, shuffleAmalgamations, getLikeStatus, toggleLike, updateLikes, clearLikes, updateLikedWordsDisplay, addLikedWordClickHandlers, loadLikedWord, addPermutationClickHandlers, loadPermutation, initializeWordleGame, initializeGuessRealGame from the previous response here]

// Event listener for DOM content loaded (for index.html)
document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();
    const themeType = document.getElementById("themeType");
    const permutationType = document.getElementById("permutationType");
    const generateButton = document.getElementById("generateButton");
    const copyButton = document.getElementById("copyButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const clearLikesButton = document.getElementById("clearLikesButton");

    if (themeType) {
        themeType.addEventListener("change", updateDisplay);
    }
    if (permutationType) {
        permutationType.addEventListener("change", updateDisplay);
    }
    if (generateButton) {
        generateButton.addEventListener("click", updateDisplay);
    }
    if (copyButton) {
        copyButton.addEventListener("click", copyToClipboard);
    }
    if (shuffleButton) {
        shuffleButton.addEventListener("click", shuffleAmalgamations);
    }
    if (clearLikesButton) {
        clearLikesButton.addEventListener("click", clearLikes);
    }
    updateDisplay();
    addPermutationClickHandlers();
    addLikedWordClickHandlers();
});

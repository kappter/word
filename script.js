// Function to parse CSV content
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) { // Need at least header and one data line
        console.error("CSV file is empty or only contains headers.");
        return [];
    }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase()); // lowercase headers
    const result = [];
    const expectedColumns = headers.length;

    // Check if essential headers are present
    if (!headers.includes("type") || !headers.includes("part") || !headers.includes("term") || !headers.includes("definition")) {
        console.error("CSV file is missing required headers (type, part, term, definition).");
        alert("CSV file is missing required headers (type, part, term, definition).");
        return [];
    }

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim(); // Get the current line and trim whitespace
        if (!currentLine) continue; // Skip empty lines

        // Basic split by comma - assumes no commas within fields
        const columns = currentLine.split(",");

        // Check if the number of columns matches the headers
        if (columns.length === expectedColumns) {
            const entry = {};
            let validEntry = true;
            headers.forEach((header, index) => {
                const value = (columns[index] || "").trim(); // Use columns[index] and trim
                // Check specifically for required fields (type, part, term)
                if ((header === "type" || header === "part" || header === "term") && !value) {
                    console.warn(`Warning: Missing required value for header '${header}' on line ${i + 1}: \"${currentLine}\". Skipping entry.`);
                    validEntry = false;
                }
                entry[header] = value;
            });

            // Normalize theme name specifically if entry is potentially valid
            if (validEntry && entry.type) {
                 entry.type = entry.type.toLowerCase().trim(); // Ensure lowercase and trimmed
                 if (!entry.type) { // Check if type became empty after trimming
                    console.warn(`Warning: Empty 'type' after trimming on line ${i + 1}: \"${currentLine}\". Skipping entry.`);
                    validEntry = false;
                 }
            } else if (validEntry && !entry.type) { // If type header exists but value is empty
                 console.warn(`Warning: Missing 'type' value on line ${i + 1}: \"${currentLine}\". Skipping entry.`);
                 validEntry = false;
            }

            if (validEntry) {
                // Further validation: ensure part is one of the expected types
                const validParts = ["prefix", "root", "suffix"];
                if (!entry.part || !validParts.includes(entry.part.toLowerCase().trim())) {
                     console.warn(`Warning: Invalid or missing 'part' value ('${entry.part}') on line ${i + 1}: \"${currentLine}\". Skipping entry.`);
                     validEntry = false;
                } else {
                    entry.part = entry.part.toLowerCase().trim(); // Normalize part
                }
            }

            if (validEntry) {
                 // Ensure term is not empty
                 if (!entry.term || !entry.term.trim()) {
                    console.warn(`Warning: Missing 'term' value on line ${i + 1}: \"${currentLine}\". Skipping entry.`);
                    validEntry = false;
                 } else {
                    entry.term = entry.term.trim(); // Trim term
                 }
            }

            if (validEntry) {
                result.push(entry);
            }
        } else {
             console.warn(`Warning: Incorrect number of columns (${columns.length} instead of ${expectedColumns}) on line ${i + 1}: \"${currentLine}\". Skipping line.`);
        }
    }
    console.log(`Successfully parsed ${result.length} valid entries from CSV.`);
    return result;
}

// Themes object (will be populated dynamically from CSV)
const themes = {};

// Function to load and organize data from word_parts.csv
async function loadWordParts() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.classList.remove('hidden'); // Show loading indicator

    try {
        console.log('Fetching word_parts.csv...');
        const response = await fetch('data/word_parts.csv');
        console.log('Fetch Response Status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        // console.log('CSV Text:', csvText); // Optional: Log CSV text for debugging
        const data = parseCSV(csvText);
        console.log(`Parsed ${data.length} valid entries from CSV.`);

        // Clear themes object before populating
        for (const key in themes) {
            delete themes[key];
        }

        // Populate themes based on type and part
        data.forEach(({ type, part, term, definition }) => {
            // Ensure theme exists (already lowercase and trimmed from parseCSV)
            if (!themes[type]) {
                 themes[type] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], suffixes: [], suffixDefs: [] };
            }

            // Clean term based on part type and add
            let cleanedTerm = term; // Use original term by default
            if (part === "prefix") {
                cleanedTerm = term.replace(/-+$/, ""); // Remove trailing hyphens
            } else if (part === "suffix") {
                cleanedTerm = term.replace(/^-+/, ""); // Remove leading hyphens
            }

            // Only add if cleanedTerm is not empty
            if (cleanedTerm) {
                if (part === "prefix") {
                    themes[type].prefixes.push(cleanedTerm);
                    themes[type].prefixDefs.push(definition || ""); // Ensure definition is string
                } else if (part === "root") {
                    themes[type].roots.push(cleanedTerm); // Roots assumed clean
                    themes[type].rootDefs.push(definition || "");
                } else if (part === "suffix") {
                    themes[type].suffixes.push(cleanedTerm);
                    themes[type].suffixDefs.push(definition || "");
                }
            }
        });

        // Validate that all themes have data after population
        console.log("Populated themes:", Object.keys(themes));
        Object.keys(themes).forEach(theme => {
            const themeData = themes[theme];
            console.log(`Theme '${theme}':`, {
                prefixes: themeData.prefixes.length,
                roots: themeData.roots.length,
                suffixes: themeData.suffixes.length
            });
            if (!themeData.prefixes.length || !themeData.roots.length || !themeData.suffixes.length) {
                console.warn(`Theme '${theme}' is missing some word parts (prefixes, roots, or suffixes). Word generation for this theme might fail.`);
            }
        });

    } catch (error) {
        console.error('Error loading or processing word parts:', error);
        alert('Failed to load word parts data. Please check the console and ensure data/word_parts.csv is accessible and correctly formatted.');
    } finally {
        if (loadingElement) loadingElement.classList.add('hidden'); // Hide loading indicator
    }
}

// Function to populate theme dropdown dynamically
function populateThemeDropdown() {
    const themeType = document.getElementById("themeType");
    if (!themeType) {
        console.error("Theme dropdown element not found!");
        return;
    }
    themeType.innerHTML = ''; // Clear existing options

    // Add "All" option first
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    themeType.appendChild(allOption);

    // Get theme keys, sort them, and add them
    const sortedThemes = Object.keys(themes).sort();
    console.log("Themes to populate dropdown:", ["All", ...sortedThemes]);
    sortedThemes.forEach((themeKey) => {
        // Check if theme has enough parts before adding to dropdown
        const themeData = themes[themeKey];
        if (themeData && themeData.prefixes.length > 0 && themeData.roots.length > 0 && themeData.suffixes.length > 0) {
            const option = document.createElement("option");
            option.value = themeKey;
            // Capitalize first letter for display
            option.text = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
            themeType.appendChild(option);
        } else {
            console.warn(`Theme '${themeKey}' not added to dropdown because it lacks sufficient parts.`);
        }
    });
}

// Get a random element from an array
function getRandomElement(arr) {
    if (!arr || arr.length === 0) return { element: null, index: -1 };
    const index = Math.floor(Math.random() * arr.length);
    return { element: arr[index], index: index };
}

// Generate word and definition based on selected types
function generateWordAndDefinition(wordType, themeKey) {
    let prefix = '', root1 = '', root2 = '', suffix = '';
    let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
    let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;
    let currentTheme = themeKey;

    // If theme is 'all', get parts from all available themes
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
        // Check if 'all' has enough parts
        if (allPrefixes.length === 0 || allRoots.length === 0 || allSuffixes.length === 0) {
            console.error("Cannot generate word for 'All' theme: Insufficient parts across all themes.");
            return { word: "Error", definition: "Insufficient parts for 'All' theme.", pronunciation: "" };
        }
    } else {
        // Check if selected theme exists and has parts
        if (!themes[themeKey] || !themes[themeKey].prefixes.length || !themes[themeKey].roots.length || !themes[themeKey].suffixes.length) {
            console.error(`Selected theme '${themeKey}' not found or has insufficient parts.`);
            return { word: "Error", definition: `Theme '${themeKey}' has missing parts.`, pronunciation: "" };
        }
    }

    const getParts = (partType) => {
        if (themeKey === 'all') {
            switch (partType) {
                case 'prefix': return { elements: allPrefixes, defs: allPrefixDefs };
                case 'root': return { elements: allRoots, defs: allRootDefs };
                case 'suffix': return { elements: allSuffixes, defs: allSuffixDefs };
                default: return { elements: [], defs: [] };
            }
        } else {
            const themeData = themes[themeKey];
            switch (partType) {
                case 'prefix': return { elements: themeData.prefixes, defs: themeData.prefixDefs };
                case 'root': return { elements: themeData.roots, defs: themeData.rootDefs };
                case 'suffix': return { elements: themeData.suffixes, defs: themeData.suffixDefs };
                default: return { elements: [], defs: [] };
            }
        }
    };

    // Select parts based on wordType
    if (wordType === 'pre-root-suf' || wordType === 'pre-root') {
        const { elements: prefixes, defs: prefixDefsArr } = getParts('prefix');
        const result = getRandomElement(prefixes);
        prefix = result.element;
        prefixIndex = result.index;
        prefixDef = prefixDefsArr[prefixIndex] || '';
    }
    if (wordType.includes('root')) {
        const { elements: roots, defs: rootDefsArr } = getParts('root');
        const result1 = getRandomElement(roots);
        root1 = result1.element;
        root1Index = result1.index;
        rootDef1 = rootDefsArr[root1Index] || '';

        if (wordType === 'pre-root-root-suf' || wordType === 'root-root' || wordType === 'pre-root-root') {
            const result2 = getRandomElement(roots);
            root2 = result2.element;
            root2Index = result2.index;
            rootDef2 = rootDefsArr[root2Index] || '';
        }
    }
    if (wordType.endsWith('suf')) {
        const { elements: suffixes, defs: suffixDefsArr } = getParts('suffix');
        const result = getRandomElement(suffixes);
        suffix = result.element;
        suffixIndex = result.index;
        suffixDef = suffixDefsArr[suffixIndex] || '';
    }

    // Construct the word, filtering out empty parts *before* joining
    const parts = [prefix, root1, root2, suffix].filter(part => part && part.trim() !== '');
    const word = parts.join('-');

    // Generate definition and pronunciation
    const definition = generateSentenceDefinition(wordType, prefixDef, rootDef1, rootDef2, suffixDef, suffixIndex, themeKey === 'all' ? 'normal' : themeKey); // Use 'normal' logic for 'all' theme defs for now
    const pronunciation = generatePronunciation(word);

    return { word, definition, pronunciation };
}

// Simplified pronunciation generator
function generatePronunciation(word) {
    // Basic placeholder - replace with a more sophisticated method if needed
    return `/${word.replace(/-/g, ' / ')}/`;
}

// Determine part of speech (basic placeholder)
function getPartOfSpeech(type, suffixIndex, theme) {
    // This is highly simplified and might need refinement based on actual suffixes
    if (type.endsWith('suf') && suffixIndex !== -1) {
        const suffix = (theme === 'all' ? allSuffixes : themes[theme].suffixes)[suffixIndex];
        if (['ly', 'th'].includes(suffix)) return 'adverb';
        if (['ize', 'ify', 'en'].includes(suffix)) return 'verb';
        if (['ous', 'al', 'an', 'ile', 'ic', 'esque', 'ful', 'ious', 'ar', 'able', 'ible'].includes(suffix)) return 'adjective';
    }
    return 'noun'; // Default to noun
}

// Enhanced definition generator (simplified version)
function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, suffixIndex, theme) {
    let definition = '';
    const partOfSpeech = getPartOfSpeech(type, suffixIndex, theme);

    // Combine definitions simply for now
    const partsDefs = [preDef, rootDef1, rootDef2, sufDef].filter(def => def && def.trim() !== '');
    definition = `A ${partOfSpeech} related to: ${partsDefs.join(', ')}.`;

    // Basic attempt to make it slightly more natural
    if (type === 'pre-root-suf') {
        definition = `(${partOfSpeech}) Pertaining to ${rootDef1}, characterized by ${preDef} and resulting in ${sufDef}.`;
    } else if (type === 'root-suf') {
        definition = `(${partOfSpeech}) Pertaining to ${rootDef1}, resulting in ${sufDef}.`;
    } else if (type === 'pre-root') {
        definition = `(${partOfSpeech}) Pertaining to ${rootDef1}, characterized by ${preDef}.`;
    } else if (type === 'root') {
        definition = `(${partOfSpeech}) Related to ${rootDef1}.`;
    } // Add more cases if needed for root-root etc.

    // Fallback if definitions are missing
    if (!preDef && !rootDef1 && !rootDef2 && !sufDef) {
        definition = `(${partOfSpeech}) A generated word.`;
    }

    return definition.charAt(0).toUpperCase() + definition.slice(1); // Capitalize first letter
}


// Function to update the display with the generated word
function updateDisplay() {
    const wordContainer = document.getElementById('wordContainer');
    const generatedWordEl = document.getElementById('generatedWord');
    const pronunciationEl = document.getElementById('pronunciation');
    const wordDefinitionEl = document.getElementById('wordDefinition');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById("themeType");

    if (!permutationType || !themeType || !generatedWordEl || !pronunciationEl || !wordDefinitionEl) {
        console.error("One or more display elements are missing!");
        return;
    }

    const selectedWordType = permutationType.value;
    const selectedTheme = themeType.value;

    console.log(`Generating word with type: ${selectedWordType}, theme: ${selectedTheme}`);

    // Check if themes object is populated
    if (Object.keys(themes).length === 0 && selectedTheme !== 'all') {
        console.warn("Themes not loaded yet, cannot generate word.");
        generatedWordEl.textContent = "Loading...";
        pronunciationEl.textContent = "";
        wordDefinitionEl.textContent = "Please wait for data to load.";
        return;
    }

    const { word, definition, pronunciation } = generateWordAndDefinition(selectedWordType, selectedTheme);

    generatedWordEl.textContent = word;
    pronunciationEl.textContent = pronunciation;
    wordDefinitionEl.textContent = definition;

    // Optional: Update permutation list (if needed)
    // updatePermutationList(word, definition);
}

// Function to copy word and definition to clipboard
function copyToClipboard() {
    const generatedWord = document.getElementById('generatedWord').textContent;
    const wordDefinition = document.getElementById('wordDefinition').textContent;
    const textToCopy = `Word: ${generatedWord}\nDefinition: ${wordDefinition}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        // Optional: Show feedback to the user
        const copyButton = document.getElementById('copyButton');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text.');
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed");
    const generateButton = document.getElementById('generateButton');
    const copyButton = document.getElementById('copyButton');
    const permutationType = document.getElementById('permutationType');
    const themeType = document.getElementById("themeType");

    if (generateButton) {
        generateButton.addEventListener('click', updateDisplay);
    } else {
        console.error("Generate button not found!");
    }

    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    } else {
        console.error("Copy button not found!");
    }

    if (permutationType) {
        permutationType.addEventListener('change', updateDisplay);
    } else {
        console.error("Permutation type dropdown not found!");
    }

    if (themeType) {
        themeType.addEventListener('change', updateDisplay);
    } else {
        console.error("Theme type dropdown not found!");
    }

    // Load data and initialize
    await loadWordParts();
    populateThemeDropdown();
    updateDisplay(); // Initial word generation
});


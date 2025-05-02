// Themes object (will be populated dynamically from CSV)
const themes = {}; // Dynamically populated from CSV

// Function to parse CSV content
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase()); // lowercase headers
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        // Basic split is likely fine here, but let's stick to it for now.
           console.log("Processing line:", line);
        const columns = line.split(",");
        if (values.length === headers.length) {
            const entry = {};
            let validEntry = true;
            headers.forEach((header, index) => {
                const value = (values[index] || "").trim(); // Trim and handle potential undefined
                if (!value) validEntry = false; // Mark invalid if any field is empty after trimming
                entry[header] = value;
            });

            // Normalize theme name specifically
            if (entry.type) {
                entry.type = entry.type.toLowerCase();
            } else {
                validEntry = false; // Ensure 'type' header exists and has a value
            }

            if (validEntry) {
                result.push(entry);
            }
        }
    }
    return result;
}

// Function to load and organize data from word_parts.csv
async function loadWordParts() {
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.remove('hidden'); // Show loading indicator

    try {
        console.log('Fetching word_parts.csv...');
        const response = await fetch('data/word_parts.csv');
        console.log('Fetch Response:', response);
        if (!response.ok) {
            throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log('CSV Text:', csvText);
        const data = parseCSV(csvText);
        console.log('Parsed Data:', data);

        // Clear themes object before populating
        for (const key in themes) { // Clear existing properties
            delete themes[key];
        }

        // Populate themes based on type and part
     // Populate themes based on type and part
data.forEach(({ type, part, term, definition }) => {
    // Ensure theme exists (already lowercase from parseCSV)
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
            themes[type].prefixDefs.push(definition);
        } else if (part === "root") {
            themes[type].roots.push(cleanedTerm); // Roots assumed clean
            themes[type].rootDefs.push(definition);
        } else if (part === "suffix") {
            themes[type].suffixes.push(cleanedTerm);
            themes[type].suffixDefs.push(definition);
        }
    }
});erm);
                themes[type].suffixDefs.push(definition);
            }
        });

        // Validate that all themes have data
        Object.keys(themes).forEach(theme => {
            console.log(`Theme ${theme}:`, {
                prefixes: themes[theme].prefixes.length,
                roots: themes[theme].roots.length,
                suffixes: themes[theme].suffixes.length
            });
            if (!themes[theme].prefixes.length || !themes[theme].roots.length || !themes[theme].suffixes.length) {
                console.warn(`Theme ${theme} is missing some word parts.`);
            }
        });
    } catch (error) {
        console.error('Error loading word parts:', error);
        alert('Failed to load word parts data. Please check data/word_parts.csv.');
    } finally {
        loadingElement.classList.add('hidden'); // Hide loading indicator
    }
}

// Function to populate theme dropdown dynamically
function populateThemeDropdown() {
    themeType.innerHTML = ''; // Clear existing options
    // Add "All" option first
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    allOption.setAttribute("key", -1); // Assign a unique key
    themeType.appendChild(allOption);

    const sortedThemes = Object.keys(themes).sort(); // Sort themes alphabetically
    sortedThemes.forEach((themeKey, index) => {
        const option = document.createElement("option");
        option.value = themeKey;
        // Capitalize first letter for display
        option.text = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
        option.setAttribute("key", index);
        themeType.appendChild(option);
    });
}

// Load data on startup
async function initializeThemes() {
    await loadWordParts();
    populateThemeDropdown(); // Populate dropdown after loading data
    updateDisplay(); // Generate initial word after data is loaded
}

// DOM elements
const wordContainer = document.getElementById('wordContainer');
const generatedWord = document.getElementById('generatedWord');
const pronunciation = document.getElementById('pronunciation');
const wordDefinition = document.getElementById('wordDefinition');
const permutationList = document.getElementById('permutationList');
const generateButton = document.getElementById('generateButton');
const copyButton = document.getElementById('copyButton');
const permutationType = document.getElementById('permutationType');
const themeType = document.getElementById("themeType");

// Simplified pronunciation generator
function generatePronunciation(word) {
    const syllables = word.split('-').map(part => {
        return part.replace(/[aeiou]/gi, match => `_${match}_`).replace(/([bcdfghjklmnpqrstvwxyz]+)/gi, '$1');
    });
    return `\\${syllables.join(' - ')}\\`;
}

// Determine part of speech based on suffix or word type
function getPartOfSpeech(type, suffixIndex, theme) {
    if (type === 'pre-root' || type === 'pre-root-root' || type === 'root') {
        return 'noun';
    }
    if (suffixIndex === -1) {
        return 'noun';
    }
    const suffix = themes[theme].suffixes[suffixIndex];
    if (['ly', 'th'].includes(suffix)) return 'adverb';
    if (['ize', 'ify'].includes(suffix)) return 'verb';
    if (['ous', 'al', 'an', 'ile', 'ic', 'esque', 'ful', 'ious', 'ar'].includes(suffix)) return 'adjective';
    return 'noun';
}

// Enhanced definition generator with natural language, avoiding word parts
function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, suffixIndex, theme) {
    let definition = '';
    const partOfSpeech = getPartOfSpeech(type, suffixIndex, theme);

    // Helper to combine prefix and root meanings without using word parts
    const combinePreRoot = (pre, root) => {
        if (!pre) return root;
        switch (pre) {
            case 'negation': return `absence of ${root}`;
            case 'opposition': return `resistance to ${root}`;
            case 'connection': return `link between ${root}`;
            case 'internal': return `inner ${root}`;
            case 'external': return `outer ${root}`;
            case 'additional': return `extra ${root}`;
            case 'absence': return `lack of ${root}`;
            case 'equality': return `balanced ${root}`;
            case 'prior': return `earlier ${root}`;
            case 'subsequent': return `later ${root}`;
            case 'excess': return `excessive ${root}`;
            case 'deficiency': return `insufficient ${root}`;
            case 'support': return `promotion of ${root}`;
            case 'center': return `central ${root}`;
            case 'self': return `personal ${root}`;
            case 'difference': return `distinct ${root}`;
            case 'inclusion': return `contained ${root}`;
            case 'movement': return `transferred ${root}`;
            case 'subordination': return `lesser ${root}`;
            case 'superiority': return `greater ${root}`;
            case 'digital': return `digital ${root}`;
            case 'microscopic': return `tiny ${root}`;
            case 'biological': return `living ${root}`;
            case 'technological': return `technical ${root}`;
            case 'informational': return `data-driven ${root}`;
            case 'electrical': return `electric ${root}`;
            case 'mechanical': return `mechanical ${root}`;
            case 'automatic': return `automated ${root}`;
            case 'data-related': return `data-based ${root}`;
            case 'quantitative': return `measured ${root}`;
            case 'over': return `excessive ${root}`;
            case 'away': return `distant ${root}`;
            case 'covered': return `covered ${root}`;
            case 'wrong': return `incorrect ${root}`;
            case 'distant': return `far ${root}`;
            case 'toward': return `approaching ${root}`;
            case 'before': return `earlier ${root}`;
            case 'together': return `combined ${root}`;
            case 'apart': return `separate ${root}`;
            case 'massive': return `huge ${root}`;
            case 'extreme': return `intense ${root}`;
            case 'new': return `modern ${root}`;
            case 'nostalgic': return `retro ${root}`;
            case 'popular': return `popular ${root}`;
            case 'fashionable': return `trendy ${root}`;
            case 'spreading': return `viral ${root}`;
            case 'humorous': return `funny ${root}`;
            case 'fanatic': return `fan-driven ${root}`;
            case 'stellar': return `star-related ${root}`;
            case 'cosmic': return `cosmic ${root}`;
            case 'galactic': return `galaxy-related ${root}`;
            case 'starry': return `star-filled ${root}`;
            case 'lunar': return `moon-related ${root}`;
            case 'solar': return `sun-related ${root}`;
            case 'nebulous': return `cloudy ${root}`;
            case 'orbital': return `orbiting ${root}`;
            case 'explosive': return `explosive ${root}`;
            case 'sun-related': return `solar ${root}`;
            case 'magical': return `magical ${root}`;
            case 'elf-related': return `elven ${root}`;
            case 'dragon-related': return `draconic ${root}`;
            case 'mythical': return `mythical ${root}`;
            case 'mysterious': return `mysterious ${root}`;
            case 'fairy-related': return `fairy-like ${root}`;
            case 'dark': return `dark ${root}`;
            case 'bright': return `bright ${root}`;
            case 'ethereal': return `ethereal ${root}`;
            case 'runic': return `runic ${root}`;
            default: return `${root} involving ${pre}`;
        }
    };

    // Normalize root for grammatical correctness
    const normalizeRoot = (root) => {
        if (root.endsWith('ing') || root.endsWith('s')) return root;
        return root.replace(/ness$|ty$|ment$/, '');
    };

    switch (type) {
        case 'pre-root-suf':
            const preRoot = combinePreRoot(preDef, normalizeRoot(rootDef1));
            switch (sufDef) {
                case 'study': definition = `The academic study of ${preRoot}`; break;
                case 'fear': definition = `An intense fear of ${preRoot}`; break;
                case 'affection': definition = `A strong affection for ${preRoot}`; break;
                case 'expert': definition = `A person specializing in ${preRoot}`; break;
                case 'manner': definition = `A way characterized by ${preRoot}`; break;
                case 'abundance': definition = `Filled with ${preRoot}`; break;
                case 'quality': definition = `The characteristic of ${preRoot}`; break;
                case 'creation': definition = `The act of creating ${preRoot}`; break;
                case 'process': definition = `The process involving ${preRoot}`; break;
                case 'action': definition = `The activity of ${preRoot}`; break;
                case 'condition': definition = `The state of ${preRoot}`; break;
                case 'location': definition = `A place characterized by ${preRoot}`; break;
                case 'style': definition = `A style resembling ${preRoot}`; break;
                case 'fullness': definition = `Abundance of ${preRoot}`; break;
                case 'relation': definition = `Something related to ${preRoot}`; break;
                case 'association': definition = `Something associated with ${preRoot}`; break;
                case 'containment': definition = `The containment of ${preRoot}`; break;
                case 'female': definition = `A female connected to ${preRoot}`; break;
                case 'origin': definition = `Something originating from ${preRoot}`; break;
                case 'capability': definition = `The ability to perform ${preRoot}`; break;
                case 'disease': definition = `A disorder related to ${preRoot}`; break;
                case 'decomposition': definition = `A substance that breaks down ${preRoot}`; break;
                case 'inhabitant': definition = `A resident associated with ${preRoot}`; break;
                case 'possession': definition = `Possessing ${preRoot}`; break;
                case 'performance': definition = `The performance of ${preRoot}`; break;
                case 'resemblance': definition = `Something resembling ${preRoot}`; break;
                case 'outcome': definition = `The result of ${preRoot}`; break;
                case 'science': definition = `The science of ${preRoot}`; break;
                case 'belief': definition = `A belief in ${preRoot}`; break;
                case 'measurement': definition = `The measurement of ${preRoot}`; break;
                case 'character': definition = `A person characterized by ${preRoot}`; break;
                case 'extreme': definition = `The most extreme form of ${preRoot}`; break;
                case 'agent': definition = `A person performing ${preRoot}`; break;
                case 'nature': definition = `The nature of ${preRoot}`; break;
                case 'realm': definition = `A kingdom of ${preRoot}`; break;
                case 'connection': definition = `A bond of ${preRoot}`; break;
                default: definition = `Something characterized by ${preRoot}`;
            }
            break;
        case 'root-suf':
            const root = normalizeRoot(rootDef1);
            switch (sufDef) {
                case 'study': definition = `The academic study of ${root}`; break;
                case 'fear': definition = `An intense fear of ${root}`; break;
                case 'affection': definition = `A strong affection for ${root}`; break;
                case 'expert': definition = `A person specializing in ${root}`; break;
                case 'manner': definition = `A way characterized by ${root}`; break;
                case 'abundance': definition = `Filled with ${root}`; break;
                case 'quality': definition = `The characteristic of ${root}`; break;
                case 'creation': definition = `The act of creating ${root}`; break;
                case 'process': definition = `The process involving ${root}`; break;
                case 'action': definition = `The activity of ${root}`; break;
                case 'condition': definition = `The state of ${root}`; break;
                case 'location': definition = `A place characterized by ${root}`; break;
                case 'style': definition = `A style resembling ${root}`; break;
                case 'fullness': definition = `Abundance of ${root}`; break;
                case 'relation': definition = `Something related to ${root}`; break;
                case 'association': definition = `Something associated with ${root}`; break;
                case 'containment': definition = `The containment of ${root}`; break;
                case 'female': definition = `A female connected to ${root}`; break;
                case 'origin': definition = `Something originating from ${root}`; break;
                case 'capability': definition = `The ability to perform ${root}`; break;
                case 'disease': definition = `A disorder related to ${root}`; break;
                case 'decomposition': definition = `A substance that breaks down ${root}`; break;
                case 'inhabitant': definition = `A resident associated with ${root}`; break;
                case 'possession': definition = `Possessing ${root}`; break;
                case 'performance': definition = `The performance of ${root}`; break;
                case 'resemblance': definition = `Something resembling ${root}`; break;
                case 'outcome': definition = `The result of ${root}`; break;
                case 'science': definition = `The science of ${root}`; break;
                case 'belief': definition = `A belief in ${root}`; break;
                case 'measurement': definition = `The measurement of ${root}`; break;
                case 'character': definition = `A person characterized by ${root}`; break;
                case 'extreme': definition = `The most extreme form of ${root}`; break;
                case 'agent': definition = `A person performing ${root}`; break;
                case 'nature': definition = `The nature of ${root}`; break;
                case 'realm': definition = `A kingdom of ${root}`; break;
                case 'connection': definition = `A bond of ${root}`; break;
                default: definition = `Something characterized by ${root}`;
            }
            break;
        case 'pre-root':
            definition = `Something characterized by ${combinePreRoot(preDef, normalizeRoot(rootDef1))}`;
            break;
        case 'pre-root-root':
            definition = `Something combining ${combinePreRoot(preDef, normalizeRoot(rootDef1))} and ${normalizeRoot(rootDef2)}`;
            break;
        case 'root':
            definition = `The concept of ${normalizeRoot(rootDef1)}`;
            break;
        default:
            definition = `Something characterized by ${combinePreRoot(preDef, normalizeRoot(rootDef1))}`;
    }

    return `${partOfSpeech.charAt(0).toUpperCase() + partOfSpeech.slice(1)}: ${definition}`;
}

function generateWordAndDefinition(type, theme) {
    let themeData;
    if (theme === 'all') {
        // Combine all parts from all themes
        themeData = {
            prefixes: [], prefixDefs: [], roots: [], rootDefs: [], suffixes: [], suffixDefs: []
        };
        Object.values(themes).forEach(t => {
            themeData.prefixes.push(...t.prefixes);
            themeData.prefixDefs.push(...t.prefixDefs);
            themeData.roots.push(...t.roots);
            themeData.rootDefs.push(...t.rootDefs);
            themeData.suffixes.push(...t.suffixes);
            themeData.suffixDefs.push(...t.suffixDefs);
        });
    } else {
        themeData = themes[theme];
    }

    if (!themeData || !themeData.prefixes.length || !themeData.roots.length || !themeData.suffixes.length) {
        return { word: 'Error', def: 'Error: Theme data not loaded or insufficient parts', x: -1, y: -1, z: -1, y2: -1 };
    }
    let wordParts = [], word, def, x, y, z, y2;
    x = Math.floor(Math.random() * themeData.prefixes.length);
    y = Math.floor(Math.random() * themeData.roots.length);
    z = Math.floor(Math.random() * themeData.suffixes.length);
    y2 = Math.floor(Math.random() * themeData.roots.length);

    // Ensure y2 is different from y if possible
    if (themeData.roots.length > 1 && y2 === y) {
        y2 = (y + 1) % themeData.roots.length;
    }

    switch (type) {
        case 'pre-root-suf':
            wordParts = [themeData.prefixes[x], themeData.roots[y], themeData.suffixes[z]];
            def = generateSentenceDefinition(type, themeData.prefixDefs[x], themeData.rootDefs[y], null, themeData.suffixDefs[z], z, theme === 'all' ? 'normal' : theme); // Use 'normal' logic for 'all' theme definitions for simplicity
            break;
        case 'root-suf':
            wordParts = [themeData.roots[y], themeData.suffixes[z]];
            def = generateSentenceDefinition(type, null, themeData.rootDefs[y], null, themeData.suffixDefs[z], z, theme === 'all' ? 'normal' : theme);
            break;
        case 'pre-root':
            wordParts = [themeData.prefixes[x], themeData.roots[y]];
            def = generateSentenceDefinition(type, themeData.prefixDefs[x], themeData.rootDefs[y], null, null, -1, theme === 'all' ? 'normal' : theme);
            break;
        case 'pre-root-root':
            wordParts = [themeData.prefixes[x], themeData.roots[y], themeData.roots[y2]];
            def = generateSentenceDefinition(type, themeData.prefixDefs[x], themeData.rootDefs[y], themeData.rootDefs[y2], null, -1, theme === 'all' ? 'normal' : theme);
            break;
        case 'root':
            wordParts = [themeData.roots[y]];
            def = generateSentenceDefinition(type, null, themeData.rootDefs[y], null, null, -1, theme === 'all' ? 'normal' : theme);
            break;
        default: // Default to pre-root-suf
            wordParts = [themeData.prefixes[x], themeData.roots[y], themeData.suffixes[z]];
            def = generateSentenceDefinition(type, themeData.prefixDefs[x], themeData.rootDefs[y], null, themeData.suffixDefs[z], z, theme === 'all' ? 'normal' : theme);
    }

    // Clean and filter parts before joining
    word = wordParts.map(part => (part || ").trim()).filter(part => part.length > 0).join("-");

    return { word, def, x, y, z, y2 };
}

function generatePermutations(x, y, z, y2, currentType, theme) {
    const permutations = [];
    const types = ['pre-root-suf', 'root-suf', 'pre-root', 'pre-root-root', 'root'];
    
    types.forEach(type => {
        if (type !== currentType) {
            const { word, def } = generateWordAndDefinition(type, theme);
            if (word !== 'Error') {
                permutations.push(`<strong>${word}</strong>: ${def}`);
            }
        }
    });

    return permutations;
}

function copyToClipboard() {
    const word = generatedWord.textContent;
    const pron = pronunciation.textContent;
    const def = wordDefinition.textContent;
    const textToCopy = `${word}\n${pron}\n${def}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Word, pronunciation, and definition copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard.');
    });
}

function updateDisplay() {
    const type = permutationType.value;
    const theme = themeType.value;
    const { word, def, x, y, z, y2 } = generateWordAndDefinition(type, theme);

    generatedWord.textContent = word;
    pronunciation.textContent = generatePronunciation(word);
    wordDefinition.textContent = def;

    // Generate permutations
    const permutations = generatePermutations(x, y, z, y2, type, theme);
    permutationList.innerHTML = permutations.map(p => `<li>${p}</li>`).join('');

    // Add animation
    wordContainer.style.opacity = '0';
    setTimeout(() => {
        wordContainer.style.opacity = '1';
    }, 100);
}

// Event listeners
generateButton.addEventListener('click', updateDisplay);
copyButton.addEventListener('click', copyToClipboard);
permutationType.addEventListener('change', updateDisplay);
themeType.addEventListener("change", updateDisplay);

// Load data on startup
async function initializeThemes() {
    await loadWordParts();
    populateThemeDropdown(); // Populate dropdown after loading data
    updateDisplay(); // Generate initial word after data is loaded
}

initializeThemes(); // Call the initialization function

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

    if (!headers.includes("type") || !headers.includes("part") || !headers.includes("term") || !headers.includes("definition") || !headers.includes("pos")) {
        console.error("CSV file is missing required headers (type, part, term, definition, pos).");
        alert("CSV file is missing required headers (type, part, term, definition, pos).");
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
                if (entry.part === "root" && entry.pos) {
                    entry.pos = entry.pos.toLowerCase();
                    const validPos = ["noun", "verb", "adjective"];
                    if (!validPos.includes(entry.pos)) {
                        console.warn(`Invalid POS '${entry.pos}' for root '${entry.term}', defaulting to 'noun'.`);
                        entry.pos = "noun";
                    }
                } else {
                    entry.pos = "";
                }
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

// Definition templates by theme and POS
const definitionTemplates = {
    normal: {
        noun: "A thing characterized by [prefixDef] [rootDef1] [rootDef2] [suffixDef].",
        verb: "To [rootDef1] in a [prefixDef] manner [suffixDef] with purpose.",
        adjective: "Capable of [prefixDef] [rootDef1] [suffixDef] in nature.",
        adverb: "In a manner that [prefixDef] [rootDef1] [suffixDef] occurs."
    },
    fantasy: {
        noun: "A mythical [object] imbued with [prefixDef] [rootDef1] [suffixDef].",
        verb: "To magically [rootDef1] with a [prefixDef] essence [suffixDef] through magic.",
        adjective: "Having the magical property of [prefixDef] [rootDef1] [suffixDef] within.",
        adverb: "With a mystical [prefixDef] [rootDef1] quality [suffixDef] present."
    },
    astronomy: {
        noun: "A celestial entity defined by [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] across the cosmos in a [prefixDef] way [suffixDef] above.",
        adjective: "Pertaining to a [prefixDef] [rootDef1] phenomenon [suffixDef] observed.",
        adverb: "In a [prefixDef] [rootDef1] cosmic manner [suffixDef] beyond."
    },
    shakespearian: {
        noun: "A noble [object] of [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] with [prefixDef] intent [suffixDef] through action.",
        adjective: "Marked by [prefixDef] [rootDef1] [suffixDef] with grace.",
        adverb: "In a [prefixDef] [rootDef1] fashion [suffixDef] displayed."
    },
    popculture: {
        noun: "A trendy [object] with [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] in a [prefixDef] viral way [suffixDef] among fans.",
        adjective: "Known for [prefixDef] [rootDef1] [suffixDef] in culture.",
        adverb: "With a [prefixDef] [rootDef1] flair [suffixDef] shown."
    },
    technical: {
        noun: "A system involving [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] using [prefixDef] technology [suffixDef] efficiently.",
        adjective: "Related to [prefixDef] [rootDef1] [suffixDef] in design.",
        adverb: "In a [prefixDef] [rootDef1] technical manner [suffixDef] applied."
    },
    math: {
        noun: "A mathematical concept of [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] with [prefixDef] precision [suffixDef] accurately.",
        adjective: "Describing [prefixDef] [rootDef1] [suffixDef] in practice.",
        adverb: "In a [prefixDef] [rootDef1] mathematical way [suffixDef] calculated."
    },
    geography: {
        noun: "A geographical feature with [prefixDef] [rootDef1] [suffixDef].",
        verb: "To [rootDef1] across [prefixDef] landscapes [suffixDef] naturally.",
        adjective: "Pertaining to [prefixDef] [rootDef1] regions [suffixDef] around.",
        adverb: "In a [prefixDef] [rootDef1] geographical manner [suffixDef] evident."
    }
};

// Example sentence templates by theme and POS with multiple options
const exampleTemplates = {
    normal: {
        noun: [
            "Example: The [word] was essential for the project’s success.",
            "Example: They discovered a [word] in the ancient ruins.",
            "Example: The [word] became a symbol of innovation."
        ],
        verb: [
            "Example: They [word] the resources to ensure fairness.",
            "Example: She [word] the team to achieve their goals.",
            "Example: The machine [word] the data efficiently."
        ],
        adjective: [
            "Example: The [word] tool made the task easier.",
            "Example: A [word] approach solved the complex issue.",
            "Example: The [word] design attracted many admirers."
        ],
        adverb: [
            "Example: She completed the task [word].",
            "Example: The event unfolded [word] before the audience.",
            "Example: They collaborated [word] on the project."
        ]
    },
    fantasy: {
        noun: [
            "Example: The wizard used the [word] to cast a powerful spell.",
            "Example: The [word] glowed in the enchanted forest.",
            "Example: A [word] guarded the ancient kingdom."
        ],
        verb: [
            "Example: The elves [word] their magic to protect the forest.",
            "Example: She [word] the curse with a mystical chant.",
            "Example: They [word] the dragon’s power to save the realm."
        ],
        adjective: [
            "Example: The [word] artifact glowed with ancient power.",
            "Example: A [word] creature roamed the mystical lands.",
            "Example: The [word] sword was forged by the gods."
        ],
        adverb: [
            "Example: The dragon flew [word] through the enchanted sky.",
            "Example: She cast the spell [word] in the moonlight.",
            "Example: The warriors fought [word] against the dark forces."
        ]
    },
    astronomy: {
        noun: [
            "Example: The [word] was discovered in a distant galaxy.",
            "Example: The [word] illuminated the night sky.",
            "Example: Astronomers studied the [word] for decades."
        ],
        verb: [
            "Example: Scientists [word] the signals from the star system.",
            "Example: The probe [word] the cosmic radiation.",
            "Example: They [word] the orbit of the distant planet."
        ],
        adjective: [
            "Example: The [word] telescope captured stunning images.",
            "Example: A [word] phenomenon puzzled researchers.",
            "Example: The [word] star emitted a unique glow."
        ],
        adverb: [
            "Example: The probe transmitted data [word] from deep space.",
            "Example: The comet moved [word] across the cosmos.",
            "Example: Observations were conducted [word] at night."
        ]
    },
    shakespearian: {
        noun: [
            "Example: The bard crafted a [word] for the king’s court.",
            "Example: The [word] was celebrated in the royal feast.",
            "Example: A [word] adorned the noble’s chamber."
        ],
        verb: [
            "Example: They [word] their sorrow in the great hall.",
            "Example: She [word] her love in a sonnet.",
            "Example: The knight [word] his oath to the crown."
        ],
        adjective: [
            "Example: The [word] knight stood boldly before the queen.",
            "Example: A [word] tale captivated the court.",
            "Example: The [word] banquet honored the lords."
        ],
        adverb: [
            "Example: She spoke [word] of her love for the prince.",
            "Example: The minstrel played [word] at the feast.",
            "Example: They danced [word] in the candlelit hall."
        ]
    },
    popculture: {
        noun: [
            "Example: The [word] went viral on social media.",
            "Example: The [word] inspired a new fashion trend.",
            "Example: Fans celebrated the [word] at the convention."
        ],
        verb: [
            "Example: They [word] their latest dance move online.",
            "Example: She [word] the meme to millions of followers.",
            "Example: The band [word] their hit song on tour."
        ],
        adjective: [
            "Example: The [word] influencer gained millions of followers.",
            "Example: A [word] video broke the internet.",
            "Example: The [word] style defined the decade."
        ],
        adverb: [
            "Example: The song spread [word] across streaming platforms.",
            "Example: They promoted the event [word] online.",
            "Example: The trend grew [word] among fans."
        ]
    },
    technical: {
        noun: [
            "Example: The [word] improved the system’s efficiency.",
            "Example: The [word] powered the new device.",
            "Example: Engineers developed the [word] for precision."
        ],
        verb: [
            "Example: Engineers [word] the data to optimize performance.",
            "Example: The system [word] the input seamlessly.",
            "Example: They [word] the network for security."
        ],
        adjective: [
            "Example: The [word] algorithm processed the input quickly.",
            "Example: A [word] component enhanced reliability.",
            "Example: The [word] interface simplified navigation."
        ],
        adverb: [
            "Example: The software operated [word] during the test.",
            "Example: The device functioned [word] under stress.",
            "Example: Updates were applied [word] to the system."
        ]
    },
    math: {
        noun: [
            "Example: The [word] was key to solving the equation.",
            "Example: The [word] underpinned the theorem’s proof.",
            "Example: Students analyzed the [word] in class."
        ],
        verb: [
            "Example: They [word] the values to find the solution.",
            "Example: She [word] the formula with precision.",
            "Example: The team [word] the data mathematically."
        ],
        adjective: [
            "Example: The [word] method simplified the calculation.",
            "Example: A [word] approach clarified the problem.",
            "Example: The [word] model predicted outcomes."
        ],
        adverb: [
            "Example: The problem was solved [word] using geometry.",
            "Example: Calculations were performed [word] in the lab.",
            "Example: The proof was derived [word] from axioms."
        ]
    },
    geography: {
        noun: [
            "Example: The [word] shaped the region’s climate.",
            "Example: The [word] defined the valley’s ecosystem.",
            "Example: Explorers mapped the [word] in detail."
        ],
        verb: [
            "Example: Rivers [word] the terrain over centuries.",
            "Example: The wind [word] the desert landscape.",
            "Example: They [word] the coastline through erosion."
        ],
        adjective: [
            "Example: The [word] landscape attracted many explorers.",
            "Example: A [word] feature dominated the horizon.",
            "Example: The [word] region supported unique flora."
        ],
        adverb: [
            "Example: The volcano erupted [word] in the valley.",
            "Example: The river flowed [word] through the plains.",
            "Example: The terrain shifted [word] over time."
        ]
    }
};

// Replacement terms to hide the generated word in examples (optional fallback)
function generateExampleSentence(word, pos, theme) {
    let templates = exampleTemplates[theme]?.[pos] || exampleTemplates.normal[pos];
    if (!templates) templates = ["Example: The [word] was used."];
    // Randomly select a template from the array
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace('[word]', word);
}

// Function to load and organize data from word_parts.csv
async function loadWordParts() {
    if (themesLoadedPromise) return themesLoadedPromise;

    themesLoadedPromise = new Promise(async (resolve, reject) => {
        const loadingElement = document.getElementById("loading-game");
        if (loadingElement) loadingElement.classList.remove("hidden");

        try {
            const response = await fetch("data/word_parts.csv");
            if (!response.ok) throw new Error(`Failed to load word_parts.csv: ${response.status} ${response.statusText}`);
            const csvText = await response.text();
            const data = parseCSV(csvText);

            for (const key in themes) delete themes[key];

            data.forEach(({ type, part, term, definition, pos }) => {
                if (!themes[type]) {
                    themes[type] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
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
                        themes[type].rootPos.push(pos || "noun");
                    } else if (part === "suffix") {
                        themes[type].suffixes.push(cleanedTerm);
                        themes[type].suffixDefs.push(definition || "");
                    }
                }
            });

            console.log("Themes loaded:", themes);
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
        const source = themeKey === 'all' ? { prefixes: allPrefixes, prefixDefs: allPrefixDefs, roots: allRoots, rootDefs: allRootDefs, rootPos: allRootPos, suffixes: allSuffixes, suffixDefs: allSuffixDefs } : themes[themeKey];
        switch (partType) {
            case 'prefix': return { elements: source.prefixes, defs: source.prefixDefs };
            case 'root': return { elements: source.roots, defs: source.rootDefs, pos: source.rootPos };
            case 'suffix': return { elements: source.suffixes, defs: source.suffixDefs };
            default: return { elements: [], defs: [], pos: [] };
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
        const { elements, defs, pos } = getParts('root');
        const result1 = getRandomElement(elements);
        root1 = result1.element;
        root1Index = result1.index;
        rootDef1 = defs[root1Index] || '';
        rootPos1 = pos[root1Index] || 'noun';

        if (wordType === 'pre-root-root-suf' || wordType === 'root-root' || wordType === 'pre-root-root') {
            const result2 = getRandomElement(elements);
            root2 = result2.element;
            root2Index = result2.index;
            rootDef2 = defs[root2Index] || '';
            rootPos2 = pos[root2Index] || 'noun';
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
    let word = parts.length > 0 ? parts.join('-').replace(/--+/g, '-') : '';
    if (options.removeHyphens && word) {
        word = word.replace(/-/g, '');
    }
    const pos = getPartOfSpeech(wordType, suffixIndex, root1Index, root2Index, themeKey === 'all' ? 'normal' : themeKey);
    const definition = generateSentenceDefinition(wordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, themeKey === 'all' ? 'normal' : themeKey);
    const example = options.excludeExample ? '' : generateExampleSentence(word, pos, themeKey === 'all' ? 'normal' : themeKey);
    const pronunciation = word ? generatePronunciation(word) : '';

    console.log(`Generated word: ${word}, parts: ${parts}, pos: ${pos}`);

    return { word, definition: example ? `${definition} ${example}` : definition, pronunciation, parts, pos };
}

function generatePronunciation(word) {
    return word ? `/${word.replace(/-/g, ' / ')}/` : '';
}

function getPartOfSpeech(type, suffixIndex, root1Index, root2Index, theme) {
    let pos = 'noun';
    const source = theme === 'all' ? null : themes[theme];
    let suffix = '';
    let rootPos1 = 'noun', rootPos2 = 'noun';

    if (type.includes('root')) {
        const rootSource = theme === 'all' ? themes['normal'] : themes[theme];
        if (root1Index !== -1 && rootSource && rootSource.rootPos[root1Index]) {
            rootPos1 = rootSource.rootPos[root1Index];
        }
        if (root2Index !== -1 && rootSource && rootSource.rootPos[root2Index]) {
            rootPos2 = rootSource.rootPos[root2Index];
        }
    }

    if (type.endsWith('suf') && suffixIndex !== -1) {
        if (source && source.suffixes.length > suffixIndex) suffix = source.suffixes[suffixIndex];

        if (['ly', 'th'].includes(suffix)) return 'adverb';
        if (['ize', 'ify', 'en', 'ate'].includes(suffix)) return 'verb';
        if (['ous', 'al', 'an', 'ile', 'ic', 'esque', 'ful', 'ious', 'ar', 'able', 'ible', 'ish', 'ive', 'less', 'some', 'y'].includes(suffix)) return 'adjective';
        if (['ics', 'ism', 'ist', 'ity', 'ty', 'ment', 'ness', 'ion', 'tion', 'sion', 'ship', 'dom', 'hood', 'logy', 'ology', 'phobia', 'philia', 'er', 'or', 'ant', 'ent', 'ard', 'ry', 'cy', 'tude'].includes(suffix)) return 'noun';
    } else if (type.includes('root') && !type.endsWith('suf')) {
        pos = rootPos1;
    } else {
        pos = 'noun';
    }

    if ((type === 'pre-root-root' || type === 'root-root') && !type.endsWith('suf')) {
        pos = rootPos1;
    }

    return pos;
}

function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, pos, theme) {
    let definition = `(${pos}) `;
    const partsDefs = [preDef, rootDef1, rootDef2, sufDef].filter(def => def && def.trim() !== '');

    if (partsDefs.length === 0) {
        definition += "A generated word.";
    } else {
        let template = definitionTemplates[theme]?.[pos] || definitionTemplates.normal[pos];
        if (!template) template = "A generated word with [prefixDef] [rootDef1] [rootDef2] [suffixDef].";

        let filledTemplate = template
            .replace('[prefixDef]', preDef || '')
            .replace('[rootDef1]', rootDef1 || '')
            .replace('[rootDef2]', rootDef2 || '')
            .replace('[suffixDef]', sufDef || '')
            .replace('[object]', pos === 'noun' ? 'entity' : '');

        filledTemplate = filledTemplate.replace(/\s+/g, ' ').trim();

        const trailingPrepositions = ['with', 'to', 'for', 'in', 'on'];
        let lastWord = filledTemplate.split(' ').pop().toLowerCase();
        while (trailingPrepositions.includes(lastWord)) {
            filledTemplate = filledTemplate.replace(new RegExp(`\\s+${lastWord}\\s*$`, 'i'), '');
            lastWord = filledTemplate.split(' ').pop().toLowerCase();
        }

        definition += filledTemplate;
    }

    const firstCharIndex = definition.indexOf(')') + 2;
    if (firstCharIndex < definition.length) {
        definition = definition.substring(0, firstCharIndex) + definition.charAt(firstCharIndex).toUpperCase() + definition.slice(firstCharIndex + 1);
    }

    return definition;
}

function generateOtherForms(word, parts, type, theme) {
    const forms = [];
    const pos = getPartOfSpeech(type, parts.length > 0 ? parts.findIndex(p => p === parts[parts.length - 1]) : -1, -1, -1, theme);

    if (parts.length > 0) {
        const formWord = parts[0];
        forms.push({ word: formWord, pos: 'noun', def: `A concept related to ${parts[0]}.`, example: `Example: The ${formWord} was central to the story.` });
    }
    if (parts.length > 1) {
        const formWord = parts.slice(0, 2).join('-');
        forms.push({ word: formWord, pos: pos, def: `Involving ${parts.slice(0, 2).join(' and ')}.`, example: `Example: It had a ${formWord} quality.` });
    }
    if (parts.length > 2) {
        const formWord = parts.slice(0, 3).join('-');
        forms.push({ word: formWord, pos: 'noun', def: `A thing involving ${parts.slice(0, 3).join(' and ')}.`, example: `Example: The ${formWord} glowed brightly.` });
    }

    return forms;
}

// Function to generate all permutations of an array and shuffle them
function getPermutations(arr, originalWord) {
    const result = [];
    function permute(arr, current = [], remaining = arr) {
        if (remaining.length === 0) {
            const perm = current.join('-');
            if (perm !== originalWord) { // Exclude the original word
                result.push(perm);
            }
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
            permute(arr, [...current, remaining[i]], newRemaining);
        }
    }
    permute(arr);
    
    // Shuffle the permutations array
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result.slice(0, 5); // Limit to 5 permutations
}

function generateAmalgamations(parts, originalWord) {
    if (!parts || parts.length < 2) {
        console.warn("Not enough parts to generate amalgamations:", parts);
        return ["No combinations available"];
    }
    const permutations = getPermutations(parts, originalWord);
    console.log("Generated permutations:", permutations);
    return permutations.length > 0 ? permutations : ["No permutations available"];
}

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
    likeMainWordButton.setAttribute('data-word', word || '');
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

        // Assume pre-root-suf as default word type for simplicity (can be refined if needed)
        const selectedWordType = 'pre-root-suf';
        const selectedTheme = themeType.value;

        // Split the word into parts to generate a proper definition
        const parts = word.split('-');
        let prefix = '', root1 = '', root2 = '', suffix = '';
        let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
        let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;

        const themeData = selectedTheme === 'all' ? themes['normal'] : themes[selectedTheme];
        if (parts.length >= 1) prefix = parts[0] || '', prefixDef = themeData.prefixDefs[themeData.prefixes.indexOf(prefix)] || '';
        if (parts.length >= 2) root1 = parts[1] || '', rootDef1 = themeData.rootDefs[themeData.roots.indexOf(root1)] || '';
        if (parts.length >= 3) root2 = parts[2] || '', rootDef2 = themeData.rootDefs[themeData.roots.indexOf(root2)] || '';
        if (parts.length >= 3) suffix = parts[parts.length - 1] || '', suffixDef = themeData.suffixDefs[themeData.suffixes.indexOf(suffix)] || '';

        const pos = getPartOfSpeech(selectedWordType, suffixIndex, root1Index, root2Index, selectedTheme);
        const definition = generateSentenceDefinition(selectedWordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, selectedTheme);
        const example = generateExampleSentence(word, pos, selectedTheme);
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

        // Determine the word type and theme based on the original context
        const selectedWordType = permutationType.value; // Assumes pre-root-suf as default for simplicity
        const selectedTheme = themeType.value;

        // Split the word into parts to generate a proper definition
        const parts = word.split('-');
        let prefix = '', root1 = '', root2 = '', suffix = '';
        let prefixDef = '', rootDef1 = '', rootDef2 = '', suffixDef = '';
        let prefixIndex = -1, root1Index = -1, root2Index = -1, suffixIndex = -1;

        const themeData = selectedTheme === 'all' ? themes['normal'] : themes[selectedTheme];
        if (parts.length >= 1) prefix = parts[0] || '', prefixDef = themeData.prefixDefs[themeData.prefixes.indexOf(prefix)] || '';
        if (parts.length >= 2) root1 = parts[1] || '', rootDef1 = themeData.rootDefs[themeData.roots.indexOf(root1)] || '';
        if (parts.length >= 3) root2 = parts[2] || '', rootDef2 = themeData.rootDefs[themeData.roots.indexOf(root2)] || '';
        if (parts.length >= 3) suffix = parts[parts.length - 1] || '', suffixDef = themeData.suffixDefs[themeData.suffixes.indexOf(suffix)] || '';

        const pos = getPartOfSpeech(selectedWordType, suffixIndex, root1Index, root2Index, selectedTheme);
        const definition = generateSentenceDefinition(selectedWordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, selectedTheme);
        const example = generateExampleSentence(word, pos, selectedTheme);
        wordDefinitionEl.textContent = `${definition} ${example}`;

        otherFormsEl.innerHTML = "";
        amalgamationsEl.innerHTML = generateAmalgamations(parts, word)
            .map(a => `<li><span class="permutation" data-word="${a}">${a}</span> <button class="like-btn" data-word="${a}">${getLikeStatus(a) ? '❤️' : '🤍'}</button></li>`).join('');
        updateLikes();
        updateLikedWordsDisplay();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();

    const generateButton = document.getElementById("generateButton");
    const copyButton = document.getElementById("copyButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const clearLikesButton = document.getElementById("clearLikesButton");
    const likeMainWordButton = document.getElementById("likeMainWordButton");
    const permutationType = document.getElementById("permutationType");
    const themeType = document.getElementById("themeType");

    if (!generateButton || !copyButton || !shuffleButton || !clearLikesButton || !likeMainWordButton || !permutationType || !themeType) {
        console.error("One or more interactive elements are missing:", { generateButton, copyButton, shuffleButton, clearLikesButton, likeMainWordButton, permutationType, themeType });
        return;
    }

    generateButton.addEventListener("click", updateDisplay);
    copyButton.addEventListener("click", copyToClipboard);
    shuffleButton.addEventListener("click", () => {
        console.log("Shuffle button clicked.");
        shuffleAmalgamations();
    });
    clearLikesButton.addEventListener("click", () => {
        console.log("Clear likes button clicked.");
        clearLikes();
    });
    likeMainWordButton.addEventListener("click", toggleLike);
    permutationType.addEventListener("change", updateDisplay);
    themeType.addEventListener("change", updateDisplay);
    updateDisplay();
});
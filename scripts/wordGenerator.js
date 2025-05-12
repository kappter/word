// wordGenerator.js
let themesLoadedPromise = null;
const themes = {};

const nounEndings = ["traits", "properties", "attributes", "features", "essence", "characteristics", "nature"];
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

// [Insert definitionTemplates, exampleTemplates from previous responses here to keep this focused]

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

function generateExampleSentence(word, pos, theme, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2) {
    let templates = exampleTemplates[theme]?.[pos] || exampleTemplates.normal[pos];
    if (!templates) templates = { default: ["Example: The [word] was used."] };

    const root1CategoryInfo = rootSemanticCategories[root1] || rootSemanticCategories.default;
    const root2CategoryInfo = root2 && root2 !== root1 ? rootSemanticCategories[root2] || rootSemanticCategories.default : null;
    const rootAction1 = root1CategoryInfo.actionForm;
    const rootAction2 = root2CategoryInfo ? root2CategoryInfo.actionForm : rootAction1 !== 'being' ? 'being' : 'performing';
    const rootEntity1 = root1CategoryInfo.entityForm;
    const rootEntity2 = root2CategoryInfo ? root2CategoryInfo.entityForm : '';

    let template;
    if (pos === 'noun') {
        const category = rootPos1 === 'verb' ? 'action' : (rootPos1 === 'noun' ? 'entity' : 'concept');
        templates = templates[category] || templates.action || ["Example: The [word] was used."];
        template = templates[Math.floor(Math.random() * templates.length)];
    } else {
        template = templates[Math.floor(Math.random() * templates.length)];
    }

    return template
        .replace('[word]', word)
        .replace('[rootAction1]', rootAction1)
        .replace('[rootAction2]', root2 && root2 !== root1 ? rootAction2 : '')
        .replace('[rootEntity1]', rootEntity1)
        .replace('[rootEntity2]', rootEntity2 || '')
        .replace('[prefixDef]', prefixDef || 'notably')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, pos, suffix, root1, root2, rootPos1, rootPos2, theme) {
    let definition = `(${pos}) `;
    const partsDefs = {
        prefixDef: preDef || (pos === 'noun' ? 'prominent' : pos === 'verb' ? 'actively' : pos === 'adjective' ? 'notably' : 'distinctly'),
        suffixDef: sufDef || (pos === 'noun' ? 'distinctive' : pos === 'verb' ? 'effectively' : pos === 'adjective' ? 'characteristic' : 'uniquely')
    };

    const root1CategoryInfo = rootSemanticCategories[root1] || rootSemanticCategories.default;
    const root2CategoryInfo = root2 && root2 !== root1 ? rootSemanticCategories[root2] || rootSemanticCategories.default : null;
    const rootAction1 = root1CategoryInfo.actionForm;
    const rootAction2 = root2CategoryInfo ? root2CategoryInfo.actionForm : rootAction1 !== 'being' ? 'being' : 'performing';
    let rootEntity1 = root1CategoryInfo.entityForm;
    let rootEntity2 = root2CategoryInfo ? root2CategoryInfo.entityForm : '';

    const usedEntities = new Set();
    if (rootEntity1) usedEntities.add(rootEntity1);
    if (rootEntity2 && !usedEntities.has(rootEntity2)) {
        usedEntities.add(rootEntity2);
    } else if (rootEntity2 && usedEntities.has(rootEntity2)) {
        const availableEntities = Object.values(rootSemanticCategories)
            .filter(cat => cat.entityForm && !usedEntities.has(cat.entityForm))
            .map(cat => cat.entityForm);
        rootEntity2 = availableEntities.length > 0 ? availableEntities[Math.floor(Math.random() * availableEntities.length)] : "object";
    }

    let templates = definitionTemplates[theme]?.[pos] || definitionTemplates.normal[pos];
    if (!templates) templates = { action: ["A generated entity with [prefixDef] [rootAction1] [rootAction2] [suffixDef] [nounEnding]."] };

    let template;
    if (pos === 'noun') {
        const category = rootPos1 === 'verb' ? 'action' : (rootPos1 === 'noun' ? 'entity' : 'concept');
        templates = templates[category] || templates.action;
        template = templates[Math.floor(Math.random() * templates.length)];
    } else {
        template = templates[Math.floor(Math.random() * templates.length)];
    }

    const nounSubject = pos === 'noun' ? (nounSubjects[suffix] || nounSubjects.default) : '';
    const nounEnding = pos === 'noun' ? nounEndings[Math.floor(Math.random() * nounEndings.length)] : '';

    let filledTemplate = template
        .replace('[nounSubject]', nounSubject)
        .replace('[prefixDef]', partsDefs.prefixDef)
        .replace('[rootAction1]', rootAction1)
        .replace('[rootAction2]', root2 && root2 !== root1 ? rootAction2 : '')
        .replace('[rootEntity1]', rootEntity1)
        .replace('[rootEntity2]', rootEntity2 || '')
        .replace('[suffixDef]', partsDefs.suffixDef)
        .replace('[nounEnding]', nounEnding)
        .replace(/\s+/g, ' ')
        .trim();

    filledTemplate = filledTemplate.replace(/\s{2,}/g, ' ').trim();

    if (filledTemplate.length > 0) {
        definition += filledTemplate.charAt(0).toUpperCase() + filledTemplate.slice(1);
    } else {
        definition += filledTemplate;
    }

    return definition;
}

function generatePronunciation(word) {
    return word ? `/${word.replace(/-/g, ' / ')}/` : '';
}

function getPartOfSpeech(type, suffixIndex, root1Index, root2Index, theme) {
    let pos = 'noun';
    const source = theme === 'all' ? themes['normal'] : themes[theme];
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

function getPermutations(arr, originalWord) {
    const result = [];
    function permute(arr, current = [], remaining = arr) {
        if (remaining.length === 0) {
            const perm = current.join('-');
            if (perm !== originalWord) {
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

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result.slice(0, 5);
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

function getRandomElement(array) {
    if (!array || array.length === 0) return { element: '', index: -1 };
    const index = Math.floor(Math.random() * array.length);
    return { element: array[index], index };
}

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

            themes.normal = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            const themesList = ['fantasy', 'astronomy', 'shakespearian', 'popculture', 'technical', 'math', 'geography'];
            themesList.forEach(theme => {
                themes[theme] = { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], rootPos: [], suffixes: [], suffixDefs: [] };
            });

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

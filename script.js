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
    // Mapping of root definitions to categories (action, concept, entity)
    // Simplified for common roots in word_parts.csv
    "lumen": { category: "action", actionForm: "illuminating", entityForm: "light" },
    "geo": { category: "concept", actionForm: "shaping", entityForm: "earth" },
    "form": { category: "action", actionForm: "shaping", entityForm: "structure" },
    "aqua": { category: "entity", actionForm: "flowing", entityForm: "water" },
    "chrono": { category: "concept", actionForm: "measuring", entityForm: "time" },
    "psych": { category: "concept", actionForm: "understanding", entityForm: "mind" },
    "therm": { category: "concept", actionForm: "heating", entityForm: "heat" },
    "default": { category: "entity", actionForm: "being", entityForm: "entity" }
};

// Definition templates by theme, POS, and root category
const definitionTemplates = {
    normal: {
        noun: {
            action: [
                "A [nounSubject] [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A [nounSubject] that [prefixDef] engages in [rootAction1] [rootAction2], defined by [suffixDef] [nounEnding].",
                "A [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding]."
            ],
            concept: [
                "A [nounSubject] embodying the [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2] through [suffixDef] [nounEnding]."
            ],
            entity: [
                "A [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] while [suffixDef] affecting outcomes.",
            "To [prefixDef] [rootAction1] with [suffixDef] influence.",
            "To [rootAction1] in a [prefixDef] way, causing [suffixDef] effects."
        ],
        adjective: [
            "Being [prefixDef] [rootEntity1] and [suffixDef] in essence.",
            "Characterized by [prefixDef] [rootEntity1] with [suffixDef] qualities.",
            "Having a [prefixDef] [rootEntity1] nature with [suffixDef] traits."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] manner.",
            "[prefixDef] [rootAction1] with [suffixDef] precision.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] way."
        ]
    },
    fantasy: {
        noun: {
            action: [
                "A mythical [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A magical [nounSubject] known for [prefixDef] [rootAction1] [rootAction2] and [suffixDef] [nounEnding].",
                "An enchanted [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], imbued with [suffixDef] [nounEnding]."
            ],
            concept: [
                "A mythical [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A magical [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "An enchanted [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A mythical [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A magical [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "An enchanted [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] using [suffixDef] enchantments.",
            "To [prefixDef] [rootAction1] with [suffixDef] mystical power.",
            "To [rootAction1] [prefixDef] through [suffixDef] sorcery."
        ],
        adjective: [
            "Possessing [prefixDef] [rootEntity1] and [suffixDef] magical traits.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] enchanted qualities.",
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] arcane features."
        ],
        adverb: [
            "[prefixDef] [rootAction1] with a [suffixDef] mystical flair.",
            "[prefixDef] [rootAction1] in a [suffixDef] magical fashion.",
            "Performing [rootAction1] [prefixDef] with [suffixDef] enchantment."
        ]
    },
    astronomy: {
        noun: {
            action: [
                "A celestial [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A cosmic [nounSubject] known for [prefixDef] [rootAction1] [rootAction2] and [suffixDef] [nounEnding].",
                "A stellar [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], showing [suffixDef] [nounEnding]."
            ],
            concept: [
                "A celestial [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A cosmic [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A stellar [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A celestial [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A cosmic [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A stellar [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] across [suffixDef] cosmic expanses.",
            "To [prefixDef] [rootAction1] with [suffixDef] astronomical impact.",
            "To [rootAction1] [prefixDef] through [suffixDef] celestial forces."
        ],
        adjective: [
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] stellar properties.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] cosmic traits.",
            "Characterized by [prefixDef] [rootEntity1] and [suffixDef] astral qualities."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] cosmic pattern.",
            "[prefixDef] [rootAction1] with [suffixDef] celestial rhythm.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] stellar way."
        ]
    },
    shakespearian: {
        noun: {
            action: [
                "A noble [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A courtly [nounSubject] known for [prefixDef] [rootAction1] [rootAction2] and [suffixDef] [nounEnding].",
                "A regal [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], graced with [suffixDef] [nounEnding]."
            ],
            concept: [
                "A noble [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A courtly [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A regal [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A noble [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A courtly [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A regal [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] with [suffixDef] noble intent.",
            "To [prefixDef] [rootAction1] through [suffixDef] chivalric purpose.",
            "To [rootAction1] [prefixDef] with [suffixDef] courtly grace."
        ],
        adjective: [
            "Displaying [prefixDef] [rootEntity1] and [suffixDef] courtly charm.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] noble elegance.",
            "Possessing [prefixDef] [rootEntity1] and [suffixDef] regal traits."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] noble style.",
            "[prefixDef] [rootAction1] with [suffixDef] courtly flair.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] regal manner."
        ]
    },
    popculture: {
        noun: {
            action: [
                "A trendy [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A viral [nounSubject] known for [prefixDef] [rootAction1] [rootAction2] and [suffixDef] [nounEnding].",
                "A popular [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], defined by [suffixDef] [nounEnding]."
            ],
            concept: [
                "A trendy [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A viral [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A popular [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A trendy [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A viral [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A popular [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] with [suffixDef] viral appeal.",
            "To [prefixDef] [rootAction1] through [suffixDef] trendy influence.",
            "To [rootAction1] [prefixDef] with [suffixDef] social media impact."
        ],
        adjective: [
            "Featuring [prefixDef] [rootEntity1] and [suffixDef] trendy vibes.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] popular appeal.",
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] modern flair."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] viral way.",
            "[prefixDef] [rootAction1] with [suffixDef] trendy flair.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] popular style."
        ]
    },
    technical: {
        noun: {
            action: [
                "A technical [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A systematic [nounSubject] designed for [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "An engineered [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], featuring [suffixDef] [nounEnding]."
            ],
            concept: [
                "A technical [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A systematic [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "An engineered [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A technical [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A systematic [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "An engineered [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] using [suffixDef] technology.",
            "To [prefixDef] [rootAction1] with [suffixDef] technical precision.",
            "To [rootAction1] [prefixDef] through [suffixDef] engineering methods."
        ],
        adjective: [
            "Incorporating [prefixDef] [rootEntity1] and [suffixDef] technical design.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] systematic features.",
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] engineered traits."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] technical process.",
            "[prefixDef] [rootAction1] with [suffixDef] engineering accuracy.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] systematic way."
        ]
    },
    math: {
        noun: {
            action: [
                "A mathematical [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "An abstract [nounSubject] used for [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A computational [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], defined by [suffixDef] [nounEnding]."
            ],
            concept: [
                "A mathematical [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "An abstract [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A computational [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A mathematical [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "An abstract [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A computational [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] with [suffixDef] mathematical accuracy.",
            "To [prefixDef] [rootAction1] using [suffixDef] computational methods.",
            "To [rootAction1] [prefixDef] through [suffixDef] algebraic processes."
        ],
        adjective: [
            "Reflecting [prefixDef] [rootEntity1] and [suffixDef] mathematical principles.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] computational traits.",
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] analytical features."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] mathematical approach.",
            "[prefixDef] [rootAction1] with [suffixDef] computational precision.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] analytical way."
        ]
    },
    geography: {
        noun: {
            action: [
                "A geographical [nounSubject] that [prefixDef] [rootAction1] [rootAction2] with [suffixDef] [nounEnding].",
                "A natural [nounSubject] shaped by [prefixDef] [rootAction1] [rootAction2] and [suffixDef] [nounEnding].",
                "A regional [nounSubject] responsible for [prefixDef] [rootAction1] [rootAction2], featuring [suffixDef] [nounEnding]."
            ],
            concept: [
                "A geographical [nounSubject] embodying [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A natural [nounSubject] that defines [prefixDef] [rootEntity1] [rootEntity2], marked by [suffixDef] [nounEnding].",
                "A regional [nounSubject] representing [prefixDef] [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ],
            entity: [
                "A geographical [nounSubject] that [prefixDef] embodies [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding].",
                "A natural [nounSubject] characterized by [prefixDef] [rootEntity1] [rootEntity2] and [suffixDef] [nounEnding].",
                "A regional [nounSubject] [prefixDef] representing [rootEntity1] [rootEntity2] with [suffixDef] [nounEnding]."
            ]
        },
        verb: [
            "To [rootAction1] [prefixDef] across [suffixDef] landscapes.",
            "To [prefixDef] [rootAction1] with [suffixDef] geographical impact.",
            "To [rootAction1] [prefixDef] through [suffixDef] natural processes."
        ],
        adjective: [
            "Showcasing [prefixDef] [rootEntity1] and [suffixDef] geographical forms.",
            "Being [prefixDef] [rootEntity1] with [suffixDef] natural traits.",
            "Exhibiting [prefixDef] [rootEntity1] and [suffixDef] environmental features."
        ],
        adverb: [
            "[prefixDef] [rootAction1] in a [suffixDef] geographical context.",
            "[prefixDef] [rootAction1] with [suffixDef] natural flow.",
            "Performing [rootAction1] [prefixDef] in a [suffixDef] environmental way."
        ]
    }
};

// Example sentence templates with placeholders for semantic elements
const exampleTemplates = {
    normal: {
        noun: {
            action: [
                "Example: The [word] [rootAction1] the entire room effectively.",
                "Example: They relied on the [word] to [prefixDef] [rootAction1] the space.",
                "Example: The [word] demonstrated its ability by [prefixDef] [rootAction1] everything."
            ],
            concept: [
                "Example: The [word] was central to understanding the [rootEntity1].",
                "Example: They studied the [word] to explore [prefixDef] [rootEntity1].",
                "Example: The [word] provided insight into [prefixDef] [rootEntity1] dynamics."
            ],
            entity: [
                "Example: The [word] was a key [rootEntity1] in the project.",
                "Example: They discovered a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] served as a [prefixDef] [rootEntity1] example."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the forest with a magical glow.",
                "Example: The wizard employed the [word] to [prefixDef] [rootAction1] the realm.",
                "Example: The [word] [prefixDef] [rootAction1] the enchanted castle."
            ],
            concept: [
                "Example: The [word] was key to unlocking the [rootEntity1] of the ancients.",
                "Example: The sorcerer used the [word] to explore [prefixDef] [rootEntity1].",
                "Example: The [word] revealed the secrets of [prefixDef] [rootEntity1]."
            ],
            entity: [
                "Example: The [word] was a mystical [rootEntity1] in the kingdom.",
                "Example: They encountered a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] stood as a [prefixDef] [rootEntity1] guardian."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the galaxy with stunning clarity.",
                "Example: Astronomers used the [word] to [prefixDef] [rootAction1] the stars.",
                "Example: The [word] [prefixDef] [rootAction1] the cosmic void."
            ],
            concept: [
                "Example: The [word] helped measure the [rootEntity1] of the universe.",
                "Example: Scientists studied the [word] to understand [prefixDef] [rootEntity1].",
                "Example: The [word] mapped [prefixDef] [rootEntity1] across galaxies."
            ],
            entity: [
                "Example: The [word] was a distant [rootEntity1] in the sky.",
                "Example: They observed a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] appeared as a [prefixDef] [rootEntity1] phenomenon."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the court with noble grace.",
                "Example: The bard employed the [word] to [prefixDef] [rootAction1] the feast.",
                "Example: The [word] [prefixDef] [rootAction1] the royal hall."
            ],
            concept: [
                "Example: The [word] embodied the [rootEntity1] of the kingdom.",
                "Example: The lady used the [word] to explore [prefixDef] [rootEntity1].",
                "Example: The [word] revealed [prefixDef] [rootEntity1] to the court."
            ],
            entity: [
                "Example: The [word] was a noble [rootEntity1] in the castle.",
                "Example: They beheld a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] stood as a [prefixDef] [rootEntity1] treasure."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the event with viral fame.",
                "Example: Influencers used the [word] to [prefixDef] [rootAction1] the crowd.",
                "Example: The [word] [prefixDef] [rootAction1] the online audience."
            ],
            concept: [
                "Example: The [word] defined the [rootEntity1] of the decade.",
                "Example: Fans embraced the [word] to explore [prefixDef] [rootEntity1].",
                "Example: The [word] showcased [prefixDef] [rootEntity1] on social media."
            ],
            entity: [
                "Example: The [word] was a trendy [rootEntity1] at the festival.",
                "Example: They shared a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] became a [prefixDef] [rootEntity1] icon."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the system with precision.",
                "Example: Engineers used the [word] to [prefixDef] [rootAction1] the network.",
                "Example: The [word] [prefixDef] [rootAction1] the device."
            ],
            concept: [
                "Example: The [word] was crucial for analyzing [rootEntity1] in the lab.",
                "Example: The team applied the [word] to study [prefixDef] [rootEntity1].",
                "Example: The [word] optimized [prefixDef] [rootEntity1] processes."
            ],
            entity: [
                "Example: The [word] was a core [rootEntity1] in the design.",
                "Example: They developed a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] functioned as a [prefixDef] [rootEntity1] component."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the equation perfectly.",
                "Example: Mathematicians used the [word] to [prefixDef] [rootAction1] the problem.",
                "Example: The [word] [prefixDef] [rootAction1] the dataset."
            ],
            concept: [
                "Example: The [word] clarified the [rootEntity1] in the theorem.",
                "Example: Students explored the [word] to understand [prefixDef] [rootEntity1].",
                "Example: The [word] modeled [prefixDef] [rootEntity1] accurately."
            ],
            entity: [
                "Example: The [word] was a key [rootEntity1] in the formula.",
                "Example: They analyzed a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] represented a [prefixDef] [rootEntity1] concept."
            ]
        },
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
        noun: {
            action: [
                "Example: The [word] [rootAction1] the landscape over centuries.",
                "Example: Geologists noted the [word] that [prefixDef] [rootAction1] the valley.",
                "Example: The [word] [prefixDef] [rootAction1] the terrain."
            ],
            concept: [
                "Example: The [word] influenced the [rootEntity1] of the region.",
                "Example: Explorers mapped the [word] to study [prefixDef] [rootEntity1].",
                "Example: The [word] shaped [prefixDef] [rootEntity1] patterns."
            ],
            entity: [
                "Example: The [word] was a significant [rootEntity1] in the ecosystem.",
                "Example: They found a [word] that [prefixDef] embodied [rootEntity1].",
                "Example: The [word] marked a [prefixDef] [rootEntity1] boundary."
            ]
        },
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

// Function to generate example sentences with semantic placeholders
function generateExampleSentence(word, pos, theme, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2) {
    let templates = exampleTemplates[theme]?.[pos] || exampleTemplates.normal[pos];
    if (!templates) templates = { default: ["Example: The [word] was used."] };

    // Determine the semantic category of the roots
    const root1CategoryInfo = rootSemanticCategories[root1] || rootSemanticCategories.default;
    const root2CategoryInfo = rootSemanticCategories[root2] || rootSemanticCategories.default;
    const rootAction1 = root1CategoryInfo.actionForm;
    const rootAction2 = root2CategoryInfo.actionForm;
    const rootEntity1 = root1CategoryInfo.entityForm;
    const rootEntity2 = root2CategoryInfo.entityForm;

    // Select the appropriate template based on the root's category (for nouns)
    let template;
    if (pos === 'noun') {
        const category = rootPos1 === 'verb' ? 'action' : (rootPos1 === 'noun' ? 'entity' : 'concept');
        templates = templates[category] || templates.action || ["Example: The [word] was used."];
        template = templates[Math.floor(Math.random() * templates.length)];
    } else {
        template = templates[Math.floor(Math.random() * templates.length)];
    }

    // Replace semantic placeholders
    return template
        .replace('[word]', word)
        .replace('[rootAction1]', rootAction1)
        .replace('[rootAction2]', rootAction2 || '')
        .replace('[rootEntity1]', rootEntity1)
        .replace('[rootEntity2]', rootEntity2 || '')
        .replace('[prefixDef]', prefixDef || 'notably')
        .replace(/\s+/g, ' ')
        .trim();
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
    const definition = generateSentenceDefinition(wordType, prefixDef, rootDef1, rootDef2, suffixDef, pos, suffix, root1, root2, rootPos1, rootPos2, themeKey === 'all' ? 'normal' : themeKey);
    const example = options.excludeExample ? '' : generateExampleSentence(word, pos, themeKey === 'all' ? 'normal' : themeKey, root1, root2, rootDef1, rootDef2, prefixDef, rootPos1, rootPos2);
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

function generateSentenceDefinition(type, preDef, rootDef1, rootDef2, sufDef, pos, suffix, root1, root2, rootPos1, rootPos2, theme) {
    let definition = `(${pos}) `;
    const partsDefs = {
        prefixDef: preDef || (pos === 'noun' ? 'prominent' : pos === 'verb' ? 'actively' : pos === 'adjective' ? 'notably' : 'distinctly'),
        suffixDef: sufDef || (pos === 'noun' ? 'distinctive' : pos === 'verb' ? 'effectively' : pos === 'adjective' ? 'characteristic' : 'uniquely')
    };

    // Determine semantic category of the roots
    const root1CategoryInfo = rootSemanticCategories[root1] || rootSemanticCategories.default;
    const root2CategoryInfo = rootSemanticCategories[root2] || rootSemanticCategories.default;
    const rootAction1 = root1CategoryInfo.actionForm;
    const rootAction2 = root2CategoryInfo.actionForm;
    const rootEntity1 = root1CategoryInfo.entityForm;
    const rootEntity2 = root2CategoryInfo.entityForm;

    // Select templates based on POS and root category
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

    // Determine the noun subject based on the suffix
    const nounSubject = pos === 'noun' ? (nounSubjects[suffix] || nounSubjects.default) : '';

    // Randomly select a noun ending if the template includes [nounEnding]
    const nounEnding = pos === 'noun' ? nounEndings[Math.floor(Math.random() * nounEndings.length)] : '';

    // Replace placeholders, ensuring grammatical coherence
    let filledTemplate = template
        .replace('[nounSubject]', nounSubject)
        .replace('[prefixDef]', partsDefs.prefixDef)
        .replace('[rootAction1]', rootAction1)
        .replace('[rootAction2]', rootAction2 || '')
        .replace('[rootEntity1]', rootEntity1)
        .replace('[rootEntity2]', rootEntity2 || '')
        .replace('[suffixDef]', partsDefs.suffixDef)
        .replace('[nounEnding]', nounEnding)
        .replace(/\s+/g, ' ')
        .trim();

    // Remove redundant spaces and ensure proper sentence structure
    filledTemplate = filledTemplate.replace(/\s{2,}/g, ' ').trim();

    // Capitalize the first letter after the POS tag
    const firstCharIndex = definition.indexOf(')') + 2;
    if (firstCharIndex < filledTemplate.length) {
        filledTemplate = filledTemplate.substring(0, firstCharIndex) + filledTemplate.charAt(firstCharIndex).toUpperCase() + filledTemplate.slice(firstCharIndex + 1);
    }

    definition += filledTemplate;

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

document.addEventListener("DOMContentLoaded", async () => {
    await loadWordParts();
    populateThemeDropdown();

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
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
    }
});
# Word Creator

This web application generates fictional words based on selected word structures (like Prefix-Root-Suffix) and themes. It combines real prefixes, roots, and suffixes to create new, plausible-sounding words along with their potential definitions.

## Features

*   **Word Generation:** Creates words by combining parts based on selected structure types:
    *   Prefix-Root-Suffix
    *   Root-Suffix
    *   Prefix-Root
    *   Prefix-Root-Root
    *   Root Only
*   **Thematic Selection:** Allows users to choose a theme to influence the word parts used in generation. Available themes include:
    *   Normal (General English)
    *   Technical
    *   Shakespearian
    *   Pop Culture
    *   Astronomy
    *   Fantasy
    *   Geography (New!)
    *   Math (New!)
*   **Expanded Word List:** The underlying data file (`data/word_parts.csv`) has been significantly expanded with numerous additional prefixes, roots, and suffixes, particularly for the Normal, Geography, and Math themes, providing a richer vocabulary for word creation.
*   **Definitions:** Provides a generated definition based on the meanings of the combined word parts.
*   **Other Forms:** Suggests related words using different structures or themes.
*   **Copy Functionality:** Allows easy copying of the generated word and its definition.
*   **Extensible Data:** The application reads word parts from `data/word_parts.csv`. You can easily extend the vocabulary by adding new rows to this file, following the format: `Theme,PartType,Term,Definition` (e.g., `Music,root,son,sound`).

## How to Use

1.  Open the `index.html` file in your web browser.
2.  Select the desired word structure from the "Select Word Type" dropdown.
3.  Select the desired theme from the "Select Theme" dropdown.
4.  Click the "Generate New Word" button.
5.  View the generated word, its pronunciation guide, definition, and other suggested forms.
6.  Click "Copy Word" to copy the main generated word and its definition to your clipboard.

## Deployment

This is a static web application. You can deploy it by hosting the `index.html`, `style.css`, `script.js`, and the `data` directory (containing `word_parts.csv`) on any static web hosting service, such as GitHub Pages.

## Files

*   `index.html`: The main HTML structure of the application.
*   `style.css`: Contains the CSS rules for styling the application.
*   `script.js`: Contains the JavaScript logic for fetching data, generating words, and handling user interactions.
*   `data/word_parts.csv`: The CSV file containing the word parts (prefixes, roots, suffixes), their types, themes, and definitions.
*   `README.md`: This file.


# WordMaker

WordMaker is a fun and interactive web application that generates unique words by combining prefixes, roots, and suffixes. Users can select different word types and themes to create words ranging from everyday terms to technical jargon, Shakespearian phrases, pop culture references, or astronomical concepts. Each generated word comes with a pronunciation guide, a natural-language definition, and alternative forms, making it a delightful tool for word enthusiasts, writers, and creatives.

## Features

- **Dynamic Word Generation**: Create words using combinations of prefixes, roots, and suffixes, with five word types:
  - Prefix-Root-Suffix (e.g., `un-fract-ology`)
  - Root-Suffix (e.g., `voc-ist`)
  - Prefix-Root (e.g., `inter-jud`)
  - Prefix-Root-Root (e.g., `anti-phil-mort`)
  - Root Only (e.g., `mater`)
- **Theme Selection**: Choose from five themes to tailor the word style:
  - **Normal**: General-purpose words (e.g., `non-voc-ous` → "Adjective: Filled with absence of voice")
  - **Technical**: Tech-inspired terms (e.g., `cyber-comp-ics` → "Noun: The science of digital computation")
  - **Shakespearian**: Archaic, poetic words (e.g., `oer-mirth-ful` → "Adjective: Filled with excessive merriment")
  - **Pop Culture**: Trendy, modern terms (e.g., `viral-meme-ify` → "Verb: The act of creating viral humor")
  - **Astronomy**: Space-themed words (e.g., `astro-star-oid` → "Noun: Something resembling star-related stars")
- **Single CSV Data Source**: Word parts (prefixes, roots, suffixes) and their definitions are loaded from a single `data/word_parts.csv` file, with a `type` column to categorize themes, allowing easy expansion by editing one file.
- **Natural Definitions**: Definitions are clear, avoid repeating word parts, and include the part of speech (e.g., "Noun: The academic study of absence of breaking" for `non-fract-ology`).
- **Pronunciation Guide**: Each word includes a simple pronunciation (e.g., `\un-_a_-fract-_o_-logy\`).
- **Alternative Forms**: Displays other possible word forms using different combinations of the same parts.
- **Copy to Clipboard**: Copy the word, pronunciation, and definition with one click.
- **Earth-Tone Design**: A warm, elegant interface with beige, amber, and brown hues, styled with Tailwind CSS and custom CSS.
- **Responsive Layout**: Works seamlessly on desktop and mobile devices.
- **Copyright Notice**: Includes a footer with "© 2025 Kappter. All rights reserved."

## Demo

Check out the live demo at [https://kappter.github.io/wordmaker/](https://kappter.github.io/wordmaker/).

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kappter/wordmaker.git
   cd wordmaker
   ```

2. **Add Data File**:
   - Ensure the `data/` folder contains `word_parts.csv`.
   - The CSV file should have four columns: `type` (theme name), `part` (prefix, root, suffix), `term` (word part), `definition` (meaning). Example:
     ```csv
     type,part,term,definition
     normal,prefix,un,negation
     normal,root,fract,breaking
     normal,suffix,ology,study
     ```

3. **Open the App**:
   - Serve the app locally using a web server (required for Fetch API to load CSV file):
     ```bash
     python -m http.server 8000
     ```
   - Access the app at `http://localhost:8000`.

## Usage

1. **Select a Theme**:
   - Choose a theme from the "Select Theme" dropdown (Normal, Technical, Shakespearian, Pop Culture, Astronomy) to set the style of generated words.

2. **Select a Word Type**:
   - Choose a word type from the "Select Word Type" dropdown to define the structure of the word.

3. **Generate a Word**:
   - Click the "Generate New Word" button to create a new word, complete with pronunciation, definition, and alternative forms.

4. **Copy the Word**:
   - Click the "Copy Word" button to copy the word, pronunciation, and definition to your clipboard.

5. **Expand Data**:
   - Add new terms by editing `data/word_parts.csv` in a text editor or spreadsheet software.
   - For a new theme, add rows with a new `type` value and update `script.js` and `index.html` to include it.

## Project Structure

```
wordmaker/
├── data/
│   ├── word_parts.csv           # Single CSV file with all word parts and definitions
├── index.html                   # Main HTML file with the app structure
├── styles.css                   # Custom CSS for earth-tone styling and animations
├── script.js                    # JavaScript for word generation, themes, and interactivity
└── README.md                    # Project documentation
```

## Adding New Terms

To expand the data:

1. **Edit `word_parts.csv`**:
   - Open `data/word_parts.csv` in a text editor or spreadsheet software.
   - Add new rows with `type,part,term,definition`. Example:
     ```csv
     normal,prefix,super,superior
     normal,root,vid,vision
     normal,suffix,able,capability
     ```
   - Save and reload the app.

2. **Add a New Theme**:
   - Add rows to `word_parts.csv` with a new `type` (e.g., `fantasy`):
     ```csv
     fantasy,prefix,magi,magical
     fantasy,root,myth,legend
     fantasy,suffix,ic,association
     ```
   - Update `script.js` to add the new theme to the `themes` object:
     ```javascript
     const themes = {
         // ... other themes ...
         fantasy: { prefixes: [], prefixDefs: [], roots: [], rootDefs: [], suffixes: [], suffixDefs: [] }
     };
     ```
   - Update the theme dropdown in `index.html`:
     ```html
     <option value="fantasy">Fantasy</option>
     ```
   - Reload the app to use the new theme.

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository**:
   - Click the "Fork" button on GitHub to create your own copy.

2. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**:
   - Add new terms or themes to `data/word_parts.csv`.
   - Enhance the UI in `index.html` or `styles.css`.
   - Improve definition logic or add features in `script.js`.

4. **Test Locally**:
   - Ensure the app works in multiple browsers.
   - Verify that definitions remain clear and avoid word parts.
   - Test with a local server:
     ```bash
     python -m http.server 8000
     ```

5. **Submit a Pull Request**:
   - Push your changes to your fork:
     ```bash
     git push origin feature/your-feature-name
     ```
   - Open a pull request on the main repository with a description of your changes.

## License

© 2025 Kappter. All rights reserved.

This project is proprietary. You may use and modify it for personal use, but redistribution or commercial use is prohibited without permission.

## Contact

For questions, suggestions, or feedback, open an issue on the [GitHub repository](https://github.com/kappter/wordmaker).

---

*Built with creativity and a love for words!*
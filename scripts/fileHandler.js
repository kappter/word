// fileHandler.js
console.log("fileHandler.js loaded");

// Placeholder for future file handling logic, e.g., additional CSV loading
function loadFile(url) {
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        return response.text();
    });
}

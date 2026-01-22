const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.backup.svg');
const OUTPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.svg');

// 1. Grid Snapping (DISABLED to prevent shape distortion, focusing on color flattening first)
function snap(val) {
    return val; // Math.round(parseFloat(val) * 2) / 2;
}

// 2. Brand Palette (High Contrast)
// We define 5 bands of lightness to map the original chaotic colors onto.
const PALETTE = [
    { l: 20, hex: "#005511" }, // Shadow
    { l: 50, hex: "#008B1D" }, // Base Brand Color (Hue 133, Sat 100, Light ~27%) -> actually this hex is what we determined earlier
    { l: 80, hex: "#00C92A" }  // Highlight
];

function getBrandColor(originalHex) {
    // Calculate luminance of original hex
    let r = 0, g = 0, b = 0;
    if (originalHex.length === 4) {
        r = parseInt(originalHex[1] + originalHex[1], 16);
        g = parseInt(originalHex[2] + originalHex[2], 16);
        b = parseInt(originalHex[3] + originalHex[3], 16);
    } else {
        r = parseInt(originalHex.substr(1, 2), 16);
        g = parseInt(originalHex.substr(3, 2), 16);
        b = parseInt(originalHex.substr(5, 2), 16);
    }

    // Perceived luminance formula
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 * 100;

    // Find closest band
    let closest = PALETTE[0];
    let minDiff = 1000;

    for (const p of PALETTE) {
        const diff = Math.abs(p.l - lum);
        if (diff < minDiff) {
            minDiff = diff;
            closest = p;
        }
    }
    return closest.hex;
}

try {
    let data = fs.readFileSync(INPUT_FILE, 'utf8');

    // Regex to process Path Data (d="...")
    // We want to find numbers inside d="..." and snap them.
    // This is tricky with regex, but we can target the sequence of numbers.
    // d="M123.456 78.912..."

    // Replacement 1: Snap Coordinates
    // Identify numbers: -?\d*\.?\d+
    // We replace them inside the d attribute? 
    // Easier: Split by quote tokens.

    const tokens = data.split('"');
    for (let i = 0; i < tokens.length; i++) {
        // Basic heuristic: if the PREVIOUS token ended with d=, this is path data
        // Or if previous token ends with viewBox=
        const prev = tokens[i - 1] || "";

        if (prev.trim().endsWith('d=') || prev.trim().endsWith('viewBox=')) {
            // This token is coordinate data.
            // Replace all numbers.
            tokens[i] = tokens[i].replace(/-?\d*\.?\d+/g, (match) => {
                return snap(match).toString();
            });
        }

        // Replacement 2: Colors
        // If previous was fill= or style=...
        // The backup style uses classes .st0 { fill: #... }
        // We can also just run a global replace on hex codes like before.
    }

    let processedData = tokens.join('"');

    // Apply Color Mapping (Global Regex on Hex Codes)
    processedData = processedData.replace(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g, (match) => {
        // Only replace if it looks like a color in the content (avoiding IDs if they look like hex)
        // SVG colors usually safe.
        return getBrandColor(match);
    });

    // Cleanup: Remove "style" usage if we want inline? 
    // No, keep structure, just modified values.

    fs.writeFileSync(OUTPUT_FILE, processedData);
    console.log("Polished logo: Snapped coords and mapped to 5-tier brand palette.");

} catch (e) {
    console.error(e);
}

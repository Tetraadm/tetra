const sharp = require('sharp');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.png');
const OUTPUT_FILE = path.join(__dirname, '../public/tetrivo-logo-brand.png');

// Brand Green: #008B1D
async function main() {
    console.log("Processing with Sharp...");

    try {
        await sharp(INPUT_FILE)
            .tint({ r: 0, g: 139, b: 29 }) // RGB for #008B1D
            .toFile(OUTPUT_FILE);

        console.log("Done! Saved to " + OUTPUT_FILE);
    } catch (err) {
        console.error("Error processing image:", err);
        process.exit(1);
    }
}

main();

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.backup.svg');
const OUTPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.svg');

// Brand Color: #008B1D -> Hue 133
const TARGET_HUE = 133;
const TARGET_SATURATION = 90; // Boosting saturation to match brand vibrancy (approx)

// Helper: Hex to HSL
function hexToHSL(H) {
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

// Helper: HSL to Hex
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}

try {
    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error("No backup SVG file found to process.");
    }

    let svgContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const colorRegex = /#[0-9a-fA-F]{6}/g;

    const newSvgContent = svgContent.replace(colorRegex, (match) => {
        const hsl = hexToHSL(match);

        // Modify greens AND teals (Hue 80-210)
        // This makes sure we catch the Teal colors (~180) in the backup
        if (hsl.h > 80 && hsl.h < 210) {
            hsl.h = TARGET_HUE;
            hsl.s = TARGET_SATURATION;
        }

        return hslToHex(hsl.h, hsl.s, hsl.l);
    });

    fs.writeFileSync(OUTPUT_FILE, newSvgContent);
    console.log(`Processed logo colors to match brand Hue ${TARGET_HUE}.`);

} catch (err) {
    console.error(err);
    process.exit(1);
}

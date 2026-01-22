const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.backup.svg');
const OUTPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.svg');
const TARGET_HUE = 150; // Brand Green

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
    let svgContent = fs.readFileSync(INPUT_FILE, 'utf8');
    const colorRegex = /#[0-9a-fA-F]{6}/g;

    // Track unique colors to see effect
    const originalColors = new Set();
    const newColors = new Set();

    const newSvgContent = svgContent.replace(colorRegex, (match) => {
        originalColors.add(match);
        const hsl = hexToHSL(match);

        // 1. Force Hue
        hsl.h = TARGET_HUE;

        // 2. Posterization / Quantization logic
        // Round Lightness to nearest step to create "bands" and cleaner edges
        const STEPS = 12; // Fewer steps = more banding = sharper look. 12 steps ~ 8% chunks.
        hsl.l = Math.round(hsl.l / (100 / STEPS)) * (100 / STEPS);

        // 3. Increase Contrast?
        // Map L from [0-100] to [5-95] with S-curve or simple linear stretch if needed.
        // Let's just rely on quantization for sharpness first.

        // 4. Boost Saturation slightly
        hsl.s = 80; // Unify saturation to make it look clean

        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        newColors.add(hex);
        return hex;
    });

    fs.writeFileSync(OUTPUT_FILE, newSvgContent);
    console.log(`Processed logo. Reduced ${originalColors.size} unique colors to ${newColors.size} unique colors.`);

} catch (err) {
    console.error(err);
    process.exit(1);
}

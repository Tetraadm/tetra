const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.backup.svg');
const OUTPUT_FILE = path.join(__dirname, '../public/tetrivo-logo.svg');

// Brand Colors (Oklch approx to Hex)
// Primary Green Range: Lighter (~4ADE80) to Darker (~15803D)
const GRADIENT_DEF = `
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:#4ADE80;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#22C55E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14532D;stop-opacity:1" />
    </linearGradient>
  </defs>
`;

try {
    let svgContent = fs.readFileSync(INPUT_FILE, 'utf8');

    // Insert Defs after opening svg tag
    svgContent = svgContent.replace(/<svg[^>]*>/, (match) => {
        return match + GRADIENT_DEF;
    });

    // Replace ALL class-based fills (st0, st1...) or direct fills with the URL reference
    // The backup SVG uses CSS classes .st0 { fill: #... } in a <style> block.
    // Strategy:
    // 1. Remove the entire <style> block to stop conflicting fills.
    // 2. Add 'fill="url(#brandGradient)"' to the group or paths.
    //    Actually, better to iterate paths if possible, or just attach fill to the parent group.

    // Remove <style>...</style> content
    svgContent = svgContent.replace(/<style>[\s\S]*?<\/style>/, '');

    // Regex to find paths and polygons and enforce the fill
    // Since we removed the styles, the paths will be black by default unless we add the fill attribute.
    // Or, simpler: Add a global style at the top (which we just deleted? No, re-add one that targets all paths).

    const NEW_STYLE = `
    <style>
      path, polygon, rect, circle, ellipse {
        fill: url(#brandGradient) !important;
      }
    </style>
  `;

    // Insert new style
    svgContent = svgContent.replace(/<defs>/, '<defs>' + NEW_STYLE);

    fs.writeFileSync(OUTPUT_FILE, svgContent);
    console.log('Applied global brand gradient to logo.');

} catch (err) {
    console.error(err);
    process.exit(1);
}

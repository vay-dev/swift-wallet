const fs = require('fs');
const path = require('path');

// Simple SVG icon generator
function generateSVGIcon(size) {
    const radius = size * 0.15;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6C63FF;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#4ECDC4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF6B9D;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)"/>

  <!-- Wallet body -->
  <rect x="${size * 0.2}" y="${size * 0.3}" width="${size * 0.6}" height="${size * 0.45}" fill="white" rx="${size * 0.03}"/>

  <!-- Wallet flap -->
  <rect x="${size * 0.2}" y="${size * 0.22}" width="${size * 0.6}" height="${size * 0.08}" fill="white"/>

  <!-- Card outline -->
  <rect x="${size * 0.3}" y="${size * 0.42}" width="${size * 0.3}" height="${size * 0.15}"
        fill="none" stroke="#6C63FF" stroke-width="${size * 0.015}" rx="${size * 0.02}"/>

  <!-- Dollar sign -->
  <text x="${size * 0.7}" y="${size * 0.6}"
        font-family="Arial, sans-serif"
        font-size="${size * 0.25}"
        font-weight="bold"
        fill="#FFD700"
        text-anchor="middle"
        dominant-baseline="middle">$</text>

  <!-- Swift Wallet badge -->
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.08}" fill="white"/>
  <text x="${size * 0.75}" y="${size * 0.265}"
        font-family="Arial, sans-serif"
        font-size="${size * 0.08}"
        font-weight="bold"
        fill="#6C63FF"
        text-anchor="middle"
        dominant-baseline="middle">⚡</text>
</svg>`;
}

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for all required sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const svg = generateSVGIcon(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);

    fs.writeFileSync(filepath, svg, 'utf8');
    console.log(`✓ Generated ${filename}`);
});

// Also create PNG-named versions (browsers will accept SVG)
sizes.forEach(size => {
    const svg = generateSVGIcon(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);

    fs.writeFileSync(filepath, svg, 'utf8');
    console.log(`✓ Generated ${filename} (SVG format)`);
});

// Create shortcut icons
const shortcutIconSend = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6C63FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="48" fill="url(#grad)"/>
  <path d="M20 48 L70 25 L50 75 L40 48 Z" fill="white" stroke="white" stroke-width="2"/>
  <circle cx="40" cy="48" r="4" fill="#FFD700"/>
</svg>`;

const shortcutIconWallet = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6C63FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="48" fill="url(#grad)"/>
  <rect x="25" y="35" width="46" height="30" fill="white" rx="3"/>
  <text x="48" y="58" font-family="Arial" font-size="20" font-weight="bold" fill="#6C63FF" text-anchor="middle">$</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'send-96x96.png'), shortcutIconSend);
fs.writeFileSync(path.join(iconsDir, 'wallet-96x96.png'), shortcutIconWallet);
console.log('✓ Generated shortcut icons');

// Create badge icon
const badgeIcon = generateSVGIcon(72);
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.png'), badgeIcon);
console.log('✓ Generated badge icon');

console.log('\n✅ All PWA icons generated successfully!');
console.log(`📁 Location: ${iconsDir}`);

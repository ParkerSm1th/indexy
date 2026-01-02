import sharp from 'sharp';

const sizes = [16, 32, 48, 128];

// Create a simple bookmark icon (purple rounded square with white bookmark shape)
async function generateIcon(size) {
  const padding = Math.round(size * 0.1);
  const innerSize = size - padding * 2;
  
  // Create SVG for a bookmark icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#6366f1"/>
      <path 
        d="M${size * 0.3} ${size * 0.15} 
           L${size * 0.3} ${size * 0.8} 
           L${size * 0.5} ${size * 0.65} 
           L${size * 0.7} ${size * 0.8} 
           L${size * 0.7} ${size * 0.15} 
           Z" 
        fill="white"
      />
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icons/icon${size}.png`);
  
  console.log(`Generated icon${size}.png`);
}

for (const size of sizes) {
  await generateIcon(size);
}

console.log('All icons generated!');

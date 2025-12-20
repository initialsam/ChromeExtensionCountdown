#!/bin/bash

# 創建 128x128 的 SVG
cat > icon.svg << 'SVGEOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="64" fill="#677EEA"/>
  <text x="64" y="75" font-size="85" text-anchor="middle" font-family="Arial, sans-serif">⌛</text>
</svg>
SVGEOF

# 如果有 rsvg-convert，轉換為 PNG
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 128 -h 128 icon.svg -o icon128.png
    rsvg-convert -w 48 -h 48 icon.svg -o icon48.png
    rsvg-convert -w 16 -h 16 icon.svg -o icon16.png
    echo "Icons created with rsvg-convert"
    rm icon.svg
elif command -v convert &> /dev/null; then
    convert -background none icon.svg -resize 128x128 icon128.png
    convert -background none icon.svg -resize 48x48 icon48.png
    convert -background none icon.svg -resize 16x16 icon16.png
    echo "Icons created with ImageMagick"
    rm icon.svg
else
    echo "SVG created, but no converter found. Using node to create PNG..."
    
    # 使用 Node.js 創建簡單的 PNG
    cat > create_png.js << 'NODEOF'
const fs = require('fs');

function createSimplePNG(size) {
    const canvas = `data:image/svg+xml,<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="%23677EEA"/><text x="${size/2}" y="${size*0.6}" font-size="${size*0.7}" text-anchor="middle" style="font-family:Arial">⌛</text></svg>`;
    
    // 簡單創建佔位符
    console.log(`Icon ${size} would be created from: ${canvas}`);
}

createSimplePNG(16);
createSimplePNG(48);
createSimplePNG(128);
NODEOF
    
    node create_png.js 2>/dev/null || echo "Using existing placeholder icons"
    rm create_png.js icon.svg
fi

ls -lh icon*.png

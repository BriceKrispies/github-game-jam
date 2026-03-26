import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function createPNG(size, bgR, bgG, bgB, text) {
  const width = size;
  const height = size;

  // Build raw pixel data (filter byte + RGB for each row)
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    raw[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      // Rounded rectangle mask
      const margin = size * 0.12;
      const radius = size * 0.18;
      const inRect = isInRoundedRect(x, y, margin, margin, size - margin * 2, size - margin * 2, radius);
      if (inRect) {
        // Check if pixel is part of the letter area (simple block letters "GS")
        const letterColor = isInLetters(x, y, size);
        if (letterColor) {
          raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255; raw[px + 3] = 255;
        } else {
          raw[px] = bgR; raw[px + 1] = bgG; raw[px + 2] = bgB; raw[px + 3] = 255;
        }
      } else {
        raw[px] = 0; raw[px + 1] = 0; raw[px + 2] = 0; raw[px + 3] = 0;
      }
    }
  }

  const compressed = deflateSync(raw);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const chunks = [
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
}

function createMaskablePNG(size, bgR, bgG, bgB) {
  const width = size;
  const height = size;

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const letterColor = isInLetters(x, y, size);
      if (letterColor) {
        raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255; raw[px + 3] = 255;
      } else {
        raw[px] = bgR; raw[px + 1] = bgG; raw[px + 2] = bgB; raw[px + 3] = 255;
      }
    }
  }

  const compressed = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function isInRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false;
  // Check corners
  const corners = [
    [x + r, y + r],
    [x + w - r, y + r],
    [x + r, y + h - r],
    [x + w - r, y + h - r],
  ];
  for (const [cx, cy] of corners) {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    if (dx > r || dy > r) continue;
    if (px >= cx - r && px <= cx + r && py >= cy - r && py <= cy + r) {
      if ((px < x + r || px >= x + w - r) && (py < y + r || py >= y + h - r)) {
        if (dx * dx + dy * dy > r * r) return false;
      }
    }
  }
  return true;
}

function isInLetters(px, py, size) {
  // Define "G" and "S" as simple block shapes relative to icon size
  const s = size;
  const cx = s * 0.5;
  const cy = s * 0.5;
  const letterH = s * 0.36;
  const letterW = s * 0.18;
  const thick = s * 0.055;
  const gap = s * 0.03;

  // Letter G - left side
  const gx = cx - gap - letterW;
  const gy = cy - letterH / 2;

  // G: top bar
  if (px >= gx && px < gx + letterW && py >= gy && py < gy + thick) return true;
  // G: bottom bar
  if (px >= gx && px < gx + letterW && py >= gy + letterH - thick && py < gy + letterH) return true;
  // G: left bar
  if (px >= gx && px < gx + thick && py >= gy && py < gy + letterH) return true;
  // G: right stub (bottom half + mid bar)
  if (px >= gx + letterW - thick && px < gx + letterW && py >= cy && py < gy + letterH) return true;
  // G: mid bar
  if (px >= gx + letterW * 0.45 && px < gx + letterW && py >= cy && py < cy + thick) return true;

  // Letter S - right side
  const sx = cx + gap;
  const sy = cy - letterH / 2;

  // S: top bar
  if (px >= sx && px < sx + letterW && py >= sy && py < sy + thick) return true;
  // S: upper left bar
  if (px >= sx && px < sx + thick && py >= sy && py < cy) return true;
  // S: mid bar
  if (px >= sx && px < sx + letterW && py >= cy - thick / 2 && py < cy + thick / 2) return true;
  // S: lower right bar
  if (px >= sx + letterW - thick && px < sx + letterW && py >= cy && py < sy + letterH) return true;
  // S: bottom bar
  if (px >= sx && px < sx + letterW && py >= sy + letterH - thick && py < sy + letterH) return true;

  return false;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData) >>> 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ~crc;
}

// Generate icons: accent color #4361ee = rgb(67, 97, 238)
writeFileSync('public/icons/icon-192.png', createPNG(192, 67, 97, 238));
writeFileSync('public/icons/icon-512.png', createPNG(512, 67, 97, 238));
writeFileSync('public/icons/icon-512-maskable.png', createMaskablePNG(512, 67, 97, 238));

console.log('Generated: icon-192.png, icon-512.png, icon-512-maskable.png');

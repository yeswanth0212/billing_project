import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// Generate a valid uncompressed PNG file of width x height with a gradient background and a golden hotel crown/bell motif
function createPng(width, height, outputPath) {
  // RGBA buffer: width * 4 bytes per row + 1 filter byte per scanline
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep teal/emerald luxury gradient background
      let r = Math.round(15 + 10 * (1 - ny));
      let g = Math.round(118 + 20 * (1 - ny));
      let b = Math.round(110 + 30 * nx);
      let a = 255;

      // Rounded squircle icon container
      if (Math.abs(dx) > 0.44 || Math.abs(dy) > 0.44) {
        if (Math.hypot(Math.max(0, Math.abs(dx) - 0.38), Math.max(0, Math.abs(dy) - 0.38)) > 0.08) {
          a = 0; // transparent corners
        }
      }

      // Golden center emblem (Hotel Crown / Bell)
      if (a > 0) {
        // Bell shape
        const inBellBody = dy > -0.15 && dy < 0.2 && Math.abs(dx) < (0.15 + (dy + 0.15) * 0.4);
        const inBellBase = dy >= 0.2 && dy <= 0.25 && Math.abs(dx) < 0.3;
        const inBellKnob = dist < 0.08 && dy < -0.15;
        const inCrownStar = Math.abs(dx) < 0.04 && Math.abs(dy + 0.25) < 0.04;

        if (inBellBody || inBellBase || inBellKnob || inCrownStar) {
          // Warm gold color
          r = 251;
          g = 191;
          b = 36;
        } else if (dist < 0.38 && (Math.abs(dist - 0.36) < 0.015)) {
          // Subtle golden ring border
          r = 245;
          g = 158;
          b = 11;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Adaptive
  ihdrData[12] = 0; // Interlace: None

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const finalPng = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalPng);
  console.log(`Generated PNG: ${outputPath} (${width}x${height}, ${finalPng.length} bytes)`);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]);
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

createPng(192, 192, path.resolve('public/icons/icon-192.png'));
createPng(512, 512, path.resolve('public/icons/icon-512.png'));
createPng(192, 192, path.resolve('public/icons/maskable-icon-192.png'));
createPng(512, 512, path.resolve('public/icons/maskable-icon-512.png'));

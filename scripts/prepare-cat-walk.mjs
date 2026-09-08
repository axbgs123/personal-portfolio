import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Deterministic preparation only: remove the generated checkerboard, slice and
// align the actual model output. No part of the character is redrawn here.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'public/art');
const source = process.argv[2] || path.join(outputDir, 'cat-walk-generated-source.png');
const cellSize = 384;
const baseline = 360;
const frames = [];

function closeMask(mask, width, height) {
  const dilated = new Uint8Array(mask.length);
  const closed = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) dilated[y * width + x] ||= mask[(y + dy) * width + x + dx];
      }
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let value = 1;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) value &&= dilated[(y + dy) * width + x + dx];
      }
      closed[y * width + x] = value;
    }
  }
  return closed;
}

function cutOut(rgb, width, height) {
  const barrier = new Uint8Array(width * height);
  const gray = new Float32Array(width * height);
  for (let i = 0; i < barrier.length; i += 1) {
    gray[i] = (rgb[i * 3] + rgb[i * 3 + 1] + rgb[i * 3 + 2]) / 3;
    barrier[i] = gray[i] < 225 ? 1 : 0;
  }
  const closed = closeMask(barrier, width, height);
  const exterior = new Uint8Array(barrier.length);
  const queue = new Int32Array(barrier.length);
  let start = 0;
  let end = 0;
  const visit = (index) => {
    if (!closed[index] && !exterior[index]) {
      exterior[index] = 1;
      queue[end++] = index;
    }
  };
  for (let x = 0; x < width; x += 1) { visit(x); visit((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { visit(y * width); visit(y * width + width - 1); }
  while (start < end) {
    const index = queue[start++];
    const x = index % width;
    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < width * (height - 1)) visit(index + width);
  }
  const rgba = Buffer.alloc(width * height * 4);
  let left = width; let top = height; let right = 0; let bottom = 0;
  let opaque = 0; let preservedWhite = 0;
  for (let i = 0; i < barrier.length; i += 1) {
    if (exterior[i]) continue;
    const x = i % width; const y = Math.floor(i / width);
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
    rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2]; rgba[i * 4 + 3] = 255;
    opaque += 1;
    if (gray[i] > 225) preservedWhite += 1;
  }
  assert.ok(opaque > 15000 && opaque < width * height * 0.65, 'Foreground must be a cat, not its checkerboard');
  assert.ok(preservedWhite > 2000, 'White face, paws, neck and tail must remain opaque');
  // Remove the pale matte only on the outer antialiased rim. Interior white fur
  // stays untouched; these rim pixels interpolate to their own nearby ink.
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const i = y * width + x;
      if (exterior[i] || ![-1, 1, -width, width].some((offset) => exterior[i + offset])) continue;
      let inkIndex = i;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const neighbor = (y + dy) * width + x + dx;
          if (!exterior[neighbor] && gray[neighbor] < gray[inkIndex]) inkIndex = neighbor;
        }
      }
      if (gray[inkIndex] >= 220) continue;
      const alpha = Math.max(0, Math.min(1, (250 - gray[i]) / (250 - gray[inkIndex])));
      rgba[i * 4] = rgb[inkIndex * 3]; rgba[i * 4 + 1] = rgb[inkIndex * 3 + 1]; rgba[i * 4 + 2] = rgb[inkIndex * 3 + 2];
      rgba[i * 4 + 3] = Math.round(alpha * 255);
    }
  }
  let headLeft = width; let headRight = 0;
  for (let y = top; y <= top + 50; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] && gray[y * width + x] < 150) {
        headLeft = Math.min(headLeft, x); headRight = Math.max(headRight, x);
      }
    }
  }
  return { rgba, width, height, bbox: { left, top, width: right - left + 1, height: bottom - top + 1 }, headCenter: (headLeft + headRight) / 2, headWidth: headRight - headLeft + 1, opaque, preservedWhite };
}

await fs.mkdir(outputDir, { recursive: true });
const preservedSource = path.join(outputDir, 'cat-walk-generated-source.png');
if (source !== preservedSource) await fs.copyFile(source, preservedSource);
const metadata = await sharp(source).metadata();
assert.equal(metadata.width, 1774); assert.equal(metadata.height, 887);
for (let i = 0; i < 8; i += 1) {
  const column = i % 4; const row = Math.floor(i / 4);
  const left = Math.round(column * metadata.width / 4); const top = Math.round(row * metadata.height / 2);
  const width = Math.round((column + 1) * metadata.width / 4) - left;
  const height = Math.round((row + 1) * metadata.height / 2) - top;
  const rgb = await sharp(source).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  frames.push({ ...cutOut(rgb, width, height), index: i });
}

// All eight heads use the same ear-to-ear scale, then a common frontward head
// anchor and a shared lowest planted-paw baseline. Natural limb changes remain.
let headSize = 158;
const extents = () => frames.map((frame) => ({ left: (frame.bbox.left - frame.headCenter) * headSize / frame.headWidth, right: (frame.bbox.left + frame.bbox.width - frame.headCenter) * headSize / frame.headWidth }));
let relative = extents();
let minX = Math.min(...relative.map((item) => item.left));
let maxX = Math.max(...relative.map((item) => item.right));
if (maxX - minX > cellSize - 20) {
  headSize *= (cellSize - 20) / (maxX - minX);
  relative = extents(); minX = Math.min(...relative.map((item) => item.left)); maxX = Math.max(...relative.map((item) => item.right));
}
const headAnchor = (cellSize - (maxX - minX)) / 2 - minX;
const prepared = [];
const diagnostics = [];
const union = new Uint8Array(cellSize * cellSize);
for (const frame of frames) {
  const scale = headSize / frame.headWidth;
  const width = Math.round(frame.bbox.width * scale); const height = Math.round(frame.bbox.height * scale);
  const left = Math.round(headAnchor - (frame.headCenter - frame.bbox.left) * scale);
  const top = baseline - height;
  assert.ok(left >= 0 && left + width <= cellSize && top >= 0);
  const cropped = await sharp(frame.rgba, { raw: { width: frame.width, height: frame.height, channels: 4 } }).extract(frame.bbox).resize(width, height, { kernel: 'lanczos3' }).png().toBuffer();
  const aligned = await sharp({ create: { width: cellSize, height: cellSize, channels: 4, background: '#00000000' } }).composite([{ input: cropped, left, top }]).png().toBuffer();
  prepared.push(aligned);
  const raw = await sharp(aligned).raw().toBuffer();
  for (let i = 0; i < union.length; i += 1) if (raw[i * 4 + 3] >= 96) union[i] = 1;
  diagnostics.push({ index: frame.index, sourceBox: frame.bbox, scale, headWidth: frame.headWidth, left, top, width, height, baseline, sourceWhitePixelsPreserved: frame.preservedWhite });
}

// A non-painted hit area is derived from the alpha union, not from an opaque
// rectangle. Transparent space around the sprite cannot swallow page links.
const quantum = 6;
let hitArea = '';
for (let y = 0; y < cellSize; y += quantum) {
  let runStart = null;
  for (let x = 0; x <= cellSize; x += quantum) {
    let filled = false;
    if (x < cellSize) {
      for (let dy = 0; dy < quantum && !filled; dy += 1) {
        for (let dx = 0; dx < quantum; dx += 1) if (union[(y + dy) * cellSize + x + dx]) { filled = true; break; }
      }
    }
    if (filled && runStart === null) runStart = x;
    if (!filled && runStart !== null) {
      hitArea += `M${runStart} ${y}H${x}V${y + quantum}H${runStart}Z`;
      runStart = null;
    }
  }
}
const atlas = await sharp({ create: { width: cellSize * 8, height: cellSize, channels: 4, background: '#00000000' } }).composite(prepared.map((input, index) => ({ input, left: index * cellSize, top: 0 }))).png().toBuffer();
await fs.writeFile(path.join(outputDir, 'cat-walk-atlas.png'), atlas);
await sharp(atlas).webp({ lossless: true, effort: 6 }).toFile(path.join(outputDir, 'cat-walk-atlas.webp'));
await fs.writeFile(path.join(outputDir, 'cat-walk-frames.json'), JSON.stringify({ source: 'cat-walk-generated-source.png', frameCount: 8, cellSize, baseline, headSize, headAnchor, hitArea, frames: diagnostics }, null, 2));

const tileSize = 192;
const contactTiles = [];
for (const background of ['#f6f6f6', '#141414']) {
  for (const input of prepared) contactTiles.push(await sharp(input).resize(tileSize, tileSize).flatten({ background }).png().toBuffer());
}
await fs.mkdir(path.join(root, 'tmp'), { recursive: true });
await sharp({ create: { width: tileSize * 4, height: tileSize * 4, channels: 4, background: '#999' } }).composite(contactTiles.map((input, index) => ({ input, left: (index % 4) * tileSize, top: Math.floor(index / 4) * tileSize }))).png().toFile(path.join(root, 'tmp/cat-walk-contact-sheet.png'));
console.log(JSON.stringify({ frameCount: frames.length, cellSize, headSize, headAnchor, diagnostics }, null, 2));

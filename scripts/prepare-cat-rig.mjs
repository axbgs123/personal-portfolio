import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/art/cat-rig-v2');
const source = process.argv[2] || path.join(output, 'generated-source.png');
const names = ['body', 'head', 'tail', 'foreUpper', 'foreLower', 'hindUpper', 'hindLower', 'paw'];
await fs.mkdir(output, { recursive: true });
if (source !== path.join(output, 'generated-source.png')) await fs.copyFile(source, path.join(output, 'generated-source.png'));
const { width: fullWidth, height: fullHeight } = await sharp(source).metadata();
const assets = {};

for (let index = 0; index < names.length; index += 1) {
  const column = index % 4; const row = Math.floor(index / 4);
  const left = Math.round(column * fullWidth / 4); const top = Math.round(row * fullHeight / 2);
  const width = index === 0 ? 480 : Math.round((column + 1) * fullWidth / 4) - left;
  const height = Math.round((row + 1) * fullHeight / 2) - top;
  const rgb = await sharp(source).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  const mask = new Uint8Array(width * height);
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < mask.length; i += 1) {
    const r = rgb[i * 3]; const g = rgb[i * 3 + 1]; const b = rgb[i * 3 + 2];
    const spill = Math.max(0, g - Math.max(r, b));
    if (spill > 35) continue;
    mask[i] = 1;
    rgba[i * 4] = r; rgba[i * 4 + 1] = Math.min(g, Math.max(r, b) + 2); rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, (35 - spill) / 16)));
  }
  // One source cell contains a six-pixel sliver of its neighbour. Keep the main
  // generated connected shape only, never repaint or synthesize its outline.
  const visited = new Uint8Array(mask.length);
  let main = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    const component = []; const queue = [start]; visited[start] = 1;
    while (queue.length) {
      const i = queue.pop(); component.push(i);
      const x = i % width; const y = Math.floor(i / width);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        const next = (y + dy) * width + x + dx;
        if (mask[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
      }
    }
    if (component.length > main.length) main = component;
  }
  const keep = new Set(main);
  let minX = width; let minY = height; let maxX = 0; let maxY = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (!keep.has(i)) { rgba[i * 4 + 3] = 0; continue; }
    minX = Math.min(minX, i % width); maxX = Math.max(maxX, i % width);
    minY = Math.min(minY, Math.floor(i / width)); maxY = Math.max(maxY, Math.floor(i / width));
  }
  const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  assert.ok(box.width > 40 && box.height > 80, `${names[index]} is intact`);
  const buffer = await sharp(rgba, { raw: { width, height, channels: 4 } }).extract(box).png().toBuffer();
  await fs.writeFile(path.join(output, `${names[index]}.png`), buffer);
  const raw = await sharp(buffer).raw().toBuffer();
  const quantum = 5; let hitPath = '';
  for (let y = 0; y < box.height; y += quantum) {
    let start = null;
    for (let x = 0; x <= box.width + quantum; x += quantum) {
      let filled = false;
      for (let dy = 0; dy < quantum && y + dy < box.height && !filled; dy += 1) {
        for (let dx = 0; dx < quantum && x + dx < box.width; dx += 1) {
          if (raw[((y + dy) * box.width + x + dx) * 4 + 3] > 96) { filled = true; break; }
        }
      }
      if (filled && start === null) start = x;
      if (!filled && start !== null) { hitPath += `M${start} ${y}H${Math.min(x, box.width)}V${Math.min(y + quantum, box.height)}H${start}Z`; start = null; }
    }
  }
  assets[names[index]] = { href: `/art/cat-rig-v2/${names[index]}.png`, width: box.width, height: box.height, sourceBox: { ...box, left: box.left + left, top: box.top + top }, hitPath };
}
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ source: 'generated-source.png', assets }, null, 2));
console.log(Object.fromEntries(Object.entries(assets).map(([name, data]) => [name, { width: data.width, height: data.height, box: data.sourceBox }])));

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Whole generated frames only: chroma key, crop, shared scale and registration.
// No body-part extraction, redrawing, joint transforms or optical-flow synthesis.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const actions = process.argv.includes('--actions');
const folder = actions ? 'cat-sprite-actions-v1' : 'cat-sprite-soft-v1';
const rows = actions ? 4 : 2; const frameCount = rows * 4;
const out = path.join(root, 'public/art', folder);
const source = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || path.join(out, 'generated-source.png');
await fs.mkdir(out, { recursive: true });
if (source !== path.join(out, 'generated-source.png')) await fs.copyFile(source, path.join(out, 'generated-source.png'));
const meta = await sharp(source).metadata();
const frames = [];
const cellSize = 384; const baseline = 352;
for (let i = 0; i < frameCount; i += 1) {
  const col = i % 4; const row = Math.floor(i / 4);
  const overscan = actions ? 16 : 0;
  const left = Math.max(0, Math.round(col * meta.width / 4) - overscan); const top = Math.max(0, Math.round(row * meta.height / rows) - overscan);
  const width = Math.min(meta.width, Math.round((col + 1) * meta.width / 4) + overscan) - left; const height = Math.min(meta.height, Math.round((row + 1) * meta.height / rows) + overscan) - top;
  const rgb = await sharp(source).extract({left, top, width, height}).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  let x0 = width; let y0 = height; let x1 = 0; let y1 = 0;
  for (let p = 0; p < width * height; p += 1) {
    const r = rgb[p * 3]; const g = rgb[p * 3 + 1]; const b = rgb[p * 3 + 2];
    const alpha = 1 - Math.max(0, g - Math.max(r, b)) / 255;
    if (alpha < 0.12) continue;
    rgba[p * 4] = Math.min(255, Math.round(r / alpha));
    rgba[p * 4 + 1] = Math.min(255, Math.round(Math.min(g, Math.max(r, b)) / alpha));
    rgba[p * 4 + 2] = Math.min(255, Math.round(b / alpha));
    rgba[p * 4 + 3] = Math.round(alpha * 255);
    const x = p % width; const y = Math.floor(p / width);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  // Discard isolated source-border pixels, not any part of the connected cat.
  const seen = new Uint8Array(width * height); let main = [];
  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] || !rgba[start * 4 + 3]) continue;
    const component = []; const queue = [start]; seen[start] = 1;
    while (queue.length) {
      const p = queue.pop(); component.push(p);
      const x = p % width; const y = Math.floor(p / width);
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) {
        if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        const next = (y + dy) * width + x + dx;
        if (!seen[next] && rgba[next * 4 + 3]) { seen[next] = 1; queue.push(next); }
      }
    }
    if (component.length > main.length) main = component;
  }
  const keep = new Set(main); x0 = width; y0 = height; x1 = 0; y1 = 0;
  for (let p = 0; p < seen.length; p += 1) {
    if (!keep.has(p)) { rgba[p * 4 + 3] = 0; continue; }
    const x = p % width; const y = Math.floor(p / width);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  let earLeft = width; let earRight = 0;
  for (let y = y0; y < y0 + 65; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * 4;
      if (rgba[p + 3] > 100 && rgba[p] < 80) { earLeft = Math.min(earLeft, x); earRight = Math.max(earRight, x); }
    }
  }
  assert.ok(x1 - x0 > (actions ? 120 : 250) && y1 - y0 > (actions ? 90 : 240));
  frames.push({ rgba, width, height, box: {left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1}, headCenter: (earLeft + earRight) / 2 });
}
const minLeft = Math.min(...frames.map(f => f.box.left - f.headCenter));
const maxRight = Math.max(...frames.map(f => f.box.left + f.box.width - f.headCenter));
const scale = actions ? 1 : Math.min((cellSize - 24) / (maxRight - minLeft), 300 / Math.max(...frames.map(f => f.box.height)));
const headAnchor = (cellSize - (maxRight - minLeft) * scale) / 2 - minLeft * scale;
function hitPath(raw) {
  const quantum = 4; let result = '';
  for (let y = 0; y < cellSize; y += quantum) {
    let start = null;
    for (let x = 0; x <= cellSize; x += quantum) {
      let filled = false;
      for (let dy = 0; dy < quantum && !filled && x < cellSize; dy += 1) {
        for (let dx = 0; dx < quantum; dx += 1) if (raw[((y + dy) * cellSize + x + dx) * 4 + 3] > 96) { filled = true; break; }
      }
      if (filled && start === null) start = x;
      if (!filled && start !== null) { result += `M${start} ${y}H${x}V${y + quantum}H${start}Z`; start = null; }
    }
  }
  return result;
}
const pngs = []; const diagnostics = [];
for (let i = 0; i < frames.length; i += 1) {
  const f = frames[i];
  const w = Math.round(f.box.width * scale); const h = Math.round(f.box.height * scale);
  const left = actions ? Math.round((cellSize - w) / 2) : Math.round(headAnchor + (f.box.left - f.headCenter) * scale); const top = baseline - h;
  // The approved art is monochrome; eliminate subpixel green spill after resampling.
  const cut = await sharp(f.rgba, {raw: {width: f.width, height: f.height, channels: 4}}).extract(f.box).resize(w, h).greyscale().toColourspace('srgb').png().toBuffer();
  const aligned = await sharp({create: {width: cellSize, height: cellSize, channels: 4, background: '#00000000'}}).composite([{input:cut,left,top}]).png().toBuffer();
  pngs.push(aligned);
  await fs.writeFile(path.join(out, `frame-${i + 1}.png`), aligned);
  const raw = await sharp(aligned).ensureAlpha().raw().toBuffer();
  diagnostics.push({index:i, sourceBox:f.box, left, top, width:w, height:h, hitArea:hitPath(raw)});
}
const atlas = await sharp({create: {width:cellSize * frameCount,height:cellSize,channels:4,background:'#00000000'}}).composite(pngs.map((input,i)=>({input,left:i*cellSize,top:0}))).png().toBuffer();
await sharp(atlas).webp({lossless:true,effort:6}).toFile(path.join(out,'walk.webp'));
const states = actions ? {sit:[0],blink:[1],pet:[2],yawn:[3],groom:[4],stretch:[5],sleep:[6],greet:[7],guitar:[8,9],drum:[10,11],keyboard:[12,13],shakers:[14,15]} : {walk:[0,1,2,3,4,5,6,7]};
await fs.writeFile(path.join(out,'manifest.json'), JSON.stringify({kind:'whole-generated-sprite',href:'/art/'+folder+'/walk.webp',frameCount,cellSize,baseline,scale,headAnchor,sequence:Array.from({length:frameCount},(_,i)=>i),states,stridePixels:48,frames:diagnostics},null,2));
const previewDir = path.join(root,'tmp',folder); await fs.mkdir(previewDir,{recursive:true});
const tiles = []; const rawPages = [];
for (const png of pngs) {
  tiles.push(await sharp(png).resize(240,240).flatten({background:'#f6f6f6'}).png().toBuffer());
  rawPages.push(await sharp(png).resize(300,300).flatten({background:'#f6f6f6'}).ensureAlpha().raw().toBuffer());
}
await sharp({create:{width:960,height:rows*240,channels:4,background:'#f6f6f6'}}).composite(tiles.map((input,i)=>({input,left:i%4*240,top:Math.floor(i/4)*240}))).png().toFile(path.join(previewDir,'contact.png'));
await sharp(Buffer.concat(rawPages),{raw:{width:300,height:300*frameCount,channels:4,pageHeight:300}}).gif({loop:0,delay:actions ? 800 : 110,effort:7}).toFile(path.join(previewDir,'walk.gif'));
console.log(JSON.stringify({out,previewDir,cellSize,baseline,scale,headAnchor,frames:diagnostics.map(({hitArea,...data})=>data)},null,2));

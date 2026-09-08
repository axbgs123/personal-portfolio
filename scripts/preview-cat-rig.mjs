import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CAT_RIG, CAT_RIG_IMAGES, getCatRigPose } from '../src/lib/catWalkRig.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/art/cat-rig-v2/manifest.json'), 'utf8'));
const pictures = {};
for (const [name, asset] of Object.entries(manifest.assets)) pictures[name] = `data:image/png;base64,${(await fs.readFile(path.join(root, 'public', asset.href))).toString('base64')}`;
const image = (name, transform = '') => {
  const p = CAT_RIG_IMAGES[name];
  return `<g transform="${transform}"><image href="${pictures[p.asset]}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="none"/></g>`;
};
const leg = (data) => `<g>${image(`${data.family}Upper`, data.upperTransform)}${image(`${data.family}Lower`, data.lowerTransform)}${image('paw', data.pawTransform)}</g>`;
function drawing(distance) {
  const pose = getCatRigPose(distance);
  return `${image('tail', pose.tail)}${pose.legs.filter((p) => p.far).map(leg).join('')}${image('body', pose.body)}${pose.legs.filter((p) => !p.far).map(leg).join('')}${image('head', pose.head)}`;
}
await fs.mkdir(path.join(root, 'tmp'), { recursive: true });
const tiles = [];
for (let i = 0; i < 12; i += 1) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="270" viewBox="0 0 200 180"><rect width="200" height="180" fill="#f6f6f6"/><path d="M0 169H200" stroke="#bbb" stroke-width=".6"/>${drawing(i / 12 * CAT_RIG.stride)}<text x="7" y="16" font-family="sans-serif" font-size="9" fill="#777">${i + 1} / 12</text></svg>`;
  tiles.push(await sharp(Buffer.from(svg)).png().toBuffer());
}
await sharp({ create: { width: 1200, height: 810, channels: 4, background: '#f6f6f6' } }).composite(tiles.map((input, i) => ({ input, left: i % 4 * 300, top: Math.floor(i / 4) * 270 }))).png().toFile(path.join(root, 'tmp/cat-rig-contact-sheet.png'));

// Root motion and fixed ground ticks expose sliding that an in-place loop hides.
const width = 480; const height = 220; const frameCount = 60; const pages = [];
for (let i = 0; i < frameCount; i += 1) {
  const time = i / 30; const distance = time * 58.54;
  const ticks = Array.from({ length: 25 }, (_, j) => `<path d="M${j * 20} 189v5" stroke="#aaa" stroke-width="1"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="480" height="220" fill="#f6f6f6"/><path d="M0 189H480" stroke="#bbb"/>${ticks}<g transform="translate(${40 + distance} 20)">${drawing(distance)}</g></svg>`;
  pages.push(await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer());
}
await sharp(Buffer.concat(pages), { raw: { width, height: height * frameCount, channels: 4, pageHeight: height } }).gif({ loop: 0, delay: 33, effort: 5 }).toFile(path.join(root, 'tmp/cat-rig-walk-preview.gif'));
console.log('Rendered tmp/cat-rig-contact-sheet.png and tmp/cat-rig-walk-preview.gif.');

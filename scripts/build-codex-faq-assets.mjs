import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = '/Users/baiyan1/Documents/Codex/课程资料/Codex视频课/常见问题与解决方案/Markdown版/图片和附件';
const outputDir = path.resolve('public/codex-faq/assets');
const mapPath = path.resolve('src/content/codex-faq-assets.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

await mkdir(outputDir, { recursive: true });
await mkdir(path.dirname(mapPath), { recursive: true });

const imageFiles = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const imageEntries = await Promise.all(
  imageFiles.map(async (file, index) => {
    const outputName = `image-${String(index + 1).padStart(3, '0')}.webp`;
    await sharp(path.join(sourceDir, file)).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toFile(path.join(outputDir, outputName));
    return [file, `/codex-faq/assets/${outputName}`];
  }),
);

await sharp(path.join(sourceDir, 'image.png')).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 86, effort: 4 }).toFile(path.resolve('public/codex-faq/hero.webp'));
await writeFile(mapPath, `${JSON.stringify(Object.fromEntries(imageEntries), null, 2)}\n`, 'utf8');
process.stdout.write(`Processed ${imageFiles.length} FAQ images.\n`);

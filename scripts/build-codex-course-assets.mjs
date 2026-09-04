import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = '/Users/baiyan1/Documents/Codex/课程资料/Codex视频课/Markdown版/图片和附件';
const outputDir = path.resolve('public/codex-course/assets');
const downloadDir = path.resolve('public/codex-course/downloads');
const mapPath = path.resolve('src/content/codex-course-assets.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

await mkdir(outputDir, { recursive: true });
await mkdir(downloadDir, { recursive: true });
await mkdir(path.dirname(mapPath), { recursive: true });

const files = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const imageFiles = files.filter((file) => imageExtensions.has(path.extname(file).toLowerCase()));
const videoFiles = files.filter((file) => path.extname(file).toLowerCase() === '.mp4');
const downloadFiles = files.filter((file) => !imageExtensions.has(path.extname(file).toLowerCase()) && path.extname(file).toLowerCase() !== '.mp4');

const imageEntries = await Promise.all(
  imageFiles.map(async (file, index) => {
    const outputName = `image-${String(index + 1).padStart(3, '0')}.webp`;
    await sharp(path.join(sourceDir, file)).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toFile(path.join(outputDir, outputName));
    return [file, `/codex-course/assets/${outputName}`];
  }),
);

const downloadEntries = await Promise.all(
  downloadFiles.map(async (file, index) => {
    const extension = path.extname(file).toLowerCase();
    const outputName = `file-${String(index + 1).padStart(3, '0')}${extension}`;
    await copyFile(path.join(sourceDir, file), path.join(downloadDir, outputName));
    return [file, `/codex-course/downloads/${outputName}`];
  }),
);

const assetMap = Object.fromEntries([...imageEntries, ...downloadEntries, ...videoFiles.map((file) => [file, null])]);

await writeFile(mapPath, `${JSON.stringify(assetMap, null, 2)}\n`, 'utf8');
process.stdout.write(`Processed ${imageFiles.length} images and ${downloadFiles.length} downloadable files.\n`);

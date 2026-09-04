import path from 'node:path';

import sharp from 'sharp';

const inputDir = process.argv[2];
const outputDir = process.argv[3];

if (!inputDir || !outputDir) {
  throw new Error('Usage: node scripts/redact-project2-images.mjs <input-dir> <output-dir>');
}

const assets = [
  {
    input: 'Im78.jpg',
    output: 'overview.webp',
    regions: [
      [1150, 0, 320, 78],
      [70, 790, 470, 410],
    ],
  },
  {
    input: 'Im210.jpg',
    output: 'campaigns.webp',
    regions: [
      [80, 325, 385, 95],
      [535, 325, 385, 95],
      [990, 325, 385, 95],
      [80, 520, 385, 95],
      [535, 520, 385, 95],
      [990, 520, 385, 95],
      [80, 715, 385, 95],
      [535, 715, 385, 95],
      [990, 715, 385, 95],
      [80, 905, 385, 95],
      [535, 905, 385, 95],
      [990, 905, 385, 95],
    ],
  },
  {
    input: 'Im222.jpg',
    output: 'search-intent.webp',
    regions: [
      [80, 315, 1170, 65],
      [80, 385, 1170, 65],
      [80, 455, 1170, 65],
      [80, 525, 1170, 65],
      [80, 595, 1170, 65],
      [80, 665, 1170, 65],
      [80, 735, 1170, 65],
    ],
  },
  {
    input: 'Im234.jpg',
    output: 'knowledge-base.webp',
    // These cards are explicitly marked as publicly quotable in the source.
    regions: [],
  },
  {
    input: 'Im243.jpg',
    output: 'article-quality.webp',
    // The headline and article copy belong to an already-published public article.
    regions: [],
  },
  {
    input: 'Im403.jpg',
    output: 'agent-run.webp',
    regions: [
      [55, 245, 390, 415],
      [625, 285, 770, 350],
      [1510, 0, 164, 75],
    ],
  },
  {
    input: 'Im501.jpg',
    output: 'published-article.webp',
    regions: [[1160, 0, 310, 70]],
  },
];

async function pixelatedRegion(image, [left, top, width, height]) {
  const smallWidth = Math.max(2, Math.ceil(width / 18));
  const smallHeight = Math.max(2, Math.ceil(height / 18));
  const reduced = await image.clone().extract({ left, top, width, height }).resize(smallWidth, smallHeight, { kernel: sharp.kernel.nearest }).toBuffer();

  return sharp(reduced).resize(width, height, { kernel: sharp.kernel.nearest }).toBuffer();
}

for (const asset of assets) {
  const inputPath = path.join(inputDir, asset.input);
  const outputPath = path.join(outputDir, asset.output);
  const image = sharp(inputPath);
  const overlays = await Promise.all(
    asset.regions.map(async (region) => ({
      input: await pixelatedRegion(image, region),
      left: region[0],
      top: region[1],
    })),
  );

  await image.composite(overlays).webp({ quality: 86, effort: 6 }).toFile(outputPath);
  console.log(`Redacted ${asset.output}: ${asset.regions.length} regions`);
}

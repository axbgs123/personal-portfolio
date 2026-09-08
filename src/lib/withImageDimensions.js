import path from 'node:path';
import sharp from 'sharp';

const dimensions = new Map();

// Server-only: reserve the exact aspect ratio before an article's local images
// load. This keeps deep links and Back/Forward reading positions stable.
export default async function withImageDimensions(html) {
  const publicDir = path.resolve(process.cwd(), 'public');
  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  const replacements = await Promise.all(
    images.map(async ([tag]) => {
      if (/\bwidth\s*=/.test(tag) && /\bheight\s*=/.test(tag)) return tag;
      const source = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      if (!source?.startsWith('/') || source.startsWith('//')) return tag;
      const filename = path.resolve(publicDir, `.${decodeURIComponent(source.split(/[?#]/)[0])}`);
      if (!filename.startsWith(`${publicDir}${path.sep}`)) return tag;
      if (!dimensions.has(filename)) dimensions.set(filename, sharp(filename).metadata());
      const { width, height } = await dimensions.get(filename);
      if (!width || !height) return tag;
      return tag.replace(/\s+(width|height)=["'][^"']*["']/gi, '').replace(/\s*\/?>(\s*)$/, ` width="${width}" height="${height}" decoding="async" />`);
    }),
  );
  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, () => {
    const replacement = replacements[imageIndex];
    imageIndex += 1;
    return replacement;
  });
}

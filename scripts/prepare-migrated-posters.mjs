/* eslint-disable no-restricted-syntax -- Bounded sequential local video processing. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Extract a real frame for every retained local video. No source editing,
// no invented posters, no original-video download/preload on the website.
const root = fileURLToPath(new URL('../', import.meta.url));
const studies = JSON.parse(readFileSync(path.join(root, 'src/content/migrated-portfolio.json'), 'utf8'));
const folder = path.join(root, 'public/migrated-posters');
mkdirSync(folder, { recursive: true });
for (const slide of Object.values(studies)
  .flatMap((study) => study.slides)
  .filter((item) => item.type === 'video')) {
  if (!/^\/migrated-posters\/[\w-]+\.webp$/.test(slide.poster)) throw new Error('Unexpected poster path');
  const output = path.join(root, 'public', slide.poster);
  if (!existsSync(output))
    execFileSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-n',
        '-ss',
        '2',
        '-i',
        path.join(root, 'public', slide.src),
        '-frames:v',
        '1',
        '-vf',
        'scale=960:960:force_original_aspect_ratio=decrease',
        '-c:v',
        'libwebp',
        '-quality',
        '82',
        output,
      ],
      { timeout: 30000 },
    );
}

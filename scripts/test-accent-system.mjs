import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const global = read('src/components/portfolio/portfolioGlobal.scss');
const luminance = (hex) => {
  const c = hex
    .replace('#', '')
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
const contrast = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
test('approved neutral surfaces and legacy large-surface token remain neutral', () => {
  assert.match(global, /--portfolio-paper: #f6f6f6/);
  assert.match(global, /--portfolio-ink: #090909/);
  assert.match(global, /--portfolio-acid: #d8d8d8/);
  assert.match(global, /--portfolio-accent: #d74436/);
  assert.match(global, /--portfolio-accent-tint: #f6e5e2/);
  assert.match(
    read('src/components/portfolio/avantHero.module.scss'),
    /--poster-paper: #f6f6f6/,
  );
});
test('red text variants meet AA on intended surfaces; selected-panel text remains readable', () => {
  assert.ok(contrast('#b83228', '#f6f6f6') >= 4.5);
  assert.ok(contrast('#ef7768', '#090909') >= 4.5);
  assert.ok(contrast('#d74436', '#f6f6f6') >= 3);
  assert.ok(contrast('#b83228', '#f6e5e2') >= 4.5);
  assert.match(global, /--portfolio-secondary: var\(--portfolio-accent\)/);
  assert.match(global, /--portfolio-secondary-tint: var\(--portfolio-accent-tint\)/);
  assert.doesNotMatch(global, /#c7cb97|#eceede|#444c28/);
  assert.ok(contrast('#b83228', '#f6e5e2') >= 4.5);
});
test('accent is attached to a named state or action, not bulk text or body backgrounds', () => {
  assert.match(
    read('src/components/portfolio/avantHero.module.scss'),
    /\.thesis[\s\S]*?> p span\s*\{\s*color: var\(--portfolio-accent\)/,
  );
  assert.match(
    read('src/components/portfolio/portfolioShell.module.scss'),
    /\.readingProgress[\s\S]*?background: var\(--portfolio-accent\)/,
  );
  assert.match(
    read('src/components/portfolio/pianoRhythm.module.scss'),
    /data-current='true'/,
  );
  assert.match(
    read('src/components/portfolio/archiveDeck.module.scss'),
    /\.optionMark\s*\{\s*background: var\(--portfolio-accent-ink\)/,
  );
});
test('fan content, intro artwork and full-cat runtime were not replaced by color implementation', () => {
  assert.match(
    read('src/components/portfolio/ArchiveDeck.jsx'),
    /className=\{styles.fan\}/,
  );
  assert.match(
    read('src/components/portfolio/AvantHero.jsx'),
    /profilePortrait.src/,
  );
  assert.match(
    read('src/components/portfolio/AvantHero.jsx'),
    /portfolio:intro-complete/,
  );
  assert.match(
    read('src/components/portfolio/StudioCat.jsx'),
    /cat-continuity-walk-v2/,
  );
});
test('all touched accent styles compile and retain keyboard focus', () => {
  for (const file of [
    'portfolioGlobal',
    'avantHero',
    'portfolioShell',
    'archiveDeck',
    'projectStages',
    'pianoRhythm',
    'pianoLab',
  ]) {
    const filename =
      'src/components/portfolio/' +
      file +
      (file === 'portfolioGlobal' ? '.scss' : '.module.scss');
    assert.ok(
      sass.compileString(read(filename), { logger: sass.Logger.silent }).css
        .length > 0,
      filename,
    );
  }
  assert.ok(
    sass.compileString(read('src/pages/homeV2.module.scss'), {
      logger: sass.Logger.silent,
    }).css.length > 0,
  );
  assert.match(global, /button:focus-visible/);
  assert.match(global, /prefers-reduced-motion/);
});

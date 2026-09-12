import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sass from 'sass';

const source = fs.readFileSync(new URL('../src/components/portfolio/AvantHero.jsx', import.meta.url), 'utf8');
const stylePath = new URL('../src/components/portfolio/avantHero.module.scss', import.meta.url);
const css = sass.compile(stylePath.pathname).css;

test('personal nameplate removes the decorative diagonal plane and its pointer subscriptions', () => {
  assert.doesNotMatch(source, /data-hero-plane-shift|fieldWrap|moveField|quickTo/);
  assert.doesNotMatch(css, /polygon\(|fieldWrap/);
  assert.match(source, /hero-title/);
  assert.match(source, /陈祉辰/);
  assert.match(source, /profilePortrait\.src/);
  assert.match(source, /profilePortrait\.alt/);
});

test('nameplate preserves real direct destinations and opening lifecycle cleanup', () => {
  for (const href of ['/#work', '/projects/project1', '/projects/project2', '/#playground']) {
    assert.ok(source.includes(`href="${href}"`));
  }
  for (const event of ['portfolio:intro-start', 'portfolio:intro-complete']) {
    assert.ok(source.includes(`addEventListener('${event}'`));
    assert.ok(source.includes(`removeEventListener('${event}'`));
  }
  assert.match(source, /context\.revert/);
  assert.match(source, /media\.revert/);
  assert.match(source, /portfolio:replay-intro/);
  assert.doesNotMatch(source, /setInterval|requestAnimationFrame/);
});

test('nameplate includes mobile, reserved image dimensions, focus and reduced-motion styles', () => {
  assert.match(css, /max-width: 760px/);
  assert.match(css, /aspect-ratio/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(source, /prefers-reduced-motion: no-preference/);
});

test('portrait cover connects its shutters to the existing opening rather than an independent autoplay', () => {
  assert.match(source, /data-portrait-shutter/);
  assert.match(source, /\[0, 1, 2, 3, 4, 5\]/);
  assert.match(source, /data-name-baseline/);
  assert.match(source, /CHEN ZHICHEN/);
  assert.match(source, /想清楚/);
  assert.match(source, /虚拟形象/);
  assert.match(css, /\.portraitShutters[\s\S]*pointer-events: none/);
  assert.match(css, /\.nameGlyph\s*\{\s*display: block/);
  assert.match(css, /left: 49%/);
  assert.match(css, /width: clamp\(300px, 40vw, 620px\)/);
  assert.match(css, /\.portraitShutters,\s*\.replay\s*\{\s*display: none/);
});

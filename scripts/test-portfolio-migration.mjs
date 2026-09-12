import assert from 'node:assert/strict';
import fs, { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const babel = require('next/dist/compiled/babel/core');

const read = (name) => readFileSync(path.join(root, name), 'utf8');
const studies = JSON.parse(read('src/content/migrated-portfolio.json'));
const metadata = vm.runInNewContext(`${read('src/constants/migratedPortfolio.js').replace(/export const /g, 'const ')}\n({migratedProjectEntries, migratedPhotographyEntry, migratedShortDramaEntry})`);
const pages = vm.runInNewContext(
  `${read('src/constants/archivePages.js')
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/export default archivePages;/, '')}\narchivePages`,
  { ...metadata, writingArticles: [] },
);
const index = vm.runInNewContext(
  `${read('src/constants/searchIndex.js')
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/export (const|function) /g, '$1 ')}\n({searchCategories, searchDocuments})`,
  metadata,
);

const walk = (value) => {
  if (Array.isArray(value)) return value.flatMap(walk);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(walk)];
};
const inventory = (folder) => readdirSync(folder, { withFileTypes: true }).flatMap((item) => (item.isDirectory() ? inventory(path.join(folder, item.name)) : [path.join(folder, item.name)]));

test('short drama is an independent photography case with no duplicate commercial media', () => {
  assert.equal(studies.shortDrama.slides.length, 7);
  assert.equal(studies.photo.slides.length, 14);
  assert.deepEqual(studies.shortDrama.groups[0].range, [0, 7]);
  assert.doesNotMatch(JSON.stringify(studies.photo), /短剧|\/drama\//);
  const commercial = new Set(studies.photo.slides.map((slide) => slide.src));
  assert.ok(studies.shortDrama.slides.every((slide) => !commercial.has(slide.src)));
  assert.ok(existsSync(path.join(root, 'src/pages/photography/short-drama.page.jsx')));
  assert.match(read('src/pages/photography/short-drama.page.jsx'), /study: source.shortDrama/);
});

test('only requested source studies are migrated; MiMo is nested rather than a fourth project', () => {
  assert.deepEqual(Object.keys(studies).sort(), ['drama', 'ip', 'matrix', 'modelChoice', 'photo', 'shortDrama']);
  assert.deepEqual(
    Array.from(metadata.migratedProjectEntries, (entry) => entry.key),
    ['matrix', 'drama', 'ip'],
  );
  assert.equal(metadata.migratedPhotographyEntry.key, 'photo');
  assert.equal(pages.moreProjects.entries.length, 7);
  assert.deepEqual(Array.from(pages.moreProjects.entries.slice(-2), (entry) => entry.href), ['/more-projects/adcanvas', '/more-projects/open-llm-vtuber-companion']);
  assert.equal(pages.photography.entries.filter((entry) => entry.href).length, 2);
  assert.ok(!JSON.stringify([pages, index]).includes('实拍素材到 AI 商业图'));
  assert.ok(!metadata.migratedProjectEntries.some((entry) => /MiMo/.test(entry.title)));
  assert.equal(index.searchDocuments.find((entry) => entry.id === 'rag-model-review').href, '/more-projects/rag-copywriting#model-review');
});

test('retained source groups and document bodies remain complete and media are local', () => {
  assert.equal(
    Object.values(studies).reduce((sum, study) => sum + study.slides.length, 0),
    90,
  );
  assert.equal(studies.ip.groups.length, 1);
  assert.equal(studies.photo.groups.length, 3);
  const media = walk(studies).filter((item) => ['image', 'video'].includes(item.type));
  const images = media.filter((item) => item.type === 'image');
  const videos = media.filter((item) => item.type === 'video');
  assert.equal(images.length, 28);
  assert.equal(videos.length, 10);
  assert.equal(new Set(media.map((item) => item.src)).size, 34);
  media.forEach((item) => {
    assert.match(item.src, /^\/migrated-portfolio\/(?:product|ip|photo|drama)\//);
    assert.ok(!item.src.includes('..'));
    assert.ok(existsSync(path.join(root, 'public', item.src)));
    assert.ok(item.label);
  });
  images.forEach((item) => assert.ok(item.width > 0 && item.height > 0));
  const documents = walk(studies).filter((item) => item.kind === 'doc');
  assert.ok(documents.length >= 3);
  documents.forEach((document) => assert.ok(document.sections.length));
});

test('public asset inventory contains only the 34 retained original binaries, not removed sections', () => {
  const files = inventory(path.join(root, 'public/migrated-portfolio'));
  const references = new Set(
    walk(studies)
      .filter((item) => item.src)
      .map((item) => path.join(root, 'public', item.src)),
  );
  assert.equal(files.length, 34);
  files.forEach((file) => {
    assert.ok(references.has(file), `Unreferenced migrated file: ${file}`);
    assert.match(file, /\.(?:webp|png|mp4)$/);
    assert.ok(statSync(file).size > 0);
  });
});

test('removed IP sections have no data, navigation, metadata or publicly served images', () => {
  assert.equal(studies.ip.slides.length, 3);
  assert.equal(studies.ip.pages.length, 1);
  assert.ok(studies.ip.slides.every((slide) => slide.type === 'video'));
  assert.doesNotMatch(JSON.stringify([studies.ip, metadata.migratedProjectEntries, index]), /职业延展|职业形象|文创风格定制|客户图片风格化|duck-base|cultural-custom/);
  assert.ok(!existsSync(path.join(root, 'public/migrated-portfolio/ip/duck-doctor.webp')));
  assert.ok(!existsSync(path.join(root, 'public/migrated-portfolio/ip/cultural-custom/case1-input.webp')));
});

test('all retained videos have local still-frame posters without preloading original movies', () => {
  const videos = Object.values(studies)
    .flatMap((study) => study.slides)
    .filter((slide) => slide.type === 'video');
  videos.forEach((slide) => {
    assert.match(slide.poster, /^\/migrated-posters\/[\w-]+\.webp$/);
    assert.ok(existsSync(path.join(root, 'public', slide.poster)));
    assert.ok(statSync(path.join(root, 'public', slide.poster)).size < 500000);
  });
  assert.equal(inventory(path.join(root, 'public/migrated-posters')).length, 10);
});

test('entry covers are real source media; English uses its actual workflow instead of invented screenshots', () => {
  const entries = [...metadata.migratedProjectEntries, metadata.migratedPhotographyEntry, metadata.migratedShortDramaEntry];
  entries.filter((entry) => entry.image).forEach((entry) => assert.ok(existsSync(path.join(root, 'public', entry.image.src))));
  const english = entries.find((entry) => entry.key === 'drama');
  assert.equal(english.image, undefined);
  assert.equal(english.preview.steps.length, 6);
  assert.equal(studies.drama.slides.filter((slide) => ['image', 'video'].includes(slide.type)).length, 0);
  const originalFeatured = read('src/constants/projects.js');
  assert.ok(!originalFeatured.includes('rag-copywriting'));
  assert.ok(!originalFeatured.includes('ai-interview'));
});

test('new routes use static local content and the RAG route alone receives the review', () => {
  const projects = read('src/pages/more-projects/[slug].page.jsx');
  const photo = read('src/pages/photography/commercial-delivery.page.jsx');
  assert.match(projects, /fallback: false/);
  assert.match(projects, /entry\.key === 'matrix'/);
  assert.match(projects, /modelChoice/);
  assert.match(projects, /notFound: true/);
  assert.match(projects, /getStaticProps/);
  assert.match(photo, /getStaticProps/);
  assert.match(photo, /\.photo/);
  assert.ok(!/fetch\(|dangerouslySetInnerHTML/.test(projects + photo));
});

test('search has all new destinations and a usable photography filter', () => {
  [...metadata.migratedProjectEntries, metadata.migratedPhotographyEntry, metadata.migratedShortDramaEntry].forEach((entry) => {
    assert.ok(index.searchDocuments.some((document) => document.href === entry.href && document.title === entry.title));
  });
  assert.ok(index.searchCategories.some((category) => category.id === 'photography'));
  assert.match(read('src/components/portfolio/ArchiveSearch.jsx'), /id: 'photography'/);
  const ids = Array.from(index.searchDocuments, (document) => document.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('actual static route handlers serialize all three cases and only attach MiMo to RAG', () => {
  const source = read('src/pages/more-projects/[slug].page.jsx')
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/export default function /g, 'function ')
    .replace(/export function /g, 'function ');
  const { code } = babel.transformSync(`${source}\nmodule.exports = {getStaticPaths,getStaticProps};`, {
    babelrc: false,
    configFile: false,
    presets: [require.resolve('next/dist/compiled/babel/preset-react')],
  });
  const context = { module: { exports: {} }, fs, path, process: { cwd: () => root }, ...metadata };
  vm.runInNewContext(code, context);
  const { exports: handlers } = context.module;
  const routes = handlers.getStaticPaths();
  assert.equal(routes.fallback, false);
  assert.equal(routes.paths.length, 3);
  routes.paths.forEach(({ params }) => {
    const { props } = handlers.getStaticProps({ params });
    assert.equal(props.entry.slug, params.slug);
    assert.deepEqual(JSON.parse(JSON.stringify(props.study)), studies[props.entry.key]);
    assert.deepEqual(JSON.parse(JSON.stringify(props.review)), props.entry.key === 'matrix' ? studies.modelChoice : null);
  });
  assert.equal(handlers.getStaticProps({ params: { slug: 'model-review' } }).notFound, true);
  assert.equal(handlers.getStaticProps({ params: { slug: 'ecommerce' } }).notFound, true);
});

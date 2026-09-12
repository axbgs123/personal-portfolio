/* eslint-disable no-restricted-syntax, no-await-in-loop -- Node-only migration uses sequential media IO for deterministic ordering and bounded memory. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Static migration only: never eval, import, or execute any source HTML script.
// Read index.html (not a backup), whitelist its projectDetails AST, then emit
// JSON for apply_patch. --copy-assets copies referenced binary media only.
// Usage: node scripts/import-legacy-portfolio.mjs --source '/old/site' --json
//        node scripts/import-legacy-portfolio.mjs --source '/old/site' --copy-assets
//        node scripts/import-legacy-portfolio.mjs --source '/old/site' --check
// The JSON is deliberately sent to stdout, not written by this script.

const require = createRequire(import.meta.url);
const babel = require('next/dist/compiled/babel/core');
const sharp = require('sharp');

const root = fileURLToPath(new URL('../', import.meta.url));
const selectedKeys = ['matrix', 'drama', 'modelChoice', 'ip', 'photo'];
const flags = new Set(['--json', '--copy-assets', '--check']);
const argumentsList = process.argv.slice(2);
let sourceDirectory;
for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];
  if (argument === '--source') {
    index += 1;
    sourceDirectory = argumentsList[index];
    assert.ok(sourceDirectory, '--source needs a directory');
  } else assert.ok(flags.has(argument), `Unknown option: ${argument}`);
}
assert.ok(
  sourceDirectory,
  'Supply --source pointing to the old site directory',
);
const sourceRoot = await realpath(path.resolve(sourceDirectory));
const htmlPath = path.join(sourceRoot, 'index.html');
const html = await readFile(htmlPath, 'utf8');
const scripts = [
  ...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi),
].map((match) => match[1]);
const candidates = scripts.filter((script) =>
  /\bconst\s+projectDetails\s*=/.test(script),
);
assert.equal(
  candidates.length,
  1,
  'Exactly one projectDetails source declaration is required',
);
const ast = babel.parseSync(candidates[0], {
  sourceType: 'script',
  babelrc: false,
  configFile: false,
});
const declarations = ast.program.body
  .filter((node) => node.type === 'VariableDeclaration')
  .flatMap((node) => node.declarations);
const details = declarations.filter(
  (node) => node.id.type === 'Identifier' && node.id.name === 'projectDetails',
);
const baseDeclaration = declarations.find(
  (node) => node.id.type === 'Identifier' && node.id.name === 'fullMediaBase',
);
assert.equal(details.length, 1);
assert.equal(details[0].init.type, 'ObjectExpression');
assert.equal(baseDeclaration?.init.type, 'StringLiteral');
assert.equal(baseDeclaration.init.value, 'assets/portfolio_full/');
const mediaBase = baseDeclaration.init.value;

const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
function propertyName(node) {
  assert.equal(
    node.type,
    'ObjectProperty',
    'Only ordinary data properties are allowed',
  );
  assert.equal(node.computed, false, 'Computed properties are not data');
  assert.equal(node.shorthand, false, 'Shorthand references are not data');
  let key = null;
  if (node.key.type === 'Identifier') key = node.key.name;
  if (node.key.type === 'StringLiteral') key = node.key.value;
  assert.equal(typeof key, 'string', 'Only string property names are allowed');
  assert.ok(!forbiddenKeys.has(key), 'Unsafe object property');
  return key;
}
function evaluateData(node) {
  assert.ok(node, 'Array holes are not supported');
  if (
    ['StringLiteral', 'BooleanLiteral', 'NumericLiteral'].includes(node.type)
  ) {
    if (node.type === 'NumericLiteral') assert.ok(Number.isFinite(node.value));
    return node.value;
  }
  if (node.type === 'NullLiteral') return null;
  if (node.type === 'ArrayExpression') return node.elements.map(evaluateData);
  if (node.type === 'ObjectExpression') {
    const result = Object.create(null);
    for (const property of node.properties) {
      const key = propertyName(property);
      assert.ok(!Object.hasOwn(result, key), `Duplicate data key: ${key}`);
      result[key] = evaluateData(property.value);
    }
    return result;
  }
  if (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    node.argument.type === 'NumericLiteral'
  )
    return -node.argument.value;
  assert.equal(
    node.type,
    'CallExpression',
    `Non-data AST node rejected: ${node.type}`,
  );
  assert.equal(node.callee.type, 'Identifier', 'Member calls are not allowed');
  const helpers = {
    img: [2, 2],
    vid: [2, 3],
    card: [3, 4],
    noticeCard: [3, 4],
    flowCard: [4, 4],
    mapCard: [4, 4],
    docCard: [4, 5],
  };
  const { name } = node.callee;
  assert.ok(Object.hasOwn(helpers, name), `Unknown source helper: ${name}`);
  const [minimum, maximum] = helpers[name];
  assert.ok(
    node.arguments.length >= minimum && node.arguments.length <= maximum,
    `Unexpected arity: ${name}`,
  );
  const values = node.arguments.map(evaluateData);
  if (name === 'img' || name === 'vid') {
    const [src, label, landscape = false] = values;
    assert.equal(typeof src, 'string');
    assert.equal(typeof label, 'string');
    assert.equal(typeof landscape, 'boolean');
    return name === 'img'
      ? { type: 'image', src: mediaBase + src, label }
      : { type: 'video', src: mediaBase + src, label, landscape };
  }
  const [label, title, body, extra, button] = values;
  for (const value of [label, title, body])
    assert.equal(typeof value, 'string');
  const common = { type: 'card', label, title, body };
  if (name === 'card') return { ...common, kind: extra ?? 'text' };
  if (name === 'noticeCard')
    return { ...common, kind: 'notice', button: extra ?? '查看说明' };
  assert.ok(Array.isArray(extra), `Expected structured array: ${name}`);
  if (name === 'flowCard') return { ...common, kind: 'flow', steps: extra };
  if (name === 'mapCard') return { ...common, kind: 'map', branches: extra };
  return {
    ...common,
    kind: 'doc',
    sections: extra,
    button: button ?? '展开产品文档',
  };
}

const properties = new Map();
for (const property of details[0].init.properties) {
  const key = propertyName(property);
  assert.ok(!properties.has(key), `Duplicate project key: ${key}`);
  properties.set(key, property.value);
}
const data = Object.create(null);
for (const key of selectedKeys) {
  assert.ok(properties.has(key), `Missing requested project: ${key}`);
  data[key] = evaluateData(properties.get(key));
}
// User's second curation pass: remove entire career-extension/customization
// sections, not merely their labels. Original index.html remains untouched.
data.ip.title = '创亿鸭 IP AI 漫剧内容管线';
data.ip.desc =
  '以创亿鸭 IP 为核心，围绕主题策划、角色一致性、图生视频和后期合成，展示端午节祝福、校园文创科技空间、学校美育日三条成片及内容生产流程。';
data.ip.slides = data.ip.slides.slice(0, 3);
data.ip.groups = data.ip.groups.slice(0, 1);
data.ip.pages = data.ip.pages.slice(0, 1);
const shortGroup = data.photo.groups[3];
data.shortDrama = {
  type: 'SHORT FILM / EDITING',
  title: '真人竖屏短剧拍摄与剪辑调色',
  desc: shortGroup.desc,
  pagedGroups: true,
  groups: [{ ...shortGroup, range: [0, 7] }],
  notes: [['我的角色', shortGroup.desc]],
  slides: data.photo.slides.slice(14),
};
data.photo.slides = data.photo.slides.slice(0, 14);
data.photo.groups = data.photo.groups.slice(0, 3);
data.photo.desc =
  '商业活动摄影与现场视频记录，按年会、赛事和品牌活动分组展示。';
data.photo.notes = [
  ['项目背景', '企业年会、赛事和活动现场需要稳定的拍摄判断与后期交付。'],
  ['我的角色', '负责现场摄影与视频协作。'],
  ['展示方式', '按项目分组查看照片、视频和交付说明。'],
];
const destinationRoot = path.join(root, 'public/migrated-portfolio');
const assets = new Map();
async function registerMedia(source, owner, type) {
  assert.equal(typeof source, 'string');
  assert.ok(source.startsWith(mediaBase), `Out-of-scope media: ${source}`);
  const relative = source.slice(mediaBase.length);
  assert.ok(
    relative &&
      !relative.includes('\\') &&
      !relative.split('/').includes('..') &&
      !path.isAbsolute(relative),
    'Unsafe source media path',
  );
  assert.ok(
    /\.(?:png|jpe?g|webp|avif|gif|mp4|webm|mov)$/i.test(relative),
    'Only binary image/video media may be copied',
  );
  const absolute = await realpath(path.join(sourceRoot, source));
  assert.ok(
    absolute.startsWith(`${sourceRoot}${path.sep}`),
    'Symlink escapes the source directory',
  );
  const destination = path.join(destinationRoot, relative);
  assert.ok(destination.startsWith(`${destinationRoot}${path.sep}`));
  if (!assets.has(relative)) {
    const info = await stat(absolute);
    assert.ok(info.isFile());
    const metadata = {
      src: `/migrated-portfolio/${relative}`,
      source: absolute,
      destination,
      bytes: info.size,
      type,
      owners: [],
    };
    if (type === 'image') {
      const image = await sharp(absolute).metadata();
      assert.ok(
        image.width > 0 && image.height > 0,
        `Missing image dimensions: ${relative}`,
      );
      metadata.width = image.width;
      metadata.height = image.height;
    } else {
      try {
        const probe = JSON.parse(
          execFileSync(
            'ffprobe',
            [
              '-v',
              'error',
              '-select_streams',
              'v:0',
              '-show_entries',
              'stream=width,height:format=duration',
              '-of',
              'json',
              absolute,
            ],
            { encoding: 'utf8', timeout: 15000 },
          ),
        );
        metadata.width = probe.streams?.[0]?.width;
        metadata.height = probe.streams?.[0]?.height;
        metadata.durationSeconds = Number(probe.format?.duration) || null;
      } catch {
        metadata.probeUnavailable = true;
      }
    }
    metadata.sha256 = createHash('sha256')
      .update(await readFile(absolute))
      .digest('hex');
    assets.set(relative, metadata);
  }
  const asset = assets.get(relative);
  if (!asset.owners.includes(owner)) asset.owners.push(owner);
  return asset;
}
async function migrateMedia(value, owner) {
  if (Array.isArray(value)) {
    for (const item of value) await migrateMedia(item, owner);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (value.type === 'image' || value.type === 'video') {
    const media = await registerMedia(value.src, owner, value.type);
    value.src = media.src;
    if (media.width > 0 && media.height > 0) {
      value.width = media.width;
      value.height = media.height;
    }
    // Posters are mechanically extracted frames, separately generated by
    // prepare-migrated-posters.mjs. No invented visual replaces source media.
    if (value.type === 'video')
      value.poster = `/migrated-posters/${path.basename(media.src, path.extname(media.src))}.webp`;
  }
  for (const item of Object.values(value)) await migrateMedia(item, owner);
}
for (const key of Object.keys(data)) await migrateMedia(data[key], key);

// Preserve real entry images if present. The current source entry articles only
// contain CSS .slot placeholders, so this yields [] and creates no fake covers.
const articleCovers = Object.create(null);
for (const key of selectedKeys) {
  const articles = [
    ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi),
  ];
  const article = articles.find((match) =>
    new RegExp(`\\bdata-key=["']${key}["']`).test(match[1]),
  );
  assert.ok(article, `Missing source article: ${key}`);
  const images = [
    ...article[2].matchAll(
      /<(?:img|video)\b[^>]*\b(?:src|poster)=["']([^"']+)["']/gi,
    ),
  ].map((match) => match[1]);
  articleCovers[key] = [];
  for (const source of [...new Set(images)]) {
    const type = /\.(?:mp4|webm|mov)$/i.test(source) ? 'video' : 'image';
    articleCovers[key].push((await registerMedia(source, key, type)).src);
  }
}

for (const [key, project] of Object.entries(data)) {
  assert.ok(
    Array.isArray(project.slides) && Array.isArray(project.notes),
    `Unexpected project shape: ${key}`,
  );
  for (const group of project.groups || []) {
    assert.ok(Array.isArray(group.range) && group.range.length === 2);
    assert.ok(
      group.range[0] >= 0 &&
        group.range[1] <= project.slides.length &&
        group.range[0] < group.range[1],
    );
  }
  for (const notes of [
    project.notes,
    ...(project.pages || []).map((page) => page.notes),
  ]) {
    for (const note of notes || [])
      if (note.length > 2)
        assert.ok(
          Number.isInteger(note[2]) &&
            note[2] >= 0 &&
            note[2] < project.slides.length,
          `Invalid note index in ${key}`,
        );
  }
  for (const index of project.slideOrder || [])
    assert.ok(
      Number.isInteger(index) && index >= 0 && index < project.slides.length,
    );
}

if (argumentsList.includes('--copy-assets')) {
  for (const asset of assets.values()) {
    await mkdir(path.dirname(asset.destination), { recursive: true });
    // Never silently overwrite a different existing asset; preserve originals.
    try {
      assert.equal(
        createHash('sha256')
          .update(await readFile(asset.destination))
          .digest('hex'),
        asset.sha256,
        `Existing destination differs: ${asset.src}`,
      );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await copyFile(asset.source, asset.destination);
    }
  }
}
if (argumentsList.includes('--check')) {
  const actual = JSON.parse(
    await readFile(
      path.join(root, 'src/content/migrated-portfolio.json'),
      'utf8',
    ),
  );
  assert.equal(
    JSON.stringify(actual),
    JSON.stringify(data),
    'Migrated JSON differs from static extraction',
  );
  for (const asset of assets.values())
    assert.equal(
      createHash('sha256')
        .update(await readFile(asset.destination))
        .digest('hex'),
      asset.sha256,
      `Missing or changed asset: ${asset.src}`,
    );
}
const urls = [
  ...new Set(
    JSON.stringify(data).match(
      /https?:\/\/[a-z0-9][^\s"'\\<>\u0080-\uffff]*/gi,
    ) || [],
  ),
];
const report = {
  sourceFile: htmlPath,
  sourceSha256: createHash('sha256').update(html).digest('hex'),
  projectCounts: Object.fromEntries(
    Object.entries(data).map(([key, project]) => [
      key,
      {
        fields: Object.keys(project),
        slides: project.slides.length,
        cards: project.slides.filter((slide) => slide.type === 'card').length,
        images: project.slides.filter((slide) => slide.type === 'image').length,
        videos: project.slides.filter((slide) => slide.type === 'video').length,
        groups: project.groups?.length || 0,
        pages: project.pages?.length || 0,
        notes: project.notes.length,
      },
    ]),
  ),
  articleCovers,
  assetCount: assets.size,
  totalBytes: [...assets.values()].reduce((sum, asset) => sum + asset.bytes, 0),
  videoBytes: [...assets.values()]
    .filter((asset) => asset.type === 'video')
    .reduce((sum, asset) => sum + asset.bytes, 0),
  urls: urls.map((url) => ({ url, status: 'not-network-verified' })),
  assets: [...assets.values()].map(
    ({ source, destination, ...metadata }) => metadata,
  ),
};
process.stdout.write(
  `${JSON.stringify(argumentsList.includes('--json') ? data : report, null, 2)}\n`,
);

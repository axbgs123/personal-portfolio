import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('src/components/archive/ProjectReel.jsx', root), 'utf8');
const styleFile = new URL('src/components/archive/projectReel.module.scss', root);
const { css } = require('sass').compile(fileURLToPath(styleFile));
const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const styles = new Proxy({}, { get: (_, name) => String(name) });

function loadData(name, extra = {}) {
  const input = readFileSync(new URL(`src/constants/${name}.js`, root), 'utf8').replace(/^import[^\n]*\n/gm, '').replace(/export default ([^;]+);/, 'module.exports = $1;');
  const context = { module: { exports: {} }, ...extra };
  vm.runInNewContext(input, context);
  return context.module.exports;
}

const projects = loadData('projects');
const pages = loadData('archivePages', { writingArticles: loadData('writingArticles') });
const entries = pages.moreProjects.entries.map((entry) => ({
  ...entry,
  image: { src: projects.find((project) => project.link === entry.href).img, fit: 'cover' },
  linkLabel: '查看完整案例',
}));
const compiled = require('next/dist/compiled/babel/core').transformSync(
  `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function ProjectReel', 'function ProjectReel')}\nmodule.exports = ProjectReel;`,
  { filename: 'ProjectReel.test.jsx', babelrc: false, configFile: false, presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]] },
).code;

function nodes(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return typeof value === 'object' ? [value, ...nodes(value.props.children)] : [];
}

function text(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(text).join('');
  return typeof value === 'object' ? text(value.props.children) : String(value);
}

function classIs(node, name) { return node.props.className?.split(' ').includes(name); }

function harness(initialEntries = entries) {
  const state = [];
  let cursor = 0;
  const props = { entries: initialEntries };
  const context = {
    module: { exports: {} }, React, styles, Image: 'Image', Link: 'Link', useId: () => 'reel-test',
    useState(initial) {
      const index = cursor; cursor += 1;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
  };
  vm.runInNewContext(compiled, context);
  const expand = (value) => {
    if (Array.isArray(value)) return value.map(expand);
    if (!value || typeof value !== 'object') return value;
    if (typeof value.type === 'function') return expand(value.type(value.props));
    return { ...value, props: { ...value.props, children: expand(value.props.children) } };
  };
  return {
    props,
    render() { cursor = 0; return nodes(expand(context.module.exports(props))); },
  };
}

function click(page, className, index = 0) {
  const node = page.render().filter((item) => classIs(item, className))[index];
  assert.equal(node.type, 'button');
  assert.equal(node.props.type, 'button');
  node.props.onClick();
  return page.render();
}

test('the default reel contains both real case covers and full authoritative titles', () => {
  const page = harness();
  const tree = page.render();
  assert.equal(tree.filter((node) => node.type === 'article').length, 2);
  assert.equal(tree.find((node) => classIs(node, 'stage')).props['data-expanded'], false);
  const images = tree.filter((node) => node.type === 'Image');
  assert.equal(images.length, 2);
  images.forEach((image, index) => {
    assert.equal(image.props.src, entries[index].image.src);
    assert.ok(existsSync(new URL(`public${image.props.src}`, root)));
    assert.ok(image.props.alt.includes(entries[index].title));
    assert.equal(image.props.style.objectFit, 'cover');
  });
  entries.forEach((entry) => assert.ok(tree.some((node) => node.type === 'h2' && text(node) === entry.title)));
});

test('case titles and native preview controls precede their images in DOM reading and focus order', () => {
  const tree = harness().render();
  tree.filter((node) => node.type === 'article').forEach((article) => {
    const children = nodes(article.props.children);
    const titleIndex = children.findIndex((node) => node.type === 'h2');
    const expandIndex = children.findIndex((node) => classIs(node, 'expand'));
    const pictureIndex = children.findIndex((node) => classIs(node, 'picture'));
    assert.ok(titleIndex >= 0 && titleIndex < expandIndex && expandIndex < pictureIndex);
    const preview = children.find((node) => classIs(node, 'preview'));
    assert.equal(preview.props.hidden, true);
    assert.equal(preview.props['aria-hidden'], true);
  });
});

test('titles and complete-case links navigate on their first activation without selection handlers', () => {
  const page = harness();
  const links = page.render().filter((node) => node.type === 'Link');
  assert.equal(links.length, 4);
  entries.forEach((entry) => assert.equal(links.filter((link) => link.props.href === entry.href).length, 2));
  links.forEach((link) => {
    assert.equal(link.props.onClick, undefined);
    assert.equal(link.props.onPointerDown, undefined);
    assert.equal(link.props.scroll, false);
  });
});

test('a preview changes framing to the entire image and reveals only the original selected description', () => {
  const page = harness();
  const tree = click(page, 'expand', 0);
  const articles = tree.filter((node) => node.type === 'article');
  assert.equal(articles[0].props['data-selected'], true);
  assert.equal(articles[1].props['data-compact'], true);
  const images = tree.filter((node) => node.type === 'Image');
  assert.equal(images[0].props.style.objectFit, 'contain');
  assert.equal(images[1].props.style.objectFit, 'cover');
  const previews = tree.filter((node) => classIs(node, 'preview'));
  assert.equal(previews[0].props.hidden, false);
  assert.equal(previews[0].props['aria-hidden'], false);
  assert.equal(previews[1].props.hidden, true);
  assert.equal(text(previews[0]), entries[0].desc);
  assert.equal(text(previews[1]), entries[1].desc);
  assert.equal(tree.filter((node) => classIs(node, 'expand'))[0].props['aria-expanded'], true);
  assert.match(text(tree.find((node) => node.props.role === 'status')), /当前预览/);
});

test('either preview button can expand its case and the selected button can restore both cuts', () => {
  const page = harness();
  click(page, 'expand', 0);
  let tree = click(page, 'expand', 1);
  assert.equal(tree.filter((node) => node.type === 'article')[1].props['data-selected'], true);
  assert.equal(tree.filter((node) => node.type === 'article')[0].props['data-compact'], true);
  tree = click(page, 'expand', 1);
  assert.equal(tree.find((node) => classIs(node, 'stage')).props['data-expanded'], false);
  assert.ok(tree.filter((node) => classIs(node, 'preview')).every((node) => node.props.hidden));
});

test('manual previous/next wraps predictably and overview restores the two-case composition', () => {
  const page = harness();
  const choose = (label) => {
    page.render().find((node) => node.props['aria-label'] === label).props.onClick();
    return page.render().filter((node) => node.type === 'article').findIndex((node) => node.props['data-selected']);
  };
  assert.equal(choose('下一案例预览'), 0);
  assert.equal(choose('下一案例预览'), 1);
  assert.equal(choose('下一案例预览'), 0);
  assert.equal(choose('上一案例预览'), 1);
  click(page, 'overview');
  assert.equal(page.render().find((node) => classIs(node, 'stage')).props['data-expanded'], false);
  assert.equal(choose('上一案例预览'), 1);
});

test('selection follows its destination key after data reordering instead of showing a different case', () => {
  const page = harness();
  click(page, 'expand', 0);
  page.props.entries = [...entries].reverse();
  let tree = page.render();
  assert.equal(text(tree.filter((node) => node.type === 'article').find((node) => node.props['data-selected']).props.children).includes(entries[0].title), true);
  page.props.entries = [entries[1]];
  tree = page.render();
  assert.equal(tree.find((node) => classIs(node, 'stage')).props['data-expanded'], false);
});

test('preview controls are native buttons with unique controlled descriptions and no drag traps', () => {
  const tree = harness().render();
  const ids = tree.map((node) => node.props.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
  tree.filter((node) => node.type === 'button').forEach((button) => {
    assert.equal(button.props.type, 'button');
    assert.ok(ids.includes(button.props['aria-controls']));
    assert.equal(button.props.onKeyDown, undefined);
  });
  tree.forEach((node) => {
    assert.equal(node.props.onPointerDown, undefined);
    assert.equal(node.props.onWheel, undefined);
  });
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|setTimeout|addEventListener|Math\.random|localStorage/);
});

test('missing assets and unsafe URLs never produce invented media or executable destinations', () => {
  const tree = harness([{ title: '资料名称', desc: '已有文字', href: 'javascript:alert(1)' }]).render();
  assert.equal(tree.filter((node) => ['Image', 'Link', 'a'].includes(node.type)).length, 0);
  assert.match(text(tree.find((node) => classIs(node, 'missingImage'))), /待补充/);
  assert.equal(tree.filter((node) => classIs(node, 'step')).every((node) => node.props.disabled), true);
  assert.match(text(harness([]).render()[0]), /项目资料待补充/);
});

test('external URLs remain real links with safe new-window context and original alt is preserved', () => {
  const tree = harness([{ title: '已有项目', href: 'https://example.com/project', image: { src: '/image.webp', alt: '原始配图说明' } }]).render();
  tree.filter((node) => node.type === 'a').forEach((node) => {
    assert.equal(node.props.target, '_blank');
    assert.equal(node.props.rel, 'noopener noreferrer');
    assert.match(text(node), /在新窗口打开/);
  });
  assert.equal(tree.find((node) => node.type === 'Image').props.alt, '原始配图说明');
});

test('CSS compiles with cinematic masking, readable compressed titles, mobile stacking and reduced motion', () => {
  assert.match(css, /@keyframes apertureReveal/);
  assert.match(css, /clip-path: inset\(0 39% 0 39%\)/);
  assert.match(css, /\[data-selected=true\][\s\S]*flex-grow: 4/);
  assert.match(css, /\[data-compact=true\][\s\S]*min-width: 176px/);
  assert.match(css, /@media \(max-width: 740px\)[\s\S]*\.stage\s*\{\s*flex-direction: column/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important;[\s\S]*transition: none !important/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /touch-action:\s*none|scroll-snap|position:\s*fixed/);
  assert.match(css, /\.reel\s*\{[^}]*padding: 0;/);
  assert.match(css, /\.preview\[hidden\]\s*\{\s*display: none;/);
  assert.doesNotMatch(css, /min-height:\s*clamp\(580px/);
});

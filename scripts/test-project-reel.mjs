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
  const dataSource = readFileSync(new URL(`src/constants/${name}.js`, root), 'utf8');
  const named = [...dataSource.matchAll(/export const (\w+)/g)].map((match) => match[1]);
  const input =
    dataSource
      .replace(/^import[^\n]*\n/gm, '')
      .replace(/export const /g, 'const ')
      .replace(/export default ([^;]+);/, 'module.exports = $1;') + (named.length ? `\nmodule.exports = { ${named.join(', ')} };` : '');
  const context = { module: { exports: {} }, ...extra };
  vm.runInNewContext(input, context);
  return context.module.exports;
}

const projects = loadData('projects');
const migrated = loadData('migratedPortfolio');
const pages = loadData('archivePages', { writingArticles: loadData('writingArticles'), ...migrated });
const allEntries = pages.moreProjects.entries.map((entry) => {
  const project = projects.find((candidate) => candidate.link === entry.href);
  return { ...entry, image: entry.image || (project ? { src: project.img, fit: 'cover' } : undefined), linkLabel: entry.linkLabel || '查看完整案例' };
});
// Keep the original two-case behavior as an explicit boundary fixture.
const entries = allEntries.slice(0, 2);
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

function classIs(node, name) {
  return node.props.className?.split(' ').includes(name);
}

function harness(initialEntries = entries) {
  const state = [];
  let cursor = 0;
  const props = { entries: initialEntries };
  const context = {
    module: { exports: {} },
    React,
    styles,
    Image: 'Image',
    Link: 'Link',
    useId: () => 'reel-test',
    useState(initial) {
      const index = cursor;
      cursor += 1;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === 'function' ? next(state[index]) : next;
        },
      ];
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
    render() {
      cursor = 0;
      return nodes(expand(context.module.exports(props)));
    },
  };
}

function click(page, className, index = 0) {
  const node = page.render().filter((item) => classIs(item, className))[index];
  assert.equal(node.type, 'button');
  assert.equal(node.props.type, 'button');
  node.props.onClick();
  return page.render();
}

test('the two-case boundary fixture retains both original covers and full authoritative titles', () => {
  const page = harness();
  const tree = page.render();
  assert.equal(tree.filter((node) => node.type === 'article').length, 2);
  assert.equal(tree.find((node) => classIs(node, 'stage')).props['data-expanded'], false);
  assert.equal(tree.find((node) => classIs(node, 'stage')).props['data-many'], false);
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

test('the expanded archive keeps original cases and the two supplied GitHub projects', () => {
  assert.equal(allEntries.length, 7);
  assert.deepEqual(
    Array.from(allEntries.slice(2, 5), (entry) => entry.href),
    Array.from(migrated.migratedProjectEntries, (entry) => entry.href),
  );
  const page = harness(allEntries);
  const tree = page.render();
  const articles = tree.filter((node) => node.type === 'article');
  assert.equal(articles.length, allEntries.length);
  assert.equal(text(tree.find((node) => classIs(node, 'caseCount'))), '7 个案例');
  assert.equal(tree.find((node) => classIs(node, 'desk')).props['data-collection'], 'true');
  allEntries.forEach((entry, index) => {
    assert.ok(text(articles[index]).includes(entry.title));
    assert.ok(text(articles[index]).includes(entry.desc));
    const links = nodes(articles[index]).filter((node) => node.type === 'Link' || node.type === 'a');
    assert.equal(links.length, 2);
    links.forEach((link) => {
      assert.equal(link.props.href, entry.href);
      assert.equal(link.props.onClick, undefined);
      if (link.type === 'a') { assert.equal(link.props.target, '_blank'); assert.equal(link.props.rel, 'noopener noreferrer'); }
    });
    if (entry.image?.src) {
      const image = nodes(articles[index]).find((node) => node.type === 'Image');
      assert.equal(image.props.src, entry.image.src);
      assert.ok(existsSync(new URL(`public${image.props.src}`, root)));
    }
  });
  assert.equal(tree.filter((node) => node.type === 'Image').length, 7);
  assert.equal(tree.filter((node) => classIs(node, 'expand')).length, 0);
  assert.equal(tree.filter((node) => classIs(node, 'preview')).length, 0);
});

test('the comparison desk switches only its viewing surface while every neighboring case remains readable and linked', () => {
  const page = harness(allEntries);
  allEntries.forEach((entry, index) => {
    const tree = click(page, 'deskSelect', index);
    const articles = tree.filter((node) => node.type === 'article');
    assert.equal(articles.length, allEntries.length);
    assert.equal(articles[index].props['data-selected'], true);
    assert.ok(articles.every((article) => !article.props['data-compact']));
    assert.equal(text(tree.filter((node) => classIs(node, 'deskSummary'))[index]), entry.desc);
    allEntries.forEach((item, itemIndex) => {
      assert.ok(text(articles[itemIndex]).includes(item.title));
      assert.ok(text(articles[itemIndex]).includes(item.desc));
      assert.ok(nodes(articles[itemIndex]).some((node) => (node.type === 'Link' || node.type === 'a') && node.props.href === item.href));
    });
    const open = tree.find((node) => classIs(node, 'deskOpen'));
    assert.equal(open.props.href, entry.href);
    assert.equal(open.props.onClick, undefined);
    assert.equal(tree.find((node) => classIs(node, 'deskView')).props['aria-label'], `当前封面预览：${entry.title}`);
  });
  assert.match(css, /\.deskLayout\s*\{[^}]*grid-template-columns:/);
  assert.match(css, /\.deskView\s*\{[^}]*position: sticky;/);
});

test('English interview uses its exact supplied text preview instead of an invented image or missing-cover message', () => {
  const original = migrated.migratedProjectEntries.find((entry) => entry.slug === 'ai-interview');
  const page = harness(allEntries);
  const tree = click(
    page,
    'deskSelect',
    allEntries.findIndex((entry) => entry.href === original.href),
  );
  const article = tree.filter((node) => node.type === 'article').find((node) => text(node).includes(original.title));
  assert.ok(article);
  const flow = tree.find((node) => classIs(node, 'deskFlow'));
  assert.ok(text(flow).includes(original.preview.title));
  original.preview.steps.forEach((step) => assert.ok(text(flow).includes(step)));
  const steps = nodes(flow).filter((node) => node.type === 'li');
  assert.equal(steps.length, original.preview.steps.length);
  original.preview.steps.forEach((step, index) => assert.ok(text(steps[index]).includes(step)));
  assert.equal(nodes(article).filter((node) => node.type === 'Image').length, 0);
  assert.equal(nodes(article).filter((node) => classIs(node, 'missingImage')).length, 0);
  assert.ok(!text(article).includes('项目封面待补充'));
});

test('every desk index is an explicit keyboard-ready preview, not a next/previous or expand gate', () => {
  const page = harness(allEntries);
  [4, 2, 0, 3, 1].forEach((index) => {
    const tree = click(page, 'deskSelect', index);
    const buttons = tree.filter((node) => node.type === 'button');
    assert.equal(buttons.length, allEntries.length);
    buttons.forEach((button, buttonIndex) => {
      assert.equal(button.props.type, 'button');
      assert.equal(button.props['aria-pressed'], buttonIndex === index);
      assert.equal(button.props['aria-controls'], tree.find((node) => classIs(node, 'deskView')).props.id);
      assert.equal(button.props['aria-label'], `预览封面：${allEntries[buttonIndex].title}`);
      assert.equal(button.props.onKeyDown, undefined);
    });
    assert.match(text(tree.find((node) => node.props.role === 'status')), /当前预览/);
  });
  assert.equal(page.render().filter((node) => classIs(node, 'overview') || classIs(node, 'step')).length, 0);
  const links = page.render().filter((node) => node.type === 'Link');
  assert.ok(links.every((link) => link.props.onClick === undefined));
});

test('desk selection follows the destination across reordered content and falls back to a real case when removed', () => {
  const page = harness(allEntries);
  click(page, 'deskSelect', 3);
  page.props.entries = [...allEntries].reverse();
  let tree = page.render();
  assert.equal(tree.find((node) => classIs(node, 'deskOpen')).props.href, allEntries[3].href);
  page.props.entries = allEntries.filter((entry) => entry.href !== allEntries[3].href);
  tree = page.render();
  assert.equal(tree.find((node) => classIs(node, 'deskOpen')).props.href, allEntries[0].href);
  assert.equal(tree.filter((node) => classIs(node, 'deskEntry') && node.props['data-selected']).length, 1);
});

test('case titles and native preview controls precede their images in DOM reading and focus order', () => {
  const tree = harness().render();
  tree
    .filter((node) => node.type === 'article')
    .forEach((article) => {
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
    page
      .render()
      .find((node) => node.props['aria-label'] === label)
      .props.onClick();
    return page
      .render()
      .filter((node) => node.type === 'article')
      .findIndex((node) => node.props['data-selected']);
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
  tree
    .filter((node) => node.type === 'button')
    .forEach((button) => {
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
  const tree = harness([{ title: '资料名称', desc: '已有文字', href: ['javascript', 'alert(1)'].join(':') }]).render();
  assert.equal(tree.filter((node) => ['Image', 'Link', 'a'].includes(node.type)).length, 0);
  assert.match(text(tree.find((node) => classIs(node, 'missingImage'))), /待补充/);
  assert.equal(
    tree.filter((node) => classIs(node, 'step')).every((node) => node.props.disabled),
    true,
  );
  assert.match(text(harness([]).render()[0]), /项目资料待补充/);
});

test('external URLs remain real links with safe new-window context and original alt is preserved', () => {
  const tree = harness([{ title: '已有项目', href: 'https://example.com/project', image: { src: '/image.webp', alt: '原始配图说明' } }]).render();
  tree
    .filter((node) => node.type === 'a')
    .forEach((node) => {
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
  assert.match(css, /@media \(max-width: 740px\)[\s\S]*\.stage,\s*\.stage\[data-many=true\]\s*\{[^}]*display: flex;[^}]*flex-direction: column/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important;[\s\S]*transition: none !important/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /touch-action:\s*none|scroll-snap|position:\s*fixed/);
  assert.match(css, /\.reel\s*\{[^}]*padding: 0;/);
  assert.match(css, /\.preview\[hidden\]\s*\{\s*display: none;/);
  assert.match(css, /@media \(max-width: 740px\)[\s\S]*\[data-flow=true\][\s\S]*min-height: 310px;\s*aspect-ratio: auto;/);
  assert.doesNotMatch(css, /min-height:\s*clamp\(580px/);
});

test('the desk retains red selection cues with a secondary mat and bounded mobile preview', () => {
  assert.match(css, /--desk-blue: var\(--portfolio-accent, #d74436\)/);
  assert.match(css, /--desk-tint: var\(--portfolio-secondary-tint, #f6e5e2\)/);
  assert.match(css, /@keyframes deskPrintReveal/);
  assert.match(css, /\.deskEntry\[data-selected=true\][\s\S]*?rotate\(-3deg\)/);
  assert.match(css, /\.deskSummary\s*\{[^}]*line-height: 1\.75;/);
  assert.match(css, /@media \(max-width: 740px\)[\s\S]*\.deskFrame\s*\{[^}]*height: 238px;/);
  assert.match(css, /@media \(max-width: 740px\)[\s\S]*\.deskLayout\s*\{[^}]*display: block;/);
  assert.doesNotMatch(css, /\.deskIndex\s*\{[^}]*overflow(?:-y)?:\s*(?:scroll|auto)/);
  assert.doesNotMatch(source, /onWheel|onTouchMove|onPointerDown|requestAnimationFrame|setInterval/);
});

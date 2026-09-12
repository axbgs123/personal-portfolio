import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import * as navigation from '../src/components/tutorials/catalogNavigation.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => readFileSync(`${root}/${file}`, 'utf8');
const cleanImports = (source) => source.replace(/^import[\s\S]*?;\n/gm, '');
const migrated = vm.runInNewContext(`${read('src/constants/migratedPortfolio.js').replace(/export const /g, 'const ')}\n({ migratedProjectEntries, migratedPhotographyEntry, migratedShortDramaEntry })`);
const constant = (file, name) => vm.runInNewContext(`${cleanImports(read(file)).replace(/export default.*;/g, '')}\n${name}`, { writingArticles: [], ...migrated });
const tools = constant('src/constants/aiToolDocuments.js', 'aiToolDocuments');
const illustrated = constant('src/constants/illustratedTutorials.js', 'illustratedTutorials');
const page = constant('src/constants/archivePages.js', 'archivePages').tutorials;
const prompts = vm.runInNewContext(`${cleanImports(read('src/pages/tutorials/ai-prompts.page.jsx')).split('function AiPromptsPage')[0]}\npage`);
const styles = new Proxy({}, { get: (_, key) => String(key) });
const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };

function loadComponent(name, bindings = {}) {
  const source = cleanImports(read(`src/components/tutorials/${name}.jsx`));
  const exports = [...source.matchAll(/export (?:default )?function (\w+)/g)].map((match) => match[1]);
  const input = `${source.replace(/export default /g, '').replace(/export /g, '')}\nmodule.exports = {${exports.join(',')}};`;
  const { code } = require('next/dist/compiled/babel/core').transformSync(input, {
    filename: `${name}.jsx`,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
  });
  const context = { module: { exports: {} }, React, styles, Link: 'a', Image: 'img', CustomHead: 'head', useId: () => 'catalog-search-regression', ...bindings };
  vm.runInNewContext(code, context);
  return context.module.exports;
}

const framing = loadComponent('TutorialFrame');
const defaultBrowser = (entries) => ({
  query: '',
  filtered: entries,
  index: 0,
  active: entries[0],
  rail: { current: null },
  links: { current: [] },
  search: { current: null },
  select() {},
  filter() {},
  clear() {},
  key() {},
  onScroll() {},
  dragProps: {},
});
const render = (name, props, browser = defaultBrowser) => loadComponent(name, { ...framing, useTutorialBrowser: browser })[name](props);
function nodes(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (typeof value !== 'object') return [];
  if (typeof value.type === 'function') return nodes(value.type(value.props));
  return [value, ...nodes(value.props.children)];
}
function words(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  if (typeof value !== 'object') return String(value);
  if (typeof value.type === 'function') return words(value.type(value.props));
  return words(value.props.children);
}
const classed = (tree, name) => nodes(tree).filter((node) => node.props.className === name);

function routerHarness() {
  let selected = 0;
  let tree;
  let focused;
  const refs = [];
  let refIndex = 0;
  const Component = loadComponent('TutorialWorkbench', {
    ...framing,
    aiToolDocuments: tools,
    illustratedTutorials: illustrated,
    courseToc: JSON.parse(read('src/content/codex-course-toc.json')),
    useState: () => [
      selected,
      (value) => {
        selected = value;
      },
    ],
    useRef: (initial) => {
      const index = refIndex;
      refIndex += 1;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useEffect: () => {},
  }).TutorialWorkbench;
  const h = {
    render() {
      refIndex = 0;
      tree = Component({ page });
      classed(tree, 'previewToggle').forEach((node, index) =>
        node.props.ref({
          focus: () => {
            focused = index;
          },
        }),
      );
      return tree;
    },
    get tree() {
      return tree;
    },
    get selected() {
      return selected;
    },
    get focused() {
      return focused;
    },
    choose(index) {
      classed(tree, 'previewToggle')[index].props.onClick();
      return h.render();
    },
    key(value, modifiers = {}) {
      let prevented = false;
      classed(tree, 'previewToggle')[selected ?? 0].props.onKeyDown({
        key: value,
        preventDefault: () => {
          prevented = true;
        },
        ...modifiers,
      });
      h.render();
      return prevented;
    },
  };
  h.render();
  return h;
}

test('publication shelf retains four direct destinations and separate controls expose actual contents', () => {
  const h = routerHarness();
  const links = classed(h.tree, 'spineTitle').flatMap((title) => nodes(title).filter((node) => node.type === 'a'));
  assert.equal(links.length, 4);
  assert.equal(classed(h.tree, 'previewToggle').length, 4);
  links.forEach((node, index) => {
    assert.equal(node.type, 'a');
    assert.equal(node.props.href, page.entries[index].href);
    assert.ok(words(node).includes(page.entries[index].title));
    assert.equal(node.props.onClick, undefined);
    if (h.selected !== index) h.choose(index);
    assert.equal(h.selected, index);
    const activePage = classed(h.tree, 'pages').find((volume) => !volume.props.hidden);
    assert.ok(words(activePage).includes(page.entries[index].title));
    assert.ok(words(activePage).includes(page.entries[index].status));
    assert.equal(classed(activePage, 'viewAll')[0].props.href, page.entries[index].href);
    assert.equal(classed(h.tree, 'previewToggle').filter((button) => button.props['aria-expanded']).length, 1);
  });
  assert.ok(!/random|shuffle|盲选|resourceCase|casePaper/.test(read('src/components/tutorials/TutorialWorkbench.jsx')));
});

test('publication preview buttons navigate in shelf order while primary links remain independent', () => {
  const h = routerHarness();
  [
    ['ArrowRight', 1],
    ['ArrowDown', 2],
    ['ArrowLeft', 1],
    ['ArrowUp', 0],
    ['End', 3],
    ['Home', 0],
  ].forEach(([key, index]) => {
    assert.equal(h.key(key), true);
    assert.equal(h.selected, index);
    assert.equal(h.focused, index);
    assert.equal(classed(classed(h.tree, 'pages')[index], 'viewAll')[0].props.href, page.entries[index].href);
  });
  assert.equal(h.key('Enter'), false);
  assert.equal(h.key('ArrowDown', { ctrlKey: true }), false);
  assert.equal(h.selected, 0);
  const primary = nodes(classed(h.tree, 'spineTitle')[2]).find((node) => node.type === 'a');
  assert.equal(primary.props.onFocus, undefined);
  assert.equal(primary.props.href, page.entries[2].href);
  classed(h.tree, 'previewToggle').forEach((button, index) => assert.equal(button.props['aria-controls'], classed(h.tree, 'pages')[index].props.id));
});

test('tool wheel contains all 11 real local PDF categories and one-click original reader links', () => {
  const tree = render('AiToolsWheel', { documents: tools });
  const items = classed(tree, 'wheelItem');
  assert.equal(items.length, 11);
  items.forEach((node, index) => {
    assert.equal(node.props.href, `/tutorials/ai-tools/${tools[index].slug}`);
    assert.ok(words(node).includes(tools[index].title));
    assert.equal(node.props.onClick, undefined);
    assert.ok(existsSync(`${root}/public${tools[index].pdf}`));
  });
  assert.equal(classed(tree, 'originalLink')[0].props.href, tools[0].pdf);
  assert.equal(classed(tree, 'originalLink')[0].props.rel, 'noopener noreferrer');
});

test('proof strip retains all 21 final cover assets, full titles, image counts and direct detail destinations', () => {
  const tree = render('IllustratedProofTable', { tutorials: illustrated });
  const frames = classed(tree, 'filmFrame');
  assert.equal(frames.length, 21);
  frames.forEach((node, index) => {
    const tutorial = illustrated[index];
    assert.equal(node.props.href, `/tutorials/illustrated/${tutorial.slug}`);
    assert.ok(words(node).includes(tutorial.title));
    assert.ok(words(node).includes(`${tutorial.imageCount} 张`));
    const cover = nodes(node).find((child) => child.type === 'img');
    assert.equal(cover.props.src, tutorial.cover);
    assert.equal(cover.props.alt, `${tutorial.title}最终版封面`);
    assert.ok(existsSync(`${root}/public${cover.props.src}`));
    assert.equal(node.props.onClick, undefined);
  });
  assert.equal(classed(tree, 'proofOpen')[0].props.href, `/tutorials/illustrated/${illustrated[0].slug}`);
});

test('prompt drawers render current 4 source shares and 8 video tools without inventing local originals or losing access codes', () => {
  const tree = render('PromptDrawers', { page: prompts });
  const items = classed(tree, 'materialDrawer');
  const originals = prompts.sections.flatMap((section) => section.items);
  assert.equal(items.length, 12);
  assert.deepEqual(
    Array.from(prompts.sections, (section) => section.items.length),
    [4, 8],
  );
  items.forEach((node, index) => {
    const original = originals[index];
    assert.equal(node.props.href, original.href);
    assert.equal(node.props.target, '_blank');
    assert.equal(node.props.rel, 'noopener noreferrer');
    [original.name, original.tag, original.description, original.code, original.linkLabel].filter(Boolean).forEach((content) => assert.ok(words(node).includes(content)));
  });
  assert.match(words(tree), /站外资料/);
  assert.match(words(tree), /本站不托管原视频/);
  assert.ok(!nodes(tree).some((node) => node.type === 'video' || node.type === 'iframe'));
  assert.ok(!words(tree).includes(prompts.sections[0].template));
});

test('empty tool/proof results remove stale details and offer a clear recovery action', () => {
  const empty = () => ({ ...defaultBrowser([]), query: '无匹配', active: undefined });
  [
    ['AiToolsWheel', { documents: tools }],
    ['IllustratedProofTable', { tutorials: illustrated }],
  ].forEach(([component, props]) => {
    const tree = render(component, props, empty);
    assert.match(words(tree), /没有找到“无匹配”/);
    assert.ok(!nodes(tree).some((node) => node.props.href?.includes('/tutorials/ai-tools/') || node.props.href?.includes('/tutorials/illustrated/')));
    assert.ok(nodes(tree).some((node) => node.type === 'button' && words(node).includes('清除关键词')));
  });
});

function hookHarness(entries = illustrated, axis = 'x', reduced = false, storage = new Map()) {
  const state = [];
  const refs = [];
  const frames = new Map();
  const timers = new Map();
  let stateCursor = 0;
  let refCursor = 0;
  let nextId = 0;
  let mounted = false;
  let cleanup;
  let current;
  let focused = null;
  let capture = null;
  const scrolls = [];
  const rail = {
    dataset: {},
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 300,
    clientHeight: 432,
    scrollTo(options) {
      scrolls.push(options);
      if (options.left !== undefined) this.scrollLeft = options.left;
      if (options.top !== undefined) this.scrollTop = options.top;
    },
    setPointerCapture(id) {
      capture = id;
    },
    hasPointerCapture(id) {
      return capture === id;
    },
    releasePointerCapture() {
      capture = null;
    },
  };
  const context = {
    module: { exports: {} },
    ...navigation,
    useState(initial) {
      const index = stateCursor;
      stateCursor += 1;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (value) => {
          state[index] = value;
        },
      ];
    },
    useRef(initial) {
      const index = refCursor;
      refCursor += 1;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useMemo: (fn) => fn(),
    useEffect: (fn) => {
      if (!mounted) cleanup = fn();
    },
    window: {
      matchMedia: () => ({ matches: reduced }),
      sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      setTimeout: (fn) => {
        nextId += 1;
        timers.set(nextId, fn);
        return nextId;
      },
    },
    requestAnimationFrame: (fn) => {
      nextId += 1;
      frames.set(nextId, fn);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    clearTimeout: (id) => timers.delete(id),
  };
  vm.runInNewContext(`${cleanImports(read('src/components/tutorials/useTutorialBrowser.js')).replace('export default ', '')}\nmodule.exports = useTutorialBrowser;`, context);
  const h = {
    rail,
    frames,
    timers,
    scrolls,
    focus: () => focused,
    render() {
      stateCursor = 0;
      refCursor = 0;
      current = context.module.exports(entries, axis);
      mounted = true;
      current.rail.current = rail;
      current.search.current = {
        focus: () => {
          focused = 'search';
        },
      };
      current.links.current = current.filtered.map((_, index) => ({
        offsetLeft: 80 + index * 158,
        offsetWidth: 140,
        offsetTop: 180 + index * 72,
        offsetHeight: 72,
        focus: () => {
          focused = index;
        },
      }));
      return current;
    },
    get browser() {
      return current;
    },
    filter(value) {
      current.filter(value);
      return h.render();
    },
    flush() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((fn) => fn());
      h.render();
    },
    unmount() {
      cleanup();
    },
  };
  h.render();
  return h;
}

test('real browser hook filters trimmed case-insensitive names and resets selection/scroll; clearing returns input focus', () => {
  const h = hookHarness();
  h.browser.select(8);
  h.render();
  h.filter('  codex  ');
  assert.equal(h.browser.filtered.length, 3);
  assert.equal(h.browser.index, 0);
  assert.equal(h.rail.scrollLeft, 0);
  h.filter('not-found');
  assert.equal(h.browser.active, undefined);
  h.browser.clear();
  h.render();
  assert.equal(h.browser.filtered.length, 21);
  assert.equal(h.focus(), 'search');
  h.unmount();
});

test('real hook supports directional/Home/End focus while Enter and modified keys stay native', () => {
  ['x', 'y'].forEach((axis) => {
    const h = hookHarness(tools, axis);
    let prevented = 0;
    const key = (value, modifiers = {}) => {
      h.browser.key({
        key: value,
        preventDefault: () => {
          prevented += 1;
        },
        ...modifiers,
      });
      h.render();
    };
    key(axis === 'x' ? 'ArrowRight' : 'ArrowDown');
    assert.equal(h.browser.index, 1);
    assert.equal(h.focus(), 1);
    key('End');
    assert.equal(h.browser.index, 10);
    key('Home');
    assert.equal(h.browser.index, 0);
    key(axis === 'x' ? 'ArrowLeft' : 'ArrowUp');
    assert.equal(h.browser.index, 0);
    const before = prevented;
    key('Enter');
    key('End', { ctrlKey: true });
    assert.equal(prevented, before);
    h.unmount();
  });
});

test('returning from a detail restores query and selected stable slug with a non-animated rail, including changed entry order', () => {
  const storage = new Map();
  const before = hookHarness(illustrated, 'x', false, storage);
  before.filter('codex');
  before.browser.select(2);
  before.render();
  const { slug } = before.browser.active;
  before.unmount();
  const returned = hookHarness([...illustrated].reverse(), 'x', false, storage);
  returned.render();
  returned.flush();
  assert.equal(returned.browser.query, 'codex');
  assert.equal(returned.browser.active.slug, slug);
  assert.equal(returned.scrolls.at(-1).behavior, 'auto');
  returned.unmount();
  storage.set('cz-tutorial-collection', 'invalid-json');
  const invalid = hookHarness(tools, 'y', false, storage);
  assert.equal(invalid.browser.index, 0);
  invalid.unmount();
});

test('late scroll events from a previous search cannot overwrite the cleared collection before reload', () => {
  const storage = new Map();
  const h = hookHarness(illustrated, 'x', false, storage);
  h.filter('codex');
  h.browser.select(2);
  h.render();
  const staleScroll = h.browser.onScroll;
  h.browser.clear();
  staleScroll();
  h.render();
  h.flush();
  assert.equal(h.browser.query, '');
  assert.equal(h.browser.index, 0);
  h.unmount();
  const reloaded = hookHarness(illustrated, 'x', false, storage);
  reloaded.render();
  reloaded.flush();
  assert.equal(reloaded.browser.query, '');
  assert.equal(reloaded.browser.active.slug, illustrated[0].slug);
  reloaded.unmount();
});

test('scroll selection follows actual center geometry, batches one RAF and uses native auto scroll with reduced motion', () => {
  const h = hookHarness();
  h.rail.scrollLeft = 158 * 6;
  h.browser.onScroll();
  h.browser.onScroll();
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.browser.index, 6);
  h.browser.select(2);
  assert.equal(h.scrolls.at(-1).behavior, 'smooth');
  h.unmount();
  const reduced = hookHarness(tools, 'y', true);
  reduced.browser.select(4);
  assert.equal(reduced.scrolls.at(-1).behavior, 'auto');
  assert.equal(reduced.scrolls.at(-1).top, 288);
  reduced.unmount();
});

test('pointer focus never moves a direct link before click; keyboard focus centers it', () => {
  const h = hookHarness(tools, 'y');
  h.browser.focus(5, { currentTarget: { matches: () => false } });
  h.render();
  assert.equal(h.browser.index, 5);
  assert.equal(h.scrolls.length, 0);
  h.browser.focus(7, { currentTarget: { matches: () => true } });
  h.render();
  assert.equal(h.browser.index, 7);
  assert.equal(h.scrolls.at(-1).top, 7 * 72);
  h.unmount();
});

test('optional mouse drag suppresses only the drag click; normal and touch clicks remain one-step links', () => {
  const h = hookHarness();
  let prevented = 0;
  let stopped = 0;
  const event = (x, extra = {}) => ({
    currentTarget: h.rail,
    pointerType: 'mouse',
    pointerId: 1,
    button: 0,
    buttons: 1,
    clientX: x,
    preventDefault: () => {
      prevented += 1;
    },
    stopPropagation: () => {
      stopped += 1;
    },
    ...extra,
  });
  h.browser.dragProps.onPointerDown(event(100));
  h.browser.dragProps.onPointerUp(event(100));
  h.browser.dragProps.onClickCapture(event(100));
  assert.equal(prevented, 0);
  h.browser.dragProps.onPointerDown(event(100));
  h.browser.dragProps.onPointerMove(event(50));
  assert.equal(h.rail.scrollLeft, 50);
  h.browser.dragProps.onPointerUp(event(50));
  h.browser.dragProps.onPointerLeave(event(50));
  h.browser.dragProps.onClickCapture(event(50));
  assert.equal(stopped, 1);
  const before = prevented;
  h.browser.dragProps.onPointerDown(event(100, { pointerType: 'touch' }));
  h.browser.dragProps.onPointerMove(event(30, { pointerType: 'touch' }));
  h.browser.dragProps.onClickCapture(event(30));
  assert.equal(prevented, before);
  const settled = h.rail.scrollLeft;
  h.browser.dragProps.onPointerDown(event(100));
  h.browser.dragProps.onPointerLeave(event(100));
  h.browser.dragProps.onPointerMove(event(20));
  assert.equal(h.rail.scrollLeft, settled);
  h.unmount();
});

test('multi-frame dragging bypasses native snap for the whole distance, then aligns once and clears on cancellation', () => {
  const h = hookHarness();
  let left = 0;
  Object.defineProperty(h.rail, 'scrollLeft', {
    get: () => left,
    set: (value) => {
      left = h.rail.dataset.dragging === 'true' ? value : Math.round(value / 158) * 158;
    },
  });
  const event = (x) => ({ currentTarget: h.rail, pointerType: 'mouse', pointerId: 3, button: 0, buttons: 1, clientX: x, preventDefault() {}, stopPropagation() {} });
  h.browser.dragProps.onPointerDown(event(900));
  [875, 842, 780, 690, 600, 513].forEach((x) => h.browser.dragProps.onPointerMove(event(x)));
  assert.equal(h.rail.dataset.dragging, 'true');
  assert.equal(h.rail.scrollLeft, 387);
  h.browser.dragProps.onPointerUp(event(513));
  h.render();
  assert.equal(h.rail.dataset.dragging, undefined);
  assert.equal(h.browser.index, 2);
  assert.equal(h.rail.scrollLeft, 316);
  h.browser.dragProps.onPointerDown(event(900));
  [820, 760, 650, 530, 400, 250, 112].forEach((x) => h.browser.dragProps.onPointerMove(event(x)));
  assert.equal(h.rail.scrollLeft, 1104);
  h.browser.dragProps.onPointerCancel(event(112));
  h.render();
  assert.equal(h.rail.dataset.dragging, undefined);
  assert.equal(h.rail.hasPointerCapture(3), false);
  assert.equal(h.rail.scrollLeft, 1106);
  assert.equal(h.browser.index, 7);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('native dragstart is prevented at the rail while ordinary click navigation stays untouched', () => {
  const h = hookHarness();
  let prevented = 0;
  h.browser.dragProps.onDragStartCapture({
    currentTarget: h.rail,
    preventDefault: () => {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
  h.browser.dragProps.onClickCapture({
    preventDefault: () => {
      prevented += 1;
    },
    stopPropagation() {},
  });
  assert.equal(prevented, 1);
  const source = read('src/components/tutorials/IllustratedProofTable.jsx');
  assert.match(source, /onDragStartCapture=\{browser\.dragProps\.onDragStartCapture\}/);
  h.unmount();
});

test('search label explicitly names its input without relying on nested-label depth', () => {
  [
    ['AiToolsWheel', { documents: tools }],
    ['IllustratedProofTable', { tutorials: illustrated }],
  ].forEach(([component, props]) => {
    const tree = render(component, props);
    const label = nodes(tree).find((node) => node.type === 'label');
    const input = nodes(tree).find((node) => node.type === 'input');
    assert.ok(input.props.id);
    assert.equal(label.props.htmlFor, input.props.id);
  });
});

test('unmount cancels pending scroll work and drag suppression timers', () => {
  const h = hookHarness();
  h.browser.onScroll();
  h.browser.dragProps.onPointerDown({ currentTarget: h.rail, pointerType: 'mouse', pointerId: 1, button: 0, clientX: 100 });
  h.browser.dragProps.onPointerMove({ currentTarget: h.rail, pointerId: 1, buttons: 1, clientX: 50, preventDefault() {} });
  h.browser.dragProps.onPointerUp({ currentTarget: h.rail, pointerId: 1 });
  assert.equal(h.frames.size, 1);
  assert.equal(h.timers.size, 1);
  h.unmount();
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
});

test('owned routes use four different browsing metaphors, not the shared archive machine; details retain their original renderers', () => {
  const mapping = [
    ['src/pages/tutorials.page.jsx', 'TutorialWorkbench'],
    ['src/pages/tutorials/ai-tools.page.jsx', 'AiToolsWheel'],
    ['src/pages/tutorials/illustrated.page.jsx', 'IllustratedProofTable'],
    ['src/pages/tutorials/components/AiResourceGuide.jsx', 'PromptDrawers'],
  ];
  mapping.forEach(([route, name]) => {
    assert.ok(read(route).includes(name));
    assert.ok(!/ArchiveField|ArchivePage|ArchiveMachine/.test(read(route)));
  });
  assert.match(read('src/pages/tutorials/ai-tools/[slug].page.jsx'), /<iframe/);
  assert.match(read('src/pages/tutorials/illustrated/[slug].page.jsx'), /tutorial\.images/);
  assert.match(read('src/pages/tutorials/codex-course.page.jsx'), /getStaticProps/);
});

test('collection CSS compiles with mobile layouts, native scroll rails, full-cover containment and reduced motion', () => {
  const { css } = require('sass').compile(`${root}/src/components/tutorials/tutorialCollections.module.scss`);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-snap-type: y mandatory/);
  assert.match(css, /scroll-snap-type: x proximity/);
  assert.match(css, /\.filmStrip\[data-dragging=true\]\s*\{[^}]*scroll-snap-type: none/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /--portfolio-accent/);
  assert.match(css, /outline: 2px solid/);
  assert.ok(!css.includes('filter: blur'));
  const proofSource = read('src/components/tutorials/IllustratedProofTable.jsx');
  assert.match(proofSource, /data-lenis-prevent-horizontal/);
  assert.ok(!/data-lenis-prevent\s/.test(proofSource));
  assert.ok(!/dragDebug|dragDiagnostics|traceDrag/.test(read('src/components/tutorials/useTutorialBrowser.js')));
  const routerCss = require('sass').compile(`${root}/src/components/tutorials/tutorialRouter.module.scss`).css;
  assert.match(routerCss, /@media \(max-width: 520px\)/);
  assert.match(routerCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(routerCss, /\.volume\[data-open=true\]/);
  assert.match(routerCss, /\.pages\[hidden\]\s*\{\s*display: none/);
  assert.match(routerCss, /writing-mode: vertical-rl/);
  assert.match(routerCss, /writing-mode: horizontal-tb/);
  assert.ok(!/casePaper|resourceCase/.test(routerCss));
});

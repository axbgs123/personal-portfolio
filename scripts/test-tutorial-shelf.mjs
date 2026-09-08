import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const source = read('src/components/tutorials/TutorialWorkbench.jsx');
const css = require('sass').compile(fileURLToPath(new URL('src/components/tutorials/tutorialRouter.module.scss', root))).css;
const constant = (path, name) =>
  vm.runInNewContext(
    `${read(path)
      .replace(/^import[^\n]*\n/gm, '')
      .replace(/export default[^;]*;/g, '')}\n${name}`,
    { writingArticles: [] },
  );
const aiToolDocuments = constant('src/constants/aiToolDocuments.js', 'aiToolDocuments');
const illustratedTutorials = constant('src/constants/illustratedTutorials.js', 'illustratedTutorials');
const page = constant('src/constants/archivePages.js', 'archivePages').tutorials;
const courseToc = JSON.parse(read('src/content/codex-course-toc.json'));
const originalPrompts = [...read('src/pages/tutorials/ai-prompts.page.jsx').matchAll(/name: '([^']+)'/g)].slice(0, 4).map((match) => match[1]);
const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const styles = new Proxy({}, { get: (_, name) => String(name) });
const compiled = require('next/dist/compiled/babel/core').transformSync(
  `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function TutorialWorkbench', 'function TutorialWorkbench')}\nmodule.exports = TutorialWorkbench;`,
  { filename: 'TutorialShelf.test.jsx', babelrc: false, configFile: false, presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]] },
).code;

function nodes(value, visibleOnly = false) {
  if (value == null || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap((child) => nodes(child, visibleOnly));
  if (typeof value !== 'object' || (visibleOnly && value.props.hidden)) return [];
  return [value, ...nodes(value.props.children, visibleOnly)];
}
function words(value) {
  if (value == null || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  return typeof value === 'object' ? words(value.props.children) : String(value);
}
const classed = (node, name) => node.props.className === name;

function harness(inputPage = page, { mobile = false, reduced = false, useLenis = true } = {}) {
  let selected = 0;
  let focused;
  let tree;
  const refs = [];
  const frames = new Map();
  const scrolls = [];
  let refIndex = 0;
  let frameId = 0;
  let effect;
  let commitEffect = false;
  let resizeCount = 0;
  const main = { scrollTop: 500, getBoundingClientRect: () => ({ top: 0 }), scrollTo: (options) => scrolls.push({ kind: 'main', ...options }) };
  const browser = {
    window: {
      scrollY: 0,
      matchMedia: (query) => ({ matches: query.includes('max-width') ? mobile : reduced }),
      getComputedStyle: () => ({ getPropertyValue: () => '76px' }),
      scrollTo: (options) => scrolls.push({ kind: 'window', ...options }),
    },
    document: { documentElement: {}, querySelector: () => main },
  };
  const getSectionScrollOffset = vm.runInNewContext(`${read('src/pages/tutorials/components/getSectionScrollOffset.js').replace('export default ', '')}\ngetSectionScrollOffset`, browser);
  const getSectionScrollTop = vm.runInNewContext(
    `${read('src/pages/tutorials/components/getSectionScrollTop.js')
      .replace(/^import[^\n]*\n/gm, '')
      .replace('export default ', '')}\ngetSectionScrollTop`,
    { ...browser, getSectionScrollOffset },
  );
  const context = {
    module: { exports: {} },
    React,
    styles,
    Link: 'Link',
    Image: 'Image',
    TutorialFrame: 'TutorialFrame',
    aiToolDocuments,
    illustratedTutorials,
    courseToc,
    ...browser,
    getSectionScrollTop,
    useStore: {
      getState: () => ({
        lenis: useLenis
          ? {
              resize: () => {
                resizeCount += 1;
              },
              scrollTo: (top, options) => scrolls.push({ kind: 'lenis', top, ...options }),
            }
          : null,
      }),
    },
    requestAnimationFrame: (callback) => {
      const id = ++frameId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    useId: () => 'tutorial-shelf-test',
    useRef: (initial) => {
      const index = refIndex++;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useEffect: (callback, deps) => {
      if (!effect || deps.some((value, index) => value !== effect.deps[index])) {
        effect?.cleanup?.();
        effect = { callback, deps };
        commitEffect = true;
      }
    },
    useState: () => [
      selected,
      (next) => {
        selected = next;
      },
    ],
  };
  vm.runInNewContext(compiled, context);
  const expand = (node) => {
    if (Array.isArray(node)) return node.map(expand);
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') return expand(node.type(node.props));
    return { ...node, props: { ...node.props, children: expand(node.props.children) } };
  };
  const api = {
    render() {
      refIndex = 0;
      tree = expand(context.module.exports({ page: inputPage }));
      nodes(tree)
        .filter((node) => classed(node, 'previewToggle'))
        .forEach((node, index) =>
          node.props.ref({
            focus: (options) => {
              focused = index;
              api.focusOptions = options;
            },
            closest: () => ({ isConnected: true, getBoundingClientRect: () => ({ top: 160 + index * 20 }) }),
          }),
        );
      if (commitEffect) {
        commitEffect = false;
        effect.cleanup = effect.callback();
      }
      return nodes(tree);
    },
    visible: () => {
      api.render();
      return nodes(tree, true);
    },
    all: (name) => api.render().filter((node) => classed(node, name)),
    active() {
      return this.all('pages').filter((node) => !node.props.hidden);
    },
    open(index) {
      if (selected !== index) this.all('previewToggle')[index].props.onClick();
      this.render();
    },
    click(index) {
      this.all('previewToggle')[index].props.onClick();
      this.render();
    },
    key(index, key, modifiers = {}) {
      const event = {
        key,
        preventDefault() {
          this.prevented = true;
        },
        ...modifiers,
      };
      this.all('previewToggle')[index].props.onKeyDown(event);
      this.render();
      return Boolean(event.prevented);
    },
    selected: () => selected,
    focused: () => focused,
    frames,
    scrolls,
    resizeCount: () => resizeCount,
    frame() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
    cleanup: () => effect?.cleanup?.(),
  };
  api.render();
  return api;
}

test('four existing titles are direct native destinations, independent of preview buttons', () => {
  const shelf = harness();
  assert.equal(shelf.all('volume').length, 4);
  assert.equal(shelf.all('previewToggle').length, 4);
  shelf.all('spineTitle').forEach((title, index) => {
    const link = nodes(title).find((node) => node.type === 'Link');
    assert.equal(link.props.href, page.entries[index].href);
    assert.ok(words(link).includes(page.entries[index].title));
    assert.equal(link.props.onClick, undefined);
    assert.equal(link.props.onFocus, undefined);
    assert.equal(link.props.onMouseEnter, undefined);
  });
  assert.ok(shelf.render().some((node) => node.type === 'TutorialFrame' && node.props.kind === 'publication-shelf'));
});

test('first volume is immediately useful and every one-click expansion exposes only its own page', () => {
  const shelf = harness();
  assert.equal(shelf.selected(), 0);
  assert.equal(shelf.active().length, 1);
  page.entries.forEach((entry, index) => {
    shelf.open(index);
    assert.equal(shelf.active().length, 1);
    assert.equal(shelf.all('previewToggle').filter((button) => button.props['aria-expanded']).length, 1);
    const active = shelf.active()[0];
    assert.match(words(active), new RegExp(entry.title));
    assert.equal(nodes(active).find((node) => classed(node, 'viewAll')).props.href, entry.href);
    shelf.click(index);
    assert.equal(shelf.active().length, 0);
    assert.equal(shelf.visible().filter((node) => classed(node, 'viewAll')).length, 0);
  });
});

test('real Codex chapter titles and anchors are complete and reference actual imported HTML', () => {
  const shelf = harness();
  const html = read('src/content/codex-course.html');
  const links = nodes(shelf.all('chapterIndex')[0]).filter((node) => node.type === 'Link');
  assert.equal(links.length, courseToc.length);
  links.forEach((link, index) => {
    assert.ok(words(link).includes(courseToc[index].title));
    assert.equal(link.props.href, `/tutorials/codex-course#${courseToc[index].id}`);
    assert.ok(html.includes(`id="${courseToc[index].id}"`), 'the original section anchor exists');
  });
  assert.ok(words(shelf.active()[0]).includes(`${courseToc.length} 章节`));
});

test('all 11 AI tool documents retain exact names, working reader routes and existing PDFs', () => {
  const shelf = harness();
  shelf.open(1);
  const links = nodes(shelf.all('documentIndex')[0]).filter((node) => node.type === 'Link');
  assert.equal(links.length, aiToolDocuments.length);
  assert.equal(links.length, 11);
  links.forEach((link, index) => {
    const item = aiToolDocuments[index];
    assert.ok(words(link).includes(item.title));
    assert.equal(link.props.href, `/tutorials/ai-tools/${item.slug}`);
    assert.ok(existsSync(new URL(`public${item.pdf}`, root)));
  });
  assert.doesNotMatch(words(shelf.active()[0]), /\.docx|sourceFile|用户数量|生成成功/);
});

test('illustrated volume uses four real final covers and titles while keeping all-21 navigation', () => {
  const shelf = harness();
  shelf.open(3);
  const images = nodes(shelf.active()[0]).filter((node) => node.type === 'Image');
  assert.equal(images.length, 4);
  images.forEach((image, index) => {
    const original = illustratedTutorials[index];
    assert.equal(image.props.src, original.cover);
    assert.equal(image.props.alt, original.title);
    assert.equal(image.props.width, original.width);
    assert.equal(image.props.height, original.height);
    assert.ok(existsSync(new URL(`public${image.props.src}`, root)));
    assert.ok(nodes(shelf.active()[0]).some((node) => node.props.href === `/tutorials/illustrated/${original.slug}`));
  });
  assert.ok(words(shelf.active()[0]).includes(`${illustratedTutorials.length} 组图文`));
  assert.equal(nodes(shelf.active()[0]).find((node) => classed(node, 'viewAll')).props.href, '/tutorials/illustrated');
});

test('prompt preview uses exactly the original four names and category links, without embedded videos or fake prompts', () => {
  const shelf = harness();
  shelf.open(2);
  const links = nodes(shelf.all('promptTitles')[0]).filter((node) => node.type === 'Link');
  assert.equal(links.length, originalPrompts.length);
  links.forEach((link, index) => {
    assert.ok(words(link).includes(originalPrompts[index]));
    assert.equal(link.props.href, '/tutorials/ai-prompts#image-prompts');
  });
  assert.equal(shelf.all('videoLink')[0].props.href, '/tutorials/ai-prompts#video-prompts');
  assert.equal(shelf.render().filter((node) => ['video', 'audio', 'iframe', 'canvas'].includes(node.type)).length, 0);
  assert.doesNotMatch(source, /Math\.random|随机|盲选|shuffle|directionPad|routeWires/);
});

test('each disclosure has a unique labelled region and hidden pages leave the visible keyboard tree', () => {
  const shelf = harness();
  const pages = shelf.all('pages');
  assert.equal(new Set(pages.map((node) => node.props.id)).size, 4);
  shelf.all('previewToggle').forEach((control, index) => {
    assert.equal(control.props.type, 'button');
    assert.equal(control.props['aria-controls'], pages[index].props.id);
    assert.equal(pages[index].props.role, 'region');
    assert.ok(shelf.all('spineTitle').some((title) => title.props.id === pages[index].props['aria-labelledby']));
  });
  assert.equal(shelf.visible().filter((node) => classed(node, 'pages')).length, 1);
  assert.equal(shelf.visible().filter((node) => classed(node, 'spineTitle')).length, 4);
  assert.match(css, /\.pages\[hidden\]\s*\{\s*display: none/);
});

test('arrows/Home/End open adjacent books and move focus; modifiers and Enter are not intercepted', () => {
  const shelf = harness();
  for (const [origin, key, target] of [
    [0, 'ArrowRight', 1],
    [1, 'ArrowDown', 2],
    [2, 'ArrowLeft', 1],
    [1, 'ArrowUp', 0],
    [0, 'End', 3],
    [3, 'Home', 0],
    [0, 'ArrowLeft', 0],
  ]) {
    assert.equal(shelf.key(origin, key), true);
    assert.equal(shelf.selected(), target);
    assert.equal(shelf.focused(), target);
  }
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'isComposing']) assert.equal(shelf.key(0, 'End', { [modifier]: true }), false);
  assert.equal(shelf.key(0, 'Enter'), false);
  assert.equal(shelf.selected(), 0);
});

test('book opening controls are above titles; mobile becomes a legible inline accordion and motion can stop', () => {
  assert.match(css, /\.previewToggle\s*\{[^}]*order: 1;[^}]*min-height: 44px/s);
  assert.match(css, /\.spineTitle\s*\{[^}]*order: 2;/s);
  assert.match(css, /font: 13px var\(--portfolio-font\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /writing-mode: vertical-rl/);
  assert.match(css, /writing-mode: horizontal-tb/);
  assert.match(css, /overflow-y: visible/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.pages\s*\{[^}]*animation: none;[^}]*transform: none;/s);
  assert.doesNotMatch(css, /perspective:|rotateY|rotateX|filter: blur/);
});

test('mobile switches wait for layout and align the newly opened spine below the fixed header using Lenis', () => {
  const shelf = harness(page, { mobile: true });
  assert.equal(shelf.frames.size, 0, 'initial open book does not trigger scrolling');
  shelf.open(3);
  assert.equal(shelf.active().length, 1);
  assert.equal(shelf.scrolls.length, 0, 'do not measure until the disclosure layout is committed');
  assert.equal(shelf.frames.size, 1);
  shelf.frame();
  assert.equal(shelf.resizeCount(), 1);
  assert.equal(shelf.scrolls[0].kind, 'lenis');
  assert.equal(shelf.scrolls[0].top, 628, '500 main offset + 220 new-spine top − 76 fixed header − 16 gap');
  assert.equal(shelf.scrolls[0].immediate, false);
  assert.equal(shelf.scrolls[0].duration, 0.45);
  shelf.render();
  shelf.frame();
  assert.equal(shelf.scrolls.length, 1, 'ordinary rerenders or scrolling do not re-align the page');
  shelf.click(3);
  shelf.frame();
  assert.equal(shelf.scrolls.length, 1, 'collapsing a book does not jump');
  shelf.cleanup();
});

test('mobile alignment respects reduced motion and falls back to the actual main scroller', () => {
  const reducedShelf = harness(page, { mobile: true, reduced: true });
  reducedShelf.open(1);
  reducedShelf.frame();
  assert.equal(reducedShelf.scrolls[0].immediate, true);
  const nativeShelf = harness(page, { mobile: true, reduced: true, useLenis: false });
  nativeShelf.open(3);
  nativeShelf.frame();
  assert.equal(nativeShelf.scrolls[0].kind, 'main');
  assert.equal(nativeShelf.scrolls[0].behavior, 'instant');
  assert.equal(nativeShelf.scrolls[0].top, 628);
  reducedShelf.cleanup();
  nativeShelf.cleanup();
});

test('desktop selection never scrolls; mobile switch cleanup cancels stale and unmounted alignment frames', () => {
  const desktop = harness();
  desktop.open(3);
  desktop.frame();
  assert.equal(desktop.frames.size, 0);
  assert.equal(desktop.scrolls.length, 0);
  const mobileShelf = harness(page, { mobile: true });
  mobileShelf.open(3);
  assert.equal(mobileShelf.frames.size, 1);
  mobileShelf.open(1);
  assert.equal(mobileShelf.frames.size, 1, 'new selection cancels the previous pending alignment');
  mobileShelf.frame();
  assert.equal(mobileShelf.scrolls.length, 1);
  assert.equal(mobileShelf.scrolls[0].top, 588);
  mobileShelf.key(1, 'End');
  assert.equal(mobileShelf.focusOptions.preventScroll, true, 'keyboard focus must not scroll before layout');
  assert.equal(mobileShelf.frames.size, 1);
  mobileShelf.cleanup();
  assert.equal(mobileShelf.frames.size, 0);
  desktop.cleanup();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Read-only regression harness: compile the real page/component into memory,
// exercise their actual event handlers, and replace only React hooks / browser
// services. This does not prove layout, hit geometry, focus or browser gestures;
// those still require the separate desktop + mobile browser acceptance pass.
// No build output, dependencies, UI source or asset files are changed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const babel = require('next/dist/compiled/babel/bundle');
const React = require('react');
const sass = require('sass');
const storageKey = 'cz:archive-machine:v2:writing';
const compile = (source) => babel.core().transformSync(source, {
  configFile: false,
  babelrc: false,
  presets: [[babel.presetReact(), { runtime: 'automatic' }]],
  plugins: [babel.pluginTransformModulesCommonjs()],
}).code;

function loadModule(file, resolve = () => null) {
  const module = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(root, file), 'utf8')), {
    module,
    exports: module.exports,
    require: resolve,
  }, { filename: file });
  return module.exports;
}

const articles = loadModule('src/constants/writingArticles.js').default;
const articleEntries = loadModule('src/constants/archiveWritingEntries.js', (id) => {
  if (id.includes('writingArticles')) return { default: articles, __esModule: true };
  return require(id);
}).default;
const routeResolver = (id) => {
  if (id.includes('archiveWritingEntries')) return { default: articleEntries, __esModule: true };
  if (id === 'next/head' || id.includes('ArchiveMachine')) return () => null;
  return require(id);
};
const page = loadModule('src/pages/writing.page.jsx', routeResolver);
const compatibilityPage = loadModule('src/pages/archive-machine.page.jsx', (id) => {
  if (id === './writing.page') return page;
  return routeResolver(id);
});
const entries = page.getStaticProps().props.entries;
const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
const componentCode = compile(fs.readFileSync(path.join(root, 'src/components/portfolio/ArchiveMachine.jsx'), 'utf8'));

function createHarness({ storage = new Map(), reducedMotion = false, storageBlocked = false, storageId = 'writing', hydrate = true } = {}) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  const listeners = new Map();
  let cursor = 0;
  let dirty = false;
  let tree;
  let timerId = 0;

  const memo = (calculate, dependencies) => {
    const index = cursor++;
    const old = slots[index];
    if (!old || dependencies.some((value, position) => !Object.is(value, old.dependencies[position]))) {
      slots[index] = { dependencies, value: calculate() };
    }
    return slots[index].value;
  };
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next) => {
        slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        dirty = true;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo: memo,
    useCallback: (callback, dependencies) => memo(() => callback, dependencies),
    useEffect(effect, dependencies) {
      const index = cursor++;
      const old = slots[index];
      if (!old || dependencies.some((value, position) => !Object.is(value, old.dependencies[position]))) {
        const slot = { dependencies, cleanup: undefined };
        slots[index] = slot;
        effects.push(() => {
          old?.cleanup?.();
          slot.cleanup = effect();
        });
      }
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(componentCode, {
    module,
    exports: module.exports,
    window: {
      sessionStorage: {
        getItem(key) {
          if (storageBlocked) throw new Error('Storage unavailable in this test');
          return storage.get(key) || null;
        },
        setItem(key, value) {
          if (storageBlocked) throw new Error('Storage unavailable in this test');
          storage.set(key, value);
        },
      },
      matchMedia: () => ({ matches: reducedMotion }),
      setTimeout(callback, delay) {
        timers.set(++timerId, { callback, delay });
        return timerId;
      },
      clearTimeout: (id) => timers.delete(id),
    },
    document: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    require(id) {
      if (id === 'react') return hooks;
      if (id.endsWith('.scss')) return { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) };
      if (id === 'next/link' || id === 'next/image') return () => null;
      return require(id);
    },
  }, { filename: 'ArchiveMachine.jsx' });

  const render = () => {
    let iterations = 0;
    do {
      assert.ok(iterations++ < 30, 'Component effects settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = module.exports.default({ entries, storageId });
      if (hydrate) while (effects.length) effects.shift()();
    } while (dirty);
    return tree;
  };
  const walk = (node, predicate, found = []) => {
    if (!node || typeof node !== 'object') return found;
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props?.children, (child) => walk(child, predicate, found));
    return found;
  };
  const all = (predicate) => walk(render(), predicate);
  const find = (predicate) => {
    const found = all(predicate);
    assert.ok(found.length, 'Expected UI element exists');
    return found[0];
  };
  const flush = () => {
    for (const [id, timer] of [...timers]) {
      timers.delete(id);
      timer.callback();
    }
    render();
  };
  const click = (element) => {
    assert.notEqual(element.props.disabled, true, 'Do not activate a disabled native control');
    element.props.onClick();
    render();
  };
  const draw = () => {
    click(find((node) => node.props?.className === 'drawButton'));
    flush();
  };
  const dispose = () => slots.forEach((slot) => slot?.cleanup?.());
  render();
  return {
    all, find, flush, click, draw, render, dispose, storage, timers, listeners,
    state: () => JSON.parse(storage.get(`cz:archive-machine:v2:${storageId}`)),
    helpers: module.exports,
  };
}

test('both routes contain all 15 real articles, original URLs and excerpts, without tutorial content', () => {
  assert.equal(articles.length, 15);
  assert.equal(entries.length, articles.length);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  assert.deepEqual(compatibilityPage.getStaticProps().props.entries, entries);
  assert.equal(page.getStaticProps().props.storageId, 'writing');
  assert.equal(compatibilityPage.getStaticProps().props.storageId, 'archive-machine');
  for (const entry of entries) {
    assert.equal(entry.kind, 'writing');
    const original = articles.find((article) => entry.id === `writing:${article.slug}`);
    assert.equal(entry.title, original.title);
    assert.equal(entry.excerpt, original.excerpt || original.paragraphs?.[0] || '');
    assert.equal(entry.href, `/writing/${original.slug}`);
    assert.ok(!('paragraphs' in entry), 'Full article body remains in the detail page payload');
  }
});

test('first server render already identifies the writing directory and does not need session storage', () => {
  const harness = createHarness({ hydrate: false });
  const { renderToStaticMarkup } = require('react-dom/server');
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /<h1>文字与思考/);
  assert.match(html, /15 篇/);
  assert.doesNotMatch(html, /尚未替换|独立交互小样|type="radio"|图文教程/);
  assert.equal(harness.storage.size, 0);
  const head = React.Children.toArray(page.default(page.getStaticProps().props).props.children)[0];
  const title = React.Children.toArray(head.props.children).find((node) => node.type === 'title');
  assert.equal(title.props.children, '文字与思考 · 陈祉辰');
  harness.dispose();
});

test('200 shuffles preserve all identities without duplicates or mutating the source', () => {
  const harness = createHarness();
  const ids = Array.from(entries, (entry) => entry.id);
  const original = [...ids];
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const queue = harness.helpers.shuffledIds(ids);
    assert.equal(queue.length, ids.length);
    assert.equal(new Set(queue).size, ids.length);
    assert.ok(queue.every((id) => entryMap.has(id)));
  }
  assert.deepEqual(ids, original);
  harness.dispose();
});

test('actual draw handlers exhaust all 15 articles once, then reset only when explicitly requested', () => {
  const harness = createHarness();
  for (let index = 0; index < entries.length; index += 1) {
    harness.draw();
    assert.equal(harness.state().history.length, index + 1);
    assert.equal(harness.state().queue.length, entries.length - index - 1);
  }
  assert.equal(new Set(harness.state().history).size, entries.length);
  assert.equal(harness.state().cursor, entries.length - 1);
  harness.click(harness.find((node) => node.props?.className === 'drawButton'));
  assert.equal(harness.state().history.length, 0);
  assert.equal(harness.state().queue.length, entries.length);
  harness.dispose();
});

test('back / forward only navigate history and never consume another entry', () => {
  const harness = createHarness();
  for (let index = 0; index < 3; index += 1) harness.draw();
  const before = harness.state();
  harness.click(harness.find((node) => node.props?.['aria-label'] === '上一张已取出的内容'));
  harness.flush();
  assert.equal(harness.state().cursor, 1);
  harness.click(harness.find((node) => node.props?.['aria-label'] === '下一张已取出的内容'));
  harness.flush();
  assert.equal(harness.state().cursor, 2);
  assert.deepEqual(harness.state().queue, before.queue);
  assert.deepEqual(harness.state().history, before.history);
  harness.dispose();
});

test('captured lever drag plus its following native click draws exactly one receipt', () => {
  const harness = createHarness();
  const lever = harness.find((node) => node.props?.className === 'lever');
  let captures = 0;
  let releases = 0;
  const target = {
    setPointerCapture() { captures += 1; },
    hasPointerCapture: () => true,
    releasePointerCapture() { releases += 1; },
  };
  lever.props.onPointerDown({ button: 0, pointerId: 7, clientY: 100, currentTarget: target });
  lever.props.onPointerMove({ pointerId: 7, clientY: 160 });
  lever.props.onPointerUp({ pointerId: 7, clientY: 160, currentTarget: target });
  harness.flush();
  // Flush first so the assertion is about click suppression, not the busy lock.
  lever.props.onClick();
  harness.flush();
  assert.equal(harness.state().history.length, 1);
  assert.equal(captures, 1);
  assert.equal(releases, 1);
  harness.dispose();
});

test('cancelled / short drags do not draw, but keyboard activation still can', () => {
  const harness = createHarness();
  const lever = harness.find((node) => node.props?.className === 'lever');
  const target = { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} };
  lever.props.onPointerDown({ button: 0, pointerId: 2, clientY: 100, currentTarget: target });
  lever.props.onPointerUp({ pointerId: 2, clientY: 120, currentTarget: target });
  lever.props.onClick();
  harness.flush();
  assert.equal(harness.state().history.length, 0);
  lever.props.onPointerDown({ button: 0, pointerId: 3, clientY: 100, currentTarget: target });
  lever.props.onPointerCancel({ pointerId: 3, clientY: 170, currentTarget: target });
  harness.flush();
  assert.equal(harness.state().history.length, 0);
  lever.props.onKeyDown({ key: 'Enter' });
  lever.props.onClick();
  harness.flush();
  assert.equal(harness.state().history.length, 1);
  harness.dispose();
});

test('search is direct, case-insensitive, and respects all query terms', () => {
  const harness = createHarness();
  harness.click(harness.find((node) => node.props?.className === 'searchToggle'));
  harness.find((node) => node.props?.id === 'archive-machine-query').props.onChange({ target: { value: 'oPeNaI' } });
  const links = harness.all((node) => node.props?.href && node.props?.onClick);
  assert.ok(links.length > 0);
  assert.ok(links.every((node) => {
    const entry = entries.find((item) => item.href === node.props.href);
    return entry && harness.helpers.matchesArchiveEntry(entry, 'OpenAI');
  }));
  const link = links.find((node) => node.props.href.startsWith('/writing/'));
  assert.ok(link);
  harness.click(link);
  assert.equal(harness.state().history.length, 1);
  assert.equal(harness.state().queue.length, entries.length - 1);
  assert.equal(entryMap.get(harness.state().history[0]).href, link.props.href);
  assert.ok(!harness.helpers.matchesArchiveEntry(entries[0], 'no-match-unique-token'));
  const openai = entries.find((entry) => entry.title.includes('OpenAI'));
  assert.ok(!harness.helpers.matchesArchiveEntry(openai, 'OpenAI no-match-unique-token'));
  harness.dispose();
});

test('formal writing and compatibility route sessions do not overwrite one another', () => {
  const storage = new Map();
  const writing = createHarness({ storage });
  writing.draw(); writing.draw();
  const before = writing.state();
  const compatibility = createHarness({ storage, storageId: 'archive-machine' });
  assert.equal(compatibility.state().history.length, 0);
  compatibility.draw();
  assert.equal(compatibility.state().history.length, 1);
  assert.deepEqual(writing.state(), before);
  compatibility.dispose();
  writing.dispose();
});

test('returning restores the selected receipt, seen count, and remaining queue', () => {
  const storage = new Map();
  const first = createHarness({ storage });
  first.draw(); first.draw(); first.draw();
  first.click(first.find((node) => node.props?.['aria-label'] === '上一张已取出的内容'));
  first.flush();
  const before = first.state();
  first.dispose();
  const returning = createHarness({ storage });
  assert.deepEqual(returning.state(), before);
  returning.dispose();
});

test('opening a search result preserves query, open panel, cursor and queue when returning', () => {
  const storage = new Map();
  const first = createHarness({ storage });
  first.draw();
  first.click(first.find((node) => node.props?.className === 'searchToggle'));
  first.find((node) => node.props?.id === 'archive-machine-query').props.onChange({ target: { value: 'FDE' } });
  const result = first.find((node) => node.props?.href && node.props?.onClick);
  first.click(result);
  const before = first.state();
  assert.equal(before.query, 'FDE');
  assert.equal(before.searchOpen, true);
  first.dispose();
  const returning = createHarness({ storage });
  assert.deepEqual(returning.state(), before);
  assert.equal(returning.find((node) => node.props?.id === 'archive-machine-query').props.value, 'FDE');
  assert.ok(returning.all((node) => node.props?.href === result.props.href).length > 0);
  returning.dispose();
});

test('stale or foreign IDs are dropped and new articles rejoin the unseen queue', () => {
  const storage = new Map([[storageKey, JSON.stringify({
    history: ['illustrated:foreign', entries[0].id, entries[0].id],
    queue: [entries[1].id, entries[1].id, 'missing-article'], cursor: 99,
    query: 123, searchOpen: 'not-a-boolean',
  })]]);
  const harness = createHarness({ storage });
  const state = harness.state();
  assert.deepEqual(state.history, [entries[0].id]);
  assert.equal(state.cursor, 0);
  assert.equal(state.queue.length, entries.length - 1);
  assert.equal(new Set(state.queue).size, entries.length - 1);
  assert.ok(state.queue.every((id) => entryMap.has(id) && id !== entries[0].id));
  assert.equal(state.query, '');
  assert.equal(state.searchOpen, false);
  harness.dispose();
});

test('malformed or blocked storage cannot stop in-memory discovery', () => {
  const malformed = createHarness({ storage: new Map([[storageKey, '{not-json']]) });
  malformed.draw();
  assert.equal(malformed.state().history.length, 1);
  malformed.dispose();
  const blocked = createHarness({ storageBlocked: true });
  blocked.draw();
  const output = blocked.find((node) => node.type === 'output');
  assert.match(output.props['aria-label'], /已看 1 篇/);
  blocked.dispose();
});

test('reduced motion completes immediately and unmount clears pending print timers', () => {
  const reduced = createHarness({ reducedMotion: true });
  reduced.click(reduced.find((node) => node.props?.className === 'drawButton'));
  assert.equal(reduced.timers.size, 1);
  assert.equal([...reduced.timers.values()][0].delay, 0);
  reduced.flush();
  assert.equal(reduced.find((node) => node.props?.['data-archive-machine'] !== undefined).props['data-phase'], 'idle');
  reduced.dispose();
  const normal = createHarness();
  normal.click(normal.find((node) => node.props?.className === 'drawButton'));
  assert.equal(normal.timers.size, 1);
  normal.dispose();
  assert.equal(normal.timers.size, 0);
});

test('dedicated stylesheet compiles without writing build output', () => {
  const result = sass.compile(path.join(root, 'src/components/portfolio/archiveMachine.module.scss'));
  assert.ok(result.css.length > 0);
  assert.match(result.css, /prefers-reduced-motion: reduce/);
});

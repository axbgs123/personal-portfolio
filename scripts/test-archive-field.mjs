import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/archive/ArchiveField.jsx', import.meta.url), 'utf8');
const stylePath = new URL('../src/components/archive/archiveField.module.scss', import.meta.url);
const { css } = require('sass').compile(fileURLToPath(stylePath));
// Reuse Next's JSX compiler in memory. This is a component regression harness,
// not a Next build, DOM layout engine, browser test or installed dependency.
const input = `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function ArchiveField', 'function ArchiveField')}\nmodule.exports = ArchiveField;`;
const { code } = require('next/dist/compiled/babel/core').transformSync(input, {
  filename: 'ArchiveField.jsx',
  babelrc: false,
  configFile: false,
  presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
});

function children(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  return Array.isArray(value) ? value.flatMap(children) : [value];
}

function nodes(tree) {
  return children(tree).flatMap((node) => (typeof node === 'object' ? [node, ...nodes(node.props.children)] : []));
}

function text(tree) {
  return children(tree)
    .map((node) => (typeof node === 'object' ? text(node.props.children) : String(node)))
    .join('');
}

function hasClass(node, name) {
  return (node.props.className || '').split(' ').includes(name);
}

function makeHarness(entries, { reduced = false } = {}) {
  const state = [];
  const refs = [];
  const events = new Map();
  const mediaEvents = new Map();
  const frames = new Map();
  const properties = new Map();
  const motion = { matches: !reduced, addEventListener: (name, listener) => mediaEvents.set(name, listener), removeEventListener: (name) => mediaEvents.delete(name) };
  let stateIndex = 0;
  let refIndex = 0;
  let frameId = 0;
  let mounted = false;
  let effect;
  let cleanup;
  let currentTree;
  let focused;
  const field = {
    style: { setProperty: (name, value) => properties.set(name, value) },
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 900, height: 1100 }),
    addEventListener: (name, listener) => events.set(name, listener),
    removeEventListener: (name) => events.delete(name),
  };
  const context = {
    module: { exports: {} },
    React: { Fragment: 'fragment', createElement: (type, props, ...content) => ({ type, props: { ...props, children: content } }) },
    Image: 'NextImage',
    Link: 'NextLink',
    clsx: (...names) => names.filter(Boolean).join(' '),
    styles: new Proxy({}, { get: (_, property) => String(property) }),
    useState: (initial) => {
      const index = stateIndex;
      stateIndex += 1;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (value) => {
          state[index] = typeof value === 'function' ? value(state[index]) : value;
        },
      ];
    },
    useRef: (initial) => {
      const index = refIndex;
      refIndex += 1;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useId: () => 'archive-regression',
    useMemo: (calculate) => calculate(),
    useEffect: (run) => {
      if (!mounted) effect = run;
    },
    window: { innerHeight: 800, matchMedia: () => motion },
    requestAnimationFrame: (callback) => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  vm.runInNewContext(code, context, { filename: 'ArchiveField.regression.js' });
  const harness = {
    render() {
      stateIndex = 0;
      refIndex = 0;
      currentTree = context.module.exports({ entries, title: '测试资料' });
      nodes(currentTree).forEach((node) => {
        const control = {
          props: node.props,
          focus() {
            focused = this;
            node.props.onFocus?.();
          },
        };
        if (typeof node.props.ref === 'function') node.props.ref(control);
        else if (node.props.ref) node.props.ref.current = node.props['data-archive-field'] !== undefined ? field : control;
      });
      if (!mounted) {
        mounted = true;
        cleanup = effect();
      }
      return currentTree;
    },
    all: () => nodes(currentTree),
    words: () => nodes(currentTree).filter((node) => hasClass(node, 'word')),
    find: (predicate) => nodes(currentTree).find(predicate),
    selected: () => nodes(currentTree).find((node) => hasClass(node, 'word') && hasClass(node, 'selected')),
    filter(query) {
      harness.find((node) => node.type === 'input').props.onChange({ target: { value: query } });
      harness.render();
    },
    key(node, key, modifiers = {}) {
      let prevented = false;
      node.props.onKeyDown({
        key,
        preventDefault: () => {
          prevented = true;
        },
        ...modifiers,
      });
      harness.render();
      return prevented;
    },
    focused: () => focused,
    move: () => events.get('pointermove')({ clientX: 910, clientY: 820 }),
    flush: () => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback());
    },
    reset: () => events.get('pointerleave')(),
    reduce: () => {
      motion.matches = false;
      mediaEvents.get('change')();
    },
    frames,
    events,
    mediaEvents,
    properties,
    unmount: () => cleanup(),
  };
  harness.render();
  return harness;
}

const entries = Array.from({ length: 10 }, (_, index) =>
  Object.freeze({ title: `标题 ${index}`, meta: index === 2 || index === 7 ? 'KEEP 匹配词' : '其他', desc: `原始文字 ${index}`, status: `原始状态 ${index}`, href: `/writing/article-${index}` }),
);
const ruleBody = (selector) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) =>
      match[1]
        .trim()
        .split(/\s*,\s*/)
        .includes(selector),
    )
    .map((match) => match[2])
    .join('\n');

test('every supplied entry remains navigable without mutating its original content', () => {
  const original = JSON.stringify(entries);
  const view = makeHarness(Object.freeze([...entries]));
  assert.equal(view.words().length, entries.length);
  entries.forEach((entry, index) => {
    const word = view.words()[index];
    assert.equal(word.props.href, entry.href);
    assert.equal(word.type, 'NextLink');
    assert.equal(word.props.scroll, false);
    word.props.onPointerEnter();
    view.render();
    assert.equal(text(view.find((node) => node.type === 'h2')), entry.title);
    assert.equal(text(view.find((node) => hasClass(node, 'description'))), entry.desc);
    const meta = text(view.find((node) => hasClass(node, 'meta')));
    assert.ok(meta.includes(entry.meta) && meta.includes(entry.status));
  });
  assert.equal(JSON.stringify(entries), original);
  view.unmount();
});

test('long unbroken titles retain full text and all preview text has wrap protection', () => {
  const title = `AI${'LongUnbrokenTitle'.repeat(12)}中文结尾`;
  const view = makeHarness([{ title, meta: 'M'.repeat(150), desc: 'https://example.invalid/'.repeat(15), href: '/writing/long' }]);
  assert.ok(text(view.words()[0]).includes(title));
  assert.equal(text(view.find((node) => node.type === 'h2')), title);
  ['.word', '.preview h2', '.meta', '.description'].forEach((selector) => assert.match(ruleBody(selector), /overflow-wrap:\s*anywhere/));
  assert.match(ruleBody('.meta > span'), /min-width:\s*0/);
  assert.match(ruleBody('.word'), /scroll-margin-block:/);
  view.unmount();
});

test('filter is trimmed, case-insensitive, includes metadata, and counts only visible entries', () => {
  const view = makeHarness(entries);
  view.filter('  keep  ');
  assert.deepEqual(
    view.words().map((node) => node.props.href),
    ['/writing/article-2', '/writing/article-7'],
  );
  const status = view.find((node) => node.props.role === 'status');
  assert.equal(text(status), '2 / 10 个匹配');
  assert.equal(status.props['aria-live'], 'polite');
  assert.equal(status.props['aria-atomic'], 'true');
  view.unmount();
});

test('ArrowLeft/Right and Home/End use filtered original indices and stop at list boundaries', () => {
  const view = makeHarness(entries);
  view.filter('keep');
  assert.equal(view.key(view.words()[0], 'ArrowRight'), true);
  assert.equal(view.selected().props.href, '/writing/article-7');
  assert.equal(view.focused().props.href, '/writing/article-7');
  assert.equal(view.key(view.words()[1], 'ArrowRight'), true);
  assert.equal(view.selected().props.href, '/writing/article-7');
  view.key(view.words()[1], 'Home');
  assert.equal(view.selected().props.href, '/writing/article-2');
  view.key(view.words()[0], 'ArrowLeft');
  assert.equal(view.selected().props.href, '/writing/article-2');
  view.key(view.words()[0], 'End');
  assert.equal(view.selected().props.href, '/writing/article-7');
  assert.equal(view.key(view.words()[1], 'ArrowLeft', { ctrlKey: true }), false);
  assert.equal(view.selected().props.href, '/writing/article-7');
  assert.equal(view.key(view.words()[1], 'Enter'), false);
  const preview = view.find((node) => hasClass(node, 'preview'));
  view.words().forEach((node) => assert.equal(node.props['aria-controls'], preview.props.id));
  view.unmount();
});

test('empty filter removes stale preview, announces zero, and clearing restores search focus', () => {
  const view = makeHarness(entries);
  view.filter('没有这个标题');
  assert.equal(view.words().length, 0);
  assert.equal(
    view.find((node) => hasClass(node, 'preview')),
    undefined,
  );
  assert.equal(text(view.find((node) => node.props.role === 'status')), '0 / 10 个匹配');
  const clear = view.find((node) => node.type === 'button' && text(node).includes('清除搜索'));
  clear.props.onClick();
  view.render();
  assert.equal(view.words().length, entries.length);
  assert.equal(view.focused().props.id, view.find((node) => node.type === 'input').props.id);
  assert.equal(view.find((node) => node.type === 'input').props.value, '');
  view.unmount();
});

test('external title and preview links retain href, label, noopener and noreferrer', () => {
  const href = 'https://example.invalid/share?from=archive';
  const view = makeHarness([{ title: '提示词原资料', meta: '生图', status: '提取码：AB12', desc: '原文件文字', href, linkLabel: '打开原资料' }]);
  const links = view.all().filter((node) => node.type === 'a');
  assert.equal(links.length, 2);
  links.forEach((node) => {
    assert.equal(node.props.href, href);
    assert.equal(node.props.target, '_blank');
    assert.equal(node.props.rel, 'noopener noreferrer');
  });
  assert.match(view.words()[0].props['aria-label'], /站外新窗口/);
  assert.ok(text(view.find((node) => hasClass(node, 'open'))).includes('打开原资料'));
  assert.ok(text(view.find((node) => hasClass(node, 'meta'))).includes('提取码：AB12'));
  view.unmount();
});

test('missing detail remains an accessible selection button and truthful non-link placeholder', () => {
  const view = makeHarness([{ title: '尚待补充的作品', meta: '摄影', desc: '原简介', status: '详情待补充' }]);
  const control = view.words()[0];
  assert.equal(control.type, 'button');
  assert.equal(control.props.type, 'button');
  assert.equal(control.props.href, undefined);
  assert.equal(control.props['aria-pressed'], true);
  assert.ok(text(control).includes('待补充'));
  assert.equal(text(view.find((node) => hasClass(node, 'pending'))), '详情待补充');
  assert.equal(
    view.find((node) => hasClass(node, 'open')),
    undefined,
  );
  view.unmount();
});

test('image source, alt, fit and full entry copy survive the new presentation', () => {
  const entry = Object.freeze({
    title: '原始图文教程',
    meta: '完成版',
    desc: '完整介绍',
    status: '已完成',
    href: '/tutorials/original',
    image: Object.freeze({ src: '/original/image.png', alt: '原始配图说明', fit: 'cover' }),
  });
  const view = makeHarness([entry]);
  const image = view.find((node) => node.type === 'NextImage');
  assert.equal(image.props.src, entry.image.src);
  assert.equal(image.props.alt, entry.image.alt);
  assert.equal(image.props.style.objectFit, 'cover');
  assert.equal(text(view.find((node) => hasClass(node, 'description'))), entry.desc);
  view.unmount();
  const fallback = makeHarness([{ ...entry, image: { src: entry.image.src } }]);
  assert.equal(fallback.find((node) => node.type === 'NextImage').props.alt, entry.title);
  assert.equal(fallback.find((node) => node.type === 'NextImage').props.style.objectFit, 'contain');
  fallback.unmount();
});

test('pointer preview schedules one frame, resets on leave/preference change, and cleans up fully', () => {
  const view = makeHarness(entries);
  view.move();
  view.move();
  assert.equal(view.frames.size, 1);
  view.flush();
  assert.equal(view.properties.get('--preview-x'), '10px');
  assert.equal(view.properties.get('--preview-y'), '7px');
  view.reset();
  assert.equal(view.properties.get('--preview-x'), '0px');
  assert.equal(view.properties.get('--preview-turn'), '0deg');
  view.move();
  assert.equal(view.frames.size, 1);
  view.reduce();
  assert.equal(view.frames.size, 0);
  view.move();
  assert.equal(view.frames.size, 0);
  view.unmount();
  assert.equal(view.frames.size, 0);
  assert.equal(view.events.size, 0);
  assert.equal(view.mediaEvents.size, 0);
  const pending = makeHarness(entries);
  pending.move();
  assert.equal(pending.frames.size, 1);
  pending.unmount();
  assert.equal(pending.frames.size, 0);
  assert.equal(pending.properties.get('--preview-x'), '0px');
  assert.equal(pending.events.size, 0);
  assert.equal(pending.mediaEvents.size, 0);
});

test('reduced motion and touch mode have no pointer animation; CSS removes entrance/transition motion', () => {
  const view = makeHarness(entries, { reduced: true });
  view.move();
  assert.equal(view.frames.size, 0);
  view.unmount();
  const reducedCss = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reducedCss, /\.previewInner\s*\{\s*animation:\s*none/);
  assert.match(reducedCss, /\.media\s*\{[^}]*transition:\s*none;[^}]*transform:\s*none/s);
  assert.match(source, /\(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
});

test('empty fallback stays safe and archive entrypoints do not revive the retired folio', () => {
  const view = makeHarness([]);
  assert.equal(view.words().length, 0);
  assert.equal(
    view.find((node) => hasClass(node, 'preview')),
    undefined,
  );
  assert.equal(text(view.find((node) => node.props.role === 'status')), '0 个条目');
  view.unmount();
  ['../src/components/archive/ArchivePage.jsx', '../src/pages/tutorials/components/AiResourceGuide.jsx'].forEach((file) => {
    const content = readFileSync(new URL(file, import.meta.url), 'utf8');
    // Individual categories now have their own instruments, covered by their
    // integration suites. ArchiveField remains only a safe generic fallback.
    assert.doesNotMatch(content, /import ArchiveFolio/);
  });
});

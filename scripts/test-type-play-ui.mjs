import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as physics from '../src/lib/typePlayPhysics.mjs';
import * as poster from '../src/lib/typePlayPoster.mjs';

// Execute the actual JSX event handlers with real physics / poster functions.
// Only browser rendering, native events and React's commit loop are simulated;
// this complements, rather than replaces, real mobile / visual browser QA.
const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('src/components/type-play/TypePlay.jsx', root), 'utf8');
const stylePath = new URL('src/components/type-play/typePlay.module.scss', root);
const styleSource = readFileSync(stylePath, 'utf8');
const { css } = require('sass').compile(fileURLToPath(stylePath));
const compiled = require('next/dist/compiled/babel/core').transformSync(
  `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function TypePlay', 'function TypePlay')}\nmodule.exports = TypePlay;`,
  {
    filename: 'TypePlay.test.jsx',
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
  },
).code;
const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const styles = new Proxy({}, { get: (_, key) => String(key) });

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

const classIs = (node, name) => node.props.className?.split(' ').includes(name);
const poses = (world) => world.bodies.map(({ id, text: glyph, x, y, angle }) => ({ id, text: glyph, x, y, angle }));
const event = (extra = {}) => ({
  prevented: false,
  preventDefault() {
    this.prevented = true;
  },
  ...extra,
});
const flush = async () => {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
};

function canvasContext(kind) {
  const operations = [];
  const context = { kind, operations, font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic' };
  for (const method of ['save', 'restore', 'setTransform', 'scale', 'translate', 'rotate', 'setLineDash', 'fillRect', 'strokeRect', 'fillText', 'beginPath', 'moveTo', 'lineTo', 'stroke']) {
    context[method] = (...args) => operations.push({ method, args });
  }
  context.measureText = (value) => {
    const size = Number(context.font.match(/([\d.]+)px/)?.[1] || 10);
    const width = /^[\x00-\x7f]*$/.test(value) ? size * 0.62 * value.length : size * 0.95;
    return { width, actualBoundingBoxLeft: width / 2, actualBoundingBoxRight: width / 2, actualBoundingBoxAscent: size * 0.8, actualBoundingBoxDescent: size * 0.12 };
  };
  return context;
}

function harness({ reducedMotion = false, fontPromise = Promise.resolve(), blobFailure = false } = {}) {
  const states = [],
    refs = [],
    callbacks = [],
    effects = [];
  const frames = new Map(),
    timers = new Map(),
    visibilityListeners = new Set(),
    mediaListeners = new Set();
  const captures = new Set(),
    attributes = new Map(),
    worlds = [],
    renders = [],
    exports = [],
    downloads = [],
    urls = [],
    revoked = [],
    observers = [];
  const viewContext = canvasContext('screen');
  let stateIndex = 0,
    refIndex = 0,
    callbackIndex = 0,
    effectIndex = 0,
    serial = 0,
    tree,
    effectCommitted = false,
    disposed = false;
  const bounds = { left: 20, top: 40, width: 500, height: 550 };
  const canvas = {
    width: 1000,
    height: 1100,
    focused: false,
    getBoundingClientRect: () => bounds,
    getContext: () => viewContext,
    setPointerCapture: (id) => captures.add(id),
    hasPointerCapture: (id) => captures.has(id),
    releasePointerCapture: (id) => captures.delete(id),
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
    focus(options) {
      this.focused = true;
      this.focusOptions = options;
    },
  };
  const media = { matches: reducedMotion, addEventListener: (_, listener) => mediaListeners.add(listener), removeEventListener: (_, listener) => mediaListeners.delete(listener) };
  const document = {
    hidden: false,
    fonts: { load: () => fontPromise, ready: Promise.resolve() },
    addEventListener: (_, listener) => visibilityListeners.add(listener),
    removeEventListener: (_, listener) => visibilityListeners.delete(listener),
    body: {
      appendChild(anchor) {
        anchor.appended = true;
      },
    },
    createElement(tag) {
      if (tag === 'canvas') {
        const context = canvasContext('export');
        const output = {
          width: 0,
          height: 0,
          context,
          getContext: () => context,
          toBlob(callback, type) {
            this.mimeType = type;
            callback(blobFailure ? null : { type });
          },
        };
        exports.push(output);
        return output;
      }
      assert.equal(tag, 'a', 'export may only create a canvas and download link');
      return {
        click() {
          downloads.push({ href: this.href, download: this.download, appended: this.appended });
        },
        remove() {
          this.removed = true;
        },
      };
    },
  };
  const context = {
    module: { exports: {} },
    React,
    styles,
    SignatureMark: 'SignatureMark',
    ...physics,
    ...poster,
    createWorld(options) {
      const world = physics.createWorld(options);
      worlds.push(world);
      return world;
    },
    renderPoster(target, options) {
      renders.push({ target, ...options, snapshot: poses(options.world) });
      return poster.renderPoster(target, options);
    },
    useState(initial) {
      const index = stateIndex;
      stateIndex += 1;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [
        states[index],
        (next) => {
          states[index] = typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
    useRef(initial) {
      const index = refIndex;
      refIndex += 1;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useId: () => 'type-play-test',
    useCallback(callback, deps) {
      const index = callbackIndex;
      callbackIndex += 1;
      const previous = callbacks[index];
      if (!previous || deps.some((dependency, position) => dependency !== previous.deps[position])) callbacks[index] = { callback, deps };
      return callbacks[index].callback;
    },
    useEffect(callback) {
      const index = effectIndex;
      effectIndex += 1;
      if (!effectCommitted) effects[index] = { callback };
    },
    document,
    window: {
      devicePixelRatio: 2,
      matchMedia: () => media,
      setTimeout(callback) {
        const id = ++serial;
        timers.set(id, callback);
        return id;
      },
    },
    URL: {
      createObjectURL(blob) {
        const url = `blob:type-play-test-${urls.length}`;
        urls.push({ blob, url });
        return url;
      },
      revokeObjectURL: (url) => revoked.push(url),
    },
    requestAnimationFrame(callback) {
      const id = ++serial;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        observers.push(this);
      }
      observe(target) {
        this.target = target;
      }
      disconnect() {
        this.disconnected = true;
      }
    },
  };
  vm.runInNewContext(compiled, context);
  const page = {
    canvas,
    captures,
    attributes,
    frames,
    renders,
    exports,
    downloads,
    urls,
    revoked,
    observers,
    visibilityListeners,
    mediaListeners,
    worlds,
    render() {
      stateIndex = 0;
      refIndex = 0;
      callbackIndex = 0;
      effectIndex = 0;
      tree = context.module.exports();
      const elements = nodes(tree);
      elements.find((node) => node.type === 'canvas').props.ref.current = canvas;
      return elements;
    },
    async mount() {
      this.render();
      effectCommitted = true;
      for (const effect of effects) effect.cleanup = effect.callback();
      await flush();
      this.render();
      return this;
    },
    find(predicate) {
      const node = this.render().find(predicate);
      assert.ok(node, 'expected UI control is rendered');
      return node;
    },
    byClass: (name) => page.find((node) => classIs(node, name)),
    byLabel: (label) => page.find((node) => node.props['aria-label'] === label),
    canvasNode: () => page.find((node) => node.type === 'canvas'),
    buttonText: (label) => page.find((node) => node.type === 'button' && text(node).includes(label)),
    text: () => text(tree),
    world: () => worlds.at(-1),
    input(value) {
      this.find((node) => node.type === 'textarea').props.onChange({ target: { value } });
      this.render();
    },
    submit() {
      const submission = event();
      this.find((node) => node.type === 'form').props.onSubmit(submission);
      this.render();
      return submission;
    },
    key(key, extra = {}) {
      const press = event({ key, ...extra });
      this.canvasNode().props.onKeyDown(press);
      this.render();
      return press;
    },
    pointer(body, extra = {}) {
      return event({ isPrimary: true, button: 0, pointerId: 7, clientX: bounds.left + (body.x / 1000) * bounds.width, clientY: bounds.top + (body.y / 1100) * bounds.height, ...extra });
    },
    frame(time = 16.67) {
      const pending = [...frames];
      frames.clear();
      for (const [, callback] of pending) callback(time);
      this.render();
    },
    visibility(hidden) {
      document.hidden = hidden;
      for (const callback of visibilityListeners) callback();
      this.render();
    },
    reduced(matches) {
      media.matches = matches;
      for (const callback of mediaListeners) callback({ matches });
      this.render();
    },
    runTimers() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((callback) => callback());
    },
    cleanup() {
      if (disposed) return;
      disposed = true;
      for (const effect of effects) effect.cleanup?.();
    },
  };
  return page;
}

async function mount(t, options) {
  const page = harness(options);
  t.after(() => page.cleanup());
  return page.mount();
}

test('paused creation experiment stays outside production routes and keeps its layout scoped', () => {
  const app = readFileSync(new URL('src/pages/_app.page.jsx', root), 'utf8');
  const route = readFileSync(new URL('docs/experiments/type-play/paused-page.jsx', root), 'utf8');
  assert.match(route, /TypePlayPage\.standalone\s*=\s*true/);
  assert.match(route, /noindex,\s*nofollow/);
  assert.doesNotMatch(app, /Component\.standalone/);
  assert.equal(existsSync(new URL('src/pages/type-play.page.jsx', root)), false);
  assert.doesNotMatch(source, /PortfolioShell|StudioCat|Archive|fetch\(|localStorage|sessionStorage|dangerouslySetInnerHTML/);
  assert.doesNotMatch(styleSource, /:global|:root|(?:^|\n)\s*(?:html|body)\b/);
  assert.match(css, /\.root\s*\{[^}]*position: fixed;[^}]*overflow: hidden;/s);
  assert.match(css, /\.tools\s*\{[^}]*overflow-y: auto;/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.root\s*\{[^}]*overflow: auto;/);
  assert.match(css, /@media[^\{]*max-width: 760px/);
  assert.match(css, /touch-action: none/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('mount prepares real glyph metrics and one world after fonts are ready', async (t) => {
  const page = await mount(t);
  assert.equal(page.worlds.length, 1);
  assert.equal(
    page
      .world()
      .bodies.map((body) => body.text)
      .join(''),
    '把想法放出来',
  );
  assert.ok(page.world().bodies.every((body) => body.width > 0 && body.height > 0 && Number.isFinite(body.drawY)));
  assert.equal(page.byLabel('把这句话放进画布').props.disabled, false);
  assert.equal(page.frames.size, 0, 'initial composition does not animate without an action');
  assert.ok(page.renders.some((render) => render.target.kind === 'screen'));
  assert.equal(page.observers[0].target, page.canvas);
});

test('empty and over-18 graphemes block submission without replacing the current world', async (t) => {
  const page = await mount(t);
  const original = page.world();
  page.input(' \n\t ');
  assert.equal(page.submit().prevented, true);
  assert.match(page.text(), /先写下一句话/);
  assert.equal(page.world(), original);
  page.input('字'.repeat(19));
  page.submit();
  assert.match(page.text(), /最多放 18 个字/);
  assert.equal(page.find((node) => node.type === 'textarea').props['aria-invalid'], true);
  assert.equal(page.world(), original);
  assert.equal(page.worlds.length, 1);
});

test('valid submission rebuilds from exact graphemes and clears the validation error', async (t) => {
  const page = await mount(t);
  page.input('字'.repeat(19));
  page.submit();
  page.input('  中 A 👨‍👩‍👧‍👦 e\u0301  ');
  page.submit();
  assert.deepEqual(
    page.world().bodies.map((body) => body.text),
    ['中', 'A', '👨‍👩‍👧‍👦', 'é'],
  );
  assert.equal(page.find((node) => node.type === 'textarea').props['aria-invalid'], false);
  assert.equal(page.renders.at(-1).phrase, '中 A 👨‍👩‍👧‍👦 é');
  page.input('字'.repeat(18));
  page.submit();
  assert.equal(page.world().bodies.length, 18);
  assert.equal(page.worlds.length, 3);
});

test('pointer drag maps CSS coordinates into the same world and cancel releases both captures', async (t) => {
  const page = await mount(t);
  const world = page.world();
  const body = world.bodies[0];
  const down = page.pointer(body);
  page.canvasNode().props.onPointerDown(down);
  assert.equal(down.prevented, true);
  assert.equal(world.grab.id, body.id);
  assert.equal(page.captures.has(7), true);
  assert.equal(page.attributes.get('data-dragging'), 'true');
  assert.equal(page.canvas.focused, true);
  assert.equal(page.canvas.focusOptions.preventScroll, true);
  const move = page.pointer({ x: body.x + 120, y: body.y - 80 });
  page.canvasNode().props.onPointerMove(move);
  assert.ok(Math.abs(world.grab.x - (body.x + 120)) < 1e-8);
  assert.ok(Math.abs(world.grab.y - (body.y - 80)) < 1e-8);
  page.canvasNode().props.onPointerCancel(event({ pointerId: 99 }));
  assert.notEqual(world.grab, null, 'another finger cannot cancel the active primary drag');
  page.frame();
  page.canvasNode().props.onPointerCancel(event({ pointerId: 7 }));
  assert.equal(world.grab, null);
  assert.equal(page.captures.size, 0);
  assert.equal(page.attributes.has('data-dragging'), false);
  page.canvasNode().props.onLostPointerCapture(event({ pointerId: 7 }));
  assert.equal(world.grab, null, 'the subsequent native lost-capture event is safe');
  assert.equal(page.world(), world);
});

test('non-primary and secondary-button pointer downs never grab a body', async (t) => {
  const page = await mount(t);
  const body = page.world().bodies[0];
  page.canvasNode().props.onPointerDown(page.pointer(body, { isPrimary: false }));
  page.canvasNode().props.onPointerDown(page.pointer(body, { button: 2 }));
  assert.equal(page.world().grab, null);
  assert.equal(page.captures.size, 0);
  assert.equal(page.frames.size, 0);
});

test('freeze preserves all current positions and angles, cancels RAF, and resumes the same world', async (t) => {
  const page = await mount(t);
  const world = page.world();
  page.key('ArrowDown');
  page.frame();
  const before = poses(world);
  page.byClass('freezeButton').props.onClick();
  page.render();
  assert.deepEqual(poses(world), before);
  assert.equal(page.frames.size, 0);
  assert.ok(world.bodies.every((body) => body.vx === 0 && body.vy === 0 && body.angularVelocity === 0));
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], true);
  page.key('ArrowRight');
  page.canvasNode().props.onPointerDown(page.pointer(world.bodies[0]));
  page.frame(2000);
  assert.deepEqual(poses(world), before);
  assert.equal(world.grab, null);
  page.byClass('freezeButton').props.onClick();
  assert.equal(page.world(), world);
  assert.deepEqual(poses(world), before);
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], false);
});

test('keyboard selection, arrows and native nudge buttons manipulate one real collision world', async (t) => {
  const page = await mount(t);
  const world = page.world();
  page.key(']');
  assert.equal(page.byLabel(`选择第 1 个字：${world.bodies[0].text}`).props['aria-pressed'], true);
  page.key(']');
  const target = world.bodies[1];
  assert.equal(page.byLabel(`选择第 2 个字：${target.text}`).props['aria-pressed'], true);
  const x = target.x;
  assert.equal(page.key('ArrowRight').prevented, true);
  assert.ok(target.x > x);
  const y = target.y;
  page.byLabel('向下移动').props.onClick();
  assert.ok(target.y > y);
  page.byLabel(`选择第 3 个字：${world.bodies[2].text}`).props.onClick();
  const before = poses(world);
  page.key('ArrowUp', { shiftKey: true });
  assert.ok(world.bodies[2].y < before[2].y);
  assert.equal(page.world(), world);
  assert.equal(page.worlds.length, 1);
  page.key('Escape');
  assert.equal(page.render().filter((node) => node.props['aria-label']?.startsWith('选择第') && node.props['aria-pressed']).length, 0);
});

test('first reverse selection picks the final glyph and brackets wrap at both ends', async (t) => {
  const page = await mount(t);
  const world = page.world();
  const final = world.bodies.at(-1);
  const firstLabel = `选择第 1 个字：${world.bodies[0].text}`;
  const finalLabel = `选择第 ${world.bodies.length} 个字：${final.text}`;
  const before = poses(world);
  assert.equal(page.key('[').prevented, true);
  assert.equal(page.byLabel(finalLabel).props['aria-pressed'], true);
  page.key(']');
  assert.equal(page.byLabel(firstLabel).props['aria-pressed'], true);
  page.key('[');
  assert.equal(page.byLabel(finalLabel).props['aria-pressed'], true);
  page.key('Escape');
  page.key(']');
  assert.equal(page.byLabel(firstLabel).props['aria-pressed'], true);
  assert.deepEqual(poses(world), before, 'selection changes do not alter the composition');
});

test('Ctrl, Meta, Alt and composing shortcuts remain native without selecting, nudging or freezing', async (t) => {
  const page = await mount(t);
  const world = page.world();
  const before = poses(world);
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
    for (const key of ['[', ']', 'ArrowLeft', 'ArrowDown', ' ', 'Enter', 'Escape']) {
      assert.equal(page.key(key, { [modifier]: true }).prevented, false, `${modifier} + ${key} is not intercepted`);
    }
  }
  assert.deepEqual(poses(world), before);
  assert.equal(page.world(), world);
  assert.equal(page.frames.size, 0);
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], false);
  assert.equal(page.render().filter((node) => node.props['aria-label']?.startsWith('选择第') && node.props['aria-pressed']).length, 0);
});

test('IME composition and repeated freeze keys do not accidentally change the composition', async (t) => {
  const page = await mount(t);
  const before = poses(page.world());
  assert.equal(page.key('ArrowRight', { isComposing: true }).prevented, false);
  assert.equal(page.key('Enter', { isComposing: true }).prevented, false);
  assert.deepEqual(poses(page.world()), before);
  page.key(' ', { repeat: true });
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], false);
  page.key('Enter');
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], true);
});

test('PNG export freezes the current snapshot and calls the real renderer without toolbar or handles', async (t) => {
  const page = await mount(t);
  const world = page.world();
  page.key('ArrowDown');
  page.frame();
  page.buttonText('黑白反转').props.onClick();
  const before = poses(world);
  await page.byClass('saveButton').props.onClick();
  page.render();
  const output = page.exports[0];
  const exported = page.renders.findLast((render) => render.target.kind === 'export');
  const screen = page.renders.findLast((render) => render.target.kind === 'screen');
  assert.equal(output.width, 2000);
  assert.equal(output.height, 2200);
  assert.equal(output.mimeType, 'image/png');
  assert.equal(exported.world, world);
  assert.deepEqual(exported.snapshot, before);
  assert.deepEqual(exported.snapshot, screen.snapshot);
  assert.equal(exported.inverted, true);
  assert.equal(exported.showHandles, false);
  assert.equal(exported.frozen, true);
  assert.ok(output.context.operations.some((operation) => operation.method === 'fillText' && operation.args[0] === world.bodies[0].text));
  assert.equal(output.context.operations.filter((operation) => operation.method === 'strokeRect').length, 0);
  assert.ok(output.context.operations.filter((operation) => operation.method === 'fillText').every((operation) => !/保存|定格|重新排好|让字落下来|把一句话/.test(operation.args[0])));
  assert.equal(page.downloads.length, 1);
  assert.equal(page.downloads[0].download, '字由-我的海报.png');
  assert.equal(page.downloads[0].appended, true);
  assert.equal(page.frames.size, 0);
  assert.match(page.text(), /PNG 已生成/);
  page.runTimers();
  assert.deepEqual(page.revoked, [page.urls[0].url]);
});

test('failed PNG encoding gives an honest error and retains the exact composition for retry', async (t) => {
  const page = await mount(t, { blobFailure: true });
  const world = page.world();
  page.key('ArrowDown');
  const before = poses(world);
  await page.byClass('saveButton').props.onClick();
  page.render();
  assert.match(page.text(), /图片没能保存/);
  assert.equal(page.world(), world);
  assert.deepEqual(poses(world), before);
  assert.equal(page.downloads.length, 0);
  assert.equal(page.urls.length, 0);
  assert.equal(page.byClass('saveButton').props.disabled, false);
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], true);
});

test('reduced-motion starts frozen and a later preference change stops an active drag', async (t) => {
  const page = await mount(t, { reducedMotion: true });
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], true);
  assert.equal(page.frames.size, 0);
  assert.match(page.text(), /系统偏好定格/);
  page.byClass('freezeButton').props.onClick();
  const body = page.world().bodies[0];
  page.canvasNode().props.onPointerDown(page.pointer(body));
  assert.equal(page.captures.has(7), true);
  const before = poses(page.world());
  page.reduced(false);
  page.reduced(true);
  assert.deepEqual(poses(page.world()), before);
  assert.equal(page.world().grab, null);
  assert.equal(page.captures.size, 0);
  assert.equal(page.frames.size, 0);
  assert.equal(page.byClass('freezeButton').props['aria-pressed'], true);
});

test('visibility suspension and effect cleanup clear RAF, pointer capture and native subscriptions', async (t) => {
  const page = await mount(t);
  page.canvasNode().props.onPointerDown(page.pointer(page.world().bodies[0]));
  assert.equal(page.frames.size, 1);
  page.visibility(true);
  assert.equal(page.frames.size, 0);
  assert.equal(page.world().grab, null);
  assert.equal(page.captures.size, 0);
  page.visibility(false);
  page.key('ArrowRight');
  assert.equal(page.frames.size, 1);
  page.cleanup();
  assert.equal(page.frames.size, 0);
  assert.equal(page.visibilityListeners.size, 0);
  assert.equal(page.mediaListeners.size, 0);
  assert.ok(page.observers.every((observer) => observer.disconnected));
  const before = poses(page.world());
  page.frame(90000);
  assert.deepEqual(poses(page.world()), before);
});

test('unmount before font readiness cannot create a late world or animation loop', async (t) => {
  let completeFonts;
  const fontPromise = new Promise((resolve) => {
    completeFonts = resolve;
  });
  const page = await mount(t, { fontPromise });
  assert.equal(page.worlds.length, 0);
  assert.equal(page.byLabel('把这句话放进画布').props.disabled, true);
  page.cleanup();
  completeFonts();
  await flush();
  assert.equal(page.worlds.length, 0);
  assert.equal(page.frames.size, 0);
  assert.equal(page.renders.length, 0);
});

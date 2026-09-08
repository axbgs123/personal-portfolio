import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/portfolio/MotionDirector.jsx', import.meta.url), 'utf8');
const { css } = require('sass').compile(fileURLToPath(new URL('../src/components/portfolio/motionDirector.module.scss', import.meta.url)));
// Execute the real component and effect against a small DOM/GSAP recorder.
// This checks choreography contracts and locks, not browser pixels or paint cost.
const input = `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function MotionDirector', 'function MotionDirector')}\nmodule.exports = MotionDirector;`;
const { code } = require('next/dist/compiled/babel/core').transformSync(input, {
  filename: 'MotionDirector.jsx',
  babelrc: false,
  configFile: false,
  presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
});

function flatten(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  return Array.isArray(value) ? value.flatMap(flatten) : [value];
}
function nodes(tree) {
  return flatten(tree).flatMap((node) => (typeof node === 'object' ? [node, ...nodes(node.props.children)] : []));
}
function text(tree) {
  return flatten(tree)
    .map((node) => (typeof node === 'object' ? text(node.props.children) : String(node)))
    .join('');
}
function eventHub() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) {
      listeners.get(name)?.delete(callback);
      if (!listeners.get(name)?.size) listeners.delete(name);
    },
    dispatchEvent(event) {
      [...(listeners.get(event.type) || [])].forEach((callback) => callback(event));
    },
  };
}
function makeHarness({ reduced = false, seen = false, pathname = '/', width = 1440, height = 900, staleScrollTop = 0, staleScrollLeft = 0 } = {}) {
  const states = [];
  const refs = [];
  const frames = new Map();
  const timers = new Map();
  const timelines = [];
  const dispatches = [];
  const storage = new Map(seen ? [['chen-portfolio-opening-v8', 'seen']] : []);
  const windowEvents = eventHub();
  const documentEvents = eventHub();
  const mediaEvents = eventHub();
  const routerEvents = eventHub();
  const motion = { ...mediaEvents, matches: reduced };
  let stateIndex = 0;
  let refIndex = 0;
  let effect;
  let cleanup;
  let mounted = false;
  let nextId = 0;
  let focused = null;
  let modal = null;
  let currentTree;
  const element = (name, props = {}) => ({
    name,
    style: {},
    inert: false,
    dataset: {},
    focus: () => {
      focused = name;
    },
    ...props,
  });
  const main = element('main', { style: { overflow: 'auto' } });
  const header = element('header');
  const priorInert = element('prior-inert', { inert: true });
  const backgrounds = [main, header, priorInert];
  const columns = [0, 1, 2, 3, 4].map((index) => element(`column-${index}`));
  const panels = [element('opening-left'), element('opening-right')];
  const accent = element('mark', {
    clientWidth: Math.min(width * (width <= 760 ? 0.96 : 0.88), height * 1.26),
  });
  const ink = [element('Z'), element('C')];
  const overlay = element('overlay');
  const dock = element('dock', {
    getBoundingClientRect: () => ({
      left: (width <= 760 ? 24 : width * 0.07) - overlay.scrollLeft,
      top: (width <= 760 ? 32 : height * 0.06) - overlay.scrollTop,
      width: width <= 760 ? 52 : 64,
      height: (width <= 760 ? 52 : 64) / 1.5,
    }),
  });
  const quote = element('quote');
  const attribution = element('attribution');
  const backdrop = element('backdrop');
  const quickLine = element('quick-line');
  const copy = element('copy');
  const title = element('opening-title');
  const destination = element('route-title');
  const content = element('content');
  const selectors = new Map([
    ['[data-intro-accent]', accent],
    ['[data-opening-dock]', dock],
    ['[data-opening-quote]', quote],
    ['[data-opening-attribution]', attribution],
    ['[data-opening-backdrop]', backdrop],
    ['[data-quick-line]', quickLine],
    ['[data-curtain-copy]', copy],
    ['[data-opening-title]', title],
    ['[data-route-title]', destination],
  ]);
  Object.assign(overlay, {
    scrollTop: staleScrollTop,
    scrollLeft: staleScrollLeft,
    querySelector: (selector) => selectors.get(selector),
    querySelectorAll: (selector) => {
      if (selector === '[data-curtain-column]') return columns;
      if (selector === '[data-opening-panel]') return panels;
      if (selector === '[data-intro-accent] [data-signature-stroke]') return ink;
      return [];
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
  });
  const lenis = {
    stops: 0,
    starts: 0,
    scrolls: [],
    stop() {
      this.stops += 1;
    },
    start() {
      this.starts += 1;
    },
    scrollTo(...args) {
      this.scrolls.push(args);
    },
  };
  const set = (targets, values) => {
    flatten(targets).forEach((target, index) => {
      Object.entries(values).forEach(([name, value]) => {
        target.style[name] = typeof value === 'function' ? value(index) : value;
      });
    });
  };
  const gsap = {
    set,
    timeline(options = {}) {
      const timeline = {
        options,
        operations: [],
        killed: false,
        to(targets, values, position = 0) {
          this.operations.push({ targets, values, position });
          return this;
        },
        fromTo(targets, from, values, position = 0) {
          set(targets, from);
          this.operations.push({ targets, from, values, position });
          return this;
        },
        call(callback, parameters, position = 0) {
          this.operations.push({ targets: [], values: { duration: 0 }, position, callback });
          return this;
        },
        kill() {
          this.killed = true;
        },
        complete() {
          if (this.killed) return;
          this.operations.forEach(({ targets, values, callback }) => {
            set(targets, values);
            callback?.();
          });
          this.options.onComplete?.();
        },
      };
      timelines.push(timeline);
      return timeline;
    },
  };
  const document = {
    ...documentEvents,
    documentElement: { dataset: {} },
    querySelector: (selector) => {
      if (selector === 'main') return main;
      if (selector === '[data-portfolio-content]') return content;
      if (selector.includes('data-archive-dialog')) return modal;
      return null;
    },
    querySelectorAll: (selector) => (selector === '[data-motion-background]' ? backgrounds : []),
  };
  const router = {
    pathname,
    asPath: pathname,
    events: {
      on: (...args) => routerEvents.addEventListener(...args),
      off: (...args) => routerEvents.removeEventListener(...args),
    },
    push: async () => true,
  };
  const context = {
    module: { exports: {} },
    React: {
      createElement: (type, props, ...children) => ({
        type,
        props: { ...props, children },
      }),
    },
    SignatureMark: 'SignatureMark',
    styles: new Proxy({}, { get: (_, property) => String(property) }),
    gsap,
    useStore: { getState: () => ({ lenis }) },
    useRef: (initial) => {
      const index = refIndex;
      refIndex += 1;
      refs[index] ||= { current: initial };
      return refs[index];
    },
    useState: (initial) => {
      const index = stateIndex;
      stateIndex += 1;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (value) => {
          states[index] = value;
        },
      ];
    },
    useEffect: () => {},
    useLayoutEffect: (run) => {
      if (!mounted) effect = run;
    },
    window: {
      ...windowEvents,
      innerWidth: width,
      innerHeight: height,
      matchMedia: () => motion,
      location: {
        href: `http://localhost:3003${pathname}`,
        pathname,
        search: '',
        origin: 'http://localhost:3003',
      },
      dispatchEvent(event) {
        dispatches.push(event.type);
        windowEvents.dispatchEvent(event);
      },
    },
    document,
    sessionStorage: {
      getItem: (name) => storage.get(name),
      setItem: (name, value) => storage.set(name, value),
    },
    URL,
    CustomEvent: class CustomEvent {
      constructor(type) {
        this.type = type;
      }
    },
    requestAnimationFrame: (callback) => {
      nextId += 1;
      const id = nextId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (callback, delay) => {
      nextId += 1;
      const id = nextId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  vm.runInNewContext(code, context, {
    filename: 'MotionDirector.regression.js',
  });
  const harness = {
    overlay,
    main,
    header,
    priorInert,
    accent,
    quote,
    panels,
    columns,
    backdrop,
    timelines,
    frames,
    timers,
    lenis,
    motion,
    storage,
    dispatches,
    document,
    windowEvents,
    documentEvents,
    mediaEvents,
    routerEvents,
    render() {
      stateIndex = 0;
      refIndex = 0;
      currentTree = context.module.exports({ router });
      refs[0].current = overlay;
      refs[1].current = element('route-label');
      refs[2].current = nodes(currentTree).some((node) => node.type === 'button') ? element('skip') : undefined;
      return currentTree;
    },
    mount() {
      this.render();
      mounted = true;
      cleanup = effect();
      this.render();
      return this;
    },
    unmount() {
      cleanup?.();
    },
    key(key) {
      const event = {
        type: 'keydown',
        key,
        prevented: false,
        preventDefault() {
          this.prevented = true;
        },
      };
      windowEvents.dispatchEvent(event);
      this.render();
      return event;
    },
    replay() {
      windowEvents.dispatchEvent({ type: 'portfolio:replay-intro' });
      this.render();
    },
    modal(value) {
      modal = value;
    },
    focused: () => focused,
  };
  return harness;
}

test('initial DOM includes the complete mark, two diagonal planes and unchanged Paul Graham quotation', () => {
  const h = makeHarness();
  const initial = h.render();
  assert.equal(nodes(initial).filter((node) => node.type === 'SignatureMark').length, 1);
  assert.equal(nodes(initial).filter((node) => 'data-opening-panel' in node.props).length, 2);
  assert.match(text(initial), /Live in the future,then build what’s missing\./);
  assert.match(text(initial), /——Paul Graham，《How to Get Startup Ideas》/);
  assert.doesNotMatch(text(initial), /加载|loading|\d+%/i);
  h.mount();
  assert.equal(h.render().props.role, 'dialog');
  assert.equal(h.render().props['aria-modal'], 'true');
  h.unmount();
});

test('oversized solid ZC spatially resolves and docks; the quote stays readable within the existing six-second budget', () => {
  const h = makeHarness().mount();
  const { operations } = h.timelines[0];
  const zoom = operations.find((operation) => operation.targets === h.accent && operation.from);
  assert.equal(zoom.from.scale, 1.72);
  assert.equal(zoom.from.rotationY, -22);
  assert.equal(zoom.values.scale, 1);
  assert.ok(operations.some((operation) => operation.targets === h.accent && operation.values.scale < 0.1 && operation.values.x < 0 && operation.values.y < 0));
  assert.doesNotMatch(source, /strokeDashoffset|strokeDasharray/);
  const quoteIn = operations.find((operation) => operation.targets === h.quote && operation.values.autoAlpha === 1);
  const end = Math.max(...operations.map((operation) => operation.position + operation.values.duration));
  assert.ok(end - quoteIn.position - quoteIn.values.duration >= 2.8);
  assert.ok(end <= 5.06 + Number.EPSILON);
  h.timelines[0].complete();
  assert.ok(h.timelines[1].operations.some((operation) => operation.targets[0] === h.panels[0] && operation.values.duration === 0.94));
  assert.ok(end + 0.96 <= 6.03);
  h.unmount();
});

test('normal completion reveals the homepage in one handoff and restores original inert/overflow states', () => {
  const h = makeHarness().mount();
  assert.equal(h.overlay.dataset.introStage, 'assemble');
  assert.equal(h.main.inert, true);
  assert.equal(h.main.style.overflow, 'hidden');
  assert.equal(
    h.columns.every((column) => column.style.yPercent === 101),
    true,
  );
  h.timelines[0].operations.find((operation) => operation.callback).callback();
  assert.equal(h.overlay.dataset.introStage, 'quote');
  h.timelines[0].complete();
  assert.equal(h.overlay.dataset.introStage, 'reveal');
  assert.equal(h.document.documentElement.dataset.portfolioIntro, 'ready');
  assert.equal(h.main.inert, true, 'keep content inert while planes exit');
  h.timelines[1].complete();
  assert.equal(h.overlay.dataset.introStage, 'idle');
  assert.equal(h.main.inert, false);
  assert.equal(h.header.inert, false);
  assert.equal(h.priorInert.inert, true);
  assert.equal(h.main.style.overflow, 'auto');
  assert.equal(h.overlay.style.visibility, 'hidden');
  assert.equal(h.focused(), 'main');
  assert.equal(h.dispatches.filter((event) => event === 'portfolio:intro-complete').length, 1);
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('skip is immediate, cancels the pending focus RAF and cannot leave an invisible modal or lock', () => {
  const h = makeHarness().mount();
  const skip = nodes(h.render()).find((node) => node.type === 'button');
  skip.props.onClick();
  assert.equal(h.timelines.length, 1, 'skip must not create an exit timeline');
  assert.equal(h.timelines[0].killed, true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.main.inert, false);
  assert.equal(h.render().props.role, undefined);
  assert.equal(h.render().props['aria-hidden'], true);
  h.unmount();
});

test('Tab remains trapped during both reading and exit; Escape skips exit without a duplicate handoff event', () => {
  const h = makeHarness().mount();
  assert.equal(h.key('Tab').prevented, true);
  assert.equal(h.focused(), 'skip');
  h.timelines[0].complete();
  assert.equal(h.key('Tab').prevented, true);
  h.key('Escape');
  assert.equal(h.timelines[1].killed, true);
  assert.equal(h.main.inert, false);
  assert.equal(h.dispatches.filter((event) => event === 'portfolio:intro-complete').length, 1);
  assert.equal(h.key('Tab').prevented, false);
  h.unmount();
});

test('seen sessions skip automatically; explicit replay resets the same planes and dismisses other surfaces first', () => {
  const h = makeHarness({ seen: true }).mount();
  assert.equal(h.timelines.length, 0);
  h.modal({ name: 'archive' });
  h.windowEvents.addEventListener('portfolio:intro-start', () => {
    assert.equal(h.main.inert, false, 'dismiss modal before intro takes its independent lock');
    h.modal(null);
  });
  h.replay();
  assert.equal(h.timelines.length, 1);
  assert.ok(h.panels.every((panel) => panel.style.xPercent === 0 && panel.style.yPercent === 0));
  h.key('Escape');
  h.replay();
  assert.equal(h.timelines.length, 2);
  assert.equal(h.dispatches.filter((event) => event === 'portfolio:intro-start').length, 2);
  h.unmount();
});

test('initial reduced motion bypasses the intro without setting a seen flag or creating timers and locks', () => {
  const h = makeHarness({ reduced: true }).mount();
  assert.equal(h.timelines.length, 0);
  assert.equal(h.storage.size, 0);
  assert.equal(h.main.inert, false);
  assert.equal(h.lenis.stops, 0);
  assert.equal(h.timers.size, 0);
  h.replay();
  assert.equal(h.timelines.length, 0);
  h.unmount();
});

test('changing to reduced motion during reading or exit immediately releases the lock and modal', () => {
  [false, true].forEach((duringExit) => {
    const h = makeHarness().mount();
    if (duringExit) h.timelines[0].complete();
    h.motion.matches = true;
    h.mediaEvents.dispatchEvent({ type: 'change' });
    assert.equal(h.main.inert, false);
    assert.equal(h.main.style.overflow, 'auto');
    assert.equal(h.timers.size, 0);
    assert.equal(h.frames.size, 0);
    assert.equal(h.render().props.role, undefined);
    assert.equal(h.dispatches.filter((event) => event === 'portfolio:intro-complete').length, 1);
    h.unmount();
  });
});

test('phone dimensions use the same spatial intro, and resizing safely hands off instead of keeping stale geometry', () => {
  const h = makeHarness({ width: 390, height: 844 }).mount();
  const dockMove = h.timelines[0].operations.find((operation) => operation.targets === h.accent && operation.values.scale < 1);
  assert.ok(dockMove.values.scale > 0.13 && dockMove.values.scale < 0.15);
  assert.ok(dockMove.values.x < 0);
  h.windowEvents.dispatchEvent({ type: 'resize' });
  assert.equal(h.main.inert, false);
  assert.equal(h.render().props.role, undefined);
  assert.equal(h.timelines.length, 1);
  h.unmount();
});

test('phone replay clears retained curtain scroll before bookmark geometry, and the curtain is not a programmatic scroll container', () => {
  const h = makeHarness({ width: 390, height: 844, seen: true, staleScrollTop: 346, staleScrollLeft: 20 }).mount();
  assert.equal(h.overlay.scrollTop, 346, 'simulate the previously observed hidden-overflow offset');
  h.replay();
  assert.equal(h.overlay.scrollTop, 0);
  assert.equal(h.overlay.scrollLeft, 0);
  const dockMove = h.timelines[0].operations.find((operation) => operation.targets === h.accent && operation.values.scale < 1);
  assert.equal(dockMove.values.x, 24 + 52 / 2 - 390 / 2);
  assert.equal(dockMove.values.y, 32 + 52 / 1.5 / 2 - 844 / 2);
  const curtainRules = css.match(/\.curtain\s*\{([^}]+)\}/)[1];
  assert.match(curtainRules, /overflow: hidden;\s*overflow: clip;/);
  assert.match(curtainRules, /overflow-anchor: none;/);
  h.key('Escape');
  h.overlay.scrollTop = 346;
  h.replay();
  assert.equal(h.overlay.scrollTop, 0, 'every replay resets stale offsets, not only the initial mount');
  h.unmount();
});

test('an independently open dialog prevents intro cleanup from stealing focus or restarting its scroll', () => {
  const h = makeHarness().mount();
  h.modal({ name: 'cat-chat' });
  h.key('Escape');
  assert.equal(h.main.inert, false);
  assert.equal(h.lenis.starts, 0);
  assert.equal(h.focused(), null);
  assert.match(source, /OPEN_DIALOGS\s*=\s*'[^']*data-cat-chat-dialog/);
  h.unmount();
});

test('unmount cancels intro timers, focus work, media/resize/router/document listeners and restores state', () => {
  const h = makeHarness().mount();
  h.unmount();
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.windowEvents.listeners.size, 0);
  assert.equal(h.documentEvents.listeners.size, 0);
  assert.equal(h.mediaEvents.listeners.size, 0);
  assert.equal(h.routerEvents.listeners.size, 0);
  assert.equal(h.main.inert, false);
  assert.equal(h.main.style.overflow, 'auto');
  assert.equal(h.priorInert.inert, true);
  assert.equal(h.timelines[0].killed, true);
});

test('Sass includes a true diagonal split, oversized responsive identity, visible focus and reduced-motion bypass', () => {
  assert.match(css, /clip-path: polygon\(0 0, 70\.2% 0, 30\.2% 100%, 0 100%\)/);
  assert.match(css, /width: min\(88vw, 126svh\)/);
  assert.match(css, /perspective: 1200px/);
  assert.match(css, /\.skip:focus-visible\s*\{[^}]*outline: 2px solid/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.curtain\s*\{\s*display: none/);
  assert.doesNotMatch(css, /animation:\s*.*infinite|filter:\s*blur/);
});

test('ordinary chapter navigation retains the original route curtains and never displays the opening artwork', async () => {
  const h = makeHarness({ pathname: '/about' }).mount();
  h.routerEvents.listeners.get('routeChangeStart').forEach((callback) => callback('/projects'));
  assert.equal(h.overlay.dataset.mode, 'chapter');
  assert.equal(h.backdrop.style.display, 'none');
  assert.equal(h.timelines[0].operations[0].values.duration, 0.32);
  h.timelines[0].complete();
  h.routerEvents.listeners.get('routeChangeComplete').forEach((callback) => callback('/projects'));
  await Promise.resolve();
  [...h.frames.entries()].forEach(([id, callback]) => {
    h.frames.delete(id);
    callback();
  });
  assert.ok(h.timelines[1].operations.some((operation) => operation.targets[0] === h.columns[0] && operation.values.duration === 0.55));
  h.timelines[1].complete();
  assert.equal(h.main.inert, false);
  assert.equal(h.dispatches.length, 0);
  h.unmount();
});

test('reading routes still use the lightweight progress-line transition, not the full intro or chapter curtain', async () => {
  const h = makeHarness({ pathname: '/tutorials' }).mount();
  h.routerEvents.listeners.get('routeChangeStart').forEach((callback) => callback('/writing'));
  assert.equal(h.overlay.dataset.mode, 'reading');
  assert.equal(h.timelines[0].operations[0].values.duration, 0.06);
  h.timelines[0].complete();
  h.routerEvents.listeners.get('routeChangeComplete').forEach((callback) => callback('/writing'));
  await Promise.resolve();
  [...h.frames.entries()].forEach(([id, callback]) => {
    h.frames.delete(id);
    callback();
  });
  assert.ok(h.timelines[1].operations.some((operation) => operation.values.duration === 0.26 && operation.values.clearProps === 'opacity,transform'));
  h.timelines[1].complete();
  assert.equal(h.main.inert, false);
  assert.equal(h.dispatches.length, 0);
  h.unmount();
});

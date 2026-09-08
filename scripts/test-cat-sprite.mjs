import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import * as sprite from '../src/lib/catSprite.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const walk = JSON.parse(read('public/art/cat-continuity-walk-v2/manifest.json'));
const transitions = JSON.parse(read('public/art/cat-continuity-transition-v2/manifest.json'));
const actions = JSON.parse(read('public/art/cat-sprite-actions-v1/manifest.json'));
const source = read('src/components/portfolio/StudioCat.jsx');
const style = read('src/components/portfolio/studioCat.module.scss');

test('new whole-cat sequence cycles after the declared ground stride, independent of tick size', () => {
  assert.ok(walk.href.includes('cat-continuity-walk-v2'));
  const samples = Array.from({ length: walk.sequence.length * 2 }, (_, i) => sprite.walkSpriteFrame(walk, i * walk.stridePixels / walk.sequence.length).index);
  assert.deepEqual(samples, [...walk.sequence, ...walk.sequence]);
  const steps = [1, -1, 2, -4, 8, 16].map((part) => part / 32 * walk.stridePixels);
  const distance = steps.reduce((value, movement) => sprite.advanceSpriteDistance(value, movement), 0);
  assert.equal(distance, walk.stridePixels);
  assert.equal(sprite.walkSpriteFrame(walk, distance).index, walk.sequence[0]);
  let many = 0;
  for (let i = 0; i < 1000; i += 1) many = sprite.advanceSpriteDistance(many, walk.stridePixels / 1000);
  assert.equal(sprite.walkSpriteFrame(walk, many).index, walk.sequence[0]);
});

test('pause, reduced motion and unavailable art cannot advance complete-cat frames', () => {
  for (const options of [{ paused: true }, { ready: false }, { reduced: true }]) {
    assert.equal(sprite.advanceSpriteDistance(12, 100, options), 12);
  }
  assert.equal(sprite.advanceSpriteDistance(12, Number.NaN), 12);
  assert.equal(sprite.walkSpriteFrame(walk, walk.stridePixels / 4).index, walk.sequence[Math.floor(walk.sequence.length / 4)]);
});

test('16 complete action frames map to real art; instruments alternate only with supplied beats', () => {
  for (const [name, indices] of Object.entries(actions.states)) assert.deepEqual(sprite.CAT_ACTIONS[name], indices);
  for (const instrument of ['guitar', 'drum', 'keyboard', 'shakers']) {
    assert.deepEqual([0, 1, 2, 3].map((beat) => sprite.actionSpriteIndex({ pose: 'listen', instrument, beat })), [...actions.states[instrument], ...actions.states[instrument]]);
    assert.equal(sprite.actionSpriteIndex({ pose: 'listen', instrument, beat: 9, reduced: true }), 0);
  }
  assert.equal(sprite.actionSpriteIndex({ blink: true }), 1);
  assert.equal(sprite.actionSpriteIndex({ pose: 'sleep', reduced: true }), 6);
});

test('frame image offsets and that frame’s own alpha hit contour are committed together', () => {
  const image = { values: {}, setAttribute(k, v) { this.values[k] = v; } };
  const hit = { values: {}, setAttribute(k, v) { this.values[k] = v; } };
  for (const manifest of [walk, actions, transitions]) {
    for (let i = 0; i < manifest.frameCount; i += 1) {
      const frame = sprite.spriteFrame(manifest, i);
      sprite.paintCatSprite(image, hit, frame);
      assert.equal(Number(image.values.x), i === 0 ? 0 : -i * 384);
      assert.equal(hit.values.d, manifest.frames[i].hitArea);
    }
    assert.equal(new Set(manifest.frames.map((frame) => frame.hitArea)).size, manifest.frameCount);
  }
});

test('both actual atlases contain complete transparent frames and preserved white markings', async () => {
  for (const manifest of [walk, actions, transitions]) {
    assert.equal(manifest.kind, 'whole-generated-sprite');
    const atlas = sharp(path.join(root, 'public', manifest.href));
    const metadata = await atlas.metadata();
    assert.equal(metadata.width, manifest.frameCount * manifest.cellSize);
    assert.equal(metadata.height, manifest.cellSize);
    assert.equal(metadata.hasAlpha, true);
    for (const frame of manifest.frames) {
      const rgba = await atlas.clone().extract({ left: frame.index * 384, top: 0, width: 384, height: 384 }).ensureAlpha().raw().toBuffer();
      let transparent = 0; let opaque = 0; let white = 0;
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] === 0) transparent += 1;
        if (rgba[i + 3] === 255) opaque += 1;
        if (rgba[i + 3] > 240 && Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) > 215) white += 1;
      }
      assert.ok(transparent > 384 * 384 * .45);
      assert.ok(opaque > 7000);
      assert.ok(white > 500);
      assert.equal(frame.top + frame.height, manifest.baseline);
      assert.ok(frame.hitArea.startsWith('M') && frame.hitArea.includes('Z'));
    }
  }
});

test('loader verifies actual dimensions and releases callbacks after success, error and unmount', () => {
  for (const outcome of ['ready', 'error', 'wrong-size', 'unmount']) {
    const image = { naturalWidth: walk.frameCount * 384, naturalHeight: 384 };
    const states = [];
    const cancel = sprite.loadCatSprite(walk, (state) => states.push(state), () => image);
    assert.equal(image.src, walk.href);
    const pending = image.onload;
    if (outcome === 'unmount') { cancel(); pending(); assert.deepEqual(states, ['loading']); }
    else if (outcome === 'error') { image.onerror(); assert.deepEqual(states, ['loading', 'error']); }
    else { if (outcome === 'wrong-size') image.naturalWidth = 1; image.onload(); assert.equal(states.at(-1), outcome === 'ready' ? 'ready' : 'error'); }
    assert.equal(image.onload, null);
    assert.equal(image.onerror, null);
    cancel();
  }
});

// Execute the actual React effect body with a deterministic clock and DOM-like
// targets. This checks current integration, not just a separate math helper.
function harness({ reduced = false, imagesReady = true } = {}) {
  let now = 100;
  let nextId = 0;
  const raf = new Map(); const intervals = new Map();
  const windowEvents = new Map(); const documentEvents = new Map();
  const fakeImages = []; const dispatched = [];
  const element = () => ({ dataset: {}, attributes: {}, values: {}, setAttribute(k, v) { this.attributes[k] = v; }, style: { setProperty(k, v) { this[k] = v; } } });
  const image = element(); const hit = element(); const actor = element(); const rootElement = element();
  Object.assign(actor, { offsetWidth: 142, offsetHeight: 158, offsetTop: 10, getBoundingClientRect: () => ({ left: parseFloat(actor.style['--cat-x']), top: 0 }) });
  Object.assign(rootElement, { contains: () => false, getBoundingClientRect: () => ({ top: 0 }), querySelector: (selector) => selector === '[data-cat-image]' ? image : selector === '[data-cat-hit]' ? hit : null });
  rootElement.dataset.pose = 'sit';
  const reducedQuery = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const document = { hidden: false, documentElement: { dataset: {} }, body: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener: (k, cb) => documentEvents.set(k, cb), removeEventListener: (k) => documentEvents.delete(k) };
  const window = { innerWidth: 1000, innerHeight: 800, matchMedia: (query) => query.includes('reduced') ? reducedQuery : { matches: false }, addEventListener: (k, cb) => windowEvents.set(k, cb), removeEventListener: (k) => windowEvents.delete(k), setInterval: (cb) => { intervals.set(++nextId, cb); return nextId; }, dispatchEvent: (event) => dispatched.push(event) };
  const api = { current: null };
  const bindings = {
    rootRef: { current: rootElement }, actorRef: { current: actor }, apiRef: api,
    window, document, performance: { now: () => now },
    requestAnimationFrame: (callback) => { raf.set(++nextId, callback); return nextId; }, cancelAnimationFrame: (id) => raf.delete(id), clearInterval: (id) => intervals.delete(id),
    MutationObserver: class { observe() {} disconnect() {} }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    setAnnouncement() {}, setControlsOpen() {}, setResting() {},
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    INSTRUMENTS: ['drum', 'guitar', 'keyboard', 'shakers'].map((id) => ({ id, label: id })), POSE_LABELS: {},
    catWalkAssets: walk, catActionAssets: actions, catTransitionAssets: transitions, ...sprite,
    loadCatSprite: (manifest, onState) => sprite.loadCatSprite(manifest, onState, () => { const img = { naturalWidth: manifest.frameCount * 384, naturalHeight: 384 }; fakeImages.push(img); return img; }),
  };
  const start = source.indexOf('  useEffect(() => {') + '  useEffect(() => {'.length;
  const body = source.slice(start, source.indexOf('  }, []);', start));
  const cleanup = new Function(...Object.keys(bindings), body)(...Object.values(bindings));
  if (imagesReady) fakeImages.forEach((img) => img.onload());
  return {
    root: rootElement, image, hit, actor, api, document, reducedQuery, fakeImages, raf, intervals, windowEvents, documentEvents, dispatched, cleanup,
    tick(count = 1) { for (let i = 0; i < count; i += 1) { now += 32; const callbacks = [...raf.values()]; raf.clear(); callbacks.forEach((cb) => cb(now)); } },
    rhythm(detail) { windowEvents.get('portfolio:piano-rhythm')({ detail }); },
  };
}

test('actual effect rises before moving, advances whole frames with distance, and confirms a new direction before turning', () => {
  const h = harness();
  const initial = parseFloat(h.actor.style['--cat-x']);
  h.api.current.move(-1); h.tick(4);
  assert.equal(h.root.dataset.motion, 'rise');
  assert.equal(parseFloat(h.actor.style['--cat-x']), initial);
  h.tick(35);
  assert.equal(h.root.dataset.pose, 'walk');
  assert.equal(h.root.dataset.direction, 'left');
  assert.equal(h.root.dataset.spriteKind, 'walk');
  assert.ok(initial - parseFloat(h.actor.style['--cat-x']) > 20);
  assert.equal(h.hit.attributes.d, walk.frames[Number(h.root.dataset.spriteFrame)].hitArea);
  h.api.current.move(1); h.tick(2);
  assert.equal(h.root.dataset.direction, 'left');
  h.tick(35);
  assert.equal(h.root.dataset.direction, 'right');
  h.cleanup();
});

test('hover freezes the same frame and hit area for a first-click chat handoff', () => {
  const h = harness(); h.api.current.move(-1); h.tick(35);
  h.api.current.hover(true);
  const before = [h.actor.style['--cat-x'], h.root.dataset.spriteFrame, h.hit.attributes.d];
  h.tick(80);
  assert.deepEqual([h.actor.style['--cat-x'], h.root.dataset.spriteFrame, h.hit.attributes.d], before);
  h.api.current.requestChat();
  assert.equal(h.dispatched.at(-1).type, 'portfolio:cat-chat-open');
  assert.equal(h.hit.attributes.d, before[2]);
  h.api.current.hover(false); h.tick(40);
  assert.equal(h.root.dataset.motion, 'sit');
  h.cleanup();
});

test('static hover queues greeting, petting and waking without replacing the image or first-click alpha target', () => {
  const h = harness();
  const painted = () => [h.image.attributes.href, h.image.attributes.x, h.root.dataset.spriteFrame, h.hit.attributes.d];
  const initial = painted();
  h.api.current.hover(true); h.api.current.surprise(); h.tick(8);
  assert.deepEqual(painted(), initial);
  h.api.current.hover(false);
  assert.equal(h.root.dataset.spriteFrame, '7');
  h.tick(24);
  assert.equal(h.root.dataset.spriteFrame, '0');
  h.api.current.hover(true);
  h.api.current.pet({ clientY: 20, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 148 }) } });
  h.tick(10);
  assert.deepEqual(painted(), initial);
  h.api.current.hover(false);
  assert.equal(h.root.dataset.spriteFrame, '2');
  h.api.current.pose('sleep', Infinity);
  const sleeping = painted();
  h.api.current.hover(true); h.api.current.surprise(); h.tick(8);
  assert.deepEqual(painted(), sleeping);
  h.api.current.hover(false);
  assert.equal(h.root.dataset.spriteFrame, '3');
  h.tick(50);
  h.api.current.hover(true); h.api.current.surprise();
  h.api.current.requestChat();
  assert.equal(h.dispatched.at(-1).type, 'portfolio:cat-chat-open');
  h.api.current.hover(false);
  assert.equal(h.root.dataset.spriteFrame, '0');
  h.cleanup();
});

test('explicit sleep and stretch release the hover click lock and complete locomotion instead of being swallowed', () => {
  for (const action of ['sleep', 'stretch']) {
    const h = harness(); h.api.current.move(-1); h.tick(35);
    h.api.current.hover(true); h.tick(5);
    assert.equal(h.root.dataset.motion, 'walk');
    if (action === 'sleep') h.api.current.rest(true);
    else h.api.current.pose('stretch', 2100);
    h.tick(40);
    assert.equal(h.root.dataset.motion, 'sit');
    assert.equal(h.root.dataset.spriteKind, 'action');
    assert.equal(h.root.dataset.spriteFrame, action === 'sleep' ? '6' : '5');
    assert.equal(h.hit.attributes.d, actions.frames[action === 'sleep' ? 6 : 5].hitArea);
    if (action === 'sleep') assert.equal(h.raf.size, 0);
    h.cleanup();
  }
});

test('a music beat cannot replace a hovered whole-frame click target before leave', () => {
  const h = harness(); h.api.current.instrument('drum');
  h.rhythm({ active: true, source: 'preset', kind: 'beat', beat: 0 });
  h.api.current.hover(true);
  const before = [h.root.dataset.spriteFrame, h.hit.attributes.d];
  h.rhythm({ active: true, source: 'preset', kind: 'beat', beat: 1 }); h.tick(5);
  assert.deepEqual([h.root.dataset.spriteFrame, h.hit.attributes.d], before);
  h.api.current.hover(false);
  assert.notEqual(h.root.dataset.spriteFrame, before[0]);
  assert.equal(h.hit.attributes.d, actions.frames[Number(h.root.dataset.spriteFrame)].hitArea);
  h.cleanup();
});

test('actual music beats alternate four complete instrument poses; stop returns to sit', () => {
  const h = harness();
  for (const instrument of ['guitar', 'drum', 'keyboard', 'shakers']) {
    h.api.current.instrument(instrument);
    h.rhythm({ active: true, source: 'preset', kind: 'beat', beat: 0 });
    const a = Number(h.root.dataset.spriteFrame);
    h.rhythm({ active: true, source: 'preset', kind: 'beat', beat: 1 });
    const b = Number(h.root.dataset.spriteFrame);
    assert.ok(actions.states[instrument].includes(a));
    assert.ok(actions.states[instrument].includes(b));
    assert.notEqual(a, b);
    h.rhythm({ active: false });
    assert.equal(h.root.dataset.spriteFrame, '0');
  }
  h.cleanup();
});

test('hidden page stops movement; reduced motion stays on a whole static cat even during music', () => {
  const h = harness(); h.api.current.move(-1); h.tick(5);
  h.document.hidden = true; h.documentEvents.get('visibilitychange')();
  const x = h.actor.style['--cat-x']; h.tick(20);
  assert.equal(h.actor.style['--cat-x'], x); assert.equal(h.raf.size, 0); h.cleanup();
  const r = harness({ reduced: true }); r.api.current.move(-1);
  assert.equal(r.root.dataset.spriteKind, 'action'); assert.equal(r.root.dataset.spriteFrame, '0');
  r.rhythm({ active: true, beat: 1 }); assert.equal(r.root.dataset.spriteFrame, '0');
  assert.equal(r.raf.size, 0); r.cleanup();
});

test('loading failure stops travel, retains whole-cat fallback or a usable chat entry, and cleans pending images', () => {
  const h = harness({ imagesReady: false });
  const x = h.actor.style['--cat-x']; h.api.current.move(-1); h.tick(5);
  assert.equal(h.actor.style['--cat-x'], x);
  h.fakeImages[0].onerror(); h.fakeImages[1].onload();
  assert.equal(h.root.dataset.catAsset, 'ready'); assert.equal(h.root.dataset.spriteKind, 'action');
  h.api.current.move(-1); h.tick(5); assert.equal(h.actor.style['--cat-x'], x); h.cleanup();
  const failed = harness({ imagesReady: false }); failed.fakeImages.forEach((img) => img.onerror());
  assert.equal(failed.root.dataset.catAsset, 'error');
  failed.api.current.requestChat(); assert.equal(failed.dispatched.at(-1).type, 'portfolio:cat-chat-open'); failed.cleanup();
  const pending = harness({ imagesReady: false }); const late = pending.fakeImages.map((img) => img.onload); pending.cleanup(); late.forEach((callback) => callback());
  assert.equal(pending.raf.size, 0); assert.equal(pending.intervals.size, 0);
  assert.equal(pending.windowEvents.size, 0); assert.equal(pending.documentEvents.size, 0);
  assert.equal(pending.api.current, null);
});

test('current runtime has no vector cat/parts/IK, transparent clicks and visible failure controls', () => {
  assert.ok(!/CatRig|CAT_RIG|catWalkRig|rig-part|WalkingLeg|CatHead|CatTorso|CatDrawing/.test(source));
  assert.ok(!/\.armLeft|\.armRight|\.head\s*\{|\.torso|\.rig/.test(style));
  assert.match(source, /data-cat-sprite="whole-generated-cat"/);
  assert.match(source, /onClick=\{openChat\}/);
  assert.match(source, /className=\{styles.catFallback\}/);
  assert.match(style, /\.spriteImage\s*\{[^}]*pointer-events:\s*none;[^}]*opacity:\s*1;[^}]*filter:\s*none;/);
  assert.match(style, /\.spriteHit\s*\{[^}]*pointer-events:\s*fill;/);
  assert.match(style, /data-cat-asset='error'/);
  assert.match(style, /\.catFallback\s*\{[^}]*pointer-events:\s*auto;/);
  assert.ok(!/filter:\s*blur/.test(style));
  assert.ok(!source.includes('now - model.previousFrame < 32'));
  assert.ok(source.includes('advanceCatMotion('));
});

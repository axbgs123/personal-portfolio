import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCatMotion, catClipSample, catMotionSample, createCatMotion } from '../src/lib/catSprite.mjs';

// Controller fixture only. Actual new image quality is independently reviewed;
// these tests do not make any claim about the old eight-frame artwork.
const transitions = {
  frameCount: 12, cellSize: 384, href: '/test-transitions.webp',
  frames: Array.from({ length: 12 }, (_, i) => ({ hitArea: `M${i} 0H20V20Z` })),
  clips: {
    rise: { frames: [0, 1, 2, 3, 4], frameMs: 70 },
    stand: { frames: [4], frameMs: 70 },
    settle: { frames: [4, 3, 2, 1, 0], frameMs: 70 },
    turn: { frames: [4, 5, 6, 7, 8, 9], frameMs: 65 },
    stop: { frames: [10, 11, 4], frameMs: 65 },
  },
};
const walking = { ...transitions, href: '/test-walk.webp', sequence: Array.from({ length: 12 }, (_, i) => i), stridePixels: 48 };
const step = (state, input, dt = 1 / 60) => advanceCatMotion(state, input, dt, transitions);
function run(seconds, input = { target: 1000 }, state = createCatMotion(0), hz = 60) {
  const samples = [];
  for (let i = 0; i < Math.round(seconds * hz); i += 1) { state = step(state, input, 1 / hz); samples.push(state); }
  return { state, samples };
}

test('whole-cat clips play every authored frame and expose a real completion boundary', () => {
  for (const [name, clip] of Object.entries(transitions.clips)) {
    assert.deepEqual(clip.frames.map((_, i) => catClipSample(transitions, name, i * clip.frameMs).index), clip.frames);
    assert.equal(catClipSample(transitions, name, clip.frames.length * clip.frameMs - 1).done, false);
    assert.equal(catClipSample(transitions, name, clip.frames.length * clip.frameMs).done, true);
  }
});

test('starting from sit completes rise before any world travel or walk frame progression', () => {
  const { samples } = run(.8);
  const rise = samples.filter((s) => s.mode === 'rise');
  assert.ok(rise.length >= 20);
  assert.ok(rise.every((s) => s.x === 0 && s.distance === 0 && s.velocity === 0));
  assert.deepEqual([...new Set(rise.map((s) => catMotionSample(s, walking, transitions).frame.index))], [0,1,2,3,4]);
  assert.ok(samples.some((s) => s.mode === 'stand'));
  assert.ok(samples.at(-1).x > 5);
});

test('world travel accelerates over multiple RAFs and walk distance exactly matches actual displacement', () => {
  const { samples } = run(1.5);
  const moving = samples.filter((s) => s.mode === 'walk' && s.velocity > 0);
  assert.ok(moving[0].velocity < 5);
  assert.ok(moving.some((s) => s.velocity > 15 && s.velocity < 40));
  assert.equal(moving.at(-1).velocity, 48);
  assert.ok(moving.every((s) => Math.abs(s.x - s.distance) < 1e-8));
  for (let i = 1; i < moving.length; i += 1) assert.ok(Math.abs(moving[i].velocity - moving[i - 1].velocity) <= 4.00001);
});

test('arrival brakes then plays complete stop, stand and settle clips without resetting to sit mid-step', () => {
  const { samples } = run(3, { target: 25 });
  const modes = samples.map((s) => s.mode).filter((v, i, all) => i === 0 || v !== all[i - 1]);
  assert.deepEqual(modes, ['rise', 'stand', 'walk', 'stop', 'stand', 'settle', 'sit']);
  const stop = samples.filter((s) => s.mode === 'stop');
  assert.deepEqual([...new Set(stop.map((s) => catMotionSample(s, walking, transitions).frame.index))], [10,11,4]);
  assert.ok(stop.every((s) => s.velocity === 0 && Math.abs(s.x - stop[0].x) < 1e-8));
  assert.ok(Math.abs(samples.at(-1).x - 25) < 3);
});

test('brief opposite targets brake but cannot immediately mirror or turn', () => {
  const moving = run(1).state;
  const { samples } = run(.08, { target: -100 }, moving);
  assert.ok(samples.every((s) => s.direction === 1 && s.renderDirection === 1 && s.mode !== 'turn'));
  assert.ok(samples.at(-1).velocity < moving.velocity);
  const resumed = run(.4, { target: 1000 }, samples.at(-1));
  assert.ok(resumed.samples.every((s) => s.direction === 1));
});

test('sustained reversal stops, turns with whole frames, and changes facing only after the turn completes', () => {
  const moving = run(1).state;
  const { samples } = run(1.5, { target: -100 }, moving);
  const turn = samples.filter((s) => s.mode === 'turn');
  assert.ok(turn.length > 10);
  assert.ok(turn.every((s) => s.direction === 1 && s.renderDirection === 1 && s.velocity === 0));
  assert.deepEqual([...new Set(turn.map((s) => catMotionSample(s, walking, transitions).frame.index))], [4,5,6,7,8,9]);
  assert.equal(samples.at(-1).direction, -1);
  assert.ok(samples.some((s) => s.direction === -1 && s.mode === 'walk'));
  assert.ok(samples.at(-1).x < turn.at(-1).x);
});

test('left-to-right reversal mirrors the complete turn clip without altering individual frames', () => {
  const left = run(1, { target: -1000 }, createCatMotion(0, -1)).state;
  const turn = run(1.2, { target: 1000 }, left).samples.filter((s) => s.mode === 'turn');
  assert.ok(turn.length > 0);
  assert.ok(turn.every((s) => catMotionSample(s, walking, transitions).direction === -1));
});

test('a frontal turn midpoint supports whole-frame mirroring and finishes on the exact future stand silhouette', () => {
  const manifest = { ...transitions, clips: { ...transitions.clips, turn: { frames: [4,5,7,{ frame: 5, mirror: true },{ frame: 4, mirror: true }], frameMs: 65 } } };
  for (const direction of [1, -1]) {
    const state = { ...createCatMotion(10, direction), mode: 'turn' };
    const samples = [0,65,130,195,260].map((clipElapsed) => catMotionSample({ ...state, clipElapsed }, walking, manifest));
    assert.deepEqual(samples.map((s) => s.direction), [direction,direction,direction,-direction,-direction]);
    assert.deepEqual(samples.map((s) => s.frame.index), [4,5,7,5,4]);
    const finished = advanceCatMotion({ ...state, clipElapsed: 310 }, { target: -100 }, .03, manifest);
    const stand = catMotionSample(finished, walking, manifest);
    assert.equal(stand.frame.index, samples.at(-1).frame.index);
    assert.equal(stand.direction, samples.at(-1).direction);
    assert.equal(stand.frame.hitArea, samples.at(-1).frame.hitArea);
  }
});

test('hover and hidden states hold the exact same full frame, clip time, position and hit mask', () => {
  for (const initial of [run(.2).state, run(1).state]) {
    for (const input of [{ target: 100, freeze: true }, { target: 100, paused: true }]) {
      const before = catMotionSample(initial, walking, transitions);
      const after = run(2, input, initial).state;
      assert.equal(after.x, initial.x); assert.equal(after.clipElapsed, initial.clipElapsed); assert.equal(after.distance, initial.distance);
      assert.deepEqual(catMotionSample(after, walking, transitions), before);
      assert.equal(after.velocity, 0);
    }
  }
});

test('reduced motion cancels transition playback and remains on the static action renderer', () => {
  for (const state of [run(.2).state, run(1).state]) {
    const next = step(state, { target: 500, reduced: true });
    assert.equal(next.mode, 'sit'); assert.equal(next.velocity, 0); assert.equal(next.x, state.x);
    assert.equal(catMotionSample(next, walking, transitions), null);
  }
});

test('30/60/120Hz trajectories remain close and mobile scaling preserves stride proportion', () => {
  const positions = [30, 60, 120].map((hz) => run(2, { target: 1000 }, createCatMotion(0), hz).state.x);
  assert.ok(Math.max(...positions) - Math.min(...positions) < 3, positions.join(','));
  const desktop = run(2).state;
  const mobile = run(2, { target: 1000, scale: 140 / 164 }).state;
  assert.ok(Math.abs(mobile.x / desktop.x - 140 / 164) < .0001);
  assert.ok(Math.abs(mobile.distance - desktop.distance) < .0001);
});

test('screen bounds cannot produce imaginary travel or run the walk cycle in place', () => {
  const moving = run(1).state;
  const maxX = moving.x + 1;
  const next = step(moving, { target: 1000, minX: 0, maxX });
  assert.ok(next.x <= maxX);
  assert.ok(Math.abs(next.distance - moving.distance - (next.x - moving.x)) < 1e-8);
});

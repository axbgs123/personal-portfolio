import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld, grabBody, moveGrab, releaseGrab, nudgeBody, settleWorld, hitTest, isWorldAtRest } from '../src/lib/typePlayPhysics.mjs';

const glyphs = Array.from('把想法放出来', (text, id) => ({ id, text, width: 250, height: 250, fontSize: 224, ascent: 200, descent: 24, drawX: -112, drawY: 88, fontFamily: 'test-font' }));
const kick = (world, id, vx, vy) => {
  nudgeBody(world, id, 0, 0);
  const body = world.bodies.find((item) => item.id === id);
  body.vx = vx; body.vy = vy;
};
const advance = (world, seconds, options) => {
  for (let frame = 0; frame < Math.ceil(seconds * 60); frame += 1) stepWorld(world, 1 / 60, options);
  return world;
};
const assertSafe = (world) => {
  for (const body of world.bodies) {
    for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'angularVelocity', 'width', 'height', 'radius']) assert.ok(Number.isFinite(body[key]), `${body.id} ${key} finite`);
    const c = Math.abs(Math.cos(body.angle)), s = Math.abs(Math.sin(body.angle));
    const ex = (c * body.width + s * body.height) / 2, ey = (s * body.width + c * body.height) / 2;
    assert.ok(body.x - ex >= world.bounds.left - 1e-6, 'whole rotated glyph inside left');
    assert.ok(body.x + ex <= world.bounds.right + 1e-6, 'whole rotated glyph inside right');
    assert.ok(body.y - ey >= world.bounds.top - 1e-6, 'whole rotated glyph inside top');
    assert.ok(body.y + ey <= world.bounds.bottom + 1e-6, 'whole rotated glyph inside bottom');
    assert.ok(Math.hypot(body.vx, body.vy) <= 1200.001, 'bounded speed');
    assert.ok(Math.abs(body.angularVelocity) <= 3.201, 'bounded spin');
  }
};

test('six complete Chinese glyphs start centered in two rows, preserving metrics, IDs and caption clearance', () => {
  const world = createWorld({ glyphs });
  assert.equal(world.bodies.length, 6);
  assert.deepEqual(world.bodies.map((body) => body.text), Array.from('把想法放出来'));
  assert.equal(new Set(world.bodies.map((body) => body.y)).size, 2);
  assert.equal(world.bounds.top, 84); assert.equal(world.bounds.bottom, 1020);
  assert.equal(world.bodies[0].fontFamily, 'test-font');
  assert.equal(world.bodies[0].fontSize, 224);
  assert.equal(world.bodies[0].drawX, -112); assert.equal(world.bodies[0].drawY, 88);
  assert.equal(world.bodies[0].width, 250); assert.equal(world.bodies[0].height, 250);
  assert.ok(Math.max(...world.bodies.map((b) => b.x + b.width / 2)) - Math.min(...world.bodies.map((b) => b.x - b.width / 2)) >= 750);
  assertSafe(world);
});

test('default floating world stays exactly still, including its time, until an explicit interaction', () => {
  const world = createWorld({ glyphs });
  const before = JSON.stringify(world);
  advance(world, 5);
  assert.equal(JSON.stringify(world), before);
  assert.equal(isWorldAtRest(world), true);
});

test('seed-free initialization and equal inputs produce exactly equal trajectories', () => {
  const a = createWorld({ glyphs }), b = createWorld({ glyphs });
  for (const world of [a, b]) { kick(world, 1, 600, -220); advance(world, 3); }
  assert.deepEqual(a, b);
});

test('off-center pointer grab does not snap the body center to the pointer', () => {
  const world = createWorld({ glyphs });
  const body = world.bodies[0], initial = { x: body.x, y: body.y, angle: body.angle };
  assert.equal(grabBody(world, body.id, body.x + 65, body.y - 50), true);
  advance(world, 0.5);
  assert.ok(Math.abs(body.x - initial.x) < 0.001);
  assert.ok(Math.abs(body.y - initial.y) < 0.001);
  assert.ok(Math.abs(body.angle - initial.angle) < 0.001);
  assert.equal(isWorldAtRest(world), false);
  releaseGrab(world);
});

test('drag follows smoothly, neighbor springs transmit movement, and release has capped inertia', () => {
  const world = createWorld({ glyphs });
  const body = world.bodies[0], neighbor = world.bodies[1];
  const start = { x: body.x, y: body.y, nx: neighbor.x, ny: neighbor.y };
  grabBody(world, body.id, body.x, body.y);
  moveGrab(world, body.x - 150, body.y - 220);
  stepWorld(world, 1 / 60);
  assert.ok(Math.hypot(body.x - start.x, body.y - start.y) < 80, 'no teleport to target');
  advance(world, 1);
  assert.ok(body.y < start.y - 80, 'grab follows target');
  assert.ok(Math.hypot(neighbor.x - start.nx, neighbor.y - start.ny) > 8, 'neighbor actually follows');
  moveGrab(world, world.width * 5, -world.height * 5);
  releaseGrab(world);
  assert.equal(world.grab, null);
  assert.ok(Math.hypot(body.vx, body.vy) <= 880.001);
  advance(world, 2);
  assertSafe(world);
});

test('disabling links removes neighbor attraction rather than restoring a prescribed pose', () => {
  const pair = [{ text: 'A', width: 100, height: 100 }, { text: 'B', width: 100, height: 100 }];
  const world = createWorld({ glyphs: pair });
  const first = world.bodies[0], second = world.bodies[1];
  const startX = second.x;
  kick(world, first.id, -500, 0);
  advance(world, 2, { linked: false });
  assert.equal(second.x, startX);
  assert.ok(first.x < 400);
  advance(world, 8, { linked: false });
  assert.ok(first.x < 400, 'no original-position spring');
  assert.equal(isWorldAtRest(world), true);
});

test('colliding circles separate and preserve finite, dissipative velocity', () => {
  const world = createWorld({ glyphs: [{ text: 'A', width: 130, height: 130 }, { text: 'B', width: 130, height: 130 }] });
  const [a, b] = world.bodies;
  a.x = 410; b.x = 590; a.y = b.y = 550;
  kick(world, a.id, 800, 0); kick(world, b.id, -800, 0);
  for (let index = 0; index < 180; index += 1) {
    stepWorld(world, 1 / 60, { linked: false });
    assertSafe(world);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius - 0.1, 'circles do not pass through');
  }
});

test('coincident circle/capsule axes resolve without zero division or random normals', () => {
  for (const dimensions of [[120, 120], [300, 80], [80, 300]]) {
    const world = createWorld({ glyphs: [0, 1].map((id) => ({ id, text: '字', width: dimensions[0], height: dimensions[1] })) });
    for (const body of world.bodies) { body.x = 500; body.y = 550; body.angle = 0; }
    nudgeBody(world, 0, 0, 1);
    advance(world, 1, { linked: false });
    assertSafe(world);
    assert.ok(Math.hypot(world.bodies[0].x - world.bodies[1].x, world.bodies[0].y - world.bodies[1].y) >= Math.min(...dimensions) - 1);
  }
});

test('repeated high-speed reversed drags, rotation and optional gravity stay inside all boundaries', () => {
  const world = createWorld({ glyphs: Array.from({ length: 18 }, (_, id) => ({ id, text: '字', width: id % 3 ? 125 : 190, height: 155 })) });
  for (let frame = 0; frame < 900; frame += 1) {
    if (frame % 45 === 0) {
      const body = world.bodies[(frame / 45) % 18];
      grabBody(world, body.id, body.x + 20, body.y - 30);
      moveGrab(world, frame % 90 ? -1000 : 2000, frame % 135 ? -1100 : 2200);
    }
    if (frame % 45 === 18) releaseGrab(world);
    stepWorld(world, frame === 300 ? 90 : 1 / 60, { linked: true, gravity: frame > 450 });
    assertSafe(world);
  }
});

test('gravity is opt-in, wakes a resting world, and respects the bottom caption safe area', () => {
  const world = createWorld({ glyphs: [glyphs[0]] });
  const startY = world.bodies[0].y;
  advance(world, 3, { gravity: true });
  assert.ok(world.bodies[0].y > startY + 100);
  assertSafe(world);
  advance(world, 8, { gravity: true });
  assert.equal(isWorldAtRest(world), true);
});

test('large or invalid elapsed times are bounded and cannot poison the state', () => {
  const world = createWorld({ glyphs });
  kick(world, 0, 1000, -1000);
  stepWorld(world, 10000);
  assert.ok(world.time <= 0.0500001);
  for (const dt of [NaN, Infinity, -10, undefined]) stepWorld(world, dt);
  assertSafe(world);
});

test('settle/freeze keeps precisely the same composition, releases grabs and disables continued motion', () => {
  const world = createWorld({ glyphs });
  grabBody(world, 0, world.bodies[0].x, world.bodies[0].y);
  moveGrab(world, 100, 220); advance(world, 0.3);
  const pose = world.bodies.map(({ x, y, angle }) => ({ x, y, angle }));
  settleWorld(world);
  assert.deepEqual(world.bodies.map(({ x, y, angle }) => ({ x, y, angle })), pose);
  assert.equal(world.grab, null); assert.equal(isWorldAtRest(world), true);
  advance(world, 5);
  assert.deepEqual(world.bodies.map(({ x, y, angle }) => ({ x, y, angle })), pose);
  nudgeBody(world, 0, 120, 0);
  assert.equal(isWorldAtRest(world), false);
});

test('whole rotated glyph ink box remains hittable, with deterministic topmost precedence', () => {
  const world = createWorld({ glyphs });
  const body = world.bodies[0];
  body.angle = Math.PI / 4;
  assert.equal(hitTest(world, body.x + 90 * Math.cos(body.angle), body.y + 90 * Math.sin(body.angle)), body.id);
  assert.equal(hitTest(world, -100, -100), null);
  assert.equal(hitTest(world, NaN, 0), null);
  const last = world.bodies.at(-1); last.x = body.x; last.y = body.y;
  assert.equal(hitTest(world, body.x, body.y), last.id);
});

test('keyboard nudges move the same whole body by 14 / 45 units, with collision and wall protection', () => {
  const world = createWorld({ glyphs: [glyphs[0]] });
  const body = world.bodies[0], startX = body.x;
  nudgeBody(world, body.id, 14, 0);
  assert.equal(body.x, startX + 14);
  nudgeBody(world, body.id, 45, 0);
  assert.equal(body.x, startX + 59);
  assert.equal(isWorldAtRest(world), false);
  for (let press = 0; press < 30; press += 1) nudgeBody(world, body.id, 45, -45);
  assertSafe(world);
  const pair = createWorld({ glyphs: [glyphs[0], { ...glyphs[1], id: 'second' }] });
  for (let press = 0; press < 8; press += 1) nudgeBody(pair, pair.bodies[0].id, 45, 0);
  assert.ok(Math.hypot(pair.bodies[0].x - pair.bodies[1].x, pair.bodies[0].y - pair.bodies[1].y) >= 249.9);
  assertSafe(pair);
});

test('an ordinary linked release eventually sleeps, and sleeping leaves the composition untouched', () => {
  const world = createWorld({ glyphs });
  const body = world.bodies[0];
  grabBody(world, body.id, body.x, body.y);
  moveGrab(world, body.x + 140, body.y - 160); advance(world, 0.5);
  releaseGrab(world); advance(world, 18);
  assert.equal(isWorldAtRest(world), true);
  const before = JSON.stringify(world);
  advance(world, 20);
  assert.equal(JSON.stringify(world), before);
});

test('18-glyph cap, empty input and oversized metrics remain safe and scaling preserves renderer alignment', () => {
  const world = createWorld({ width: 200, height: 240, glyphs: Array.from({ length: 24 }, (_, id) => ({ ...glyphs[0], id, width: 500, height: 700 })) });
  assert.equal(world.bodies.length, 18);
  const first = world.bodies[0], factor = first.fontSize / glyphs[0].fontSize;
  assert.ok(Math.abs(first.drawX - glyphs[0].drawX * factor) < 1e-8);
  assert.ok(Math.abs(first.drawY - glyphs[0].drawY * factor) < 1e-8);
  assertSafe(world);
  const empty = createWorld(); stepWorld(empty, 1, { gravity: true });
  assert.equal(isWorldAtRest(empty), true);
  assert.equal(grabBody(empty, 0, 0, 0), false);
  assert.equal(moveGrab(empty, 10, 10), false);
  assert.equal(releaseGrab(empty), false);
  assert.equal(nudgeBody(empty, 0, 1, 1), false);
});

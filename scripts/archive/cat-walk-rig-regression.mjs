// ARCHIVED: rejected split-rig experiment, not the current cat implementation.
// Optional historical math/asset checks only; excluded from scripts/test-*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CAT_RIG, CAT_LEGS, CAT_RIG_IMAGES, catFootState, getCatRigPose } from '../../src/lib/catWalkRig.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);

test('stance paws stay at a fixed world x for both directions and viewport scales', () => {
  let checks = 0;
  for (const scale of [0.82, 0.7]) {
    for (const direction of [-1, 1]) {
      for (const leg of CAT_LEGS) {
        for (let i = 0; i < 2000; i += 1) {
          const distance = i * CAT_RIG.stride / 1000;
          const nextDistance = distance + 0.025;
          const a = catFootState(distance, leg); const b = catFootState(nextDistance, leg);
          if (!a.stance || !b.stance || b.phase < a.phase) continue;
          const worldA = direction * distance * scale + (direction === 1 ? a.x : CAT_RIG.width - a.x) * scale;
          const worldB = direction * nextDistance * scale + (direction === 1 ? b.x : CAT_RIG.width - b.x) * scale;
          close(worldA, worldB); checks += 1;
        }
      }
    }
  }
  assert.ok(checks > 15000);
});

test('all four paws complete contact, rearward support, lift, forward swing and return', () => {
  for (const leg of CAT_LEGS) {
    const values = Array.from({ length: 1000 }, (_, i) => catFootState((leg.phase + i / 1000) * CAT_RIG.stride, leg));
    const stance = values.filter((p) => p.stance); const swing = values.filter((p) => !p.stance);
    assert.ok(stance.length >= 679 && stance.length <= 681);
    assert.ok(Math.max(...values.map((p) => p.x)) - Math.min(...values.map((p) => p.x)) > 42);
    assert.ok(stance[0].x > leg.x + 20 && stance.at(-1).x < leg.x - 20);
    assert.ok(swing.some((p) => p.lift > 8.9));
    assert.ok(swing.some((p) => p.x < leg.x) && swing.some((p) => p.x > leg.x));
    const first = catFootState(leg.phase * CAT_RIG.stride, leg);
    const end = catFootState((leg.phase + 1) * CAT_RIG.stride, leg);
    close(first.x, end.x); close(first.y, end.y);
  }
});

test('lateral four-beat sequence has staggered landings and no unsupported flight', () => {
  const sequence = [...CAT_LEGS].sort((a, b) => a.phase - b.phase).map((leg) => leg.id);
  assert.deepEqual(sequence, ['hindNear', 'foreNear', 'hindFar', 'foreFar']);
  const events = CAT_LEGS.flatMap((leg) => [leg.phase, (leg.phase + CAT_RIG.duty) % 1]);
  assert.equal(new Set(events.map((phase) => phase.toFixed(5))).size, 8);
  for (let i = 0; i < 1000; i += 1) {
    const stanceCount = getCatRigPose(i * CAT_RIG.stride / 1000).legs.filter((leg) => leg.foot.stance).length;
    assert.ok(stanceCount >= 2 && stanceCount <= 3);
  }
});

test('two-bone joints remain reachable and independent paws never penetrate the floor', () => {
  for (let i = 0; i < 1200; i += 1) {
    const pose = getCatRigPose(i * CAT_RIG.stride / 1200);
    for (const leg of pose.legs) {
      assert.ok(leg.reachable, `${leg.id} remains reachable at ${i}`);
      close(Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y), leg.upper);
      close(Math.hypot(leg.ankle.x - leg.knee.x, leg.ankle.y - leg.knee.y), leg.lower);
      if (leg.foot.stance) { close(leg.foot.y + CAT_RIG.pawSole, CAT_RIG.floor); close(leg.foot.pitch, 0); }
      const paw = CAT_RIG_IMAGES.paw; const theta = leg.foot.pitch * Math.PI / 180;
      for (const x of [paw.x, paw.x + paw.width]) {
        const bottom = leg.foot.y + x * Math.sin(theta) + (paw.y + paw.height) * Math.cos(theta);
        assert.ok(bottom <= CAT_RIG.floor + 1e-7);
      }
    }
  }
});

test('shoulder/hip motion is continuous; source silhouettes are never swapped across phases', () => {
  const figures = Array.from({ length: 1200 }, (_, i) => getCatRigPose(i * CAT_RIG.stride / 1200));
  assert.ok(Math.max(...figures.map((pose) => pose.rock)) > 1.1);
  assert.ok(Math.min(...figures.map((pose) => pose.rock)) < -1.1);
  for (let i = 1; i < figures.length; i += 1) {
    assert.ok(Math.abs(figures[i].bob - figures[i - 1].bob) < 0.02);
    assert.ok(Math.abs(figures[i].rock - figures[i - 1].rock) < 0.02);
  }
  const a = getCatRigPose(0); const b = getCatRigPose(CAT_RIG.stride);
  assert.equal(a.body, b.body); assert.equal(a.head, b.head); assert.equal(a.tail, b.tail);
  assert.equal(Object.keys(CAT_RIG_IMAGES).length, 8);
});

test('eight actual generated PNGs have alpha, no green fringe, and transparent hit masks', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/art/cat-rig-v2/manifest.json'), 'utf8'));
  assert.equal(Object.keys(manifest.assets).length, 8);
  for (const [name, asset] of Object.entries(manifest.assets)) {
    const file = path.join(root, 'public', asset.href);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0; let white = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) { transparent += 1; continue; }
      assert.ok(data[i + 1] - Math.max(data[i], data[i + 2]) <= 2);
      if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) white += 1;
    }
    assert.ok(transparent > info.width * info.height * 0.03, `${name} is not opaque rectangular art`);
    if (name === 'body') assert.equal(white, 0, 'The torso stays entirely black');
    if (['head', 'paw', 'tail'].includes(name)) assert.ok(white > 100);
    assert.ok(asset.hitPath.startsWith('M') && asset.hitPath.includes('Z'));
  }
});

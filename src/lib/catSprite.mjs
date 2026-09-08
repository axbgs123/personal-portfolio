/**
 * Complete-cat frame playback. Artwork is never separated into body parts.
 * Design reference only (frame tables + modulo cycling); no source code copied:
 * oneko.js, MIT © 2022 adryd
 * https://github.com/adryd325/oneko.js/blob/5281d057c4ea9bd4f6f997ee96ba30491aed16c0/oneko.js
 */
export const CAT_ACTIONS = Object.freeze({
  sit: [0],
  blink: [1],
  pet: [2],
  yawn: [3],
  groom: [4],
  stretch: [5],
  sleep: [6],
  greet: [7],
  surprised: [7],
  pounce: [7],
  roll: [5],
  guitar: [8, 9],
  drum: [10, 11],
  keyboard: [12, 13],
  shakers: [14, 15],
});

export function spriteFrame(manifest, index = 0) {
  const count = manifest.frameCount;
  const safeIndex = ((Math.floor(index) % count) + count) % count;
  const frame = manifest.frames[safeIndex];
  const columns = manifest.columns || count;
  return {
    index: safeIndex,
    x: -(safeIndex % columns) * manifest.cellSize,
    y: -Math.floor(safeIndex / columns) * manifest.cellSize,
    hitArea: frame.hitArea,
  };
}

export function walkSpriteFrame(manifest, distance = 0) {
  const { sequence } = manifest;
  const travel = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const slot = Math.floor((travel / manifest.stridePixels) * sequence.length + 1e-9) % sequence.length;
  return spriteFrame(manifest, sequence[slot]);
}

export function advanceSpriteDistance(distance, movement, { ready = true, paused = false, reduced = false } = {}) {
  if (!ready || paused || reduced || !Number.isFinite(movement)) return distance;
  return distance + Math.abs(movement);
}

export function actionSpriteIndex({ pose = 'sit', instrument, beat = 0, reduced = false, blink = false } = {}) {
  if (reduced) return pose === 'sleep' ? 6 : 0;
  let action = pose;
  if (pose === 'sit' && blink) action = 'blink';
  if (pose === 'listen' && instrument) action = instrument;
  const sequence = CAT_ACTIONS[action] || CAT_ACTIONS.sit;
  return sequence[Math.abs(Math.floor(beat)) % sequence.length];
}

// Injectable factory lets load/error/unmount behavior be tested without a DOM.
export function loadCatSprite(manifest, onState, createImage = () => new Image()) {
  let live = true;
  const image = createImage();
  const settle = (state) => {
    if (!live) return;
    image.onload = null;
    image.onerror = null;
    onState(state);
  };
  onState('loading');
  image.onload = () => {
    const columns = manifest.columns || manifest.frameCount;
    const rows = Math.ceil(manifest.frameCount / columns);
    settle(image.naturalWidth === columns * manifest.cellSize && image.naturalHeight === rows * manifest.cellSize ? 'ready' : 'error');
  };
  image.onerror = () => settle('error');
  image.src = manifest.href;
  return () => {
    live = false;
    image.onload = null;
    image.onerror = null;
  };
}

// Both attributes change in the same JS task, before the browser can paint or
// dispatch the next click. Each displayed frame gets its own alpha contour.
export function paintCatSprite(image, hit, frame) {
  image.setAttribute('x', String(frame.x));
  image.setAttribute('y', String(frame.y));
  hit.setAttribute('d', frame.hitArea);
}

/** Whole-cat clips: { frames: [index, ...], frameMs: 70, loop?: false }. */
export function catClipSample(manifest, name, elapsedMs = 0) {
  const clip = manifest.clips?.[name];
  if (!clip?.frames?.length) return null;
  const durations = clip.frames.map((entry) => (typeof entry === 'number' ? clip.frameMs || 70 : entry.durationMs || clip.frameMs || 70));
  const duration = durations.reduce((sum, value) => sum + value, 0);
  let local = Math.max(0, elapsedMs);
  const done = !clip.loop && local >= duration;
  if (clip.loop) local %= duration;
  let slot = 0;
  while (slot < durations.length - 1 && local >= durations[slot]) {
    local -= durations[slot];
    slot += 1;
  }
  const entry = clip.frames[slot];
  return { ...spriteFrame(manifest, typeof entry === 'number' ? entry : entry.frame), mirror: typeof entry === 'object' && Boolean(entry.mirror), done, duration, slot };
}

export function createCatMotion(x = 0, direction = 1) {
  return { x, direction, renderDirection: direction, mode: 'sit', velocity: 0, distance: 0, clipElapsed: 0, standElapsed: 0, candidate: direction, candidateMs: 0 };
}

const towards = (value, goal, amount) => value + Math.sign(goal - value) * Math.min(Math.abs(goal - value), amount);

// Small deterministic controller. It never edits artwork or interpolates limbs.
// Distance drives only the walk cycle; time drives whole-cat transition clips.
export function advanceCatMotion(current, input, deltaSeconds, transitions) {
  const state = { ...current };
  const dt = Math.min(0.05, Math.max(0, deltaSeconds || 0));
  if (input.reduced) return { ...createCatMotion(state.x, state.direction), mode: 'sit' };
  if (input.paused || input.freeze || !dt) return { ...state, velocity: 0 };
  const scale = input.scale || 1;
  const error = input.target - state.x;
  const wantsMove = input.allowed !== false && Math.abs(error) > 2 * scale;
  const wantedDirection = wantsMove ? Math.sign(error) : state.direction;
  if (wantedDirection !== state.candidate) {
    state.candidate = wantedDirection;
    state.candidateMs = 0;
  } else state.candidateMs += dt * 1000;
  const begin = (mode) => {
    state.mode = mode;
    state.clipElapsed = 0;
    state.standElapsed = 0;
    state.velocity = 0;
  };
  const has = (name) => Boolean(transitions.clips?.[name]?.frames?.length);

  if (['rise', 'settle', 'turn', 'stop'].includes(state.mode)) {
    state.clipElapsed += dt * 1000;
    const clip = catClipSample(transitions, state.mode, state.clipElapsed);
    if (!clip || clip.done) {
      if (state.mode === 'turn') {
        state.direction *= -1;
        state.renderDirection = state.direction;
        state.candidateMs = 0;
      }
      begin(state.mode === 'settle' ? 'sit' : 'stand');
    }
    return state;
  }
  if (state.mode === 'sit') {
    if (wantsMove) {
      // The first rise frame is frontal seated; the whole clip chooses its side.
      state.direction = wantedDirection;
      state.renderDirection = wantedDirection;
      state.distance = 0;
      begin(has('rise') ? 'rise' : 'stand');
    }
    return state;
  }
  if (state.mode === 'stand') {
    if (wantsMove && wantedDirection !== state.direction) {
      if (state.candidateMs >= 120) begin('turn');
    } else if (wantsMove) {
      state.mode = 'walk';
      state.distance = 0;
      state.standElapsed = 0;
    } else {
      state.standElapsed += dt * 1000;
      if (state.standElapsed >= 180) begin(has('settle') ? 'settle' : 'sit');
    }
    return state;
  }

  const maxSpeed = 48 * scale;
  const brake = 300 * scale;
  const acceleration = 240 * scale;
  const ahead = wantsMove && wantedDirection === state.direction;
  const desiredSpeed = ahead ? Math.min(maxSpeed, Math.sqrt(2 * brake * Math.max(0, Math.abs(error) - 1 * scale))) : 0;
  const nextVelocity = towards(state.velocity, desiredSpeed, dt * (desiredSpeed < state.velocity ? brake : acceleration));
  let travel = (state.velocity + nextVelocity) * 0.5 * dt;
  if (ahead) travel = Math.min(travel, Math.abs(error));
  const nextX = Math.max(input.minX ?? -Infinity, Math.min(input.maxX ?? Infinity, state.x + state.direction * travel));
  const actualTravel = Math.abs(nextX - state.x);
  state.x = nextX;
  state.distance += actualTravel / scale;
  state.velocity = nextVelocity;
  if (actualTravel + 1e-8 < travel) state.velocity = 0;
  if (state.velocity < 0.05 && !ahead) {
    begin(has('stop') ? 'stop' : 'stand');
  }
  return state;
}

export function catMotionSample(state, walking, transitions) {
  if (state.mode === 'sit') return null;
  if (state.mode === 'walk') return { manifest: walking, frame: walkSpriteFrame(walking, state.distance), direction: state.renderDirection, clip: 'walk' };
  const frame = catClipSample(transitions, state.mode === 'stand' ? 'stand' : state.mode, state.clipElapsed);
  return frame ? { manifest: transitions, frame, direction: state.renderDirection * (frame.mirror ? -1 : 1), clip: state.mode } : null;
}

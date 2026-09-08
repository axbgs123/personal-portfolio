// Deterministic, renderer-independent whole-glyph physics. No browser globals,
// random numbers, timers or dependencies; all time comes from stepWorld().
const MAX_GLYPHS = 18;
const MAX_SPEED = 1200;
const MAX_THROW_SPEED = 880;
const MAX_ANGULAR_SPEED = 3.2;
const MAX_FRAME_DT = 1 / 20;
const EPSILON = 1e-8;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
const cross = (ax, ay, bx, by) => ax * by - ay * bx;
const length = (x, y) => Math.hypot(x, y);

function capVector(x, y, maximum) {
  const magnitude = length(x, y);
  const scale = magnitude > maximum ? maximum / magnitude : 1;
  return [x * scale, y * scale];
}

function scaleGlyph(glyph, factor) {
  const result = { ...glyph };
  for (const key of ['width', 'height', 'fontSize', 'ascent', 'descent', 'drawX', 'drawY']) {
    if (Number.isFinite(result[key])) result[key] *= factor;
  }
  return result;
}

function capsule(body) {
  const angle = body.angle + (body.height > body.width ? Math.PI / 2 : 0);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const half = (Math.max(body.width, body.height) - Math.min(body.width, body.height)) / 2;
  return {
    x1: body.x - ux * half,
    y1: body.y - uy * half,
    x2: body.x + ux * half,
    y2: body.y + uy * half,
    ux,
    uy,
    half,
    radius: body.radius,
  };
}

// Closest points on two finite line segments, including point / circle cases.
function segmentPoints(a, b) {
  const dx = a.x2 - a.x1;
  const dy = a.y2 - a.y1;
  const ex = b.x2 - b.x1;
  const ey = b.y2 - b.y1;
  const rx = a.x1 - b.x1;
  const ry = a.y1 - b.y1;
  const aa = dx * dx + dy * dy;
  const ee = ex * ex + ey * ey;
  const ff = ex * rx + ey * ry;
  let s = 0;
  let t = 0;
  if (aa <= EPSILON && ee <= EPSILON) return { ax: a.x1, ay: a.y1, bx: b.x1, by: b.y1 };
  if (aa <= EPSILON) t = clamp(ff / ee, 0, 1);
  else {
    const cc = dx * rx + dy * ry;
    if (ee <= EPSILON) s = clamp(-cc / aa, 0, 1);
    else {
      const bb = dx * ex + dy * ey;
      const denominator = aa * ee - bb * bb;
      if (Math.abs(denominator) > EPSILON) s = clamp((bb * ff - cc * ee) / denominator, 0, 1);
      t = (bb * s + ff) / ee;
      if (t < 0) {
        t = 0;
        s = clamp(-cc / aa, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((bb - cc) / aa, 0, 1);
      }
    }
  }
  return { ax: a.x1 + dx * s, ay: a.y1 + dy * s, bx: b.x1 + ex * t, by: b.y1 + ey * t };
}

function contactBetween(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const reach = (Math.max(a.width, a.height) + Math.max(b.width, b.height)) / 2;
  if (dx * dx + dy * dy > reach * reach) return null;
  const ca = capsule(a);
  const cb = capsule(b);
  const points = segmentPoints(ca, cb);
  const px = points.bx - points.ax;
  const py = points.by - points.ay;
  const distance = length(px, py);
  if (distance >= a.radius + b.radius) return null;
  let nx;
  let ny;
  let penetration;
  if (distance > EPSILON) {
    nx = px / distance;
    ny = py / distance;
    penetration = a.radius + b.radius - distance;
  } else {
    // Intersecting/parallel capsule axes have no closest-point normal. Pick the
    // shortest separating direction, rather than dividing by zero or using RNG.
    const axes = [
      [-ca.uy, ca.ux],
      [-cb.uy, cb.ux],
    ];
    if (length(dx, dy) > EPSILON) axes.push([dx / length(dx, dy), dy / length(dx, dy)]);
    penetration = Infinity;
    for (const [ax, ay] of axes) {
      const overlap = Math.abs(ca.ux * ax + ca.uy * ay) * ca.half + ca.radius + Math.abs(cb.ux * ax + cb.uy * ay) * cb.half + cb.radius - Math.abs(dx * ax + dy * ay);
      if (overlap < penetration) {
        const sign = dx * ax + dy * ay < 0 ? -1 : 1;
        penetration = overlap;
        nx = ax * sign;
        ny = ay * sign;
      }
    }
  }
  if (penetration <= 0) return null;
  return {
    nx,
    ny,
    penetration,
    x: (points.ax + nx * a.radius + points.bx - nx * b.radius) / 2,
    y: (points.ay + ny * a.radius + points.by - ny * b.radius) / 2,
  };
}

function applyImpulse(body, ix, iy, rx = 0, ry = 0) {
  body.vx += ix * body.inverseMass;
  body.vy += iy * body.inverseMass;
  body.angularVelocity += cross(rx, ry, ix, iy) * body.inverseInertia;
}

function collide(a, b) {
  const contact = contactBetween(a, b);
  if (!contact) return 0;
  const { nx, ny, penetration, x, y } = contact;
  const totalInverseMass = a.inverseMass + b.inverseMass;
  const correction = (Math.max(0, penetration - 0.035) * 0.8) / totalInverseMass;
  a.x -= nx * correction * a.inverseMass;
  a.y -= ny * correction * a.inverseMass;
  b.x += nx * correction * b.inverseMass;
  b.y += ny * correction * b.inverseMass;
  const arx = x - a.x;
  const ary = y - a.y;
  const brx = x - b.x;
  const bry = y - b.y;
  const rvx = b.vx - b.angularVelocity * bry - a.vx + a.angularVelocity * ary;
  const rvy = b.vy + b.angularVelocity * brx - a.vy - a.angularVelocity * arx;
  const normalVelocity = rvx * nx + rvy * ny;
  if (normalVelocity < 0) {
    const ra = cross(arx, ary, nx, ny);
    const rb = cross(brx, bry, nx, ny);
    const denominator = totalInverseMass + ra * ra * a.inverseInertia + rb * rb * b.inverseInertia;
    const bounce = normalVelocity < -35 ? 0.14 : 0;
    const impulse = (-(1 + bounce) * normalVelocity) / denominator;
    applyImpulse(a, -nx * impulse, -ny * impulse, arx, ary);
    applyImpulse(b, nx * impulse, ny * impulse, brx, bry);
    const tx = -ny;
    const ty = nx;
    const ta = cross(arx, ary, tx, ty);
    const tb = cross(brx, bry, tx, ty);
    const friction = clamp(-(rvx * tx + rvy * ty) / (totalInverseMass + ta * ta * a.inverseInertia + tb * tb * b.inverseInertia), -impulse * 0.2, impulse * 0.2);
    applyImpulse(a, -tx * friction, -ty * friction, arx, ary);
    applyImpulse(b, tx * friction, ty * friction, brx, bry);
  }
  return penetration;
}

function contain(body, bounds) {
  // Bound the complete rotated glyph box, not only its capsule; the rendered
  // ink and caption safe area stay inside even when a letter is spinning.
  const cosine = Math.abs(Math.cos(body.angle));
  const sine = Math.abs(Math.sin(body.angle));
  const ex = (cosine * body.width + sine * body.height) / 2;
  const ey = (sine * body.width + cosine * body.height) / 2;
  let contact = false;
  if (body.x < bounds.left + ex) {
    body.x = bounds.left + ex;
    body.vx = Math.max(0, -body.vx * 0.12);
    contact = true;
  }
  if (body.x > bounds.right - ex) {
    body.x = bounds.right - ex;
    body.vx = Math.min(0, -body.vx * 0.12);
    contact = true;
  }
  if (body.y < bounds.top + ey) {
    body.y = bounds.top + ey;
    body.vy = Math.max(0, -body.vy * 0.12);
    contact = true;
  }
  if (body.y > bounds.bottom - ey) {
    body.y = bounds.bottom - ey;
    body.vy = Math.min(0, -body.vy * 0.08);
    contact = true;
  }
  if (contact) body.angularVelocity *= 0.76;
}

function wake(world) {
  world.sleeping = false;
  world.restTime = 0;
}

/** Gravity strength is in world units/s²; gravity is OFF unless step enables it. */
export function createWorld({ width = 1000, height = 1100, glyphs = [], gravity = 900 } = {}) {
  width = Math.max(120, finite(width, 1000));
  height = Math.max(160, finite(height, 1100));
  const bounds = { left: width * 0.06, right: width * 0.94, top: height * (84 / 1100), bottom: height * (1020 / 1100) };
  const availableWidth = bounds.right - bounds.left;
  const availableHeight = bounds.bottom - bounds.top;
  const diameterLimit = Math.min(availableWidth, availableHeight) * 0.8;
  const prepared = (Array.isArray(glyphs) ? glyphs : []).slice(0, MAX_GLYPHS).map((glyph) => {
    const item = { ...glyph, text: String(glyph?.text ?? ''), width: Math.max(12, finite(glyph?.width, 180)), height: Math.max(12, finite(glyph?.height, 220)) };
    return scaleGlyph(item, Math.min(1, diameterLimit / Math.hypot(item.width, item.height)));
  });
  const columns = prepared.length <= 4 ? prepared.length : prepared.length <= 9 ? 3 : 4;
  const rows = [];
  const gapX = Math.min(width, height) * 0.024;
  const gapY = Math.min(width, height) * 0.028;
  for (let index = 0; index < prepared.length; index += columns) rows.push(prepared.slice(index, index + columns));
  const rowWidth = (row) => row.reduce((sum, item) => sum + item.width, 0) + Math.max(0, row.length - 1) * gapX;
  const naturalWidth = Math.max(1, ...rows.map(rowWidth));
  const naturalHeight = rows.reduce((sum, row) => sum + Math.max(...row.map((item) => item.height)), 0) + Math.max(0, rows.length - 1) * gapY;
  const fit = Math.min(1, (availableWidth * 0.96) / naturalWidth, (availableHeight * 0.94) / Math.max(1, naturalHeight));
  const usedIds = new Set();
  const bodies = [];
  let y = (bounds.top + bounds.bottom - naturalHeight * fit) / 2;
  for (const row of rows) {
    const rowHeight = Math.max(...row.map((item) => item.height)) * fit;
    let x = (width - rowWidth(row) * fit) / 2;
    for (const glyph of row) {
      const item = scaleGlyph(glyph, fit);
      let id = item.id ?? bodies.length;
      while (usedIds.has(id)) id = `${id}:${bodies.length}`;
      usedIds.add(id);
      const mass = clamp((item.width * item.height) / 22500, 0.65, 3);
      const body = {
        ...item,
        id,
        x: x + item.width / 2,
        y: y + rowHeight / 2,
        vx: 0,
        vy: 0,
        angle: [-0.04, 0.022, -0.025, 0.032, -0.018, 0.038][bodies.length % 6],
        angularVelocity: 0,
        radius: Math.min(item.width, item.height) / 2,
        inverseMass: 1 / mass,
        inverseInertia: 12 / (mass * (item.width ** 2 + item.height ** 2)),
      };
      contain(body, bounds);
      bodies.push(body);
      x += item.width + gapX * fit;
    }
    y += rowHeight + gapY * fit;
  }
  const links = bodies.slice(1).map((body, index) => ({ a: index, b: index + 1, maxLength: length(body.x - bodies[index].x, body.y - bodies[index].y) + 12 * fit }));
  return { width, height, bounds, bodies, links, gravity: Math.max(0, finite(gravity, 900)), grab: null, time: 0, restTime: 0, sleeping: true, lastOptions: { linked: true, gravity: false } };
}

/** Integrates at most 50 ms per call; long background gaps cannot explode. */
export function stepWorld(world, dtSeconds, { linked = true, gravity = false } = {}) {
  if (!world?.bodies) return world;
  if (world.lastOptions.linked !== linked || world.lastOptions.gravity !== gravity) wake(world);
  world.lastOptions = { linked, gravity };
  const dt = clamp(finite(dtSeconds, 0), 0, MAX_FRAME_DT);
  if (!dt || (world.sleeping && !world.grab)) return world;
  if (!world.bodies.length) {
    world.sleeping = true;
    return world;
  }
  const minimumRadius = Math.min(...world.bodies.map((body) => body.radius));
  const maximumStep = Math.min(1 / 120, Math.max(1 / 480, minimumRadius / (MAX_SPEED * 2)));
  const steps = Math.ceil(dt / maximumStep);
  const h = dt / steps;
  for (let iteration = 0; iteration < steps; iteration += 1) {
    world.time += h;
    if (gravity) for (const body of world.bodies) body.vy += world.gravity * h;
    if (linked)
      for (const link of world.links) {
        const a = world.bodies[link.a];
        const b = world.bodies[link.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = length(dx, dy);
        if (distance <= link.maxLength || distance <= EPSILON) continue;
        const nx = dx / distance;
        const ny = dy / distance;
        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        const force = clamp((distance - link.maxLength) * 28 + relative * 5.5, 0, 18000);
        applyImpulse(a, nx * force * h, ny * force * h);
        applyImpulse(b, -nx * force * h, -ny * force * h);
      }
    if (world.grab) {
      const { grab } = world;
      const body = world.bodies.find((item) => item.id === grab.id);
      if (body) {
        const c = Math.cos(body.angle);
        const s = Math.sin(body.angle);
        const rx = grab.localX * c - grab.localY * s;
        const ry = grab.localX * s + grab.localY * c;
        const px = body.x + rx;
        const py = body.y + ry;
        const pvx = body.vx - body.angularVelocity * ry;
        const pvy = body.vy + body.angularVelocity * rx;
        const effectiveMass = 1 / (body.inverseMass + (rx * rx + ry * ry) * body.inverseInertia * 0.6);
        const [fx, fy] = capVector(((grab.x - px) * 110 - pvx * 19) * effectiveMass, ((grab.y - py) * 110 - pvy * 19) * effectiveMass, 22000 / body.inverseMass);
        applyImpulse(body, fx * h, fy * h, rx, ry);
      }
      grab.throwVx *= Math.exp(-12 * h);
      grab.throwVy *= Math.exp(-12 * h);
    }
    for (const body of world.bodies) {
      const damping = Math.exp(-3.2 * h);
      [body.vx, body.vy] = capVector(body.vx * damping, body.vy * damping, MAX_SPEED);
      body.angularVelocity = clamp(body.angularVelocity * Math.exp(-3.8 * h), -MAX_ANGULAR_SPEED, MAX_ANGULAR_SPEED);
      body.x += body.vx * h;
      body.y += body.vy * h;
      body.angle = Math.atan2(Math.sin(body.angle + body.angularVelocity * h), Math.cos(body.angle + body.angularVelocity * h));
    }
    for (let pass = 0; pass < 5; pass += 1) {
      for (let a = 0; a < world.bodies.length; a += 1) for (let b = a + 1; b < world.bodies.length; b += 1) collide(world.bodies[a], world.bodies[b]);
      for (const body of world.bodies) contain(body, world.bounds);
    }
    let quiet = !world.grab;
    for (const body of world.bodies) {
      [body.vx, body.vy] = capVector(body.vx, body.vy, MAX_SPEED);
      body.angularVelocity = clamp(body.angularVelocity, -MAX_ANGULAR_SPEED, MAX_ANGULAR_SPEED);
      if (length(body.vx, body.vy) > 3 || Math.abs(body.angularVelocity) > 0.025) quiet = false;
    }
    if (linked && world.links.some((link) => length(world.bodies[link.a].x - world.bodies[link.b].x, world.bodies[link.a].y - world.bodies[link.b].y) > link.maxLength + 0.75)) quiet = false;
    world.restTime = quiet ? world.restTime + h : 0;
    if (world.restTime >= 0.35) {
      settleWorld(world);
      break;
    }
  }
  return world;
}

/** Pointer coordinates are world-space; off-center grabs retain their anchor. */
export function grabBody(world, id, x, y) {
  const body = world?.bodies?.find((item) => item.id === id);
  if (!body || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const dx = x - body.x;
  const dy = y - body.y;
  const c = Math.cos(body.angle);
  const s = Math.sin(body.angle);
  world.grab = { id, x, y, localX: dx * c + dy * s, localY: -dx * s + dy * c, throwVx: 0, throwVy: 0, lastMoveTime: world.time };
  wake(world);
  return true;
}

export function moveGrab(world, x, y) {
  if (!world?.grab || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const { grab } = world;
  x = clamp(x, -world.width, world.width * 2);
  y = clamp(y, -world.height, world.height * 2);
  const dt = Math.max(1 / 60, world.time - grab.lastMoveTime);
  [grab.throwVx, grab.throwVy] = capVector((x - grab.x) / dt, (y - grab.y) / dt, MAX_THROW_SPEED);
  grab.x = x;
  grab.y = y;
  grab.lastMoveTime = world.time;
  wake(world);
  return true;
}

export function releaseGrab(world) {
  if (!world?.grab) return false;
  const { grab } = world;
  const body = world.bodies.find((item) => item.id === grab.id);
  if (body) [body.vx, body.vy] = capVector(body.vx * 0.7 + grab.throwVx * 0.3, body.vy * 0.7 + grab.throwVy * 0.3, MAX_THROW_SPEED);
  world.grab = null;
  wake(world);
  return true;
}

/** dx/dy are positional nudges in world units, applied to the same collision body.
 * Small increments stop keyboard moves from tunnelling through another glyph.
 * A single call is limited to 90 units; normal / Shift arrow moves are 14 / 45.
 */
export function nudgeBody(world, id, dx, dy) {
  const body = world?.bodies?.find((item) => item.id === id);
  if (!body || !Number.isFinite(dx) || !Number.isFinite(dy)) return false;
  [dx, dy] = capVector(dx, dy, 90);
  const increment = Math.max(2, Math.min(...world.bodies.map((item) => item.radius)) * 0.5);
  const steps = Math.max(1, Math.ceil(length(dx, dy) / increment));
  for (let index = 0; index < steps; index += 1) {
    body.x += dx / steps;
    body.y += dy / steps;
    for (let pass = 0; pass < 5; pass += 1) {
      for (let a = 0; a < world.bodies.length; a += 1) for (let b = a + 1; b < world.bodies.length; b += 1) collide(world.bodies[a], world.bodies[b]);
      for (const item of world.bodies) contain(item, world.bounds);
    }
  }
  wake(world);
  return true;
}

/** Freeze the current composition exactly; never reset positions or angles. */
export function settleWorld(world) {
  if (!world?.bodies) return world;
  world.grab = null;
  for (const body of world.bodies) {
    body.vx = 0;
    body.vy = 0;
    body.angularVelocity = 0;
  }
  world.sleeping = true;
  world.restTime = 0.35;
  return world;
}

/** Use the complete rotated ink box for forgiving hit targets, not proxy corners. */
export function hitTest(world, x, y) {
  if (!world?.bodies || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (let index = world.bodies.length - 1; index >= 0; index -= 1) {
    const body = world.bodies[index];
    const c = Math.cos(body.angle);
    const s = Math.sin(body.angle);
    const dx = x - body.x;
    const dy = y - body.y;
    if (Math.abs(dx * c + dy * s) <= body.width / 2 + 5 && Math.abs(-dx * s + dy * c) <= body.height / 2 + 5) return body.id;
  }
  return null;
}

export function isWorldAtRest(world) {
  return Boolean(world?.sleeping && !world?.grab);
}

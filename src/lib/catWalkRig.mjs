export const CAT_RIG = Object.freeze({ width: 200, height: 180, floor: 169, pawSole: 7.5, stride: 64, duty: 0.68 });
export const CAT_LEGS = Object.freeze([
  { id: 'hindFar', family: 'hind', x: 73, phase: 0.5, bend: 1, far: true, upper: 31, lower: 31 },
  { id: 'foreFar', family: 'fore', x: 135, phase: 0.75, bend: -1, far: true, upper: 30, lower: 30 },
  { id: 'hindNear', family: 'hind', x: 77, phase: 0, bend: 1, far: false, upper: 31, lower: 31 },
  { id: 'foreNear', family: 'fore', x: 139, phase: 0.25, bend: -1, far: false, upper: 30, lower: 30 },
]);
const TAU = Math.PI * 2;
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const radiansToDegrees = (value) => value * 180 / Math.PI;
const rounded = (value) => Number(value.toFixed(5));

export function catFootState(distance, leg) {
  const phase = modulo(distance / CAT_RIG.stride - leg.phase, 1);
  const stance = phase < CAT_RIG.duty;
  const halfSweep = CAT_RIG.stride * CAT_RIG.duty / 2;
  let x; let lift = 0; let pitch = 0;
  if (stance) x = leg.x + halfSweep - phase * CAT_RIG.stride;
  else {
    const t = (phase - CAT_RIG.duty) / (1 - CAT_RIG.duty);
    // Cubic endpoints have the same backward velocity as the planted foot.
    // This gives heel release / toe arrival instead of a direction snap.
    const a = 2 * t ** 3 - 3 * t ** 2 + 1;
    const b = t ** 3 - 2 * t ** 2 + t;
    const c = -2 * t ** 3 + 3 * t ** 2;
    const d = t ** 3 - t ** 2;
    const tangent = -CAT_RIG.stride * (1 - CAT_RIG.duty);
    x = leg.x + a * -halfSweep + b * tangent + c * halfSweep + d * tangent;
    lift = 9 * Math.sin(Math.PI * t) ** 2;
    pitch = -15 * Math.sin(Math.PI * t) ** 2;
  }
  return { x, y: CAT_RIG.floor - CAT_RIG.pawSole - lift, phase, stance, lift, pitch, worldX: distance + x };
}

export function solveCatLeg(hip, ankle, upper, lower, bend) {
  const dx = ankle.x - hip.x; const dy = ankle.y - hip.y;
  const distance = Math.hypot(dx, dy);
  const reachable = distance <= upper + lower && distance >= Math.abs(upper - lower);
  const clamped = Math.min(upper + lower - 0.0001, Math.max(Math.abs(upper - lower) + 0.0001, distance));
  const along = (upper ** 2 - lower ** 2 + clamped ** 2) / (2 * clamped);
  const cross = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
  const ux = dx / distance; const uy = dy / distance;
  const knee = { x: hip.x + ux * along + bend * uy * cross, y: hip.y + uy * along - bend * ux * cross };
  return { hip, knee, ankle, reachable, upperAngle: radiansToDegrees(Math.atan2(knee.y - hip.y, knee.x - hip.x)) - 90, lowerAngle: radiansToDegrees(Math.atan2(ankle.y - knee.y, ankle.x - knee.x)) - 90 };
}

export function getCatRigPose(distance) {
  const phase = modulo(distance / CAT_RIG.stride, 1);
  const bob = 0.65 * Math.cos(phase * TAU * 2);
  const rock = 1.2 * Math.sin(phase * TAU);
  const angle = rock * Math.PI / 180;
  const bodyPoint = (x, y) => ({ x: 108 + (x - 108) * Math.cos(angle) - (y - 111) * Math.sin(angle), y: 111 + bob + (x - 108) * Math.sin(angle) + (y - 111) * Math.cos(angle) });
  const transform = (x, y, degrees = 0) => `translate(${rounded(x)} ${rounded(y)}) rotate(${rounded(degrees)})`;
  const body = `${transform(108, 111 + bob, rock)} translate(-108 -111)`;
  const headAnchor = bodyPoint(143, 100);
  const head = `${transform(headAnchor.x, headAnchor.y, rock * 0.2)} translate(-143 -100)`;
  const tailAnchor = bodyPoint(58, 112);
  const tail = `${transform(tailAnchor.x, tailAnchor.y, 2.2 * Math.sin(phase * TAU - 0.6))} translate(-58 -112)`;
  const legs = CAT_LEGS.map((leg) => {
    const foot = catFootState(distance, leg);
    const hip = bodyPoint(leg.x, 111 + (leg.far ? -1 : 0));
    const ik = solveCatLeg(hip, foot, leg.upper, leg.lower, leg.bend);
    return { ...leg, ...ik, foot, upperTransform: transform(hip.x, hip.y, ik.upperAngle), lowerTransform: transform(ik.knee.x, ik.knee.y, ik.lowerAngle), pawTransform: transform(foot.x, foot.y, foot.pitch) };
  });
  return { phase, bob, rock, body, head, tail, legs };
}

export const CAT_RIG_IMAGES = Object.freeze({
  body: { asset: 'body', x: 48, y: 90, width: 101, height: 43 },
  head: { asset: 'head', x: 110, y: 20, width: 73, height: 87 },
  tail: { asset: 'tail', x: 13, y: 42, width: 47, height: 70 },
  foreUpper: { asset: 'foreUpper', x: -6, y: -6, width: 12, height: 42 },
  foreLower: { asset: 'foreLower', x: -4.5, y: -5, width: 9, height: 40 },
  hindUpper: { asset: 'hindUpper', x: -9, y: -7, width: 18, height: 45 },
  hindLower: { asset: 'hindLower', x: -4.5, y: -5, width: 9, height: 41 },
  paw: { asset: 'paw', x: -4.4, y: -2.5, width: 14, height: 10 },
});

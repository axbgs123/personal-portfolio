export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 1100;
export const MAX_GLYPHS = 18;
export const POSTER_FONT_FAMILY = '"Portfolio Haas", "PingFang SC", "Microsoft YaHei", "Arial Black", Arial, sans-serif';
const UTILITY_FONT_FAMILY = '"Portfolio Haas", "PingFang SC", Arial, sans-serif';
const PAPER = '#f6f6f6';
const INK = '#090909';

const finite = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const positive = (value, fallback) => Math.max(1, finite(value, fallback));
const safeString = (value) =>
  Array.from(String(value ?? ''))
    .filter((character) => {
      const point = character.codePointAt(0);
      return !(point <= 8 || point === 11 || point === 12 || (point >= 14 && point <= 31) || (point >= 0xd800 && point <= 0xdfff) || point === 0xfffe || point === 0xffff);
    })
    .join('');
const isRegionalIndicator = (value) => value >= 0x1f1e6 && value <= 0x1f1ff;
const isModifier = (character) => {
  const point = character.codePointAt(0);
  return (
    /\p{Mark}/u.test(character) || (point >= 0xfe00 && point <= 0xfe0f) || (point >= 0xe0100 && point <= 0xe01ef) || (point >= 0x1f3fb && point <= 0x1f3ff) || (point >= 0xe0020 && point <= 0xe007f)
  );
};

// Modern browsers use the Unicode segmenter. The browser-free fallback keeps
// combining marks, emoji skin tones, ZWJ families and paired flag indicators
// together; it intentionally does not pretend to implement all of UAX #29.
function fallbackGraphemes(text) {
  const result = [];
  let joinNext = false;
  Array.from(text).forEach((character) => {
    const previous = result[result.length - 1];
    if (previous && (joinNext || character === '\u200d' || isModifier(character))) result[result.length - 1] += character;
    else if (previous && isRegionalIndicator(character.codePointAt(0)) && Array.from(previous).length === 1 && isRegionalIndicator(previous.codePointAt(0))) result[result.length - 1] += character;
    else result.push(character);
    joinNext = character === '\u200d';
  });
  return result;
}

export function segmentPhrase(input, max = MAX_GLYPHS) {
  const limit = Math.min(1000, Math.max(0, Math.floor(finite(max, MAX_GLYPHS))));
  const text = safeString(input).trim();
  if (!text || !limit) return [];
  const segments =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (part) => part.segment)
      : fallbackGraphemes(text);
  // Whitespace is not a draggable invisible body. Keep the visitor's original
  // phrase separately in UI/metadata, rather than manufacturing spacing blocks.
  return segments.filter((segment) => !/^\s+$/u.test(segment)).slice(0, limit);
}

function fontSizeForCount(count) {
  if (count <= 1) return 430;
  if (count <= 2) return 350;
  if (count <= 3) return 284;
  if (count <= 4) return 264;
  if (count <= 6) return 224;
  if (count <= 9) return 194;
  if (count <= 12) return 166;
  return 142;
}

function measureGlyph(context, text, fontSize) {
  let measured;
  try {
    measured = context?.measureText?.(text);
  } catch {
    measured = null;
  }
  const estimatedWidth = fontSize * (text.codePointAt(0) > 0xff ? 1 : 0.72);
  const width = positive(measured?.width, estimatedWidth);
  const ascent = positive(measured?.actualBoundingBoxAscent, fontSize * 0.82);
  const descent = Math.max(0, finite(measured?.actualBoundingBoxDescent, fontSize * 0.12));
  const left = finite(measured?.actualBoundingBoxLeft, width / 2);
  const right = finite(measured?.actualBoundingBoxRight, width / 2);
  const inkWidth = Math.max(width, left + right);
  const padding = Math.max(12, fontSize * 0.08);
  return {
    width: Math.ceil(Math.max(inkWidth, fontSize * 0.24) + padding * 2),
    height: Math.ceil(Math.max(fontSize, ascent + descent) + padding * 2),
    ascent,
    descent,
    // Center the actual ink, not just the font's em square. The same offsets
    // are used by the live canvas and exported SVG/PNG snapshot.
    drawX: (left - right) / 2,
    drawY: (ascent - descent) / 2,
  };
}

export function createGlyphMetrics(context, glyphs) {
  const texts = Array.isArray(glyphs)
    ? glyphs
        .map(safeString)
        .filter((text) => text && !/^\s+$/u.test(text))
        .slice(0, MAX_GLYPHS)
    : [];
  const fontSize = fontSizeForCount(texts.length);
  const previous = context ? { font: context.font, textAlign: context.textAlign, textBaseline: context.textBaseline } : null;
  try {
    if (context) {
      context.font = `900 ${fontSize}px ${POSTER_FONT_FAMILY}`;
      context.textAlign = 'center';
      context.textBaseline = 'alphabetic';
    }
    return texts.map((text, index) => ({ id: `glyph-${index}`, text, fontSize, fontFamily: POSTER_FONT_FAMILY, ...measureGlyph(context, text, fontSize) }));
  } finally {
    if (context) Object.assign(context, previous);
  }
}

function normalizeBodies(world) {
  const bodies = Array.isArray(world) ? world : world?.bodies || world?.glyphs || [];
  if (!Array.isArray(bodies)) return [];
  return bodies
    .filter((body) => body && safeString(body.text ?? body.glyph))
    .map((body) => {
      const fontSize = positive(body.fontSize, 224);
      const ascent = positive(body.ascent, fontSize * 0.82);
      const descent = Math.max(0, finite(body.descent, fontSize * 0.12));
      return {
        id: body.id,
        text: safeString(body.text ?? body.glyph),
        x: finite(body.x, WORLD_WIDTH / 2),
        y: finite(body.y, WORLD_HEIGHT / 2),
        angle: finite(body.angle),
        width: positive(body.width, fontSize * 1.16),
        height: positive(body.height, fontSize * 1.16),
        fontSize,
        drawX: finite(body.drawX),
        drawY: finite(body.drawY, (ascent - descent) / 2),
      };
    });
}

const registrationPaths = [
  [
    [30, 43],
    [30, 30],
    [43, 30],
  ],
  [
    [957, 30],
    [970, 30],
    [970, 43],
  ],
  [
    [30, 1057],
    [30, 1070],
    [43, 1070],
  ],
  [
    [957, 1070],
    [970, 1070],
    [970, 1057],
  ],
];

function renderAnnotations(context, count, ink) {
  context.save();
  try {
    context.fillStyle = ink;
    context.globalAlpha = 0.65;
    context.font = `500 14px ${UTILITY_FONT_FAMILY}`;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillText('字由 / TYPE PLAY', 60, 51);
    context.font = `400 12px ${UTILITY_FONT_FAMILY}`;
    context.fillText('made by you', 60, 1061);
    context.textAlign = 'right';
    context.fillText(`${count} glyphs`, 940, 1061);
    context.strokeStyle = ink;
    context.lineWidth = 1;
    context.globalAlpha = 0.35;
    context.beginPath();
    registrationPaths.forEach((points) => {
      context.moveTo(...points[0]);
      points.slice(1).forEach((point) => context.lineTo(...point));
    });
    context.stroke();
  } finally {
    context.restore();
  }
}

export function renderPoster(context, { world, width = WORLD_WIDTH, height = WORLD_HEIGHT, inverted = false, selectedId = null, showHandles = false, frozen = false } = {}) {
  const targetWidth = positive(width, WORLD_WIDTH);
  const targetHeight = positive(height, WORLD_HEIGHT);
  const scale = Math.min(targetWidth / WORLD_WIDTH, targetHeight / WORLD_HEIGHT);
  const paper = inverted ? INK : PAPER;
  const ink = inverted ? PAPER : INK;
  const bodies = normalizeBodies(world);
  context.save();
  try {
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.filter = 'none';
    context.shadowBlur = 0;
    context.shadowColor = 'transparent';
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.setLineDash([]);
    context.fillStyle = paper;
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.translate((targetWidth - WORLD_WIDTH * scale) / 2, (targetHeight - WORLD_HEIGHT * scale) / 2);
    context.scale(scale, scale);
    context.fillStyle = ink;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    bodies.forEach((body) => {
      context.save();
      try {
        // A system emoji font may paint in color; grayscale the complete glyph
        // without changing its shape or pose. SVG uses the same saturation rule.
        context.filter = 'grayscale(1)';
        context.translate(body.x, body.y);
        context.rotate(body.angle);
        context.font = `900 ${body.fontSize}px ${POSTER_FONT_FAMILY}`;
        context.fillText(body.text, body.drawX, body.drawY);
        if (showHandles && !frozen && selectedId !== null && body.id === selectedId) {
          context.strokeStyle = ink;
          context.lineWidth = 1.5;
          context.setLineDash([5, 5]);
          context.strokeRect(-body.width / 2, -body.height / 2, body.width, body.height);
          context.setLineDash([]);
          [-1, 1].forEach((horizontal) => [-1, 1].forEach((vertical) => context.fillRect((horizontal * body.width) / 2 - 3, (vertical * body.height) / 2 - 3, 6, 6)));
        }
      } finally {
        context.restore();
      }
    });
    renderAnnotations(context, bodies.length, ink);
  } finally {
    context.restore();
  }
  return { width: targetWidth, height: targetHeight, glyphCount: bodies.length };
}

const escapeXml = (value) => safeString(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const svgNumber = (value) => String(Number(finite(value).toFixed(6)));

export function serializePosterSvg({ world, inverted = false, phrase = '' } = {}) {
  const bodies = normalizeBodies(world);
  const paper = inverted ? INK : PAPER;
  const ink = inverted ? PAPER : INK;
  const glyphs = bodies
    .map(
      (body) =>
        `<g transform="translate(${svgNumber(body.x)} ${svgNumber(body.y)}) rotate(${svgNumber((body.angle * 180) / Math.PI)})"><text x="${svgNumber(body.drawX)}" y="${svgNumber(body.drawY)}" text-anchor="middle" font-family="${escapeXml(POSTER_FONT_FAMILY)}" font-size="${svgNumber(body.fontSize)}" font-weight="900">${escapeXml(body.text)}</text></g>`,
    )
    .join('');
  const corners = registrationPaths.map((points) => `M${points.map((point) => point.map(svgNumber).join(' ')).join('L')}`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1100" viewBox="0 0 1000 1100" role="img" aria-labelledby="poster-title"><title id="poster-title">${escapeXml(phrase || '字由 / TYPE PLAY')}</title><defs><filter id="poster-grayscale" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter></defs><rect width="1000" height="1100" fill="${paper}"/><g fill="${ink}" filter="url(#poster-grayscale)">${glyphs}</g><g fill="${ink}" opacity="0.65" font-family="${escapeXml(UTILITY_FONT_FAMILY)}"><text x="60" y="51" font-size="14" font-weight="500">字由 / TYPE PLAY</text><text x="60" y="1061" font-size="12" font-weight="400">made by you</text><text x="940" y="1061" text-anchor="end" font-size="12" font-weight="400">${bodies.length} glyphs</text></g><path d="${corners}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.35"/></svg>`;
}

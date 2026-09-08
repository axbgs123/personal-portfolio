import assert from 'node:assert/strict';
import test from 'node:test';
import { createGlyphMetrics, MAX_GLYPHS, POSTER_FONT_FAMILY, renderPoster, segmentPhrase, serializePosterSvg, WORLD_HEIGHT, WORLD_WIDTH } from '../src/lib/typePlayPoster.mjs';

function makeContext(measurement) {
  const calls = [];
  const stack = [];
  const stateKeys = [
    'font',
    'textAlign',
    'textBaseline',
    'fillStyle',
    'strokeStyle',
    'globalAlpha',
    'globalCompositeOperation',
    'filter',
    'shadowBlur',
    'shadowColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'lineWidth',
    'lineDash',
  ];
  const context = {
    font: '12px initial',
    textAlign: 'left',
    textBaseline: 'top',
    fillStyle: '#123456',
    strokeStyle: '#654321',
    globalAlpha: 0.2,
    globalCompositeOperation: 'multiply',
    filter: 'blur(4px)',
    shadowBlur: 8,
    shadowColor: '#abcdef',
    shadowOffsetX: 10,
    shadowOffsetY: 20,
    lineWidth: 4,
    lineDash: [8, 9],
    save() {
      stack.push(Object.fromEntries(stateKeys.map((key) => [key, context[key]])));
      calls.push({ method: 'save', args: [] });
    },
    restore() {
      assert.ok(stack.length, 'unbalanced context restore');
      Object.assign(context, stack.pop());
      calls.push({ method: 'restore', args: [] });
    },
    measureText(text) {
      calls.push({ method: 'measureText', args: [text], font: context.font, textAlign: context.textAlign, textBaseline: context.textBaseline });
      return typeof measurement === 'function' ? measurement(text, context) : measurement;
    },
    setLineDash(value) {
      context.lineDash = [...value];
      calls.push({ method: 'setLineDash', args: [value] });
    },
  };
  ['fillRect', 'translate', 'scale', 'rotate', 'fillText', 'strokeRect', 'beginPath', 'moveTo', 'lineTo', 'stroke'].forEach((method) => {
    context[method] = (...args) => calls.push({ method, args, ...Object.fromEntries(stateKeys.map((key) => [key, context[key]])) });
  });
  return { context, calls, stack, state: () => Object.fromEntries(stateKeys.map((key) => [key, context[key]])) };
}

const makeWorld = () => ({
  bodies: [
    { id: 'a', text: '字', fontSize: 224, width: 260, height: 260, ascent: 180, descent: 20, drawX: -3, drawY: 80, x: 290, y: 420, angle: Math.PI / 6 },
    { id: 'b', text: '由', fontSize: 194, width: 224, height: 224, ascent: 160, descent: 20, drawX: 2, drawY: 70, x: 620, y: 690, angle: -Math.PI / 4 },
  ],
});

test('segments the six-character starter and strips whitespace, not visible glyphs', () => {
  assert.deepEqual(segmentPhrase('  把 想法\n放出\t来  '), ['把', '想', '法', '放', '出', '来']);
  assert.deepEqual(segmentPhrase(' \n\t '), []);
  assert.deepEqual(segmentPhrase(null), []);
});

test('keeps combined glyphs, emoji families, skin tones, flags and keycaps intact', () => {
  const glyphs = ['e\u0301', '👩🏽‍💻', '👨‍👩‍👧‍👦', '🇨🇳', '🇫🇷', '1️⃣', '字'];
  assert.deepEqual(segmentPhrase(glyphs.join(' ')), glyphs);
});

test('default limit is 18 while explicit counting limits can detect overlong input', () => {
  const text = 'abcdefghijklmnopqrstuvwxyz';
  assert.equal(segmentPhrase(text).length, MAX_GLYPHS);
  assert.equal(segmentPhrase(text, 100).length, 26);
  assert.equal(segmentPhrase('字'.repeat(1100), 2000).length, 1000);
  assert.equal(segmentPhrase(text, 2.9).length, 2);
  assert.deepEqual(segmentPhrase(text, 0), []);
  assert.deepEqual(segmentPhrase(text, -4), []);
});

test('fallback segmentation preserves supported combined graphemes without Intl.Segmenter', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter');
  Object.defineProperty(Intl, 'Segmenter', { value: undefined, configurable: true });
  try {
    const glyphs = ['e\u0301', '👩🏽‍💻', '👨‍👩‍👧‍👦', '🇨🇳', '🇫🇷', '1️⃣', '字'];
    assert.deepEqual(segmentPhrase(glyphs.join(' ')), glyphs);
    assert.equal(segmentPhrase('字'.repeat(30), 100).length, 30);
  } finally {
    Object.defineProperty(Intl, 'Segmenter', descriptor);
  }
});

test('metrics use centered heavyweight system text, preserve context state and inputs', () => {
  const mock = makeContext({ width: 224, actualBoundingBoxLeft: 110, actualBoundingBoxRight: 114, actualBoundingBoxAscent: 180, actualBoundingBoxDescent: 20 });
  const state = mock.state();
  const glyphs = Object.freeze(segmentPhrase('把想法放出来'));
  const metrics = createGlyphMetrics(mock.context, glyphs);
  assert.equal(metrics.length, 6);
  assert.equal(new Set(metrics.map((body) => body.id)).size, 6);
  metrics.forEach((body, index) => {
    assert.equal(body.text, glyphs[index]);
    assert.equal(body.fontSize, 224);
    assert.equal(body.fontFamily, POSTER_FONT_FAMILY);
    assert.equal(body.width, 260);
    assert.equal(body.height, 260);
    assert.equal(body.drawX, -2);
    assert.equal(body.drawY, 80);
    assert.equal(body.ascent, 180);
    assert.equal(body.descent, 20);
  });
  assert.deepEqual(mock.state(), state);
  mock.calls.forEach((call) => {
    assert.equal(call.method, 'measureText');
    assert.equal(call.font, `900 224px ${POSTER_FONT_FAMILY}`);
    assert.equal(call.textAlign, 'center');
    assert.equal(call.textBaseline, 'alphabetic');
  });
});

test('metrics fallback is finite, generously padded, responsive to count and capped at 18', () => {
  const single = createGlyphMetrics(null, ['字']);
  const many = createGlyphMetrics(null, Array(30).fill('字'));
  assert.equal(many.length, 18);
  assert.ok(single[0].fontSize > many[0].fontSize);
  [...single, ...many].forEach((body) => {
    ['width', 'height', 'fontSize', 'ascent', 'descent', 'drawX', 'drawY'].forEach((key) => assert.ok(Number.isFinite(body[key])));
    assert.ok(body.height > body.fontSize);
    assert.ok(body.width > body.fontSize);
  });
  assert.deepEqual(createGlyphMetrics(null, null), []);
});

test('metrics survive measureText failure and restore the original measurement context', () => {
  const mock = makeContext(() => {
    throw new Error('font not ready');
  });
  const state = mock.state();
  const metrics = createGlyphMetrics(mock.context, ['字']);
  assert.ok(metrics[0].width > 430);
  assert.deepEqual(mock.state(), state);
});

test('renderer is deterministic and does not mutate live world bodies', () => {
  const world = makeWorld();
  world.bodies.forEach(Object.freeze);
  Object.freeze(world.bodies);
  Object.freeze(world);
  const before = JSON.stringify(world);
  const first = makeContext();
  const second = makeContext();
  assert.deepEqual(renderPoster(first.context, { world }), { width: WORLD_WIDTH, height: WORLD_HEIGHT, glyphCount: 2 });
  renderPoster(second.context, { world });
  assert.deepEqual(first.calls, second.calls);
  assert.equal(JSON.stringify(world), before);
  assert.equal(first.stack.length, 0);
});

test('renderer translates and rotates whole glyphs using shared font and actual-ink offsets', () => {
  const mock = makeContext();
  renderPoster(mock.context, { world: makeWorld() });
  const text = mock.calls.filter((call) => call.method === 'fillText');
  assert.deepEqual(
    text.slice(0, 2).map((call) => call.args),
    [
      ['字', -3, 80],
      ['由', 2, 70],
    ],
  );
  assert.equal(text[0].font, `900 224px ${POSTER_FONT_FAMILY}`);
  assert.equal(text[1].font, `900 194px ${POSTER_FONT_FAMILY}`);
  assert.deepEqual(
    mock.calls.filter((call) => call.method === 'rotate').map((call) => call.args[0]),
    [Math.PI / 6, -Math.PI / 4],
  );
  assert.deepEqual(
    mock.calls.filter((call) => call.method === 'translate').map((call) => call.args),
    [
      [0, 0],
      [290, 420],
      [620, 690],
    ],
  );
  assert.deepEqual(
    text.slice(2).map((call) => call.args),
    [
      ['字由 / TYPE PLAY', 60, 51],
      ['made by you', 60, 1061],
      ['2 glyphs', 940, 1061],
    ],
  );
});

test('high resolution and letterbox output preserve logical-world geometry', () => {
  const large = makeContext();
  renderPoster(large.context, { world: makeWorld(), width: 2000, height: 2200 });
  assert.deepEqual(large.calls.find((call) => call.method === 'fillRect').args, [0, 0, 2000, 2200]);
  assert.deepEqual(large.calls.find((call) => call.method === 'scale').args, [2, 2]);
  const square = makeContext();
  renderPoster(square.context, { world: makeWorld(), width: 1100, height: 1100 });
  assert.deepEqual(square.calls.find((call) => call.method === 'translate').args, [50, 0]);
  assert.deepEqual(square.calls.find((call) => call.method === 'scale').args, [1, 1]);
});

test('selected bounding handles only appear on explicit non-frozen preview', () => {
  const active = makeContext();
  renderPoster(active.context, { world: makeWorld(), selectedId: 'a', showHandles: true });
  assert.equal(active.calls.filter((call) => call.method === 'strokeRect').length, 1);
  assert.deepEqual(active.calls.find((call) => call.method === 'strokeRect').args, [-130, -130, 260, 260]);
  assert.equal(active.calls.filter((call) => call.method === 'fillRect' && call.args[2] === 6).length, 4);
  const frozen = makeContext();
  renderPoster(frozen.context, { world: makeWorld(), selectedId: 'a', showHandles: true, frozen: true });
  assert.equal(frozen.calls.filter((call) => call.method === 'strokeRect').length, 0);
  const ordinary = makeContext();
  renderPoster(ordinary.context, { world: makeWorld(), selectedId: 'a' });
  assert.equal(ordinary.calls.filter((call) => call.method === 'strokeRect').length, 0);
});

test('only glyphs get grayscale, paper/ink reverse, and dirty caller state is restored', () => {
  const mock = makeContext();
  const state = mock.state();
  renderPoster(mock.context, { world: makeWorld(), inverted: true });
  const paper = mock.calls.find((call) => call.method === 'fillRect');
  assert.equal(paper.fillStyle, '#090909');
  assert.equal(paper.filter, 'none');
  assert.equal(paper.globalAlpha, 1);
  assert.equal(paper.globalCompositeOperation, 'source-over');
  assert.equal(paper.shadowBlur, 0);
  const text = mock.calls.filter((call) => call.method === 'fillText');
  assert.equal(text[0].fillStyle, '#f6f6f6');
  assert.equal(text[0].filter, 'grayscale(1)');
  assert.equal(text[2].filter, 'none');
  assert.deepEqual(mock.state(), state);
});

test('context saves are balanced even if glyph rendering fails', () => {
  const mock = makeContext();
  const state = mock.state();
  mock.context.fillText = () => {
    throw new Error('render interrupted');
  };
  assert.throws(() => renderPoster(mock.context, { world: makeWorld() }), /render interrupted/);
  assert.equal(mock.stack.length, 0);
  assert.deepEqual(mock.state(), state);
});

test('SVG preserves the same logical positions, ink offsets, rotation and font without UI handles', () => {
  const world = makeWorld();
  const svg = serializePosterSvg({ world, phrase: '字由' });
  assert.equal(svg, serializePosterSvg({ world, phrase: '字由' }));
  assert.ok(svg.includes('width="1000" height="1100" viewBox="0 0 1000 1100"'));
  assert.ok(svg.includes('translate(290 420) rotate(30)'));
  assert.ok(svg.includes('translate(620 690) rotate(-45)'));
  assert.ok(svg.includes('x="-3" y="80" text-anchor="middle"'));
  assert.ok(svg.includes('font-size="224" font-weight="900">字</text>'));
  assert.ok(svg.includes('font-family="&quot;Portfolio Haas&quot;'));
  assert.ok(svg.includes('<feColorMatrix type="saturate" values="0"/>'));
  assert.ok(!svg.includes('stroke-dasharray'));
});

test('SVG treats hostile phrase, glyph text, ids and font metadata strictly as text', () => {
  const text = '<script>alert("x")</script><image href="https://example.com/x" onload="x"/>&\'';
  const world = { bodies: [{ text, id: '" onclick="x', fontFamily: '"><script>font</script>', x: 100, y: 200, angle: 0 }] };
  const svg = serializePosterSvg({ world, phrase: '</title><script>title</script>&"\'' });
  assert.ok(svg.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(svg.includes('&lt;/title&gt;&lt;script&gt;title&lt;/script&gt;&amp;&quot;&apos;'));
  assert.doesNotMatch(svg, /<(?:script|image|foreignObject|style)\b/i);
  const markupTags = svg.match(/<[^>]+>/g).join('');
  assert.doesNotMatch(markupTags, /\s(?:href|onclick|onload)=/);
  assert.ok(!svg.includes('<script>font'));
  assert.ok(!svg.includes('onclick'));
});

test('invalid XML controls and unpaired surrogates are removed without damaging valid emoji', () => {
  const text = '\u0000\u000B\uD800猫\uDC00👩🏽‍💻\uFFFF';
  assert.deepEqual(segmentPhrase(text), ['猫', '👩🏽‍💻']);
  const svg = serializePosterSvg({ world: [{ text }], phrase: text });
  assert.ok(svg.includes('猫👩🏽‍💻'));
  assert.ok(!svg.includes('\u0000'));
  assert.ok(!svg.includes('\uD800'));
  assert.ok(!svg.includes('\uDC00'));
  assert.ok(!svg.includes('\uFFFF'));
});

test('invalid numbers normalize to finite snapshot coordinates and empty worlds still export', () => {
  const svg = serializePosterSvg({ world: [{ text: '字', x: Infinity, y: NaN, angle: NaN, fontSize: Infinity, width: -3, height: NaN }] });
  assert.ok(svg.includes('translate(500 550) rotate(0)'));
  assert.doesNotMatch(svg, /NaN|Infinity/);
  const empty = makeContext();
  assert.equal(renderPoster(empty.context).glyphCount, 0);
  assert.ok(serializePosterSvg().includes('0 glyphs'));
  assert.ok(serializePosterSvg({ inverted: true }).includes('<rect width="1000" height="1100" fill="#090909"/>'));
});

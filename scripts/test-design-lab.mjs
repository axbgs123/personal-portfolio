import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('src/pages/design-lab.page.jsx', root), 'utf8');
const stylesheet = readFileSync(new URL('src/pages/designLab.module.scss', root), 'utf8');
const { css } = require('sass').compile(fileURLToPath(new URL('src/pages/designLab.module.scss', root)));

function data(file) {
  const input = readFileSync(new URL(`src/constants/${file}.js`, root), 'utf8').replace(/export default ([^;]+);/, 'module.exports = $1;');
  const context = { module: { exports: {} } };
  vm.runInNewContext(input, context);
  return context.module.exports;
}

const input = `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function DesignLab', 'function DesignLab').replace('export function getStaticProps', 'function getStaticProps')}\nmodule.exports = { DesignLab, getStaticProps };`;
const { code } = require('next/dist/compiled/babel/core').transformSync(input, {
  filename: 'design-lab.page.jsx',
  babelrc: false,
  configFile: false,
  presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
});

function nodes(value) {
  if (!value || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return typeof value === 'object' ? [value, ...nodes(value.props.children)] : [];
}

function harness() {
  let stateIndex = 0;
  const state = [];
  const context = {
    module: { exports: {} },
    React: { Fragment: 'Fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) },
    Head: 'Head', Image: 'Image', Link: 'Link', SignatureMark: 'SignatureMark',
    profilePortrait: data('profilePortrait'), projects: data('projects'), writingArticles: data('writingArticles'),
    styles: new Proxy({}, { get: (_, key) => String(key) }),
    useState(initial) {
      const index = stateIndex;
      stateIndex += 1;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
  };
  vm.runInNewContext(code, context);
  const { DesignLab, getStaticProps } = context.module.exports;
  return { render() { stateIndex = 0; return DesignLab(getStaticProps().props); }, props: getStaticProps().props };
}

test('two palette schemes render identical real-content section trees', () => {
  const page = harness();
  const before = nodes(page.render());
  before.find((node) => node.type === 'input' && node.props.value === 'vermilion').props.onChange();
  const after = nodes(page.render());
  assert.equal(after.find((node) => 'data-design-lab' in node.props).props['data-palette'], 'vermilion');
  // Event closures are recreated by React; compare rendered geometry/content,
  // not function identity. Interaction behavior is exercised separately.
  assert.equal(JSON.stringify(after.filter((node) => node.type === 'section')), JSON.stringify(before.filter((node) => node.type === 'section')));
  const schemeRule = css.match(/\[data-palette=vermilion\]\s*\{([^}]+)\}/)?.[1];
  assert.ok(schemeRule);
  assert.equal(schemeRule.trim().split(';').filter((line) => line.trim()).length, 2);
  assert.match(schemeRule, /--lab-accent: #d74436/);
  assert.match(schemeRule, /--lab-dark-accent: #d74436/);
});

test('actual project and article titles/links are preserved without extra client content', () => {
  const { props } = harness();
  assert.equal(props.featuredProjects.length, 2);
  assert.deepEqual(Array.from(props.featuredProjects, (project) => project.id), ['project1', 'project2']);
  props.featuredProjects.forEach((project) => {
    assert.equal(project.title, data('projects').find((item) => item.id === project.id).title);
    assert.ok(existsSync(new URL(`public${project.img}`, root)));
    assert.ok(project.link.startsWith('/projects/'));
  });
  props.readings.forEach((article) => {
    assert.equal(article.title, data('writingArticles').find((item) => item.slug === article.slug).title);
    assert.deepEqual(Object.keys(article), ['slug', 'title']);
  });
});

test('native radio grouping has explicit labels, visible focus and live scheme feedback', () => {
  const tree = nodes(harness().render());
  const radios = tree.filter((node) => node.type === 'input');
  assert.equal(radios.length, 2);
  assert.equal(radios.filter((node) => node.props.checked).length, 1);
  radios.forEach((radio) => {
    assert.equal(radio.props.type, 'radio');
    assert.equal(radio.props.name, 'design-lab-palette');
    assert.ok(tree.some((node) => node.type === 'label' && node.props.htmlFor === radio.props.id));
  });
  assert.ok(tree.some((node) => node.props.role === 'status'));
  assert.match(css, /input:focus-visible \+ span/);
});

test('playback sample is opt-in, stoppable and honestly silent', () => {
  const page = harness();
  let tree = nodes(page.render());
  let button = tree.find((node) => node.type === 'button');
  assert.equal(button.props['aria-pressed'], false);
  button.props.onClick();
  tree = nodes(page.render());
  button = tree.find((node) => node.type === 'button');
  assert.equal(button.props['aria-pressed'], true);
  assert.equal(tree.find((node) => 'data-playing' in node.props).props['data-playing'], true);
  button.props.onClick();
  assert.equal(nodes(page.render()).find((node) => node.type === 'button').props['aria-pressed'], false);
  assert.match(source, /仅动效，无声音/);
  assert.doesNotMatch(source, /AudioContext|new Audio\(|fetch\(|setInterval|setTimeout/);
});

test('links remain first-activation native links and all portrait images stay unchanged', () => {
  const tree = nodes(harness().render());
  tree.filter((node) => node.type === 'Link').forEach((link) => {
    assert.ok(link.props.href.startsWith('/'));
    assert.equal(link.props.onClick, undefined);
  });
  const portrait = tree.find((node) => node.type === 'Image' && node.props.priority);
  assert.equal(portrait.props.src, data('profilePortrait').src);
  assert.equal(portrait.props.alt, data('profilePortrait').alt);
  assert.match(portrait.props.alt, /非本人照片/);
});

test('compiled responsive styles retain 960px desktop and non-fixed mobile dimensions', () => {
  assert.match(css, /max-width: 960px/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /\.composition\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.projectGrid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /overflow-wrap: anywhere/);
});

test('reduced motion is static and styles have no global scope', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
  assert.match(css, /transition: none !important/);
  assert.doesNotMatch(stylesheet, /:global|:root|(?:^|\n)(?:html|body)\b/);
  assert.doesNotMatch(source, /useEffect|useStore|ScrollTrigger|portfolio:|localStorage|sessionStorage/);
});

function luminance(hex) {
  const values = hex.match(/[a-f\d]{2}/gi).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('small text remains WCAG AA contrast; vermilion symbols have 3:1 contrast', () => {
  [['090909', 'f6f6f6'], ['686868', 'f6f6f6'], ['f6f6f6', '111111'], ['aaaaaa', '111111']].forEach(([fg, bg]) => assert.ok(contrast(fg, bg) >= 4.5));
  ['f6f6f6', '111111', '090909'].forEach((bg) => assert.ok(contrast('d74436', bg) >= 3));
});

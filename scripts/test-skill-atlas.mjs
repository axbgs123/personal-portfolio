import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(`${root}/${path}`, 'utf8');
const cleanImports = (source) => source.replace(/^import[\s\S]*?;\n/gm, '');
const migrated = vm.runInNewContext(`${read('src/constants/migratedPortfolio.js').replace(/export const /g, 'const ')}\n({ migratedProjectEntries, migratedPhotographyEntry, migratedShortDramaEntry })`);
const entries = vm.runInNewContext(`${cleanImports(read('src/constants/archivePages.js')).replace(/export default.*;/g, '')}\narchivePages.personalSkills.entries`, {
  writingArticles: [],
  ...migrated,
});
const styles = new Proxy({}, { get: (_, key) => String(key) });
const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };

function nodes(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (typeof value !== 'object') return [];
  if (typeof value.type === 'function') return nodes(value.type(value.props));
  return [value, ...nodes(value.props.children)];
}

function words(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  if (typeof value !== 'object') return String(value);
  if (typeof value.type === 'function') return words(value.type(value.props));
  return words(value.props.children);
}

const classed = (tree, name) => nodes(tree).filter((node) => node.props.className === name);

function harness(initialEntries = entries) {
  let selected = 0;
  let tree;
  let focused;
  let currentEntries = initialEntries;
  const refs = { current: [] };
  const input = `${cleanImports(read('src/components/archive/SkillAtlas.jsx')).replace('export default ', '')}\nmodule.exports = SkillAtlas;`;
  const { code } = require('next/dist/compiled/babel/core').transformSync(input, {
    filename: 'SkillAtlas.jsx',
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
  });
  const context = {
    module: { exports: {} },
    React,
    styles,
    Link: 'a',
    useId: () => 'skill-atlas-regression',
    useRef: () => refs,
    useState: () => [
      selected,
      (next) => {
        selected = typeof next === 'function' ? next(selected) : next;
      },
    ],
  };
  vm.runInNewContext(code, context);
  const h = {
    render(nextEntries = currentEntries) {
      currentEntries = nextEntries;
      tree = context.module.exports({ entries: currentEntries });
      classed(tree, 'trigger').forEach((trigger, index) =>
        trigger.props.ref({
          focus: () => {
            focused = index;
          },
        }),
      );
      return tree;
    },
    get tree() {
      return tree;
    },
    get focused() {
      return focused;
    },
    get selected() {
      return selected;
    },
    choose(index) {
      classed(tree, 'trigger')[index].props.onClick();
      return h.render();
    },
    key(index, key, modifiers = {}) {
      let prevented = false;
      classed(tree, 'trigger')[index].props.onKeyDown({
        key,
        preventDefault: () => {
          prevented = true;
        },
        ...modifiers,
      });
      h.render();
      return prevented;
    },
  };
  h.render();
  return h;
}

test('all supplied directions retain complete copy and the two local evidence detail destinations', () => {
  const h = harness();
  assert.equal(entries.length, 6);
  assert.equal(classed(h.tree, 'method').length, entries.length);
  assert.equal(classed(h.tree, 'trigger').length, entries.length);
  const links = nodes(h.tree).filter((node) => node.type === 'a');
  assert.deepEqual(links.map((node) => node.props.href), ['/personal-skills/remotion-talking-head-inserts', '/personal-skills/geo-seo-cn']);
  links.forEach((node) => { assert.equal(node.props.target, undefined); assert.equal(node.props.onClick, undefined); });
  entries.forEach((entry, index) => {
    assert.equal(words(classed(h.tree, 'title')[index]), entry.title);
    assert.equal(words(classed(h.tree, 'meta')[index]), entry.meta);
    assert.equal(words(classed(h.tree, 'status')[index]), entry.status);
    assert.equal(words(classed(h.tree, 'description')[index]), entry.desc);
  });
  assert.equal(classed(h.tree, 'note').length, 1);
  assert.equal(words(classed(h.tree, 'note')), 'Skill 文件与详情待补充。');
  assert.equal(nodes(h.tree).filter((node) => node.type === 'button').length, entries.length);
});

test('clicking real headings opens exactly their own introduction and clicking again closes it', () => {
  const h = harness();
  assert.deepEqual(
    classed(h.tree, 'panel').map((panel) => panel.props.hidden),
    Array.from(entries, (_, index) => index !== 0),
  );
  for (let index = 0; index < entries.length; index += 1) {
    if (h.selected === index) h.choose(index);
    h.choose(index);
    assert.equal(h.selected, index);
    const panels = classed(h.tree, 'panel');
    assert.equal(panels.filter((panel) => !panel.props.hidden).length, 1);
    assert.ok(words(panels[index]).includes(entries[index].desc));
    assert.equal(classed(h.tree, 'trigger')[index].props['aria-expanded'], true);
    assert.equal(classed(h.tree, 'title').length, entries.length, 'other headings remain visible');
    h.choose(index);
    assert.equal(h.selected, null);
    assert.ok(classed(h.tree, 'panel').every((panel) => panel.props.hidden));
  }
});

test('arrow/Home/End keys navigate heading focus without silently changing content', () => {
  const h = harness();
  [
    [0, 'ArrowDown', 1],
    [2, 'ArrowUp', 1],
    [0, 'End', entries.length - 1],
    [3, 'Home', 0],
    [0, 'ArrowUp', 0],
    [entries.length - 1, 'ArrowDown', entries.length - 1],
  ].forEach(([index, key, expected]) => {
    assert.equal(h.key(index, key), true);
    assert.equal(h.focused, expected);
    assert.equal(h.selected, 0);
  });
  ['Enter', ' ', 'Escape', 'ArrowRight', 'Tab'].forEach((key) => assert.equal(h.key(1, key), false));
  ['altKey', 'ctrlKey', 'metaKey'].forEach((modifier) => assert.equal(h.key(1, 'ArrowDown', { [modifier]: true }), false));
  h.choose(1);
  assert.equal(h.selected, 1, 'native Enter/Space click path uses the same real toggle handler');
});

test('each accessible heading controls a uniquely named region with proper collapsed visibility', () => {
  const h = harness();
  const triggers = classed(h.tree, 'trigger');
  const panels = classed(h.tree, 'panel');
  assert.equal(new Set(triggers.map((trigger) => trigger.props.id)).size, entries.length);
  assert.equal(new Set(panels.map((panel) => panel.props.id)).size, entries.length);
  triggers.forEach((trigger, index) => {
    assert.equal(trigger.type, 'button');
    assert.equal(trigger.props.type, 'button');
    assert.equal(trigger.props['aria-controls'], panels[index].props.id);
    assert.equal(panels[index].props['aria-labelledby'], trigger.props.id);
    assert.equal(panels[index].props.role, 'region');
    assert.equal(trigger.props['aria-expanded'], !panels[index].props.hidden);
  });
});

test('empty or invalid entry lists render an honest non-interactive empty state', () => {
  [[], null, {}, [null, false, {}, { title: '' }]].forEach((input) => {
    const h = harness(input);
    assert.equal(classed(h.tree, 'trigger').length, 0);
    assert.equal(classed(h.tree, 'panel').length, 0);
    assert.equal(nodes(h.tree).filter((node) => node.type === 'a').length, 0);
    assert.ok(words(h.tree).includes('暂无可展示的方法介绍。'));
  });
});

test('entry changes cannot leave a stale panel selected or throw after clearing all entries', () => {
  const h = harness();
  h.choose(3);
  h.render([entries[0]]);
  assert.equal(classed(h.tree, 'panel').length, 1);
  assert.equal(classed(h.tree, 'panel')[0].props.hidden, false);
  assert.equal(words(classed(h.tree, 'description')), entries[0].desc);
  h.render([]);
  assert.equal(classed(h.tree, 'panel').length, 0);
});

test('description line splitting is lossless and never creates inferred workflow stages', () => {
  const descriptions = ['原文没有逗号也完整显示', '从甲、乙到丙，保留原有句号。', '问题？依据！边界；结论。', '<script>不作为网页运行</script>'];
  const h = harness(descriptions.map((desc, index) => ({ title: `方向${index}`, desc })));
  descriptions.forEach((desc, index) => assert.equal(words(classed(h.tree, 'description')[index]), desc));
  assert.equal(nodes(h.tree).filter((node) => node.type === 'script').length, 0);
  assert.ok(!nodes(h.tree).some((node) => node.props.dangerouslySetInnerHTML));
  assert.ok(!nodes(h.tree).some((node) => ['svg', 'canvas', 'video'].includes(node.type)));
});

test('only supplied safe destinations become links, without interception or fabricated associations', () => {
  const h = harness([
    { title: '站内方向', desc: '原介绍', href: '/projects/project2', linkLabel: '查看原项目' },
    { title: '站外方向', desc: '原介绍', href: 'https://example.com/skill' },
    { title: '无链接方向', desc: '原介绍' },
    { title: '不安全方向', desc: '原介绍', href: ['javascript', 'alert(1)'].join(':') },
  ]);
  const links = nodes(h.tree).filter((node) => node.type === 'a');
  assert.equal(links.length, 2);
  assert.equal(links[0].props.href, '/projects/project2');
  assert.ok(words(links[0]).includes('查看原项目'));
  assert.equal(links[0].props.onClick, undefined);
  assert.equal(links[1].props.href, 'https://example.com/skill');
  assert.equal(links[1].props.target, '_blank');
  assert.equal(links[1].props.rel, 'noopener noreferrer');
});

test('styles compile with local mobile, visible-focus and reduced-motion alternatives', () => {
  const { css } = require('sass').compile(`${root}/src/components/archive/skillAtlas.module.scss`);
  assert.match(css, /max-width: 760px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /\.panel\[hidden\]/);
  assert.doesNotMatch(css, /backdrop-filter|position: fixed|scroll-snap|animation: [^;]*infinite/);
});

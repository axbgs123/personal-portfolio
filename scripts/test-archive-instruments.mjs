import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Current scope: content provenance + Photography/AIGC/shared image inspection.
// SkillAtlas and ProjectReel handlers have their own dedicated suites. Old lamp,
// fake-camera crop, cartridge and comparison-divider assertions are not kept as
// misleading claims about the current content-centered exhibits.
const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const styles = new Proxy({}, { get: (_, key) => String(key) });
const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const cleanImports = (source) => source.replace(/^import[^\n]*\n/gm, '');

function loadData(name, extra = {}) {
  const dataSource = read(`src/constants/${name}.js`);
  const named = [...dataSource.matchAll(/export const (\w+)/g)].map((match) => match[1]);
  const input =
    cleanImports(dataSource)
      .replace(/export const /g, 'const ')
      .replace(/export default ([^;]+);/, 'module.exports = $1;') + (named.length ? `\nmodule.exports = { ${named.join(', ')} };` : '');
  const context = { module: { exports: {} }, ...extra };
  vm.runInNewContext(input, context);
  return context.module.exports;
}

const writingArticles = loadData('writingArticles');
const projects = loadData('projects');
const illustratedTutorials = loadData('illustratedTutorials');
const migrated = loadData('migratedPortfolio');
const archivePages = loadData('archivePages', { writingArticles, ...migrated });
const promptRecord = read('public/art/project-cover-prompts.md');
const { css } = require('sass').compile(fileURLToPath(new URL('src/components/archive/contentExhibits.module.scss', root)));
const { css: aigcCss } = require('sass').compile(fileURLToPath(new URL('src/components/archive/aigcExhibition.module.scss', root)));

function compileComponent(name) {
  const source = cleanImports(read(`src/components/archive/${name}.jsx`))
    .replace(/export const /g, 'const ')
    .replace(/export default function /g, 'function ')
    .replace(/export default [^;]+;/g, '');
  return require('next/dist/compiled/babel/core').transformSync(`(function () { ${source}\nmodule.exports = { ${name}${name === 'ArchiveInstruments' ? ', instrumentCodes' : ''} }; })();`, {
    filename: `${name}.test.jsx`,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
  }).code;
}

const compiled = Object.fromEntries(['ArchivePage', 'ArchiveInstruments', 'PhotographyContact', 'AigcExhibition', 'ImageInspection'].map((name) => [name, compileComponent(name)]));
function nodes(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return typeof value === 'object' ? [value, ...nodes(value.props.children)] : [];
}
function words(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  return typeof value === 'object' ? words(value.props.children) : String(value);
}
const hasClass = (node, name) => node.props.className?.split(' ').includes(name);
const classed = (h, name) => h.nodes().filter((node) => hasClass(node, name));

function harness(name, initialProps = {}, overrides = {}) {
  const hookState = new Map();
  const elements = new Map();
  let currentFiber;
  let tree;
  let props = initialProps;
  let id = 0;
  const rect = { left: 100, top: 40, width: 800, height: 400 };
  const hook = (initial) => {
    const key = `${currentFiber.path}:${currentFiber.cursor}`;
    currentFiber.cursor += 1;
    if (!hookState.has(key)) hookState.set(key, typeof initial === 'function' ? initial() : initial);
    return [
      hookState.get(key),
      (next) => {
        hookState.set(key, typeof next === 'function' ? next(hookState.get(key)) : next);
      },
    ];
  };
  const context = {
    module: { exports: {} },
    React,
    styles,
    gallery: styles,
    Image: 'Image',
    Link: 'Link',
    CustomHead: 'Head',
    ArchiveField: 'ArchiveField',
    projects,
    writingArticles,
    illustratedTutorials,
    SkillAtlas: 'SkillAtlas',
    ProjectReel: 'ProjectReel',
    useState: hook,
    useRef: (initial) => hook(() => ({ current: initial }))[0],
    useId: () =>
      hook(() => {
        id += 1;
        return `exhibit-test-${id}`;
      })[0],
  };
  ['ImageInspection', 'PhotographyContact', 'AigcExhibition', 'ArchiveInstruments', 'ArchivePage'].forEach((component) => {
    vm.runInNewContext(compiled[component], context);
    Object.assign(context, context.module.exports);
  });
  Object.assign(context, overrides);
  const Component = context[name];
  const expand = (value, path) => {
    if (Array.isArray(value)) return value.map((child, index) => expand(child, `${path}/${child?.props?.key || index}`));
    if (!value || typeof value !== 'object') return value;
    if (typeof value.type === 'function') {
      const previous = currentFiber;
      currentFiber = { path: `${path}/${value.type.name}`, cursor: 0 };
      const result = value.type(value.props);
      currentFiber = previous;
      return expand(result, `${path}/${value.type.name}`);
    }
    const result = { ...value, props: { ...value.props, children: expand(value.props.children, `${path}/children`) } };
    if (!elements.has(path)) elements.set(path, { getBoundingClientRect: () => rect });
    const element = elements.get(path);
    element.props = result.props;
    if (typeof result.props.ref === 'function') result.props.ref(element);
    else if (result.props.ref) result.props.ref.current = element;
    return result;
  };
  const h = {
    rect,
    render(nextProps = props) {
      props = nextProps;
      currentFiber = { path: name, cursor: 0 };
      tree = expand(Component(props), name);
      currentFiber = null;
      return tree;
    },
    nodes: () => nodes(tree),
    text: () => words(tree),
    get props() {
      return props;
    },
  };
  h.render();
  return h;
}

function preparePage(page) {
  return harness('ArchivePage', { page }, { ArchiveInstruments: 'ArchiveInstruments' });
}
function preparedEntries(key) {
  return preparePage(archivePages[key])
    .nodes()
    .find((node) => node.type === 'ArchiveInstruments').props.entries;
}
function clickPhoto(h, index) {
  classed(h, 'contactStrip')
    [index].props.children.flat(Infinity)
    .find((node) => node?.type === 'button')
    .props.onClick();
  h.render();
}
function inspectionFrame(h, index = 0) {
  return classed(h, 'inspectFrame')[index];
}

test('ArchivePage routes only the four exhibit categories and leaves tutorial/writing fallback intact', () => {
  ['photography', 'personalSkills', 'aigc', 'moreProjects'].forEach((key) => {
    const h = preparePage(archivePages[key]);
    const exhibit = h.nodes().find((node) => node.type === 'ArchiveInstruments');
    assert.equal(exhibit.props.code, archivePages[key].code);
    assert.equal(exhibit.props.title, archivePages[key].title);
    assert.ok(h.text().includes(archivePages[key].title));
    assert.equal(h.nodes().filter((node) => node.type === 'ArchiveField').length, 0);
  });
  ['tutorials', 'writing'].forEach((key) =>
    assert.equal(
      preparePage(archivePages[key])
        .nodes()
        .filter((node) => node.type === 'ArchiveField').length,
      1,
    ),
  );
});

test('dispatcher selects four distinct content exhibits and passes entries by reference', () => {
  const expected = { PHOTOGRAPHY: 'PhotographyContact', 'PERSONAL SKILLS': 'SkillAtlas', AIGC: 'AigcExhibition', PROJECTS: 'ProjectReel' };
  Object.entries(expected).forEach(([code, component]) => {
    const input = Object.freeze([{ title: '原始方向', desc: '原始介绍' }]);
    const h = harness('ArchiveInstruments', { code, entries: input, title: '真实内容' }, Object.fromEntries(Object.values(expected).map((name) => [name, name])));
    const child = h.nodes().find((node) => node.type === component);
    assert.ok(child);
    assert.equal(child.props.entries, input);
    assert.equal(h.nodes()[0].props['aria-label'], '真实内容浏览');
    assert.equal(h.nodes().filter((node) => Object.values(expected).includes(node.type)).length, 1);
  });
  assert.equal(harness('ArchiveInstruments', { code: 'UNKNOWN', entries: [{ title: '未知内容' }] }).nodes().length, 0);
});

test('every dispatcher category has an honest empty fallback without fake controls or art', () => {
  ['PHOTOGRAPHY', 'PERSONAL SKILLS', 'AIGC', 'PROJECTS'].forEach((code) => {
    const h = harness('ArchiveInstruments', { code, entries: [] });
    assert.equal(h.text(), '还没有已整理的内容。');
    assert.equal(h.nodes().filter((node) => ['button', 'Image', 'input', 'video', 'canvas'].includes(node.type)).length, 0);
  });
});

test('ArchivePage enriches only source-backed covers and does not mutate original data or manufacture readiness', () => {
  ['photography', 'personalSkills', 'aigc', 'moreProjects'].forEach((key) => {
    const page = archivePages[key];
    const before = JSON.stringify(page);
    const enriched = preparedEntries(key);
    enriched.forEach((entry, index) => {
      assert.notEqual(entry, page.entries[index]);
      ['title', 'desc', 'href'].forEach((field) => assert.equal(entry[field], page.entries[index][field]));
      if (!entry.href) assert.equal(entry.status, '详情待补充');
      if (key === 'photography') {
        assert.doesNotMatch(entry.meta, /\d+\s*张/);
        assert.equal(entry.image, page.entries[index].image);
        if (entry.image) assert.ok(existsSync(new URL(`public${entry.image.src}`, root)));
      }
      if (key === 'moreProjects') {
        const project = projects.find((candidate) => candidate.link === entry.href);
        if (project) {
          assert.equal(entry.image.src, project.img);
          assert.equal(entry.linkLabel, '查看完整案例');
        } else if (['/more-projects/adcanvas', '/more-projects/open-llm-vtuber-companion'].includes(entry.href)) {
          assert.equal(entry.image, page.entries[index].image);
          assert.equal(entry.linkLabel, page.entries[index].linkLabel);
        } else {
          const original = migrated.migratedProjectEntries.find((candidate) => candidate.href === entry.href);
          assert.ok(original);
          assert.equal(entry.image, original.image);
          assert.equal(entry.preview, original.preview);
        }
        if (entry.image) assert.ok(existsSync(new URL(`public${entry.image.src}`, root)));
      }
    });
    assert.equal(JSON.stringify(page), before);
  });
});

test('ArchivePage preserves explicit supplied images and real parent navigation', () => {
  const image = { src: '/already-provided.jpg', alt: '用户原片', width: 600, height: 900 };
  const page = { ...archivePages.photography, entries: [{ ...archivePages.photography.entries[0], image }] };
  const h = harness('ArchivePage', { page, parent: { href: '/archive', title: '仓库' } }, { ArchiveInstruments: 'ArchiveInstruments' });
  assert.equal(h.nodes().find((node) => node.type === 'ArchiveInstruments').props.entries[0].image, image);
  const link = h.nodes().find((node) => node.type === 'Link');
  assert.equal(link.props.href, '/archive');
  assert.equal(link.props.onClick, undefined);
});

test('photography without originals has only real series headings, no pretend frames, counts, brightness or crop', () => {
  const h = harness('PhotographyContact', { entries: preparedEntries('photography').filter((entry) => !entry.href) });
  assert.equal(classed(h, 'contactRow').length, 4);
  assert.match(h.text(), /原片尚未补充/);
  assert.doesNotMatch(h.text(), /\d+\s*张|亮度|裁切|构图|运行成功/);
  assert.equal(h.nodes().filter((node) => ['Image', 'input', 'Link', 'a', 'canvas', 'svg'].includes(node.type)).length, 0);
  assert.equal(classed(h, 'inspectFrame').length, 0);
  assert.equal(classed(h, 'contactBody').length, 0);
  h.props.entries.forEach((entry) => assert.ok(h.text().includes(entry.title)));
});

test('photo row first activation reveals its exact original description; second closes it and other rows remain', () => {
  const entries = preparedEntries('photography').filter((entry) => !entry.href);
  const h = harness('PhotographyContact', { entries });
  entries.forEach((entry, index) => {
    clickPhoto(h, index);
    assert.equal(classed(h, 'contactBody').length, 1);
    assert.ok(words(classed(h, 'contactBody')).includes(entry.desc));
    assert.equal(classed(h, 'photoPending').length, 1);
    assert.equal(classed(h, 'contactRow').filter((node) => node.props['data-open']).length, 1);
    assert.equal(h.nodes().filter((node) => node.type === 'button' && node.props['aria-expanded']).length, 1);
    assert.equal(classed(h, 'contactRow').length, entries.length);
    h.nodes()
      .filter((node) => node.props['aria-controls'])
      .forEach((node) => assert.ok(h.nodes().some((candidate) => candidate.props.id === node.props['aria-controls'])));
    clickPhoto(h, index);
    assert.equal(classed(h, 'contactBody').length, 0);
    assert.equal(h.nodes().filter((node) => node.type === 'button' && node.props['aria-expanded']).length, 0);
  });
});

test('both photography cases show original covers and direct destinations without requiring expansion', () => {
  const entries = preparedEntries('photography');
  const original = migrated.migratedPhotographyEntry;
  assert.equal(entries.length, 6);
  assert.equal(entries[0].href, original.href);
  assert.equal(entries[0].image, original.image);
  const h = harness('PhotographyContact', { entries });
  const titleLink = h.nodes().find((node) => node.type === 'Link' && words(node).includes(original.title));
  assert.ok(titleLink);
  assert.equal(titleLink.props.href, original.href);
  assert.equal(titleLink.props.onClick, undefined);
  assert.ok(h.text().includes(original.desc));
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.src, original.image.src);
  const deliveryLink = h.nodes().find((node) => node.type === 'Link' && node.props['aria-label'] === original.title);
  assert.ok(deliveryLink);
  assert.equal(deliveryLink.props.href, original.href);
  assert.equal(deliveryLink.props.onClick, undefined);
  assert.equal(classed(h, 'photoPending').length, 0);
  assert.equal(h.nodes().filter((node) => node.type === 'Image').length, 2);
  assert.ok(h.nodes().some((node) => node.props.href === '/photography/short-drama'));
  assert.equal(classed(h, 'inspectFrame').length, 0);
  assert.ok(existsSync(new URL(`public${original.image.src}`, root)));
});

test('a supplied real photo opens the exact inspection asset, without placeholder substitution', () => {
  const image = { src: projects[0].img, alt: '已提供原片测试', width: 1200, height: 800 };
  const entry = { title: '已经整理的原片', meta: 'PHOTOGRAPHY', desc: '保持原说明。', image };
  const h = harness('PhotographyContact', { entries: [entry] });
  assert.equal(classed(h, 'inspectFrame').length, 0);
  clickPhoto(h, 0);
  assert.equal(classed(h, 'inspectFrame').length, 1);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.src, image.src);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.alt, image.alt);
  assert.equal(inspectionFrame(h).props.style.aspectRatio, '1200 / 800');
  assert.ok(h.text().includes(entry.desc));
  assert.equal(classed(h, 'photoPending').length, 0);
});

test('AIGC exposes exactly two existing covers backed by project constants and the generation prompt record', () => {
  const h = harness('AigcExhibition', { entries: preparedEntries('aigc') });
  const artworks = classed(h, 'artwork');
  const images = h.nodes().filter((node) => node.type === 'Image');
  assert.equal(artworks.length, 2);
  assert.deepEqual(
    images.map((image) => image.props.src),
    ['/art/operations-cover.webp', '/art/geo-cover.webp'],
  );
  images.forEach((image, index) => {
    const projectHref = `/projects/project${index + 1}`;
    assert.equal(projects.find((project) => project.link === projectHref).img, image.props.src);
    assert.ok(existsSync(new URL(`public${image.props.src}`, root)));
    const originalName = image.props.src.split('/').at(-1).replace('.webp', '.png');
    assert.ok(promptRecord.includes(`## ${originalName}`));
    assert.ok(words(artworks[index]).includes('主视觉'));
  });
  assert.equal(h.nodes().filter((node) => ['video', 'audio', 'iframe', 'canvas'].includes(node.type)).length, 0);
});

test('AIGC original-image and application links are direct, clearly labeled and need no inspection state', () => {
  const h = harness('AigcExhibition', { entries: preparedEntries('aigc') });
  const originals = h.nodes().filter((node) => node.type === 'a');
  const cases = h.nodes().filter((node) => node.type === 'Link');
  assert.deepEqual(
    originals.map((link) => link.props.href),
    ['/art/operations-cover.webp', '/art/geo-cover.webp'],
  );
  assert.deepEqual(
    cases.map((link) => link.props.href),
    ['/projects/project1', '/projects/project2'],
  );
  originals.forEach((link) => {
    assert.equal(link.props.target, '_blank');
    assert.equal(link.props.rel, 'noopener noreferrer');
    assert.equal(link.props.onClick, undefined);
    assert.match(link.props['aria-label'], /查看.+主视觉原图（新窗口）/);
    assert.equal(nodes(link).filter((node) => node.type === 'Image').length, 1);
  });
  cases.forEach((link) => assert.equal(link.props.onClick, undefined));
  assert.equal(classed(h, 'inspectFrame').length, 0);
  assert.equal(classed(h, 'panControls').length, 0);
  assert.equal(h.nodes().filter((node) => node.type === 'input').length, 0);
  assert.doesNotMatch(h.text(), /放大检验|平移|检验|缩放/);
});

test('AIGC keeps all four direction descriptions as native expandable notes, not fictional works', () => {
  const entries = preparedEntries('aigc');
  const h = harness('AigcExhibition', { entries });
  const details = h.nodes().filter((node) => node.type === 'details');
  assert.equal(details.length, entries.length);
  entries.forEach((entry, index) => {
    assert.ok(words(details[index]).includes(entry.title));
    assert.ok(words(details[index]).includes(entry.desc));
    const summary = nodes(details[index]).find((node) => node.type === 'summary');
    assert.ok(summary);
    assert.equal(summary.props.onClick, undefined);
    assert.equal(nodes(details[index]).filter((node) => node.type === 'Image').length, 0);
  });
  assert.match(words(classed(h, 'directionNotes')), /对应作品待补充/);
});

test('inspection toggles the same source asset and Escape restores full view', () => {
  const image = { src: '/art/operations-cover.webp', alt: '运营平台原图', width: 1672, height: 941 };
  const h = harness('ImageInspection', { image, title: '运营平台' });
  const initial = h.nodes().find((node) => node.type === 'Image').props;
  assert.equal(inspectionFrame(h).props['aria-pressed'], false);
  assert.equal(classed(h, 'panControls')[0].props.hidden, true);
  inspectionFrame(h).props.onClick();
  h.render();
  assert.equal(inspectionFrame(h).props['aria-pressed'], true);
  assert.match(inspectionFrame(h).props['aria-label'], /^还原全图/);
  assert.equal(classed(h, 'panControls')[0].props.hidden, false);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.src, initial.src);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.alt, initial.alt);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.draggable, false);
  inspectionFrame(h).props.onKeyDown({ key: 'Escape' });
  h.render();
  assert.equal(inspectionFrame(h).props['aria-pressed'], false);
  assert.equal(classed(h, 'panControls')[0].props.hidden, true);
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.src, initial.src);
  inspectionFrame(h).props.onClick();
  h.render();
  inspectionFrame(h).props.onClick();
  h.render();
  assert.equal(inspectionFrame(h).props['data-zoomed'], false);
});

test('mouse pan is scoped to actual frame coordinates and clamped to 0–100 percent', () => {
  const h = harness('ImageInspection', { image: { src: '/art/geo-cover.webp' }, title: 'GEO' });
  const move = (clientX, clientY, pointerType = 'mouse') => {
    let blocked = false;
    inspectionFrame(h).props.onPointerMove({
      clientX,
      clientY,
      pointerType,
      preventDefault: () => {
        blocked = true;
      },
    });
    h.render();
    assert.equal(blocked, false);
  };
  move(100, 40);
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '50%');
  inspectionFrame(h).props.onClick();
  h.render();
  move(300, 340);
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '25%');
  assert.equal(inspectionFrame(h).props.style['--inspect-y'], '75%');
  move(-900, 2000);
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '0%');
  assert.equal(inspectionFrame(h).props.style['--inspect-y'], '100%');
  move(2000, -900);
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '100%');
  assert.equal(inspectionFrame(h).props.style['--inspect-y'], '0%');
});

test('touch and wheel remain native while labeled ranges move the same viewport', () => {
  const h = harness('ImageInspection', { image: { src: '/art/geo-cover.webp' }, title: 'GEO' });
  inspectionFrame(h).props.onClick();
  h.render();
  let blocked = false;
  inspectionFrame(h).props.onPointerMove({
    pointerType: 'touch',
    clientX: 900,
    clientY: 40,
    preventDefault: () => {
      blocked = true;
    },
  });
  h.render();
  assert.equal(blocked, false);
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '50%');
  assert.equal(inspectionFrame(h).props.style['--inspect-y'], '50%');
  h.nodes().forEach((node) => ['onWheel', 'onTouchStart', 'onTouchMove', 'onPointerDown'].forEach((event) => assert.equal(node.props[event], undefined)));
  const ranges = h.nodes().filter((node) => node.type === 'input');
  assert.equal(ranges.length, 2);
  ranges.forEach((range) => {
    assert.equal(range.props.type, 'range');
    assert.equal(range.props.min, '0');
    assert.equal(range.props.max, '100');
    assert.ok(h.nodes().some((node) => node.type === 'label' && node.props.htmlFor === range.props.id));
  });
  ranges[0].props.onChange({ target: { value: '15' } });
  h.render();
  ranges[1].props.onChange({ target: { value: '85' } });
  h.render();
  assert.equal(inspectionFrame(h).props.style['--inspect-x'], '15%');
  assert.equal(inspectionFrame(h).props.style['--inspect-y'], '85%');
});

test('AIGC shows both full compositions before interaction with useful applications, not crop or tool controls', () => {
  const h = harness('AigcExhibition', { entries: preparedEntries('aigc') });
  assert.match(h.text(), /网站主视觉 · 2 幅/);
  assert.equal(classed(h, 'artwork').length, 2);
  assert.equal(classed(h, 'imageFrame').length, 2);
  assert.equal(classed(h, 'applicationLink').length, 2);
  h.nodes()
    .filter((node) => node.type === 'Image')
    .forEach((node) => {
      assert.equal(node.props.width, 1672);
      assert.equal(node.props.height, 941);
      assert.equal(node.props.hidden, undefined);
    });
  assert.equal(h.nodes().filter((node) => ['button', 'input', 'canvas', 'label'].includes(node.type)).length, 0);
  h.nodes().forEach((node) => ['onWheel', 'onPointerMove', 'onTouchMove'].forEach((event) => assert.equal(node.props[event], undefined)));
  assert.match(aigcCss, /object-fit: contain/);
  assert.doesNotMatch(aigcCss, /object-fit: cover|scale\(/);
});

test('empty inspection is non-interactive and long original content remains intact without input mutation', () => {
  [undefined, {}, null].forEach((image) => assert.equal(harness('ImageInspection', { image, title: '没有原图' }).nodes().length, 0));
  const title = `原始长标题${'不能截断'.repeat(20)}`;
  const entry = Object.freeze({ title, meta: '原始分类', desc: `原始说明${'全文保留'.repeat(20)}` });
  const input = Object.freeze([entry]);
  const before = JSON.stringify(input);
  const photo = harness('PhotographyContact', { entries: input });
  clickPhoto(photo, 0);
  assert.ok(photo.text().includes(title));
  assert.ok(photo.text().includes(entry.desc));
  const aigc = harness('AigcExhibition', { entries: input });
  assert.ok(aigc.text().includes(title));
  assert.ok(aigc.text().includes(entry.desc));
  assert.equal(JSON.stringify(input), before);
});

test('exhibits compile local mobile/reduced-motion styles without global simulation side effects', () => {
  assert.match(css, /max-width: 760px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /\.panControls\[hidden\]/);
  assert.doesNotMatch(css, /touch-action: none|overscroll-behavior: contain/);
  assert.match(aigcCss, /max-width: 760px/);
  assert.match(aigcCss, /prefers-reduced-motion: reduce/);
  assert.match(aigcCss, /focus-visible/);
  assert.match(aigcCss, /var\(--portfolio-accent-ink/);
  assert.doesNotMatch(aigcCss, /touch-action: none|overscroll-behavior: contain/);
  ['PhotographyContact', 'AigcExhibition', 'ImageInspection'].forEach((name) => {
    assert.doesNotMatch(read(`src/components/archive/${name}.jsx`), /addEventListener|setInterval|setTimeout|requestAnimationFrame|Math\.random|fetch\(|new Audio|dangerouslySetInnerHTML/);
  });
});

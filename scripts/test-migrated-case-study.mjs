import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const data = JSON.parse(read('src/content/migrated-portfolio.json'));
const source = read('src/components/archive/MigratedCaseStudy.jsx');
const { css } = require('sass').compile(fileURLToPath(new URL('src/components/archive/migratedCaseStudy.module.scss', root)));

const React = { Fragment: 'fragment', createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const styles = new Proxy({}, { get: (_, name) => String(name) });
const compiled = require('next/dist/compiled/babel/core').transformSync(
  `${source.replace(/^import[^\n]*\n/gm, '').replace('export default function MigratedCaseStudy', 'function MigratedCaseStudy')}\nmodule.exports = MigratedCaseStudy;`,
  { filename: 'MigratedCaseStudy.test.jsx', babelrc: false, configFile: false, presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]] },
).code;

function nodes(value) {
  if (value == null || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return typeof value === 'object' ? [value, ...nodes(value.props.children)] : [];
}
function words(value) {
  if (value == null || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  return typeof value === 'object' ? words(value.props.children) : String(value);
}
function render(props) {
  const jumps = [];
  const context = {
    module: { exports: {} },
    React,
    styles,
    Image: 'Image',
    Link: 'Link',
    navigateToReadingSection: (event, id) => {
      jumps.push(id);
      event.preventDefault();
    },
  };
  vm.runInNewContext(compiled, context);
  function expand(value) {
    if (Array.isArray(value)) return value.map(expand);
    if (!value || typeof value !== 'object') return value;
    if (typeof value.type === 'function') return expand(value.type(value.props));
    return { ...value, props: { ...value.props, children: expand(value.props.children) } };
  }
  const tree = expand(context.module.exports(props));
  return { tree, nodes: nodes(tree), text: words(tree), jumps };
}
const normalize = (value) =>
  String(value)
    .replace(/右侧/g, '正文')
    .replace(/左侧(?=集中展示|放入)/g, '下方')
    .replace(/左侧/g, '导读区')
    .replace(/按分组翻页查看/g, '按目录分组查看')
    .replace(/内容按项目分组翻页/g, '内容按项目分组呈现');

function originalWords(study) {
  const texts = [study.title, study.desc];
  const notes = (items) => (items || []).forEach((note) => texts.push(note[0], note[1]));
  notes(study.notes);
  (study.groups || []).forEach((group) => texts.push(group.title, group.desc));
  (study.pages || []).forEach((page) => {
    texts.push(page.title, page.desc);
    notes(page.notes);
  });
  study.slides.forEach((slide) => {
    ['label', 'title', 'body', 'caption', 'button'].forEach((key) => {
      if (slide[key]) texts.push(slide[key]);
    });
    (slide.steps || []).forEach((step) => texts.push(step.title, step.text));
    (slide.branches || []).forEach((branch) => texts.push(branch.title, ...branch.items));
    (slide.sections || []).forEach((section) => {
      texts.push(section.title);
      if (section.text) texts.push(section.text);
      texts.push(...(section.items || []), ...(section.rows || []).flat());
    });
  });
  return [...new Set(texts.filter(Boolean))];
}

['matrix', 'drama', 'ip', 'photo', 'shortDrama'].forEach((name) => {
  test(`${name}: all original prose, notes, document cells, flows and media captions survive migration`, () => {
    const study = data[name];
    const review = name === 'matrix' ? data.modelChoice : undefined;
    const view = render({ study, title: `路由标题 ${name}`, review });
    [...originalWords(study), ...(review ? originalWords(review) : [])].forEach((text) => {
      assert.ok(view.text.includes(normalize(text)), `missing original text: ${text.slice(0, 55)}`);
    });
    assert.equal(view.nodes.filter((node) => node.props['data-source-type']).length, study.slides.length + (review?.slides.length || 0));
    const ids = view.nodes.map((node) => node.props.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length);
    view.nodes.filter((node) => node.type === 'a' && node.props.href?.startsWith('#')).forEach((node) => assert.ok(ids.includes(node.props.href.slice(1)), `missing anchor ${node.props.href}`));
  });
});

test('RAG review is nested under model-review with explicit MVP and screenshot metric boundaries', () => {
  const view = render({ study: data.matrix, title: 'RAG 文案工具', review: data.modelChoice });
  assert.ok(view.nodes.some((node) => node.props.id === 'model-review'));
  assert.ok(view.nodes.some((node) => node.type === 'a' && node.props.href === '#model-review-item-0'));
  assert.match(view.text, /未交付 MVP · 指标为目标或初步验证，不是线上成果/);
  assert.match(view.text, /因缺少达人素材授权，没有继续交付/);
  const imageCount = [...data.matrix.slides, ...data.modelChoice.slides].filter((slide) => slide.type === 'image').length;
  assert.equal(view.nodes.filter((node) => node.props.className === 'mediaNote').length, imageCount);
  assert.match(view.text, /不代表已上线成效/);
});

test('group half-open ranges keep each IP/photo image and video exactly once, with natural image dimensions', () => {
  ['ip', 'photo', 'shortDrama'].forEach((name) => {
    const study = data[name];
    const view = render({ study });
    const rendered = view.nodes.filter((node) => ['Image', 'video'].includes(node.type));
    assert.equal(rendered.length, study.slides.length);
    study.slides.forEach((slide, index) => {
      assert.equal(rendered[index].props.src, slide.src);
      assert.ok(existsSync(new URL(`public${slide.src}`, root)));
      if (slide.type === 'image') {
        assert.equal(rendered[index].props.width, slide.width);
        assert.equal(rendered[index].props.height, slide.height);
      }
    });
  });
});

test('grouped media keeps source grouping and lead images while screening gets its own layout', () => {
  ['ip', 'photo', 'shortDrama'].forEach((name) => {
    const study = data[name];
    const view = render({ study });
    const galleries = view.nodes.filter((node) => node.props.className === 'groupMedia');
    assert.equal(galleries.length, study.groups.length);
    galleries.forEach((gallery, index) => {
      const firstImage = study.slides.slice(...study.groups[index].range).findIndex((slide) => slide.type === 'image');
      const originalSlides = nodes(gallery).filter((node) => node.props['data-source-type']);
      assert.equal(originalSlides.filter((node) => node.props['data-group-lead']).length, firstImage < 0 ? 0 : 1);
      if (firstImage >= 0) assert.equal(originalSlides[firstImage].props['data-group-lead'], true);
    });
  });
  const rag = render({ study: data.matrix, review: data.modelChoice });
  assert.equal(rag.nodes.filter((node) => node.props.className === 'groupMedia').length, 0);
  assert.match(css, /\.groupMedia\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.groupMedia > \.slide\[data-source-type=video\]/);
});

test('ten original videos require user playback, never preload/autoplay or fake source replacement', () => {
  const media = ['ip', 'photo', 'shortDrama'].flatMap((name) => render({ study: data[name] }).nodes.filter((node) => node.type === 'video'));
  assert.equal(media.length, 10);
  media.forEach((video) => {
    assert.equal(video.props.controls, true);
    assert.equal(video.props.preload, 'none');
    assert.equal(video.props.playsInline, true);
    assert.equal(video.props.autoPlay, undefined);
    assert.equal(video.props.muted, undefined);
    assert.match(video.props.src, /^\/migrated-portfolio\//);
    assert.match(video.props.poster, /^\/migrated-posters\//);
    assert.ok(existsSync(new URL(`public${video.props.poster}`, root)));
  });
});

test('video intrinsic dimensions override misleading historical landscape flags before any media loads', () => {
  const study = { title: '视频资料', slides: [{ type: 'video', src: '/migrated-portfolio/portrait.mp4', label: '原视频', width: 2160, height: 3840, landscape: true }] };
  const video = render({ study }).nodes.find((node) => node.type === 'video');
  assert.equal(video.props.style.aspectRatio, '2160 / 3840');
  assert.equal(video.props['data-landscape'], false);
  assert.equal(video.props.preload, 'none');
  assert.match(css, /\.media video\[data-landscape=false\]\s*\{\s*width: min\(100%, 360px\)/);
});

test('legacy left/right directions describe current reading regions rather than claiming the whole page is just an introduction', () => {
  const rag = render({ study: data.matrix }).text;
  const interview = render({ study: data.drama }).text;
  const ip = render({ study: data.ip }).text;
  assert.doesNotMatch(rag + interview, /本页只保留导读|本页只作为快速导读/);
  assert.match(rag, /导读区只保留导读/);
  assert.match(interview, /导读区只作为快速导读/);
  assert.match(ip, /下方集中展示/);
});

test('English interview uses only original text; deployment workaround is folded and not a browser-flags link', () => {
  const view = render({ study: data.drama });
  assert.equal(view.nodes.filter((node) => ['Image', 'video', 'iframe'].includes(node.type)).length, 0);
  const notice = view.nodes.find((node) => node.type === 'details' && words(node).includes(data.drama.slides.at(-1).body));
  assert.ok(notice);
  assert.equal(notice.props.open, undefined);
  assert.match(view.text, /正式部署应使用 HTTPS，不建议关闭浏览器安全保护/);
  assert.ok(view.nodes.filter((node) => node.props.href).every((node) => !node.props.href.startsWith('chrome:')));
});

test('historical HTTP demo links remain unverified external links without network calls or embedded previews', () => {
  [data.matrix, data.drama].forEach((study) => {
    const view = render({ study });
    const external = view.nodes.filter((node) => /^http:\/\//.test(node.props.href || ''));
    assert.equal(external.length, 4, 'demo is clickable in the hero description, primary action, notes and original address section');
    external.forEach((link) => {
      assert.equal(link.props.href, study.slides[0].title);
      assert.equal(link.props.target, '_blank');
      assert.equal(link.props.rel, 'noopener noreferrer');
    });
    assert.ok(view.nodes.some((node) => node.props.className === 'demoAction' && words(node).includes('打开项目演示')));
    assert.ok(view.nodes.filter((node) => /^h[1-4]$/.test(node.type)).every((node) => !words(node).startsWith('http')));
    assert.match(view.text, /历史外链 · 当前可用性未验证/);
  });
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|fetch\(|new Audio|setInterval|requestAnimationFrame|<iframe/);
});

test('HTTP/HTTPS addresses throughout prose are real links without punctuation or browser-security links', () => {
  const study = {
    title: '链接资料',
    desc: '线上入口：https://example.com/demo。',
    notes: [['补充', '参考 https://example.com/guide。']],
    slides: [{ type: 'card', title: '线上入口', body: '链接：http://example.com/live，其他文字。https://example.com/more?x=1&y=2！javascript:alert(1) chrome://flags', kind: 'text' }],
  };
  const view = render({ study });
  const hrefs = view.nodes.filter((node) => node.type === 'a' && /^https?:/.test(node.props.href || '')).map((node) => node.props.href);
  assert.deepEqual(hrefs, ['https://example.com/demo', 'https://example.com/guide', 'http://example.com/live', 'https://example.com/more?x=1&y=2']);
  assert.ok(view.nodes.filter((node) => node.props.href).every((node) => !/^(javascript|chrome|edge):/.test(node.props.href)));
  assert.ok(view.text.includes(study.desc));
  assert.ok(view.text.includes(study.slides[0].body));
});

test('short drama separates three finished episodes, two covers and folded original footage', () => {
  const view = render({ study: data.shortDrama });
  const screening = view.nodes.find((node) => node.props.className === 'groupMedia' && node.props['data-screening'] === 'drama');
  assert.ok(screening);
  const covers = nodes(screening).find((node) => node.props.className === 'filmCovers');
  assert.equal(nodes(covers).filter((node) => node.type === 'Image').length, 2);
  const episodes = nodes(screening).find((node) => node.props.className === 'episodeStrip');
  const videos = nodes(episodes).filter((node) => node.type === 'video');
  assert.equal(videos.length, 3);
  assert.deepEqual(
    videos.map((video) => video.props['aria-label']),
    ['成品案例：二十一集', '成品案例：二十二集', '成品案例：二十三集'],
  );
  const originals = nodes(screening).find((node) => node.props.className === 'rawFootage');
  assert.equal(originals.type, 'details');
  assert.equal(originals.props.open, undefined);
  assert.equal(nodes(originals).filter((node) => node.type === 'video').length, 2);
  assert.match(css, /\.episodeStrip > div\s*\{[^}]*grid-template-columns: repeat\(3/);
});

test('IP screening uses the actual portrait-plus-two-landscape films without deleted image groups', () => {
  const view = render({ study: data.ip });
  const screening = view.nodes.find((node) => node.props.className === 'groupMedia' && node.props['data-screening'] === 'ip');
  const videos = nodes(screening).filter((node) => node.type === 'video');
  assert.equal(videos.length, 3);
  assert.deepEqual(
    videos.map((video) => video.props['data-landscape']),
    [false, true, true],
  );
  assert.equal(view.nodes.filter((node) => node.type === 'Image').length, 0);
  assert.doesNotMatch(view.text, /角色职业延展|文创风格定制工作流/);
  const group = view.nodes.find((node) => node.props.id === 'case-group-0');
  const sequence = nodes(group);
  assert.ok(sequence.indexOf(screening) < sequence.findIndex((node) => node.props.className === 'pageIntroduction'), 'finished films must precede the longer production notes');
  assert.match(css, /\.groupMedia\[data-screening=ip\] > \.slide\[data-source-type=video\]:first-child\s*\{[^}]*grid-row: 1\s*\/\s*span 2/);
});

test('screening playback pauses sibling films and closing original footage stops hidden audio', () => {
  const view = render({ study: data.shortDrama });
  const original = view.nodes.find((node) => node.props.className === 'rawFootage');
  let paused = 0;
  const other = {
    pause: () => {
      paused += 1;
    },
  };
  original.props.onToggle({ currentTarget: { open: false, querySelectorAll: () => [other, other] } });
  assert.equal(paused, 2);
  original.props.onToggle({ currentTarget: { open: true, querySelectorAll: () => [other] } });
  assert.equal(paused, 2);
  const video = view.nodes.find((node) => node.type === 'video');
  const current = {
    pause: () => {
      throw new Error('active film must not pause itself');
    },
    closest: () => ({ querySelectorAll: () => [current, other] }),
  };
  video.props.onPlay({ currentTarget: current });
  assert.equal(paused, 3);
});

test('English interview has a compact six-step practice sequence and responsive product-note columns', () => {
  const view = render({ study: data.drama });
  assert.ok(view.nodes.some((node) => node.type === 'article' && node.props['data-interview']));
  const content = view.nodes.find((node) => node.props.className === 'interviewContent');
  assert.ok(content);
  assert.equal(nodes(content).filter((node) => node.props['data-source-type']).length, 12);
  const flow = nodes(content).find((node) => node.props.className === 'flow');
  assert.equal(nodes(flow).filter((node) => node.type === 'li').length, 6);
  assert.match(css, /\.interviewContent\s*\{[^}]*grid-template-columns: repeat\(2/);
  assert.match(css, /\.interviewContent \.flow\s*\{[^}]*grid-template-columns: repeat\(3/);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*\.interviewContent\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
});

test('native reading navigation reuses the Lenis-aware handler and parent links remain immediate', () => {
  const view = render({ study: data.photo, parent: { title: '摄影', href: '/photography' } });
  const first = view.nodes.find((node) => node.type === 'a' && node.props.href === '#case-group-0');
  let prevented = false;
  first.props.onClick({
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.deepEqual(view.jumps, ['case-group-0']);
  const links = view.nodes.filter((node) => node.type === 'Link');
  assert.equal(links.length, 2);
  links.forEach((link) => {
    assert.equal(link.props.href, '/photography');
    assert.equal(link.props.onClick, undefined);
  });
});

test('local CSS compiles mobile reading layout, readable media, keyboard focus and reduced motion', () => {
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.sidebar\s*\{\s*position: static;\s*top: auto;/);
  assert.match(css, /position: sticky/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.layout\s*\{\s*display: block/);
  assert.match(css, /\.media video\s*\{[^}]*object-fit: contain/);
  assert.match(css, /\.media img\s*\{[^}]*height: auto/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.overview\s*\{[^}]*padding: 0 0 46px/);
  assert.match(css, /\.group\s*\{[^}]*padding: 0;/);
  assert.match(css, /\.review\s*\{[^}]*padding: 0;/);
  assert.doesNotMatch(css, /touch-action: none/);
  assert.equal(render({ study: null }).nodes.length, 0);
});

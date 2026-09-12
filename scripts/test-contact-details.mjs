import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const component = read('src/components/portfolio/ContactDetails.jsx');
const originalQr =
  '/Users/baiyan1/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_m0pfm40gl5ek22_7fcc/msg/file/2026-09/v5_clean_compressed - 副本 (2)/assets/wechat-qr.webp';
const originalHash = '1b961ee605e79cec53a106d6ea9844d40cb7ef98cd0447dc43f924be0733cf3f';
const qrPath = new URL('public/contact/wechat-qr.webp', root);
const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
const styles = new Proxy({}, { get: (_, key) => String(key) });
const { code } = require('next/dist/compiled/babel/core').transformSync(`${component.replace(/^import[^\n]*\n/gm, '').replace('export default ', '')}\nmodule.exports = ContactDetails;`, {
  filename: 'ContactDetails.test.jsx',
  babelrc: false,
  configFile: false,
  presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
});

function nodes(value) {
  if (!value || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return typeof value === 'object' ? [value, ...nodes(value.props.children)] : [];
}
function words(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(words).join('');
  return typeof value === 'object' ? words(value.props.children) : String(value);
}

function harness() {
  let opened = false;
  let tree;
  const focusCalls = [];
  const trigger = { current: null };
  const context = {
    module: { exports: {} },
    React,
    styles,
    Image: 'Image',
    useId: () => 'contact-test',
    useRef: () => trigger,
    useState: () => [
      opened,
      (next) => {
        opened = typeof next === 'function' ? next(opened) : next;
      },
    ],
  };
  vm.runInNewContext(code, context);
  const h = {
    render() {
      tree = context.module.exports();
      trigger.current = {
        focus: (options) => {
          focusCalls.push(options);
        },
      };
      return tree;
    },
    nodes: () => nodes(tree),
    text: () => words(tree),
    button: () => nodes(tree).find((node) => node.props.className === 'wechatTrigger'),
    panel: () => nodes(tree).find((node) => node.props.className === 'wechatPanel'),
    get focusCalls() {
      return focusCalls;
    },
    click() {
      h.button().props.onClick();
      h.render();
    },
    key(node, key) {
      let prevented = false;
      node.props.onKeyDown({
        key,
        preventDefault: () => {
          prevented = true;
        },
      });
      h.render();
      return prevented;
    },
  };
  h.render();
  return h;
}

test('only the authorized original phone and retained email become direct contact links', () => {
  const h = harness();
  const anchors = h.nodes().filter((node) => node.type === 'a');
  assert.equal(anchors.find((node) => node.props.href.startsWith('mailto:')).props.href, 'mailto:2907107669@qq.com');
  assert.equal(anchors.find((node) => node.props.href.startsWith('tel:')).props.href, 'tel:13157682817');
  anchors.forEach((node) => assert.equal(node.props.onClick, undefined));
  assert.match(h.text(), /2907107669@qq\.com/);
  assert.match(h.text(), /13157682817/);
  assert.match(h.text(), /AI 产品实践 · 内容工作流 · 视觉创作/);
  assert.doesNotMatch(h.text(), /求职|实习机会|履历|商业回报/);
});

test('QR starts closed and actual clicks reveal and collapse the locally controlled region', () => {
  const h = harness();
  assert.equal(h.panel().props.hidden, true);
  assert.equal(h.button().props['aria-expanded'], false);
  assert.equal(h.button().props['aria-controls'], h.panel().props.id);
  assert.equal(h.panel().props.role, 'region');
  h.click();
  assert.equal(h.panel().props.hidden, false);
  assert.equal(h.button().props['aria-expanded'], true);
  assert.match(words(h.button()), /收起二维码/);
  h.click();
  assert.equal(h.panel().props.hidden, true);
  assert.equal(h.button().props['aria-expanded'], false);
});

test('Enter and Space stay native button activation, not custom or hover-only shortcuts', () => {
  const h = harness();
  assert.equal(h.button().type, 'button');
  assert.equal(h.button().props.type, 'button');
  ['Enter', ' ', 'Tab'].forEach((key) => assert.equal(h.key(h.button(), key), false));
  h.click();
  assert.equal(h.panel().props.hidden, false);
  h.nodes().forEach((node) => {
    ['onMouseEnter', 'onMouseLeave', 'onPointerEnter', 'onPointerLeave', 'onWheel', 'onTouchMove'].forEach((event) => assert.equal(node.props[event], undefined));
  });
});

test('close action and Escape close in place and return focus without scrolling', () => {
  const h = harness();
  assert.equal(h.key(h.button(), 'Escape'), false, 'closed control does not consume Escape');
  assert.equal(h.focusCalls.length, 0);
  h.click();
  const close = h.nodes().find((node) => node.type === 'button' && words(node) === '收起');
  close.props.onClick();
  h.render();
  assert.equal(h.panel().props.hidden, true);
  assert.equal(h.focusCalls.length, 1);
  assert.equal(h.focusCalls[0].preventScroll, true);
  h.click();
  assert.equal(h.key(h.button(), 'Escape'), true);
  assert.equal(h.panel().props.hidden, true);
  assert.equal(h.focusCalls.length, 2);
  h.click();
  const originalLink = h.nodes().find((node) => node.props.className === 'original');
  assert.equal(h.key(originalLink, 'Escape'), true);
  assert.equal(h.panel().props.hidden, true);
  assert.equal(h.focusCalls.length, 3);
});

test('QR keeps exact original pixel dimensions and bypasses image optimizer and crop', () => {
  const h = harness();
  const image = h.nodes().find((node) => node.type === 'Image');
  assert.equal(image.props.src, '/contact/wechat-qr.webp');
  assert.equal(image.props.width, 735);
  assert.equal(image.props.height, 750);
  assert.equal(image.props.unoptimized, true);
  assert.equal(image.props.fill, undefined);
  assert.equal(image.props.alt, '微信联系二维码');
  h.click();
  assert.equal(h.nodes().find((node) => node.type === 'Image').props.src, image.props.src);
  const original = h.nodes().find((node) => node.props.className === 'original');
  assert.equal(original.props.href, image.props.src);
  assert.equal(original.props.target, '_blank');
  assert.equal(original.props.rel, 'noopener noreferrer');
  assert.match(words(original), /在新窗口打开/);
});

test('copied QR bytes match the supplied source checksum, with no re-encoding', async () => {
  const bytes = readFileSync(qrPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), originalHash);
  if (existsSync(originalQr)) assert.ok(bytes.equals(readFileSync(originalQr)));
  const metadata = await require('sharp')(bytes).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 735);
  assert.equal(metadata.height, 750);
});

test('white quiet-zone, responsive containment, focus and reduced motion compile locally', () => {
  const { css } = require('sass').compile(fileURLToPath(new URL('src/components/portfolio/contactDetails.module.scss', root)));
  assert.match(css, /\.qrPaper[\s\S]*?padding: 12px;[\s\S]*?background: #fff;/);
  assert.match(css, /\.qrImage[\s\S]*?height: auto;[\s\S]*?object-fit: contain;/);
  assert.match(css, /\.wechatPanel\[hidden\]/);
  assert.match(css, /max-width: 600px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /position: fixed|backdrop-filter|blur\(|object-fit: cover|mix-blend-mode: (?!normal)/);
});

test('footer mounts the contact module while existing header/mail actions remain unchanged', () => {
  const source = read('src/components/portfolio/PortfolioShell.jsx');
  assert.match(source, /import ContactDetails from '\.\/ContactDetails';/);
  const footer = source.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.equal((footer.match(/<ContactDetails\s*\/>/g) || []).length, 1);
  assert.match(footer, /mailto:2907107669@qq\.com/);
  assert.match(source, /className=\{styles\.contactLink\} data-magnetic href="mailto:2907107669@qq\.com"/);
  assert.ok(!source.includes('styles.footerInfo'));
  assert.doesNotMatch(component, /addEventListener|setInterval|setTimeout|fetch\(|dialog|aria-modal|dangerouslySetInnerHTML|document\.|window\./);
});

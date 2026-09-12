import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, root), 'utf8');
const baseProjects = vm.runInNewContext(read('src/constants/projects.js').replace('export default sortedProjects;', 'sortedProjects;'));
const migratedProjectEntries = vm.runInNewContext(read('src/constants/migratedPortfolio.js').replaceAll('export const', 'const') + '\nmigratedProjectEntries;');
const projects = vm.runInNewContext(read('src/constants/homeCarousel.js').replace(/^import[^\n]*\n/gm, '').replace('export default homeCarousel;', 'homeCarousel;'), { projects: baseProjects, migratedProjectEntries });
const source = read('src/components/portfolio/FeaturedScreening.jsx');
const compiled = require('next/dist/compiled/babel/core').transformSync(source.replace(/^import[^\n]*\n/gm, '').replace('export default function', 'function') + '\nmodule.exports = FeaturedScreening;', {
  babelrc: false, configFile: false,
  presets: [[require.resolve('next/dist/compiled/babel/preset-react'), { runtime: 'classic' }]],
}).code;
const walk = (x) => Array.isArray(x) ? x.flatMap(walk) : x && typeof x === 'object' ? [x, ...walk(x.props?.children)] : [];
const words = (x) => Array.isArray(x) ? x.map(words).join('') : x && typeof x === 'object' ? words(x.props?.children) : x == null ? '' : String(x);
function harness() {
  const state = [], refs = [];
  let stateIndex = 0, refIndex = 0;
  const context = {
    module: {exports:{}}, projects, Image:'Image', Link:'Link',
    styles: new Proxy({}, {get:(_,k)=>k}),
    React:{createElement:(type,props,...children)=>({type,props:{...props,children}})},
    useState:(initial)=>{ const i=stateIndex++; if(state[i]===undefined)state[i]=initial; return [state[i],(n)=>{state[i]=typeof n==='function'?n(state[i]):n;}]; }, useRef:(initial)=>{const i=refIndex++; refs[i]??={current:initial};return refs[i];},useId:()=> 'featured',useEffect:()=>{},
  };
  vm.runInNewContext(compiled, context);
  return ()=>{stateIndex=0;refIndex=0;return walk(context.module.exports());};
}
test('all seven genuine projects are selectable and only one occupies the carousel', ()=>{
  const render=harness(), nodes=render();
  const buttons=nodes.filter(n=>n.props.className==='select');
  assert.equal(buttons.length,7);
  projects.forEach(p=>assert.ok(buttons.some(n=>words(n).includes(p.title))));
  assert.equal(nodes.filter(n=>n.props.className==='scene').length,1);
  assert.equal(nodes.find(n=>n.props.className==='scene').props['data-case'],'project1');
  assert.equal(buttons[0].props['aria-pressed'],true);
  assert.equal(nodes.find(n=>n.props.className==='open').props.href,projects[0].link);
});
test('selection synchronizes title, original media, summary, status and destination', ()=>{
  const render=harness();
  render().filter(n=>n.props.className==='select')[1].props.onClick();
  const nodes=render(), p=projects[1];
  assert.equal(nodes.find(n=>n.props.className==='scene').props['data-case'],p.id);
  assert.equal(nodes.find(n=>n.props.className==='art').props.src,p.img);
  assert.equal(words(nodes.find(n=>n.props.className==='summary')),p.summary);
  assert.equal(nodes.find(n=>n.props.className==='open').props.href,p.link);
  assert.ok(words(nodes.find(n=>n.props.role==='status')).includes(p.title));
  nodes.filter(n=>n.props.className==='select')[0].props.onClick();
  assert.equal(render().find(n=>n.props.className==='scene').props['data-case'],'project1');
});
test('autoplay is bounded, paused for reading and cleaned up without scroll trapping', ()=>{
  assert.doesNotMatch(source,/preventDefault|requestAnimationFrame|<video|https:\/\//);
  for(const guard of ['IntersectionObserver','document.hidden',':hover, :focus-within','clearInterval','observer.disconnect','prefers-reduced-motion: reduce']) assert.ok(source.includes(guard));
  assert.match(source,/media.revert/);
  assert.match(source,/context.revert/);
  assert.match(source,/prefers-reduced-motion: no-preference/);
  assert.match(read('src/constants/homeCarousel.js'),/概念封面/);
  assert.match(read('src/pages/index.page.jsx'),/<FeaturedScreening/);
});
test('next, previous, pause and swipe work across the entire project collection', ()=>{
  const render=harness();
  const button=(name)=>render().find(n=>n.props['aria-label']===name);
  button('上一个项目').props.onClick();
  assert.equal(render().find(n=>n.props.className==='scene').props['data-case'],projects[6].id);
  button('下一个项目').props.onClick();
  assert.equal(render().find(n=>n.props.className==='scene').props['data-case'],projects[0].id);
  render().find(n=>n.props.className==='playControl').props.onClick();
  assert.equal(render().find(n=>n.props.role==='status').props['aria-live'],'polite');
  const stage=render().find(n=>n.props.className==='stage');
  stage.props.onTouchStart({touches:[{clientX:200,clientY:100}]});
  stage.props.onTouchEnd({changedTouches:[{clientX:90,clientY:105}]});
  assert.equal(render().find(n=>n.props.className==='scene').props['data-case'],projects[1].id);
  stage.props.onTouchStart({touches:[{clientX:200,clientY:100}]});
  stage.props.onTouchEnd({changedTouches:[{clientX:190,clientY:300}]});
  assert.equal(render().find(n=>n.props.className==='scene').props['data-case'],projects[1].id);
});
test('every slide has a real destination and original media or an explicitly labeled flow', ()=>{
  const render=harness();
  projects.forEach((p,i)=>{
    render().filter(n=>n.props.className==='select')[i].props.onClick();
    const nodes=render();
    assert.equal(nodes.find(n=>n.props.className==='open').props.href,p.link);
    if(p.img) assert.ok(fs.existsSync(new URL(`public${p.img}`,root)));
    else {assert.equal(p.steps.length,6);assert.match(p.source,/非界面截图/);}
  });
});
test('styles compile with mobile layout, focus and motion-free fallback', ()=>{
  const css=require('sass').compile(new URL('src/components/portfolio/featuredScreening.module.scss',root).pathname).css;
  assert.match(css,/@media \(max-width: 760px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css,/animation: none/);
  assert.match(css,/\.shutter\s*\{\s*display: none/);
});

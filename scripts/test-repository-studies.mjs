import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const studies = vm.runInNewContext(read('src/constants/repositoryStudies.js').replace('export default repositoryStudies;', 'repositoryStudies;'));

test('four substantive local cases have real image files, matching dimensions and text introductions', async () => {
  assert.equal(Object.keys(studies).length, 4);
  for (const [slug, study] of Object.entries(studies)) {
    const section = ['adcanvas', 'open-llm-vtuber-companion'].includes(slug) ? 'more-projects' : 'personal-skills';
    assert.ok(fs.existsSync(new URL(`src/pages/${section}/${slug}.page.jsx`, root)));
    assert.ok(study.notes.length >= 3);
    assert.ok(study.slides.filter((slide) => slide.type === 'card').length >= 3);
    const media = study.slides.filter((slide) => slide.type === 'image');
    assert.ok(media.length >= 2);
    for (const slide of media) {
      const metadata = await sharp(fs.readFileSync(new URL(`public${slide.src}`, root))).metadata();
      assert.equal(metadata.width, slide.width);
      assert.equal(metadata.height, slide.height);
      assert.ok(slide.caption.length > 20);
    }
  }
});

test('sources, derivative attribution and verification boundaries remain explicit', () => {
  assert.match(JSON.stringify(studies.adcanvas), /SankaiAI.*TwitCanva/);
  assert.match(JSON.stringify(studies.adcanvas), /未执行图像或视频生成/);
  assert.match(JSON.stringify(studies['open-llm-vtuber-companion']), /未启动聊天推理/);
  assert.match(JSON.stringify(studies['geo-seo-cn']), /不证明.*已经收录/);
  assert.match(JSON.stringify(studies['remotion-talking-head-inserts']), /第 7 秒/);
  assert.match(read('src/components/archive/RepositoryCase.jsx'), /MigratedCaseStudy/);
  for (const study of Object.values(studies)) assert.match(study.repository, /^https:\/\/github.com\/axbgs123\//);
});

test('project narratives explain derivative changes and companion uses scenario captures', () => {
  const companion = studies['open-llm-vtuber-companion'];
  assert.match(companion.desc, /与朋友/);
  assert.ok(companion.slides.filter((slide) => slide.title?.startsWith('改动')).length >= 5);
  assert.deepEqual(Array.from(companion.slides.filter((slide) => slide.type === 'image'), (slide) => slide.src), [
    '/repository-cases/companion-persona-use.png',
    '/repository-cases/companion-memory-use.png',
    '/repository-cases/companion-commitments-use.png',
  ]);
  assert.ok(studies.adcanvas.slides.filter((slide) => slide.title?.startsWith('改动')).length >= 4);
  assert.match(JSON.stringify(studies.adcanvas), /下游.*过期/);
});

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const run = promisify(execFile);
const archivePath = '/Users/baiyan1/Documents/文稿/运营AI平台-作品集文档/运营AI平台-作品集文档包.zip';
const outputDir = path.resolve('public/project1');
const contentImageDir = path.resolve('public/project1/content');
const contentSourceDir = path.resolve('src/content/project1-source');
const contentMapPath = path.resolve('src/content/project1-assets.json');
const tempDir = await mkdtemp(path.join(tmpdir(), 'operations-ai-'));

const screenshots = [
  ['01-公开Demo-最新版.png', '1.webp'],
  ['02-工作台总览.png', '2.webp'],
  ['03-账号仪表盘.png', '3.webp'],
  ['04-数据导入中心.png', '4.webp'],
  ['05-分析中心.png', '5.webp'],
  ['06-爆款素材库.png', '6.webp'],
  ['07-事实资料中心.png', '7.webp'],
  ['08-五步生成复核.png', '8.webp'],
  ['09-发布前检查.png', '9.webp'],
  ['10-风控知识库.png', '10.webp'],
  ['11-导出与备份.png', '11.webp'],
  ['12-工作区设置.png', '12.webp'],
  ['13-移动端两级导航.png', '13.webp'],
  ['14-移动端内容详情.png', '14.webp'],
  ['15-易懂模式与页面引导.png', '15.webp'],
  ['16-运营智能体对话.png', '16.webp'],
  ['17-运营智能体任务与执行.png', '17.webp'],
  ['18-热点截图与研究.png', '18.webp'],
  ['19-模型配置与连接验证.png', '19.webp'],
];

const contentDocuments = ['01-项目总览.md', '02-产品背景与核心闭环.md', '03-核心功能与组件说明.md', '04-技术架构与工程亮点.md'];

try {
  await mkdir(outputDir, { recursive: true });
  await mkdir(contentImageDir, { recursive: true });
  await mkdir(contentSourceDir, { recursive: true });
  await run('/usr/bin/ditto', ['-x', '-k', archivePath, tempDir]);
  const screenshotDir = path.join(tempDir, 'screenshots');
  const componentDir = path.join(screenshotDir, 'components');
  const markdownDir = path.join(tempDir, 'markdown');

  await Promise.all(
    screenshots.map(([sourceName, outputName]) =>
      sharp(path.join(screenshotDir, sourceName)).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toFile(path.join(outputDir, outputName)),
    ),
  );

  await sharp(path.join(screenshotDir, '01-公开Demo-最新版.png'))
    .rotate()
    .resize({ width: 1600, height: 750, fit: 'cover', position: 'top' })
    .webp({ quality: 86, effort: 4 })
    .toFile(path.join(outputDir, 'project1.webp'));

  const fullPageFiles = (await readdir(screenshotDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.png')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const componentFiles = (await readdir(componentDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.png')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const processContentImages = (files, sourceDirectory, prefix, sourcePrefix) =>
    Promise.all(
      files.map(async (file, index) => {
        const outputName = `${prefix}-${String(index + 1).padStart(3, '0')}.webp`;
        await sharp(path.join(sourceDirectory, file)).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toFile(path.join(contentImageDir, outputName));
        return [`${sourcePrefix}/${file}`, `/project1/content/${outputName}`];
      }),
    );

  const [fullPageEntries, componentEntries] = await Promise.all([
    processContentImages(fullPageFiles, screenshotDir, 'page', '../screenshots'),
    processContentImages(componentFiles, componentDir, 'component', '../screenshots/components'),
  ]);

  await Promise.all(contentDocuments.map((file) => copyFile(path.join(markdownDir, file), path.join(contentSourceDir, file))));
  await writeFile(contentMapPath, `${JSON.stringify(Object.fromEntries([...fullPageEntries, ...componentEntries]), null, 2)}\n`, 'utf8');
  process.stdout.write(`Generated ${screenshots.length} gallery screenshots, ${fullPageEntries.length + componentEntries.length} content images, and one cover.\n`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

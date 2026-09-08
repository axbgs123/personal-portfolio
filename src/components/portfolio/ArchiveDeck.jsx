import { useRef, useState } from 'react';
import Link from 'next/link';
import archiveLinks from '@src/components/dom/navbar/constants/archiveLinks';
import styles from './archiveDeck.module.scss';

// Previews point to existing material. Empty categories do not imply published work.
const contents = {
  '/more-projects': {
    code: 'PROJECTS',
    symbol: '↗',
    description: '从真实问题出发，查看产品方案、工作流程与交付细节。',
    previews: [
      { title: 'AI 运营智能体与内容分析生成平台', href: '/projects/project1' },
      { title: '百言 GEO 内容增长系统', href: '/projects/project2' },
    ],
  },
  '/tutorials': {
    code: 'TUTORIALS',
    symbol: '⌘',
    description: '课程配套资料、AI 工具、图像与视频提示词，以及完整图文教程。',
    previews: [
      { title: 'Codex 视频课配套资料', href: '/tutorials/codex-course' },
      { title: '图文教程', href: '/tutorials/illustrated' },
    ],
  },
  '/photography': { code: 'PHOTOGRAPHY', symbol: '◉', description: '摄影与视觉记录。', previews: [] },
  '/writing': {
    code: 'WRITING',
    symbol: '¶',
    description: '关于 AI、科技与商业变化的观察，也记录实践中的判断与问题。',
    previews: [
      { title: '豆包手机被围堵后，大家为什么还要往里冲？', href: '/writing/doubao-phone-rush' },
      { title: 'FDE 不是新岗位——AI时代真正稀缺的是这四种能力', href: '/writing/fde-four-capabilities' },
    ],
  },
  '/personal-skills': { code: 'PERSONAL SKILLS', symbol: '⌥', description: '个人方法与可复用的 AI 工作流。', previews: [] },
  '/aigc': { code: 'AIGC', symbol: '✳', description: '图像、视频与生成式创作的入口。', previews: [] },
};

export default function ArchiveDeck({ path, onFollow }) {
  const [selected, setSelected] = useState(() => {
    const index = archiveLinks.findIndex((link) => path === link.href || path.startsWith(`${link.href}/`) || (link.href === '/more-projects' && path.startsWith('/projects')));
    return Math.max(0, index);
  });
  const buttons = useRef([]);
  const current = archiveLinks[selected];
  const content = contents[current.href];

  const onKey = (event, index) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % archiveLinks.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + archiveLinks.length) % archiveLinks.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = archiveLinks.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  };

  const follow = (event, href) => {
    // Preserve native new-tab clicks and the site's captured route transition.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    onFollow?.(href);
  };

  return (
    <div className={styles.deck}>
      <div className={styles.preview} data-menu-reveal>
        <p className={styles.eyebrow}>ARCHIVE / 个人仓库</p>
        <div className={styles.previewCopy} key={current.href}>
          <h2 id="archive-category-title">{current.title}</h2>
          <p className={styles.description}>{content.description}</p>
          <Link className={styles.enter} href={current.href} scroll={false} onClick={(event) => follow(event, current.href)}>
            进入{current.title}
            <span aria-hidden="true">↗</span>
          </Link>
          {content.previews.length > 0 ? (
            <div className={styles.previews} aria-label={`${current.title}中的内容`}>
              <p>也可以直接打开</p>
              {content.previews.map((item) => (
                <Link key={item.href} href={item.href} scroll={false} onClick={(event) => follow(event, item.href)}>
                  {item.title}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>进入分类查看</p>
          )}
        </div>
      </div>
      <div className={styles.fan} data-menu-reveal>
        <div className={styles.sheets} aria-hidden="true">
          {archiveLinks.map((link, index) => (
            <div className={styles.folder} style={{ '--folder-index': index }} data-selected={selected === index} key={link.href}>
              <span className={styles.folderTab} />
              <span className={styles.folderSymbol}>{contents[link.href].symbol}</span>
              <span className={styles.folderCode}>{contents[link.href].code}</span>
            </div>
          ))}
        </div>
        <div className={styles.rail} role="group" aria-label="六个仓库分类，选择预览或点击箭头直接进入">
          {archiveLinks.map((link, index) => (
            <div className={styles.option} key={link.href} data-selected={selected === index} style={{ '--folder-index': index }}>
              <button
                type="button"
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                aria-pressed={selected === index}
                aria-label={`预览${link.title}`}
                onPointerEnter={(event) => {
                  if (event.pointerType !== 'touch') setSelected(index);
                }}
                onFocus={() => setSelected(index)}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => onKey(event, index)}
              >
                <span className={styles.optionMark} aria-hidden="true" />
                {link.title}
              </button>
              <Link
                href={link.href}
                scroll={false}
                aria-label={`进入${link.title}`}
                aria-current={path === link.href || path.startsWith(`${link.href}/`) ? 'page' : undefined}
                onFocus={() => setSelected(index)}
                onPointerEnter={(event) => {
                  if (event.pointerType !== 'touch') setSelected(index);
                }}
                onClick={(event) => follow(event, link.href)}
              >
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ))}
        </div>
        <p className={styles.hint}>
          选择页签，展开档案<span aria-hidden="true">↗</span>
        </p>
      </div>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import aiToolDocuments from '@src/constants/aiToolDocuments';
import illustratedTutorials from '@src/constants/illustratedTutorials';
import courseToc from '@src/content/codex-course-toc.json';
import { useStore } from '@src/store';
import getSectionScrollTop from '@src/pages/tutorials/components/getSectionScrollTop';
import TutorialFrame from './TutorialFrame';
import styles from './tutorialRouter.module.scss';

/* Compact plan: four working publications, not a direction controller.
 * Paper #f6f6f6 / page #ffffff / ink #090909 / grey #686868 / rule #cdcdcd;
 * vermilion #d74436 accents binding and controls. Haas + PingFang titles/body;
 * portfolio mono labels actual formats. Desktop: | spine + pages | spine | spine | spine |.
 * Mobile: horizontal spines, their own accordion pages. The signature is a real
 * index unfolding from a narrow binding; restrained 2D motion, no fake covers.
 * Critique: title links navigate immediately; separate buttons reveal actual
 * chapters, PDFs and final covers instead of switching a decorative summary.
 * The source TOC has 13 chapter groups; all counts come from the actual arrays.
 */

// Exact existing resource names from ai-prompts.page.jsx; sharing links stay there.
const PROMPT_TITLES = ['GPT Image 2 百例提示词', 'Nano Banana 生图提示词', 'Midjourney V7 高级提示词', 'Stable Diffusion 提示词大全'];

function publicationLabel(href) {
  if (href === '/tutorials/codex-course') return `${courseToc.length} 章节`;
  if (href === '/tutorials/ai-tools') return `${aiToolDocuments.length} 份文档`;
  if (href === '/tutorials/illustrated') return `${illustratedTutorials.length} 组图文`;
  return '生图 / 视频';
}

function VolumeContents({ entry }) {
  if (entry.href === '/tutorials/codex-course') {
    return (
      <ol className={styles.chapterIndex} aria-label="Codex 课程原始目录">
        {courseToc.map((chapter) => (
          <li key={chapter.id}>
            <Link scroll={false} href={`${entry.href}#${chapter.id}`}>
              <span>{chapter.title}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ol>
    );
  }
  if (entry.href === '/tutorials/ai-tools') {
    return (
      <ul className={styles.documentIndex} aria-label="AI 工具原始文档">
        {aiToolDocuments.map((document) => (
          <li key={document.slug}>
            <Link scroll={false} href={`${entry.href}/${document.slug}`}>
              <span>{document.title}</span>
              <span className={styles.documentFormat}>
                PDF <span aria-hidden="true">↗</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (entry.href === '/tutorials/illustrated') {
    return (
      <div className={styles.illustratedIndex}>
        <p className={styles.contentsLabel}>翻看其中四组</p>
        <ul className={styles.coverIndex} aria-label="图文教程成品预览">
          {illustratedTutorials.slice(0, 4).map((tutorial) => (
            <li key={tutorial.slug}>
              <Link scroll={false} href={`${entry.href}/${tutorial.slug}`}>
                <div className={styles.coverImage}>
                  <Image src={tutorial.cover} alt={tutorial.title} width={tutorial.width} height={tutorial.height} sizes="(max-width: 900px) 42vw, 230px" />
                </div>
                <span className={styles.coverTitle}>{tutorial.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className={styles.promptIndex}>
      <p className={styles.contentsLabel}>生图提示词 · 四份原始资料</p>
      <ul className={styles.promptTitles}>
        {PROMPT_TITLES.map((title) => (
          <li key={title}>
            <Link scroll={false} href={`${entry.href}#image-prompts`}>
              <span>{title}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link scroll={false} href={`${entry.href}#video-prompts`} className={styles.videoLink}>
        <span>
          视频提示词<span className={styles.videoNote}>保留原链接，不托管视频</span>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}

export default function TutorialWorkbench({ page }) {
  const [selected, setSelected] = useState(0);
  const controls = useRef([]);
  const pendingOpen = useRef(null);
  const shelfId = useId();

  useEffect(() => {
    const requested = pendingOpen.current;
    pendingOpen.current = null;
    if (selected === null || requested !== selected || !window.matchMedia('(max-width: 900px)').matches) return undefined;
    // Wait for the previous accordion page to collapse before measuring the
    // new spine. Reuse the site's fixed-header / main-scroller coordinates.
    const frame = requestAnimationFrame(() => {
      if (!window.matchMedia('(max-width: 900px)').matches) return;
      const spine = controls.current[selected]?.closest('[data-tutorial-spine]');
      if (!spine?.isConnected) return;
      const top = getSectionScrollTop(spine);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const { lenis } = useStore.getState();
      if (lenis) {
        lenis.resize();
        lenis.scrollTo(top, { immediate: reduced, duration: 0.45, force: true });
      } else {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
        else window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  const selectVolume = (next) => {
    pendingOpen.current = next !== null && next !== selected ? next : null;
    setSelected(next);
  };

  const chooseVolume = (event, index) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const last = page.entries.length - 1;
    const next = { ArrowRight: Math.min(last, index + 1), ArrowDown: Math.min(last, index + 1), ArrowLeft: Math.max(0, index - 1), ArrowUp: Math.max(0, index - 1), Home: 0, End: last }[event.key];
    if (next === undefined || !page.entries[next]) return;
    event.preventDefault();
    selectVolume(next);
    controls.current[next]?.focus({ preventScroll: true });
  };

  return (
    <TutorialFrame title={page.title} description={page.intro} keywords={page.keywords} index kind="publication-shelf">
      <div className={styles.shelf} data-open={selected !== null}>
        {page.entries.map((entry, index) => {
          const open = selected === index;
          const contentsId = `${shelfId}-contents-${index}`;
          const titleId = `${shelfId}-title-${index}`;
          return (
            <article className={styles.volume} key={entry.href} data-open={open} style={{ '--volume-step': index }}>
              <div className={styles.spine} data-tutorial-spine>
                <span className={styles.spineMeta}>{entry.meta}</span>
                <h2 className={styles.spineTitle} id={titleId}>
                  <Link scroll={false} href={entry.href} aria-label={`打开${entry.title}`}>
                    {entry.title}
                    <span className={styles.titleArrow} aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </h2>
                <span className={styles.spineCount}>{publicationLabel(entry.href)}</span>
                <button
                  className={styles.previewToggle}
                  type="button"
                  aria-label={`${(open ? '收起' : '展开') + entry.title}目录`}
                  aria-expanded={open}
                  aria-controls={contentsId}
                  onClick={() => selectVolume(open ? null : index)}
                  onKeyDown={(event) => chooseVolume(event, index)}
                  ref={(element) => {
                    controls.current[index] = element;
                  }}
                >
                  <span>{open ? '收起' : '展开'}</span>
                  <span aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
              </div>
              <div className={styles.pages} hidden={!open} id={contentsId} role="region" aria-labelledby={titleId}>
                <header className={styles.pageHeading}>
                  <div>
                    <span>{publicationLabel(entry.href)}</span>
                    <span>{entry.status}</span>
                  </div>
                  <h3>{entry.title}</h3>
                </header>
                <div className={styles.contents}>
                  <VolumeContents entry={entry} />
                </div>
                <Link scroll={false} href={entry.href} className={styles.viewAll}>
                  <span>
                    查看全部<span className={styles.viewAllTitle}> · {entry.title}</span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </TutorialFrame>
  );
}

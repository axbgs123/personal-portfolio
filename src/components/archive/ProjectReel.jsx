import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './projectReel.module.scss';

/*
 * Two product cases, one editorial reel. Paper #F6F6F6 / ink #090909 /
 * white #FFFFFF / silver #CDCDCD / muted #686868; the shared accent only marks
 * actions. Existing Haas display, Chinese body fallback and monospaced captions.
 * The signature is a change of image framing: two tall cuts open into one whole
 * landscape cover. Titles remain ordinary links; opening a case is never gated
 * behind the preview interaction. No slide autoplay, drag capture or global RAF.
 */

function CaseLink({ entry, className, children }) {
  if (/^https?:\/\//i.test(entry.href || '')) {
    return (
      <a className={className} href={entry.href} target="_blank" rel="noopener noreferrer">
        {children}
        <span className={styles.srOnly}>，在新窗口打开</span>
      </a>
    );
  }
  if (/^\/(?!\/)/.test(entry.href || '')) {
    return (
      <Link className={className} href={entry.href} scroll={false}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}

export default function ProjectReel({ entries = [] }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const id = useId();
  const cases = entries.filter((entry) => entry?.title);
  const keyOf = (entry) => entry.href || entry.title;
  const expandedIndex = cases.findIndex((entry) => keyOf(entry) === expandedKey);
  const expanded = expandedIndex >= 0;

  const changePreview = (direction) => {
    if (!cases.length) return;
    let origin = expandedIndex;
    if (!expanded) origin = direction > 0 ? -1 : 0;
    const next = (origin + direction + cases.length) % cases.length;
    setExpandedKey(keyOf(cases[next]));
  };

  if (!cases.length) return <p className={styles.empty}>项目资料待补充。</p>;

  return (
    <section className={styles.reel} aria-label="产品案例预览" data-instrument="project-reel">
      <div className={styles.toolbar}>
        <div className={styles.caption}>
          <span>产品案例</span>
          <span className={styles.caseCount}>{cases.length} 个案例</span>
        </div>
        <div className={styles.controls} role="group" aria-label="切换案例预览">
          <button type="button" className={styles.overview} onClick={() => setExpandedKey(null)} disabled={!expanded} aria-controls={`${id}-stage`}>
            并置查看
          </button>
          <button type="button" className={styles.step} onClick={() => changePreview(-1)} disabled={cases.length < 2} aria-label="上一案例预览" aria-controls={`${id}-stage`}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className={styles.step} onClick={() => changePreview(1)} disabled={cases.length < 2} aria-label="下一案例预览" aria-controls={`${id}-stage`}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className={styles.stage} id={`${id}-stage`} data-expanded={expanded}>
        {cases.map((entry, index) => {
          const key = keyOf(entry);
          const selected = expanded && index === expandedIndex;
          const compact = expanded && !selected;
          const hasDestination = /^(?:https?:\/\/|\/(?!\/))/i.test(entry.href || '');
          return (
            <article className={styles.case} key={key} data-selected={selected} data-compact={compact} aria-labelledby={`${id}-title-${index}`}>
              <header className={styles.content}>
                <p className={styles.meta}>{entry.meta}</p>
                <h2 className={styles.title} id={`${id}-title-${index}`}>
                  <CaseLink entry={entry}>{entry.title}</CaseLink>
                </h2>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.expand}
                    aria-expanded={selected}
                    aria-controls={`${id}-preview-${index}`}
                    aria-label={`${selected ? '收起' : '展开'}案例预览：${entry.title}`}
                    onClick={() => setExpandedKey(selected ? null : key)}
                  >
                    <span>{selected ? '收起案例预览' : '展开案例预览'}</span>
                    <span className={styles.expandMark} aria-hidden="true">
                      {selected ? '−' : '＋'}
                    </span>
                  </button>
                  {hasDestination && (
                    <CaseLink entry={entry} className={styles.destination}>
                      <span>{entry.linkLabel || '查看完整案例'}</span>
                      <span aria-hidden="true">↗</span>
                    </CaseLink>
                  )}
                </div>
              </header>
              <div className={styles.picture}>
                <div className={styles.imageMask}>
                  {entry.image?.src ? (
                    <Image
                      className={styles.image}
                      src={entry.image.src}
                      alt={entry.image.alt || `${entry.title} · 项目封面`}
                      fill
                      sizes="(max-width: 740px) calc(100vw - 40px), (max-width: 1200px) 80vw, 1100px"
                      style={{ objectFit: selected ? 'contain' : entry.image.fit || 'cover' }}
                    />
                  ) : (
                    <span className={styles.missingImage}>项目封面待补充</span>
                  )}
                </div>
                <span className={styles.edgeLabel} aria-hidden="true">
                  {entry.meta}
                </span>
              </div>
              <div className={styles.preview} id={`${id}-preview-${index}`} hidden={!selected} aria-hidden={!selected}>
                {entry.desc && <p>{entry.desc}</p>}
              </div>
            </article>
          );
        })}
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {expanded ? `当前预览：${cases[expandedIndex].title}` : `${cases.length} 个案例并置展示`}
      </p>
    </section>
  );
}

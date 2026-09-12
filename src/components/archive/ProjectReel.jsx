import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './projectReel.module.scss';

/*
 * Product cases, one editorial reel. Paper #F6F6F6 / ink #090909 /
 * white #FFFFFF / silver #CDCDCD / muted #686868; the shared accent only marks
 * actions. Existing Haas display, Chinese body fallback and monospaced captions.
 * The signature is a change of image framing: two tall cuts open into one whole
 * landscape cover. Larger collections use a product comparison desk: a viewing
 * surface and a continuous illustrated index, not another grid of cards. Blue
 * #315BE8 / ink #2649BD / tint #E8EDFF mark the selected print and its destination.
 * Titles remain ordinary links; opening a case is never gated
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

function DeskMedia({ entry, thumbnail = false }) {
  if (entry.image?.src) {
    return (
      <Image
        className={styles.deskImage}
        src={entry.image.src}
        alt={thumbnail ? '' : entry.image.alt || `${entry.title} · 项目封面`}
        fill
        sizes={thumbnail ? '110px' : '(max-width: 740px) calc(100vw - 40px), 55vw'}
        style={{ objectFit: thumbnail ? entry.image.fit || 'cover' : 'contain' }}
      />
    );
  }
  if (entry.preview?.steps?.length) {
    if (thumbnail)
      return (
        <span className={styles.deskFlowThumb} aria-hidden="true">
          Aa<span>↔</span>
        </span>
      );
    return (
      <div className={styles.deskFlow}>
        <p>{entry.preview.title}</p>
        <ol>
          {entry.preview.steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  return <span className={styles.missingImage}>项目资料</span>;
}

function ProjectDesk({ cases, currentIndex, onSelect, id }) {
  const current = cases[currentIndex];
  return (
    <section className={`${styles.reel} ${styles.desk}`} aria-label="项目对照台" data-instrument="project-reel" data-collection="true">
      <div className={styles.toolbar}>
        <div className={styles.caption}>
          <span>项目一览</span>
          <span className={styles.caseCount}>{cases.length} 个案例</span>
        </div>
        <span className={styles.deskMode}>预览 / 完整案例</span>
      </div>
      <div className={styles.deskLayout}>
        <div className={styles.deskView} id={`${id}-view`} aria-label={`当前封面预览：${current.title}`}>
          <div className={styles.deskFrame} data-flow={!current.image?.src && Boolean(current.preview?.steps?.length)}>
            <div className={styles.deskMedia} key={current.href || current.title}>
              <DeskMedia entry={current} />
            </div>
            <span className={styles.deskMediaLabel} aria-hidden="true">
              {current.meta}
            </span>
          </div>
          <div className={styles.deskCaption}>
            <h2>
              <CaseLink entry={current}>{current.title}</CaseLink>
            </h2>
            <CaseLink entry={current} className={styles.deskOpen}>
              <span>{current.linkLabel || '查看完整案例'}</span>
              <span aria-hidden="true">↗</span>
            </CaseLink>
          </div>
        </div>
        <ol className={styles.deskIndex} aria-label="全部项目">
          {cases.map((entry, index) => (
            <li key={entry.href || entry.title}>
              <article className={styles.deskEntry} data-selected={index === currentIndex} aria-labelledby={`${id}-title-${index}`}>
                <button
                  type="button"
                  className={styles.deskSelect}
                  aria-label={`预览封面：${entry.title}`}
                  aria-pressed={index === currentIndex}
                  aria-controls={`${id}-view`}
                  onClick={() => onSelect(entry.href || entry.title)}
                >
                  <DeskMedia entry={entry} thumbnail />
                  <span className={styles.deskSelectCue} aria-hidden="true">
                    {index === currentIndex ? '预览中' : '预览'}
                  </span>
                </button>
                <div className={styles.deskEntryContent}>
                  <p className={styles.deskMeta}>{entry.meta}</p>
                  <h3 id={`${id}-title-${index}`}>
                    <CaseLink entry={entry}>{entry.title}</CaseLink>
                  </h3>
                  <p className={styles.deskSummary}>{entry.desc}</p>
                  <CaseLink entry={entry} className={styles.deskEntryLink}>
                    <span>{entry.linkLabel || '查看完整案例'}</span>
                    <span aria-hidden="true">↗</span>
                  </CaseLink>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        当前预览：{current.title}
      </p>
    </section>
  );
}

export default function ProjectReel({ entries = [] }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const id = useId();
  const cases = entries.filter((entry) => entry?.title);
  const keyOf = (entry) => entry.href || entry.title;
  const expandedIndex = cases.findIndex((entry) => keyOf(entry) === expandedKey);
  const expanded = expandedIndex >= 0;
  const many = cases.length > 2;

  const changePreview = (direction) => {
    if (!cases.length) return;
    let origin = expandedIndex;
    if (!expanded) origin = direction > 0 ? -1 : 0;
    const next = (origin + direction + cases.length) % cases.length;
    setExpandedKey(keyOf(cases[next]));
  };

  if (!cases.length) return <p className={styles.empty}>项目资料待补充。</p>;
  if (many) return <ProjectDesk cases={cases} currentIndex={expanded ? expandedIndex : 0} onSelect={setExpandedKey} id={id} />;

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

      <div className={styles.stage} id={`${id}-stage`} data-expanded={expanded} data-many={many}>
        {cases.map((entry, index) => {
          const key = keyOf(entry);
          const selected = expanded && index === expandedIndex;
          const compact = !many && expanded && !selected;
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
              <div className={styles.picture} data-flow={!entry.image?.src && Boolean(entry.preview?.steps?.length)}>
                <div className={styles.imageMask}>
                  {entry.image?.src && (
                    <Image
                      className={styles.image}
                      src={entry.image.src}
                      alt={entry.image.alt || `${entry.title} · 项目封面`}
                      fill
                      sizes="(max-width: 740px) calc(100vw - 40px), (max-width: 1200px) 80vw, 1100px"
                      style={{ objectFit: selected ? 'contain' : entry.image.fit || 'cover' }}
                    />
                  )}
                  {!entry.image?.src && Boolean(entry.preview?.steps?.length) && (
                    <div className={styles.flowPreview}>
                      <p>{entry.preview.title}</p>
                      <ol>
                        {entry.preview.steps.map((step, stepIndex) => (
                          <li key={step}>
                            <span>{String(stepIndex + 1).padStart(2, '0')}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {!entry.image?.src && !entry.preview?.steps?.length && <span className={styles.missingImage}>项目封面待补充</span>}
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

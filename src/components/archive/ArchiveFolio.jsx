import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import styles from '@src/components/archive/archiveFolio.module.scss';

function ArchiveFolio({ entries, title }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const pageRefs = useRef([]);
  const buttonRefs = useRef([]);
  const frameRef = useRef(0);
  const settleRef = useRef(0);
  const pendingRef = useRef(false);
  const reducedRef = useRef(false);
  const id = useId();

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedRef.current = preference.matches;
    };
    update();
    preference.addEventListener('change', update);
    return () => {
      preference.removeEventListener('change', update);
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(settleRef.current);
    };
  }, []);

  const reveal = useCallback((index, smooth = true) => {
    const track = trackRef.current;
    const page = pageRefs.current[index];
    if (!track || !page) return;
    // Unlike unscoped scrollIntoView, this never moves the outer vertical scroller.
    const left = page.offsetLeft;
    const right = left + page.offsetWidth;
    let nextLeft = track.scrollLeft;
    if (left < nextLeft + 8) nextLeft = Math.max(0, left - 8);
    else if (right > nextLeft + track.clientWidth - 8) nextLeft = right - track.clientWidth + 8;
    track.scrollTo({
      left: nextLeft,
      behavior: smooth && !reducedRef.current ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (!pendingRef.current) return undefined;
    pendingRef.current = false;
    frameRef.current = requestAnimationFrame(() => reveal(active));
    // The expanding page changes offsets; settle once after its finite width transition.
    settleRef.current = window.setTimeout(() => reveal(active), reducedRef.current ? 0 : 520);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(settleRef.current);
    };
  }, [active, reveal]);

  const select = useCallback(
    (index, focus = false) => {
      const next = Math.max(0, Math.min(entries.length - 1, index));
      if (focus) buttonRefs.current[next]?.focus({ preventScroll: true });
      pendingRef.current = true;
      if (next === active) reveal(next);
      else setActive(next);
    },
    [active, entries.length, reveal],
  );

  const onSpineKeyDown = (event, index) => {
    const destinations = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: entries.length - 1,
    };
    if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    select(destinations[event.key], true);
  };

  const stopAutoReveal = () => {
    cancelAnimationFrame(frameRef.current);
    window.clearTimeout(settleRef.current);
    pendingRef.current = false;
  };

  return (
    <section className={styles.folio} aria-label={`${title}内容索引`} data-compact={entries.length <= 4} style={{ '--folio-fold-count': Math.max(0, entries.length - 1) }}>
      <div className={styles.toolbar}>
        <p>选择标题，展开阅读</p>
        <div className={styles.navigation}>
          <span className={styles.position} aria-live="polite" aria-atomic="true">
            {entries.length ? active + 1 : 0} / {entries.length}
          </span>
          <button type="button" aria-label="展开上一项" disabled={active === 0} onClick={() => select(active - 1)}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" aria-label="展开下一项" disabled={active >= entries.length - 1} onClick={() => select(active + 1)}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div ref={trackRef} className={styles.track} data-lenis-prevent-horizontal onPointerDown={stopAutoReveal} onWheel={stopAutoReveal}>
        {entries.map((entry, index) => {
          const selected = index === active;
          const external = /^https?:\/\//i.test(entry.href || '');
          const panelId = `${id}-page-${index}`;
          const buttonId = `${id}-spine-${index}`;
          const linkContent = (
            <>
              <span>
                {entry.linkLabel || (external ? '打开外部资料' : '打开查看')}
                {external && <small>站外 · 新窗口</small>}
              </span>
              <span aria-hidden="true">↗</span>
            </>
          );
          let destination = <span className={styles.pending}>详情待补充</span>;
          if (external)
            destination = (
              <a href={entry.href} target="_blank" rel="noopener noreferrer" className={styles.openLink}>
                {linkContent}
              </a>
            );
          else if (entry.href)
            destination = (
              <Link scroll={false} href={entry.href} className={styles.openLink}>
                {linkContent}
              </Link>
            );
          return (
            <article
              key={entry.href || entry.title}
              ref={(node) => {
                pageRefs.current[index] = node;
              }}
              className={clsx(styles.page, selected && styles.open)}
            >
              <button
                id={buttonId}
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                className={styles.spine}
                type="button"
                aria-expanded={selected}
                aria-controls={panelId}
                aria-label={`${selected ? '已展开' : '展开'}：${entry.title}`}
                onClick={() => select(index)}
                onKeyDown={(event) => onSpineKeyDown(event, index)}
                onFocus={() => {
                  stopAutoReveal();
                  reveal(index, false);
                }}
              >
                <span className={styles.spineMark} aria-hidden="true">
                  {selected ? '−' : '+'}
                </span>
                <span className={styles.spineTitle}>{entry.title}</span>
                <span className={styles.spineFoot} aria-hidden="true">
                  {selected ? '展开' : '选择'}
                </span>
              </button>
              <div id={panelId} role="region" aria-labelledby={buttonId} className={clsx(styles.panel, !entry.image && styles.textOnly)} hidden={!selected}>
                {selected && (
                  <>
                    <div className={styles.pageMeta}>
                      <span>{entry.meta}</span>
                      <span>{entry.href ? entry.status : '详情待补充'}</span>
                    </div>
                    {entry.image && (
                      <div className={styles.image}>
                        <Image
                          src={entry.image.src}
                          alt={entry.image.alt || entry.title}
                          fill
                          sizes="(max-width: 600px) 70vw, (max-width: 1000px) 65vw, 700px"
                          style={{ objectFit: entry.image.fit || 'contain' }}
                        />
                      </div>
                    )}
                    <div className={styles.copy}>
                      <h2>{entry.title}</h2>
                      {entry.desc && <p>{entry.desc}</p>}
                    </div>
                    <div className={styles.pageFoot}>{destination}</div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.trackNote}>
        <span>横向浏览全部条目</span>
        <span>方向键切换 · Enter 展开</span>
      </div>
    </section>
  );
}

export default ArchiveFolio;

/* eslint-disable @next/next/no-img-element, jsx-a11y/media-has-caption */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@src/store';
import styles from './photographyExhibition.module.scss';

const groups = ['极色妝婳亚洲赛', '广之旅供应商年会', '短剧', 'cos道诡异仙岁岁', '电商引流'];

export default function PhotographyExhibition({ works }) {
  const exhibits = groups.map((label, group) => ({
    label,
    group,
    items: works.filter((item) => item.group === group),
  }));
  const root = useRef(null);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reduced, setReduced] = useState(false);
  const current = Math.min(groups.length - 1, Math.round(position));

  useEffect(() => {
    const main = root.current.closest('main');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => setReduced(media.matches);
    preference();
    media.addEventListener('change', preference);
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance = main.getBoundingClientRect().top - root.current.getBoundingClientRect().top;
        const range = root.current.offsetHeight - main.clientHeight;
        setPosition(Math.max(0, Math.min(groups.length - 1, (distance / Math.max(1, range)) * (groups.length - 1))));
      });
    };
    main.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      main.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      media.removeEventListener('change', preference);
    };
  }, [groups.length]);

  const go = (index) => {
    const main = root.current.closest('main');
    const start = root.current.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    const range = root.current.offsetHeight - main.clientHeight;
    const top = start + (Math.max(0, Math.min(groups.length - 1, index)) / (groups.length - 1)) * range;
    const { lenis } = useStore.getState();
    if (lenis) lenis.scrollTo(top, { duration: 1.2, immediate: reduced });
    else main.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
  };

  useEffect(() => {
    if (selected === null) return undefined;
    const modal = dialog.current;
    modal.showModal();
    modal.scrollTop = 0;
    if (!reduced)
      modal.animate(
        [
          { opacity: 0, transform: 'scale(.88)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    useStore.getState().lenis?.stop();
    return () => {
      modal.close();
      useStore.getState().lenis?.start();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [selected, reduced]);

  const work = selected === null ? null : exhibits[selected];
  return (
    <section ref={root} className={styles.journey} style={{ height: `${groups.length * 65 + 100}vh` }} aria-label="照片视频作品展">
      <div className={styles.exhibition}>
        <div className={styles.room}>
          <div className={styles.ceiling} aria-hidden="true" />
          <div className={styles.floor} aria-hidden="true" />
          <div className={styles.gallery}>
            {exhibits.map((item, i) => {
              const distance = i - (reduced ? current : position);
              const side = i % 2 === 0 ? 1 : -1;
              const visible = distance > -0.85 && distance < 4;
              return (
                <div
                  key={item.label}
                  className={styles.wall}
                  style={{
                    transform: `translate3d(calc(-50% + ${side * (distance < 0 ? 260 + -distance * 800 : 260 + distance * 180)} * var(--spread)), -50%, ${-distance * 700}px) rotateY(${-side * 14}deg)`,
                    opacity: visible ? Math.min(1, (distance + 0.85) * 3) : 0,
                    visibility: visible ? 'visible' : 'hidden',
                    zIndex: groups.length - i,
                  }}
                >
                  <button
                    type="button"
                    tabIndex={i === current ? 0 : -1}
                    className={styles.print}
                    aria-label={`查看 ${item.label}`}
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setSelected(i);
                    }}
                  >
                    <span className={styles.seriesPrints}>
                      {item.items.slice(0, 3).map((photo) => (
                        <img key={photo.src} src={photo.poster || photo.src} alt={photo.label} draggable="false" />
                      ))}
                    </span>
                    <span className={styles.view}>展开系列 ↗</span>
                  </button>
                  <div className={styles.caption}>
                    <span>{item.label}</span>
                    <small>{item.items.length} 件作品</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.controls}>
          <nav aria-label="照片视频专题">
            {groups.map((name, i) => (
              <button type="button" key={name} aria-current={current === i ? 'true' : undefined} onClick={() => go(i)}>
                {name}
              </button>
            ))}
          </nav>
          <div className={styles.transport}>
            <button type="button" disabled={current === 0} onClick={() => go(current - 1)} aria-label="上一个系列">
              ←
            </button>
            <span aria-live="polite">
              {String(current + 1).padStart(2, '0')} / {groups.length}
            </span>
            <button type="button" disabled={current === groups.length - 1} onClick={() => go(current + 1)} aria-label="下一个系列">
              →
            </button>
          </div>
          <span className={styles.hint}>滚动前行 · 点击展开系列</span>
          <div className={styles.progress} style={{ transform: `scaleX(${(position + 1) / groups.length})` }} />
        </div>
      </div>
      <dialog ref={dialog} className={styles.viewer} data-lenis-prevent onCancel={() => setSelected(null)} aria-label={work?.label || '查看作品'}>
        {work && (
          <>
            <div className={styles.viewerTop}>
              <span>{work.label}</span>
              <button type="button" onClick={() => setSelected(null)}>
                关闭 ×
              </button>
            </div>
            <div className={styles.seriesGallery}>
              {work.items.map((photo) => (
                <figure key={photo.src}>
                  {photo.type === 'video' ? <video src={photo.src} poster={photo.poster} controls playsInline preload="none" /> : <img src={photo.src} alt={photo.label} loading="lazy" />}
                  <figcaption>{photo.label}</figcaption>
                </figure>
              ))}
            </div>
            <div className={styles.viewerBottom}>
              <span>{groups[work.group]}</span>
              {work.group < 3 && (
                <Link href={work.group === 2 ? '/photography/short-drama' : '/photography/commercial-delivery'} scroll={false} onClick={() => setSelected(null)}>
                  作品说明 ↗
                </Link>
              )}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

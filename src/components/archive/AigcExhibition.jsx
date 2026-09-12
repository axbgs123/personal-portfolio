/* Original films have no separate caption files; do not invent transcripts. */
/* eslint-disable jsx-a11y/media-has-caption */
import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import aigcWorks from '@src/constants/aigcWorks';
import styles from './aigcExhibition.module.scss';

const groups = [
  {
    id: 'films',
    title: '创亿鸭 AI 视频',
    count: `${aigcWorks.filter((work) => work.id === 'campus').length} 条视频`,
    cover: '/migrated-posters/campus-cultural-tech-space.webp',
    rotation: -5,
    works: aigcWorks.filter((work) => work.id === 'campus'),
  },
  {
    id: 'ecommerce-traffic',
    title: '电商引流',
    count: `${aigcWorks.filter((work) => work.id === 'ecommerce-traffic-ai').length} 条视频`,
    cover: '/aigc/videos/ecommerce-traffic.webp',
    rotation: 4,
    works: aigcWorks.filter((work) => work.id === 'ecommerce-traffic-ai'),
  },
  {
    id: 'zhaoyun',
    title: '赵云',
    count: `${aigcWorks.filter((work) => work.group === 'zhaoyun').length} 张图片`,
    cover: '/aigc/zhaoyun/01.webp',
    rotation: 5,
    works: aigcWorks.filter((work) => work.group === 'zhaoyun'),
  },
  {
    id: 'lipstick',
    title: '口红',
    count: `${aigcWorks.filter((work) => work.group === 'lipstick').length} 张图片`,
    cover: '/aigc/lipstick/02.webp',
    rotation: -2,
    works: aigcWorks.filter((work) => work.group === 'lipstick'),
  },
];

export default function AigcExhibition() {
  const dialog = useRef(null);
  const origin = useRef(null);
  const trigger = useRef(null);
  const animation = useRef(null);
  const [group, setGroup] = useState(null);
  const [active, setActive] = useState(null);

  useLayoutEffect(() => {
    if (!group) return undefined;
    const panel = dialog.current;
    panel.showModal();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && origin.current) {
      const target = panel.getBoundingClientRect();
      const source = origin.current;
      animation.current = panel.animate(
        [
          {
            transform: `translate(${source.left + source.width / 2 - target.left - target.width / 2}px, ${source.top + source.height / 2 - target.top - target.height / 2}px) rotate(${group.rotation}deg) scale(${source.width / target.width})`,
            opacity: 0.4,
          },
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
        ],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    }
    return () => animation.current?.cancel();
  }, [group]);

  const reset = () => {
    setGroup(null);
    setActive(null);
    trigger.current?.focus({ preventScroll: true });
  };
  const close = () => {
    dialog.current.close();
  };
  const open = (entry, event) => {
    trigger.current = event.currentTarget;
    origin.current = event.currentTarget.getBoundingClientRect();
    setActive(null);
    setGroup(entry);
  };

  return (
    <div className={styles.exhibition} data-instrument="aigc">
      <div className={styles.intro}>
        <span>影像与生成</span>
        <span>打开相框，查看同类作品 ↗</span>
      </div>
      <div className={styles.wall}>
        {groups.map((entry) => (
          <button key={entry.id} type="button" className={styles.frame} onClick={(event) => open(entry, event)} aria-label={`打开${entry.title}，${entry.count}`} aria-haspopup="dialog">
            <span className={styles.cover}>
              <Image src={entry.cover} alt={entry.title} fill sizes="(max-width: 640px) 80vw, 40vw" />
            </span>
            <span className={styles.caption}>
              <strong>{entry.title}</strong>
              <span>{entry.count}</span>
            </span>
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
          </button>
        ))}
      </div>
      <dialog ref={dialog} className={styles.viewer} onClose={reset} aria-label={group?.title || '作品相框'}>
        <div className={styles.viewerBar}>
          <h2>{active && !active.hideTitle ? active.title : group?.title}</h2>
          <div>
            {active && (
              <button type="button" onClick={() => setActive(null)}>
                返回作品
              </button>
            )}
            <button type="button" onClick={close} aria-label="关闭相框">
              关闭 ×
            </button>
          </div>
        </div>
        {active ? (
          <div className={styles.stage}>
            {active.type === 'video' ? (
              <video key={active.src} src={active.src} poster={active.poster} controls playsInline autoPlay preload="metadata" aria-label={active.title} />
            ) : (
              <Image src={active.src} alt={active.title} fill sizes="90vw" />
            )}
          </div>
        ) : (
          <div className={styles.collection} data-count={group?.works.length}>
            {group?.works.map((work) => (
              <button key={work.id} className={styles.work} type="button" onClick={() => setActive(work)} aria-label={`${work.type === 'video' ? '播放' : '查看'}${work.title}`}>
                <span className={styles.preview}>
                  <Image src={work.poster || work.src} alt={work.title} fill sizes="(max-width: 640px) 80vw, 30vw" />
                  <span className={styles.play}>{work.type === 'video' ? '▷' : '↗'}</span>
                </span>
                {!work.hideTitle && <span className={styles.workTitle}>{work.title}</span>}
              </button>
            ))}
          </div>
        )}
      </dialog>
    </div>
  );
}

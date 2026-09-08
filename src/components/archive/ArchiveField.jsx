import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import styles from './archiveField.module.scss';

export default function ArchiveField({ entries, title }) {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState('');
  const buttons = useRef([]);
  const fieldRef = useRef(null);
  const searchRef = useRef(null);
  const id = useId();
  const visible = useMemo(
    () => entries.map((entry, index) => ({ ...entry, index })).filter((entry) => `${entry.title} ${entry.meta || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
    [entries, query],
  );
  const active = visible.find((entry) => entry.index === selected) || visible[0];
  const short = entries.length <= 4;
  const external = /^https?:\/\//i.test(active?.href || '');

  useEffect(() => {
    const node = fieldRef.current;
    const motion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--preview-x', '0px');
      node.style.setProperty('--preview-y', '0px');
      node.style.setProperty('--preview-turn', '0deg');
    };
    const move = (event) => {
      if (!motion.matches) return;
      cancelAnimationFrame(frame);
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / Math.min(rect.height, window.innerHeight) - 0.5));
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--preview-x', `${x * 20}px`);
        node.style.setProperty('--preview-y', `${y * 14}px`);
        node.style.setProperty('--preview-turn', `${x * 2}deg`);
      });
    };
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
    return () => {
      reset();
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      motion.removeEventListener('change', reset);
    };
  }, []);

  const selectWithKeys = (event, index) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = visible.findIndex((entry) => entry.index === index);
    let next = Math.max(0, Math.min(visible.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = visible.length - 1;
    buttons.current[visible[next]?.index]?.focus();
  };

  const entryContent = (entry) => (
    <>
      {entry.title}
      {entry.href && <sup aria-hidden="true">↗</sup>}
      {!entry.href && <small>待补充</small>}
    </>
  );
  const renderEntry = (entry) => {
    const outside = /^https?:\/\//i.test(entry.href || '');
    let Control = 'button';
    if (entry.href) Control = outside ? 'a' : Link;
    return (
      <Control
        ref={(node) => {
          buttons.current[entry.index] = node;
        }}
        className={clsx(styles.word, active?.index === entry.index && styles.selected)}
        href={entry.href || undefined}
        target={outside ? '_blank' : undefined}
        rel={outside ? 'noopener noreferrer' : undefined}
        scroll={Control === Link ? false : undefined}
        type={!entry.href ? 'button' : undefined}
        aria-label={outside ? `${entry.title}，站外新窗口` : undefined}
        aria-pressed={!entry.href ? active?.index === entry.index : undefined}
        aria-controls={active ? `${id}-preview` : undefined}
        onPointerEnter={() => setSelected(entry.index)}
        onFocus={() => setSelected(entry.index)}
        onKeyDown={(event) => selectWithKeys(event, entry.index)}
        onClick={() => setSelected(entry.index)}
      >
        {entryContent(entry)}
      </Control>
    );
  };
  let destination = <span className={styles.pending}>详情待补充</span>;
  if (active?.href)
    destination = external ? (
      <a className={styles.open} href={active.href} target="_blank" rel="noopener noreferrer">
        {active.linkLabel || '打开资料'} <span>站外新窗口 ↗</span>
      </a>
    ) : (
      <Link className={styles.open} href={active.href} scroll={false}>
        {active.linkLabel || '打开查看'} <span aria-hidden="true">↗</span>
      </Link>
    );

  return (
    <section ref={fieldRef} className={clsx(styles.field, short && styles.short)} aria-label={`${title}内容索引`} data-archive-field>
      <div className={styles.toolbar}>
        <p>{short ? '点开一个想了解的方向。' : '从一个标题，开始探索。'}</p>
        {entries.length > 8 && (
          <label className={styles.search} htmlFor={`${id}-search`}>
            <span>搜索本页</span>
            <input ref={searchRef} id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题或关键词" />
          </label>
        )}
      </div>
      <div className={styles.composition}>
        <nav className={styles.words} aria-label={`${title}条目`}>
          {visible.map((entry, index) => (
            <span className={styles.phrase} key={entry.href || entry.title}>
              {renderEntry(entry)}
              {index < visible.length - 1 && (
                <span className={styles.separator} aria-hidden="true">
                  {' '}
                  /{' '}
                </span>
              )}
            </span>
          ))}
          {!visible.length && (
            <div className={styles.empty}>
              <p>没有找到匹配的标题。</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
              >
                清除搜索 ↗
              </button>
            </div>
          )}
        </nav>
        {active && (
          <aside id={`${id}-preview`} className={styles.preview} aria-label="当前条目预览">
            <div key={active.index} className={styles.previewInner}>
              <div className={styles.media} data-has-image={Boolean(active.image)}>
                {active.image ? (
                  <Image src={active.image.src} alt={active.image.alt || active.title} fill sizes="(max-width: 760px) 90vw, 34vw" style={{ objectFit: active.image.fit || 'contain' }} />
                ) : (
                  <div className={styles.typePoster} aria-hidden="true">
                    <span>{active.meta || title}</span>
                    <strong>{active.title}</strong>
                  </div>
                )}
              </div>
              <div className={styles.meta}>
                <span>{active.meta}</span>
                <span>{active.status}</span>
              </div>
              <h2>{active.title}</h2>
              {active.desc && <p className={styles.description}>{active.desc}</p>}
              {destination}
            </div>
          </aside>
        )}
      </div>
      <div className={styles.foot}>
        <span role="status" aria-live="polite" aria-atomic="true">
          {query.trim() ? `${visible.length} / ${entries.length} 个匹配` : `${entries.length} 个条目`}
        </span>
        <span>{entries.some((entry) => entry.href) ? '标题可直接打开 · 方向键浏览' : '选择方向查看介绍 · 内容待补充'}</span>
      </div>
    </section>
  );
}

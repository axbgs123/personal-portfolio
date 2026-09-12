import { useId, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageInspection from './ImageInspection';
import styles from './contentExhibits.module.scss';
import gallery from './photographyGallery.module.scss';

// A photographic contact sheet is a way to see photographs, not a simulated
// camera. Only source-backed images are rendered; an empty series has no lens,
// brightness or crop controls. Existing descriptions remain available in place.
export default function PhotographyContact({ entries }) {
  const [selected, setSelected] = useState(null);
  const id = useId();
  return (
    <div className={styles.contactSheet} data-instrument="photography">
      <div className={styles.contactHeading}>
        <span>照片视频选集</span>
        <p>{entries.some((entry) => entry.image?.src) ? '现场的瞬间，与镜头里的叙事。' : '原片尚未补充，先留下一些观察的方向。'}</p>
      </div>
      <div className={gallery.exhibition}>
        {entries
          .filter((entry) => entry.href && entry.image?.src)
          .map((entry) => (
            <article key={entry.title} className={gallery.work} data-portrait={entry.image.height > entry.image.width}>
              <Link href={entry.href} scroll={false} className={gallery.frame} aria-label={entry.title}>
                <Image src={entry.image.src} alt={entry.image.alt} width={entry.image.width} height={entry.image.height} sizes="(max-width: 760px) 90vw, 55vw" />
                <span className={gallery.open}>
                  查看作品 <span aria-hidden="true">↗</span>
                </span>
              </Link>
              <div className={gallery.caption}>
                <span>{entry.meta}</span>
                <h2>
                  <Link href={entry.href} scroll={false}>
                    {entry.title}
                  </Link>
                </h2>
                <p>{entry.desc}</p>
              </div>
            </article>
          ))}
      </div>
      <div className={styles.contactRows}>
        {entries
          .filter((entry) => !(entry.href && entry.image?.src))
          .map((entry, index) => (
            <article className={styles.contactRow} key={entry.title} data-open={selected === entry.title}>
              <div className={styles.contactStrip}>
                <span className={styles.contactMeta}>{entry.meta?.replace(/\s*·\s*\d+\s*张/g, '')}</span>
                <h2>
                  {entry.href ? (
                    <Link href={entry.href} scroll={false}>
                      {entry.title}
                    </Link>
                  ) : (
                    entry.title
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected((value) => (value === entry.title ? null : entry.title))}
                  aria-expanded={selected === entry.title}
                  aria-controls={selected === entry.title ? `${id}-series-${index}` : undefined}
                  aria-label={`${selected === entry.title ? '收起' : '展开'}${entry.title}`}
                >
                  {selected === entry.title ? '收起' : '展开系列'}
                  <span aria-hidden="true">{selected === entry.title ? '−' : '↘'}</span>
                </button>
              </div>
              {selected === entry.title && (
                <div className={styles.contactBody} id={`${id}-series-${index}`}>
                  <p>{entry.desc}</p>
                  {entry.href && (
                    <Link className={styles.contactDestination} href={entry.href} scroll={false}>
                      {entry.linkLabel || '查看完整交付'} <span aria-hidden="true">↗</span>
                    </Link>
                  )}
                  {entry.image?.src ? <ImageInspection image={entry.image} title={entry.title} /> : <span className={styles.photoPending}>原片待补充</span>}
                </div>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}

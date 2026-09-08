import { useId, useState } from 'react';
import ImageInspection from './ImageInspection';
import styles from './contentExhibits.module.scss';

// A photographic contact sheet is a way to see photographs, not a simulated
// camera. Only source-backed images are rendered; an empty series has no lens,
// brightness or crop controls. Existing descriptions remain available in place.
export default function PhotographyContact({ entries }) {
  const [selected, setSelected] = useState(null);
  const id = useId();
  return (
    <div className={styles.contactSheet} data-instrument="photography">
      <div className={styles.contactHeading}>
        <span>摄影选集</span>
        <p>{entries.some((entry) => entry.image?.src) ? '展开系列，查看原片。' : '原片尚未补充，先留下一些观察的方向。'}</p>
      </div>
      <div className={styles.contactRows}>
        {entries.map((entry, index) => (
          <article className={styles.contactRow} key={entry.title} data-open={selected === entry.title}>
            <div className={styles.contactStrip}>
              <span className={styles.contactMeta}>{entry.meta?.replace(/\s*·\s*\d+\s*张/g, '')}</span>
              <h2>{entry.title}</h2>
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
                {entry.image?.src ? <ImageInspection image={entry.image} title={entry.title} /> : <span className={styles.photoPending}>原片待补充</span>}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

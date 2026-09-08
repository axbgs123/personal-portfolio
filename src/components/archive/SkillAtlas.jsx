import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './skillAtlas.module.scss';

/*
 * Method sections, not a toolbox or an invented execution graph.
 * Four real direction titles remain visible; one description unfolds in place.
 * Paper #F6F6F6, ink #090909, graphite #626262, divider #CDCDCD, site vermilion.
 * Portfolio Haas/PingFang display; restrained monospace for source metadata.
 * The typographic incision is the only signature: an open baseline becomes
 * a vertical margin carrying the original description, without claiming steps.
 */

function Description({ text }) {
  // Preserve the exact supplied copy and punctuation. Line breaks are reading
  // rhythm, not newly named workflow stages or inferred input/output claims.
  const clauses = Array.from(text.matchAll(/[^，。！？；]+[，。！？；]?|[，。！？；]/gu), (match) => ({ text: match[0], key: `${match.index}:${match[0]}` }));
  return (
    <p className={styles.description}>
      {clauses.map((clause, index) => (
        <span className={styles.clause} key={clause.key} style={{ '--clause-index': index }}>
          {clause.text}
        </span>
      ))}
    </p>
  );
}

function Destination({ entry }) {
  const label = entry.linkLabel || '打开详情';
  if (/^\/(?!\/)/.test(entry.href || ''))
    return (
      <Link className={styles.destination} href={entry.href} scroll={false}>
        {label}
        <span aria-hidden="true">↗</span>
      </Link>
    );
  if (/^https?:\/\//i.test(entry.href || ''))
    return (
      <a className={styles.destination} href={entry.href} target="_blank" rel="noopener noreferrer">
        {label}
        <span aria-hidden="true">↗</span>
        <span className={styles.srOnly}>，在新窗口打开</span>
      </a>
    );
  return null;
}

export default function SkillAtlas({ entries = [] }) {
  const directions = Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry.title === 'string' && entry.title.trim()) : [];
  const [selected, setSelected] = useState(0);
  const headers = useRef([]);
  const id = useId();
  const active = selected === null ? null : Math.min(selected, directions.length - 1);

  const navigate = (event, index) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !directions.length) return;
    const destinations = { ArrowUp: Math.max(0, index - 1), ArrowDown: Math.min(directions.length - 1, index + 1), Home: 0, End: directions.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    headers.current[destinations[event.key]]?.focus();
  };

  return (
    <section className={styles.atlas} data-instrument="skills" data-skill-atlas aria-label="个人 Skill 方法剖面">
      <div className={styles.caption}>
        <span>方法剖面</span>
        <span>{directions.length ? '展开方向，查看介绍' : '暂无 Skill 方向'}</span>
      </div>
      {directions.length ? (
        <div className={styles.sections}>
          {directions.map((entry, index) => {
            const expanded = active === index;
            const panelId = `${id}-method-${index}`;
            const triggerId = `${id}-method-trigger-${index}`;
            return (
              <section className={styles.method} key={entry.title} data-open={expanded}>
                <h2 className={styles.heading}>
                  <button
                    className={styles.trigger}
                    type="button"
                    id={triggerId}
                    ref={(node) => {
                      headers.current[index] = node;
                    }}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setSelected((value) => (value === index ? null : index))}
                    onKeyDown={(event) => navigate(event, index)}
                  >
                    <span className={styles.meta}>{entry.meta}</span>
                    <span className={styles.title}>{entry.title}</span>
                    <span className={styles.toggle} aria-hidden="true">
                      <i />
                      <i />
                    </span>
                  </button>
                </h2>
                <div className={styles.panel} id={panelId} role="region" aria-labelledby={triggerId} hidden={!expanded}>
                  <div className={styles.margin}>{entry.status && <span className={styles.status}>{entry.status}</span>}</div>
                  <div className={styles.copy}>
                    <Description text={typeof entry.desc === 'string' ? entry.desc : ''} />
                    <Destination entry={entry} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>暂无可展示的方法介绍。</p>
      )}
      {directions.length > 0 && directions.some((entry) => !/^\/(?!\/)|^https?:\/\//i.test(entry.href || '')) && <p className={styles.note}>Skill 文件与详情待补充。</p>}
    </section>
  );
}

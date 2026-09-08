import Link from 'next/link';
import ImageInspection from './ImageInspection';
import styles from './contentExhibits.module.scss';

// These are existing, final site assets — not evidence for unfilled categories.
// Provenance: public/art/project-cover-prompts.md. No new generation or claims.
const SITE_VISUALS = [
  { title: 'AI 运营平台 · 主视觉', src: '/art/operations-cover.webp', href: '/projects/project1', note: '内容纸张、生成核心与审核层，围绕运营平台组织成一张概念画面。' },
  { title: 'GEO 内容增长 · 主视觉', src: '/art/geo-cover.webp', href: '/projects/project2', note: '把知识整理与内容分发，转译为纸张、印刷模块和层叠关系。' },
];

export default function AigcExhibition({ entries }) {
  return (
    <div className={styles.exhibition} data-instrument="aigc">
      <div className={styles.exhibitIntro}>
        <span>网站主视觉</span>
        <p>
          已在本站使用的生成式图像。
          <br />
          点开画面，看纸张、材质与构图的细节。
        </p>
      </div>
      <div className={styles.artWall}>
        {SITE_VISUALS.map((work) => (
          <figure className={styles.artwork} key={work.src}>
            <ImageInspection title={work.title} image={{ src: work.src, alt: work.title, width: 1672, height: 941 }} />
            <figcaption>
              <h2>{work.title}</h2>
              <p>{work.note}</p>
              <div>
                <a href={work.src} target="_blank" rel="noopener noreferrer">
                  查看原图 ↗
                </a>
                <Link href={work.href} scroll={false}>
                  查看应用案例 ↗
                </Link>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={styles.directionNotes}>
        <h2>其他创作方向</h2>
        <p>以下为方向介绍，对应作品待补充。</p>
        <div>
          {entries.map((entry) => (
            <details key={entry.title}>
              <summary>
                {entry.title}
                <span aria-hidden="true">＋</span>
              </summary>
              <p>{entry.desc}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

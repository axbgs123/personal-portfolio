import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import projects from '@src/constants/projects';
import styles from './projectStages.module.scss';

const titles = {
  project1: {
    before: 'AI 运营',
    after: '智能体',
    subtitle: '内容分析与生成平台',
  },
  project2: { before: '百言', after: 'GEO', subtitle: '内容增长系统' },
};

export default function ProjectPortals({ variant = 'home' }) {
  const root = useRef(null);
  const archive = variant === 'archive';
  const prefix = archive ? 'project-archive' : 'work';

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const removers = [];
      const context = gsap.context(() => {
        root.current.querySelectorAll('[data-project-portal]').forEach((portal) => {
          const aperture = portal.querySelector('[data-image-window]');
          const image = portal.querySelector('[data-project-image]');
          gsap.fromTo(
            aperture,
            { clipPath: 'inset(0% 34% 0% 34%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: {
                trigger: portal,
                scroller: document.querySelector('main'),
                start: 'top 88%',
                end: 'center 48%',
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            },
          );
          if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
          const toX = gsap.quickTo(image, 'xPercent', {
            duration: 0.85,
            ease: 'power3.out',
          });
          const toY = gsap.quickTo(image, 'yPercent', {
            duration: 0.85,
            ease: 'power3.out',
          });
          const move = (event) => {
            const rect = portal.getBoundingClientRect();
            toX(((event.clientX - rect.left) / rect.width - 0.5) * 5);
            toY(((event.clientY - rect.top) / rect.height - 0.5) * 5);
          };
          const reset = () => {
            toX(0);
            toY(0);
          };
          portal.addEventListener('pointermove', move);
          portal.addEventListener('pointerleave', reset);
          removers.push(() => {
            portal.removeEventListener('pointermove', move);
            portal.removeEventListener('pointerleave', reset);
          });
        });
      }, root);
      return () => {
        removers.forEach((remove) => remove());
        context.revert();
      };
    });
    return () => media.revert();
  }, []);

  return (
    <section ref={root} id={prefix} className={styles.work} aria-labelledby={`${prefix}-title`}>
      <header className={styles.header}>
        <h2 id={`${prefix}-title`}>{archive ? '两项产品实践' : '精选项目'}</h2>
        <span>2026</span>
      </header>
      {projects.map((project, index) => {
        const title = titles[project.id];
        return (
          <article className={styles.project} data-tone={index % 2 ? 'dark' : 'light'} key={project.id}>
            <Link className={styles.portal} data-project-portal href={project.link} scroll={false} aria-label={`查看${project.title}完整案例`}>
              <h3 className={styles.srOnly}>{project.title}</h3>
              <span className={styles.word} aria-hidden="true">
                {title.before}
              </span>
              <span className={styles.imageSlot} aria-hidden="true">
                <span className={styles.imageWindow} data-image-window>
                  <span className={styles.imagePlane} data-project-image>
                    <Image src={project.img} alt="" fill sizes="(max-width: 760px) 90vw, 46vw" priority={archive && index === 0} />
                  </span>
                </span>
                <span className={styles.imageAction}>
                  查看案例 <span>↗</span>
                </span>
              </span>
              <span className={[styles.word, styles.lastWord].join(' ')} aria-hidden="true">
                {title.after}
                <span className={styles.corner}>↗</span>
              </span>
            </Link>
            <div className={styles.caption}>
              <div className={styles.identity}>
                <h4>{title.subtitle}</h4>
                <p>{project.role}</p>
              </div>
              <p className={styles.summary}>{project.summary}</p>
              <Link href={project.link} scroll={false} className={styles.read}>
                完整案例 <span aria-hidden="true">↗</span>
              </Link>
            </div>
            {archive && (
              <details className={styles.decisions}>
                <summary>
                  设计中的关键判断<span aria-hidden="true">+</span>
                </summary>
                <div>
                  {project.decisions.map((decision) => (
                    <article key={decision.title}>
                      <h4>{decision.title}</h4>
                      <p>{decision.text}</p>
                    </article>
                  ))}
                </div>
              </details>
            )}
          </article>
        );
      })}
      {!archive && (
        <div className={styles.bottom}>
          <span>概念封面 · 案例内含真实界面</span>
          <Link href="/more-projects" scroll={false}>
            项目档案 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
    </section>
  );
}

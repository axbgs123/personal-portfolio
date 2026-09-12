import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import projects from '@src/constants/homeCarousel';
import styles from './featuredScreening.module.scss';

const displayTitles = {
  project1: ['AI 运营', '智能体'],
  project2: ['百言 GEO', '内容增长'],
  'rag-copywriting': ['RAG 智能', '文案工具'],
  'ai-interview': ['AI 英语', '面试模拟'],
  'chuangyiya-ip': ['创亿鸭', 'AI 漫剧'],
  adcanvas: ['AdCanvas', '广告画布'],
  'open-llm-vtuber-companion': ['中文 AI', '伴侣'],
};

export default function FeaturedScreening() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const touch = useRef(null);
  const root = useRef(null);
  const id = useId();
  const project = projects[selected];
  const title = displayTitles[project.id];
  const change = (offset) => setSelected((current) => (current + offset + projects.length) % projects.length);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopForPreference = () => {
      if (preference.matches) setPlaying(false);
    };
    stopForPreference();
    preference.addEventListener('change', stopForPreference);
    return () => preference.removeEventListener('change', stopForPreference);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.25 },
    );
    observer.observe(root.current);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !root.current?.matches(':hover, :focus-within')) {
        setSelected((current) => (current + 1) % projects.length);
      }
    }, 6500);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [playing, selected]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (min-width: 761px)', () => {
      const context = gsap.context(() => {
        gsap.fromTo(
          '[data-screening-stage]',
          { clipPath: 'inset(0 5% 0 5%)' },
          {
            clipPath: 'inset(0 0% 0 0%)',
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              scroller: document.querySelector('main'),
              start: 'top 90%',
              end: 'top 28%',
              scrub: 0.45,
            },
          },
        );
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <section ref={root} id="work" className={styles.screening} aria-labelledby={`${id}-title`} aria-roledescription="项目轮播">
      <header className={styles.header}>
        <h2 id={`${id}-title`}>精选项目</h2>
        <Link href="/more-projects" scroll={false}>
          全部项目 <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.carouselControls}>
        <div className={styles.transport}>
          <button type="button" onClick={() => change(-1)} aria-label="上一个项目">
            ←
          </button>
          <span>
            {String(selected + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => change(1)} aria-label="下一个项目">
            →
          </button>
        </div>
        <button className={styles.playControl} type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
          {playing ? '暂停轮播 Ⅱ' : '播放轮播 ▷'}
        </button>
      </div>
      <div
        className={styles.stage}
        data-screening-stage
        id={`${id}-stage`}
        onTouchStart={(event) => {
          touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }}
        onTouchEnd={(event) => {
          if (!touch.current) return;
          const dx = event.changedTouches[0].clientX - touch.current.x;
          const dy = event.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) change(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
      >
        <div className={styles.scene} key={project.id} data-case={project.id} role="group" aria-roledescription="幻灯片" aria-label={`${selected + 1} / ${projects.length}：${project.title}`}>
          <div className={styles.visual} aria-hidden="true">
            {project.img ? (
              <Image src={project.img} alt="" fill sizes="(max-width: 760px) 100vw, 80vw" className={styles.art} />
            ) : (
              <ol className={styles.flowPreview}>
                {project.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            <div className={styles.shutter} />
          </div>
          <div className={styles.copy}>
            <span className={styles.category}>{project.category}</span>
            <h3 aria-label={project.title}>
              <span aria-hidden="true">
                {title[0]}
                <br />
                {title[1]}
                <span className={styles.dot}>.</span>
              </span>
            </h3>
            <p className={styles.summary}>{project.summary}</p>
            {project.role && <p className={styles.role}>{project.role}</p>}
            <Link href={project.link} scroll={false} className={styles.open}>
              查看完整案例 <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <span className={styles.source}>{project.source}</span>
        </div>
      </div>
      <div className={styles.index} role="group" aria-label="选择精选项目">
        {projects.map((entry, index) => (
          <button key={entry.id} type="button" className={styles.select} aria-pressed={selected === index} aria-controls={`${id}-stage`} onClick={() => setSelected(index)}>
            <span className={styles.thumb}>{entry.img ? <Image src={entry.img} alt="" fill sizes="80px" /> : <span aria-hidden="true">Aa</span>}</span>
            <span className={styles.selectTitle}>{entry.title}</span>
            <span className={styles.selectArrow} aria-hidden="true">
              {selected === index ? '●' : '↗'}
            </span>
          </button>
        ))}
      </div>
      <p className={styles.srOnly} role="status" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
        当前项目：{project.title}
      </p>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import CustomHead from '@src/components/dom/CustomHead';
import AvantHero from '@src/components/portfolio/AvantHero';
import ProjectStages from '@src/components/portfolio/ProjectStages';
import PianoLab from '@src/components/portfolio/PianoLab';
import SignatureMark from '@src/components/portfolio/SignatureMark';
import styles from './homeV2.module.scss';

const experiences = [
  {
    date: '2026.07 — 2026.09',
    company: '百言科技',
    role: 'AI 应用与内容增长',
    metric: '70+',
    unit: '篇文章与实操教程',
    detail: '围绕企业 AI 应用和 GEO 开展调研、用户访谈与需求拆解，参与设计流程、质量规则和验收标准。参与 2000+ 人付费社群运营及企业 AI 先锋训练营，团队累计服务 400+ 名学员。',
    note: 'AI 实习生 · 百言科技（杭州）有限公司',
  },
  {
    date: '2026.03 — 2026.05',
    company: '赛牡丹数字科技',
    role: '自动化工具与 AI 视频',
    metric: '40+',
    unit: '个高频问题入库',
    detail: '串联下单、飞书归档和打印环节，开发内部自动化工具；负责“创亿鸭”产品线规划，搭建 AI 视频定制流程。建设飞书问答知识库，编写 50+ 篇教程与工具应用资料。',
    note: 'AI 实习生 · 福建赛牡丹数字科技有限公司',
  },
  {
    date: '2024.03 — 2026.03',
    company: '个人摄影摄像工作室',
    role: '从客户需求到创作交付',
    metric: '60+',
    unit: '场拍摄完成交付',
    detail: '累计服务 30+ 名客户，负责沟通、策划、拍摄和交付。为直播切片设计文案生产工具，结合 RAG、结构化输入、风控和剪映导出，累计支持发布 500+ 条视频。',
    note: '创始人 · 摄影摄像与内容工作流',
  },
];

export default function HomeV2() {
  const root = useRef();
  const [libraryGlyph, setLibraryGlyph] = useState('想');
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray('[data-reveal]').forEach((element) => {
          gsap.from(element, {
            y: 44,
            opacity: 0,
            duration: 0.85,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              scroller: document.querySelector('main'),
              start: 'top 90%',
              once: true,
            },
          });
        });
        gsap.to('[data-statement-word]', {
          color: '#f6f6f6',
          stagger: 0.4,
          ease: 'none',
          scrollTrigger: {
            trigger: '#approach',
            scroller: document.querySelector('main'),
            start: 'top 68%',
            end: 'center 30%',
            scrub: 0.6,
          },
        });
        gsap.to('[data-process-line]', {
          scaleX: 1,
          transformOrigin: 'left',
          ease: 'none',
          scrollTrigger: {
            trigger: '#approach',
            scroller: document.querySelector('main'),
            start: 'top 50%',
            end: 'bottom 75%',
            scrub: 0.5,
          },
        });
        const scroller = document.querySelector('main');
        gsap.fromTo(
          '[data-approach-cut]',
          { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 90% 100%)' },
          {
            clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)',
            ease: 'none',
            scrollTrigger: {
              trigger: '#approach',
              scroller,
              start: 'top 80%',
              end: 'bottom 20%',
              scrub: 0.8,
            },
          },
        );
        gsap.fromTo(
          '[data-approach-mark]',
          { xPercent: 18, yPercent: 18, rotate: -18 },
          {
            xPercent: -8,
            yPercent: -12,
            rotate: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: '#approach',
              scroller,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        );
        gsap.to('[data-experience-surface]', {
          backgroundColor: '#dedede',
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-experience-surface]',
            scroller,
            start: 'top 55%',
            end: 'bottom 75%',
            scrub: 0.7,
          },
        });
        gsap.fromTo(
          '[data-library-cut]',
          { xPercent: -35, rotate: -14 },
          {
            xPercent: 35,
            rotate: 14,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-library-section]',
              scroller,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        );
        gsap.fromTo(
          '[data-library-glyph]',
          { yPercent: 16 },
          {
            yPercent: -15,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-library-section]',
              scroller,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          },
        );
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <div className={styles.root} ref={root}>
      <CustomHead
        title="陈祉辰｜AI 产品、内容与创作"
        description="陈祉辰的个人作品网站。记录 AI 产品、GEO 内容增长、知识工作流与视觉创作中的真实实践。"
        keywords={['陈祉辰', 'AI 产品', 'GEO', 'Agent', '内容工作流', '摄影', '个人作品集']}
      />
      <AvantHero />
      <ProjectStages />

      <section className={styles.approach} id="approach" aria-labelledby="approach-title">
        <div className={styles.approachAtmosphere} aria-hidden="true">
          <div className={styles.approachCut} data-approach-cut />
          <SignatureMark className={styles.approachMark} data-approach-mark />
        </div>
        <div className={styles.approachTop}>
          <span className={styles.eyebrow}>HOW I WORK / 工作方式</span>
          <SignatureMark className={styles.methodMark} />
        </div>
        <h2 id="approach-title">
          <span data-statement-word>先理解问题，</span>
          <br />
          <span data-statement-word>再把复杂的事</span>
          <br />
          <span data-statement-word>做得好用。</span>
        </h2>
        <div className={styles.methodBottom}>
          <p>
            让业务知识、模型能力与人的判断各就其位。
            <br />
            我关心每个环节怎样连接，也关心结果怎样被验证。
          </p>
          <div className={styles.process}>
            <div className={styles.processTrack}>
              <i data-process-line />
            </div>
            <div>
              <span>研究需求</span>
              <span>设计流程</span>
              <span>验证交付</span>
              <span>沉淀复用</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.experience} aria-labelledby="experience-title" data-experience-surface>
        <div className={styles.sectionHeading} data-reveal>
          <div>
            <span className={styles.eyebrow}>IN PRACTICE / 实践轨迹</span>
            <h2 id="experience-title">
              从现场，
              <br />
              积累判断。
            </h2>
          </div>
          <Link className={styles.textLink} href="/about" scroll={false}>
            进一步了解我 <span>↗</span>
          </Link>
        </div>
        <div className={styles.experienceList}>
          {experiences.map((entry, index) => (
            <details className={styles.experienceRow} key={entry.company} open={index === 0} data-reveal>
              <summary>
                <span className={styles.date}>{entry.date}</span>
                <span className={styles.company}>
                  {entry.company}
                  <small>{entry.role}</small>
                </span>
                <span className={styles.metric}>
                  {entry.metric}
                  <small>{entry.unit}</small>
                </span>
                <span className={styles.expandIcon} aria-hidden="true">
                  +
                </span>
              </summary>
              <div className={styles.experienceDetail}>
                <p>{entry.detail}</p>
                <span>{entry.note}</span>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.library} aria-labelledby="library-title" data-library-section>
        <div className={styles.libraryAtmosphere} aria-hidden="true">
          <i data-library-cut />
          <span data-library-glyph>
            <b key={libraryGlyph}>{libraryGlyph}</b>
          </span>
        </div>
        <div data-reveal>
          <span className={styles.eyebrow}>BEYOND PROJECTS / 项目之外</span>
          <h2 id="library-title">
            持续探索，
            <br />
            也持续分享<span>。</span>
          </h2>
          <p>
            把实践整理成教程，把观察写成文章。
            <br />
            工作之外，也用镜头发现另一种秩序。
          </p>
        </div>
        <div className={styles.libraryLinks} data-reveal>
          {[
            {
              href: '/tutorials',
              title: '教程与方法',
              text: 'Codex、AI 工具与图文实践',
              label: 'LEARN',
              glyph: '学',
            },
            {
              href: '/writing',
              title: '文字与思考',
              text: '关于 AI、产品和变化中的世界',
              label: 'THINK',
              glyph: '思',
            },
            {
              href: '/photography',
              title: '摄影',
              text: '观察、构图与影像表达',
              label: 'OBSERVE',
              glyph: '看',
            },
          ].map((entry) => (
            <Link href={entry.href} scroll={false} key={entry.href} onMouseEnter={() => setLibraryGlyph(entry.glyph)} onFocus={() => setLibraryGlyph(entry.glyph)}>
              <span className={styles.libraryLabel}>{entry.label}</span>
              <div>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </div>
              <span className={styles.libraryArrow}>↗</span>
            </Link>
          ))}
        </div>
      </section>

      <PianoLab />
    </div>
  );
}

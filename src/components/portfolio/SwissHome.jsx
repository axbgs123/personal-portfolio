/* eslint-disable jsx-a11y/media-has-caption -- These are source portfolio clips; no caption file was supplied. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import CustomHead from '@src/components/dom/CustomHead';
import originalProjects from '@src/constants/homeCarousel';
import { PlayTitle, OrbitDial } from './HomePlay';
import ContactDetails from './ContactDetails';
import styles from './swissHome.module.scss';

const projects = originalProjects.map((project) => ({
  ...project,
  img: `/art/swiss-covers/art-${project.id}.webp`,
}));
const competitorTracking = {
  id: 'creator-monitor-automation',
  category: 'Skill + 工作流 · 内容监控',
  title: '自媒体竞品追踪自动化',
  summary: '定时采集抖音与小红书对标账号、作品和评论，更新飞书内容库、仪表盘和每日竞品日报。',
  link: '/personal-skills/creator-monitor-automation',
};
const productFeaturedProjects = [projects[0], projects[1], competitorTracking, projects[2]];
const productAdvantages = [
  {
    label: '真实业务场景',
    title: '先在现场发现问题，再决定产品做什么。',
    description: '从企业 AI 实习、社群运营和客户交付中提炼需求，不凭空想象用户；能把零散反馈整理成明确的产品范围。',
    evidence: '两段 AI 实习 · 30+ 名客户',
  },
  {
    label: '产品化与验收',
    title: '把模糊需求变成可以落地的流程。',
    description: '覆盖需求拆解、信息结构、原型、协作开发和功能验收；重视人工确认、事实来源与结果边界。',
    evidence: '两项 0→1 产品实践',
  },
  {
    label: '内容与视觉执行',
    title: '既能规划产品，也能亲手把内容做出来。',
    description: '长期参与写作、拍摄、剪辑和内容生产，把一线制作经验反向用于 AI 工具和工作流设计。',
    evidence: '70+ 篇内容 · 60+ 场拍摄 · 支持发布 500+ 条视频',
  },
];
const productHighlights = [
  {
    category: 'AIGC',
    title: '赵云',
    description: '围绕人物一致性与电影化场景完成的一组生成式视觉。',
    image: '/aigc/zhaoyun/01.webp',
    href: '/aigc',
  },
  {
    category: '照片视频',
    title: '商业活动摄影与视频交付',
    description: '从现场拍摄、素材筛选到后期交付，保留真实商业项目证据。',
    image: '/migrated-portfolio/photo/jise-05.webp',
    href: '/photography/commercial-delivery',
  },
  {
    category: 'Skill 与工作流提效',
    title: 'Remotion 中文口播插入动画',
    description: '把口播中的数字、流程和因果关系做成可复用的竖屏动画工作流。',
    href: '/personal-skills/remotion-talking-head-inserts',
  },
];
const shelves = [
  ['项目', '/more-projects', '/art/swiss-covers/book-projects.webp', '产品与实践'],
  ['教程', '/tutorials', '/art/swiss-covers/book-tutorials.webp', '方法与实操'],
  ['照片视频', '/photography', '/art/swiss-covers/book-photography.webp', '影像与现场'],
  ['口播稿', '/writing', '/art/swiss-covers/book-writing.webp', '选题与表达'],
  ['Skill 与工作流提效', '/personal-skills', '/art/swiss-covers/book-skills.webp', '工具与自动化'],
  ['AIGC', '/aigc', '/art/swiss-covers/book-aigc.webp', '生成与创作'],
];

const directorFeaturedProjects = [competitorTracking];

const directorMedia = [
  {
    id: 'commerce-video',
    type: 'video',
    orientation: 'portrait',
    category: '照片视频',
    title: '电商引流',
    src: '/photography/company-negotiation/ecommerce-traffic.mp4',
    poster: '/photography/company-negotiation/ecommerce-traffic.webp',
    href: '/photography',
  },
  {
    id: 'campus-aigc-video',
    type: 'video',
    orientation: 'landscape',
    category: 'AIGC · 创亿鸭 AI 视频',
    title: '校园文创科技空间',
    src: '/migrated-portfolio/ip/campus-cultural-tech-space.mp4',
    poster: '/migrated-posters/campus-cultural-tech-space.webp',
    href: '/aigc',
  },
  {
    id: 'short-drama-episode-21',
    type: 'video',
    orientation: 'portrait',
    category: '真人竖屏短剧 · 成片',
    title: '成品案例：二十一集',
    src: '/migrated-portfolio/drama/episode-21-web.mp4',
    poster: '/migrated-posters/episode-21-web.webp',
    href: '/photography/short-drama',
  },
  {
    id: 'zhaoyun-aigc',
    type: 'image',
    orientation: 'landscape',
    category: 'AIGC',
    title: '赵云',
    src: '/aigc/zhaoyun/01.webp',
    href: '/aigc',
  },
  {
    id: 'lipstick-aigc',
    type: 'image',
    orientation: 'landscape',
    category: 'AIGC',
    title: '口红',
    src: '/aigc/lipstick/08.webp',
    href: '/aigc',
  },
];

const directorAdvantages = [
  {
    label: '高强度交付',
    title: '在直播节点前，把内容稳定交出来。',
    description: '服务头部达人直播电商团队，覆盖选题、脚本、剪辑包装与卡审修改，能适应密集排期和多轮反馈。',
    evidence: '36 天 92 条视频 · 约 230 个迭代版本',
  },
  {
    label: '编导全链路',
    title: '不只写脚本，也能完成拍摄与后期。',
    description: '从传播目标和商品卖点出发组织内容，独立推进选题、脚本、拍摄、剪辑、封面与交付。',
    evidence: '累计 60+ 条引流脚本 · 30+ 场个人拍摄',
  },
  {
    label: 'AI 内容提效',
    title: '把 AI 放进真实生产，而不是停在演示。',
    description: '参与 AI 视频全流程，并将研究、素材整理、图文与口播生产方法沉淀为教程和自动化工作流。',
    evidence: '30+ 条 AI 视频 · 70+ 篇 AI 口播稿',
  },
];

const directorHighlights = [
  {
    category: '教程',
    title: 'Codex 视频课配套资料',
    description: '从安装配置到多智能体协作的课程全文、配图与配套附件。',
    href: '/tutorials/codex-course',
  },
  {
    category: '教程',
    title: '图文教程',
    description: '查看已经完成的 AI 工具与工作流图文教程成品。',
    href: '/tutorials/illustrated',
  },
  {
    category: 'Skill 与工作流提效',
    title: '自媒体竞品追踪自动化',
    description: '定时采集对标账号、作品和评论，更新飞书内容库与竞品日报。',
    href: '/personal-skills/creator-monitor-automation',
  },
];

const homeModes = {
  product: {
    headTitle: '陈祉辰｜AI 产品、内容与创作',
    headDescription: '陈祉辰的个人作品网站。记录 AI 产品、GEO 内容增长、知识工作流与视觉创作中的真实实践。',
    role: 'AI 产品实习生 · 把业务问题整理成可落地、可验收的产品流程',
    primaryHref: '/more-projects',
    primaryLabel: '查看代表项目 ↗',
    aboutHref: '/about',
    featuredProjects: productFeaturedProjects,
    featuredCta: { href: '/more-projects', label: '4 项代表实践 · 查看全部 ↗' },
    advantageLead: '我的优势不只是“会使用 AI”，而是能把业务、产品、内容和交付放进同一条链路。',
    advantages: productAdvantages,
    highlights: productHighlights,
    highlightNote: '项目之外的内容、工具与影像',
    media: [],
  },
  director: {
    headTitle: '陈祉辰｜短视频编导与 AI 运营作品集',
    headDescription: '陈祉辰面向短视频编导与 AI 运营岗位的作品集，展示 AIGC、照片视频、直播引流内容与实操教程。',
    role: '短视频编导 / AI 运营 · 从选题、脚本到拍摄、剪辑与卡审，用 AI 提高内容产能',
    primaryHref: '/aigc',
    primaryLabel: '查看内容作品 ↗',
    aboutHref: '/director/about',
    featuredProjects: directorFeaturedProjects,
    featuredCta: {
      href: '/personal-skills/creator-monitor-automation',
      label: '查看完整工作流 ↗',
    },
    advantageLead: '我的优势，是能在真实交付压力下完成内容全链路，并用 AI 把生产经验变成更稳定的工作方法。',
    advantages: directorAdvantages,
    highlights: directorHighlights,
    highlightNote: '已经整理完成的教程与工作流',
    media: directorMedia,
  },
};

function ProjectArchive({ mode }) {
  return (
    <section className={styles.projects} id="work" aria-labelledby="featured-projects-title">
      <div className={styles.sectionHead}>
        <h2 id="featured-projects-title">
          <PlayTitle text="精选项目" />
        </h2>
        <Link href={mode.featuredCta.href} scroll={false}>
          {mode.featuredCta.label}
        </Link>
      </div>
      <div className={styles.projectGrid} data-count={mode.featuredProjects.length}>
        {mode.featuredProjects.map((project, index) => (
          <Link key={project.id} href={project.link} scroll={false} data-no-transition className={styles.projectCard}>
            <div className={styles.projectMeta}>
              <span className={styles.projectTag}>CASE {String(index + 1).padStart(2, '0')}</span>
              <span className={styles.openProject}>查看案例 ↗</span>
            </div>
            <div className={styles.projectCopy}>
              <span>{project.category}</span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MediaShowcase({ items }) {
  if (!items.length) return null;
  return (
    <section className={styles.mediaShowcase} data-swiss-reveal aria-labelledby="media-showcase-title">
      <div className={styles.sectionHead}>
        <h2 id="media-showcase-title">
          <PlayTitle text="成片与画面" />
        </h2>
        <Link href="/aigc" scroll={false}>
          查看 AIGC 与照片视频 ↗
        </Link>
      </div>
      <div className={styles.mediaGrid}>
        {items.map((item) => (
          <article className={styles.mediaCard} key={item.id} data-orientation={item.orientation || 'landscape'}>
            <div className={styles.mediaFrame}>
              {item.type === 'video' ? <video src={item.src} poster={item.poster} controls playsInline preload="none" /> : <img src={item.src} alt={item.title} loading="lazy" />}
            </div>
            <Link href={item.href} scroll={false} className={styles.mediaCaption}>
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <i aria-hidden="true">↗</i>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SwissHome({ variant = 'product' }) {
  const root = useRef(null);
  const portal = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const tween = useRef(null);
  const [flight, setFlight] = useState(null);
  const router = useRouter();
  const mode = homeModes[variant] || homeModes.product;
  useEffect(() => {
    mounted.current = true;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    root.current.querySelectorAll('[data-swiss-reveal]').forEach((element) => observer.observe(element));
    return () => {
      mounted.current = false;
      observer.disconnect();
      tween.current?.kill();
    };
  }, []);
  useEffect(() => {
    if (!flight || !portal.current) return undefined;
    const { rect, href } = flight;
    tween.current = gsap.fromTo(
      portal.current,
      {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        rotate: -3,
        opacity: 1,
      },
      {
        left: -window.innerWidth * 0.1,
        top: -window.innerHeight * 0.1,
        width: window.innerWidth * 1.2,
        height: window.innerHeight * 1.2,
        rotate: 0,
        duration: 0.95,
        ease: 'power3.inOut',
        onComplete: async () => {
          try {
            await router.push(href, undefined, { scroll: false });
          } catch {
            // A failed/cancelled route must release the zoom layer, not trap the page.
          } finally {
            if (mounted.current) {
              setFlight(null);
              busy.current = false;
            }
          }
        },
      },
    );
    return () => tween.current?.kill();
  }, [flight, router]);
  const openBook = (e, item) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const rect = e.currentTarget.querySelector('[data-book]').getBoundingClientRect();
    setFlight({ rect, href: item[1], title: item[0], img: item[2] });
  };
  return (
    <div ref={root} className={styles.root} data-swiss-home>
      <CustomHead title={mode.headTitle} description={mode.headDescription} />
      <section className={styles.hero} aria-label="陈祉辰">
        <h1 aria-label="陈祉辰 CHEN ZHICHEN">
          <span>
            <PlayTitle text="CHEN" invertedIndices={[0]} />
          </span>
          <span>
            <PlayTitle text="ZHICHEN" invertedIndices={[0, 3]} />
          </span>
        </h1>
        <div className={styles.heroBottom}>
          <div>
            <p>陈祉辰</p>
            <span>{mode.role}</span>
            <div className={styles.heroLinks}>
              <Link href={mode.primaryHref} scroll={false}>
                {mode.primaryLabel}
              </Link>
              <Link href={mode.aboutHref} scroll={false}>
                经历与能力 ↗
              </Link>
            </div>
          </div>
          <OrbitDial />
        </div>
      </section>
      <ProjectArchive mode={mode} />
      <MediaShowcase items={mode.media} />
      <section className={styles.advantages} data-swiss-reveal aria-labelledby="advantages-title">
        <div className={styles.sectionHead}>
          <h2 id="advantages-title">
            <PlayTitle text="为什么是我" />
          </h2>
          <Link href={mode.aboutHref} scroll={false}>
            查看完整经历 ↗
          </Link>
        </div>
        <p className={styles.advantageLead}>{mode.advantageLead}</p>
        <div className={styles.advantageGrid}>
          {mode.advantages.map((advantage) => (
            <article key={advantage.label} className={styles.advantageCard}>
              <span>{advantage.label}</span>
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
              <small>{advantage.evidence}</small>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.highlights} data-swiss-reveal aria-labelledby="other-highlights-title">
        <div className={styles.sectionHead}>
          <h2 id="other-highlights-title">
            <PlayTitle text="其他实践" />
          </h2>
          <span>{mode.highlightNote}</span>
        </div>
        <div className={styles.highlightGrid}>
          {mode.highlights.map((item) => (
            <Link key={item.href} href={item.href} scroll={false} className={`${styles.highlightCard} ${!item.image ? styles.highlightCardTextOnly : ''}`}>
              {item.image && (
                <span className={styles.highlightImage}>
                  <img src={item.image} alt="" loading="lazy" />
                </span>
              )}
              <span className={styles.highlightCopy}>
                <small>{item.category}</small>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <i aria-hidden="true">↗</i>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className={styles.library} id="library" data-swiss-reveal>
        <div className={styles.sectionHead}>
          <h2>
            <PlayTitle text="作品仓库" />
          </h2>
          <span>打开一本，走进其中 ↗</span>
        </div>
        <div className={styles.shelves}>
          {shelves.map((item) => (
            <Link key={item[1]} href={item[1]} scroll={false} data-no-transition className={styles.shelf} onClick={(e) => openBook(e, item)}>
              <span className={styles.book} data-book aria-hidden="true">
                <span className={styles.pages}>
                  <b>{item[3]}</b>
                  <small>进入阅读 ↗</small>
                </span>
                <span className={styles.leaf} />
                <span className={styles.cover}>
                  <img src={item[2]} alt="" loading="lazy" />
                  <span>CZ / {item[0]}</span>
                </span>
              </span>
              <span className={styles.bookTitle}>
                <PlayTitle text={item[0]} />
                <small>↗</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <footer className={styles.contact} id="contact">
        <h2>联系我</h2>
        <div className={styles.contactTitle}>
          <p>
            <PlayTitle text="一起做出来。" />
          </p>
          <a href="mailto:2907107669@qq.com" aria-label="发送邮件">
            →
          </a>
        </div>
        <ContactDetails />
        <div className={styles.signoff}>
          <span>CZ</span>
          <span>CHEN ZHICHEN</span>
        </div>
      </footer>
      {flight &&
        createPortal(
          <div className={styles.flight} ref={portal} aria-hidden="true">
            <img src={flight.img} alt="" />
            <span>{flight.title}</span>
            <i />
          </div>,
          document.body,
        )}
    </div>
  );
}

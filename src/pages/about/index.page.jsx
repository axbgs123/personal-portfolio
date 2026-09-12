import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import CustomHead from '@src/components/dom/CustomHead';
import styles from './resumeV2.module.scss';

const productExperience = [
  {
    date: '2026.07 — 2026.09',
    type: '实习经历',
    company: '百言科技（杭州）有限公司',
    role: 'AI 实习生',
    summary: '从企业需求出发，参与 AI 应用与 GEO 内容增长产品的设计和交付。',
    details: [
      '开展方法调研、用户访谈和需求拆解，参与工作流程、质量规则与验收标准设计，与开发人员共同推进功能交付。',
      '参与 2000+ 人付费 AI 学习社群运营，累计输出 70+ 篇文章与实操教程；参与企业 AI 先锋训练营课程设计、资料整合与答疑，团队累计服务 400+ 名学员。',
      '参与企业 AI 流程诊断与定制 Skill 交付，将企业知识、岗位流程、工具调用和验收规则整理为可复用的知识库、Agent 与 Skill。',
      '独立完成公司官网的页面设计、内容搭建与部署上线。',
    ],
    link: '/projects/project2',
    linkLabel: '查看 GEO 内容增长项目',
  },
  {
    date: '2026.03 — 2026.05',
    type: '实习经历',
    company: '福建赛牡丹数字科技有限公司',
    role: 'AI 实习生',
    summary: '把客户下单、资料归档与内容生产，连接成可重复使用的工作流程。',
    details: [
      '开发内部 AI 自动化工具，串联客户下单、飞书表格归档与产品打印，将分散的人工操作整合为标准化流程。',
      '负责“创亿鸭”产品线规划，面向学校和企业客户梳理业务需求，搭建 AI 视频定制生产流程。',
      '为管理层提供 AI 应用咨询，建设飞书问答知识库，整理 40+ 个高频问题，并编写 50+ 篇教程与工具应用资料。',
    ],
  },
  {
    date: '2024.03 — 2026.03',
    type: '独立实践',
    company: '个人摄影摄像工作室',
    role: '创始人',
    summary: '从客户沟通到项目交付，也从内容创作走向内容生产工具的设计。',
    details: [
      '负责客户沟通、需求拆解、创意策划和项目交付，累计服务 30+ 名客户，完成 60+ 场拍摄。',
      '针对直播切片业务中的多账号、多商品、多素材问题，设计文案生产工具，整合 RAG 知识库、结构化输入、内容风控与剪映导出流程，累计支持发布 500+ 条视频。',
      '根据客户业务场景定制 Skill 和 Workflow，将重复性内容生产步骤封装为可复用的标准流程。',
    ],
    link: '/photography',
    linkLabel: '查看摄影作品',
  },
];

const productCapabilities = [
  {
    title: '产品研究与设计',
    description: '用户访谈、需求分析、竞品研究、产品流程设计、PRD 撰写、原型设计、功能验收及数据复盘。',
    tools: 'Axure / 墨刀 / Figma',
  },
  {
    title: 'AI 应用与工作流',
    description: 'Agent 与 Skill 设计、RAG 知识库搭建、Prompt 工程、MCP 工具接入、模型选型及人工审核流程设计。',
    tools: 'Agent / Skill / RAG / MCP',
  },
  {
    title: '内容与视觉表达',
    description: '将需求转化为内容方案，结合拍摄、剪辑、平面设计与三维工具完成视觉表达和项目交付。',
    tools: '剪映 / After Effects / Photoshop / Blender',
  },
  {
    title: '协作与项目交付',
    description: '覆盖需求调研、方案设计、原型搭建、协作开发、测试验收和知识整理等环节。',
    tools: '飞书多维表格 / 知识库 / 验收规则',
  },
];

const directorExperience = [
  {
    date: '2026.07 — 2026.09',
    type: '实习经历',
    company: '杭州美遇未来电子商务有限公司',
    role: '编导实习生',
    summary: '在头部达人直播电商团队中，围绕直播节点完成高密度内容生产与迭代。',
    details: [
      '负责选题、引流脚本、剪辑包装与卡审修改，36 天完成约 92 条品牌视频、60+ 个封面及约 230 个迭代版本，覆盖 8 个品牌。',
      '参与优时颜、绽家、毛戈平等品牌专场内容生产；能根据卖点、节奏和审核反馈快速调整成片。',
      '输出 AI 数字人内容需求，并完成“金斧头银斧头”等 AI 引流短片。',
    ],
    link: '/photography',
    linkLabel: '查看照片视频',
  },
  {
    date: '2026.04 — 2026.07',
    type: '实习经历',
    company: '百言科技（杭州）有限公司',
    role: 'AI 新媒体运营',
    summary: '服务 AI 知识内容账号，把资料研究、口播稿和多平台运营连接成稳定流程。',
    details: ['围绕 Agent、Skill、AI 工具与行业热点完成选题、研究和内容制作，累计输出 70+ 篇口播稿与实操教程。', '参与 2000+ 人付费社群的答疑与需求整理，并参与训练营课程运营和多平台内容分发。'],
    link: '/writing',
    linkLabel: '查看口播稿',
  },
  {
    date: '2026.03 — 2026.04',
    type: '实习经历',
    company: '福建赛牡丹数字科技有限公司',
    role: 'AI 运营实习生',
    summary: '参与“创亿鸭”AI 视频服务，将生成工具用于真实客户内容生产。',
    details: ['独立参与 AI 视频生成全流程，累计产出 30+ 条 AI 视频，服务学校与企业单位。', '整理 40+ 个常见问题与 50+ 篇工具教程，并完成抖音、小红书和视频号内容拍摄剪辑 30+ 条。'],
    link: '/aigc',
    linkLabel: '查看 AIGC 作品',
  },
  {
    date: '2025.09 — 2026.06',
    type: '项目经历',
    company: '校园拍摄服务团队',
    role: '负责人',
    summary: '从客户传播需求出发，完成策划、拍摄、剪辑与交付。',
    details: ['团队累计服务 20+ 位客户，个人完成 30+ 场拍摄；参与十集真人短剧的辅助拍摄与后期剪辑。', '参与直播切片内容生产，团队累计制作 500+ 条视频。'],
    link: '/photography/commercial-delivery',
    linkLabel: '查看影像交付',
  },
];

const directorCapabilities = [
  {
    title: '编导与内容策划',
    description: '从传播目标、受众和卖点出发完成选题、引流脚本、内容结构与卡审修改。',
    tools: '抖音 / 小红书 / 视频号',
  },
  {
    title: '拍摄与后期',
    description: '可独立完成活动、人物与产品内容的拍摄、精剪、字幕包装、封面设计和交付。',
    tools: 'Premiere / After Effects / 剪映 / Photoshop',
  },
  {
    title: 'AIGC 内容生产',
    description: '把生图、生视频、数字人与自动化工具接入真实内容流程，并保留人工审核。',
    tools: '即梦 AI / Midjourney / Codex / DeepSeek',
  },
  {
    title: '运营与复盘',
    description: '熟悉多平台内容运营、数据观察、社群反馈整理和高频问题知识化。',
    tools: '数据复盘 / 飞书 / 内容工作流',
  },
];

const aboutModes = {
  product: {
    title: '关于陈祉辰｜AI 产品、内容与创作',
    description: '了解陈祉辰在 AI 产品、内容增长与视觉创作领域的实践经历，以及教育背景、产品设计与项目交付能力。',
    keywords: ['陈祉辰', 'AI 产品', '内容创作', '个人经历', '产品作品集'],
    role: 'AI 产品、内容与创作',
    statement: (
      <>
        从问题出发，
        <br />
        让想法走进真实业务。
      </>
    ),
    discipline: '数字媒体技术 · 产品 × AI × 内容',
    sideNote: (
      <>
        从内容创作走进企业业务，
        <br />
        持续实践 AI 产品的设计与交付。
      </>
    ),
    projectHref: '/more-projects',
    projectLabel: '查看代表项目',
    experience: productExperience,
    capabilities: productCapabilities,
  },
  director: {
    title: '关于陈祉辰｜短视频编导与 AI 运营',
    description: '了解陈祉辰在短视频编导、直播电商、AIGC 内容生产、拍摄剪辑与 AI 新媒体运营方面的实践。',
    keywords: ['陈祉辰', '短视频编导', 'AI 运营', 'AIGC', '视频作品集'],
    role: '短视频编导 / AI 运营',
    statement: (
      <>
        从选题到成片，
        <br />
        把内容准时交到现场。
      </>
    ),
    discipline: '数字媒体技术 · 编导 × 运营 × AIGC',
    sideNote: (
      <>
        能写、能拍、能剪，
        <br />
        也能用 AI 提高内容产能。
      </>
    ),
    projectHref: '/aigc',
    projectLabel: '查看内容作品',
    experience: directorExperience,
    capabilities: directorCapabilities,
  },
};

export default function AboutPage({ variant = 'product' }) {
  const pageRef = useRef();
  const [activeChapter, setActiveChapter] = useState(0);
  const mode = aboutModes[variant] || aboutModes.product;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const chapterContext = gsap.context(() => {
      const scroller = document.querySelector('main');
      const chapters = gsap.utils.toArray('[data-about-chapter]');
      chapters.forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter,
          endTrigger: chapters[index + 1],
          scroller,
          start: 'top 52%',
          end: index === chapters.length - 1 ? 'bottom top' : 'top 52%',
          onEnter: () => setActiveChapter(index),
          onEnterBack: () => setActiveChapter(index),
          onRefresh: (self) => {
            if (self.isActive) setActiveChapter(index);
          },
        });
      });
    }, pageRef);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('[data-about-letter]', {
          yPercent: 115,
          rotate: 8,
          duration: 1.3,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.05,
        });
        gsap.from('[data-about-intro]', {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          delay: 0.55,
          ease: 'power2.out',
        });
        gsap.to('[data-about-outline]', {
          xPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-about-hero]',
            scroller: document.querySelector('main'),
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
        // One reversible scroll field, independent of the chapter navigation state.
        // Text stays fully visible while only the dark surface and its plane move.
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: '[data-about-resume]',
              scroller: document.querySelector('main'),
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            '[data-about-resume]',
            { '--resume-surface': '#101010' },
            {
              '--resume-surface': '#242424',
              duration: 0.55,
              ease: 'sine.inOut',
            },
            0,
          )
          .to(
            '[data-about-resume]',
            {
              '--resume-surface': '#161616',
              duration: 0.45,
              ease: 'sine.inOut',
            },
            0.55,
          )
          .fromTo('[data-about-plane]', { xPercent: -22, yPercent: -6, rotation: -2 }, { xPercent: 22, yPercent: 6, rotation: 2, duration: 1 }, 0);
        gsap.fromTo(
          '[data-about-progress]',
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-about-resume]',
              scroller: document.querySelector('main'),
              start: 'top 40%',
              end: 'bottom bottom',
              scrub: 0.3,
            },
          },
        );
      }, pageRef);
      return () => context.revert();
    });
    return () => {
      media.revert();
      chapterContext.revert();
    };
  }, []);

  return (
    <>
      <CustomHead title={mode.title} description={mode.description} keywords={mode.keywords} />
      <div className={styles.page} ref={pageRef}>
        <header className={styles.hero} data-about-hero>
          <div className={styles.heroTop} data-about-intro>
            <span>关于我</span>
            <span>浙江 · 杭州</span>
          </div>
          <div className={styles.nameLine}>
            <h1 aria-label="陈祉辰">
              {['陈', '祉', '辰'].map((letter) => (
                <span aria-hidden="true" data-about-letter key={letter}>
                  {letter}
                </span>
              ))}
            </h1>
            <span className={styles.nameEn} data-about-intro>
              CHEN
              <br />
              ZHICHEN
            </span>
          </div>
          <div className={styles.heroLower}>
            <span className={styles.heroArrow} aria-hidden="true" data-about-intro>
              ↘
            </span>
            <div className={styles.heroStatement} data-about-intro>
              <p className={styles.heroRole}>{mode.role}</p>
              <p>{mode.statement}</p>
            </div>
          </div>
          <div className={styles.heroBottom} data-about-intro>
            <span>{mode.discipline}</span>
            <a href="mailto:2907107669@qq.com">
              2907107669@qq.com <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={styles.heroOutline} data-about-outline aria-hidden="true">
            陈祉辰
          </div>
        </header>

        <div className={styles.resumeLayout} data-about-resume>
          <div className={styles.resumeAtmosphere} aria-hidden="true">
            <div className={styles.chapterStage}>
              <i className={styles.chapterPlane} data-about-plane />
            </div>
          </div>
          <aside className={styles.sidebar} aria-label="关于我内容导航">
            <div className={styles.sidebarInner}>
              <p className={styles.sideStatement}>
                实践，
                <br />
                持续发生<span>。</span>
              </p>
              <nav>
                <a href="#experience" aria-current={activeChapter < 3 ? 'location' : undefined}>
                  实践经历 <span aria-hidden="true">↘</span>
                </a>
                <a href="#education" aria-current={activeChapter === 3 ? 'location' : undefined}>
                  教育背景 <span aria-hidden="true">↘</span>
                </a>
                <a href="#capabilities" aria-current={activeChapter === 4 ? 'location' : undefined}>
                  工具与技能 <span aria-hidden="true">↘</span>
                </a>
              </nav>
              <div className={styles.chapterProgress} aria-hidden="true">
                <i data-about-progress />
              </div>
              <p className={styles.sideNote}>{mode.sideNote}</p>
              <Link className={styles.sideProjectLink} href={mode.projectHref}>
                {mode.projectLabel} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </aside>

          <div className={styles.resumeBody}>
            <section id="experience" className={styles.resumeSection} aria-labelledby="experience-title">
              <div className={styles.sectionHeading} data-about-reveal>
                <h2 id="experience-title">实践经历</h2>
                <span>EXPERIENCE</span>
              </div>
              {mode.experience.map((item) => (
                <article className={styles.experience} key={item.company} data-about-chapter data-about-reveal>
                  <div className={styles.experienceMeta}>
                    <span>{item.date}</span>
                    <span>{item.type}</span>
                  </div>
                  <div className={styles.experienceTitle}>
                    <h3>{item.company}</h3>
                    <p>{item.role}</p>
                  </div>
                  <p className={styles.experienceSummary}>{item.summary}</p>
                  <ul>
                    {item.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  {item.link && (
                    <Link className={styles.textLink} href={item.link}>
                      {item.linkLabel} <span aria-hidden="true">↗</span>
                    </Link>
                  )}
                </article>
              ))}
            </section>

            <section id="education" className={styles.resumeSection} aria-labelledby="education-title" data-about-chapter>
              <div className={styles.sectionHeading} data-about-reveal>
                <h2 id="education-title">教育背景</h2>
                <span>EDUCATION</span>
              </div>
              <div className={styles.education} data-about-reveal>
                <p className={styles.educationDate}>2023.09 — 2027.06</p>
                <h3>泉州师范学院</h3>
                <p className={styles.degree}>数字媒体技术 · 本科</p>
                <div className={styles.courseList}>
                  <span>主修课程</span>
                  <p>用户体验设计、人工智能、数字图像处理、影视制作与合成、设计色彩方法学</p>
                </div>
              </div>
            </section>

            <section id="capabilities" className={styles.resumeSection} aria-labelledby="capabilities-title" data-about-chapter>
              <div className={styles.sectionHeading} data-about-reveal>
                <h2 id="capabilities-title">工具与技能</h2>
                <span>CAPABILITIES</span>
              </div>
              <div className={styles.capabilities}>
                {mode.capabilities.map((item) => (
                  <article className={styles.capability} key={item.title} data-about-reveal>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span>{item.tools}</span>
                  </article>
                ))}
              </div>
            </section>
            <div className={styles.contactLine} data-about-reveal>
              <p>期待一起，把想法推进到交付。</p>
              <a href="mailto:2907107669@qq.com">
                邮件联系 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

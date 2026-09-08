import AppearByWords from '@src/components/animationComponents/appearByWords/Index';
import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import Badge from '@src/pages/components/clients/components/Badge';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/clients/styles/clients.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useWindowSize } from '@darkroom.engineering/hamo';

const experiences = [
  {
    date: '2026.07 — 09',
    title: '百言科技｜AI 实习生',
    lines: [
      '参与企业 AI 应用与 GEO 内容增长产品的需求拆解、流程设计和验收交付。',
      '服务 2000+ 人付费社群，输出 70+ 篇文章与教程，团队累计服务 400+ 名学员。',
      '将企业知识、岗位流程和验收规则整理为可复用的知识库、Agent 与 Skill。',
    ],
  },
  {
    date: '2026.03 — 05',
    title: '赛牡丹数字科技｜AI 实习生',
    lines: [
      '开发内部 AI 自动化工具，串联客户下单、飞书归档与产品打印流程。',
      '负责“创亿鸭”产品线规划，搭建面向学校和企业客户的 AI 视频定制流程。',
      '建设 40+ 个高频问题的飞书知识库，并编写 50+ 篇教程与工具应用资料。',
    ],
  },
  {
    date: '2024 — 2026',
    title: '个人摄影摄像工作室｜创始人',
    lines: [
      '从客户沟通、需求拆解到创意策划与交付，累计服务 30+ 名客户、完成 60+ 场拍摄。',
      '设计直播切片文案生产工具，整合 RAG、结构化输入、风控与剪映导出。',
      '工具累计支持发布 500+ 条视频，并将重复环节沉淀为可复用的 Skill 与 Workflow。',
    ],
  },
];

function ClientDescription({ experience }) {
  return (
    <AppearTitle>
      {experience.lines.map((line) => (
        <div key={line} className="p-l">
          {line}
        </div>
      ))}
    </AppearTitle>
  );
}

function Clients() {
  const isMobile = useIsMobile();
  const textRefs = useRef([]);
  const badgeRefs = useRef([]);
  const rootRef = useRef();
  const windowSize = useWindowSize();

  const setupScrollAnimation = () => {
    const ctx = gsap.context(() => {
      if (!isMobile) {
        const vw = (coef) => windowSize.height * (coef / 100);
        textRefs.current.forEach((textRef, index) => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: rootRef.current,
                start: index === 0 ? `top-=${vw(35)}` : `top+=${vw(35 + 5.5555556 * index)}`,
                end: index === 0 ? `bottom-=${vw(35 + 5.5555556 * index)}` : `bottom+=${vw(25)}`,
                toggleActions: 'play none reverse none',
                scrub: true,
                scroller: document?.querySelector('main'),
                invalidateOnRefresh: true,
              },
            })
            .to(textRef, {
              top: `${10 + 30 * index + 5.5555556 * index}vw`,
            });
        });
      }
    });

    return ctx;
  };

  useIsomorphicLayoutEffect(() => {
    const ctx = setupScrollAnimation(textRefs, rootRef, windowSize, isMobile);
    return () => ctx.kill();
  }, [isMobile, windowSize.height]);

  return (
    <section ref={rootRef} className={clsx(styles.root, 'layout-grid-inner')}>
      <h1 className={clsx(styles.sectionTitle, 'h1')}>
        <AppearByWords>实践经历</AppearByWords>
      </h1>
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>{experiences[0].date}</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[0] = el;
        }}
        className={styles.first}
      >
        <Badge name="company1" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>{experiences[0].title}</h4>
          </AppearTitle>
          <ClientDescription experience={experiences[0]} />
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div className={styles.firstEmpty} />
          <div
            ref={(el) => {
              textRefs.current[0] = el;
            }}
            className={styles.firstText}
          >
            <AppearTitle>
              <h6 className="h6">{experiences[0].date}</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>{experiences[0].title}</h4>
            </AppearTitle>
            <ClientDescription experience={experiences[0]} />
          </div>
        </>
      ) : null}
      {!isMobile ? <div className={styles.secondEmpty} /> : null}
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>{experiences[1].date}</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[1] = el;
        }}
        className={styles.second}
      >
        <Badge name="company2" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>{experiences[1].title}</h4>
          </AppearTitle>
          <ClientDescription experience={experiences[1]} />
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div
            ref={(el) => {
              textRefs.current[1] = el;
            }}
            className={styles.secondText}
          >
            <AppearTitle>
              <h6 className="h6">{experiences[1].date}</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>{experiences[1].title}</h4>
            </AppearTitle>
            <ClientDescription experience={experiences[1]} />
          </div>
          <div className={styles.fourthEmpty} />
        </>
      ) : null}
      {isMobile ? <div className={styles.mobileEmpty} /> : null}
      {isMobile ? (
        <div className={styles.mobileCount}>
          <AppearTitle>{experiences[2].date}</AppearTitle>
        </div>
      ) : null}
      <div
        ref={(el) => {
          badgeRefs.current[2] = el;
        }}
        className={styles.third}
      >
        <Badge name="company3" />
      </div>
      {isMobile ? <div className={styles.mobileEmptySecond} /> : null}
      {isMobile ? (
        <div className={styles.textMobile}>
          <AppearTitle>
            <h4 className={clsx('h4', 'bold')}>{experiences[2].title}</h4>
          </AppearTitle>
          <ClientDescription experience={experiences[2]} />
        </div>
      ) : null}
      {!isMobile ? (
        <>
          <div className={styles.fifthEmpty} />
          <div
            ref={(el) => {
              textRefs.current[2] = el;
            }}
            className={styles.thirdText}
          >
            <AppearTitle>
              <h6 className="h6">{experiences[2].date}</h6>
            </AppearTitle>
            <AppearTitle>
              <h4 className={clsx('h4', 'bold', styles.title)}>{experiences[2].title}</h4>
            </AppearTitle>
            <ClientDescription experience={experiences[2]} />
          </div>
        </>
      ) : null}
    </section>
  );
}

export default Clients;

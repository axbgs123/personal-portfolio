import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import clsx from 'clsx';
import navigateToReadingSection from '@src/pages/tutorials/components/navigateToReadingSection';
import readerStyles from '@src/pages/tutorials/codexCourse.module.scss';
import styles from '@src/pages/projects/components/operationsAi/operationsAiProject.module.scss';

function OperationsAiProject({ project, projectHtml, projectToc, nextProject }) {
  const allSections = useMemo(() => projectToc.flatMap((section) => [section, ...section.children]), [projectToc]);
  const [activeSection, setActiveSection] = useState(allSections[0]?.id);

  useEffect(() => {
    const root = document.querySelector('main');
    const sections = allSections.map((section) => document.getElementById(section.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) setActiveSection(visibleEntry.target.id);
      },
      { root, rootMargin: '-8% 0px -82% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [allSections]);

  const navigateToSection = (event, id) => {
    if (navigateToReadingSection(event, id)) setActiveSection(id);
  };

  return (
    <>
      <section className={clsx(readerStyles.hero, styles.hero, 'layout-grid-inner')}>
        <div className={clsx(readerStyles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/projects">
            全部项目
          </Link>
          <span>/</span>
          <span>{project.title}</span>
        </div>

        <div className={readerStyles.heroCopy}>
          <div className={clsx(readerStyles.eyebrow, 'p-l')}>产品负责人 / AI 协作开发 · 2026</div>
          <h1 className={clsx(readerStyles.title, styles.title, 'h1')}>
            <span>AI 运营智能体</span> <span>与内容分析生成平台</span>
          </h1>
          <p className={clsx(readerStyles.lead, 'h6')}>面向抖音和小红书运营团队，从数据分析到内容生成，让智能体的建议可以执行、审核和复盘。</p>
        </div>

        <div className={readerStyles.heroImage}>
          <Image priority src={project.img} fill sizes="(max-width: 768px) 100vw, 92vw" alt="AI 生成概念封面：素材片层、黑色智能体雕塑与内容输出阵列" />
        </div>

        <div className={styles.stats}>
          <div>
            <span className="h4">0 → 1</span>
            <span className="p-x">MVP 产品规划</span>
          </div>
          <div>
            <span className="h4">2</span>
            <span className="p-x">目标运营平台</span>
          </div>
          <div>
            <span className="h4">3</span>
            <span className="p-x">运营资产分类</span>
          </div>
          <div>
            <span className="h4">人工确认</span>
            <span className="p-x">任务执行前置条件</span>
          </div>
        </div>

        <div className={styles.boundary}>
          <span className="p-x">展示边界</span>
          <p className="p-l">页面账号、内容和指标均为合成演示数据；自动化回归、Mock 模型和固定评估集不代表真实生产效果。</p>
        </div>
      </section>

      <section className={clsx(readerStyles.course, styles.caseStudy, 'layout-grid-inner')}>
        <aside className={readerStyles.sidebar} aria-label="项目案例目录">
          <div className={clsx(readerStyles.sidebarTitle, 'p-x')}>案例目录</div>
          <nav>
            {projectToc.map((section, sectionIndex) => {
              const isGroupActive = activeSection === section.id || section.children.some((child) => child.id === activeSection);

              return (
                <div className={readerStyles.tocGroup} key={section.id}>
                  <a
                    className={clsx(readerStyles.navItem, isGroupActive && readerStyles.navItemActive)}
                    href={`#${section.id}`}
                    onClick={(event) => navigateToSection(event, section.id)}
                    aria-current={activeSection === section.id ? 'location' : undefined}
                  >
                    <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
                    <span>{section.title}</span>
                  </a>
                  {section.children.length ? (
                    <div className={readerStyles.subNav}>
                      {section.children.map((child) => (
                        <a
                          key={child.id}
                          className={clsx(readerStyles.subNavItem, activeSection === child.id && readerStyles.subNavItemActive)}
                          href={`#${child.id}`}
                          onClick={(event) => navigateToSection(event, child.id)}
                          aria-current={activeSection === child.id ? 'location' : undefined}
                        >
                          {child.title}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
          <Link className={readerStyles.backLink} scroll={false} href="/projects">
            ← 返回项目列表
          </Link>
        </aside>

        <div className={readerStyles.content}>
          {/* The project case-study Markdown is trusted user-provided source material generated into static HTML. */}
          {/* eslint-disable-next-line react/no-danger */}
          <article className={clsx(readerStyles.prose, styles.prose)} dangerouslySetInnerHTML={{ __html: projectHtml }} />

          <div className={readerStyles.courseEnd}>
            <div className="p-x">项目结论</div>
            <h2 className="h3">一个边界清楚、可继续验证的运营 AI 工程型 MVP。</h2>
            <Link scroll={false} href="/projects">
              返回全部项目 ↗
            </Link>
          </div>
        </div>
      </section>

      <NextProject nextProject={nextProject} />
    </>
  );
}

export default OperationsAiProject;

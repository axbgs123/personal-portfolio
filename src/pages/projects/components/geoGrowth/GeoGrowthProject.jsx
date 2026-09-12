import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import clsx from 'clsx';
import navigateToReadingSection from '@src/pages/tutorials/components/navigateToReadingSection';
import readerStyles from '@src/pages/tutorials/codexCourse.module.scss';
import styles from '@src/pages/projects/components/geoGrowth/geoGrowthProject.module.scss';

function GeoGrowthProject({ project, projectHtml, projectToc, nextProject }) {
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
      { root, rootMargin: '-4% 0px -72% 0px', threshold: 0 },
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
          <Link scroll={false} href="/more-projects">
            全部项目
          </Link>
          <span>/</span>
          <span>{project.title}</span>
        </div>

        <div className={readerStyles.heroCopy}>
          <div className={clsx(readerStyles.eyebrow, 'p-l')}>GEO 方法与产品策划负责人 · 2026</div>
          <h1 className={clsx(readerStyles.title, styles.title, 'h1')}>
            <span>百言 GEO</span> <span>内容增长系统</span>
          </h1>
          <p className={clsx(readerStyles.lead, 'h6')}>把问题研究、知识证据、内容生产、质量审核与矩阵发布连接成可持续迭代的增长工作流。</p>
        </div>

        <div className={readerStyles.heroImage}>
          <Image priority src={project.img} fill sizes="(max-width: 768px) 100vw, 92vw" alt="AI 生成概念封面：知识印刷块与逐步展开的内容矩阵" />
        </div>

        <div className={styles.stats}>
          <div>
            <span className="h4">19</span>
            <span className="p-x">内容活动</span>
          </div>
          <div>
            <span className="h4">158</span>
            <span className="p-x">覆盖单元</span>
          </div>
          <div>
            <span className="h4">125</span>
            <span className="p-x">知识资产</span>
          </div>
          <div>
            <span className="h4">45</span>
            <span className="p-x">已发布文章</span>
          </div>
        </div>

        <div className={styles.boundary}>
          <span className="p-x">公开展示边界</span>
          <p className="p-l">公开文章、可公开引用的知识内容、产品功能与成果数据保持可读；账号、域名、内部活动、搜索需求、任务指令、链接与运行结果均已脱敏。</p>
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
          <Link className={readerStyles.backLink} scroll={false} href="/more-projects">
            ← 返回项目列表
          </Link>
        </aside>

        <div className={readerStyles.content}>
          {/* The case-study Markdown is trusted user-provided source material generated into static HTML. */}
          {/* eslint-disable-next-line react/no-danger */}
          <article className={clsx(readerStyles.prose, styles.prose)} dangerouslySetInnerHTML={{ __html: projectHtml }} />

          <div className={readerStyles.courseEnd}>
            <div className="p-x">项目结论</div>
            <h2 className="h3">把 GEO 方法、知识证据、内容任务与人工审核组织成可持续改进的产品链路。</h2>
            <Link scroll={false} href="/more-projects">
              返回全部项目 ↗
            </Link>
          </div>
        </div>
      </section>

      <NextProject nextProject={nextProject} />
    </>
  );
}

export default GeoGrowthProject;

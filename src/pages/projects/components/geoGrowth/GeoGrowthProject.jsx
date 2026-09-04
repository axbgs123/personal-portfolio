import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import clsx from 'clsx';
import readerStyles from '@src/pages/tutorials/codexCourse.module.scss';
import styles from '@src/pages/projects/components/geoGrowth/geoGrowthProject.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function GeoGrowthProject({ project, projectHtml, projectToc, nextProject }) {
  const allSections = useMemo(() => projectToc.flatMap((section) => [section, ...section.children]), [projectToc]);
  const [activeSection, setActiveSection] = useState(allSections[0]?.id);
  const [lenis] = useStore(useShallow((state) => [state.lenis]));

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
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const offset = window.innerWidth <= 768 ? -window.innerWidth * 0.28 : -100;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(id);
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
          <div className={clsx(readerStyles.eyebrow, 'p-l')}>企业内部孵化项目 · GEO 方法与产品策划 · 2026</div>
          <h1 className={clsx(readerStyles.title, styles.title, 'h1')}>百言 GEO 内容增长系统</h1>
          <p className={clsx(readerStyles.lead, 'h6')}>把问题研究、知识证据、内容生产、质量审核与矩阵发布连接成可持续迭代的增长工作流。</p>
        </div>

        <div className={readerStyles.heroImage}>
          <Image priority src="/project2/geo/overview.webp" fill sizes="(max-width: 768px) 100vw, 92vw" alt="经过脱敏的百言 GEO 内容增长系统运行总览" />
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
            <span className="p-x">知识记录</span>
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
          <Link className={readerStyles.backLink} scroll={false} href="/projects">
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

export default GeoGrowthProject;

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import clsx from 'clsx';
import readerStyles from '@src/pages/tutorials/codexCourse.module.scss';
import styles from '@src/pages/projects/components/operationsAi/operationsAiProject.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function OperationsAiProject({ project, projectHtml, projectToc, nextProject }) {
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
      { root, rootMargin: '-8% 0px -82% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [allSections]);

  const navigateToSection = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target && lenis) {
      const offset = window.innerWidth <= 768 ? -window.innerWidth * 0.28 : -100;
      lenis.scrollTo(target, { offset, duration: 1.2 });
      setActiveSection(id);
    }
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
          <div className={clsx(readerStyles.eyebrow, 'p-l')}>个人产品项目 · 高完成度工程型 MVP · 2026</div>
          <h1 className={clsx(readerStyles.title, styles.title, 'h1')}>运营内容智能分析与生成平台</h1>
          <p className={clsx(readerStyles.lead, 'h6')}>把运营数据、策略资产、AI 生成和发布前检查连接成可复盘闭环。</p>
        </div>

        <div className={readerStyles.heroImage}>
          <Image priority src="/project1/project1-art-v5.webp" fill sizes="(max-width: 768px) 100vw, 92vw" alt="以网站黑白拼贴风格呈现双平台分析、AI 生成和发布检查的运营工作台" />
        </div>

        <div className={styles.stats}>
          <div>
            <span className="h4">17</span>
            <span className="p-x">工作台入口</span>
          </div>
          <div>
            <span className="h4">16</span>
            <span className="p-x">后端业务模块</span>
          </div>
          <div>
            <span className="h4">44</span>
            <span className="p-x">数据库迁移</span>
          </div>
          <div>
            <span className="h4">196</span>
            <span className="p-x">本地提交</span>
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

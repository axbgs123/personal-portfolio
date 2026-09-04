import { useEffect, useMemo, useState } from 'react';

import CustomHead from '@src/components/dom/CustomHead';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import styles from '@src/pages/tutorials/codexCourse.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function CodexCoursePage({ courseHtml, courseToc }) {
  const allSections = useMemo(() => courseToc.flatMap((section) => [section, ...section.children]), [courseToc]);
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
      <CustomHead
        title="Giats - Codex 视频课配套资料"
        description="Codex 视频课完整配套资料，覆盖安装、Skill、办公自动化、内容生产、浏览器、Computer Use、多智能体和飞书 CLI。"
        keywords={['Codex 教程', 'Codex 视频课配套资料', 'Skill', 'Computer Use', '多智能体']}
      />

      <section className={clsx(styles.hero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials">
            教程
          </Link>
          <span>/</span>
          <span>Codex 视频课配套资料</span>
        </div>

        <div className={styles.heroCopy}>
          <div className={clsx(styles.eyebrow, 'p-l')}>已完结 · 完整课程资料</div>
          <h1 className={clsx(styles.title, 'h1')}>Codex 视频课配套资料</h1>
          <p className={clsx(styles.lead, 'h6')}>从第一次打开 Codex，到把复杂工作拆给多个智能体。</p>
        </div>

        <div className={styles.heroImage}>
          <Image priority src="/codex-course/hero.png" fill sizes="(max-width: 768px) 100vw, 56vw" alt="Codex 官方产品页面与桌面工作区" />
        </div>

        <div className={styles.heroStats}>
          <div>
            <span className="h4">13</span>
            <span className="p-x">课程章节</span>
          </div>
          <div>
            <span className="h4">29</span>
            <span className="p-x">二级目录</span>
          </div>
          <div>
            <span className="h4">1810</span>
            <span className="p-x">行完整原始资料</span>
          </div>
        </div>
      </section>

      <section className={clsx(styles.course, 'layout-grid-inner')}>
        <aside className={styles.sidebar} aria-label="课程章节导航">
          <div className={clsx(styles.sidebarTitle, 'p-x')}>课程目录</div>
          <nav>
            {courseToc.map((section, sectionIndex) => {
              const isGroupActive = activeSection === section.id || section.children.some((child) => child.id === activeSection);

              return (
                <div className={styles.tocGroup} key={section.id}>
                  <a
                    className={clsx(styles.navItem, isGroupActive && styles.navItemActive)}
                    href={`#${section.id}`}
                    onClick={(event) => navigateToSection(event, section.id)}
                    aria-current={activeSection === section.id ? 'location' : undefined}
                  >
                    <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
                    <span>{section.title}</span>
                  </a>
                  {section.children.length ? (
                    <div className={styles.subNav}>
                      {section.children.map((child) => (
                        <a
                          key={child.id}
                          className={clsx(styles.subNavItem, activeSection === child.id && styles.subNavItemActive)}
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
          <Link className={styles.backLink} scroll={false} href="/tutorials">
            ← 返回教程列表
          </Link>
        </aside>

        <div className={styles.content}>
          {/* The source Markdown is user-provided course material generated into trusted static HTML. */}
          {/* eslint-disable-next-line react/no-danger */}
          <article className={styles.prose} dangerouslySetInnerHTML={{ __html: courseHtml }} />

          <div className={styles.courseEnd}>
            <div className="p-x">课程资料已完结</div>
            <h2 className="h3">从目录选择章节，继续你的 Codex 实战。</h2>
            <Link scroll={false} href="/tutorials">
              返回全部教程 ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps() {
  const contentDir = path.join(process.cwd(), 'src/content');
  const courseHtml = fs.readFileSync(path.join(contentDir, 'codex-course.html'), 'utf8');
  const courseToc = JSON.parse(fs.readFileSync(path.join(contentDir, 'codex-course-toc.json'), 'utf8'));
  return { props: { courseHtml, courseToc } };
}

export default CodexCoursePage;

import { useEffect, useMemo, useState } from 'react';

import CustomHead from '@src/components/dom/CustomHead';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import withImageDimensions from '@src/lib/withImageDimensions';
import styles from '@src/pages/tutorials/codexCourse.module.scss';
import navigateToReadingSection from '@src/pages/tutorials/components/navigateToReadingSection';

function CodexFaqPage({ faqHtml, faqToc }) {
  const allSections = useMemo(() => faqToc.flatMap((section) => [section, ...section.children]), [faqToc]);
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
      <CustomHead
        title="陈祉辰｜Codex 常见问题与解决方案"
        description="Codex 安装、ChatGPT 会员订阅和 DeepSeek V4 接入的常见问题与完整解决方案。"
        keywords={['Codex 常见问题', 'Codex 安装失败', 'ChatGPT 订阅', 'DeepSeek V4']}
      />

      <section className={clsx(styles.hero, styles.faqHero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials/codex-course">
            Codex 视频课配套资料
          </Link>
          <span>/</span>
          <span>常见问题与解决方案</span>
        </div>

        <div className={styles.heroCopy}>
          <div className={clsx(styles.eyebrow, 'p-l')}>FAQ · 持续更新</div>
          <h1 className={clsx(styles.title, 'h1')}>常见问题与解决方案</h1>
          <p className={clsx(styles.lead, 'h6')}>从安装失败，到会员订阅，再到 DeepSeek V4 接入。</p>
        </div>

        <div className={styles.heroImage}>
          <Image priority src="/codex-faq/hero.webp" fill sizes="(max-width: 768px) 100vw, 56vw" alt="Codex 在 Windows 系统安装失败的错误信息" />
        </div>

        <div className={styles.heroStats}>
          <div>
            <span className="h4">3</span>
            <span className="p-x">问题分类</span>
          </div>
          <div>
            <span className="h4">15</span>
            <span className="p-x">二级问题</span>
          </div>
          <div>
            <span className="h4">51</span>
            <span className="p-x">原始配图</span>
          </div>
        </div>
      </section>

      <section className={clsx(styles.course, 'layout-grid-inner')}>
        <aside className={styles.sidebar} aria-label="常见问题导航">
          <div className={clsx(styles.sidebarTitle, 'p-x')}>问题目录</div>
          <nav>
            {faqToc.map((section, sectionIndex) => {
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
          <Link className={styles.backLink} scroll={false} href="/tutorials/codex-course">
            ← 返回课程资料
          </Link>
        </aside>

        <div className={styles.content}>
          {/* The FAQ Markdown is trusted user-provided source material generated into static HTML. */}
          {/* eslint-disable-next-line react/no-danger */}
          <article className={styles.prose} dangerouslySetInnerHTML={{ __html: faqHtml }} />

          <div className={styles.courseEnd}>
            <div className="p-x">没有找到答案？</div>
            <h2 className="h3">返回课程资料，继续查看完整操作步骤。</h2>
            <Link scroll={false} href="/tutorials/codex-course">
              返回 Codex 视频课配套资料 ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps() {
  const contentDir = path.join(process.cwd(), 'src/content');
  const faqHtml = await withImageDimensions(fs.readFileSync(path.join(contentDir, 'codex-faq.html'), 'utf8'));
  const faqToc = JSON.parse(fs.readFileSync(path.join(contentDir, 'codex-faq-toc.json'), 'utf8'));
  return { props: { faqHtml, faqToc } };
}

export default CodexFaqPage;

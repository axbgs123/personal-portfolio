import { useEffect, useState } from 'react';

import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import clsx from 'clsx';
import styles from '@src/pages/tutorials/aiResourceGuide.module.scss';
import courseStyles from '@src/pages/tutorials/codexCourse.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function AiResourceGuide({ page }) {
  const [activeSection, setActiveSection] = useState(page.sections[0]?.id);
  const [lenis] = useStore(useShallow((state) => [state.lenis]));

  useEffect(() => {
    const root = document.querySelector('main');
    const sections = page.sections.map((section) => document.getElementById(section.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) setActiveSection(visibleEntry.target.id);
      },
      { root, rootMargin: '-10% 0px -72% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [page.sections]);

  const navigateToSection = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    if (lenis) {
      const offset = window.innerWidth <= 768 ? -window.innerWidth * 0.22 : -48;
      lenis.scrollTo(target, { offset, duration: 1.1 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveSection(id);
  };

  return (
    <>
      <CustomHead title={`Giats - ${page.title}`} description={page.description} keywords={page.keywords} />

      <section className={clsx(courseStyles.hero, styles.hero, 'layout-grid-inner')} style={{ '--guide-accent': page.accent }}>
        <div className={clsx(courseStyles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials">
            教程
          </Link>
          <span>/</span>
          <span>{page.title}</span>
        </div>

        <div className={courseStyles.heroCopy}>
          <div className={clsx(courseStyles.eyebrow, 'p-l')}>{page.eyebrow}</div>
          <h1 className={clsx(courseStyles.title, 'h1')}>{page.title}</h1>
          <p className={clsx(courseStyles.lead, 'h6')}>{page.lead}</p>
        </div>

        <div className={styles.heroBoard} aria-hidden="true">
          <div className={styles.boardHeader}>
            <span>GIATS / RESOURCE INDEX</span>
            <span>UPDATED 2026</span>
          </div>
          <div className={styles.boardWords}>
            {page.heroWords.map((word, index) => (
              <span key={word} style={{ '--word-size': `${(1.5 + index * 0.13).toFixed(2)}vw`, '--word-offset': `${(index % 3) * 0.7}vw` }}>
                {word}
              </span>
            ))}
          </div>
          <div className={styles.boardLine} />
        </div>

        <div className={courseStyles.heroStats}>
          {page.stats.map((stat) => (
            <div key={stat.label}>
              <span className="h4">{stat.value}</span>
              <span className="p-x">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={clsx(courseStyles.course, 'layout-grid-inner')} style={{ '--guide-accent': page.accent }}>
        <aside className={courseStyles.sidebar} aria-label={`${page.title}目录`}>
          <div className={clsx(courseStyles.sidebarTitle, 'p-x')}>内容目录</div>
          <nav>
            {page.sections.map((section, index) => (
              <div className={courseStyles.tocGroup} key={section.id}>
                <a
                  className={clsx(courseStyles.navItem, activeSection === section.id && courseStyles.navItemActive)}
                  href={`#${section.id}`}
                  onClick={(event) => navigateToSection(event, section.id)}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{section.title}</span>
                </a>
              </div>
            ))}
          </nav>
          <Link className={courseStyles.backLink} scroll={false} href="/tutorials">
            ← 返回教程列表
          </Link>
        </aside>

        <div className={courseStyles.content}>
          <div className={styles.introNote}>
            <span className="p-x">使用说明</span>
            <p className="p-l">{page.note}</p>
          </div>

          {page.sections.map((section, sectionIndex) => (
            <section className={styles.guideSection} id={section.id} key={section.id}>
              <div className={styles.sectionMeta}>
                <span className="p-x">{String(sectionIndex + 1).padStart(2, '0')}</span>
                <span className="p-x">{section.meta}</span>
              </div>
              <h2 className={clsx(styles.sectionTitle, 'h3')}>{section.title}</h2>
              <p className={clsx(styles.sectionIntro, 'p-l')}>{section.intro}</p>

              {section.template ? (
                <div className={styles.promptTemplate}>
                  <div className={styles.templateLabel}>通用结构 / TEMPLATE</div>
                  <pre>{section.template}</pre>
                </div>
              ) : null}

              <div className={styles.resourceGrid}>
                {section.items.map((item, itemIndex) => (
                  <article className={styles.resourceCard} key={item.name}>
                    <div className={styles.cardIndex}>{String(itemIndex + 1).padStart(2, '0')}</div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTag}>{item.tag}</div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      {item.code ? <div className={styles.accessCode}>提取码：{item.code}</div> : null}
                    </div>
                    <a className={styles.cardLink} href={item.href} target="_blank" rel="noreferrer">
                      {item.linkLabel || '打开官网'} <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <div className={courseStyles.courseEnd} style={{ background: page.accent }}>
            <div className="p-x">资料持续整理</div>
            <h2 className="h3">工具会变化，真正值得保留的是选择方法和工作结构。</h2>
            <Link scroll={false} href="/tutorials">
              返回全部教程 ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default AiResourceGuide;

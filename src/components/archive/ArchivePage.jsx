import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import clsx from 'clsx';
import styles from '@src/components/archive/archivePage.module.scss';

function ArchivePage({ page }) {
  return (
    <>
      <CustomHead title={`Giats - ${page.title}`} description={page.intro} keywords={page.keywords} />

      <section className={clsx(styles.hero, 'layout-grid-inner')} style={{ '--archive-accent': page.accent }}>
        <div className={clsx(styles.heroMeta, 'p-x')}>
          <span>仓库 / {page.code}</span>
          <span>{String(page.entries.length).padStart(2, '0')} 个条目</span>
        </div>

        <div className={styles.heroContent}>
          <h1 className={clsx(styles.heroTitle, 'h1')}>{page.title}</h1>
          <p className={clsx(styles.heroIntro, 'h6')}>{page.intro}</p>
        </div>

        <div className={styles.heroRail} aria-hidden="true">
          <span>{page.title}</span>
          <span>{page.title}</span>
          <span>{page.title}</span>
        </div>
      </section>

      <section className={clsx(styles.catalog, 'layout-block-inner')} style={{ '--archive-accent': page.accent }}>
        <div className={styles.catalogHeader}>
          <h2 className="h4">档案目录</h2>
          <span className="p-x">按最近更新排序</span>
        </div>

        <div className={styles.entries}>
          {page.entries.map((entry, index) => {
            const entryContent = (
              <article className={styles.entry}>
                <div className={clsx(styles.entryIndex, 'p-x')}>{String(index + 1).padStart(2, '0')}</div>
                <div className={styles.entryMain}>
                  <div className={clsx(styles.entryMeta, 'p-x')}>{entry.meta}</div>
                  <h3 className={clsx(styles.entryTitle, 'h3')}>{entry.title}</h3>
                  <p className={clsx(styles.entryDesc, 'p-l')}>{entry.desc}</p>
                </div>
                <div className={styles.entryAside}>
                  <span className="p-x">{entry.status}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    ↗
                  </span>
                </div>
              </article>
            );

            return (
              <AppearTitle key={entry.title}>
                {entry.href ? (
                  <Link className={styles.entryLink} aria-label={`打开${entry.title}`} scroll={false} href={entry.href}>
                    {entryContent}
                  </Link>
                ) : (
                  entryContent
                )}
              </AppearTitle>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default ArchivePage;

import CustomHead from '@src/components/dom/CustomHead';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import illustratedTutorials from '@src/constants/illustratedTutorials';
import styles from '@src/pages/tutorials/illustratedTutorials.module.scss';

function IllustratedTutorialsPage() {
  return (
    <>
      <CustomHead title="Giats - 图文教程" description="图文教程最终成品与配套文字。" keywords={['图文教程', 'AI 教程', 'Skill 教程']} />
      <section className={clsx(styles.hero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials">
            教程
          </Link>
          <span>/</span>
          <span>图文教程</span>
        </div>
        <div className={styles.heroCopy}>
          <div className={clsx(styles.eyebrow, 'p-l')}>最终成品 · 图片与文字</div>
          <h1 className={clsx(styles.title, 'h1')}>图文教程</h1>
        </div>
      </section>

      <section className={clsx(styles.library, 'layout-block-inner')}>
        <div className={styles.libraryHeader}>
          <h2 className="h4">全部教程</h2>
          <span className="p-x">{illustratedTutorials.length} 组</span>
        </div>
        <div className={styles.cards}>
          {illustratedTutorials.map((tutorial) => (
            <Link className={styles.card} scroll={false} href={`/tutorials/illustrated/${tutorial.slug}`} key={tutorial.slug}>
              <div className={styles.cover}>
                <Image src={tutorial.cover} fill sizes="(max-width: 768px) 100vw, 32vw" alt={tutorial.title} />
              </div>
              <div className={styles.cardCopy}>
                <h2>{tutorial.title}</h2>
                <span className="p-x">{tutorial.imageCount} 张成品图 ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default IllustratedTutorialsPage;

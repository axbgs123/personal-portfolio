import CustomHead from '@src/components/dom/CustomHead';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import illustratedTutorials from '@src/constants/illustratedTutorials';
import styles from '@src/pages/tutorials/illustratedTutorials.module.scss';

function IllustratedTutorialPage({ tutorial, text }) {
  return (
    <>
      <CustomHead title={`Giats - ${tutorial.title}`} description={`${tutorial.title}图文教程。`} keywords={[tutorial.title, '图文教程']} />
      <section className={clsx(styles.detailHero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials/illustrated">
            图文教程
          </Link>
          <span>/</span>
          <span>{tutorial.title}</span>
        </div>
        <div className={styles.detailTitle}>
          <span className="p-l">最终成品 · {tutorial.imageCount} 张</span>
          <h1 className="h2">{tutorial.title}</h1>
        </div>
      </section>

      <section className={clsx(styles.detail, 'layout-block-inner')}>
        <div className={styles.imageGrid}>
          {tutorial.images.map((image, index) => (
            <figure className={styles.figure} key={image}>
              <Image src={image} width={tutorial.width} height={tutorial.height} sizes="(max-width: 768px) 100vw, 43vw" alt={`${tutorial.title} 第 ${index + 1} 张`} />
            </figure>
          ))}
        </div>
        {text ? (
          <article className={styles.textBlock}>
            <div className={clsx(styles.textLabel, 'p-x')}>配套文字</div>
            <div className={styles.originalText}>{text}</div>
          </article>
        ) : null}
      </section>
    </>
  );
}

export function getStaticPaths() {
  return { paths: illustratedTutorials.map((tutorial) => ({ params: { slug: tutorial.slug } })), fallback: false };
}

export function getStaticProps({ params }) {
  const tutorial = illustratedTutorials.find((item) => item.slug === params.slug);
  const textPath = path.join(process.cwd(), 'src/content/illustrated-tutorials', `${tutorial.slug}.txt`);
  const text = fs.existsSync(textPath) ? fs.readFileSync(textPath, 'utf8') : '';
  return { props: { tutorial, text } };
}

export default IllustratedTutorialPage;

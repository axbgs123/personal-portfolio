import CustomHead from '@src/components/dom/CustomHead';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import writingArticles from '@src/constants/writingArticles';
import styles from '@src/pages/writing/writingArticle.module.scss';

function WritingArticlePage({ article, nextArticle, articleNumber }) {
  const imagesByPosition = article.images.reduce((positions, image, index) => {
    const position = Math.max(1, Math.round(((index + 1) * article.paragraphs.length) / (article.images.length + 1)));
    positions[position] = [...(positions[position] || []), image];
    return positions;
  }, {});

  return (
    <>
      <CustomHead title={`陈祉辰｜${article.title}`} description={article.excerpt} keywords={['文字与思考', 'AI 观察', article.title]} />

      <section className={clsx(styles.hero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/writing">
            文字与思考
          </Link>
          <span>/</span>
          <span>{String(articleNumber).padStart(2, '0')}</span>
        </div>
        <div className={styles.heroCopy}>
          <div className={clsx(styles.meta, 'p-l')}>{article.meta}</div>
          <h1 className={clsx(styles.title, 'h2')}>{article.title}</h1>
          <p className={clsx(styles.lead, 'h6')}>{article.excerpt}</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          思考
        </div>
      </section>

      <section className={clsx(styles.articleSection, 'layout-grid-inner')}>
        <aside className={styles.articleRail}>
          <span className="p-x">ARTICLE</span>
          <strong>{String(articleNumber).padStart(2, '0')}</strong>
        </aside>

        <article className={styles.articleBody}>
          {article.paragraphs.map((paragraph, index) => (
            <div key={paragraph}>
              <p>{paragraph}</p>
              {(imagesByPosition[index + 1] || []).map((image, imageIndex) => (
                <figure className={styles.figure} key={image.src}>
                  <Image src={image.src} width={image.width} height={image.height} sizes="(max-width: 768px) 100vw, 62vw" alt={`${article.title} 配图 ${imageIndex + 1}`} />
                </figure>
              ))}
            </div>
          ))}
        </article>
      </section>

      <section className={clsx(styles.nextSection, 'layout-grid-inner')}>
        <Link className={styles.nextLink} scroll={false} href={`/writing/${nextArticle.slug}`}>
          <span className="p-x">继续阅读</span>
          <strong className="h3">{nextArticle.title}</strong>
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </Link>
      </section>
    </>
  );
}

export function getStaticPaths() {
  return {
    paths: writingArticles.map((article) => ({
      params: { slug: article.slug },
    })),
    fallback: false,
  };
}

export function getStaticProps({ params }) {
  const index = writingArticles.findIndex((article) => article.slug === params.slug);
  return {
    props: {
      article: writingArticles[index],
      nextArticle: writingArticles[(index + 1) % writingArticles.length],
      articleNumber: index + 1,
    },
  };
}

export default WritingArticlePage;

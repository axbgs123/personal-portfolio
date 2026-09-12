/* eslint-disable react/no-array-index-key -- Immutable document nodes retain their source order. */
import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import clsx from 'clsx';
import writingArticles from '@src/constants/writingArticles';
import styles from '@src/pages/writing/writingArticle.module.scss';

function ArticleBlocks({ nodes, title }) {
  return nodes.map((node, index) => {
    const children = node.children ? <ArticleBlocks nodes={node.children} title={title} /> : null;
    if (node.type === 'blank_line') return null;
    if (node.type === 'text') return node.raw;
    if (node.type === 'strong') return <strong key={index}>{children}</strong>;
    if (node.type === 'heading') {
      const Heading = `h${Math.max(2, Math.min(6, node.attrs.level))}`;
      return <Heading key={index}>{children}</Heading>;
    }
    if (node.type === 'image') return null;
    if (node.type === 'paragraph') {
      if (node.children.every((child) => child.type === 'image')) return null;
      return <p key={index}>{children}</p>;
    }
    return null;
  });
}

function WritingArticlePage({ article, nextArticle, articleNumber }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${article.title}`} description={article.excerpt} keywords={['口播稿', 'AI 观察', article.title]} />

      <section className={clsx(styles.hero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/writing">
            口播稿
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
          <ArticleBlocks nodes={article.blocks} title={article.title} />
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

export async function getStaticProps({ params }) {
  const { default: fullArticles } = await import('@src/content/writing-feishu.json');
  const index = writingArticles.findIndex((article) => article.slug === params.slug);
  return {
    props: {
      article: fullArticles[index],
      nextArticle: writingArticles[(index + 1) % writingArticles.length],
      articleNumber: index + 1,
    },
  };
}

export default WritingArticlePage;

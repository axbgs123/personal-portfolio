import writingArticles from './writingArticles';

// Directory payload only: article bodies and images stay on their original pages.
const archiveWritingEntries = writingArticles.map((article) => ({
  id: `writing:${article.slug}`,
  title: article.title,
  kind: 'writing',
  label: '文字与思考',
  meta: article.meta || '文章',
  excerpt: article.excerpt || article.paragraphs?.[0] || '',
  href: `/writing/${article.slug}`,
}));

export default archiveWritingEntries;

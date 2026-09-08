import CustomHead from '@src/components/dom/CustomHead';
import ArchiveField from '@src/components/archive/ArchiveField';
import ArchiveInstruments, { instrumentCodes } from '@src/components/archive/ArchiveInstruments';
import projects from '@src/constants/projects';
import writingArticles from '@src/constants/writingArticles';
import illustratedTutorials from '@src/constants/illustratedTutorials';
import Link from 'next/link';
import styles from '@src/components/archive/archivePage.module.scss';

const coverByHref = Object.fromEntries([
  ...projects.map((project) => [project.link, { src: project.img, fit: 'cover' }]),
  ...writingArticles.filter((article) => article.images?.[0]).map((article) => [`/writing/${article.slug}`, { ...article.images[0], fit: 'contain' }]),
  [
    '/tutorials/codex-course',
    {
      src: '/codex-course/hero.png',
      alt: 'Codex 官方产品页面与桌面工作区',
      fit: 'contain',
    },
  ],
  ['/tutorials/illustrated', { src: illustratedTutorials[0].cover, fit: 'contain' }],
]);

function ArchivePage({ page, parent }) {
  const entries = page.entries.map((entry) => ({
    ...entry,
    image: entry.image || coverByHref[entry.href],
    // These are unverified placeholder series, not an existing photo inventory.
    meta: page.code === 'PHOTOGRAPHY' ? entry.meta.replace(/\s*·\s*\d+\s*张/g, '') : entry.meta,
    status: entry.href ? entry.status : '详情待补充',
    linkLabel: entry.linkLabel || (entry.href?.startsWith('/projects/') ? '查看完整案例' : '打开查看'),
  }));

  return (
    <>
      <CustomHead title={`陈祉辰｜${page.title}`} description={page.intro} keywords={page.keywords} />
      <header className={styles.hero}>
        <div className={styles.meta}>
          <nav aria-label="当前位置" className={styles.breadcrumb}>
            {parent ? (
              <Link scroll={false} href={parent.href}>
                {parent.title}
              </Link>
            ) : (
              <span>仓库</span>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{page.title}</span>
          </nav>
          <span>{page.code === 'PHOTOGRAPHY' || page.code === 'PERSONAL SKILLS' || page.code === 'AIGC' ? `${entries.length} 个方向` : `${entries.length} 个条目`}</span>
        </div>
        <div className={styles.heading}>
          <h1>{page.title}</h1>
          {page.intro && <p>{page.intro}</p>}
        </div>
      </header>
      {instrumentCodes.includes(page.code) ? (
        <ArchiveInstruments key={page.code} code={page.code} entries={entries} title={page.title} />
      ) : (
        <ArchiveField key={page.code} entries={entries} title={page.title} />
      )}
    </>
  );
}

export default ArchivePage;

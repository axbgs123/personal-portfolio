import fs from 'node:fs';
import path from 'node:path';
import CustomHead from '@src/components/dom/CustomHead';
import MigratedCaseStudy from '@src/components/archive/MigratedCaseStudy';
import { migratedProjectEntries } from '@src/constants/migratedPortfolio';

export default function ArchiveCasePage({ entry, study, review }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${entry.title}`} description={entry.desc} keywords={[entry.title, '产品案例', '陈祉辰']} />
      <MigratedCaseStudy study={study} title={entry.title} parent={{ title: '项目', href: '/more-projects' }} review={review} />
    </>
  );
}

export function getStaticPaths() {
  return { paths: migratedProjectEntries.map((entry) => ({ params: { slug: entry.slug } })), fallback: false };
}

export function getStaticProps({ params }) {
  const entry = migratedProjectEntries.find((item) => item.slug === params.slug);
  if (!entry) return { notFound: true };
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/migrated-portfolio.json'), 'utf8'));
  return { props: { entry, study: source[entry.key], review: entry.key === 'matrix' ? source.modelChoice : null } };
}

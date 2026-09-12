import fs from 'node:fs';
import path from 'node:path';
import CustomHead from '@src/components/dom/CustomHead';
import MigratedCaseStudy from '@src/components/archive/MigratedCaseStudy';
import { migratedShortDramaEntry } from '@src/constants/migratedPortfolio';

export default function ShortDramaPage({ study }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${migratedShortDramaEntry.title}`} description={migratedShortDramaEntry.desc} />
      <MigratedCaseStudy study={study} title={migratedShortDramaEntry.title} parent={{ title: '照片视频', href: '/photography' }} />
    </>
  );
}

export function getStaticProps() {
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/migrated-portfolio.json'), 'utf8'));
  return { props: { study: source.shortDrama } };
}

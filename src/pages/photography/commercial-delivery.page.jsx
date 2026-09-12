import fs from 'node:fs';
import path from 'node:path';
import CustomHead from '@src/components/dom/CustomHead';
import MigratedCaseStudy from '@src/components/archive/MigratedCaseStudy';
import { migratedPhotographyEntry } from '@src/constants/migratedPortfolio';

export default function CommercialPhotographyPage({ study }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${migratedPhotographyEntry.title}`} description={migratedPhotographyEntry.desc} keywords={['商业活动摄影', '视频交付', '陈祉辰']} />
      <MigratedCaseStudy study={study} title={migratedPhotographyEntry.title} parent={{ title: '照片视频', href: '/photography' }} />
    </>
  );
}

export function getStaticProps() {
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/migrated-portfolio.json'), 'utf8'));
  return { props: { study: source.photo } };
}

import fs from 'node:fs';
import path from 'node:path';
import CustomHead from '@src/components/dom/CustomHead';
import PhotographyExhibition from '@src/components/archive/PhotographyExhibition';

export default function PhotographyPage({ works }) {
  return (
    <>
      <CustomHead title="陈祉辰｜照片视频" description="极色妝婳亚洲赛、广之旅供应商年会、真人短剧、cos道诡异仙岁岁与电商引流。" />
      <PhotographyExhibition works={works} />
    </>
  );
}

export function getStaticProps() {
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/migrated-portfolio.json'), 'utf8'));
  const photos = source.photo.slides;
  const ordered = [photos[4], ...photos.slice(0, 4), photos[5], ...photos.slice(6)];
  const cos = ['01', '02', '03', '04'].map((number) => ({
    type: 'image',
    src: `/photography/cos-eerie-series/${number}.webp`,
    label: `cos道诡异仙岁岁 ${number}`,
    group: 3,
  }));
  const ecommerceTraffic = {
    type: 'video',
    src: '/photography/company-negotiation/ecommerce-traffic.mp4',
    poster: '/photography/company-negotiation/ecommerce-traffic.webp',
    label: '电商引流',
    group: 4,
  };
  return {
    props: {
      works: [...ordered.map((work, i) => ({ ...work, group: i < 6 ? 0 : 1 })), ...source.shortDrama.slides.map((work) => ({ ...work, group: 2 })), ...cos, ecommerceTraffic],
    },
  };
}

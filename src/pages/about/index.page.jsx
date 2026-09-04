/* eslint-disable react/jsx-props-no-spreading */
import Hero from '@src/pages/about/components/hero/Hero';
import Overview from '@src/pages/about/components/overview/Overview';
import Services from '@src/pages/about/components/services/Services';
import Process from '@src/pages/about/components/process/Process';
import CustomHead from '@src/components/dom/CustomHead';

const seo = {
  title: 'Giats - 关于我',
  description: '了解我的成长经历、价值观，以及我对高品质网站与应用解决方案的坚持。',
  keywords: [
    'Giats',
    '埃万杰洛斯·贾齐迪斯',
    '关于我',
    '前端开发者经历',
    '网页开发故事',
    '专业网页开发',
    '前端开发专长',
    '网页设计技能',
    '网页开发服务',
    '网页设计专长',
    '开发者简介',
    '高品质网页解决方案',
  ],
};
function Page() {
  return (
    <>
      <CustomHead {...seo} />

      <Hero />
      <Overview />
      <Services />
      <Process />
    </>
  );
}

export default Page;

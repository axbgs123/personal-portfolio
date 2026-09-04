/* eslint-disable react/jsx-props-no-spreading */
import Home from '@src/pages/components/home/Index';
import About from '@src/pages/components/about/Index';
import Quote from '@src/pages/components/quote/Index';
import Projects from '@src/pages/components/projects/Index';
import Clients from '@src/pages/components/clients/Index';
import CustomHead from '@src/components/dom/CustomHead';

const seo = {
  title: 'Giats - 前端开发者作品集',
  description: '来自希腊的自学前端开发者，专注于打造简洁、高效的网站、桌面应用和移动应用，以创意与技术交付以用户为中心的创新解决方案。',
  keywords: [
    'Giats',
    'Evangelos Giatsidis',
    '前端开发',
    '工程师',
    '作品集',
    '网页开发',
    'React 开发者',
    '开发者',
    '网页应用',
    '响应式设计',
    '渐进式网页应用',
    '自由开发者',
    '现代网页开发',
    '跨平台开发',
    '希腊',
    'JavaScript',
    'Typescript',
    'Next.js',
    'React',
    'React Native',
    'Electron js',
    'HTML',
    'CSS',
  ],
};

function Page() {
  return (
    <>
      <CustomHead {...seo} />
      <Home />
      <About />
      <Clients />
      <Quote />
      <Projects />
    </>
  );
}

export default Page;

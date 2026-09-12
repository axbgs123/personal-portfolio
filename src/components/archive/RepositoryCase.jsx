import CustomHead from '@src/components/dom/CustomHead';
import MigratedCaseStudy from './MigratedCaseStudy';

export default function RepositoryCase({ study, skill = false }) {
  const parent = skill ? { title: 'Skill 与工作流提效', href: '/personal-skills' } : { title: '项目', href: '/more-projects' };
  const repositorySlide = { type: 'card', title: '源码与完整文档', body: `查看完整说明、运行方式与源码：${study.repository}` };
  const content = { ...study, slides: study.appendRepositorySlide === false ? study.slides : [...study.slides, repositorySlide] };
  return (
    <>
      <CustomHead title={`陈祉辰｜${study.title}`} description={study.desc} />
      <MigratedCaseStudy study={content} parent={parent} />
    </>
  );
}

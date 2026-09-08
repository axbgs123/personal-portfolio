import Link from 'next/link';
import CustomHead from '@src/components/dom/CustomHead';
import ProjectStages from '@src/components/portfolio/ProjectStages';
import styles from './projectsV2.module.scss';

export default function ProjectsPage() {
  return (
    <>
      <CustomHead
        title="陈祉辰｜AI 产品项目"
        description="陈祉辰的 AI 产品案例：AI 运营智能体与内容分析生成平台、百言 GEO 内容增长系统。了解需求判断、产品方案、人工审核机制与项目交付。"
        keywords={['陈祉辰', 'AI 产品实践', 'AI 运营智能体', 'GEO 内容增长', '产品作品集', 'Agent 产品设计']}
      />
      <div className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>PROJECT ARCHIVE / 2026</p>
          <div>
            <h1>项目</h1>
            <p>从发现问题到设计方案，再到协作开发与验收。两项 AI 产品实践，以及其中的关键判断。</p>
          </div>
        </header>
        <ProjectStages variant="archive" />
        <div className={styles.continue}>
          <Link href="/tutorials" scroll={false}>
            看教程与知识积累<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </>
  );
}

/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useMemo, useRef } from 'react';

import CustomHead from '@src/components/dom/CustomHead';
import GeoGrowthProject from '@src/pages/projects/components/geoGrowth/GeoGrowthProject';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import OperationsAiProject from '@src/pages/projects/components/operationsAi/OperationsAiProject';
import ProjectDetails from '@src/pages/projects/components/projectDetails/ProjectDetails';
import ProjectImages from '@src/pages/projects/components/projectsImages/ProjectImages';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import clsx from 'clsx';
import fs from 'node:fs';
import { gsap } from 'gsap';
import projects from '@src/constants/projects';
import path from 'node:path';
import withImageDimensions from '@src/lib/withImageDimensions';
import styles from '@src/pages/projects/project.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';

function Page({ id, projectHtml = '', projectToc = [] }) {
  const isMobile = useIsMobile();
  const rightContainerRef = useRef();
  const leftContainerRef = useRef();
  const [isLoading, setFluidColor] = useStore(useShallow((state) => [state.isLoading, state.setFluidColor]));
  const windowSize = useWindowSize();

  const projectIndex = useMemo(() => projects.findIndex((project) => project.id === id), [id]);
  const currentProject = useMemo(() => projects[projectIndex], [projectIndex]);

  const updateCSSVariables = (project) => {
    gsap.set('html', {
      '--black': project.primary,
      '--white': project.secondary,
      '--accentColor': project.accentColor,
      '--fillColor': project.fillColor,
      '--menuColor': project.menuColor,
      '--menuFontColor': project.menuFontColor,
    });
  };

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!['project1', 'project2'].includes(id) && !isLoading && !isMobile) {
        ScrollTrigger.create({
          id: 'project',
          trigger: rightContainerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: leftContainerRef.current,
          scrub: true,
          scroller: document?.querySelector('main'),
          invalidateOnRefresh: true,
          pinSpacing: false,
        });
      }
    });

    return () => {
      ctx.kill();
      ScrollTrigger.getById('project')?.kill();
    };
  }, [id, isMobile, isLoading, windowSize.width]);

  useEffect(() => {
    if (currentProject) {
      updateCSSVariables(currentProject);
      setFluidColor(currentProject.fluidColor);
    }
    return () => {
      updateCSSVariables({
        primary: '#28282b',
        secondary: '#f0f4f1',
        accentColor: '#f9f9f9',
        fillColor: '#f2ffbd',
        menuColor: '#28282b',
        menuFontColor: '#f0f4f1',
      });
      setFluidColor('#d7d7d4');
    };
  }, [currentProject]);

  const seo = useMemo(() => {
    let description = `查看我与${currentProject.company}合作完成的${currentProject.title}。项目通过响应式设计与交互优化，提升了前端体验。`;
    if (currentProject.id === 'project1') {
      description = '面向抖音和小红书运营团队的 AI 工作台，串联数据导入、分析诊断、策略资产、内容生成、发布前风控与人工确认。';
    } else if (currentProject.id === 'project2') {
      description = '从零规划企业 GEO 内容增长系统，把问题研究、知识证据、内容生产、质量审核与矩阵发布组织成完整工作流。';
    }

    return {
      title: `陈祉辰｜${currentProject.title}`,
      description,
      keywords: [
        `${currentProject.title}项目`,
        `${currentProject.title}开发`,
        `${currentProject.company}合作`,
        `陈祉辰 ${currentProject.title}`,
        `AI 产品经理 ${currentProject.title}`,
        `AI 产品 ${currentProject.title}`,
        `响应式设计 ${currentProject.title}`,
        `用户交互 ${currentProject.title}`,
      ],
    };
  }, [currentProject]);

  let projectContent;
  if (id === 'project1') {
    projectContent = <OperationsAiProject project={currentProject} projectHtml={projectHtml} projectToc={projectToc} nextProject={projects[(projectIndex + 1) % projects.length]} />;
  } else if (id === 'project2') {
    projectContent = <GeoGrowthProject project={currentProject} projectHtml={projectHtml} projectToc={projectToc} nextProject={projects[(projectIndex + 1) % projects.length]} />;
  } else {
    projectContent = (
      <>
        <section className={clsx(styles.root, 'layout-grid-inner')}>
          <div ref={leftContainerRef} className={styles.leftContainer}>
            <ProjectDetails project={currentProject} />
          </div>
          <div ref={rightContainerRef} className={styles.rightContainer}>
            <ProjectImages project={currentProject} />
          </div>
        </section>
        <NextProject nextProject={projectIndex === projects.length - 1 ? projects[0] : projects[projectIndex + 1]} />
      </>
    );
  }

  return (
    <>
      <CustomHead {...seo} />
      {projectContent}
    </>
  );
}

export async function getStaticPaths() {
  const paths = projects.map((project) => ({ params: { id: project.id } }));
  return { paths, fallback: false };
}

export async function getStaticProps(context) {
  const { params } = context;
  if (['project1', 'project2'].includes(params.id)) {
    const contentDir = path.join(process.cwd(), 'src/content');
    const projectHtml = await withImageDimensions(fs.readFileSync(path.join(contentDir, `${params.id}.html`), 'utf8'));
    const projectToc = JSON.parse(fs.readFileSync(path.join(contentDir, `${params.id}-toc.json`), 'utf8'));
    return { props: { id: params.id, projectHtml, projectToc } };
  }
  return { props: { id: params.id, projectHtml: '', projectToc: [] } };
}

export default Page;

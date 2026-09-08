import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import clsx from 'clsx';
import { gsap } from 'gsap';
import styles from '@src/pages/components/about/styles/about.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';

function About() {
  const isMobile = useIsMobile();
  const rootRef = useRef();
  const animatedImageRef = useRef();

  const setupScrollAnimation = () => {
    const ctx = gsap.context(() => {
      gsap.set(animatedImageRef.current, { top: !isMobile ? '-20vw' : '0' });
      if (!isMobile) {
        gsap.to(animatedImageRef.current, {
          top: '20vw',
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            scroller: document?.querySelector('main'),
            invalidateOnRefresh: true,
          },
        });
      }
    });

    return ctx;
  };

  useIsomorphicLayoutEffect(() => {
    const ctx = setupScrollAnimation();
    return () => ctx.kill();
  }, [isMobile]);

  const renderImageContainer = () => (
    <div className={styles.imageContainer}>
      <div className={styles.profilePlate}>
        <span className={styles.plateEyebrow}>AI PRODUCT / HANGZHOU</span>
        <strong>
          从问题
          <br />
          到流程
          <br />
          再到结果
        </strong>
        <div className={styles.plateFlow}>
          <span>研究</span>
          <i />
          <span>设计</span>
          <i />
          <span>交付</span>
          <i />
          <span>迭代</span>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={rootRef} className={styles.root}>
      <div className={clsx(styles.nameContainer, 'layout-block-inner')}>
        <AppearTitle>
          <h1 className={clsx('h1', 'medium')}>你好，我是</h1>
          <h1 className={clsx('h1', 'medium')}>陈祉辰！</h1>
        </AppearTitle>
      </div>

      <div className={clsx(styles.container, 'layout-grid-inner')}>
        {isMobile ? renderImageContainer() : null}
        <div className={clsx(styles.descWrapper)} ref={animatedImageRef}>
          <AppearTitle>
            <div className="p-l">“我关心的不只是模型能做什么，</div>
            <div className="p-l">更是 AI 如何进入真实工作流程，</div>
            <div className="p-l">被人理解、审核、使用，</div>
            <div className="p-l">并持续产生结果。”</div>
          </AppearTitle>
        </div>
        {!isMobile ? renderImageContainer() : null}
        <div className={clsx(styles.descWrapperBottom)}>
          {!isMobile ? (
            <AppearTitle key="desktop-descWrapperBottom">
              <h6 className="h6">我是一名数字媒体技术专业的 AI 产品实践者。</h6>
              <h6 className="h6">我同时关注产品策划、AI 工作流、内容运营</h6>
              <h6 className="h6">与视觉表达，能从用户问题出发完成需求拆解、</h6>
              <h6 className="h6">方案设计、协作开发、测试验收和知识沉淀。</h6>
              <h6 className="h6">目前在杭州寻找 AI 产品经理相关机会。</h6>
            </AppearTitle>
          ) : (
            <AppearTitle key="mobile-descWrapperBottom">
              <h6 className="h6">我是一名数字媒体技术专业的 AI 产品实践者。</h6>
              <h6 className="h6">我同时关注产品策划、AI 工作流、内容运营与视觉表达，</h6>
              <h6 className="h6">能从用户问题出发完成需求拆解、方案设计、</h6>
              <h6 className="h6">协作开发、测试验收和知识沉淀。</h6>
            </AppearTitle>
          )}
          <div className={clsx(styles.buttonContainer)}>
            <ButtonLink href="/about" label="关于我" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

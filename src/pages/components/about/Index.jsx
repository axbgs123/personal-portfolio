import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import Image from 'next/image';
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
      <Image priority src="/giats/front.webp" sizes="100%" fill alt="埃万杰洛斯·贾齐迪斯" />
    </div>
  );

  return (
    <section ref={rootRef} className={styles.root}>
      <div className={clsx(styles.nameContainer, 'layout-block-inner')}>
        <AppearTitle>
          <h1 className={clsx('h1', 'medium')}>你好，我是</h1>
          <h1 className={clsx('h1', 'medium')}>埃万杰洛斯·贾齐迪斯！</h1>
        </AppearTitle>
      </div>

      <div className={clsx(styles.container, 'layout-grid-inner')}>
        {isMobile ? renderImageContainer() : null}
        <div className={clsx(styles.descWrapper)} ref={animatedImageRef}>
          <AppearTitle>
            <div className="p-l">“自学开发的独立成长经历，</div>
            <div className="p-l">让我能够以富有创意且高效的方式</div>
            <div className="p-l">解决问题，并推动你的项目目标</div>
            <div className="p-l">顺利实现。”</div>
          </AppearTitle>
        </div>
        {!isMobile ? renderImageContainer() : null}
        <div className={clsx(styles.descWrapperBottom)}>
          {!isMobile ? (
            <AppearTitle key="desktop-descWrapperBottom">
              <h6 className="h6">我是一名来自希腊、充满热情的前端开发者。</h6>
              <h6 className="h6">我对设计有敏锐的判断，也始终专注于</h6>
              <h6 className="h6">打造流畅自然的用户体验。我擅长用</h6>
              <h6 className="h6">简洁、高效的代码，让网页应用真正</h6>
              <h6 className="h6">鲜活起来。</h6>
            </AppearTitle>
          ) : (
            <AppearTitle key="mobile-descWrapperBottom">
              <h6 className="h6">我是一名来自希腊、充满热情的前端开发者。</h6>
              <h6 className="h6">我对设计有敏锐的判断，也始终专注于打造</h6>
              <h6 className="h6">流畅自然的用户体验。我擅长用简洁、高效的代码，</h6>
              <h6 className="h6">让网页应用真正鲜活起来。</h6>
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

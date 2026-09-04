import SplitType from 'split-type';
import gsap from 'gsap';
import styles from '@src/components/animationComponents/textOpacity/textOpacity.module.scss';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';

function TextOpacity({ children, trigger }) {
  const containerRef = useRef();
  const splitRef = useRef();

  const createTextOpacityAnimation = (element, scrollTrigger) => {
    const containsChinese = /[\u3400-\u9fff]/.test(element.textContent);
    const splitted = new SplitType(element, { types: containsChinese ? 'chars' : 'words' });
    const segments = containsChinese ? splitted.chars : splitted.words;
    splitRef.current = splitted;

    gsap.set(segments, { opacity: 0, transformOrigin: '50% 50%' });

    gsap.fromTo(
      segments,
      {
        'will-change': 'opacity, transform',
        z: () => gsap.utils.random(containsChinese ? 120 : 500, containsChinese ? 360 : 950),
        opacity: 0,
        xPercent: () => gsap.utils.random(containsChinese ? -35 : -100, containsChinese ? 35 : 100),
        yPercent: () => gsap.utils.random(containsChinese ? -18 : -10, containsChinese ? 18 : 10),
        rotationX: () => gsap.utils.random(containsChinese ? -45 : -90, containsChinese ? 45 : 90),
      },
      {
        ease: containsChinese ? 'power2.out' : 'expo',
        opacity: 1,
        rotationX: 0,
        rotationY: 0,
        xPercent: 0,
        yPercent: 0,
        z: 0,
        scrollTrigger: {
          trigger: scrollTrigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          scroller: document?.querySelector('main'),
          invalidateOnRefresh: true,
        },
        stagger: {
          each: containsChinese ? 0.012 : 0.006,
          from: containsChinese ? 'start' : 'random',
        },
      },
    );
  };

  useIsomorphicLayoutEffect(() => {
    const element = containerRef.current;
    const ctx = gsap.context(() => {
      createTextOpacityAnimation(element, trigger);
    }, element);

    return () => {
      ctx.revert();
      splitRef.current?.revert();
    };
  }, [trigger]);

  return (
    <div ref={containerRef} className={styles.title}>
      {children}
    </div>
  );
}

export default TextOpacity;

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useStore } from '@src/store';
import profilePortrait from '@src/constants/profilePortrait';
import styles from './avantHero.module.scss';

export default function AvantHero() {
  const root = useRef(null);
  const composition = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let entrance;
      const context = gsap.context(() => {
        entrance = gsap
          .timeline({ paused: true })
          .fromTo('[data-name-reveal]', { yPercent: 105, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.1, ease: 'expo.out' }, 0)
          .fromTo('[data-portrait-reveal]', { clipPath: 'inset(8% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'power4.inOut' }, 0.12)
          .fromTo('[data-portrait-shutter]', { scaleY: 1 }, { scaleY: 0, duration: 1.1, stagger: { each: 0.075, from: 'center' }, ease: 'power4.inOut' }, 0.08)
          .fromTo('[data-intro-caption]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, 0.45);
        gsap
          .timeline({
            scrollTrigger: {
              trigger: composition.current,
              scroller: document.querySelector('main'),
              start: 'top 12%',
              end: 'bottom top',
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
            defaults: { ease: 'none' },
          })
          .to('[data-name-word]', { xPercent: (index) => (index === 0 ? -1.5 : 1.5), duration: 1 }, 0)
          .to('[data-portrait-surface]', { yPercent: -5, duration: 1 }, 0)
          .to('[data-name-baseline]', { xPercent: -4, duration: 1 }, 0);
      }, root);
      const resetEntrance = () => {
        entrance.pause(0);
        root.current?.setAttribute('data-intro-pending', 'true');
      };
      const playEntrance = () => {
        root.current?.removeAttribute('data-intro-pending');
        entrance.restart();
      };
      window.addEventListener('portfolio:intro-start', resetEntrance);
      window.addEventListener('portfolio:intro-complete', playEntrance);
      if (document.documentElement.dataset.portfolioIntro === 'playing') resetEntrance();
      else playEntrance();
      return () => {
        window.removeEventListener('portfolio:intro-start', resetEntrance);
        window.removeEventListener('portfolio:intro-complete', playEntrance);
        root.current?.removeAttribute('data-intro-pending');
        context.revert();
      };
    });
    return () => media.revert();
  }, []);

  const replayIntro = () => {
    const { lenis } = useStore.getState();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new CustomEvent('portfolio:replay-intro'));
  };

  return (
    <section ref={root} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.identityHeader} data-intro-caption>
        <Link href="/about" scroll={false}>
          认识我 <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div ref={composition} className={styles.composition}>
        <div className={styles.identity}>
          <h1 className={styles.title} id="hero-title" aria-label="陈祉辰，AI 产品、内容与创作">
            <span className={styles.nameWord} data-name-word aria-hidden="true">
              <span data-name-reveal>
                <span className={styles.nameGlyph}>陈</span>
                <span className={styles.nameGlyph}>祉</span>
                <span className={styles.nameGlyph}>辰</span>
              </span>
            </span>
          </h1>
          <div className={styles.thesis} data-intro-caption>
            <p>
              想清楚<span>，</span>
              <br />
              做出来<span>。</span>
            </p>
            <span className={styles.introduction}>
              把 AI 带进真实工作，
              <br />
              把实践变成值得分享的内容。
            </span>
          </div>
          <div className={styles.selectedLinks} data-intro-caption>
            <Link href="/projects/project1" scroll={false}>
              <span>AI 运营平台</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/projects/project2" scroll={false}>
              <span>GEO 内容增长</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <figure className={styles.portrait} aria-label={profilePortrait.src ? profilePortrait.alt : '虚拟形象预留位'}>
          <div className={styles.portraitReveal} data-portrait-reveal>
            <div className={styles.portraitSurface} data-portrait-surface>
              {profilePortrait.src ? (
                <Image src={profilePortrait.src} alt={profilePortrait.alt} fill priority sizes="(max-width: 760px) 64vw, 40vw" style={{ objectPosition: profilePortrait.position }} />
              ) : (
                <div className={styles.portraitPlaceholder}>
                  <div>
                    <span>虚拟形象</span>
                    <small>像素形象待加入</small>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.portraitShutters} aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((strip) => (
                <i key={strip} data-portrait-shutter />
              ))}
            </div>
          </div>
          <figcaption>PIXEL SELF · 虚拟形象</figcaption>
        </figure>
      </div>
      <div className={styles.nameBaseline} aria-hidden="true" data-name-baseline>
        <span data-name-reveal>CHEN ZHICHEN</span>
      </div>
      <div className={styles.heroFooter} data-intro-caption>
        <Link href="/#work" scroll={false} className={styles.workLink}>
          查看作品<span aria-hidden="true">↘</span>
        </Link>
        <div className={styles.playLinkGroup}>
          <button type="button" className={styles.replay} onClick={replayIntro} aria-label="重新播放网站开场动画">
            <span aria-hidden="true">↻</span>重播开场
          </button>
          <Link href="/#playground" scroll={false} className={styles.pianoLink}>
            <span>试弹钢琴</span>
            <span className={styles.pianoKeys} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

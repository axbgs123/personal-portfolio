import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useStore } from '@src/store';
import SignatureMark from './SignatureMark';
import styles from './motionDirector.module.scss';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const OPENING_SESSION_KEY = 'chen-portfolio-opening-v8';
const OPEN_DIALOGS = '[data-archive-dialog], [data-search-dialog], [data-cat-chat-dialog]';

const pageNames = {
  '/': '陈祉辰',
  '/projects': '作品档案',
  '/about': '关于我',
  '/director': '编导 / AI 运营',
  '/tutorials': '教程与方法',
  '/writing': '口播稿',
  '/photography': '照片视频',
  '/personal-skills': 'Skill 与工作流提效',
  '/aigc': 'AIGC',
  '/more-projects': '项目',
};
function destinationName(path) {
  const pathname = path.split(/[?#]/)[0];
  if (pathname === '/projects/project1') return 'AI 运营平台';
  if (pathname === '/projects/project2') return '百言 GEO';
  return pageNames[pathname] || pageNames[`/${pathname.split('/')[1]}`] || '继续探索';
}
function isReadingRoute(path) {
  return /^\/(tutorials|writing|personal-skills)(\/|$)/.test(path.split(/[?#]/)[0]);
}

export default function MotionDirector({ router }) {
  const root = useRef();
  const label = useRef();
  const skip = useRef();
  const finishIntro = useRef(() => {});
  const [intro, setIntro] = useState(false);
  const [active, setActive] = useState(false);

  useClientLayoutEffect(() => {
    const overlay = root.current;
    const columns = [...overlay.querySelectorAll('[data-curtain-column]')];
    const accent = overlay.querySelector('[data-intro-accent]');
    const ink = overlay.querySelectorAll('[data-intro-accent] [data-signature-stroke]');
    const dock = overlay.querySelector('[data-opening-dock]');
    const panels = [...overlay.querySelectorAll('[data-opening-panel]')];
    const quote = overlay.querySelector('[data-opening-quote]');
    const attribution = overlay.querySelector('[data-opening-attribution]');
    const backdrop = overlay.querySelector('[data-opening-backdrop]');
    const quickLine = overlay.querySelector('[data-quick-line]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    gsap.set(columns, { y: 0, yPercent: 101 });
    let timeline;
    let busy = false;
    let disposed = false;
    let navigationOwned = null;
    let routeNavigation = null;
    let coverPromise = Promise.resolve(true);
    let finishCover;
    let navigationSerial = 0;
    let safeguard;
    let focusFrame;
    let lockedElements = [];
    let savedOverflow;
    let main;
    let fastRoute = false;

    const stopTimeline = () => {
      timeline?.kill();
      cancelAnimationFrame(focusFrame);
      focusFrame = undefined;
      // Killing a GSAP timeline does not settle its promise. Let an interrupted
      // click exit its await instead of retaining a stale, pending navigation.
      const settle = finishCover;
      finishCover = undefined;
      settle?.(false);
      const content = document.querySelector('[data-portfolio-content]');
      if (content) gsap.set(content, { clearProps: 'opacity,transform' });
    };
    const invalidateNavigation = () => {
      navigationSerial += 1;
      navigationOwned = null;
      routeNavigation = null;
      clearTimeout(safeguard);
      stopTimeline();
      return navigationSerial;
    };
    const isCurrentNavigation = (navigation) => !disposed && navigation === routeNavigation && navigation.token === navigationSerial;
    const normalizePath = (path) => {
      const destination = new URL(path, window.location.href);
      return `${destination.pathname}${destination.search}${destination.hash}`;
    };

    const lock = () => {
      // Clear offsets retained by an older hidden-overflow curtain (including
      // hot reload/replay) before measuring its bookmark or showing any plane.
      // The CSS `overflow: clip` keeps new focus changes from scrolling it.
      overlay.scrollTop = 0;
      overlay.scrollLeft = 0;
      busy = true;
      setActive(true);
      document.documentElement.dataset.portfolioTransition = 'playing';
      main = document.querySelector('main');
      if (main && savedOverflow === undefined) {
        savedOverflow = main.style.overflow;
        main.style.overflow = 'hidden';
      }
      // A newer route can replace a cover or reveal without releasing its lock.
      // Preserve the original snapshots, never snapshot our own `inert = true`.
      if (!lockedElements.length) {
        lockedElements = [...document.querySelectorAll('[data-motion-background]')].map((element) => [element, element.inert]);
        lockedElements.forEach(([element]) => {
          element.inert = true;
        });
      }
      useStore.getState().lenis?.stop();
      gsap.set(overlay, { visibility: 'visible', pointerEvents: 'auto' });
    };
    const unlock = () => {
      clearTimeout(safeguard);
      busy = false;
      navigationOwned = null;
      routeNavigation = null;
      setActive(false);
      gsap.set(overlay, { visibility: 'hidden', pointerEvents: 'none' });
      lockedElements.forEach(([element, wasInert]) => {
        element.inert = wasInert;
      });
      lockedElements = [];
      if (main && savedOverflow !== undefined) main.style.overflow = savedOverflow;
      savedOverflow = undefined;
      overlay.dataset.introStage = 'idle';
      document.documentElement.dataset.portfolioTransition = 'ready';
      if (!document.querySelector(OPEN_DIALOGS)) useStore.getState().lenis?.start();
    };
    const reveal = (isIntro = false, token = navigationSerial, immediate = false) => {
      if (disposed || token !== navigationSerial) return;
      clearTimeout(safeguard);
      stopTimeline();
      if (isIntro) overlay.dataset.introStage = 'reveal';
      if (isIntro && document.documentElement.dataset.portfolioIntro === 'playing') {
        document.documentElement.dataset.portfolioIntro = 'ready';
        window.dispatchEvent(new CustomEvent('portfolio:intro-complete'));
      }
      const complete = () => {
        if (disposed || token !== navigationSerial) return;
        unlock();
        setIntro(false);
        if (!document.querySelector(OPEN_DIALOGS)) main?.focus({ preventScroll: true });
      };
      // Escape, the skip button and a viewport change should genuinely skip,
      // not force visitors to sit through another exit animation.
      if (immediate) {
        complete();
        return;
      }
      timeline = gsap.timeline({
        onComplete: complete,
      });
      if (isIntro) {
        // A diagonal taken from the Z/C geometry opens onto the real homepage.
        // Keep the mark in the same spatial system instead of replacing it
        // with a second loader or a disconnected page-transition treatment.
        timeline
          .to(quote, { autoAlpha: 0, y: -24, duration: 0.25, ease: 'power2.in' }, 0)
          .to(accent, { autoAlpha: 0, x: '-=28', duration: 0.42, ease: 'power2.in' }, 0.06)
          .to(
            panels,
            {
              xPercent: (index) => (index ? 102 : -102),
              yPercent: (index) => (index ? 8 : -8),
              duration: 0.94,
              ease: 'power4.inOut',
            },
            0.02,
          );
      } else if (fastRoute) {
        const content = document.querySelector('[data-portfolio-content]');
        timeline.to(quickLine, { scaleX: 1, duration: 0.16, ease: 'power2.out' }, 0).to(quickLine, { opacity: 0, duration: 0.1 }, 0.16);
        if (content)
          timeline.fromTo(
            content,
            { opacity: 0.72, y: 10 },
            {
              opacity: 1,
              y: 0,
              clearProps: 'opacity,transform',
              duration: 0.26,
              ease: 'power2.out',
            },
            0,
          );
      } else {
        timeline
          .to(overlay.querySelector('[data-curtain-copy]'), { opacity: 0, y: -35, duration: 0.26 }, 0)
          .to(backdrop, { opacity: 0, duration: 0.35 }, 0)
          .to(
            columns,
            {
              yPercent: -101,
              duration: 0.55,
              stagger: { each: 0.035, from: 'center' },
              ease: 'power4.inOut',
            },
            0.02,
          );
      }
    };
    const playIntro = (force = false) => {
      if (busy || motion.matches) return;
      if (!force) {
        try {
          if (sessionStorage.getItem(OPENING_SESSION_KEY)) return;
        } catch {
          /* Storage is optional. */
        }
      }
      try {
        sessionStorage.setItem(OPENING_SESSION_KEY, 'seen');
      } catch {
        /* Storage is optional. */
      }
      useStore.getState().lenis?.scrollTo(0, { immediate: true, force: true });
      setIntro(true);
      fastRoute = false;
      overlay.dataset.mode = 'opening';
      overlay.dataset.introStage = 'assemble';
      document.documentElement.dataset.portfolioIntro = 'playing';
      window.dispatchEvent(new CustomEvent('portfolio:intro-start'));
      lock();
      // The opening has its own two solid planes. The five route columns stay
      // offscreen, otherwise they would cover the homepage during the reveal.
      gsap.set(columns, { yPercent: 101 });
      gsap.set(quickLine, { opacity: 0 });
      gsap.set(backdrop, { display: 'block', opacity: 1 });
      gsap.set(panels, { xPercent: 0, yPercent: 0 });
      gsap.set(overlay.querySelector('[data-curtain-copy]'), {
        opacity: 1,
        y: 0,
      });
      gsap.set(overlay.querySelector('[data-route-title]'), {
        display: 'none',
      });
      gsap.set(overlay.querySelector('[data-opening-title]'), {
        display: 'flex',
      });
      gsap.set(quote, { autoAlpha: 0, y: 18 });
      gsap.set(attribution, { opacity: 0, y: 8 });
      gsap.set(accent, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        transformOrigin: '50% 50%',
        autoAlpha: 1,
      });
      // Measure the untransformed SVG and the responsive bookmark target once;
      // only transforms animate. A resize safely reveals the page below.
      const markWidth = accent.clientWidth || 1;
      const bounds = overlay.getBoundingClientRect();
      const bookmark = dock.getBoundingClientRect();
      const dockTransform = {
        x: bookmark.left + bookmark.width / 2 - bounds.left - bounds.width / 2,
        y: bookmark.top + bookmark.height / 2 - bounds.top - bounds.height / 2,
        scale: bookmark.width / markWidth,
      };
      timeline = gsap.timeline({ onComplete: () => reveal(true) });
      timeline
        .fromTo(
          ink,
          {
            x: (index) => (index === 0 ? -32 : 36),
            y: (index) => (index === 0 ? 14 : -12),
            rotation: (index) => (index === 0 ? -4 : 4),
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1.08,
            stagger: 0.06,
            ease: 'power4.out',
          },
          0,
        )
        .fromTo(
          accent,
          { scale: 1.72, rotation: -10, rotationY: -22 },
          {
            scale: 1,
            rotation: 0,
            rotationY: 0,
            duration: 1.18,
            ease: 'power4.out',
          },
          0,
        )
        // One oversized identity becomes the small bookmark. The quotation is
        // left completely still after entering, with no moving texture behind it.
        .to(accent, { ...dockTransform, duration: 0.66, ease: 'power4.inOut' }, 1.15)
        .to(quote, { autoAlpha: 1, y: 0, duration: 0.48, ease: 'power3.out' }, 1.68)
        .to(attribution, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.84)
        .call(
          () => {
            if (!disposed && document.documentElement.dataset.portfolioIntro === 'playing') overlay.dataset.introStage = 'quote';
          },
          null,
          2.19,
        )
        .to(quote, { opacity: 1, duration: 0.01 }, 5.05);
      safeguard = setTimeout(() => reveal(true), 5500);
      focusFrame = requestAnimationFrame(() => {
        focusFrame = undefined;
        if (!disposed && document.documentElement.dataset.portfolioIntro === 'playing') skip.current?.focus({ preventScroll: true });
      });
    };
    finishIntro.current = () => {
      if (busy && overlay.dataset.mode === 'opening') reveal(true, navigationSerial, true);
    };
    const cover = (path) =>
      new Promise((resolve) => {
        fastRoute = isReadingRoute(path) || isReadingRoute(router.asPath);
        overlay.dataset.mode = fastRoute ? 'reading' : 'chapter';
        lock();
        setIntro(false);
        label.current.textContent = destinationName(path);
        gsap.set(overlay.querySelector('[data-opening-title]'), {
          display: 'none',
        });
        gsap.set(backdrop, { display: 'none' });
        gsap.set(overlay.querySelector('[data-route-title]'), {
          display: 'block',
        });
        gsap.set(overlay.querySelector('[data-curtain-copy]'), {
          opacity: 0,
          y: 22,
        });
        stopTimeline();
        finishCover = resolve;
        timeline = gsap.timeline({
          onComplete: () => {
            finishCover = undefined;
            resolve(true);
          },
        });
        if (fastRoute) {
          gsap.set(columns, { yPercent: 101 });
          gsap.set(overlay.querySelector('[data-curtain-copy]'), {
            opacity: 0,
          });
          timeline.fromTo(quickLine, { opacity: 1, scaleX: 0 }, { scaleX: 0.4, duration: 0.06, ease: 'none' });
        } else {
          gsap.set(quickLine, { opacity: 0 });
          timeline
            .fromTo(
              columns,
              { yPercent: 101 },
              {
                yPercent: 0,
                duration: 0.32,
                stagger: 0.025,
                ease: 'power3.inOut',
              },
              0,
            )
            .to(overlay.querySelector('[data-curtain-copy]'), { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.12);
        }
      });
    const armSafeguard = (token) => {
      clearTimeout(safeguard);
      safeguard = setTimeout(() => {
        if (disposed || token !== navigationSerial) return;
        navigationOwned = null;
        routeNavigation = null;
        reveal(false, token);
      }, 8000);
    };
    const beginNavigation = (path, owned = false) => {
      const navigation = {
        path: normalizePath(path),
        token: invalidateNavigation(),
        pushRequested: false,
        routeStarted: false,
      };
      routeNavigation = navigation;
      navigationOwned = owned ? navigation : null;
      coverPromise = cover(path);
      armSafeguard(navigation.token);
      return navigation;
    };
    const onClick = async (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || motion.matches) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('data-no-transition')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      // Course attachments and images keep the browser's native download/view behavior.
      if (/\/downloads\//i.test(destination.pathname) || /\.[a-z0-9]{2,8}$/i.test(destination.pathname)) return;
      event.preventDefault();
      if (busy) return;
      const path = `${destination.pathname}${destination.search}${destination.hash}`;
      const navigation = beginNavigation(path, true);
      const covered = await coverPromise;
      if (!covered || !isCurrentNavigation(navigation)) return;
      try {
        navigation.pushRequested = true;
        await router.push(path, undefined, { scroll: false });
      } catch {
        /* Failed navigation leaves the current page usable. */
      }
      if (!isCurrentNavigation(navigation)) return;
      navigationOwned = null;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (isCurrentNavigation(navigation)) reveal(false, navigation.token);
        }),
      );
    };
    const onRouteStart = (url) => {
      const path = normalizePath(url);
      // Only the router event for this exact owned click belongs to it. An
      // imperative navigation or browser history action supersedes that click.
      if (navigationOwned?.path === path && navigationOwned.pushRequested && !navigationOwned.routeStarted) {
        navigationOwned.routeStarted = true;
        return;
      }
      if (motion.matches || document.documentElement.dataset.portfolioIntro === 'playing') return;
      if (path.split('#')[0] === router.asPath.split('#')[0]) {
        if (busy) {
          invalidateNavigation();
          unlock();
        }
        return;
      }
      // This also interrupts an earlier reveal, so it cannot unlock the next
      // route while that route is still loading.
      beginNavigation(path);
    };
    const onRouteEnd = (url) => {
      const navigation = routeNavigation;
      if (!navigation || navigationOwned === navigation || navigation.path !== normalizePath(url) || !busy || document.documentElement.dataset.portfolioIntro === 'playing') return;
      coverPromise.then((covered) => {
        if (covered && isCurrentNavigation(navigation) && busy)
          requestAnimationFrame(() => {
            if (isCurrentNavigation(navigation)) reveal(false, navigation.token);
          });
      });
    };
    const onRouteError = (error, url) => {
      // Next reports the old request's cancellation before starting its
      // replacement. That cancellation must not finish the replacement route.
      if (!error?.cancelled) onRouteEnd(url);
    };
    const finishOpeningState = () => {
      if (document.documentElement.dataset.portfolioIntro !== 'playing') return;
      document.documentElement.dataset.portfolioIntro = 'ready';
      window.dispatchEvent(new CustomEvent('portfolio:intro-complete'));
      setIntro(false);
    };
    const onHashStart = () => {
      if (!busy) return;
      invalidateNavigation();
      finishOpeningState();
      unlock();
    };
    const onPopState = () => {
      // Capture runs before Next's popstate handler: invalidate a delayed click
      // before it gets another chance to call router.push after its cover.
      const token = invalidateNavigation();
      finishOpeningState();
      if (!busy) return;
      const destination = normalizePath(window.location.href);
      if (motion.matches || destination.split('#')[0] === router.asPath.split('#')[0]) {
        unlock();
        return;
      }
      // The following routeChangeStart owns the new cover. If Next declines
      // navigation or an error occurs before it starts, never leave a lock.
      armSafeguard(token);
    };
    const replay = () => playIntro(true);
    const onMotionChange = () => {
      if (!motion.matches || !busy) return;
      invalidateNavigation();
      finishOpeningState();
      unlock();
      setIntro(false);
      if (!document.querySelector(OPEN_DIALOGS)) main?.focus({ preventScroll: true });
    };
    const onResize = () => {
      if (busy && overlay.dataset.mode === 'opening') finishIntro.current();
    };
    const key = (event) => {
      if (event.key === 'Escape') finishIntro.current();
      if (event.key === 'Tab' && busy && overlay.dataset.mode === 'opening') {
        event.preventDefault();
        skip.current?.focus({ preventScroll: true });
      }
    };
    document.documentElement.dataset.portfolioIntro = 'ready';
    if (router.pathname === '/') playIntro();
    document.addEventListener('click', onClick, true);
    window.addEventListener('keydown', key);
    window.addEventListener('popstate', onPopState, true);
    window.addEventListener('portfolio:replay-intro', replay);
    window.addEventListener('resize', onResize);
    motion.addEventListener('change', onMotionChange);
    router.events.on('routeChangeStart', onRouteStart);
    router.events.on('hashChangeStart', onHashStart);
    router.events.on('routeChangeComplete', onRouteEnd);
    router.events.on('routeChangeError', onRouteError);
    return () => {
      disposed = true;
      invalidateNavigation();
      unlock();
      document.documentElement.dataset.portfolioIntro = 'ready';
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', key);
      window.removeEventListener('popstate', onPopState, true);
      window.removeEventListener('portfolio:replay-intro', replay);
      window.removeEventListener('resize', onResize);
      motion.removeEventListener('change', onMotionChange);
      router.events.off('routeChangeStart', onRouteStart);
      router.events.off('hashChangeStart', onHashStart);
      router.events.off('routeChangeComplete', onRouteEnd);
      router.events.off('routeChangeError', onRouteError);
    };
  }, [router]);

  return (
    <div
      ref={root}
      className={styles.curtain}
      data-motion-curtain
      data-intro-stage="idle"
      aria-hidden={!active}
      role={intro ? 'dialog' : undefined}
      aria-modal={intro ? 'true' : undefined}
      aria-label={intro ? '个人标记与引言开场动画' : undefined}
    >
      <div className={styles.columns} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <div data-curtain-column key={index} />
        ))}
      </div>
      <div className={styles.openingBackdrop} data-opening-backdrop aria-hidden="true">
        <div className={styles.openingPlane} data-opening-panel />
        <div className={styles.openingPlane} data-opening-panel />
      </div>
      <div className={styles.quickLine} data-quick-line aria-hidden="true" />
      <div className={styles.copy} data-curtain-copy>
        <div className={styles.opening} data-opening-title>
          <span className={styles.openingDock} data-opening-dock aria-hidden="true" />
          <SignatureMark className={styles.signature} data-intro-accent />
          {/* Source: https://paulgraham.com/startupideas.html */}
          <blockquote className={styles.openingQuote} data-opening-quote>
            <p lang="en">
              Live in the future,
              <br />
              then build what’s missing.
            </p>
            <footer data-opening-attribution>
              ——Paul Graham，<cite lang="en">《How to Get Startup Ideas》</cite>
            </footer>
          </blockquote>
        </div>
        <div className={styles.destination} data-route-title>
          <span>继续探索 / NEXT</span>
          <p ref={label}>作品档案</p>
          <i aria-hidden="true">↗</i>
        </div>
      </div>
      {intro && (
        <button ref={skip} className={styles.skip} type="button" onClick={() => finishIntro.current()}>
          跳过开场 ↗
        </button>
      )}
    </div>
  );
}

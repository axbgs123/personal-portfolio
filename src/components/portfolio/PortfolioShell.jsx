import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useStore } from '@src/store';
import getSectionScrollTop from '@src/pages/tutorials/components/getSectionScrollTop';
import MotionDirector from './MotionDirector';
import CreativePointer from './CreativePointer';
import SignatureMark from './SignatureMark';
import ArchiveSearch from './ArchiveSearch';
import ArchiveDeck from './ArchiveDeck';
import styles from './portfolioShell.module.scss';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const StudioCat = dynamic(() => import('./StudioCat'), { ssr: false });
const StudioCatChat = dynamic(() => import('./StudioCatChat'), { ssr: false });
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function PortfolioShell({ children, router }) {
  const mainRef = useRef();
  const contentRef = useRef();
  const menuButton = useRef();
  const menuRef = useRef();
  const menuBackdrop = useRef();
  const menuAnimation = useRef();
  const menuFocusFrame = useRef(null);
  const progress = useRef();
  const scrollPositions = useRef(new Map());
  const historyNavigation = useRef(false);
  const currentHistoryKey = useRef(null);
  const lastRoute = useRef(null);
  const homeReturn = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = useCallback(() => {
    menuAnimation.current?.kill();
    const complete = () => {
      setMenuOpen(false);
      if (menuFocusFrame.current !== null) cancelAnimationFrame(menuFocusFrame.current);
      menuFocusFrame.current = requestAnimationFrame(() => {
        menuFocusFrame.current = null;
        if (document.documentElement.dataset.portfolioTransition === 'playing' || document.querySelector('[data-search-dialog], [data-cat-chat-dialog], [data-archive-dialog]')) return;
        menuButton.current?.focus({ preventScroll: true });
      });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) complete();
    else
      menuAnimation.current = gsap.to(menuBackdrop.current, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.45,
        ease: 'power3.inOut',
        onComplete: complete,
      });
  }, []);

  const openMenu = useCallback(() => {
    if (document.documentElement.dataset.portfolioTransition === 'playing' || document.querySelector('[data-search-dialog]')) return;
    if (menuFocusFrame.current !== null) cancelAnimationFrame(menuFocusFrame.current);
    menuFocusFrame.current = null;
    // The chat releases its child locks synchronously before this menu owns them.
    window.dispatchEvent(new CustomEvent('portfolio:archive-opened'));
    setMenuOpen(true);
  }, []);

  useEffect(() => {
    const dismiss = () => {
      menuAnimation.current?.kill();
      if (menuFocusFrame.current !== null) cancelAnimationFrame(menuFocusFrame.current);
      menuFocusFrame.current = null;
      setMenuOpen(false);
    };
    const onChatState = (event) => {
      if (event.detail?.open) dismiss();
    };
    window.addEventListener('portfolio:search-opened', dismiss);
    window.addEventListener('portfolio:intro-start', dismiss);
    window.addEventListener('portfolio:cat-chat-state', onChatState);
    router.events.on('routeChangeStart', dismiss);
    router.events.on('hashChangeStart', dismiss);
    return () => {
      window.removeEventListener('portfolio:search-opened', dismiss);
      window.removeEventListener('portfolio:intro-start', dismiss);
      window.removeEventListener('portfolio:cat-chat-state', onChatState);
      router.events.off('routeChangeStart', dismiss);
      router.events.off('hashChangeStart', dismiss);
      menuAnimation.current?.kill();
      if (menuFocusFrame.current !== null) cancelAnimationFrame(menuFocusFrame.current);
    };
  }, [router.events]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lenis = new Lenis({
      wrapper: mainRef.current,
      content: contentRef.current,
      smoothWheel: !reduced.matches,
      syncTouch: false,
      allowNestedScroll: true,
      duration: 0.95,
    });
    useStore.setState({ lenis, isLoading: false, introOut: true });
    if (document.documentElement.dataset.portfolioTransition === 'playing') lenis.stop();
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const onScroll = () => {
      ScrollTrigger.update();
      setScrolled(mainRef.current.scrollTop > 40);
      if (progress.current) progress.current.style.transform = `scaleX(${mainRef.current.scrollTop / Math.max(1, mainRef.current.scrollHeight - mainRef.current.clientHeight)})`;
    };
    lenis.on('scroll', onScroll);
    const resize = new ResizeObserver(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    });
    resize.observe(contentRef.current);
    return () => {
      resize.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      useStore.setState({ lenis: null });
    };
  }, []);

  useEffect(() => {
    currentHistoryKey.current = window.history.state?.key || router.asPath;
    const savePosition = (url) => {
      if (url !== '/') homeReturn.current = null;
      const y = mainRef.current?.scrollTop || 0;
      scrollPositions.current.set(currentHistoryKey.current, y);
      scrollPositions.current.set(router.asPath, y);
    };
    const cancelHistory = (error, url) => {
      // A cancelled OLD navigation can arrive after beforePopState has marked
      // a NEW history destination. Do not erase the latter's restoration.
      if (!error?.cancelled && historyNavigation.current?.as === url) historyNavigation.current = false;
    };
    router.beforePopState((state) => {
      homeReturn.current = null;
      historyNavigation.current = { as: state.as, key: state.key };
      return true;
    });
    router.events.on('routeChangeStart', savePosition);
    router.events.on('hashChangeStart', savePosition);
    router.events.on('routeChangeError', cancelHistory);
    return () => {
      router.beforePopState(() => true);
      router.events.off('routeChangeStart', savePosition);
      router.events.off('hashChangeStart', savePosition);
      router.events.off('routeChangeError', cancelHistory);
    };
  }, [router]);

  useEffect(
    () => () => {
      homeReturn.current = null;
    },
    [],
  );

  const returnHome = useCallback(
    async (event) => {
      if (router.pathname !== '/' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const intent = {};
      homeReturn.current = intent;
      historyNavigation.current = false;
      // Save the outgoing hash entry before explicitly scrolling the new home entry.
      // Next's scroll:false hash removal only changes the URL, not our fixed main.
      const source = router.asPath;
      const sourceKey = window.history.state?.key || source;
      const sourceY = mainRef.current?.scrollTop || 0;
      scrollPositions.current.set(sourceKey, sourceY);
      scrollPositions.current.set(source, sourceY);
      try {
        if (source !== '/' && !(await router.push('/', undefined, { scroll: false }))) return;
        if (homeReturn.current !== intent || window.location.pathname !== '/' || window.location.search || window.location.hash) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const { lenis } = useStore.getState();
        if (lenis) lenis.scrollTo(0, { force: true, duration: 1.1, immediate: reduced });
        else mainRef.current?.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
      } catch {
        // Failed or superseded navigation must not overwrite the current scroll position.
      } finally {
        if (homeReturn.current === intent) homeReturn.current = null;
      }
    },
    [router],
  );

  useEffect(() => {
    // Next does not change asPath when the same anchor is clicked again.
    const repeatAnchor = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, window.location.href);
      if (!url.hash || url.href !== window.location.href) return;
      let target;
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      if (!target) return;
      event.preventDefault();
      useStore.getState().lenis?.scrollTo(getSectionScrollTop(target, document.querySelector('aside[aria-label]:not([data-studio-cat])')), {
        force: true,
        duration: 1.15,
        immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
    };
    document.addEventListener('click', repeatAnchor, true);
    return () => document.removeEventListener('click', repeatAnchor, true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    const isHistory = Boolean(historyNavigation.current && historyNavigation.current.as === router.asPath);
    if (isHistory) historyNavigation.current = false;
    const samePageAnchor = lastRoute.current !== null && lastRoute.current.split('#')[0] === router.asPath.split('#')[0] && !isHistory;
    lastRoute.current = router.asPath;
    currentHistoryKey.current = window.history.state?.key || router.asPath;
    const frame = requestAnimationFrame(() => {
      const { lenis } = useStore.getState();
      const hash = router.asPath.split('#')[1];
      let target;
      try {
        target = hash && document.getElementById(decodeURIComponent(hash));
      } catch {
        /* Malformed fragments do not block the page. */
      }
      const sidebar = document.querySelector('aside[aria-label]:not([data-studio-cat])');
      const savedY = scrollPositions.current.get(currentHistoryKey.current) ?? scrollPositions.current.get(router.asPath);
      const restoreHistory = isHistory && savedY !== undefined;
      const restoredY = restoreHistory ? savedY : 0;
      lenis?.resize();
      ScrollTrigger.refresh();
      const anchorDestination = target ? getSectionScrollTop(target, sidebar) : 0;
      const destination = restoreHistory ? restoredY : anchorDestination;
      const animateAnchor = samePageAnchor && target && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      lenis?.scrollTo(destination, {
        immediate: !animateAnchor,
        duration: 1.15,
        force: true,
      });
      ScrollTrigger.update();
      mainRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [router.asPath]);

  useClientLayoutEffect(() => {
    if (!menuOpen) {
      if (document.documentElement.dataset.portfolioTransition !== 'playing' && !document.querySelector('[data-search-dialog], [data-cat-chat-dialog]')) useStore.getState().lenis?.start();
      return undefined;
    }
    // Own children only: route transitions independently own main/header.inert.
    const locked = [...document.querySelectorAll('main[data-motion-background] > *, header[data-motion-background] > *')].map((element) => ({ element, inert: element.inert }));
    locked.forEach(({ element }) => {
      element.inert = true;
    });
    useStore.getState().lenis?.stop();
    menuRef.current?.querySelector('button')?.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      menuAnimation.current = gsap.timeline().fromTo(menuBackdrop.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: 'power4.inOut' }).fromTo(
        menuRef.current.querySelectorAll('[data-menu-reveal]'),
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.07,
          duration: 0.55,
          ease: 'power3.out',
        },
        0.25,
      );
    }
    const onKey = (event) => {
      if (event.defaultPrevented || event.isComposing || document.documentElement.dataset.portfolioTransition === 'playing' || document.querySelector('[data-search-dialog], [data-cat-chat-dialog]'))
        return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (event.repeat) return;
        closeMenu();
      }
      if (event.key === 'Tab') {
        const links = [...menuRef.current.querySelectorAll('a[href], button:not(:disabled)')].filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'));
        const first = links[0];
        const last = links[links.length - 1];
        if (!first) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const containFocus = (event) => {
      if (document.documentElement.dataset.portfolioTransition === 'playing' || document.querySelector('[data-search-dialog], [data-cat-chat-dialog]')) return;
      if (!menuRef.current?.contains(event.target)) menuRef.current?.querySelector('button')?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('focusin', containFocus);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', containFocus);
      menuAnimation.current?.kill();
      locked.forEach(({ element, inert }) => {
        if (element.isConnected) element.inert = inert;
      });
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className={styles.root}>
      <MotionDirector router={router} />
      <ArchiveSearch />
      <CreativePointer />
      <StudioCat />
      <StudioCatChat />
      <a className={styles.skip} href="#page-content" data-motion-background>
        跳至正文
      </a>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} data-motion-background>
        <Link className={styles.brand} href="/" scroll={false} aria-label="陈祉辰 · 首页" onClick={returnHome}>
          <SignatureMark className={styles.brandMark} />
        </Link>
        <span className={styles.headerNote}>AI 产品 · 内容 · 创作</span>
        <nav className={styles.nav} aria-label="主导航">
          <Link href="/projects" scroll={false} aria-current={router.pathname.startsWith('/projects') ? 'page' : undefined}>
            项目
          </Link>
          <Link href="/about" scroll={false} aria-current={router.pathname === '/about' ? 'page' : undefined}>
            关于我
          </Link>
          <button className={styles.searchButton} type="button" aria-label="搜索全站内容" onClick={() => window.dispatchEvent(new CustomEvent('portfolio:open-search'))}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="10" cy="10" r="6" />
              <path d="m15 15 6 6" />
            </svg>
            <span>搜索</span>
            <kbd>⌘ K</kbd>
          </button>
          <button ref={menuButton} type="button" data-magnetic onClick={() => (menuOpen ? closeMenu() : openMenu())} aria-expanded={menuOpen} aria-controls="archive-menu">
            仓库 <span>+</span>
          </button>
          <a className={styles.contactLink} data-magnetic href="mailto:2907107669@qq.com">
            聊一聊 <span>↗</span>
          </a>
        </nav>
        <span ref={progress} className={styles.readingProgress} aria-hidden="true" />
      </header>
      {menuOpen && (
        <div ref={menuBackdrop} className={styles.menuBackdrop} data-lenis-prevent>
          <div className={styles.menu} role="dialog" aria-modal="true" aria-label="仓库导航" ref={menuRef} id="archive-menu" data-archive-dialog>
            <div className={styles.menuTop}>
              <span>把积累，展开来看。</span>
              <button type="button" onClick={closeMenu} aria-label="关闭仓库导航">
                关闭 ×
              </button>
            </div>
            <ArchiveDeck
              path={router.asPath.split('#')[0]}
              onFollow={(href) => {
                if (router.asPath.split('#')[0] === href) closeMenu();
              }}
            />
            <div className={styles.menuBottom}>
              <span>项目 / 记录 / 方法 / 创作</span>
              <Link
                href="/#playground"
                scroll={false}
                onClick={() => {
                  if (router.pathname === '/') closeMenu();
                }}
              >
                去弹一首 ↘
              </Link>
            </div>
            <div className={styles.menuMobileNav}>
              <Link href="/projects" scroll={false}>
                代表项目
              </Link>
              <Link href="/about" scroll={false}>
                关于我
              </Link>
              <a href="mailto:2907107669@qq.com">与我联系 ↗</a>
            </div>
          </div>
        </div>
      )}
      <main ref={mainRef} className={styles.main} id="page-content" tabIndex={-1} data-motion-background>
        <div ref={contentRef}>
          <div key={router.asPath.split('#')[0]} className={styles.page} data-portfolio-content>
            {children}
          </div>
          <footer className={styles.footer} id="contact">
            <div className={styles.footerTop}>
              <div>
                <span className={styles.eyebrow}>LET’S MAKE IT REAL</span>
                <h2>
                  期待参与，
                  <br />
                  下一个值得做的产品。
                </h2>
              </div>
              <a className={styles.mailArrow} data-magnetic href="mailto:2907107669@qq.com" aria-label="给陈祉辰发送邮件">
                ↗
              </a>
            </div>
            <div className={styles.footerInfo}>
              <span>AI 产品实践 · 内容工作流 · 视觉创作</span>
              <a href="mailto:2907107669@qq.com">2907107669@qq.com</a>
            </div>
            <div className={styles.footerBottom}>
              <span className={styles.footerSignature}>
                <SignatureMark />
                陈祉辰 · 杭州
              </span>
              <div>
                <Link href="/tutorials" scroll={false}>
                  教程
                </Link>
                <Link href="/writing" scroll={false}>
                  文字与思考
                </Link>
                <Link href="/photography" scroll={false}>
                  摄影
                </Link>
              </div>
              <button type="button" onClick={() => useStore.getState().lenis?.scrollTo(0)}>
                回到顶部 ↑
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

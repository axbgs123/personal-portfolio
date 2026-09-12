import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';
import getSectionScrollTop from '@src/pages/tutorials/components/getSectionScrollTop';
import styles from './archiveSearch.module.scss';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const categories = [
  { id: 'all', label: '全部' },
  { id: 'projects', label: '项目' },
  { id: 'tutorials', label: '教程' },
  { id: 'writing', label: '口播稿' },
  { id: 'skills', label: 'Skill 与工作流提效' },
  { id: 'photography', label: '照片视频' },
];
const isPlainClick = (event) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export default function ArchiveSearch() {
  const router = useRouter();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const triggerRef = useRef(null);
  const menuWasOpenRef = useRef(false);
  const lockRef = useRef(null);
  const openRef = useRef(false);
  const focusFrame = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [index, setIndex] = useState(null);
  const [indexError, setIndexError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(30);

  const releaseBackground = useCallback(() => {
    const lock = lockRef.current;
    if (!lock) return;
    lockRef.current = null;
    // The search owns only the app ancestor. MotionDirector independently owns
    // main/header.inert; restoring this ancestor never clears its route locks.
    if (lock.app?.isConnected) lock.app.inert = lock.wasInert;
    const otherDialog = document.querySelector('[data-archive-dialog]:not([data-archive-search])');
    if ((!lock.wasStopped || lock.menuWasOpen) && !otherDialog && document.documentElement.dataset.portfolioTransition !== 'playing') useStore.getState().lenis?.start();
  }, []);

  const closeSearch = useCallback(
    (restoreFocus = true) => {
      openRef.current = false;
      releaseBackground();
      setOpen(false);
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      if (restoreFocus) {
        focusFrame.current = requestAnimationFrame(() => {
          focusFrame.current = null;
          if (document.documentElement.dataset.portfolioTransition === 'playing') return;
          const candidates = [triggerRef.current, document.querySelector('[aria-controls="archive-menu"]'), document.querySelector('main')];
          const trigger = candidates.find(
            (element) =>
              element?.isConnected &&
              element.matches('a[href], button, input, select, textarea, [tabindex]') &&
              !element.closest('[inert]') &&
              !element.disabled &&
              element.getClientRects().length > 0,
          );
          trigger?.focus({ preventScroll: true });
        });
      }
    },
    [releaseBackground],
  );

  const openSearch = useCallback((trigger) => {
    if (document.documentElement.dataset.portfolioTransition === 'playing') return;
    if (openRef.current) {
      inputRef.current?.focus();
      return;
    }
    triggerRef.current = trigger instanceof HTMLElement ? trigger : document.activeElement;
    menuWasOpenRef.current = Boolean(document.querySelector('[data-archive-dialog]:not([data-search-dialog])'));
    openRef.current = true;
    setOpen(true);
    window.dispatchEvent(new CustomEvent('portfolio:search-opened'));
  }, []);

  useEffect(() => {
    const onOpen = (event) => openSearch(event.detail?.trigger);
    const onShortcut = (event) => {
      if (event.isComposing || event.altKey || !['k', 'K'].includes(event.key) || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (openRef.current) closeSearch();
      else openSearch(document.activeElement);
    };
    const onNavigation = () => {
      if (openRef.current) closeSearch(false);
    };
    window.addEventListener('portfolio:open-search', onOpen);
    window.addEventListener('keydown', onShortcut, true);
    window.addEventListener('popstate', onNavigation, true);
    window.addEventListener('portfolio:intro-start', onNavigation);
    router.events.on('routeChangeStart', onNavigation);
    router.events.on('hashChangeStart', onNavigation);
    return () => {
      window.removeEventListener('portfolio:open-search', onOpen);
      window.removeEventListener('keydown', onShortcut, true);
      window.removeEventListener('popstate', onNavigation, true);
      window.removeEventListener('portfolio:intro-start', onNavigation);
      router.events.off('routeChangeStart', onNavigation);
      router.events.off('hashChangeStart', onNavigation);
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      openRef.current = false;
      releaseBackground();
    };
  }, [closeSearch, openSearch, releaseBackground, router.events]);

  useClientLayoutEffect(() => {
    if (!open) return undefined;
    const app = document.getElementById('__next');
    const { lenis } = useStore.getState();
    const menuWasOpen = menuWasOpenRef.current || Boolean(document.querySelector('[data-archive-dialog]:not([data-archive-search])'));
    lockRef.current = {
      app,
      wasInert: app?.inert || false,
      wasStopped: Boolean(lenis?.isStopped),
      menuWasOpen,
    };
    if (app) app.inert = true;
    lenis?.stop();
    inputRef.current?.focus({ preventScroll: true });

    const onKey = (event) => {
      if (!openRef.current || event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeSearch();
        return;
      }
      if (event.key === 'Tab') {
        event.stopImmediatePropagation();
        const focusable = [...dialogRef.current.querySelectorAll('a[href], button:not(:disabled), input')].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        const links = [...dialogRef.current.querySelectorAll('[data-search-result]')];
        const current = links.indexOf(document.activeElement);
        if (links.length && (current !== -1 || document.activeElement === inputRef.current)) {
          event.preventDefault();
          const direction = event.key === 'ArrowDown' ? 1 : -1;
          let next = direction === 1 ? 0 : links.length - 1;
          if (current !== -1) next = (current + direction + links.length) % links.length;
          links[next].focus({ preventScroll: true });
          links[next].scrollIntoView({ block: 'nearest' });
        }
      }
    };
    const containFocus = (event) => {
      if (openRef.current && !dialogRef.current?.contains(event.target)) inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', containFocus, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', containFocus, true);
      releaseBackground();
    };
  }, [open, closeSearch, releaseBackground]);

  useEffect(() => {
    if (!open || index) return undefined;
    let active = true;
    setIndexError(false);
    // Loaded on demand: article arrays and server-side content readers never
    // become dependencies of the site-wide navigation bundle.
    import('@src/constants/searchIndex')
      .then((module) => {
        if (active) setIndex(module);
      })
      .catch(() => {
        if (active) setIndexError(true);
      });
    return () => {
      active = false;
    };
  }, [open, index, attempt]);

  useEffect(() => {
    setLimit(30);
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [query, category]);

  const results = useMemo(() => index?.searchArchive(query, category) || [], [index, query, category]);
  const counts = useMemo(() => {
    const all = index?.searchArchive(query) || [];
    return all.reduce(
      (totals, result) => ({
        ...totals,
        [result.category]: (totals[result.category] || 0) + 1,
      }),
      { all: all.length },
    );
  }, [index, query]);

  const followResult = (event, href) => {
    if (!isPlainClick(event)) return;
    closeSearch(false);
    // Native NextLink still handles real routes and modified clicks. Release
    // this modal before Next emits routeChangeStart and starts its own curtain.
    const destination = new URL(href, window.location.href);
    if (destination.href !== window.location.href) return;
    event.preventDefault();
    let target;
    try {
      target = destination.hash && document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    } catch {
      /* An invalid fragment can safely return to this page's beginning. */
    }
    const scrollTop = target ? getSectionScrollTop(target, document.querySelector('aside[aria-label]:not([data-studio-cat])')) : 0;
    useStore.getState().lenis?.scrollTo(scrollTop, { force: true, immediate: true });
    document.querySelector('main')?.focus({ preventScroll: true });
  };

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="archive-search-title" data-archive-search data-search-dialog data-archive-dialog>
        <header className={styles.top}>
          <div>
            <h2 id="archive-search-title">站内搜索</h2>
            <span>项目 / 教程 / 口播稿 / SKILL / 照片视频</span>
          </div>
          <button type="button" onClick={() => closeSearch()} className={styles.close} aria-label="关闭站内搜索">
            关闭 <span aria-hidden="true">×</span>
          </button>
        </header>

        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            dialogRef.current.querySelector('[data-search-result]')?.click();
          }}
        >
          <label className={styles.searchField} htmlFor="archive-search-input">
            <span className={styles.srOnly}>搜索标题与内容摘要</span>
            <input
              ref={inputRef}
              id="archive-search-input"
              type="search"
              value={query}
              maxLength={120}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="想找什么？"
              aria-describedby="archive-search-help"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="submit" aria-label="打开第一条搜索结果" disabled={!results.length || !index}>
            ↗
          </button>
        </form>

        <div className={styles.filters} role="group" aria-label="按内容分类筛选">
          {categories.map((item) => (
            <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
              {item.label}
              <span aria-hidden="true">{index ? counts[item.id] || 0 : '—'}</span>
            </button>
          ))}
        </div>

        <div className={styles.resultsMeta} role="status" aria-live="polite" aria-atomic="true">
          <span>{index ? `${query.trim() ? '找到' : '已收录'} ${results.length} 条${category === 'all' ? '内容' : categories.find((item) => item.id === category).label}` : '准备搜索索引'}</span>
          <span className={styles.metaHint}>标题与摘要匹配</span>
        </div>

        <div className={styles.results} ref={resultsRef} data-lenis-prevent>
          {!index && !indexError && <p className={styles.empty}>正在载入站内索引…</p>}
          {indexError && !index && (
            <div className={styles.empty}>
              <p>搜索索引未能载入。</p>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                重新载入 ↗
              </button>
            </div>
          )}
          {index && !results.length && (
            <div className={styles.empty}>
              <h3>暂时没有匹配内容。</h3>
              <p>试试更短的关键词，比如 Codex、GEO 或知识库。</p>
              {category !== 'all' && (
                <button type="button" onClick={() => setCategory('all')}>
                  在全部内容中搜索 ↗
                </button>
              )}
            </div>
          )}
          {!!results.length && (
            <ul>
              {results.slice(0, limit).map((result) => (
                <li key={result.id}>
                  <Link href={result.href} scroll={false} prefetch={false} className={styles.result} data-search-result data-no-transition onClick={(event) => followResult(event, result.href)}>
                    <span className={styles.resultCategory}>{categories.find((item) => item.id === result.category)?.label}</span>
                    <div>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                      <span className={styles.resultDetail}>{result.detail}</span>
                    </div>
                    <span className={styles.resultArrow} aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {results.length > limit && (
            <button type="button" className={styles.more} onClick={() => setLimit((value) => value + 30)}>
              继续显示 · 还有 {results.length - limit} 条 ↓
            </button>
          )}
        </div>

        <footer className={styles.bottom} id="archive-search-help">
          <span>↑ ↓ 选择 · 回车打开 · Esc 关闭</span>
          <span>⌘ / Ctrl + K</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

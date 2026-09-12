import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './archiveMachine.module.scss';

/*
 * A writer's archive, operated as a little print shop.
 * Palette: paper #F5F5F3, ink #101010, chassis #202020, metal #777777,
 * seam #C8C8C5, receipt #FFFFFF. Red is reserved for status / action arrows.
 * Existing Haas display / PingFang body / mono.
 * Layout: a compact machine under a quiet title; one narrow receipt, no wall.
 * Signature: pulling a real, captured lever feeds a real document through a slot.
 * Critique: don't imitate a casino (no reels, prizes, flashing lights or audio).
 * Search is an equal route; random discovery is optional, never a content gate.
 */
const initialState = {
  queue: [],
  history: [],
  cursor: -1,
  query: '',
  searchOpen: false,
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function shuffledIds(ids, random = Math.random) {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function matchesArchiveEntry(entry, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = `${entry.title} ${entry.excerpt} ${entry.meta}`.toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}

export default function ArchiveMachine({ entries, storageId = 'writing' }) {
  const storageKey = `cz:archive-machine:v2:${storageId}`;
  const [machine, setMachine] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [pull, setPull] = useState(0);
  const [printingKey, setPrintingKey] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const busyRef = useRef(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const searchButtonRef = useRef(null);
  const stateRef = useRef(initialState);
  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const seen = useMemo(() => new Set(machine.history), [machine.history]);
  const seenCount = entries.filter((entry) => seen.has(entry.id)).length;
  const { searchOpen, query } = machine;
  const selected = entryMap.get(machine.history[machine.cursor]);
  const results = useMemo(() => entries.filter((entry) => matchesArchiveEntry(entry, query)), [entries, query]);
  const busy = phase === 'printing';
  const nextDrawLabel = selected ? '再抽一份' : '抽取一份';
  let statusLabel = '准备就绪';
  if (!ready) statusLabel = '正在准备';
  else if (busy) statusLabel = '正在出签';
  else if (!machine.queue.length) statusLabel = '本轮已看完';

  const commit = useCallback(
    (next) => {
      stateRef.current = next;
      setMachine(next);
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage is optional. The in-memory queue continues without persistence.
      }
    },
    [storageKey],
  );

  const setSearchOpen = useCallback(
    (open) => {
      commit({ ...stateRef.current, searchOpen: open });
    },
    [commit],
  );

  useEffect(() => {
    let restored = null;
    try {
      const candidate = JSON.parse(window.sessionStorage.getItem(storageKey));
      if (candidate && Array.isArray(candidate.history) && Array.isArray(candidate.queue)) {
        const history = [...new Set(candidate.history)].filter((id) => entryMap.has(id));
        const pool = entries.map((entry) => entry.id);
        const remaining = pool.filter((id) => !history.includes(id));
        const queue = [...new Set(candidate.queue)].filter((id) => remaining.includes(id));
        queue.push(...shuffledIds(remaining.filter((id) => !queue.includes(id))));
        restored = {
          history,
          queue,
          cursor: clamp(Number.isInteger(candidate.cursor) ? candidate.cursor : history.length - 1, history.length ? 0 : -1, history.length - 1),
          query: typeof candidate.query === 'string' ? candidate.query : '',
          searchOpen: candidate.searchOpen === true,
        };
      }
    } catch {
      // A blocked or outdated session must not block the machine.
    }
    commit(
      restored || {
        ...initialState,
        queue: shuffledIds(entries.map((entry) => entry.id)),
      },
    );
    setReady(true);
    return () => window.clearTimeout(timerRef.current);
  }, [commit, entries, entryMap, storageKey]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    inputRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape' || !searchPanelRef.current?.contains(event.target)) return;
      event.stopPropagation();
      setSearchOpen(false);
      searchButtonRef.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [searchOpen, setSearchOpen]);

  const printEntry = (entry, next) => {
    if (!entry || busyRef.current) return;
    busyRef.current = true;
    setPull(0);
    setPhase('printing');
    setPrintingKey((value) => value + 1);
    commit({ ...next, searchOpen: false });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = window.setTimeout(
      () => {
        busyRef.current = false;
        setPhase('idle');
        setAnnouncement(`已取出：${entry.title}。可打开原文，或继续抽取。`);
      },
      reduced ? 0 : 760,
    );
  };

  const draw = () => {
    if (!ready || busyRef.current) return;
    const { current } = stateRef;
    const [id, ...queue] = current.queue;
    if (!id) return;
    printEntry(entryMap.get(id), {
      ...current,
      queue,
      history: [...current.history, id],
      cursor: current.history.length,
    });
  };

  const visit = (entry) => {
    const { current } = stateRef;
    const existing = current.history.indexOf(entry.id);
    const history = existing < 0 ? [...current.history, entry.id] : current.history;
    commit({
      ...current,
      history,
      queue: current.queue.filter((id) => id !== entry.id),
      cursor: existing < 0 ? history.length - 1 : existing,
    });
    // Keep the search panel and query intact when returning from the article.
  };

  const browseHistory = (direction) => {
    const cursor = stateRef.current.cursor + direction;
    if (busyRef.current || cursor < 0 || cursor >= stateRef.current.history.length) return;
    const next = { ...stateRef.current, cursor };
    printEntry(entryMap.get(next.history[next.cursor]), next);
  };

  const restart = () => {
    if (busyRef.current) return;
    commit({
      ...stateRef.current,
      queue: shuffledIds(entries.map((entry) => entry.id)),
      history: [],
      cursor: -1,
    });
    setAnnouncement('已开始新一轮，计数归零。');
  };

  const finishDrag = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    suppressClick.current = cancelled || Math.abs(event.clientY - drag.startY) > 5;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPull(0);
    if (!cancelled && event.clientY - drag.startY >= 45) draw();
  };

  return (
    <div className={styles.page} data-archive-machine data-collection="writing" data-phase={phase}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>陈祉辰的内容仓库</span>
          <h1>
            口播稿<span aria-hidden="true">.</span>
          </h1>
        </div>
        <p>
          拉一下，遇见一篇。
          <br />
          知道想找什么？直接搜索。
        </p>
      </div>

      <div className={styles.toolbar}>
        <span className={styles.collectionLabel}>
          文章档案<span>{entries.length} 篇</span>
        </span>
        <button
          ref={searchButtonRef}
          type="button"
          className={styles.searchToggle}
          aria-expanded={searchOpen}
          aria-controls="archive-machine-search"
          onClick={() => setSearchOpen(!stateRef.current.searchOpen)}
        >
          <span aria-hidden="true">⌕</span> 直接搜索
        </button>
      </div>

      {searchOpen && (
        <div className={styles.searchPanel} id="archive-machine-search" ref={searchPanelRef} role="search" aria-label="在档案机内搜索真实内容">
          <div className={styles.searchHeading}>
            <span id="archive-machine-query-label">输入标题或关键词</span>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                searchButtonRef.current?.focus();
              }}
            >
              关闭<span aria-hidden="true"> ×</span>
            </button>
          </div>
          <input
            ref={inputRef}
            id="archive-machine-query"
            aria-labelledby="archive-machine-query-label"
            type="search"
            value={query}
            onChange={(event) => commit({ ...stateRef.current, query: event.target.value })}
            placeholder="例如：OpenAI、FDE、机器人"
            autoComplete="off"
          />
          <div className={styles.resultMeta} role="status">
            {results.length} 份匹配内容 · 点击直接打开
          </div>
          <ul className={styles.results} data-lenis-prevent>
            {results.map((entry) => (
              <li key={entry.id}>
                <Link href={entry.href} onClick={() => visit(entry)} scroll={false}>
                  <small>{entry.label}</small>
                  <span>{entry.title}</span>
                  <i aria-hidden="true">↗</i>
                </Link>
              </li>
            ))}
            {!results.length && <li className={styles.emptySearch}>没有匹配的内容，换个关键词试试。</li>}
          </ul>
        </div>
      )}

      <div className={styles.stage} aria-busy={busy}>
        <div className={styles.machine}>
          <div className={styles.chassis}>
            <div className={styles.machineTop}>
              <span className={styles.brand}>
                档案<span aria-hidden="true"> / </span>ARCHIVE
              </span>
              <span className={styles.status}>
                <i aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
            <div className={styles.display}>
              <span>
                本轮已看<small>口播稿 · 看过不重复</small>
              </span>
              <output aria-label={`文章本轮已看 ${seenCount} 篇，共 ${entries.length} 篇`}>
                <strong>{String(seenCount).padStart(2, '0')}</strong>
                <i>/ {String(entries.length).padStart(2, '0')}</i>
              </output>
            </div>
            <div className={styles.slot} aria-hidden="true">
              <span />
              <i />
              <i />
              <i />
            </div>
            <div className={styles.machineFoot}>
              <span>随机探索，不是推荐算法</span>
              <span aria-hidden="true">↓</span>
            </div>
          </div>

          <div className={styles.leverAssembly}>
            <span className={styles.leverLabel}>{pull > 0.64 ? '松手出签' : '向下拉'}</span>
            <div className={styles.leverTrack} style={{ '--pull': pull }} data-dragging={pull > 0}>
              <div className={styles.trackLine} aria-hidden="true" />
              <button
                type="button"
                className={styles.lever}
                disabled={!ready || busy || !machine.queue.length}
                aria-label="下拉拉杆抽取一份内容，也可以按 Enter 或空格"
                onPointerDown={(event) => {
                  if (event.button !== 0 || busyRef.current) return;
                  suppressClick.current = false;
                  dragRef.current = {
                    pointerId: event.pointerId,
                    startY: event.clientY,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (dragRef.current?.pointerId === event.pointerId) setPull(clamp((event.clientY - dragRef.current.startY) / 70, 0, 1));
                }}
                onPointerUp={(event) => finishDrag(event)}
                onPointerCancel={(event) => finishDrag(event, true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') suppressClick.current = false;
                }}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  draw();
                }}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
              <span className={styles.leverEnd} aria-hidden="true">
                ↓
              </span>
            </div>
          </div>

          <div className={styles.paperFeed}>
            {selected ? (
              <article key={`${selected.id}:${printingKey}`} className={styles.receipt} data-printing={busy} aria-labelledby="machine-receipt-title">
                <div className={styles.receiptMeta}>
                  <span>{selected.label}</span>
                  <span>{String(machine.cursor + 1).padStart(2, '0')}</span>
                </div>
                <h2 id="machine-receipt-title">{selected.title}</h2>
                <p className={styles.documentMeta}>{selected.meta}</p>
                {selected.excerpt && (
                  <p className={styles.excerpt}>
                    {Array.from(selected.excerpt).slice(0, 135).join('')}
                    {Array.from(selected.excerpt).length > 135 ? '…' : ''}
                  </p>
                )}
                <Link className={styles.openDocument} href={selected.href} scroll={false}>
                  打开原文
                  <span aria-hidden="true">↗</span>
                </Link>
                <span className={styles.receiptNote}>原始内容 · 本站阅读</span>
              </article>
            ) : (
              <div className={styles.firstSlip}>
                <span aria-hidden="true">↓</span>
                <p>
                  下一篇，
                  <br />
                  从这里出现。
                </p>
                <small>拉动手柄，或点击下方按钮</small>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.historyControls} role="group" aria-label="回看本轮已经取出的内容">
          <button type="button" className={styles.previous} onClick={() => browseHistory(-1)} disabled={!ready || busy || machine.cursor < 1} aria-label="上一张已取出的内容" title="上一张">
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className={styles.previous}
            onClick={() => browseHistory(1)}
            disabled={!ready || busy || machine.cursor >= machine.history.length - 1}
            aria-label="下一张已取出的内容"
            title="下一张"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        {machine.queue.length || !ready ? (
          <button type="button" className={styles.drawButton} onClick={draw} disabled={!ready || busy}>
            {busy ? '正在出签' : nextDrawLabel}
            <span aria-hidden="true">↓</span>
          </button>
        ) : (
          <button type="button" className={styles.drawButton} onClick={restart} disabled={busy}>
            重新洗牌<span aria-hidden="true">↻</span>
          </button>
        )}
        <span className={styles.remaining}>{ready ? `还剩 ${machine.queue.length} 份` : '正在准备'}</span>
      </div>
      <p className={styles.pageNote}>
        {entries.length} 篇文章 · 原文与配图完整保留
        <Link href="/" scroll={false}>
          返回首页 ↗
        </Link>
      </p>
      <p className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

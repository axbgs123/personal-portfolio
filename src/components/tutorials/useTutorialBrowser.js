import { useEffect, useMemo, useRef, useState } from 'react';
import { filterTutorialEntries, nearestTutorialIndex, nextTutorialIndex } from './catalogNavigation.mjs';

export default function useTutorialBrowser(entries, axis = 'x', storageKey = 'cz-tutorial-collection') {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const filtered = useMemo(() => filterTutorialEntries(entries, query), [entries, query]);
  const index = Math.min(selected, Math.max(0, filtered.length - 1));
  const rail = useRef(null);
  const links = useRef([]);
  const scrollFrame = useRef(0);
  const restoreFrame = useRef(0);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const clearClick = useRef(0);
  const search = useRef(null);
  const renderVersion = useRef(0);
  const version = renderVersion.current;

  useEffect(() => {
    // Return from an original document to its filtered collection, by stable
    // slug rather than index. This is session-only and never sent to a server.
    try {
      const saved = JSON.parse(window.sessionStorage?.getItem(storageKey) || 'null');
      if (saved && typeof saved.query === 'string') {
        const restoredEntries = filterTutorialEntries(entries, saved.query);
        const restoredIndex = Math.max(
          0,
          restoredEntries.findIndex((entry) => entry.slug === saved.slug),
        );
        setQuery(saved.query);
        setSelected(restoredIndex);
        restoreFrame.current = requestAnimationFrame(() => {
          const element = links.current[restoredIndex];
          const container = rail.current;
          if (!element || !container) return;
          const value = axis === 'x' ? element.offsetLeft + element.offsetWidth / 2 - container.clientWidth / 2 : element.offsetTop + element.offsetHeight / 2 - container.clientHeight / 2;
          container.scrollTo({ [axis === 'x' ? 'left' : 'top']: value, behavior: 'auto' });
        });
      }
    } catch {
      /* Private browsers may deny storage; navigation still works. */
    }
    return () => {
      cancelAnimationFrame(scrollFrame.current);
      cancelAnimationFrame(restoreFrame.current);
      clearTimeout(clearClick.current);
      if (drag.current?.container) delete drag.current.container.dataset.dragging;
      drag.current = null;
    };
  }, [entries, axis, storageKey]);

  const persist = (nextQuery, entry) => {
    try {
      window.sessionStorage?.setItem(storageKey, JSON.stringify({ query: nextQuery, slug: entry?.slug || null }));
    } catch {
      /* Storage is optional. */
    }
  };

  const select = (next, focus = false) => {
    if (!filtered.length) return;
    const target = Math.max(0, Math.min(filtered.length - 1, next));
    setSelected(target);
    persist(query, filtered[target]);
    cancelAnimationFrame(restoreFrame.current);
    const element = links.current[target];
    const container = rail.current;
    if (!element || !container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const value = axis === 'x' ? element.offsetLeft + element.offsetWidth / 2 - container.clientWidth / 2 : element.offsetTop + element.offsetHeight / 2 - container.clientHeight / 2;
    container.scrollTo({
      [axis === 'x' ? 'left' : 'top']: value,
      behavior: reduced ? 'auto' : 'smooth',
    });
    if (focus) element.focus({ preventScroll: true });
  };

  const filter = (value) => {
    renderVersion.current += 1;
    setQuery(value);
    setSelected(0);
    persist(value, filterTutorialEntries(entries, value)[0]);
    cancelAnimationFrame(scrollFrame.current);
    cancelAnimationFrame(restoreFrame.current);
    if (rail.current) rail.current.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  };

  const focus = (next, event) => {
    // A pointer's focus event must not recenter its link before the ensuing
    // click. Keyboard focus can safely center the item for full visibility.
    if (event.currentTarget.matches?.(':focus-visible')) select(next);
    else {
      setSelected(next);
      persist(query, filtered[next]);
    }
  };

  const key = (event, from = index) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = nextTutorialIndex(from, filtered.length, event.key, axis);
    if (next === null || next < 0) return;
    event.preventDefault();
    select(next, true);
  };

  const onScroll = () => {
    // A scroll event from the previous filtered DOM may arrive immediately
    // after clearing search. It cannot overwrite the newly saved first item.
    if (version !== renderVersion.current) return;
    cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      if (version !== renderVersion.current) return;
      const container = rail.current;
      if (!container) return;
      const scroll = axis === 'x' ? container.scrollLeft : container.scrollTop;
      const size = axis === 'x' ? container.clientWidth : container.clientHeight;
      const next = nearestTutorialIndex(links.current.slice(0, filtered.length), scroll, size, axis);
      setSelected(next);
      persist(query, filtered[next]);
    });
  };

  const finishDrag = (event, cancelled = false) => {
    const state = drag.current;
    const container = state?.container || event.currentTarget;
    const releasedIndex = state?.moved ? nearestTutorialIndex(links.current.slice(0, filtered.length), container.scrollLeft, container.clientWidth, 'x') : null;
    drag.current = null;
    delete container.dataset.dragging;
    if (state && container.hasPointerCapture?.(state.id)) container.releasePointerCapture(state.id);
    if (state?.moved) {
      // With snap restored, align only once to the nearest item at the actual
      // release position; never let native snap fight each pointermove write.
      select(releasedIndex);
    }
    if (state?.moved && !cancelled) {
      suppressClick.current = true;
      clearTimeout(clearClick.current);
      clearClick.current = window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    } else if (cancelled) {
      suppressClick.current = false;
      clearTimeout(clearClick.current);
    }
  };

  // Native touch scrolling stays native. Mouse dragging is optional; a click
  // that did not travel remains a real link, not a two-step selection action.
  const dragProps =
    axis === 'x'
      ? {
          onDragStartCapture: (event) => {
            // Native image/link dragging issues pointercancel and otherwise
            // steals this gesture after its first move. Keep ordinary clicks.
            event.preventDefault();
          },
          onPointerDown: (event) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return;
            suppressClick.current = false;
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              left: event.currentTarget.scrollLeft,
              container: event.currentTarget,
              moved: false,
            };
          },
          onPointerMove: (event) => {
            const state = drag.current;
            if (!state || event.pointerId !== state.id) return;
            if (event.buttons === 0) {
              finishDrag(event, true);
              return;
            }
            const distance = event.clientX - state.x;
            if (!state.moved && Math.abs(distance) < 6) return;
            if (!state.moved) {
              event.currentTarget.dataset.dragging = 'true';
              // Cancel any previous smooth keyboard/selection scroll before
              // handing the rail position directly to the pointer.
              event.currentTarget.scrollTo({ left: event.currentTarget.scrollLeft, behavior: 'auto' });
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }
            state.moved = true;
            event.preventDefault();
            event.currentTarget.scrollLeft = state.left - distance;
          },
          onPointerUp: (event) => finishDrag(event),
          onPointerCancel: (event) => finishDrag(event, true),
          onPointerLeave: (event) => {
            if (drag.current && !drag.current.moved) finishDrag(event, true);
          },
          onClickCapture: (event) => {
            if (!suppressClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          },
        }
      : {};

  return {
    query,
    filter,
    filtered,
    index,
    active: filtered[index],
    select,
    focus,
    key,
    rail,
    links,
    search,
    onScroll,
    dragProps,
    clear: () => {
      filter('');
      search.current?.focus();
    },
  };
}

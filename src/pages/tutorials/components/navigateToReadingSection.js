import Router from 'next/router';
import { useStore } from '@src/store';
import getSectionScrollTop from './getSectionScrollTop';

// Keep real fragment URLs in Next's history, so Back restores a reading
// position rather than merely returning to the top of the previous chapter.
export default function navigateToReadingSection(event, id) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  event.preventDefault();
  const sidebar = event.currentTarget.closest('aside');
  const fallback = () => {
    const top = getSectionScrollTop(target, sidebar);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { lenis } = useStore.getState();
    if (lenis) lenis.scrollTo(top, { immediate: reduced, duration: 0.9, force: true });
    else {
      const main = document.querySelector('main');
      if (main) main.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
      else target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
    }
  };
  const href = `${Router.asPath.split('#')[0]}#${encodeURIComponent(id)}`;
  if (Router.isReady && href !== Router.asPath) Router.push(href, undefined, { shallow: true, scroll: false }).catch(fallback);
  else fallback();
  return true;
}

import getSectionScrollOffset from './getSectionScrollOffset';

export default function getSectionScrollTop(target, sidebar) {
  const main = document.querySelector('main');
  // Give Lenis a number: element targets also subtract CSS scroll-margin,
  // which otherwise doubles our responsive header + sticky directory offset.
  return Math.max(0, (main?.scrollTop || window.scrollY) + target.getBoundingClientRect().top - (main?.getBoundingClientRect().top || 0) + getSectionScrollOffset(sidebar));
}

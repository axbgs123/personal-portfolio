export default function getSectionScrollOffset(sidebar) {
  const headerHeight = Number.parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--portfolio-header-height')) || 92;
  if (!sidebar) return -(headerHeight + 16);

  const sidebarStyle = window.getComputedStyle(sidebar);
  const computedTop = Number.parseFloat(sidebarStyle.top);
  const stickyTop = Number.isFinite(computedTop) ? computedTop : headerHeight + 16;
  const hasOverlayDirectory = window.matchMedia('(max-width: 812px)').matches;
  const directoryHeight = hasOverlayDirectory && sidebarStyle.position === 'sticky' ? sidebar.getBoundingClientRect().height + 16 : 0;
  return -(stickyTop + directoryHeight);
}

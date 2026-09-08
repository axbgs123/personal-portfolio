export function filterTutorialEntries(entries, query = '') {
  const needle = query.trim().toLocaleLowerCase();
  return entries.filter((entry) => !needle || [entry.title, entry.name, entry.meta, entry.desc, entry.description, entry.tag].filter(Boolean).join(' ').toLocaleLowerCase().includes(needle));
}

export function nextTutorialIndex(index, count, key, axis = 'x') {
  if (!count) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const previous = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
  const next = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
  if (key === previous) return Math.max(0, index - 1);
  if (key === next) return Math.min(count - 1, index + 1);
  return null;
}

export function nearestTutorialIndex(items, scroll, viewport, axis = 'x') {
  const midpoint = scroll + viewport / 2;
  let index = 0;
  let distance = Infinity;
  items.forEach((item, candidate) => {
    if (!item) return;
    const center = axis === 'x' ? item.offsetLeft + item.offsetWidth / 2 : item.offsetTop + item.offsetHeight / 2;
    if (Math.abs(center - midpoint) < distance) {
      index = candidate;
      distance = Math.abs(center - midpoint);
    }
  });
  return index;
}

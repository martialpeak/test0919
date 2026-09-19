import React from 'react';

/**
 * Progressive rendering for long lists — infinite scroll with NO page numbers.
 *
 * Rendering thousands of movie cards at once freezes the browser (5000 cards means 5000
 * <img> elements). This hook keeps the rendered slice bounded and grows it as the user
 * reaches the bottom, so the list still *feels* endless.
 *
 * Usage:
 *   const { visible, sentinelRef, hasMore } = useProgressiveList(filteredMovies);
 *   {visible.map(...)}
 *   {hasMore && <div ref={sentinelRef} />}
 *
 * The count is persisted to sessionStorage together with the list length. Returning from
 * the detail screen remounts HomeScreen with the SAME list (same length) — the saved
 * count is restored so the user lands where they were. Any list whose length differs
 * (filter/search/sort change) starts from the top again.
 */
const RESTORE_KEY = 'mb_progressive_count';

function readSaved(): { len: number; count: number } | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.len === 'number' && typeof o.count === 'number') return o;
  } catch { /* ignore */ }
  return null;
}

export function saveProgressiveCount(count: number, len: number): void {
  try { sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ len, count })); } catch { /* ignore */ }
}

function isRestorable(saved: { len: number; count: number } | null, itemsLen: number, initialCount: number): saved is { len: number; count: number } {
  return !!saved && saved.len === itemsLen && saved.count > initialCount && saved.count <= itemsLen;
}

export function useProgressiveList<T>(
  items: T[],
  initialCount = 60,
  step = 60
): { visible: T[]; sentinelRef: React.RefObject<HTMLDivElement>; hasMore: boolean; shownCount: number } {
  const [count, setCount] = React.useState(() => {
    const saved = readSaved();
    if (isRestorable(saved, items.length, initialCount)) return saved.count;
    return initialCount;
  });
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // A new filtered set (different length) means a new list — start over from the top.
  // The same-length case is a remount (back from detail): restore the grown count.
  React.useEffect(() => {
    const saved = readSaved();
    setCount(isRestorable(saved, items.length, initialCount) ? saved.count : initialCount);
  }, [items, initialCount]);

  const hasMore = count < items.length;

  React.useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    // IntersectionObserver is supported everywhere we target; if it is missing, fall back to
    // rendering everything rather than trapping the user with an un-growable list.
    if (typeof IntersectionObserver === 'undefined') {
      setCount(items.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => Math.min(c + step, items.length));
        }
      },
      // Start loading before the sentinel is actually on screen so scrolling stays smooth
      { rootMargin: '600px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, items.length, step]);

  const visible = React.useMemo(() => items.slice(0, count), [items, count]);

  // Persist the grown count so a remount (back from detail) can restore it.
  React.useEffect(() => {
    if (count > initialCount) saveProgressiveCount(count, items.length);
  }, [count, initialCount, items.length]);

  return { visible, sentinelRef, hasMore, shownCount: Math.min(count, items.length) };
}

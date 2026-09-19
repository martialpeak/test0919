/**
 * Movie cache backed by IndexedDB.
 *
 * The old cache was a single `localStorage` key holding `JSON.stringify(movies)`. Browsers cap
 * localStorage at ~5MB per origin, and at ~4.2KB per movie that ceiling is hit around 1200
 * movies — at which point `setItem` throws `QuotaExceededError`. The previous code swallowed
 * that in a `catch` with only a `console.warn`, so the cache silently stopped updating and users
 * kept seeing a stale list. IndexedDB has no such practical limit.
 *
 * localStorage is still written, but only with a small "instant paint" slice, because reading
 * IndexedDB is async and React needs *something* synchronous for the first render.
 */

const DB_NAME = 'moviebrowser';
const DB_VERSION = 1;
const STORE = 'movies';
const LS_BOOT_KEY = 'moviebrowser_movies_boot_v1';

// How many movies go into the synchronous localStorage slice used for the first paint.
// Small enough to stay far below the 5MB quota, large enough to fill the first screens.
const BOOT_SLICE = 120;

// Fields that dominate the payload and are not needed to render a card.
const HEAVY_FIELDS = ['movie_stills', 'scene_images', 'awards', 'crew', 'actor_photos'] as const;

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!isAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'message_id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
  // A failed open must not poison every later call
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

/** Trim the heavy fields so the boot slice stays tiny. */
function lighten<T extends Record<string, any>>(movie: T): T {
  const copy: Record<string, any> = { ...movie };
  for (const f of HEAVY_FIELDS) delete copy[f];
  return copy as T;
}

export const MovieCache = {
  /**
   * Synchronous read for the very first render. Returns the bounded boot slice, or [] when there
   * is nothing cached yet. The full set arrives shortly after via `readAll()`.
   */
  readBootSlice<T = any>(): T[] {
    try {
      const raw = localStorage.getItem(LS_BOOT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Full cached set from IndexedDB. Resolves to [] on any failure — never throws. */
  async readAll<T = any>(): Promise<T[]> {
    try {
      const db = await openDb();
      return await new Promise<T[]>((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as T[]) : []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Replace the whole cache. Writes the full set to IndexedDB and a trimmed slice to
   * localStorage for the next cold start. Resolves even if the write fails.
   */
  async writeAll(movies: any[]): Promise<boolean> {
    // Boot slice first — it is cheap and the most important for perceived speed.
    try {
      const slice = movies.slice(0, BOOT_SLICE).map(lighten);
      localStorage.setItem(LS_BOOT_KEY, JSON.stringify(slice));
    } catch {
      // If even the trimmed slice does not fit, drop it rather than leaving a stale one behind
      try { localStorage.removeItem(LS_BOOT_KEY); } catch { /* ignore */ }
    }

    try {
      const db = await openDb();
      return await new Promise<boolean>((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.clear();
        for (const m of movies) {
          if (m && m.message_id != null) store.put(m);
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /** Drop everything (used by the "clear local data" action). */
  async clear(): Promise<void> {
    try { localStorage.removeItem(LS_BOOT_KEY); } catch { /* ignore */ }
    try {
      const db = await openDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });
    } catch { /* ignore */ }
  },
};

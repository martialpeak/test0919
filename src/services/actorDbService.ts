// Central actor database synced from the server (source of truth).
import { apiFetch } from './apiFetch';
// Replaces the hardcoded VERIFIED_PERSON_PHOTOS / VERIFIED_PERSON_BIOS / KNOWN_EXTENDED_MOVIE_DATA.

export interface ServerActorRecord {
  id?: string;
  name?: string;
  english_name?: string;
  biography?: string;
  bio?: string;
  original_biography?: string;
  job?: string;
  character?: string;
  photo?: string;
  wikipedia_url?: string;
  is_ai?: boolean;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  awards?: any[];
  known_for?: any[];
  aliases?: string[];
  tmdb_id?: number;
}

let actorDb: Record<string, ServerActorRecord> = {};
let loaded = false;
let loadingPromise: Promise<void> | null = null;

function normalizeKey(s?: string): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isActorDbLoaded(): boolean {
  return loaded;
}

// Fetch the full actor DB from the server (once). Safe to call repeatedly.
export async function loadActorDb(force = false): Promise<void> {
  if (loaded && !force) return;
  if (loadingPromise) return loadingPromise;
  
  // Use idle callback / low priority so it never freezes tab transitions
  loadingPromise = new Promise<void>((resolve) => {
    const doFetch = async () => {
      try {
        const res = await apiFetch('/api/actors/all');
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data.actors) {
            actorDb = data.actors || {};
            loaded = true;
          }
        }
      } catch {
        // network error: keep whatever we had
      } finally {
        loadingPromise = null;
        resolve();
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => doFetch(), { timeout: 3000 });
    } else {
      setTimeout(doFetch, 500);
    }
  });

  return loadingPromise;
}

// Look up a record by name or english_name (or alias). Returns normalized record or null.
export function getServerActor(name?: string, englishName?: string): ServerActorRecord | null {
  if (!loaded) return null;
  const candidates = [normalizeKey(englishName), normalizeKey(name)].filter(Boolean);
  for (const c of candidates) {
    if (actorDb[c]) return actorDb[c];
  }
  // partial match fallback
  for (const c of candidates) {
    for (const [key, rec] of Object.entries(actorDb)) {
      if (key.includes(c) || c.includes(key)) return rec;
    }
  }
  return null;
}

export function getServerActorPhoto(name?: string, englishName?: string): string | null {
  const rec = getServerActor(name, englishName);
  if (rec?.photo && !rec.photo.includes('ui-avatars') && !rec.photo.startsWith('data:image/svg')) {
    return rec.photo;
  }
  return null;
}

export function getServerActorBio(name?: string, englishName?: string): ServerActorRecord | null {
  const rec = getServerActor(name, englishName);
  if (rec && (rec.biography || rec.bio)) return rec;
  return null;
}

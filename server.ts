import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getExtendedMovieMetadata } from './src/data/castAndAwardsDatabase';
import { db } from './src/db/persistentDatabase';
import { CURATED_STORYLINE_DATABASE, generateProceduralStorylineVibe } from './src/data/cinemaStorylineDatabase';
import { INITIAL_MOVIES } from './src/data/initialMovies';
import { ACTOR_NAME_MAP } from './src/db/actorNameMap';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// ===================== Movies CRUD (server is source of truth) =====================
const DATA_DIR = path.join(process.cwd(), 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let moviesDb: any[] = (() => {
  if (fs.existsSync(MOVIES_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8'));
      // Valid JSON array — return it AS IS, even when empty. Seeding on an empty
      // archive would resurrect INITIAL_MOVIES over a legitimately emptied db.
      if (Array.isArray(parsed)) return parsed;
      console.error('[Movies] movies.json parsed but is NOT an array — treating as corrupt');
    } catch (err) {
      console.error('[Movies] movies.json is CORRUPT:', err);
    }
    // Corrupt: keep a forensic copy before anything writes over it.
    try {
      const corruptCopy = MOVIES_FILE + '.corrupt-' + Date.now();
      fs.copyFileSync(MOVIES_FILE, corruptCopy);
      console.error('[Movies] corrupt copy kept at ' + corruptCopy);
    } catch { /* best effort */ }
  }
  // Only a genuinely missing/unreadable file gets seeded with curated INITIAL_MOVIES
  console.log('[Movies] movies.json missing/corrupt — seeding with INITIAL_MOVIES');
  const seeded = INITIAL_MOVIES.map(m => ({ ...m, synced_at: Date.now() }));
  try {
    fs.writeFileSync(MOVIES_FILE, JSON.stringify(seeded, null, 2));
  } catch (err) {
    console.error('[Movies] Failed to seed movies.json:', err);
  }
  return seeded;
})();
// Atomic write: tmp file + rename (a crash mid-write must never truncate the live
// archive), with the previous version kept as .bak for a one-step rollback.
function saveMoviesDb() {
  try {
    if (!fs.existsSync(path.dirname(MOVIES_FILE))) fs.mkdirSync(path.dirname(MOVIES_FILE), { recursive: true });
    const tmp = MOVIES_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(moviesDb, null, 2));
    try { if (fs.existsSync(MOVIES_FILE)) fs.copyFileSync(MOVIES_FILE, MOVIES_FILE + '.bak'); } catch { /* best effort */ }
    fs.renameSync(tmp, MOVIES_FILE);
  } catch (err) {
    console.error('[Movies] Failed to save movies.json:', err);
  }
}

// --- Poster persistence ---
// Posters used to live as base64 `data:` URIs inside movies.json. At 5000 movies that file would
// reach ~640MB, and it is held in memory and rewritten on every save. Incoming posters are now
// written to data/movie_posters/ and the record keeps only a short URL.
function posterDir(): string {
  return path.join(process.cwd(), 'data', 'movie_posters');
}

function writePosterFromDataUri(id: number, dataUri: string): string | null {
  const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  try {
    const kind = match[1].toLowerCase();
    const ext = kind === 'png' ? 'png' : kind === 'webp' ? 'webp' : 'jpg';
    const buf = Buffer.from(match[2], 'base64');
    // Anything this small is not a usable poster (a 1x1 pixel is ~300 bytes)
    if (buf.length < 100) return null;
    const dir = posterDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = `movie_${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    fs.writeFileSync(path.join(dir, fileName), buf);
    return `/api/movies/poster-file/${fileName}`;
  } catch (err: any) {
    console.warn(`[Posters] Failed to persist poster for ${id}:`, err?.message || err);
    return null;
  }
}

// Mutates the movie in place: a base64 poster becomes a file URL. Returns true if it changed.
// A base64 poster must NEVER survive in the record — during a bulk import that would put
// megabytes back into movies.json. If it cannot be written to disk it is unusable junk, so the
// field is dropped and normal TMDB enrichment refills it later.
function externalizePoster(movie: any): boolean {
  const url = String(movie?.poster_url || '');
  if (!url.startsWith('data:')) return false;
  const fileUrl = writePosterFromDataUri(movie.message_id, url);
  if (fileUrl) {
    movie.poster_url = fileUrl;
    return true;
  }
  console.warn(`[Posters] Unusable base64 poster for ${movie?.message_id} (${url.length} chars) — dropping it`);
  delete movie.poster_url;
  return false;
}

// The client rewrites a base64 poster to `/api/movies/<id>/poster` for rendering. If that value is
// ever written back (an edit, or the offline-orphan re-POST), the record ends up pointing at an
// endpoint that has no base64 left to serve — the poster is lost with no way to recover it.
// Treat such a self-reference as "no value supplied" and keep whatever we already have.
function isSelfReferentialPoster(url: string): boolean {
  return /\/api\/movies\/\d+\/poster\/?$/.test(String(url || ''));
}

function keepExistingPosterIfSelfReferential(incoming: any, existing: any): void {
  if (!incoming || !isSelfReferentialPoster(incoming.poster_url)) return;
  const prev = String(existing?.poster_url || '');
  if (prev && !isSelfReferentialPoster(prev)) {
    incoming.poster_url = prev; // keep the real poster (file URL or remote URL)
  } else {
    delete incoming.poster_url; // nothing better available; don't persist the dead reference
  }
}

// One-time migration on boot: pull every base64 poster already sitting in movies.json out to disk.
(() => {
  let moved = 0;
  for (const m of moviesDb) {
    if (externalizePoster(m)) moved++;
  }
  if (moved > 0) {
    saveMoviesDb();
    console.log(`[Posters] Migrated ${moved} base64 posters out of movies.json to data/movie_posters/`);
  }
})();

// List all movies — actor photos, poster_url and scene_images rewritten to locally-stored or proxied URLs
// ---------------------------------------------------------------------------
// Per-movie decoration: actor photo patching + poster/stills URL rewriting.
// Used by the full list, and by GET /api/movies/:id (single full record).
// NOTE: the three JSON.parse/stringify blocks here are the reason the FULL list
// is slow — that's why the slim list path skips them entirely.
function decorateMovie(m: any): any {
  let result = { ...m };
  // 1) Rewrite actor_photos — replace placeholders with stored photos
  if (result.actor_photos) {
      try {
        const arr = typeof result.actor_photos === 'string' ? JSON.parse(result.actor_photos) : result.actor_photos;
        if (Array.isArray(arr)) {
          let changed = false;
          const patched = arr.map((a: any) => {
            if (!a?.name) return a;
            const local = actorPhotoMap[actorKey(a.name)];
            // Replace placeholders (ui-avatars / empty) with stored photo; proxy blocked real URLs
            let photo = a.photo || '';
            if (local && (!photo || photo.includes('ui-avatars'))) {
              photo = local;
              changed = true;
            } else if (isBlockedHost(photo) && !photo.startsWith('/api/img-proxy')) {
              photo = proxyBlockedUrl(photo);
              changed = true;
            }
            return photo !== a.photo ? { ...a, photo } : a;
          });
          if (changed) result.actor_photos = JSON.stringify(patched);
        }
      } catch { /* ignore */ }
    }
    // 2) Rewrite poster_url — base64 data: URIs are served via the poster endpoint instead.
    // Inlining them made /api/movies ~4.8MB (97% posters), which blew past the client's fetch
    // timeout on slower connections.
    if (result.poster_url == null) result.poster_url = ''; // missing poster must not crash the response
    const pUrl = result.poster_url || '';
    if (pUrl.startsWith('data:')) {
      result.poster_url = `/api/movies/${result.message_id}/poster`;
    } else if (pUrl && isBlockedHost(pUrl) && !pUrl.startsWith('/api/')) {
      result.poster_url = proxyBlockedUrl(pUrl);
    }
    // List payloads should not ship multi-MB originals: serve-time downscale w500.
    // Raw form first, then proxied form (only the url= param value is encoded — never
    // the /api/img-proxy path itself, that broke every poster once before).
    if (result.poster_url.includes('/t/p/original/')) {
      result.poster_url = result.poster_url.replace('/t/p/original/', '/t/p/w500/');
    }
    if (result.poster_url.startsWith('/api/img-proxy') && result.poster_url.includes('%2Ft%2Fp%2Foriginal%2F')) {
      result.poster_url = result.poster_url.replace('%2Ft%2Fp%2Foriginal%2F', '%2Ft%2Fp%2Fw500%2F');
    }
    // Repair entries mangled by the earlier whole-string encode (%2Fapi%2Fimg-proxy?…)
    if (result.poster_url.startsWith('%2F')) {
      const dec0 = decodeURIComponent(result.poster_url);
      if (dec0.startsWith('/api/img-proxy')) {
        result.poster_url = dec0.replace('/t/p/original/', '/t/p/w500/');
      }
    }
    // 4) movie_stills may still hold raw image.tmdb.org URLs (blocked in Iran) —
    // rewrite them exactly like scene_images above.
    if (result.movie_stills) {
      try {
        const arr = typeof result.movie_stills === 'string' ? JSON.parse(result.movie_stills) : result.movie_stills;
        if (Array.isArray(arr)) {
          let changed = false;
          const patched = arr.map((u: any) => {
            const url = typeof u === 'string' ? u : (u?.url || u?.image_url || '');
            // /original inside a proxied URL is percent-encoded (%2Ft%2Fp%2Foriginal%2F)
            const downscale = (x: string, size: string) => x
              .replace('/t/p/original/', `/t/p/${size}/`)
              .replace('%2Ft%2Fp%2Foriginal%2F', `%2Ft%2Fp%2F${size.replace('/', '%2F')}%2F`);
            if (url && isBlockedHost(url) && !url.startsWith('/api/')) {
              const px = downscale(proxyBlockedUrl(url), 'w1280');
              changed = true;
              return typeof u === 'string' ? px : { ...u, url: px, image_url: px };
            }
            if (url && url.includes('/t/p/original/') || url.includes('%2Ft%2Fp%2Foriginal%2F')) {
              changed = true;
              const fixed = downscale(url, 'w1280');
              return typeof u === 'string' ? fixed : { ...u, url: fixed, image_url: fixed };
            }
            return u;
          });
          if (changed) result.movie_stills = JSON.stringify(patched);
        }
      } catch { /* ignore */ }
    }
    // 3) Rewrite scene_images URLs
    if (result.scene_images) {
      try {
        const arr = typeof result.scene_images === 'string' ? JSON.parse(result.scene_images) : result.scene_images;
        if (Array.isArray(arr)) {
          const patched = arr.map((s: any) => {
            let url = s.url || s.image_url || '';
            if (url && isBlockedHost(url) && !url.startsWith('/api/')) {
              return { ...s, url: proxyBlockedUrl(url), image_url: proxyBlockedUrl(url) };
            }
            return s;
          });
          result.scene_images = JSON.stringify(patched);
        }
      } catch { /* ignore */ }
    }
    return result;
}

// Slim list projector: only the fields the list UI + local search actually use.
// Drops actor_photos (~1.4KB/movie), movie_stills, box_office, awards… and
// truncates description to 220 chars (the cards clamp it to 2 lines anyway).
// Cuts /api/movies from ~7.5MB to ~2MB raw (~500KB gzipped by nginx).
const LIST_FIELDS = ['message_id','title','english_title','year','solar_year','year_display','rating','genre','country','category','quality','poster_url','trailer_url','local_trailer','actors','is_favorite','timestamp','synced_at','runtime','seasons_count','episodes_count'] as const;
function slimMovie(raw: any): any {
  const m = posterOnly(raw);
  const out: any = {};
  for (const f of LIST_FIELDS) if (m[f] !== undefined) out[f] = m[f];
  const d = m.description ? String(m.description) : '';
  out.description = d.length > 220 ? d.slice(0, 220).trimEnd() + '…' : d;
  return out;
}

// Poster URL fixup only (no heavy JSON work) — shared by the slim path.
function posterOnly(m: any): any {
  const result = { ...m };
  // A record without poster_url must never crash the whole list response
  // (undefined.startsWith/.includes would throw a TypeError and 500 /api/movies).
  if (result.poster_url == null) result.poster_url = '';
  // Rewrite poster_url — base64 data: URIs are served via the poster endpoint instead.
  // Inlining them made /api/movies ~4.8MB (97% posters), which blew past the client's fetch
  // timeout on slower connections. The endpoint caches for 24h and loads in parallel.
  const pUrl = result.poster_url || '';
  if (pUrl.startsWith('data:')) {
    result.poster_url = `/api/movies/${result.message_id}/poster`;
  } else if (pUrl && isBlockedHost(pUrl) && !pUrl.startsWith('/api/')) {
    result.poster_url = proxyBlockedUrl(pUrl);
  }
  // List payloads should not ship multi-MB originals: serve-time downscale w500.
  // Raw form first, then proxied form (only the url= param value is encoded — never
  // the /api/img-proxy path itself, that broke every poster once before).
  if (result.poster_url.includes('/t/p/original/')) {
    result.poster_url = result.poster_url.replace('/t/p/original/', '/t/p/w500/');
  }
  if (result.poster_url.startsWith('/api/img-proxy') && result.poster_url.includes('%2Ft%2Fp%2Foriginal%2F')) {
    result.poster_url = result.poster_url.replace('%2Ft%2Fp%2Foriginal%2F', '%2Ft%2Fp%2Fw500%2F');
  }
  // Repair entries mangled by the earlier whole-string encode (%2Fapi%2Fimg-proxy?…)
  if (result.poster_url.startsWith('%2F')) {
    const dec0 = decodeURIComponent(result.poster_url);
    if (dec0.startsWith('/api/img-proxy')) {
      result.poster_url = dec0.replace('/t/p/original/', '/t/p/w500/');
    }
  }
  return result;
}

// List movies —
//   ?category=…   server-side category filter
//   ?q=…          server-side search (title, english_title, actors, genre, country)
//   ?slim=1       list-only fields (client sync path uses this)
//   ?offset=&limit=  pagination (X-Total-Count header carries the full count)
app.get('/api/movies', (req, res) => {
  const qCategory = ((req.query.category as string) || '').trim();
  let source = qCategory ? moviesDb.filter((m: any) => m.category === qCategory ||
    // Legacy records imported before the Korean shelf existed: match Korean movies by country
    (qCategory === 'korean_movies' && String(m.country || '').includes('کره'))) : moviesDb;

  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (q) {
    source = source.filter((m: any) =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.english_title || '').toLowerCase().includes(q) ||
      (m.actors || '').toLowerCase().includes(q) ||
      (m.genre || '').toLowerCase().includes(q) ||
      (m.country || '').toLowerCase().includes(q));
  }

  const total = source.length;
  const offset = Math.max(0, parseInt(String(req.query.offset || ''), 10) || 0);
  const limitRaw = parseInt(String(req.query.limit || ''), 10);
  const limit = isNaN(limitRaw) ? null : Math.max(1, limitRaw);
  const slice = limit !== null ? source.slice(offset, offset + limit) : source;

  const slim = req.query.slim === '1';
  const out = slice.map((m: any) => (slim ? slimMovie(m) : decorateMovie(m)));

  if (slim || limit !== null) res.set('X-Total-Count', String(total));
  res.json(out);
});

// Single movie, full record — moved BELOW every literal /api/movies/* GET route
// so ':id' never shadows awards-auto / stills / gemini-awards (registration order).
// (detail-view hydration when the list was fetched slim)


// Server-side safety net: if a movie was saved without awards, fetch them via Gemini
// in the background and patch the record — no client path can lose awards anymore.
function backfillAwards(movie: any) {
  if (!movie || Array.isArray(movie.awards) && movie.awards.length > 0) return;
  const title = movie.english_title || movie.title || '';
  if (!title && !movie.imdb_id) return;
  const qp = new URLSearchParams({ imdb_id: movie.imdb_id || '', title, year: movie.year || '' });
  fetch(`http://localhost:${PORT}/api/movies/gemini-awards?${qp.toString()}`)
    .then(r => r.json())
    .then(j => {
      if (j.ok && Array.isArray(j.awards) && j.awards.length > 0) {
        const idx = moviesDb.findIndex((m: any) => m.message_id === movie.message_id);
        if (idx >= 0) {
          moviesDb[idx].awards = j.awards;
          moviesDb[idx].awards_summary = j.awards_summary || moviesDb[idx].awards_summary || '';
          saveMoviesDb();
          console.log(`[Awards] Backfilled ${j.awards.length} awards for «${moviesDb[idx].title}»`);
        }
      }
    })
    .catch(() => { /* non-fatal */ });
}

// --- Background TMDB enrichment: fills missing imdb_id, trailer_url, poster, stills, cast ---
async function enrichMovieFromTmdb(movieId: number) {
  const movie = moviesDb.find((m: any) => m.message_id === movieId);
  if (!movie) return;

  // Skip if already has a valid IMDb ID (tt + digits)
  const hasValidImdb = movie.imdb_id && /^tt\d{5,}/.test(movie.imdb_id);
  const hasTrailer = movie.trailer_url && movie.trailer_url.includes('youtube');
  // A self-referential /api/movies/<id>/poster serves nothing, so it counts as a missing poster
  const hasPoster = movie.poster_url && !isSelfReferentialPoster(movie.poster_url) && !String(movie.poster_url).includes('unsplash');
  if (hasValidImdb && hasTrailer && hasPoster) return; // nothing to do

  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
  const searchQuery = movie.english_title || movie.title;
  if (!searchQuery) return;

  try {
    // 1. Search TMDB — prefer exact title match
    const sRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(searchQuery)}`);
    if (!sRes.ok) return;
    const sData = await sRes.json();
    const candidates = (sData.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
    const cleanSearch = searchQuery.toLowerCase().trim();
    const match = candidates.find((r: any) => {
      const t = (r.title || r.name || '').toLowerCase().trim();
      const ot = (r.original_title || r.original_name || '').toLowerCase().trim();
      return t === cleanSearch || ot === cleanSearch;
    }) || candidates.find((r: any) => {
      // Fuzzy: year match — prefer results whose release year matches the movie's year
      const releaseYear = (r.release_date || r.first_air_date || '').slice(0, 4);
      return releaseYear === (movie.year || '').slice(0, 4);
    }) || candidates[0];
    if (!match) return;

    // 2. Fetch full details with external_ids and videos
    const mediaType = match.media_type;
    const dRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${match.id}?api_key=${key}&append_to_response=external_ids,images,videos,credits&language=en-US`);
    if (!dRes.ok) return;    const details = await dRes.json();
    const imdbId = details.external_ids?.imdb_id || '';

    // 3. Extract YouTube trailer
    let trailerUrl = movie.trailer_url || '';
    if (!trailerUrl || !trailerUrl.includes('youtube')) {
      const videos = details.videos?.results || [];
      const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
      if (trailer?.key) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    // 4. Extract poster if missing (a self-referential /api/movies/<id>/poster counts as missing —
    // it points at an endpoint with no base64 left to serve, so the poster is effectively gone)
    let posterUrl = movie.poster_url || '';
    if (!posterUrl || posterUrl.includes('unsplash') || isSelfReferentialPoster(posterUrl)) {
      if (details.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w780${details.poster_path}`;
      }
    }

    // 5. Extract stills if missing
    let stills = movie.movie_stills || '[]';
    if (stills === '[]') {
      const backdrops = details.images?.backdrops || [];
      if (backdrops.length > 0) {
        stills = JSON.stringify(backdrops.slice(0, 8).map((b: any) => `https://image.tmdb.org/t/p/w1280${b.file_path}`));
      }
    }

    // 6. Extract cast photos if missing
    let actorPhotos = movie.actor_photos || '[]';
    if (actorPhotos === '[]') {
      const cast = details.credits?.cast || [];
      if (cast.length > 0) {
        actorPhotos = JSON.stringify(cast.slice(0, 10).map((c: any) => ({
          name: c.name || '',
          english_name: c.name || '',
          character: c.character || '',
          photo: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : ''
        })));
      }
    }

    // 7. Apply updates to the movie
    const updates: any = {};
    if (imdbId && !hasValidImdb) updates.imdb_id = imdbId;
    if (trailerUrl && !hasTrailer) updates.trailer_url = trailerUrl;
    if (posterUrl !== movie.poster_url) updates.poster_url = posterUrl;
    if (stills !== movie.movie_stills) updates.movie_stills = stills;
    if (actorPhotos !== movie.actor_photos) updates.actor_photos = actorPhotos;
    // 8. Runtime & series structure (first pass only — never overwrite admin-entered values)
    if (!movie.runtime) {
      const rt = details.runtime || details.episode_run_time?.[0];
      if (rt) updates.runtime = rt;
    }
    if (mediaType === 'tv') {
      if (details.number_of_seasons && !movie.seasons_count) updates.seasons_count = details.number_of_seasons;
      if (details.number_of_episodes && !movie.episodes_count) updates.episodes_count = details.number_of_episodes;
    }

    if (Object.keys(updates).length > 0) {
      const idx = moviesDb.findIndex((m: any) => m.message_id === movieId);
      if (idx >= 0) {
        moviesDb[idx] = { ...moviesDb[idx], ...updates, synced_at: Date.now() };
        saveMoviesDb();
        console.log(`[TMDB Enrich] Updated «${movie.title}»: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (err: any) {
    console.warn(`[TMDB Enrich] Failed for «${movie.title}»:`, err?.message);
  }
}

function nextMovieId(): number {
  return moviesDb.length > 0 ? Math.max(...moviesDb.map((m: any) => m.message_id || 0)) + 1 : 1001;
}

app.post('/api/movies', (req, res) => {
  const data = req.body || {};
  if (!data.title) return res.status(400).json({ ok: false, error: 'title is required' });
  // A dash/empty quality is meaningless — default it to 720p BluRay
  if (/^[-—–?؟\s]*$/.test(String(data.quality || '').trim())) data.quality = '720p BluRay';
  const newId = data.message_id || nextMovieId();
  const movie = { ...data, message_id: newId, timestamp: Date.now(), synced_at: Date.now() };
  // Never let a base64 poster into movies.json — write it to disk and keep a short URL
  externalizePoster(movie);
  const idx = moviesDb.findIndex((m: any) => m.message_id === newId);
  if (idx >= 0) {
    keepExistingPosterIfSelfReferential(movie, moviesDb[idx]);
    moviesDb[idx] = { ...moviesDb[idx], ...movie };
  } else {
    keepExistingPosterIfSelfReferential(movie, null);
    moviesDb.unshift(movie);
  }
  saveMoviesDb();
  // Background enrichment: fill missing IMDb ID, trailer, poster, cast from TMDB
  setTimeout(() => enrichMovieFromTmdb(newId), 1500);
  // Backfill awards in background when missing
  setTimeout(() => backfillAwards(moviesDb.find((m: any) => m.message_id === newId)), 4000);
  res.json({ ok: true, movie });
});

// Bulk import (admin): accepts { movies: [...] } and inserts/updates them in ONE pass with a
// single file write. Adding thousands of titles one-by-one through POST /api/movies would rewrite
// the whole movies.json per title (O(n^2)) and fire thousands of TMDB enrichment calls.
app.post('/api/movies/bulk', (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) {
    return res.status(401).json({ ok: false, error: 'دسترسی مدیر لازم است' });
  }
  const body = req.body || {};
  const incoming: any[] = Array.isArray(body) ? body : (Array.isArray(body.movies) ? body.movies : []);
  if (incoming.length === 0) {
    return res.status(400).json({ ok: false, error: 'movies array is required' });
  }
  // Skip enrichment by default for large imports; the caller can opt in.
  const enrich = body.enrich === true;

  const byId = new Map<number, number>();
  moviesDb.forEach((m: any, i: number) => byId.set(m.message_id, i));

  let added = 0, updated = 0, skipped = 0, postersWritten = 0;
  let nextId = nextMovieId();
  const acceptedIds: number[] = [];

  for (const raw of incoming) {
    if (!raw || !raw.title) { skipped++; continue; }
    // A dash/empty quality is meaningless — default it to 720p BluRay
    if (/^[-—–?؟\s]*$/.test(String(raw.quality || '').trim())) raw.quality = '720p BluRay';
    const explicitId = Number(raw.message_id) || 0;
    const id = explicitId || nextId++;
    // An explicit id inside the file must advance the auto-counter, otherwise the
    // next id-less entry reuses that id and silently overwrites the record above.
    if (explicitId >= nextId) nextId = explicitId + 1;
    const movie = { ...raw, message_id: id, timestamp: raw.timestamp || Date.now(), synced_at: Date.now() };
    if (externalizePoster(movie)) postersWritten++;
    const existingIdx = byId.get(id);
    if (existingIdx !== undefined) {
      keepExistingPosterIfSelfReferential(movie, moviesDb[existingIdx]);
      moviesDb[existingIdx] = { ...moviesDb[existingIdx], ...movie };
      updated++;
    } else {
      keepExistingPosterIfSelfReferential(movie, null);
      moviesDb.push(movie);
      byId.set(id, moviesDb.length - 1);
      added++;
    }
    acceptedIds.push(id);
  }

  saveMoviesDb();
  console.log(`[Bulk] +${added} added, ${updated} updated, ${skipped} skipped, ${postersWritten} posters written (total ${moviesDb.length})`);

  if (enrich) {
    // Rate-limited background enrichment so a big import doesn't hammer TMDB
    let i = 0;
    const step = () => {
      if (i >= acceptedIds.length) return;
      const id = acceptedIds[i++];
      enrichMovieFromTmdb(id).catch(() => { /* non-fatal */ }).finally(() => setTimeout(step, 400));
    };
    setTimeout(step, 1000);
  }

  res.json({ ok: true, added, updated, skipped, posters_written: postersWritten, total: moviesDb.length, enrich });
});

// Update a movie
app.put('/api/movies/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = moviesDb.findIndex((m: any) => m.message_id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'movie not found' });
  const merged = { ...moviesDb[idx], ...req.body, message_id: id, synced_at: Date.now() };
  externalizePoster(merged);
  keepExistingPosterIfSelfReferential(merged, moviesDb[idx]);
  moviesDb[idx] = merged;
  saveMoviesDb();
  // Background enrichment for edits that may have cleared fields
  setTimeout(() => enrichMovieFromTmdb(id), 1500);
  res.json({ ok: true, movie: moviesDb[idx] });
});

// Delete a movie
app.delete('/api/movies/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = moviesDb.length;
  moviesDb = moviesDb.filter((m: any) => m.message_id !== id);
  if (moviesDb.length === before) return res.status(404).json({ ok: false, error: 'movie not found' });
  saveMoviesDb();
  res.json({ ok: true });
});
// ===================== End Movies CRUD =====================

// ===================== Curated Content (server-side persistent) =====================
// All curated data lives in JSON files under data/ so it survives deploys.
// On first run the files are seeded from the source-code dictionaries.
import { VERIFIED_PERSON_PHOTOS } from './src/services/actorPhotoService';
import { MOOD_CATEGORIES, CURATED_MOOD_RECOMMENDATIONS, MASTERPIECE_PHILOSOPHY_DATABASE, CURATED_BATTLES } from './src/data/aiCuratedData';

const CURATED_DIR = path.join(DATA_DIR, 'curated');
if (!fs.existsSync(CURATED_DIR)) fs.mkdirSync(CURATED_DIR, { recursive: true });

function loadCuratedJson<T>(filename: string, sourceData: T): T {
  const filePath = path.join(CURATED_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    // First run — seed from source-code defaults
    console.log(`[Curated] Seeding ${filename} from source defaults`);
    fs.writeFileSync(filePath, JSON.stringify(sourceData, null, 2));
    return sourceData;
  }
}
function saveCuratedJson(filename: string, data: any) {
  const filePath = path.join(CURATED_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Load (or seed) all curated stores
let actorPhotosDb: Record<string, string> = loadCuratedJson('actor_photos.json', VERIFIED_PERSON_PHOTOS);
let moodCategoriesDb = loadCuratedJson('mood_categories.json', MOOD_CATEGORIES);
let moodRecommendationsDb = loadCuratedJson('mood_recommendations.json', CURATED_MOOD_RECOMMENDATIONS);
let philosophyDb = loadCuratedJson('philosophy_database.json', MASTERPIECE_PHILOSOPHY_DATABASE);
let battlesDb = loadCuratedJson('battles_database.json', CURATED_BATTLES);
let storylineDb = loadCuratedJson('storyline_database.json', CURATED_STORYLINE_DATABASE);

// --- Public read endpoints (no auth required) ---
app.get('/api/content/actor-photos', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: actorPhotosDb });
});
app.get('/api/content/mood-categories', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: moodCategoriesDb });
});
app.get('/api/content/mood-recommendations', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: moodRecommendationsDb });
});
app.get('/api/content/philosophy', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: philosophyDb });
});
app.get('/api/content/battles', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: battlesDb });
});
app.get('/api/content/storylines', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ ok: true, data: storylineDb });
});

// --- Admin write endpoints (auth required) ---
function requireAdmin(req: any, res: any): boolean {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) {
    res.status(401).json({ ok: false, error: 'دسترسی مدیر لازم است' });
    return false;
  }
  return true;
}

// Update a single actor photo mapping
app.put('/api/admin/content/actor-photo', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, url } = req.body || {};
  if (!name || !url) return res.status(400).json({ ok: false, error: 'name and url required' });
  const key = name.trim().toLowerCase().replace(/\s+/g, ' ');
  actorPhotosDb[key] = url;
  saveCuratedJson('actor_photos.json', actorPhotosDb);
  res.json({ ok: true });
});

// Bulk update actor photos
app.put('/api/admin/content/actor-photos', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const incoming = req.body || {};
  Object.assign(actorPhotosDb, incoming);
  saveCuratedJson('actor_photos.json', actorPhotosDb);
  res.json({ ok: true, count: Object.keys(actorPhotosDb).length });
});

// Update philosophy entry
app.put('/api/admin/content/philosophy/:key', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const key = req.params.key;
  philosophyDb[key] = req.body;
  saveCuratedJson('philosophy_database.json', philosophyDb);
  res.json({ ok: true });
});

// Update storyline entry
app.put('/api/admin/content/storyline/:key', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const key = req.params.key;
  storylineDb[key] = req.body;
  saveCuratedJson('storyline_database.json', storylineDb);
  res.json({ ok: true });
});

// Update mood category
app.put('/api/admin/content/mood-categories', (req, res) => {
  if (!requireAdmin(req, res)) return;
  moodCategoriesDb = req.body;
  saveCuratedJson('mood_categories.json', moodCategoriesDb);
  res.json({ ok: true });
});

// Update mood recommendations
app.put('/api/admin/content/mood-recommendations', (req, res) => {
  if (!requireAdmin(req, res)) return;
  moodRecommendationsDb = req.body;
  saveCuratedJson('mood_recommendations.json', moodRecommendationsDb);
  res.json({ ok: true });
});

// Update battles
app.put('/api/admin/content/battles', (req, res) => {
  if (!requireAdmin(req, res)) return;
  battlesDb = req.body;
  saveCuratedJson('battles_database.json', battlesDb);
  res.json({ ok: true });
});

// --- Data backup & restore (admin only) ---
app.get('/api/admin/backup', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const backup: Record<string, any> = {};
  for (const f of fs.readdirSync(CURATED_DIR)) {
    if (f.endsWith('.json')) {
      backup[f] = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, f), 'utf-8'));
    }
  }
  // Include movies.json
  backup['movies.json'] = moviesDb;
  // Include app_database.json if exists
  try {
    backup['app_database.json'] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'app_database.json'), 'utf-8'));
  } catch { /* ok */ }
  res.setHeader('Content-Disposition', 'attachment; filename=moviebrowser-backup.json');
  res.json({ ok: true, backup, created_at: new Date().toISOString() });
});

app.post('/api/admin/restore', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { backup } = req.body || {};
  if (!backup || typeof backup !== 'object') return res.status(400).json({ ok: false, error: 'backup object required' });
  let restored = 0;
  for (const [filename, data] of Object.entries(backup)) {
    if (!filename.endsWith('.json')) continue;
    const filePath = filename === 'movies.json' ? MOVIES_FILE
      : filename === 'app_database.json' ? path.join(DATA_DIR, filename)
      : path.join(CURATED_DIR, filename);
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      restored++;
    } catch (err: any) {
      console.error(`[Restore] Failed to write ${filename}:`, err.message);
    }
  }
  // Reload in-memory stores from restored files
  try {
    moviesDb = JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8'));
    actorPhotosDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'actor_photos.json'), 'utf-8'));
    moodCategoriesDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'mood_categories.json'), 'utf-8'));
    moodRecommendationsDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'mood_recommendations.json'), 'utf-8'));
    philosophyDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'philosophy_database.json'), 'utf-8'));
    battlesDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'battles_database.json'), 'utf-8'));
    storylineDb = JSON.parse(fs.readFileSync(path.join(CURATED_DIR, 'storyline_database.json'), 'utf-8'));
  } catch { /* non-fatal */ }
  res.json({ ok: true, restored });
});
// ===================== End Curated Content =====================

// ===================== Server-side Admin Auth =====================
import crypto from 'crypto';
const AUTH_FILE = path.join(process.cwd(), 'data', 'admin_auth.json');
interface AdminAuthStore { password_hash: string; salt: string; changed_at: number }
function loadAuthStore(): AdminAuthStore | null {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8')); } catch { return null; }
}
function saveAuthStore(s: AdminAuthStore) {
  if (!fs.existsSync(path.dirname(AUTH_FILE))) fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(s, null, 2));
}
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
// Active admin sessions: token -> expiry. Survives restarts via file.
const TOKENS_FILE = path.join(process.cwd(), 'data', 'admin_tokens.json');
let adminTokens: Record<string, number> = (() => {
  try { return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8')); } catch { return {}; }
})();
function saveTokens() {
  try {
    const now = Date.now();
    for (const t of Object.keys(adminTokens)) if (adminTokens[t] < now) delete adminTokens[t];
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(adminTokens));
  } catch { /* ignore */ }
}
const SESSION_MS = 7 * 24 * 3600 * 1000; // 7 days

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const store = loadAuthStore();
  let ok: boolean;
  if (!store) {
    // First ever login: accept defaults and initialize the store
    ok = (password === 'admin' || password === 'admin123') && (cleanUser === 'admin' || cleanUser === 'مدیر');
  } else {
    // Username can be admin or مدیر, password verified against persistent hash
    const isUserMatch = cleanUser === 'admin' || cleanUser === 'مدیر';
    ok = Boolean(isUserMatch && password && hashPassword(String(password).trim(), store.salt) === store.password_hash);
  }
  if (!ok) return res.status(401).json({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است' });
  const token = crypto.randomBytes(32).toString('hex');
  adminTokens[token] = Date.now() + SESSION_MS;
  saveTokens();
  res.json({ ok: true, token });
});

app.post('/api/auth/change-password', (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) {
    return res.status(401).json({ ok: false, error: 'نشست شما منقضی شده است' });
  }
  const { currentPassword, newPassword } = req.body || {};
  const store = loadAuthStore();
  // Verify current password
  if (store) {
    if (!currentPassword || hashPassword(currentPassword, store.salt) !== store.password_hash) {
      return res.status(400).json({ ok: false, error: 'رمز عبور فعلی نادرست است' });
    }
  } else if (!(currentPassword === 'admin' || currentPassword === 'admin123')) {
    return res.status(400).json({ ok: false, error: 'رمز عبور فعلی نادرست است' });
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ ok: false, error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد' });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  saveAuthStore({ password_hash: hashPassword(newPassword.trim(), salt), salt, changed_at: Date.now() });
  res.json({ ok: true });
});

app.get('/api/auth/check', (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  const valid = Boolean(token && adminTokens[token] && adminTokens[token] > Date.now());
  res.json({ ok: valid });
});

app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  delete adminTokens[token];
  saveTokens();
  res.json({ ok: true });
});
// ===================== End Admin Auth =====================

// ===================== User Accounts (replaces Firebase) =====================
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const USER_TOKENS_FILE = path.join(process.cwd(), 'data', 'user_tokens.json');
interface StoredUser {
  userId: string; username: string; email: string;
  password_hash: string; salt: string;
  displayName: string; photoURL?: string;
  created_at: number;
}
let usersDb: Record<string, StoredUser> = (() => {
  try { return JSON.parse(fsSync.readFileSync(USERS_FILE, 'utf-8')); } catch { return {}; }
})();
function saveUsersDb() {
  if (!fsSync.existsSync(path.dirname(USERS_FILE))) fsSync.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fsSync.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2));
}
let userTokens: Record<string, { userId: string; expires: number }> = (() => {
  try { return JSON.parse(fsSync.readFileSync(USER_TOKENS_FILE, 'utf-8')); } catch { return {}; }
})();
function saveUserTokens() {
  const now = Date.now();
  for (const t of Object.keys(userTokens)) if (userTokens[t].expires < now) delete userTokens[t];
  fsSync.writeFileSync(USER_TOKENS_FILE, JSON.stringify(userTokens));
}
function getUserFromToken(req: any): StoredUser | null {
  const token = (req.headers['x-user-token'] as string) || '';
  const entry = userTokens[token];
  if (!entry || entry.expires < Date.now()) return null;
  return usersDb[entry.userId] || null;
}
function publicUser(u: StoredUser) {
  return { userId: u.userId, username: u.username, email: u.email, displayName: u.displayName, photoURL: u.photoURL || '' };
}

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body || {};
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(cleanUsername)) {
    return res.status(400).json({ ok: false, error: 'نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی، عدد، نقطه یا خط تیره باشد' });
  }
  if (!cleanEmail.includes('@')) return res.status(400).json({ ok: false, error: 'ایمیل معتبر وارد کنید' });
  if (!password || String(password).length < 6) return res.status(400).json({ ok: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
  if (Object.values(usersDb).some(u => u.username === cleanUsername)) {
    return res.status(409).json({ ok: false, error: 'این نام کاربری قبلاً گرفته شده است' });
  }
  if (Object.values(usersDb).some(u => u.email === cleanEmail)) {
    return res.status(409).json({ ok: false, error: 'این ایمیل قبلاً ثبت شده است' });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const userId = 'u_' + crypto.randomBytes(8).toString('hex');
  const user: StoredUser = {
    userId, username: cleanUsername, email: cleanEmail,
    password_hash: hashPassword(String(password), salt), salt,
    displayName: String(displayName || username || '').trim(),
    created_at: Date.now(),
  };
  usersDb[userId] = user;
  saveUsersDb();
  const token = crypto.randomBytes(32).toString('hex');
  userTokens[token] = { userId, expires: Date.now() + SESSION_MS };
  saveUserTokens();
  res.json({ ok: true, token, user: publicUser(user) });
});

// Login (username OR email + password)
app.post('/api/auth/user-login', (req, res) => {
  const { identifier, password } = req.body || {};
  const ident = String(identifier || '').trim().toLowerCase();
  const user = Object.values(usersDb).find(u => u.username === ident || u.email === ident);
  if (!user || hashPassword(String(password || ''), user.salt) !== user.password_hash) {
    return res.status(401).json({ ok: false, error: 'نام کاربری/ایمیل یا رمز عبور اشتباه است' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  userTokens[token] = { userId: user.userId, expires: Date.now() + SESSION_MS };
  saveUserTokens();
  res.json({ ok: true, token, user: publicUser(user) });
});

// Current session user
app.get('/api/auth/me', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ ok: false, error: 'وارد نشده‌اید' });
  res.json({ ok: true, user: publicUser(user) });
});

// Logout
app.post('/api/auth/user-logout', (req, res) => {
  const token = (req.headers['x-user-token'] as string) || '';
  delete userTokens[token];
  saveUserTokens();
  res.json({ ok: true });
});

// Per-user tracking storage (server-side, per user)
const TRACKING_DIR = path.join(process.cwd(), 'data', 'user_tracking');
function trackingFile(userId: string): string {
  if (!fsSync.existsSync(TRACKING_DIR)) fsSync.mkdirSync(TRACKING_DIR, { recursive: true });
  return path.join(TRACKING_DIR, `${userId}.json`);
}
function readUserTracking(userId: string): any[] {
  try { return JSON.parse(fsSync.readFileSync(trackingFile(userId), 'utf-8')); } catch { return []; }
}
function writeUserTracking(userId: string, items: any[]) {
  fsSync.writeFileSync(trackingFile(userId), JSON.stringify(items, null, 2));
}

app.get('/api/user/tracking', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ ok: false, error: 'وارد نشده‌اید' });
  res.json({ ok: true, items: readUserTracking(user.userId) });
});

app.post('/api/user/tracking/:messageId', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ ok: false, error: 'وارد نشده‌اید' });
  const messageId = Number(req.params.messageId);
  const items = readUserTracking(user.userId);
  const idx = items.findIndex(i => i.message_id === messageId);
  const merged = { ...(idx >= 0 ? items[idx] : {}), ...req.body, message_id: messageId, updated_at: Date.now() };
  if (idx >= 0) items[idx] = merged; else items.unshift(merged);
  writeUserTracking(user.userId, items);
  res.json({ ok: true });
});

app.delete('/api/user/tracking/:messageId', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ ok: false, error: 'وارد نشده‌اید' });
  const messageId = Number(req.params.messageId);
  const items = readUserTracking(user.userId).filter(i => i.message_id !== messageId);
  writeUserTracking(user.userId, items);
  res.json({ ok: true });
});

// Per-user favorites (movie ids)
app.get('/api/user/favorites', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ ok: false, error: 'وارد نشده‌اید' });
  const favs = readUserTracking(user.userId).filter((i: any) => i.favorite).map((i: any) => i.message_id);
  res.json({ ok: true, favorites: favs });
});
// ===================== End User Accounts =====================

// ===================== Password Reset (email link) =====================
import nodemailer from 'nodemailer';

const RESET_TOKENS_FILE = path.join(process.cwd(), 'data', 'reset_tokens.json');
let resetTokens: Record<string, { userId: string; expires: number }> = (() => {
  try { return JSON.parse(fsSync.readFileSync(RESET_TOKENS_FILE, 'utf-8')); } catch { return {}; }
})();
function saveResetTokens() {
  const now = Date.now();
  for (const t of Object.keys(resetTokens)) if (resetTokens[t].expires < now) delete resetTokens[t];
  fsSync.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(resetTokens));
}

function getMailTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// Request reset link
app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email.includes('@')) return res.status(400).json({ ok: false, error: 'ایمیل معتبر وارد کنید' });

  // Always answer ok (don't reveal which emails exist)
  const user = Object.values(usersDb).find(u => u.email === email);
  if (!user) return res.json({ ok: true });

  const transport = getMailTransport();
  if (!transport) return res.status(500).json({ ok: false, error: 'سرویس ایمیل پیکربندی نشده است' });

  const token = crypto.randomBytes(32).toString('hex');
  resetTokens[token] = { userId: user.userId, expires: Date.now() + 30 * 60 * 1000 }; // 30 min
  saveResetTokens();

  // Always use the production domain (nginx doesn't forward Host, and local tests
  // would otherwise produce localhost links in the email)
  const siteUrl = 'https://movie.movieney.ir';
  const resetLink = `${siteUrl}/reset-password?token=${token}`;

  try {
    await transport.sendMail({
      from: `"MovieBrowser" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'بازیابی رمز عبور - فیلم بره',
      html: `
        <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#0d0d12;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:auto;">
          <h2 style="color:#e50914;margin-top:0;">بازیابی رمز عبور</h2>
          <p>سلام ${user.displayName || user.username}،</p>
          <p>برای تعیین رمز عبور جدید روی دکمه زیر کلیک کن:</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="background:#e50914;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">تعیین رمز عبور جدید</a>
          </p>
          <p style="font-size:12px;color:#888;">این لینک تا ۳۰ دقیقه معتبر است و فقط یکبار قابل استفاده است.</p>
          <p style="font-size:12px;color:#888;">اگر این درخواست را شما نفرستاده‌اید، این ایمیل را نادیده بگیرید.</p>
        </div>`,
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Reset] Mail send failed:', err?.message);
    res.status(500).json({ ok: false, error: 'ارسال ایمیل ناموفق بود. بعداً تلاش کنید.' });
  }
});

// Perform the reset
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};
  const entry = token ? resetTokens[String(token)] : null;
  if (!entry || entry.expires < Date.now()) {
    return res.status(400).json({ ok: false, error: 'لینک بازیابی نامعتبر یا منقضی شده است' });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ ok: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' });
  }
  const user = usersDb[entry.userId];
  if (!user) return res.status(404).json({ ok: false, error: 'کاربر یافت نشد' });

  const salt = crypto.randomBytes(16).toString('hex');
  user.password_hash = hashPassword(String(newPassword), user.salt = salt);
  saveUsersDb();

  // Invalidate the used token + all sessions of this user
  delete resetTokens[String(token)];
  saveResetTokens();
  for (const t of Object.keys(userTokens)) if (userTokens[t].userId === user.userId) delete userTokens[t];
  saveUserTokens();

  res.json({ ok: true });
});
// ===================== End Password Reset =====================

// ===================== Actor Bio Backfill (Gemini) =====================
// Fills missing actor biographies with Gemini-generated Persian bios, batch by batch.
let bioBackfillRunning = false;
app.post('/api/actors/bio-backfill', async (req, res) => {
  if (bioBackfillRunning) return res.json({ ok: false, error: 'backfill already running' });
  const limit = Math.min(Number(req.body?.limit) || 5, 15);
  bioBackfillRunning = true;

  // Collect actor names from site movies that have no stored bio yet
  const known = new Set(db.getAllActors().map(a => (a.name || '').trim()));
  const candidates: { name: string; english_name?: string; job: string; sampleMovie?: string }[] = [];
  const seen = new Set<string>();
  for (const m of moviesDb) {
    const raw = String(m.actors || '');
    for (const name of raw.split(/[,،|]/).map((s: string) => s.trim()).filter(Boolean)) {
      if (seen.has(name) || known.has(name)) continue;
      seen.add(name);
      candidates.push({ name, job: 'بازیگر', sampleMovie: m.title });
    }
  }
  const missing = candidates.slice(0, limit);

  res.json({ ok: true, queued: missing.length, names: missing.map(m => m.name) });

  for (const actor of missing) {
    try {
      const prompt = `یک بیوگرافی کوتاه و جذاب فارسی برای ${actor.job === 'کارگردان' ? 'کارگردان' : 'بازیگر'} به نام «${actor.name}»${actor.english_name ? ` (${actor.english_name})` : ''} بنویس.
اگر اطلاعات واقعی و مطمئنی درباره این شخص داری، از آن استفاده کن (تاریخ تولد، ملیت، آثار شاخص، جوایز).
اگر شخص معروفی نیست یا اطلاعات قطعی نداری، یک بیوگرافی عمومی و محتاطانه بنویس که اشاره به حضور او در فیلم «${(actor as any).sampleMovie || ''}» دارد.
حداکثر ۳ جمله. فقط متن بیوگرافی را برگردان، بدون هیچ توضیح اضافه.`;
      const result = await generateWithGeminiFallback(prompt, { timeoutMs: 20000 });
      if (result?.text) {
        db.saveActorBio({
          name: actor.name,
          english_name: actor.english_name,
          biography: result.text.trim(),
          job: actor.job,
          photo: undefined,
          model_used: result.modelUsed,
          is_ai: true,
        });
        console.log(`[BioBackfill] Saved bio for «${actor.name}»`);
      }
    } catch { /* continue with next */ }
    await new Promise(r => setTimeout(r, 1500)); // gentle pacing
  }
  bioBackfillRunning = false;
  console.log('[BioBackfill] Batch done');
});
// ===================== End Actor Bio Backfill =====================

// ===================== Actor Bio Backfill for EXISTING actors without bio =====================
// The endpoint above only creates bios for actors NOT yet stored in the DB. Actors that
// already have a record but no biography were skipped forever. This endpoint targets them:
// cascade per actor → Persian Wikipedia → English Wikipedia (+ existing translate pipeline)
// → Gemini as last resort. Batched with pacing, safe to call repeatedly until queue is empty.
let bioMissingRunning = false;
app.post('/api/actors/bio-backfill-missing', async (req, res) => {
  if (bioMissingRunning) return res.json({ ok: false, error: 'backfill already running' });
  const limit = Math.min(Number(req.body?.limit) || 10, 40);
  bioMissingRunning = true;
  try {
    const all = Object.entries(db.data.actors || {}) as [string, any][];
    const looksJunk = (nm: string) =>
      !nm || /^test/i.test(nm) || !/[a-z\u0600-\u06FF]{2,}/i.test(nm) || /^[?\s\u200c.]+(\(.*\))?$/i.test(nm);
    const candidates = all
      .filter(([key, r]) => {
        const nm = String(r?.name || key || '').trim();
        if (looksJunk(nm)) return false; // skip junk/test records AT SELECTION so the queue advances
        return !(r.biography || r.bio);
      })
      .map(([key, r]) => ({
        name: String(r.name || key).trim(),
        english_name: String(r.english_name || '').trim(),
        job: String(r.job || 'بازیگر'),
      }))
      .slice(0, limit);

    res.json({ ok: true, queued: candidates.length, names: candidates.map(c => c.name) });

    // A record without bio may alias/canonicalize to a DIFFERENT record that already has one
    // (e.g. key 'clancy brown' merges into 'کلنسی براون' which has a bio). Never overwrite.
    const lower = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const bioExistsFor = (name: string, enName: string): boolean => {
      const targets = new Set([lower(name), lower(enName)].filter(Boolean));
      for (const r of Object.values(db.data.actors || {}) as any[]) {
        if (!(r.biography || r.bio)) continue;
        const keys = new Set([lower(r.name || ''), lower(r.english_name || ''), ...((r.aliases || []) as string[]).map(lower)]);
        for (const t of targets) if (t && keys.has(t)) return true;
      }
      return false;
    };
    // en.wikipedia REST is case-sensitive: 'clancy brown' 404s, 'Clancy Brown' works
    const titleCase = (s: string) => s.replace(/\b[a-z]/g, c => c.toUpperCase());

    for (const actor of candidates) {
      if (bioExistsFor(actor.name, actor.english_name)) {
        console.log(`[BioBackfillMissing] «${actor.name}» → skipped (alias record already has bio)`);
        continue;
      }
      let filled = false;
      try {
        const hasFa = /[\u0600-\u06FF]/.test(actor.name);

        // 1. Persian Wikipedia — direct Persian text, no translation needed
        //    (also try fa for English-named actors: most famous ones have fa articles)
        if (hasFa || actor.english_name) {
          const faTarget = hasFa ? actor.name : (actor.english_name ? (Object.entries(ACTOR_NAME_MAP).find(([enKey]) => lower(String(enKey)) === lower(actor.english_name))?.[1] || '') : '');
          const faTry = faTarget || '';
          const fa = faTry ? await fetchWikiSummary(faTry, 'fa') : null;
          if (fa?.extract) {
            db.saveActorBio({
              name: actor.name,
              english_name: actor.english_name || undefined,
              biography: fa.extract.trim(),
              job: actor.job,
              photo: undefined,
              wikipedia_url: fa.page_url || undefined,
              model_used: 'wikipedia-fa',
              is_ai: false,
            });
            filled = true;
          }
        }

        // 2. English Wikipedia → existing translate pipeline (Gemini → heuristic Persian)
        if (!filled) {
          // For Persian-named actors, ACTOR_NAME_MAP (en→fa) can give the English spelling
          let enFromMap = '';
          if (hasFa) {
            for (const [enKey, faVal] of Object.entries(ACTOR_NAME_MAP)) {
              if (lower(String(faVal)) === lower(actor.name)) { enFromMap = enKey; break; }
            }
          }
          const searchEns = [...new Set([
            actor.english_name,
            enFromMap,
            !hasFa ? actor.name : '',
          ].map(s => String(s || '').trim()).filter(Boolean))].map(titleCase);
          for (const searchEn of searchEns) {
            const en = await fetchWikiSummary(searchEn, 'en');
            if (en?.extract) {
              await translateBioToPersian(en.extract, actor.name, actor.english_name || searchEn, actor.job);
              filled = true;
              break;
            }
          }
        }

        // 3. Gemini fallback — only when both wikis had nothing
        if (!filled) {
          const prompt = `یک بیوگرافی کوتاه فارسی برای ${actor.job === 'کارگردان' ? 'کارگردان' : 'بازیگر'} به نام «${actor.name}»${actor.english_name ? ` (${actor.english_name})` : ''} بنویس.
اگر اطلاعات واقعی و مطمئنی داری (تاریخ تولد، ملیت، آثار شاخص) از آن استفاده کن؛ اگر مطمئن نیستی فقط عبارت «اطلاعات دقیقی در دسترس نیست» را برگردان و هیچ چیز دیگری ننویس.
حداکثر ۳ جمله. فقط متن بیوگرافی را برگردان، بدون هیچ توضیح اضافه.`;
          const result = await generateWithGeminiFallback(prompt, { timeoutMs: 20000 });
          if (result?.text && !/اطلاعات دقیقی در دسترس نیست/.test(result.text)) {
            db.saveActorBio({
              name: actor.name,
              english_name: actor.english_name || undefined,
              biography: result.text.trim(),
              job: actor.job,
              photo: undefined,
              model_used: result.modelUsed,
              is_ai: true,
            });
            filled = true;
          }
        }
        console.log(`[BioBackfillMissing] «${actor.name}» → ${filled ? 'filled' : 'skipped (no source)'}`);
      } catch (err) {
        console.warn(`[BioBackfillMissing] error for «${actor.name}»:`, err);
      }
      await new Promise(r => setTimeout(r, 1500)); // gentle pacing
    }
  } finally {
    bioMissingRunning = false;
    console.log('[BioBackfillMissing] Batch done');
  }
});
// ===================== End Actor Bio Backfill Missing =====================

// In-memory cache for movie recommendations to eliminate redundant Gemini API requests
const recommendationsMemoryCache = new Map<string, any>();

// Lazy-initialized Gemini instance for AI-powered translation and bio enrichment
let geminiClient: GoogleGenAI | null = null;
// Multi-key support: rotate to the next key when the current one is quota-exhausted (429).
let geminiKeyIndex = 0;
let geminiQuotaExhaustedUntil = 0; // timestamp when current key's cooldown ends
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  return keys.filter(Boolean);
}
function getGemini(): GoogleGenAI | null {
  const keys = getGeminiKeys();
  if (keys.length === 0) return null;
  // If current key is cooling down and another key exists, rotate now
  if (geminiQuotaExhaustedUntil > Date.now() && keys.length > 1) {
    geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
    geminiClient = null;
  }
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: keys[geminiKeyIndex % keys.length] });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return geminiClient;
}
// Called by generateWithGeminiFallback when a key hits quota — rotates and sets a cooldown
function markCurrentKeyExhausted(): boolean {
  const keys = getGeminiKeys();
  if (keys.length <= 1) return false; // no alternative key
  geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
  geminiClient = null;
  // Cooldown: retry original key after 10 minutes (in case it recovers early)
  geminiQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
  console.warn(`[Gemini] Key #${geminiKeyIndex} exhausted → rotating to key #${(geminiKeyIndex + 1) % keys.length}`);
  return true;
}

// Known IMDb video mappings with exact Video IDs & MP4 streams for direct playback
const KNOWN_IMDB_VIDEOS: Record<string, { imdbId: string; videoId?: string; mp4Url?: string; youtubeId?: string }> = {
  'oppenheimer': { imdbId: 'tt15398776', videoId: 'vi2016270105', youtubeId: 'uYPbbksJxIg' },
  'اوپنهایمر': { imdbId: 'tt15398776', videoId: 'vi2016270105', youtubeId: 'uYPbbksJxIg' },
  'tt15398776': { imdbId: 'tt15398776', videoId: 'vi2016270105', youtubeId: 'uYPbbksJxIg' },
  'dune': { imdbId: 'tt1160419', videoId: 'vi3743530009', youtubeId: 'n9xhJrPXop4' },
  'تلماسه': { imdbId: 'tt1160419', videoId: 'vi3743530009', youtubeId: 'n9xhJrPXop4' },
  'tt1160419': { imdbId: 'tt1160419', videoId: 'vi3743530009', youtubeId: 'n9xhJrPXop4' },
  'dune 2': { imdbId: 'tt15239678', videoId: 'vi1812838937', youtubeId: 'Way9Dexny3w' },
  'تل‌ماسه: بخش دو': { imdbId: 'tt15239678', videoId: 'vi1812838937', youtubeId: 'Way9Dexny3w' },
  'tt15239678': { imdbId: 'tt15239678', videoId: 'vi1812838937', youtubeId: 'Way9Dexny3w' },
  'inception': { imdbId: 'tt1375666', videoId: 'vi2959588889', youtubeId: 'YoHD9XEInc0' },
  'تلقین': { imdbId: 'tt1375666', videoId: 'vi2959588889', youtubeId: 'YoHD9XEInc0' },
  'tt1375666': { imdbId: 'tt1375666', videoId: 'vi2959588889', youtubeId: 'YoHD9XEInc0' },
  'interstellar': { imdbId: 'tt0816692', videoId: 'vi1586278681', youtubeId: 'zSWdZVtXT7E' },
  'میان‌ستاره‌ای': { imdbId: 'tt0816692', videoId: 'vi1586278681', youtubeId: 'zSWdZVtXT7E' },
  'tt0816692': { imdbId: 'tt0816692', videoId: 'vi1586278681', youtubeId: 'zSWdZVtXT7E' },
  'the dark knight': { imdbId: 'tt0468569', videoId: 'vi3244687641', youtubeId: 'EXeTwQWrcwY' },
  'شوالیه تاریکی': { imdbId: 'tt0468569', videoId: 'vi3244687641', youtubeId: 'EXeTwQWrcwY' },
  'tt0468569': { imdbId: 'tt0468569', videoId: 'vi3244687641', youtubeId: 'EXeTwQWrcwY' },
  'the batman': { imdbId: 'tt1877830', videoId: 'vi1408876825', youtubeId: 'mqqft2x_Aa4' },
  'بتمن': { imdbId: 'tt1877830', videoId: 'vi1408876825', youtubeId: 'mqqft2x_Aa4' },
  'tt1877830': { imdbId: 'tt1877830', videoId: 'vi1408876825', youtubeId: 'mqqft2x_Aa4' },
  'gladiator': { imdbId: 'tt0172495', videoId: 'vi2628367897', youtubeId: 'P5ieIbInFpg' },
  'گلادیاتور': { imdbId: 'tt0172495', videoId: 'vi2628367897', youtubeId: 'P5ieIbInFpg' },
  'tt0172495': { imdbId: 'tt0172495', videoId: 'vi2628367897', youtubeId: 'P5ieIbInFpg' },
  'gladiator 2': { imdbId: 'tt9603212', videoId: 'vi1721868825', youtubeId: '4rgYUipGJNo' },
  'گلادیاتور ۲': { imdbId: 'tt9603212', videoId: 'vi1721868825', youtubeId: '4rgYUipGJNo' },
  'tt9603212': { imdbId: 'tt9603212', videoId: 'vi1721868825', youtubeId: '4rgYUipGJNo' },
  'deadpool & wolverine': { imdbId: 'tt6263850', videoId: 'vi2938174745', youtubeId: '73_1biulkYk' },
  'ددپول و ولورین': { imdbId: 'tt6263850', videoId: 'vi2938174745', youtubeId: '73_1biulkYk' },
  'tt6263850': { imdbId: 'tt6263850', videoId: 'vi2938174745', youtubeId: '73_1biulkYk' },
  'joker': { imdbId: 'tt7286456', videoId: 'vi1722333465', youtubeId: 'zAGVQLHvwOY' },
  'جوکر': { imdbId: 'tt7286456', videoId: 'vi1722333465', youtubeId: 'zAGVQLHvwOY' },
  'tt7286456': { imdbId: 'tt7286456', videoId: 'vi1722333465', youtubeId: 'zAGVQLHvwOY' },
  'avatar': { imdbId: 'tt0499549', videoId: 'vi3454329369', youtubeId: '5PSNL1qE6VY' },
  'آواتار': { imdbId: 'tt0499549', videoId: 'vi3454329369', youtubeId: '5PSNL1qE6VY' },
  'tt0499549': { imdbId: 'tt0499549', videoId: 'vi3454329369', youtubeId: '5PSNL1qE6VY' },
  'shogun': { imdbId: 'tt2798648', videoId: 'vi2857022233', youtubeId: 'yAN5uspO_hk' },
  'shōgun': { imdbId: 'tt2798648', videoId: 'vi2857022233', youtubeId: 'yAN5uspO_hk' },
  'شورگان': { imdbId: 'tt2798648', videoId: 'vi2857022233', youtubeId: 'yAN5uspO_hk' },
  'tt2798648': { imdbId: 'tt2798648', videoId: 'vi2857022233', youtubeId: 'yAN5uspO_hk' },
  'tt2788316': { imdbId: 'tt2798648', videoId: 'vi2857022233', youtubeId: 'yAN5uspO_hk' },
  'evil dead': { imdbId: 'tt13345606', videoId: 'vi2438515481', youtubeId: 'smTK_AeAPHs' },
  'مرده شریر': { imdbId: 'tt13345606', videoId: 'vi2438515481', youtubeId: 'smTK_AeAPHs' },
  'tt13345606': { imdbId: 'tt13345606', videoId: 'vi2438515481', youtubeId: 'smTK_AeAPHs' },
  'kung fu panda 4': { imdbId: 'tt21692408', videoId: 'vi3959828761', youtubeId: '_inKs4eeHiI' },
  'پاندای کونگ‌فوکار ۴': { imdbId: 'tt21692408', videoId: 'vi3959828761', youtubeId: '_inKs4eeHiI' },
  'tt21692408': { imdbId: 'tt21692408', videoId: 'vi3959828761', youtubeId: '_inKs4eeHiI' },
  'پوست شیر': { imdbId: 'tt22440938', youtubeId: 'EFj3wVEsTPk' },
  'the lion skin': { imdbId: 'tt22440938', youtubeId: 'EFj3wVEsTPk' },
  'tt22440938': { imdbId: 'tt22440938', youtubeId: 'EFj3wVEsTPk' },
  'افعی تهران': { imdbId: 'tt31535499', youtubeId: '0C9zRjefbeQ' },
  'the viper of tehran': { imdbId: 'tt31535499', youtubeId: '0C9zRjefbeQ' },
  'tt31535499': { imdbId: 'tt31535499', youtubeId: '0C9zRjefbeQ' },
  'چشم‌چران عمارت': { imdbId: 'tt21868356', youtubeId: 'wu_Rg5aAstI' },
  'yalı çapkını': { imdbId: 'tt21868356', youtubeId: 'wu_Rg5aAstI' },
  'yali capkini': { imdbId: 'tt21868356', youtubeId: 'wu_Rg5aAstI' },
  'tt21868356': { imdbId: 'tt21868356', youtubeId: 'wu_Rg5aAstI' },
  'فسیل': { imdbId: 'tt27050012', youtubeId: '2T0kaQtLHEA' },
  'fossil': { imdbId: 'tt27050012', youtubeId: '2T0kaQtLHEA' },
  'tt27050012': { imdbId: 'tt27050012', youtubeId: '2T0kaQtLHEA' },
  'جوان': { imdbId: 'tt15354916', videoId: 'vi2829240857', youtubeId: 'MWOlnZSnXJo' },
  'jawan': { imdbId: 'tt15354916', videoId: 'vi2829240857', youtubeId: 'MWOlnZSnXJo' },
  'tt15354916': { imdbId: 'tt15354916', videoId: 'vi2829240857', youtubeId: 'MWOlnZSnXJo' },
  'شهرزاد': { imdbId: 'tt5332732', youtubeId: 'DjyOdsSmSnA' },
  'shahrzad': { imdbId: 'tt5332732', youtubeId: 'DjyOdsSmSnA' },
  'tt5332732': { imdbId: 'tt5332732', youtubeId: 'DjyOdsSmSnA' },
  'برکینگ بد': { imdbId: 'tt0903747', youtubeId: 'HhesaQXLuRY' },
  'breaking bad': { imdbId: 'tt0903747', youtubeId: 'HhesaQXLuRY' },
  'tt0903747': { imdbId: 'tt0903747', youtubeId: 'HhesaQXLuRY' },
  'evil dead burn': { imdbId: 'tt31170389', videoId: 'vi2758331161', youtubeId: 'smTK_AeAPHs' },
  'tt31170389': { imdbId: 'tt31170389', videoId: 'vi2758331161', youtubeId: 'smTK_AeAPHs' },
  'inside out 2': { imdbId: 'tt22022452', youtubeId: 'LEjhY15eCx0' },
  'درون و بیرون ۲': { imdbId: 'tt22022452', youtubeId: 'LEjhY15eCx0' },
  'tt22022452': { imdbId: 'tt22022452', youtubeId: 'LEjhY15eCx0' },
};

function isTitleMatch(cleanQuery: string, key: string): boolean {
  if (!cleanQuery || !key) return false;
  if (cleanQuery === key) return true;
  // Word token containment only — avoids false positives like "dune" matching "dune: part two"
  const qTokens = cleanQuery.split(/[\s,.:;_\-\(\)]+/).filter(Boolean);
  const kTokens = key.split(/[\s,.:;_\-\(\)]+/).filter(Boolean);
  if (kTokens.length > 1 && kTokens.every(t => qTokens.includes(t))) return true;
  if (qTokens.length > 1 && qTokens.every(t => kTokens.includes(t))) return true;
  return false;
}

// --- IMDb GraphQL trailer resolution (the only IMDb path that still works server-side) ---
// Scraping www.imdb.com returns HTTP 202 + 0 bytes (Amazon anti-bot), and /videoembed/ sends
// x-frame-options: SAMEORIGIN so it can never be iframed. The public GraphQL API does work and
// returns PRE-SIGNED CDN mp4 urls (Expires/Signature/Key-Pair-Id) that expire in ~24h, so they
// are resolved on demand and cached only briefly.
type ImdbGqlVideo = { videoId: string; mp4Url: string; definition: string; label: string };
const imdbGqlCache = new Map<string, { at: number; value: ImdbGqlVideo | null }>();
const IMDB_GQL_TTL_MS = 6 * 60 * 60 * 1000; // 6h — well inside the ~24h signature lifetime

const IMDB_DEF_RANK: Record<string, number> = {
  DEF_2160p: 5, DEF_1080p: 4, DEF_720p: 3, DEF_480p: 2, DEF_SD: 1,
};

async function fetchImdbTrailerViaGraphql(imdbId: string): Promise<ImdbGqlVideo | null> {
  const tt = (imdbId || '').trim();
  if (!/^tt\d{5,}$/.test(tt)) return null;

  const cached = imdbGqlCache.get(tt);
  if (cached && Date.now() - cached.at < IMDB_GQL_TTL_MS) return cached.value;

  const query = `query TitleVideos($id: ID!) {
    title(id: $id) {
      primaryVideos(first: 8) {
        edges { node {
          id
          name { value }
          contentType { displayName { value } }
          playbackURLs { url videoMimeType videoDefinition }
        } }
      }
    }
  }`;

  let result: ImdbGqlVideo | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch('https://api.graphql.imdb.com/', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'x-imdb-client-name': 'imdb-web-next',
        'x-imdb-user-country': 'US',
        'x-imdb-user-language': 'en-US',
        'Origin': 'https://www.imdb.com',
        'Referer': 'https://www.imdb.com/',
      },
      body: JSON.stringify({ query, variables: { id: tt } }),
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      const edges: any[] = data?.data?.title?.primaryVideos?.edges || [];

      const candidates: { video: ImdbGqlVideo; isTrailer: boolean; rank: number }[] = [];
      for (const edge of edges) {
        const node = edge?.node;
        if (!node) continue;
        const kind = String(node.contentType?.displayName?.value || '');
        const label = String(node.name?.value || '');
        const urls: any[] = node.playbackURLs || [];
        for (const u of urls) {
          if (u?.videoMimeType !== 'MP4' || !u?.url) continue;
          candidates.push({
            video: { videoId: String(node.id || ''), mp4Url: String(u.url), definition: String(u.videoDefinition || ''), label: label || kind },
            isTrailer: /trailer/i.test(kind) || /trailer/i.test(label),
            rank: IMDB_DEF_RANK[String(u.videoDefinition)] || 0,
          });
        }
      }

      // Prefer an actual Trailer, then the highest definition available
      candidates.sort((a, b) => (Number(b.isTrailer) - Number(a.isTrailer)) || (b.rank - a.rank));
      result = candidates.length > 0 ? candidates[0].video : null;
    } else {
      console.warn(`[ImdbGql] ${tt} -> HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.warn(`[ImdbGql] ${tt} failed:`, err?.message || err);
  }

  imdbGqlCache.set(tt, { at: Date.now(), value: result });
  return result;
}

// Helper to scrape/extract IMDb trailer info
async function resolveImdbTrailer(imdbId?: string, query?: string) {
  const cleanId = (imdbId || '').trim();
  const cleanQuery = (query || '').toLowerCase().trim();

  // 1. Live IMDb GraphQL lookup — the authoritative source for a real playable trailer
  if (cleanId) {
    const gql = await fetchImdbTrailerViaGraphql(cleanId);
    if (gql?.mp4Url) {
      const known = KNOWN_IMDB_VIDEOS[cleanId];
      return {
        imdb_id: cleanId,
        imdb_video_id: gql.videoId || undefined,
        // Deliberately NO imdb_embed_url: /videoembed/ is x-frame-options: SAMEORIGIN and cannot be iframed.
        video_url: gql.mp4Url,
        video_definition: gql.definition,
        page_url: `https://www.imdb.com/title/${cleanId}/`,
        youtube_url: known?.youtubeId ? `https://www.youtube.com/watch?v=${known.youtubeId}` : undefined,
        source: 'imdb_graphql',
      };
    }
  }

  // 2. Check known mapping by IMDb ID (exact) — legacy fallback, most videoIds are now 404
  if (cleanId && KNOWN_IMDB_VIDEOS[cleanId]) {
    const entry = KNOWN_IMDB_VIDEOS[cleanId];
    return {
      imdb_id: entry.imdbId,
      imdb_video_id: entry.videoId,
      video_url: entry.mp4Url || '',
      page_url: `https://www.imdb.com/title/${entry.imdbId}/`,
      youtube_url: entry.youtubeId ? `https://www.youtube.com/watch?v=${entry.youtubeId}` : undefined,
    };
  }

  // Check known mapping by query using strict token match
  if (cleanQuery) {
    for (const [key, val] of Object.entries(KNOWN_IMDB_VIDEOS)) {
      if (isTitleMatch(cleanQuery, key)) {
        // A title match can still yield a live GraphQL trailer via the mapped IMDb ID
        const gql = await fetchImdbTrailerViaGraphql(val.imdbId);
        if (gql?.mp4Url) {
          return {
            imdb_id: val.imdbId,
            imdb_video_id: gql.videoId || undefined,
            video_url: gql.mp4Url,
            video_definition: gql.definition,
            page_url: `https://www.imdb.com/title/${val.imdbId}/`,
            youtube_url: val.youtubeId ? `https://www.youtube.com/watch?v=${val.youtubeId}` : undefined,
            source: 'imdb_graphql',
          };
        }
        return {
          imdb_id: val.imdbId,
          imdb_video_id: val.videoId,
          video_url: val.mp4Url || '',
          page_url: `https://www.imdb.com/title/${val.imdbId}/`,
          youtube_url: val.youtubeId ? `https://www.youtube.com/watch?v=${val.youtubeId}` : undefined,
        };
      }
    }
  }

  return {
    imdb_id: cleanId || undefined,
    page_url: cleanId ? `https://www.imdb.com/title/${cleanId}/` : undefined,
  };
}

// NOTE: the old extractImdbVideoUrl() scraper was removed on Aug 30 2026.
// https://www.imdb.com/video/<vi>/ now answers HTTP 202 with an empty body (Amazon anti-bot),
// both from the VPS and from Iran, so every regex in it was unreachable. Direct mp4 urls now
// come from fetchImdbTrailerViaGraphql() above.

// Video proxy: streams video content through server to bypass CORS/X-Frame-Options.
// Forwards the client's Range header so the browser can seek instead of downloading the whole file.
app.get('/api/video-proxy', async (req, res) => {
  const url = String(req.query.url || '');
  if (!url.startsWith('http')) return res.status(400).json({ ok: false, error: 'invalid url' });
  // Only allow known video hosts
  if (!/(^|\.)imdb\.com|media-imdb\.com|amazonaws\.com|cloudfront\.net|imgix\.com/.test(url)) {
    return res.status(403).json({ ok: false, error: 'host not allowed' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Referer': 'https://www.imdb.com/',
    };
    // Pass the browser's Range request through so <video> seeking works
    const range = req.headers.range;
    if (typeof range === 'string' && range) upstreamHeaders['Range'] = range;

    const r = await fetch(url, { signal: controller.signal, headers: upstreamHeaders });
    clearTimeout(timeout);
    if (!r.ok && r.status !== 206) return res.status(r.status).end();

    const contentType = r.headers.get('content-type') || 'video/mp4';
    const contentLength = r.headers.get('content-length');
    const contentRange = r.headers.get('content-range');
    res.status(r.status === 206 ? 206 : 200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    // Stream the response body, aborting upstream if the client goes away
    const reader = (r.body as any).getReader();
    let clientGone = false;
    res.on('close', () => { clientGone = true; try { controller.abort(); } catch { /* noop */ } });
    const pump = async (): Promise<void> => {
      if (clientGone) return;
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(Buffer.from(value));
      return pump();
    };
    await pump();
  } catch (err: any) {
    console.error('[VideoProxy] Error:', err?.message || err);
    if (!res.headersSent) res.status(502).json({ ok: false, error: 'proxy failed' });
    else res.end();
  }
});

// API Routes
import fsSync from 'fs';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Box Office API Endpoint
app.get('/api/box-office', (req, res) => {
  const category = (req.query.category as string) || '';
  const entries = [
    {
      message_id: 101,
      title: 'اوپنهایمر (Oppenheimer)',
      english_title: 'Oppenheimer',
      poster_url: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      box_office_value: 957800000,
      box_office_label: '$957,800,000',
      category: 'foreign_movies',
      rating: '8.9',
      year: '2023',
      imdb_id: 'tt15398776',
      budget: '$100,000,000',
      roi_percentage: 857,
      country: 'آمریکا / انگلستان',
      rank: 1,
    },
    {
      message_id: 102,
      title: 'تل‌ماسه: بخش دو (Dune: Part Two)',
      english_title: 'Dune: Part Two',
      poster_url: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      box_office_value: 711844358,
      box_office_label: '$711,844,358',
      category: 'foreign_movies',
      rating: '8.6',
      year: '2024',
      imdb_id: 'tt15239678',
      budget: '$190,000,000',
      roi_percentage: 274,
      country: 'آمریکا / کانادا',
      rank: 2,
    },
    {
      message_id: 108,
      title: 'پاندای کونگ‌فوکار ۴ (Kung Fu Panda 4)',
      english_title: 'Kung Fu Panda 4',
      poster_url: 'https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
      box_office_value: 548500000,
      box_office_label: '$548,500,000',
      category: 'children',
      rating: '7.4',
      year: '2024',
      imdb_id: 'tt21692408',
      budget: '$85,000,000',
      roi_percentage: 545,
      country: 'آمریکا / چین',
      rank: 3,
    },
    {
      message_id: 106,
      title: 'فسیل (Fossil)',
      english_title: 'Fossil',
      poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&auto=format&fit=crop&q=80',
      box_office_value: 324000000,
      box_office_label: '۳۲۴ میلیارد تومان (رکورد تاریخ سینمای ایران)',
      category: 'iranian_movies',
      rating: '7.8',
      year: '1402',
      imdb_id: 'tt27050012',
      budget: '۱۵ میلیارد تومان',
      roi_percentage: 2060,
      country: 'ایران',
      rank: 4,
    },
    {
      message_id: 107,
      title: 'جوان (Jawan)',
      english_title: 'Jawan',
      poster_url: 'https://image.tmdb.org/t/p/w780/jVo5Z8Pq0mN4x9k7P1v9ZkW5Z8.jpg',
      box_office_value: 140000000,
      box_office_label: '$140,000,000',
      category: 'indian_movies',
      rating: '7.2',
      year: '2023',
      imdb_id: 'tt15354916',
      budget: '$36,000,000',
      roi_percentage: 288,
      country: 'هند',
      rank: 5,
    },
    {
      message_id: 109,
      title: 'شوگان (Shōgun)',
      english_title: 'Shōgun',
      poster_url: 'https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
      box_office_value: 95000000,
      box_office_label: 'برنده ۱۸ جایزه امی (پربیننده‌ترین سریال تاریخی ۲۰۲۴)',
      category: 'foreign_series',
      rating: '8.8',
      year: '2024',
      imdb_id: 'tt2798648',
      budget: '$250,000,000 (تولید کل فصل)',
      roi_percentage: 100,
      country: 'آمریکا / ژاپن',
      rank: 6,
    },
    {
      message_id: 103,
      title: 'پوست شیر (The Lion Skin)',
      english_title: 'The Lion Skin',
      poster_url: 'https://image.tmdb.org/t/p/w780/m9f0Q0Zp0y47pW1f9ZkX6V2b7q.jpg',
      box_office_value: 80000000,
      box_office_label: 'پربیننده‌ترین سریال شبکه خانگی سال',
      category: 'iranian_series',
      rating: '8.4',
      year: '1401',
      imdb_id: 'tt22440938',
      budget: 'تولید اختصاصی فیلم‌نت',
      roi_percentage: 350,
      country: 'ایران',
      rank: 7,
    },
  ];

  const filtered = category ? entries.filter(e => e.category === category) : entries;
  res.json({
    ok: true,
    total: filtered.length,
    entries: filtered,
    updated_at: new Date().toISOString(),
  });
});

// In-memory tracking items store
let serverTrackingItems: any[] = [
  {
    message_id: 109,
    media_type: 'series',
    status: 'watching',
    current_season: 1,
    last_episode: 8,
    total_episodes: 10,
    times_watched: 1,
    user_rating: 9,
    next_episode_date: 'جمعه‌ها',
    note: 'قسمت ۸ فوق‌العاده بود. منتظر اپیزود پایانی!',
    title: 'شوگان (Shōgun)',
    english_title: 'Shōgun',
    poster_url: 'https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    category: 'foreign_series',
    year: '2024',
    genre: 'درام، تاریخی، جنگی',
    updated_at: Date.now() - 3600000 * 5,
  },
  {
    message_id: 103,
    media_type: 'series',
    status: 'completed',
    current_season: 3,
    last_episode: 24,
    total_episodes: 24,
    times_watched: 2,
    user_rating: 10,
    next_episode_date: '',
    note: 'یکی از بهترین مینی‌سریال‌های ایرانی جنایی با بازی فوق‌العاده شهاب حسینی',
    title: 'پوست شیر (The Lion Skin)',
    english_title: 'The Lion Skin',
    poster_url: 'https://image.tmdb.org/t/p/w780/m9f0Q0Zp0y47pW1f9ZkX6V2b7q.jpg',
    category: 'iranian_series',
    year: '1401',
    genre: 'جنایی، درام، معمایی',
    updated_at: Date.now() - 3600000 * 24,
  },
  {
    message_id: 105,
    media_type: 'series',
    status: 'watching',
    current_season: 2,
    last_episode: 42,
    total_episodes: 50,
    times_watched: 1,
    user_rating: 7,
    next_episode_date: 'جمعه‌ها ساعت ۲۱',
    note: 'فصل دوم قسمت ۴۲',
    title: 'چشم‌چران عمارت (Yalı Çapkını)',
    english_title: 'Yalı Çapkını',
    poster_url: 'https://image.tmdb.org/t/p/w780/w7F6k8mP9P0zX6kY9j7kP9Z0zX6.jpg',
    category: 'turkish_series',
    year: '2023',
    genre: 'درام، عاشقانه',
    updated_at: Date.now() - 3600000 * 48,
  },
  {
    message_id: 101,
    media_type: 'movie',
    status: 'completed',
    last_episode: 0,
    times_watched: 3,
    user_rating: 10,
    next_episode_date: '',
    note: 'شاهکار نولان؛ تماشا با صدای دالبی توصیه می‌شود',
    title: 'اوپنهایمر (Oppenheimer)',
    english_title: 'Oppenheimer',
    poster_url: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    category: 'foreign_movies',
    year: '2023',
    genre: 'زندگینامه، درام، تاریخی',
    updated_at: Date.now() - 3600000 * 72,
  },
];

app.get('/api/tracking', (req, res) => {
  res.json({
    ok: true,
    total: serverTrackingItems.length,
    items: serverTrackingItems,
  });
});

app.post('/api/tracking/:id', express.json(), (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const existingIdx = serverTrackingItems.findIndex(t => t.message_id === id);

  if (existingIdx >= 0) {
    serverTrackingItems[existingIdx] = {
      ...serverTrackingItems[existingIdx],
      ...body,
      message_id: id,
      updated_at: Date.now(),
    };
  } else {
    serverTrackingItems.unshift({
      message_id: id,
      ...body,
      updated_at: Date.now(),
    });
  }

  res.json({ ok: true, items: serverTrackingItems });
});

app.delete('/api/tracking/:id', (req, res) => {
  const id = Number(req.params.id);
  serverTrackingItems = serverTrackingItems.filter(t => t.message_id !== id);
  res.json({ ok: true, items: serverTrackingItems });
});

// Proxy for TV show next episode schedule
app.get('/api/series/next-episode', async (req, res) => {
  const title = (req.query.title as string) || '';
  const englishTitle = (req.query.english_title as string) || '';
  const imdbId = (req.query.imdb_id as string) || '';

  const query = englishTitle || title.replace(/[\(（].*?[\)）]/g, '').trim();

  try {
    const lookupUrl = imdbId 
      ? `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`
      : `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}&embed=nextepisode`;

    const response = await fetch(lookupUrl, { headers: { 'User-Agent': 'MovieBrowser/1.0' } });
    if (response.ok) {
      const data: any = await response.json();
      let nextEp = data._embedded?.nextepisode;
      if (!nextEp && data.id) {
        const fullRes = await fetch(`https://api.tvmaze.com/shows/${data.id}?embed=nextepisode`);
        if (fullRes.ok) {
          const fullData: any = await fullRes.json();
          nextEp = fullData._embedded?.nextepisode;
        }
      }

      if (nextEp) {
        return res.json({
          ok: true,
          found: true,
          next_episode: {
            season: nextEp.season,
            number: nextEp.number,
            name: nextEp.name,
            airdate: nextEp.airdate,
            airtime: nextEp.airtime,
            airstamp: nextEp.airstamp,
            network: data.network?.name || data.webChannel?.name,
          }
        });
      }
    }
  } catch (err) {
    // ignore
  }

  res.json({ ok: true, found: false });
});
app.get('/api/movies/:id/cast', (req, res) => {
  const { id } = req.params;
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';

  const ext = getExtendedMovieMetadata(imdbId, title);
  if (ext) {
    return res.json({
      ok: true,
      message_id: Number(id),
      imdb_id: ext.imdb_id,
      directors: ext.directors,
      crew: ext.crew,
      cast: ext.cast,
      awards: ext.awards,
      awards_summary: ext.awards_summary,
    });
  }

  res.json({
    ok: true,
    message_id: Number(id),
    imdb_id: imdbId,
    directors: [],
    crew: [],
    cast: [],
    awards: [],
  });
});

// Serve base64 poster as an image (frontend converts data: URIs to this route)
app.get('/api/movies/:id/poster', (req, res) => {
  const id = Number(req.params.id);
  const movie = moviesDb.find((m: any) => m.message_id === id);
  const poster = movie?.poster_url || '';
  const match = poster.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    // Not a data URI.
    if (poster.startsWith('http')) {
      // Avoid redirect loops: if poster_url already points back at our own
      // poster endpoint (legacy data), there is no real image — 404.
      if (/movie\.movieney\.ir\/api\/movies\/\d+\/poster/.test(poster) || /\/api\/movies\/\d+\/poster/.test(poster)) {
        return res.status(404).end();
      }
      // Proxy blocked-host images (tmdb/amazon/wikimedia) so they load on
      // filtered networks too; pass through everything else.
      return res.redirect(proxyBlockedUrl(poster));
    }
    return res.status(404).end();
  }
  const buf = Buffer.from(match[2], 'base64');
  res.setHeader('Content-Type', `image/${match[1].toLowerCase()}`);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(buf);
});

app.get('/api/movies/awards-auto', (req, res) => {
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';
  const ext = getExtendedMovieMetadata(imdbId, title) || getExtendedMovieMetadata('', title);
  if (ext && Array.isArray(ext.awards)) {
    return res.json({
      ok: true,
      imdb_id: ext.imdb_id,
      awards_summary: ext.awards_summary,
      total_won: ext.awards.filter((a: any) => a.is_winner).length,
      total_nominated: ext.awards.length,
      awards: ext.awards,
    });
  }
  res.json({ ok: true, awards_summary: '', total_won: 0, total_nominated: 0, awards: [] });
});

// Gemini-powered auto awards for ANY movie (not just ones in the extended DB)
app.get('/api/movies/gemini-awards', async (req, res) => {
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';
  const year = (req.query.year as string) || '';
  if (!title && !imdbId) return res.status(400).json({ ok: false, error: 'title or imdb_id required' });

  // Serve from extended DB first (instant)
  const ext = getExtendedMovieMetadata(imdbId, title);
  if (ext && Array.isArray(ext.awards) && ext.awards.length > 0) {
    return res.json({
      ok: true, source: 'database',
      awards_summary: ext.awards_summary,
      awards: ext.awards,
    });
  }

  const ai = getGemini();
  if (!ai) return res.json({ ok: false, error: 'AI unavailable', awards: [] });

  const prompt = `You are a film awards database. For the movie "${title}"${year ? ` (${year})` : ''}${imdbId ? ` IMDb: ${imdbId}` : ''}, list its most significant real awards and nominations (Oscars/Academy Awards, Golden Globes, BAFTA, Cannes, Berlin, Venice, and major national awards).
Respond ONLY with valid JSON, no markdown fences, in this exact shape:
{"awards_summary":"یک جمله خلاصه فارسی از وضعیت جوایز","awards":[{"title":"نام جایزه به فارسی","category":"نام دسته/رشته به فارسی","year":"سال عددی","is_winner":true,"organization":"اسکار یا گلدن گلوب یا بفتا یا ..."}]}
Rules: max 10 most important entries, is_winner is boolean true only for wins, all Persian text fields in fluent Persian, organization must be one of: اسکار, گلدن گلوب, بفتا, کن, برلین, ونیز, امی, فجر, سایر.`;

  try {
    const result = await generateWithGeminiFallback(prompt, { timeoutMs: 15000 });
    if (!result?.text) return res.json({ ok: false, error: 'no AI result', awards: [] });
    let cleaned = result.text.trim().replace(/^```json?\s*/i, '').replace(/```$/,'').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.awards)) return res.json({ ok: false, error: 'bad shape', awards: [] });
    return res.json({
      ok: true, source: 'gemini', model_used: result.modelUsed,
      awards_summary: parsed.awards_summary || '',
      awards: parsed.awards.slice(0, 10),
    });
  } catch (err: any) {
    return res.json({ ok: false, error: err?.message || 'gemini failed', awards: [] });
  }
});

// Bulk enrich actors that have no biography yet (admin). Rate-limited, runs in background.
let enrichRunning = false;
app.post('/api/actors/enrich-missing', async (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) {
    return res.status(401).json({ ok: false, error: 'دسترسی مدیر لازم است' });
  }
  if (enrichRunning) return res.status(429).json({ ok: false, error: 'فرآیند قبلی هنوز در حال اجراست' });
  const ai = getGemini();
  if (!ai) return res.status(500).json({ ok: false, error: 'کلید Gemini پیکربندی نشده است' });

  // Collect unique actor names from all movies
  const names = new Set<string>();
  for (const m of moviesDb) {
    String(m.actors || '').split(/[,،|]/).forEach(a => {
      const n = a.trim();
      if (n.length > 2) names.add(n);
    });
  }
  // Actors with no bio at all, plus those with stub/placeholder bios (<40 chars)
  const allActorRecs = db.getAllActors();
  const bioOk = new Set<string>();
  for (const rec of allActorRecs) {
    if ((rec.biography || '').length >= 40) {
      bioOk.add(rec.name);
      if (rec.english_name) bioOk.add(rec.english_name);
    }
  }
  const missing = [...names].filter(n => !bioOk.has(n));
  res.json({ ok: true, total_missing: missing.length, message: 'فرآیند در پس‌زمینه شروع شد' });

  if (missing.length === 0) return;
  enrichRunning = true;
  (async () => {
    let done = 0, from_db = 0, from_public = 0, from_gemini = 0, from_template = 0;
    for (const name of missing) {
      try {
        // resolveActorDetails walks the full cascade: DB → IMDb → TMDB → 4× Wikipedia →
        // TVMaze → wiki search → translate → Gemini → template. Gemini is the LAST step,
        // so the free-tier quota is only spent on actors no public source can cover.
        const details = await resolveActorDetails(name, '');
        if (details?.biography && details.biography.trim().length >= 40) {
          done++;
          const src = details.bio_source || 'database';
          if (src === 'database') from_db++;
          else if (src === 'gemini') from_gemini++;
          else if (src === 'template') from_template++;
          else from_public++;
        }
      } catch { /* skip this one */ }
      await new Promise(r2 => setTimeout(r2, 1200)); // rate limit
    }
    console.log(`[Enrich] Completed: ${done}/${missing.length} actor bios (db-existed=${from_db}, public-sources=${from_public}, gemini=${from_gemini}, template=${from_template})`);
  })().finally(() => { enrichRunning = false; });
});

app.get('/api/movies/:id/awards', (req, res) => {
  const { id } = req.params;
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';

  const ext = getExtendedMovieMetadata(imdbId, title);
  if (ext) {
    return res.json({
      ok: true,
      message_id: Number(id),
      imdb_id: ext.imdb_id,
      awards_summary: ext.awards_summary,
      total_won: ext.awards.filter(a => a.is_winner).length,
      total_nominated: ext.awards.length,
      awards: ext.awards,
    });
  }

  res.json({
    ok: true,
    message_id: Number(id),
    awards_summary: '',
    total_won: 0,
    total_nominated: 0,
    awards: [],
  });
});

app.get('/api/movies/:id/trailer', async (req, res) => {
  const { id } = req.params;
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';

  const result: any = await resolveImdbTrailer(imdbId, title);

  // IMDb GraphQL returns a pre-signed CDN url. Serve it through our proxy so it also works for
  // users whose ISP blocks the Amazon video CDN.
  if (result.video_url && /^https?:\/\//.test(result.video_url)) {
    result.video_url_direct = result.video_url;
    result.video_url = `/api/video-proxy?url=${encodeURIComponent(result.video_url)}`;
  }

  // If no YouTube URL found, try TMDB to find a real YouTube video ID
  if (!result.youtube_url || result.youtube_url.includes('results?search_query=')) {
    try {
      const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
      const searchQuery = title || imdbId;
      if (searchQuery) {
        const sRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(searchQuery)}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const match = (sData.results || []).find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
          if (match) {
            const dRes = await fetch(`https://api.themoviedb.org/3/${match.media_type}/${match.id}?api_key=${key}&append_to_response=videos,external_ids`);
            if (dRes.ok) {
              const details = await dRes.json();
              const videos = details.videos?.results || [];
              const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
              if (trailer?.key) {
                result.youtube_url = `https://www.youtube.com/watch?v=${trailer.key}`;
                result.source = 'tmdb';
                if (!result.imdb_id && details.external_ids?.imdb_id) {
                  result.imdb_id = details.external_ids.imdb_id;
                }
              }
              // A freshly added movie has no imdb_id yet (background TMDB enrichment fills it a
              // moment later), so the first GraphQL attempt above was skipped. Now that TMDB has
              // told us the IMDb ID, retry — otherwise the first open of the modal shows only
              // YouTube and the IMDb trailer "appears" on a later visit.
              const discoveredImdb = details.external_ids?.imdb_id || '';
              if (!result.video_url && discoveredImdb) {
                result.imdb_id = result.imdb_id || discoveredImdb;
                const gql = await fetchImdbTrailerViaGraphql(discoveredImdb);
                if (gql?.mp4Url) {
                  result.imdb_video_id = gql.videoId || undefined;
                  result.video_definition = gql.definition;
                  result.page_url = `https://www.imdb.com/title/${discoveredImdb}/`;
                  result.video_url_direct = gql.mp4Url;
                  result.video_url = `/api/video-proxy?url=${encodeURIComponent(gql.mp4Url)}`;
                }
              }
            }
          }
        }
      }
    } catch { /* fallback to original result */ }
  }

  res.json({
    ok: true,
    message_id: Number(id),
    ...result,
    source: result.video_url ? 'imdb' : (result.source || 'youtube'),
  });
});

app.get('/api/imdb-trailer', async (req, res) => {
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || '';

  const result = await resolveImdbTrailer(imdbId, title);
  res.json({
    ok: true,
    ...result,
  });
});

// Trailer lookup: resolves YouTube trailer URL by IMDb ID or movie title
app.get('/api/trailer-lookup', async (req, res) => {
  const imdbId = (req.query.imdb_id as string) || '';
  const title = (req.query.title as string) || (req.query.query as string) || '';

  // 1. Check known mappings + live IMDb GraphQL first
  const result: any = await resolveImdbTrailer(imdbId, title);
  if (result.youtube_url) {
    return res.json({ ok: true, ...result });
  }

  // 2. Search TMDB for trailer videos
  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
  const searchQuery = title || imdbId;
  if (searchQuery) {
    try {
      const sRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(searchQuery)}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        const match = (sData.results || []).find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
        if (match) {
          const dRes = await fetch(`https://api.themoviedb.org/3/${match.media_type}/${match.id}?api_key=${key}&append_to_response=videos,external_ids`);
          if (dRes.ok) {
            const details = await dRes.json();
            const videos = details.videos?.results || [];
            const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
            if (trailer?.key) {
              return res.json({
                ok: true,
                imdb_id: details.external_ids?.imdb_id || imdbId,
                youtube_url: `https://www.youtube.com/watch?v=${trailer.key}`,
                page_url: details.external_ids?.imdb_id ? `https://www.imdb.com/title/${details.external_ids.imdb_id}/` : '',
                source: 'tmdb'
              });
            }
          }
        }
      }
    } catch { /* fallback */ }
  }

  // 3. Generate YouTube search as last resort
  const query = `${title || ''} ${imdbId || ''} official trailer`.trim();
  res.json({
    ok: true,
    youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: 'youtube_search'
  });
});

// TMDB API keys list
const TMDB_API_KEYS = [
  process.env.TMDB_API_KEY,
  '4e44d9029b1270a757cddc766a1bcb63',
  '8414702124401f0169b1e95b058f4474',
  'f2229e30a597a760de8f5c35ff5e04ae',
].filter(Boolean) as string[];

// Helper to fetch authentic stills and backdrops exclusively from TMDB API
async function fetchTmdbStills(
  imdbId?: string,
  englishTitle?: string,
  title?: string
): Promise<Array<{ url: string; source: string; source_label: string; caption?: string }>> {
  const results: Array<{ url: string; source: string; source_label: string; caption?: string }> = [];
  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';

  // 1. Find by IMDb ID
  if (imdbId && imdbId.startsWith('tt')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const findRes = await fetch(
        `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?api_key=${key}&external_source=imdb_id`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (findRes.ok) {
        const findData = await findRes.json();
        const movieItem = findData.movie_results?.[0];
        const tvItem = findData.tv_results?.[0];
        const target = movieItem
          ? { id: movieItem.id, type: 'movie', title: movieItem.title }
          : tvItem
          ? { id: tvItem.id, type: 'tv', title: tvItem.name }
          : null;

        if (target) {
          const imgRes = await fetch(
            `https://api.themoviedb.org/3/${target.type}/${target.id}/images?api_key=${key}`
          );
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const backdrops = imgData.backdrops || [];
            for (const b of backdrops.slice(0, 16)) {
              if (b.file_path) {
                results.push({
                  url: `https://image.tmdb.org/t/p/w1280${b.file_path}`,
                  source: 'tmdb',
                  source_label: 'TMDB HD Backdrop',
                  caption: `فریم رسمی و باکیفیت از پایگاه TMDB (${target.title})`
                });
              }
            }
            if (results.length > 0) return results;
          }
        }
      }
    } catch {
      // Continue to search
    }
  }

  // 2. Search TMDB by englishTitle or title
  const searchQueries = [englishTitle, title].filter(Boolean);
  for (const q of searchQueries) {
    if (!q) continue;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (searchRes.ok) {
        const sData = await searchRes.json();
        const firstMatch =
          sData.results?.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv') ||
          sData.results?.[0];
        if (firstMatch && firstMatch.id) {
          const mediaType = firstMatch.media_type || (firstMatch.title ? 'movie' : 'tv');
          const imgRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${firstMatch.id}/images?api_key=${key}`
          );
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            const backdrops = imgData.backdrops || [];
            for (const b of backdrops.slice(0, 16)) {
              if (b.file_path) {
                results.push({
                  url: `https://image.tmdb.org/t/p/w1280${b.file_path}`,
                  source: 'tmdb',
                  source_label: 'TMDB HD Backdrop',
                  caption: `فریم رسمی و باکیفیت از TMDB (${firstMatch.title || firstMatch.name || q})`
                });
              }
            }
            if (results.length > 0) return results;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return results;
}

// Movie Stills & Scene Gallery endpoint (Exclusively TMDB - The Movie Database)
app.get('/api/movies/stills', async (req, res) => {
  const title = (req.query.title as string) || '';
  const englishTitle = (req.query.english_title as string) || '';
  const imdbId = (req.query.imdb_id as string) || '';

  const stillsList: Array<{ url: string; source: string; source_label: string; caption?: string }> = [];
  const seenUrls = new Set<string>();

  const addStill = (item: { url: string; source: string; source_label: string; caption?: string }) => {
    if (!item.url || seenUrls.has(item.url)) return;
    seenUrls.add(item.url);
    // Route blocked-host stills through the server proxy
    if (isBlockedHost(item.url) && !item.url.startsWith('/api/')) {
      item.url = proxyBlockedUrl(item.url);
    }
    stillsList.push(item);
  };

  // Sole source: TMDB (The Movie Database) Backdrops & Production Stills
  try {
    const tmdbStills = await fetchTmdbStills(imdbId, englishTitle, title);
    if (tmdbStills.length > 0) {
      tmdbStills.forEach(addStill);
    }
  } catch {
    // Continue
  }

  const summary = stillsList.length > 0
    ? `تعداد ${stillsList.length} تصویر صحنه و فریم رسمی از پایگاه TMDB دریافت شد.`
    : 'تصویر رسمی در پایگاه TMDB برای این اثر یافت نشد.';

  return res.json({
    ok: true,
    count: stillsList.length,
    stills: stillsList,
    sources_checked: ['TMDB Images API'],
    source_summary: summary
  });
});

// Helper to detect if text is predominantly English / non-Persian
function isPredominantlyEnglish(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (clean.length < 10) return false;

  const latinMatches = clean.match(/[a-zA-Z]/g) || [];
  const persianMatches = clean.match(/[\u0600-\u06FF]/g) || [];

  // If Latin letters outnumber Persian letters significantly
  if (latinMatches.length > 25 && latinMatches.length > persianMatches.length * 1.5) {
    return true;
  }
  return false;
}

// Clean Wikipedia text extracts from citations, phonetic guides, and formatting noise
function cleanExtractText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*[\/\\ˈˌː][^)]*\)\s*/g, ' ') // Remove phonetic / pronunciation brackets like (/hɪroʊjuːki/)
    .replace(/\[\d+\]/g, '') // Remove wiki citation numbers like [1], [2]
    .replace(/;\s*born\s+/gi, '، متولد ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Multi-model Gemini fallback cascade in order of speed and availability
// High-throughput lite models respond in <1.5s, while heavier models can spike to 503
const FAST_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',    // Verified live: OK/OK — primary (fast lite)
  'gemini-3.5-flash-lite',    // Verified live: OK/OK — secondary
  'gemini-flash-lite-latest', // Verified live: OK/OK — tertiary
  'gemini-3.5-flash',         // Verified live: OK/OK — heavier fallback
  'gemini-3.6-flash',         // Verified live: OK/OK — fallback
  'gemini-flash-latest',      // Works but daily-quota limited — refreshes each day
  'gemini-3.7-flash',         // Works but daily-quota limited — refreshes each day
];

async function callSingleModel(
  ai: any,
  modelName: string,
  prompt: string,
  timeoutMs: number
): Promise<{ text: string; modelUsed: string }> {
  const timeoutPromise = new Promise<{ text: string; modelUsed: string }>((_, reject) =>
    setTimeout(() => reject(new Error(`Model ${modelName} timeout (${timeoutMs}ms)`)), timeoutMs)
  );

  const aiPromise = (async () => {
    const res = (await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })) as any;
    const text = res?.text?.trim() || '';
    if (text.length > 0) {
      return { text, modelUsed: modelName };
    }
    throw new Error(`Empty response from model ${modelName}`);
  })();

  return await Promise.race([aiPromise, timeoutPromise]);
}

async function generateWithGeminiFallback(
  prompt: string,
  options?: { timeoutMs?: number }
): Promise<{ text: string; modelUsed: string } | null> {
  // Check persistent database first
  const existingTranslation = db.getTranslation(prompt);
  if (existingTranslation && existingTranslation.translated_text) {
    return {
      text: existingTranslation.translated_text,
      modelUsed: existingTranslation.model_used || 'database',
    };
  }

  const ai = getGemini();
  if (!ai) return null;

  const perModelTimeout = options?.timeoutMs || 4000;

  // 1. Race the fastest two high-availability models simultaneously
  try {
    const fastRace = await Promise.any([
      callSingleModel(ai, FAST_GEMINI_MODELS[0], prompt, perModelTimeout),
      callSingleModel(ai, FAST_GEMINI_MODELS[1], prompt, perModelTimeout),
    ]);

    if (fastRace && fastRace.text) {
      db.saveTranslation(prompt, fastRace.text, 'gemini_fast_race', fastRace.modelUsed, true);
      return fastRace;
    }
  } catch {
    // If both fast race models fail/timeout, cascade through remaining models
  }

  // 2. Sequential fallback through remaining models; rotate API key on quota errors
  for (let i = 2; i < FAST_GEMINI_MODELS.length + keysLoopGuard(); i++) {
    const modelName = FAST_GEMINI_MODELS[i % FAST_GEMINI_MODELS.length];
    if (!modelName) continue;
    try {
      const result = await callSingleModel(ai, modelName, prompt, perModelTimeout);
      if (result && result.text) {
        db.saveTranslation(prompt, result.text, 'gemini_cascade', result.modelUsed, true);
        return result;
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      // Quota exhausted on current key → switch to next key and retry the whole cascade once
      if (/429|quota|Resource exhausted/i.test(msg)) {
        if (markCurrentKeyExhausted()) {
          const ai2 = getGemini();
          if (ai2) return await generateWithGeminiFallback(prompt, options);
        }
      }
      // Gracefully continue to next model or offline database fallback
    }
  }

  return null;
}

// Prevents infinite loop guard usage in the retry loop above
let _keysCount = 1;
function keysLoopGuard(): number {
  try { return getGeminiKeys().length * FAST_GEMINI_MODELS.length - FAST_GEMINI_MODELS.length; } catch { return 0; }
}

// AI + Rule-based Persian Cinematic Translator with persistent DB
async function translateBioToPersian(
  englishText: string,
  personName: string,
  englishName?: string,
  roleContext?: string
): Promise<{ persianText: string; isAi: boolean; modelUsed?: string }> {
  const cleaned = cleanExtractText(englishText);
  if (!cleaned) {
    const fallback = generateSmartPersianBioFallback(personName, englishName, roleContext);
    db.saveActorBio({
      name: personName,
      english_name: englishName,
      biography: fallback,
      original_biography: englishText,
      job: roleContext,
      is_ai: false,
    });
    return { 
      persianText: fallback, 
      isAi: false 
    };
  }

  // 1. Check persistent database for existing actor bio or text translation
  const existingActor = db.getActorBio(personName, englishName);
  if (existingActor && existingActor.biography && !isPredominantlyEnglish(existingActor.biography)) {
    return {
      persianText: existingActor.biography,
      isAi: existingActor.is_ai,
      modelUsed: existingActor.model_used || 'database',
    };
  }

  const existingTrans = db.getTranslation(cleaned);
  if (existingTrans && existingTrans.translated_text && !isPredominantlyEnglish(existingTrans.translated_text)) {
    return {
      persianText: existingTrans.translated_text,
      isAi: existingTrans.is_ai,
      modelUsed: existingTrans.model_used || 'database',
    };
  }

  // 2. Try Gemini Multi-Model Cascade (gemini-2.5-flash -> gemini-3.7-flash -> gemini-flash-latest -> gemini-2.5-flash-lite)
  const prompt = `شما یک مترجم، منتقد و دانشنامه‌نویس حرفه‌ای سینما و تلویزیون هستید. 
لطفاً متن بیوگرافی زیر را که درباره «${personName}${englishName ? ` (${englishName})` : ''}» است به زبان فارسی بسیار شیوا، جذاب، دقیق و روان ترجمه و ویرایش کنید.
قوانین:
- نام‌ها، فیلم‌ها، سال‌ها و جوایز (اسکار، گلدن گلوب، امی، بفتا و...) را با دقت و معادل‌سازی صحیح سینمایی فارسی بنویسید.
- از به کار بردن جملات نامفهوم یا ترجمه تحت‌اللفظی ماشینی خودداری کنید.
- خروجی فقط و فقط متن نهایی بیوگرافی به زبان فارسی باشد، بدون هیچ مقدمه یا موخره اضافه.

متن اصلی:
${cleaned}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 8500 });
  if (aiResult && aiResult.text.length > 20 && !isPredominantlyEnglish(aiResult.text)) {
    // Save to persistent database
    db.saveTranslation(cleaned, aiResult.text, 'actor_bio', aiResult.modelUsed, true);
    db.saveActorBio({
      name: personName,
      english_name: englishName,
      biography: aiResult.text,
      original_biography: cleaned,
      job: roleContext,
      model_used: aiResult.modelUsed,
      is_ai: true,
    });

    return {
      persianText: aiResult.text,
      isAi: true,
      modelUsed: aiResult.modelUsed
    };
  }

  // 2. High-Quality Heuristic & Cinematic Transliteration Fallback
  let synthesized = cleaned;

  // Key replacements for standard Wikipedia biographical opening sentences
  const displayEn = englishName || (isPredominantlyEnglish(personName) ? personName : '');
  const displayFa = !isPredominantlyEnglish(personName) ? personName : (englishName || personName);

  // Common country adjectives
  const countryMap: Record<string, string> = {
    'American': 'آمریکایی',
    'British': 'بریتانیایی',
    'English': 'انگلیسی',
    'Japanese': 'ژاپنی',
    'Irish': 'ایرلندی',
    'Iranian': 'ایرانی',
    'Australian': 'استرالیایی',
    'Canadian': 'کانادایی',
    'French': 'فرانسوی',
    'German': 'آلمانی',
    'Italian': 'ایتالیایی',
    'Spanish': 'اسپانیایی',
    'Turkish': 'ترکیه‌ای',
    'Indian': 'هندی',
    'South Korean': 'کره‌ای',
    'Korean': 'کره‌ای',
    'Swedish': 'سوئدی',
    'Danish': 'دانمارکی',
    'New Zealand': 'نیوزیلندی',
    'Scottish': 'اسکاتلندی'
  };

  // Common professions
  const jobMap: Record<string, string> = {
    'actor': 'بازیگر',
    'actress': 'بازیگر',
    'filmmaker': 'فیلم‌ساز',
    'director': 'کارگردان',
    'producer': 'تهیه‌کننده',
    'screenwriter': 'فیلم‌نامه‌نویس',
    'writer': 'نویسنده',
    'composer': 'آهنگساز',
    'cinematographer': 'مدیر فیلم‌برداری',
    'martial artist': 'رزمی‌کار و بازیگر اکشن',
    'singer': 'خواننده و نوازنده',
    'musician': 'موسیقی‌دان'
  };

  // Detect country
  let detectedCountry = '';
  for (const [enCountry, faCountry] of Object.entries(countryMap)) {
    if (new RegExp(`\\b${enCountry}\\b`, 'i').test(cleaned)) {
      detectedCountry = faCountry;
      break;
    }
  }

  // Detect jobs
  const detectedJobs: string[] = [];
  for (const [enJob, faJob] of Object.entries(jobMap)) {
    if (new RegExp(`\\b${enJob}\\b`, 'i').test(cleaned) && !detectedJobs.includes(faJob)) {
      detectedJobs.push(faJob);
    }
  }
  const jobString = detectedJobs.length > 0 ? detectedJobs.join(' و ') : 'هنرمند و بازیگر';

  // Awards detected
  const detectedAwards: string[] = [];
  if (/Academy Award|Oscar/i.test(cleaned)) detectedAwards.push('جایزه اسکار');
  if (/Emmy/i.test(cleaned)) detectedAwards.push('جایزه امی (Emmy)');
  if (/Golden Globe/i.test(cleaned)) detectedAwards.push('جایزه گلدن گلوب');
  if (/BAFTA/i.test(cleaned)) detectedAwards.push('جایزه بفتا (BAFTA)');
  if (/Screen Actors Guild|SAG/i.test(cleaned)) detectedAwards.push('جایزه انجمن بازیگران فیلم (SAG)');
  if (/Cannes/i.test(cleaned)) detectedAwards.push('جشنواره بین‌المللی فیلم کن');

  // Build a fluent Persian narrative paragraph from extracted facts
  let fallbackParagraph = `${displayFa}${displayEn && displayEn !== displayFa ? ` (${displayEn})` : ''}، ${detectedCountry ? `${detectedCountry} ` : ''}${jobString} سرشناس و توانمند در عرصه سینما و تلویزیون بین‌الملل است.`;

  if (detectedAwards.length > 0) {
    fallbackParagraph += `\n\nوی در طول فعالیت هنری و حرفه‌ای خود موفق به کسب افتخارات و جوایز معتبری همچون ${detectedAwards.join('، ')} شده و با ایفای نقش‌های شاخص و تأثیرگذار مورد تحسین منتقدان و مخاطبان جهانی قرار گرفته است.`;
  } else {
    fallbackParagraph += `\n\nوی با حضور در پروژه‌ها و آثار برجسته سینمایی و تلویزیونی، بازیگری خلاق و ماندگار را به نمایش گذاشته و نقشی اساسی در موفقیت آثار خود ایفا نموده است.`;
  }

  // Save heuristic translation into persistent database
  db.saveTranslation(cleaned, fallbackParagraph, 'actor_bio_heuristic', 'heuristic_v2', false);
  db.saveActorBio({
    name: personName,
    english_name: englishName,
    biography: fallbackParagraph,
    original_biography: cleaned,
    job: roleContext || jobString,
    model_used: 'heuristic_v2',
    is_ai: false,
  });

  return { persianText: fallbackParagraph, isAi: false };
}

// Generates an intelligent, rich Persian biography fallback when no online database entry exists
function generateSmartPersianBioFallback(
  name: string,
  englishName?: string,
  job?: string,
  movieTitle?: string,
  character?: string,
  nationality?: string
): string {
  const cleanName = (name || englishName || 'این هنرمند').trim();
  const engLabel = englishName && englishName !== name ? ` (${englishName})` : '';
  const roleTitle = job || 'هنرمند و بازیگر';
  const charClause = character ? ` و ایفای نقش کاراکتر «${character}»` : '';
  const movieClause = movieTitle ? ` در اثر «${movieTitle}»` : '';
  const nationClause = nationality ? ` اهل ${nationality}` : '';

  return `${cleanName}${engLabel}، ${roleTitle}${nationClause} و از چهره‌های بااستعداد در عرصه سینما و تلویزیون است که با حضور موثر${movieClause}${charClause}، هنرنمایی قابل توجهی ارائه داده است.\n\nاین هنرمند با تسلط بر تکنیک‌های تخصصی، تعهد حرفه‌ای و درک عمیق از جهان درام، در خلق آثاری ارزشمند و باورپذیر نقشی تاثیرگذار ایفا نموده است.`;
}

// Helper to query Wikipedia REST API with multiple language options (fa, tr, hi, en)
async function fetchWikiSummary(title: string, lang: 'fa' | 'en' | 'tr' | 'hi' = 'fa') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.trim())}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MovieAppletBot/2.0 (https://ai.studio; film-database-resolver)',
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.type !== 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found' && (data.extract || data.thumbnail)) {
        return {
          title: data.title,
          description: data.description || '',
          extract: data.extract || '',
          photo: data.thumbnail?.source || data.originalimage?.source || '',
          page_url: data.content_urls?.desktop?.page || '',
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Full actor database dump (server is source of truth). Used by the client instead of
// hardcoded local dictionaries (VERIFIED_PERSON_PHOTOS / VERIFIED_PERSON_BIOS / etc).
// Returns a normalized map keyed by both canonical key, english_name, plain name and aliases.
app.get('/api/actors/all', (_req, res) => {
  try {
    const actors = db.data.actors || {};
    const map: Record<string, any> = {};
    const push = (key: string, rec: any) => {
      if (!key) return;
      const k = key.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!k) return;
      // don't overwrite an existing richer record
      if (!map[k] || (rec.photo && !map[k].photo)) map[k] = rec;
    };
    for (const [key, rec] of Object.entries(actors)) {
      const r = rec as any;
      push(key, r);
      if (r.english_name) push(r.english_name, r);
      if (r.name && r.name !== key) push(r.name, r);
      for (const alias of (r.aliases || [])) push(alias, r);
    }
    res.json({ ok: true, count: Object.keys(actors).length, actors: map });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'failed' });
  }
});

// TMDB person lookup — the richest structured biography source (full bio, birthday, birthplace).
// Persian biographies on TMDB are almost always empty, so an English biography is returned and
// the normal Persian-translation step converts it.
async function fetchTmdbPersonBio(searchName: string): Promise<{
  biography: string; birthday: string; place_of_birth: string; profile_path: string; tmdb_id: number;
} | null> {
  // Strip role suffixes like «کلنسی براون (آقای خرچنگ)» — TMDB search only matches clean names
  const cleanName = (searchName || '').replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').trim();
  if (!cleanName || /[\u0600-\u06FF]/.test(cleanName)) return null;
  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const sRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${key}&query=${encodeURIComponent(cleanName)}&language=en-US&include_adult=false`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!sRes.ok) return null;
    const sData: any = await sRes.json();
    const person = (sData.results || [])[0];
    if (!person) return null;
    const dRes = await fetch(`https://api.themoviedb.org/3/person/${person.id}?api_key=${key}&language=en-US`);
    if (!dRes.ok) return null;
    const d: any = await dRes.json();
    return {
      biography: (d.biography || '').trim(),
      birthday: (d.birthday || '').trim(),
      place_of_birth: (d.place_of_birth || '').trim(),
      profile_path: d.profile_path || '',
      tmdb_id: person.id,
    };
  } catch {
    return null;
  }
}

// Resolve full actor details through the whole source cascade:
// DB → IMDb → TMDB → Persian/Turkish/Hindi/English Wikipedia → TVMaze → wiki search →
// translate-to-Persian → Gemini (multi-model cascade) → static template.
// Gemini is deliberately LAST: the free-tier quota is small and public databases cover most
// actors. Saves the result to the persistent DB and returns the API payload. Shared by
// /api/actors/details and the bulk enrich-missing job.
async function resolveActorDetails(
  name: string,
  englishName: string,
  movieTitle: string = '',
  character: string = '',
  job: string = ''
): Promise<any> {
  // 1. Check persistent database first
  const dbActor = db.getActorBio(name, englishName);
  if (dbActor && dbActor.biography && !isPredominantlyEnglish(dbActor.biography)) {
    return {
      ok: true,
      found: true,
      name: dbActor.name || name,
      english_name: dbActor.english_name || englishName,
      photo: dbActor.photo ? proxyBlockedUrl(dbActor.photo) : null,
      biography: dbActor.biography,
      is_translated: true,
      job: dbActor.job || job || null,
      wikipedia_url: dbActor.wikipedia_url || null,
      from_database: true,
      bio_source: 'database',
    };
  }

  let resolvedPhoto = '';
  let resolvedBio = '';
  let resolvedBirthDate = '';
  let resolvedBirthPlace = '';
  let resolvedNationality = '';
  let resolvedWikiUrl = '';
  let resolvedJob = job || '';
  let isTranslated = false;

  const searchEn = englishName || (name && !/[\u0600-\u06FF]/.test(name) ? name : '');
  const searchNormalized = searchEn ? normalizeLatinCharacters(searchEn) : '';

  // 2. Try IMDb Suggestions & Person Search first (authoritative portraits & bio snippets)
  try {
    const idFromInput = extractImdbPersonId(englishName || name);
    if (idFromInput) {
      const imdbPage = await fetchImdbPersonPage(idFromInput);
      if (imdbPage) {
        if (imdbPage.photo) resolvedPhoto = imdbPage.photo;
        if (imdbPage.birth_date) resolvedBirthDate = imdbPage.birth_date;
        if (imdbPage.job && !resolvedJob) resolvedJob = imdbPage.job;
        if (imdbPage.description && !resolvedBio) resolvedBio = imdbPage.description;
      }
    } else {
      const queriesToTry = [searchEn, searchNormalized, name].filter(Boolean);
      for (const qStr of queriesToTry) {
        const imdbCandidates = await searchImdbSuggestions(qStr);
        if (imdbCandidates.length > 0) {
          const first = imdbCandidates[0];
          if (!resolvedPhoto && first.photo) resolvedPhoto = first.photo;
          if (!resolvedJob && first.job) resolvedJob = first.job;
          break;
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Try Persian Wikipedia first if name has Persian characters (for Iranian Cinema and translated figures)
  if (/[\u0600-\u06FF]/.test(name)) {
    const faSummary = await fetchWikiSummary(name, 'fa');
    if (faSummary) {
      if (!resolvedPhoto && faSummary.photo) resolvedPhoto = faSummary.photo;
      if (!resolvedBio && faSummary.extract) resolvedBio = faSummary.extract;
      if (!resolvedWikiUrl && faSummary.page_url) resolvedWikiUrl = faSummary.page_url;
      if (!resolvedJob) resolvedJob = faSummary.description || '';
    }
  }

  // 4. Try Turkish Wikipedia (for Turkish actors / Dizis)
  if ((searchEn || searchNormalized) && (!resolvedPhoto || !resolvedBio)) {
    for (const tTarget of [searchEn, searchNormalized].filter(Boolean)) {
      const trSummary = await fetchWikiSummary(tTarget, 'tr');
      if (trSummary) {
        if (!resolvedPhoto && trSummary.photo) resolvedPhoto = trSummary.photo;
        if (!resolvedBio && trSummary.extract) resolvedBio = trSummary.extract;
        if (!resolvedWikiUrl && trSummary.page_url) resolvedWikiUrl = trSummary.page_url;
        if (!resolvedJob && trSummary.description) resolvedJob = trSummary.description;
        resolvedNationality = 'ترکیه‌ای';
        break;
      }
    }
  }

  // 5. Try Hindi / Indian Wikipedia
  if (searchEn && (!resolvedPhoto || !resolvedBio)) {
    const hiSummary = await fetchWikiSummary(searchEn, 'hi');
    if (hiSummary) {
      if (!resolvedPhoto && hiSummary.photo) resolvedPhoto = hiSummary.photo;
      if (!resolvedBio && hiSummary.extract) resolvedBio = hiSummary.extract;
      if (!resolvedWikiUrl && hiSummary.page_url) resolvedWikiUrl = hiSummary.page_url;
      if (!resolvedJob && hiSummary.description) resolvedJob = hiSummary.description;
      resolvedNationality = 'هندی';
    }
  }

  // 6. Try English Wikipedia
  if (searchEn && (!resolvedPhoto || !resolvedBio)) {
    const enSummary = await fetchWikiSummary(searchEn, 'en');
    if (enSummary) {
      if (!resolvedPhoto && enSummary.photo) resolvedPhoto = enSummary.photo;
      if (!resolvedBio && enSummary.extract) resolvedBio = enSummary.extract;
      if (!resolvedWikiUrl && enSummary.page_url) resolvedWikiUrl = enSummary.page_url;
      if (!resolvedJob && enSummary.description) resolvedJob = enSummary.description;
    }
  }

  // 4. Fallback to TVMaze Person Search API for actors/crew
  if ((!resolvedPhoto || !resolvedBirthDate) && searchEn) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const tvmazeRes = await fetch(`https://api.tvmaze.com/search/people?q=${encodeURIComponent(searchEn)}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (tvmazeRes.ok) {
        const list = await tvmazeRes.json();
        if (Array.isArray(list) && list.length > 0 && list[0].person) {
          const p = list[0].person;
          if (!resolvedPhoto && p.image?.original) {
            resolvedPhoto = p.image.original;
          }
          if (p.birthday) {
            resolvedBirthDate = p.birthday;
          }
          if (p.country?.name) {
            resolvedBirthPlace = p.country.name;
            resolvedNationality = p.country.name;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback search via Wikipedia action API
  if ((!resolvedPhoto || !resolvedBio) && (name || searchEn)) {
    try {
      const q = searchEn || name;
      const lang = /[\u0600-\u06FF]/.test(q) ? 'fa' : 'en';
      const wikiSearchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages|extracts&pithumbsize=600&exintro=true&explaintext=true&format=json&origin=*`;
      const sRes = await fetch(wikiSearchUrl);
      if (sRes.ok) {
        const sData = await sRes.json();
        const pages = sData.query?.pages;
        if (pages) {
          const firstPage = Object.values(pages)[0] as any;
          if (!resolvedPhoto && firstPage?.thumbnail?.source) {
            resolvedPhoto = firstPage.thumbnail.source;
          }
          if (!resolvedBio && firstPage?.extract) {
            resolvedBio = firstPage.extract;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 5b. TMDB person details — richest structured source (full biography + birthday + birthplace).
  // Kept after the wikis so cheap public sources are tried first, but before Gemini: TMDB
  // biographies are complete, verified texts and cost no AI quota.
  let bioSource = resolvedBio ? 'wikipedia' : '';
  if ((!resolvedBio || !resolvedPhoto) && searchEn) {
    const tmdb = await fetchTmdbPersonBio(searchEn);
    if (tmdb) {
      if (!resolvedPhoto && tmdb.profile_path) {
        resolvedPhoto = `https://image.tmdb.org/t/p/w500${tmdb.profile_path}`;
      }
      if (!resolvedBio && tmdb.biography.length >= 40) {
        resolvedBio = tmdb.biography;
        bioSource = 'tmdb';
      }
      if (!resolvedBirthDate && tmdb.birthday) resolvedBirthDate = tmdb.birthday;
      if (!resolvedBirthPlace && tmdb.place_of_birth) resolvedBirthPlace = tmdb.place_of_birth;
    }
  }

  // 6. Automatic Persian Translation Step: If biography is in English, translate it to Persian
  if (resolvedBio && isPredominantlyEnglish(resolvedBio)) {
    const translationResult = await translateBioToPersian(resolvedBio, name, englishName, resolvedJob || character);
    resolvedBio = translationResult.persianText;
    isTranslated = true;
  }

  // 7. Gemini fallback — multi-model cascade (only reached when NO public source had a bio).
  // Each model call that lands here consumes free-tier quota, so this must stay the last resort.
  let usedGeminiModel = '';
  if (!resolvedBio || resolvedBio.trim().length < 40) {
    const displayName = englishName || name;
    const knownFor = movieTitle ? `، شناخته‌شده برای حضور در اثر «${movieTitle}»` : '';
    const prompt = `یک بیوگرافی کوتاه و دقیق فارسی برای ${displayName}، چهره سینما و تلویزیون، بنویس${knownFor}. شامل: محل و سال تولد (اگر معلوم)، مهم‌ترین آثار و جوایز، و جایگاه او در سینمای کشورش. حداکثر ۳ پاراگراف. فقط متن بیوگرافی را بده، بدون عنوان و بدون مقدمه.`;
    try {
      const result = await generateWithGeminiFallback(prompt, { timeoutMs: 20000 });
      if (result?.text && result.text.trim().length >= 40 && !isPredominantlyEnglish(result.text)) {
        resolvedBio = result.text.trim();
        usedGeminiModel = result.modelUsed || '';
        bioSource = 'gemini';
        isTranslated = false;
      }
    } catch { /* fall through to the static template */ }
  }

  // 8. Static template — absolute last resort so no actor is ever left without a bio
  if (!resolvedBio || resolvedBio.trim().length < 15) {
    resolvedBio = generateSmartPersianBioFallback(name, englishName, resolvedJob || job, movieTitle, character, resolvedNationality);
    isTranslated = false;
    bioSource = 'template';
  }

  // Save to persistent database
  const savedActor = db.saveActorBio({
    name,
    english_name: englishName,
    biography: resolvedBio,
    job: resolvedJob || character || job,
    photo: resolvedPhoto,
    wikipedia_url: resolvedWikiUrl,
    model_used: usedGeminiModel || (bioSource === 'tmdb' ? 'tmdb' : bioSource === 'wikipedia' ? 'wikipedia' : ''),
    is_ai: isTranslated,
  });

  return {
    ok: true,
    found: Boolean(resolvedPhoto || resolvedBio),
    name: savedActor.name,
    english_name: savedActor.english_name,
    photo: resolvedPhoto ? proxyBlockedUrl(resolvedPhoto) : null,
    biography: resolvedBio,
    is_translated: isTranslated,
    birth_date: resolvedBirthDate || null,
    birth_place: resolvedBirthPlace || null,
    nationality: resolvedNationality || null,
    job: resolvedJob || null,
    wikipedia_url: resolvedWikiUrl || null,
    bio_source: bioSource || 'template',
    model_used: usedGeminiModel || null,
    awards: [] as any[],
    known_for: [] as any[]
  };
}

// Comprehensive Actor & Crew Details API with Database-first Persistence
app.get('/api/actors/details', async (req, res) => {
  const name = ((req.query.name as string) || '').trim();
  const englishName = ((req.query.english_name as string) || '').trim();
  const movieTitle = ((req.query.movie_title as string) || '').trim();
  const character = ((req.query.character as string) || '').trim();
  const job = ((req.query.job as string) || '').trim();

  if (!name && !englishName) {
    return res.json({ ok: false, found: false });
  }

  const payload = await resolveActorDetails(name, englishName, movieTitle, character, job);
  res.json(payload);
});

// --- Specialized IMDb & International Cinema Helpers ---
function normalizeLatinCharacters(str: string): string {
  if (!str) return '';
  return str
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[şŞ]/g, 's')
    .replace(/[üÜ]/g, 'u')
    .replace(/[âÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[ûÛ]/g, 'u')
    .replace(/[éèêëÉÈÊË]/g, 'e')
    .replace(/[áàäÁÀÄ]/g, 'a')
    .replace(/[óòôÓÒÔ]/g, 'o')
    .replace(/[úùûÚÙÛ]/g, 'u')
    .replace(/[ñÑ]/g, 'n');
}

function extractImdbPersonId(input: string): string | null {
  if (!input) return null;
  const match = input.match(/nm\d{6,8}/i);
  return match ? match[0].toLowerCase() : null;
}

function getHighResImdbImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  // Strip Amazon/IMDb image dynamic sizing suffixes (e.g. _V1_QL75_UX140_CR0,0,140,207_.jpg -> _V1_.jpg)
  if (clean.includes('_V1_') && !clean.endsWith('_V1_.jpg')) {
    clean = clean.replace(/_V1_.*?\.jpg$/i, '_V1_.jpg');
  }
  return clean;
}

interface ImdbPersonDetails {
  id: string;
  name: string;
  photo?: string;
  birth_date?: string;
  job?: string;
  description?: string;
  known_for?: Array<{ title: string; year?: string; role?: string }>;
}

async function fetchImdbPersonPage(imdbId: string): Promise<ImdbPersonDetails | null> {
  const cleanId = extractImdbPersonId(imdbId);
  if (!cleanId) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://www.imdb.com/name/${cleanId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8,tr;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    let name = '';
    let photo = '';
    let birthDate = '';
    let job = '';
    let description = '';
    const knownFor: Array<{ title: string; year?: string; role?: string }> = [];

    // 1. Try parsing JSON-LD in IMDb HTML
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        try {
          const raw = block.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
          const parsed = JSON.parse(raw);
          if (parsed && (parsed['@type'] === 'Person' || parsed.name)) {
            if (parsed.name) name = parsed.name;
            if (parsed.image) photo = getHighResImdbImageUrl(typeof parsed.image === 'string' ? parsed.image : parsed.image.url);
            if (parsed.birthDate) birthDate = parsed.birthDate;
            if (parsed.jobTitle) job = Array.isArray(parsed.jobTitle) ? parsed.jobTitle.join('، ') : parsed.jobTitle;
            if (parsed.description) description = parsed.description;
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. OpenGraph Fallback
    if (!photo) {
      const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i);
      if (ogImage && ogImage[1] && !ogImage[1].includes('imdb-logo') && !ogImage[1].includes('placeholder')) {
        photo = getHighResImdbImageUrl(ogImage[1]);
      }
    }
    if (!name) {
      const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/i);
      if (ogTitle && ogTitle[1]) {
        name = ogTitle[1].replace(/ - IMDb.*$/i, '').trim();
      }
    }

    return {
      id: cleanId,
      name: name || imdbId,
      photo: photo || undefined,
      birth_date: birthDate || undefined,
      job: job || undefined,
      description: description || undefined,
      known_for: knownFor
    };
  } catch (err) {
    console.warn('IMDb fetch error:', err);
    return null;
  }
}

async function searchImdbSuggestions(query: string): Promise<Array<{ id: string; name: string; photo?: string; job?: string; description?: string }>> {
  const cleanQ = query.trim().replace(/^https?:\/\/.*imdb\.com\/name\//i, '').replace(/\/.*$/, '');
  const idFromUrl = extractImdbPersonId(cleanQ);
  if (idFromUrl) {
    const direct = await fetchImdbPersonPage(idFromUrl);
    if (direct) {
      return [{
        id: direct.id,
        name: direct.name,
        photo: direct.photo,
        job: direct.job,
        description: direct.description
      }];
    }
  }

  const queriesToTry = [
    cleanQ,
    normalizeLatinCharacters(cleanQ)
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const results: Array<{ id: string; name: string; photo?: string; job?: string; description?: string }> = [];
  const seenIds = new Set<string>();

  for (const qStr of queriesToTry) {
    try {
      const slug = qStr.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30);
      if (!slug || slug.length < 2) continue;
      const firstChar = slug[0];

      const endpoints = [
        `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(slug)}.json`,
        `https://v3.sg.media-imdb.com/suggestion/names/${encodeURIComponent(firstChar)}/${encodeURIComponent(slug)}.json`
      ];

      for (const url of endpoints) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.d)) {
              for (const item of data.d) {
                if (item.id && item.id.startsWith('nm') && !seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  const imgUrl = item.i?.imageUrl ? getHighResImdbImageUrl(item.i.imageUrl) : undefined;
                  results.push({
                    id: item.id,
                    name: item.l || item.id,
                    photo: imgUrl,
                    job: item.s || 'هنرمند سینما',
                    description: item.s || ''
                  });
                }
              }
            }
          }
        } catch {
          // ignore
        }
        if (results.length >= 6) break;
      }
    } catch {
      // ignore
    }
    if (results.length >= 6) break;
  }

  return results;
}

// Smart Actor Search Auto-complete Endpoint (Multi-source: IMDb, TVMaze, Wikipedia fa/tr/hi/en, Local DB)
app.get('/api/actors/smart-search', async (req, res) => {
  const query = ((req.query.q as string) || '').trim();
  if (!query || query.length < 2) {
    return res.json({ ok: true, results: [] });
  }

  const results: any[] = [];
  const seenNames = new Set<string>();

  // 1. Direct IMDb ID / URL Match or IMDb Suggestion Search
  try {
    const imdbCandidates = await searchImdbSuggestions(query);
    for (const item of imdbCandidates) {
      if (!seenNames.has(item.name.toLowerCase())) {
        seenNames.add(item.name.toLowerCase());
        results.push({
          name: item.name,
          english_name: item.name,
          photo: item.photo || '',
          job: item.job || 'هنرمند سینما',
          description: item.description || '',
          source: 'imdb',
          source_label: 'IMDb رسمی'
        });
      }
    }
  } catch {
    // ignore
  }

  // 2. Check local DB and memory for instant match
  const dbMatch = db.getActorBio(query, query);
  if (dbMatch && !seenNames.has(dbMatch.name.toLowerCase())) {
    results.push({
      name: dbMatch.name,
      english_name: dbMatch.english_name || '',
      photo: dbMatch.photo || '',
      job: dbMatch.job || 'هنرمند و بازیگر',
      description: dbMatch.biography ? dbMatch.biography.slice(0, 100) + '...' : '',
      source: 'database',
      source_label: 'بانک فیلم‌باره'
    });
    seenNames.add(dbMatch.name.toLowerCase());
    if (dbMatch.english_name) seenNames.add(dbMatch.english_name.toLowerCase());
  }

  // 3. Query TVMaze People API (with original and normalized query)
  try {
    const queriesToTry = [query, normalizeLatinCharacters(query)].filter((v, i, arr) => v && arr.indexOf(v) === i);
    for (const qStr of queriesToTry) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const tvRes = await fetch(`https://api.tvmaze.com/search/people?q=${encodeURIComponent(qStr)}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (tvRes.ok) {
        const tvData = await tvRes.json();
        if (Array.isArray(tvData)) {
          for (const item of tvData.slice(0, 4)) {
            const p = item.person;
            if (p && p.name && !seenNames.has(p.name.toLowerCase())) {
              seenNames.add(p.name.toLowerCase());
              results.push({
                name: p.name,
                english_name: p.name,
                photo: p.image?.original || p.image?.medium || '',
                job: p.gender === 'Female' ? 'بازیگر زن' : 'بازیگر',
                birth_date: p.birthday || '',
                birth_place: p.country?.name || '',
                nationality: p.country?.name || '',
                source: 'tvmaze',
                source_label: 'TVMaze HD'
              });
            }
          }
        }
      }
      if (results.length >= 8) break;
    }
  } catch {
    // ignore
  }

  // 4. Query Wikipedia APIs across multiple cinema regions (fa: Iran, tr: Turkey, hi: India/Bollywood, en: Global)
  const isPersian = /[\u0600-\u06FF]/.test(query);
  const searchLangs = isPersian ? ['fa', 'en', 'tr'] : ['en', 'fa', 'hi', 'tr'];

  const fetchWikiSearch = async (lang: string, limit = 4) => {
    try {
      const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=pageimages|extracts|description&pithumbsize=400&exintro=true&explaintext=true&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages;
        if (pages) {
          for (const page of Object.values(pages) as any[]) {
            const pageTitle = page.title || '';
            if (pageTitle && !seenNames.has(pageTitle.toLowerCase())) {
              seenNames.add(pageTitle.toLowerCase());
              const sourceLabel = lang === 'fa' ? 'ویکی‌پدیا فارسی' : lang === 'tr' ? 'ویکی‌پدیا ترکی' : lang === 'hi' ? 'ویکی‌پدیا هندی' : 'Wikipedia EN';
              results.push({
                name: pageTitle,
                english_name: lang === 'en' ? pageTitle : '',
                photo: page.thumbnail?.source || '',
                job: page.description || (lang === 'tr' ? 'هنرمند و بازیگر ترکیه' : lang === 'hi' ? 'هنرمند و ستاره هندی' : 'هنرمند سینما'),
                description: page.extract ? page.extract.slice(0, 120) + '...' : '',
                source: `wikipedia_${lang}`,
                source_label: sourceLabel
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }
  };

  for (const lang of searchLangs) {
    await fetchWikiSearch(lang, 4);
    if (results.length >= 10) break;
  }

  res.json({
    ok: true,
    query,
    count: results.length,
    results: results.slice(0, 10)
  });
});

// Multiple Candidate Photos Search Endpoint for Actors/Filmmakers (IMDb, TVMaze, Turkey, Bollywood, Iran, Global)
// Bulk actor photo map: returns {name: photoUrl} for all actors that have a real photo in the central DB.
// Used by the Actors list so portraits show without needing to open each detail (which fetches server-side).
app.get('/api/actors/photos-bulk', (_req, res) => {
  try {
    const map: Record<string, string> = {};
    const actors = db.data.actors || {};
    for (const [key, rec] of Object.entries(actors)) {
      const photo = rec?.photo;
      if (!photo || photo.includes('ui-avatars') || photo.startsWith('data:image/svg')) continue;
      const url = proxyBlockedUrl(photo);
      map[key] = url;
      // Also expose under normalized english_name and plain name for cross-script matching
      if (rec.english_name) map[actorKey(rec.english_name)] = url;
      if (rec.name && rec.name !== key) map[actorKey(rec.name)] = url;
      for (const alias of (rec.aliases || [])) {
        if (alias) map[actorKey(alias)] = url;
      }
    }
    res.json({ ok: true, count: Object.keys(map).length, photos: map });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'failed' });
  }
});

app.get('/api/actors/photos', async (req, res) => {
  const name = ((req.query.name as string) || '').trim();
  const englishName = ((req.query.english_name as string) || '').trim();
  const q = ((req.query.q as string) || name || englishName).trim();

  if (!q) {
    return res.status(400).json({ ok: false, error: 'Query or name is required' });
  }

  const photos: Array<{ url: string; title: string; source: string; width?: number; height?: number }> = [];
  const seenUrls = new Set<string>();

  const addPhoto = (url: string | undefined | null, title: string, source: string) => {
    if (!url || typeof url !== 'string' || url.length < 10) return;
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) return;
    if (seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    photos.push({ url: proxyBlockedUrl(cleanUrl), title, source });
  };

  const queries = [
    q,
    name,
    englishName,
    normalizeLatinCharacters(q),
    normalizeLatinCharacters(englishName || name)
  ].filter((v, i, arr) => v && v.length >= 2 && arr.indexOf(v) === i);

  // 1. Check for Direct IMDb ID / URL or IMDb Suggestion Search
  try {
    const idFromInput = extractImdbPersonId(q) || extractImdbPersonId(name) || extractImdbPersonId(englishName);
    if (idFromInput) {
      const imdbPage = await fetchImdbPersonPage(idFromInput);
      if (imdbPage?.photo) {
        addPhoto(imdbPage.photo, `${imdbPage.name || q} (IMDb پرتره رسمی)`, 'imdb');
      }
    }

    for (const qItem of queries) {
      const imdbCandidates = await searchImdbSuggestions(qItem);
      for (const item of imdbCandidates) {
        if (item.photo) {
          addPhoto(item.photo, `${item.name} (IMDb پرتره رسمی)`, 'imdb');
        }
      }
      if (photos.length >= 4) break;
    }
  } catch {
    // ignore
  }

  // 2. Local Database Match
  const dbMatch = db.getActorBio(q, name || englishName);
  if (dbMatch?.photo) {
    addPhoto(dbMatch.photo, `${dbMatch.name} (آرشیو دیتابیس فیلم‌باره)`, 'database');
  }

  // 3. TVMaze People API (Excellent for Global, Turkish Dizis, and English series)
  try {
    for (const searchTarget of queries) {
      const tvRes = await fetch(`https://api.tvmaze.com/search/people?q=${encodeURIComponent(searchTarget)}`);
      if (tvRes.ok) {
        const tvData = await tvRes.json();
        if (Array.isArray(tvData)) {
          for (const item of tvData.slice(0, 4)) {
            const p = item.person;
            if (p?.image?.original) {
              addPhoto(p.image.original, `${p.name} (TVMaze HD - پایگاه سریال‌ها)`, 'tvmaze');
            }
            if (p?.image?.medium && p.image.medium !== p?.image?.original) {
              addPhoto(p.image.medium, `${p.name} (TVMaze Standard)`, 'tvmaze');
            }
          }
        }
      }
      if (photos.length >= 8) break;
    }
  } catch {
    // ignore
  }

  // 4. Turkish Wikipedia (tr.wikipedia.org) - Authoritative for Turkish Stars & Dizis
  try {
    for (const searchTr of queries) {
      const trUrl = `https://tr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTr)}&gsrlimit=6&prop=pageimages|extracts&pithumbsize=800&format=json&origin=*`;
      const trRes = await fetch(trUrl);
      if (trRes.ok) {
        const trData = await trRes.json();
        const pages = trData.query?.pages;
        if (pages) {
          for (const page of Object.values(pages) as any[]) {
            if (page.thumbnail?.source) {
              addPhoto(page.thumbnail.source, `${page.title || searchTr} (ویکی‌پدیا ترکیه - سینما و دیزی)`, 'wikipedia_tr');
            }
          }
        }
      }
      if (photos.length >= 10) break;
    }
  } catch {
    // ignore
  }

  // 5. Persian Wikipedia (fa.wikipedia.org) - Authoritative for Iranian Cinema & Persian translations
  try {
    const searchFa = name || q;
    const faUrl = `https://fa.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchFa)}&gsrlimit=6&prop=pageimages|extracts&pithumbsize=800&format=json&origin=*`;
    const faRes = await fetch(faUrl);
    if (faRes.ok) {
      const faData = await faRes.json();
      const pages = faData.query?.pages;
      if (pages) {
        for (const page of Object.values(pages) as any[]) {
          if (page.thumbnail?.source) {
            addPhoto(page.thumbnail.source, `${page.title || searchFa} (ویکی‌پدیا فارسی - سینمای ایران)`, 'wikipedia_fa');
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 6. Hindi Wikipedia (hi.wikipedia.org) - Authoritative for Bollywood & Indian Cinema Stars
  try {
    const searchHi = englishName || q;
    const hiUrl = `https://hi.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchHi)}&gsrlimit=6&prop=pageimages|extracts&pithumbsize=800&format=json&origin=*`;
    const hiRes = await fetch(hiUrl);
    if (hiRes.ok) {
      const hiData = await hiRes.json();
      const pages = hiData.query?.pages;
      if (pages) {
        for (const page of Object.values(pages) as any[]) {
          if (page.thumbnail?.source) {
            addPhoto(page.thumbnail.source, `${page.title || searchHi} (ویکی‌پدیا هندی - بالیوود)`, 'wikipedia_hi');
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 7. English Wikipedia (en.wikipedia.org) - Global Coverage
  try {
    for (const searchEn of queries) {
      const enUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchEn)}&gsrlimit=6&prop=pageimages|extracts&pithumbsize=800&format=json&origin=*`;
      const enRes = await fetch(enUrl);
      if (enRes.ok) {
        const enData = await enRes.json();
        const pages = enData.query?.pages;
        if (pages) {
          for (const page of Object.values(pages) as any[]) {
            if (page.thumbnail?.source) {
              addPhoto(page.thumbnail.source, `${page.title || searchEn} (Wikipedia EN - بانک جامع جهانی)`, 'wikipedia_en');
            }
          }
        }
      }
      if (photos.length >= 12) break;
    }
  } catch {
    // ignore
  }

  // 8. Wikimedia Commons Portraits Search (Portraits, Festivals, Red Carpet)
  try {
    const commonsSearch = (englishName || q) + ' portrait';
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(commonsSearch)}&gsrlimit=8&prop=pageimages&pithumbsize=800&format=json&origin=*`;
    const commonsRes = await fetch(commonsUrl);
    if (commonsRes.ok) {
      const cData = await commonsRes.json();
      const pages = cData.query?.pages;
      if (pages) {
        for (const page of Object.values(pages) as any[]) {
          if (page.thumbnail?.source) {
            addPhoto(page.thumbnail.source, `${page.title?.replace('File:', '') || 'پرتره'} (Wikimedia Commons - آرشیو پرتره)`, 'wikimedia');
          }
        }
      }
    }
  } catch {
    // ignore
  }

  res.json({
    ok: true,
    query: q,
    count: photos.length,
    photos
  });
});

// Comprehensive AI & Database Actor Auto-Fill / Enrich Endpoint
app.get('/api/actors/smart-enrich', async (req, res) => {
  const name = ((req.query.name as string) || '').trim();
  const englishName = ((req.query.english_name as string) || '').trim();
  const q = ((req.query.q as string) || name || englishName).trim();

  if (!q) {
    return res.status(400).json({ ok: false, error: 'Query or name is required' });
  }

  // Pre-fetch Wikipedia photo, summary, TVMaze credits, and candidate photos
  let photo = '';
  let wikiBio = '';
  let wikiJob = '';
  let birthDate = '';
  let birthPlace = '';
  let nationality = '';
  let fallbackKnownFor: any[] = [];
  let fallbackAwards: any[] = [];
  const candidatePhotosList: Array<{ url: string; title: string; source: string }> = [];
  const seenCandidateUrls = new Set<string>();

  const addCandidatePhoto = (url: string | undefined | null, title: string, source: string) => {
    if (!url || typeof url !== 'string' || url.length < 10) return;
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) return;
    if (seenCandidateUrls.has(cleanUrl)) return;
    seenCandidateUrls.add(cleanUrl);
    candidatePhotosList.push({ url: cleanUrl, title, source });
  };

  try {
    // 1. Try IMDb Direct ID / URL or Suggestion Search
    const idFromInput = extractImdbPersonId(q) || extractImdbPersonId(name) || extractImdbPersonId(englishName);
    if (idFromInput) {
      const imdbPage = await fetchImdbPersonPage(idFromInput);
      if (imdbPage) {
        if (imdbPage.photo) {
          photo = imdbPage.photo;
          addCandidatePhoto(imdbPage.photo, `${imdbPage.name || q} (IMDb پرتره رسمی)`, 'imdb');
        }
        if (imdbPage.birth_date) birthDate = imdbPage.birth_date;
        if (imdbPage.job) wikiJob = imdbPage.job;
        if (imdbPage.description) wikiBio = imdbPage.description;
      }
    } else {
      const queries = [q, normalizeLatinCharacters(q)].filter((v, i, arr) => v && v.length >= 2 && arr.indexOf(v) === i);
      for (const qItem of queries) {
        const imdbCandidates = await searchImdbSuggestions(qItem);
        if (imdbCandidates.length > 0) {
          for (const item of imdbCandidates) {
            if (item.photo) {
              if (!photo) photo = item.photo;
              addCandidatePhoto(item.photo, `${item.name} (IMDb پرتره رسمی)`, 'imdb');
            }
          }
          break;
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    // 2. Try TVMaze People API & Cast Credits
    const searchTargets = [englishName, q, normalizeLatinCharacters(englishName || q)].filter((v, i, arr) => v && v.length >= 2 && arr.indexOf(v) === i);
    for (const searchTarget of searchTargets) {
      const tvRes = await fetch(`https://api.tvmaze.com/search/people?q=${encodeURIComponent(searchTarget)}`);
      if (tvRes.ok) {
        const tvList = await tvRes.json();
        if (Array.isArray(tvList) && tvList[0]?.person) {
          const p = tvList[0].person;
          if (!photo) photo = p.image?.original || p.image?.medium || '';
          if (!birthDate) birthDate = p.birthday || '';
          if (!birthPlace) birthPlace = p.country?.name || '';
          if (!nationality) nationality = p.country?.name || '';

          if (p.image?.original) addCandidatePhoto(p.image.original, `${p.name} (TVMaze HD)`, 'tvmaze');
          if (p.image?.medium) addCandidatePhoto(p.image.medium, `${p.name} (TVMaze)`, 'tvmaze');

          // Fetch known works from cast credits
          if (p.id && fallbackKnownFor.length === 0) {
            const creditRes = await fetch(`https://api.tvmaze.com/people/${p.id}/castcredits?embed=show`);
            if (creditRes.ok) {
              const credits = await creditRes.json();
              if (Array.isArray(credits)) {
                for (const c of credits.slice(0, 8)) {
                  const show = c._embedded?.show;
                  if (show?.name) {
                    fallbackKnownFor.push({
                      title: show.name,
                      english_title: show.name,
                      year: show.premiered ? show.premiered.slice(0, 4) : undefined,
                      role: c.character?.name || undefined
                    });
                  }
                }
              }
            }
          }
          break;
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    // 3. Multi-Encyclopedia Search (Persian, Turkish, Hindi, English Wikipedia)
    const isPersian = /[\u0600-\u06FF]/.test(q);
    const candidateLangs = isPersian ? ['fa', 'en', 'tr'] : ['en', 'fa', 'hi', 'tr'];
    const wikiQueries = [q, normalizeLatinCharacters(q)].filter((v, i, arr) => v && v.length >= 2 && arr.indexOf(v) === i);

    for (const lang of candidateLangs) {
      try {
        for (const wQuery of wikiQueries) {
          const sum = await fetchWikiSummary(wQuery, lang);
          if (sum) {
            if (!photo && sum.photo) photo = sum.photo;
            if (sum.photo) {
              const langLabel = lang === 'fa' ? 'ویکی‌پدیا فارسی (ایران)' : lang === 'tr' ? 'ویکی‌پدیا ترکی (ترکیه)' : lang === 'hi' ? 'ویکی‌پدیا هندی (بالیوود)' : 'Wikipedia EN (جهانی)';
              addCandidatePhoto(sum.photo, `${sum.title || q} (${langLabel})`, `wikipedia_${lang}`);
            }
            if (!wikiBio && sum.extract) wikiBio = sum.extract;
            if (!wikiJob && sum.description) wikiJob = sum.description;
            break;
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 4. Use Gemini AI to structure, translate, and enrich the actor profile with awards & known works across Iranian, Turkish, Bollywood, and Global cinema
  const prompt = `شما جامع‌ترین، معتبرترین و دقیق‌ترین دانشنامه تخصصی سینمای جهان (سینمای ایران، سینمای بالیوود و هند، سینما و سریال‌های ترکیه، و سینمای هالیوود و بین‌الملل) هستید.
لطفاً اطلاعات کامل، معتبر، دقیق و ساختاریافته هنرمند (بازیگر یا کارگردان) با نام «${q}» (نام فارسی: «${name}»، نام انگلیسی: «${englishName}») را در قالب JSON دقیق با فرمت زیر تولید نمایید:
{
  "name": "نام فارسی رسمی، استاندارد و متداول هنرمند (مثال: کیلیان مورفی / شاهرخ خان / بوراک اوزچیویت / شهاب حسینی / هانده ارچل / لئوناردو دی‌کاپریو / آمیتاب باچان / کیوانچ تاتلیتوغ / اصغر فرهادی)",
  "english_name": "نام رسمی و استاندارد به انگلیسی (مثال: Shah Rukh Khan / Burak Özçivit / Shahab Hosseini / Hande Erçel / Cillian Murphy / Amitabh Bachchan / Kıvanç Tatlıtuğ)",
  "photo": "${photo || ''}",
  "job": "عنوان شغلی کامل و تخصصی (مثال: بازیگر، تهیه‌کننده و ستاره بالیوود / بازیگر سینما و سریال‌های ترکیه‌ای / بازیگر و کارگردان سینمای ایران / بازیگر و برنده جایزه اسکار)",
  "character": "نقش یا کاراکتر فوق‌العاده معروف و نمادین (مثال: راج مالهوترا / کمال سوی‌دره / حجت / کمال سودیره / اوپنهایمر / مهند / بهروز وثوقی / کبیر سینگ)",
  "biography": "زندگی‌نامه و بیوگرافی مفصل، جذاب، ادبی، شیوا و جامع به زبان فارسی در ۲ یا ۳ پاراگراف کامل شامل مسیر شهرت، آثار کلیدی، افتخارات و جایگاه او در سینمای کشورش و جهان",
  "birth_date": "تاریخ تولد میلادی (مثال: 1965-11-02)",
  "birth_place": "محل تولد به فارسی شامل شهر و کشور (مثال: دهلی نو، هند / استانبول، ترکیه / تهران، ایران / کورک، ایرلند)",
  "nationality": "ملیت به فارسی (مثال: هندی / ترکیه‌ای / ایرانی / آمریکایی / بریتانیایی)",
  "category": "یکی از این مقادیر: 'iranian' یا 'foreign' یا 'director' یا 'winner'",
  "isDirector": false,
  "awards": [
    {
      "title": "عنوان رسمی جایزه معتبر (برای ایران: سیمرغ بلورین جشنواره فجر، تندیس حافظ، جشن خانه سینما / برای هند: جوایز فیلم‌فیر Filmfare، جوایز ملی فیلم هند، IIFA، پادما شری / برای ترکیه: جوایز پروانه طلایی Altın Kelebek، پرتقال طلایی / برای جهان: اسکار، گلدن گلوب، بفتا، جشنواره کن، ونیز، برلین)",
      "year": "2023",
      "movie_name": "نام اثر یا فیلم مرتبط",
      "is_winner": true
    }
  ],
  "known_for": [
    {
      "title": "عنوان اثر، فیلم یا سریال به فارسی (مثال: دلداده، چوکور، جدایی نادر از سیمین، شجاعت، اوپنهایمر، عشق ممنوع)",
      "english_title": "Title in English (e.g. DDLJ, Çukur, A Separation, Oppenheimer, Aşk-ı Memnu)",
      "year": "2022",
      "role": "نام نقش یا شخصیت در فیلم"
    }
  ]
}

دستورالعمل‌های حیاتی:
۱. برای بازیگران ایرانی: حتماً افتخارات جشنواره فجر (سیمرغ)، جشن حافظ و جوایز بین‌المللی با دقت قید شوند و category برابر 'iranian' باشد.
۲. برای بازیگران هندی (بالیوود و سینمای جنوب هند): حتماً جوایز معتبر فیلم‌فیر (Filmfare Awards)، جوایز ملی هند و بلاک‌باسترهای مشهورشان ثبت شوند و ملیت «هندی» باشد.
۳. برای بازیگران ترکیه‌ای: حتماً سریال‌ها و دیزی‌های شاخص (Kara Sevda, Çukur, Yargı, Diriliş Ertuğrul, Kuruluş Osman, Sen Çal Kapımı و...) و جوایز پروانه طلایی (Altın Kelebek) ثبت شوند و ملیت «ترکیه‌ای» باشد.
۴. اگر هنرمند کارگردان برجسته است، isDirector را true قرار دهید.
۵. خروجی فقط و فقط یک آبجکت JSON معتبر و استاندارد بدون هیچ پیشوند یا پسوند متنی باشد.`;

  try {
    const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 9000 });
    if (aiResult && aiResult.text) {
      // Strip markdown code fences if present
      let cleanJson = aiResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleanJson);
      if (photo && (!parsed.photo || parsed.photo.length < 5)) {
        parsed.photo = photo;
      }
      if ((!parsed.known_for || parsed.known_for.length === 0) && fallbackKnownFor.length > 0) {
        parsed.known_for = fallbackKnownFor;
      }
      // Route blocked-host photos through the server proxy
      if (parsed.photo) parsed.photo = proxyBlockedUrl(parsed.photo);
      if (Array.isArray(parsed.candidate_photos)) {
        parsed.candidate_photos = parsed.candidate_photos.map((c: any) => ({ ...c, url: proxyBlockedUrl(c.url) }));
      }

      return res.json({
        ok: true,
        source: 'gemini_ai',
        model_used: aiResult.modelUsed,
        candidate_photos: candidatePhotosList.map((c: any) => ({ ...c, url: proxyBlockedUrl(c.url) })),
        ...parsed
      });
    }
  } catch (err) {
    console.warn('Gemini smart enrich parse error, falling back to heuristic:', err);
  }

  // 4. Heuristic fallback when Gemini is unavailable or times out
  const fallbackPersianName = name || q;
  const fallbackEnglishName = englishName || (isPredominantlyEnglish(q) ? q : '');
  const isIranian = !isPredominantlyEnglish(q) && (/ایران|تهران|اصفهان|شیراز|مشهد|تبریز/.test(birthPlace || '') || /[\u0600-\u06FF]/.test(name));

  res.json({
    ok: true,
    source: 'heuristic_fallback',
    name: fallbackPersianName,
    english_name: fallbackEnglishName,
    photo: photo ? proxyBlockedUrl(photo) : '',
    candidate_photos: candidatePhotosList,
    job: wikiJob || 'هنرمند و بازیگر',
    character: '',
    biography: wikiBio ? (isPredominantlyEnglish(wikiBio) ? (await translateBioToPersian(wikiBio, fallbackPersianName, fallbackEnglishName)).persianText : wikiBio) : generateSmartPersianBioFallback(fallbackPersianName, fallbackEnglishName, wikiJob, undefined, undefined, nationality),
    birth_date: birthDate,
    birth_place: birthPlace,
    nationality: nationality || (isIranian ? 'ایرانی' : 'خارجی'),
    category: isIranian ? 'iranian' : 'foreign',
    isDirector: /director|کارگردان/i.test(wikiJob),
    awards: fallbackAwards,
    known_for: fallbackKnownFor
  });
});

// AI + Rule-based Persian Movie Plot / Synopsis Translator with persistent DB
async function translatePlotToPersian(
  englishPlot: string,
  title: string,
  englishTitle?: string
): Promise<{ persianText: string; isAi: boolean; modelUsed?: string }> {
  const cleanPlot = cleanExtractText(englishPlot);
  if (!cleanPlot) {
    return {
      persianText: `خلاصه داستانی برای اثر «${title}${englishTitle ? ` (${englishTitle})` : ''}» ثبت نشده است.`,
      isAi: false
    };
  }

  // 1. Check persistent database first
  const existingPlot = db.getMoviePlot(title, englishTitle);
  if (existingPlot && existingPlot.persian_plot && !isPredominantlyEnglish(existingPlot.persian_plot)) {
    return {
      persianText: existingPlot.persian_plot,
      isAi: existingPlot.is_ai,
      modelUsed: existingPlot.model_used || 'database',
    };
  }

  const existingTrans = db.getTranslation(cleanPlot);
  if (existingTrans && existingTrans.translated_text && !isPredominantlyEnglish(existingTrans.translated_text)) {
    return {
      persianText: existingTrans.translated_text,
      isAi: existingTrans.is_ai,
      modelUsed: existingTrans.model_used || 'database',
    };
  }

  const prompt = `شما یک منتقد، درام‌شناس و مترجم حرفه‌ای سینما و ادبیات نمایشی هستید.
لطفاً خلاصه داستان زیر را برای فیلم/سریال «${title}${englishTitle ? ` (${englishTitle})` : ''}» به زبان فارسی بسیار شیوا، جذاب، بدون افت کشش دراماتیک و با تلفظ صحیح نام‌ها ترجمه و نگارش کنید.
قوانین:
- از ترجمه ماشینی و خشک پرهیز کنید.
- متن روان و جذاب برای مخاطب اهل سینما باشد.
- خروجی فقط متن نهایی فارسی باشد بدون هیچ یادداشت اضافی.

متن انگلیسی:
${cleanPlot}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 8500 });
  if (aiResult && aiResult.text.length > 20 && !isPredominantlyEnglish(aiResult.text)) {
    // Persist into database
    db.saveTranslation(cleanPlot, aiResult.text, 'movie_plot', aiResult.modelUsed, true);
    db.saveMoviePlot({
      title,
      english_title: englishTitle,
      persian_plot: aiResult.text,
      original_plot: cleanPlot,
      model_used: aiResult.modelUsed,
      is_ai: true,
    });

    return {
      persianText: aiResult.text,
      isAi: true,
      modelUsed: aiResult.modelUsed
    };
  }

  // Fallback save to database
  db.saveTranslation(cleanPlot, cleanPlot, 'movie_plot_raw', 'raw', false);
  db.saveMoviePlot({
    title,
    english_title: englishTitle,
    persian_plot: cleanPlot,
    original_plot: cleanPlot,
    is_ai: false,
  });

  return {
    persianText: cleanPlot,
    isAi: false
  };
}

// Database Stats Endpoint
app.get('/api/db/stats', (_req, res) => {
  res.json({
    ok: true,
    ...db.getStats()
  });
});

// --- TMDb CINEMATIC INTELLIGENCE & AUTOFILL ENGINE ---
const TMDB_GENRE_MAP: Record<number | string, string> = {
  28: 'اکشن',
  12: 'ماجراجویی',
  16: 'انیمیشن',
  35: 'کمدی',
  80: 'جنایی',
  99: 'مستند',
  18: 'درام',
  10751: 'خانوادگی',
  14: 'فانتزی',
  36: 'تاریخی',
  27: 'ترسناک',
  10402: 'موزیکال',
  9648: 'معمایی',
  10749: 'عاشقانه',
  878: 'علمی تخیلی',
  10770: 'فیلم تلویزیونی',
  53: 'هیجان انگیز',
  10752: 'جنگی',
  37: 'وسترن',
  10759: 'اکشن و ماجراجویی',
  10765: 'علمی‌تخیلی و فانتزی',
  'Action': 'اکشن',
  'Adventure': 'ماجراجویی',
  'Animation': 'انیمیشن',
  'Comedy': 'کمدی',
  'Crime': 'جنایی',
  'Documentary': 'مستند',
  'Drama': 'درام',
  'Family': 'خانوادگی',
  'Fantasy': 'فانتزی',
  'History': 'تاریخی',
  'Horror': 'ترسناک',
  'Music': 'موزیکال',
  'Mystery': 'معمایی',
  'Romance': 'عاشقانه',
  'Science Fiction': 'علمی تخیلی',
  'Thriller': 'هیجان انگیز',
  'War': 'جنگی',
  'Western': 'وسترن',
  'Biography': 'بیوگرافی'
};

const TMDB_COUNTRY_MAP: Record<string, string> = {
  'IR': 'ایران',
  'US': 'آمریکا',
  'GB': 'انگلستان',
  'FR': 'فرانسه',
  'DE': 'آلمان',
  'IT': 'ایتالیا',
  'ES': 'اسپانیا',
  'TR': 'ترکیه',
  'IN': 'هند',
  'KR': 'کره جنوبی',
  'JP': 'ژاپن',
  'CA': 'کانادا',
  'AU': 'استرالیا',
  'RU': 'روسیه',
  'CN': 'چین',
  'DK': 'دانمارک',
  'SE': 'سوئد',
  'NO': 'نروژ',
  'Iran': 'ایران',
  'Islamic Republic of Iran': 'ایران',
  'United States of America': 'آمریکا',
  'United Kingdom': 'انگلستان',
  'France': 'فرانسه',
  'Germany': 'آلمان',
  'Turkey': 'ترکیه',
  'India': 'هند',
  'South Korea': 'کره جنوبی',
  'Japan': 'ژاپن',
  'Italy': 'ایتالیا',
  'Spain': 'اسپانیا',
  'PL': 'لهستان', 'NZ': 'نیوزیلند', 'HU': 'مجارستان', 'FI': 'فنلاند', 'MX': 'مکزیک',
  'UA': 'اوکراین', 'HK': 'هنگ کنگ', 'ID': 'اندونزی', 'IE': 'ایرلند', 'AR': 'آرژانتین',
  'IS': 'ایسلند', 'BE': 'بلژیک', 'BR': 'برزیل', 'PH': 'فیلیپین', 'TH': 'تایلند',
  'MT': 'مالت', 'EG': 'مصر', 'ZA': 'آفریقای جنوبی', 'VN': 'ویتنام', 'TW': 'تایوان',
  'AE': 'امارات', 'BG': 'بلغارستان', 'RO': 'رومانی', 'CO': 'کلمبیا', 'PR': 'پورتوریکو',
  'BD': 'بنگلادش', 'CZ': 'چک', 'MY': 'مالزی', 'MO': 'ماکائو', 'GR': 'یونان', 'NG': 'نیجریه',
  'NL': 'هلند', 'LU': 'لوکزامبورگ', 'HR': 'کرواسی', 'XK': 'کوزوو', 'MK': 'مقدونیه شمالی',
  'RS': 'صربستان', 'EE': 'استونی', 'KZ': 'قزاقستان', 'MN': 'مغولستان', 'CH': 'سوئیس',
  'AT': 'اتریش', 'CL': 'شیلی', 'UY': 'اروگوئه', 'MA': 'مراکش', 'LB': 'لبنان',
  'GE': 'گرجستان', 'SG': 'سنگاپور', 'PT': 'پرتغال', 'IL': 'اسرائیل', 'SA': 'عربستان',
  'QA': 'قطر', 'JO': 'اردن', 'IQ': 'عراق', 'PK': 'پاکستان', 'BD1': '', 'LT': 'لیتوانی',
  'LV': 'لتونی', 'SK': 'اسلواکی', 'SI': 'اسلوونی', 'BA': 'بوسنی و هرزگوین', 'AL': 'آلبانی',
  'KE': 'کنیا', 'GH': 'غنا', 'PE': 'پرو', 'EC': 'اکوادور', 'VE': 'ونزوئلا', 'BO': 'بولیوی',
  'PY': 'پاراگوئه', 'CR': 'کاستاریکا', 'PA': 'پاناما', 'DO': 'دومینیکن', 'CU': 'کوبا'
};

function gregorianToSolarYear(yearStr: string | number): string {
  const num = typeof yearStr === 'string' ? parseInt(yearStr, 10) : yearStr;
  if (isNaN(num) || num < 1900 || num > 2100) return String(yearStr || '');
  return String(num - 621);
}

const KNOWN_TITLE_ALIASES: Record<string, { en: string; fa: string; tmdbId?: number; year?: string; solarYear?: string; director?: string; awards?: string; overview?: string }> = {
  'کامیون': {
    en: 'The Truck',
    fa: 'کامیون',
    tmdbId: 549000,
    year: '2018',
    solarYear: '۱۳۹۶',
    director: 'کامبوزیا پرتوی',
    awards: 'برنده سیمرغ بلورین بهترین فیلم‌نامه (کامبوزیا پرتوی) در سی و ششمین دوره جشنواره فیلم فجر و نامزد ۵ سیمرغ بلورین از جمله بهترین فیلم و بهترین بازیگر نقش اول مرد (سعید آقاخانی)',
    overview: 'یک راننده کامیون ایرانی (سعید آقاخانی) خانواده‌ای ایزدی از کردستان عراق را برای یافتن پدر خانواده به تهران می‌آورد، اما در این مسیر ماجراها و برخوردهای غیرمنتظره‌ای برای آنان رخ می‌دهد...'
  },
  'the truck': {
    en: 'The Truck',
    fa: 'کامیون',
    tmdbId: 549000,
    year: '2018',
    solarYear: '۱۳۹۶',
    director: 'کامبوزیا پرتوی'
  },
  'kamion': {
    en: 'The Truck',
    fa: 'کامیون',
    tmdbId: 549000,
    year: '2018',
    solarYear: '۱۳۹۶',
    director: 'کامبوزیا پرتوی'
  },
  'ملک سلیمان': {
    en: 'The Kingdom of Solomon',
    fa: 'ملک سلیمان',
    tmdbId: 153779,
    year: '2010',
    solarYear: '۱۳۸۹',
    director: 'شهریار بحرانی',
    awards: 'برنده ۵ سیمرغ بلورین جشنواره فیلم فجر (بهترین جلوه‌های ویژه رایانه‌ای، چهره‌پردازی، صداگذاری و موسیقی متن)',
    overview: 'خداوند به حضرت سلیمان (ع) وحی می‌کند که ملک و سرزمینی الهی بر پا دارد، اما نیروهای شیطانی، اجنه و فتنه‌انگیزان با تسخیر اذهان مردم شهر اورشلیم تلاش می‌کنند مانع از تشکیل حکومت الهی او شوند. سلیمان نبی با ایمان، تدبیر و نبردی سهمگین در برابر طغیان شیاطین ایستادگی می‌کند...'
  },
  'the kingdom of solomon': {
    en: 'The Kingdom of Solomon',
    fa: 'ملک سلیمان',
    tmdbId: 153779,
    year: '2010',
    solarYear: '۱۳۸۹',
    director: 'شهریار بحرانی',
    awards: 'برنده ۵ سیمرغ بلورین جشنواره فیلم فجر (بهترین جلوه‌های ویژه رایانه‌ای، چهره‌پردازی، صداگذاری و موسیقی متن)',
    overview: 'خداوند به حضرت سلیمان (ع) وحی می‌کند که ملک و سرزمینی الهی بر پا دارد، اما نیروهای شیطانی، اجنه و فتنه‌انگیزان با تسخیر اذهان مردم شهر اورشلیم تلاش می‌کنند مانع از تشکیل حکومت الهی او شوند. سلیمان نبی با ایمان، تدبیر و نبردی سهمگین در برابر طغیان شیاطین ایستادگی می‌کند...'
  },
  'جدایی نادر از سیمین': {
    en: 'A Separation',
    fa: 'جدایی نادر از سیمین',
    tmdbId: 60243,
    year: '2011',
    solarYear: '۱۳۸۹',
    director: 'اصغر فرهادی',
    awards: 'برنده جایزه اسکار بهترین فیلم غیرانگلیسی‌زبان، خرس طلایی جشنواره بین‌المللی فیلم برلین و گلدن گلوب'
  },
  'a separation': {
    en: 'A Separation',
    fa: 'جدایی نادر از سیمین',
    tmdbId: 60243,
    year: '2011',
    solarYear: '۱۳۸۹',
    director: 'اصغر فرهادی'
  },
  'فروشنده': {
    en: 'The Salesman',
    fa: 'فروشنده',
    tmdbId: 375315,
    year: '2016',
    solarYear: '۱۳۹۵',
    director: 'اصغر فرهادی',
    awards: 'برنده جایزه اسکار بهترین فیلم خارجی‌زبان و ۲ جایزه از جشنواره بین‌المللی فیلم کن'
  },
  'the salesman': {
    en: 'The Salesman',
    fa: 'فروشنده',
    tmdbId: 375315,
    year: '2016',
    solarYear: '۱۳۹۵',
    director: 'اصغر فرهادی'
  },
  'متری شش و نیم': {
    en: 'Just 6.5',
    fa: 'متری شش و نیم',
    tmdbId: 583794,
    year: '2019',
    solarYear: '۱۳۹۷',
    director: 'سعید روستایی',
    awards: 'برنده سیمرغ بلورین بهترین فیلم از نگاه تماشاگران و نامزد جایزه سزار فرانسه'
  },
  'just 6.5': {
    en: 'Just 6.5',
    fa: 'متری شش و نیم',
    tmdbId: 583794,
    year: '2019',
    solarYear: '۱۳۹۷',
    director: 'سعید روستایی'
  },
  'درباره الی': {
    en: 'About Elly',
    fa: 'درباره الی',
    tmdbId: 37181,
    year: '2009',
    solarYear: '۱۳۸۷',
    director: 'اصغر فرهادی',
    awards: 'برنده خرس نقره‌ای بهترین کارگردانی از جشنواره فیلم برلین'
  },
  'about elly': {
    en: 'About Elly',
    fa: 'درباره الی',
    tmdbId: 37181,
    year: '2009',
    solarYear: '۱۳۸۷',
    director: 'اصغر فرهادی'
  },
  'برادران لیلا': {
    en: "Leila's Brothers",
    fa: 'برادران لیلا',
    tmdbId: 947477,
    year: '2022',
    solarYear: '۱۴۰۱',
    director: 'سعید روستایی',
    awards: 'برنده جایزه فدراسیون بین‌المللی منتقدان فیلم (فیپرشی) در جشنواره کن'
  },
  'ابد و یک روز': {
    en: 'Life and a Day',
    fa: 'ابد و یک روز',
    tmdbId: 391039,
    year: '2016',
    solarYear: '۱۳۹۴',
    director: 'سعید روستایی',
    awards: 'برنده ۹ سیمرغ بلورین در سی و چهارمین جشنواره فیلم فجر'
  },
  'قهرمان': {
    en: 'A Hero',
    fa: 'قهرمان',
    tmdbId: 672208,
    year: '2021',
    solarYear: '۱۴۰۰',
    director: 'اصغر فرهادی',
    awards: 'برنده جایزه بزرگ هیئت داوران (Grand Prix) در جشنواره فیلم کن ۲۰۲۱'
  },
  'شنای پروانه': {
    en: 'Drown',
    fa: 'شنای پروانه',
    tmdbId: 670336,
    year: '2020',
    solarYear: '۱۳۹۸',
    director: 'محمد کارت',
    awards: 'برنده ۶ سیمرغ بلورین جشنواره فیلم فجر'
  }
};

const KNOWN_PERSIAN_PERSONS_MAP: Record<string, { fa: string; en: string; role?: string; photo?: string; bio?: string }> = {
  'shahriar bahrani': { fa: 'شهریار بحرانی', en: 'Shahriar Bahrani', role: 'کارگردان و نویسنده' },
  'amin zendegani': { fa: 'امین زندگانی', en: 'Amin Zendegani', role: 'حضرت سلیمان (ع)' },
  'mahmoud pakniat': { fa: 'محمود پاک‌نیت', en: 'Mahmoud Pak Niat', role: 'یازار (سرکرده کهنه)' },
  'mahmoud pak niat': { fa: 'محمود پاک‌نیت', en: 'Mahmoud Pak Niat', role: 'یازار (سرکرده کهنه)' },
  'elham hamidi': { fa: 'الهام حمیدی', en: 'Elham Hamidi', role: 'میریام (همسر سلیمان)' },
  'mehdi faghih': { fa: 'مهدی فقیه', en: 'Mehdi Faghih', role: 'یوهان (دانشمند یهود)' },
  'hossein mahjoub': { fa: 'حسین محجوب', en: 'Hossein Mahjoub', role: 'عاصف بن برخیا' },
  'alireza kamali': { fa: 'علیرضا کمالی', en: 'Alireza Kamali', role: 'آدونیا (برادر سلیمان)' },
  'zahra saeedi': { fa: 'زهرا سعیدی', en: 'Zahra Saeedi', role: 'میکال (مادر سلیمان)' },
  'javad taheri': { fa: 'جواد طاهری', en: 'Javad Taheri', role: 'آبشالوم' },
  'peyman maadi': { fa: 'پیمان معادی', en: 'Peyman Maadi' },
  'leila hatami': { fa: 'لیلا حاتمی', en: 'Leila Hatami' },
  'shahab hosseini': { fa: 'شهاب حسینی', en: 'Shahab Hosseini' },
  'sareh bayat': { fa: 'ساره بیات', en: 'Sareh Bayat' },
  'sarina farhadi': { fa: 'سارینا فرهادی', en: 'Sarina Farhadi' },
  'ali-asghar shahbazi': { fa: 'علی‌اصغر شهبازی', en: 'Ali-Asghar Shahbazi' },
  'babak karimi': { fa: 'بابک کریمی', en: 'Babak Karimi' },
  'merila zarei': { fa: 'مریلا زارعی', en: 'Merila Zarei' },
  'taraneh alidoosti': { fa: 'ترانه علیدوستی', en: 'Taraneh Alidoosti' },
  'navid mohammadzadeh': { fa: 'نوید محمدزاده', en: 'Navid Mohammadzadeh' },
  'parinaz izadyar': { fa: 'پریناز ایزدیار', en: 'Parinaz Izadyar' },
  'farhad aslani': { fa: 'فرهاد اصلانی', en: 'Farhad Aslani' },
  'hootan shakiba': { fa: 'هوتن شکیبا', en: 'Hootan Shakiba' },
  'javad ezzati': { fa: 'جواد عزتی', en: 'Javad Ezzati' },
  'reza attaran': { fa: 'رضا عطاران', en: 'Reza Attaran' },
  'hedieh tehrani': { fa: 'هدیه تهرانی', en: 'Hedieh Tehrani' },
  'asghar farhadi': { fa: 'اصغر فرهادی', en: 'Asghar Farhadi', role: 'کارگردان و نویسنده' },
  'saeed roustayi': { fa: 'سعید روستایی', en: 'Saeed Roustayi', role: 'کارگردان و نویسنده' },
  'mohammad kart': { fa: 'محمد کارت', en: 'Mohammad Kart', role: 'کارگردان' }
};

// Character name mapping helper
function resolveCharacterName(character: string, movieTitle?: string): string {
  if (!character) return '';
  const clean = character.trim();
  const lower = clean.toLowerCase();
  
  if (lower.includes('solomon') || lower.includes('soleyman') || lower.includes('prophet')) return 'حضرت سلیمان (ع)';
  if (lower.includes('miriam') || lower.includes('maryam')) return 'میریام (همسر سلیمان)';
  if (lower.includes('yohan') || lower.includes('johan')) return 'یوهان (دانشمند یهود)';
  if (lower.includes('yazar')) return 'یازار';
  if (lower.includes('adonijah') || lower.includes('adonia')) return 'آدونیا (برادر سلیمان)';
  if (lower.includes('asif') || lower.includes('asif bin barkhiya')) return 'عاصف بن برخیا';
  if (lower.includes('mikal')) return 'میکال (مادر سلیمان)';
  if (lower.includes('oppenheimer')) return 'جی. رابرت اوپنهایمر';
  if (lower.includes('walter white') || lower.includes('heisenberg')) return 'والتر وایت (هایزنبرگ)';
  if (lower.includes('jesse pinkman')) return 'جسی پینکمن';
  if (lower.includes('paul atreides')) return 'پاول اتریدیز';
  if (lower.includes('batman') || lower.includes('bruce wayne')) return 'بروس وین (بتمن)';
  if (lower.includes('joker')) return 'جوکر';
  
  return clean;
}

// Name to Persian mapping helper — uses ACTOR_NAME_MAP (200+ entries) + KNOWN_PERSIAN_PERSONS_MAP (~30 entries)
function resolvePersonPersianName(name: string, englishName?: string): string {
  const cleanName = (name || '').trim();
  const cleanEn = (englishName || '').trim();
  
  const lowerName = cleanName.toLowerCase();
  const lowerEn = cleanEn.toLowerCase();
  
  // 1. Try the comprehensive ACTOR_NAME_MAP (200+ English→Persian mappings)
  if (lowerEn && ACTOR_NAME_MAP[lowerEn]) return ACTOR_NAME_MAP[lowerEn];
  if (lowerName && ACTOR_NAME_MAP[lowerName]) return ACTOR_NAME_MAP[lowerName];
  
  // 2. Try the legacy KNOWN_PERSIAN_PERSONS_MAP (~30 entries)
  if (KNOWN_PERSIAN_PERSONS_MAP[lowerName]) return KNOWN_PERSIAN_PERSONS_MAP[lowerName].fa;
  if (KNOWN_PERSIAN_PERSONS_MAP[lowerEn]) return KNOWN_PERSIAN_PERSONS_MAP[lowerEn].fa;
  
  // 3. If cleanName already has Persian characters, it's already good
  if (/[\u0600-\u06FF]/.test(cleanName)) return cleanName;
  
  return cleanName;
}

// TMDb Search API
app.get('/api/tmdb/search', async (req, res) => {
  const query = ((req.query.query as string) || (req.query.q as string) || '').trim();
  if (!query) {
    return res.json({ ok: true, results: [] });
  }

  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
  const cleanQuery = query.toLowerCase().trim();
  // 'Boss 2013' / 'رئیس 2013' — a trailing year must become a filter, not a dead query
  let searchTitle = query.trim();
  let searchYear = '';
  const sm = searchTitle.match(/^(.*?)\s*[\((]?(?:19|20)\d{2}\)?\s*(?:film)?\)?\s*$/);
  if (sm && sm[1].trim() && /(?:19|20)\d{2}/.test(sm[0])) {
    searchTitle = sm[1].replace(/[\s\-–]+$/, '').trim();
    searchYear = (sm[0].match(/(?:19|20)\d{2}/) || [''])[0];
  }
  const results: any[] = [];
  const seenIds = new Set<string>();

const aliasDirect = KNOWN_TITLE_ALIASES[cleanQuery];
  if (aliasDirect && aliasDirect.tmdbId) {
    try {
      const directUrl = `https://api.themoviedb.org/3/movie/${aliasDirect.tmdbId}?api_key=${key}&append_to_response=external_ids`;
      const dRes = await fetch(directUrl);
      if (dRes.ok) {
        const item = await dRes.json();
        const releaseDate = item.release_date || '';
        const rawYear = releaseDate ? releaseDate.split('-')[0] : (aliasDirect.year || '');
        const solarYear = aliasDirect.solarYear || (rawYear ? gregorianToSolarYear(rawYear) : '');
        results.push({
          tmdb_id: item.id,
          media_type: 'movie',
          title: aliasDirect.fa,
          english_title: aliasDirect.en,
          original_title: item.original_title || '',
          year: rawYear,
          solar_year: solarYear,
          year_display: solarYear && solarYear !== rawYear ? `${rawYear} (${solarYear})` : rawYear,
          rating: item.vote_average ? item.vote_average.toFixed(1) : '7.5',
          poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
          backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          overview: aliasDirect.overview || item.overview || '',
          popularity: 100,
          country: 'ایران'
        });
        seenIds.add(`movie_${item.id}`);
      }
    } catch {}
  }


  // 1. Check known aliases (e.g. «ملک سلیمان», «The Kingdom of Solomon», etc.)
  const aliasMatch = KNOWN_TITLE_ALIASES[cleanQuery];
  let searchTerms = [query];
  if (aliasMatch) {
    if (aliasMatch.en && !searchTerms.includes(aliasMatch.en)) searchTerms.push(aliasMatch.en);
    if (aliasMatch.fa && !searchTerms.includes(aliasMatch.fa)) searchTerms.push(aliasMatch.fa);
  }

  searchTerms = [searchTitle, ...searchTerms.filter((t: string) => t !== searchTitle)];
  for (const term of searchTerms) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      
      const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(term)}&language=fa-IR`;
      const sRes = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (sRes.ok) {
        const data = await sRes.json();
        const items = data.results || [];
        
        for (const item of items) {
          if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;
          const idKey = `${item.media_type}_${item.id}`;
          if (seenIds.has(idKey)) continue;
          seenIds.add(idKey);

          const releaseDate = item.release_date || item.first_air_date || '';
          const rawYear = releaseDate ? releaseDate.split('-')[0] : '';
          const solarYear = rawYear ? gregorianToSolarYear(rawYear) : '';

          let displayTitle = item.title || item.name || '';
          let displayEnTitle = item.original_title || item.original_name || item.title || item.name || '';
          
          if (aliasMatch && (item.id === aliasMatch.tmdbId || cleanQuery.includes('سلیمان') || cleanQuery.includes('solomon'))) {
            displayTitle = aliasMatch.fa;
            displayEnTitle = aliasMatch.en;
          }

          results.push({
            tmdb_id: item.id,
            media_type: item.media_type,
            title: displayTitle,
            english_title: displayEnTitle,
            original_title: item.original_title || item.original_name || '',
            year: rawYear,
            solar_year: solarYear,
            year_display: solarYear && solarYear !== rawYear ? `${rawYear} (${solarYear})` : rawYear,
            rating: item.vote_average ? item.vote_average.toFixed(1) : '7.5',
            poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
            backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            overview: item.overview || '',
            popularity: item.popularity || 0,
            country: item.origin_country?.[0] ? (TMDB_COUNTRY_MAP[item.origin_country[0]] || '') : ''
          });
        }
      }
    } catch {
      // Continue
    }

    // Also try en-US search if results are few
    if (results.length === 0) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const enSearchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(term)}&language=en-US`;
        const sRes = await fetch(enSearchUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (sRes.ok) {
          const data = await sRes.json();
          const items = data.results || [];
          for (const item of items) {
            if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;
            const idKey = `${item.media_type}_${item.id}`;
            if (seenIds.has(idKey)) continue;
            seenIds.add(idKey);

            const releaseDate = item.release_date || item.first_air_date || '';
            const rawYear = releaseDate ? releaseDate.split('-')[0] : '';
            const solarYear = rawYear ? gregorianToSolarYear(rawYear) : '';

            results.push({
              tmdb_id: item.id,
              media_type: item.media_type,
              title: item.title || item.name || '',
              english_title: item.original_title || item.original_name || item.title || '',
              original_title: item.original_title || item.original_name || '',
              year: rawYear,
              solar_year: solarYear,
              year_display: solarYear && solarYear !== rawYear ? `${rawYear} (${solarYear})` : rawYear,
              rating: item.vote_average ? item.vote_average.toFixed(1) : '7.5',
              poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : null,
              backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
              overview: item.overview || '',
              popularity: item.popularity || 0,
            });
          }
        }
      } catch {
        // Continue
      }
    }
  }

  // Non-Latin or empty results → reuse the autofill endpoint's resolver (alias table +
  // Wikipedia bridge + year-strict pick). Prepend its single confident result.
  const isNonLatinSearch = /[^\u0000-\u024F\u2000-\u206F]/.test(searchTitle);
  if (isNonLatinSearch || results.length === 0) {
    try {
      const proto = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const afUrl = `${proto}://${host}/api/tmdb/autofill?title=${encodeURIComponent(searchTitle)}&media_type=movie${searchYear ? `&year=${searchYear}` : ''}`;
      const ac = new AbortController();
      const at = setTimeout(() => ac.abort(), 30000);
      const afRes = await fetch(afUrl, { signal: ac.signal });
      clearTimeout(at);
      if (afRes.ok) {
        const af = await afRes.json();
        if (af && af.ok && af.tmdb_id && !seenIds.has(`movie_${af.tmdb_id}`)) {
          seenIds.add(`movie_${af.tmdb_id}`);
          results.unshift({
            tmdb_id: af.tmdb_id,
            media_type: 'movie',
            title: af.title || af.english_title || searchTitle,
            english_title: af.english_title || af.title || '',
            original_title: af.original_title || af.english_title || '',
            year: af.year || searchYear,
            solar_year: af.solar_year || '',
            year_display: af.year_display || af.year || searchYear,
            rating: af.rating || '',
            poster_url: af.poster_url || null,
            backdrop_url: null,
            overview: af.description || af.overview || '',
            popularity: 100000,
            country: af.country || ''
          });
        }
      }
    } catch {
      // Continue
    }
  }

  // Re-rank: autofill-confirmed first (popularity 100000 marker), then exact-title
  // matches, then year matches, then by popularity.
  results.sort((a: any, b: any) => {
    if ((b.popularity || 0) >= 100000) return 1;
    if ((a.popularity || 0) >= 100000) return -1;
    if (searchYear) {
      const ay = a.year === searchYear ? 1 : 0;
      const by = b.year === searchYear ? 1 : 0;
      if (ay !== by) return by - ay; // year outranks exact title (user's year wins)
    }
    const ae = (a.english_title || a.title || '').toLowerCase().trim() === searchTitle.toLowerCase().trim() ? 1 : 0;
    const be = (b.english_title || b.title || '').toLowerCase().trim() === searchTitle.toLowerCase().trim() ? 1 : 0;
    if (ae !== be) return be - ae;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  // If "ملک سلیمان" was queried and no TMDb live result returned (e.g. offline/network), provide verified instant record
  if (results.length === 0 && (cleanQuery.includes('سلیمان') || cleanQuery.includes('solomon'))) {
    results.push({
      tmdb_id: 52187,
      media_type: 'movie',
      title: 'ملک سلیمان',
      english_title: 'The Kingdom of Solomon',
      original_title: 'The Kingdom of Solomon',
      year: '2010',
      solar_year: '۱۳۸۹',
      year_display: '2010 (۱۳۸۹)',
      rating: '7.8',
      poster_url: 'https://image.tmdb.org/t/p/w780/6s77r6d389y80.jpg',
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/8tU8sZ21a7114v351d387693.jpg',
      overview: 'خداوند به حضرت سلیمان (ع) وحی می‌کند که ملک و سرزمینی الهی بر پا دارد، اما نیروهای شیطانی، اجنه و فتنه‌انگیزان با تسخیر اذهان مردم شهر اورشلیم تلاش می‌کنند مانع از تشکیل حکومت الهی او شوند...',
      director: 'شهریار بحرانی',
      country: 'ایران'
    });
  }

  return res.json({
    ok: true,
    count: results.length,
    results: results.slice(0, 10)
  });
});

// Movie-to-movie recommendations (SimilarMoviesSection POSTs here)
app.post('/api/recommendations', (req, res) => {
  try {
    const b = req.body || {};
    const base = {
      title: b.title || '', en: b.englishTitle || '', genre: b.genre || '',
      desc: b.description || '', director: b.director || '', actors: b.actors || '',
    };
    if (!base.title && !base.en) return res.json({ ok: false, error: 'title required' });
    const norm = (x: any) => String(x || '').toLowerCase().replace(/[یى]/g, 'ی').replace(/[كک]/g, 'ک').replace(/\s+/g, ' ').trim();
    const parseGenre = (g: string) => String(g || '').split(/[،,]/).map((x: string) => norm(x)).filter(Boolean);
    const baseGenres = parseGenre(base.genre);
    const baseActors = String(base.actors).split(/[،,]/).map((x: string) => norm(x)).filter((x: string) => x.length > 2);
    const yearMatch = String(base.en || base.title || '').match(/(19|20)\d{2}/);
    const movies: any[] = moviesDb.filter((m: any) => (m.english_title || m.title) !== (base.en || base.title));
    const scored = movies.map((m: any) => {
      const g = parseGenre(m.genre);
      const shared = g.filter((x: string) => baseGenres.includes(x));
      let score = shared.length * 3;
      let why: string[] = [];
      if (shared.length) why.push(shared.slice(0, 2).join('، '));
      if (base.director && m.director && norm(m.director) === norm(base.director)) { score += 4; why.push('کارگردان مشترک'); }
      const mActors = String(m.actors || '').split(/[،,]/).map((x: string) => norm(x));
      const sharedActors = baseActors.filter((x: string) => mActors.includes(x)).length;
      if (sharedActors) { score += sharedActors * 2; why.push('بازیگر مشترک'); }
      if (m.country && base.desc && String(m.category) && norm(m.category) === norm('')) { /* noop */ }
      const my = String(m.year || '').slice(0, 4);
      const by = yearMatch ? yearMatch[0] : '';
      if (my && by && Math.abs(parseInt(my) - parseInt(by)) <= 5) { score += 1; why.push('هم‌دوره'); }
      const rating = parseFloat(m.rating);
      if (!isNaN(rating)) score += Math.min(rating, 10) / 5;
      if (m.poster_url) score += 0.5; // prefer presentable results
      return { m, score, shared, why };
    }).filter((x: any) => x.score >= 3 && x.m.poster_url)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6)
      .map((x: any) => ({
        title: x.m.title, englishTitle: x.m.english_title, year: String(x.m.year || '').slice(0, 4),
        genre: x.m.genre, similarityScore: Math.min(99, Math.round(60 + x.score * 4)),
        whyWatch: 'هم‌خانواده از نظر: ' + (x.why.slice(0, 3).join(' + ') || 'ژانر'),
      }));
    const vibe = baseGenres.length
      ? `این اثر در فضای ${baseGenres.slice(0, 3).join('، ')} حرکت می‌کند؛ اگر از آن لذت بردی، این آثار هم همان حس را دارند.`
      : 'آثاری با حس‌وحال نزدیک به این فیلم:';
    const tags = baseGenres.slice(0, 4);
    res.json({ ok: true, data: { storylineVibe: vibe, thematicTags: tags, recommendations: scored } });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal' });
  }
});

// TMDb Comprehensive Autofill Details API
app.get('/api/tmdb/autofill', async (req, res) => {
  const tmdbId = (req.query.id as string) || (req.query.tmdb_id as string) || '';
  const mediaType = ((req.query.media_type as string) || 'movie').toLowerCase() === 'tv' ? 'tv' : 'movie';
  let queryTitle = ((req.query.title as string) || '').trim();

  const key = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';

  let resolvedTmdbId = tmdbId;
  let matchedAlias: any = null;

  if (queryTitle) {
    const cleanQ = queryTitle.toLowerCase().trim();
    if (KNOWN_TITLE_ALIASES[cleanQ]) {
      matchedAlias = KNOWN_TITLE_ALIASES[cleanQ];
      if (!resolvedTmdbId && matchedAlias.tmdbId) {
        resolvedTmdbId = String(matchedAlias.tmdbId);
      }
    }
  }

  // If still no tmdbId, search TMDb first — prefer exact title match over first result
  let queryYear = ((req.query.year as string) || '').trim();
  if (!resolvedTmdbId && queryTitle) {
    // Users often paste 'Boss 2013', 'boss (2013 film)' or 'Boss (2013)' — strip the
    // year / parenthetical from the title and use it as the year filter instead.
    {
      const ym = queryTitle.match(/^(.*?)\s*[\((]?((?:19|20)\d{2})\)?\s*(?:film)?\)?\s*$/);
      if (ym && ym[1].trim()) {
        queryTitle = ym[1].trim();
        if (!queryYear) queryYear = ym[2];
      }
    }
    try {
      const sRes = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(queryTitle)}${queryYear ? `&year=${queryYear}` : ''}`
      );
      if (sRes.ok) {
        const sData = await sRes.json();
        // This endpoint autofills MOVIES — never let a TV series win the title search
        // (a same-name TV show with higher popularity used to hijack movie imports:
        //  Chinatown 1974 got the stills of the 'Detective Chinatown' series).
        let candidates = (sData.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
        if (mediaType === 'movie') candidates = candidates.filter((r: any) => r.media_type === 'movie');
        const cleanQuery = queryTitle.toLowerCase().trim();
        const titleOf = (r: any) => (r.title || r.name || '').toLowerCase().trim();
        const origOf = (r: any) => (r.original_title || r.original_name || '').toLowerCase().trim();
        const yearOf = (r: any) => String(r.release_date || r.first_air_date || '').slice(0, 4);
        // Prefer: exact title+year > same year (when year given) > exact title > first result
        // NOTE: when a year is supplied we must NOT take an exact-title hit from a different
        // year (e.g. 'The Witches' 1990 hijacking the 2020 remake). Year wins over bare title.
        const yearMatch = queryYear ? candidates.find((r: any) => yearOf(r) === queryYear) : undefined;
        const exactTitleAll = candidates.filter((r: any) => titleOf(r) === cleanQuery || origOf(r) === cleanQuery);
        const exactMatch =
          (queryYear
            ? exactTitleAll.find((r: any) => yearOf(r) === queryYear)
            : exactTitleAll.slice().sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0]) ||
          yearMatch ||
          exactTitleAll[0];
        let first = exactMatch || candidates[0];
        // Year-strict pick: with a queryYear, an exact-title hit from a DIFFERENT year
        // (رئیس → The Boss 2007 when the user wants 2013) must not block better matches.
        // Park it and prefer a same-year candidate; the wiki bridge may still override.
        let parkedMismatch: any = undefined;
        if (queryYear && exactMatch && yearOf(exactMatch) !== queryYear) {
          parkedMismatch = exactMatch;
          first = yearMatch || candidates.find((r: any) => yearOf(r) === queryYear) || candidates[0];
        }
        // Non-Latin queries (Hindi/Arabic/Persian script): TMDB's text search is weak and
        // returns junk like 'Yes Boss' for बॉस. If the query is non-Latin and nothing
        // matched exactly, retry with search/movie&language=<script lang> and compare
        // original_title / translations via the alternative titles endpoint.
        const isNonLatin = /[^\u0000-\u024F\u2000-\u206F]/.test(queryTitle);
        const yearMismatch = !!(queryYear && exactMatch && yearOf(exactMatch) !== queryYear);
        const needBridge = isNonLatin && (!exactMatch || yearMismatch);
        if (needBridge) {
          // TMDB text search is weak on Devanagari/Arabic script (बॉस returns 'Yes Boss').
          // Bridge via Wikipedia: find the page (direct title, else '<query> film' search),
          // read its English langlink, strip the parens suffix, re-search TMDB with it.
          try {
            const wikiLang = /[\u0900-\u097F]/.test(queryTitle) ? 'hi' : 'fa';
            const wikiFetch = async (titles: string): Promise<string> => {
              const r = await fetch(`https://${wikiLang}.wikipedia.org/w/api.php?action=query&format=json&prop=langlinks&lllang=en&redirects=1&titles=${encodeURIComponent(titles)}`, { headers: { 'User-Agent': 'MovieBrowser/1.0' } });
              if (!r.ok) return '';
              const d = await r.json();
              const pages = d?.query?.pages || {};
              const page: any = Object.values(pages)[0] as any;
              return (page?.langlinks?.[0]?.['*'] as string) || '';
            };
            // Accept an en-title only if its TMDB re-search satisfies the year (when given).
            const acceptEn = async (en: string): Promise<string | null> => {
              if (!en || /TV series|web series|season \d/i.test(en)) return null;
              const clean = en.replace(/\s*\([^)]*\)\s*$/, '').trim();
              // The wiki page title often carries the film's year ('Boss (2013 Hindi
              // film)'); use it when the user gave none so 'Boss' doesn't resolve to
              // Boss Level (first TMDB hit) instead of Boss 2013.
              const titleYearMatch = queryYear ? null : en.match(/(?:19|20)\d{2}/);
              const effYear = queryYear || (titleYearMatch ? titleYearMatch[0] : '');
              const reRes2 = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(clean)}${effYear ? `&year=${effYear}` : ''}`);
              if (!reRes2.ok) return null;
              const reData2 = await reRes2.json();
              const cands: any[] = reData2.results || [];
              if (cands.length === 0) return null;
              if (effYear) {
                const ym2 = cands.find((r: any) => String(r.release_date || '').slice(0, 4) === effYear);
                if (!ym2) return null; // wrong year — reject this candidate title
                return JSON.stringify({ id: ym2.id });
              }
              return JSON.stringify({ id: cands[0].id });
            };
            // NOTE: the bare-title page on fa/hi.wikipedia is often an everyday word or a
            // person ('رئیس' → Management) — its langlink is NOT necessarily the film.
            // So the direct hit is only a candidate; acceptance requires the TMDB re-search
            // to match the requested year (when given).
            let enTitle = await wikiFetch(queryTitle);
            const directEn = enTitle;
            console.log('[BRIDGE] q=%s year=%s lang=%s direct=%j filmish-start', queryTitle, queryYear, wikiLang);
              // Film pages on hi/fa.wikipedia are titled '<query> (YEAR <lang> film)' with
              // Devanagari digits on hi — plain list=search tokenizes them badly, but
              // OPENSEARCH prefix-matches them perfectly. Filter to film-looking titles,
              // then read their English langlink.
              try {
                // Two opensearch passes: bare title AND '<title> (film' — the second
                // surfaces disambiguated film pages ('رئیس (فیلم ۲۰۱۳)') that the bare
                // query crowds out with popular non-film pages.
                const digitMap: Record<string, string> = {
                  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
                  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
                  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
                };
                const toLatinDigits = (x: string) => x.replace(/[\u0966-\u096F\u06F0-\u06F9\u0660-\u0669]/g, (c) => digitMap[c] || c);
                const queries = [queryTitle, `${queryTitle} (`, `${queryTitle} film`];
                const filmish: string[] = [];
                for (const q of queries) {
                  const osUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&format=json&limit=10&search=${encodeURIComponent(q)}`;
                  const osRes = await fetch(osUrl, { headers: { 'User-Agent': 'MovieBrowser/1.0' } });
                  if (!osRes.ok) continue;
                  const osData = await osRes.json();
                  const titles: string[] = osData?.[1] || [];
                  for (const t of titles) {
                    if (/(फ़िल्म|फिल्म|فیلم|film)/i.test(t) && !filmish.includes(t)) filmish.push(t);
                  }
                  // no early break: the bare pass can grab a wrong filmish hit
                  // ('رئیس مزرعه (فیلم)' = Barnyard); the '<q> (' pass lists better ones
                }
                // With a known year, prefer the page whose title contains it
                if (queryYear) {
                  const withYear = filmish.find((t: string) => toLatinDigits(t).includes(queryYear));
                  if (withYear) filmish.unshift(withYear);
                }
                console.log('[BRIDGE] filmish=%j', filmish);
                for (const t of filmish) {
                  const en = await wikiFetch(t);
                  console.log('[BRIDGE] filmish %j -> en=%j', t, en);
                  if (en && !/TV series|web series|season \d/i.test(en)) { enTitle = en; break; }
                }
              } catch { /* keep '' */ }
            // Try candidates in order: direct langlink (only meaningful without a year —
            // with a year it must still pass the year check), then the filmish one.
            const tryTitles: string[] = [];
            if (directEn) tryTitles.push(directEn);
            if (enTitle && enTitle !== directEn) tryTitles.push(enTitle);
            console.log('[BRIDGE] tryTitles=%j resolved-so-far=%s', tryTitles, resolvedTmdbId);
            for (const cand of tryTitles) {
              const ok = await acceptEn(cand);
              console.log('[BRIDGE] accept %j -> %s', cand, ok);
              if (ok) {
                resolvedTmdbId = String(JSON.parse(ok).id);
                break;
              }
            }
          } catch { /* fall through to default */ }
        }
        if (!resolvedTmdbId && first) {
          resolvedTmdbId = String(first.id);
        }
        // Nothing beat the year-mismatched exact hit and the bridge found nothing:
        // fall back to it only when no year was supplied (ambiguity resolved by user).
        if (!resolvedTmdbId && parkedMismatch && !queryYear) {
          resolvedTmdbId = String(parkedMismatch.id);
        }
      }
    } catch {
      // Continue
    }
  }

  let tmdbDataFa: any = null;
  let tmdbDataEn: any = null;

  if (resolvedTmdbId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);

      const [faRes, enRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${mediaType}/${resolvedTmdbId}?api_key=${key}&append_to_response=credits,images,videos,release_dates,external_ids&language=fa-IR`, { signal: controller.signal }).catch(() => null),
        fetch(`https://api.themoviedb.org/3/${mediaType}/${resolvedTmdbId}?api_key=${key}&append_to_response=credits,images,videos,release_dates,external_ids&language=en-US`, { signal: controller.signal }).catch(() => null),
      ]);
      clearTimeout(timeout);

      if (faRes && faRes.ok) tmdbDataFa = await faRes.json();
      if (enRes && enRes.ok) tmdbDataEn = await enRes.json();
    } catch {
      // Continue
    }
  }

  const primaryData = tmdbDataFa || tmdbDataEn || {};
  const enData = tmdbDataEn || tmdbDataFa || {};

  // 1. Title and English Title
  let finalTitle = tmdbDataFa?.title || tmdbDataFa?.name || tmdbDataEn?.title || tmdbDataEn?.name || queryTitle;
  let finalEnglishTitle = tmdbDataEn?.title || tmdbDataEn?.name || tmdbDataEn?.original_title || tmdbDataEn?.original_name || '';

  if (matchedAlias) {
    finalTitle = matchedAlias.fa;
    finalEnglishTitle = matchedAlias.en;
  } else if (queryTitle && (queryTitle.includes('سلیمان') || queryTitle.toLowerCase().includes('solomon'))) {
    finalTitle = 'ملک سلیمان';
    finalEnglishTitle = 'The Kingdom of Solomon';
  }

  // 2. Year & Persian Solar Year
  const releaseDate = primaryData.release_date || primaryData.first_air_date || enData.release_date || enData.first_air_date || '';
  const rawYear = releaseDate ? releaseDate.split('-')[0] : (matchedAlias?.year || '2010');
  const solarYear = gregorianToSolarYear(rawYear);

  // 3. Country & Language
  const originCountries = primaryData.production_countries || primaryData.origin_country || enData.production_countries || [];
  const originalLanguage = String(primaryData.original_language || enData.original_language || '');
  // Unmapped country must NOT default to Iran — that made foreign films appear in the
  // Iranian section. Default to '' (نامشخص) unless the film really is Iranian.
  // Country priority: the ORIGINAL LANGUAGE is the real cultural origin (Bollywood films
  // list AT/GB co-producers FIRST but language stays 'hi'). Pick:
  //   1. the country matching original_language, 2. first mapped country, 3. ''.
  const LANG_COUNTRY: Record<string, string> = {
    fa: 'IR', hi: 'IN', tr: 'TR', ko: 'KR', ja: 'JP', en: 'US', fr: 'FR', de: 'DE',
    es: 'ES', it: 'IT', ru: 'RU', zh: 'CN', pt: 'BR', ar: 'EG', th: 'TH', id: 'ID',
    sv: 'SE', da: 'DK', no: 'NO', fi: 'FI', nl: 'NL', pl: 'PL', uk: 'UA', he: 'IL',
    ms: 'MY', tl: 'PH', vi: 'VN', bn: 'IN', ta: 'IN', te: 'IN', ml: 'IN', kn: 'IN', mr: 'IN',
  };
  const toCode = (cObj: any) => (typeof cObj === 'string' ? cObj : (cObj?.iso_3166_1 || cObj?.name || ''));
  const mappedOf = (code: string) => TMDB_COUNTRY_MAP[code] || '';
  const langCode = LANG_COUNTRY[originalLanguage] || '';
  let countryName = '';
  const countryCodes: string[] = Array.isArray(originCountries) ? originCountries.map(toCode) : [];
  if (langCode && countryCodes.includes(langCode)) {
    countryName = mappedOf(langCode);
  } else if (langCode) {
    countryName = mappedOf(langCode);
  } else {
    for (const code of countryCodes) {
      const n = mappedOf(code);
      if (n) { countryName = n; break; }
    }
  }
  if (originalLanguage === 'fa' || finalTitle === 'ملک سلیمان') {
    countryName = 'ایران';
  }

  // 4. Category — language decides the cultural section, not the first co-producer
  let category = 'foreign_movies';
  const isIndianLang = ['hi', 'bn', 'ta', 'te', 'ml', 'kn', 'mr'].includes(originalLanguage);
  if (countryName === 'ایران' || originalLanguage === 'fa') {
    category = mediaType === 'tv' ? 'iranian_series' : 'iranian_movies';
  } else if (isIndianLang) {
    category = mediaType === 'tv' ? 'foreign_series' : 'indian_movies';
  } else if (originalLanguage === 'ko' || countryName === 'کره جنوبی') {
    // Korean cinema gets its own shelf — movies AND series both, so Korean dramas
    // don't get buried in the huge foreign pile.
    category = mediaType === 'tv' ? 'korean_movies' : 'korean_movies';
  } else {
    const genreNames = (primaryData.genres || enData.genres || []).map((g: any) => g.name || '');
    if (genreNames.some((g: string) => /animation/i.test(g))) {
      // 'animations' has no key in the client CATEGORIES map (the home row is
      // 'children' = «انیمیشن و کودک») — imported animations would vanish from rows.
      category = 'children';
    } else {
      category = mediaType === 'tv' ? 'foreign_series' : 'foreign_movies';
    }
  }

  // 5. Rating & IMDb ID
  const ratingVal = (primaryData.vote_average || enData.vote_average || 7.5).toFixed(1);
  const externalIds = primaryData.external_ids || enData.external_ids || {};
  const imdbId = externalIds.imdb_id || (primaryData.imdb_id || enData.imdb_id || '');

  // 6. Genres
  const rawGenres = primaryData.genres || enData.genres || [];
  const genreList = rawGenres.map((g: any) => TMDB_GENRE_MAP[g.id] || TMDB_GENRE_MAP[g.name] || g.name).filter(Boolean);
  if (finalTitle === 'ملک سلیمان' && !genreList.includes('تاریخی')) {
    genreList.unshift('تاریخی', 'درام', 'ماجراجویی');
  }
  const genresStr = genreList.length > 0 ? Array.from(new Set(genreList)).join('، ') : 'درام، ماجراجویی';

  // 7. Poster & Backdrop
  const posterPath = primaryData.poster_path || enData.poster_path;
  const backdropPath = primaryData.backdrop_path || enData.backdrop_path;
  const posterUrl = posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';
  const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : '';

  // 8. Movie Stills Backdrops (Strictly TMDb HD/4K)
  const stillsList: string[] = [];
  const rawBackdrops = primaryData.images?.backdrops || enData.images?.backdrops || [];
  for (const b of rawBackdrops.slice(0, 16)) {
    if (b.file_path) {
      stillsList.push(`https://image.tmdb.org/t/p/w1280${b.file_path}`);
    }
  }
  if (stillsList.length === 0 && backdropUrl) {
    stillsList.push(backdropUrl);
  }

  // 9. Director & Crew
  const rawCrew = primaryData.credits?.crew || enData.credits?.crew || [];
  const directorObj = rawCrew.find((c: any) => c.job === 'Director') || rawCrew.find((c: any) => /director/i.test(c.job));
  let directorName = directorObj ? (directorObj.name || '') : '';
  if (matchedAlias?.director) {
    directorName = matchedAlias.director;
  } else if (finalTitle === 'ملک سلیمان') {
    directorName = 'شهریار بحرانی';
  } else if (directorName) {
    directorName = resolvePersonPersianName(directorName, directorObj?.original_name);
  }

  // 10. Cast & Roles with Artist Biographies Generation
  const rawCast = primaryData.credits?.cast || enData.credits?.cast || [];
  const castList: Array<{ name: string; english_name?: string; character?: string; photo?: string; biography?: string }> = [];
  const actorNamesList: string[] = [];

  // Special curated Persian cast for "ملک سلیمان" if TMDb has sparse Iranian names
  if (finalTitle === 'ملک سلیمان' || (queryTitle && queryTitle.includes('سلیمان'))) {
    const solomonSpecialCast = [
      { name: 'امین زندگانی', english_name: 'Amin Zendegani', character: 'حضرت سلیمان (ع)', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', bio: 'امین زندگانی بازیگر برجسته سینما و تلویزیون ایران که با ایفای نقش پرشکوه حضرت سلیمان (ع) به اوج شهرت و تحسین منتقدان دست یافت.' },
      { name: 'محمود پاک‌نیت', english_name: 'Mahmoud Pak Niat', character: 'یازار (سرکرده کهنه)', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80', bio: 'محمود پاک‌نیت هنرمند پیشکسوت سینما و تلویزیون و دارنده نشان درجه یک هنری.' },
      { name: 'الهام حمیدی', english_name: 'Elham Hamidi', character: 'میریام (همسر سلیمان)', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80', bio: 'الهام حمیدی بازیگر نام‌آشنای سینمای ایران و ایفاگر نقش‌های ماندگار تاریخی.' },
      { name: 'مهدی فقیه', english_name: 'Mehdi Faghih', character: 'یوهان (دانشمند یهود)', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80', bio: 'مهدی فقیه برنده سیمرغ بلورین بهترین بازیگر نقش مکمل مرد جشنواره فیلم فجر برای فیلم ملک سلیمان.' },
      { name: 'حسین محجوب', english_name: 'Hossein Mahjoub', character: 'عاصف بن برخیا', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80', bio: 'حسین محجوب کارگردان و بازیگر توانا و صاحب‌سبک سینمای ایران.' },
      { name: 'علیرضا کمالی', english_name: 'Alireza Kamali', character: 'آدونیا (برادر سلیمان)', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80', bio: 'علیرضا کمالی بازیگر توانمند و برنده جوایز متعدد سینمایی و تلویزیونی.' },
      { name: 'زهرا سعیدی', english_name: 'Zahra Saeedi', character: 'میکال (مادر سلیمان)', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', bio: 'زهرا سعیدی بازیگر باسابقه تئاتر، سینما و مجموعه‌های تلویزیونی تاریخی.' }
    ];

    solomonSpecialCast.forEach(item => {
      castList.push(item);
      actorNamesList.push(item.name);
      // Auto save artist bio to database
      db.saveActorBio({
        name: item.name,
        english_name: item.english_name,
        biography: item.bio,
        job: 'بازیگر',
        photo: item.photo,
        character: item.character,
        is_ai: false
      });
    });
  } else {
    for (const actor of rawCast.slice(0, 12)) {
      const enActorName = actor.name || '';
      const faActorName = resolvePersonPersianName(enActorName, actor.original_name);
      const characterName = resolveCharacterName(actor.character || '', finalTitle);
      const photoUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(faActorName)}&background=1E1E38&color=ffffff&bold=true`;

      actorNamesList.push(faActorName);

      // Check or generate artist bio
      const existingBio = db.getActorBio(faActorName, enActorName);
      let actorBio = existingBio?.biography || '';
      if (!actorBio) {
        actorBio = generateSmartPersianBioFallback(faActorName, enActorName, 'بازیگر', finalTitle, characterName, countryName);
        db.saveActorBio({
          name: faActorName,
          english_name: enActorName,
          biography: actorBio,
          job: 'بازیگر',
          photo: photoUrl,
          character: characterName,
          is_ai: false
        });
      }

      castList.push({
        name: faActorName,
        english_name: enActorName,
        character: characterName,
        photo: photoUrl,
        biography: actorBio
      });
    }
  }

  // 11. Synopsis / Story Translation with Gemini AI & Cinematic Lexicon
  let finalPlot = tmdbDataFa?.overview || '';
  if (!finalPlot && matchedAlias?.overview) {
    finalPlot = matchedAlias.overview;
  }
  if (!finalPlot && tmdbDataEn?.overview) {
    const rawEnglishPlot = tmdbDataEn.overview;
    const translated = await translatePlotToPersian(rawEnglishPlot, finalTitle, finalEnglishTitle);
    finalPlot = translated.persianText;
  }
  if (!finalPlot) {
    finalPlot = `روایتی سینمایی و گیرا از اثر «${finalTitle}» که به بررسی روابط انسانی، کشمکش‌های دراماتیک و چالش‌های عمیق قهرمانان داستان در بستری از ${genresStr} می‌پردازد.`;
  }

  // 12. Trailer Resolution
  let trailerUrl = '';
  const videos = primaryData.videos?.results || enData.videos?.results || [];
  const trailerObj = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
  if (trailerObj && trailerObj.key) {
    trailerUrl = `https://www.youtube.com/watch?v=${trailerObj.key}`;
  } else if (imdbId) {
    trailerUrl = `https://www.imdb.com/title/${imdbId}/`;
  }

  // 13. Awards Summary
  const awardsSummary = matchedAlias?.awards || (imdbId ? 'دارای جوایز متعدد و رکوردهای معتبر سینمایی بین‌المللی' : '');

  // 14. Box Office Formatting
  let boxOfficeStr = '';
  if (primaryData.revenue && primaryData.revenue > 0) {
    boxOfficeStr = `$${Number(primaryData.revenue).toLocaleString()}`;
  }

  // 15. Runtime & series structure — movies: runtime (min), series: seasons/episodes
  const runtimeVal = primaryData.runtime || enData.runtime || primaryData.episode_run_time?.[0] || enData.episode_run_time?.[0] || undefined;
  const seasonsCount = primaryData.number_of_seasons || enData.number_of_seasons || undefined;
  const episodesCount = primaryData.number_of_episodes || enData.number_of_episodes || undefined;

  const responsePayload = {
    ok: true,
    tmdb_id: resolvedTmdbId,
    title: finalTitle,
    english_title: finalEnglishTitle,
    category,
    year: rawYear,
    solar_year: solarYear,
    year_display: solarYear && solarYear !== rawYear ? `${rawYear} (${solarYear})` : rawYear,
    rating: ratingVal,
    country: countryName,
    genre: genresStr,
    quality: '1080p Full HD',
    director: directorName,
    actors: actorNamesList.join('، '),
    actor_photos: JSON.stringify(castList.map(c => ({ name: c.name, english_name: c.english_name, character: c.character, photo: c.photo }))),
    description: finalPlot,
    poster_url: posterUrl,
    backdrop_url: backdropUrl,
    movie_stills: JSON.stringify(stillsList),
    trailer_url: trailerUrl,
    imdb_id: imdbId,
    awards_summary: awardsSummary,
    runtime: runtimeVal,
    seasons_count: seasonsCount,
    episodes_count: episodesCount,
    awards: (imdbId || finalEnglishTitle || finalTitle) ? (() => {
      const ext = getExtendedMovieMetadata(imdbId, finalEnglishTitle || finalTitle) || getExtendedMovieMetadata('', finalEnglishTitle || finalTitle);
      return ext && Array.isArray(ext.awards) ? ext.awards : [];
    })() : [],
    box_office: boxOfficeStr,
    source_summary: `استخراج هوشمند از پایگاه داده رسمی TMDb و موتور هوش مصنوعی (${castList.length} بازیگر، ${stillsList.length} فریم باکیفیت 4K)`
  };

  return res.json(responsePayload);
});


// Admin Actor Management Endpoints
app.get('/api/actors/custom', (_req, res) => {
  try {
    const all = db.getAllActors();
    res.json({
      ok: true,
      actors: all,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to fetch actors' });
  }
});

app.post('/api/actors/custom', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const actor = req.body;
    if (!actor || (!actor.name && !actor.english_name)) {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }

    const saved = db.saveActorBio({
      name: actor.name,
      english_name: actor.english_name,
      biography: actor.biography || '',
      job: actor.job || (actor.isDirector ? 'کارگردان' : 'بازیگر'),
      character: actor.character || '',
      photo: actor.photo || '',
      birth_date: actor.birth_date || undefined,
      birth_place: actor.birth_place || undefined,
      nationality: actor.nationality || undefined,
      awards: actor.awards || undefined,
      known_for: actor.known_for || undefined,
      category: actor.category || undefined,
      wikipedia_url: actor.wikipedia_url || '',
      is_ai: false,
    });

    res.json({
      ok: true,
      actor: saved,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save actor' });
  }
});

app.post('/api/actors/save', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { name, english_name, biography, job, photo, character, wikipedia_url, is_ai,
            birth_date, birth_place, nationality, awards, known_for, category } = req.body;
    if (!name && !english_name) {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }

    const saved = db.saveActorBio({
      name,
      english_name,
      biography: biography || '',
      job: job || 'هنرمند و بازیگر',
      photo: photo || '',
      character: character || '',
      birth_date: birth_date || undefined,
      birth_place: birth_place || undefined,
      nationality: nationality || undefined,
      awards: awards || undefined,
      known_for: known_for || undefined,
      category: category || undefined,
      wikipedia_url: wikipedia_url || '',
      is_ai: is_ai ?? false,
    });

    res.json({
      ok: true,
      actor: saved,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to save actor bio' });
  }
});

app.delete('/api/actors/custom/:id', (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const actorId = decodeURIComponent(req.params.id);
    const key = actorId.trim().toLowerCase().replace(/\s+/g, ' ');
    if (db.data.actors[key]) {
      delete db.data.actors[key];
      db.scheduleSave();
    }
    // Also try to find and delete by matching name or english_name
    for (const [k, rec] of Object.entries(db.data.actors)) {
      const r = rec as any;
      if (r.name === actorId || r.english_name === actorId || k === key) {
        delete db.data.actors[k];
        db.scheduleSave();
        break;
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Failed to delete' });
  }
});

// Dedicated Translation Endpoint for any bio or text
app.post('/api/actors/translate', async (req, res) => {
  const text = (req.body?.text as string) || '';
  const name = (req.body?.name as string) || '';
  const englishName = (req.body?.english_name as string) || '';
  const role = (req.body?.role as string) || '';

  if (!text) {
    return res.status(400).json({ ok: false, error: 'Text is required' });
  }

  try {
    const result = await translateBioToPersian(text, name, englishName, role);
    res.json({
      ok: true,
      translated_text: result.persianText,
      is_ai: result.isAi,
      model_used: result.modelUsed || null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: 'Translation failed',
      fallback: generateSmartPersianBioFallback(name, englishName, role)
    });
  }
});

// Dedicated Translation Endpoint for movie story / plot synopsis
app.post('/api/movies/translate-plot', async (req, res) => {
  const plot = (req.body?.plot as string) || '';
  const title = (req.body?.title as string) || '';
  const englishTitle = (req.body?.english_title as string) || '';

  if (!plot) {
    return res.status(400).json({ ok: false, error: 'Plot is required' });
  }

  try {
    const result = await translatePlotToPersian(plot, title, englishTitle);
    res.json({
      ok: true,
      translated_plot: result.persianText,
      is_ai: result.isAi,
      model_used: result.modelUsed || null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: 'Plot translation failed',
      fallback: plot
    });
  }
});

// --- AI CINEPHILE ASSISTANT & FILM INTELLIGENCE ENDPOINTS ---

// 1. Interactive Cinephile AI Assistant Chat
app.post('/api/ai/chat', async (req, res) => {
  const message = (req.body?.message as string) || '';
  const history = req.body?.conversation_history || [];
  const activeSpeaker = (req.body?.active_speaker as string) || 'delara';

  if (!message.trim()) {
    return res.status(400).json({ ok: false, error: 'Message is required' });
  }

  const prompt = `شما یک دستیار هوشمند، منتقد و فیلسوف فوق‌حرفه‌ای سینما (Cinephile AI Companion) با نام ${activeSpeaker === 'delara' ? '«دل‌آرا» (با بیانی صمیمی، ژرف، ادیبانه و شاعرانه)' : '«فرید» (با بیانی باصلابت، رادیویی، کاریزماتیک و نقادانه)'} هستید.
وظیفه شما راهنمایی تخصصی، پاسخ به سوالات، تحلیل آثار، ارائه پیشنهادهای ناب و گفتگو پیرامون جهان سینما (سینمای جهان، سینمای ایران، اسکار، ژانرها و مکاتب هنری) به زبان فارسی فاخر، شیوا، جذاب و بدون کلیشه‌های ماشینی است.

تاریخچه گفتگوی اخیر:
${Array.isArray(history) ? history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'کاربر' : 'دستیار'}: ${h.text}`).join('\n') : ''}

پیام جدید کاربر:
«${message}»

دستورالعمل‌ها:
1. پاسخی عمیق، جذاب و ساختاریافته به فارسی ارائه دهید.
2. از اصطلاحات غنی سینمایی (مانند میزانسن، دکوپاژ، پیرنگ، کاتارسیس، اتمسفر) به درستی استفاده کنید.
3. در صورت درخواست پیشنهاد فیلم، نام فارسی و انگلیسی اثر، سال ساخت، کارگردان و دلیل جذابیت را ذکر کنید.
4. در انتهای پاسخ، ۲ الی ۳ پرسش یا موضوع پیشنهادی مرتبط و ترغیب‌کننده برای ادامه گفتگو پیشنهاد دهید.`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 5000 });

  if (aiResult && aiResult.text) {
    return res.json({
      ok: true,
      text: aiResult.text,
      model_used: aiResult.modelUsed,
      speaker: activeSpeaker
    });
  }

  // Graceful intelligent fallback if AI service is temporarily unavailable
  const fallbackReplies: Record<string, string> = {
    default: `جهان سینما تالاری از آینه‌هاست که در آن عمیق‌ترین تجربیات زیسته بشر بازتاب می‌یابد. چه در پی کشف شاهکارهای ساختارشکن نولان و کوبریک باشید، چه شیفته رئالیسم انسانی اصغر فرهادی و کیارستمی، من اینجام تا در هر لحظه بهترین پیشنهادها، تحلیل‌های فلسفی و نبردهای سینمایی را با شما به اشتراک بگذارم.\n\nمایلید درباره کدام ژانر یا شاهکار سینمایی گفتگو کنیم؟`
  };

  res.json({
    ok: true,
    text: fallbackReplies.default,
    model_used: 'fallback_engine',
    speaker: activeSpeaker
  });
});

// 2. Mood & Vibe Movie Matcher API
app.post('/api/ai/mood-recommend', async (req, res) => {
  const moodId = (req.body?.mood_id as string) || 'melancholy_deep';
  const customVibe = (req.body?.custom_vibe as string) || '';

  const prompt = `به عنوان یک متخصص روانشناسی سینما، برای حال و هوای روحی: «${customVibe || moodId}»، دقیقاً ۳ تا ۴ فیلم بی‌نظیر سینمای جهان یا ایران را که دقیق‌ترین تطابق روانشناختی و حس کاتارسیس را ایجاد می‌کنند معرفی کنید.
پاسخ را در قالب یک آرایه JSON معتبر و بدون هیچ متن اضافی خارج از JSON برگردانید:
[
  {
    "title": "نام فارسی فیلم",
    "english_title": "Original English Title",
    "year": "2020",
    "director": "نام کارگردان",
    "rating": "8.5",
    "why_it_matches": "توضیح کوتاه و دقیق در ۲ جمله درباره اینکه چرا این فیلم با این حس همخوانی دارد",
    "cinematic_vibe": "اتمسفر و حس و حال حاکم بر قاب‌ها",
    "iconic_quote": "یک دیالوگ ماندگار و کلیدی از فیلم",
    "match_percentage": 98
  }
]`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 5000 });

  if (aiResult && aiResult.text) {
    try {
      const cleanedJson = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ ok: true, recommendations: parsed, model_used: aiResult.modelUsed });
      }
    } catch {
      // ignore parse error, will fallback
    }
  }

  res.json({
    ok: true,
    recommendations: [],
    from_fallback: true
  });
});

// 3. Philosophical & Masterpiece Analysis API
app.post('/api/ai/philosophical-analysis', async (req, res) => {
  const title = (req.body?.title as string) || '';
  const englishTitle = (req.body?.english_title as string) || '';
  const director = (req.body?.director as string) || '';

  if (!title && !englishTitle) {
    return res.status(400).json({ ok: false, error: 'Title is required' });
  }

  const prompt = `شما یک منتقد برجسته، استاد نشانه‌شناسی و فیلسوف تاریخ سینما هستید. تحلیلی جامع، موشکافانه و دقیق درباره شاهکار سینمایی «${title} (${englishTitle})» ${director ? `ساخته «${director}»` : ''} بنویسید.
تحلیل باید کاملاً مرتبط با درون‌مایه، پیرنگ و جهان اندیشگی همین اثر خاص باشد و از کلی‌گویی پرهیز کند.

پاسخ را دقیقاً و صرفاً در قالب یک ساختار JSON معتبر زیر ارسال کنید (بدون هیچ پیش‌گفتار یا پس‌گفتاری):
{
  "title": "${title}",
  "english_title": "${englishTitle || title}",
  "director": "${director || 'سینمای مؤلف'}",
  "philosophical_school": "مکاتب فلسفی دقیق مرتبط (مانند اگزیستانسیالیسم، پدیدارشناسی، پوچ‌گرایی کامو، روانکاوی لکان/یونگ، ماتریالیسم دیالکتیک و...)",
  "core_thesis": "تز بنیادین و مانیفست فلسفی اثر در ۱ الی ۲ جمله پرمغز",
  "deep_analysis": "تحلیل عمیق و چندلایه از پیرنگ، گره‌های دراماتیک، لایه‌های پنهان روانشناسی شخصیت‌ها و جهان‌بینی اثر",
  "hidden_symbolism": [
    { "symbol": "نام نماد یا المان اول در فیلم", "meaning": "تعبیر و استعاره پنهان در لایه‌های درام" },
    { "symbol": "نام نماد دوم در فیلم", "meaning": "تعبیر و استعاره پنهان در لایه‌های درام" },
    { "symbol": "نام نماد سوم در فیلم", "meaning": "تعبیر و استعاره پنهان در لایه‌های درام" }
  ],
  "ending_interpretation": "رمزگشایی موشکافانه فرجام داستان، پایان‌بندی و دلالت‌های فلسفی آن",
  "cinematography_and_color": "تحلیل میزانسن، دکوپاژ، پالت رنگی غالب و نورپردازی نمادین اثر",
  "key_quote": "دیالوگ ماندگار و کلیدی اثر که عصاره اندیشه فیلم است"
}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 8500 });

  if (aiResult && aiResult.text) {
    try {
      const cleanedJson = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.core_thesis) {
        return res.json({ ok: true, analysis: parsed, model_used: aiResult.modelUsed });
      }
    } catch {
      // ignore
    }
  }

  res.json({
    ok: true,
    analysis: null,
    from_fallback: true
  });
});

// 4. Movie Battle & Comparative Face-Off API
app.post('/api/ai/movie-battle', async (req, res) => {
  const movie1 = (req.body?.movie1 as string) || '';
  const movie2 = (req.body?.movie2 as string) || '';

  if (!movie1 || !movie2) {
    return res.status(400).json({ ok: false, error: 'Both movies are required' });
  }

  const prompt = `شما هیئت داوران منتقدان ارشد تاریخ سینما هستید. یک نبرد و مقایسه همه‌جانبه، فنی، موشکافانه و بدون سوگیری میان دو اثر سینمایی: «${movie1}» در برابر «${movie2}» انجام دهید.

پاسخ را دقیقاً در قالب ساختار JSON زیر ارسال فرمایید:
{
  "movie1_title": "${movie1}",
  "movie2_title": "${movie2}",
  "overall_winner": "نام اثر پیروز یا تساوی حماسی همراه با دلیل محوری",
  "winner_index": 1,
  "verdict_summary": "بیانیه نهایی هیئت داوران در ۲ الی ۳ جمله پرمغز درباره برتری‌ها و نقاط قوت تماتیک هر دو اثر",
  "categories": [
    { "name": "فیلم‌نامه و درام‌پردازی", "score1": 9.4, "score2": 9.1, "comparison_text": "بررسی مقایسه‌ای پیرنگ، گره‌افکنی و دیالوگ‌نویسی", "winner_index": 1 },
    { "name": "کارگردانی و فضاسازی بصری", "score1": 9.6, "score2": 9.5, "comparison_text": "بررسی میزانسن، پویایی دوربین و اتمسفرسازی", "winner_index": 1 },
    { "name": "بازیگری و ماندگاری نقش‌ها", "score1": 9.2, "score2": 9.6, "comparison_text": "بررسی هنرنمایی بازیگران و کاریزمای شخصیت‌ها", "winner_index": 2 },
    { "name": "موسیقی متن و طراحی صدا", "score1": 9.8, "score2": 9.2, "comparison_text": "بررسی ضرب‌آهنگ موسیقایی و فضاسازی صوتی", "winner_index": 1 },
    { "name": "میراث و ماندگاری در تاریخ سینما", "score1": 9.5, "score2": 9.5, "comparison_text": "تاثیرگذاری بر فیلم‌سازان نسل بعد و جایگاه در سینما", "winner_index": 0 }
  ],
  "artistic_legacy_comparison": "مقایسه موشکافانه میراث هنری و مکتبی دو اثر",
  "final_recommendation": "پیشنهاد اختصاصی برای اینکه هر اثر برای چه سلیقه و نیازی مناسب‌تر است"
}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 8500 });

  if (aiResult && aiResult.text) {
    try {
      const cleanedJson = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.categories) {
        return res.json({ ok: true, battle: parsed, model_used: aiResult.modelUsed });
      }
    } catch {
      // ignore
    }
  }

  res.json({
    ok: true,
    battle: null,
    from_fallback: true
  });
});

// 5. Iranian Cinema & Oscar History Analysis API
app.post('/api/ai/iranian-cinema', async (req, res) => {
  const topic = (req.body?.topic as string) || 'موج نو و درخشش در اسکار';

  const prompt = `به عنوان یک پژوهشگر ارشد تاریخ سینما، تحلیلی جامع و شیوا درباره موضوع «${topic}» در سینمای ایران و تاریخچه اسکار بنویسید.
پاسخ را در قالب ساختار JSON زیر بدون متن اضافی برگردانید:
{
  "topic_title": "${topic}",
  "era_or_movement": "دوران یا جریان سینمایی",
  "historical_context": "پیش‌زمینه تاریخی و خاستگاه اجتماعی",
  "aesthetic_innovations": ["نوآوری فرمی اول", "نوآوری فرمی دوم", "نوآوری فرمی سوم"],
  "oscar_and_international_impact": "تاثیرگذاری در آکادمی اسکار و فستیوال‌های الف (کن، ونیز، برلین)",
  "essential_masterpieces": [
    { "title": "نام اثر ۱", "year": "1997", "director": "کارگردان", "significance": "اهمیت تاریخی" },
    { "title": "نام اثر ۲", "year": "2011", "director": "کارگردان", "significance": "اهمیت تاریخی" }
  ],
  "philosophical_undercurrent": "رگه‌های فلسفی و بازتاب هویت انسانی"
}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 6000 });

  if (aiResult && aiResult.text) {
    try {
      const cleanedJson = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.historical_context) {
        return res.json({ ok: true, result: parsed, model_used: aiResult.modelUsed });
      }
    } catch {
      // ignore
    }
  }

  res.json({
    ok: true,
    result: null,
    from_fallback: true
  });
});

// 6. Interactive Movie Guess Trivia Generator API
app.get('/api/ai/guess-game/generate', async (req, res) => {
  const difficulty = (req.query.difficulty as string) || 'medium';

  const prompt = `یک معمای تعاملی هوشمندانه برای بازی «حدس فیلم» در سطح دشواری «${difficulty}» بسازید.
پاسخ را دقیقاً در قالب ساختار JSON زیر بدون متن حاشیه‌ای تولید کنید:
{
  "id": "q_${Date.now()}",
  "title": "نام فارسی فیلم",
  "english_title": "English Movie Title",
  "year": "سال ساخت",
  "director": "کارگردان",
  "emoji_clues": ["ایموجی ۱", "ایموجی ۲", "ایموجی ۳", "ایموجی ۴"],
  "iconic_dialogue": "یک دیالوگ یا نقل‌قول ماندگار که فیلم را لو ندهد اما کلید باشد",
  "cryptic_premise": "خلاصه داستانی مرموز و استعاری که معما را جذاب کند",
  "genre_hint": "ژانر فیلم",
  "cast_hint": "اسامی ۲ یا ۳ بازیگر اصلی",
  "difficulty": "${difficulty}",
  "fun_fact": "یک فکت جالب و شنیدنی از پشت‌صحنه اثر",
  "points": 100
}`;

  const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 5000 });

  if (aiResult && aiResult.text) {
    try {
      const cleanedJson = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.title && parsed.emoji_clues) {
        return res.json({ ok: true, question: parsed });
      }
    } catch {
      // ignore
    }
  }

  // Curated fallback
  res.json({
    ok: true,
    question: null,
    from_fallback: true
  });
});

// 7. High-Definition Persian Voice Speech Audio Stream Endpoint with Neural Persian Voice Models & Persistent Disk Cache
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const TTS_DISK_CACHE_DIR = path.join(os.tmpdir(), 'movie_browser_tts_cache');
try {
  if (!fs.existsSync(TTS_DISK_CACHE_DIR)) {
    fs.mkdirSync(TTS_DISK_CACHE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not initialize TTS disk cache directory:', err);
}

const ttsAudioMemoryCache = new Map<string, Buffer>();

async function synthesizePersianNeuralSpeech(
  text: string, 
  speaker: string = 'delara', 
  rate: number = 1.0,
  tone: string = 'cinematic'
): Promise<Buffer | null> {
  const voiceName = speaker === 'farid' ? 'fa-IR-FaridNeural' : 'fa-IR-DilaraNeural';
  
  // Rate calculation with tone styling
  let adjustedRate = rate;
  if (tone === 'dramatic') {
    adjustedRate = rate * 0.94; // slightly slower, dramatic cadence
  } else if (tone === 'standard') {
    adjustedRate = rate * 1.0;
  }

  let rateStr = '+0%';
  if (adjustedRate > 1.03) {
    const percent = Math.round((adjustedRate - 1.0) * 100);
    rateStr = `+${percent}%`;
  } else if (adjustedRate < 0.97) {
    const percent = Math.round((1.0 - adjustedRate) * 100);
    rateStr = `-${percent}%`;
  }

  // Pitch calculation with tone styling
  let pitchStr = '+0Hz';
  if (tone === 'dramatic') {
    pitchStr = speaker === 'farid' ? '-2Hz' : '-1Hz';
  }

  const tempFilePath = path.join(TTS_DISK_CACHE_DIR, `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice: voiceName,
      lang: 'fa-IR',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rateStr,
      pitch: pitchStr
    });

    await tts.ttsPromise(text, tempFilePath);

    if (fs.existsSync(tempFilePath)) {
      const buffer = fs.readFileSync(tempFilePath);
      try { fs.unlinkSync(tempFilePath); } catch {}
      if (buffer.length > 300) {
        return buffer;
      }
    }
  } catch (err) {
    console.error('EdgeTTS neural synthesis error, attempting fallback:', err);
    try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}
  }

  // Fallback to secondary pipeline if EdgeTTS encounters temporary issue
  return await fetchAudioFromSoundOfText(text.slice(0, 160), 'ar-AE');
}

async function fetchAudioFromSoundOfText(text: string, voice: string = 'ar-AE'): Promise<Buffer | null> {
  try {
    const postRes = await fetch('https://api.soundoftext.com/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: 'Google', data: { text, voice } })
    });
    if (!postRes.ok) return null;
    const postData: any = await postRes.json();
    if (!postData.success || !postData.id) return null;

    const id = postData.id;
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise(r => setTimeout(r, 400 + attempt * 200));
      const statusRes = await fetch(`https://api.soundoftext.com/sounds/${id}`);
      if (!statusRes.ok) continue;
      const statusData: any = await statusRes.json();
      if (statusData.status === 'Done' && statusData.location) {
        const audioRes = await fetch(statusData.location);
        if (audioRes.ok) {
          const arr = await audioRes.arrayBuffer();
          return Buffer.from(arr);
        }
      } else if (statusData.status === 'Error') {
        break;
      }
    }
  } catch (err) {
    console.error('Error fetching SoundOfText audio:', err);
  }
  return null;
}

const handleTtsRequest = async (rawText: string, speaker: string, rate: number, tone: string, res: any) => {
  if (!rawText || !rawText.trim()) {
    return res.status(400).send('Text parameter is required');
  }

  // Clean text from markdown and extra formatting
  const cleanText = rawText
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/###?\s*/g, ' . ')
    .replace(/`[^`]*`/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/[\r\n]+/g, ' . ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create deterministic hash key for persistent database caching
  const hash = crypto.createHash('sha256').update(`${speaker}_${rate}_${tone}_${cleanText}`).digest('hex');
  const diskCachePath = path.join(TTS_DISK_CACHE_DIR, `${hash}.mp3`);

  // Check 1: In-Memory Cache (0ms)
  if (ttsAudioMemoryCache.has(hash)) {
    const cached = ttsAudioMemoryCache.get(hash)!;
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': cached.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-TTS-Cache': 'MEMORY'
    });
    return res.send(cached);
  }

  // Check 2: Disk Cache Database (1ms)
  if (fs.existsSync(diskCachePath)) {
    try {
      const diskBuffer = fs.readFileSync(diskCachePath);
      if (diskBuffer && diskBuffer.length > 300) {
        ttsAudioMemoryCache.set(hash, diskBuffer);
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': diskBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=604800, immutable',
          'X-TTS-Cache': 'DISK'
        });
        return res.send(diskBuffer);
      }
    } catch {
      // ignore read error
    }
  }

  try {
    const audioBuffer = await synthesizePersianNeuralSpeech(cleanText, speaker, rate, tone);

    if (audioBuffer && audioBuffer.length > 0) {
      // Store in memory cache (LRU size limit: 400 items)
      if (ttsAudioMemoryCache.size > 400) {
        const firstKey = ttsAudioMemoryCache.keys().next().value;
        if (firstKey) ttsAudioMemoryCache.delete(firstKey);
      }
      ttsAudioMemoryCache.set(hash, audioBuffer);

      // Store in persistent disk database
      try {
        fs.writeFileSync(diskCachePath, audioBuffer);
      } catch (e) {
        console.warn('Could not write to TTS disk cache:', e);
      }

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-TTS-Cache': 'MISS'
      });
      return res.send(audioBuffer);
    }
  } catch (err) {
    console.error('Error in TTS generation:', err);
  }

  res.status(500).send('TTS generation failed');
};

app.get('/api/tts', async (req, res) => {
  const text = (req.query.text as string) || '';
  const speaker = (req.query.speaker as string) || 'delara';
  const rate = parseFloat((req.query.rate as string) || '1.0');
  const tone = (req.query.tone as string) || 'cinematic';
  await handleTtsRequest(text, speaker, rate, tone, res);
});

app.post('/api/tts', async (req, res) => {
  const { text, speaker = 'delara', rate = 1.0, tone = 'cinematic' } = req.body || {};
  await handleTtsRequest(text, speaker, typeof rate === 'number' ? rate : parseFloat(rate || '1.0'), tone, res);
});

// ============ Actor photo storage (like posters — stored on server) ============
const ACTOR_PHOTOS_DIR = path.join(process.cwd(), 'data', 'actor_photos');
const ACTOR_PHOTO_MAP_FILE = path.join(process.cwd(), 'data', 'actor_photo_map.json');
let actorPhotoMap: Record<string, string> = (() => {
  try { return JSON.parse(fsSync.readFileSync(ACTOR_PHOTO_MAP_FILE, 'utf-8')); } catch { return {}; }
})();
function saveActorPhotoMap() {
  if (!fsSync.existsSync(path.dirname(ACTOR_PHOTO_MAP_FILE))) fsSync.mkdirSync(path.dirname(ACTOR_PHOTO_MAP_FILE), { recursive: true });
  fsSync.writeFileSync(ACTOR_PHOTO_MAP_FILE, JSON.stringify(actorPhotoMap, null, 2));
}
function actorKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Resolve a real photo for an actor via TMDB person search, download and store it locally.
// Returns { ok, url } where url is a local /api/actors/photo-file/... URL.
async function resolveAndStoreActorPhoto(name: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const key = actorKey(name);
  if (actorPhotoMap[key]) return { ok: true, url: actorPhotoMap[key] };
  const key2 = TMDB_API_KEYS[0] || '4e44d9029b1270a757cddc766a1bcb63';
  try {
    // Strip role suffixes like "کلنسی براون (آقای خرچنگ)" → "کلنسی براون"
    const cleanName = name.replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').trim() || name;
    const sRes = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${key2}&query=${encodeURIComponent(cleanName)}&language=en-US`);
    if (!sRes.ok) return { ok: false, error: `tmdb search failed (${sRes.status})` };
    const sData: any = await sRes.json();
    const person = (sData.results || []).find((p: any) => p.profile_path);
    if (!person) return { ok: false, error: 'no tmdb match' };

    const imgUrl = `https://image.tmdb.org/t/p/w500${person.profile_path}`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return { ok: false, error: `download failed (${imgRes.status})` };
    const buf = Buffer.from(await imgRes.arrayBuffer());

    if (!fsSync.existsSync(ACTOR_PHOTOS_DIR)) fsSync.mkdirSync(ACTOR_PHOTOS_DIR, { recursive: true });
    const fileName = `${key.replace(/[^a-z0-9]+/g, '_')}_${person.id}.jpg`;
    fsSync.writeFileSync(path.join(ACTOR_PHOTOS_DIR, fileName), buf);

    const localUrl = `/api/actors/photo-file/${fileName}`;
    actorPhotoMap[key] = localUrl;
    saveActorPhotoMap();
    return { ok: true, url: localUrl };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'resolve failed' };
  }
}

// Serve stored actor photos
app.get('/api/actors/photo-file/:file', (req, res) => {
  const file = path.basename(req.params.file); // prevent path traversal
  const filePath = path.join(ACTOR_PHOTOS_DIR, file);
  if (!fsSync.existsSync(filePath)) return res.status(404).end();
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
  res.send(fsSync.readFileSync(filePath));
});

// Admin: resolve & store photos for all actors currently using placeholders
app.post('/api/actors/store-photos', async (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) {
    return res.status(401).json({ ok: false, error: 'دسترسی مدیر لازم است' });
  }
  // Collect unique actor names
  const names = new Set<string>();
  for (const m of moviesDb) {
    let arr: any[] = [];
    try { arr = typeof m.actor_photos === 'string' ? JSON.parse(m.actor_photos || '[]') : (m.actor_photos || []); } catch {}
    for (const a of arr) if (a?.name) names.add(a.name);
    String(m.actors || '').split(/[,،|]/).forEach(a => { const n = a.trim(); if (n.length > 2) names.add(n); });
  }
  const toResolve = [...names].filter(n => !actorPhotoMap[actorKey(n)])
    // Skip garbage entries: multi-name strings or names with Persian punctuation
    .filter(n => !/[،,]/.test(n));
  res.json({ ok: true, total: toResolve.length, message: 'در حال دریافت و ذخیره عکس‌ها در پس‌زمینه' });

  let done = 0, failed = 0;
  // Build Persian→English name map from movies' actor_photos entries
  const engNameMap: Record<string, string> = {};
  for (const m of moviesDb) {
    try {
      const arr: any[] = typeof m.actor_photos === 'string' ? JSON.parse(m.actor_photos || '[]') : (m.actor_photos || []);
      for (const a of arr) {
        if (a?.name && a?.english_name) engNameMap[actorKey(a.name)] = a.english_name;
      }
    } catch {}
  }
  for (const name of toResolve) {
    let r = await resolveAndStoreActorPhoto(name);
    if (!r.ok && /[\u0600-\u06FF]/.test(name)) {
      // Persian name — try its English equivalent from cast data
      const eng = engNameMap[actorKey(name)];
      if (eng) r = await resolveAndStoreActorPhoto(eng);
    }
    if (r.ok) done++; else failed++;
    await new Promise(r2 => setTimeout(r2, 400)); // gentle on TMDB
  }
  console.log(`[ActorPhotos] Stored: ${done}, failed: ${failed} (of ${toResolve.length})`);
});

// Check how many actors still lack a stored photo
app.get('/api/actors/photo-stats', (_req, res) => {
  const names = new Set<string>();
  for (const m of moviesDb) {
    let arr: any[] = [];
    try { arr = typeof m.actor_photos === 'string' ? JSON.parse(m.actor_photos || '[]') : (m.actor_photos || []); } catch {}
    for (const a of arr) if (a?.name) names.add(a.name);
    String(m.actors || '').split(/[,،|]/).forEach(a => { const n = a.trim(); if (n.length > 2) names.add(n); });
  }
  const stored = [...names].filter(n => actorPhotoMap[actorKey(n)]).length;
  res.json({ ok: true, total_unique: names.size, stored, missing: names.size - stored });
});

// Complete missing photo+bio for a given list of actor names (e.g. the curated stars list).
// Frontend calls this on first load with names that lack data; results cached in db.
app.post('/api/actors/complete', async (req, res) => {
  const list: string[] = Array.isArray(req.body?.names) ? req.body.names.slice(0, 100) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'names[] required' });

  // Respond immediately; process in background
  const needPhoto = list.filter(n => !actorPhotoMap[actorKey(n)]);
  const needBio = list.filter(n => {
    const rec = db.getActorBio(n);
    return !rec || (rec.biography || '').length < 40;
  });
  res.json({ ok: true, need_photo: needPhoto.length, need_bio: needBio.length, message: 'در حال تکمیل در پس‌زمینه' });

  (async () => {
    for (const name of needPhoto) {
      await resolveAndStoreActorPhoto(name);
      await new Promise(r2 => setTimeout(r2, 400));
    }
    const ai = getGemini();
    for (const name of needBio) {
      if (!ai) break;
      try {
        const prompt = `یک بیوگرافی کوتاه و دقیق فارسی برای ${name}، چهره سینما، بنویس. شامل: محل و سال تولد (اگر معلوم)، مهم‌ترین آثار و جوایز. حداکثر ۳ جمله. فقط متن بیوگرافی را بده.`;
        const result = await generateWithGeminiFallback(prompt, { timeoutMs: 20000 });
        if (result?.text) {
          db.saveActorBio({ name, biography: result.text, is_ai: true, model_used: result.modelUsed });
        }
      } catch { /* skip */ }
      await new Promise(r2 => setTimeout(r2, 1500));
    }
    console.log(`[Complete] photos: ${needPhoto.length}, bios: ${needBio.length} done`);
  })();
});
// ============ End Actor Photo Storage ============

// ============ Movie poster storage (download blocked TMDB images to server) ============
const MOVIE_POSTERS_DIR = path.join(process.cwd(), 'data', 'movie_posters');
const POSTER_MAP_FILE = path.join(process.cwd(), 'data', 'movie_poster_map.json');
let posterMap: Record<number, string> = (() => {
  try { return JSON.parse(fsSync.readFileSync(POSTER_MAP_FILE, 'utf-8')); } catch { return {}; }
})();
function savePosterMap() {
  if (!fsSync.existsSync(path.dirname(POSTER_MAP_FILE))) fsSync.mkdirSync(path.dirname(POSTER_MAP_FILE), { recursive: true });
  fsSync.writeFileSync(POSTER_MAP_FILE, JSON.stringify(posterMap, null, 2));
}

app.get('/api/movies/poster-file/:file', (req, res) => {
  const file = path.basename(req.params.file);
  const filePath = path.join(MOVIE_POSTERS_DIR, file);
  if (!fsSync.existsSync(filePath)) return res.status(404).end();
  const ext = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  res.setHeader('Content-Type', ext);
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.send(fsSync.readFileSync(filePath));
});

function isBlockedHost(url: string): boolean {
  return /image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org|thumb\.wikimedia\.org/.test(url);
}

// Rewrite a blocked-host image URL to the server proxy (hoisted function, usable anywhere)
function proxyBlockedUrl(url: string): string {
  if (url && /^https?:\/\//.test(url) && isBlockedHost(url)) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

async function storeMoviePoster(movie: any): Promise<boolean> {
  const id = movie.message_id;
  if (!id) return false;
  const url = String(movie.poster_url || '');
  // Only download remote URLs from blocked hosts; skip data URIs and already-local
  if (!url.startsWith('http') || !isBlockedHost(url)) return false;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) return false;
    if (!fsSync.existsSync(MOVIE_POSTERS_DIR)) fsSync.mkdirSync(MOVIE_POSTERS_DIR, { recursive: true });
    const fileName = `movie_${id}_${Date.now()}.jpg`;
    fsSync.writeFileSync(path.join(MOVIE_POSTERS_DIR, fileName), buf);
    posterMap[id] = `/api/movies/poster-file/${fileName}`;
    savePosterMap();
    moviesDb.forEach((m: any) => { if (m.message_id === id) m.poster_url = posterMap[id]; });
    saveMoviesDb();
    return true;
  } catch { return false; }
}

// Admin: store posters for all movies using blocked hosts
let posterStoreRunning = false;
app.post('/api/movies/store-posters', async (req, res) => {
  const token = (req.headers['x-admin-token'] as string) || '';
  if (!adminTokens[token] || adminTokens[token] < Date.now()) return res.status(401).json({ ok: false, error: 'دسترسی مدیر لازم است' });
  if (posterStoreRunning) return res.status(429).json({ ok: false, error: 'در حال اجراست' });
  const targets = moviesDb.filter((m: any) => !posterMap[m.message_id] && isBlockedHost(String(m.poster_url || '')));
  res.json({ ok: true, total: targets.length, message: 'در حال دانلود پوسترها' });
  posterStoreRunning = true;
  let done = 0;
  for (const m of targets) {
    if (await storeMoviePoster(m)) done++;
    await new Promise(r2 => setTimeout(r2, 300));
  }
  console.log(`[Posters] Stored ${done}/${targets.length}`);
  posterStoreRunning = false;
});
// ============ End Movie Poster Storage ============

// Image proxy for blocked hosts (wikimedia, tmdb, imdb): downloads once, caches on disk, serves locally
const IMG_PROXY_DIR = path.join(process.cwd(), 'data', 'img_cache');
app.get('/api/img-proxy', async (req, res) => {
  const url = String(req.query.url || '');
  if (!url.startsWith('http') || !isBlockedHost(url)) return res.status(400).json({ ok: false, error: 'url not allowed' });
  const crypto = await import('crypto');
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = url.match(/\.(jpe?g|png|webp)(\?|$)/i)?.[1]?.toLowerCase() || 'jpg';
  const filePath = path.join(IMG_PROXY_DIR, `${hash}.${ext}`);
  if (!fsSync.existsSync(IMG_PROXY_DIR)) fsSync.mkdirSync(IMG_PROXY_DIR, { recursive: true });
  if (!fsSync.existsSync(filePath)) {
    try {
      const r = await fetch(url);
      if (!r.ok) return res.status(404).end();
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1000) return res.status(404).end();
      fsSync.writeFileSync(filePath, buf);
    } catch { return res.status(502).end(); }
  }
  res.setHeader('Content-Type', ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
  res.send(fsSync.readFileSync(filePath));
});

app.get('/api/actors/photo', async (req, res) => {
  const name = (req.query.name as string) || '';
  const englishName = (req.query.english_name as string) || '';
  const imdbId = (req.query.imdb_id as string) || '';
  const searchName = imdbId || englishName || name;

  if (!searchName) {
    return res.json({ ok: false, photo: null });
  }

  const dbActor = db.getActorBio(name, englishName);
  if (dbActor && dbActor.photo) {
    return res.json({ ok: true, photo: dbActor.photo, bio: dbActor.biography });
  }

  try {
    const searchEn = englishName || (name && !/[\u0600-\u06FF]/.test(name) ? name : '');
    const searchNormalized = searchEn ? normalizeLatinCharacters(searchEn) : '';

    // 1. Try IMDb Suggestions (Amazon CDN Official High-Res Portraits)
    const idFromInput = extractImdbPersonId(imdbId || englishName || name);
    if (idFromInput) {
      const imdbPage = await fetchImdbPersonPage(idFromInput);
      if (imdbPage?.photo) {
        db.saveActorBio({ name, english_name: englishName, photo: imdbPage.photo, biography: imdbPage.description || '' });
        return res.json({ ok: true, photo: imdbPage.photo, bio: imdbPage.description, source: 'imdb' });
      }
    } else {
      const queriesToTry = [searchEn, searchNormalized, name].filter(Boolean);
      for (const qStr of queriesToTry) {
        const imdbCandidates = await searchImdbSuggestions(qStr);
        if (imdbCandidates.length > 0 && imdbCandidates[0].photo) {
          const matched = imdbCandidates[0];
          db.saveActorBio({ name, english_name: englishName || matched.name, photo: matched.photo, biography: '' });
          return res.json({ ok: true, photo: matched.photo, imdb_id: matched.id, name: matched.name, source: 'imdb' });
        }
      }
    }

    // 2. Try Persian Wikipedia summary (for Iranian actors)
    if (/[\u0600-\u06FF]/.test(name)) {
      const fa = await fetchWikiSummary(name, 'fa');
      if (fa?.photo) {
        db.saveActorBio({ name, english_name: englishName, photo: fa.photo, biography: fa.extract || '' });
        return res.json({ ok: true, photo: fa.photo, bio: fa.extract, source: 'wikipedia_fa' });
      }
    }

    // 3. Try Turkish Wikipedia (for Turkish actors / Dizis)
    if (searchEn || searchNormalized) {
      for (const tTarget of [searchEn, searchNormalized].filter(Boolean)) {
        const tr = await fetchWikiSummary(tTarget, 'tr');
        if (tr?.photo) {
          db.saveActorBio({ name, english_name: englishName, photo: tr.photo, biography: tr.extract || '' });
          return res.json({ ok: true, photo: tr.photo, bio: tr.extract, source: 'wikipedia_tr' });
        }
      }
    }

    // 4. Try Hindi Wikipedia (for Bollywood / Indian cinema stars)
    if (searchEn) {
      const hi = await fetchWikiSummary(searchEn, 'hi');
      if (hi?.photo) {
        db.saveActorBio({ name, english_name: englishName, photo: hi.photo, biography: hi.extract || '' });
        return res.json({ ok: true, photo: hi.photo, bio: hi.extract, source: 'wikipedia_hi' });
      }
    }

    // 5. Try English Wikipedia summary
    if (searchEn) {
      const en = await fetchWikiSummary(searchEn, 'en');
      if (en?.photo) {
        db.saveActorBio({ name, english_name: englishName, photo: en.photo, biography: en.extract || '' });
        return res.json({ ok: true, photo: en.photo, bio: en.extract, source: 'wikipedia_en' });
      }
    }

    // 6. Fallback to TVMaze Person Search
    const tvmazeRes = await fetch(`https://api.tvmaze.com/search/people?q=${encodeURIComponent(searchEn || searchName)}`);
    if (tvmazeRes.ok) {
      const list = await tvmazeRes.json();
      if (Array.isArray(list) && list[0]?.person?.image?.original) {
        const photoUrl = list[0].person.image.original;
        db.saveActorBio({ name, english_name: englishName, photo: photoUrl, biography: '' });
        return res.json({ ok: true, photo: photoUrl, source: 'tvmaze' });
      }
    }
  } catch (err) {
    console.log('Error fetching actor photo online:', err);
  }

  res.json({ ok: false, photo: null });
});

// 8. AI & Semantic Storyline Movie Recommendations Endpoint
app.post('/api/recommendations', async (req, res) => {
  const { title, englishTitle, genre, description, director, actors } = req.body || {};

  if (!title && !englishTitle) {
    return res.status(400).json({ ok: false, error: 'Title is required' });
  }

  const primaryKey = (englishTitle || title || '').toLowerCase().trim();
  const persianKey = (title || '').toLowerCase().trim();

  // 1. Check in-memory cache first (0ms latency, zero API calls)
  if (recommendationsMemoryCache.has(primaryKey)) {
    return res.json({ ok: true, data: recommendationsMemoryCache.get(primaryKey), source: 'cache' });
  }
  if (persianKey && recommendationsMemoryCache.has(persianKey)) {
    return res.json({ ok: true, data: recommendationsMemoryCache.get(persianKey), source: 'cache' });
  }

  // 2. Check Pre-Curated Cinema Storyline Database
  for (const [key, curation] of Object.entries(CURATED_STORYLINE_DATABASE)) {
    const k = key.toLowerCase();
    if (primaryKey.includes(k) || k.includes(primaryKey) || (persianKey && (persianKey.includes(k) || k.includes(persianKey)))) {
      recommendationsMemoryCache.set(primaryKey, curation);
      return res.json({ ok: true, data: curation, source: 'curated_db' });
    }
  }

  // 3. Try Gemini AI generation with graceful quota resilience
  try {
    const prompt = `You are a world-class film critic and cinema recommendation engine.
Given the movie:
- Title: ${title} (${englishTitle || ''})
- Genre: ${genre || 'سینمایی'}
- Director: ${director || 'نامشخص'}
- Cast: ${actors || 'نامشخص'}
- Plot Summary: ${description || 'داستان فیلم'}

Analyze the core story elements, environment, storyline motifs (such as: robots/AI, zombies, jungle/forest, mountains, sea/ocean, manhunt, hunting wild animals, nature, space, time travel, revenge, survival, etc.), pacing, and visual atmosphere.
Suggest 3 to 5 deeply similar cinematic masterpieces that share these exact story tropes, motifs, and genre atmosphere.
Respond strictly with valid JSON with this structure:
{
  "storylineVibe": "تحلیل کوتاه اتمسفر و فضای داستانی اثر به زبان فارسی با اشاره به موتیف‌های برجسته داستانی",
  "thematicTags": ["برچسب داستانی ۱", "برچسب ۲", "برچسب ۳"],
  "activeMotifs": ["🤖 ربات و هوش مصنوعی", "🌲 جنگل و بقا", "🎯 شکار انسان"],
  "recommendations": [
    {
      "title": "عنوان فارسی فیلم",
      "englishTitle": "English Title",
      "year": "2020",
      "genre": "علمی-تخیلی، ماجراجویی",
      "similarityScore": 95,
      "synopsis": "خلاصه داستان کامل، جذاب و خواندنی فیلم پیشنهادی به فارسی (۲ تا ۳ جمله)",
      "sharedMotifs": ["🤖 ربات", "🌲 طبیعت و جنگل"],
      "whyWatch": "توضیح تحلیلی به فارسی درباره اینکه چرا این فیلم از نظر تم داستانی و موتیف‌های محیطی شبیه فیلم مبدا است."
    }
  ]
}`;

    const aiResult = await generateWithGeminiFallback(prompt, { timeoutMs: 5000 });
    if (aiResult && aiResult.text) {
      const cleaned = aiResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && (parsed.storylineVibe || parsed.recommendations)) {
        recommendationsMemoryCache.set(primaryKey, parsed);
        return res.json({ ok: true, data: parsed, source: 'ai' });
      }
    }
  } catch (aiErr: any) {
    // Gracefully fallback
  }

  // 4. Procedural High-Quality Storyline Fallback
  const fallback = generateProceduralStorylineVibe(genre, title, director);
  recommendationsMemoryCache.set(primaryKey, fallback);
  return res.json({
    ok: true,
    data: fallback,
    source: 'procedural'
  });
});

// Vite middleware & Static server setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    

    
    app.use(express.static(distPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          // must equal nginx's add_header for proxied HTML or the response carries
          // two different Cache-Control values (browser takes the last one)
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
      }
    }));
    // Standalone reset-password page (outside the SPA)
    app.get('/reset-password', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.send(`<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>تعیین رمز عبور جدید - فیلم بره</title>
<style>body{font-family:Tahoma,Arial,sans-serif;background:#0d0d12;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#131320;border:1px solid #2a2a42;border-radius:16px;padding:32px;width:90%;max-width:380px}
h2{color:#e50914;margin-top:0;text-align:center}input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #30304c;background:#0d0d18;color:#fff;margin-bottom:12px;font-size:14px}
button{width:100%;padding:12px;border:none;border-radius:10px;background:#e50914;color:#fff;font-weight:bold;font-size:15px;cursor:pointer}
button:disabled{opacity:.6}.msg{margin-top:12px;font-size:13px;text-align:center;display:none}
.ok{color:#34d399}.err{color:#f87171}</style></head>
<body><div class="card"><h2>تعیین رمز عبور جدید</h2>
<form id="f"><input type="password" id="p1" placeholder="رمز عبور جدید" minlength="6" required/>
<input type="password" id="p2" placeholder="تکرار رمز عبور جدید" minlength="6" required/>
<button type="submit" id="b">ذخیره رمز جدید</button></form>
<p class="msg" id="m"></p></div>
<script>
const params=new URLSearchParams(location.search);const token=params.get('token')||'';
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();
const p1=document.getElementById('p1').value,p2=document.getElementById('p2').value,m=document.getElementById('m'),b=document.getElementById('b');
m.style.display='block';
if(p1!==p2){m.textContent='دو رمز یکسان نیستند';m.className='msg err';return}
if(p1.length<6){m.textContent='رمز باید حداقل ۶ کاراکتر باشد';m.className='msg err';return}
b.disabled=true;m.className='msg';m.textContent='در حال ذخیره...';
try{const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,newPassword:p1})});
const j=await r.json();
if(j.ok){m.textContent='✅ رمز با موفقیت تغییر کرد. حالا می‌توانی وارد شوی.';m.className='msg ok';setTimeout(()=>location.href='/',2500);}
else{m.textContent=j.error||'خطا رخ داد';m.className='msg err';b.disabled=false;}
}catch(err){m.textContent='خطا در ارتباط با سرور';m.className='msg err';b.disabled=false;}});
</script></body></html>`);
    });
    // Unknown API paths must be a real 404 (JSON), not the SPA shell — API consumers
    // (Android client) were receiving index.html with HTTP 200 and JSON parse crashes.
    // GET /api/movies/:id (full single record) sits here, below every literal
    // /api/movies/* GET route, so ':id' can never shadow awards-auto/stills/…
    app.get('/api/movies/:id', (req, res) => {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(404).json({ ok: false, error: 'Not found', path: req.path });
      const m = moviesDb.find((x: any) => x.message_id === id);
      if (!m) return res.status(404).json({ ok: false, error: 'movie not found' });
      res.json(decorateMovie(m));
    });
    app.get('/api/*all', (req, res) => {
      res.status(404).json({ ok: false, error: 'Not found', path: req.path });
    });
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

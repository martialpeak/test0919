import { Movie, ServerCastResponse, ServerTrailerResponse, BoxOfficeEntry, TrackingItem, TrackingRequest, CastMember } from '../types';
import { INITIAL_MOVIES, INITIAL_BOX_OFFICE } from '../data/initialMovies';
import { enrichMovie, generateImdbTrailerUrl, generateYoutubeBackupUrl, fetchAutoTrailerLinks, AutoTrailerResult } from '../utils/movieEnricher';
import { getExtendedMovieMetadata } from '../data/castAndAwardsDatabase';
import { resolveActorPhoto, fetchActorDetailsOnline, fetchActorPhotoOnline, isValidPhotoUrl } from './actorPhotoService';
import { MovieCache } from './movieCache';
import { apiFetch } from './apiFetch';

// Same-origin API: works on the VPS (nginx serves app + API on one domain)
// and on PHP hosts like InfinityFree without any build-time config.
// On InfinityFree the WAF blocks extension-less /api/* URLs, so calls go
// through the front controller: /api/index.php/<route> (set in index.html).
const API_BASE = (window as any).MOVIEBROWSER_API_BASE ?? '';
const BASE_URL = API_BASE;

const STORAGE_KEYS = {
  MOVIES: 'moviebrowser_movies_v1',
  FAVORITES: 'moviebrowser_favorites_v1',
  TRACKING: 'moviebrowser_tracking_v1',
  BOX_OFFICE: 'moviebrowser_boxoffice_v1',
  LAST_SYNC: 'moviebrowser_last_sync',
};

export class MovieService {
  // --- Local Cache Helpers ---
  // The movie list is held in memory and persisted to IndexedDB (see services/movieCache.ts).
  // localStorage only keeps a small boot slice, because at ~4.2KB per movie its ~5MB quota is
  // exhausted around 1200 movies and setItem then throws QuotaExceededError.
  private static memoryMovies: Movie[] | null = null;
  private static hydrated = false;

  private static sanitize(list: Movie[]): Movie[] {
    return list.map(m => {
      let updated = m;
      if (m.actor_photos && m.actor_photos.includes('unsplash.com')) {
        const enriched = enrichMovie({ ...m, actor_photos: undefined });
        updated = { ...m, ...enriched } as Movie;
      }

      // Normalize poster URLs according to the current environment (VPS vs PHP shared hosting)
      if (updated.poster_url) {
        let p = updated.poster_url;
        if (API_BASE) {
          // If on PHP host requiring prefix (API_BASE === '/api/index.php')
          if (p.startsWith('/api/img-proxy') || p.startsWith('/api/movies/poster-file/')) {
            p = API_BASE + p;
          }
        } else {
          // If on standard VPS (API_BASE === ''), strip any /api/index.php prefix so nginx handles it
          if (p.startsWith('/api/index.php/api/')) {
            p = p.replace('/api/index.php/api/', '/api/');
          }
        }
        if (p !== updated.poster_url) {
          updated = { ...updated, poster_url: p };
        }
      }

      return updated;
    });
  }

  static getLocalMovies(): Movie[] {
    if (this.memoryMovies) return this.memoryMovies;

    // Legacy path: the whole array used to live in one localStorage key. Read it once so an
    // existing user keeps their list, then let it migrate into IndexedDB on the next save.
    try {
      const legacy = localStorage.getItem(STORAGE_KEYS.MOVIES);
      if (legacy) {
        const parsed: Movie[] = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryMovies = this.sanitize(parsed);
          return this.memoryMovies;
        }
      }
    } catch { /* ignore */ }

    const boot = MovieCache.readBootSlice<Movie>();
    if (boot.length > 0) {
      this.memoryMovies = this.sanitize(boot);
      return this.memoryMovies;
    }

    // Nothing cached yet — start from the curated set
    this.memoryMovies = INITIAL_MOVIES;
    this.saveLocalMovies(INITIAL_MOVIES);
    return this.memoryMovies;
  }

  /**
   * Load the full cached list out of IndexedDB. `getLocalMovies()` can only return the
   * synchronous boot slice, so call this once on startup to get everything that was cached.
   * Returns null when there is nothing better than what is already in memory.
   */
  static async hydrateFromCache(): Promise<Movie[] | null> {
    if (this.hydrated) return null;
    this.hydrated = true;
    const all = await MovieCache.readAll<Movie>();
    if (all.length === 0) return null;
    const current = this.memoryMovies?.length || 0;
    if (all.length <= current) return null;
    this.memoryMovies = this.sanitize(all);
    return this.memoryMovies;
  }

  static saveLocalMovies(movies: Movie[]): void {
    this.memoryMovies = movies;
    // Fire-and-forget: IndexedDB writes are async and must never block a UI update.
    MovieCache.writeAll(movies).then(ok => {
      if (!ok) console.warn('Failed to persist movies to IndexedDB');
    });
    // Drop the legacy oversized key once we have taken ownership of the data.
    try { localStorage.removeItem(STORAGE_KEYS.MOVIES); } catch { /* ignore */ }
  }

  static toggleFavorite(messageId: number): Movie[] {
    const movies = this.getLocalMovies();
    const updated = movies.map(m => {
      if (m.message_id === messageId) {
        return { ...m, is_favorite: !m.is_favorite };
      }
      return m;
    });
    this.saveLocalMovies(updated);
    return updated;
  }

  static addMovie(movieData: Partial<Movie> & { title: string }): Movie {
    const movies = this.getLocalMovies();
    const newId = movieData.message_id || (movies.length > 0 ? Math.max(...movies.map(m => m.message_id)) + 1 : 1001);
    
    // Automatically enrich missing fields (IMDb ID, Box office, trailer, stills, cast photos)
    const enriched = enrichMovie(movieData);

    const newMovie: Movie = {
      message_id: newId,
      title: (enriched.title || movieData.title).trim(),
      english_title: (enriched.english_title || '').trim(),
      description: (enriched.description || '').trim(),
      poster_url: (enriched.poster_url || '').trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      year: (enriched.year || '').trim() || new Date().getFullYear().toString(),
      genre: (enriched.genre || '').trim() || 'درام',
      rating: (enriched.rating || '').trim() || '7.5',
      country: (enriched.country || '').trim() || 'ایران',
      actors: (enriched.actors || '').trim() || '',
      quality: (enriched.quality || '').trim() || '1080p WEB-DL',
      category: enriched.category || 'foreign_movies',
      trailer_url: (enriched.trailer_url || '').trim(),
      imdb_id: (enriched.imdb_id || '').trim(),
      box_office: (enriched.box_office || '').trim(),
      movie_stills: enriched.movie_stills || '[]',
      actor_photos: enriched.actor_photos || '[]',
      // Pass-through fields (dropping them here meant an add silently lost
      // director/awards/runtime/series counts even when the form filled them)
      director: (enriched as any).director || '',
      awards: (enriched as any).awards || undefined,
      awards_summary: (enriched as any).awards_summary || '',
      runtime: (enriched as any).runtime || undefined,
      seasons_count: (enriched as any).seasons_count || undefined,
      episodes_count: (enriched as any).episodes_count || undefined,
      crew: (enriched as any).crew || undefined,
      timestamp: Date.now(),
          synced_at: Date.now(),
          is_favorite: false,
          // Marks an add that has not been confirmed by the server yet — fetchMovies()
          // re-pushes only flagged records, so an admin-deleted movie is never
          // resurrected by an older browser's sync.
          sync_pending: true
        } as any;

        const updated = [newMovie, ...movies];
        this.saveLocalMovies(updated);
        // Push to server (server is source of truth) — clear the pending flag on success
        apiFetch(`${BASE_URL}/api/movies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMovie)
        }).then(res => {
          if (res.ok) {
            const cur = this.getLocalMovies();
            const idx = cur.findIndex(m => m.message_id === newMovie.message_id);
            if (idx >= 0 && (cur[idx] as any).sync_pending) {
              const { sync_pending, ...clean } = cur[idx] as any;
              cur[idx] = clean;
              this.saveLocalMovies(cur);
            }
          }
        }).catch(err => console.warn('Server sync (add) failed:', err));
        return newMovie;
      }

  static updateMovie(movie: Movie): Movie[] {
    const movies = this.getLocalMovies();
    const index = movies.findIndex(m => m.message_id === movie.message_id);
    const enriched = enrichMovie(movie) as Movie;
    let updated: Movie[];
    if (index >= 0) {
      updated = [...movies];
      updated[index] = { ...enriched, timestamp: movie.timestamp || Date.now() };
    } else {
      updated = [enriched, ...movies];
    }
    this.saveLocalMovies(updated);
    // Push to server
    fetch(`${BASE_URL}/api/movies/${movie.message_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched)
    }).catch(err => console.warn('Server sync (update) failed:', err));
    return updated;
  }

  static deleteMovie(messageId: number): Movie[] {
    const movies = this.getLocalMovies();
    const updated = movies.filter(m => m.message_id !== messageId);
    this.saveLocalMovies(updated);
    // Push to server
    fetch(`${BASE_URL}/api/movies/${messageId}`, { method: 'DELETE' })
      .catch(err => console.warn('Server sync (delete) failed:', err));
    return updated;
  }

  // --- API Sync ---
  static async fetchMovies(): Promise<{ movies: Movie[]; isOnline: boolean; updatedCount: number }> {
    const local = this.getLocalMovies();
    try {
      const controller = new AbortController();
      // 20s, not 6s: Iranian mobile connections are slow enough that a short timeout
      // aborted the first load and left users on the stale localStorage cache.
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // slim=1: the server ships list-only fields (no actor_photos/stills/awards).
      // Cuts the sync payload from ~7.5MB to ~2MB raw (~500KB gzipped).
      // Detail fields come back via fetchMovieDetail() when a movie is opened,
      // and are preserved below from the existing cache.
      const res = await apiFetch('/api/movies?slim=1', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.warn('API returned non-JSON response (likely anti-bot HTML challenge)');
        }
        const serverMovies: Movie[] = Array.isArray(data) ? data : (data?.movies || []);
        // An EMPTY server archive is a VALID sync result (the admin may have deleted
        // everything): falling back to the stale local list here kept resurrecting
        // deleted movies on every load.
        if (Array.isArray(serverMovies)) {
          // Re-push ONLY movies whose add never reached the server (offline adds,
          // marked sync_pending). Without this flag, a movie the admin deleted on
          // the server was re-created by any older browser on its next sync.
          const serverIds = new Set(serverMovies.map(m => m.message_id));
          const orphans = local.filter(m => !serverIds.has(m.message_id) && m.message_id >= 1001 && (m as any).sync_pending);
          for (const om of orphans) {
            const { sync_pending, ...clean } = om as any;
            apiFetch('/api/movies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clean)
            }).catch(() => {});
            serverMovies.push({ ...om, sync_pending: false } as Movie);
          }

          // Merge local favorites and tracking into server results.
          const favMap = new Map(local.filter(m => m.is_favorite).map(m => [m.message_id, true]));
          // Spread the EXISTING cached record first so detail-only fields
          // (actor_photos, movie_stills, box_office, awards…) fetched earlier
          // via fetchMovieDetail survive the slim server list.
          const richMap = new Map(local.filter(m => m.message_id != null).map(m => [m.message_id, m]));
          const merged: Movie[] = serverMovies.map(sm => {
            const rich = richMap.get(sm.message_id) || {};
            return {
              ...rich,
              ...sm,
              is_favorite: favMap.has(sm.message_id) || !!sm.is_favorite,
              // The slim list carries a 220-char description; keep the full one
              // fetched earlier via /api/movies/:id instead of degrading it.
              description: (rich.description || '').length > (sm.description || '').length ? rich.description : sm.description,
              poster_url: sm.poster_url?.startsWith('data:')
                ? `${BASE_URL}/api/movies/${sm.message_id}/poster`
                : (rich.poster_url && !sm.poster_url ? rich.poster_url : sm.poster_url)
            } as Movie;
          });

          this.saveLocalMovies(merged);
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
          return { movies: merged, isOnline: true, updatedCount: merged.length };
        }
      }
    } catch (err) {
      console.log('Network sync fallback to local cache:', err);
    }

    return { movies: local, isOnline: false, updatedCount: 0 };
  }

  /**
   * Fetch ONE movie's full record from /api/movies/:id (the slim list sync
   * ships list-only fields). Merges into the in-memory list and the IndexedDB
   * cache so subsequent opens are instant. Returns null when offline/missing.
   */
  static async fetchMovieDetail(messageId: number): Promise<Movie | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await apiFetch(`/api/movies/${messageId}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const full = await res.json();
      if (!full || !full.message_id) return null;

      const list = [...this.getLocalMovies()];
      const idx = list.findIndex(m => Number(m.message_id) === Number(messageId));
      // The server's is_favorite (false for most users) must never overwrite the
      // heart the user set locally — favorites are per-device personal state.
      const localFav = idx >= 0 ? !!list[idx].is_favorite : false;
      const mergedMovie = { ...(idx >= 0 ? list[idx] : {}), ...full, is_favorite: localFav || !!full.is_favorite } as Movie;
      if (idx >= 0) list[idx] = mergedMovie; else list.push(mergedMovie);
      this.memoryMovies = list;
      this.saveLocalMovies(list);
      return mergedMovie;
    } catch (err) {
      console.log('Detail fetch failed (offline?):', err);
      return null;
    }
  }

  // --- Cast Details ---
  static async fetchCast(messageId: number, localActorPhotos?: string, movie?: Movie): Promise<ServerCastResponse> {
    const imdbId = movie?.imdb_id;
    const title = movie?.title || '';
    const englishTitle = movie?.english_title || '';

    // Check local extended dictionary first for instant full info
    const ext = getExtendedMovieMetadata(imdbId, title, englishTitle);

    // Helper function to merge and deduplicate cast members from all sources
    const mergeAllCastSources = (
      primaryCast: any[] = [],
      extCast: any[] = [],
      localJsonPhotos?: string,
      rawActorsString?: string
    ): any[] => {
      const mergedMap = new Map<string, any>();

      // 1. Process primary fetched cast
      primaryCast.forEach(a => {
        const key = (a.name || a.english_name || '').toLowerCase().trim();
        if (key) {
          mergedMap.set(key, { ...a });
        }
      });

      // 2. Process extended DB cast
      extCast.forEach(a => {
        const key = (a.name || a.english_name || '').toLowerCase().trim();
        if (key) {
          if (mergedMap.has(key)) {
            mergedMap.set(key, { ...a, ...mergedMap.get(key) });
          } else {
            mergedMap.set(key, { ...a });
          }
        }
      });

      // 3. Process local JSON actor_photos
      if (localJsonPhotos) {
        try {
          const parsed = JSON.parse(localJsonPhotos);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              const key = (a.name || a.english_name || '').toLowerCase().trim();
              if (key) {
                if (mergedMap.has(key)) {
                  const existing = mergedMap.get(key);
                  mergedMap.set(key, {
                    ...existing,
                    character: existing.character || a.character,
                    photo: existing.photo || a.photo,
                    biography: existing.biography || a.biography,
                    english_name: existing.english_name || a.english_name
                  });
                } else {
                  mergedMap.set(key, { ...a });
                }
              }
            });
          }
        } catch {
          // ignore json parse error
        }
      }

      // 4. Process raw comma-separated actors string so NO actor is omitted
      if (rawActorsString) {
        const rawNames = rawActorsString.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
        rawNames.forEach(rawName => {
          const key = rawName.toLowerCase().trim();
          // Check if key or part of key is in map
          let found = false;
          for (const existingKey of mergedMap.keys()) {
            if (existingKey === key || existingKey.includes(key) || key.includes(existingKey)) {
              found = true;
              break;
            }
          }
          if (!found) {
            mergedMap.set(key, {
              name: rawName,
              character: 'بازیگر',
              photo: resolveActorPhoto(rawName),
              biography: `بازیگر اثر «${movie?.title || ''}»`
            });
          }
        });
      }

      return Array.from(mergedMap.values()).map(a => {
        const v = resolveActorPhoto(a.name || '', a.english_name);
        const isVReal = v && !v.startsWith('data:image/svg+xml');
        const validPhoto = isValidPhotoUrl(a.photo) ? a.photo : undefined;
        return {
          name: a.name || '',
          english_name: a.english_name || '',
          character: a.character || 'بازیگر',
          photo: isVReal ? v : (validPhoto || v),
          biography: a.biography || `بازیگر اثر «${movie?.title || ''}»`,
          birth_date: a.birth_date,
          birth_place: a.birth_place,
          awards: a.awards || [],
          known_for: a.known_for || []
        };
      });
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const queryParams = new URLSearchParams({
        imdb_id: imdbId || '',
        title: englishTitle || title || ''
      });

      const res = await apiFetch(`/api/movies/${messageId}/cast?${queryParams.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && (data.directors || data.cast || data.crew)) {
          const mappedDirectors = ((data.directors && data.directors.length > 0) ? data.directors : (ext?.directors || [])).map((d: any) => ({
            ...d,
            photo: (!d.photo || d.photo.includes('ui-avatars')) ? resolveActorPhoto(d.name, d.english_name) : d.photo
          }));
          const mappedCrew = ((data.crew && data.crew.length > 0) ? data.crew : (ext?.crew || [])).map((c: any) => ({
            ...c,
            photo: (!c.photo || c.photo.includes('ui-avatars')) ? resolveActorPhoto(c.name, c.english_name) : c.photo
          }));
          
          const combinedCast = mergeAllCastSources(
            data.cast || [],
            ext?.cast || [],
            localActorPhotos,
            movie?.actors
          );

          return {
            ok: true,
            imdb_id: data.imdb_id || imdbId,
            directors: mappedDirectors,
            crew: mappedCrew,
            cast: combinedCast,
            awards: (Array.isArray(data.awards) && data.awards.length > 0) ? data.awards : (ext?.awards || movie?.awards || []),
            awards_summary: data.awards_summary || ext?.awards_summary || movie?.awards_summary
          };
        }
      }
    } catch (e) {
      console.log('Using local fallback for cast:', e);
    }

    if (ext) {
      const combinedCast = mergeAllCastSources(
        [],
        ext.cast || [],
        localActorPhotos,
        movie?.actors
      );

      return {
        ok: true,
        imdb_id: ext.imdb_id || imdbId,
        directors: ext.directors.map(d => ({
          ...d,
          photo: (!d.photo || d.photo.includes('ui-avatars')) ? resolveActorPhoto(d.name, d.english_name) : d.photo
        })),
        crew: ext.crew.map(c => ({
          ...c,
          photo: (!c.photo || c.photo.includes('ui-avatars')) ? resolveActorPhoto(c.name, c.english_name) : c.photo
        })),
        cast: combinedCast,
        awards: ext.awards || movie?.awards || [],
        awards_summary: ext.awards_summary || movie?.awards_summary
      };
    }

    // Full Local Fallback
    const fallbackMergedCast = mergeAllCastSources(
      [],
      [],
      localActorPhotos,
      movie?.actors
    );

    // Fallback directors if empty
    let parsedDirectors = (movie?.crew?.filter(c => c.job?.includes('کارگردان')) || []).map(d => {
      const v = resolveActorPhoto(d.name, d.english_name);
      const isVReal = v && !v.startsWith('data:image/svg+xml');
      const validPhoto = isValidPhotoUrl(d.photo) ? d.photo : undefined;
      return {
        ...d,
        photo: isVReal ? v : (validPhoto || v)
      };
    });

    if (parsedDirectors.length === 0 && movie?.director) {
      const dirList = movie.director.split(/[,،/]+/).map((s: string) => s.trim()).filter(Boolean);
      parsedDirectors = dirList.map((name: string) => ({
        name,
        character: 'کارگردان',
        job: 'کارگردان',
        photo: resolveActorPhoto(name),
        biography: `کارگردان اثر «${movie.title || ''}»`
      }));
    }

    return {
      ok: true,
      directors: parsedDirectors,
      crew: (movie?.crew || []).map(c => {
        const v = resolveActorPhoto(c.name, c.english_name);
        const isVReal = v && !v.startsWith('data:image/svg+xml');
        const validPhoto = isValidPhotoUrl(c.photo) ? c.photo : undefined;
        return {
          ...c,
          photo: isVReal ? v : (validPhoto || v)
        };
      }),
      cast: fallbackMergedCast,
      awards: movie?.awards || [],
      awards_summary: movie?.awards_summary
    };
  }

  // --- Dynamic Actor & Crew Details with Fallback ---
  static async fetchActorDetails(
    name: string,
    englishName?: string,
    currentMember?: Partial<CastMember>,
    movieTitle?: string
  ): Promise<Partial<CastMember>> {
    return await fetchActorDetailsOnline(name, englishName, currentMember, movieTitle);
  }

  static async fetchActorPhoto(name: string, englishName?: string): Promise<string> {
    return await fetchActorPhotoOnline(name, englishName);
  }

  // --- Trailer (IMDb Primary, YouTube Backup) ---
  static async fetchTrailer(messageId: number, fallbackUrl?: string, movie?: Movie): Promise<ServerTrailerResponse> {
    const imdbId = movie?.imdb_id;
    const title = movie?.title || '';
    const englishTitle = movie?.english_title || '';
    const year = movie?.year || '';

    // First check local auto trailer helper
    const autoResult = fetchAutoTrailerLinks(title, englishTitle, year, imdbId);

    const imdbUrl = autoResult.imdbTrailerUrl || (imdbId 
      ? generateImdbTrailerUrl(imdbId)
      : (fallbackUrl?.includes('imdb.com') ? fallbackUrl : (imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined)));
    
    const youtubeUrl = autoResult.youtubeTrailerUrl || generateYoutubeBackupUrl(title, englishTitle, year);

    try {
      const controller = new AbortController();
      // 15s: the server now does a live IMDb GraphQL lookup (~1.3s cold) plus a possible
      // TMDB fallback, so a 4s budget aborted the IMDb trailer on slower connections.
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Query local backend trailer endpoint
      const queryParams = new URLSearchParams({
        imdb_id: imdbId || autoResult.imdbId || '',
        title: englishTitle || title || ''
      });
      const res = await apiFetch(`/api/movies/${messageId}/trailer?${queryParams.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          ok: true,
          imdb_id: data.imdb_id || autoResult.imdbId || imdbId,
          imdb_url: data.page_url?.includes('imdb') ? data.page_url : imdbUrl,
          imdb_video_id: data.imdb_video_id || autoResult.imdbVideoId,
          video_url: data.video_url || '',
          video_definition: data.video_definition || undefined,
          page_url: data.page_url || imdbUrl,
          youtube_url: data.youtube_url || youtubeUrl,
          source: data.video_url ? 'imdb' : 'youtube'
        };
      }
    } catch (e) {
      console.log('Fallback to local enriched trailer info:', e);
    }

    return {
      ok: true,
      imdb_id: autoResult.imdbId || imdbId,
      imdb_url: imdbUrl,
      imdb_video_id: autoResult.imdbVideoId,
      video_url: fallbackUrl?.endsWith('.mp4') ? fallbackUrl : undefined,
      youtube_url: youtubeUrl || (fallbackUrl?.includes('youtube') || fallbackUrl?.includes('youtu.be') ? fallbackUrl : undefined),
      page_url: imdbUrl || fallbackUrl,
      source: 'youtube'
    };
  }

  /**
   * Automatically resolve both IMDb and YouTube trailer links for any title
   */
  static async autoFetchTrailerLinks(
    title: string,
    englishTitle: string = '',
    year: string = '',
    imdbId?: string
  ): Promise<AutoTrailerResult> {
    // 1. First attempt local smart enrichment
    const localResult = fetchAutoTrailerLinks(title, englishTitle, year, imdbId);

    // 2. Also query backend if available
    try {
      if (imdbId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${BASE_URL}/api/trailer-lookup?query=${encodeURIComponent(imdbId)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.page_url || data.youtube_url) {
            return {
              imdbId: data.imdb_id || localResult.imdbId,
              imdbTrailerUrl: data.page_url || localResult.imdbTrailerUrl,
              youtubeTrailerUrl: data.youtube_url || localResult.youtubeTrailerUrl,
              preferredUrl: data.page_url || localResult.imdbTrailerUrl,
              source: 'matched_exact'
            };
          }
        }
      }
    } catch {
      // Fallback cleanly to localResult
    }

    return localResult;
  }

  // --- Box Office ---
  static async fetchBoxOffice(): Promise<BoxOfficeEntry[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${BASE_URL}/api/box-office`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          localStorage.setItem(STORAGE_KEYS.BOX_OFFICE, JSON.stringify(data.entries));
          return data.entries;
        }
      }
    } catch (e) {
      console.log('Fallback to local box office entries:', e);
    }

    // Try stored or fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOX_OFFICE);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_BOX_OFFICE;
  }

  // --- Tracking (Trakt-like progress) ---
  static getLocalTracking(): TrackingItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRACKING);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  static async fetchTracking(): Promise<TrackingItem[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${BASE_URL}/api/tracking`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items)) {
          localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(items));
          return items;
        }
      }
    } catch {
      // fallback
    }
    return this.getLocalTracking();
  }

  static async saveTrackingItem(messageId: number, req: TrackingRequest, movieInfo?: Partial<Movie>): Promise<TrackingItem[]> {
    const list = this.getLocalTracking();
    const existingIndex = list.findIndex(t => t.message_id === messageId);
    const existing = existingIndex >= 0 ? list[existingIndex] : null;

    const newItem: TrackingItem = {
      message_id: messageId,
      media_type: req.media_type,
      status: req.status || (req.media_type === 'series' && req.last_episode && req.total_episodes && req.last_episode >= req.total_episodes ? 'completed' : (existing?.status || 'watching')),
      current_season: req.current_season !== undefined ? req.current_season : (existing?.current_season || 1),
      last_episode: req.last_episode !== undefined ? req.last_episode : (existing?.last_episode || 0),
      total_episodes: req.total_episodes !== undefined ? req.total_episodes : existing?.total_episodes,
      times_watched: req.times_watched !== undefined ? req.times_watched : (existing?.times_watched || 1),
      user_rating: req.user_rating !== undefined ? req.user_rating : existing?.user_rating,
      next_episode_date: req.next_episode_date !== undefined ? req.next_episode_date : (existing?.next_episode_date || ''),
      note: req.note !== undefined ? req.note : (existing?.note || ''),
      favorite: req.favorite !== undefined ? req.favorite : existing?.favorite,
      title: movieInfo?.title || existing?.title || 'بدون نام',
      english_title: movieInfo?.english_title || existing?.english_title,
      poster_url: movieInfo?.poster_url || existing?.poster_url || '',
      category: movieInfo?.category || existing?.category || '',
      year: movieInfo?.year || existing?.year,
      genre: movieInfo?.genre || existing?.genre,
      updated_at: Date.now()
    };

    let updatedList: TrackingItem[];
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = newItem;
    } else {
      updatedList = [newItem, ...list];
    }

    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(updatedList));

    // Try posting to server in background
    try {
      fetch(`${BASE_URL}/api/tracking/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      }).catch(() => {});
    } catch {
      // ignore
    }

    return updatedList;
  }

  static async updateTrackingQuick(
    messageId: number, 
    changes: Partial<TrackingItem>
  ): Promise<TrackingItem[]> {
    const list = this.getLocalTracking();
    const index = list.findIndex(t => t.message_id === messageId);
    if (index === -1) return list;

    const updatedItem: TrackingItem = {
      ...list[index],
      ...changes,
      updated_at: Date.now()
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(updatedList));

    // Post in background
    try {
      fetch(`${BASE_URL}/api/tracking/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      }).catch(() => {});
    } catch {
      // ignore
    }

    return updatedList;
  }

  static async deleteTrackingItem(messageId: number): Promise<TrackingItem[]> {
    const list = this.getLocalTracking();
    const updated = list.filter(t => t.message_id !== messageId);
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(updated));

    try {
      fetch(`${BASE_URL}/api/tracking/${messageId}`, {
        method: 'DELETE'
      }).catch(() => {});
    } catch {
      // ignore
    }

    return updated;
  }

  // --- Health Check ---
  static async checkHealth(): Promise<{ ok: boolean; count?: number }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, count: data.movies };
      }
    } catch {
      // ignore
    }
    return { ok: false };
  }

  // --- TMDb Intelligent Search & 1-Click Autofill ---
  static async searchTmdb(query: string): Promise<any[]> {
    if (!query || !query.trim()) return [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await apiFetch(`/api/tmdb/search?query=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    } catch (err) {
      console.warn('TMDb search error:', err);
    }
    return [];
  }

  static async autofillFromTmdb(params: { id?: string | number; media_type?: 'movie' | 'tv'; title?: string }): Promise<any | null> {
    try {
      const queryParts: string[] = [];
      if (params.id) queryParts.push(`id=${encodeURIComponent(String(params.id))}`);
      if (params.media_type) queryParts.push(`media_type=${encodeURIComponent(params.media_type)}`);
      if (params.title) queryParts.push(`title=${encodeURIComponent(params.title)}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const res = await apiFetch(`/api/tmdb/autofill?${queryParts.join('&')}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) return data;
      }
    } catch (err) {
      console.warn('TMDb autofill error:', err);
    }
    return null;
  }

  // --- Reset Cache ---
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.MOVIES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.TRACKING);
    localStorage.removeItem(STORAGE_KEYS.BOX_OFFICE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    // The movie list itself now lives in IndexedDB
    this.memoryMovies = null;
    this.hydrated = false;
    MovieCache.clear();
  }
}

/**
 * CuratedContentService
 * 
 * Fetches curated data (actor photos, mood categories, philosophy, etc.)
 * from the server API. Falls back to local hardcoded data if server is unreachable.
 * 
 * All data is cached in-memory after first fetch to avoid redundant requests.
 */

// Same-origin API (see services/api.ts). On InfinityFree the API base is
// /api/index.php (front controller); on the VPS it stays ''.
const API_BASE = (window as any).MOVIEBROWSER_API_BASE ?? '';
const BASE_URL = API_BASE;

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry<any>>();

async function fetchCurated<T>(endpoint: string, fallback: T): Promise<T> {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data as T;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        cache.set(endpoint, { data: json.data, fetchedAt: Date.now() });
        return json.data as T;
      }
    }
  } catch {
    // Server unreachable — use fallback
  }
  return fallback;
}

export class CuratedContentService {
  /**
   * Get mood categories. Falls back to local MOOD_CATEGORIES.
   */
  static async getMoodCategories(fallback: any[]): Promise<any[]> {
    return fetchCurated('/api/content/mood-categories', fallback);
  }

  /**
   * Get mood-based movie recommendations.
   */
  static async getMoodRecommendations(fallback: Record<string, any[]>): Promise<Record<string, any[]>> {
    return fetchCurated('/api/content/mood-recommendations', fallback);
  }

  /**
   * Get philosophical analyses database.
   */
  static async getPhilosophyDatabase(fallback: Record<string, any>): Promise<Record<string, any>> {
    return fetchCurated('/api/content/philosophy', fallback);
  }

  /**
   * Get movie battles database.
   */
  static async getBattlesDatabase(fallback: Record<string, any>): Promise<Record<string, any>> {
    return fetchCurated('/api/content/battles', fallback);
  }

  /**
   * Get storyline recommendation database.
   */
  static async getStorylineDatabase(fallback: Record<string, any>): Promise<Record<string, any>> {
    return fetchCurated('/api/content/storylines', fallback);
  }

  /**
   * Force-refresh all caches (e.g. after admin edit).
   */
  static clearCache(): void {
    cache.clear();
  }
}

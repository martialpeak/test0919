// Per-user tracking storage — server-side (Firebase removed)
import { TrackingItem } from '../types';

const TOKEN_KEY = 'moviebrowser_user_token';

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

async function api(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-token': getToken(),
      ...(options.headers || {})
    }
  });
  return res.json().catch(() => ({ ok: false }));
}

function normalize(raw: any): TrackingItem {
  return {
    message_id: Number(raw.message_id),
    media_type: raw.media_type || 'series',
    status: raw.status || 'watching',
    current_season: raw.current_season ?? 1,
    last_episode: raw.last_episode ?? 1,
    total_episodes: raw.total_episodes ?? null,
    times_watched: raw.times_watched ?? 1,
    user_rating: raw.user_rating ?? null,
    next_episode_date: raw.next_episode_date || '',
    note: raw.note || '',
    favorite: !!raw.favorite,
    title: raw.title || '',
    english_title: raw.english_title || '',
    poster_url: raw.poster_url || '',
    category: raw.category || '',
    year: raw.year || '',
    created_at: raw.created_at,
    updated_at: raw.updated_at
  } as TrackingItem;
}

export class UserTrackingService {
  /** Fetch all tracking items for the signed-in user */
  static async getUserTracking(_userId: string): Promise<TrackingItem[]> {
    try {
      const j = await api('/api/user/tracking');
      if (j.ok && Array.isArray(j.items)) return j.items.map(normalize);
    } catch { /* offline */ }
    return [];
  }

  /** Firestore realtime subscription no longer exists — poll instead */
  static subscribeUserTracking(
    _userId: string,
    callback: (items: TrackingItem[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const items = await this.getUserTracking(_userId);
        if (active) callback(items);
      } catch (err) {
        if (onError && active) onError(err as Error);
      }
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { active = false; clearInterval(interval); };
  }

  /** Save or update a single tracking item on the server */
  static async saveTrackingItem(
    _userId: string,
    messageId: number,
    itemData: Partial<TrackingItem> | any,
    movieInfo?: { title?: string; english_title?: string; poster_url?: string; category?: string; year?: string; genre?: string }
  ): Promise<void> {
    const tData = itemData as Partial<TrackingItem>;
    const payload = {
      media_type: itemData.media_type || 'series',
      status: itemData.status || 'watching',
      current_season: itemData.current_season ?? 1,
      last_episode: itemData.last_episode ?? 1,
      total_episodes: itemData.total_episodes ?? null,
      times_watched: itemData.times_watched ?? 1,
      user_rating: itemData.user_rating ?? null,
      next_episode_date: itemData.next_episode_date || '',
      note: itemData.note || '',
      favorite: !!itemData.favorite,
      title: tData.title || movieInfo?.title || '',
      english_title: tData.english_title || movieInfo?.english_title || '',
      poster_url: tData.poster_url || movieInfo?.poster_url || '',
      category: tData.category || movieInfo?.category || movieInfo?.genre || '',
      year: tData.year || movieInfo?.year || ''
    };
    const j = await api(`/api/user/tracking/${messageId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!j.ok) throw new Error(j.error || 'خطا در ذخیره‌سازی');
  }

  /** Update specific fields of a tracking item */
  static async updateTrackingItemFields(
    _userId: string,
    messageId: number,
    changes: Partial<TrackingItem>
  ): Promise<void> {
    const j = await api(`/api/user/tracking/${messageId}`, {
      method: 'POST',
      body: JSON.stringify(changes)
    });
    if (!j.ok) throw new Error(j.error || 'خطا در بروزرسانی');
  }

  /** Delete a tracking item */
  static async deleteTrackingItem(_userId: string, messageId: number): Promise<void> {
    const j = await api(`/api/user/tracking/${messageId}`, { method: 'DELETE' });
    if (!j.ok) throw new Error(j.error || 'خطا در حذف');
  }

  /** Upload local items to the server when a user signs in */
  static async syncLocalToCloud(userId: string, localItems: TrackingItem[]): Promise<void> {
    if (!localItems || localItems.length === 0) return;
    const cloudItems = await this.getUserTracking(userId);
    const cloudMap = new Map(cloudItems.map(c => [c.message_id, c]));
    for (const local of localItems) {
      if (!cloudMap.has(local.message_id)) {
        await this.saveTrackingItem(userId, local.message_id, local, {
          title: local.title,
          english_title: local.english_title,
          poster_url: local.poster_url,
          category: local.category,
          year: local.year
        }).catch(() => { /* keep going */ });
      }
    }
  }
}

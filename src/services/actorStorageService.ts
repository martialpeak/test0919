import { ActorAward, ActorKnownWork } from '../types';
import { apiFetch } from './apiFetch';

export interface CustomActorData {
  id: string;
  name: string;
  english_name?: string;
  photo?: string;
  character?: string;
  job?: string;
  biography?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  awards?: ActorAward[];
  known_for?: ActorKnownWork[];
  isDirector?: boolean;
  category?: 'iranian' | 'foreign' | 'director' | 'winner';
  is_custom?: boolean;
  updated_at?: string;
}

const LOCAL_STORAGE_CUSTOM_ACTORS_KEY = 'filmbareh_custom_actors_v1';
const LOCAL_STORAGE_ACTOR_OVERRIDES_KEY = 'filmbareh_actor_overrides_v1';

export class ActorStorageService {
  /**
   * Get all custom created actors from local storage
   */
  public static getCustomActors(): CustomActorData[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ACTORS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Get all overrides for existing actors
   */
  public static getActorOverrides(): Record<string, Partial<CustomActorData>> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ACTOR_OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Save a newly added or fully custom actor
   */
  public static saveCustomActor(actor: CustomActorData): void {
    const list = this.getCustomActors();
    const existingIndex = list.findIndex(a => a.id === actor.id || a.name.trim().toLowerCase() === actor.name.trim().toLowerCase());
    
    const prepared: CustomActorData = {
      ...actor,
      id: actor.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      is_custom: true,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = prepared;
    } else {
      list.unshift(prepared);
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_ACTORS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save custom actor to localStorage:', e);
    }

    // Sync to backend
    this.syncActorToBackend(prepared);
    this.notifyUpdate();
  }

  /**
   * Delete a custom actor
   */
  public static deleteCustomActor(actorId: string): void {
    const list = this.getCustomActors().filter(a => a.id !== actorId);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_ACTORS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to remove custom actor from localStorage:', e);
    }

    apiFetch(`/api/actors/custom/${encodeURIComponent(actorId)}`, { method: 'DELETE' }).catch(() => {});
    this.notifyUpdate();
  }

  /**
   * Save an override for an existing actor
   */
  public static saveActorOverride(actorKey: string, override: Partial<CustomActorData>): void {
    const overrides = this.getActorOverrides();
    const cleanKey = actorKey.trim().toLowerCase();
    
    overrides[cleanKey] = {
      ...(overrides[cleanKey] || {}),
      ...override,
      updated_at: new Date().toISOString()
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_ACTOR_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.warn('Failed to save actor override to localStorage:', e);
    }

    // Sync to backend database as bio/actor record
    apiFetch('/api/actors/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: override.name || actorKey,
        english_name: override.english_name,
        biography: override.biography,
        job: override.job,
        photo: override.photo,
        character: override.character,
        birth_date: override.birth_date,
        birth_place: override.birth_place,
        nationality: override.nationality,
        awards: override.awards,
        known_for: override.known_for,
        category: override.category,
        is_ai: false
      })
    }).catch(() => {});

    this.notifyUpdate();
  }

  /**
   * Remove override and revert back to default
   */
  public static resetActorOverride(actorKey: string): void {
    const overrides = this.getActorOverrides();
    const cleanKey = actorKey.trim().toLowerCase();
    if (overrides[cleanKey]) {
      delete overrides[cleanKey];
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTOR_OVERRIDES_KEY, JSON.stringify(overrides));
      } catch (e) {
        console.warn('Failed to reset actor override in localStorage:', e);
      }
    }
    this.notifyUpdate();
  }

  /**
   * Dispatch global window event to re-render all actor lists
   */
  private static notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filmbareh:actor-data-changed'));
    }
  }

  /**
   * Sync custom actor to server backend
   */
  private static async syncActorToBackend(actor: CustomActorData): Promise<void> {
    try {
      await apiFetch('/api/actors/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actor)
      });
    } catch (e) {
      // Offline fallback
    }
  }

  /**
   * Pull custom actors from server on app boot
   */
  public static async fetchCustomActorsFromServer(): Promise<void> {
    try {
      const res = await apiFetch('/api/actors/custom');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.actors)) {
          const local = this.getCustomActors();
          const mergedMap = new Map<string, CustomActorData>();

          local.forEach(a => mergedMap.set(a.id, a));
          data.actors.forEach((a: CustomActorData) => mergedMap.set(a.id, a));

          const combined = Array.from(mergedMap.values());
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_ACTORS_KEY, JSON.stringify(combined));
          this.notifyUpdate();
        }
      }
    } catch {
      // Offline fallback
    }
  }

  /**
   * Pull server-side actor biographies (and other fields) as overrides so the
   * actors screen shows real bios instead of the generic fallback text.
   */
  public static async fetchServerBiosAsOverrides(): Promise<void> {
    try {
      const res = await apiFetch('/api/actors/custom');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.actors)) return;

      const overrides = this.getActorOverrides();
      let changed = false;
      for (const rec of data.actors) {
        if (!rec?.name) continue;
        const key = String(rec.name).toLowerCase().trim();
        const existing = overrides[key] || {};
        // Only fill in missing fields — admin/local edits always win
        const patch: Record<string, any> = {};
        if (!existing.biography && rec.biography) patch.biography = rec.biography;
        if (!existing.birth_date && rec.birth_date) patch.birth_date = rec.birth_date;
        if (!existing.birth_place && rec.birth_place) patch.birth_place = rec.birth_place;
        if (!existing.nationality && rec.nationality) patch.nationality = rec.nationality;
        if (!existing.job && rec.job) patch.job = rec.job;
        if (Object.keys(patch).length > 0) {
          overrides[key] = { ...existing, ...patch };
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(LOCAL_STORAGE_ACTOR_OVERRIDES_KEY, JSON.stringify(overrides));
        this.notifyUpdate();
      }
    } catch {
      // Offline fallback
    }
  }
}

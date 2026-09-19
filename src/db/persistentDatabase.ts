import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveActorCanonicalKey } from './actorNameMap';

export interface ActorBioRecord {
  id: string;
  name: string;
  english_name?: string;
  biography: string;
  original_biography?: string;
  job?: string;
  character?: string;
  photo?: string;
  wikipedia_url?: string;
  model_used?: string;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoviePlotRecord {
  id: string;
  title: string;
  english_title?: string;
  imdb_id?: string;
  persian_plot: string;
  original_plot?: string;
  model_used?: string;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranslationRecord {
  hash: string;
  source_text: string;
  translated_text: string;
  category?: string;
  model_used?: string;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppDatabaseSchema {
  version: number;
  last_updated: string;
  actors: Record<string, ActorBioRecord>;
  plots: Record<string, MoviePlotRecord>;
  translations: Record<string, TranslationRecord>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'app_database.json');

function normalizeKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex').substring(0, 24);
}

class PersistentDatabase {
  private data: AppDatabaseSchema = {
    version: 1,
    last_updated: new Date().toISOString(),
    actors: {},
    plots: {},
    translations: {},
  };
  private isSaving = false;
  private savePending = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            version: parsed.version || 1,
            last_updated: parsed.last_updated || new Date().toISOString(),
            actors: parsed.actors || {},
            plots: parsed.plots || {},
            translations: parsed.translations || {},
          };
          console.log(
            `[Database] Loaded persistent database: ${Object.keys(this.data.actors).length} actors, ${Object.keys(this.data.plots).length} plots, ${Object.keys(this.data.translations).length} translations.`
          );
        }
      } else {
        this.saveSync();
        console.log('[Database] Created new persistent database at data/app_database.json');
      }
    } catch (err) {
      console.error('[Database] Error initializing database:', err);
    }
  }

  private scheduleSave() {
    if (this.savePending) return;
    this.savePending = true;
    setTimeout(() => {
      this.savePending = false;
      this.saveAsync();
    }, 150);
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      this.data.last_updated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write database synchronously:', err);
    }
  }

  private async saveAsync() {
    if (this.isSaving) {
      this.savePending = true;
      return;
    }
    this.isSaving = true;
    try {
      this.data.last_updated = new Date().toISOString();
      const content = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(DB_FILE, content, 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write database asynchronously:', err);
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        this.saveAsync();
      }
    }
  }

  // --- ACTOR BIO OPERATIONS ---
  public getAllActors(): ActorBioRecord[] {
    const seen = new Set<string>();
    const list: ActorBioRecord[] = [];
    for (const record of Object.values(this.data.actors)) {
      if (!seen.has(record.id)) {
        seen.add(record.id);
        list.push(record);
      }
    }
    return list;
  }

  public getActorBio(name: string, englishName?: string): ActorBioRecord | null {
    const k1 = normalizeKey(name);
    const k2 = englishName ? normalizeKey(englishName) : '';

    // Direct key match
    if (k1 && this.data.actors[k1]) return this.data.actors[k1];
    if (k2 && this.data.actors[k2]) return this.data.actors[k2];

    // Resolve via persian<->english name map (catches cross-script duplicates)
    const c1 = resolveActorCanonicalKey(name);
    const c2 = englishName ? resolveActorCanonicalKey(englishName) : '';
    if (c1 && this.data.actors[normalizeKey(c1)]) return this.data.actors[normalizeKey(c1)];
    if (c2 && this.data.actors[normalizeKey(c2)]) return this.data.actors[normalizeKey(c2)];

    // Search by partial match OR alias match
    for (const record of Object.values(this.data.actors)) {
      const keysToCheck = [record.name, record.english_name, ...(record.aliases || [])];
      for (const candidate of keysToCheck) {
        if (!candidate) continue;
        const ck = normalizeKey(candidate);
        if ((k1 && ck === k1) || (k2 && ck === k2) ||
            (c1 && ck === normalizeKey(c1)) || (c2 && ck === normalizeKey(c2))) {
          return record;
        }
      }
    }
    return null;
  }

  public saveActorBio(actor: {
    name: string;
    english_name?: string;
    biography: string;
    original_biography?: string;
    job?: string;
    character?: string;
    photo?: string;
    wikipedia_url?: string;
    model_used?: string;
    is_ai: boolean;
  }): ActorBioRecord {
    // Resolve canonical key: if name maps to a known persian canonical (via name map),
    // use that — so an english-name movie doesn't create a duplicate of a persian entry.
    const rawKey = normalizeKey(actor.name) || normalizeKey(actor.english_name) || 'unknown';
    const canonical = resolveActorCanonicalKey(actor.name) || resolveActorCanonicalKey(actor.english_name || '') || rawKey;
    const key = normalizeKey(canonical) || rawKey;
    const now = new Date().toISOString();
    const existing = this.data.actors[key];

    // Merge aliases from both names so future lookups (in either language) hit the same record
    const aliases = new Set<string>(existing?.aliases || []);
    if (actor.english_name) {
      const engKey = normalizeKey(actor.english_name);
      if (engKey && engKey !== key) aliases.add(engKey);
    }
    aliases.add(key);
    if (rawKey !== key) aliases.add(rawKey);

    const record: ActorBioRecord = {
      id: key,
      name: actor.name,
      english_name: actor.english_name,
      biography: actor.biography,
      original_biography: actor.original_biography,
      job: actor.job,
      character: actor.character,
      photo: actor.photo || existing?.photo,
      wikipedia_url: actor.wikipedia_url || existing?.wikipedia_url,
      model_used: actor.model_used || existing?.model_used,
      is_ai: actor.is_ai,
      aliases: [...aliases],
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    // Store ONLY under the canonical key — no duplicate entries
    this.data.actors[key] = record;
    this.scheduleSave();
    return record;
  }

  // --- MOVIE PLOT OPERATIONS ---
  public getMoviePlot(title: string, englishTitle?: string, imdbId?: string): MoviePlotRecord | null {
    if (imdbId && this.data.plots[imdbId]) return this.data.plots[imdbId];

    const k1 = normalizeKey(title);
    const k2 = englishTitle ? normalizeKey(englishTitle) : '';

    if (k1 && this.data.plots[k1]) return this.data.plots[k1];
    if (k2 && this.data.plots[k2]) return this.data.plots[k2];

    for (const record of Object.values(this.data.plots)) {
      if (
        (imdbId && record.imdb_id === imdbId) ||
        (k1 && normalizeKey(record.title) === k1) ||
        (k1 && record.english_title && normalizeKey(record.english_title) === k1) ||
        (k2 && normalizeKey(record.title) === k2) ||
        (k2 && record.english_title && normalizeKey(record.english_title) === k2)
      ) {
        return record;
      }
    }
    return null;
  }

  public saveMoviePlot(plot: {
    title: string;
    english_title?: string;
    imdb_id?: string;
    persian_plot: string;
    original_plot?: string;
    model_used?: string;
    is_ai: boolean;
  }): MoviePlotRecord {
    const key = plot.imdb_id || normalizeKey(plot.title) || normalizeKey(plot.english_title) || 'unknown';
    const now = new Date().toISOString();
    const existing = this.data.plots[key];

    const record: MoviePlotRecord = {
      id: key,
      title: plot.title,
      english_title: plot.english_title,
      imdb_id: plot.imdb_id,
      persian_plot: plot.persian_plot,
      original_plot: plot.original_plot,
      model_used: plot.model_used || existing?.model_used,
      is_ai: plot.is_ai,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    this.data.plots[key] = record;
    if (plot.imdb_id && key !== plot.imdb_id) {
      this.data.plots[plot.imdb_id] = record;
    }
    if (plot.english_title) {
      const engKey = normalizeKey(plot.english_title);
      if (engKey && engKey !== key) {
        this.data.plots[engKey] = record;
      }
    }

    this.scheduleSave();
    return record;
  }

  // --- GENERAL TRANSLATION OPERATIONS ---
  public getTranslation(sourceText: string): TranslationRecord | null {
    const hash = hashText(sourceText);
    return this.data.translations[hash] || null;
  }

  public saveTranslation(
    sourceText: string,
    translatedText: string,
    category?: string,
    modelUsed?: string,
    isAi = true
  ): TranslationRecord {
    const hash = hashText(sourceText);
    const now = new Date().toISOString();
    const existing = this.data.translations[hash];

    const record: TranslationRecord = {
      hash,
      source_text: sourceText.trim(),
      translated_text: translatedText.trim(),
      category: category || existing?.category,
      model_used: modelUsed || existing?.model_used,
      is_ai: isAi,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    this.data.translations[hash] = record;
    this.scheduleSave();
    return record;
  }

  // --- DATABASE STATS ---
  public getStats() {
    return {
      version: this.data.version,
      last_updated: this.data.last_updated,
      counts: {
        actors: Object.keys(this.data.actors).length,
        plots: Object.keys(this.data.plots).length,
        translations: Object.keys(this.data.translations).length,
      },
    };
  }
}

export const db = new PersistentDatabase();

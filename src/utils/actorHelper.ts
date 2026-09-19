import { Movie, CastMember, ActorAward, ActorKnownWork } from '../types';
import { KNOWN_EXTENDED_MOVIE_DATA } from '../data/castAndAwardsDatabase';
import {
  resolveActorPhoto,
  VERIFIED_PERSON_BIOS
} from '../services/actorPhotoService';
import { getServerActorBio } from '../services/actorDbService';
import { resolveActorCanonicalKey } from '../db/actorNameMap';
import { ActorStorageService } from '../services/actorStorageService';

export interface SiteMovieAppearance {
  movie: Movie;
  character?: string;
  role?: string;
}

export interface DetailedActorProfile extends CastMember {
  id: string;
  siteMovies: SiteMovieAppearance[];
  siteMovieCount: number;
  isDirector?: boolean;
  category: 'iranian' | 'foreign' | 'director' | 'winner';
  is_custom?: boolean;
  is_edited?: boolean;
}

/**
 * Normalize Persian and English names for fuzzy/resilient matching
 */
export function normalizeName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width spaces
    .replace(/[\u064B-\u065F]/g, '') // arabic diacritics
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\s\.\-_،,]+/g, ' ')
    .trim();
}

/**
 * Check if two names match accurately without false positive substring collisions
 */
export function isNameMatch(target: string | undefined, candidate: string | undefined): boolean {
  if (!target || !candidate) return false;
  const t = normalizeName(target);
  const c = normalizeName(candidate);
  if (!t || !c) return false;
  if (t === c) return true;

  // Split into tokens
  const tTokens = t.split(' ').filter(x => x.length >= 2);
  const cTokens = c.split(' ').filter(x => x.length >= 2);

  if (tTokens.length === 0 || cTokens.length === 0) return false;

  // If both have at least 2 tokens (e.g. "شهاب حسینی" and "سید شهاب حسینی", or "Cillian Murphy" and "Cillian Murphy")
  if (tTokens.length >= 2 && cTokens.length >= 2) {
    const [shorter, longer] = tTokens.length <= cTokens.length ? [tTokens, cTokens] : [cTokens, tTokens];
    const allTokensPresent = shorter.every(st => longer.includes(st));
    if (allTokensPresent) return true;
  }

  // Exact whole-phrase containment if longer than 5 chars
  if (t.length >= 5 && c.length >= 5) {
    if (t === c || ` ${c} `.includes(` ${t} `) || ` ${t} `.includes(` ${c} `)) {
      return true;
    }
  }

  return false;
}

/**
 * Format clean, natural Persian role label for actor/filmmaker appearances
 */
export function formatActorRoleLabel(role?: string, character?: string): string {
  const cleanRole = (role || '').trim();
  const cleanChar = (character || '').trim();

  // If director
  if (cleanRole === 'کارگردان' || cleanChar === 'کارگردان' || cleanChar === 'کارگردان اثر') {
    return 'کارگردان';
  }

  // If composer
  if (cleanRole.includes('آهنگساز') || cleanRole.includes('موسیقی') || cleanChar.includes('آهنگساز') || cleanChar.includes('موسیقی')) {
    return 'آهنگساز موسیقی متن';
  }

  // If other key crew
  if (cleanRole.includes('فیلمبردار') || cleanChar.includes('فیلمبردار')) {
    return 'مدیر فیلمبرداری';
  }
  if (cleanRole.includes('تهیه‌کننده') || cleanChar.includes('تهیه‌کننده')) {
    return 'تهیه‌کننده';
  }
  if (cleanRole.includes('نویسنده') || cleanChar.includes('نویسنده')) {
    return 'نویسنده';
  }
  if (cleanRole.includes('تدوین') || cleanChar.includes('تدوین')) {
    return 'تدوین فیلم';
  }

  // If actor with a specific character name
  if (
    cleanChar &&
    cleanChar !== 'بازیگر' &&
    cleanChar !== 'ایفای نقش' &&
    cleanChar !== 'عوامل' &&
    cleanChar !== 'هنرمند' &&
    !cleanChar.includes('آهنگساز') &&
    !cleanChar.includes('کارگردان')
  ) {
    const displayChar = cleanChar.replace(/^(در\s*نقش\s*|نقش:\s*)/, '').trim();
    if (displayChar && displayChar !== 'بازیگر' && displayChar !== 'ایفای نقش') {
      return `در نقش ${displayChar}`;
    }
  }

  return 'بازیگر';
}

/**
 * Check if a movie is associated with an actor or filmmaker
 */
export function matchActorInMovie(
  actorName: string,
  actorEnglishName: string | undefined,
  movie: Movie
): { matched: boolean; character?: string; role?: string } {
  const normActorName = normalizeName(actorName);
  const normActorEnglish = actorEnglishName ? normalizeName(actorEnglishName) : '';

  if (!normActorName && !normActorEnglish) {
    return { matched: false };
  }

  const imdbId = movie.imdb_id;
  const ext = imdbId ? KNOWN_EXTENDED_MOVIE_DATA[imdbId] : undefined;

  // 1. PRIORITY 1: Check Movie's Cast Array (from actor_photos)
  if (movie.actor_photos) {
    try {
      const parsed = JSON.parse(movie.actor_photos);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            isNameMatch(normActorName, item.name) ||
            isNameMatch(normActorEnglish, item.english_name) ||
            isNameMatch(normActorName, item.english_name) ||
            isNameMatch(normActorEnglish, item.name)
          ) {
            const charName = item.character && item.character !== 'بازیگر' && !item.character.includes('آهنگساز') ? item.character : undefined;
            return { matched: true, role: 'بازیگر', character: charName };
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. PRIORITY 2: Check Extended Database Cast
  if (ext && ext.cast) {
    for (const c of ext.cast) {
      if (
        isNameMatch(normActorName, c.name) ||
        isNameMatch(normActorEnglish, c.english_name) ||
        isNameMatch(normActorName, c.english_name) ||
        isNameMatch(normActorEnglish, c.name)
      ) {
        const charName = c.character && c.character !== 'بازیگر' && !c.character.includes('آهنگساز') ? c.character : undefined;
        return { matched: true, role: 'بازیگر', character: charName };
      }
    }
  }

  // 3. PRIORITY 3: Check movie.actors string list
  if (movie.actors) {
    const actorNames = movie.actors.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
    for (const an of actorNames) {
      if (isNameMatch(normActorName, an) || isNameMatch(normActorEnglish, an)) {
        return { matched: true, role: 'بازیگر', character: undefined };
      }
    }
    const normActorsString = normalizeName(movie.actors);
    if (
      (normActorName && normActorName.length >= 3 && ` ${normActorsString} `.includes(` ${normActorName} `)) ||
      (normActorEnglish && normActorEnglish.length >= 3 && ` ${normActorsString} `.includes(` ${normActorEnglish} `))
    ) {
      return { matched: true, role: 'بازیگر', character: undefined };
    }
  }

  // 4. PRIORITY 4: Check Director
  if (movie.director) {
    const dirNames = movie.director.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
    for (const dn of dirNames) {
      if (isNameMatch(normActorName, dn) || isNameMatch(normActorEnglish, dn)) {
        return { matched: true, role: 'کارگردان', character: 'کارگردان اثر' };
      }
    }
  }

  if (ext && ext.directors) {
    for (const d of ext.directors) {
      if (
        isNameMatch(normActorName, d.name) ||
        isNameMatch(normActorEnglish, d.english_name) ||
        isNameMatch(normActorName, d.english_name) ||
        isNameMatch(normActorEnglish, d.name)
      ) {
        return { matched: true, role: 'کارگردان', character: d.character || 'کارگردان اثر' };
      }
    }
  }

  // 5. PRIORITY 5: Check Technical Crew (Composers, Cinematographers, Producers) ONLY with strict name match
  if (ext && ext.crew) {
    for (const cr of ext.crew) {
      if (
        isNameMatch(normActorName, cr.name) ||
        isNameMatch(normActorEnglish, cr.english_name) ||
        isNameMatch(normActorName, cr.english_name) ||
        isNameMatch(normActorEnglish, cr.name)
      ) {
        const isComposer = cr.job?.includes('آهنگساز') || cr.job?.includes('موسیقی');
        const roleLabel = isComposer ? 'آهنگساز موسیقی متن' : (cr.job || 'عوامل');
        return { matched: true, role: roleLabel, character: undefined };
      }
    }
  }

  if (movie.crew && Array.isArray(movie.crew)) {
    for (const cr of movie.crew) {
      if (
        isNameMatch(normActorName, cr.name) ||
        isNameMatch(normActorEnglish, cr.english_name) ||
        isNameMatch(normActorName, cr.english_name) ||
        isNameMatch(normActorEnglish, cr.name)
      ) {
        const isComposer = cr.job?.includes('آهنگساز') || cr.job?.includes('موسیقی');
        const roleLabel = isComposer ? 'آهنگساز موسیقی متن' : (cr.job || 'عوامل');
        return { matched: true, role: roleLabel, character: undefined };
      }
    }
  }

  // 6. Secondary search text check (exact token match only)
  if (movie.search_text && normActorName && normActorName.length >= 4) {
    const normSearch = normalizeName(movie.search_text);
    if (` ${normSearch} `.includes(` ${normActorName} `)) {
      return { matched: true, role: 'بازیگر', character: undefined };
    }
  }

  return { matched: false };
}

/**
 * Find all movies available on the site for a given actor/filmmaker
 */
export function getSiteMoviesForActor(
  actorName: string,
  actorEnglishName: string | undefined,
  allMovies: Movie[]
): SiteMovieAppearance[] {
  const appearances: SiteMovieAppearance[] = [];
  const seenMovieIds = new Set<number>();

  for (const movie of allMovies) {
    if (seenMovieIds.has(movie.message_id)) continue;

    const match = matchActorInMovie(actorName, actorEnglishName, movie);
    if (match.matched) {
      seenMovieIds.add(movie.message_id);
      appearances.push({
        movie,
        character: match.character,
        role: match.role
      });
    }
  }

  return appearances;
}

/**
 * Iranian cinema detection keywords
 */
const IRANIAN_NAMES_SET = new Set([
  'شهاب حسینی', 'پیمان معادی', 'لیلا حاتمی', 'ترانه علیدوستی', 'نوید محمدزاده',
  'هدیه تهرانی', 'اصغر فرهادی', 'رضا عطاران', 'مریلا زارعی', 'بهرام رادان',
  'پارسا پیروزفر', 'حامد بهداد', 'ساره بیات', 'محسن تنابنده', 'مهناز افشار',
  'مصطفی زمانی', 'پریناز ایزدیار', 'فرهاد اصلانی', 'هوتن شکیبا', 'صابر ابر',
  'علی نصیریان', 'عزت‌الله انتظامی', 'خسرو شکیبایی', 'عباس کیارستمی', 'بهرام بیضایی',
  'مسعود کیمیایی', 'داریوش مهرجویی', 'مجید مجیدی', 'ابراهیم حاتمی‌کیا', 'امیر جدیدی',
  'سعید روستایی', 'پژمان جمشیدی', 'جواد عزتی', 'سحر دولتشاهی', 'طناز طباطبایی',
  'الناز شاکردوست', 'نیکی کریمی', 'غزل شاکری', 'مهدی سلطانی', 'محمود پاک‌نیت'
]);

/**
 * Extract, merge, and enrich all unique actors across all movies in the site
 */
export function extractAllActorsFromSite(allMovies: Movie[]): DetailedActorProfile[] {
  const actorMap = new Map<string, {
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
    siteMovies: SiteMovieAppearance[];
  }>();

  // Helper to add/register actor and track the movie appearance in O(1) time
  const registerActorMovie = (
    name: string,
    englishName: string | undefined,
    photo: string | undefined,
    character: string | undefined,
    job: string | undefined,
    bio: string | undefined,
    birthDate: string | undefined,
    birthPlace: string | undefined,
    awards: ActorAward[] | undefined,
    knownFor: ActorKnownWork[] | undefined,
    isDir: boolean = false,
    movie?: Movie
  ) => {
    if (!name || name.trim().length === 0) return;
    const cleanName = name.trim();
    const canonical = resolveActorCanonicalKey(englishName || cleanName) || resolveActorCanonicalKey(cleanName);
    const key = normalizeName(canonical || englishName || cleanName);
    if (!key) return;

    let existing = actorMap.get(key);
    if (!existing) {
      existing = {
        name: cleanName,
        english_name: englishName,
        photo,
        character,
        job,
        biography: bio,
        birth_date: birthDate,
        birth_place: birthPlace,
        awards,
        known_for: knownFor,
        isDirector: isDir,
        siteMovies: [],
      };
      actorMap.set(key, existing);
    } else {
      if (!existing.english_name && englishName) existing.english_name = englishName;
      if (!existing.photo && photo) existing.photo = photo;
      if (!existing.character && character) existing.character = character;
      if (!existing.job && job) existing.job = job;
      if (!existing.biography && bio) existing.biography = bio;
      if (!existing.birth_date && birthDate) existing.birth_date = birthDate;
      if (!existing.birth_place && birthPlace) existing.birth_place = birthPlace;
      if ((!existing.awards || existing.awards.length === 0) && awards && awards.length > 0) {
        existing.awards = awards;
      }
      if ((!existing.known_for || existing.known_for.length === 0) && knownFor && knownFor.length > 0) {
        existing.known_for = knownFor;
      }
      if (isDir) existing.isDirector = true;
    }

    // Attach movie in O(1) without iterating all movies
    if (movie) {
      if (!existing.siteMovies.some(sm => sm.movie.message_id === movie.message_id)) {
        existing.siteMovies.push({
          movie,
          character: character || 'هنرمند و بازیگر',
          role: isDir ? 'کارگردان' : 'بازیگر',
        });
      }
    }
  };

  // 1. Single pass over all movies (O(N) instead of O(N*M) which froze the browser!)
  for (const movie of allMovies) {
    // A. Directors
    if (movie.director) {
      const dirs = movie.director.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
      for (const dir of dirs) {
        registerActorMovie(dir, undefined, undefined, 'کارگردان', 'کارگردان', undefined, undefined, undefined, undefined, undefined, true, movie);
      }
    }

    // B. Extended database metadata (Known directors, cast, crew)
    const imdbId = movie.imdb_id;
    if (imdbId && KNOWN_EXTENDED_MOVIE_DATA[imdbId]) {
      const ext = KNOWN_EXTENDED_MOVIE_DATA[imdbId];
      for (const d of ext.directors || []) {
        registerActorMovie(d.name, d.english_name, d.photo, d.character || 'کارگردان', d.job || 'کارگردان', d.biography, d.birth_date, d.birth_place, d.awards, d.known_for, true, movie);
      }
      for (const c of ext.cast || []) {
        registerActorMovie(c.name, c.english_name, c.photo, c.character || 'بازیگر', 'بازیگر', c.biography, c.birth_date, c.birth_place, c.awards, c.known_for, false, movie);
      }
      for (const cr of ext.crew || []) {
        registerActorMovie(cr.name, cr.english_name, cr.photo, cr.character, cr.job || 'عوامل', cr.biography, cr.birth_date, cr.birth_place, cr.awards, cr.known_for, cr.job?.includes('کارگردان') || false, movie);
      }
    }

    // C. Parsed actor_photos JSON
    if (movie.actor_photos) {
      try {
        const parsed = JSON.parse(movie.actor_photos);
        if (Array.isArray(parsed)) {
          for (const a of parsed) {
            registerActorMovie(a.name, a.english_name, a.photo, a.character, 'بازیگر', a.biography, undefined, undefined, undefined, undefined, false, movie);
          }
        }
      } catch {}
    }

    // D. Comma separated movie.actors
    if (movie.actors) {
      const names = movie.actors.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
      for (const name of names) {
        registerActorMovie(name, undefined, undefined, 'بازیگر', 'بازیگر', undefined, undefined, undefined, undefined, undefined, false, movie);
      }
    }
  }

  // 2. Add verified curated list of popular stars if not already present
  const popularCuratedNames = [
    'کریستوفر نولان', 'کیلین مورفی', 'رابرت داونی جونیور', 'امیلی بلانت', 'مت دیمون',
    'فلورنس پیو', 'تیموتی شالامی', 'زندایا', 'ربکا فرگوسن', 'خاویر باردم',
    'جاش برولین', 'آستین باتلر', 'متیو مک‌کانهی', 'آن هاتاوی', 'جسیکا چستین',
    'مایکل کین', 'لئوناردو دی‌کاپریو', 'کریستین بیل', 'هیت لجر', 'گری اولدمن',
    'شهاب حسینی', 'پیمان معادی', 'لیلا حاتمی', 'ترانه علیدوستی', 'ساره بیات',
    'مریلا زارعی', 'نوید محمدزاده', 'پریناز ایزدیار', 'هوتن شکیبا', 'رضا عطاران',
    'هیرویوکی سانادا', 'آنا ساوای', 'کازمو جارویس', 'تادانوبو آسانو', 'برایان کرانستون',
    'آرون پاول', 'رایان رینولدز', 'هیو جکمن', 'جک بلک', 'امی پولر',
    'برد پیت', 'تام کروز', 'واکین فینیکس', 'آل پاچینو', 'رابرت دنیرو',
    'اصغر فرهادی', 'دنی ویلنوو', 'کوئنتین تارانتینو', 'مارتین اسکورسیزی', 'هانس زیمر'
  ];

  for (const name of popularCuratedNames) {
    registerActorMovie(name, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false);
  }

  // 3. Merge custom admin-created actors
  const customActors = ActorStorageService.getCustomActors();
  for (const custom of customActors) {
    registerActorMovie(
      custom.name,
      custom.english_name,
      custom.photo,
      custom.character || 'هنرمند و بازیگر',
      custom.job || (custom.isDirector ? 'کارگردان' : 'بازیگر'),
      custom.biography,
      custom.birth_date,
      custom.birth_place,
      custom.awards,
      custom.known_for,
      custom.isDirector || custom.job?.includes('کارگردان') || false
    );
  }

  // 4. Build Detailed Actor Profiles
  const profiles: DetailedActorProfile[] = [];
  const overrides = ActorStorageService.getActorOverrides();

  for (const [key, raw] of actorMap.entries()) {
    const verifiedData = VERIFIED_PERSON_BIOS[raw.name] || (raw.english_name ? VERIFIED_PERSON_BIOS[raw.english_name.toLowerCase()] : undefined)
      || getServerActorBio(raw.name, raw.english_name);
    
    const override = overrides[key] || 
                     overrides[raw.name.toLowerCase().trim()] || 
                     (raw.english_name ? overrides[raw.english_name.toLowerCase().trim()] : undefined);

    const isCustomActor = customActors.some(ca => ca.id === key || normalizeName(ca.name) === key);
    const isEdited = !!override;

    const finalName = override?.name || raw.name;
    const finalEnglishName = override?.english_name !== undefined ? override.english_name : raw.english_name;
    const displayName = resolveActorCanonicalKey(finalName) || resolveActorCanonicalKey(finalEnglishName) || finalName;
    const verifiedPhoto = override?.photo || resolveActorPhoto(finalName, finalEnglishName, raw.photo || verifiedData?.photo);
    const bioText = override?.biography !== undefined ? override.biography : (raw.biography || verifiedData?.biography);
    const birthDate = override?.birth_date !== undefined ? override.birth_date : (raw.birth_date || verifiedData?.birth_date);
    const birthPlace = override?.birth_place !== undefined ? override.birth_place : (raw.birth_place || verifiedData?.birth_place);
    const nationality = override?.nationality !== undefined ? override.nationality : (raw.nationality || verifiedData?.nationality);
    const job = override?.job !== undefined ? override.job : (raw.job || verifiedData?.job);
    const verifiedAwards = override?.awards !== undefined ? override.awards : (raw.awards || verifiedData?.awards || []);
    const verifiedKnownFor = override?.known_for !== undefined ? override.known_for : (raw.known_for || verifiedData?.known_for || []);
    const character = override?.character !== undefined ? override.character : raw.character;

    const siteMovies = raw.siteMovies;

    // Determine category
    const isIranian = IRANIAN_NAMES_SET.has(finalName) || (birthPlace && (birthPlace.includes('ایران') || birthPlace.includes('تهران')));
    const isWinner = (verifiedAwards && verifiedAwards.length > 0) || (bioText && (bioText.includes('برنده') || bioText.includes('اسکار') || bioText.includes('سیمرغ')));
    const isDir = (override?.isDirector !== undefined ? override.isDirector : raw.isDirector) || job?.includes('کارگردان');

    let category: 'iranian' | 'foreign' | 'director' | 'winner' = override?.category || 'foreign';
    if (!override?.category) {
      if (isIranian) category = 'iranian';
      else if (isDir) category = 'director';
      else if (isWinner) category = 'winner';
    }

    // Lazy fallback bio
    const fallbackBio = bioText || (isDir ? `${displayName}، کارگردان سینما.` : `${displayName}، هنرمند و بازیگر سینما.`);

    profiles.push({
      id: key,
      name: displayName,
      english_name: finalEnglishName,
      photo: verifiedPhoto,
      character: character || (siteMovies.length > 0 ? siteMovies[0].character : 'هنرمند و بازیگر'),
      job: job || (isDir ? 'کارگردان' : 'بازیگر'),
      biography: bioText || fallbackBio,
      birth_date: birthDate,
      birth_place: birthPlace,
      nationality: nationality || (isIranian ? 'ایران' : undefined),
      awards: verifiedAwards,
      known_for: verifiedKnownFor,
      isDirector: isDir,
      siteMovies,
      siteMovieCount: siteMovies.length,
      category,
      is_custom: isCustomActor,
      is_edited: isEdited
    });
  }

  // Sort by:
  // 1. Has movies on site (descending)
  // 2. Has awards (descending)
  // 3. Name (ascending)
  profiles.sort((a, b) => {
    if (b.siteMovieCount !== a.siteMovieCount) {
      return b.siteMovieCount - a.siteMovieCount;
    }
    const aAwards = a.awards?.length || 0;
    const bAwards = b.awards?.length || 0;
    if (bAwards !== aAwards) {
      return bAwards - aAwards;
    }
    return a.name.localeCompare(b.name, 'fa');
  });

  return profiles;
}

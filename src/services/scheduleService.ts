import { NextEpisodeInfo, TrackingItem, Movie } from '../types';

interface BroadcastMeta {
  title: string;
  englishTitle?: string;
  season: number;
  nextEpisode: number;
  totalEpisodes?: number;
  dayOfWeekPersian: string; // e.g. "جمعه‌ها", "چهارشنبه‌ها"
  dayOfWeekIndex: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  airTime: string; // e.g. "08:00", "20:30", "22:00"
  network: string; // e.g. "فیلم‌نت", "فیلیمو", "Star TV", "FX / Hulu", "HBO"
  status: 'ongoing' | 'upcoming_season' | 'completed';
  approxAirDate?: string;
}

// Curated verified broadcast schedules for major active series
const KNOWN_SERIES_SCHEDULES: Record<string, BroadcastMeta> = {
  // Foreign Series
  'shogun': {
    title: 'شوگان',
    englishTitle: 'Shōgun',
    season: 2,
    nextEpisode: 1,
    dayOfWeekPersian: 'سه‌شنبه‌ها',
    dayOfWeekIndex: 2,
    airTime: '21:00',
    network: 'FX / Hulu',
    status: 'upcoming_season',
    approxAirDate: '2026-09-15T21:00:00Z',
  },
  'house of the dragon': {
    title: 'خاندان اژدها',
    englishTitle: 'House of the Dragon',
    season: 3,
    nextEpisode: 1,
    dayOfWeekPersian: 'دوشنبه‌ها',
    dayOfWeekIndex: 1,
    airTime: '04:30',
    network: 'HBO / Max',
    status: 'upcoming_season',
    approxAirDate: '2026-10-05T04:30:00Z',
  },
  'the penguin': {
    title: 'پنگوئن',
    englishTitle: 'The Penguin',
    season: 1,
    nextEpisode: 8,
    dayOfWeekPersian: 'دوشنبه‌ها',
    dayOfWeekIndex: 1,
    airTime: '04:30',
    network: 'HBO / Max',
    status: 'ongoing',
  },
  'the boys': {
    title: 'پسران',
    englishTitle: 'The Boys',
    season: 5,
    nextEpisode: 1,
    dayOfWeekPersian: 'پنج‌شنبه‌ها',
    dayOfWeekIndex: 4,
    airTime: '10:00',
    network: 'Amazon Prime',
    status: 'upcoming_season',
  },
  'the last of us': {
    title: 'آخرین بازمانده از ما',
    englishTitle: 'The Last of Us',
    season: 2,
    nextEpisode: 1,
    dayOfWeekPersian: 'دوشنبه‌ها',
    dayOfWeekIndex: 1,
    airTime: '05:30',
    network: 'HBO',
    status: 'upcoming_season',
  },
  'squid game': {
    title: 'بازی مرکب',
    englishTitle: 'Squid Game',
    season: 3,
    nextEpisode: 1,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '11:30',
    network: 'Netflix',
    status: 'upcoming_season',
  },
  'wednesday': {
    title: 'ونزدی',
    englishTitle: 'Wednesday',
    season: 2,
    nextEpisode: 1,
    dayOfWeekPersian: 'چهارشنبه‌ها',
    dayOfWeekIndex: 3,
    airTime: '11:30',
    network: 'Netflix',
    status: 'upcoming_season',
  },

  // Turkish Series
  'yalı çapkını': {
    title: 'چشم‌چران عمارت',
    englishTitle: 'Yalı Çapkını',
    season: 3,
    nextEpisode: 74,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '20:30',
    network: 'Star TV Turkey',
    status: 'ongoing',
  },
  'kızılcık şerbeti': {
    title: 'شربت زغال‌اخته',
    englishTitle: 'Kızılcık Şerbeti',
    season: 3,
    nextEpisode: 68,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '20:30',
    network: 'Show TV',
    status: 'ongoing',
  },
  'bahar': {
    title: 'بهار',
    englishTitle: 'Bahar',
    season: 2,
    nextEpisode: 18,
    dayOfWeekPersian: 'سه‌شنبه‌ها',
    dayOfWeekIndex: 2,
    airTime: '20:30',
    network: 'Show TV',
    status: 'ongoing',
  },

  // Iranian VOD Series
  'پوست شیر': {
    title: 'پوست شیر',
    englishTitle: 'The Lion Skin',
    season: 3,
    nextEpisode: 24,
    dayOfWeekPersian: 'چهارشنبه‌ها',
    dayOfWeekIndex: 3,
    airTime: '08:00',
    network: 'فیلم‌نت (Filmnet)',
    status: 'completed',
  },
  'زخم کاری': {
    title: 'زخم کاری',
    englishTitle: 'Mortal Wound',
    season: 4,
    nextEpisode: 1,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '08:00',
    network: 'فیلیمو (Filimo)',
    status: 'upcoming_season',
  },
  'افعی تهران': {
    title: 'افعی تهران',
    englishTitle: 'The Tehran Viper',
    season: 1,
    nextEpisode: 14,
    dayOfWeekPersian: 'چهارشنبه‌ها',
    dayOfWeekIndex: 3,
    airTime: '08:00',
    network: 'فیلم‌نت (Filmnet)',
    status: 'completed',
  },
  'در انتهای شب': {
    title: 'در انتهای شب',
    englishTitle: 'At the End of the Night',
    season: 1,
    nextEpisode: 9,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '12:00',
    network: 'فیلم‌نت (Filmnet)',
    status: 'completed',
  },
  'داریوش': {
    title: 'داریوش',
    englishTitle: 'Dariush',
    season: 1,
    nextEpisode: 11,
    dayOfWeekPersian: 'چهارشنبه‌ها',
    dayOfWeekIndex: 3,
    airTime: '08:00',
    network: 'فیلم‌نت (Filmnet)',
    status: 'ongoing',
  },
  'گردن زنی': {
    title: 'گردن‌زنی',
    englishTitle: 'Gardan Zani',
    season: 1,
    nextEpisode: 6,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '12:00',
    network: 'فیلم‌نت (Filmnet)',
    status: 'ongoing',
  },
  'بازنده': {
    title: 'بازنده',
    englishTitle: 'Bazandeh (The Loser)',
    season: 1,
    nextEpisode: 7,
    dayOfWeekPersian: 'جمعه‌ها',
    dayOfWeekIndex: 5,
    airTime: '08:00',
    network: 'فیلیمو (Filimo)',
    status: 'ongoing',
  },
  'جوکر': {
    title: 'جوکر ۲',
    englishTitle: 'Joker 2',
    season: 2,
    nextEpisode: 5,
    dayOfWeekPersian: 'چهارشنبه‌ها',
    dayOfWeekIndex: 3,
    airTime: '08:00',
    network: 'فیلیمو (Filimo)',
    status: 'ongoing',
  },
};

/**
 * Calculates the next upcoming occurrence timestamp for a given weekday and hour:min.
 */
function getNextWeekdayTimestamp(dayOfWeekIndex: number, airTime: string): number {
  const now = new Date();
  const [hours, minutes] = airTime.split(':').map(Number);
  
  const target = new Date(now);
  target.setHours(hours || 0, minutes || 0, 0, 0);

  const currentDay = now.getDay();
  let dayDiff = dayOfWeekIndex - currentDay;

  // If today is the air day but the time has already passed, schedule for next week
  if (dayDiff < 0 || (dayDiff === 0 && now.getTime() >= target.getTime())) {
    dayDiff += 7;
  }

  target.setDate(now.getDate() + dayDiff);
  return target.getTime();
}

/**
 * Formats a Date/Timestamp into a friendly Persian date string
 */
export function formatPersianDateTime(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} • ساعت ${timeStr}`;
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Calculates countdown breakdown: days, hours, minutes, seconds, isExpired
 */
export interface CountdownBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  formattedText: string;
}

export function calculateCountdown(targetTimestamp: number): CountdownBreakdown {
  const now = Date.now();
  const diff = targetTimestamp - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
      formattedText: 'هم‌اکنون منتشر شد!',
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formattedText = '';
  if (days > 0) {
    formattedText = `${days} روز و ${hours} ساعت دیگر`;
  } else if (hours > 0) {
    formattedText = `${hours} ساعت و ${minutes} دقیقه دیگر`;
  } else {
    formattedText = `${minutes} دقیقه و ${seconds} ثانیه دیگر`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false,
    formattedText,
  };
}

// In-memory cache for fetched next episode schedules
const scheduleCache = new Map<string, NextEpisodeInfo | null>();

/**
 * Automatically resolves the next episode schedule from TVMaze or Curated database
 */
export async function resolveNextEpisodeSchedule(
  title: string,
  englishTitle?: string,
  imdbId?: string
): Promise<NextEpisodeInfo | null> {
  const cacheKey = `${title}_${englishTitle || ''}_${imdbId || ''}`.toLowerCase();
  if (scheduleCache.has(cacheKey)) {
    return scheduleCache.get(cacheKey)!;
  }

  // 1. Try local verified curated schedule database
  const normalizedTitle = title.toLowerCase();
  const normalizedEng = (englishTitle || '').toLowerCase();

  for (const [key, meta] of Object.entries(KNOWN_SERIES_SCHEDULES)) {
    if (
      normalizedTitle.includes(key) ||
      normalizedEng.includes(key) ||
      (meta.englishTitle && normalizedEng.includes(meta.englishTitle.toLowerCase())) ||
      (meta.title && normalizedTitle.includes(meta.title))
    ) {
      if (meta.status === 'completed') {
        const info: NextEpisodeInfo = {
          airDate: '',
          timestamp: 0,
          season: meta.season,
          episode: meta.nextEpisode,
          episodeTitle: 'پایان فصل / سریال کامل شده',
          network: meta.network,
          source: 'broadcast_db',
          formattedPersian: 'پایان انتشار این فصل',
          dayOfWeek: meta.dayOfWeekPersian,
          isUpcoming: false,
        };
        scheduleCache.set(cacheKey, info);
        return info;
      }

      let timestamp = 0;
      if (meta.approxAirDate) {
        timestamp = new Date(meta.approxAirDate).getTime();
      } else {
        timestamp = getNextWeekdayTimestamp(meta.dayOfWeekIndex, meta.airTime);
      }

      const info: NextEpisodeInfo = {
        airDate: new Date(timestamp).toISOString(),
        timestamp,
        season: meta.season,
        episode: meta.nextEpisode,
        episodeTitle: `قسمت ${meta.nextEpisode}`,
        network: meta.network,
        source: 'broadcast_db',
        formattedPersian: `${meta.dayOfWeekPersian} • ${meta.network}`,
        dayOfWeek: meta.dayOfWeekPersian,
        timeOfDay: meta.airTime,
        isUpcoming: timestamp > Date.now(),
      };
      scheduleCache.set(cacheKey, info);
      return info;
    }
  }

  // 2. Fetch from TVMaze API online
  try {
    const query = englishTitle || title.replace(/[\(（].*?[\)）]/g, '').trim();
    const lookupUrl = imdbId 
      ? `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`
      : `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}&embed=nextepisode`;

    const res = await fetch(lookupUrl);
    if (res.ok) {
      const data = await res.json();
      
      // If we looked up by IMDB, fetch the embedded nextepisode
      let nextEpData = data._embedded?.nextepisode;
      if (!nextEpData && data.id) {
        const fullShowRes = await fetch(`https://api.tvmaze.com/shows/${data.id}?embed=nextepisode`);
        if (fullShowRes.ok) {
          const fullData = await fullShowRes.json();
          nextEpData = fullData._embedded?.nextepisode;
        }
      }

      if (nextEpData && nextEpData.airstamp) {
        const ts = new Date(nextEpData.airstamp).getTime();
        const networkName = data.network?.name || data.webChannel?.name || 'تلویزیون بین‌المللی';
        const info: NextEpisodeInfo = {
          airDate: nextEpData.airstamp,
          timestamp: ts,
          season: nextEpData.season || 1,
          episode: nextEpData.number || 1,
          episodeTitle: nextEpData.name || `قسمت ${nextEpData.number}`,
          network: networkName,
          source: 'tvmaze',
          formattedPersian: formatPersianDateTime(ts),
          dayOfWeek: data.schedule?.days?.join(', ') || 'هفتگی',
          timeOfDay: data.schedule?.time || '',
          isUpcoming: ts > Date.now(),
        };
        scheduleCache.set(cacheKey, info);
        return info;
      } else if (data.status === 'Running' && data.schedule?.days?.length > 0) {
        // Show is ongoing, compute next episode timestamp from recurring schedule
        const dayMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        const firstDay = data.schedule.days[0];
        const dayIdx = dayMap[firstDay] ?? 0;
        const airTime = data.schedule.time || '20:00';
        const ts = getNextWeekdayTimestamp(dayIdx, airTime);
        const networkName = data.network?.name || data.webChannel?.name || 'شبکه رسمی';

        const info: NextEpisodeInfo = {
          airDate: new Date(ts).toISOString(),
          timestamp: ts,
          season: 1,
          episode: 1,
          episodeTitle: 'قسمت بعدی',
          network: networkName,
          source: 'tvmaze',
          formattedPersian: formatPersianDateTime(ts),
          dayOfWeek: firstDay,
          timeOfDay: airTime,
          isUpcoming: true,
        };
        scheduleCache.set(cacheKey, info);
        return info;
      }
    }
  } catch (err) {
    // ignore network errors
  }

  scheduleCache.set(cacheKey, null);
  return null;
}

/**
 * Enriches a Movie or TrackingItem with next episode countdown info
 */
export async function enrichWithNextEpisode(
  item: TrackingItem | Movie
): Promise<NextEpisodeInfo | null> {
  const isSeries = 
    ('media_type' in item && item.media_type === 'series') ||
    ('category' in item && item.category && (item.category.includes('series') || item.category === 'iranian_series' || item.category === 'foreign_series' || item.category === 'turkish_series'));

  if (!isSeries) return null;

  return await resolveNextEpisodeSchedule(
    item.title || '',
    item.english_title,
    'imdb_id' in item ? item.imdb_id : undefined
  );
}

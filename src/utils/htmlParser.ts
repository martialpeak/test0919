import { Movie } from '../types';
import { enrichMovie } from './movieEnricher';

export interface ParsedMovieData extends Partial<Movie> {
  title: string;
}

export function parseMovieHtml(htmlString: string): ParsedMovieData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // 1. Title
  let title = doc.querySelector('.hero-title')?.textContent?.trim() || '';
  let englishTitle = '';
  let year = '';

  // Parse subtitle (e.g., "Evil Dead Burn — 2026" or "Oppenheimer (2023)")
  const subtitleText = doc.querySelector('.hero-subtitle')?.textContent?.trim() || '';
  if (subtitleText) {
    const dashMatch = subtitleText.match(/^(.*?)\s*—\s*(\d{4}|\d{2,4})$/);
    const parenMatch = subtitleText.match(/^(.*?)\s*\(([\d]{4})\)$/);
    if (dashMatch) {
      englishTitle = dashMatch[1].trim();
      year = dashMatch[2].trim();
    } else if (parenMatch) {
      englishTitle = parenMatch[1].trim();
      year = parenMatch[2].trim();
    } else {
      englishTitle = subtitleText;
    }
  }

  // Fallback to <title> if hero title is not found
  if (!title) {
    const docTitle = doc.querySelector('title')?.textContent?.trim() || '';
    const match = docTitle.match(/^(.*?)\s*\((\d{4})\)$/);
    if (match) {
      title = match[1].trim();
      if (!year) year = match[2].trim();
    } else {
      title = docTitle.replace(/ - فیلم بره| - MovieBrowser/g, '').trim();
    }
  }

  // 2. Poster
  const posterImg = doc.querySelector('.hero img, img[alt="poster"], .poster img') as HTMLImageElement | null;
  let posterUrl = posterImg?.getAttribute('src')?.trim() || '';

  // 3. Info Table
  let genre = '';
  let actors = '';
  let rating = '';
  let quality = '';
  let country = '';
  let channel = '';
  let trailerUrl = '';
  let imdbId = '';
  let boxOffice = '';

  const rows = doc.querySelectorAll('.info-table tr, table tr');
  rows.forEach((tr) => {
    const th = tr.querySelector('th')?.textContent?.trim() || '';
    const td = tr.querySelector('td');
    if (!td) return;

    const tdText = td.textContent?.trim() || '';

    // Genre
    if (th.includes('ژانر') || th.toLowerCase().includes('genre')) {
      const tags = Array.from(td.querySelectorAll('.tag, .badge, span'))
        .map((el) => el.textContent?.trim())
        .filter(Boolean);
      if (tags.length > 0) {
        genre = tags.join('، ');
      } else {
        genre = tdText.replace(/\s+/g, ' ');
      }
    }

    // Actors
    if (th.includes('بازیگران') || th.toLowerCase().includes('actor') || th.toLowerCase().includes('cast')) {
      actors = tdText;
    }

    // Rating
    if (th.includes('امتیاز') || th.includes('⭐') || th.toLowerCase().includes('rating')) {
      const ratingMatch = tdText.match(/(\d+(\.\d+)?)/);
      if (ratingMatch) {
        rating = ratingMatch[1];
      } else {
        rating = tdText;
      }
    }

    // Quality
    if (th.includes('کیفیت') || th.toLowerCase().includes('quality')) {
      quality = tdText;
      // Dash/unknown quality is meaningless — fall back to 720p BluRay below
      if (/^[-—–?؟\s]*$/.test(quality)) quality = '';
    }

    // Year
    if (th.includes('سال') || th.toLowerCase().includes('year')) {
      const yearMatch = tdText.match(/(\d{4})/);
      if (yearMatch) {
        year = yearMatch[1];
      } else if (tdText) {
        year = tdText;
      }
    }

    // Country
    if (th.includes('کشور') || th.toLowerCase().includes('country')) {
      // Remove any img alt text duplicate if present
      country = tdText.replace(/\s+/g, ' ').trim();
    }

    // Source / Channel
    if (th.includes('منبع') || th.includes('کانال') || th.toLowerCase().includes('source') || th.toLowerCase().includes('channel')) {
      channel = tdText;
    }

    // Box Office
    if (th.includes('باکس') || th.includes('گیشه') || th.includes('فروش') || th.toLowerCase().includes('box office')) {
      boxOffice = tdText;
    }

    // IMDb
    if (th.toLowerCase().includes('imdb')) {
      const imdbLink = td.querySelector('a[href*="imdb.com"]')?.getAttribute('href');
      const imdbMatch = (imdbLink || tdText).match(/(tt\d{6,10})/);
      if (imdbMatch) {
        imdbId = imdbMatch[1];
      }
    }

    // Trailer
    if (th.includes('تریلر') || th.toLowerCase().includes('trailer')) {
      const link = td.querySelector('a')?.getAttribute('href');
      if (link) trailerUrl = link;
      else if (tdText.startsWith('http')) trailerUrl = tdText;
    }
  });

  // 4. Plot / Description
  const plotEl = doc.querySelector('.plot-text, .plot-section p, .story, .description, .summary');
  const description = plotEl?.textContent?.trim() || '';

  // 5. Category inference
  let category = 'foreign_movies';
  const cCountry = country.toLowerCase();
  const allText = `${title} ${englishTitle} ${genre} ${quality}`.toLowerCase();
  // 'فصل/season' is only series-evidence when followed by a number/ordinal
  // (فصل ۲، فصل دوم، Season 3). Compound film titles like «فصل شکار» (Hunting Season)
  // or 'Haunt Season' must not flip a movie into a series.
  const seasonPattern = /(فصل|season)\s*([\d۰-۹]+|اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم)/;
  const isSeries = allText.includes('سریال') || seasonPattern.test(allText) || allText.includes('series');
  const isChildContent = genre.includes('انیمیشن') || genre.includes('کودک') || allText.includes('animation') || allText.includes('children') || allText.includes('cartoon');

  if (isSeries && isChildContent) {
    category = 'children_series';
  } else if (cCountry.includes('ترکی') || cCountry.includes('turkey') || allText.includes('ترکی')) {
    category = isSeries ? 'turkish_series' : 'foreign_movies';
  } else if (cCountry.includes('ایران') || cCountry.includes('iran')) {
    category = isSeries ? 'iranian_series' : 'iranian_movies';
  } else if (cCountry.includes('هند') || cCountry.includes('india')) {
    category = 'indian_movies';
  } else if (isChildContent) {
    category = 'children';
  } else if (isSeries) {
    category = 'foreign_series';
  } else {
    category = 'foreign_movies';
  }

  // Base raw parsed data
  const rawData: Partial<Movie> & { title: string } = {
    title: title || 'بدون عنوان',
    english_title: englishTitle,
    year: year || new Date().getFullYear().toString(),
    genre: genre || 'درام',
    rating: rating || '7.0',
    quality: quality || '720p BluRay',
    country: country || 'آمریکا',
    channel: channel || '',
    category,
    actors,
    poster_url: posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    description: description || '',
    trailer_url: trailerUrl || '',
    imdb_id: imdbId || '',
    box_office: boxOffice || '',
  };

  // Run through auto-enricher to populate missing IMDb ID, Box office, trailer, stills, etc.
  const enriched = enrichMovie(rawData);

  return enriched as ParsedMovieData;
}

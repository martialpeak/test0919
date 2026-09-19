/**
 * Checks if a movie/series is of Iranian origin based on category, country, or title.
 */
export function isIranianMovie(movie: { category?: string; country?: string; title?: string; english_title?: string } | null | undefined): boolean {
  if (!movie) return false;
  
  if (movie.category === 'iranian_movies' || movie.category === 'iranian_series') {
    return true;
  }

  const cleanCountry = (movie.country || '').trim().toLowerCase();
  if (cleanCountry.includes('ایران') || cleanCountry === 'iran' || cleanCountry.includes('iranian')) {
    return true;
  }

  return false;
}

/**
 * Converts English digits to Persian digits (e.g., 1402 -> ۱۴۰۲)
 */
export function toPersianDigits(num: number | string): string {
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
}

/**
 * Converts Persian/Arabic digits to standard English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Converts a Gregorian year string/number to Solar Hijri (شمسی)
 * e.g., 2010 -> 1389, 2024 -> 1403
 */
export function gregorianToSolarYear(yearInput: string | number): string {
  if (!yearInput) return '';
  const engYearStr = toEnglishDigits(String(yearInput)).trim();
  const num = parseInt(engYearStr, 10);
  
  if (isNaN(num)) return String(yearInput);

  // If already in Solar Hijri range (1200 - 1500)
  if (num >= 1200 && num <= 1500) {
    return String(num);
  }

  // If in Gregorian range (1900 - 2100)
  if (num >= 1800 && num <= 2100) {
    return String(num - 621);
  }

  return String(yearInput);
}

/**
 * Converts Solar Hijri year to Gregorian year
 * e.g., 1389 -> 2010, 1402 -> 2023
 */
export function solarToGregorianYear(yearInput: string | number): string {
  if (!yearInput) return '';
  const engYearStr = toEnglishDigits(String(yearInput)).trim();
  const num = parseInt(engYearStr, 10);

  if (isNaN(num)) return String(yearInput);

  if (num >= 1200 && num <= 1500) {
    return String(num + 621);
  }

  return String(yearInput);
}

/**
 * Formats a movie's release year according to its origin:
 * - Iranian movies/series: returns the Solar Hijri (شمسی) year (e.g., "1389", "1401", "1402", "1403")
 * - Foreign movies/series: returns the Gregorian year (e.g., "2024", "2023")
 */
export function formatMovieYear(
  movie: { year?: string; category?: string; country?: string; title?: string } | null | undefined,
  mode: 'default' | 'persian_digits' | 'with_gregorian_parens' = 'default'
): string {
  if (!movie || !movie.year) return '';

  const rawYear = String(movie.year).trim();
  const isIran = isIranianMovie(movie);

  if (isIran) {
    const solar = gregorianToSolarYear(rawYear);
    if (mode === 'persian_digits') {
      return toPersianDigits(solar);
    }
    if (mode === 'with_gregorian_parens') {
      const greg = solarToGregorianYear(solar);
      return greg !== solar ? `${solar} (${greg})` : solar;
    }
    return solar;
  }

  // Foreign movies
  if (mode === 'persian_digits') {
    return toPersianDigits(rawYear);
  }
  return rawYear;
}

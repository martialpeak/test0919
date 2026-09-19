export const CATEGORIES: Record<string, string> = {
  children_series: "سریال کودک",
  turkish_series: "سریال ترکی",
  iranian_series: "سریال ایرانی",
  foreign_series: "سریال خارجی",
  iranian_movies: "فیلم ایرانی",
  indian_movies: "فیلم هندی",
  foreign_movies: "فیلم خارجی",
  children: "کودک",
};

export function getCategoryName(category: string): string {
  if (category === 'series' || category === 'kids_series') {
    return 'سریال کودک';
  }
  return CATEGORIES[category] || category;
}

export function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'children_series':
    case 'series':
    case 'kids_series':
      return '🧸';
    case 'turkish_series':
      return '🇹🇷';
    case 'iranian_series':
      return '🇮🇷';
    case 'foreign_series':
      return '🌍';
    case 'iranian_movies':
      return '🎬';
    case 'indian_movies':
      return '🇮🇳';
    case 'foreign_movies':
      return '🌐';
    case 'children':
      return '🎈';
    default:
      return '🍿';
  }
}

export function getCategoryColor(category: string): { 
  bg: string; 
  text: string; 
  border: string; 
  activeGradient: string;
  glow: string;
  accent: string;
} {
  switch (category) {
    case 'children_series':
    case 'series':
    case 'kids_series':
      return { 
        bg: 'bg-purple-500/15', 
        text: 'text-purple-300', 
        border: 'border-purple-500/30',
        activeGradient: 'from-purple-600 to-indigo-600',
        glow: 'shadow-purple-600/30',
        accent: '#A855F7'
      };
    case 'turkish_series':
      return { 
        bg: 'bg-red-500/15', 
        text: 'text-red-400', 
        border: 'border-red-500/30',
        activeGradient: 'from-red-600 to-rose-700',
        glow: 'shadow-red-600/30',
        accent: '#EF4444'
      };
    case 'iranian_series':
      return { 
        bg: 'bg-emerald-500/15', 
        text: 'text-emerald-300', 
        border: 'border-emerald-500/30',
        activeGradient: 'from-emerald-600 to-teal-700',
        glow: 'shadow-emerald-600/30',
        accent: '#10B981'
      };
    case 'foreign_series':
      return { 
        bg: 'bg-cyan-500/15', 
        text: 'text-cyan-300', 
        border: 'border-cyan-500/30',
        activeGradient: 'from-cyan-600 to-blue-700',
        glow: 'shadow-cyan-600/30',
        accent: '#06B6D4'
      };
    case 'iranian_movies':
      return { 
        bg: 'bg-teal-500/15', 
        text: 'text-teal-300', 
        border: 'border-teal-500/30',
        activeGradient: 'from-teal-600 to-emerald-700',
        glow: 'shadow-teal-600/30',
        accent: '#14B8A6'
      };
    case 'indian_movies':
      return { 
        bg: 'bg-amber-500/15', 
        text: 'text-amber-300', 
        border: 'border-amber-500/30',
        activeGradient: 'from-amber-600 to-orange-700',
        glow: 'shadow-amber-600/30',
        accent: '#F59E0B'
      };
    case 'foreign_movies':
      return { 
        bg: 'bg-blue-500/15', 
        text: 'text-blue-300', 
        border: 'border-blue-500/30',
        activeGradient: 'from-blue-600 to-indigo-700',
        glow: 'shadow-blue-600/30',
        accent: '#3B82F6'
      };
    case 'children':
      return { 
        bg: 'bg-pink-500/15', 
        text: 'text-pink-300', 
        border: 'border-pink-500/30',
        activeGradient: 'from-pink-600 to-rose-600',
        glow: 'shadow-pink-600/30',
        accent: '#EC4899'
      };
    default:
      return { 
        bg: 'bg-rose-500/15', 
        text: 'text-rose-300', 
        border: 'border-rose-500/30',
        activeGradient: 'from-[#E50914] to-red-700',
        glow: 'shadow-red-600/30',
        accent: '#E50914'
      };
  }
}

/**
 * Checks whether an item represents a series (multi-episode/season TV show)
 */
export function isSeriesItem(movie: {
  category?: string;
  genre?: string;
  title?: string;
  english_title?: string;
  quality?: string;
}): boolean {
  if (!movie) return false;
  const cat = movie.category || '';
  if (
    cat === 'children_series' ||
    cat === 'series' || 
    cat === 'kids_series' ||
    cat === 'turkish_series' || 
    cat === 'iranian_series' || 
    cat === 'foreign_series' || 
    cat.includes('series')
  ) {
    return true;
  }
  // A movies-category is strong evidence; only flip to series on explicit series markers
  // in the title ('سریال'/'series'), NOT on bare 'فصل'/'season' — film titles like
  // «فصل شکار» (Hunting Season) / 'Haunt Season' contain those words but are movies.
  const isMovieCategory = /^(foreign_movies|iranian_movies|indian_movies|indian_movies_old|movies)$/.test(cat);
  const titleOnly = `${movie.title || ''} ${movie.english_title || ''}`.toLowerCase();
  if (isMovieCategory && !titleOnly.includes('سریال') && !/\bseries\b/.test(titleOnly)) {
    return false;
  }
  const text = `${movie.title || ''} ${movie.english_title || ''} ${movie.genre || ''} ${movie.quality || ''}`.toLowerCase();
  // 'فصل/season' only counts when followed by a number/ordinal (فصل ۲، فصل دوم، Season 3) —
  // plain compound titles like «فصل شکار» / 'Haunt Season' don't match.
  const seasonPattern = /(فصل|season)\s*([\d۰-۹]+|اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم)/;
  return (
    text.includes('سریال') ||
    seasonPattern.test(text) ||
    text.includes('series')
  );
}

/**
 * Robust category matching engine for filtering and counting
 */
export function matchesCategory(
  movie: {
    category?: string;
    country?: string;
    genre?: string;
    title?: string;
    english_title?: string;
    quality?: string;
  },
  categoryKey: string
): boolean {
  if (!movie || !categoryKey || categoryKey === 'ALL') return true;

  const cat = movie.category || '';
  const country = (movie.country || '').toLowerCase();
  const genre = (movie.genre || '').toLowerCase();
  const titleText = `${movie.title || ''} ${movie.english_title || ''}`.toLowerCase();
  const isSeries = isSeriesItem(movie);
  const isChildContent = 
    genre.includes('انیمیشن') ||
    genre.includes('کودک') ||
    genre.includes('کارتون') ||
    genre.includes('نوجوان') ||
    genre.includes('animation') ||
    genre.includes('children') ||
    genre.includes('kids') ||
    genre.includes('family') ||
    titleText.includes('انیمیشن') ||
    titleText.includes('کارتون');

  switch (categoryKey) {
    // «تازه‌ترین فیلم‌ها و سریال‌ها» — virtual category: matches everything
    // (list is already sorted newest-first via NEWEST sort default)
    case '__latest__':
      return true;

    case 'children_series':
    case 'series':
    case 'kids_series':
      return (
        cat === 'children_series' ||
        cat === 'kids_series' ||
        (isSeries && isChildContent) ||
        (cat === 'series' && isChildContent)
      );

    case 'turkish_series':
      return (
        cat === 'turkish_series' ||
        (isSeries && !isChildContent && (country.includes('ترکیه') || country.includes('turkey') || country.includes('turk')))
      );

    case 'iranian_series':
      return (
        cat === 'iranian_series' ||
        (isSeries && !isChildContent && (country.includes('ایران') || country.includes('iran')))
      );

    case 'foreign_series':
      return (
        cat === 'foreign_series' ||
        (isSeries &&
          !isChildContent &&
          !country.includes('ایران') &&
          !country.includes('iran') &&
          !country.includes('ترکیه') &&
          !country.includes('turkey'))
      );

    case 'iranian_movies':
      return (
        cat === 'iranian_movies' ||
        (!isSeries && (country.includes('ایران') || country.includes('iran') || cat.includes('iranian_movies')))
      );

    case 'indian_movies':
      return (
        cat === 'indian_movies' ||
        country.includes('هند') ||
        country.includes('india') ||
        genre.includes('هندی') ||
        genre.includes('hindi') ||
        genre.includes('bollywood')
      );

    case 'foreign_movies':
      return (
        cat === 'foreign_movies' ||
        (!isSeries &&
          !isChildContent &&
          !country.includes('ایران') &&
          !country.includes('iran') &&
          !country.includes('هند') &&
          !country.includes('india'))
      );

    case 'children':
      return (
        cat === 'children' ||
        (!isSeries && isChildContent) ||
        cat === 'kids_movies'
      );

    default:
      return cat === categoryKey;
  }
}

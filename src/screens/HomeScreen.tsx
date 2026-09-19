import React from 'react';
import { Movie, ViewMode, SortType } from '../types';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { CategoryFilter } from '../components/CategoryFilter';
import { CategoryRowSection } from '../components/CategoryRowSection';
import { matchesCategory, CATEGORIES } from '../data/categories';
import { MovieGridCard } from '../components/MovieGridCard';
import { MovieListCard } from '../components/MovieListCard';
import { ExportHtmlModal } from '../components/ExportHtmlModal';
import { useProgressiveList } from '../utils/useProgressiveList';
import { 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  SearchX, 
  HeartCrack,
  Film,
  PlusCircle,
  FileCode,
  Download,
  Loader2
} from 'lucide-react';

// Build stamp: the hashed filename of the main bundle this page actually loaded.
// Rendered tiny at the bottom of Home — a stale tab/WebView shows an older id.
const BUILD_ID = (() => {
  try {
    const src = document.querySelector('script[src*="/assets/index-"]')?.getAttribute('src') || '';
    const m = src.match(/index-([A-Za-z0-9_-]+)\.js/);
    return m ? m[1] : '?';
  } catch { return '?'; }
})();

interface HomeScreenProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onToggleFavorite: (messageId: number) => void;
  onTrailerClick: (movie: Movie) => void;
  onAddMovie: () => void;
  onUploadHtml?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  isAdmin?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  movies,
  onMovieClick,
  onToggleFavorite,
  onTrailerClick,
  onAddMovie,
  onUploadHtml,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  setShowFavoritesOnly,
  isAdmin = false,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>(() => {
    try { return sessionStorage.getItem('mb_home_category') || 'ALL'; } catch { return 'ALL'; }
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    try { return (sessionStorage.getItem('mb_home_viewmode') as ViewMode) || 'GRID'; } catch { return 'GRID'; }
  });
  const [sortType, setSortType] = React.useState<SortType>(() => {
    try { return (sessionStorage.getItem('mb_home_sort') as SortType) || 'NEWEST'; } catch { return 'NEWEST'; }
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const PAGE_SIZE = 24;

  // Reset to first page whenever search, category, favorites or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, showFavoritesOnly, sortType]);
  const [showExportModal, setShowExportModal] = React.useState<boolean>(false);

  // ---- Scroll restoration: remember position when leaving (opening a movie / tab switch),
  // ---- restore it after the progressive list has re-grown (on remount).
  // The scrollTo(0) fired by opening a movie must NOT be treated as the user's position,
  // so we only persist positions deeper than a threshold (120px).
  const lastRealScrollY = React.useRef<number>(0);
  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 120) lastRealScrollY.current = y;
      try { sessionStorage.setItem('mb_home_scroll', String(lastRealScrollY.current)); } catch {}
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      // unmount = leaving home; persist filter state + last real position
      try {
        sessionStorage.setItem('mb_home_category', selectedCategory);
        sessionStorage.setItem('mb_home_viewmode', viewMode);
        sessionStorage.setItem('mb_home_sort', sortType);
        sessionStorage.setItem('mb_home_scroll', String(lastRealScrollY.current));
      } catch {}
    };
  }, [selectedCategory, viewMode, sortType]);

  // Restore once on mount: jump back to the saved position (instant, no animation), then
  // clear the key so an unrelated later refresh doesn't re-jump.
  React.useEffect(() => {
    let y = 0;
    try { y = parseInt(sessionStorage.getItem('mb_home_scroll') || '0', 10) || 0; } catch {}
    if (!y) return;
    // Wait until the progressive list has rendered enough rows, then jump back.
    const t = setTimeout(() => { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); }, 60);
    return () => clearTimeout(t);
  }, []);

  // When the user ACTIVELY changes category / sort / view while home is mounted, the list
  // becomes a new one: forget the saved position and count so it starts from the top.
  const firstFilterRun = React.useRef(true);
  React.useEffect(() => {
    if (firstFilterRun.current) { firstFilterRun.current = false; return; }
    try {
      sessionStorage.removeItem('mb_home_scroll');
      sessionStorage.removeItem('mb_progressive_count');
    } catch {}
    lastRealScrollY.current = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, sortType, viewMode, searchQuery]);

  // Featured Movie (first prominent movie or top rated)
  // Hero rotation (deterministic, mirrors scripts/fetch_hero_trailer.py on the
  // server): every 8-hour slot the banner moves one step further through the
  // list of high-rated movies (rating >= 8.5); falls back to the first movie.
  const featuredMovie = React.useMemo(() => {
    const high = movies.filter(m => m.rating && parseFloat(m.rating) >= 8.5);
    const pool = high.length > 0 ? high : movies;
    if (pool.length === 0) return null;
    const slot = Math.floor(Date.now() / (8 * 3600 * 1000));
    return pool[slot % pool.length];
  }, [movies]);

  // Filter & Sort Logic
  const filteredMovies = React.useMemo(() => {
    return movies
      .filter((movie) => {
        // Category Filter with robust multi-condition matching
        if (selectedCategory !== 'ALL' && selectedCategory !== '__latest__' && !matchesCategory(movie, selectedCategory)) {
          return false;
        }

        // Favorites Filter
        if (showFavoritesOnly && !movie.is_favorite) {
          return false;
        }

        // Search Query (Search title, english title, actors, genre, country)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = movie.title?.toLowerCase().includes(q);
          const matchesEnTitle = movie.english_title?.toLowerCase().includes(q);
          const matchesActors = movie.actors?.toLowerCase().includes(q);
          const matchesGenre = movie.genre?.toLowerCase().includes(q);
          const matchesCountry = movie.country?.toLowerCase().includes(q);
          const matchesDescription = movie.description?.toLowerCase().includes(q);

          if (!matchesTitle && !matchesEnTitle && !matchesActors && !matchesGenre && !matchesCountry && !matchesDescription) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortType) {
          case 'NEWEST':
            return (b.timestamp || 0) - (a.timestamp || 0) || b.message_id - a.message_id;
          case 'OLDEST':
            return (a.timestamp || 0) - (b.timestamp || 0) || a.message_id - b.message_id;
          case 'YEAR_NEW':
            return (parseInt(b.year || '0') || 0) - (parseInt(a.year || '0') || 0);
          case 'YEAR_OLD':
            return (parseInt(a.year || '0') || 0) - (parseInt(b.year || '0') || 0);
          case 'RATING_HIGH':
            return (parseFloat(b.rating || '0') || 0) - (parseFloat(a.rating || '0') || 0);
          case 'RATING_LOW':
            return (parseFloat(a.rating || '0') || 0) - (parseFloat(b.rating || '0') || 0);
          case 'NAME':
            return a.title.localeCompare(b.title, 'fa');
          default:
            return 0;
        }
      });
  }, [movies, selectedCategory, showFavoritesOnly, searchQuery, sortType]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMovies = React.useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredMovies.slice(start, start + PAGE_SIZE);
  }, [filteredMovies, validCurrentPage]);

  const handlePageChange = (p: number) => {
    const target = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Grouped movies by category for the Netflix/streaming-style default home view
  const isDefaultHomeView = selectedCategory === 'ALL' && !searchQuery && !showFavoritesOnly; // '__latest__' is NOT default view → shows flat filtered list

  const categoryRows = React.useMemo(() => {
    if (!isDefaultHomeView) return [];

    // 1. Sort all movies newest-first
    const sortedAll = [...movies].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0) || b.message_id - a.message_id);

    // Desired priority display order:
    // Latest additions -> Foreign Movies -> Iranian Movies -> Indian Movies -> Korean Movies -> Foreign Series -> Iranian Series -> Turkish Series -> Animation/Kids
    const orderedCategoryKeys: Array<{ key: string; name: string }> = [
      { key: '__latest__', name: 'تازه‌ترین فیلم‌ها و سریال‌ها' },
      { key: 'foreign_movies', name: 'فیلم خارجی' },
      { key: 'iranian_movies', name: 'فیلم ایرانی' },
      { key: 'indian_movies', name: 'فیلم هندی' },
      { key: 'korean_movies', name: 'فیلم کره‌ای' },
      { key: 'foreign_series', name: 'سریال خارجی' },
      { key: 'iranian_series', name: 'سریال ایرانی' },
      { key: 'turkish_series', name: 'سریال ترکی' },
      { key: 'children', name: 'انیمیشن و کودک' },
      { key: 'children_series', name: 'سریال کودک' },
    ];

    const result: Array<{ key: string; name: string; items: Movie[] }> = [];

    for (const cat of orderedCategoryKeys) {
      if (cat.key === '__latest__') {
        result.push({
          key: '__latest__',
          name: cat.name,
          items: sortedAll,
        });
      } else {
        const matching = sortedAll.filter((m) => matchesCategory(m, cat.key));
        if (matching.length > 0) {
          result.push({
            key: cat.key,
            name: cat.name,
            items: matching,
          });
        }
      }
    }

    return result;
  }, [movies, isDefaultHomeView]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      
      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Featured Banner (only show if no search/favorites filter active) */}
      {!searchQuery && !showFavoritesOnly && selectedCategory === 'ALL' && featuredMovie && (
        <FeaturedBanner
          movie={featuredMovie}
          onMovieClick={onMovieClick}
          onTrailerClick={onTrailerClick}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Category Pills Bar — hidden on default home (category rows below already navigate);
          shown for any filtered/list state */}
      {!isDefaultHomeView && (
        <div className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            movies={movies}
          />
        </div>
      )}

      {/* Control Bar: Results count, Sort & View Mode (list-state only) */}
      {!isDefaultHomeView && (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2A2A40]">
        
        {/* Results Info */}
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-[#E50914]" />
          <span className="font-bold text-white text-base">
            {showFavoritesOnly ? 'علاقه‌مندی‌های شما' : 'آرشیو فیلم‌ها و سریال‌ها'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C2E] border border-[#2A2A40] text-xs text-[#A0A0B5] font-semibold">
            {filteredMovies.length} مورد
          </span>
        </div>

        {/* Sort, View Mode & Add Movie Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Admin-only controls */}
          {isAdmin && (
            <>
              {/* Add Movie Action */}
              <button
                id="home-add-movie-button"
                onClick={onAddMovie}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>افزودن فیلم</span>
              </button>

              {/* Upload HTML Action */}
              {onUploadHtml && (
                <button
                  id="home-upload-html-button"
                  onClick={onUploadHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="آپلود فایل HTML فیلم برای تکمیل خودکار"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>آپلود HTML</span>
                </button>
              )}

              {/* Export HTML Action (Admin only) */}
              <button
                id="home-export-html-button"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/25 to-pink-600/25 hover:from-purple-600/35 hover:to-pink-600/35 text-purple-300 border border-purple-500/35 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="خروجی و دانلود فایل HTML بر اساس قالب اختصاصی (دسترسی مدیریت)"
              >
                <Download className="w-3.5 h-3.5 text-pink-300" />
                <span>خروجی HTML</span>
              </button>

              {/* Full-site offline download (ZIP archive) */}
              <a
                id="home-offline-zip-button"
                href="/downloads/moviebrowser_archive.zip"
                download="moviebrowser_archive.zip"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="دانلود آفلاین کل آرشیو (هر فیلم یک صفحه HTML + فهرست جستجو) — حدود ۱۱۰ مگابایت"
                onClick={(e) => {
                  // feedback: brief "downloading" state via title change
                  const el = e.currentTarget;
                  el.setAttribute('title', 'در حال دانلود...');
                }}
              >
                <Download className="w-3.5 h-3.5 text-blue-300" />
                <span>دانلود آفلاین</span>
              </a>
            </>
          )}

          {/* Sort Dropdown */}
          <div className="relative flex items-center bg-[#1C1C2E] border border-[#2A2A40] rounded-xl px-3 py-1.5 text-xs text-[#A0A0B5]">
            <ArrowUpDown className="w-3.5 h-3.5 ml-2 text-[#5A5A72]" />
            <select
              id="sort-select"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="NEWEST" className="bg-[#1C1C2E] text-white">جدیدترین</option>
              <option value="OLDEST" className="bg-[#1C1C2E] text-white">قدیمی‌ترین</option>
              <option value="YEAR_NEW" className="bg-[#1C1C2E] text-white">سال تولید (جدید)</option>
              <option value="YEAR_OLD" className="bg-[#1C1C2E] text-white">سال تولید (قدیم)</option>
              <option value="RATING_HIGH" className="bg-[#1C1C2E] text-white">بالاترین امتیاز</option>
              <option value="RATING_LOW" className="bg-[#1C1C2E] text-white">پایین‌ترین امتیاز</option>
              <option value="NAME" className="bg-[#1C1C2E] text-white">نام اثر</option>
            </select>
          </div>

          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex items-center bg-[#1C1C2E] border border-[#2A2A40] p-1 rounded-xl">
            <button
              id="view-mode-grid"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'GRID' ? 'bg-[#E50914] text-white' : 'text-[#5A5A72] hover:text-white'
              }`}
              title="نمایش شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="view-mode-list"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'LIST' ? 'bg-[#E50914] text-white' : 'text-[#5A5A72] hover:text-white'
              }`}
              title="نمایش سطری"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
      )}

      {/* Movies Content / Empty State */}
      {isDefaultHomeView ? (
        <div className="space-y-6">
          {categoryRows.map((row) => (
            <CategoryRowSection
              key={row.key}
              categoryKey={row.key}
              categoryName={row.name}
              movies={row.items}
              onMovieClick={onMovieClick}
              onToggleFavorite={onToggleFavorite}
              onTrailerClick={onTrailerClick}
              onSelectCategory={(key) => {
                if (key === '__latest__') {
                  // Latest = virtual category: flat list of ALL titles, newest first, paginated
                  setSortType('NEWEST');
                  setSelectedCategory('__latest__');
                } else {
                  setSelectedCategory(key);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#141420] rounded-3xl border border-[#2A2A40] my-6">
          {showFavoritesOnly ? (
            <>
              <HeartCrack className="w-16 h-16 text-rose-500/60 mb-4 stroke-1" />
              <h3 className="text-xl font-bold text-white mb-2">هنوز هیچ فیلمی به علاقه‌مندی‌ها اضافه نشده است</h3>
              <p className="text-sm text-[#A0A0B5] max-w-md mb-6">
                با زدن روی آیکون قلب در کنار هر فیلم یا سریال، آن را در این بخش نگه دارید.
              </p>
              <button
                id="reset-favorites-filter-btn"
                onClick={() => setShowFavoritesOnly(false)}
                className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold shadow-lg shadow-red-600/30 hover:bg-red-600 transition-colors"
              >
                مشاهده تمام فیلم‌ها
              </button>
            </>
          ) : (
            <>
              <SearchX className="w-16 h-16 text-[#5A5A72] mb-4 stroke-1" />
              <h3 className="text-xl font-bold text-white mb-2">موردی یافت نشد</h3>
              <p className="text-sm text-[#A0A0B5] max-w-md mb-6">
                هیچ فیلم یا سریالی با عبارت «{searchQuery}» یا دسته‌بندی انتخاب شده پیدا نشد.
              </p>
              <button
                id="reset-all-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#242438] text-white text-sm font-bold border border-[#3A3A55] hover:bg-[#2C2C45] transition-colors"
              >
                پاک کردن فیلترها
              </button>
            </>
          )}
        </div>
      ) : isDefaultHomeView ? (
        /* Default home: one compact rail row — max 6 newest cards (user-approved mockup, option A).
           Applies in BOTH view modes so the home stays compact; search/category/favorites
           keep the full grid or list + pagination. */
        <div
          className="flex gap-4 sm:gap-5 overflow-x-auto pt-4 pb-5 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A40 transparent' }}
        >
          {paginatedMovies.slice(0, 6).map((movie) => (
            <div
              key={movie.message_id}
              className="w-[46vw] sm:w-40 md:w-44 lg:w-48 shrink-0 snap-start"
            >
              <MovieGridCard
                movie={movie}
                onMovieClick={onMovieClick}
                onToggleFavorite={onToggleFavorite}
                onTrailerClick={onTrailerClick}
              />
            </div>
          ))}
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {paginatedMovies.map((movie) => (
            <MovieGridCard
              key={movie.message_id}
              movie={movie}
              onMovieClick={onMovieClick}
              onToggleFavorite={onToggleFavorite}
              onTrailerClick={onTrailerClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedMovies.map((movie) => (
            <MovieListCard
              key={movie.message_id}
              movie={movie}
              onMovieClick={onMovieClick}
              onToggleFavorite={onToggleFavorite}
              onTrailerClick={onTrailerClick}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isDefaultHomeView && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 pt-6 border-t border-[#2A2A40]" dir="ltr">
          <button
            onClick={() => handlePageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            className="px-4 py-2 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-sm text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            قبلی
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 2)
            .reduce<(number | string)[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                acc.push('...');
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) => (
              typeof item === 'string' ? (
                <span key={`dots-${idx}`} className="px-2 text-[#5A5A72]">...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => handlePageChange(item)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    validCurrentPage === item
                      ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 border border-[#8B5CF6]'
                      : 'bg-[#1C1C2E] border border-[#2A2A40] text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6]/50'
                  }`}
                >
                  {item}
                </button>
              )
            ))}

          <button
            onClick={() => handlePageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-sm text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            بعدی
          </button>
        </div>
      )}

      {/* Page Info */}
      {!isDefaultHomeView && totalPages > 1 && (
        <div className="text-center mt-4 text-xs text-[#6A6A85]">
          صفحه {validCurrentPage} از {totalPages} (نمایش ۲۴ اثر در هر صفحه)
        </div>
      )}

      {/* HTML Export Modal */}
      {showExportModal && (
        <ExportHtmlModal
          allMovies={filteredMovies.length > 0 ? filteredMovies : movies}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Build stamp — diagnostic: tells which bundle this device is actually running */}
      <div className="text-center text-[10px] text-[#4A4A60] pt-8 pb-1 select-none" dir="ltr">
        build {BUILD_ID}
      </div>

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES, getCategoryColor, matchesCategory } from '../data/categories';
import { CategoryIconBadge } from './CategoryIconBadge';
import { Movie } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Rows, 
  Sparkles, 
  X,
  Compass
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  movies: Movie[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  movies,
}) => {
  // Mobile layout mode: 'grid' (all categories fit on screen) vs 'scroll' (horizontal scroll)
  const [isGridMode, setIsGridMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    return false;
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Compute accurate dynamic counts per category using matchesCategory
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    const categoryKeys = Object.keys(CATEGORIES);

    for (const key of categoryKeys) {
      let c = 0;
      for (const m of movies) {
        if (matchesCategory(m, key)) {
          c++;
        }
      }
      map[key] = c;
    }
    return map;
  }, [movies]);

  const categoryEntries = Object.entries(CATEGORIES);

  // Check scroll capability
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = Math.abs(el.scrollLeft);
    setCanScrollRight(currentScroll > 10);
    setCanScrollLeft(currentScroll < maxScroll - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [isGridMode]);

  // Scroll left/right buttons handler
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 250);
  };

  // Auto scroll active item into view
  useEffect(() => {
    if (!isGridMode && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedCategory, isGridMode]);

  const activeCategoryLabel = selectedCategory === 'ALL' 
    ? 'همه آثار'
    : selectedCategory === '__latest__'
      ? 'تازه‌ترین فیلم‌ها و سریال‌ها'
      : CATEGORIES[selectedCategory] || selectedCategory;

  const activeCategoryColor = getCategoryColor(selectedCategory);

  return (
    <section 
      aria-label="فیلتر دسته‌بندی آثار سینمایی"
      className="w-full select-none mb-4 bg-[#11111E]/80 backdrop-blur-xl border border-[#25253E] rounded-3xl p-3 sm:p-4 shadow-xl shadow-black/40"
    >
      {/* Category Header with Active Status & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#222238]">
        
        {/* Title & Active Filter Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E50914] via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-red-600/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                دسته‌بندی آثار
              </h3>
              {selectedCategory !== 'ALL' && (
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border animate-fadeIn ${activeCategoryColor.bg} ${activeCategoryColor.text} ${activeCategoryColor.border}`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>فیلتر: {activeCategoryLabel}</span>
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-[#8686A2] font-medium hidden sm:block">
              انتخاب سریع و هوشمند بر اساس ژانر و دسته‌بندی تخصصی
            </p>
          </div>
        </div>

        {/* Action Controls: Reset & Toggle Layout */}
        <div className="flex items-center gap-1.5">
          {selectedCategory !== 'ALL' && (
            <button
              type="button"
              id="clear-category-filter-btn"
              onClick={() => onSelectCategory('ALL')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-all active:scale-95"
              title="نمایش مجدد همه آثار"
            >
              <X className="w-3 h-3" />
              <span>حذف فیلتر</span>
            </button>
          )}

          <button
            type="button"
            id="toggle-category-view-mode-btn"
            onClick={() => setIsGridMode(!isGridMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#1B1B2E] hover:bg-[#262640] text-[#B0B0CC] hover:text-white border border-[#2E2E4E] transition-all active:scale-95 shadow-sm"
            title={isGridMode ? 'تغییر به حالت نواری' : 'نمایش همه دسته‌ها'}
          >
            {isGridMode ? (
              <>
                <Rows className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="hidden xs:inline">حالت نواری</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden xs:inline">نمایش همه</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode 1: Mobile-friendly Responsive Grid Layout */}
      {isGridMode ? (
        <div 
          id="category-grid-container"
          className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 animate-fadeIn"
        >
          {/* All / همه آثار */}
          <button
            id="category-grid-chip-all"
            onClick={() => onSelectCategory('ALL')}
            className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-300 active:scale-95 border ${
              selectedCategory === 'ALL'
                ? 'bg-gradient-to-b from-[#E50914] to-[#B80710] text-white border-red-400 shadow-lg shadow-red-600/30 ring-1 ring-red-400/50 -translate-y-0.5'
                : 'bg-[#161627]/90 text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
            }`}
          >
            <CategoryIconBadge categoryKey="ALL" size="md" className="mb-1" />
            <span className="text-[11.5px] sm:text-xs font-black truncate w-full">
              همه آثار
            </span>
            <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-bold ${
              selectedCategory === 'ALL' ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
            }`}>
              {movies.length}
            </span>
          </button>

          {/* تازه‌ترین — virtual category: all titles newest-first */}
          <button
            id="category-grid-chip-latest"
            onClick={() => onSelectCategory('__latest__')}
            className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-300 active:scale-95 border ${
              selectedCategory === '__latest__'
                ? 'bg-gradient-to-b from-amber-400 to-rose-600 text-white border-amber-300 shadow-lg shadow-orange-600/30 ring-1 ring-amber-300/50 -translate-y-0.5'
                : 'bg-[#161627]/90 text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
            }`}
          >
            <CategoryIconBadge categoryKey="__latest__" size="md" className="mb-1" />
            <span className="text-[11.5px] sm:text-xs font-black truncate w-full">
              تازه‌ترین
            </span>
            <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-bold ${
              selectedCategory === '__latest__' ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
            }`}>
              {movies.length}
            </span>
          </button>

          {/* Category Cards */}
          {categoryEntries.map(([key, label]) => {
            const count = counts[key] || 0;
            const isSelected = selectedCategory === key;
            const color = getCategoryColor(key);

            return (
              <button
                key={key}
                id={`category-grid-chip-${key}`}
                onClick={() => onSelectCategory(key)}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-300 active:scale-95 border ${
                  isSelected
                    ? `bg-gradient-to-b ${color.activeGradient} text-white border-white/40 shadow-lg ${color.glow} ring-1 ring-white/30 -translate-y-0.5 font-black`
                    : 'bg-[#161627]/90 text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
                }`}
              >
                <CategoryIconBadge categoryKey={key} size="md" className="mb-1" />
                <span className="text-[11.5px] sm:text-xs font-bold truncate w-full">
                  {label}
                </span>
                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Horizontal Carousel with Left/Right arrows & fading edge hints */
        <div className="relative group w-full">
          {/* Right Fade Indicator */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-1.5 w-10 bg-gradient-to-l from-[#11111E] to-transparent z-1 pointer-events-none rounded-r-2xl" />
          )}

          {/* Left Fade Indicator */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-1.5 w-10 bg-gradient-to-r from-[#11111E] to-transparent z-1 pointer-events-none rounded-l-2xl" />
          )}

          {/* Right Scroll Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className={`hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1C1C30]/95 text-white border border-[#353555] items-center justify-center shadow-xl hover:bg-[#E50914] hover:border-red-500 transition-all ${
              !canScrollRight ? 'opacity-40 cursor-not-allowed' : 'opacity-90 hover:opacity-100'
            }`}
            aria-label="اسکرول به راست"
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Left Scroll Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className={`hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1C1C30]/95 text-white border border-[#353555] items-center justify-center shadow-xl hover:bg-[#E50914] hover:border-red-500 transition-all ${
              !canScrollLeft ? 'opacity-40 cursor-not-allowed' : 'opacity-90 hover:opacity-100'
            }`}
            aria-label="اسکرول به چپ"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontal Scroll Bar Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none flex items-center gap-2.5 min-w-full px-1"
          >
            {/* All / همه آثار */}
            <button
              id="category-chip-all"
              data-active={selectedCategory === 'ALL'}
              onClick={() => onSelectCategory('ALL')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 border ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-r from-[#E50914] to-[#B80710] text-white border-red-400 shadow-md shadow-red-600/30'
                  : 'bg-[#161627] text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
              }`}
            >
              <CategoryIconBadge categoryKey="ALL" size="sm" />
              <span>همه آثار</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                selectedCategory === 'ALL' ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
              }`}>
                {movies.length}
              </span>
            </button>

            {/* تازه‌ترین — virtual category chip */}
            <button
              id="category-chip-latest"
              data-active={selectedCategory === '__latest__'}
              onClick={() => onSelectCategory('__latest__')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 border ${
                selectedCategory === '__latest__'
                  ? 'bg-gradient-to-r from-amber-400 to-rose-600 text-white border-amber-300 shadow-md shadow-orange-600/30'
                  : 'bg-[#161627] text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
              }`}
            >
              <CategoryIconBadge categoryKey="__latest__" size="sm" />
              <span>تازه‌ترین</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                selectedCategory === '__latest__' ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
              }`}>
                {movies.length}
              </span>
            </button>

            {/* Category Chips */}
            {categoryEntries.map(([key, label]) => {
              const count = counts[key] || 0;
              const isSelected = selectedCategory === key;
              const color = getCategoryColor(key);

              return (
                <button
                  key={key}
                  id={`category-chip-${key}`}
                  data-active={isSelected}
                  onClick={() => onSelectCategory(key)}
                  className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 border ${
                    isSelected
                      ? `bg-gradient-to-r ${color.activeGradient} text-white border-white/40 shadow-md ${color.glow}`
                      : 'bg-[#161627] text-[#A2A2BC] hover:text-white border-[#272740] hover:border-[#424268] hover:bg-[#1D1D33]'
                  }`}
                >
                  <CategoryIconBadge categoryKey={key} size="sm" />
                  <span>{label}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-black/35 text-white' : 'bg-[#222238] text-[#8686A0]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

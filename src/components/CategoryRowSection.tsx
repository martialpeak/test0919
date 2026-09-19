import React from 'react';
import { Movie } from '../types';
import { MovieGridCard } from './MovieGridCard';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { getCategoryName } from '../data/categories';
import { CategoryIconBadge } from './CategoryIconBadge';

interface CategoryRowSectionProps {
  categoryKey: string;
  categoryName?: string;
  emoji?: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onToggleFavorite: (messageId: number) => void;
  onTrailerClick: (movie: Movie) => void;
  onSelectCategory: (categoryKey: string) => void;
}

export const CategoryRowSection: React.FC<CategoryRowSectionProps> = ({
  categoryKey,
  categoryName,
  movies,
  onMovieClick,
  onToggleFavorite,
  onTrailerClick,
  onSelectCategory,
}) => {
  if (!movies || movies.length === 0) return null;

  const title = categoryName || getCategoryName(categoryKey);

  // Take top 6 movies for the preview row
  const previewMovies = movies.slice(0, 6);

  return (
    <section className="mb-10 animate-fade-in group/section">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2A40]/80">
        <div className="flex items-center gap-3">
          <CategoryIconBadge categoryKey={categoryKey} size="lg" withGlow />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight group-hover/section:text-purple-300 transition-colors">
              {title}
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#1C1C2E] border border-[#2A2A40] text-[#8E8EA8]">
                {movies.length} اثر
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={() => onSelectCategory(categoryKey)}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#181829] hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-indigo-600/30 border border-[#2A2A40] hover:border-purple-500/50 text-xs sm:text-sm font-bold text-[#A0A0B5] hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 active:scale-95"
        >
          <span>نمایش همه ({movies.length})</span>
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300 text-purple-400" />
        </button>
      </div>

      {/* Grid of 6 cards with subtle staggered animation feel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
        {previewMovies.map((movie, idx) => (
          <div key={movie.message_id} className={`animate-slide-up stagger-${Math.min(idx + 1, 6)}`}>
            <MovieGridCard
              movie={movie}
              onMovieClick={onMovieClick}
              onToggleFavorite={onToggleFavorite}
              onTrailerClick={onTrailerClick}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

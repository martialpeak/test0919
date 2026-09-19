import React, { useState } from 'react';
import { Movie } from '../types';
import { extractThematicTags } from '../services/recommendationService';
import { Sparkles, Star, ChevronLeft, Layers, Heart, Flame, Award } from 'lucide-react';

interface PersonalizedRecommendationsRowProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onTrailerClick?: (movie: Movie) => void;
}

export const PersonalizedRecommendationsRow: React.FC<PersonalizedRecommendationsRowProps> = ({
  movies,
  onMovieClick,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites' | 'action' | 'drama' | 'topRated'>('all');

  // Find favorite movies or highest rated movies to base recommendation profile on
  const recommendations = React.useMemo(() => {
    const favorites = movies.filter(m => m.is_favorite);
    const seedMovies = favorites.length > 0 ? favorites : movies.filter(m => m.rating && parseFloat(m.rating) >= 8.5);

    if (seedMovies.length === 0) {
      return movies.slice(0, 8);
    }

    // Collect preferred genres and themes
    const preferredGenres = new Set<string>();
    const preferredThemes = new Set<string>();

    seedMovies.forEach(m => {
      if (m.genre) {
        m.genre.split(/[,،/]+/).forEach(g => preferredGenres.add(g.trim().toLowerCase()));
      }
      extractThematicTags(m).forEach(t => preferredThemes.add(t));
    });

    // Score movies based on category
    const nonFavorites = movies.filter(m => !m.is_favorite);
    const pool = nonFavorites.length > 0 ? nonFavorites : movies;

    const scored = pool.map(candidate => {
      let score = 0;
      const candidateGenres = (candidate.genre || '').split(/[,،/]+/).map(g => g.trim().toLowerCase());
      const candidateThemes = extractThematicTags(candidate);
      const isAction = candidateGenres.some(g => g.includes('اکشن') || g.includes('ماجراجویی') || g.includes('هیجان') || g.includes('action'));
      const isDrama = candidateGenres.some(g => g.includes('درام') || g.includes('عاشقانه') || g.includes('خانوادگی') || g.includes('drama'));

      // Category specific filtering/boosting
      if (activeCategory === 'action' && !isAction) return { movie: candidate, score: -100 };
      if (activeCategory === 'drama' && !isDrama) return { movie: candidate, score: -100 };

      candidateGenres.forEach(g => {
        if (preferredGenres.has(g)) score += 20;
      });

      candidateThemes.forEach(t => {
        if (preferredThemes.has(t)) score += 25;
      });

      if (candidate.rating) {
        score += parseFloat(candidate.rating) * (activeCategory === 'topRated' ? 10 : 4);
      }

      return { movie: candidate, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.movie);
  }, [movies, activeCategory]);

  if (recommendations.length < 2) {
    return null;
  }

  const categoryButtons = [
    { id: 'all', label: 'همه پیشنهادات', icon: Layers },
    { id: 'favorites', label: 'هماهنگ با سلیقه', icon: Heart },
    { id: 'action', label: 'اکشن و هیجان‌انگیز', icon: Flame },
    { id: 'drama', label: 'داستان و درام', icon: Sparkles },
    { id: 'topRated', label: 'بالاترین امتیاز', icon: Award },
  ] as const;

  return (
    <div id="personalized-recommendations-row" className="mb-10 bg-gradient-to-r from-[#1A1A2E] via-[#151525] to-[#1E172E] border border-purple-500/25 rounded-3xl p-4 sm:p-7 shadow-xl relative overflow-hidden space-y-4">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/25 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>پیشنهادات هوشمند سینمایی</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                تطبیق داستان و سلیقه
              </span>
            </h3>
            <p className="text-xs text-[#A0A0B5] mt-0.5">
              منتخبی از بهترین آثار هماهنگ با تم‌های داستانی و ژانرهای محبوب شما
            </p>
          </div>
        </div>

        {/* Categories for Mobile & Desktop */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex items-center gap-1.5 p-1 bg-[#141420]/80 rounded-2xl border border-[#2A2A40]/80">
          {categoryButtons.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-[#A0A0B5] hover:text-white hover:bg-[#25253A]'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Movies Carousel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 relative z-10">
        {recommendations.map((movie) => (
          <div
            key={movie.message_id}
            id={`recommended-movie-${movie.message_id}`}
            onClick={() => onMovieClick(movie)}
            className="group bg-[#141420] border border-[#2A2A40] hover:border-purple-500/60 rounded-2xl overflow-hidden p-2 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-pointer"
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#1C1C2E] mb-2">
              <img
                src={movie.poster_url || '/placeholder.png'}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                <span className="text-[11px] font-bold text-white bg-red-600/90 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow">
                  مشاهده اثر
                  <ChevronLeft className="w-3 h-3" />
                </span>
              </div>

              {/* Rating badge */}
              {movie.rating && (
                <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-500/30">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  <span>{movie.rating}</span>
                </div>
              )}
            </div>

            {/* Title & Genre */}
            <div className="px-1">
              <h4 className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                {movie.title}
              </h4>
              <p className="text-[10px] text-[#A0A0B5] line-clamp-1 mt-0.5">
                {movie.genre || movie.year || 'سینمایی'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Movie } from '../types';
import { Star, Heart, Play, Film } from 'lucide-react';
import { getCategoryName, getCategoryColor } from '../data/categories';
import { formatMovieYear } from '../utils/dateHelper';

interface MovieGridCardProps {
  movie: Movie;
  onMovieClick: (movie: Movie) => void;
  onToggleFavorite: (messageId: number) => void;
  onTrailerClick?: (movie: Movie) => void;
}

export const MovieGridCard: React.FC<MovieGridCardProps> = ({
  movie,
  onMovieClick,
  onToggleFavorite,
  onTrailerClick
}) => {
  const catColor = getCategoryColor(movie.category || '');
  const [imgError, setImgError] = React.useState(false);

  // Reset imgError if the poster URL updates (e.g. after sync or cache hydration)
  React.useEffect(() => {
    setImgError(false);
  }, [movie.poster_url]);

  return (
    <div 
      id={`movie-card-grid-${movie.message_id}`}
      className="group relative flex flex-col bg-[#1C1C2E] rounded-2xl overflow-hidden border border-[#2A2A40]/80 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-950/30 hover:-translate-y-2 hover:scale-[1.01]"
    >
      {/* Poster Image Area — real <a> so right/middle-click "open in new tab" works */}
      <a
        href={`#/movie/${movie.message_id}`}
        className="block relative aspect-[2/3] w-full overflow-hidden bg-[#141420] cursor-pointer"
        onClick={(e) => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); onMovieClick(movie); } }}
      >
        {movie.poster_url && !imgError ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#5A5A72] p-4 text-center">
            <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
            <span className="text-xs">بدون تصویر</span>
          </div>
        )}

        {/* Hover Shine Sweep */}
        <span className="shine-sweep absolute inset-0 overflow-hidden" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C2E] via-transparent to-black/40 opacity-80" />

        {/* Top Badges: Category & Quality */}
        <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border backdrop-blur-md ${catColor.bg} ${catColor.text} ${catColor.border}`}>
            {getCategoryName(movie.category || '')}
          </span>

          {movie.quality && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#0D0D12]/80 text-[#FFB800] border border-[#FFB800]/40 backdrop-blur-md">
              {movie.quality}
            </span>
          )}
        </div>

        {/* Bottom Badges on Poster: Rating & Year */}
        <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
          {movie.rating ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-[#FFB800] text-black shadow-md">
              <Star className="w-3 h-3 fill-black" />
              <span>{movie.rating}</span>
            </span>
          ) : <span />}

          {movie.year && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-black/70 text-white/90 backdrop-blur-sm">
              {formatMovieYear(movie)}
            </span>
          )}
        </div>

        {/* Floating Play Trailer Button on Hover */}
        {movie.trailer_url && onTrailerClick && (
          <button
            id={`play-trailer-btn-${movie.message_id}`}
            onClick={(e) => {
              e.stopPropagation();
              onTrailerClick(movie);
            }}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#E50914]/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl shadow-red-600/40 hover:bg-[#E50914]"
            title="پخش تریلر"
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </button>
        )}
      </a>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onMovieClick(movie)}
            className="font-bold text-sm sm:text-base text-white hover:text-[#E50914] transition-colors line-clamp-1 cursor-pointer"
            title={movie.title}
          >
            <a href={`#/movie/${movie.message_id}`} onClick={(e) => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); onMovieClick(movie); } }}>
              {movie.title}
            </a>
          </h3>

          {/* English Title */}
          {movie.english_title && (
            <p className="text-xs text-[#A0A0B5] font-sans line-clamp-1 mt-0.5" dir="ltr">
              {movie.english_title}
            </p>
          )}

          {/* Genre tags */}
          {movie.genre && (
            <p className="text-[11px] text-[#A0A0B5] line-clamp-1 mt-1.5 font-light">
              {movie.genre.replace(/\|/g, '•')}
            </p>
          )}
        </div>

        {/* Bottom Bar: Action / Favorite */}
        <div className="mt-3 pt-2.5 border-t border-[#2A2A40] flex items-center justify-between">
          <span className="text-[11px] text-[#5A5A72] font-medium">
            {movie.country || 'سینمایی'}
          </span>

          <button
            id={`fav-btn-grid-${movie.message_id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(movie.message_id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              movie.is_favorite 
                ? 'text-rose-500 bg-rose-500/10' 
                : 'text-[#5A5A72] hover:text-white hover:bg-[#242438]'
            }`}
            title="علاقه‌مندی"
          >
            <Heart className={`w-4 h-4 transition-colors duration-300 ${movie.is_favorite ? 'fill-current animate-heart-pop' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

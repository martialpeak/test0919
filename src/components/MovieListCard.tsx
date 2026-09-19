import React from 'react';
import { Movie } from '../types';
import { Star, Heart, Play, Film, Calendar, Globe } from 'lucide-react';
import { getCategoryName, getCategoryColor } from '../data/categories';
import { formatMovieYear } from '../utils/dateHelper';

interface MovieListCardProps {
  movie: Movie;
  onMovieClick: (movie: Movie) => void;
  onToggleFavorite: (messageId: number) => void;
  onTrailerClick?: (movie: Movie) => void;
}

export const MovieListCard: React.FC<MovieListCardProps> = ({
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
      id={`movie-card-list-${movie.message_id}`}
      className="group relative flex flex-col sm:flex-row bg-[#1C1C2E] rounded-2xl overflow-hidden border border-[#2A2A40]/80 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/20 hover:-translate-y-1"
    >
      {/* Poster — real <a> so right/middle-click "open in new tab" works */}
      <a
        href={`#/movie/${movie.message_id}`}
        className="block relative w-full sm:w-28 md:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-[#141420] shrink-0 cursor-pointer"
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#5A5A72]">
            <Film className="w-8 h-8" />
          </div>
        )}

        {movie.quality && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black bg-black/80 text-[#FFB800]">
            {movie.quality}
          </span>
        )}
      </a>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between w-full">
        <div>
          {/* Badges & Categories */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
              {getCategoryName(movie.category || '')}
            </span>

            {movie.rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-[#FFB800] text-black">
                <Star className="w-3 h-3 fill-black" />
                <span>{movie.rating}</span>
              </span>
            )}

            {movie.year && (
              <span className="flex items-center gap-1 text-xs text-[#A0A0B5] bg-[#242438] px-2 py-0.5 rounded-lg">
                <Calendar className="w-3 h-3" />
                <span>{formatMovieYear(movie)}</span>
              </span>
            )}

            {movie.country && (
              <span className="flex items-center gap-1 text-xs text-[#A0A0B5] bg-[#242438] px-2 py-0.5 rounded-lg">
                <Globe className="w-3 h-3" />
                <span>{movie.country}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 
            className="font-bold text-base sm:text-lg text-white hover:text-[#E50914] cursor-pointer transition-colors"
          >
            <a href={`#/movie/${movie.message_id}`} onClick={(e) => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); onMovieClick(movie); } }}>
              {movie.title}
            </a>
          </h3>

          {movie.english_title && (
            <p className="text-xs text-[#A0A0B5] font-sans" dir="ltr">
              {movie.english_title}
            </p>
          )}

          {/* Description */}
          {movie.description && (
            <p className="text-xs text-[#A0A0B5] line-clamp-2 mt-2 leading-relaxed">
              {movie.description}
            </p>
          )}

          {/* Actors */}
          {movie.actors && (
            <p className="text-xs text-[#5A5A72] mt-1.5 line-clamp-1">
              <span className="text-[#A0A0B5] font-medium">بازیگران: </span>
              {movie.actors}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A2A40]">
          <div className="flex items-center gap-2">
            <button
              id={`details-btn-list-${movie.message_id}`}
              onClick={() => onMovieClick(movie)}
              className="px-3.5 py-1.5 rounded-xl bg-[#242438] hover:bg-[#2C2C45] text-xs font-bold text-white border border-[#3A3A55] transition-colors"
            >
              مشاهده جزئیات
            </button>

            {movie.trailer_url && onTrailerClick && (
              <button
                id={`trailer-btn-list-${movie.message_id}`}
                onClick={() => onTrailerClick(movie)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E50914]/15 hover:bg-[#E50914]/25 text-[#E50914] text-xs font-bold border border-[#E50914]/30 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تریلر</span>
              </button>
            )}
          </div>

          <button
            id={`fav-btn-list-${movie.message_id}`}
            onClick={() => onToggleFavorite(movie.message_id)}
            className={`p-2 rounded-xl border transition-colors ${
              movie.is_favorite 
                ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' 
                : 'text-[#5A5A72] hover:text-white bg-[#242438] border-[#2A2A40]'
            }`}
            title="علاقه‌مندی"
          >
            <Heart className={`w-4 h-4 ${movie.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

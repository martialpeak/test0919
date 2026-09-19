import React from 'react';
import { Movie } from '../types';
import { Star, Play, Info, Heart, Volume2, VolumeX } from 'lucide-react';
import { getCategoryName, getCategoryColor } from '../data/categories';
import { formatMovieYear } from '../utils/dateHelper';

interface FeaturedBannerProps {
  movie: Movie;
  onMovieClick: (movie: Movie) => void;
  onTrailerClick: (movie: Movie) => void;
  onToggleFavorite: (messageId: number) => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  movie,
  onMovieClick,
  onTrailerClick,
  onToggleFavorite,
}) => {
  const catColor = getCategoryColor(movie.category || '');

  // Background trailer (Netflix-style hero), two sources in priority order:
  // 1. Server-hosted MP4 (local_trailer) — plays for everyone, no filtering issues.
  // 2. YouTube embed from trailer_url — only works for users with a VPN.
  // imdb.com trailer pages cannot be embedded, so they fall back to the blurred poster.
  const trailerId = React.useMemo(() => {
    const url = movie.trailer_url || '';
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : '';
  }, [movie.trailer_url]);

  const localTrailerUrl = movie.local_trailer || '';

  // Browsers refuse autoplay with sound, so the background starts muted.
  // The speaker button (top-right of the banner) unmutes with a user gesture.
  const [heroMuted, setHeroMuted] = React.useState(true);

  return (
    <div className="relative w-full rounded-2xl mb-8 p-[1.5px] bg-gradient-to-r from-[#E50914]/60 via-purple-600/40 to-cyan-500/50 bg-[length:200%_100%] animate-[gradient-pan_7s_linear_infinite] shadow-2xl shadow-black/40 animate-slide-up">
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#2A2A40] bg-[#141420]">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.poster_url || ''}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-25 filter blur-[2px] scale-105"
        />
        {/* Background trailer — autoplay REQUIRES mute (browser policy), sound via the toggle.
            Priority: server-hosted MP4 (works without VPN) > YouTube embed. */}
            {localTrailerUrl ? (
              <video
                key={localTrailerUrl}
                src={localTrailerUrl}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ opacity: 1 }}
                autoPlay
                loop
                playsInline
                preload="auto"
                tabIndex={-1}
                muted
                ref={(el) => { if (el) el.muted = heroMuted; }}
              />
            ) : trailerId && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&mute=${heroMuted ? 1 : 0}&loop=1&playlist=${trailerId}&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`}
            title={`${movie.title} — تریلر پس‌زمینه`}
            className="absolute inset-0 w-[calc(100%+240px)] h-[calc(100%+136px)] -left-[120px] -top-[68px] pointer-events-none"
            style={{ opacity: 0.85 }}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        )}
        {/* Gradients — only the text zones stay dark; the trailer itself is full brightness */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-[#0D0D12]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D12]/75 via-transparent to-[#0D0D12]/15" />
        {/* Sound toggle — background autoplays muted, browsers block autoplay with audio */}
        {localTrailerUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); setHeroMuted(v => !v); }}
            className="absolute top-3 right-3 z-20 pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/15 transition-colors"
            title={heroMuted ? 'روشن کردن صدا' : 'بی‌صدا'}
          >
            {heroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-6">
        
        {/* Poster Thumbnail */}
        <div 
          onClick={() => onMovieClick(movie)}
          className="w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-[#3A3A55] shrink-0 cursor-pointer group relative"
        >
          <img
                      src={movie.poster_url || ''}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Info className="w-8 h-8 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Details & Actions */}
        <div className="flex-1 text-center md:text-right">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
              {getCategoryName(movie.category || '')}
            </span>
            {movie.quality && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30">
                {movie.quality}
              </span>
            )}
            {movie.rating && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{movie.rating}</span>
              </span>
            )}
            {movie.year && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90">
                {formatMovieYear(movie)}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 
            onClick={() => onMovieClick(movie)}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 cursor-pointer hover:text-[#E50914] transition-colors"
          >
            {movie.title}
          </h2>
          {movie.english_title && (
            <p className="text-sm sm:text-base text-[#A0A0B5] font-sans font-medium mb-3" dir="ltr">
              {movie.english_title}
            </p>
          )}

          {/* Description */}
          {movie.description && (
            <p className="text-xs sm:text-sm text-[#A0A0B5] line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl leading-relaxed">
              {movie.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              id={`featured-details-btn-${movie.message_id}`}
              onClick={() => onMovieClick(movie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Info className="w-4 h-4" />
              <span>مشاهده جزئیات</span>
            </button>

            {movie.trailer_url && (
              <button
                id={`featured-trailer-btn-${movie.message_id}`}
                onClick={() => onTrailerClick(movie)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#242438] hover:bg-[#2C2C45] border border-[#3A3A55] text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 text-[#00D4FF]" />
                <span>تماشای تریلر</span>
              </button>
            )}

            <button
              id={`featured-fav-btn-${movie.message_id}`}
              onClick={() => onToggleFavorite(movie.message_id)}
              className={`p-2.5 rounded-xl border transition-all ${
                movie.is_favorite
                  ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                  : 'bg-[#1C1C2E] border-[#2A2A40] text-[#A0A0B5] hover:text-white'
              }`}
              title="علاقه‌مندی"
            >
              <Heart className={`w-5 h-5 transition-colors duration-300 ${movie.is_favorite ? 'fill-current animate-heart-pop' : ''}`} />
            </button>
          </div>

        </div>

      </div>
      </div>
    </div>
  );
};

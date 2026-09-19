import React from 'react';
import { Movie, ServerTrailerResponse } from '../types';
import { MovieService } from '../services/api';
import { generateImdbTrailerUrl, generateYoutubeBackupUrl, fetchAutoTrailerLinks } from '../utils/movieEnricher';
import { 
  X, 
  Play, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  Film, 
  RefreshCw, 
  Star,
  Users,
  Info,
  Copy,
  Check
} from 'lucide-react';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  const [trailerData, setTrailerData] = React.useState<ServerTrailerResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSource, setActiveSource] = React.useState<'youtube' | 'imdb'>('youtube');
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  const autoLinks = React.useMemo(() => {
    if (!movie) {
      return { imdbId: '', imdbVideoId: undefined, imdbEmbedUrl: undefined, imdbTrailerUrl: '', youtubeTrailerUrl: '', source: 'none' as const };
    }
    return fetchAutoTrailerLinks(movie.title, movie.english_title || '', movie.year || '', movie.imdb_id);
  }, [movie]);

  const loadTrailer = React.useCallback(async (m: Movie, forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await MovieService.fetchTrailer(m.message_id, m.trailer_url, m);
      setTrailerData(res);
      // A direct IMDb mp4 is the best quality source — open on the IMDb tab when we have one.
      if (res?.video_url) {
        setActiveSource('imdb');
      } else {
        setActiveSource('youtube');
      }
    } catch (err) {
      console.error('Failed to load trailer:', err);
      setError('پخش تریلر با مشکل روبرو شد.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    if (!movie) return;
    setActiveSource('youtube');
    loadTrailer(movie, false);
  }, [movie, loadTrailer]);

  if (!movie) return null;

  // Extract YouTube video ID from various formats
  const extractYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    // Direct 11 char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url?: string): string | null => {
    const vidId = extractYouTubeVideoId(url);
    if (vidId) {
      const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
      return `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1${originParam}&rel=0&controls=1`;
    }
    return null;
  };

  const imdbId = movie.imdb_id || autoLinks.imdbId || trailerData?.imdb_id;
  // Prefer autoLinks IMDb URL when matched by exact ID, then server data, then generate
  const rawImdbUrl = autoLinks.source === 'matched_exact' && autoLinks.imdbTrailerUrl
    ? autoLinks.imdbTrailerUrl
    : trailerData?.imdb_url || trailerData?.page_url || autoLinks.imdbTrailerUrl || (imdbId ? generateImdbTrailerUrl(imdbId) : '');
  const imdbTrailerUrl = generateImdbTrailerUrl(rawImdbUrl || (imdbId ? `tt${imdbId.replace('tt', '')}` : ''));

  // A YouTube SEARCH url (youtube.com/results?search_query=...) contains "youtu" but has no video ID,
  // so it must never win over a real watch?v= link coming from the server.
  const isPlayableYoutubeUrl = (url?: string): boolean => {
    if (!url) return false;
    if (url.includes('results?search_query')) return false;
    return !!extractYouTubeVideoId(url);
  };

  // Determine YouTube URL: movie's direct YouTube link > autoLinks (matched by IMDb ID) > server fallback > search
  const resolvedYoutubeUrl = [
    movie.trailer_url,
    autoLinks.source === 'matched_exact' ? autoLinks.youtubeTrailerUrl : undefined,
    trailerData?.youtube_url,
    autoLinks.youtubeTrailerUrl,
  ].find(isPlayableYoutubeUrl)
    || trailerData?.youtube_url
    || generateYoutubeBackupUrl(movie.title, movie.english_title || '', movie.year || '');
  
  const directVideoUrl = trailerData?.video_url;

  // Primary YouTube embed URL
  let ytEmbed = getYouTubeEmbedUrl(resolvedYoutubeUrl);
  if (!ytEmbed && movie.trailer_url) {
    ytEmbed = getYouTubeEmbedUrl(movie.trailer_url);
  }
  // Generate YouTube search URL for fallback link
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.english_title || movie.title} ${movie.year || ''} trailer official`)}`;

  const handleCopyLink = () => {
    const linkToCopy = resolvedYoutubeUrl || imdbTrailerUrl;
    if (linkToCopy && navigator?.clipboard) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Determine if IMDb has a playable video

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div 
        id="trailer-player-modal"
        className="relative w-full max-w-4xl bg-[#141420] border border-[#2A2A40] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#2A2A40] bg-[#1C1C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shadow-inner">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg">
                  پخش تریلر: {movie.title}
                </h3>
                {movie.rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFB800] text-black text-[11px] font-black">
                    <Star className="w-3 h-3 fill-black" />
                    {movie.rating}
                  </span>
                )}
              </div>
              {movie.english_title && (
                <span className="text-xs text-[#00D4FF] font-sans block" dir="ltr">
                  {movie.english_title} {movie.year ? `(${movie.year})` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-auto-trailer-btn"
              onClick={() => movie && loadTrailer(movie, true)}
              disabled={isRefreshing || loading}
              className="p-2 rounded-xl bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#3A3A55] transition-colors cursor-pointer border border-[#2A2A40]"
              title="بارگذاری مجدد تریلر"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              id="close-trailer-modal-button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#3A3A55] transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Source Switcher Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-[#181828] border-b border-[#2A2A40] text-xs">
          <div className="flex items-center gap-2">
            {/* YouTube Player Source */}
            <button
              id="trailer-source-youtube-btn"
              onClick={() => setActiveSource('youtube')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeSource === 'youtube'
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-500/20 scale-105'
                  : 'bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#2F2F48]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>پخش آنلاین تریلر</span>
            </button>

            {/* IMDb Source */}
            <button
              id="trailer-source-imdb-btn"
              onClick={() => setActiveSource('imdb')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                activeSource === 'imdb'
                  ? 'bg-[#FFB800] text-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#2F2F48]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>مرجع رسمی IMDb</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#2F2F48] transition-colors border border-[#2A2A40] cursor-pointer"
              title="کپی لینک تریلر"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>کپی لینک</span>
                </>
              )}
            </button>

            {movie.genre && (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-[#242438] text-[#00D4FF] border border-[#2A2A40]">
                {movie.genre}
              </span>
            )}
            {movie.year && (
              <span className="px-2 py-1 rounded-lg bg-[#242438] text-white border border-[#2A2A40]">
                {movie.year}
              </span>
            )}
          </div>
        </div>

        {/* Video Player Canvas */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-[#A0A0B5]">
              <Loader2 className="w-10 h-10 animate-spin text-[#FFB800]" />
              <span className="text-sm font-medium">در حال بارگذاری تریلر رسمی با کیفیت اصلی...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-[#A0A0B5] p-6 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => movie && loadTrailer(movie, true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFB800] text-black font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تلاش مجدد</span>
              </button>
            </div>
          ) : activeSource === 'imdb' && directVideoUrl ? (
            /* --- IMDB: Direct MP4 video (pre-signed IMDb CDN url via /api/video-proxy) --- */
            <div className="relative w-full h-full">
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-[#FFB800] text-black font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  تریلر رسمی IMDb
                </span>
                {trailerData?.video_definition && (
                  <span className="px-2 py-1 rounded-lg bg-black/70 text-white font-bold text-[11px] border border-white/20">
                    {trailerData.video_definition.replace('DEF_', '')}
                  </span>
                )}
              </div>
              <video
                key={directVideoUrl}
                src={directVideoUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                poster={movie.poster_url || undefined}
                className="w-full h-full object-contain"
                onError={() => setActiveSource('youtube')}
              >
                مرورگر شما از پخش این ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>
          ) : (
            /* --- YOUTUBE VIEW (also serves as IMDb fallback) --- */
            <div className="relative w-full h-full">
              {activeSource === 'imdb' && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#FFB800] text-black font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    تریلر رسمی IMDb
                  </span>
                </div>
              )}
              {ytEmbed ? (
                <iframe
                  id="trailer-video-iframe"
                  src={ytEmbed}
                  title={`YouTube Trailer for ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-center overflow-hidden">
                  {movie.poster_url && (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xl scale-110"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto gap-4 p-6 sm:p-8 rounded-3xl bg-[#141420]/95 backdrop-blur-xl border border-[#E50914]/40 shadow-2xl animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#E50914] text-white font-black text-xs tracking-wider shadow-md">
                        YouTube TRAILER
                      </span>
                    </div>
                    <Play className="w-12 h-12 text-[#E50914]" />
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-white mb-2">
                        جستجوی تریلر رسمی در یوتیوب
                      </h4>
                      <p className="text-xs sm:text-sm text-[#A0A0B5] leading-relaxed">
                        تریلر رسمی «{movie.title}» در یوتیوب جستجو شد. روی دکمه زیر کلیک کنید تا نتایج جستجو باز شود.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-1">
                      <a
                        id="open-youtube-search-link"
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E50914] hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/25 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>جستجو در یوتیوب</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Movie Info & External Links Footer */}
        <div className="p-4 sm:p-5 bg-[#12121E] border-t border-[#2A2A40] flex flex-col gap-3">
          {movie.description && (
            <div className="text-xs text-[#A0A0B5] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
              <p className="line-clamp-2">{movie.description}</p>
            </div>
          )}

          {movie.actors && (
            <div className="text-xs text-[#A0A0B5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFB800] shrink-0" />
              <span className="text-white/80 font-medium line-clamp-1">بازیگران: {movie.actors}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A2A40]/60">
            <span className="text-[11px] text-[#A0A0B5]">
              کیفیت رسمی تریلر &bull; پشتیبانی از منابع معتبر IMDb و YouTube
            </span>

            <div className="flex items-center gap-2">
              {imdbId && (
                <a
                  href={imdbTrailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFB800] text-black font-black text-xs hover:bg-amber-400 transition-all shadow-sm"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>صفحه اختصاصی در IMDb</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <a
                href={resolvedYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E50914] text-white font-bold text-xs hover:bg-red-600 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>پخش در یوتیوب</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

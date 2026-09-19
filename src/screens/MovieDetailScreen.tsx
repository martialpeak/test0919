import React from 'react';
import { Movie, CastMember, ServerCastResponse, MovieAward, NextEpisodeInfo, PhilosophicalAnalysisResult } from '../types';
import { MovieService } from '../services/api';
import { resolveActorPhoto } from '../services/actorPhotoService';
import { resolveNextEpisodeSchedule } from '../services/scheduleService';
import { AICinephileService } from '../services/aiCinephileService';
import { EpisodeCountdown } from '../components/EpisodeCountdown';
import { CastModal } from '../components/CastModal';
import { ActorAvatar } from '../components/ActorAvatar';
import { VoiceAudioController } from '../components/VoiceAudioController';
import { SimilarMoviesSection } from '../components/SimilarMoviesSection';
import { ExportHtmlModal } from '../components/ExportHtmlModal';
import { formatMovieYear, toPersianDigits } from '../utils/dateHelper';
import { 
  ArrowRight, 
  Heart, 
  Star, 
  ExternalLink, 
  DollarSign, 
  Calendar, 
  Globe, 
  Film, 
  Tv, 
  Users, 
  Image as ImageIcon,
  Edit,
  Trash2,
  Trophy,
  Clapperboard,
  Sparkles,
  Medal,
  ChevronDown,
  Compass,
  BookOpen,
  Quote,
  Zap,
  Camera,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X as CloseIcon,
  FileCode,
  Clock
} from 'lucide-react';
import { getCategoryName, getCategoryColor } from '../data/categories';
import { fetchMultiSourceMovieStills } from '../services/movieStillsService';

interface MovieDetailScreenProps {
  movie: Movie;
  allMovies?: Movie[];
  onBack: () => void;
  onToggleFavorite: (messageId: number) => void;
  onTrailerClick: (movie: Movie) => void;
  onOpenTracking: (messageId: number) => void;
  onSelectMovie?: (movie: Movie) => void;
  onEditMovie?: (movie: Movie) => void;
  onDeleteMovie?: (messageId: number) => void;
  onHydrateMovie?: (movie: Movie) => void;
  isAdmin?: boolean;
}

export const MovieDetailScreen: React.FC<MovieDetailScreenProps> = ({
  movie,
  allMovies = [],
  onBack,
  onToggleFavorite,
  onTrailerClick,
  onOpenTracking,
  onSelectMovie,
  onEditMovie,
  onDeleteMovie,
  onHydrateMovie,
  isAdmin = false,
}) => {
  // Slim-list hydration: the /api/movies sync ships list-only fields. When this
  // record has no detail fields yet (actor_photos/movie_stills absent), fetch
  // the full record once and hand it to the parent so stills/box office/crew
  // render — and the fetched copy lands in the cache for next time.
  React.useEffect(() => {
    if (movie.movie_stills !== undefined || movie.actor_photos !== undefined) return;
    if (!onHydrateMovie) return;
    let cancelled = false;
    MovieService.fetchMovieDetail(Number(movie.message_id)).then((full) => {
      if (!cancelled && full) onHydrateMovie(full);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.message_id]);

  // Switching from movie A to B must clear A's fetched state — otherwise the
  // AI analysis / online stills of the previous movie leak into this page.
  React.useEffect(() => {
    setPhilosophyAnalysis(null);
    setLoadingPhilosophy(false);
    setOnlineStills([]);
    setLoadingOnlineStills(false);
    setStillsSourceMessage('');
    setAwardsExpanded(false);
    setGalleryExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.message_id]);

  const [castData, setCastData] = React.useState<ServerCastResponse | null>(null);
  const [loadingCast, setLoadingCast] = React.useState<boolean>(true);
  const [selectedCastMember, setSelectedCastMember] = React.useState<CastMember | null>(null);
  const [selectedStillIndex, setSelectedStillIndex] = React.useState<number | null>(null);
  const [onlineStills, setOnlineStills] = React.useState<string[]>([]);
  const [loadingOnlineStills, setLoadingOnlineStills] = React.useState<boolean>(false);
  const [stillsSourceMessage, setStillsSourceMessage] = React.useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [nextEpisodeInfo, setNextEpisodeInfo] = React.useState<NextEpisodeInfo | null>(null);
  const [loadingSchedule, setLoadingSchedule] = React.useState<boolean>(false);
  const [philosophyAnalysis, setPhilosophyAnalysis] = React.useState<PhilosophicalAnalysisResult | null>(null);
  const [loadingPhilosophy, setLoadingPhilosophy] = React.useState<boolean>(false);
  const [showPhilosophySection, setShowPhilosophySection] = React.useState<boolean>(false);
  const [castSearchQuery, setCastSearchQuery] = React.useState<string>('');
  const [castFilter, setCastFilter] = React.useState<'all' | 'main' | 'crew' | 'awards'>('all');
  const [castViewMode, setCastViewMode] = React.useState<'grid' | 'list'>('grid');
  const [awardsExpanded, setAwardsExpanded] = React.useState<boolean>(false);
  const [galleryExpanded, setGalleryExpanded] = React.useState<boolean>(false);
  const [showExportHtmlModal, setShowExportHtmlModal] = React.useState<boolean>(false);

  const handleFetchPhilosophy = async () => {
    if (philosophyAnalysis) {
      setShowPhilosophySection(prev => !prev);
      return;
    }
    setShowPhilosophySection(true);
    setLoadingPhilosophy(true);
    try {
      const res = await AICinephileService.analyzeMasterpiece(movie.title, movie.english_title, movie.director);
      setPhilosophyAnalysis(res);
    } catch (err) {
      console.error('Error fetching philosophy analysis:', err);
    } finally {
      setLoadingPhilosophy(false);
    }
  };

  const isSeries = React.useMemo(() => {
    return (
      movie.category?.includes('series') ||
      movie.category === 'iranian_series' ||
      movie.category === 'foreign_series' ||
      movie.category === 'turkish_series'
    );
  }, [movie.category]);

  // Resolve next episode schedule for series
  React.useEffect(() => {
    if (!isSeries) {
      setNextEpisodeInfo(null);
      return;
    }

    let isMounted = true;
    setLoadingSchedule(true);

    resolveNextEpisodeSchedule(movie.title, movie.english_title, movie.imdb_id)
      .then((info) => {
        if (!isMounted) return;
        setNextEpisodeInfo(info);
        setLoadingSchedule(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie.title, movie.english_title, movie.imdb_id, isSeries]);

  // Fetch cast with biography, crew, and awards
  React.useEffect(() => {
    let isMounted = true;
    setLoadingCast(true);

    MovieService.fetchCast(movie.message_id, movie.actor_photos, movie)
      .then((res) => {
        if (!isMounted) return;
        setCastData(res);
        setLoadingCast(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingCast(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Consolidate movie awards
  const movieAwards: MovieAward[] = React.useMemo(() => {
    const raw = (castData?.awards && Array.isArray(castData.awards) && castData.awards.length > 0) 
      ? castData.awards 
      : (Array.isArray(movie.awards) ? movie.awards : []);
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }, [castData?.awards, movie.awards]);

  const awardsSummary = castData?.awards_summary || movie.awards_summary;

  // Key crew (directors + key crew members)
  const keyCrewMembers: CastMember[] = React.useMemo(() => {
    const combined: CastMember[] = [];
    if (castData?.directors && castData.directors.length > 0) {
      combined.push(...castData.directors);
    }
    if (castData?.crew && castData.crew.length > 0) {
      castData.crew.forEach(c => {
        if (!combined.some(existing => existing.name === c.name)) {
          combined.push(c);
        }
      });
    }
    if (combined.length === 0 && movie.crew && movie.crew.length > 0) {
      return movie.crew;
    }
    // Fallback: If no structured crew, but movie.director string is available
    if (combined.length === 0 && movie.director) {
      const directorNames = movie.director.split(/[,،/]+/).map((s: string) => s.trim()).filter(Boolean);
      directorNames.forEach((name: string) => {
        combined.push({
          name,
          character: 'کارگردان',
          job: 'کارگردان',
          photo: resolveActorPhoto(name),
          biography: `کارگردان اثر تحسین‌شده «${movie.title}»`
        });
      });
    }
    return combined;
  }, [castData?.directors, castData?.crew, movie.crew, movie.director, movie.title]);

  // Comprehensive Display cast members - Merging all sources so no actor is ever missing
  const displayCast: CastMember[] = React.useMemo(() => {
    const map = new Map<string, CastMember>();

    // 1. From server / extended database cast
    if (castData?.cast && Array.isArray(castData.cast)) {
      castData.cast.forEach(a => {
        const k = (a.name || a.english_name || '').toLowerCase().trim();
        if (k) {
          map.set(k, { ...a });
        }
      });
    }

    // 2. From local JSON actor_photos
    if (movie.actor_photos) {
      try {
        const parsed = JSON.parse(movie.actor_photos);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any) => {
            const k = (a.name || a.english_name || '').toLowerCase().trim();
            if (k) {
              if (map.has(k)) {
                const existing = map.get(k)!;
                map.set(k, {
                  ...existing,
                  character: existing.character && existing.character !== 'بازیگر' ? existing.character : (a.character || existing.character),
                  photo: existing.photo || a.photo,
                  biography: existing.biography || a.biography,
                  english_name: existing.english_name || a.english_name
                });
              } else {
                map.set(k, {
                  name: a.name,
                  english_name: a.english_name,
                  character: a.character || 'بازیگر',
                  photo: a.photo || resolveActorPhoto(a.name, a.english_name),
                  biography: a.biography || `بازیگر اثر «${movie.title}»`
                });
              }
            }
          });
        }
      } catch {}
    }

    // 3. From comma-separated movie.actors string
    if (movie.actors) {
      const names = movie.actors.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
      names.forEach(name => {
        const k = name.toLowerCase().trim();
        let found = false;
        for (const existingKey of map.keys()) {
          if (existingKey === k || existingKey.includes(k) || k.includes(existingKey)) {
            found = true;
            break;
          }
        }
        if (!found) {
          map.set(k, {
            name,
            character: 'بازیگر',
            photo: resolveActorPhoto(name),
            biography: `بازیگر اثر «${movie.title}»`
          });
        }
      });
    }

    return Array.from(map.values());
  }, [castData?.cast, movie.actor_photos, movie.actors, movie.title]);

  // Real-time filtered cast based on query and selected category filter
  const filteredCast = React.useMemo(() => {
    let list = displayCast;

    if (castFilter === 'awards') {
      list = list.filter(a => (a.awards && a.awards.length > 0) || a.biography?.includes('برنده') || a.biography?.includes('اسکار') || a.biography?.includes('امی'));
    }

    if (castSearchQuery.trim()) {
      const q = castSearchQuery.toLowerCase().trim();
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.english_name && a.english_name.toLowerCase().includes(q)) ||
        (a.character && a.character.toLowerCase().includes(q)) ||
        (a.biography && a.biography.toLowerCase().includes(q))
      );
    }

    return list;
  }, [displayCast, castFilter, castSearchQuery]);

  const filteredCrew = React.useMemo(() => {
    let list = keyCrewMembers;

    if (castFilter === 'awards') {
      list = list.filter(c => (c.awards && c.awards.length > 0) || c.biography?.includes('برنده') || c.biography?.includes('اسکار'));
    }

    if (castSearchQuery.trim()) {
      const q = castSearchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.english_name && c.english_name.toLowerCase().includes(q)) ||
        (c.job && c.job.toLowerCase().includes(q)) ||
        (c.biography && c.biography.toLowerCase().includes(q))
      );
    }

    return list;
  }, [keyCrewMembers, castFilter, castSearchQuery]);

  // Parse movie stills if present (can be string or array)
  const baseMovieStills: string[] = React.useMemo(() => {
    if (!movie.movie_stills) return [];
    if (Array.isArray(movie.movie_stills)) {
      return (movie.movie_stills as any[]).map(s => typeof s === 'string' ? s : (s?.url || s?.image_url || '')).filter(Boolean);
    }
    if (typeof movie.movie_stills === 'string') {
      try {
        const parsed = JSON.parse(movie.movie_stills);
        if (Array.isArray(parsed)) {
          return parsed.map(s => typeof s === 'string' ? s : (s?.url || s?.image_url || '')).filter(Boolean);
        }
        return [];
      } catch {
        return [];
      }
    }
    return [];
  }, [movie.movie_stills]);

  const displayedStills: string[] = React.useMemo(() => {
    const combined = [...baseMovieStills, ...onlineStills];
    return Array.from(new Set(combined));
  }, [baseMovieStills, onlineStills]);

  const handleFetchOnlineStills = async () => {
    if (loadingOnlineStills) return;
    setLoadingOnlineStills(true);
    try {
      const res = await fetchMultiSourceMovieStills(
        movie.title,
        movie.english_title,
        movie.imdb_id,
        movie.genre,
        movie.country,
        movie.category
      );
      if (res.stills && res.stills.length > 0) {
        const urls = res.stills.map(s => s.url);
        setOnlineStills(urls);
        setStillsSourceMessage(res.source_summary);
      }
    } catch {
      // ignore
    } finally {
      setLoadingOnlineStills(false);
    }
  };

  // Keyboard navigation for stills lightbox
  React.useEffect(() => {
    if (selectedStillIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStillIndex(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setSelectedStillIndex(prev => (prev === null ? null : (prev + 1) % displayedStills.length));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setSelectedStillIndex(prev => (prev === null ? null : (prev - 1 + displayedStills.length) % displayedStills.length));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStillIndex, displayedStills.length]);

  const catColor = getCategoryColor(movie.category || '');

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white pb-24 md:pb-12 animate-fade-in">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-[#141420]/80 backdrop-blur-md border-b border-[#2A2A40] px-4 sm:px-8 py-3 flex items-center justify-between">
        <button
          id="detail-back-button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-white text-sm font-semibold border border-[#2A2A40] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && onEditMovie && (
            <button
              id="detail-edit-movie-btn"
              onClick={() => onEditMovie(movie)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-white text-xs font-semibold border border-[#2A2A40] transition-colors"
              title="ویرایش اطلاعات اثر (مدیریت)"
            >
              <Edit className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span className="hidden sm:inline">ویرایش</span>
            </button>
          )}

          {isAdmin && onDeleteMovie && (
            <button
              id="detail-delete-movie-btn"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
              title="حذف اثر (مدیریت)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">حذف</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="detail-export-html-top-btn"
              onClick={() => setShowExportHtmlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all hover:scale-105"
              title="خروجی و دانلود فایل HTML قالب اختصاصی (دسترسی مدیریت)"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">خروجی HTML</span>
            </button>
          )}

          {movie.imdb_id && (
            <a
              id="detail-imdb-link"
              href={`https://www.imdb.com/title/${movie.imdb_id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFB800] text-black font-black text-xs hover:opacity-90 transition-opacity"
            >
              <span>IMDb</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            id={`detail-fav-btn-${movie.message_id}`}
            onClick={() => onToggleFavorite(movie.message_id)}
            className={`p-2 rounded-xl border transition-colors ${
              movie.is_favorite 
                ? 'bg-rose-500/20 border-rose-500 text-rose-500' 
                : 'bg-[#1C1C2E] border-[#2A2A40] text-[#A0A0B5] hover:text-white'
            }`}
            title="علاقه‌مندی"
          >
            <Heart className={`w-5 h-5 ${movie.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-[#181828] border border-[#2A2A40] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
            <h3 className="text-base font-bold text-white">آیا از حذف این اثر اطمینان دارید؟</h3>
            <p className="text-xs text-[#A0A0B5] leading-relaxed">
              فیلم یا سریال «{movie.title}» از پایگاه داده و لیست شما به صورت کامل حذف خواهد شد.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A0A0B5] bg-[#1C1C2E] hover:bg-[#242438] border border-[#2A2A40]"
              >
                انصراف
              </button>
              <button
                id="confirm-delete-movie-btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteMovie) onDeleteMovie(movie.message_id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Backdrop & Main Info Header */}
      <div className="relative w-full overflow-hidden bg-[#141420] border-b border-[#2A2A40]">
        {/* Background Image with Blur */}
        <div className="absolute inset-0 z-0">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter blur-md opacity-25 scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-[#0D0D12]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D12] via-transparent to-[#0D0D12]/70" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Poster Card */}
            <div className="w-48 sm:w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#3A3A55] shrink-0 bg-[#1C1C2E] relative group">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#5A5A72]">
                  <Film className="w-12 h-12" />
                </div>
              )}

              {movie.quality && (
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black bg-black/80 text-[#FFB800] border border-[#FFB800]/40 backdrop-blur-md">
                  {movie.quality}
                </span>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center md:text-right">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                  {getCategoryName(movie.category || '')}
                </span>

                {movie.rating && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#FFB800] text-black shadow-md">
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>{movie.rating} / 10</span>
                  </span>
                )}

                {movie.year && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-[#1C1C2E] border border-[#2A2A40] text-[#D1D1DF]">
                    <Calendar className="w-3.5 h-3.5 text-[#5A5A72]" />
                    <span>{formatMovieYear(movie)}</span>
                  </span>
                )}

                {movie.country && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-[#1C1C2E] border border-[#2A2A40] text-[#D1D1DF]">
                    <Globe className="w-3.5 h-3.5 text-[#5A5A72]" />
                    <span>{movie.country}</span>
                  </span>
                )}

                {movie.runtime ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-[#1C1C2E] border border-[#2A2A40] text-[#D1D1DF]">
                    <Clock className="w-3.5 h-3.5 text-[#5A5A72]" />
                    <span>{movie.runtime >= 60 ? `${toPersianDigits(Math.floor(movie.runtime / 60))} ساعت و ${toPersianDigits(movie.runtime % 60)} دقیقه` : `${toPersianDigits(movie.runtime)} دقیقه`}</span>
                  </span>
                ) : null}

                {movie.seasons_count ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-[#1C1C2E] border border-[#2A2A40] text-[#D1D1DF]">
                    <Tv className="w-3.5 h-3.5 text-[#5A5A72]" />
                    <span>{toPersianDigits(movie.seasons_count)} فصل{movie.episodes_count ? ` • ${toPersianDigits(movie.episodes_count)} قسمت` : ''}</span>
                  </span>
                ) : null}

                {movie.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#FFB800] text-black shadow-md hover:bg-amber-400 transition-colors"
                  >
                    <span>IMDb: {movie.imdb_id}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Title & English Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                {movie.title}
              </h1>
              {movie.english_title && (
                <p className="text-base sm:text-lg text-[#00D4FF] font-sans font-medium mb-4" dir="ltr">
                  {movie.english_title}
                </p>
              )}

              {/* Genre */}
              {movie.genre && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                  {movie.genre.split(/[|،,]+/).map((g, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#242438] text-[#A0A0B5] border border-[#2A2A40]"
                    >
                      {g.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons: Trailer, Watchlist & AI Deep Philosophy */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <button
                  id={`detail-trailer-btn-${movie.message_id}`}
                  onClick={() => onTrailerClick(movie)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FFB800] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Film className="w-5 h-5 fill-black" />
                  <span>تماشای تریلر رسمی (IMDb / YouTube)</span>
                </button>

                <button
                  id={`detail-philosophy-btn-${movie.message_id}`}
                  onClick={handleFetchPhilosophy}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-cyan-300" />
                  <span>نقد و تحلیل فلسفی هوشمند</span>
                </button>

                <button
                  id={`detail-tracking-btn-${movie.message_id}`}
                  onClick={() => onOpenTracking(movie.message_id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#8B5CF6] hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>ثبت در پیگیری (واچ‌لیست)</span>
                </button>

                {isAdmin && (
                  <button
                    id={`detail-export-html-action-btn-${movie.message_id}`}
                    onClick={() => setShowExportHtmlModal(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-rose-600 hover:from-purple-600 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-purple-700/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="خروجی و دانلود فایل HTML قالب اختصاصی (دسترسی مدیریت)"
                  >
                    <FileCode className="w-4 h-4 text-pink-300" />
                    <span>خروجی و دانلود HTML</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Main Details Body Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        
        {/* Next Episode Live Countdown (If Series) */}
        {isSeries && (nextEpisodeInfo || loadingSchedule) && (
          <div id="movie-countdown-section">
            {loadingSchedule ? (
              <div className="p-6 rounded-3xl bg-[#181828] border border-[#3A3A55] flex items-center justify-center gap-3 text-sm text-[#A0A0B5] animate-pulse">
                <Tv className="w-5 h-5 text-[#8B5CF6]" />
                <span>در حال دریافت زمان‌بندی زنده قسمت بعدی از مراجع معتبر...</span>
              </div>
            ) : nextEpisodeInfo ? (
              <EpisodeCountdown
                info={nextEpisodeInfo}
                mode="banner"
              />
            ) : null}
          </div>
        )}

        {/* Box Office Card (If available) */}
        {movie.box_office && (
          <div className="bg-gradient-to-r from-[#181828] via-[#222238] to-[#181828] border border-[#FFB800]/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFB800] to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/25 shrink-0">
                <DollarSign className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A0A0B5] font-bold">فروش و عملکرد در گیشه (Box Office)</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FFB800]/20 text-[#FFB800] text-[10px] font-black border border-[#FFB800]/30">
                    رتبه پرفروش
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#FFB800] block mt-1" dir="ltr">
                  {movie.box_office}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 z-10">
              <span className="px-3.5 py-1.5 rounded-xl bg-black/50 text-[#D1D1DF] text-xs font-semibold border border-[#3A3A55] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#FFB800]" />
                <span>تحلیل گیشه سینما</span>
              </span>
            </div>
          </div>
        )}

        {/* Story / Description Section */}
        {movie.description && (
          <div className="bg-[#141420] border border-[#2A2A40] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E50914]" />
                <span>خلاصه داستان و معرفی</span>
              </h2>
              <VoiceAudioController
                textToRead={`${movie.title}. ${movie.description}`}
                compact={true}
              />
            </div>
            <p className="text-sm sm:text-base text-[#D1D1DF] leading-relaxed whitespace-pre-line text-justify">
              {movie.description}
            </p>
          </div>
        )}

        {/* Awards & Honors Section (جوایز و افتخارات فیلم) */}
        {Array.isArray(movieAwards) && movieAwards.length > 0 && (
          <div id="movie-awards-section" className="bg-gradient-to-br from-[#1A1828] via-[#141424] to-[#12121E] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

            <button
              type="button"
              onClick={() => setAwardsExpanded(v => !v)}
              className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-amber-500/20 text-right cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0">
                  <Trophy className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>جوایز و افتخارات فیلم</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <ChevronDown className={`w-5 h-5 text-amber-400/70 transition-transform duration-300 ${awardsExpanded ? 'rotate-180' : ''}`} />
                  </h2>
                  {awardsSummary && (
                    <p className={`text-xs sm:text-sm text-amber-300/90 font-medium mt-0.5 ${awardsExpanded ? '' : 'line-clamp-1'}`}>
                      {awardsSummary}
                    </p>
                  )}
                </div>
              </div>

              {/* Awards Quick Stats */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5" />
                  <span>{movieAwards.filter(a => a.is_winner).length} جایزه برنده</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#222238] border border-[#3A3A55] text-[#A0A0B5] text-xs font-semibold">
                  {movieAwards.length} نامزدی کل
                </span>
              </div>
            </button>

            {/* Awards Grid (collapsible) */}
            <div className={`grid transition-all duration-300 ${awardsExpanded ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5' : 'hidden'}`}>
              {Array.isArray(movieAwards) && movieAwards.map((award, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    award.is_winner
                      ? 'bg-gradient-to-r from-amber-500/10 via-[#1F1D2C] to-[#1C1A28] border-amber-500/30 hover:border-amber-400/60'
                      : 'bg-[#181826] border-[#2E2E44] hover:border-[#424260]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {award.title}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        award.is_winner
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-[#2A2A40] text-[#A0A0B5]'
                      }`}
                    >
                      {award.is_winner ? 'برنده (Winner)' : 'نامزد'}
                    </span>
                  </div>

                  {award.category && (
                    <p className="text-xs text-[#A0A0B5] line-clamp-1 mb-2">
                      شاخه: <span className="text-[#D1D1DF] font-medium">{award.category}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#8A8AA5] pt-2 border-t border-[#25253A]">
                    <span>سال: {award.year}</span>
                    {award.recipient && (
                      <span className="text-amber-300/80 font-medium truncate max-w-[150px]">
                        {award.recipient}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Masterpiece Philosophical & Thematic Analysis Section */}
        {showPhilosophySection && (
          <div id="movie-philosophy-section" className="bg-gradient-to-br from-[#121829] via-[#101424] to-[#0E101C] border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>کالبدشکافی فلسفی و نشانه‌شناسی اثر</span>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-300/80 font-medium mt-0.5">
                    تحلیل چندلایه جهان درام، نمادهای پنهان، پالت بصری و رمزگشایی پایان‌بندی
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPhilosophySection(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1A1A2E] text-xs font-semibold text-[#8E8EA8] hover:text-white border border-[#2A2A44] transition-colors"
              >
                بستن تحلیل
              </button>
            </div>

            {loadingPhilosophy ? (
              <div className="py-14 text-center text-[#8E8EA8] bg-[#0E1222]/60 rounded-2xl border border-blue-500/20 animate-pulse">
                <Compass className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm font-bold text-white">در حال واکاوی عمیق فلسفی، موتیف‌های روایی و نشانه‌شناسی این اثر...</p>
              </div>
            ) : philosophyAnalysis ? (
              <div className="space-y-6">
                {/* School & Core Thesis */}
                <div className="p-5 bg-[#161C33] rounded-2xl border border-blue-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 font-bold">
                      مکتب فکری: {philosophyAnalysis.philosophical_school}
                    </span>
                    <VoiceAudioController
                      textToRead={`${movie.title}. ${philosophyAnalysis.core_thesis}. ${philosophyAnalysis.deep_analysis}`}
                      compact={true}
                    />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-white mb-1">مانیفست و تز بنیادین:</h3>
                    <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-medium">
                      {philosophyAnalysis.core_thesis}
                    </p>
                  </div>
                </div>

                {/* Deep Analysis Narrative */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    تحلیل چندلایه و ژرف‌اندیشانه پیرنگ:
                  </h4>
                  <p className="text-xs sm:text-sm text-[#C0C8E0] leading-relaxed text-justify bg-[#12162A] p-5 rounded-2xl border border-[#242A4A]">
                    {philosophyAnalysis.deep_analysis}
                  </p>
                </div>

                {/* Symbols Grid */}
                {philosophyAnalysis.hidden_symbolism && philosophyAnalysis.hidden_symbolism.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      رمزگشایی نمادها و استعاره‌های پنهان:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {philosophyAnalysis.hidden_symbolism.map((sym, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-[#141A32] rounded-2xl border border-blue-500/20 space-y-1"
                        >
                          <span className="font-extrabold text-xs text-yellow-300 block">
                            ✦ {sym.symbol}
                          </span>
                          <p className="text-xs text-[#A8B2D0] leading-relaxed">
                            {sym.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ending Interpretation & Cinematography */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {philosophyAnalysis.ending_interpretation && (
                    <div className="p-4 bg-[#181830] rounded-2xl border border-purple-500/30 space-y-1.5">
                      <h4 className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-400" />
                        رمزگشایی پایان‌بندی (Ending)
                      </h4>
                      <p className="text-xs text-[#D0D4EA] leading-relaxed">
                        {philosophyAnalysis.ending_interpretation}
                      </p>
                    </div>
                  )}

                  {philosophyAnalysis.cinematography_and_color && (
                    <div className="p-4 bg-[#141E34] rounded-2xl border border-cyan-500/30 space-y-1.5">
                      <h4 className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        میزانسن و پالت بصری
                      </h4>
                      <p className="text-xs text-[#C8D6EE] leading-relaxed">
                        {philosophyAnalysis.cinematography_and_color}
                      </p>
                    </div>
                  )}
                </div>

                {/* Iconic Quote */}
                {philosophyAnalysis.key_quote && (
                  <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-cyan-950/40 rounded-2xl border border-blue-400/30 flex items-start gap-3">
                    <Quote className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-cyan-300 block mb-1">دیالوگ و نقل‌قول مانیفستی:</span>
                      <p className="text-xs sm:text-sm font-serif italic text-white leading-relaxed">
                        «{philosophyAnalysis.key_quote}»
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Cast & Key Filmmakers Section (عوامل و بازیگران) */}
        <div id="movie-cast-crew-section" className="bg-[#141420] border border-[#2A2A40] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#8B5CF6]" />
                  <span>عوامل، سازندگان و بازیگران</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                  {displayCast.length + keyCrewMembers.length} نفر
                </span>
              </div>
              <p className="text-xs text-[#A0A0B5] mt-1">
                برای مشاهده پرونده کامل، بیوگرافی، سایر آثار و جوایز هر فرد روی کارت او کلیک کنید
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[#1C1C2E] p-1 rounded-xl border border-[#2A2A40]">
              <button
                onClick={() => setCastViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${castViewMode === 'grid' ? 'bg-[#8B5CF6] text-white' : 'text-[#8E8EA8] hover:text-white'}`}
                title="نمایش شبکه‌ای"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCastViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${castViewMode === 'list' ? 'bg-[#8B5CF6] text-white' : 'text-[#8E8EA8] hover:text-white'}`}
                title="نمایش فهرستی"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8EA8]" />
              <input
                type="text"
                value={castSearchQuery}
                onChange={(e) => setCastSearchQuery(e.target.value)}
                placeholder="جستجو در بین نام، نقش یا بیوگرافی بازیگران و عوامل..."
                className="w-full bg-[#1C1C2E] border border-[#2A2A40] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-white placeholder-[#6E6E88] focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
              {castSearchQuery && (
                <button
                  onClick={() => setCastSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8EA8] hover:text-white"
                >
                  پاک کردن
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setCastFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  castFilter === 'all'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
                }`}
              >
                همه ({displayCast.length + keyCrewMembers.length})
              </button>
              <button
                onClick={() => setCastFilter('main')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  castFilter === 'main'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
                }`}
              >
                بازیگران ({displayCast.length})
              </button>
              {keyCrewMembers.length > 0 && (
                <button
                  onClick={() => setCastFilter('crew')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    castFilter === 'crew'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
                  }`}
                >
                  عوامل و سازندگان ({keyCrewMembers.length})
                </button>
              )}
              <button
                onClick={() => setCastFilter('awards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  castFilter === 'awards'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
                }`}
              >
                <Trophy className="w-3 h-3" />
                <span>دارای جوایز</span>
              </button>
            </div>
          </div>

          {/* Key Filmmakers / Directors / Writers / Composers */}
          {castFilter !== 'main' && filteredCrew.length > 0 && (
            <div className="pb-6 border-b border-[#2A2A40]">
              <h3 className="text-xs sm:text-sm font-bold text-[#A0A0B5] mb-3.5 flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-[#A78BFA]" />
                <span>سازندگان و عوامل کلیدی ({filteredCrew.length} نفر):</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCrew.map((d, i) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedCastMember(d)}
                    className="flex items-center gap-3.5 bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-3 hover:border-[#8B5CF6] transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#141420] border border-[#3A3A55]">
                        <ActorAvatar
                          name={d.name}
                          englishName={d.english_name}
                          photo={d.photo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      {d.awards && d.awards.length > 0 && (
                        <span className="absolute -bottom-1 -left-1 bg-amber-500 text-black p-0.5 rounded-full">
                          <Trophy className="w-2.5 h-2.5 fill-black" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                          {d.name}
                        </span>
                      </div>
                      {d.english_name && (
                        <span className="text-[11px] text-[#7E7E98] block truncate font-sans" dir="ltr">
                          {d.english_name}
                        </span>
                      )}
                      <span className="text-xs text-[#A0A0B5] block truncate mt-0.5">{d.job || d.character || 'کارگردان / سازنده'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actors / Cast Grid / List */}
          {castFilter !== 'crew' && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#A0A0B5] flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#00D4FF]" />
                  <span>بازیگران و ستارگان اثر ({filteredCast.length} بازیگر):</span>
                </h3>
              </div>

              {loadingCast ? (
                <div className="flex items-center justify-center py-8 text-xs text-[#A0A0B5] gap-2">
                  <Users className="w-4 h-4 animate-pulse text-[#8B5CF6]" />
                  <span>در حال بارگذاری لیست کامل عوامل و بازیگران...</span>
                </div>
              ) : filteredCast.length > 0 ? (
                castViewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                    {filteredCast.map((actor, i) => (
                      <div
                        key={i}
                        id={`cast-member-${i}`}
                        onClick={() => setSelectedCastMember(actor)}
                        className="group bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl overflow-hidden p-3.5 flex flex-col items-center text-center hover:border-[#8B5CF6] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg relative"
                      >
                        <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 bg-[#141420] border-2 border-[#2A2A40] group-hover:border-[#8B5CF6] transition-colors shadow-md">
                          <ActorAvatar
                            name={actor.name}
                            englishName={actor.english_name}
                            photo={actor.photo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        {actor.awards && actor.awards.length > 0 && (
                          <span className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                            <Trophy className="w-2.5 h-2.5" />
                            <span>برنده جوایز</span>
                          </span>
                        )}

                        <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#8B5CF6] transition-colors line-clamp-1">
                          {actor.name}
                        </h4>
                        
                        {actor.english_name && (
                          <span className="text-[10px] text-[#7E7E98] line-clamp-1 font-sans mt-0.5" dir="ltr">
                            {actor.english_name}
                          </span>
                        )}

                        {actor.character && (
                          <span className="text-[11px] text-[#A0A0B5] line-clamp-1 mt-1 bg-[#141420] px-2 py-0.5 rounded-lg border border-[#2A2A40]">
                            {actor.character.startsWith('در نقش') ? actor.character : `در نقش ${actor.character}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCast.map((actor, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedCastMember(actor)}
                        className="flex items-center gap-3.5 bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-3 hover:border-[#8B5CF6] transition-all cursor-pointer group hover:-translate-y-0.5"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#141420] border-2 border-[#2A2A40] shrink-0">
                          <ActorAvatar
                            name={actor.name}
                            englishName={actor.english_name}
                            photo={actor.photo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                              {actor.name}
                            </h4>
                            {actor.awards && actor.awards.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                <Trophy className="w-2.5 h-2.5" />
                                <span>جوایز</span>
                              </span>
                            )}
                          </div>
                          {actor.english_name && (
                            <span className="text-[11px] text-[#7E7E98] block truncate font-sans" dir="ltr">
                              {actor.english_name}
                            </span>
                          )}
                          <span className="text-xs text-[#00D4FF] block truncate mt-0.5 font-medium">
                            {actor.character?.startsWith('در نقش') ? actor.character : `در نقش ${actor.character || 'بازیگر'}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 bg-[#1C1C2E]/40 rounded-2xl border border-[#2A2A40]">
                  <p className="text-xs text-[#8E8EA8]">موردی با مشخصات جستجو شده یافت نشد.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Movie Stills / Photo Gallery - Collapsible */}
        <div className="bg-[#141420] border border-[#2A2A40] rounded-3xl overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setGalleryExpanded(prev => !prev)}
            className="w-full p-6 sm:p-8 text-right flex items-center justify-between gap-3 hover:bg-[#1A1A30]/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>گالری تصاویر و صحنه‌های اثر</span>
                  <span className="text-xs font-normal text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded-full border border-[#00D4FF]/20">
                    Movie Stills & Gallery
                  </span>
                </h2>
                <p className="text-xs text-[#8E8EA8] mt-0.5">
                  فریم‌های برگزیده، صحنه‌های کلیدی و عکس‌های اختصاصی باکیفیت 4K
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#00D4FF]/70 transition-transform duration-300 flex-shrink-0 ${galleryExpanded ? 'rotate-180' : ''}`} />
          </button>

          <div className={`transition-all duration-300 ${galleryExpanded ? 'block' : 'hidden'}`}>
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/80 bg-[#1C1C2E] px-3 py-1.5 rounded-xl border border-[#2A2A40]">
                {displayedStills.length} تصویر
              </span>
              <button
                type="button"
                onClick={handleFetchOnlineStills}
                disabled={loadingOnlineStills}
                className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {loadingOnlineStills ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                    <span>در حال دریافت...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>بروزرسانی از TMDB</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sources Badge Ribbon */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8E8EA8] bg-[#10101C] p-2.5 rounded-2xl border border-[#202035]">
            <span className="font-medium text-white/60">منبع رسمی فریم‌ها و تصاویر صحنه:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">TMDB (The Movie Database) Official Backdrops & Stills</span>
          </div>

          {stillsSourceMessage && (
            <div className="text-xs text-[#00D4FF] bg-[#00D4FF]/5 border border-[#00D4FF]/20 px-3.5 py-2 rounded-xl">
              {stillsSourceMessage}
            </div>
          )}

          {displayedStills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedStills.map((still, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedStillIndex(idx)}
                  className="aspect-video rounded-2xl overflow-hidden bg-[#1C1C2E] border border-[#2A2A40] hover:border-[#00D4FF] cursor-pointer group relative transition-all duration-300 shadow-lg hover:shadow-[#00D4FF]/10"
                >
                  <img
                    src={still}
                    alt={`صحنه ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center">
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                        فریم #{idx + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-[#00D4FF]/80 text-black flex items-center justify-center">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-white/90 font-medium truncate">
                      مشاهده در اندازه کامل و کیفیت اصلی
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-[#161626]/50 rounded-2xl border border-dashed border-[#2A2A40]">
              <ImageIcon className="w-10 h-10 text-[#8E8EA8]/40 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-white">تصویری در گالری محلی ثبت نشده است</p>
              <p className="text-xs text-[#8E8EA8] mt-1 mb-4">می‌توانید با کلیک روی دکمه زیر تصاویر و فریم‌های رسمی اثر را از پایگاه داده TMDB دریافت کنید.</p>
              <button
                type="button"
                onClick={handleFetchOnlineStills}
                disabled={loadingOnlineStills}
                className="px-4 py-2 rounded-xl bg-[#00D4FF] hover:bg-[#00B4D8] text-black font-bold text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-[#00D4FF]/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>بارگذاری خودکار فریم‌های صحنه از TMDB</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

        {/* Similar & Recommended Movies by Storyline and Genre */}
        <SimilarMoviesSection
          currentMovie={movie}
          allMovies={allMovies}
          onSelectMovie={(target) => {
            if (onSelectMovie) {
              onSelectMovie(target);
            }
          }}
          onTrailerClick={onTrailerClick}
        />

      </div>

      {/* Cast Modal */}
      <CastModal
        member={selectedCastMember}
        onClose={() => setSelectedCastMember(null)}
        movieTitle={movie.title}
        allMovies={allMovies}
        onSelectMovie={onSelectMovie}
        onSelectMovieTitle={(title) => {
          const match = allMovies.find(m => m.title.includes(title) || (m.english_title && m.english_title.includes(title)));
          if (match && onSelectMovie) {
            onSelectMovie(match);
          }
        }}
      />

      {/* Still Preview Lightbox with Full Navigation */}
      {selectedStillIndex !== null && displayedStills[selectedStillIndex] && (
        <div 
          onClick={() => setSelectedStillIndex(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/95 backdrop-blur-xl animate-fade-in select-none"
        >
          {/* Top Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between py-2 text-white z-10"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#1C1C2E] border border-[#2A2A40] text-xs font-semibold px-3 py-1 rounded-xl">
                تصویر {selectedStillIndex + 1} از {displayedStills.length}
              </span>
              <span className="text-xs text-[#8E8EA8] hidden sm:inline">
                (استفاده از کلیدهای جهت‌نما ← / → برای جابجایی)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={displayedStills[selectedStillIndex]}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-[#2A2A40] text-[#00D4FF] border border-[#2A2A40] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="مشاهده مستقیم تصویر با کیفیت اصلی"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">لینک تصویر اصلی</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedStillIndex(null)}
                className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-rose-500/20 text-[#8E8EA8] hover:text-rose-300 border border-[#2A2A40] hover:border-rose-500/40 transition-colors"
                title="بستن (Esc)"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Container with Prev/Next Buttons */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-2"
          >
            {displayedStills.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedStillIndex((selectedStillIndex - 1 + displayedStills.length) % displayedStills.length)}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 hover:border-[#00D4FF] backdrop-blur-md transition-all shadow-xl"
                title="تصویر قبلی (کلید راست)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="max-w-full max-h-[75vh] rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl flex items-center justify-center">
              <img
                src={displayedStills[selectedStillIndex]}
                alt={`Movie still ${selectedStillIndex + 1}`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl animate-fade-in"
              />
            </div>

            {displayedStills.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedStillIndex((selectedStillIndex + 1) % displayedStills.length)}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 hover:border-[#00D4FF] backdrop-blur-md transition-all shadow-xl"
                title="تصویر بعدی (کلید چپ)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Ribbon */}
          {displayedStills.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 z-10"
            >
              {displayedStills.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedStillIndex(i)}
                  className={`relative flex-shrink-0 w-16 sm:w-20 aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedStillIndex 
                      ? 'border-[#00D4FF] scale-105 shadow-md shadow-[#00D4FF]/30' 
                      : 'border-[#2A2A40] opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={st} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HTML Export Modal */}
      {showExportHtmlModal && (
        <ExportHtmlModal
          movie={movie}
          allMovies={allMovies}
          onClose={() => setShowExportHtmlModal(false)}
        />
      )}

    </div>
  );
};

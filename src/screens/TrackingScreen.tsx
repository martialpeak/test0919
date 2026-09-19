import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TrackingItem, Movie, TrackingRequest, TrackingStatus, NextEpisodeInfo } from '../types';
import { MovieService } from '../services/api';
import { UserTrackingService } from '../services/userTrackingService';
import { useAuth } from '../context/AuthContext';
import { resolveNextEpisodeSchedule, enrichWithNextEpisode } from '../services/scheduleService';
import { EpisodeCountdown } from '../components/EpisodeCountdown';
import { 
  Tv, 
  ArrowRight, 
  Plus, 
  Minus, 
  Film, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  FileText, 
  X, 
  Check, 
  Star, 
  Heart, 
  Search, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  Layers,
  Radio,
  RefreshCw,
  Cloud,
  LogIn,
  Sparkles
} from 'lucide-react';

interface TrackingScreenProps {
  onBack: () => void;
  onMovieClick: (movie: Movie) => void;
  allMovies: Movie[];
  onOpenAuthModal?: () => void;
  initialMovieId?: number | null;
  onClearInitialMovieId?: () => void;
}

type TabType = 'all' | 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'series' | 'movies' | 'favorites';
type SortOption = 'recent' | 'rating' | 'progress' | 'title' | 'episodes';

export const TrackingScreen: React.FC<TrackingScreenProps> = ({
  onBack,
  onMovieClick,
  allMovies,
  onOpenAuthModal,
  initialMovieId,
  onClearInitialMovieId
}) => {
  const { user } = useAuth();
  const [trackingList, setTrackingList] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TrackingItem | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Form states in Add/Edit Modal
  const [selectedMovieId, setSelectedMovieId] = useState<number>(allMovies[0]?.message_id || 101);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customPoster, setCustomPoster] = useState<string>('');
  const [mediaType, setMediaType] = useState<'series' | 'movie'>('series');
  const [status, setStatus] = useState<TrackingStatus>('watching');
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [lastEpisode, setLastEpisode] = useState<number>(1);
  const [totalEpisodes, setTotalEpisodes] = useState<number | undefined>(undefined);
  const [timesWatched, setTimesWatched] = useState<number>(1);
  const [userRating, setUserRating] = useState<number>(0);
  const [nextEpisodeDate, setNextEpisodeDate] = useState<string>('');
  const [modalNextEpisodeInfo, setModalNextEpisodeInfo] = useState<NextEpisodeInfo | null>(null);
  const [autoFetchingSchedule, setAutoFetchingSchedule] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Movie search within modal
  const [movieSearchQuery, setMovieSearchQuery] = useState<string>('');

  const loadTracking = useCallback(async () => {
    setLoading(true);
    try {
      let items: TrackingItem[] = [];
      if (user) {
        // Fetch from user's personal Firestore tracking
        items = await UserTrackingService.getUserTracking(user.uid);
      } else {
        // Fallback to local storage for guests
        items = MovieService.getLocalTracking();
      }

      // Enrich series items with live countdown info
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (item.media_type === 'series') {
            const info = await enrichWithNextEpisode(item);
            return { ...item, next_episode_info: info || undefined };
          }
          return item;
        })
      );
      setTrackingList(enriched);
    } catch (e) {
      console.error('Failed to load tracking:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time updates when logged in
  useEffect(() => {
    if (user) {
      const unsubscribe = UserTrackingService.subscribeUserTracking(
        user.uid,
        async (items) => {
          const enriched = await Promise.all(
            items.map(async (item) => {
              if (item.media_type === 'series') {
                const info = await enrichWithNextEpisode(item);
                return { ...item, next_episode_info: info || undefined };
              }
              return item;
            })
          );
          setTrackingList(enriched);
          setLoading(false);
        },
        (err) => {
          console.warn('Real-time tracking subscription error:', err);
          loadTracking();
        }
      );
      return () => unsubscribe();
    } else {
      loadTracking();
    }
  }, [user, loadTracking]);

  // Handle initialMovieId if passed from movie details or elsewhere
  useEffect(() => {
    if (initialMovieId) {
      const target = allMovies.find((m) => m.message_id === initialMovieId);
      const existingInTracking = trackingList.find((t) => t.message_id === initialMovieId);
      if (existingInTracking) {
        setEditingItem(existingInTracking);
        setSelectedMovieId(existingInTracking.message_id);
        setCustomTitle(existingInTracking.title || '');
        setCustomPoster(existingInTracking.poster_url || '');
        setMediaType(existingInTracking.media_type);
        setStatus(existingInTracking.status || 'watching');
        setCurrentSeason(existingInTracking.current_season || 1);
        setLastEpisode(existingInTracking.last_episode || 0);
        setTotalEpisodes(existingInTracking.total_episodes);
        setTimesWatched(existingInTracking.times_watched || 1);
        setUserRating(existingInTracking.user_rating || 0);
        setNextEpisodeDate(existingInTracking.next_episode_date || '');
        setModalNextEpisodeInfo(existingInTracking.next_episode_info || null);
        setNote(existingInTracking.note || '');
        setIsFavorite(existingInTracking.favorite || false);
        setMovieSearchQuery('');
        setModalOpen(true);
      } else if (target) {
        handleOpenAdd(target);
      }
      onClearInitialMovieId?.();
    }
  }, [initialMovieId, allMovies, trackingList]);

  // Series that have an upcoming episode countdown
  const upcomingSeriesWithCountdowns = useMemo(() => {
    return trackingList.filter(
      (item) =>
        item.media_type === 'series' &&
        item.status !== 'completed' &&
        item.status !== 'dropped' &&
        item.next_episode_info &&
        item.next_episode_info.isUpcoming
    );
  }, [trackingList]);

  // Statistics
  const stats = useMemo(() => {
    const total = trackingList.length;
    const watching = trackingList.filter(t => (t.status || 'watching') === 'watching').length;
    const completed = trackingList.filter(t => t.status === 'completed').length;
    const planToWatch = trackingList.filter(t => t.status === 'plan_to_watch').length;
    const seriesCount = trackingList.filter(t => t.media_type === 'series').length;
    const moviesCount = trackingList.filter(t => t.media_type === 'movie').length;
    const favsCount = trackingList.filter(t => t.favorite === true).length;
    
    // Total episodes watched
    const totalEps = trackingList.reduce((acc, curr) => {
      if (curr.media_type === 'series') {
        return acc + (curr.last_episode || 0);
      }
      return acc + (curr.times_watched > 0 ? 1 : 0);
    }, 0);

    // Approximate hours (approx 45min per episode, 120min per movie)
    const approxMinutes = trackingList.reduce((acc, curr) => {
      if (curr.media_type === 'series') {
        return acc + (curr.last_episode || 0) * 45;
      }
      return acc + (curr.times_watched || 1) * 120;
    }, 0);
    const approxHours = Math.round(approxMinutes / 60);

    // Average user rating
    const ratedItems = trackingList.filter(t => t.user_rating && t.user_rating > 0);
    const avgRating = ratedItems.length > 0
      ? (ratedItems.reduce((acc, curr) => acc + (curr.user_rating || 0), 0) / ratedItems.length).toFixed(1)
      : '—';

    return { total, watching, completed, planToWatch, seriesCount, moviesCount, favsCount, totalEps, approxHours, avgRating };
  }, [trackingList]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return trackingList
      .filter((item) => {
        // Tab filtering
        if (activeTab === 'watching') return (item.status || 'watching') === 'watching';
        if (activeTab === 'completed') return item.status === 'completed';
        if (activeTab === 'plan_to_watch') return item.status === 'plan_to_watch';
        if (activeTab === 'on_hold') return item.status === 'on_hold' || item.status === 'dropped';
        if (activeTab === 'series') return item.media_type === 'series';
        if (activeTab === 'movies') return item.media_type === 'movie';
        if (activeTab === 'favorites') return item.favorite === true;
        return true;
      })
      .filter((item) => {
        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.english_title?.toLowerCase().includes(q) ||
          item.genre?.toLowerCase().includes(q) ||
          item.note?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.user_rating || 0) - (a.user_rating || 0);
        if (sortBy === 'episodes') return (b.last_episode || 0) - (a.last_episode || 0);
        if (sortBy === 'progress') {
          const progA = a.total_episodes ? (a.last_episode / a.total_episodes) : 0;
          const progB = b.total_episodes ? (b.last_episode / b.total_episodes) : 0;
          return progB - progA;
        }
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        // default recent
        return (b.updated_at || 0) - (a.updated_at || 0);
      });
  }, [trackingList, activeTab, searchQuery, sortBy]);

  // Auto-fetch schedule function
  const handleAutoFetchSchedule = async (movieObj?: Movie) => {
    const target = movieObj || allMovies.find((m) => m.message_id === Number(selectedMovieId));
    const titleToUse = target?.title || customTitle;
    const engTitleToUse = target?.english_title;
    const imdbIdToUse = target?.imdb_id;

    if (!titleToUse) return;

    setAutoFetchingSchedule(true);
    try {
      const schedule = await resolveNextEpisodeSchedule(titleToUse, engTitleToUse, imdbIdToUse);
      if (schedule) {
        setModalNextEpisodeInfo(schedule);
        if (schedule.formattedPersian || schedule.dayOfWeek) {
          setNextEpisodeDate(schedule.formattedPersian || schedule.dayOfWeek || '');
        }
        if (schedule.season) {
          setCurrentSeason(schedule.season);
        }
      }
    } catch (err) {
      console.error('Failed to auto-fetch schedule:', err);
    } finally {
      setAutoFetchingSchedule(false);
    }
  };

  // Modal actions
  const handleOpenAdd = (presetMovie?: Movie) => {
    setEditingItem(null);
    const targetMovie = presetMovie || allMovies[0];
    const targetId = targetMovie?.message_id || 101;
    const isSer = targetMovie?.category?.includes('series') ? true : false;
    
    setSelectedMovieId(targetId);
    setCustomTitle(targetMovie?.title || '');
    setCustomPoster(targetMovie?.poster_url || '');
    setMediaType(isSer ? 'series' : 'movie');
    setStatus('watching');
    setCurrentSeason(1);
    setLastEpisode(1);
    setTotalEpisodes(undefined);
    setTimesWatched(1);
    setUserRating(0);
    setNextEpisodeDate('');
    setModalNextEpisodeInfo(null);
    setNote('');
    setIsFavorite(false);
    setMovieSearchQuery('');
    setModalOpen(true);

    if (isSer && targetMovie) {
      handleAutoFetchSchedule(targetMovie);
    }
  };

  const handleOpenEdit = (item: TrackingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setSelectedMovieId(item.message_id);
    setCustomTitle(item.title || '');
    setCustomPoster(item.poster_url || '');
    setMediaType(item.media_type);
    setStatus(item.status || 'watching');
    setCurrentSeason(item.current_season || 1);
    setLastEpisode(item.last_episode || 0);
    setTotalEpisodes(item.total_episodes);
    setTimesWatched(item.times_watched || 1);
    setUserRating(item.user_rating || 0);
    setNextEpisodeDate(item.next_episode_date || '');
    setModalNextEpisodeInfo(item.next_episode_info || null);
    setNote(item.note || '');
    setIsFavorite(item.favorite || false);
    setMovieSearchQuery('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const movie = allMovies.find((m) => m.message_id === Number(selectedMovieId));

    const req: TrackingRequest = {
      media_type: mediaType,
      status: status,
      current_season: mediaType === 'series' ? Number(currentSeason) : 1,
      last_episode: mediaType === 'series' ? Number(lastEpisode) : 0,
      total_episodes: mediaType === 'series' && totalEpisodes ? Number(totalEpisodes) : undefined,
      times_watched: Math.max(0, Number(timesWatched)),
      user_rating: userRating > 0 ? userRating : undefined,
      next_episode_date: nextEpisodeDate.trim(),
      next_episode_info: modalNextEpisodeInfo || undefined,
      note: note.trim(),
      favorite: isFavorite,
    };

    const movieInfo: Partial<Movie> = movie || {
      title: customTitle || 'بدون نام',
      poster_url: customPoster,
      category: mediaType === 'series' ? 'foreign_series' : 'foreign_movies',
    };

    const newItem: TrackingItem = {
      message_id: Number(selectedMovieId),
      media_type: req.media_type,
      status: req.status || 'watching',
      current_season: req.current_season ?? 1,
      last_episode: req.last_episode ?? 0,
      total_episodes: req.total_episodes,
      times_watched: req.times_watched ?? 1,
      user_rating: req.user_rating,
      next_episode_date: req.next_episode_date || '',
      next_episode_info: req.next_episode_info,
      note: req.note || '',
      favorite: !!req.favorite,
      title: movieInfo.title || 'بدون نام',
      english_title: movieInfo.english_title,
      poster_url: movieInfo.poster_url || '',
      category: movieInfo.category || '',
      year: movieInfo.year,
      genre: movieInfo.genre,
      updated_at: Date.now()
    };

    // Optimistically update tracking list
    setTrackingList(prev => {
      const idx = prev.findIndex(t => t.message_id === newItem.message_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newItem };
        return next;
      }
      return [newItem, ...prev];
    });
    setModalOpen(false);

    if (user) {
      await UserTrackingService.saveTrackingItem(user.uid, Number(selectedMovieId), req, movieInfo);
    }
    await MovieService.saveTrackingItem(Number(selectedMovieId), req, movieInfo);
  };

  const handleDelete = async (messageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('آیا از حذف این اثر از لیست پیگیری اطمینان دارید؟')) {
      setTrackingList(prev => prev.filter(t => t.message_id !== messageId));
      if (user) {
        await UserTrackingService.deleteTrackingItem(user.uid, messageId);
      }
      await MovieService.deleteTrackingItem(messageId);
    }
  };

  // Quick Inline Actions
  const handleQuickInc = async (item: TrackingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextEp = (item.last_episode || 0) + 1;
    const isNowCompleted = item.total_episodes && nextEp >= item.total_episodes;

    const changes = {
      last_episode: nextEp,
      status: isNowCompleted ? 'completed' as TrackingStatus : (item.status === 'plan_to_watch' ? 'watching' as TrackingStatus : item.status),
    };

    setTrackingList(prev => prev.map(t => t.message_id === item.message_id ? { ...t, ...changes, updated_at: Date.now() } : t));

    if (user) {
      await UserTrackingService.updateTrackingItemFields(user.uid, item.message_id, changes);
    }
    await MovieService.updateTrackingQuick(item.message_id, changes);
  };

  const handleQuickDec = async (item: TrackingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if ((item.last_episode || 0) <= 0) return;
    const prevEp = (item.last_episode || 0) - 1;

    const changes = { last_episode: prevEp };
    setTrackingList(prev => prev.map(t => t.message_id === item.message_id ? { ...t, ...changes, updated_at: Date.now() } : t));

    if (user) {
      await UserTrackingService.updateTrackingItemFields(user.uid, item.message_id, changes);
    }
    await MovieService.updateTrackingQuick(item.message_id, changes);
  };

  const handleToggleFavorite = async (item: TrackingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const changes = { favorite: !item.favorite };
    setTrackingList(prev => prev.map(t => t.message_id === item.message_id ? { ...t, ...changes, updated_at: Date.now() } : t));

    if (user) {
      await UserTrackingService.updateTrackingItemFields(user.uid, item.message_id, changes);
    }
    await MovieService.updateTrackingQuick(item.message_id, changes);
  };

  const handleQuickStatusChange = async (item: TrackingItem, newStatus: TrackingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    const changes: Partial<TrackingItem> = { status: newStatus };
    if (newStatus === 'completed' && item.total_episodes && item.media_type === 'series') {
      changes.last_episode = item.total_episodes;
    }
    setTrackingList(prev => prev.map(t => t.message_id === item.message_id ? { ...t, ...changes, updated_at: Date.now() } : t));

    if (user) {
      await UserTrackingService.updateTrackingItemFields(user.uid, item.message_id, changes);
    }
    await MovieService.updateTrackingQuick(item.message_id, changes);
  };

  const handleQuickRating = async (item: TrackingItem, score: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRating = item.user_rating === score ? 0 : score;
    const changes = { user_rating: newRating };
    setTrackingList(prev => prev.map(t => t.message_id === item.message_id ? { ...t, ...changes, updated_at: Date.now() } : t));

    if (user) {
      await UserTrackingService.updateTrackingItemFields(user.uid, item.message_id, changes);
    }
    await MovieService.updateTrackingQuick(item.message_id, changes);
  };

  const handleCardClick = (item: TrackingItem) => {
    const movie = allMovies.find((m) => m.message_id === item.message_id);
    if (movie) {
      onMovieClick(movie);
    } else {
      const pseudo: Movie = {
        message_id: item.message_id,
        title: item.title || 'بدون نام',
        english_title: item.english_title,
        poster_url: item.poster_url,
        category: item.category || 'foreign_movies',
        year: item.year,
        genre: item.genre,
      };
      onMovieClick(pseudo);
    }
  };

  const getStatusBadge = (s?: TrackingStatus) => {
    switch (s) {
      case 'completed':
        return { label: 'کامل شده', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'plan_to_watch':
        return { label: 'در برنامه تماشا', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'on_hold':
        return { label: 'متوقف شده', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
      case 'dropped':
        return { label: 'انصراف', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      default:
        return { label: 'در حال تماشا', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white pb-24 md:pb-16 animate-fade-in font-sans">
      
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#141420]/95 backdrop-blur-md border-b border-[#2A2A40] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="tracking-back-button"
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-[#A0A0B5] hover:text-white border border-[#2A2A40] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                پیگیری تماشا (Watchlist & Tracker)
              </h1>
              <p className="text-[11px] text-[#8E8EA8] hidden sm:block">
                ثبت پیشرفت سریال‌ها، اپیزودهای دیده‌شده و زمان‌بندی تماشا
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="add-tracking-button"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-purple-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اثر</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* User Account / Cloud Sync Banner */}
        {user ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#1C1C2E] to-[#1C1C2E] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    حساب متصل: {user.displayName || user.email}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ذخیره‌سازی ابری فعال
                  </span>
                </div>
                <p className="text-[11px] text-[#A0A0B5] mt-0.5">
                  لیست پیگیری و پیشرفت شما به صورت خودکار و امن در پایگاه داده ابری ذخیره می‌شود.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#1C1C2E] to-[#1C1C2E] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block">
                  در حال استفاده به عنوان مهمان (حافظه محلی مرورگر)
                </span>
                <p className="text-[11px] text-[#A0A0B5] mt-0.5">
                  برای ذخیره‌سازی ابری، جلوگیری از پاک شدن اطلاعات و دسترسی در سایر دستگاه‌ها، وارد حساب خود شوید.
                </p>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7928CA] text-white font-bold text-xs shadow-md shadow-[#00D4FF]/20 hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود / ساخت حساب ابری</span>
              </button>
            )}
          </div>
        )}

        {/* Statistics Dashboard Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          
          {/* Watching */}
          <div className="bg-[#1C1C2E]/90 border border-[#8B5CF6]/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-white group-hover:text-[#8B5CF6] transition-colors">
                {stats.watching}
              </span>
              <p className="text-xs text-[#A0A0B5] font-medium">در حال تماشا</p>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-[#1C1C2E]/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {stats.completed}
              </span>
              <p className="text-xs text-[#A0A0B5] font-medium">کامل شده</p>
            </div>
          </div>

          {/* Episodes Watched */}
          <div className="bg-[#1C1C2E]/90 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                {stats.totalEps}
              </span>
              <p className="text-xs text-[#A0A0B5] font-medium">قسمت دیده‌شده</p>
            </div>
          </div>

          {/* Watch Time & Rating */}
          <div className="bg-[#1C1C2E]/90 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">
                  {stats.approxHours}
                </span>
                <span className="text-xs text-[#A0A0B5]">ساعت</span>
              </div>
              <p className="text-xs text-[#A0A0B5] font-medium">میانگین امتیاز: ⭐ {stats.avgRating}</p>
            </div>
          </div>

        </div>

        {/* Live Upcoming Episode Countdowns Section */}
        {upcomingSeriesWithCountdowns.length > 0 && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-br from-[#1C1C32] via-[#151526] to-[#12121E] border border-[#8B5CF6]/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2A2A40]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 flex items-center justify-center text-[#00D4FF]">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>روزشمار زنده قسمت‌های بعدی سریال‌ها</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] text-[10px] font-bold">
                      {upcomingSeriesWithCountdowns.length} سریال
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8E8EA8]">
                    محاسبه خودکار و بلادرنگ زمان انتشار از مراجع معتبر (TVMaze و جدول پخش رسمی)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {upcomingSeriesWithCountdowns.map((item) => (
                <div
                  key={`countdown-card-${item.message_id}`}
                  onClick={() => handleCardClick(item)}
                  className="bg-[#141424]/90 hover:bg-[#1A1A30] border border-[#3A3A55] hover:border-[#8B5CF6]/60 rounded-2xl p-3.5 flex items-center gap-3.5 transition-all cursor-pointer shadow-md group"
                >
                  <div className="relative w-14 aspect-[2/3] rounded-xl overflow-hidden bg-black/40 border border-[#2A2A40] shrink-0">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#5A5A72]">
                        <Tv className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#00D4FF] transition-colors">
                        {item.title}
                      </h4>
                      {item.next_episode_info?.network && (
                        <span className="text-[10px] text-[#A0A0B5] bg-black/40 px-1.5 py-0.5 rounded shrink-0">
                          {item.next_episode_info.network}
                        </span>
                      )}
                    </div>

                    {item.next_episode_info && (
                      <EpisodeCountdown
                        info={item.next_episode_info}
                        mode="compact"
                        className="p-1.5 bg-[#0F0F1A]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Filter Tabs and Search Bar */}
        <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-3 sm:p-4 mb-6 flex flex-col gap-3">
          
          {/* Category Filter Tabs (Responsive Grid for Mobile & Desktop) */}
          <div className="grid grid-cols-2 xs:grid-cols-4 md:grid-cols-7 gap-2">
            
            <button
              id="tab-all"
              onClick={() => setActiveTab('all')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">همه آثار</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-purple-200 font-mono shrink-0">
                {stats.total}
              </span>
            </button>

            <button
              id="tab-watching"
              onClick={() => setActiveTab('watching')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'watching'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tv className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span className="truncate">در حال تماشا</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-purple-200 font-mono shrink-0">
                {stats.watching}
              </span>
            </button>

            <button
              id="tab-completed"
              onClick={() => setActiveTab('completed')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">کامل شده</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-emerald-200 font-mono shrink-0">
                {stats.completed}
              </span>
            </button>

            <button
              id="tab-plan"
              onClick={() => setActiveTab('plan_to_watch')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'plan_to_watch'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Bookmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">در برنامه</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-amber-200 font-mono shrink-0">
                {stats.planToWatch}
              </span>
            </button>

            <button
              id="tab-series"
              onClick={() => setActiveTab('series')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'series'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tv className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="truncate">سریال‌ها</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-cyan-200 font-mono shrink-0">
                {stats.seriesCount}
              </span>
            </button>

            <button
              id="tab-movies"
              onClick={() => setActiveTab('movies')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'movies'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Film className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span className="truncate">فیلم‌ها</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-rose-200 font-mono shrink-0">
                {stats.moviesCount}
              </span>
            </button>

            <button
              id="tab-favorites"
              onClick={() => setActiveTab('favorites')}
              className={`p-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400/40'
                  : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white border border-[#2A2A40]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Heart className="w-3.5 h-3.5 text-red-300 shrink-0" />
                <span className="truncate">علاقه‌ها</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/40 text-red-200 font-mono shrink-0">
                {stats.favsCount}
              </span>
            </button>

          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#2A2A40]/60">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#7E7E9A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در فیلم‌ها، سریال‌ها و یادداشت‌های پیگیری..."
                className="w-full bg-[#1C1C2E] border border-[#2A2A40] rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-[#7E7E9A] focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7E7E9A] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#8E8EA8] whitespace-nowrap">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#1C1C2E] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
              >
                <option value="recent">آخرین تغییرات</option>
                <option value="rating">بالاترین امتیاز من</option>
                <option value="progress">بیشترین پیشرفت</option>
                <option value="episodes">بیشترین اپیزود</option>
                <option value="title">الفبایی (عنوان)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Tracking List Items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A0A0B5]">
            <Tv className="w-8 h-8 animate-pulse text-[#8B5CF6]" />
            <span className="text-sm">در حال بارگذاری لیست پیگیری...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#141420] rounded-3xl border border-[#2A2A40] p-8">
            <Tv className="w-16 h-16 text-[#5A5A72] mb-3 stroke-1" />
            <h3 className="text-lg font-bold text-white mb-1.5">موردی در این بخش یافت نشد</h3>
            <p className="text-xs sm:text-sm text-[#A0A0B5] max-w-md mb-6">
              {searchQuery
                ? 'هیچ اثری مطابق با عبارت جستجو شده پیدا نشد.'
                : 'می‌توانید سریال‌ها و فیلم‌های جدید را اضافه کنید تا روند تماشای آن‌ها ثبت شود.'}
            </p>
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اثر جدید</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredItems.map((item) => {
              const isSeries = item.media_type === 'series';
              const badge = getStatusBadge(item.status);
              const progressPct = isSeries && item.total_episodes && item.total_episodes > 0
                ? Math.min(100, Math.round(((item.last_episode || 0) / item.total_episodes) * 100))
                : null;

              return (
                <div
                  key={item.message_id}
                  id={`tracking-card-${item.message_id}`}
                  onClick={() => handleCardClick(item)}
                  className="group bg-[#171725] hover:bg-[#1E1E32] border border-[#2A2A40] hover:border-[#8B5CF6]/50 rounded-2xl p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5"
                >
                  
                  {/* Left: Poster + Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full sm:w-auto">
                    
                    {/* Poster */}
                    <div className="relative w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden bg-[#12121C] border border-[#3A3A55] shrink-0 shadow-md">
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5A5A72]">
                          {isSeries ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                        </div>
                      )}

                      {/* Favorite Badge */}
                      {item.favorite && (
                        <div className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white shadow">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Details Info */}
                    <div className="min-w-0 flex-1">
                      
                      {/* Title & Status */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm">{isSeries ? '📺' : '🎬'}</span>
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                          {item.title || 'بدون نام'}
                        </h3>
                        {item.year && (
                          <span className="text-[11px] text-[#7E7E9A]">({item.year})</span>
                        )}

                        <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Series Progress or Movie Watched count */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {isSeries ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                              فصل {item.current_season || 1} • قسمت {item.last_episode || 0}
                              {item.total_episodes ? ` از ${item.total_episodes}` : ''}
                            </span>
                            
                            {progressPct !== null && (
                              <span className="text-[11px] font-bold text-[#A0A0B5]">
                                {progressPct}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/30">
                            <Eye className="w-3 h-3" />
                            <span>{item.times_watched > 0 ? `${item.times_watched} بار تماشا شده` : 'فیلم سینمایی'}</span>
                          </span>
                        )}

                        {/* User Rating Badge */}
                        <div 
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const current = item.user_rating || 0;
                            const next = current >= 10 ? 0 : current + 1;
                            handleQuickRating(item, next, e);
                          }}
                          title="امتیازدهی سریع (برای تغییر کلیک کنید)"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.user_rating ? `${item.user_rating} / ۱۰` : 'امتیاز دهید'}</span>
                        </div>

                        {/* Next Episode Date / Live Countdown */}
                        {item.next_episode_info ? (
                          <EpisodeCountdown
                            info={item.next_episode_info}
                            mode="badge"
                          />
                        ) : item.next_episode_date ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Calendar className="w-3 h-3" />
                            <span>قسمت بعدی: {item.next_episode_date}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Progress bar for series */}
                      {isSeries && progressPct !== null && (
                        <div className="w-full max-w-xs mt-2 bg-[#12121C] h-1.5 rounded-full overflow-hidden border border-[#2A2A40]">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] transition-all duration-300 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}

                      {/* Note snippet */}
                      {item.note && (
                        <p className="text-[11px] text-[#A0A0B5] mt-2 line-clamp-1 flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/5">
                          <FileText className="w-3 h-3 text-[#7E7E9A] shrink-0" />
                          <span>{item.note}</span>
                        </p>
                      )}

                    </div>

                  </div>

                  {/* Right: Quick Control Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 border-[#2A2A40] pt-2.5 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                    
                    {/* Series episode +/- step */}
                    {isSeries && (
                      <div className="flex items-center gap-1 bg-[#12121C] p-1 rounded-xl border border-[#2A2A40]">
                        <button
                          id={`dec-ep-btn-${item.message_id}`}
                          onClick={(e) => handleQuickDec(item, e)}
                          title="قسمت قبلی (-1)"
                          disabled={(item.last_episode || 0) <= 0}
                          className="p-1.5 rounded-lg text-[#A0A0B5] hover:text-white hover:bg-[#242438] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black px-1.5 text-[#00D4FF]">
                          {item.last_episode || 0}
                        </span>
                        <button
                          id={`inc-ep-btn-${item.message_id}`}
                          onClick={(e) => handleQuickInc(item, e)}
                          title="قسمت بعدی (+1)"
                          className="p-1.5 rounded-lg bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Quick Complete / Watching toggle button */}
                    <button
                      id={`status-toggle-btn-${item.message_id}`}
                      onClick={(e) => handleQuickStatusChange(
                        item, 
                        item.status === 'completed' ? 'watching' : 'completed', 
                        e
                      )}
                      title={item.status === 'completed' ? 'تغییر به در حال تماشا' : 'علامت زدن به عنوان کامل شده'}
                      className={`p-2 rounded-xl border transition-colors ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-[#1C1C2E] text-[#A0A0B5] border-[#2A2A40] hover:text-emerald-400 hover:border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    {/* Favorite toggle */}
                    <button
                      id={`fav-btn-${item.message_id}`}
                      onClick={(e) => handleToggleFavorite(item, e)}
                      title="موردعلاقه"
                      className={`p-2 rounded-xl border transition-colors ${
                        item.favorite
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-[#1C1C2E] text-[#A0A0B5] border-[#2A2A40] hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Edit button */}
                    <button
                      id={`edit-track-btn-${item.message_id}`}
                      onClick={(e) => handleOpenEdit(item, e)}
                      title="ویرایش جزئیات"
                      className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-[#A0A0B5] hover:text-white border border-[#2A2A40] transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      id={`delete-track-btn-${item.message_id}`}
                      onClick={(e) => handleDelete(item.message_id, e)}
                      title="حذف از پیگیری"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            id="tracking-modal"
            className="relative w-full max-w-lg bg-[#181827] border border-[#3A3A55] rounded-3xl p-5 sm:p-6 shadow-2xl my-8"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2A40] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
                  <Tv className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {editingItem ? 'ویرایش وضعیت پیگیری' : 'افزودن فیلم یا سریال به لیست پیگیری'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#12121C] text-[#A0A0B5] hover:text-white border border-[#2A2A40]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              {/* Select Movie / Series */}
              <div>
                <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">
                  انتخاب اثر از آرشیو:
                </label>
                
                {/* Search in modal if creating new */}
                {!editingItem && (
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="جستجوی سریع در آرشیو فیلم‌ها..."
                      value={movieSearchQuery}
                      onChange={(e) => setMovieSearchQuery(e.target.value)}
                      className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#7E7E9A] focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                )}

                <select
                  id="tracking-select-movie"
                  value={selectedMovieId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedMovieId(id);
                    const selected = allMovies.find(m => m.message_id === id);
                    if (selected) {
                      setCustomTitle(selected.title);
                      setCustomPoster(selected.poster_url || '');
                      setMediaType(selected.category?.includes('series') ? 'series' : 'movie');
                    }
                  }}
                  disabled={!!editingItem}
                  className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  {allMovies
                    .filter(m => {
                      if (!movieSearchQuery.trim()) return true;
                      const q = movieSearchQuery.toLowerCase();
                      return m.title.toLowerCase().includes(q) || (m.english_title && m.english_title.toLowerCase().includes(q));
                    })
                    .map((m) => (
                      <option key={m.message_id} value={m.message_id} className="bg-[#12121C] text-white">
                        {m.title} ({m.year || 'نامشخص'}) — {m.category?.includes('series') ? 'سریال' : 'فیلم'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Status and Media Type row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Media Type */}
                <div>
                  <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">نوع رسانه:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaType('series')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        mediaType === 'series'
                          ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-600/30'
                          : 'bg-[#12121C] text-[#A0A0B5] border border-[#2A2A40]'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>سریال</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('movie')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        mediaType === 'movie'
                          ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
                          : 'bg-[#12121C] text-[#A0A0B5] border border-[#2A2A40]'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>فیلم</span>
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">وضعیت تماشا:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TrackingStatus)}
                    className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="watching">⏳ در حال تماشا</option>
                    <option value="completed">✅ کامل شده (دیده‌شده)</option>
                    <option value="plan_to_watch">📌 در برنامه تماشا</option>
                    <option value="on_hold">⏸️ متوقف شده</option>
                    <option value="dropped">❌ انصراف از ادامه</option>
                  </select>
                </div>

              </div>

              {/* Series Specifics (Season, Last Ep, Total Ep) */}
              {mediaType === 'series' && (
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#12121C] border border-[#2A2A40]">
                  <div>
                    <label className="text-[11px] font-bold text-[#A0A0B5] block mb-1">
                      شماره فصل:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentSeason}
                      onChange={(e) => setCurrentSeason(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#1A1A2A] border border-[#3A3A55] rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#A0A0B5] block mb-1">
                      آخرین قسمت دیده شده:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lastEpisode}
                      onChange={(e) => setLastEpisode(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#1A1A2A] border border-[#3A3A55] rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#A0A0B5] block mb-1">
                      کل قسمت‌ها (اختیاری):
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="مثلاً ۱۰"
                      value={totalEpisodes || ''}
                      onChange={(e) => setTotalEpisodes(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-[#1A1A2A] border border-[#3A3A55] rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>
              )}

              {/* Personal Rating (1 - 10 Stars) */}
              <div>
                <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">
                  امتیاز شخصی شما: ({userRating > 0 ? `${userRating} از ۱۰` : 'بدون امتیاز'})
                </label>
                <div className="flex items-center gap-1.5 bg-[#12121C] p-2.5 rounded-xl border border-[#2A2A40] justify-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(userRating === star ? 0 : star)}
                      className="p-1 text-base transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          star <= userRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-[#4A4A62] hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Times watched & Next Ep date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">
                    تعداد دفعات تماشا:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={timesWatched}
                    onChange={(e) => setTimesWatched(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold text-[#C5C5DE]">
                      زمان یا تاریخ قسمت بعدی:
                    </label>
                    {mediaType === 'series' && (
                      <button
                        type="button"
                        onClick={() => handleAutoFetchSchedule()}
                        disabled={autoFetchingSchedule}
                        className="text-[11px] font-bold text-[#00D4FF] hover:text-cyan-300 flex items-center gap-1 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 px-2 py-0.5 rounded-lg border border-[#00D4FF]/30 transition-colors disabled:opacity-50 cursor-pointer"
                        title="جستجو و همگام‌سازی زمان پخش از پایگاه داده TVMaze و جدول پخش رسمی"
                      >
                        <RefreshCw className={`w-3 h-3 ${autoFetchingSchedule ? 'animate-spin' : ''}`} />
                        <span>{autoFetchingSchedule ? 'در حال استعلام...' : 'استعلام خودکار'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="مثلاً جمعه‌ها یا ۱۴۰۳/۰۲/۲۰"
                    value={nextEpisodeDate}
                    onChange={(e) => setNextEpisodeDate(e.target.value)}
                    className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Live Preview of Next Episode Countdown in Modal */}
              {mediaType === 'series' && modalNextEpisodeInfo && (
                <div className="p-3 bg-[#10101C] rounded-2xl border border-[#8B5CF6]/30 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-[#A0A0B5] mb-2 font-bold">
                    <span className="flex items-center gap-1 text-[#00D4FF]">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      پیش‌نمایش روزشمار زنده:
                    </span>
                    {modalNextEpisodeInfo.source && (
                      <span className="bg-[#1A1A2A] px-2 py-0.5 rounded text-[10px] text-[#8E8EA8]">
                        مرجع: {modalNextEpisodeInfo.source === 'tvmaze' ? 'TVMaze (جهانی)' : 'جدول پخش داخلی'}
                      </span>
                    )}
                  </div>
                  <EpisodeCountdown
                    info={modalNextEpisodeInfo}
                    mode="compact"
                    className="bg-[#18182A]"
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-bold text-[#C5C5DE] block mb-1.5">
                  یادداشت و نظر شخصی:
                </label>
                <textarea
                  rows={2}
                  placeholder="نکته، برداشت شخصی، کیفیت مناسب، فصل، و..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#12121C] border border-[#2A2A40] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>

              {/* Favorite toggle checkbox */}
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsFavorite(!isFavorite)}>
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-0 bg-[#12121C] border-[#3A3A55]"
                />
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                  افزودن به برگزیده‌ها و موردعلاقه‌ها
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#2A2A40]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#242438] text-xs font-semibold text-[#A0A0B5] hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-purple-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'ذخیره تغییرات' : 'افزودن به لیست'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};


import React, { useState, useMemo, useEffect } from 'react';
import { Movie } from '../types';
import { extractAllActorsFromSite, DetailedActorProfile, formatActorRoleLabel } from '../utils/actorHelper';
import { isSeriesItem } from '../data/categories';
import { ActorAvatar } from '../components/ActorAvatar';
import { resolveActorPhoto } from '../services/actorPhotoService';
import { AddEditActorModal } from '../components/AddEditActorModal';
import { 
  Users, 
  Search, 
  Film, 
  Trophy, 
  Clapperboard, 
  Sparkles, 
  Globe, 
  Award, 
  Star, 
  Calendar, 
  MapPin, 
  Play, 
  ChevronLeft,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Heart,
  Tv,
  Layers,
  Plus,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../services/apiFetch';

interface ActorsScreenProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onTrailerClick?: (movie: Movie) => void;
  onToggleFavorite?: (messageId: number) => void;
  initialSelectedActorName?: string | null;
  isAdmin?: boolean;
}

export const ActorsScreen: React.FC<ActorsScreenProps> = ({
  movies,
  onMovieClick,
  onTrailerClick,
  onToggleFavorite,
  initialSelectedActorName,
  isAdmin = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'with_site_movies' | 'iranian' | 'foreign' | 'director' | 'winner'>('all');
  const [sortBy, setSortBy] = useState<'most_movies' | 'most_awards' | 'alphabetical'>('most_movies');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ACTORS_PAGE_SIZE = 36;

  // Reset page when search, category, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);
  
  // Selected actor for rich full dossier/modal
  const [selectedActor, setSelectedActor] = useState<DetailedActorProfile | null>(null);
  const [dossierSiteFilter, setDossierSiteFilter] = useState<'all' | 'movies' | 'series' | 'kids'>('all');

  // Admin Actor Add / Edit Modal state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [actorToEdit, setActorToEdit] = useState<DetailedActorProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // Listen for actor data changes
    const handleDataChanged = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('filmbareh:actor-data-changed', handleDataChanged);
    return () => window.removeEventListener('filmbareh:actor-data-changed', handleDataChanged);
  }, []);

  // Reset dossier filter when changing actor
  useEffect(() => {
    setDossierSiteFilter('all');
  }, [selectedActor?.name]);

  // Extract and enrich all actors from all site movies (and re-evaluate when refreshKey changes)
  const allActors = useMemo(() => {
    return extractAllActorsFromSite(movies);
  }, [movies, refreshKey]);

  // Auto-complete missing actor data: only for a small batch when user is viewing
  useEffect(() => {
    // Disabled massive auto-complete payload that clogged network/CPU
  }, []);

  // Handle initial selected actor if requested
  useEffect(() => {
    if (initialSelectedActorName) {
      const found = allActors.find(
        a => a.name.toLowerCase() === initialSelectedActorName.toLowerCase() ||
             (a.english_name && a.english_name.toLowerCase() === initialSelectedActorName.toLowerCase())
      );
      if (found) {
        setSelectedActor(found);
      }
    }
  }, [initialSelectedActorName, allActors]);

  // Filter and sort actors
  const filteredActors = useMemo(() => {
    let list = [...allActors];

    // 1. Category Filter
    if (selectedCategory === 'with_site_movies') {
      list = list.filter(a => a.siteMovieCount > 0);
    } else if (selectedCategory === 'iranian') {
      list = list.filter(a => a.category === 'iranian');
    } else if (selectedCategory === 'foreign') {
      list = list.filter(a => a.category === 'foreign' || a.category === 'winner');
    } else if (selectedCategory === 'director') {
      list = list.filter(a => a.isDirector || a.job?.includes('کارگردان'));
    } else if (selectedCategory === 'winner') {
      list = list.filter(a => (a.awards && a.awards.length > 0) || a.biography?.includes('برنده') || a.biography?.includes('اسکار') || a.biography?.includes('سیمرغ'));
    }

    // 2. Search Query Filter (Persian name, English name, character, site movies)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => {
        const inName = a.name.toLowerCase().includes(q);
        const inEng = a.english_name ? a.english_name.toLowerCase().includes(q) : false;
        const inChar = a.character ? a.character.toLowerCase().includes(q) : false;
        const inJob = a.job ? a.job.toLowerCase().includes(q) : false;
        const inBio = a.biography ? a.biography.toLowerCase().includes(q) : false;
        const inMovies = a.siteMovies.some(sm => 
          sm.movie.title.toLowerCase().includes(q) || 
          (sm.movie.english_title && sm.movie.english_title.toLowerCase().includes(q))
        );
        return inName || inEng || inChar || inJob || inBio || inMovies;
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'most_movies') {
        if (b.siteMovieCount !== a.siteMovieCount) {
          return b.siteMovieCount - a.siteMovieCount;
        }
        const aAwards = a.awards?.length || 0;
        const bAwards = b.awards?.length || 0;
        if (bAwards !== aAwards) return bAwards - aAwards;
        return a.name.localeCompare(b.name, 'fa');
      } else if (sortBy === 'most_awards') {
        const aAwards = a.awards?.length || 0;
        const bAwards = b.awards?.length || 0;
        if (bAwards !== aAwards) return bAwards - aAwards;
        return b.siteMovieCount - a.siteMovieCount;
      } else {
        return a.name.localeCompare(b.name, 'fa');
      }
    });

    return list;
  }, [allActors, selectedCategory, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredActors.length / ACTORS_PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedActors = useMemo(() => {
    const start = (validPage - 1) * ACTORS_PAGE_SIZE;
    return filteredActors.slice(start, start + ACTORS_PAGE_SIZE);
  }, [filteredActors, validPage]);

  const handlePageChange = (p: number) => {
    setCurrentPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Overall statistics
  const stats = useMemo(() => {
    const totalActors = allActors.length;
    const withSiteMoviesCount = allActors.filter(a => a.siteMovieCount > 0).length;
    const iranianCount = allActors.filter(a => a.category === 'iranian').length;
    const awardWinnersCount = allActors.filter(a => a.awards && a.awards.length > 0).length;
    const directorsCount = allActors.filter(a => a.isDirector || a.job?.includes('کارگردان')).length;

    return {
      totalActors,
      withSiteMoviesCount,
      iranianCount,
      awardWinnersCount,
      directorsCount
    };
  }, [allActors]);

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A2E] via-[#141424] to-[#0E0E18] border border-[#2A2A44] p-6 sm:p-10 shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>دایره‌المعارف ستارگان و بازیگران</span>
                </div>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>پنل مدیریت فعال</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                بازیگران و سازندگان سینما
              </h1>
              <p className="text-sm sm:text-base text-[#A0A0B5] leading-relaxed">
                مرور بیوگرافی و پرونده افتخارات هر بازیگر، به همراه <strong className="text-white">فیلم‌ها و سریال‌های موجود در سایت</strong> با قابلیت انتخاب و تماشای مستقیم.
              </p>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActorToEdit(null);
                      setIsAddEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#E50914] hover:from-[#7C3AED] hover:to-red-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن هنرمند یا بازیگر جدید به سیستم</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
              <div className="bg-[#1C1C2E]/80 border border-[#2E2E48] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#A0A0B5] mb-1">
                  <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>کل هنرمندان</span>
                </div>
                <span className="text-lg font-black text-white">{stats.totalActors}</span>
              </div>

              <div className="bg-[#1C1C2E]/80 border border-[#2E2E48] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#A0A0B5] mb-1">
                  <Film className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>دارای اثر در سایت</span>
                </div>
                <span className="text-lg font-black text-[#00D4FF]">{stats.withSiteMoviesCount}</span>
              </div>

              <div className="bg-[#1C1C2E]/80 border border-[#2E2E48] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#A0A0B5] mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>برندگان جوایز</span>
                </div>
                <span className="text-lg font-black text-amber-400">{stats.awardWinnersCount}</span>
              </div>

              <div className="bg-[#1C1C2E]/80 border border-[#2E2E48] rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#A0A0B5] mb-1">
                  <Clapperboard className="w-3.5 h-3.5 text-rose-400" />
                  <span>کارگردانان</span>
                </div>
                <span className="text-lg font-black text-rose-400">{stats.directorsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Category Filters & Sort Controls */}
        {/* Search, Sort and Mobile-Optimized Category Filter Panel */}
        <div className="bg-[#141420] border border-[#2A2A40] rounded-3xl p-3.5 sm:p-5 space-y-4 shadow-xl">
          
          {/* Top Search & Sort Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#7E7E98]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام بازیگر، نقش یا اثر..."
                className="w-full bg-[#1C1C2E] border border-[#2E2E48] rounded-2xl pr-11 pl-10 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-[#686882] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#7E7E98] hover:text-white bg-[#252538] p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Quick Reset Bar */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-[11px] font-bold text-rose-400 hover:text-white bg-rose-950/40 border border-rose-800/50 transition-all shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span>حذف فیلتر</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-[#1C1C2E] border border-[#2E2E48] rounded-2xl px-3 py-2 text-xs text-[#A0A0B5] shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="hidden xs:inline">مرتب‌سازی:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="most_movies" className="bg-[#1C1C2E] text-white">بیشترین فیلم در سایت</option>
                  <option value="most_awards" className="bg-[#1C1C2E] text-white">بیشترین جوایز و افتخارات</option>
                  <option value="alphabetical" className="bg-[#1C1C2E] text-white">به ترتیب الفبا</option>
                </select>
              </div>
            </div>
          </div>

          {/* 📱 Fully Responsive Mobile Category Grid (Fits 100% on phone screens) */}
          <div className="pt-1">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
              
              {/* Category 1: All Actors */}
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white border-purple-400/60 shadow-lg shadow-purple-900/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory === 'all' ? 'bg-black/30 text-white' : 'bg-[#121222] text-[#8B5CF6]'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">همه هنرمندان</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'all' ? 'text-white/80' : 'text-[#7A7A98]'
                  }`}>
                    {allActors.length} نفر
                  </div>
                </div>
              </button>

              {/* Category 2: With Site Movies */}
              <button
                type="button"
                onClick={() => setSelectedCategory('with_site_movies')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'with_site_movies'
                    ? 'bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-black border-cyan-300 shadow-lg shadow-cyan-900/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory === 'with_site_movies' ? 'bg-black/25 text-black' : 'bg-[#121222] text-[#00D4FF]'
                }`}>
                  <Film className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">در سایت ما</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'with_site_movies' ? 'text-black/80' : 'text-[#7A7A98]'
                  }`}>
                    {stats.withSiteMoviesCount} هنرمند
                  </div>
                </div>
              </button>

              {/* Category 3: Iranian Cinema */}
              <button
                type="button"
                onClick={() => setSelectedCategory('iranian')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'iranian'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/60 shadow-lg shadow-emerald-950/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                  selectedCategory === 'iranian' ? 'bg-black/30' : 'bg-[#121222]'
                }`}>
                  🇮🇷
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">سینمای ایران</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'iranian' ? 'text-white/80' : 'text-[#7A7A98]'
                  }`}>
                    {stats.iranianCount} نفر
                  </div>
                </div>
              </button>

              {/* Category 4: Foreign & Hollywood */}
              <button
                type="button"
                onClick={() => setSelectedCategory('foreign')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'foreign'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-indigo-400/60 shadow-lg shadow-indigo-950/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory === 'foreign' ? 'bg-black/30 text-white' : 'bg-[#121222] text-indigo-400'
                }`}>
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">سینمای جهان</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'foreign' ? 'text-white/80' : 'text-[#7A7A98]'
                  }`}>
                    بین‌المللی
                  </div>
                </div>
              </button>

              {/* Category 5: Directors */}
              <button
                type="button"
                onClick={() => setSelectedCategory('director')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'director'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-700 text-white border-rose-400/60 shadow-lg shadow-rose-950/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory === 'director' ? 'bg-black/30 text-white' : 'bg-[#121222] text-rose-400'
                }`}>
                  <Clapperboard className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">کارگردانان</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'director' ? 'text-white/80' : 'text-[#7A7A98]'
                  }`}>
                    {stats.directorsCount} نفر
                  </div>
                </div>
              </button>

              {/* Category 6: Award Winners */}
              <button
                type="button"
                onClick={() => setSelectedCategory('winner')}
                className={`group relative flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-95 border ${
                  selectedCategory === 'winner'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-950/40 font-extrabold -translate-y-0.5'
                    : 'bg-[#18182B] text-[#A0A0BC] hover:text-white border-[#2A2A44] hover:border-[#3E3E60] hover:bg-[#202036]'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory === 'winner' ? 'bg-black/25 text-black' : 'bg-[#121222] text-amber-400'
                }`}>
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="text-xs font-bold truncate">برندگان جوایز</div>
                  <div className={`text-[10px] font-mono font-semibold ${
                    selectedCategory === 'winner' ? 'text-black/80' : 'text-[#7A7A98]'
                  }`}>
                    {stats.awardWinnersCount} نفر
                  </div>
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* Actors Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B5CF6]" />
              <span>لیست هنرمندان ({filteredActors.length} نفر)</span>
            </h2>
            <span className="text-xs text-[#A0A0B5]">
              روی هر کارت برای مشاهده فیلم‌های موجود در سایت کلیک کنید
            </span>
          </div>

          {filteredActors.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginatedActors.map((actor) => (
                  <div
                    key={actor.id}
                    id={`actor-card-${actor.id}`}
                    onClick={() => setSelectedActor(actor)}
                    className="group relative bg-[#141422] border border-[#242438] hover:border-[#8B5CF6] rounded-3xl p-4 flex flex-col items-center text-center transition-all duration-200 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-950/20"
                  >
                    {/* Top Badge: Site Movies Count */}
                    {actor.siteMovieCount > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
                          <Film className="w-2.5 h-2.5" />
                          <span>{actor.siteMovieCount} اثر در سایت</span>
                        </span>
                      </div>
                    )}

                    {/* Awards indicator */}
                    {actor.awards && actor.awards.length > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="p-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 inline-block shadow-md" title="دارای جوایز معتبر">
                          <Trophy className="w-3 h-3" />
                        </span>
                      </div>
                    )}

                    {/* Avatar Portrait */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3.5 bg-[#1C1C2E] border-2 border-[#32324C] group-hover:border-[#8B5CF6] transition-colors shadow-lg mt-2">
                      <ActorAvatar
                        name={actor.name}
                        englishName={actor.english_name}
                        photo={actor.photo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Identification */}
                    <h3 className="font-bold text-sm text-white group-hover:text-[#8B5CF6] transition-colors line-clamp-1">
                      {actor.name}
                    </h3>

                    {/* Role or Job */}
                    <span className="text-[11px] text-[#A0A0B5] line-clamp-1 mt-1 bg-[#1C1C2E] px-2.5 py-0.5 rounded-lg border border-[#2E2E48]">
                      {actor.job || actor.character || 'بازیگر'}
                    </span>

                    {/* Admin Edit Shortcut Button on Card */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActorToEdit(actor);
                          setIsAddEditModalOpen(true);
                        }}
                        className="mt-2 w-full py-1 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all z-20"
                        title="ویرایش بیوگرافی و مشخصات هنرمند (مخصوص ادمین)"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>ویرایش بیوگرافی ادمین</span>
                      </button>
                    )}

                    {/* Site Movies preview badges */}
                    {actor.siteMovieCount > 0 ? (
                      <div className="mt-3 pt-2.5 border-t border-[#222238] w-full text-right">
                        <span className="text-[10px] text-[#00D4FF] font-bold block mb-1">
                          آثار موجود در سایت:
                        </span>
                        <div className="space-y-0.5">
                          {actor.siteMovies.slice(0, 2).map((sm, idx) => (
                            <div key={idx} className="text-[10px] text-[#D1D1DF] truncate flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[#00D4FF] shrink-0" />
                              <span className="truncate">{sm.movie.title}</span>
                            </div>
                          ))}
                          {actor.siteMovieCount > 2 && (
                            <span className="text-[9px] text-[#8E8EA8] block mt-0.5">
                              + {actor.siteMovieCount - 2} فیلم دیگر
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-[#222238] w-full">
                        <span className="text-[10px] text-[#6A6A85] block">
                          مشاهده بیوگرافی و آثار
                        </span>
                      </div>
                    )}

                    {/* Action Link Footer */}
                    <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-[#8B5CF6] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>مشاهده پرونده</span>
                      <ChevronLeft className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-[#2A2A40]" dir="ltr">
                  <button
                    onClick={() => handlePageChange(validPage - 1)}
                    disabled={validPage === 1}
                    className="px-4 py-2 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-sm text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    قبلی
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
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
                            validPage === item
                              ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 border border-[#8B5CF6]'
                              : 'bg-[#1C1C2E] border border-[#2A2A40] text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6]/50'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    ))}

                  <button
                    onClick={() => handlePageChange(validPage + 1)}
                    disabled={validPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-sm text-[#A0A0B5] hover:text-white hover:border-[#8B5CF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    بعدی
                  </button>
                </div>
              )}

              <div className="text-center mt-3 text-xs text-[#6A6A85]">
                صفحه {validPage} از {totalPages} (نمایش {ACTORS_PAGE_SIZE} هنرمند در هر صفحه)
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-[#141420] rounded-3xl border border-[#2A2A40] space-y-3">
              <Users className="w-12 h-12 text-[#5A5A72] mx-auto" />
              <h3 className="text-base font-bold text-white">هنرمندی با مشخصات وارد شده یافت نشد</h3>
              <p className="text-xs text-[#8A8AA5]">عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.</p>
            </div>
          )}
        </div>

        {/* Detailed Actor Dossier Modal when clicked */}
        {selectedActor && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedActor(null);
            }}
            dir="rtl"
          >
            <div 
              id="actor-full-dossier-modal"
              className="relative w-full max-w-3xl bg-[#161626] border border-[#2F2F48] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Header Ambient Glow */}
              <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#8B5CF6]/25 via-[#3B82F6]/10 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button
                id="close-actor-dossier-button"
                onClick={() => setSelectedActor(null)}
                aria-label="بستن پنجره"
                className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-[#10101C]/80 text-[#A0A0B5] hover:text-white hover:bg-[#252538] border border-[#2F2F48] transition-all cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Top Bar */}
              <div className="relative z-10 p-6 sm:p-7 pb-4 border-b border-[#26263D] bg-[#121220]/70 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-right">
                  
                  {/* Avatar Portrait */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#1C1C2E] border-2 border-[#3F3F60] shadow-2xl">
                      <ActorAvatar
                        name={selectedActor.name}
                        englishName={selectedActor.english_name}
                        photo={selectedActor.photo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedActor.awards && selectedActor.awards.length > 0 && (
                      <span 
                        title="هنرمند برنده جوایز معتبر سینمایی" 
                        className="absolute -bottom-2 -left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black p-2 rounded-full shadow-lg border-2 border-[#161626]"
                      >
                        <Trophy className="w-4 h-4 fill-black" />
                      </span>
                    )}
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {selectedActor.name}
                      </h2>
                      {selectedActor.nationality && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40">
                          <Globe className="w-3.5 h-3.5" />
                          <span>{selectedActor.nationality}</span>
                        </span>
                      )}
                    </div>

                    {/* Roles & Site Movies Badge */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                      {selectedActor.siteMovieCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D4FF] bg-[#00D4FF]/15 border border-[#00D4FF]/40 px-3 py-1 rounded-xl shadow-sm">
                          <Film className="w-3.5 h-3.5" />
                          <span>{selectedActor.siteMovieCount} اثر در سایت ما</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#A0A0B5] bg-[#1F1F35] px-2.5 py-1 rounded-xl">
                          هنرمند سینما
                        </span>
                      )}

                      {selectedActor.job && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-3 py-1 rounded-xl">
                          <Clapperboard className="w-3.5 h-3.5" />
                          <span>{selectedActor.job}</span>
                        </span>
                      )}

                      {selectedActor.character && (
                        <span className="text-xs text-[#D1D1DF] bg-[#1F1F35] border border-[#2F2F48] px-2.5 py-1 rounded-xl">
                          نقش شاخص: {selectedActor.character}
                        </span>
                      )}
                    </div>

                    {/* Birth info */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-[#A0A0B5]">
                      {selectedActor.birth_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                          <span>متولد: {selectedActor.birth_date}</span>
                        </span>
                      )}
                      {selectedActor.birth_place && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#EC4899]" />
                          <span>زادگاه: {selectedActor.birth_place}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body with Multi-Section Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">

                {/* 🌟 SECTION 1: BIOGRAPHY & BACKGROUND (نمایش اول برای خواندن بیوگرافی) */}
                <div className="bg-[#1C1C2E] border border-[#2E2E48] rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#282840] pb-2">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                    <span>زندگی‌نامه و مسیر حرفه‌ای</span>
                    {selectedActor.english_name && (
                      <span className="mr-auto text-[11px] font-mono text-[#8B8BA0] bg-[#1F1F35] px-2 py-0.5 rounded border border-[#2F2F48]">
                        {selectedActor.english_name}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed text-justify whitespace-pre-line">
                    {selectedActor.biography}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تأیید شده و بازخوانی فارسی</span>
                  </div>
                </div>

                {/* 🏆 SECTION 2: AWARDS & HONORS */}
                {selectedActor.awards && selectedActor.awards.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>جوایز و افتخارات رسمی ({selectedActor.awards.length} جایزه)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedActor.awards.map((award, i) => {
                        // Support both DB formats: {name, note} and {title, year, category, movie_name, is_winner}
                        const title = award.title || award.name || 'جایزه';
                        const cat = award.category || award.note || '';
                        const yr = award.year || '';
                        const mv = award.movie_name || '';
                        // If no detail text exists, show a clean persian description of the award name
                        const detail = cat || (yr || mv ? '' : title);
                        return (
                        <div 
                          key={i} 
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1C1C2E] border border-[#2E2E48] text-xs text-[#D1D1DF]"
                        >
                          <div className={`p-1.5 rounded-lg mt-0.5 ${award.is_winner ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-white truncate">{title}</span>
                              {award.is_winner && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  برنده
                                </span>
                              )}
                            </div>
                            {cat && (
                              <span className="text-[10px] text-[#A0A0B5] block truncate mt-0.5">{cat}</span>
                            )}
                            {!cat && detail && (
                              <span className="text-[10px] text-[#A0A0B5] block truncate mt-0.5">{detail}</span>
                            )}
                            <span className="text-[10px] text-[#7E7E98] block mt-0.5">{yr} {mv ? `• ${mv}` : ''}</span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 🎬 SECTION 3: OTHER FAMOUS INTERNATIONAL WORKS */}
                {selectedActor.known_for && selectedActor.known_for.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-[#A78BFA]" />
                      <span>سایر آثار و فیلم‌شناسی شاخص بین‌المللی</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedActor.known_for.map((work, idx) => (
                        <div key={idx} className="bg-[#1C1C2E] border border-[#2E2E48] rounded-xl p-2.5 text-right">
                          <h5 className="font-bold text-xs text-white truncate">{work.title}</h5>
                          {work.role && <p className="text-[10px] text-[#00D4FF] truncate mt-0.5">نقش: {work.role}</p>}
                          {work.year && <span className="text-[9px] text-[#8E8EA8] block mt-0.5">سال: {work.year}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🔥 SECTION 4 (FINAL SECTION): FILMS & SERIES ON SITE WITH CATEGORIZATION */}
                {(() => {
                  const siteList = selectedActor.siteMovies || [];
                  const moviesOnly = siteList.filter(({ movie }) => !isSeriesItem(movie) && movie.category !== 'children' && !movie.genre?.includes('انیمیشن'));
                  const seriesOnly = siteList.filter(({ movie }) => isSeriesItem(movie) && movie.category !== 'children_series' && !movie.genre?.includes('انیمیشن'));
                  const kidsOnly = siteList.filter(({ movie }) => movie.category === 'children' || movie.category === 'children_series' || movie.genre?.includes('انیمیشن') || movie.genre?.includes('کودک'));

                  const displayedWorks = dossierSiteFilter === 'movies'
                    ? moviesOnly
                    : dossierSiteFilter === 'series'
                    ? seriesOnly
                    : dossierSiteFilter === 'kids'
                    ? kidsOnly
                    : siteList;

                  return (
                    <div className="space-y-4 pt-3 border-t border-[#282840]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Film className="w-5 h-5 text-[#00D4FF]" />
                            <span>فیلم‌ها و سریال‌های این هنرمند در سایت ({siteList.length} اثر)</span>
                          </h3>
                          <p className="text-[11px] text-[#8E8EA8] mt-0.5">
                            آثار آماده برای مشاهده، دانلود و تماشای آنلاین با کیفیت بالا
                          </p>
                        </div>

                        {siteList.length > 0 && (
                          <span className="text-xs text-[#00D4FF] font-bold bg-[#00D4FF]/10 px-3 py-1 rounded-xl border border-[#00D4FF]/25 w-fit">
                            آماده پخش و تماشا
                          </span>
                        )}
                      </div>

                      {/* 🗂️ Categories / Filter Chips for Site Works (Responsive Grid for Mobile) */}
                      {siteList.length > 0 && (
                        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 p-1.5 bg-[#121222] border border-[#2A2A44] rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setDossierSiteFilter('all')}
                            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                              dossierSiteFilter === 'all'
                                ? 'bg-[#00D4FF] text-black shadow-md shadow-[#00D4FF]/25 font-extrabold'
                                : 'text-[#A0A0BC] hover:text-white hover:bg-[#1C1C30]'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span className="truncate">همه ({siteList.length})</span>
                          </button>

                          {moviesOnly.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDossierSiteFilter('movies')}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                                dossierSiteFilter === 'movies'
                                  ? 'bg-[#10B981] text-white shadow-md shadow-emerald-500/25 font-extrabold'
                                  : 'text-[#A0A0BC] hover:text-white hover:bg-[#1C1C30]'
                              }`}
                            >
                              <Film className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="truncate">فیلم‌ها ({moviesOnly.length})</span>
                            </button>
                          )}

                          {seriesOnly.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDossierSiteFilter('series')}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                                dossierSiteFilter === 'series'
                                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/25 font-extrabold'
                                  : 'text-[#A0A0BC] hover:text-white hover:bg-[#1C1C30]'
                              }`}
                            >
                              <Tv className="w-3.5 h-3.5 text-purple-400" />
                              <span className="truncate">سریال‌ها ({seriesOnly.length})</span>
                            </button>
                          )}

                          {kidsOnly.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDossierSiteFilter('kids')}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                                dossierSiteFilter === 'kids'
                                  ? 'bg-[#EC4899] text-white shadow-md shadow-pink-500/25 font-extrabold'
                                  : 'text-[#A0A0BC] hover:text-white hover:bg-[#1C1C30]'
                              }`}
                            >
                              <span>🧸</span>
                              <span className="truncate">کودک ({kidsOnly.length})</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Display Works Grid */}
                      {displayedWorks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {displayedWorks.map(({ movie, character, role }, idx) => {
                            const isSeries = isSeriesItem(movie);
                            const isChild = movie.category === 'children' || movie.category === 'children_series' || movie.genre?.includes('انیمیشن');

                            return (
                              <div
                                key={idx}
                                className="bg-[#1C1C2E] border border-[#2E2E48] hover:border-[#00D4FF] rounded-2xl p-3 flex gap-3.5 transition-all group hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                {/* Movie Poster */}
                                <div 
                                  onClick={() => {
                                    onMovieClick(movie);
                                    setSelectedActor(null);
                                  }}
                                  className="relative w-16 h-24 rounded-xl overflow-hidden bg-[#141420] border border-[#3A3A55] shrink-0 cursor-pointer"
                                >
                                  <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Play className="w-5 h-5 text-white fill-white" />
                                  </div>

                                  {/* Type Tag Badge */}
                                  <span className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-md ${
                                    isChild 
                                      ? 'bg-pink-600 text-white' 
                                      : isSeries 
                                      ? 'bg-purple-600 text-white' 
                                      : 'bg-emerald-600 text-white'
                                  }`}>
                                    {isChild ? 'کودک' : isSeries ? 'سریال' : 'فیلم'}
                                  </span>
                                </div>

                                {/* Movie Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <h4 
                                        onClick={() => {
                                          onMovieClick(movie);
                                          setSelectedActor(null);
                                        }}
                                        className="font-bold text-sm text-white group-hover:text-[#00D4FF] transition-colors truncate cursor-pointer"
                                      >
                                        {movie.title}
                                      </h4>
                                      {movie.rating && (
                                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 shrink-0">
                                          <Star className="w-3 h-3 fill-amber-400" />
                                          <span>{movie.rating}</span>
                                        </span>
                                      )}
                                    </div>

                                    {movie.english_title && (
                                      <span className="text-[10px] text-[#7E7E98] block truncate font-sans" dir="ltr">
                                        {movie.english_title}
                                      </span>
                                    )}

                                    {/* Character / Role in this specific movie */}
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10.5px] text-[#00D4FF] font-semibold block truncate bg-[#00D4FF]/10 px-2 py-0.5 rounded-md border border-[#00D4FF]/20">
                                        {formatActorRoleLabel(role, character)}
                                      </span>
                                      {movie.year && (
                                        <span className="text-[10px] text-[#8E8EA8] bg-[#141424] px-1.5 py-0.5 rounded border border-[#2E2E48]">
                                          {movie.year}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#282840]">
                                    <button
                                      onClick={() => {
                                        onMovieClick(movie);
                                        setSelectedActor(null);
                                      }}
                                      className="flex-1 py-1 px-2 rounded-lg bg-[#00D4FF] hover:bg-[#00BCE6] text-black text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-black" />
                                      <span>مشاهده اثر</span>
                                    </button>

                                    {onTrailerClick && (
                                      <button
                                        onClick={() => onTrailerClick(movie)}
                                        title="پخش تریلر / تیزر"
                                        className="p-1 rounded-lg bg-[#141424] hover:bg-[#25253C] text-[#A0A0B5] hover:text-white border border-[#2E2E48] transition-colors"
                                      >
                                        <Clapperboard className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {onToggleFavorite && (
                                      <button
                                        onClick={() => onToggleFavorite(movie.message_id)}
                                        title="علاقه‌مندی"
                                        className={`p-1 rounded-lg border transition-colors ${
                                          movie.is_favorite 
                                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                                            : 'bg-[#141424] border-[#2E2E48] text-[#A0A0B5] hover:text-white'
                                        }`}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${movie.is_favorite ? 'fill-current' : ''}`} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-[#1C1C2E] border border-[#2E2E48] rounded-2xl p-5 text-center space-y-2">
                          <Film className="w-7 h-7 text-[#5A5A72] mx-auto" />
                          <p className="text-xs text-[#A0A0B5]">
                            {siteList.length > 0 
                              ? 'اثری در این فیلتر دسته‌بندی یافت نشد.' 
                              : 'در حال حاضر اثر مستقیمی از این هنرمند در آرشیو اضافه نشده است. با جستجو یا درخواست مدیریت به زودی بارگذاری خواهد شد.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-[#26263D] bg-[#10101C] flex items-center justify-between text-xs text-[#A0A0B5]">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActorToEdit(selectedActor);
                      setIsAddEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ویرایش بیوگرافی و مشخصات (توسط ادمین)</span>
                  </button>
                ) : (
                  <span>مرور کامل پرونده بازیگران و سازندگان سینما</span>
                )}
                
                <button
                  onClick={() => setSelectedActor(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1F1F35] hover:bg-[#2A2A48] border border-[#353550] transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Admin Add / Edit Actor Modal */}
        <AddEditActorModal
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setActorToEdit(null);
          }}
          actorToEdit={actorToEdit}
          onSuccess={(savedActor) => {
            setRefreshKey(prev => prev + 1);
            if (selectedActor && selectedActor.name.toLowerCase() === savedActor.name.toLowerCase()) {
              setSelectedActor(prev => prev ? {
                ...prev,
                ...savedActor,
                awards: savedActor.awards?.map(a => ({
                  title: a.title,
                  category: a.category,
                  year: a.year,
                  is_winner: a.is_winner,
                  movie_name: a.movie_name
                }))
              } : null);
            }
          }}
        />

      </div>
    </div>
  );
};

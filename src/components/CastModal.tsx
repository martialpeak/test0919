import React, { useState, useEffect, useMemo } from 'react';
import { CastMember, Movie } from '../types';
import { ActorAvatar } from './ActorAvatar';
import { MovieService } from '../services/api';
import { getSiteMoviesForActor, formatActorRoleLabel } from '../utils/actorHelper';
import { isSeriesItem } from '../data/categories';
import { 
  X, 
  Film, 
  Trophy, 
  Award, 
  Calendar, 
  MapPin, 
  Clapperboard, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Globe, 
  Languages,
  Star,
  Tv,
  Layers
} from 'lucide-react';
import { apiFetch } from '../services/apiFetch';

interface CastModalProps {
  member: CastMember | null;
  onClose: () => void;
  onSelectMovieTitle?: (title: string) => void;
  onSelectMovie?: (movie: Movie) => void;
  movieTitle?: string;
  allMovies?: Movie[];
}

export const CastModal: React.FC<CastModalProps> = ({ 
  member, 
  onClose, 
  onSelectMovieTitle, 
  onSelectMovie,
  movieTitle,
  allMovies = []
}) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'site_movies' | 'filmography' | 'awards'>('bio');
  const [siteFilter, setSiteFilter] = useState<'all' | 'movies' | 'series' | 'kids'>('all');
  const [enrichedData, setEnrichedData] = useState<CastMember | null>(member);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Compute movies available in this site for this cast member
  const siteMovies = useMemo(() => {
    if (!member) return [];
    return getSiteMoviesForActor(member.name, member.english_name, allMovies);
  }, [member, allMovies]);

  // Categorized site works
  const { moviesOnly, seriesOnly, kidsOnly } = useMemo(() => {
    const moviesOnly = siteMovies.filter(({ movie }) => !isSeriesItem(movie) && movie.category !== 'children' && !movie.genre?.includes('انیمیشن'));
    const seriesOnly = siteMovies.filter(({ movie }) => isSeriesItem(movie) && movie.category !== 'children_series' && !movie.genre?.includes('انیمیشن'));
    const kidsOnly = siteMovies.filter(({ movie }) => movie.category === 'children' || movie.category === 'children_series' || movie.genre?.includes('انیمیشن') || movie.genre?.includes('کودک'));
    return { moviesOnly, seriesOnly, kidsOnly };
  }, [siteMovies]);

  const filteredSiteMovies = useMemo(() => {
    if (siteFilter === 'movies') return moviesOnly;
    if (siteFilter === 'series') return seriesOnly;
    if (siteFilter === 'kids') return kidsOnly;
    return siteMovies;
  }, [siteFilter, siteMovies, moviesOnly, seriesOnly, kidsOnly]);

  useEffect(() => {
    if (!member) {
      setEnrichedData(null);
      return;
    }

    setEnrichedData(member);
    setActiveTab('bio');
    setSiteFilter('all');

    // If biography is missing or minimal, fetch rich details in the background
    const hasFullBio = member.biography && member.biography.length > 50;
    if (!hasFullBio) {
      setIsLoadingDetails(true);
      MovieService.fetchActorDetails(member.name, member.english_name, member, movieTitle)
        .then((extra) => {
          if (extra) {
            setEnrichedData(prev => prev ? ({ ...prev, ...extra }) : member);
          }
          setIsLoadingDetails(false);
        })
        .catch(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [member, movieTitle, siteMovies.length]);

  if (!member || !enrichedData) return null;

  const currentMember = enrichedData;
  const hasAwards = currentMember.awards && currentMember.awards.length > 0;
  const hasFilmography = currentMember.known_for && currentMember.known_for.length > 0;

  const handleManualSync = async () => {
    setIsLoadingDetails(true);
    try {
      const extra = await MovieService.fetchActorDetails(member.name, member.english_name, member, movieTitle);
      if (extra) {
        setEnrichedData(prev => prev ? ({ ...prev, ...extra }) : member);
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSmartTranslate = async () => {
    if (!currentMember.biography) return;
    setIsTranslating(true);
    try {
      const res = await apiFetch('/api/actors/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentMember.biography,
          name: currentMember.name,
          english_name: currentMember.english_name,
          role: currentMember.character || currentMember.job
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.translated_text) {
          setEnrichedData(prev => prev ? ({ ...prev, biography: data.translated_text }) : null);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div 
        id="cast-detail-modal"
        className="relative w-full max-w-2xl bg-[#181828] border border-[#2F2F48] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#8B5CF6]/20 via-[#3B82F6]/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-cast-modal-button"
          onClick={onClose}
          aria-label="بستن پنجره"
          className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-[#10101C]/80 text-[#A0A0B5] hover:text-white hover:bg-[#252538] border border-[#2F2F48] transition-all cursor-pointer shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Profile Summary Card */}
        <div className="relative z-10 p-6 sm:p-7 pb-4 border-b border-[#2A2A40] bg-[#141424]/60 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-right">
            
            {/* Avatar Photo */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#1C1C2E] border-2 border-[#3F3F60] shadow-xl">
                <ActorAvatar
                  name={currentMember.name}
                  englishName={currentMember.english_name}
                  photo={currentMember.photo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {hasAwards && (
                <span 
                  title="هنرمند برنده جوایز معتبر بین‌المللی" 
                  className="absolute -bottom-2 -left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black p-1.5 rounded-full shadow-lg border-2 border-[#181828]"
                >
                  <Trophy className="w-3.5 h-3.5 fill-black" />
                </span>
              )}
            </div>

            {/* Main Identification */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentMember.name}
                </h3>
                {currentMember.nationality && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                    <Globe className="w-3 h-3" />
                    <span>{currentMember.nationality}</span>
                  </span>
                )}
              </div>

              {/* Role and Character info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                {siteMovies.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00D4FF] bg-[#00D4FF]/15 border border-[#00D4FF]/40 px-2.5 py-0.5 rounded-xl">
                    <Film className="w-3.5 h-3.5" />
                    <span>{siteMovies.length} اثر در سایت</span>
                  </span>
                )}

                {currentMember.character && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-3 py-1 rounded-xl">
                    <Film className="w-3.5 h-3.5" />
                    <span>نقش: {currentMember.character}</span>
                  </span>
                )}

                {currentMember.job && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-3 py-1 rounded-xl">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>{currentMember.job}</span>
                  </span>
                )}

                <button
                  onClick={handleManualSync}
                  disabled={isLoadingDetails}
                  title="واکشی زنده اطلاعات از ویکی‌پدیا و دیتابیس آنلاین"
                  className="inline-flex items-center gap-1 text-[11px] text-[#A0A0B5] hover:text-white bg-[#1F1F35] hover:bg-[#2A2A48] border border-[#353550] px-2.5 py-1 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDetails ? 'animate-spin text-purple-400' : ''}`} />
                  <span>{isLoadingDetails ? 'در حال دریافت...' : 'استعلام آنلاین'}</span>
                </button>
              </div>

              {/* Meta details (Birth date & place) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-[#A0A0B5]">
                {currentMember.birth_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                    <span>متولد: {currentMember.birth_date}</span>
                  </span>
                )}
                {currentMember.birth_place && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#EC4899]" />
                    <span>زادگاه: {currentMember.birth_place}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-[#25253C] overflow-x-auto scrollbar-none pb-1">
            <button
              id="cast-tab-bio"
              onClick={() => setActiveTab('bio')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'bio'
                  ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 font-extrabold'
                  : 'bg-[#1F1F35] text-[#A0A0B5] hover:text-white hover:bg-[#282845]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>بیوگرافی و زندگی‌نامه</span>
            </button>

            {siteMovies.length > 0 && (
              <button
                id="cast-tab-site-movies"
                onClick={() => setActiveTab('site_movies')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'site_movies'
                    ? 'bg-[#00D4FF] text-black shadow-lg shadow-[#00D4FF]/30 font-extrabold'
                    : 'bg-[#1F1F35] text-[#00D4FF] hover:text-white hover:bg-[#282845] border border-[#00D4FF]/30'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>فیلم‌ها و سریال‌های در سایت ({siteMovies.length})</span>
              </button>
            )}

            <button
              id="cast-tab-filmography"
              onClick={() => setActiveTab('filmography')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'filmography'
                  ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30 font-extrabold'
                  : 'bg-[#1F1F35] text-[#A0A0B5] hover:text-white hover:bg-[#282845]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>سایر آثار بین‌المللی {hasFilmography ? `(${currentMember.known_for?.length})` : ''}</span>
            </button>

            <button
              id="cast-tab-awards"
              onClick={() => setActiveTab('awards')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'awards'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30 font-extrabold'
                  : 'bg-[#1F1F35] text-[#A0A0B5] hover:text-white hover:bg-[#282845]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>جوایز و افتخارات {hasAwards ? `(${currentMember.awards?.length})` : ''}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-4">
          
          {/* TAB 0: Site Movies with Categorization */}
          {activeTab === 'site_movies' && (
            <div className="space-y-4 animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#00D4FF]" />
                    <span>فیلم‌ها و سریال‌های موجود از این هنرمند در سایت ({siteMovies.length} اثر)</span>
                  </h4>
                  <p className="text-[11px] text-[#8E8EA8] mt-0.5">آماده پخش، تماشا و دسته‌بندی شده بر اساس نوع محتوا</p>
                </div>
                <span className="text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded-lg border border-[#00D4FF]/20 w-fit">
                  برای تماشا کلیک کنید
                </span>
              </div>

              {/* Categorization Filter Bar (Responsive Grid for Mobile) */}
              {siteMovies.length > 0 && (
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 p-1.5 bg-[#121222] border border-[#2A2A44] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSiteFilter('all')}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      siteFilter === 'all'
                        ? 'bg-[#00D4FF] text-black shadow-md shadow-[#00D4FF]/25 font-extrabold'
                        : 'text-[#A0A0BC] hover:text-white hover:bg-[#1C1C30]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="truncate">همه ({siteMovies.length})</span>
                  </button>

                  {moviesOnly.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSiteFilter('movies')}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                        siteFilter === 'movies'
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
                      onClick={() => setSiteFilter('series')}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                        siteFilter === 'series'
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
                      onClick={() => setSiteFilter('kids')}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                        siteFilter === 'kids'
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

              {filteredSiteMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredSiteMovies.map(({ movie, character, role }, idx) => {
                    const isSeries = isSeriesItem(movie);
                    const isChild = movie.category === 'children' || movie.category === 'children_series' || movie.genre?.includes('انیمیشن');

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (onSelectMovie) {
                            onSelectMovie(movie);
                            onClose();
                          } else if (onSelectMovieTitle) {
                            onSelectMovieTitle(movie.title);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C1C2E] border border-[#2A2A40] hover:border-[#00D4FF] hover:bg-[#222238] transition-all group cursor-pointer"
                      >
                        <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[#141420] border border-[#3A3A55] shrink-0">
                          {movie.poster_url ? (
                            <img
                              src={movie.poster_url}
                              alt={movie.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#5A5A72]">
                              <Film className="w-6 h-6" />
                            </div>
                          )}
                          <span className={`absolute top-1 right-1 text-[8px] font-bold px-1 py-0.2 rounded ${
                            isChild ? 'bg-pink-600 text-white' : isSeries ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            {isChild ? 'کودک' : isSeries ? 'سریال' : 'فیلم'}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00D4FF] transition-colors truncate">
                              {movie.title}
                            </h5>
                            {movie.rating && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 shrink-0">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{movie.rating}</span>
                              </span>
                            )}
                          </div>

                          {movie.english_title && (
                            <span className="text-[10px] text-[#7E7E98] truncate block font-sans" dir="ltr">
                              {movie.english_title}
                            </span>
                          )}

                          <span className="text-[10px] text-[#00D4FF] font-semibold block truncate mt-1 bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/20 w-fit">
                            {formatActorRoleLabel(role, character)}
                          </span>

                          <div className="flex items-center gap-2 text-[10px] text-[#8E8EA8] mt-1.5">
                            {movie.year && <span>سال: {movie.year}</span>}
                            {movie.genre && <span>• {movie.genre.split(/[,،]/)[0]}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-6 text-center space-y-2">
                  <Film className="w-8 h-8 text-[#5A5A72] mx-auto" />
                  <p className="text-sm font-bold text-white">آثار در سایت</p>
                  <p className="text-xs text-[#8A8AA5]">اثری در این فیلتر دسته‌بندی یافت نشد.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Biography */}
          {activeTab === 'bio' && (
            <div className="space-y-5 animate-fade-in text-right">
              {/* Main Biography Text */}
              <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#25253C]">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                    <span>درباره و مسیر حرفه‌ای {currentMember.name}</span>
                    {currentMember.english_name && (
                      <span className="text-[11px] font-mono text-[#8B8BA0] bg-[#1F1F35] px-2 py-0.5 rounded border border-[#2F2F48]">
                        {currentMember.english_name}
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSmartTranslate}
                      disabled={isTranslating || !currentMember.biography}
                      title="ترجمه و نگارش هوشمند بیوگرافی به زبان فارسی"
                      className="text-[11px] text-[#A78BFA] hover:text-white bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/40 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Languages className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'در حال ترجمه...' : 'ترجمه هوشمند فارسی'}</span>
                    </button>
                    {currentMember.wikipedia_url && (
                      <a
                        href={currentMember.wikipedia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1 hover:underline bg-[#1F1F35] px-2.5 py-1 rounded-lg border border-[#353550]"
                      >
                        <span>ویکی‌پدیا</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {isLoadingDetails ? (
                  <div className="py-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                    <p className="text-xs text-[#A0A0B5]">در حال دریافت زندگی‌نامه و اطلاعات بیوگرافی به زبان فارسی...</p>
                  </div>
                ) : currentMember.biography ? (
                  <div className="space-y-3">
                    <p className="text-sm sm:text-[15px] text-[#E2E8F0] leading-relaxed text-justify whitespace-pre-line">
                      {currentMember.biography}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>نگارش و بازخوانی شده به زبان فارسی</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#7A7A95] italic">
                    بیوگرافی تکمیلی برای این هنرمند به زودی ثبت خواهد شد.
                  </p>
                )}
              </div>

              {/* Quick awards preview if present and on bio tab */}
              {hasAwards && (
                <div className="bg-[#1C1C2E]/60 border border-[#2A2A40] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>افتخارات و جوایز برجسته</span>
                    </h5>
                    <button
                      onClick={() => setActiveTab('awards')}
                      className="text-[11px] text-[#8B5CF6] hover:underline cursor-pointer"
                    >
                      مشاهده همه جوایز ←
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentMember.awards?.slice(0, 4).map((award, i) => {
                      const title = award.title || award.name || 'جایزه';
                      const yr = award.year || '';
                      const mv = award.movie_name || '';
                      const detail = award.category || award.note || (yr || mv ? '' : title);
                      return (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#141424] border border-[#2A2A40] text-xs text-[#D1D1DF]"
                      >
                        <Award className={`w-4 h-4 shrink-0 ${award.is_winner ? 'text-amber-400' : 'text-slate-400'}`} />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block truncate text-white">{title}</span>
                          <span className="text-[10px] text-[#8A8AA5]">{detail} {yr ? `• ${yr}` : ''} {mv ? `• ${mv}` : ''}</span>
                        </div>
                        {award.is_winner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            برنده
                          </span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🔥 FILMS & SERIES DISPLAYED AT THE END OF THE BIOGRAPHY SECTION */}
              {siteMovies.length > 0 && (
                <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Film className="w-4 h-4 text-[#00D4FF]" />
                        <span>فیلم‌ها و سریال‌های این هنرمند در سایت ما ({siteMovies.length} اثر)</span>
                      </h4>
                      <p className="text-[11px] text-[#8E8EA8] mt-0.5">آثار آماده برای مشاهده آنلاین و دانلود مستقیم</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('site_movies')}
                      className="text-xs text-[#00D4FF] hover:underline font-bold"
                    >
                      مشاهده تمام آثار و فیلترها ←
                    </button>
                  </div>

                  {/* Categorized Chips (Responsive Grid for Mobile) */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 p-1.5 bg-[#121222] border border-[#2A2A44] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSiteFilter('all')}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-center ${
                        siteFilter === 'all' ? 'bg-[#00D4FF] text-black font-extrabold' : 'text-[#A0A0BC] hover:text-white'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span className="truncate">همه ({siteMovies.length})</span>
                    </button>
                    {moviesOnly.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSiteFilter('movies')}
                        className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-center ${
                          siteFilter === 'movies' ? 'bg-[#10B981] text-white font-extrabold' : 'text-[#A0A0BC] hover:text-white'
                        }`}
                      >
                        <Film className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">فیلم‌ها ({moviesOnly.length})</span>
                      </button>
                    )}
                    {seriesOnly.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSiteFilter('series')}
                        className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-center ${
                          siteFilter === 'series' ? 'bg-[#8B5CF6] text-white font-extrabold' : 'text-[#A0A0BC] hover:text-white'
                        }`}
                      >
                        <Tv className="w-3 h-3 text-purple-400" />
                        <span className="truncate">سریال‌ها ({seriesOnly.length})</span>
                      </button>
                    )}
                    {kidsOnly.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSiteFilter('kids')}
                        className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-center ${
                          siteFilter === 'kids' ? 'bg-[#EC4899] text-white font-extrabold' : 'text-[#A0A0BC] hover:text-white'
                        }`}
                      >
                        <span>🧸</span>
                        <span className="truncate">کودک ({kidsOnly.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredSiteMovies.slice(0, 6).map(({ movie, character, role }, idx) => {
                      const isSeries = isSeriesItem(movie);
                      const isChild = movie.category === 'children' || movie.category === 'children_series' || movie.genre?.includes('انیمیشن');

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (onSelectMovie) {
                              onSelectMovie(movie);
                              onClose();
                            } else if (onSelectMovieTitle) {
                              onSelectMovieTitle(movie.title);
                              onClose();
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141424] border border-[#2A2A40] hover:border-[#00D4FF] transition-all group cursor-pointer"
                        >
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[#10101C] shrink-0 border border-[#3A3A55]">
                            {movie.poster_url ? (
                              <img src={movie.poster_url} alt={movie.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Film className="w-5 h-5 text-[#5A5A72] m-auto mt-5" />
                            )}
                            <span className={`absolute top-0.5 right-0.5 text-[7.5px] font-bold px-1 py-0.2 rounded ${
                              isChild ? 'bg-pink-600 text-white' : isSeries ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                            }`}>
                              {isChild ? 'کودک' : isSeries ? 'سریال' : 'فیلم'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-white group-hover:text-[#00D4FF] truncate">{movie.title}</h5>
                            <span className="text-[9.5px] text-[#00D4FF] block truncate mt-0.5">
                              {formatActorRoleLabel(role, character)}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-[#8E8EA8] mt-1">
                              {movie.year && <span>سال: {movie.year}</span>}
                              {movie.rating && <span className="text-amber-400">★ {movie.rating}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Filmography */}
          {activeTab === 'filmography' && (
            <div className="space-y-4 animate-fade-in text-right">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Film className="w-4 h-4 text-[#00D4FF]" />
                <span>سایر فیلم‌ها و آثار شاخص بین‌المللی</span>
              </h4>

              {hasFilmography ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentMember.known_for?.map((work, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (onSelectMovieTitle) {
                          onSelectMovieTitle(work.title);
                          onClose();
                        }
                      }}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl bg-[#1C1C2E] border border-[#2A2A40] transition-all group ${
                        onSelectMovieTitle ? 'cursor-pointer hover:border-[#8B5CF6] hover:bg-[#222238]' : ''
                      }`}
                    >
                      {work.poster ? (
                        <img
                          src={work.poster}
                          alt={work.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-16 rounded-xl object-cover border border-[#3A3A55] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-xl bg-[#141420] border border-[#3A3A55] flex items-center justify-center text-[#5A5A72] shrink-0">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                          {work.title}
                        </h5>
                        {work.role && (
                          <p className="text-[11px] text-[#00D4FF] truncate mt-0.5">
                            نقش: {work.role}
                          </p>
                        )}
                        {work.year && (
                          <span className="text-[10px] text-[#8A8AA5] mt-1 inline-block bg-[#141424] px-2 py-0.5 rounded border border-[#2A2A40]">
                            سال انتشار: {work.year}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-6 text-center space-y-2">
                  <Film className="w-8 h-8 text-[#5A5A72] mx-auto" />
                  <p className="text-sm font-bold text-white">{movieTitle ? `اثر ثبت‌شده: «${movieTitle}»` : 'آثار شاخص'}</p>
                  <p className="text-xs text-[#8A8AA5]">
                    این هنرمند در اثر حاضر ایفای نقش داشته و فیلم‌شناسی تفصیلی با استعلام آنلاین تکمیل می‌گردد.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Awards */}
          {activeTab === 'awards' && (
            <div className="space-y-4 animate-fade-in text-right">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>لیست جوایز رسمی و نامزدی‌های معتبر</span>
                </h4>
                {hasAwards && (
                  <span className="text-xs text-amber-400/90 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                    {currentMember.awards?.filter(a => a.is_winner).length} جایزه برنده شده
                  </span>
                )}
              </div>

              {hasAwards ? (
                <div className="space-y-2.5">
                  {currentMember.awards?.map((award, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                        award.is_winner
                          ? 'bg-gradient-to-r from-amber-500/10 via-[#1C1C2E] to-[#1C1C2E] border-amber-500/30'
                          : 'bg-[#1C1C2E] border-[#2A2A40]'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        award.is_winner 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                          : 'bg-[#141424] text-slate-400 border border-[#2A2A40]'
                      }`}>
                        <Trophy className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                            {award.title}
                          </h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            award.is_winner
                              ? 'bg-amber-500 text-black'
                              : 'bg-[#2A2A40] text-[#A0A0B5]'
                          }`}>
                            {award.is_winner ? 'برنده (Winner)' : 'نامزد (Nominee)'}
                          </span>
                        </div>

                        {award.category && (
                          <p className="text-xs text-[#A0A0B5] mt-0.5">
                            شاخه: {award.category}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#8A8AA5] mt-1.5">
                          <span>سال: {award.year}</span>
                          {award.movie_name && (
                            <span>برای اثر: <strong className="text-white">{award.movie_name}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-2xl p-6 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-[#5A5A72] mx-auto" />
                  <p className="text-sm font-bold text-white">اطلاعات افتخارات</p>
                  <p className="text-xs text-[#8A8AA5]">
                    جوایز و افتخارات رسمی این هنرمند پس از بررسی بانک‌های سینمایی نمایش داده می‌شود.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#25253C] bg-[#121220] flex items-center justify-between text-xs text-[#A0A0B5]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>اطلاعات بیوگرافی و عوامل با پشتیبانی از چندسطحی هوشمند Fallback</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1F1F35] hover:bg-[#2A2A48] border border-[#353550] transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};

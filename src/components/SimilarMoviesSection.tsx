import React from 'react';
import { Movie } from '../types';
import { getSimilarMovies, extractStoryMotifs, extractThematicTags, StoryMotif, STORYLINE_MOTIFS } from '../services/recommendationService';
import { 
  Sparkles, 
  Film, 
  Compass, 
  Layers, 
  ArrowLeft, 
  Play, 
  Star, 
  Bot,
  BookOpen,
  SlidersHorizontal,
  Check,
  Tag
} from 'lucide-react';
import { apiFetch } from '../services/apiFetch';

interface SimilarMoviesSectionProps {
  currentMovie: Movie;
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onTrailerClick?: (movie: Movie) => void;
}

// Client-side cache for instant display across movie navigation
const clientRecommendationCache = new Map<string, any>();

export const SimilarMoviesSection: React.FC<SimilarMoviesSectionProps> = ({
  currentMovie,
  allMovies,
  onSelectMovie,
  onTrailerClick
}) => {
  const [selectedFilter, setSelectedFilter] = React.useState<string>('all');
  const cacheKey = (currentMovie.english_title || currentMovie.title || '').toLowerCase().trim();

  const [aiVibeAnalysis, setAiVibeAnalysis] = React.useState<{
    storylineVibe?: string;
    thematicTags?: string[];
    activeMotifs?: string[];
    recommendations?: Array<{
      title: string;
      englishTitle?: string;
      year?: string;
      genre?: string;
      similarityScore?: number;
      synopsis?: string;
      sharedMotifs?: string[];
      whyWatch?: string;
    }>;
  } | null>(() => clientRecommendationCache.get(cacheKey) || null);
  const [loadingAi, setLoadingAi] = React.useState<boolean>(false);

  // Extract Story Motifs present in the current movie
  const currentMotifs = React.useMemo(() => {
    return extractStoryMotifs(currentMovie);
  }, [currentMovie]);

  // All motifs available in catalog for context
  const availableMotifsList = React.useMemo(() => {
    const list: StoryMotif[] = [...currentMotifs];
    // Add extra popular motifs if current movie has few
    if (list.length < 4) {
      Object.entries(STORYLINE_MOTIFS).forEach(([key, val]) => {
        if (!list.some(m => m.id === key)) {
          list.push({
            id: key,
            name: val.name,
            icon: val.icon,
            description: val.description
          });
        }
      });
    }
    return list.slice(0, 10);
  }, [currentMotifs]);

  // Local Catalog Similar Movies
  const similarMovies = React.useMemo(() => {
    return getSimilarMovies(currentMovie, allMovies, 12, selectedFilter);
  }, [currentMovie, allMovies, selectedFilter]);

  const thematicTags = React.useMemo(() => {
    return extractThematicTags(currentMovie);
  }, [currentMovie]);

  // Fetch AI-Enhanced Storyline Vibe Analysis & Global Recommendations
  React.useEffect(() => {
    if (clientRecommendationCache.has(cacheKey)) {
      setAiVibeAnalysis(clientRecommendationCache.get(cacheKey));
      return;
    }

    let isMounted = true;
    setLoadingAi(true);

    apiFetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentMovie.title,
        englishTitle: currentMovie.english_title,
        genre: currentMovie.genre,
        description: currentMovie.description,
        director: currentMovie.director,
        actors: currentMovie.actors
      })
    })
      .then(res => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (!isMounted) return;
        if (data && data.ok && data.data && typeof data.data === 'object') {
          clientRecommendationCache.set(cacheKey, data.data);
          setAiVibeAnalysis(data.data);
        }
        setLoadingAi(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMovie, cacheKey]);

  return (
    <div id="similar-movies-section" className="bg-[#141420] border border-[#2A2A40] rounded-3xl p-4 sm:p-7 space-y-5">
      
      {/* Header with Title & Storyline Context */}
      <div className="border-b border-[#2A2A40] pb-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E50914] to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>فیلم‌های مشابه و پیشنهادی</span>
              <span className="text-[10px] sm:text-xs bg-red-500/15 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                تطبیق هوشمند داستان و ژانر
              </span>
            </h2>
            <p className="text-xs text-[#A0A0B5] mt-0.5 leading-relaxed">
              پیشنهادات دقیق بر اساس موتیف‌های روایی، عناصر محیطی، هم‌پوشانی ژانر و فضای فیلم
            </p>
          </div>
        </div>

        {/* Main Filter Tabs (Responsive Mobile Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#1C1C2E] rounded-2xl border border-[#2A2A40]">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-[#A0A0B5] hover:text-white hover:bg-[#25253A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">همه پیشنهادات</span>
          </button>

          <button
            onClick={() => setSelectedFilter('story')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              selectedFilter === 'story'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-[#A0A0B5] hover:text-white hover:bg-[#25253A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">داستان و پیرنگ</span>
          </button>

          <button
            onClick={() => setSelectedFilter('genre')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              selectedFilter === 'genre'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-[#A0A0B5] hover:text-white hover:bg-[#25253A]'
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">هم‌ژانر</span>
          </button>

          <button
            onClick={() => {
              if (currentMotifs.length > 0) {
                setSelectedFilter(currentMotifs[0].id);
              } else {
                setSelectedFilter('story');
              }
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              selectedFilter !== 'all' && selectedFilter !== 'story' && selectedFilter !== 'genre'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'text-[#A0A0B5] hover:text-white hover:bg-[#25253A]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">موتیف‌های خاص</span>
          </button>
        </div>
      </div>

      {/* Story Motifs & Thematic Sub-categories Grid */}
      <div className="bg-[#181828] border border-[#2A2A40] rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" />
            <span>دسته‌بندی موتیف‌های روایی و موضوعی:</span>
          </span>
          {selectedFilter !== 'all' && (
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-[11px] text-red-400 hover:text-red-300 underline font-medium"
            >
              نمایش همه دسته‌ها
            </button>
          )}
        </div>

        {/* Responsive Motif Chips */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {availableMotifsList.map((motif: StoryMotif) => {
            const isSelected = selectedFilter === motif.id;
            const isPresentInCurrent = currentMotifs.some(m => m.id === motif.id);

            return (
              <button
                key={motif.id}
                onClick={() => setSelectedFilter(isSelected ? 'all' : motif.id)}
                className={`flex items-center justify-between gap-1.5 p-2 rounded-xl text-xs font-medium border transition-all text-right ${
                  isSelected
                    ? 'bg-red-500/25 border-red-500 text-white shadow-sm ring-1 ring-red-400/50'
                    : isPresentInCurrent
                    ? 'bg-[#1D1D30] border-purple-500/40 text-purple-200 hover:border-purple-400 hover:text-white'
                    : 'bg-[#141420] border-[#2A2A40] text-gray-300 hover:border-red-500/40 hover:text-white'
                }`}
                title={motif.description}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm shrink-0">{motif.icon}</span>
                  <span className="truncate text-[11px] font-bold">{motif.name}</span>
                </div>
                {isSelected ? (
                  <Check className="w-3 h-3 text-red-400 shrink-0" />
                ) : isPresentInCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Storyline Thematic Vibe Analysis Card */}
      {(aiVibeAnalysis?.storylineVibe || thematicTags.length > 0 || loadingAi) && (
        <div className="bg-gradient-to-r from-[#1C1C2E] via-[#1F192E] to-[#1C1C2E] border border-purple-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>تحلیل هوشمند اتمسفر داستانی اثر:</span>
                </span>
                {thematicTags.slice(0, 4).map((tag, idx) => (
                  <span key={idx} className="text-[10px] bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {aiVibeAnalysis?.storylineVibe || (
                  loadingAi 
                    ? 'الگوریتم هوش مصنوعی در حال بازخوانی المان‌های داستانی و پیدا کردن بهترین همپوشانی‌های سینمایی است...' 
                    : `فیلم «${currentMovie.title}» در ژانر ${currentMovie.genre || 'سینمایی'} با روایت چندلایه و فضاسازی داستانی منحصربه‌فرد، مخاطب را به درون جهان روایی خود می‌برد.`
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Similar Movies Catalog Cards Grid (Optimized 2-Cols for Mobile, 3-4 Cols for Desktop) */}
      {similarMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {similarMovies.map((item, index) => {
            const m = item.movie;
            const movieMotifs = extractStoryMotifs(m);

            return (
              <div
                key={m.message_id || index}
                id={`similar-movie-card-${m.message_id}`}
                onClick={() => onSelectMovie(m)}
                className="group bg-[#1C1C2E] border border-[#2A2A40] hover:border-red-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/50 cursor-pointer relative"
              >
                {/* Poster & Badges Container */}
                <div className="relative aspect-[2/3] sm:aspect-[4/3] w-full overflow-hidden bg-[#141420]">
                  <img
                    src={m.poster_url || '/placeholder.png'}
                    alt={m.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C2E] via-black/20 to-black/50" />

                  {/* Similarity Percentage Badge */}
                  <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-md border border-red-500/50 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                    <span>{item.similarityScore}٪</span>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {m.rating && (
                      <div className="bg-amber-500/95 text-black text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow">
                        <Star className="w-2.5 h-2.5 fill-black" />
                        <span>{m.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Trailer Play Button if Available */}
                  {m.trailer_url && onTrailerClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrailerClick(m);
                      }}
                      className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      title="پخش تریلر"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1.5">
                    {/* Persian & English Title */}
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1 leading-snug">
                        {m.title}
                      </h3>
                      {m.english_title && (
                        <p className="text-[10px] text-[#A0A0B5] font-mono tracking-wide line-clamp-1 mt-0.5">
                          {m.english_title}
                        </p>
                      )}
                    </div>

                    {/* Matched Story Motifs Badges */}
                    {item.matchedMotifs && item.matchedMotifs.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.matchedMotifs.slice(0, 2).map((motif, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[9px] sm:text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          >
                            <span>{motif.icon}</span>
                            <span className="truncate max-w-[80px]">{motif.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : movieMotifs.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {movieMotifs.slice(0, 2).map((motif, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[9px] sm:text-[10px] bg-[#141420] text-gray-300 border border-[#2A2A40] px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          >
                            <span>{motif.icon}</span>
                            <span className="truncate max-w-[80px]">{motif.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Match Reason Tag */}
                    <div className="bg-[#141420] border border-[#2A2A40] group-hover:border-purple-500/30 rounded-lg p-1.5 transition-colors">
                      <p className="text-[10px] text-purple-300 line-clamp-2 leading-relaxed flex items-start gap-1">
                        <span className="text-yellow-400 font-bold shrink-0 text-[9px]">✦</span>
                        <span>{item.matchReason}</span>
                      </p>
                    </div>

                    {/* Story Synopsis Section (خلاصه داستان) */}
                    {m.description && (
                      <div className="hidden sm:block bg-[#161626] border border-[#242438] rounded-lg p-2 space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>خلاصه:</span>
                        </div>
                        <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-[#2A2A40] flex items-center justify-between text-[10px] text-[#8E8EA8]">
                    <span className="truncate max-w-[65%]">
                      {m.genre || 'سینمایی'}
                    </span>
                    <span className="text-red-400 group-hover:translate-x-[-2px] transition-transform flex items-center gap-0.5 font-bold shrink-0">
                      <span>مشاهده</span>
                      <ArrowLeft className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-[#1C1C2E]/50 rounded-2xl border border-[#2A2A40]">
          <Film className="w-9 h-9 text-gray-500 mx-auto mb-2 opacity-50" />
          <p className="text-xs sm:text-sm text-gray-300 font-medium">فیلم مشابهی با فیلتر انتخابی یافت نشد</p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="mt-3 px-4 py-1.5 bg-[#2A2A40] hover:bg-[#3B3B54] text-xs text-white rounded-xl transition-colors font-bold"
          >
            مشاهده تمام پیشنهادات
          </button>
        </div>
      )}

      {/* AI & Curated Masterpieces Section with Story Synopsis */}
      {aiVibeAnalysis?.recommendations && aiVibeAnalysis.recommendations.length > 0 && (
        <div className="pt-5 border-t border-[#2A2A40] space-y-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              شاهکارهای مشابه بر اساس خط داستان و تم‌ها (پیشنهادات منتخب):
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {aiVibeAnalysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-[#1C1C2E] border border-[#2A2A40] hover:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-2.5 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">
                        {rec.title}
                        {rec.englishTitle && (
                          <span className="text-[11px] text-gray-400 font-normal mr-1.5 font-mono">
                            ({rec.englishTitle})
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-400 mt-1">
                        {rec.year && <span>سال {rec.year}</span>}
                        {rec.genre && <span>• {rec.genre}</span>}
                      </div>
                    </div>
                    {rec.similarityScore && (
                      <span className="text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        {rec.similarityScore}٪ همخوانی
                      </span>
                    )}
                  </div>

                  {/* Shared Story Motifs */}
                  {rec.sharedMotifs && rec.sharedMotifs.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {rec.sharedMotifs.map((motif, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-[9px] sm:text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 px-1.5 py-0.5 rounded"
                        >
                          {motif}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Story Synopsis (خلاصه داستان) */}
                  {rec.synopsis && (
                    <div className="mt-2.5 bg-[#141420] p-2.5 rounded-xl border border-[#2A2A40] space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                        <BookOpen className="w-3 h-3" />
                        <span>خلاصه داستان:</span>
                      </div>
                      <p className="text-[11px] text-gray-200 leading-relaxed">
                        {rec.synopsis}
                      </p>
                    </div>
                  )}

                  {/* Why Watch Explanation */}
                  {rec.whyWatch && (
                    <div className="mt-2 text-[11px] text-[#A0A0B5] bg-[#161628] p-2.5 rounded-xl border border-[#2A2A40]/70 leading-relaxed flex items-start gap-1.5">
                      <span className="text-purple-400 font-bold shrink-0">✦</span>
                      <span>{rec.whyWatch}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

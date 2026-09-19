import React from 'react';
import { BoxOfficeEntry, Movie } from '../types';
import { MovieService } from '../services/api';
import { 
  Trophy, 
  ArrowRight, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Film,
  RefreshCw,
  Filter,
  BarChart3,
  Percent,
  Flame,
  Globe2,
  PieChart
} from 'lucide-react';
import { getCategoryName, getCategoryColor } from '../data/categories';

interface BoxOfficeScreenProps {
  onBack: () => void;
  onMovieClick: (movie: Movie) => void;
  allMovies: Movie[];
}

export const BoxOfficeScreen: React.FC<BoxOfficeScreenProps> = ({
  onBack,
  onMovieClick,
  allMovies,
}) => {
  const [entries, setEntries] = React.useState<BoxOfficeEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'revenue' | 'roi' | 'rating'>('revenue');

  const loadData = React.useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await MovieService.fetchBoxOffice();
      setEntries(data);
    } catch (e) {
      console.error('Failed to load box office:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCardClick = (entry: BoxOfficeEntry) => {
    const found = allMovies.find((m) => m.message_id === entry.message_id || (entry.imdb_id && m.imdb_id === entry.imdb_id));
    if (found) {
      onMovieClick(found);
    } else {
      const fallbackMovie: Movie = {
        message_id: entry.message_id,
        title: entry.title,
        english_title: entry.english_title,
        poster_url: entry.poster_url,
        rating: entry.rating,
        year: entry.year,
        category: entry.category,
        box_office: entry.box_office_label,
        imdb_id: entry.imdb_id,
        country: entry.country,
      };
      onMovieClick(fallbackMovie);
    }
  };

  // Filter and Sort entries
  const processedEntries = React.useMemo(() => {
    let list = [...entries];
    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    if (sortBy === 'revenue') {
      list.sort((a, b) => b.box_office_value - a.box_office_value);
    } else if (sortBy === 'roi') {
      list.sort((a, b) => (b.roi_percentage || 0) - (a.roi_percentage || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [entries, selectedCategory, sortBy]);

  // Overall Statistics
  const totalRevenueUsd = React.useMemo(() => {
    return entries
      .filter(e => e.box_office_value > 1000000 && !e.box_office_label.includes('تومان'))
      .reduce((acc, curr) => acc + curr.box_office_value, 0);
  }, [entries]);

  const topRecordHolder = entries[0];

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-black font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E0E0E0] to-[#9E9E9E] text-black font-black text-lg flex items-center justify-center shadow-md border border-slate-300">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#CD7F32] to-[#8C521E] text-white font-black text-lg flex items-center justify-center shadow-md border border-amber-700/50">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#242438] text-[#A0A0B5] font-black text-sm flex items-center justify-center border border-[#3A3A55]">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white pb-24 md:pb-12 animate-fade-in">
      
      {/* Top Sticky Bar */}
      <div className="sticky top-0 z-30 bg-[#141420]/95 backdrop-blur-md border-b border-[#2A2A40] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="boxoffice-back-button"
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-[#A0A0B5] hover:text-white border border-[#2A2A40] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFB800] to-amber-600 flex items-center justify-center text-black shadow-md">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white">
                باکس آفیس و گیشه سینما
              </h1>
              <span className="text-[11px] text-[#A0A0B5] block -mt-0.5">
                رتبه‌بندی تحلیلی فروش، بودجه و بازگشت سرمایه آثار
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="boxoffice-refresh-button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-xs font-semibold text-[#A0A0B5] hover:text-white transition-all disabled:opacity-50"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FFB800]' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* KPI & Summary Widgets Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Total USD Revenue */}
          <div className="bg-gradient-to-br from-[#1C1C2E] via-[#242438] to-[#1C1C2E] border border-[#FFB800]/30 rounded-2xl p-4.5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/20 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-[#A0A0B5] font-semibold block">مجموع درآمد جهانی (دلاری)</span>
              <span className="text-xl font-black text-white block mt-0.5" dir="ltr">
                ${(totalRevenueUsd / 1000000).toFixed(1)}M+
              </span>
              <span className="text-[10px] text-[#FFB800] flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                تحلیل گیشه جهانی
              </span>
            </div>
          </div>

          {/* Card 2: Highest Earner */}
          <div className="bg-[#181828] border border-[#2A2A40] rounded-2xl p-4.5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-[#A0A0B5] font-semibold block">صدرنشین فروش جهانی</span>
              <span className="text-sm sm:text-base font-black text-white block mt-0.5 truncate">
                {topRecordHolder?.title || 'اوپنهایمر'}
              </span>
              <span className="text-[11px] text-rose-400 font-bold block mt-0.5" dir="ltr">
                {topRecordHolder?.box_office_label || '$957.8M'}
              </span>
            </div>
          </div>

          {/* Card 3: Domestic Market Record */}
          <div className="bg-[#181828] border border-[#2A2A40] rounded-2xl p-4.5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-[#A0A0B5] font-semibold block">رکورددار سینمای ایران</span>
              <span className="text-sm sm:text-base font-black text-white block mt-0.5 truncate">
                فیلم سینمایی فسیل
              </span>
              <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                ۳۲۴ میلیارد تومان (+۲۰۶۰٪ سود)
              </span>
            </div>
          </div>

        </div>

        {/* Filter & Sort Controls */}
        <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Categories Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-[#A0A0B5] font-bold ml-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#FFB800]" />
              دسته‌بندی:
            </span>
            {[
              { id: 'all', label: 'همه آثار' },
              { id: 'foreign_movies', label: 'فیلم خارجی' },
              { id: 'iranian_movies', label: 'سینمای ایران' },
              { id: 'children', label: 'انیمیشن' },
              { id: 'indian_movies', label: 'بالیوود' },
              { id: 'foreign_series', label: 'سریال' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#FFB800] text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#1C1C2E] text-[#A0A0B5] hover:text-white hover:bg-[#242438] border border-[#2A2A40]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-[#A0A0B5] font-bold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#8B5CF6]" />
              مرتب‌سازی:
            </span>
            <div className="flex bg-[#1C1C2E] p-1 rounded-xl border border-[#2A2A40]">
              <button
                onClick={() => setSortBy('revenue')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'revenue' ? 'bg-[#8B5CF6] text-white' : 'text-[#A0A0B5] hover:text-white'
                }`}
              >
                بیشترین فروش
              </button>
              <button
                onClick={() => setSortBy('roi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'roi' ? 'bg-[#8B5CF6] text-white' : 'text-[#A0A0B5] hover:text-white'
                }`}
              >
                بازگشت سرمایه (ROI)
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'rating' ? 'bg-[#8B5CF6] text-white' : 'text-[#A0A0B5] hover:text-white'
                }`}
              >
                امتیاز IMDb
              </button>
            </div>
          </div>

        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A0A0B5]">
            <RefreshCw className="w-8 h-8 animate-spin text-[#FFB800]" />
            <span className="text-sm">در حال بارگذاری و تحلیل داده‌های گیشه...</span>
          </div>
        ) : processedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141420] rounded-3xl border border-[#2A2A40] p-6">
            <Film className="w-12 h-12 text-[#5A5A72] mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">اثری یافت نشد</h3>
            <p className="text-xs text-[#A0A0B5]">هیچ رکوردی برای فیلتر انتخاب شده ثبت نشده است.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {processedEntries.map((entry) => {
              const catColor = getCategoryColor(entry.category || '');
              return (
                <div
                  key={entry.message_id}
                  id={`boxoffice-item-${entry.message_id}`}
                  onClick={() => handleCardClick(entry)}
                  className="group bg-[#181828] hover:bg-[#202034] border border-[#2A2A40] hover:border-[#FFB800]/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-950/20 hover:-translate-y-0.5"
                >
                  
                  {/* Left Side: Rank, Poster and Titles */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    
                    {/* Rank Badge */}
                    <div className="shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>

                    {/* Poster Thumbnail */}
                    <div className="w-14 sm:w-16 aspect-[2/3] rounded-xl overflow-hidden bg-[#141420] border border-[#3A3A55] shrink-0 shadow-md">
                      {entry.poster_url ? (
                        <img
                          src={entry.poster_url}
                          alt={entry.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5A5A72]">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Title and Meta Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#FFB800] transition-colors truncate">
                          {entry.title}
                        </h3>
                        {entry.year && (
                          <span className="text-[11px] font-semibold text-[#A0A0B5] bg-black/40 px-2 py-0.5 rounded border border-[#2A2A40]">
                            {entry.year}
                          </span>
                        )}
                      </div>

                      {entry.english_title && (
                        <span className="text-xs text-[#00D4FF] font-medium block mb-2" dir="ltr">
                          {entry.english_title}
                        </span>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {getCategoryName(entry.category || '')}
                        </span>

                        {entry.rating && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#FFB800] text-black shadow-sm">
                            <Star className="w-3 h-3 fill-black" />
                            <span>{entry.rating}</span>
                          </span>
                        )}

                        {entry.country && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#1C1C2E] text-[#A0A0B5] border border-[#2A2A40]">
                            <Globe2 className="w-3 h-3 text-[#5A5A72]" />
                            <span>{entry.country}</span>
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Side: Financial Stats (Revenue, Budget, ROI) */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#2A2A40]/60">
                    
                    {/* Budget & ROI info if available */}
                    {entry.budget && (
                      <div className="text-right hidden md:block">
                        <span className="text-[10px] text-[#5A5A72] block font-semibold">بودجه ساخت</span>
                        <span className="text-xs font-bold text-[#A0A0B5] block mt-0.5" dir="ltr">
                          {entry.budget}
                        </span>
                        {entry.roi_percentage && (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 flex items-center gap-0.5 justify-end">
                            <Percent className="w-2.5 h-2.5" />
                            <span>+{entry.roi_percentage}% بازدهی</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Revenue Big Tag */}
                    <div className="text-left bg-[#141420] px-4 py-2.5 rounded-xl border border-[#FFB800]/30 shadow-inner">
                      <span className="text-[10px] text-[#A0A0B5] block font-semibold text-right">
                        فروش کل در گیشه
                      </span>
                      <div className="flex items-center gap-1 text-[#FFB800] font-black text-base sm:text-lg mt-0.5" dir="ltr">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                        <span>{entry.box_office_label || `$${entry.box_office_value.toLocaleString()}`}</span>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

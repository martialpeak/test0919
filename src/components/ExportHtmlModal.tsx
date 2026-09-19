import React from 'react';
import { Movie } from '../types';
import { 
  generateMovieHtml, 
  generateCatalogHtml, 
  downloadMovieHtml, 
  downloadCatalogHtml
} from '../utils/htmlExporter';
import { formatMovieYear, isIranianMovie } from '../utils/dateHelper';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Code, 
  Eye, 
  ExternalLink, 
  FileCode, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ExportHtmlModalProps {
  movie?: Movie | null;
  allMovies?: Movie[];
  onClose: () => void;
}

export const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({
  movie,
  allMovies = [],
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'single' | 'catalog'>(movie ? 'single' : 'catalog');
  const [viewMode, setViewMode] = React.useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = React.useState(false);
  const [selectedMovieId, setSelectedMovieId] = React.useState<number>(movie?.message_id || (allMovies[0]?.message_id ?? 0));

  const currentMovie = React.useMemo(() => {
    if (activeTab === 'single') {
      if (movie && movie.message_id === selectedMovieId) return movie;
      return allMovies.find(m => m.message_id === selectedMovieId) || movie || allMovies[0];
    }
    return movie || allMovies[0];
  }, [activeTab, movie, selectedMovieId, allMovies]);

  const htmlOutput = React.useMemo(() => {
    if (activeTab === 'single' && currentMovie) {
      return generateMovieHtml(currentMovie);
    }
    if (allMovies.length > 0) {
      return generateCatalogHtml(allMovies);
    }
    if (currentMovie) {
      return generateMovieHtml(currentMovie);
    }
    return '';
  }, [activeTab, currentMovie, allMovies]);

  const handleCopy = async () => {
    if (!htmlOutput) return;
    try {
      await navigator.clipboard.writeText(htmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  const handleDownload = async () => {
    if (activeTab === 'single' && currentMovie) {
      await downloadMovieHtml(currentMovie);
    } else if (allMovies.length > 0) {
      downloadCatalogHtml(allMovies);
    }
  };

  const handleOpenInNewTab = () => {
    if (!htmlOutput) return;
    const blob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const yearDisplay = currentMovie ? formatMovieYear(currentMovie) : '';
  const isIran = currentMovie ? isIranianMovie(currentMovie) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in" dir="rtl">
      <div 
        id="export-html-modal-card"
        className="relative w-full max-w-4xl bg-[#131322] border border-[#2A2A48] rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#25253C] bg-[#18182C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>خروجی استاندارد HTML قالب اختصاصی</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  دسترسی مدیریت
                </span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Movie Metadata Fetcher
                </span>
              </h2>
              <p className="text-xs text-[#8E8EB0]">
                تولید کدهای بهینه‌سازی شده با فونت وزیرمتن و طراحی شیشه‌ای مدرن
              </p>
            </div>
          </div>

          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A0A0B5] hover:text-white hover:bg-[#25253C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Selector */}
        <div className="px-6 py-3 bg-[#151526] border-b border-[#25253C] flex flex-wrap items-center justify-between gap-3">
          
          {/* Target tabs: Single Movie vs Full Catalog */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0E0E1A] rounded-xl border border-[#23233A]">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'single' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                  : 'text-[#8E8EB0] hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>تک فیلم / اثر منتخب</span>
            </button>

            {allMovies.length > 1 && (
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'text-[#8E8EB0] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>کل آرشیو ({allMovies.length} اثر)</span>
              </button>
            )}
          </div>

          {/* Movie Selector dropdown (if in single mode & multiple movies exist) */}
          {activeTab === 'single' && allMovies.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8E8EB0]">انتخاب اثر:</span>
              <select
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                className="bg-[#1C1C30] text-white text-xs rounded-xl px-3 py-1.5 border border-[#2E2E48] focus:border-purple-500 focus:outline-none max-w-[220px] truncate"
              >
                {allMovies.map(m => (
                  <option key={m.message_id} value={m.message_id}>
                    {m.title} {m.year ? `(${formatMovieYear(m)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle: Preview vs Raw HTML */}
          <div className="flex items-center gap-1 p-1 bg-[#0E0E1A] rounded-xl border border-[#23233A]">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'preview' ? 'bg-[#252540] text-white' : 'text-[#8E8EB0] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پیش‌نمایش زنده</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'code' ? 'bg-[#252540] text-white' : 'text-[#8E8EB0] hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>مشاهده کد HTML</span>
            </button>
          </div>
        </div>

        {/* Iranian Movie Solar Hijri Year Notice */}
        {activeTab === 'single' && isIran && (
          <div className="px-6 py-2 bg-emerald-950/30 border-b border-emerald-800/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>سال ساخت اثر ایرانی به تاریخ شمسی محاسبه و درج شده است: <strong>{yearDisplay}</strong></span>
            </div>
            <span className="text-[11px] text-emerald-400/80 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-700/40">
              تقویم هجری شمسی (ایران)
            </span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[58vh]">
          {viewMode === 'preview' ? (
            <div className="w-full bg-[#0a0a14] rounded-2xl border border-[#25253C] overflow-hidden shadow-inner flex flex-col items-center">
              <iframe
                title="HTML Preview"
                srcDoc={htmlOutput}
                className="w-full min-h-[500px] border-0 rounded-2xl bg-[#0a0a14]"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          ) : (
            <div className="relative">
              <pre 
                className="w-full bg-[#0A0A14] text-[#E0E0F0] text-xs font-mono p-4 rounded-2xl border border-[#25253C] overflow-x-auto max-h-[480px] leading-relaxed select-all"
                dir="ltr"
              >
                <code>{htmlOutput}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#18182C] border-t border-[#25253C] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8E8EB0]">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>خروجی سازگار با تمام مرورگرها و وبلاگ‌ها</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F1F34] hover:bg-[#282845] text-[#C0C0D8] hover:text-white text-xs font-semibold border border-[#323250] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>باز کردن در تب جدید</span>
            </button>

            <button
              id="copy-html-btn"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                copied 
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' 
                  : 'bg-[#24243A] hover:bg-[#2F2F4C] border-[#383858] text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copied ? 'کپی شد!' : 'کپی کدهای HTML'}</span>
            </button>

            <button
              id="download-html-file-btn"
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل HTML</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

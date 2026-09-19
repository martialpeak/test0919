import React from 'react';
import { Movie } from '../types';
import { parseMovieHtml } from '../utils/htmlParser';
import { AuthService } from '../services/authService';
import { X, UploadCloud, FileCode2, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { apiFetch } from '../services/apiFetch';

interface BulkHtmlImportModalProps {
  onClose: () => void;
  onImported: (count: number) => void;
}

type RowStatus = 'pending' | 'parsed' | 'failed';

interface ParsedRow {
  fileName: string;
  status: RowStatus;
  title?: string;
  year?: string;
  error?: string;
  data?: Partial<Movie>;
}

// Posting thousands of movies in one request would exceed the server's 50mb JSON limit once
// posters are included, so the import is sent in chunks.
const CHUNK_SIZE = 200;

export const BulkHtmlImportModal: React.FC<BulkHtmlImportModalProps> = ({ onClose, onImported }) => {
  const [rows, setRows] = React.useState<ParsedRow[]>([]);
  const [isReading, setIsReading] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const readFiles = async (files: File[]) => {
    const htmlFiles = files.filter(f => /\.html?$/i.test(f.name) || f.type.includes('html'));
    if (htmlFiles.length === 0) {
      setError('هیچ فایل HTML معتبری انتخاب نشد.');
      return;
    }
    setError(null);
    setResult(null);
    setIsReading(true);
    setProgress({ done: 0, total: htmlFiles.length });

    const parsed: ParsedRow[] = [];
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = htmlFiles[i];
      try {
        const text = await file.text();
        const data = parseMovieHtml(text);
        if (!data.title || data.title === 'بدون عنوان') {
          parsed.push({ fileName: file.name, status: 'failed', error: 'عنوان پیدا نشد' });
        } else {
          parsed.push({ fileName: file.name, status: 'parsed', title: data.title, year: data.year, data });
        }
      } catch (err: any) {
        parsed.push({ fileName: file.name, status: 'failed', error: err?.message || 'خطا در خواندن فایل' });
      }
      // Yield to the browser every few files so the UI keeps painting on large batches
      if (i % 25 === 0) {
        setProgress({ done: i + 1, total: htmlFiles.length });
        await new Promise(r => setTimeout(r, 0));
      }
    }
    setProgress({ done: htmlFiles.length, total: htmlFiles.length });
    setRows(prev => [...prev, ...parsed]);
    setIsReading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 0) readFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) readFiles(files);
  };

  const okRows = rows.filter(r => r.status === 'parsed');
  const failedRows = rows.filter(r => r.status === 'failed');

  const handleImport = async () => {
    if (okRows.length === 0) return;
    setIsImporting(true);
    setError(null);
    setResult(null);
    setProgress({ done: 0, total: okRows.length });

    const token = AuthService.getToken();
    if (!token) {
      setError('نشست مدیر منقضی شده است. دوباره وارد شوید.');
      setIsImporting(false);
      return;
    }

    let added = 0, updated = 0, skipped = 0;
    try {
      for (let i = 0; i < okRows.length; i += CHUNK_SIZE) {
        const chunk = okRows.slice(i, i + CHUNK_SIZE).map(r => r.data);
        const res = await apiFetch('/api/movies/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ movies: chunk })
        });
        const j = await res.json();
        if (!res.ok || !j.ok) {
          throw new Error(j.error || `سرور خطا داد (${res.status})`);
        }
        added += j.added || 0;
        updated += j.updated || 0;
        skipped += j.skipped || 0;
        setProgress({ done: Math.min(i + CHUNK_SIZE, okRows.length), total: okRows.length });
      }
      setResult(`${added} فیلم افزوده شد، ${updated} فیلم بروزرسانی شد${skipped ? `، ${skipped} رد شد` : ''}.`);
      onImported(added + updated);
    } catch (err: any) {
      setError(err?.message || 'خطا در ارسال به سرور');
    } finally {
      setIsImporting(false);
    }
  };

  const busy = isReading || isImporting;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#141420] border border-[#2A2A40] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A40] bg-[#1C1C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">افزودن گروهی فیلم از فایل HTML</h3>
              <span className="text-xs text-[#A0A0B5]">می‌توانید هزاران فایل را یکجا انتخاب کنید</span>
            </div>
          </div>
          <button
            id="close-bulk-import-modal"
            onClick={onClose}
            disabled={isImporting}
            className="p-2 rounded-xl bg-[#242438] text-[#A0A0B5] hover:text-white hover:bg-[#3A3A55] transition-colors cursor-pointer disabled:opacity-40"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => !busy && inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-[#00D4FF] bg-[#00D4FF]/10' : 'border-[#3A3A55] bg-[#181828] hover:border-[#00D4FF]/60'
            } ${busy ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <FileCode2 className="w-10 h-10 mx-auto text-[#00D4FF] mb-3" />
            <p className="text-sm font-bold text-white mb-1">فایل‌های HTML را اینجا رها کنید</p>
            <p className="text-xs text-[#A0A0B5]">یا کلیک کنید و چند فایل (یا یک پوشه کامل) را انتخاب کنید</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".html,.htm,text/html"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Progress */}
          {busy && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-[#A0A0B5]">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFB800]" />
                <span>{isReading ? 'در حال خواندن فایل‌ها' : 'در حال ارسال به سرور'}: {progress.done} از {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-[#242438] overflow-hidden">
                <div className="h-full bg-[#00D4FF] transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Summary */}
          {rows.length > 0 && !busy && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {okRows.length} فایل آماده افزودن
              </span>
              {failedRows.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {failedRows.length} فایل ناموفق
                </span>
              )}
              <button
                onClick={() => { setRows([]); setResult(null); setError(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242438] text-[#A0A0B5] hover:text-white border border-[#2A2A40] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                پاک کردن لیست
              </button>
            </div>
          )}

          {/* Result / error */}
          {result && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{result}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File list (capped so 5000 rows don't kill the DOM) */}
          {rows.length > 0 && (
            <div className="rounded-2xl border border-[#2A2A40] overflow-hidden">
              <div className="max-h-64 overflow-y-auto divide-y divide-[#2A2A40]/60">
                {rows.slice(0, 150).map((r, i) => (
                  <div key={`${r.fileName}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2 text-xs bg-[#181828]">
                    <span className="text-[#A0A0B5] truncate flex-1" dir="ltr">{r.fileName}</span>
                    {r.status === 'parsed' ? (
                      <span className="text-white font-medium truncate max-w-[45%]">
                        {r.title} {r.year ? `(${r.year})` : ''}
                      </span>
                    ) : (
                      <span className="text-rose-400 shrink-0">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
              {rows.length > 150 && (
                <div className="px-4 py-2 text-[11px] text-[#A0A0B5] bg-[#141420] border-t border-[#2A2A40]">
                  و {rows.length - 150} فایل دیگر…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2A2A40] bg-[#12121E] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#A0A0B5]">
            پوسترها روی سرور ذخیره می‌شوند و در پاسخ لیست فیلم‌ها ارسال نمی‌شوند
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl bg-[#242438] text-white text-xs font-bold border border-[#3A3A55] hover:bg-[#2C2C45] transition-colors cursor-pointer disabled:opacity-40"
            >
              بستن
            </button>
            <button
              id="start-bulk-import-btn"
              onClick={handleImport}
              disabled={busy || okRows.length === 0}
              className="px-5 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-lg shadow-red-600/25 hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isImporting ? 'در حال افزودن…' : `افزودن ${okRows.length} فیلم`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

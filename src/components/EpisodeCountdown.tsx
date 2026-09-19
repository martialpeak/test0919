import React, { useState, useEffect } from 'react';
import { NextEpisodeInfo } from '../types';
import { calculateCountdown, CountdownBreakdown, formatPersianDateTime } from '../services/scheduleService';
import { Clock, Tv, Calendar, CheckCircle2, Radio } from 'lucide-react';

interface EpisodeCountdownProps {
  info?: NextEpisodeInfo | null;
  mode?: 'compact' | 'badge' | 'full' | 'banner';
  className?: string;
  onSubscribeNotification?: () => void;
}

export const EpisodeCountdown: React.FC<EpisodeCountdownProps> = ({
  info,
  mode = 'compact',
  className = '',
}) => {
  const [countdown, setCountdown] = useState<CountdownBreakdown | null>(() => {
    if (!info?.timestamp) return null;
    return calculateCountdown(info.timestamp);
  });

  useEffect(() => {
    if (!info?.timestamp) {
      setCountdown(null);
      return;
    }

    const update = () => {
      setCountdown(calculateCountdown(info.timestamp));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [info?.timestamp]);

  if (!info) return null;

  // If completed / not upcoming
  if (!info.isUpcoming || !info.timestamp) {
    if (mode === 'badge') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>{info.formattedPersian || 'پایان فصل'}</span>
        </span>
      );
    }
    return (
      <div className={`p-3 rounded-2xl bg-[#1C1C2E] border border-[#2A2A40] flex items-center justify-between text-xs text-[#A0A0B5] ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>پخش تمام قسمت‌های این فصل کامل شده است.</span>
        </div>
        {info.network && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-black/30 text-white font-medium">
            {info.network}
          </span>
        )}
      </div>
    );
  }

  // 1. Badge Mode (for cards and lists)
  if (mode === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-900/40 via-[#8B5CF6]/25 to-cyan-900/40 text-cyan-300 border border-[#8B5CF6]/40 shadow-sm ${className}`}>
        <Radio className="w-3 h-3 text-[#00D4FF] animate-pulse" />
        <span>فصل {info.season} ق {info.episode}:</span>
        <span className="font-mono text-white text-[11px]">
          {countdown ? countdown.formattedText : (info.dayOfWeek || 'به‌زودی')}
        </span>
      </div>
    );
  }

  // 2. Compact Mode
  if (mode === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-[#1E1E34] to-[#161625] border border-[#8B5CF6]/30 text-xs shadow-md ${className}`}>
        <div className="flex items-center gap-1.5 text-white font-bold">
          <Radio className="w-3.5 h-3.5 text-[#00D4FF] animate-pulse" />
          <span>قسمت بعدی (فصل {info.season}، قسمت {info.episode}):</span>
        </div>

        {countdown && !countdown.isExpired ? (
          <div className="flex items-center gap-1 font-mono text-xs text-white">
            <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/30 text-[#00D4FF] font-black border border-[#00D4FF]/30">
              {countdown.days} روز
            </span>
            <span className="text-[#A0A0B5]">:</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-black">
              {String(countdown.hours).padStart(2, '0')} ساعت
            </span>
            <span className="text-[#A0A0B5]">:</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-white font-black">
              {String(countdown.minutes).padStart(2, '0')} دقیقه
            </span>
            <span className="text-[#A0A0B5]">:</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 font-black min-w-[28px] text-center">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
          </div>
        ) : (
          <span className="text-emerald-400 font-bold">هم‌اکنون در دسترس!</span>
        )}

        {info.network && (
          <span className="text-[10px] text-[#A0A0B5] bg-black/30 px-2 py-0.5 rounded border border-white/5 mr-auto">
            {info.network}
          </span>
        )}
      </div>
    );
  }

  // 3. Full / Banner Mode (For MovieDetailScreen or Tracking Hub)
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1C30] via-[#161626] to-[#12121E] border border-[#8B5CF6]/40 p-5 sm:p-6 shadow-2xl ${className}`}>
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00D4FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A40]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6]/30 to-[#00D4FF]/30 border border-[#8B5CF6]/50 flex items-center justify-center text-[#00D4FF] shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold border border-[#8B5CF6]/30 uppercase tracking-wider">
                زمان‌بندی زنده
              </span>
              {info.source === 'tvmaze' && (
                <span className="text-[10px] text-[#A0A0B5]">از مرجع رسمی TVMaze</span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              روزشمار انتشار قسمت بعدی • فصل {info.season}، قسمت {info.episode}
            </h3>
          </div>
        </div>

        {info.network && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-[#3A3A55] text-xs">
            <Tv className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span className="text-[#A0A0B5]">پخش از:</span>
            <span className="font-bold text-white">{info.network}</span>
          </div>
        )}
      </div>

      {/* Countdown Timer Display */}
      <div className="relative z-10 py-5">
        {countdown && !countdown.isExpired ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto text-center">
            
            {/* Days */}
            <div className="bg-[#12121F]/90 border border-[#3A3A55] rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center justify-center">
              <span className="font-mono text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#A0A0B5]">
                {countdown.days}
              </span>
              <span className="text-[10px] sm:text-xs text-[#8E8EA8] font-bold mt-1">روز</span>
            </div>

            {/* Hours */}
            <div className="bg-[#12121F]/90 border border-[#8B5CF6]/40 rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center justify-center">
              <span className="font-mono text-2xl sm:text-4xl font-black text-[#00D4FF]">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#8E8EA8] font-bold mt-1">ساعت</span>
            </div>

            {/* Minutes */}
            <div className="bg-[#12121F]/90 border border-[#3A3A55] rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center justify-center">
              <span className="font-mono text-2xl sm:text-4xl font-black text-amber-400">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#8E8EA8] font-bold mt-1">دقیقه</span>
            </div>

            {/* Seconds */}
            <div className="bg-[#12121F]/90 border border-purple-500/40 rounded-2xl p-2.5 sm:p-4 shadow-lg flex flex-col items-center justify-center">
              <span className="font-mono text-2xl sm:text-4xl font-black text-purple-400 animate-pulse">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#8E8EA8] font-bold mt-1">ثانیه</span>
            </div>

          </div>
        ) : (
          <div className="text-center py-4 text-emerald-400 font-bold text-base flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>اپیزود جدید هم‌اکنون منتشر شده و قابل دریافت است!</span>
          </div>
        )}
      </div>

      {/* Footer details info */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2A2A40]/80 text-xs text-[#A0A0B5]">
        <div className="flex items-center gap-2 text-right">
          <Calendar className="w-4 h-4 text-[#8B5CF6] shrink-0" />
          <span>
            تاریخ و زمان انتشار: <strong className="text-white">{info.formattedPersian || formatPersianDateTime(info.timestamp)}</strong>
          </span>
        </div>

        {info.dayOfWeek && (
          <div className="flex items-center gap-1.5 text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-3 py-1 rounded-xl border border-[#00D4FF]/20 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>پخش منظم: {info.dayOfWeek} {info.timeOfDay ? `ساعت ${info.timeOfDay}` : ''}</span>
          </div>
        )}
      </div>

    </div>
  );
};

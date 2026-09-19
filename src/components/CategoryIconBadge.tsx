import React from 'react';

/* ============================================================================
   آیکون‌های اختصاصی دست‌ساز SVG برای هر دسته‌بندی
   هر دسته: آیکون اختصاصی + بافت پس‌زمینه موضوعی + انیمیشن hover اختصاصی
   ============================================================================ */

interface IconProps {
  className?: string;
}

/* ---------- ۱. تازه‌ترین‌ها: شعله با هسته طلایی و جرقه ---------- */
const FlameIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ transformOrigin: '50% 88%' }} aria-hidden="true">
    <path d="M12 2.6c.5 3-2.7 4.5-3.3 7.2-.5 2.3.7 4.7 3.3 4.7s3.8-2.4 3.3-4.7c-.2-.8-.5-1.5-.9-2.1 2.1 1 3.9 3.2 3.9 6.3 0 3.9-2.8 6.9-6.3 6.9s-6.3-3-6.3-6.9c0-5.7 4.9-7.3 6.3-11.4z" fill="rgba(255,255,255,0.94)" />
    <path d="M12 10.4c-.9 1.3-1.7 2.3-1.7 3.5a1.7 1.7 0 003.4 0c0-1.2-.8-2.2-1.7-3.5z" fill="#FFE08A" />
    <path d="M18.7 3.2l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" fill="rgba(255,255,255,0.95)" />
    <path d="M4.8 6.6l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35z" fill="rgba(255,255,255,0.8)" />
  </svg>
);

/* ---------- ۲. همه آثار: پشته سینمایی با سوراخ‌های فیلم و ستاره ---------- */
const StackIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 2.7l8.4 4.4L12 11.5 3.6 7.1z" fill="rgba(255,255,255,0.95)" />
    <circle cx="10.3" cy="7.1" r="0.95" fill="rgba(159,18,57,0.85)" />
    <circle cx="13.7" cy="7.1" r="0.95" fill="rgba(159,18,57,0.85)" />
    <path d="M4.5 11.9L12 15.8l7.5-3.9" fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 16.4L12 20.3l7.5-3.9" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.6 2.2l.45 1.05 1.05.45-1.05.45-.45 1.05-.45-1.05-1.05-.45 1.05-.45z" fill="#FDA4AF" />
  </svg>
);

/* ---------- ۳. فیلم خارجی: کره زمین با نوار فیلم مداری ---------- */
const GlobeIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.7" />
    <ellipse cx="12" cy="12" rx="3.6" ry="8.2" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.25" />
    <path d="M4.4 9.3h15.2M4.4 14.7h15.2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.25" strokeLinecap="round" />
    <rect x="16.6" y="1.9" width="5.2" height="3.3" rx="0.8" fill="rgba(255,255,255,0.95)" />
    <circle cx="18" cy="3.55" r="0.5" fill="#1E40AF" />
    <circle cx="19.9" cy="3.55" r="0.5" fill="#1E40AF" />
    <circle cx="21.2" cy="3.55" r="0.5" fill="#1E40AF" />
  </svg>
);

/* ---------- ۴. فیلم ایرانی: کلاکت با ستاره هشت‌پر فارسی ---------- */
const ClapperIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M3.4 9.8L5 5.1h14.6l-1.5 4.7z" fill="rgba(255,255,255,0.17)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8.5 5.1L7.1 9.8M12.3 5.1l-1.4 4.7M16.1 5.1l-1.4 4.7" stroke="rgba(255,255,255,0.95)" strokeWidth="1.35" strokeLinecap="round" />
    <rect x="3.4" y="10" width="17.2" height="9.4" rx="1.7" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" />
    <path d="M12 12.4l.8 1.5 1.7.4-1.2 1.25.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.25 1.7-.4z" fill="rgba(255,255,255,0.92)" />
    <circle cx="6.4" cy="16.6" r="0.8" fill="rgba(255,255,255,0.75)" />
    <circle cx="17.6" cy="16.6" r="0.8" fill="rgba(255,255,255,0.75)" />
  </svg>
);

/* ---------- ۵. فیلم هندی: رول فیلم با نوار و جرقه بالیوودی ---------- */
const ReelIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="9.4" r="6.3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" />
    <circle cx="12" cy="5.8" r="1.15" fill="rgba(255,255,255,0.92)" />
    <circle cx="15.8" cy="8.2" r="1.15" fill="rgba(255,255,255,0.92)" />
    <circle cx="14.4" cy="12.6" r="1.15" fill="rgba(255,255,255,0.92)" />
    <circle cx="9.6" cy="12.6" r="1.15" fill="rgba(255,255,255,0.92)" />
    <circle cx="8.2" cy="8.2" r="1.15" fill="rgba(255,255,255,0.92)" />
    <circle cx="12" cy="9.4" r="1.45" fill="rgba(255,255,255,0.95)" />
    <rect x="3" y="17.6" width="18" height="3.7" rx="1" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.3" />
    <circle cx="6.1" cy="19.45" r="0.55" fill="rgba(255,255,255,0.9)" />
    <circle cx="10.05" cy="19.45" r="0.55" fill="rgba(255,255,255,0.9)" />
    <circle cx="13.95" cy="19.45" r="0.55" fill="rgba(255,255,255,0.9)" />
    <circle cx="17.9" cy="19.45" r="0.55" fill="rgba(255,255,255,0.9)" />
    <path d="M4 3.1l.4.95.95.4-.95.4-.4.95-.4-.95-.95-.4.95-.4z" fill="#FEF3C7" />
  </svg>
);

/* ---------- ۶. سریال خارجی: تلویزیون نئونی با امواج پخش ---------- */
const TvWaveIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <g className="anim-origin badge-ico-ping">
      <path d="M17.2 4.6a4.6 4.6 0 013.4 4.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.7 7a2.1 2.1 0 011.6 2" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.3" strokeLinecap="round" />
    </g>
    <rect x="2.8" y="6.6" width="18.4" height="12.2" rx="2.6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" />
    <path d="M10.4 9.8l4.7 2.9-4.7 2.9z" fill="rgba(255,255,255,0.95)" />
    <path d="M8.8 21.4c.5-1.4 1.8-2.3 3.2-2.3s2.7.9 3.2 2.3" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ---------- ۷. سریال ایرانی: تلویزیون با کاشی هشت‌پر ایرانی ---------- */
const TvTileIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2.8" y="5.6" width="18.4" height="12.2" rx="2.6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" />
    <g className="anim-origin badge-ico-glow">
      <rect x="9.5" y="8.9" width="5" height="5" rx="0.6" fill="rgba(255,255,255,0.9)" />
      <rect x="9.5" y="8.9" width="5" height="5" rx="0.6" transform="rotate(45 12 11.4)" fill="rgba(255,255,255,0.5)" />
    </g>
    <rect x="5.5" y="8.4" width="2" height="2" transform="rotate(45 6.5 9.4)" fill="rgba(255,255,255,0.55)" />
    <rect x="16.5" y="8.4" width="2" height="2" transform="rotate(45 17.5 9.4)" fill="rgba(255,255,255,0.55)" />
    <rect x="5.5" y="13.4" width="2" height="2" transform="rotate(45 6.5 14.4)" fill="rgba(255,255,255,0.55)" />
    <rect x="16.5" y="13.4" width="2" height="2" transform="rotate(45 17.5 14.4)" fill="rgba(255,255,255,0.55)" />
    <path d="M8.8 20.6c.5-1.3 1.8-2.2 3.2-2.2s2.7.9 3.2 2.2" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ---------- ۸. سریال ترکی: لاله Turkish با قلب ---------- */
const TulipIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M6.8 4.4v3.7c0 4.2 2.3 6.6 5.2 6.6s5.2-2.4 5.2-6.6V4.4l-3.3 1.7L12 3.2l-1.9 2.9z" fill="rgba(255,255,255,0.95)" />
    <path d="M12 14.7v5.9" stroke="rgba(255,255,255,0.9)" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12 18.6c-2.1-.1-3.6-1.4-4-3.6 2.1.1 3.6 1.4 4 3.6z" fill="rgba(255,255,255,0.7)" />
    <path d="M18.7 2.2c.55-.95 2-.75 2.1.35.08.85-.85 1.7-2.1 2.45-1.25-.75-2.18-1.6-2.1-2.45.1-1.1 1.55-1.3 2.1-.35z" fill="#FDA4AF" />
  </svg>
);

/* ---------- ۹. انیمیشن و کودک: پالت نقاشی با رنگ‌های شاد ---------- */
const PaletteIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M11.9 3.2c-4.8 0-8.7 3.4-8.7 7.5 0 4.1 3.9 7.1 7.2 7.1.9 0 1.6-.7 1.6-1.5 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.7-1.5 1.6-1.5h1.8c3.1 0 5.9-1.9 5.9-5.1 0-3.6-3.6-4.3-8.4-4.3z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" />
    <circle cx="6.9" cy="12.4" r="1.35" fill="rgba(255,255,255,0.92)" />
    <circle cx="9.1" cy="7.4" r="1.3" fill="#F9A8D4" />
    <circle cx="13.2" cy="6.2" r="1.3" fill="#7DD3FC" />
    <circle cx="16.9" cy="8.3" r="1.3" fill="#FCD34D" />
  </svg>
);

/* ---------- ۱۰. سریال کودک: دسته بازی با ستاره ---------- */
const GamepadIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M7.3 7.4h9.4c2.9 0 5.3 2.4 5.3 5.3 0 2.6-1.9 4.7-4.5 4.7-1.5 0-2.6-.8-3.5-1.9h-4c-.9 1.1-2 1.9-3.5 1.9-2.6 0-4.5-2.1-4.5-4.7 0-2.9 2.4-5.3 5.3-5.3z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8.2 10.7v3.2M6.6 12.3h3.2" stroke="rgba(255,255,255,0.95)" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="15.1" cy="11.3" r="1.05" fill="#F0ABFC" />
    <circle cx="17.6" cy="13.5" r="1.05" fill="#F0ABFC" />
    <path d="M12 2.6l.45 1.05 1.05.45-1.05.45L12 5.6l-.45-1.05-1.05-.45 1.05-.45z" fill="#FDE68A" />
  </svg>
);

/* ---------- پیش‌فرض: پاپ‌کور ---------- */
const PopcornIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M6.8 9.6h10.4l-1.3 9.3a1.7 1.7 0 01-1.7 1.5H9.8a1.7 1.7 0 01-1.7-1.5z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M10.1 10.4l.7 9M13.9 10.4l-.7 9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8.9" cy="7.6" r="2.1" fill="rgba(255,255,255,0.95)" />
    <circle cx="15.1" cy="7.6" r="2.1" fill="rgba(255,255,255,0.95)" />
    <circle cx="12" cy="5.9" r="2.3" fill="rgba(255,255,255,0.95)" />
    <path d="M19.3 3.4l.45 1.05 1.05.45-1.05.45-.45 1.05-.45-1.05-1.05-.45 1.05-.45z" fill="#FDE68A" />
  </svg>
);

/* ============================================================================
   بافت‌های پس‌زمینه موضوعی (texture) — فقط CSS، بدون تصویر
   ============================================================================ */
const patt = {
  // پرتوهای طلوع برای تازه‌ها
  rays: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'repeating-conic-gradient(from -90deg at 50% 42%, rgba(255,255,255,0.15) 0deg 9deg, transparent 9deg 27deg)' }} />
  ),
  // شبکه نقطه‌ای برای همه آثار
  gridDots: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1.5px)', backgroundSize: '6px 6px' }} />
  ),
  // حلقه‌های جغرافیایی برای فیلم خارجی
  meridians: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 44%, rgba(255,255,255,0.15) 45%, transparent 55%, rgba(255,255,255,0.11) 56%, transparent 66%)' }} />
  ),
  // راه‌راه مورب کلاکت برای فیلم ایرانی
  clapStripes: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 3px, transparent 3px 9px)' }} />
  ),
  // نقاط پراکنده رول برای فیلم هندی
  reelDots: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.26) 1.1px, transparent 1.6px)', backgroundSize: '8px 8px' }} />
  ),
  // اسکن‌لاین CRT برای سریال خارجی
  scanlines: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 5px)' }} />
  ),
  // کاشی لوزی ایرانی برای سریال ایرانی
  tiles: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.13) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.13) 75%), linear-gradient(45deg, rgba(255,255,255,0.13) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.13) 75%)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }} />
  ),
  // هاله گلبرگی برای سریال ترکی
  petals: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 26% 24%, rgba(255,255,255,0.28) 0 16%, transparent 42%), radial-gradient(circle at 76% 72%, rgba(255,255,255,0.2) 0 20%, transparent 46%)' }} />
  ),
  // کاغذرنگی برای انیمیشن و کودک
  confetti: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle 2px at 18% 24%, rgba(249,168,212,0.9) 98%, transparent), radial-gradient(circle 1.7px at 78% 18%, rgba(125,211,252,0.9) 98%, transparent), radial-gradient(circle 1.9px at 30% 76%, rgba(253,230,138,0.95) 98%, transparent), radial-gradient(circle 1.7px at 80% 66%, rgba(196,181,253,0.9) 98%, transparent)' }} />
  ),
  // شبکه‌نامه دسته بازی برای سریال کودک
  lattice: (
    <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '9px 9px' }} />
  ),
};

/* ============================================================================
   تعریف بصری هر دسته
   ============================================================================ */
export interface CategoryVisual {
  gradient: string;
  glow: string;
  badgeBg: string;
  textColor: string;
  pattern: React.ReactNode;
  icon: React.FC<IconProps>;
  hoverAnim: string;
}

export const CATEGORY_ICONS: Record<string, CategoryVisual> = {
  __latest__: {
    gradient: 'from-amber-400 via-orange-500 to-rose-600',
    glow: 'shadow-orange-500/40',
    badgeBg: 'bg-orange-500/15 border-orange-500/30',
    textColor: 'text-orange-400',
    pattern: patt.rays,
    icon: FlameIcon,
    hoverAnim: 'badge-ico-flicker',
  },
  ALL: {
    gradient: 'from-[#E50914] via-rose-600 to-red-700',
    glow: 'shadow-red-600/40',
    badgeBg: 'bg-red-600/15 border-red-500/30',
    textColor: 'text-red-400',
    pattern: patt.gridDots,
    icon: StackIcon,
    hoverAnim: 'badge-ico-sway',
  },
  foreign_movies: {
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    glow: 'shadow-blue-500/40',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    textColor: 'text-blue-400',
    pattern: patt.meridians,
    icon: GlobeIcon,
    hoverAnim: 'badge-ico-spin',
  },
  iranian_movies: {
    gradient: 'from-emerald-500 via-teal-600 to-emerald-700',
    glow: 'shadow-emerald-500/40',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    textColor: 'text-emerald-400',
    pattern: patt.clapStripes,
    icon: ClapperIcon,
    hoverAnim: 'badge-ico-clap',
  },
  indian_movies: {
    gradient: 'from-amber-500 via-yellow-600 to-orange-600',
    glow: 'shadow-amber-500/40',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    textColor: 'text-amber-400',
    pattern: patt.reelDots,
    icon: ReelIcon,
    hoverAnim: 'badge-ico-spin-rev',
  },
  foreign_series: {
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    glow: 'shadow-purple-500/40',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textColor: 'text-purple-400',
    pattern: patt.scanlines,
    icon: TvWaveIcon,
    hoverAnim: 'badge-ico-pulse',
  },
  iranian_series: {
    gradient: 'from-teal-500 via-cyan-600 to-emerald-600',
    glow: 'shadow-teal-500/40',
    badgeBg: 'bg-teal-500/15 border-teal-500/30',
    textColor: 'text-teal-400',
    pattern: patt.tiles,
    icon: TvTileIcon,
    hoverAnim: '',
  },
  turkish_series: {
    gradient: 'from-rose-500 via-red-600 to-pink-700',
    glow: 'shadow-rose-500/40',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    textColor: 'text-rose-400',
    pattern: patt.petals,
    icon: TulipIcon,
    hoverAnim: 'badge-ico-heart',
  },
  children: {
    gradient: 'from-pink-500 via-rose-500 to-purple-600',
    glow: 'shadow-pink-500/40',
    badgeBg: 'bg-pink-500/15 border-pink-500/30',
    textColor: 'text-pink-400',
    pattern: patt.confetti,
    icon: PaletteIcon,
    hoverAnim: 'badge-ico-wiggle',
  },
  children_series: {
    gradient: 'from-fuchsia-500 via-purple-600 to-indigo-600',
    glow: 'shadow-fuchsia-500/40',
    badgeBg: 'bg-fuchsia-500/15 border-fuchsia-500/30',
    textColor: 'text-fuchsia-400',
    pattern: patt.lattice,
    icon: GamepadIcon,
    hoverAnim: 'badge-ico-bounce',
  },
  series: {
    gradient: 'from-purple-500 to-indigo-600',
    glow: 'shadow-purple-500/35',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textColor: 'text-purple-400',
    pattern: patt.scanlines,
    icon: TvWaveIcon,
    hoverAnim: 'badge-ico-pulse',
  },
  kids_series: {
    gradient: 'from-purple-500 to-fuchsia-600',
    glow: 'shadow-fuchsia-500/35',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    textColor: 'text-fuchsia-400',
    pattern: patt.lattice,
    icon: GamepadIcon,
    hoverAnim: 'badge-ico-bounce',
  },
};

export const getCategoryVisual = (key: string): CategoryVisual => {
  return CATEGORY_ICONS[key] || {
    gradient: 'from-purple-600 to-indigo-600',
    glow: 'shadow-purple-600/35',
    badgeBg: 'bg-purple-600/15 border-purple-500/30',
    textColor: 'text-purple-400',
    pattern: patt.gridDots,
    icon: PopcornIcon,
    hoverAnim: 'badge-ico-wiggle',
  };
};

/* ============================================================================
   کامپوننت badge
   ============================================================================ */
interface CategoryIconBadgeProps {
  categoryKey: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withGlow?: boolean;
}

export const CategoryIconBadge: React.FC<CategoryIconBadgeProps> = ({
  categoryKey,
  size = 'md',
  className = '',
  withGlow = false,
}) => {
  const visual = getCategoryVisual(categoryKey);
  const Icon = visual.icon;

  const box =
    size === 'sm'
      ? 'w-7 h-7 rounded-[9px]'
      : size === 'lg'
        ? 'w-10 h-10 rounded-2xl'
        : 'w-8 h-8 rounded-xl';

  const ico =
    size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
        ? 'w-6 h-6'
        : 'w-[19px] h-[19px]';

  return (
    <div
      className={`group relative flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br ${visual.gradient} ${box} border border-white/25 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
        withGlow ? `shadow-lg ring-1 ring-white/20 ${visual.glow}` : ''
      } ${className}`}
    >
      {/* بافت موضوعی اختصاصی */}
      {visual.pattern}

      {/* براقیت شیشه‌ای بالایی */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

      {/* عمق سایه داخلی پایین */}
      <span className="absolute inset-0 shadow-[inset_0_-4px_7px_rgba(0,0,0,0.28)] pointer-events-none rounded-[inherit]" />

      {/* نقطه شناور برای سایز بزرگ (ردیف‌های صفحه اصلی) */}
      {size === 'lg' && (
        <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/80 animate-float pointer-events-none" />
      )}

      <Icon className={`relative z-10 ${ico} ${visual.hoverAnim}`} />
    </div>
  );
};

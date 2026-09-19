import React from 'react';
import { MovieService } from '../services/api';
import { AuthService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  ArrowRight, 
  Cloud, 
  BarChart3, 
  Database, 
  Info, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Heart,
  Film,
  Layers,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  User as UserIcon,
  LogIn,
  Users,
  Loader2
} from 'lucide-react';
import { apiFetch } from '../services/apiFetch';

interface SettingsScreenProps {
  onBack: () => void;
  movieCount: number;
  favoritesCount: number;
  onClearData: () => void;
  onResetDefaultData: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onAdminLogout?: () => void;
  onOpenChangePassword?: () => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenAuthModal?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  movieCount,
  favoritesCount,
  onClearData,
  onResetDefaultData,
  isAdmin = false,
  onOpenAdminLogin,
  onAdminLogout,
  onOpenChangePassword,
  showToast,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const [serverStatus, setServerStatus] = React.useState<'online' | 'offline' | 'checking'>('checking');
  const [showClearDialog, setShowClearDialog] = React.useState<boolean>(false);
  const [showResetDialog, setShowResetDialog] = React.useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = React.useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [passwordMsg, setPasswordMsg] = React.useState<{ text: string; error?: boolean } | null>(null);
  const [enrichStatus, setEnrichStatus] = React.useState<{ running: boolean; message: string }>({ running: false, message: '' });
  const [photoStats, setPhotoStats] = React.useState<{ stored: number; missing: number } | null>(null);
  const [photoStatus, setPhotoStatus] = React.useState<{ running: boolean; message: string }>({ running: false, message: '' });

  const loadPhotoStats = async () => {
    try {
      const j = await apiFetch('/api/actors/photo-stats').then(r => r.json());
      if (j.ok) setPhotoStats({ stored: j.stored, missing: j.missing });
    } catch { /* ignore */ }
  };

  React.useEffect(() => { if (isAdmin) loadPhotoStats(); }, [isAdmin]);

  const handleStoreActorPhotos = async () => {
    setPhotoStatus({ running: true, message: 'در حال ارسال درخواست...' });
    try {
      const token = localStorage.getItem('moviebrowser_admin_token') || '';
      const res = await apiFetch('/api/actors/store-photos', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      const j = await res.json();
      if (j.ok) {
        setPhotoStatus({
          running: false,
          message: `✅ شروع شد: ${j.total} بازیگر بدون عکس ذخیره‌شده. عکس‌ها از TMDB دانلود و روی سرور ذخیره می‌شوند (هر کدام کمتر از یک ثانیه).`
        });
        // refresh stats after a while
        setTimeout(loadPhotoStats, 20000);
        setTimeout(loadPhotoStats, 45000);
      } else {
        setPhotoStatus({ running: false, message: `❌ ${j.error || 'خطا در اجرا'}` });
      }
    } catch {
      setPhotoStatus({ running: false, message: '❌ خطا در ارتباط با سرور' });
    }
  };

  const handleEnrichActors = async () => {
    setEnrichStatus({ running: true, message: 'در حال ارسال درخواست...' });
    try {
      const token = localStorage.getItem('moviebrowser_admin_token') || '';
      const res = await apiFetch('/api/actors/enrich-missing', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      const j = await res.json();
      if (j.ok) {
        setEnrichStatus({
          running: false,
          message: `✅ شروع شد: ${j.total_missing} بازیگر بدون بیوگرافی پیدا شد. بیوگرافی‌ها به مرور ساخته می‌شوند (هر کدام چند ثانیه).`
        });
      } else {
        setEnrichStatus({ running: false, message: `❌ ${j.error || 'خطا در اجرا'}` });
      }
    } catch {
      setEnrichStatus({ running: false, message: '❌ خطا در ارتباط با سرور' });
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    MovieService.checkHealth().then((res) => {
      if (isMounted) {
        setServerStatus(res.ok ? 'online' : 'offline');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AuthService.changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ text: 'رمز عبور مدیریت با موفقیت تغییر یافت' });
      setCurrentPassword('');
      setNewPassword('');
      if (showToast) showToast('رمز عبور مدیریت تغییر یافت', 'success');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordMsg(null);
      }, 1500);
    } else {
      setPasswordMsg({ text: res.error || 'خطا در تغییر رمز', error: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white pb-24 md:pb-12 animate-fade-in">
      
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#141420]/90 backdrop-blur-md border-b border-[#2A2A40] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="settings-back-button"
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1C1C2E] hover:bg-[#242438] text-[#A0A0B5] hover:text-white border border-[#2A2A40] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#A0A0B5]" />
            <h1 className="font-extrabold text-lg sm:text-xl text-white">
              تنظیمات برنامه
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        
        {/* User Account & Cloud Persistence Card */}
        <div className={`border rounded-3xl p-6 shadow-xl transition-all ${
          user 
            ? 'bg-gradient-to-br from-[#122026] via-[#141C2B] to-[#121620] border-[#00D4FF]/40 shadow-[#00D4FF]/5' 
            : 'bg-[#1C1C2E] border-[#2A2A40]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {user ? (
                user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'کاربر'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#00D4FF]/40 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7928CA] flex items-center justify-center text-white text-lg font-black shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}

              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>حساب کاربری و همگام‌سازی ابری</span>
                  {user ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      متصل
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2A2A44] text-[#A0A0B5] border border-[#3A3A55]">
                      مهمان
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#A0A0B5] mt-1">
                  {user 
                    ? `وارد شده با: ${user.email || user.displayName} • لیست پیگیری شما به صورت امن و ابری ذخیره می‌شود.`
                    : 'با ساخت حساب کاربری با گوگل یا ایمیل، پیگیری‌ها و واچ‌لیست شما در سرور ابری ذخیره خواهد شد.'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                onClick={async () => {
                  await logout();
                  if (showToast) showToast('از حساب کاربری خارج شدید', 'info');
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            ) : (
              onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7928CA] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#00D4FF]/20 transition-all hover:scale-105 shrink-0 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ورود یا ثبت‌نام کاربر</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Admin Access & Authentication Card */}
        <div className={`border rounded-3xl p-6 shadow-xl transition-all ${
          isAdmin 
            ? 'bg-gradient-to-br from-[#151D2A] via-[#141B26] to-[#121620] border-emerald-500/40 shadow-emerald-950/20' 
            : 'bg-[#1C1C2E] border-[#2A2A40]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#2A2A40]">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isAdmin 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>سطح دسترسی و مدیریت</span>
                  {isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      مدیر کل سیستم
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2A2A44] text-[#A0A0B5] border border-[#3A3A55]">
                      کاربر مهمان
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#A0A0B5] mt-1">
                  {isAdmin 
                    ? 'شما به عنوان مدیر احراز هویت شده‌اید و دسترسی کامل به افزودن، ویرایش و حذف فیلم‌ها دارید.' 
                    : 'در حالت کاربر عادی، دکمه‌های افزودن، ویرایش و حذف فیلم‌ها پنهان هستند.'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <button
                id="settings-admin-logout-btn"
                onClick={onAdminLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب مدیریت</span>
              </button>
            ) : (
              onOpenAdminLogin && (
                <button
                  id="settings-admin-login-btn"
                  onClick={onOpenAdminLogin}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-red-600 hover:from-red-600 hover:to-[#E50914] text-white font-bold text-xs shadow-lg shadow-red-600/25 transition-all hover:scale-105 shrink-0"
                >
                  <Lock className="w-4 h-4" />
                  <span>ورود به حساب ادمین</span>
                </button>
              )
            )}
          </div>

          {/* Admin Tools If Logged In */}
          {isAdmin && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#A0A0B5] font-medium">امنیت رمز عبور مدیریت:</span>
                <div className="flex items-center gap-2">
                  {onOpenChangePassword && (
                    <button
                      id="settings-open-change-pwd-modal-btn"
                      onClick={onOpenChangePassword}
                      className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>پنجره اختصاصی تغییر رمز</span>
                    </button>
                  )}
                  <button
                    id="toggle-change-pwd-btn"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-xs text-[#A0A0B5] hover:text-white flex items-center gap-1 font-bold px-2 py-1"
                  >
                    <span>{showChangePassword ? 'بستن فرم سریع' : 'فرم سریع'}</span>
                  </button>
                </div>
              </div>

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="bg-[#121624] p-4 rounded-2xl border border-[#2A2A44] space-y-3 mt-3 animate-fade-in">
                  {passwordMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold ${
                      passwordMsg.error ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A0B5] mb-1">رمز عبور فعلی</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="رمز عبور فعلی..."
                        className="w-full bg-[#1A1E30] text-white text-xs rounded-xl px-3 py-2 border border-[#2E3450] focus:border-[#00D4FF] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A0B5] mb-1">رمز عبور جدید</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="حداقل ۴ کاراکتر..."
                        className="w-full bg-[#1A1E30] text-white text-xs rounded-xl px-3 py-2 border border-[#2E3450] focus:border-[#00D4FF] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#00D4FF] hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                  >
                    ذخیره رمز جدید
                  </button>
                </form>
              )}

              {/* Actor Bio Enrichment Tool */}
              <div className="bg-[#121624] p-4 rounded-2xl border border-[#2A2A44] mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-[#A0A0B5] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#00D4FF]" />
                    بیوگرافی بازیگرها:
                  </span>
                  <button
                    id="settings-enrich-actors-btn"
                    onClick={handleEnrichActors}
                    disabled={enrichStatus.running}
                    className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {enrichStatus.running
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{enrichStatus.running ? 'در حال اجرا...' : 'ساخت بیوگرافی بازیگرهای فاقد بیو'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#6E6E88]">
                  با هوش مصنوعی برای همه بازیگرانی که هنوز بیوگرافی ندارند بیوگرافی فارسی ساخته می‌شود.
                </p>
                {enrichStatus.message && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs font-bold ${
                    enrichStatus.message.startsWith('✅')
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  }`}>
                    {enrichStatus.message}
                  </div>
                )}
              </div>

              {/* Actor Photo Storage Tool */}
              <div className="bg-[#121624] p-4 rounded-2xl border border-[#2A2A44] mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-[#A0A0B5] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    عکس بازیگرها:
                  </span>
                  <button
                    id="settings-store-actor-photos-btn"
                    onClick={handleStoreActorPhotos}
                    disabled={photoStatus.running}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {photoStatus.running
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Film className="w-3.5 h-3.5" />}
                    <span>{photoStatus.running ? 'در حال دانلود...' : 'دانلود و ذخیره عکس بازیگرها روی سرور'}</span>
                  </button>
                </div>
                {photoStats && (
                  <p className="text-[11px] text-[#6E6E88] mb-1">
                    ذخیره‌شده: <b className="text-emerald-400">{photoStats.stored}</b> —
                    بدون عکس: <b className="text-amber-400">{photoStats.missing}</b>
                  </p>
                )}
                <p className="text-[11px] text-[#6E6E88]">
                  پرتره‌های واقعی از TMDB دانلود و روی سرور ذخیره می‌شوند تا جای placeholderهای حروف اول بنشینند.
                </p>
                {photoStatus.message && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs font-bold ${
                    photoStatus.message.startsWith('✅')
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  }`}>
                    {photoStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Server Info Card */}
        <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 flex items-center justify-center text-[#E50914]">
              <Cloud className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">اطلاعات سرور و ارتباط</h2>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-[#2A2A40]">
              <span className="text-[#A0A0B5]">وضعیت اتصال سرور:</span>
              {serverStatus === 'checking' ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>در حال بررسی...</span>
                </span>
              ) : serverStatus === 'online' ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متصل و فعال</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>حالت آفلاین (مخزن محلی فعال)</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#2A2A40]">
              <span className="text-[#A0A0B5]">آدرس دامنه مرجع:</span>
              <span className="text-[#00D4FF] font-mono text-xs font-semibold" dir="ltr">
                movie.movieney.ir
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-[#A0A0B5]">فناوری سینک:</span>
              <span className="text-white text-xs font-medium">
                ذخیره‌سازی هوشمند محلی + بروزرسانی در پس‌زمینه
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center text-[#8B5CF6]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">آمار و اطلاعات محتوا</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-4 text-center">
              <Film className="w-5 h-5 mx-auto mb-2 text-[#E50914]" />
              <span className="text-2xl font-black text-[#E50914] block">{movieCount}</span>
              <span className="text-xs text-[#A0A0B5] mt-1 block">فیلم و سریال</span>
            </div>

            <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-4 text-center">
              <Layers className="w-5 h-5 mx-auto mb-2 text-[#00D4FF]" />
              <span className="text-2xl font-black text-[#00D4FF] block">8</span>
              <span className="text-xs text-[#A0A0B5] mt-1 block">دسته‌بندی</span>
            </div>

            <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-4 text-center">
              <Heart className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <span className="text-2xl font-black text-rose-500 block">{favoritesCount}</span>
              <span className="text-xs text-[#A0A0B5] mt-1 block">علاقه‌مندی‌ها</span>
            </div>

            <div className="bg-[#141420] border border-[#2A2A40] rounded-2xl p-4 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-[#FFB800]" />
              <span className="text-2xl font-black text-[#FFB800] block">4K / HD</span>
              <span className="text-xs text-[#A0A0B5] mt-1 block">کیفیت برتر</span>
            </div>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">مدیریت داده‌ها و حافظه کش</h2>
          </div>

          <p className="text-xs sm:text-sm text-[#A0A0B5] mb-5 leading-relaxed">
            {isAdmin 
              ? 'شما به عنوان مدیر می‌توانید حافظه محلی ذخیره‌شده را پاک کنید یا به پایگاه داده اولیه فیلم‌ها بازگردانید.' 
              : 'دسترسی پاک‌سازی و بازنشانی دیتابیس نیازمند ورود به حساب مدیریت است.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="clear-all-data-btn"
              onClick={() => {
                if (isAdmin) {
                  setShowClearDialog(true);
                } else if (onOpenAdminLogin) {
                  onOpenAdminLogin();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>پاک کردن تمام داده‌های ذخیره‌شده</span>
            </button>

            <button
              id="reset-default-data-btn"
              onClick={() => {
                if (isAdmin) {
                  setShowResetDialog(true);
                } else if (onOpenAdminLogin) {
                  onOpenAdminLogin();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#242438] hover:bg-[#2C2C45] border border-[#3A3A55] text-white font-semibold text-xs sm:text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#00D4FF]" />
              <span>بازنشانی به داده‌های پیش‌فرض</span>
            </button>
          </div>
        </div>

        {/* About App Card */}
        <div className="bg-[#1C1C2E] border border-[#2A2A40] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">درباره برنامه فیلم بره</h2>
          </div>

          <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-[#A0A0B5]">
            <div className="flex items-center justify-between py-1">
              <span>نسخه برنامه:</span>
              <span className="text-white font-bold">1.0.0 (Web & Mobile PWA)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>نام تجاری:</span>
              <span className="text-white font-bold">فیلم بره (MovieBrowser)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>طراحی و بازنویسی:</span>
              <span className="text-[#00D4FF] font-medium">React + TypeScript + Tailwind CSS</span>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog for Clear Data */}
      {showClearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C2E] border border-[#3A3A55] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">پاک کردن تمام داده‌ها</h3>
            <p className="text-xs text-[#A0A0B5] mb-6 leading-relaxed">
              آیا مطمئن هستید؟ تمام لیست فیلم‌ها و وضعیت پیگیری‌ها پاک خواهند شد.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#242438] text-xs font-semibold text-[#A0A0B5] hover:text-white"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  onClearData();
                  setShowClearDialog(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
              >
                بله، پاک کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Reset Default Data */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C2E] border border-[#3A3A55] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] mx-auto flex items-center justify-center mb-4">
              <RefreshCw className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">بازنشانی داده‌های پیش‌فرض</h3>
            <p className="text-xs text-[#A0A0B5] mb-6 leading-relaxed">
              آرشیو فیلم‌ها و سریال‌های برگزیده مجدداً بارگذاری خواهد شد.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#242438] text-xs font-semibold text-[#A0A0B5] hover:text-white"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  onResetDefaultData();
                  setShowResetDialog(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-cyan-500 text-xs font-bold text-black shadow-lg shadow-cyan-500/30"
              >
                بازنشانی
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


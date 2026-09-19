import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/authService';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  LogIn, 
  UserPlus,
  Shield,
  ShieldCheck
} from 'lucide-react';

export type AuthModalMode = 'signin' | 'signup' | 'admin' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
  onSuccess?: () => void;
  onAdminSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
  onAdminSuccess
}) => {
  const { 
    signUpWithEmail, 
    signInWithEmail, 
    resetPassword, 
    error, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  // Admin Login specific states
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [localMessage, setLocalMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      clearError();
      setLocalMessage(null);
      setResetSent(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleTabChange = (newMode: AuthModalMode) => {
    setMode(newMode);
    clearError();
    setLocalMessage(null);
    setResetSent(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setLoading(true);

    const result = await AuthService.login(adminUsername.trim(), adminPassword);
    setLoading(false);

    if (result.success) {
      setLocalMessage({ text: 'ورود به عنوان مدیر با موفقیت انجام شد.', type: 'success' });
      setTimeout(() => {
        onAdminSuccess?.();
        onSuccess?.();
        onClose();
      }, 400);
    } else {
      setLocalMessage({ text: result.error || 'نام کاربری یا رمز عبور مدیریت اشتباه است.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalMessage(null);

    if (mode === 'admin') {
      handleAdminSubmit(e);
      return;
    }

    if (!email.trim()) {
      setLocalMessage({ text: 'لطفاً آدرس ایمیل خود را وارد نمایید.', type: 'error' });
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setResetSent(true);
        setLocalMessage({ text: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق ورودی و پوشه اسپم را بررسی کنید.', type: 'success' });
      } catch {
        // Handled in context
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setLocalMessage({ text: 'لطفاً رمز عبور را وارد نمایید.', type: 'error' });
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalMessage({ text: 'رمز عبور باید حداقل ۶ کاراکتر باشد.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
        onSuccess?.();
        onClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        onSuccess?.();
        onClose();
      }
    } catch {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#131320] border border-[#2A2A42] rounded-3xl shadow-2xl overflow-hidden text-right flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration bar */}
        <div className={`h-1.5 w-full ${
          mode === 'admin' 
            ? 'bg-gradient-to-r from-red-600 via-amber-500 to-purple-600'
            : 'bg-gradient-to-r from-[#00D4FF] via-[#7928CA] to-[#FF0080]'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-[#1F1F33] text-[#A0A0B5] hover:text-white hover:bg-[#2A2A48] transition-colors z-10 cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 overflow-y-auto">
          {/* Modal Header */}
          <div className="text-center mb-5">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              mode === 'admin'
                ? 'bg-gradient-to-br from-red-600/30 to-purple-600/30 border border-red-500/40 text-rose-400 shadow-red-500/10'
                : 'bg-gradient-to-br from-[#00D4FF]/20 to-[#7928CA]/20 border border-[#00D4FF]/30 text-[#00D4FF] shadow-[#00D4FF]/10'
            }`}>
              {mode === 'signin' && <LogIn className="w-7 h-7" />}
              {mode === 'signup' && <UserPlus className="w-7 h-7" />}
              {mode === 'admin' && <Shield className="w-7 h-7 text-rose-400" />}
              {mode === 'forgot' && <KeyRound className="w-7 h-7 text-amber-400" />}
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {mode === 'signin' && 'ورود به حساب کاربری'}
              {mode === 'signup' && 'ساخت حساب کاربری جدید'}
              {mode === 'admin' && 'ورود به پنل مدیریت فیلم بره'}
              {mode === 'forgot' && 'بازیابی رمز عبور'}
            </h2>
            <p className="text-xs text-[#8E8EA8] mt-1 leading-relaxed">
              {mode === 'signin' && 'برای همگام‌سازی لیست پیگیری و ذخیره ابری وارد شوید'}
              {mode === 'signup' && 'یک حساب شخصی بسازید تا آرشیو و پیشرفت تماشایتان ذخیره شود'}
              {mode === 'admin' && 'دسترسی مدیریت جهت ویرایش فیلم‌ها، بیوگرافی و اطلاعات بازیگران'}
              {mode === 'forgot' && 'ایمیل خود را وارد کنید تا لینک تغییر رمز برایتان ارسال شود'}
            </p>
          </div>

          {/* Unified Mode Switch Tabs */}
          <div className="grid grid-cols-3 p-1 bg-[#181829] rounded-2xl border border-[#27273F] mb-5 gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#00D4FF] to-[#0099FF] text-black shadow-md'
                  : 'text-[#A0A0B5] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود کاربر</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#7928CA] to-[#B800FF] text-white shadow-md'
                  : 'text-[#A0A0B5] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ثبت‌نام</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-md'
                  : 'text-[#A0A0B5] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-300" />
              <span>ورود ادمین</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {(error || localMessage) && (
            <div className={`p-3 rounded-2xl mb-4 text-xs flex items-start gap-2 border ${
              (localMessage?.type === 'success' || resetSent)
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
            }`}>
              {(localMessage?.type === 'success' || resetSent) ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{localMessage?.text || error}</span>
            </div>
          )}

          {/* FORM: ADMIN MODE */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1D1E0] mb-1.5">
                  نام کاربری مدیر
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#71718E]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full pr-10 pl-4 py-2.5 bg-[#181829] border border-[#2A2A42] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-xs text-white placeholder-[#5A5A72] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D1E0] mb-1.5">
                  رمز عبور مدیریت
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#71718E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10 pl-10 py-2.5 bg-[#181829] border border-[#2A2A42] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-xs text-white placeholder-[#5A5A72] outline-none transition-colors text-left font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#71718E] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ورود به پنل مدیریت</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM: USER MODES (SIGNIN / SIGNUP / FORGOT) */}
          {mode !== 'admin' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (Only on Registration) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D1D1E0] mb-1.5">
                    نام و نام خانوادگی یا نام مستعار
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#71718E]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full pr-10 pl-4 py-2.5 bg-[#181829] border border-[#2A2A42] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl text-xs text-white placeholder-[#5A5A72] outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-[#D1D1E0] mb-1.5">
                  آدرس ایمیل
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#71718E]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pr-10 pl-4 py-2.5 bg-[#181829] border border-[#2A2A42] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl text-xs text-white placeholder-[#5A5A72] outline-none transition-colors text-left font-mono"
                  />
                </div>
              </div>

              {/* Password Field (Only for Sign in and Sign up) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#D1D1E0]">
                      رمز عبور
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('forgot')}
                        className="text-[11px] text-[#00D4FF] hover:underline cursor-pointer"
                      >
                        فراموشی رمز عبور؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#71718E]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pr-10 pl-10 py-2.5 bg-[#181829] border border-[#2A2A42] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl text-xs text-white placeholder-[#5A5A72] outline-none transition-colors text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#71718E] hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-[10px] text-[#71718E] mt-1">حداقل ۶ کاراکتر شامل حروف و اعداد</p>
                  )}
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-[#00D4FF] to-[#0077FF] text-black hover:opacity-95 shadow-[#00D4FF]/20'
                    : mode === 'signup'
                    ? 'bg-gradient-to-r from-[#7928CA] to-[#B800FF] text-white hover:opacity-95 shadow-[#7928CA]/20'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-95 shadow-amber-500/20'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'ورود به حساب'}
                      {mode === 'signup' && 'تکمیل ثبت‌نام و ساخت حساب'}
                      {mode === 'forgot' && 'ارسال لینک بازیابی رمز عبور'}
                    </span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          {mode === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('signin')}
                className="text-xs text-[#00D4FF] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>بازگشت به صفحه ورود</span>
              </button>
            </div>
          )}

          {/* Security Guarantee Badge */}
          <div className="mt-5 pt-3 border-t border-[#1F1F33] flex items-center justify-center gap-1.5 text-[11px] text-[#6E6E8A]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>اطلاعات شما با پروتکل رمزگذاری امن ابری محافظت می‌شود</span>
          </div>
        </div>
      </div>
    </div>
  );
};

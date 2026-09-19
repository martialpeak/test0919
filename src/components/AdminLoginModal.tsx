import React from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  X, 
  LogIn, 
  AlertCircle, 
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { AuthService } from '../services/authService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setPassword('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await AuthService.login(username, password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 600);
    } else {
      setError(result.error || 'نام کاربری یا رمز عبور نامعتبر است');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-[#141422] border border-[#2A2A44] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-admin-modal-btn"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-[#7E7E98] hover:text-white hover:bg-[#1E1E34] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E50914] to-[#8B5CF6] flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-red-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">
            ورود به پنل مدیریت فیلم بره
          </h2>
          <p className="text-xs text-[#9595B0] mt-1.5 leading-relaxed">
            جهت افزودن، ویرایش، حذف فیلم‌ها و تغییرات سیستمی وارد شوید.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ورود با موفقیت انجام شد. دسترسی‌های مدیریت فعال شدند.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
              نام کاربری مدیر
            </label>
            <div className="relative">
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-4 pr-10 py-3 border border-[#2E2E48] focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all placeholder:text-[#555570]"
                required
              />
              <User className="absolute right-3.5 top-3.5 w-4 h-4 text-[#757590]" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور مدیریت..."
                className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-11 pr-10 py-3 border border-[#2E2E48] focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all placeholder:text-[#555570]"
                required
              />
              <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#757590]" />
              <button
                type="button"
                id="toggle-admin-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3.5 text-[#757590] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Helper note removed — passwords are now managed server-side */}

          {/* Submit Button */}
          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading || success}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E50914] to-red-600 hover:from-red-600 hover:to-[#E50914] text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>ورود به عنوان مدیر</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-5 text-center text-[10px] text-[#606078] flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-500/70" />
          <span>امکانات ویرایش، افزودن و حذف محتوا فقط برای مدیر سایت قابل مشاهده است.</span>
        </div>
      </div>
    </div>
  );
};

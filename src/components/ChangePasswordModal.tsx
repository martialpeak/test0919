import React from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Save, 
  Shield,
  Sparkles
} from 'lucide-react';
import { AuthService } from '../services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', text: '' };
    let score = 0;
    if (pass.length >= 4) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'خیلی ضعیف', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'ضعیف', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'متوسط', color: 'bg-yellow-500', text: 'text-yellow-400' };
    if (score === 4) return { score: 4, label: 'قوی', color: 'bg-emerald-500', text: 'text-emerald-400' };
    return { score: 5, label: 'فوق‌العاده امن', color: 'bg-cyan-400', text: 'text-cyan-300' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('لطفاً رمز عبور فعلی را وارد کنید');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setError('رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('تکرار رمز عبور جدید با رمز وارد شده مطابقت ندارد');
      return;
    }

    setLoading(true);
    const res = await AuthService.changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(res.error || 'خطا در تغییر رمز عبور');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-[#141422] border border-[#2A2A44] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-change-pwd-modal"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-[#7E7E98] hover:text-white hover:bg-[#1E1E34] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00D4FF] to-blue-600 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-cyan-500/25">
            <KeyRound className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-xl font-black text-white">
            تغییر رمز عبور مدیریت
          </h2>
          <p className="text-xs text-[#9595B0] mt-1.5 leading-relaxed">
            جهت حفظ امنیت پنل مدیریت، رمز عبور جدید خود را با دقت تنظیم کنید.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>رمز عبور مدیریت با موفقیت به‌روزرسانی شد.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
              رمز عبور فعلی
            </label>
            <div className="relative">
              <input
                id="current-password-input"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی..."
                className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-11 pr-10 py-2.5 border border-[#2E2E48] focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF] transition-all"
                required
              />
              <Lock className="absolute right-3.5 top-3 w-4 h-4 text-[#757590]" />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3.5 top-3 text-[#757590] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#A8A8C0]">
                رمز عبور جدید
              </label>
              {strength.label && (
                <span className={`text-[11px] font-bold ${strength.text} flex items-center gap-1`}>
                  <Sparkles className="w-3 h-3" />
                  {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="new-password-input"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۴ کاراکتر..."
                className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-11 pr-10 py-2.5 border border-[#2E2E48] focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF] transition-all"
                required
              />
              <KeyRound className="absolute right-3.5 top-3 w-4 h-4 text-[#757590]" />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3.5 top-3 text-[#757590] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      lvl <= strength.score ? strength.color : 'bg-[#222238]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
              تکرار رمز عبور جدید
            </label>
            <div className="relative">
              <input
                id="confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور جدید..."
                className={`w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-11 pr-10 py-2.5 border focus:outline-none focus:ring-1 transition-all ${
                  confirmPassword && confirmPassword !== newPassword 
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500' 
                    : 'border-[#2E2E48] focus:border-[#00D4FF] focus:ring-[#00D4FF]'
                }`}
                required
              />
              <Shield className="absolute right-3.5 top-3 w-4 h-4 text-[#757590]" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3.5 top-3 text-[#757590] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">رمزها با هم همخوانی ندارند</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="save-new-password-btn"
            disabled={loading || success}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>ذخیره و فعال‌سازی رمز جدید</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

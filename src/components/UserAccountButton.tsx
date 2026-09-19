import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  LogOut, 
  Cloud, 
  ChevronDown, 
  Tv,
  Shield
} from 'lucide-react';

interface UserAccountButtonProps {
  onOpenAuthModal: () => void;
  onOpenTracking?: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
}

export const UserAccountButton: React.FC<UserAccountButtonProps> = ({
  onOpenAuthModal,
  onOpenTracking,
  isAdmin = false,
  onOpenAdminLogin
}) => {
  const { user, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 to-[#7928CA]/20 hover:from-[#00D4FF]/30 hover:to-[#7928CA]/30 text-[#00D4FF] hover:text-white border border-[#00D4FF]/40 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm shadow-[#00D4FF]/10"
        title="ورود یا ساخت حساب کاربری"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">ورود / حساب</span>
      </button>
    );
  }

  // Get user display name or first part of email
  const displayName = user.displayName || user.email?.split('@')[0] || 'کاربر';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#1A1A2E] hover:bg-[#23233D] border border-[#2F2F4A] transition-all cursor-pointer group"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#00D4FF]/50"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7928CA] flex items-center justify-center text-white text-xs font-black shadow-sm">
            {initial}
          </div>
        )}

        <div className="hidden lg:flex flex-col text-right min-w-[70px] max-w-[120px]">
          <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#00D4FF] transition-colors">
            {displayName}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ابری</span>
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#8E8EA8] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[#141424] border border-[#2A2A44] rounded-2xl shadow-2xl p-2.5 z-50 text-right animate-fadeIn">
          {/* User Info Header */}
          <div className="p-2.5 bg-[#1C1C30] rounded-xl border border-[#272740] mb-2">
            <div className="flex items-center gap-2.5 mb-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#00D4FF]/40"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#7928CA] flex items-center justify-center text-white text-sm font-black">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white truncate block">{displayName}</span>
                </div>
                <span className="text-[10px] text-[#8E8EA8] truncate block font-mono text-left" dir="ltr">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Cloud Sync Active Indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1 border-t border-[#26263D]">
              <Cloud className="w-3.5 h-3.5" />
              <span>لیست پیگیری شما در فضای ابری ذخیره می‌شود</span>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-1">
            {onOpenTracking && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenTracking();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#D1D1E0] hover:text-white hover:bg-[#202038] transition-colors cursor-pointer"
              >
                <Tv className="w-4 h-4 text-[#8B5CF6]" />
                <span>لیست پیگیری شخصی من</span>
              </button>
            )}

            {!isAdmin && onOpenAdminLogin && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenAdminLogin();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>ورود به پنل مدیریت (ادمین)</span>
              </button>
            )}

            <button
              onClick={async () => {
                setDropdownOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

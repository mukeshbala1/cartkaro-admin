// src/components/Topbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { adminName, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-20 shrink-0 flex items-center justify-between gap-4 px-5 lg:px-8 bg-white/80 backdrop-blur-md border-b border-ink-100 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-navy-800 hover:bg-ink-100 transition-colors focus-ring"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-bold text-navy-900 text-lg sm:text-xl truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-ink-100 transition-colors focus-ring"
        >
          <span className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center text-navy-900 font-display font-bold text-sm shadow-soft">
            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-navy-900">
              {adminName || 'Admin'}
            </span>
            <span className="text-[11px] text-ink-500">{role || 'Admin'}</span>
          </span>
          <ChevronDown size={16} className="hidden sm:block text-ink-400" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lift ring-1 ring-ink-100 py-1.5 animate-fadeUp origin-top-right">
            <div className="px-3.5 py-2.5 border-b border-ink-100">
              <p className="text-sm font-semibold text-navy-900 truncate">
                {adminName || 'Admin'}
              </p>
              <p className="text-xs text-ink-500">CartKaro Admin</p>
            </div>
            <button
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink-600 hover:bg-ink-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <UserCircle2 size={16} />
              My Profile
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

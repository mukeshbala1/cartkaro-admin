// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Store,
  Bike,
  Settings,
  Lock,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/customer-management', label: 'Customer Management', icon: Users, comingSoon: true },
  { to: '/partner-hub', label: 'Partner Hub', icon: Store },
  { to: '/delivery-management', label: 'Delivery Management', icon: Bike, comingSoon: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 bg-navy-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 px-6 py-7">
        <img
          src="/logo.png"
          alt="CartKaro"
          className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1.5 ring-1 ring-white/10"
        />
        <div>
          <p className="font-display font-bold text-white text-lg leading-tight">
            CartKaro
          </p>
          <p className="text-[11px] tracking-wide uppercase text-gold-300/80 font-medium">
            Admin Panel
          </p>
        </div>
      </div>

      <nav className="relative z-10 flex-1 px-4 mt-2 space-y-1.5">
        {navItems.map(({ to, label, icon: Icon, end, comingSoon }) => {
          if (comingSoon) {
            return (
              <div
                key={label}
                title="Coming soon"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-ink-400/70 cursor-not-allowed select-none"
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={2} />
                  <span className="text-sm font-medium">{label}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-white/5 text-ink-300/70 px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  Soon
                </span>
              </div>
            );
          }

          return (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-white shadow-glow-gold ring-1 ring-gold-400/30'
                    : 'text-ink-200/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={isActive ? 'text-gold-300' : 'text-ink-300 group-hover:text-gold-200'}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulseSoft" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="relative z-10 m-4 p-4 rounded-xl2 bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-gold-300">
          <ShieldCheck size={16} />
          <span className="text-xs font-semibold">Partner Hub Active</span>
        </div>
        <p className="text-[11px] text-ink-300/80 mt-1.5 leading-relaxed">
          Customer &amp; Delivery modules are coming soon to this ecosystem.
        </p>
      </div>
    </aside>
  );
}

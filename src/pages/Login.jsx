// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-navy-gradient px-4">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 bg-aurora" />
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold-500/20 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-navy-500/30 blur-3xl"
        animate={{ y: [0, -24, 0], x: [0, -16, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Faint grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-[1.75rem] bg-white/[0.07] backdrop-blur-2xl ring-1 ring-white/15 shadow-lift p-8 sm:p-10">
          {/* Logo + heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-gold-300/30 p-2.5 shadow-glow-gold mb-5"
            >
              <img src="/logo.png" alt="CartKaro" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="font-display font-extrabold text-2xl text-white">
              CartKaro <span className="gold-text-gradient">Admin</span>
            </h1>
            <p className="text-ink-300 text-sm mt-1.5">
              Sign in to manage the CartKaro ecosystem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-200 mb-1.5 tracking-wide uppercase">
                Admin email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-white/[0.06] text-white placeholder:text-ink-400 rounded-xl pl-11 pr-4 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-gold-400/70 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-200 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white/[0.06] text-white placeholder:text-ink-400 rounded-xl pl-11 pr-11 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-gold-400/70 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-danger-500 bg-danger-50/10 ring-1 ring-danger-500/30 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full relative overflow-hidden flex items-center justify-center gap-2 bg-gold-gradient text-navy-900 font-display font-bold py-3 rounded-xl shadow-glow-gold transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <span className="absolute inset-0 shimmer-bg animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-navy-900/30 border-t-navy-900 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 justify-center mt-7 text-ink-400 text-xs">
            <ShieldCheck size={14} className="text-gold-300" />
            Invite-only access · Admins only
          </div>
        </div>

        <p className="text-center text-ink-400 text-xs mt-6">
          © {new Date().getFullYear()} CartKaro. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

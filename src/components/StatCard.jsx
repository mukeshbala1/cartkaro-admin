// src/components/StatCard.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = null;
    const numericTarget = Number(target) || 0;
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * numericTarget));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(numericTarget);
    }
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function StatCard({ label, value, icon: Icon, tone = 'navy', delay = 0 }) {
  const count = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'number' ? count : value;

  const tones = {
    navy: 'from-navy-700 to-navy-900 text-white',
    gold: 'from-gold-400 to-gold-600 text-navy-900',
    light: 'bg-white text-navy-900',
  };

  const isSolid = tone !== 'light';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className={`relative overflow-hidden rounded-xl2 p-5 shadow-card ring-1 ${
        isSolid
          ? `bg-gradient-to-br ${tones[tone]} ring-black/5`
          : `${tones.light} ring-ink-100`
      }`}
    >
      {isSolid && (
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
      )}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              isSolid ? 'opacity-80' : 'text-ink-500'
            }`}
          >
            {label}
          </p>
          <p className="font-display font-bold text-2xl sm:text-3xl mt-2">
            {display}
          </p>
        </div>
        {Icon && (
          <div
            className={`p-2.5 rounded-xl ${
              isSolid ? 'bg-white/15' : 'bg-navy-50 text-navy-700'
            }`}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

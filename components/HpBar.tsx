import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HpBarProps {
  value: number;
  max: number;
  accent: string;
  label: string;
}

interface FloatingHit {
  id: number;
  amount: number;
}

const ACCENT_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#fb7185',
  emerald: '#34d399',
};

function accentHex(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? '#22d3ee';
}

export function HpBar({ value, max, accent, label }: HpBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.max(0, Math.min(value, safeMax));
  const pct = (clamped / safeMax) * 100;
  const hex = accentHex(accent);

  const prevRef = useRef(clamped);
  const [hits, setHits] = useState<FloatingHit[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    const delta = clamped - prev;
    prevRef.current = clamped;
    if (delta < 0) {
      const id = Date.now() + Math.random();
      const amount = Math.round(Math.abs(delta));
      if (amount > 0) {
        setHits((h) => [...h, { id, amount }]);
        window.setTimeout(() => {
          setHits((h) => h.filter((x) => x.id !== id));
        }, 1100);
      }
    }
  }, [clamped]);

  // Bar shifts toward red as HP drains.
  const low = pct < 30;
  const fillColor = low ? '#ef4444' : hex;

  return (
    <div className="relative w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:text-xs">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-white/70 sm:text-sm">
          {Math.round(clamped)}
          <span className="text-white/30">/{safeMax}</span>
        </span>
      </div>

      <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-inner sm:h-4">
        {/* subtle inner track sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <motion.div
          className="relative h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${fillColor}, ${fillColor}cc)`,
            boxShadow: `0 0 12px ${fillColor}aa, inset 0 0 8px rgba(255,255,255,0.25)`,
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* moving shimmer */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>

      {/* Floating damage numbers */}
      <div className="pointer-events-none absolute right-1 top-4 z-20">
        <AnimatePresence>
          {hits.map((hit) => (
            <motion.span
              key={hit.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -34, scale: 1.15 }}
              exit={{ opacity: 0, y: -52, scale: 0.9 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute right-0 select-none whitespace-nowrap font-mono text-lg font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-2xl"
              style={{ color: low ? '#fca5a5' : hex, textShadow: `0 0 16px ${hex}` }}
            >
              -{hit.amount}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

const MAX = 600;

export function AnswerInput({ onSubmit, disabled }: AnswerInputProps) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const canSubmit = !disabled && trimmed.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed);
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`group relative rounded-2xl border bg-black/40 backdrop-blur transition-colors ${
          disabled ? 'border-white/5 opacity-60' : 'border-white/10 focus-within:border-cyan-400/50'
        }`}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX))}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={3}
          placeholder={disabled ? 'The investor is thinking…' : 'Defend your idea. Be specific — vague answers cost you credibility.'}
          className="w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none sm:text-base"
        />
        <div className="flex items-center justify-between gap-3 px-4 pb-3">
          <span className="hidden text-[11px] text-white/30 sm:block">
            Press{' '}
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
              ⌘ / Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
              Enter
            </kbd>{' '}
            to fire back
          </span>
          <span className="font-mono text-[11px] tabular-nums text-white/30 sm:hidden">
            {value.length}/{MAX}
          </span>
          <motion.button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.03 } : undefined}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
            className={`relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black shadow-[0_0_24px_rgba(34,211,238,0.45)]'
                : 'cursor-not-allowed bg-white/5 text-white/30'
            }`}
          >
            {disabled ? 'Awaiting…' : 'Counter'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

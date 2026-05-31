import React, { useState } from 'react';
import { sfx } from '../lib/sfx';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

const MAX = 600;

/**
 * Retro arcade terminal input. Same contract (onSubmit + disabled), Cmd/Ctrl+Enter
 * to fire, MAX-capped. Reskinned: pixel-framed terminal field with a blinking
 * caret prompt, 8-bit blip on type + submit, and a "THINKING..." locked state
 * while the boss is judging. Colors track the active --accent (set by Arena's
 * data-mode wrapper).
 */
export function AnswerInput({ onSubmit, disabled }: AnswerInputProps) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const canSubmit = !disabled && trimmed.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    sfx.blip();
    onSubmit(trimmed);
    setValue('');
  };

  const onChange = (next: string) => {
    const clipped = next.slice(0, MAX);
    // 8-bit tick on actual new characters (not on backspace/paste-shrink).
    if (clipped.length > value.length) sfx.blip();
    setValue(clipped);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full">
      <div className={`pixel-panel scanline p-3 ${disabled ? 'opacity-70' : ''}`}>
        {/* terminal prompt line */}
        <div className="mb-1 flex items-center gap-2">
          <span className="font-pixel text-[8px]" style={{ color: 'var(--accent)' }}>
            {disabled ? 'BOSS_INTERROGATING' : 'YOUR_REBUTTAL'}
          </span>
          <span className="font-pixel text-[8px] text-neonInk/30">{'>'}_</span>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={3}
          placeholder={
            disabled
              ? 'THINKING...'
              : 'Defend your idea. Be specific — vague answers cost you credibility.'
          }
          className="w-full resize-none bg-transparent px-1 py-1 text-lg text-neonInk outline-none placeholder:text-neonInk/30 sm:text-xl"
          style={{ border: 'none', boxShadow: 'none' }}
        />

        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="hidden font-pixel text-[7px] text-neonInk/40 sm:block">
            [CTRL/⌘ + ENTER] FIRE BACK
          </span>
          <span className="font-pixel text-[7px] tabular-nums text-neonInk/40 sm:hidden">
            {value.length}/{MAX}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="arcade-btn text-[9px] sm:text-[10px]"
          >
            {disabled ? 'THINKING...' : 'COUNTER'}
          </button>
        </div>
      </div>
    </div>
  );
}

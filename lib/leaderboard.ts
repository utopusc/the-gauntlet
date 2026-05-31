// lib/leaderboard.ts
// localStorage-backed arcade high-score table. Source of truth for ScoreEntry.
// Pure, framework-agnostic, never throws.

import type { GameMode } from '../types';

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  company: string;
  outcome: 'funded' | 'passed';
  date: string;
}

const KEY = 'gauntlet.scores.v1';
const DEFAULT_MAX = 10;

/** Generate a unique id, preferring crypto.randomUUID with a robust fallback. */
function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readRaw(): ScoreEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive normalization — drop anything malformed.
    return parsed
      .filter(
        (e): e is ScoreEntry =>
          !!e &&
          typeof e === 'object' &&
          typeof e.id === 'string' &&
          typeof e.name === 'string' &&
          typeof e.score === 'number'
      )
      .map((e) => ({
        id: String(e.id),
        name: String(e.name),
        score: Number(e.score) || 0,
        mode: (e.mode as GameMode) ?? 'normal',
        company: typeof e.company === 'string' ? e.company : '',
        outcome: e.outcome === 'funded' ? 'funded' : 'passed',
        date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function writeRaw(entries: ScoreEntry[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* quota / privacy mode — silently ignore */
  }
}

/** All scores, sorted desc by score. [] on any error. */
export function getScores(): ScoreEntry[] {
  return readRaw().sort((a, b) => b.score - a.score);
}

/** Persist a new entry (auto id + ISO date) and return the saved record. */
export function addScore(
  e: Omit<ScoreEntry, 'id' | 'date'> & { id?: string }
): ScoreEntry {
  const entry: ScoreEntry = {
    id: e.id && typeof e.id === 'string' ? e.id : makeId(),
    name: (e.name ?? 'YOU').toString(),
    score: Number(e.score) || 0,
    mode: e.mode ?? 'normal',
    company: e.company ?? '',
    outcome: e.outcome === 'funded' ? 'funded' : 'passed',
    date: new Date().toISOString(),
  };
  try {
    const all = readRaw();
    all.push(entry);
    all.sort((a, b) => b.score - a.score);
    writeRaw(all);
  } catch {
    /* never throw */
  }
  return entry;
}

/** Top N scores (desc). */
export function topN(n: number): ScoreEntry[] {
  const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX;
  return getScores().slice(0, safe);
}

/** True if the board has room OR the score beats the current lowest top-max. */
export function qualifies(score: number, max: number = DEFAULT_MAX): boolean {
  if (!Number.isFinite(score)) return false;
  const top = topN(max);
  if (top.length < max) return true;
  const lowest = top[top.length - 1]?.score ?? -Infinity;
  return score > lowest;
}

/** Wipe the board. */
export function clearScores(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

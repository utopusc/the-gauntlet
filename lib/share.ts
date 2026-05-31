import type { Verdict } from '../types';

/**
 * Build viral share copy from a verdict + the founder's idea.
 * Tone: cocky, fun, and a clear challenge to the reader.
 */
export function buildShareText(verdict: Verdict, idea: string): string {
  const trimmedIdea = idea.trim().replace(/\s+/g, ' ');
  const ideaSnippet =
    trimmedIdea.length > 90 ? `${trimmedIdea.slice(0, 87)}…` : trimmedIdea;

  if (verdict.outcome === 'funded') {
    return [
      `I survived THE GAUNTLET and scored ${verdict.score}/100 from 3 brutal AI VCs. 🦈🧠📈`,
      ``,
      `Pitch: "${ideaSnippet}"`,
      `Verdict: ${verdict.oneLiner}`,
      ``,
      `Think you can out-pitch me? Step in the ring. 👇`,
    ].join('\n');
  }

  return [
    `I got TORCHED in THE GAUNTLET — ${verdict.score}/100 from 3 AI VCs. 🔥`,
    ``,
    `Pitch: "${ideaSnippet}"`,
    `Verdict: ${verdict.oneLiner}`,
    ``,
    `Bet you can't survive either. Prove me wrong. 👇`,
  ].join('\n');
}

/** The canonical URL to share. Falls back to current origin. */
function appUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin + window.location.pathname;
  }
  return 'https://the-gauntlet.app';
}

/** Open an X/Twitter intent with prefilled text + url. */
export function shareToX(text: string, url?: string): void {
  const shareUrl = url ?? appUrl();
  const intent =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` +
    `&url=${encodeURIComponent(shareUrl)}`;
  openShareWindow(intent);
}

/** Open a LinkedIn share intent for the given url. */
export function shareToLinkedIn(url?: string): void {
  const shareUrl = url ?? appUrl();
  const intent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl,
  )}`;
  openShareWindow(intent);
}

function openShareWindow(intent: string): void {
  if (typeof window === 'undefined') return;
  window.open(intent, '_blank', 'noopener,noreferrer,width=600,height=640');
}

import QRCode from 'qrcode';
import type { Match } from '../types';

// ── Native share helpers ──────────────────────────────────────────────────────

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function shareNative(opts: {
  pngBlob: Blob;
  filename: string;
  title: string;
  text: string;
  url?: string;
}): Promise<'shared' | 'wa-fallback' | 'unsupported'> {
  const { pngBlob, filename, title, text, url } = opts;

  try {
    // Path 1: full file share (mobile browsers with canShare)
    if (typeof navigator.canShare === 'function') {
      const pngFile = new File([pngBlob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [pngFile] })) {
        await navigator.share({ files: [pngFile], title, text, url });
        return 'shared';
      }
    }

    // Path 2: text-only share (navigator.share exists but no file support)
    if ('share' in navigator) {
      const fullText = [text, url].filter(Boolean).join(' ');
      await navigator.share({ title, text: fullText, url });
      return 'shared';
    }
  } catch (err) {
    // User cancelled — AbortError or NotAllowedError — silently ignore
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
      return 'unsupported';
    }
    // Any other error: fall through to WA fallback
  }

  // Path 3: desktop / no Web Share API → open WhatsApp deep link
  const fallbackText = [text, url].filter(Boolean).join('\n');
  window.open(buildWhatsAppUrl(fallbackText), '_blank', 'noopener');
  return 'wa-fallback';
}

export function buildMatchUrl(matchId: string): string {
  return `${window.location.origin}${window.location.pathname}?match=${matchId}`;
}

export async function generateQrSvg(data: string): Promise<string> {
  const svg = await QRCode.toString(data, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1A1A1A',
      light: '#FBFAF2',
    },
  });
  return svg;
}

/** Compact match payload — strips large/redundant fields to keep QR manageable */
interface CompactPlayer {
  id: string;
  name: string;
  skillRating: number;
  positions?: string[];
}

interface CompactTeam {
  id: string;
  name: string;
  color: string;
  averageSkill: number;
  players: CompactPlayer[];
}

interface CompactMatch {
  id: string;
  name: string;
  date: string;
  matchType?: string;
  winnerId?: string;
  bibsTeam?: number | null;
  teams: CompactTeam[];
}

export function encodeMatchPayload(match: Match): string {
  const compact: CompactMatch = {
    id: match.id,
    name: match.name,
    date: match.date instanceof Date ? match.date.toISOString() : String(match.date),
    matchType: match.matchType,
    winnerId: match.winnerId,
    bibsTeam: match.bibsTeam ?? null,
    teams: match.teams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      averageSkill: t.averageSkill,
      players: t.players.map(p => ({
        id: p.id,
        name: p.name,
        skillRating: p.skillRating,
        ...(p.positions && p.positions.length > 0 ? { positions: p.positions } : {}),
      })),
    })),
  };
  return btoa(JSON.stringify(compact));
}

export function decodeMatchPayload(b64: string): Match | null {
  try {
    const compact: CompactMatch = JSON.parse(atob(b64));
    if (!compact.id || !compact.name || !Array.isArray(compact.teams)) return null;

    const match: Match = {
      id: compact.id,
      name: compact.name,
      date: new Date(compact.date),
      matchType: compact.matchType as Match['matchType'],
      winnerId: compact.winnerId,
      bibsTeam: (compact.bibsTeam as Match['bibsTeam']) ?? null,
      isPublic: false,
      teams: compact.teams.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        averageSkill: t.averageSkill,
        players: t.players.map(p => ({
          id: p.id,
          name: p.name,
          skillRating: p.skillRating,
          positions: (p.positions as Match['teams'][0]['players'][0]['positions']) ?? [],
          avatar: '',
          wins: 0,
          matchesPlayed: 0,
          createdAt: new Date(),
        })),
      })),
    };
    return match;
  } catch {
    return null;
  }
}

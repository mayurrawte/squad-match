import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Match } from '../types';
import { getPublicMatches } from '../lib/database';

interface HomepageProps {
  onNavigate: (tab: string) => void;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toLowerCase();
}

// Whistle SVG doodle
const WhistleDoodle: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity={0.6}>
    <ellipse cx="14" cy="20" rx="8" ry="5" stroke="#1A1A1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <rect x="22" y="17" width="10" height="6" rx="2" stroke="#1A1A1A" strokeWidth="1.8" fill="none" />
    <line x1="32" y1="20" x2="36" y2="14" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="32" cy="14" r="2" fill="#1A1A1A" opacity="0.6" />
    <circle cx="14" cy="20" r="3" fill="none" stroke="#1A1A1A" strokeWidth="1.3" strokeDasharray="2 1.5" />
  </svg>
);

// Small football doodle
const FootballSmall: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity={0.55}>
    <circle cx="12" cy="12" r="10" stroke="#1A1A1A" strokeWidth="1.8" fill="none" />
    <polygon points="12,6 14,9.5 17.5,9.5 14.8,12 16,15.5 12,13.2 8,15.5 9.2,12 6.5,9.5 10,9.5" fill="none" stroke="#1A1A1A" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

// Pin/tape SVG for cards
const CardTape: React.FC = () => (
  <svg width="16" height="10" viewBox="0 0 16 10" style={{ position: 'absolute', top: -5, right: 10 }}>
    <rect x="0" y="0" width="16" height="10" rx="1" fill="#FACC15" opacity={0.6} transform="rotate(-3 8 5)" />
  </svg>
);

export const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  const [publicMatches, setPublicMatches] = useState<Match[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadPublicMatches();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      const filtered = publicMatches.filter(match =>
        match.name.toLowerCase().includes(lower) ||
        match.teams.some(team =>
          team.name.toLowerCase().includes(lower) ||
          team.players.some(player => player.name.toLowerCase().includes(lower))
        )
      );
      setFilteredMatches(filtered);
    } else {
      setFilteredMatches(publicMatches);
    }
  }, [searchTerm, publicMatches]);

  const loadPublicMatches = async () => {
    try {
      const matches = await getPublicMatches();
      setPublicMatches(matches);
    } catch (error) {
      console.error('Error loading public matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-whiteboard)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1.5px solid var(--color-line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">

          {/* Whistle doodle — top right corner decoration */}
          <div className="absolute top-8 right-8 hidden lg:block">
            <WhistleDoodle />
          </div>

          <div className="grid grid-cols-12 gap-6 items-end">
            {/* Headline — left 7 cols */}
            <div className="col-span-12 lg:col-span-7">
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(2.8rem, 6vw, 5rem)',
                  lineHeight: 1.05,
                  color: 'var(--color-ink)',
                  maxWidth: '14ch',
                  textTransform: 'lowercase',
                }}
              >
                today's match.
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1rem',
                  color: 'var(--color-ink-soft)',
                  marginTop: '0.6rem',
                  transform: 'rotate(-0.5deg)',
                  display: 'inline-block',
                }}
              >
                notes from the touchline.
              </p>
              <div className="flex gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => onNavigate('players')}
                  className="btn-marker"
                  style={{ fontSize: '0.95rem' }}
                >
                  + add players
                </button>
                <button
                  onClick={() => onNavigate('teams')}
                  className="btn-marker-outline"
                  style={{ fontSize: '0.95rem' }}
                >
                  generate teams
                </button>
              </div>
            </div>

            {/* Side caption — right 4 cols */}
            <div className="col-span-12 lg:col-span-4 lg:pb-2 flex items-end gap-2">
              <FootballSmall />
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--color-ink-soft)', maxWidth: '26ch', lineHeight: 1.4 }}>
                skill-rated snake draft. drag players around. record the result.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Match Feed ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Section heading */}
        <div className="section-heading mb-1" style={{ fontSize: '1.2rem' }}>on the board</div>
        <p className="hand-caption mb-5" style={{ transform: 'rotate(-0.3deg)', display: 'inline-block' }}>
          recent matches from the squad
        </p>

        {/* Search */}
        <div className="relative mb-6 max-w-xs">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-ink-soft)' }} />
          <input
            type="text"
            placeholder="search matches, players…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-5 pr-2 py-1.5 text-sm bg-transparent focus:outline-none"
            style={{
              fontFamily: 'var(--font-sans)',
              borderBottom: '1.5px solid var(--color-line)',
              color: 'var(--color-ink)',
            }}
            onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--color-ink)')}
            onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--color-line)')}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-line)', borderTopColor: 'var(--color-ink)' }} />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-10">
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.5deg)', display: 'inline-block' }}>
              {searchTerm ? `nothing for "${searchTerm}".` : 'no matches on the board.'}
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <button
                  onClick={() => onNavigate('teams')}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1rem',
                    color: 'var(--color-ink-soft)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
                >
                  go play one →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Index-card stack */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match, idx) => {
              const teamNames = match.teams.map(t => t.name);
              const winnerTeam = match.teams.find(t => t.id === match.winnerId);
              const rotation = idx % 3 === 1 ? 'rotate(0.6deg)' : idx % 3 === 2 ? 'rotate(-0.4deg)' : 'rotate(0deg)';
              return (
                <div
                  key={match.id}
                  className="index-card p-4 relative"
                  style={{ transform: rotation }}
                >
                  <CardTape />
                  {/* Date + match name */}
                  <div className="flex items-start justify-between mb-2">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}>
                      {match.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-ink-soft)', flexShrink: 0, marginLeft: '0.5rem', marginTop: '2px' }}>
                      {fmtDate(match.date)}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="space-y-1 mb-2">
                    {teamNames.map((name, i) => {
                      const isWinner = match.teams[i]?.id === match.winnerId;
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: i === 0 ? 'var(--color-blue)' : 'var(--color-red)',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--font-hand)',
                              fontSize: '0.95rem',
                              color: i === 0 ? 'var(--color-blue)' : 'var(--color-red)',
                              fontWeight: isWinner ? 500 : 400,
                            }}
                          >
                            {name}
                            {isWinner && (
                              <span style={{ color: 'var(--color-green)', marginLeft: '0.35rem', fontSize: '0.85rem' }}>✓</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status line */}
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>
                    {winnerTeam
                      ? <span style={{ color: 'var(--color-green)' }}>{winnerTeam.name} won</span>
                      : <span>in progress</span>
                    }
                    {match.creatorDisplayName && (
                      <span style={{ marginLeft: '0.5rem' }}>· {match.creatorDisplayName}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

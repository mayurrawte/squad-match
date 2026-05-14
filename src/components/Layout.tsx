import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../types';
import { InitialsAvatar } from './InitialsAvatar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onScanQr?: () => void;
}

const tabs = [
  { id: 'home', label: 'home' },
  { id: 'players', label: 'squad' },
  { id: 'teams', label: 'teams' },
  { id: 'matches', label: 'matches' },
];

// Dynamic coach-note line: "wednesday — pitch 2 — 18:00"
const now = new Date();
const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
const COACH_NOTE = `${dayName} — pitch 2 — ${timeStr}`;

// Inline SVG football doodle
const FootballDoodle: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.75 }}>
    <circle cx="12" cy="12" r="10" stroke="#1A1A1A" strokeWidth="1.8" fill="none" />
    <polygon points="12,6 14,9.5 17.5,9.5 14.8,12 16,15.5 12,13.2 8,15.5 9.2,12 6.5,9.5 10,9.5" fill="none" stroke="#1A1A1A" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  user,
  onSignIn,
  onSignOut,
  onScanQr,
}) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-whiteboard)', color: 'var(--color-ink)' }}>
      {/* Header — whiteboard masthead */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--color-whiteboard)', borderBottom: '1.5px solid var(--color-line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-6">

            {/* Wordmark — left: Kalam, slight rotation, football icon */}
            <button
              onClick={() => onTabChange('home')}
              className="flex-shrink-0 flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.35rem',
                color: 'var(--color-ink)',
                transform: 'rotate(-1deg)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              <FootballDoodle size={20} />
              <span>match squad</span>
            </button>

            {/* Nav — Caveat handwritten, active = marker underline */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="px-3 py-1 transition-colors"
                    style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '1rem',
                      color: isActive ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: isActive ? '2.5px solid var(--color-ink)' : '2.5px solid transparent',
                      paddingBottom: '2px',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Auth + coach note — right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Scan QR button */}
              {onScanQr && (
                <button
                  onClick={onScanQr}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.88rem',
                    color: 'var(--color-ink-soft)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.1rem 0.2rem',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
                  title="scan a QR code"
                >
                  scan
                </button>
              )}
              {/* Coach note — hidden on mobile */}
              <span
                className="hidden md:block"
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '0.78rem',
                  color: 'var(--color-ink-soft)',
                  transform: 'rotate(-0.5deg)',
                  whiteSpace: 'nowrap',
                }}
              >
                {COACH_NOTE}
              </span>

              {user ? (
                <div className="flex items-center gap-2">
                  <InitialsAvatar
                    name={user.displayName || user.email || 'User'}
                    size={24}
                    animate={false}
                  />
                  <button
                    onClick={onSignOut}
                    className="p-1 transition-colors"
                    style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    color: 'var(--color-ink)',
                    border: '1.5px solid var(--color-ink)',
                    backgroundColor: 'transparent',
                    padding: '0.2rem 0.75rem',
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-ink)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ink)';
                  }}
                >
                  sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={activeTab === 'home' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'}>
        {children}
      </main>

      <footer className="mt-auto py-3" style={{ borderTop: '1px solid var(--color-line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
            notes from the touchline.
          </span>
          <a
            href="https://mayurrawte.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: 'var(--color-ink-soft)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            mayur rawte
          </a>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, Match, MatchType } from '../types';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onCreateMatch: (match: Match) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  teams,
  onCreateMatch,
}) => {
  const [matchName, setMatchName] = useState('');
  const [winnerId, setWinnerId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>(MatchType.Other);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const match: Match = {
      id: Date.now().toString(),
      name: matchName.trim() || `Match - ${new Date().toLocaleDateString()}`,
      teams,
      winnerId: winnerId || undefined,
      date: new Date(),
      isPublic,
      matchType,
    };

    onCreateMatch(match);
    setMatchName('');
    setWinnerId('');
    setIsPublic(false);
    setMatchType(MatchType.Other);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 0, boxShadow: '3px 3px 0 rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <span className="section-heading" style={{ fontSize: '1.05rem' }}>+ new match</span>
              <button
                onClick={onClose}
                className="font-mono text-base leading-none transition-colors"
                style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Match Name */}
              <div>
                <label className="block text-xs uppercase tracking-wide font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                  Match Name (optional)
                </label>
                <input
                  type="text"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="Leave blank for auto-name"
                  className="w-full py-2 text-sm italic bg-transparent focus:outline-none"
                  style={{ borderBottom: '1px solid var(--color-line)', color: 'var(--color-ink)' }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--color-ink)')}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--color-line)')}
                />
              </div>

              {/* Match Type */}
              <div>
                <label className="block text-xs uppercase tracking-wide font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                  Match Type
                </label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                  className="w-full py-2 text-sm bg-transparent focus:outline-none"
                  style={{ borderBottom: '1px solid var(--color-line)', color: 'var(--color-ink)', borderRadius: 0 }}
                >
                  {Object.values(MatchType).map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Winner */}
              <div>
                <label className="block text-xs uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                  Winner (optional)
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-3 p-2.5 cursor-pointer rounded" style={{ border: '1px solid var(--color-line)' }}>
                    <input
                      type="radio"
                      name="winner"
                      value=""
                      checked={winnerId === ''}
                      onChange={(e) => setWinnerId(e.target.value)}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>No winner yet</span>
                  </label>

                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-3 p-2.5 cursor-pointer rounded"
                      style={{ border: `1.5px solid ${winnerId === team.id ? 'var(--color-green)' : 'var(--color-line)'}` }}
                    >
                      <input
                        type="radio"
                        name="winner"
                        value={team.id}
                        checked={winnerId === team.id}
                        onChange={(e) => setWinnerId(e.target.value)}
                        style={{ accentColor: 'var(--color-accent)' }}
                      />
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                      <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Public toggle */}
              <label className="flex items-center gap-3 p-3 cursor-pointer rounded" style={{ border: '1px solid var(--color-line)' }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Make match public</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-soft)' }}>
                    Visible on the community homepage
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-marker-outline" style={{ fontSize: '0.85rem' }}>
                  cancel
                </button>
                <button type="submit" className="btn-marker" style={{ fontSize: '0.85rem' }}>
                  create match
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

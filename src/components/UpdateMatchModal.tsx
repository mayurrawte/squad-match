import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Match } from '../types';

interface UpdateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdateMatch: (matchId: string, winnerId?: string) => void;
}

export const UpdateMatchModal: React.FC<UpdateMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  onUpdateMatch,
}) => {
  const [winnerId, setWinnerId] = useState<string>(match.winnerId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMatch(match.id, winnerId || undefined);
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
              <span className="section-heading" style={{ fontSize: '1.05rem' }}>result?</span>
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
              <div>
                <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-ink)' }}>{match.name}</h3>
                <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  Select the winning team or mark as no winner
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                  Match Result
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
                    <span className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>No winner / Draw</span>
                  </label>

                  {match.teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-start gap-3 p-2.5 cursor-pointer rounded"
                      style={{ border: `1.5px solid ${winnerId === team.id ? 'var(--color-green)' : 'var(--color-line)'}` }}
                    >
                      <input
                        type="radio"
                        name="winner"
                        value={team.id}
                        checked={winnerId === team.id}
                        onChange={(e) => setWinnerId(e.target.value)}
                        style={{ accentColor: 'var(--color-accent)', marginTop: 2 }}
                      />
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: team.color }} />
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{team.name}</span>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-ink-soft)' }}>
                          {team.players.map(p => p.name).join(', ')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-marker-outline" style={{ fontSize: '0.85rem' }}>
                  cancel
                </button>
                <button type="submit" className="btn-marker" style={{ fontSize: '0.85rem' }}>
                  save result
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

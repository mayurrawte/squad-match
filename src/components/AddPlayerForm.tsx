import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, MatchType, Position } from '../types';
import { generateAvatar } from '../lib/avatars';

const ALL_POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];
const MAX_POSITIONS = 3;

interface AddPlayerFormProps {
  onAdd: (player: Player) => void;
}

export const AddPlayerForm: React.FC<AddPlayerFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<MatchType>(MatchType.Football);
  const [skillRating, setSkillRating] = useState(5);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  const handlePositionChipClick = (pos: Position) => {
    setSelectedPositions(prev => {
      if (prev.includes(pos)) {
        return prev.filter(p => p !== pos);
      }
      if (prev.length >= MAX_POSITIONS) return prev;
      return [...prev, pos];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: name.trim(),
      skillRating,
      sport,
      ...(selectedPositions.length > 0 && { positions: selectedPositions }),
      avatar: generateAvatar(name),
      wins: 0,
      matchesPlayed: 0,
      createdAt: new Date(),
    };

    onAdd(newPlayer);
    setName('');
    setSport(MatchType.Football);
    setSkillRating(5);
    setSelectedPositions([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName('');
    setSport(MatchType.Football);
    setSkillRating(5);
    setSelectedPositions([]);
    setIsOpen(false);
  };

  const sportOptions = [
    { value: MatchType.Football, label: 'Football' },
    { value: MatchType.Basketball, label: 'Basketball' },
    { value: MatchType.Volleyball, label: 'Volleyball' },
    { value: MatchType.Tennis, label: 'Tennis' },
    { value: MatchType.Badminton, label: 'Badminton' },
    { value: MatchType.Other, label: 'Other' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-marker"
        style={{ fontSize: '0.9rem' }}
      >
        + new player
      </button>

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
              className="w-full max-w-md overflow-hidden"
              style={{ backgroundColor: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 0, boxShadow: '3px 3px 0 rgba(0,0,0,0.12)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-line)' }}>
                <span className="section-heading" style={{ fontSize: '1.05rem' }}>+ new player</span>
                <button
                  onClick={handleCancel}
                  className="font-mono text-base leading-none transition-colors"
                  style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Player Name */}
                <div>
                  <label className="block text-xs uppercase tracking-wide font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full py-2 text-sm bg-transparent focus:outline-none"
                    style={{ borderBottom: '1px solid var(--color-line)', color: 'var(--color-ink)' }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--color-ink)')}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--color-line)')}
                    required
                  />
                </div>

                {/* Sport */}
                <div>
                  <label className="block text-xs uppercase tracking-wide font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                    Sport
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as MatchType)}
                    className="w-full py-2 text-sm bg-transparent focus:outline-none"
                    style={{ borderBottom: '1px solid var(--color-line)', color: 'var(--color-ink)', borderRadius: 0 }}
                  >
                    {sportOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Skill Rating */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--color-ink-soft)' }}>
                      Skill Rating
                    </label>
                    <span className="font-mono text-base tabular-nums font-medium" style={{ color: 'var(--color-ink)' }}>
                      {skillRating}<span className="text-xs font-sans" style={{ color: 'var(--color-ink-soft)' }}>/10</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={skillRating}
                    onChange={(e) => setSkillRating(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-ink-soft)' }}>
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>

                {/* Position chip selector */}
                <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '0.75rem' }}>
                  <div className="section-heading mb-2" style={{ fontSize: '0.85rem' }}>positions (optional)</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ALL_POSITIONS.map((pos) => {
                      const orderIdx = selectedPositions.indexOf(pos);
                      const isSelected = orderIdx >= 0;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => handlePositionChipClick(pos)}
                          style={{
                            position: 'relative',
                            padding: '0.3rem 0.75rem',
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? '#1A1A1A' : 'var(--color-line)'}`,
                            backgroundColor: isSelected ? '#1A1A1A' : 'var(--color-card)',
                            color: isSelected ? '#fff' : 'var(--color-ink)',
                            borderRadius: 0,
                            transition: 'all 0.12s',
                          }}
                        >
                          {pos}
                          {isSelected && (
                            <span
                              style={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                fontFamily: 'var(--font-hand)',
                                fontSize: '0.65rem',
                                backgroundColor: '#FACC15',
                                color: '#1A1A1A',
                                borderRadius: '50%',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            >
                              {orderIdx + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPositions.length === 0 && (
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: '0.35rem' }}>
                      tap in order — primary first.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={handleCancel} className="btn-marker-outline" style={{ fontSize: '0.85rem' }}>
                    cancel
                  </button>
                  <button type="submit" className="btn-marker" style={{ fontSize: '0.85rem' }}>
                    add player
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

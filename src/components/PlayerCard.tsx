import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { Player, MatchType, Position } from '../types';
import { InitialsAvatar } from './InitialsAvatar';

const ALL_POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];
const MAX_POSITIONS = 3;

interface PlayerCardProps {
  player: Player;
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onDelete: (id: string) => void;
}

// Small tape strip for top of card
const TapeStrip: React.FC = () => (
  <svg width="18" height="10" viewBox="0 0 18 10" style={{ position: 'absolute', top: -5, right: 8, pointerEvents: 'none' }}>
    <rect x="0" y="0" width="18" height="10" rx="1" fill="#FACC15" opacity={0.55} transform="rotate(-2 9 5)" />
  </svg>
);

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editSkill, setEditSkill] = useState(player.skillRating);
  const [editGoalkeeperSkill, setEditGoalkeeperSkill] = useState(player.positionSkills?.goalkeeper ?? 5);
  const [editDefenderSkill, setEditDefenderSkill] = useState(player.positionSkills?.defender ?? 5);
  const [editMidfieldSkill, setEditMidfieldSkill] = useState(player.positionSkills?.midfield ?? 5);
  const [editForwardSkill, setEditForwardSkill] = useState(player.positionSkills?.forward ?? 5);
  const [editPositions, setEditPositions] = useState<Position[]>(player.positions ?? []);

  const handlePositionChipClick = (pos: Position) => {
    setEditPositions(prev => {
      if (prev.includes(pos)) return prev.filter(p => p !== pos);
      if (prev.length >= MAX_POSITIONS) return prev;
      return [...prev, pos];
    });
  };

  useEffect(() => {
    if (isEditing && player.sport === MatchType.Football) {
      const avgRating = (editGoalkeeperSkill + editDefenderSkill + editMidfieldSkill + editForwardSkill) / 4;
      setEditSkill(Math.round(avgRating));
    }
  }, [isEditing, player.sport, editGoalkeeperSkill, editDefenderSkill, editMidfieldSkill, editForwardSkill]);

  const getSportLabel = (sport?: MatchType) => {
    switch (sport) {
      case MatchType.Football: return 'football';
      case MatchType.Basketball: return 'basketball';
      case MatchType.Volleyball: return 'volleyball';
      case MatchType.Tennis: return 'tennis';
      case MatchType.Badminton: return 'badminton';
      default: return 'other';
    }
  };

  const handleSave = () => {
    onUpdate(player.id, {
      name: editName.trim(),
      skillRating: editSkill,
      ...(player.sport === MatchType.Football && {
        positionSkills: {
          goalkeeper: editGoalkeeperSkill,
          defender: editDefenderSkill,
          midfield: editMidfieldSkill,
          forward: editForwardSkill,
        },
      }),
      positions: editPositions.length > 0 ? editPositions : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(player.name);
    setEditSkill(player.skillRating);
    setEditGoalkeeperSkill(player.positionSkills?.goalkeeper ?? 5);
    setEditDefenderSkill(player.positionSkills?.defender ?? 5);
    setEditMidfieldSkill(player.positionSkills?.midfield ?? 5);
    setEditForwardSkill(player.positionSkills?.forward ?? 5);
    setEditPositions(player.positions ?? []);
    setIsEditing(false);
  };

  const winRate = player.matchesPlayed > 0
    ? Math.round((player.wins / player.matchesPlayed) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -2, rotate: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="index-card relative"
      onClick={() => { if (!isEditing) setIsExpanded(e => !e); }}
      style={{ marginBottom: '0.5rem', cursor: isEditing ? 'default' : 'pointer' }}
    >
      <TapeStrip />
      <div className="flex items-center gap-3 py-3 px-3 group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <InitialsAvatar name={player.name} size={32} animate={false} />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3 py-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full py-1 text-sm bg-transparent focus:outline-none"
                  style={{ borderBottom: '1.5px solid var(--color-ink)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                  placeholder="player name"
                />
                {player.sport !== MatchType.Football && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wide" style={{ color: 'var(--color-ink-soft)' }}>skill</span>
                    <input type="range" min="1" max="10" value={editSkill} onChange={(e) => setEditSkill(Number(e.target.value))} className="flex-1" />
                    <span className="font-mono text-sm tabular-nums w-6 text-right" style={{ color: 'var(--color-ink)' }}>{editSkill}</span>
                  </div>
                )}
                {player.sport === MatchType.Football && (
                  <>
                    <div className="font-mono text-xs" style={{ color: 'var(--color-ink-soft)' }}>overall: {editSkill}/10</div>
                    <div className="space-y-2">
                      {[
                        { label: 'GK', val: editGoalkeeperSkill, set: setEditGoalkeeperSkill },
                        { label: 'DEF', val: editDefenderSkill, set: setEditDefenderSkill },
                        { label: 'MID', val: editMidfieldSkill, set: setEditMidfieldSkill },
                        { label: 'FWD', val: editForwardSkill, set: setEditForwardSkill },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="font-mono text-xs w-8 tabular-nums" style={{ color: 'var(--color-ink-soft)' }}>{label}</span>
                          <input type="range" min="1" max="10" value={val} onChange={(e) => set(Number(e.target.value))} className="flex-1" />
                          <span className="font-mono text-xs tabular-nums w-4 text-right" style={{ color: 'var(--color-ink)' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {/* Position chips */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginBottom: '0.35rem', textTransform: 'lowercase' }}>
                    positions (optional)
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ALL_POSITIONS.map((pos) => {
                      const orderIdx = editPositions.indexOf(pos);
                      const isSel = orderIdx >= 0;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => handlePositionChipClick(pos)}
                          style={{
                            position: 'relative',
                            padding: '0.15rem 0.5rem',
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            border: `1.5px solid ${isSel ? '#1A1A1A' : 'var(--color-line)'}`,
                            backgroundColor: isSel ? '#1A1A1A' : 'var(--color-card)',
                            color: isSel ? '#fff' : 'var(--color-ink)',
                            borderRadius: 0,
                          }}
                        >
                          {pos}
                          {isSel && (
                            <span
                              style={{
                                position: 'absolute',
                                top: -5,
                                right: -5,
                                fontFamily: 'var(--font-hand)',
                                fontSize: '0.6rem',
                                backgroundColor: '#FACC15',
                                color: '#1A1A1A',
                                borderRadius: '50%',
                                width: 13,
                                height: 13,
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
                  {editPositions.length === 0 && (
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>
                      tap in order — primary first.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="btn-marker"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}
                  >
                    save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-marker-outline"
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem' }}
                  >
                    cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}
                  >
                    {player.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
                    {getSportLabel(player.sport)}
                  </span>
                </div>
                {player.positions && player.positions.length > 0 && (
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.72rem', marginTop: '1px' }}>
                    {player.positions.map((pos, i) => (
                      <span
                        key={pos}
                        style={{
                          color: i === 0 ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                          opacity: i === 0 ? 0.85 : 0.6,
                        }}
                      >
                        {i > 0 && <span style={{ margin: '0 0.2rem', color: 'var(--color-ink-soft)' }}>·</span>}
                        {pos.toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>
                  {player.wins}/{player.matchesPlayed} wins · {winRate}%
                  {player.sport === MatchType.Football && player.positionSkills && (
                    <span className="ml-2">
                      · gk {player.positionSkills.goalkeeper} d {player.positionSkills.defender} m {player.positionSkills.midfield} f {player.positionSkills.forward}
                    </span>
                  )}
                </div>
                {/* Expandable full stats */}
                <motion.div
                  initial={false}
                  animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '0.35rem', fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)' }}>
                    <div>positions: {player.positions?.map(p => p.toLowerCase()).join(' · ') || '—'}</div>
                    <div>win rate: {winRate}% · {player.matchesPlayed} played</div>
                    <div>member since {player.createdAt ? new Date(player.createdAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).toLowerCase() : '—'}</div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Skill rating + actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-mono text-2xl tabular-nums leading-none mr-2" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
              {player.skillRating}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
              className="p-1 transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

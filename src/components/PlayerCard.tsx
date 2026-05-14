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
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onUpdate,
  onDelete,
  selected = false,
  onSelect,
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
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        borderBottom: '1px solid var(--color-line)',
        backgroundColor: selected ? 'rgba(30,64,175,0.04)' : 'transparent',
        cursor: isEditing ? 'default' : 'pointer',
      }}
      onClick={() => { if (!isEditing) setIsExpanded(e => !e); }}
    >
      {/* Compact row — always visible */}
      <div className="flex items-center gap-2 py-2 px-3 group" style={{ minHeight: 44 }}>
        {/* Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onSelect(player.id, e.target.checked); }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 14, height: 14, flexShrink: 0, accentColor: 'var(--color-blue)', cursor: 'pointer' }}
          />
        )}

        <div className="flex-shrink-0">
          <InitialsAvatar name={player.name} size={28} animate={false} />
        </div>

        {/* Name + positions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)', textTransform: 'lowercase', whiteSpace: 'nowrap' }}>
              {player.name}
            </span>
            {player.positions && player.positions.length > 0 && (
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', color: 'var(--color-ink-soft)' }}>
                {player.positions.map(p => p.toLowerCase()).join('·')}
              </span>
            )}
          </div>
        </div>

        {/* Skill */}
        {!isEditing && (
          <span className="font-mono tabular-nums w-6 text-right flex-shrink-0" style={{ fontSize: '0.95rem', color: 'var(--color-ink)', fontWeight: 600 }}>
            {player.skillRating}
          </span>
        )}

        {/* W·P */}
        {!isEditing && (
          <span className="font-mono tabular-nums hidden sm:block flex-shrink-0" style={{ fontSize: '0.65rem', color: 'var(--color-ink-soft)', width: 52, textAlign: 'right' }}>
            {player.wins}·{player.matchesPlayed}
          </span>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }}
              className="p-1"
              style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
              className="p-1"
              style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded: full stats or edit form */}
      {(isExpanded || isEditing) && (
        <div
          className="px-3 pb-3"
          style={{ paddingLeft: onSelect ? '2.75rem' : '0.75rem' }}
          onClick={e => e.stopPropagation()}
        >
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
            <div style={{ paddingTop: '0.25rem', paddingBottom: '0.1rem', fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: 'var(--color-ink-soft)' }}>
              <div>win rate: {winRate}% · {player.matchesPlayed} played · {player.wins} wins</div>
              {player.sport === MatchType.Football && player.positionSkills && (
                <div>gk {player.positionSkills.goalkeeper} d {player.positionSkills.defender} m {player.positionSkills.midfield} f {player.positionSkills.forward}</div>
              )}
              <div>member since {player.createdAt ? new Date(player.createdAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).toLowerCase() : '—'}</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

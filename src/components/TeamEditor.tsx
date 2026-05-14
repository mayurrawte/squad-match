import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, GripVertical } from 'lucide-react';
import { Team, Player, MatchType } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PitchView } from './PitchView';

interface SortablePlayerCardProps {
  player: Player;
  teamIdx: number;
  swapMode: boolean;
  swapFirst: string | null;
  onSwapClick: (playerId: string, teamIdx: number) => void;
  bibsTeam: 0 | 1 | null;
}

const SortablePlayerCard: React.FC<SortablePlayerCardProps> = ({
  player,
  teamIdx,
  swapMode,
  swapFirst,
  onSwapClick,
  bibsTeam,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto' as const,
  };

  const isSwapSelected = swapFirst === player.id;
  const hasBibs = bibsTeam === teamIdx;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        border: `1.5px solid ${isSwapSelected ? '#FACC15' : isDragging ? 'var(--color-blue)' : 'var(--color-line)'}`,
        backgroundColor: isSwapSelected
          ? 'rgba(250,204,21,0.12)'
          : hasBibs
          ? 'rgba(250,204,21,0.06)'
          : 'var(--color-card)',
        borderRadius: 0,
        outline: isSwapSelected ? '2px solid #FACC15' : 'none',
        cursor: swapMode ? 'pointer' : undefined,
      }}
      {...attributes}
      className="flex items-center gap-2 p-2.5"
      onClick={swapMode ? () => onSwapClick(player.id, teamIdx) : undefined}
    >
      {!swapMode && (
        <div {...listeners} className="flex-shrink-0 cursor-grab" style={{ color: 'var(--color-ink-soft)' }}>
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      {swapMode && (
        <div className="flex-shrink-0 w-4 flex items-center justify-center">
          {isSwapSelected && <span style={{ color: '#FACC15', fontSize: '0.7rem' }}>●</span>}
        </div>
      )}
      <img
        src={player.avatar}
        alt={player.name}
        className="w-7 h-7 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>
          {player.name}
        </div>
      </div>
      {hasBibs && (
        <span style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '0.65rem',
          color: '#92400E',
          backgroundColor: '#FACC15',
          padding: '0 0.3rem',
          letterSpacing: '0.05em',
        }}>
          BIBS
        </span>
      )}
      <span className="font-mono text-sm tabular-nums flex-shrink-0" style={{ color: 'var(--color-ink-soft)' }}>
        {player.skillRating}
      </span>
    </div>
  );
};

type ViewMode = 'list' | 'pitch';

interface TeamEditorProps {
  teams: Team[];
  onTeamsUpdate: (teams: Team[]) => void;
  onClose: () => void;
  sport?: MatchType;
  initialViewMode?: ViewMode;
  bibsTeam?: 0 | 1 | null;
  onBibsChange?: (v: 0 | 1 | null) => void;
}

export const TeamEditor: React.FC<TeamEditorProps> = ({
  teams,
  onTeamsUpdate,
  onClose,
  sport,
  initialViewMode = 'list',
  bibsTeam: bibsProp = null,
  onBibsChange,
}) => {
  const [editedTeams, setEditedTeams] = useState<Team[]>(JSON.parse(JSON.stringify(teams)));
  const showPitchToggle = sport === undefined || sport === MatchType.Football;
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<{ playerId: string; teamIdx: number } | null>(null);
  const [localBibs, setLocalBibs] = useState<0 | 1 | null>(bibsProp);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Esc exits swap mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (swapMode) { setSwapMode(false); setSwapFirst(null); }
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [swapMode, onClose]);

  const recalculateTeamAverageSkills = (currentTeams: Team[]): Team[] => {
    return currentTeams.map(team => ({
      ...team,
      averageSkill: team.players.length > 0
        ? Math.round((team.players.reduce((sum, p) => sum + p.skillRating, 0) / team.players.length) * 10) / 10
        : 0,
    }));
  };

  const handleSwapClick = (playerId: string, teamIdx: number) => {
    if (!swapFirst) {
      setSwapFirst({ playerId, teamIdx });
      return;
    }
    if (swapFirst.playerId === playerId) {
      // deselect
      setSwapFirst(null);
      return;
    }
    // Perform swap
    const newTeams = editedTeams.map(t => ({ ...t, players: [...t.players] }));
    const firstTeam = newTeams[swapFirst.teamIdx];
    const secondTeam = newTeams[teamIdx];
    const firstIdx = firstTeam.players.findIndex(p => p.id === swapFirst.playerId);
    const secondIdx = secondTeam.players.findIndex(p => p.id === playerId);

    if (firstIdx >= 0 && secondIdx >= 0) {
      const firstPlayer = firstTeam.players[firstIdx];
      const secondPlayer = secondTeam.players[secondIdx];
      if (swapFirst.teamIdx === teamIdx) {
        // Within same team: swap positions
        newTeams[teamIdx].players[firstIdx] = secondPlayer;
        newTeams[teamIdx].players[secondIdx] = firstPlayer;
      } else {
        // Cross-team swap
        newTeams[swapFirst.teamIdx].players[firstIdx] = secondPlayer;
        newTeams[teamIdx].players[secondIdx] = firstPlayer;
      }
      setEditedTeams(recalculateTeamAverageSkills(newTeams));
    }
    setSwapFirst(null);
  };

  const handleDragEnd = (event: { active: { id: string; data: { current?: { sortable?: { containerId?: string; index?: number; items?: string[] } } }; }; over: { id: string; data: { current?: { sortable?: { containerId?: string; index?: number; items?: string[] } } }; } | null; }) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeTeamId = active.data.current?.sortable?.containerId;
    const overTeamId = over.data.current?.sortable?.containerId || over.id;

    let newTeamsState: Team[] = editedTeams;

    if (activeTeamId === overTeamId) {
      newTeamsState = editedTeams.map((team) => {
        if (team.id === activeTeamId) {
          const oldIndex = active.data.current?.sortable?.index;
          const newIndex = over.data.current?.sortable?.index;
          if (oldIndex !== undefined && newIndex !== undefined) {
            return { ...team, players: arrayMove(team.players, oldIndex, newIndex) };
          }
        }
        return team;
      });
    } else {
      const sourceTeam = editedTeams.find(team => team.id === activeTeamId);
      const destinationTeam = editedTeams.find(team => team.id === overTeamId);
      const draggedPlayer = sourceTeam?.players.find(p => p.id === active.id);

      if (sourceTeam && destinationTeam && draggedPlayer) {
        const overIsPlayer = over.data.current?.sortable?.items !== undefined;

        if (overIsPlayer) {
          const targetPlayer = destinationTeam.players.find(p => p.id === over.id);
          if (targetPlayer) {
            const newSourcePlayers = sourceTeam.players.filter(p => p.id !== active.id).concat(targetPlayer);
            const newDestinationPlayers = destinationTeam.players.filter(p => p.id !== over.id).concat(draggedPlayer);
            newTeamsState = editedTeams.map(team => {
              if (team.id === activeTeamId) return { ...team, players: newSourcePlayers };
              if (team.id === overTeamId) return { ...team, players: newDestinationPlayers };
              return team;
            });
          }
        } else {
          const newSourcePlayers = sourceTeam.players.filter(p => p.id !== active.id);
          const newDestinationPlayers = [...destinationTeam.players, draggedPlayer];
          newTeamsState = editedTeams.map(team => {
            if (team.id === activeTeamId) return { ...team, players: newSourcePlayers };
            if (team.id === overTeamId) return { ...team, players: newDestinationPlayers };
            return team;
          });
        }
      }
    }
    setEditedTeams(recalculateTeamAverageSkills(newTeamsState));
  };

  const handleEditTeamName = (teamId: string, newName: string) => {
    setEditedTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  const handleSave = () => {
    if (onBibsChange) onBibsChange(localBibs);
    onTeamsUpdate(editedTeams);
    onClose();
  };

  const handleReset = () => {
    setEditedTeams(JSON.parse(JSON.stringify(teams)));
  };

  const handleBibsChange = (val: 0 | 1 | null) => {
    setLocalBibs(val);
  };

  return (
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
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 0, boxShadow: '4px 4px 0 rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-line)' }}>
          <span className="section-heading" style={{ fontSize: '1.05rem' }}>edit teams</span>
          <div className="flex items-center gap-3">
            {/* Swap mode button — list view only */}
            {viewMode === 'list' && (
              <button
                onClick={() => { setSwapMode(s => !s); setSwapFirst(null); }}
                className={swapMode ? 'btn-marker' : 'btn-marker-outline'}
                style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', gap: '0.25rem' }}
                title="swap mode — click two players to swap them"
              >
                <span>↔</span>
                <span>swap</span>
              </button>
            )}

            {showPitchToggle && (
              <div className="flex items-center" style={{ border: '1px solid var(--color-line)', overflow: 'hidden' }}>
                {(['list', 'pitch'] as ViewMode[]).map((mode) => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => { setViewMode(mode); if (mode === 'pitch') { setSwapMode(false); setSwapFirst(null); } }}
                      className="px-3 py-1 transition-colors"
                      style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.8rem',
                        backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                        color: active ? 'var(--color-paper)' : 'var(--color-ink-soft)',
                        borderRight: mode === 'list' ? '1px solid var(--color-line)' : 'none',
                        borderRadius: 0,
                      }}
                    >
                      {mode === 'list' ? 'list' : 'tactics board'}
                    </button>
                  );
                })}
              </div>
            )}
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
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {viewMode === 'pitch' ? (
            <PitchView
              teams={editedTeams}
              onTeamsChange={(updatedTeams) => setEditedTeams(updatedTeams)}
              bibsTeam={localBibs}
            />
          ) : null}

          {viewMode === 'list' && (
          <>
          {/* Swap mode hint */}
          {swapMode && (
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--color-ink-soft)', marginBottom: '0.6rem', transform: 'rotate(-0.3deg)' }}>
              {swapFirst ? `swap with who? (esc to cancel)` : `swap who? — click a player first`}
            </p>
          )}
          {!swapMode && (
            <p className="font-mono text-xs mb-5 italic" style={{ color: 'var(--color-ink-soft)' }}>
              Drag players between teams to rebalance.
            </p>
          )}

          {/* Bibs toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>bibs:</span>
            {([null, 0, 1] as Array<0 | 1 | null>).map((val) => {
              const label = val === null ? 'none' : val === 0 ? editedTeams[0]?.name?.toLowerCase() || 'team a' : editedTeams[1]?.name?.toLowerCase() || 'team b';
              const isActive = localBibs === val;
              return (
                <button
                  key={String(val)}
                  onClick={() => handleBibsChange(val)}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.78rem',
                    padding: '0.1rem 0.5rem',
                    border: `1.5px solid ${isActive ? '#FACC15' : 'var(--color-line)'}`,
                    backgroundColor: isActive ? '#FACC15' : 'transparent',
                    color: isActive ? '#92400E' : 'var(--color-ink-soft)',
                    cursor: 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              {editedTeams.map((team, teamIdx) => (
                <div
                  key={team.id}
                  style={{ border: '1px solid var(--color-line)', borderRadius: 0 }}
                >
                  {/* Team header */}
                  <div className="px-3 py-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--color-line)', backgroundColor: 'var(--color-paper)' }}>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => handleEditTeamName(team.id, e.target.value)}
                        className="bg-transparent border-none outline-none flex-1"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}
                        placeholder="Team Name"
                      />
                      {localBibs === teamIdx && (
                        <span style={{
                          fontFamily: 'var(--font-hand)',
                          fontSize: '0.65rem',
                          backgroundColor: '#FACC15',
                          color: '#92400E',
                          padding: '0.05rem 0.3rem',
                          letterSpacing: '0.05em',
                        }}>
                          BIBS
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 ml-2 flex-shrink-0">
                      <span className="font-mono text-lg tabular-nums" style={{ color: 'var(--color-ink)' }}>
                        {team.averageSkill}
                      </span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: 'var(--color-ink-soft)' }}>avg</span>
                    </div>
                  </div>

                  <SortableContext items={team.players.map(p => p.id)} strategy={sortableKeyboardCoordinates}>
                    <div className="p-2 space-y-1.5 min-h-[180px]">
                      <AnimatePresence>
                        {team.players.map((player) => (
                          <SortablePlayerCard
                            key={player.id}
                            player={player}
                            teamIdx={teamIdx}
                            swapMode={swapMode}
                            swapFirst={swapFirst?.playerId ?? null}
                            onSwapClick={handleSwapClick}
                            bibsTeam={localBibs}
                          />
                        ))}
                      </AnimatePresence>
                      {team.players.length === 0 && (
                        <div
                          className="flex items-center justify-center h-28 text-sm border-dashed border-2"
                          style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)', borderRadius: 2 }}
                        >
                          Drop players here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>
          </DndContext>

          <div className="flex gap-2 mt-4">
            <button onClick={handleReset} className="btn-marker-outline" style={{ fontSize: '0.85rem' }}>
              <RotateCcw className="w-3 h-3" />
              <span>reset</span>
            </button>
            <button onClick={handleSave} className="btn-marker" style={{ fontSize: '0.85rem' }}>
              save changes
            </button>
          </div>
          </>
          )}

          {viewMode === 'pitch' && (
            <>
            {/* Bibs toggle in pitch view */}
            <div className="flex items-center gap-2 mt-3 mb-1">
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>bibs:</span>
              {([null, 0, 1] as Array<0 | 1 | null>).map((val) => {
                const label = val === null ? 'none' : val === 0 ? editedTeams[0]?.name?.toLowerCase() || 'team a' : editedTeams[1]?.name?.toLowerCase() || 'team b';
                const isActive = localBibs === val;
                return (
                  <button
                    key={String(val)}
                    onClick={() => handleBibsChange(val)}
                    style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '0.78rem',
                      padding: '0.1rem 0.5rem',
                      border: `1.5px solid ${isActive ? '#FACC15' : 'var(--color-line)'}`,
                      backgroundColor: isActive ? '#FACC15' : 'transparent',
                      color: isActive ? '#92400E' : 'var(--color-ink-soft)',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-colors"
                style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line)', backgroundColor: 'transparent', borderRadius: 0 }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-ink)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-paper)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ink-soft)';
                }}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors"
                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', borderRadius: 0 }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-ink)')}
              >
                Save Changes
              </button>
            </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

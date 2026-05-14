import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import { Player, Team } from '../types';
import { generateBalancedTeams, getTeamBalance } from '../lib/teamBalancer';
import { generateRandomTeamName } from '../lib/nameGenerator';
import { TeamEditor } from './TeamEditor';
import { InitialsAvatar } from './InitialsAvatar';

interface TeamGeneratorProps {
  players: Player[];
  onCreateMatch: (teams: Team[]) => void;
}

export const TeamGenerator: React.FC<TeamGeneratorProps> = ({
  players,
  onCreateMatch,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [numTeams, setNumTeams] = useState(2);
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [teamEditorInitialMode, setTeamEditorInitialMode] = useState<'list' | 'pitch'>('list');

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleGenerateTeams = async () => {
    if (selectedPlayers.length < numTeams) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const selectedPlayerObjs = players.filter(p => selectedPlayers.includes(p.id));
    let teams = generateBalancedTeams(selectedPlayerObjs, numTeams);

    const usedNames = new Set<string>();
    teams = teams.map(team => {
      let randomName;
      do {
        randomName = generateRandomTeamName();
      } while (usedNames.has(randomName));
      usedNames.add(randomName);
      return { ...team, name: randomName };
    });

    setGeneratedTeams(teams);
    setIsGenerating(false);
  };

  const handleTeamNameChange = (teamId: string, newName: string) => {
    setGeneratedTeams(prev =>
      prev.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  const handleTeamsUpdate = (updatedTeams: Team[]) => {
    setGeneratedTeams(updatedTeams);
  };

  const balance = generatedTeams.length > 1 ? getTeamBalance(generatedTeams) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Player Selection */}
        <div className="p-5 index-card">
          <div className="section-heading mb-5">select players</div>

          {players.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--color-ink-soft)' }}>No players yet. Add players first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
              {players.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerToggle(player.id)}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-line)'}`,
                      backgroundColor: isSelected ? 'rgba(30,64,175,0.06)' : 'var(--color-card)',
                      boxShadow: isSelected ? '1px 1px 0 var(--color-blue)' : 'none',
                    }}
                  >
                    <InitialsAvatar name={player.name} size={32} animate={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>{player.name}</div>
                    </div>
                    <span className="font-mono text-sm tabular-nums flex-shrink-0" style={{ color: isSelected ? 'var(--color-blue)' : 'var(--color-ink-soft)' }}>
                      {player.skillRating}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink-soft)' }}>
                <span className="text-xs uppercase tracking-wide font-medium">Teams</span>
                <select
                  value={numTeams}
                  onChange={(e) => setNumTeams(Number(e.target.value))}
                  className="px-2 py-1 text-sm border rounded focus:outline-none"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink)', backgroundColor: '#fff' }}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
              <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--color-ink-soft)' }}>
                {selectedPlayers.length} selected
              </span>
            </div>

            <button
              onClick={handleGenerateTeams}
              disabled={selectedPlayers.length < numTeams || isGenerating}
              className="btn-marker"
            >
              {isGenerating ? 'generating…' : 'generate teams'}
            </button>
          </div>
        </div>

        {/* Generated Teams */}
        <AnimatePresence>
          {generatedTeams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-5 index-card"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="section-heading">the teams</div>
                  <span
                    style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '0.85rem',
                      color: balance <= 1 ? 'var(--color-green)' : balance <= 2 ? '#92400E' : 'var(--color-ink-soft)',
                    }}
                  >
                    {balance <= 1 ? '✓ well balanced' : balance <= 2 ? 'good balance' : 'fair balance'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => { setTeamEditorInitialMode('pitch'); setShowTeamEditor(true); }}
                      className="btn-marker"
                      style={{ fontSize: '0.8rem' }}
                    >
                      tactics board →
                    </button>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.7rem',
                        color: 'var(--color-ink-soft)',
                        marginTop: '0.15rem',
                        transform: 'rotate(-0.5deg)',
                        display: 'inline-block',
                      }}
                    >
                      see them on the pitch.
                    </motion.span>
                  </div>
                  <button
                    onClick={() => { setTeamEditorInitialMode('list'); setShowTeamEditor(true); }}
                    className="btn-marker-outline"
                    style={{ fontSize: '0.8rem', gap: '0.3rem' }}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>edit teams</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                {generatedTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="index-card"
                    style={{ transform: index % 2 === 1 ? 'rotate(0.5deg)' : 'rotate(-0.3deg)' }}
                  >
                    {/* Team header */}
                    <div className="px-4 py-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--color-line)' }}>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                        className="bg-transparent border-none outline-none flex-1"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}
                      />
                      <div className="font-mono text-xl tabular-nums ml-3 leading-none flex-shrink-0" style={{ color: 'var(--color-ink)' }}>
                        {team.averageSkill}
                        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', marginLeft: '0.2rem', color: 'var(--color-ink-soft)' }}>avg</span>
                      </div>
                    </div>

                    {/* Players */}
                    <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                      {team.players.map((player) => (
                        <div key={player.id} className="flex items-center gap-2 px-4 py-2">
                          <div className="flex-1 min-w-0">
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--color-ink)' }}>{player.name.toLowerCase()}</span>
                            {player.positionSkills &&
                             typeof player.positionSkills.goalkeeper === 'number' ? (
                              <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-ink-soft)' }}>
                                gk {player.positionSkills.goalkeeper} d {player.positionSkills.defender} m {player.positionSkills.midfield} f {player.positionSkills.forward}
                              </span>
                            ) : null}
                          </div>
                          <span className="font-mono text-base tabular-nums flex-shrink-0" style={{ color: 'var(--color-ink)' }}>
                            {player.skillRating}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => onCreateMatch(generatedTeams)}
                  className="btn-marker"
                  style={{ fontSize: '0.95rem' }}
                >
                  + create match
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showTeamEditor && (
          <TeamEditor
            teams={generatedTeams}
            onTeamsUpdate={handleTeamsUpdate}
            onClose={() => setShowTeamEditor(false)}
            initialViewMode={teamEditorInitialMode}
          />
        )}
      </AnimatePresence>
    </>
  );
};

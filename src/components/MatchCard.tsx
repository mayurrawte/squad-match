import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Match, MatchType, Team } from '../types';
import { UpdateMatchModal } from './UpdateMatchModal';
import { TeamEditor } from './TeamEditor';
import { useAuth } from '../hooks/useAuth';

interface MatchCardProps {
  match: Match;
  onUpdateMatch?: (matchId: string, winnerId?: string) => void;
  showUpdateButton?: boolean;
  onUpdateMatchTeams?: (matchId: string, newTeams: Team[]) => void;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toLowerCase();
}

// Yellow tape strip
const TapeStrip: React.FC = () => (
  <svg width="20" height="11" viewBox="0 0 20 11" style={{ position: 'absolute', top: -5, right: 12, pointerEvents: 'none' }}>
    <rect x="0" y="0" width="20" height="11" rx="1" fill="#FACC15" opacity={0.55} transform="rotate(2 10 5.5)" />
  </svg>
);

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onUpdateMatch,
  showUpdateButton = false,
  onUpdateMatchTeams,
}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTeamEditorModal, setShowTeamEditorModal] = useState(false);
  const [teamEditorInitialMode, setTeamEditorInitialMode] = useState<'list' | 'pitch'>('list');
  const { user } = useAuth();

  const canUpdate = showUpdateButton && user && match.createdBy === user.id && onUpdateMatch;
  const canEditTeams = user && match.createdBy === user.uid && onUpdateMatchTeams;

  const handleUpdateMatch = (matchId: string, winnerId?: string) => {
    if (onUpdateMatch) onUpdateMatch(matchId, winnerId);
  };

  const handleTeamsUpdated = (updatedTeams: Team[]) => {
    if (onUpdateMatchTeams) {
      onUpdateMatchTeams(match.id, updatedTeams);
    }
    setShowTeamEditorModal(false);
  };

  const winnerTeam = match.teams.find(t => t.id === match.winnerId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, rotate: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="index-card relative"
        style={{ padding: '1rem' }}
      >
        <TapeStrip />

        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-ink)', textTransform: 'lowercase' }}>
              {match.name}
            </span>
            <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)', marginTop: '1px' }}>
              {fmtDate(match.date)}
              {match.creatorDisplayName && ` · ${match.creatorDisplayName}`}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {canEditTeams && (
              <button
                onClick={() => setShowTeamEditorModal(true)}
                className="p-1 transition-colors"
                style={{ color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-soft)')}
                title="Edit Teams"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
            {canUpdate && (
              <button
                onClick={() => setShowUpdateModal(true)}
                className="btn-marker-outline"
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                result?
              </button>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-1.5 mb-3">
          {match.teams.map((team, i) => {
            const isWinner = team.id === match.winnerId;
            return (
              <div key={team.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                      fontSize: '1rem',
                      color: i === 0 ? 'var(--color-blue)' : 'var(--color-red)',
                      fontWeight: isWinner ? 500 : 400,
                    }}
                  >
                    {team.name}
                    {isWinner && (
                      <span style={{ color: 'var(--color-green)', marginLeft: '0.35rem' }}>✓</span>
                    )}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-ink-soft)' }}>
                  {team.players.length}p · {team.averageSkill} avg
                </span>
              </div>
            );
          })}
        </div>

        {/* Player names */}
        <div className="space-y-1">
          {match.teams.map((team, i) => (
            <div key={team.id} className="flex flex-wrap gap-x-2 gap-y-0">
              <span
                style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '0.72rem',
                  color: i === 0 ? 'var(--color-blue)' : 'var(--color-red)',
                  opacity: 0.75,
                  width: '100%',
                }}
              >
                {team.name.toLowerCase()}:
              </span>
              {team.players.map((player) => (
                <span key={player.id} style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>
                  {player.name.toLowerCase()} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{player.skillRating}</span>
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Status */}
        {!match.winnerId && (
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
            in progress
          </p>
        )}
        {winnerTeam && (
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: 'var(--color-green)', marginTop: '0.5rem' }}>
            {winnerTeam.name} won
          </p>
        )}

        {/* Tactics board shortcut — football only */}
        {match.matchType === MatchType.Football && (
          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-line)', paddingTop: '0.4rem' }}>
            <motion.button
              onClick={() => { setTeamEditorInitialMode('pitch'); setShowTeamEditorModal(true); }}
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '0.78rem',
                color: 'var(--color-ink-soft)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              whileHover={{ color: 'var(--color-ink)' }}
            >
              tactics
              <motion.span
                style={{ fontFamily: 'var(--font-hand)', fontSize: '0.78rem', display: 'inline-block' }}
                whileHover={{ x: 1, y: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                ↗
              </motion.span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {canUpdate && (
        <UpdateMatchModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          match={match}
          onUpdateMatch={handleUpdateMatch}
        />
      )}

      {showTeamEditorModal && (
        <TeamEditor
          teams={match.teams}
          onTeamsUpdate={handleTeamsUpdated}
          onClose={() => setShowTeamEditorModal(false)}
          sport={match.matchType}
          initialViewMode={teamEditorInitialMode}
        />
      )}
    </>
  );
};

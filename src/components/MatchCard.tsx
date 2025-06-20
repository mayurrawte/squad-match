import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Users, Edit3 } from 'lucide-react';
import { Match } from '../types';
import { UpdateMatchModal } from './UpdateMatchModal';
import { useAuth } from '../hooks/useAuth';

interface MatchCardProps {
  match: Match;
  onUpdateMatch?: (matchId: string, winnerId?: string) => void;
  showUpdateButton?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  onUpdateMatch,
  showUpdateButton = false 
}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { user } = useAuth();
  const winningTeam = match.teams.find(team => team.id === match.winnerId);
  
  // Check if current user can update this match
  const canUpdate = showUpdateButton && user && match.createdBy === user.uid && onUpdateMatch;

  const handleUpdateMatch = (matchId: string, winnerId?: string) => {
    if (onUpdateMatch) {
      onUpdateMatch(matchId, winnerId);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-teal-100"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{match.name}</h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{match.date.toLocaleDateString()}</span>
              </div>
              {canUpdate && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowUpdateModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Update match result"
                >
                  <Edit3 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {match.teams.map((team) => {
              const isWinner = team.id === match.winnerId;
              
              return (
                <div
                  key={team.id}
                  className={`p-4 rounded-lg border-2 ${
                    isWinner
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-medium text-gray-900">{team.name}</span>
                      {isWinner && <Trophy className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{team.players.length}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {team.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full"
                      >
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {!match.winnerId && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Match in progress
            </div>
          )}
        </div>
      </motion.div>

      {canUpdate && (
        <UpdateMatchModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          match={match}
          onUpdateMatch={handleUpdateMatch}
        />
      )}
    </>
  );
};
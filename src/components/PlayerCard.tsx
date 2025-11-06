import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Star, Trophy } from 'lucide-react';
import { Player, MatchType } from '../types';

interface PlayerCardProps {
  player: Player;
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onDelete: (id: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editSkill, setEditSkill] = useState(player.skillRating);
  // Initialize with existing position skills or defaults
  const [editGoalkeeperSkill, setEditGoalkeeperSkill] = useState(player.positionSkills?.goalkeeper ?? 5);
  const [editDefenderSkill, setEditDefenderSkill] = useState(player.positionSkills?.defender ?? 5);
  const [editMidfieldSkill, setEditMidfieldSkill] = useState(player.positionSkills?.midfield ?? 5);
  const [editForwardSkill, setEditForwardSkill] = useState(player.positionSkills?.forward ?? 5);

  // Auto-calculate overall rating for football players when editing
  useEffect(() => {
    if (isEditing && player.sport === MatchType.Football) {
      const avgRating = (editGoalkeeperSkill + editDefenderSkill + editMidfieldSkill + editForwardSkill) / 4;
      setEditSkill(Math.round(avgRating));
    }
  }, [isEditing, player.sport, editGoalkeeperSkill, editDefenderSkill, editMidfieldSkill, editForwardSkill]);

  const getSportIcon = (sport?: MatchType) => {
    switch (sport) {
      case MatchType.Football: return '⚽';
      case MatchType.Basketball: return '🏀';
      case MatchType.Volleyball: return '🏐';
      case MatchType.Tennis: return '🎾';
      case MatchType.Badminton: return '🏸';
      default: return '🎯';
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
    setIsEditing(false);
  };

  const winRate = player.matchesPlayed > 0 
    ? Math.round((player.wins / player.matchesPlayed) * 100) 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <motion.img
              src={player.avatar}
              alt={player.name}
              className="w-12 h-12 rounded-full bg-gray-100"
              whileHover={{ scale: 1.1 }}
            />
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Player name"
                  />
                  {player.sport !== MatchType.Football && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Skill:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={editSkill}
                        onChange={(e) => setEditSkill(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-8 text-center">
                        {editSkill}
                      </span>
                    </div>
                  )}
                  {player.sport === MatchType.Football && (
                    <div className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-md">
                      <span className="text-xs text-gray-600">Overall Rating (Auto-calculated)</span>
                      <span className="text-sm font-bold text-purple-600">{editSkill}/10</span>
                    </div>
                  )}
                  {/* Positional Skill Inputs */}
                  {player.sport === MatchType.Football && (
                    <div className="space-y-2 border-t pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-gray-600">🧤 Goalkeeper</label>
                        <span className="text-xs font-bold text-purple-600">{editGoalkeeperSkill}</span>
                      </div>
                      <input type="range" min="1" max="10" value={editGoalkeeperSkill} onChange={(e) => setEditGoalkeeperSkill(Number(e.target.value))} className="w-full slider-xs" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-gray-600">🛡️ Defender</label>
                        <span className="text-xs font-bold text-blue-600">{editDefenderSkill}</span>
                      </div>
                      <input type="range" min="1" max="10" value={editDefenderSkill} onChange={(e) => setEditDefenderSkill(Number(e.target.value))} className="w-full slider-xs" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-gray-600">⚡ Midfielder</label>
                        <span className="text-xs font-bold text-cyan-600">{editMidfieldSkill}</span>
                      </div>
                      <input type="range" min="1" max="10" value={editMidfieldSkill} onChange={(e) => setEditMidfieldSkill(Number(e.target.value))} className="w-full slider-xs" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-gray-600">🎯 Forward</label>
                        <span className="text-xs font-bold text-green-600">{editForwardSkill}</span>
                      </div>
                      <input type="range" min="1" max="10" value={editForwardSkill} onChange={(e) => setEditForwardSkill(Number(e.target.value))} className="w-full slider-xs" />
                    </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{player.name}</h3>
                    <span className="text-lg">{getSportIcon(player.sport)}</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {player.skillRating}/10
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {player.wins}/{player.matchesPlayed} ({winRate}%)
                      </span>
                    </div>
                  </div>
                  {/* Display Position Skills */}
                  {player.sport === MatchType.Football && player.positionSkills && (
                    <div className="mt-2 text-xs text-gray-500">
                      {typeof player.positionSkills.goalkeeper === 'number' && <span>GK: {player.positionSkills.goalkeeper} </span>}
                      {typeof player.positionSkills.defender === 'number' && <span>D: {player.positionSkills.defender} </span>}
                      {typeof player.positionSkills.midfield === 'number' && <span>M: {player.positionSkills.midfield} </span>}
                      {typeof player.positionSkills.forward === 'number' && <span>F: {player.positionSkills.forward}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex space-x-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(player.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
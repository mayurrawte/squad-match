import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Star, Trophy } from 'lucide-react';
import { Player } from '../types';

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

  const handleSave = () => {
    onUpdate(player.id, {
      name: editName.trim(),
      skillRating: editSkill,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(player.name);
    setEditSkill(player.skillRating);
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
                  <div className="flex space-x-2">
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
                  <h3 className="font-semibold text-gray-900">{player.name}</h3>
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
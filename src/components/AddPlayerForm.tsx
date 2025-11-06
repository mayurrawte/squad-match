import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus } from 'lucide-react';
import { Player, MatchType } from '../types';
import { generateAvatar } from '../lib/avatars';

interface AddPlayerFormProps {
  onAdd: (player: Player) => void;
}

export const AddPlayerForm: React.FC<AddPlayerFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<MatchType>(MatchType.Football);
  const [skillRating, setSkillRating] = useState(5);
  const [goalkeeperSkill, setGoalkeeperSkill] = useState(5);
  const [defenderSkill, setDefenderSkill] = useState(5);
  const [midfieldSkill, setMidfieldSkill] = useState(5);
  const [forwardSkill, setForwardSkill] = useState(5);

  // Auto-calculate overall rating for football based on position skills
  useEffect(() => {
    if (sport === MatchType.Football) {
      const avgRating = (goalkeeperSkill + defenderSkill + midfieldSkill + forwardSkill) / 4;
      setSkillRating(Math.round(avgRating));
    }
  }, [sport, goalkeeperSkill, defenderSkill, midfieldSkill, forwardSkill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: name.trim(),
      skillRating,
      sport,
      ...(sport === MatchType.Football && {
        positionSkills: {
          goalkeeper: goalkeeperSkill,
          defender: defenderSkill,
          midfield: midfieldSkill,
          forward: forwardSkill,
        },
      }),
      avatar: generateAvatar(name),
      wins: 0,
      matchesPlayed: 0,
      createdAt: new Date(),
    };

    onAdd(newPlayer);
    setName('');
    setSport(MatchType.Football);
    setSkillRating(5);
    setGoalkeeperSkill(5);
    setDefenderSkill(5);
    setMidfieldSkill(5);
    setForwardSkill(5);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName('');
    setSport(MatchType.Football);
    setSkillRating(5);
    setGoalkeeperSkill(5);
    setDefenderSkill(5);
    setMidfieldSkill(5);
    setForwardSkill(5);
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Player</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Add New Player</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport / Game
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as MatchType)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value={MatchType.Football}>⚽ Football</option>
                    <option value={MatchType.Basketball}>🏀 Basketball</option>
                    <option value={MatchType.Volleyball}>🏐 Volleyball</option>
                    <option value={MatchType.Tennis}>🎾 Tennis</option>
                    <option value={MatchType.Badminton}>🏸 Badminton</option>
                    <option value={MatchType.Other}>🎯 Other</option>
                  </select>
                </div>

                {sport !== MatchType.Football && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill Rating: {skillRating}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={skillRating}
                      onChange={(e) => setSkillRating(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                )}

                {/* Positional Skills Inputs - Football Positions */}
                {sport === MatchType.Football && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">⚽</span>
                        Football Position Skills
                      </h3>
                      <span className="text-xs font-medium text-purple-600">
                        Overall: {skillRating}/10
                      </span>
                    </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="mr-2">🧤</span>Goalkeeper
                      </label>
                      <span className="text-sm font-bold text-purple-600">{goalkeeperSkill}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={goalkeeperSkill}
                      onChange={(e) => setGoalkeeperSkill(Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="mr-2">🛡️</span>Defender
                      </label>
                      <span className="text-sm font-bold text-purple-600">{defenderSkill}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={defenderSkill}
                      onChange={(e) => setDefenderSkill(Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="mr-2">⚡</span>Midfielder
                      </label>
                      <span className="text-sm font-bold text-purple-600">{midfieldSkill}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={midfieldSkill}
                      onChange={(e) => setMidfieldSkill(Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-cyan-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="mr-2">🎯</span>Forward
                      </label>
                      <span className="text-sm font-bold text-purple-600">{forwardSkill}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={forwardSkill}
                      onChange={(e) => setForwardSkill(Number(e.target.value))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    Add Player
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
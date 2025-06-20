import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Save } from 'lucide-react';
import { Team, Match } from '../types';

interface UpdateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onUpdateMatch: (matchId: string, winnerId?: string) => void;
}

export const UpdateMatchModal: React.FC<UpdateMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  onUpdateMatch,
}) => {
  const [winnerId, setWinnerId] = useState<string>(match.winnerId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMatch(match.id, winnerId || undefined);
    onClose();
  };

  return (
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-semibold text-white">Update Match Result</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{match.name}</h3>
                <p className="text-sm text-gray-600">
                  Select the winning team or mark as no winner
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Match Result
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="winner"
                      value=""
                      checked={winnerId === ''}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="text-purple-600"
                    />
                    <span className="text-gray-700">No winner / Draw</span>
                  </label>
                  
                  {match.teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="winner"
                        value={team.id}
                        checked={winnerId === team.id}
                        onChange={(e) => setWinnerId(e.target.value)}
                        className="text-purple-600"
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">{team.name}</span>
                        <div className="text-sm text-gray-500">
                          {team.players.map(p => p.name).join(', ')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Result</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
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
  );
};
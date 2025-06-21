import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Users, Trophy, Star, Edit3 } from 'lucide-react';
import { Player, Team } from '../types';
import { generateBalancedTeams, getTeamBalance } from '../lib/teamBalancer';
import { generateRandomTeamName } from '../lib/nameGenerator'; // Added import
import { TeamEditor } from './TeamEditor';

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
    
    // Add delay for animation effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    const selectedPlayerObjs = players.filter(p => selectedPlayers.includes(p.id));
    let teams = generateBalancedTeams(selectedPlayerObjs, numTeams);

    // Assign unique random names to teams
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
      <div className="space-y-8">
        {/* Player Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Select Players</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {players.map((player) => (
              <motion.div
                key={player.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayerToggle(player.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlayers.includes(player.id)
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{player.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-sm text-gray-600">{player.skillRating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Teams:</span>
                <select
                  value={numTeams}
                  onChange={(e) => setNumTeams(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
              <span className="text-sm text-gray-600">
                {selectedPlayers.length} players selected
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateTeams}
              disabled={selectedPlayers.length < numTeams || isGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <Shuffle className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Generate Teams'}</span>
            </motion.button>
          </div>
        </div>

        {/* Generated Teams */}
        <AnimatePresence>
          {generatedTeams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-purple-600" />
                  <span>Generated Teams</span>
                </h2>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Balance: {balance.toFixed(1)} skill points
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      balance <= 1 ? 'bg-purple-100 text-purple-800' :
                      balance <= 2 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {balance <= 1 ? 'Excellent' : balance <= 2 ? 'Good' : 'Fair'}
                    </span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTeamEditor(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Teams</span>
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {generatedTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-2 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50"
                    style={{ borderColor: team.color }}
                  >
                    <div className="mb-4">
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                        className="w-full text-lg font-semibold text-center border-none outline-none focus:bg-white/50 rounded px-2 py-1 bg-transparent"
                        style={{ color: team.color }}
                      />
                      <div className="text-center text-sm text-gray-600 mt-1">
                        Avg Skill: {team.averageSkill}/10
                      </div>
                    </div>

                    <div className="space-y-3">
                      {team.players.map((player) => (
                        <div key={player.id} className="flex items-center space-x-3">
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{player.name}</div>
                            {player.positionSkills &&
                             typeof player.positionSkills.forward === 'number' &&
                             typeof player.positionSkills.midfield === 'number' &&
                             typeof player.positionSkills.defender === 'number' ? (
                              <div className="text-xs text-gray-500">
                                F:{player.positionSkills.forward} M:{player.positionSkills.midfield} D:{player.positionSkills.defender} (Avg: {((player.positionSkills.forward + player.positionSkills.midfield + player.positionSkills.defender + player.skillRating)/4).toFixed(1)})
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-sm text-gray-600">{player.skillRating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCreateMatch(generatedTeams)}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Trophy className="w-5 h-5" />
                  <span>Create Match</span>
                </motion.button>
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
          />
        )}
      </AnimatePresence>
    </>
  );
};
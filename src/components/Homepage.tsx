import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Trophy, Calendar, Star, Eye, Plus } from 'lucide-react';
import { Match } from '../types'; // Player type is not directly used here anymore
import { getPublicMatches } from '../lib/database';
import { useAuth } from '../hooks/useAuth';
import { MatchCard } from './MatchCard'; // Import MatchCard

interface HomepageProps {
  onNavigate: (tab: string) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  const [publicMatches, setPublicMatches] = useState<Match[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadPublicMatches();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = publicMatches.filter(match =>
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.teams.some(team => 
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.players.some(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
      setFilteredMatches(filtered);
    } else {
      setFilteredMatches(publicMatches);
    }
  }, [searchTerm, publicMatches]);

  const loadPublicMatches = async () => {
    try {
      const matches = await getPublicMatches();
      console.log('Fetched public matches raw:', JSON.stringify(matches, null, 2)); // Added log
      console.log('Number of public matches fetched:', matches.length); // Added log
      if (matches.length > 0) { // Added log
        console.log('First public match isPublic value:', matches[0].isPublic);
      }
      setPublicMatches(matches);
    } catch (error) {
      console.error('Error loading public matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerInfo = (match: Match) => {
    if (!match.winnerId) return null;
    return match.teams.find(team => team.id === match.winnerId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full mb-6 shadow-lg"
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Match Squad
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create balanced teams, track matches, and discover amazing games from the community
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('players')}
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Players</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('teams')}
                className="flex items-center space-x-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full font-medium border border-purple-200 hover:bg-white transition-all"
              >
                <Users className="w-5 h-5" />
                <span>Generate Teams</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              placeholder="Search matches, teams, or players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all text-gray-700 placeholder-purple-400"
            />
          </div>
        </motion.div>
      </div>

      {/* Public Matches Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Public Matches</h2>
              <p className="text-gray-600">Discover exciting matches from the community</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{filteredMatches.length} matches</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full"
              />
            </div>
          ) : filteredMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'No matches found' : 'No public matches yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to create and share a match!'
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('teams')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Create Your First Match
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
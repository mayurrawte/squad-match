import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Homepage } from './components/Homepage';
import { PlayerCard } from './components/PlayerCard';
import { AddPlayerForm } from './components/AddPlayerForm';
import { TeamGenerator } from './components/TeamGenerator';
import { MatchCard } from './components/MatchCard';
import { CreateMatchModal } from './components/CreateMatchModal';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { Team, Match } from './types';
import { Users, Trophy, Zap, Home } from 'lucide-react';
import { updateMatch } from './lib/database'; // Updated import
import toast from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);

  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { 
    players, 
    matches, 
    loading: dataLoading, 
    addPlayer, 
    updatePlayer, 
    deletePlayer, 
    addMatch,
    refresh
  } = useData(user?.id); // Changed to user?.id

  const handleDeletePlayer = (playerId: string) => {
    deletePlayer(playerId);
    toast.success('Player deleted successfully');
  };

  const handleCreateMatch = (teams: Team[]) => {
    setPendingTeams(teams);
    setShowCreateMatch(true);
  };

  const handleMatchCreated = (match: Match) => {
    addMatch(match);
    setActiveTab('matches');
    toast.success('Match created successfully!');
  };

  const handleUpdateMatch = async (matchId: string, winnerId?: string) => {
    try {
      if (user) {
        console.log(`Attempting to update match: ${matchId} with winnerId: ${winnerId}`); // Logging
        await updateMatch(matchId, { winnerId }); // Use updated function
        await refresh(); // Refresh data to get updated match

        // Find and log the updated match from the local state
        const updatedMatch = matches.find(m => m.id === matchId);
        console.log('Match state after refresh (local matches array):', updatedMatch);
        if (updatedMatch) {
          console.log(`Updated match ${matchId} has winnerId: ${updatedMatch.winnerId}`);
        } else {
          console.log(`Match ${matchId} not found in local state after refresh.`);
        }

        toast.success('Match result updated successfully!');
      } else {
        // Handle localStorage update if needed
        toast.error('Please sign in to update match results');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match result');
    }
  };

  // Step 2.1: Define handleMatchTeamsChange
  const handleMatchTeamsChange = async (matchId: string, newTeams: Team[]) => {
    try {
      if (user) {
        // Step 2.2: Call updateMatch
        await updateMatch(matchId, { teams: newTeams }); // Use updated function
        // Step 2.3: Call refresh
        await refresh();
        // Step 2.4: Add success toast
        toast.success('Match teams updated successfully!');
      } else {
        toast.error('Please sign in to update match teams.');
      }
    } catch (error) {
      console.error('Error updating match teams:', error);
      // Step 2.4: Add failure toast
      toast.error('Failed to update match teams.');
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Homepage onNavigate={setActiveTab} />;

      case 'players':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Players</h1>
                <p className="text-gray-600 mt-1">
                  Manage your squad and track player performance
                </p>
              </div>
              <AddPlayerForm onAdd={addPlayer} />
            </div>

            {players.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No players yet
                </h3>
                <p className="text-gray-500">
                  Add your first player to get started with team generation
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onUpdate={updatePlayer}
                      onDelete={handleDeletePlayer}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        );

      case 'teams':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Generator</h1>
              <p className="text-gray-600 mt-1">
                Create balanced teams based on player skill ratings
              </p>
            </div>

            {players.length < 2 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Need more players
                </h3>
                <p className="text-gray-500">
                  Add at least 2 players to start generating teams
                </p>
              </motion.div>
            ) : (
              <TeamGenerator 
                players={players} 
                onCreateMatch={handleCreateMatch}
              />
            )}
          </motion.div>
        );

      case 'matches':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Match History</h1>
              <p className="text-gray-600 mt-1">
                Track results and team performance over time
              </p>
            </div>

            {matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No matches yet
                </h3>
                <p className="text-gray-500">
                  Generate teams and create your first match
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <AnimatePresence>
                  {matches
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((match) => (
                      <MatchCard 
                        key={match.id} 
                        match={match}
                        onUpdateMatch={handleUpdateMatch}
                        showUpdateButton={true}
                        onUpdateMatchTeams={handleMatchTeamsChange} // Step 2.5: Pass function to MatchCard
                      />
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      >
        {renderContent()}
      </Layout>

      <CreateMatchModal
        isOpen={showCreateMatch}
        onClose={() => setShowCreateMatch(false)}
        teams={pendingTeams}
        onCreateMatch={handleMatchCreated}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;
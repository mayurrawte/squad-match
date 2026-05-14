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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-whiteboard)' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-line)', borderTopColor: 'var(--color-ink)' }} />
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="section-heading flex-1 mr-6">
                the squad
              </div>
              <AddPlayerForm onAdd={addPlayer} />
            </div>

            {players.length === 0 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.5deg)', display: 'inline-block' }}>
                  no players. add some.
                </p>
              </div>
            ) : (
              <div>
                {/* Header row */}
                <div
                  className="flex items-center gap-4 py-2 px-3"
                  style={{ borderBottom: '1px solid var(--color-line)' }}
                >
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest flex-1" style={{ color: 'var(--color-ink-soft)' }}>Player</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest w-16 text-right" style={{ color: 'var(--color-ink-soft)' }}>Skill</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest w-14 text-right hidden sm:block" style={{ color: 'var(--color-ink-soft)' }}>W/P</span>
                  <span className="w-16" />
                </div>
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
              </div>
            )}
          </motion.div>
        );

      case 'teams':
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="section-heading">
              the teams
            </div>

            {players.length < 2 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.4deg)', display: 'inline-block' }}>
                  pick the squad first.
                </p>
              </div>
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="section-heading">
              what we played
            </div>

            {matches.length === 0 ? (
              <div className="py-10">
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--color-ink-soft)', transform: 'rotate(-0.4deg)', display: 'inline-block' }}>
                  no games yet. go play.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
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
                        onUpdateMatchTeams={handleMatchTeamsChange}
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
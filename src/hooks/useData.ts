import { useState, useEffect } from 'react';
import { Player, Match } from '../types';
import { localStorage_storage } from '../lib/storage';
import * as database from '../lib/database'; // Changed import

export const useData = (userId?: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userId) {
        // Load from Supabase
        const [dbPlayers, dbMatches] = await Promise.all([
          database.getPlayers(userId),
          database.getMatches(userId)
        ]);
        setPlayers(dbPlayers);
        setMatches(dbMatches);
      } else {
        // Load from localStorage
        setPlayers(localStorage_storage.getPlayers());
        setMatches(localStorage_storage.getMatches());
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage on error
      setPlayers(localStorage_storage.getPlayers());
      setMatches(localStorage_storage.getMatches());
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newPlayers: Player[], newMatches: Match[]) => {
    try {
      if (userId) {
        // Data is saved individually through database functions
        // This function is mainly for localStorage fallback
      } else {
        localStorage_storage.savePlayers(newPlayers);
        localStorage_storage.saveMatches(newMatches);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      // Fallback to localStorage
      localStorage_storage.savePlayers(newPlayers);
      localStorage_storage.saveMatches(newMatches);
    }
  };

  const addPlayer = async (player: Player) => {
    try {
      if (userId) {
        const dbId = await database.addPlayer(player, userId);
        const newPlayer = { ...player, id: dbId };
        setPlayers(prev => [newPlayer, ...prev]);
      } else {
        const newPlayers = [player, ...players];
        setPlayers(newPlayers);
        await saveData(newPlayers, matches);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      // Fallback to localStorage
      const newPlayers = [player, ...players];
      setPlayers(newPlayers);
      localStorage_storage.savePlayers(newPlayers);
    }
  };

  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    try {
      if (userId) {
        await database.updatePlayer(playerId, updates);
      }
      
      const newPlayers = players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      );
      setPlayers(newPlayers);
      
      if (!userId) {
        await saveData(newPlayers, matches);
      }
    } catch (error) {
      console.error('Error updating player:', error);
      // Still update locally for better UX
      const newPlayers = players.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      );
      setPlayers(newPlayers);
      localStorage_storage.savePlayers(newPlayers);
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      if (userId) {
        await database.deletePlayer(playerId);
      }
      
      const newPlayers = players.filter(p => p.id !== playerId);
      setPlayers(newPlayers);
      
      if (!userId) {
        await saveData(newPlayers, matches);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      // Still delete locally for better UX
      const newPlayers = players.filter(p => p.id !== playerId);
      setPlayers(newPlayers);
      localStorage_storage.savePlayers(newPlayers);
    }
  };

  const addMatch = async (match: Match) => {
    try {
      if (userId) {
        const dbId = await database.addMatch(match, userId);
        const newMatch = { ...match, id: dbId };
        setMatches(prev => [newMatch, ...prev]);
        
        // Update player stats
        await updatePlayerStats(match);
      } else {
        const newMatches = [match, ...matches];
        setMatches(newMatches);
        
        // Update player stats
        await updatePlayerStats(match);
        
        // Save to localStorage
        const updatedPlayers = await getUpdatedPlayersAfterMatch(match);
        await saveData(updatedPlayers, newMatches);
      }
    } catch (error) {
      console.error('Error adding match:', error);
      // Fallback to localStorage
      const newMatches = [match, ...matches];
      setMatches(newMatches);
      localStorage_storage.saveMatches(newMatches);
    }
  };

  const updatePlayerStats = async (match: Match) => {
    if (!match.winnerId) return;

    const winningTeam = match.teams.find(t => t.id === match.winnerId);
    if (!winningTeam) return;

    const updatedPlayers = players.map(player => {
      const isInMatch = match.teams.some(team => 
        team.players.some(p => p.id === player.id)
      );
      const isWinner = winningTeam.players.some(p => p.id === player.id);
      
      if (isInMatch) {
        const newStats = {
          ...player,
          matchesPlayed: player.matchesPlayed + 1,
          wins: isWinner ? player.wins + 1 : player.wins,
        };
        
        // Update in Supabase if user is logged in
        if (userId) {
          database.updatePlayer(player.id, {
            matchesPlayed: newStats.matchesPlayed,
            wins: newStats.wins
          }).catch(console.error);
        }
        
        return newStats;
      }
      return player;
    });
    
    setPlayers(updatedPlayers);
  };

  const getUpdatedPlayersAfterMatch = async (match: Match): Promise<Player[]> => {
    if (!match.winnerId) return players;

    const winningTeam = match.teams.find(t => t.id === match.winnerId);
    if (!winningTeam) return players;

    return players.map(player => {
      const isInMatch = match.teams.some(team => 
        team.players.some(p => p.id === player.id)
      );
      const isWinner = winningTeam.players.some(p => p.id === player.id);
      
      if (isInMatch) {
        return {
          ...player,
          matchesPlayed: player.matchesPlayed + 1,
          wins: isWinner ? player.wins + 1 : player.wins,
        };
      }
      return player;
    });
  };

  const updateMatchTeams = async (matchId: string, newTeams: Team[]) => {
    try {
      if (userId) {
        await database.updateMatch(matchId, { teams: newTeams });
      }

      const newMatches = matches.map(m =>
        m.id === matchId ? { ...m, teams: newTeams } : m
      );
      setMatches(newMatches);

      if (!userId) {
        // For localStorage, we need to save the entire matches array along with players
        // Assuming players state is current, or fetch if necessary. For simplicity, using current players.
        await saveData(players, newMatches);
      }
    } catch (error) {
      console.error('Error updating match teams:', error);
      // Optionally, handle UI feedback for error
      // For now, ensure local state reflects optimistic update or previous state.
      // The current implementation updates local state before save, so it's optimistic.
    }
  };

  return {
    players,
    matches,
    loading,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addMatch,
    updateMatchTeams, // Add new function here
    refresh: loadData,
  };
};
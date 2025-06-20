import { Player, Match } from '../types';

const PLAYERS_KEY = 'squadmatch_players';
const MATCHES_KEY = 'squadmatch_matches';

export const localStorage_storage = {
  // Players
  getPlayers: (): Player[] => {
    try {
      const data = localStorage.getItem(PLAYERS_KEY);
      return data ? JSON.parse(data).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })) : [];
    } catch {
      return [];
    }
  },

  savePlayers: (players: Player[]) => {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  },

  // Matches
  getMatches: (): Match[] => {
    try {
      const data = localStorage.getItem(MATCHES_KEY);
      return data ? JSON.parse(data).map((m: any) => ({
        ...m,
        date: new Date(m.date)
      })) : [];
    } catch {
      return [];
    }
  },

  saveMatches: (matches: Match[]) => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  },

  clearAll: () => {
    localStorage.removeItem(PLAYERS_KEY);
    localStorage.removeItem(MATCHES_KEY);
  }
};
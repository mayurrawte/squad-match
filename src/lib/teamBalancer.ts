import { Player, Team } from '../types';

const TEAM_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#8B5A2B', // Brown
  '#F59E0B', // Amber
  '#10B981', // Emerald
];

export const generateBalancedTeams = (players: Player[], numTeams: number = 2): Team[] => {
  if (players.length < numTeams) {
    throw new Error('Not enough players to create teams');
  }

  // Sort players by skill rating (descending)
  const sortedPlayers = [...players].sort((a, b) => b.skillRating - a.skillRating);
  
  // Initialize teams
  const teams: Team[] = Array.from({ length: numTeams }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    players: [],
    averageSkill: 0,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
  }));

  // Distribute players using a snake draft approach
  let currentTeam = 0;
  let direction = 1;

  for (const player of sortedPlayers) {
    teams[currentTeam].players.push(player);
    
    // Move to next team
    currentTeam += direction;
    
    // Reverse direction when reaching the end
    if (currentTeam >= numTeams) {
      currentTeam = numTeams - 1;
      direction = -1;
    } else if (currentTeam < 0) {
      currentTeam = 0;
      direction = 1;
    }
  }

  // Calculate average skill for each team
  teams.forEach(team => {
    if (team.players.length > 0) {
      team.averageSkill = team.players.reduce((sum, player) => sum + player.skillRating, 0) / team.players.length;
      team.averageSkill = Math.round(team.averageSkill * 10) / 10; // Round to 1 decimal
    }
  });

  return teams;
};

export const getTeamBalance = (teams: Team[]): number => {
  if (teams.length < 2) return 0;
  
  const averages = teams.map(team => team.averageSkill);
  const maxAvg = Math.max(...averages);
  const minAvg = Math.min(...averages);
  
  return maxAvg - minAvg;
};
import { Player, Team } from '../types';

const TEAM_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#8B5A2B', // Brown
  '#F59E0B', // Amber
  '#10B981', // Emerald
];

// Helper function to calculate composite score
const getCompositeScore = (player: Player): number => {
  if (player.positionSkills &&
      typeof player.positionSkills.goalkeeper === 'number' &&
      typeof player.positionSkills.defender === 'number' &&
      typeof player.positionSkills.midfield === 'number' &&
      typeof player.positionSkills.forward === 'number') {
    return (player.positionSkills.goalkeeper + player.positionSkills.defender +
            player.positionSkills.midfield + player.positionSkills.forward +
            player.skillRating) / 5;
  }
  return player.skillRating;
};


export const generateBalancedTeams = (players: Player[], numTeams: number = 2): Team[] => {
  if (players.length < numTeams) {
    throw new Error('Not enough players to create teams');
  }

  // Initialize teams
  const teams: Team[] = Array.from({ length: numTeams }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    players: [],
    averageSkill: 0,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
  }));

  // Shuffle players for randomization, then sort by composite score
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const sortedPlayers = shuffledPlayers.sort((a, b) => getCompositeScore(b) - getCompositeScore(a));

  // Distribute players using simple snake draft
  // Pattern for 2 teams: 0, 1, 1, 0, 0, 1, 1, 0...
  // Pattern for 3 teams: 0, 1, 2, 2, 1, 0, 0, 1, 2...
  sortedPlayers.forEach((player, index) => {
    const cycle = Math.floor(index / numTeams);
    const posInCycle = index % numTeams;

    // If cycle is odd, reverse the order (snake pattern)
    const teamIndex = cycle % 2 === 0 ? posInCycle : numTeams - 1 - posInCycle;

    teams[teamIndex].players.push(player);
  });

  // Calculate average skill for each team
  teams.forEach(team => {
    if (team.players.length > 0) {
      const totalSkill = team.players.reduce((sum, player) => {
        return sum + getCompositeScore(player);
      }, 0);
      team.averageSkill = totalSkill / team.players.length;
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
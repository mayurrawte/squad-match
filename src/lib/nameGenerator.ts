// src/lib/nameGenerator.ts

const adjectives = [
  "Swift", "Mighty", "Brave", "Silent", "Fiery",
  "Shadow", "Electric", "Golden", "Iron", "Crystal",
  "Mystic", "Cosmic", "Arctic", "Desert", "Forest",
  "Crimson", "Azure", "Emerald", "Ruby", "Sapphire"
];

const nouns = [
  "Lions", "Tigers", "Eagles", "Sharks", "Wolves",
  "Hawks", "Dragons", "Serpents", "Phoenixes", "Griffins",
  "Panthers", "Cobras", "Vipers", "Jaguars", "Leopards",
  "Warriors", "Titans", "Gladiators", "Champions", "Legends"
];

/**
 * Generates a random team name by combining a random adjective and a random noun.
 * The name is returned in title case, e.g., "Swift Eagles".
 * @returns {string} A randomly generated team name.
 */
export const generateRandomTeamName = (): string => {
  const adjIndex = Math.floor(Math.random() * adjectives.length);
  const nounIndex = Math.floor(Math.random() * nouns.length);

  const randomAdjective = adjectives[adjIndex];
  const randomNoun = nouns[nounIndex];

  // Simple title case: capitalize first letter of each word
  const titleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

  return `${titleCase(randomAdjective)} ${titleCase(randomNoun)}`;
};

// Example usage (can be removed or kept for testing)
// console.log(generateRandomTeamName());
// console.log(generateRandomTeamName());
// console.log(generateRandomTeamName());

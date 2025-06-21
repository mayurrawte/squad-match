export interface Player {
  id: string;
  name: string;
  skillRating: number;
  positionSkills?: { [key: string]: number }; // e.g., { "forward": 5, "midfield": 4 }
  avatar: string;
  wins: number;
  matchesPlayed: number;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  averageSkill: number;
  color: string;
}

export interface Match {
  id: string;
  name: string;
  teams: Team[];
  winnerId?: string;
  date: Date;
  isPublic: boolean;
  createdBy?: string;
  creatorDisplayName?: string; // Added for creator's display name
  matchType?: MatchType;
}

export enum MatchType {
  Football = "football",
  Volleyball = "volleyball",
  Basketball = "basketball",
  Tennis = "tennis",
  Badminton = "badminton",
  Other = "other",
}

import { User as SupabaseUser } from '@supabase/supabase-js'; // Keep this for internal hook use

// Application-specific User type
export interface User {
  id: string; // Changed from uid to id
  email?: string; // Email might not always be present or needed by UI
  displayName?: string; // From user_metadata
  photoURL?: string;    // From user_metadata (e.g., avatar_url)
  // Add any other fields your application specifically needs from the user
}

export interface AppState {
  players: Player[];
  matches: Match[];
  currentUser: User | null;
  isLoading: boolean;
}
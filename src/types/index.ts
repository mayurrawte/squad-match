export interface Player {
  id: string;
  name: string;
  skillRating: number;
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
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface AppState {
  players: Player[];
  matches: Match[];
  currentUser: User | null;
  isLoading: boolean;
}
import { supabase } from './supabase';
import { Player, Match, MatchType } from '../types';

// Table names
const PLAYERS_TABLE = 'players';
const MATCHES_TABLE = 'matches';

// Players
export const addPlayer = async (player: Player, userId: string): Promise<string> => {
  try {
    const { id, ...playerData } = player; // Destructure to remove client-side id
    const { data, error } = await supabase
      .from(PLAYERS_TABLE)
      .insert({
        ...playerData, // Use the rest of the player data
        userId,       // This should be a UUID from auth
        createdAt: player.createdAt.toISOString() // Assuming player.createdAt is a Date object
      })
      .select('id')
      .single();

    if (error) throw error;
    if (!data || !data.id) throw new Error('Failed to create player or return id');
    return data.id;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const getPlayers = async (userId: string): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from(PLAYERS_TABLE)
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data ? data.map(p => ({ ...p, createdAt: new Date(p.createdAt) })) : [];
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<void> => {
  try {
    // If createdAt is being updated, ensure it's in ISO format
    const updateData = { ...updates };
    if (updates.createdAt && updates.createdAt instanceof Date) {
      updateData.createdAt = updates.createdAt.toISOString();
    } else if (updates.createdAt) {
      // If it's a string or number, try to parse it, otherwise assume it's already ISO
      const parsedDate = new Date(updates.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        updateData.createdAt = parsedDate.toISOString();
      }
    }

    const { error } = await supabase
      .from(PLAYERS_TABLE)
      .update(updateData)
      .eq('id', playerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const deletePlayer = async (playerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(PLAYERS_TABLE)
      .delete()
      .eq('id', playerId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

// Matches
export const addMatch = async (match: Match, userId: string): Promise<string> => {
  try {
    const { id, ...matchData } = match; // Exclude client-generated id if present
    const matchDataForSupabase = {
      ...matchData,
      userId, // Ensure userId is set for the record
      createdBy: userId,
      date: match.date.toISOString(),
      isPublic: typeof match.isPublic === 'boolean' ? match.isPublic : false,
      // Include matchType if it exists, otherwise it can be null or undefined in JS object
      ...(match.matchType && { matchType: match.matchType }),
      // Ensure teams is structured appropriately for Supabase (e.g., JSONB)
      // If teams contains nested objects/arrays, Supabase handles them well with JSONB type columns.
    };

    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .insert(matchDataForSupabase)
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error details:', error.message, error.details, error.hint);
      throw error;
    }
    if (!data || !data.id) throw new Error('Failed to create match or return id');
    return data.id;
  } catch (error) {
    console.error('Error adding match:', error);
    throw error;
  }
};


export const getMatches = async (userId: string): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data ? data.map(m => ({
      ...m,
      date: new Date(m.date),
      matchType: m.matchType as MatchType | undefined,
    })) : [];
  } catch (error) {
    console.error('Error getting matches:', error);
    throw error;
  }
};

export const getPublicMatches = async (limitCount: number = 50): Promise<Match[]> => {
  try {
    // Assuming your public user data (like displayName) is in a 'profiles' table
    // and it has a foreign key 'id' that matches 'auth.users.id' (which is stored in matches.createdBy)
    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .select(`
        *,
        profile:profiles (displayName)
      `) // Adjust 'profiles(displayName)' if your table/column names are different
      .eq('isPublic', true)
      .order('date', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error getting public matches:', error);
      // Fallback or re-throw, depending on how you want to handle missing profiles
      // For now, just log and continue, creatorDisplayName will be undefined
    }

    return data ? data.map((m: any) => {
      // Supabase returns related records as an object or an array of objects.
      // If 'profiles' is a one-to-one relation, m.profile will be an object.
      const creatorDisplayName = m.profiles?.displayName || undefined; // Use optional chaining

      return {
        ...m,
        date: new Date(m.date),
        matchType: m.matchType as MatchType | undefined,
        creatorDisplayName, // Add the fetched display name
        profile: undefined, // Remove the raw profile data from the final object if not needed elsewhere
      };
    }) : [];
  } catch (error) {
    // This catch is for other errors, like network issues with the primary query
    console.error('Critical error getting public matches:', error);
    throw error;
  }
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<void> => {
  try {
    const updateDataSupabase: any = { ...updates };

    if (updates.date && updates.date instanceof Date) {
      updateDataSupabase.date = updates.date.toISOString();
    } else if (updates.date) {
      const parsedDate = new Date(updates.date);
      if (!isNaN(parsedDate.getTime())) {
        updateDataSupabase.date = parsedDate.toISOString();
      }
    }

    // If winnerId is explicitly undefined, Supabase client typically sets it to null.
    // If it's part of the updates object with a value, it will be updated.
    // If not in updates, it remains unchanged.
    if (updates.hasOwnProperty('winnerId')) {
        updateDataSupabase.winnerId = updates.winnerId === undefined ? null : updates.winnerId;
    }

    if (updates.hasOwnProperty('matchType')) {
        updateDataSupabase.matchType = updates.matchType === undefined ? null : updates.matchType;
    }

    // Remove id from updates if present, as it's used in eq()
    if (updateDataSupabase.id) {
      delete updateDataSupabase.id;
    }

    const { error } = await supabase
      .from(MATCHES_TABLE)
      .update(updateDataSupabase)
      .eq('id', matchId);

    if (error) {
      console.error('Supabase error details:', error.message, error.details, error.hint);
      throw error;
    }
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(MATCHES_TABLE)
      .delete()
      .eq('id', matchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};
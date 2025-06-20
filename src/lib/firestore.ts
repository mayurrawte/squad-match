import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Player, Match } from '../types';

// Collections
const PLAYERS_COLLECTION = 'players';
const MATCHES_COLLECTION = 'matches';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// Players
export const addPlayer = async (player: Player, userId: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), {
      ...player,
      userId,
      createdAt: Timestamp.fromDate(player.createdAt)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const getPlayers = async (userId: string): Promise<Player[]> => {
  try {
    const q = query(
      collection(db, PLAYERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Player[];
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<void> => {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    await updateDoc(playerRef, updates);
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const deletePlayer = async (playerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, playerId));
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

// Matches
export const addMatch = async (match: Match, userId: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, MATCHES_COLLECTION), {
      ...match,
      userId,
      createdBy: userId,
      date: Timestamp.fromDate(match.date)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding match:', error);
    throw error;
  }
};

export const getMatches = async (userId: string): Promise<Match[]> => {
  try {
    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: convertTimestamp(doc.data().date)
    })) as Match[];
  } catch (error) {
    console.error('Error getting matches:', error);
    throw error;
  }
};

export const getPublicMatches = async (limitCount: number = 50): Promise<Match[]> => {
  try {
    const q = query(
      collection(db, MATCHES_COLLECTION),
      where('isPublic', '==', true),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: convertTimestamp(doc.data().date)
    })) as Match[];
  } catch (error) {
    console.error('Error getting public matches:', error);
    throw error;
  }
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<void> => {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    const updateData = { ...updates };
    
    // Convert Date to Timestamp if present
    if (updateData.date) {
      updateData.date = Timestamp.fromDate(updateData.date) as any;
    }
    
    await updateDoc(matchRef, updateData);
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MATCHES_COLLECTION, matchId));
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};
import { addDoc, updateDoc, deleteField, collection, Timestamp } from 'firebase/firestore';
import { addMatch, updateMatch } from '../firestore'; // Assuming getMatches etc. are also in this file
import { Match, MatchType, Team, Player } from '../../types';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'), // Import and retain default behavior
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteField: jest.fn(() => 'MOCK_DELETE_FIELD'), // deleteField returns a sentinel
  collection: jest.fn(),
  doc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ // Mock Timestamp.fromDate to return a simple object
      toDate: () => date, // For convertTimestamp, if it were used directly on this mock
      seconds: date.getTime() / 1000,
      nanoseconds: (date.getTime() % 1000) * 1000000,
    })),
  }
}));

const mockPlayer: Player = {
  id: 'p1', name: 'P One', skillRating: 10, avatar: 'ava.png', wins: 0, matchesPlayed: 0, createdAt: new Date()
};
const mockTeam: Team = { id: 'team1', name: 'Mock Team', players: [mockPlayer], averageSkill: 10, color: 'red' };

const baseMatchInput: Omit<Match, 'id' | 'date' | 'matchType'> = {
  name: 'Test Fixture',
  teams: [mockTeam],
  isPublic: false,
  // winnerId, createdBy would be set as per test case
};

describe('Firestore Match Functions', () => {
  beforeEach(() => {
    // Clear all mock implementations and calls
    (addDoc as jest.Mock).mockClear();
    (updateDoc as jest.Mock).mockClear();
    (deleteField as jest.Mock).mockClear();
    (collection as jest.Mock).mockReturnValue({} as any); // Mock collection to return a dummy object
    (Timestamp.fromDate as jest.Mock).mockImplementation(date => ({
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1e6,
        toDate: () => date,
      }));
  });

  describe('addMatch', () => {
    it('should include matchType in the data passed to addDoc if provided', async () => {
      const matchToAdd: Match = {
        ...baseMatchInput,
        id: 'temp-id', // id is stripped by addMatch
        date: new Date(),
        matchType: MatchType.Basketball,
        createdBy: 'user123',
      };
      await addMatch(matchToAdd, 'user123');

      expect(addDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBe(MatchType.Basketball);
      expect(calledWithData.name).toBe('Test Fixture');
      expect(calledWithData.isPublic).toBe(false);
      expect(calledWithData.createdBy).toBe('user123');
      expect(calledWithData.id).toBeUndefined(); // Ensure id is not passed
    });

    it('should not include matchType in the data passed to addDoc if not provided', async () => {
      const matchToAdd: Match = {
        ...baseMatchInput,
        id: 'temp-id',
        date: new Date(),
        // matchType is omitted
        createdBy: 'user123',
      };
      await addMatch(matchToAdd, 'user123');

      expect(addDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBeUndefined();
      expect(calledWithData.name).toBe('Test Fixture');
    });
  });

  describe('updateMatch', () => {
    const matchId = 'match123';

    it('should include matchType in updateData if provided', async () => {
      const updates: Partial<Match> = { matchType: MatchType.Tennis };
      await updateMatch(matchId, updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBe(MatchType.Tennis);
    });

    it('should use deleteField for matchType if updates.matchType is undefined', async () => {
      const updates: Partial<Match> = { matchType: undefined };
      await updateMatch(matchId, updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBe('MOCK_DELETE_FIELD');
      expect(deleteField).toHaveBeenCalledTimes(1);
    });

    it('should use deleteField for matchType if updates.matchType is null', async () => {
      const updates: Partial<Match> = { matchType: null as any }; // Cast to any to bypass type check for test
      await updateMatch(matchId, updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBe('MOCK_DELETE_FIELD');
      expect(deleteField).toHaveBeenCalledTimes(1);
    });

    it('should not include matchType in updateData if not present in updates', async () => {
      const updates: Partial<Match> = { name: 'Updated Name' };
      await updateMatch(matchId, updates);

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const calledWithData = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(calledWithData.matchType).toBeUndefined();
      expect(calledWithData.name).toBe('Updated Name');
    });

    it('should correctly handle winnerId updates alongside matchType', async () => {
        const updates: Partial<Match> = { winnerId: 'team1', matchType: MatchType.Volleyball };
        await updateMatch(matchId, updates);

        expect(updateDoc).toHaveBeenCalledTimes(1);
        const calledWithData = (updateDoc as jest.Mock).mock.calls[0][1];
        expect(calledWithData.winnerId).toBe('team1');
        expect(calledWithData.matchType).toBe(MatchType.Volleyball);
      });
  });
});

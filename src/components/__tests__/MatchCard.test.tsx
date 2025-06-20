import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchCard } from '../MatchCard';
import { Match, MatchType, Team, Player } from '../../types';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth
jest.mock('../../hooks/useAuth');

const mockPlayer: Player = {
  id: 'p1', name: 'Player 1', skillRating: 5, avatar: 'avatar.png', wins: 0, matchesPlayed: 0, createdAt: new Date(),
};
const mockTeam: Team = { id: 't1', name: 'Team Awesome', players: [mockPlayer], averageSkill: 5, color: 'cyan' };

const baseMatch: Omit<Match, 'matchType'> = {
  id: 'm1',
  name: 'Test Match',
  teams: [mockTeam],
  date: new Date(2023, 10, 5), // Nov 5, 2023
  isPublic: true,
  createdBy: 'user1',
};

describe('MatchCard', () => {
  beforeEach(() => {
    // Setup mock for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user1' }, // Mock user to enable update/edit buttons if needed
      // Add other properties returned by useAuth if your component uses them
    });
  });

  it('displays the match type when provided', () => {
    const matchWithFullType: Match = {
      ...baseMatch,
      matchType: MatchType.Football,
    };
    render(<MatchCard match={matchWithFullType} />);
    expect(screen.getByText(MatchType.Football.charAt(0).toUpperCase() + MatchType.Football.slice(1))).toBeInTheDocument();
    // Check for the Tag icon, assuming it's identifiable (e.g. by class or title if added)
    // For simplicity, we're checking text. If Tag icon had a specific testId or title, we'd use that.
  });

  it('displays another match type (e.g., Tennis) when provided', () => {
    const matchWithFullType: Match = {
      ...baseMatch,
      matchType: MatchType.Tennis,
    };
    render(<MatchCard match={matchWithFullType} />);
    expect(screen.getByText(MatchType.Tennis.charAt(0).toUpperCase() + MatchType.Tennis.slice(1))).toBeInTheDocument();
  });

  it('does not display the match type section if matchType is undefined', () => {
    const matchWithoutType: Match = {
      ...baseMatch,
      matchType: undefined, // Explicitly undefined
    };
    render(<MatchCard match={matchWithoutType} />);
    // We expect the text "Football", "Basketball", etc. NOT to be there.
    // A more robust way is to ensure the container for matchType is not rendered.
    // For now, we check that none of the known match types are rendered.
    Object.values(MatchType).forEach(type => {
      expect(screen.queryByText(type.charAt(0).toUpperCase() + type.slice(1))).not.toBeInTheDocument();
    });
  });

  it('displays match name and date', () => {
    const match: Match = { ...baseMatch, matchType: MatchType.Other };
    render(<MatchCard match={match} />);
    expect(screen.getByText('Test Match')).toBeInTheDocument();
    expect(screen.getByText(new Date(2023, 10, 5).toLocaleDateString())).toBeInTheDocument();
  });

  // Add more tests as needed for other functionalities of MatchCard
});

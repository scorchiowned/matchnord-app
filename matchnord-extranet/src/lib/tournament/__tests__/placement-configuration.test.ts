import { describe, it, expect } from 'vitest';

import {
  generatePlacementMatches,
  getPlacementSystemTemplate,
} from '../placement-configuration';

describe('Placement configuration generators', () => {
  const groupStandings = [
    {
      groupId: 'group-a',
      groupName: 'Group A',
      teams: [
        {
          id: 'group-a-team-1',
          name: 'Team A1',
          position: 1,
          points: 9,
          goalDifference: 10,
        },
        {
          id: 'group-a-team-2',
          name: 'Team A2',
          position: 2,
          points: 6,
          goalDifference: 5,
        },
        {
          id: 'group-a-team-3',
          name: 'Team A3',
          position: 3,
          points: 3,
          goalDifference: -2,
        },
        {
          id: 'group-a-team-4',
          name: 'Team A4',
          position: 4,
          points: 0,
          goalDifference: -8,
        },
      ],
    },
    {
      groupId: 'group-b',
      groupName: 'Group B',
      teams: [
        {
          id: 'group-b-team-1',
          name: 'Team B1',
          position: 1,
          points: 9,
          goalDifference: 12,
        },
        {
          id: 'group-b-team-2',
          name: 'Team B2',
          position: 2,
          points: 6,
          goalDifference: 6,
        },
        {
          id: 'group-b-team-3',
          name: 'Team B3',
          position: 3,
          points: 3,
          goalDifference: -3,
        },
        {
          id: 'group-b-team-4',
          name: 'Team B4',
          position: 4,
          points: 0,
          goalDifference: -9,
        },
      ],
    },
  ];

  it('produces winner placeholders for finals and losers for third place', () => {
    const config = getPlacementSystemTemplate('simple-placement');
    expect(config).toBeDefined();

    const results = generatePlacementMatches(groupStandings, config!);

    const championshipBracket = results.find(
      (bracket) => bracket.bracketId === 'championship'
    );
    expect(championshipBracket).toBeDefined();
    expect(championshipBracket?.matches.length).toBeGreaterThan(0);

    const finalMatch = championshipBracket?.matches.find(
      (match) => match.roundLabel === 'Final'
    );
    expect(finalMatch).toBeDefined();
    expect(finalMatch?.homeTeam.name).toContain('Winner of Game');
    expect(finalMatch?.awayTeam.name).toContain('Winner of Game');
    expect(finalMatch?.homeTeam.source?.type).toBe('match-winner');
    expect(finalMatch?.awayTeam.source?.type).toBe('match-winner');

    const thirdPlaceMatch = championshipBracket?.matches.find(
      (match) => match.roundLabel === 'Third Place'
    );
    expect(thirdPlaceMatch).toBeDefined();
    expect(thirdPlaceMatch?.homeTeam.name).toContain('Loser of Game');
    expect(thirdPlaceMatch?.awayTeam.name).toContain('Loser of Game');
    expect(thirdPlaceMatch?.homeTeam.source?.type).toBe('match-loser');
    expect(thirdPlaceMatch?.awayTeam.source?.type).toBe('match-loser');

    const matchLabels =
      championshipBracket?.matches.map((match) => match.matchLabel) ?? [];
    expect(new Set(matchLabels).size).toBe(matchLabels.length);
  });
});


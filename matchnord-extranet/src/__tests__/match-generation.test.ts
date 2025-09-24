import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinMatches,
  calculateRoundRobinMatches,
  calculateRoundRobinRounds,
  validateRoundRobin,
  generateSingleEliminationBracket,
  generatePlayoffBracket,
  calculateEliminationMatches,
  validateEliminationBracket,
  seedTeams,
  generateCrossDivisionPairings,
  validateSeedingRules,
  getSeedingRulesForGroupSize,
  STANDARD_4_TEAM_SEEDING,
  CROSS_DIVISION_SEEDING,
} from '@/lib/tournament/match-generation';

describe('Round Robin Match Generation', () => {
  const mockTeams = [
    { id: '1', name: 'Team A', shortName: 'A' },
    { id: '2', name: 'Team B', shortName: 'B' },
    { id: '3', name: 'Team C', shortName: 'C' },
    { id: '4', name: 'Team D', shortName: 'D' },
  ];

  it('should generate correct number of matches for 4 teams', () => {
    const result = generateRoundRobinMatches(mockTeams, 'group1', 'stage1');

    expect(result.totalMatches).toBe(6); // 4 teams = 6 matches
    expect(result.totalRounds).toBe(3); // 4 teams = 3 rounds
    expect(result.matchesPerRound).toBe(2); // 4 teams = 2 matches per round
    expect(result.matches).toHaveLength(6);
  });

  it('should generate correct number of matches for 3 teams', () => {
    const threeTeams = mockTeams.slice(0, 3);
    const result = generateRoundRobinMatches(threeTeams, 'group1', 'stage1');

    expect(result.totalMatches).toBe(6); // 3 teams = 6 matches (with bye team)
    expect(result.totalRounds).toBe(3); // 3 teams = 3 rounds (with bye)
    expect(result.matches).toHaveLength(3); // Only 3 actual matches (excluding bye)
  });

  it('should handle edge cases', () => {
    const result = generateRoundRobinMatches([], 'group1', 'stage1');
    expect(result.matches).toHaveLength(0);
    expect(result.totalMatches).toBe(0);

    const singleTeam = generateRoundRobinMatches(
      [mockTeams[0]],
      'group1',
      'stage1'
    );
    expect(singleTeam.matches).toHaveLength(0);
  });

  it('should calculate matches correctly', () => {
    expect(calculateRoundRobinMatches(4)).toBe(6);
    expect(calculateRoundRobinMatches(6)).toBe(15);
    expect(calculateRoundRobinMatches(8)).toBe(28);
  });

  it('should calculate rounds correctly', () => {
    expect(calculateRoundRobinRounds(4)).toBe(3);
    expect(calculateRoundRobinRounds(6)).toBe(5);
    expect(calculateRoundRobinRounds(8)).toBe(7);
  });

  it('should validate round robin correctly', () => {
    expect(validateRoundRobin(mockTeams).isValid).toBe(true);
    expect(validateRoundRobin([]).isValid).toBe(false);
    expect(validateRoundRobin([mockTeams[0]]).isValid).toBe(false);
  });
});

describe('Elimination Bracket Generation', () => {
  const mockTeams = [
    { id: '1', name: 'Team A', position: 1 },
    { id: '2', name: 'Team B', position: 2 },
    { id: '3', name: 'Team C', position: 3 },
    { id: '4', name: 'Team D', position: 4 },
  ];

  it('should generate single elimination bracket for 4 teams', () => {
    const result = generateSingleEliminationBracket(mockTeams, 'stage1');

    expect(result.format).toBe('single');
    expect(result.totalMatches).toBe(3); // 4 teams = 3 matches
    expect(result.totalRounds).toBe(2); // 4 teams = 2 rounds
    expect(result.matches).toHaveLength(3);
  });

  it('should generate playoff bracket for 4 teams', () => {
    const result = generatePlayoffBracket(mockTeams, 'stage1', true);

    expect(result.format).toBe('playoff');
    expect(result.totalMatches).toBe(4); // 2 semis + 1 third place + 1 final
    expect(result.totalRounds).toBe(3);
    expect(result.matches).toHaveLength(4);
  });

  it('should calculate elimination matches correctly', () => {
    expect(calculateEliminationMatches(4, 'single')).toBe(3);
    expect(calculateEliminationMatches(8, 'single')).toBe(7);
    expect(calculateEliminationMatches(4, 'playoff')).toBe(3);
  });

  it('should validate elimination bracket correctly', () => {
    expect(validateEliminationBracket(mockTeams, 'single').isValid).toBe(true);
    expect(validateEliminationBracket([], 'single').isValid).toBe(false);
    expect(validateEliminationBracket([mockTeams[0]], 'single').isValid).toBe(
      false
    );
  });
});

describe('Seeding Logic', () => {
  const mockGroups = [
    {
      id: 'group1',
      name: 'Group A',
      teams: [
        { id: '1', name: 'Team A', position: 1, points: 9 },
        { id: '2', name: 'Team B', position: 2, points: 6 },
        { id: '3', name: 'Team C', position: 3, points: 3 },
        { id: '4', name: 'Team D', position: 4, points: 0 },
      ],
    },
    {
      id: 'group2',
      name: 'Group B',
      teams: [
        { id: '5', name: 'Team E', position: 1, points: 9 },
        { id: '6', name: 'Team F', position: 2, points: 6 },
        { id: '7', name: 'Team G', position: 3, points: 3 },
        { id: '8', name: 'Team H', position: 4, points: 0 },
      ],
    },
  ];

  it('should seed teams correctly', () => {
    const result = seedTeams(mockGroups, STANDARD_4_TEAM_SEEDING);

    expect(result).toHaveLength(8);
    expect(result[0].team.name).toBe('Team A'); // Group A winner
    expect(result[1].team.name).toBe('Team E'); // Group B winner
    expect(result[2].team.name).toBe('Team B'); // Group A runner-up
    expect(result[3].team.name).toBe('Team F'); // Group B runner-up
  });

  it('should generate cross-division pairings', () => {
    const result = generateCrossDivisionPairings(
      mockGroups,
      CROSS_DIVISION_SEEDING
    );

    expect(result).toHaveLength(4);
    expect(result[0].team1.name).toBe('Team A'); // Group A winner
    expect(result[0].team2.name).toBe('Team H'); // Group B fourth place
    expect(result[1].team1.name).toBe('Team B'); // Group A runner-up
    expect(result[1].team2.name).toBe('Team G'); // Group B third place
  });

  it('should validate seeding rules', () => {
    const result = validateSeedingRules(mockGroups, STANDARD_4_TEAM_SEEDING);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should get seeding rules for group size', () => {
    const rules4 = getSeedingRulesForGroupSize(4);
    expect(rules4).toHaveLength(4);
    expect(rules4[0].groupPosition).toBe(1);
    expect(rules4[0].seed).toBe(1);

    const rules8 = getSeedingRulesForGroupSize(8);
    expect(rules8).toHaveLength(8);
  });
});

describe('Integration Tests', () => {
  it('should generate complete tournament matches', () => {
    const groups = [
      {
        id: 'group1',
        name: 'Group A',
        teams: [
          { id: '1', name: 'Team A', position: 1 },
          { id: '2', name: 'Team B', position: 2 },
          { id: '3', name: 'Team C', position: 3 },
          { id: '4', name: 'Team D', position: 4 },
        ],
        stageId: 'stage1',
      },
    ];

    // Generate round-robin matches
    const roundRobinResult = generateRoundRobinMatches(
      groups[0].teams,
      groups[0].id,
      groups[0].stageId
    );
    expect(roundRobinResult.matches).toHaveLength(6);

    // Generate elimination bracket
    const seededTeams = seedTeams(groups, STANDARD_4_TEAM_SEEDING);
    const eliminationResult = generateSingleEliminationBracket(
      seededTeams.map((s) => s.team),
      'stage2'
    );
    expect(eliminationResult.matches).toHaveLength(3);
  });
});

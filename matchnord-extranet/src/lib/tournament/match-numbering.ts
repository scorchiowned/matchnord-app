import { db } from '@/lib/db';

/**
 * Generates a match number for a new match
 * Format options:
 * - 'simple': M1, M2, M3... (per tournament)
 * - 'group': G1-M1, G1-M2, G2-M1... (per group)
 * - 'division': D1-M1, D1-M2, D2-M1... (per division)
 */
export async function generateMatchNumber(
  tournamentId: string,
  groupId?: string | null,
  divisionId?: string | null,
  format: 'simple' | 'group' | 'division' = 'group'
): Promise<string> {
  try {
    if (format === 'group' && groupId) {
      // Get group name for better readability
      const group = await db.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });
      const groupName = group?.name || 'G';
      
      // Count existing matches in this group
      const existingMatches = await db.match.count({
        where: {
          tournamentId,
          groupId,
        },
      });
      return `${groupName}-M${existingMatches + 1}`;
    }

    if (format === 'division' && divisionId) {
      // Get division name for better readability
      const division = await db.division.findUnique({
        where: { id: divisionId },
        select: { name: true },
      });
      const divisionName = division?.name || 'D';
      
      // Count existing matches in this division
      const existingMatches = await db.match.count({
        where: {
          tournamentId,
          divisionId,
        },
      });
      return `${divisionName}-M${existingMatches + 1}`;
    }

    // Simple format: count all matches in tournament
    const existingMatches = await db.match.count({
      where: {
        tournamentId,
      },
    });
    return `M${existingMatches + 1}`;
  } catch (error) {
    console.error('Error generating match number:', error);
    // Fallback to timestamp-based number
    return `M${Date.now()}`;
  }
}

/**
 * Get the group number within a tournament (for numbering purposes)
 */
async function getGroupNumber(
  tournamentId: string,
  groupId: string
): Promise<number> {
  const groups = await db.group.findMany({
    where: {
      division: {
        tournamentId,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
    },
  });

  const groupIndex = groups.findIndex((g) => g.id === groupId);
  return groupIndex >= 0 ? groupIndex + 1 : 1;
}

/**
 * Get the division number within a tournament (for numbering purposes)
 */
async function getDivisionNumber(
  tournamentId: string,
  divisionId: string
): Promise<number> {
  const divisions = await db.division.findMany({
    where: {
      tournamentId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
    },
  });

  const divisionIndex = divisions.findIndex((d) => d.id === divisionId);
  return divisionIndex >= 0 ? divisionIndex + 1 : 1;
}

/**
 * Format match number from generated match (round-robin, elimination, etc.)
 * Converts numeric matchNumber to string format
 */
export function formatMatchNumber(
  matchNumber: number,
  groupId?: string,
  round?: number
): string {
  if (groupId && round) {
    return `G${groupId.slice(-4)}-R${round}-M${matchNumber}`;
  }
  if (groupId) {
    return `G${groupId.slice(-4)}-M${matchNumber}`;
  }
  return `M${matchNumber}`;
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  DivisionFormatConfiguration, 
  validateDivisionFormat,
  getFormatTemplate,
  createDivisionFormatFromTemplate,
  calculateEstimatedMatches
} from '@/lib/tournament/format-configuration';

/**
 * GET /api/v1/divisions/[id]/format
 * Get division format configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const division = await db.division.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: {
            assignments: {
              where: { userId: session.user.id }
            }
          }
        },
        groups: {
          include: {
            teams: true
          }
        }
      }
    });

    if (!division) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = 
      session.user.role === 'ADMIN' ||
      division.tournament.assignments.some(
        assignment => ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get current format configuration from division metadata
    const formatConfig = division.metadata as DivisionFormatConfiguration | null;
    
    // Calculate current team count
    const teamCount = division.groups.reduce((total, group) => total + group.teams.length, 0);

    return NextResponse.json({
      divisionId: division.id,
      divisionName: division.name,
      teamCount,
      formatConfig,
      estimatedMatches: formatConfig ? calculateEstimatedMatches(teamCount, formatConfig) : 0
    });

  } catch (error) {
    console.error('Error fetching division format:', error);
    return NextResponse.json(
      { error: 'Failed to fetch division format' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/divisions/[id]/format
 * Update division format configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { formatConfig, templateId, customSettings } = body;

    // Validate input
    if (!formatConfig && !templateId) {
      return NextResponse.json(
        { error: 'Either formatConfig or templateId must be provided' },
        { status: 400 }
      );
    }

    const division = await db.division.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: {
            assignments: {
              where: { userId: session.user.id }
            }
          }
        },
        groups: {
          include: {
            teams: true
          }
        }
      }
    });

    if (!division) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = 
      session.user.role === 'ADMIN' ||
      division.tournament.assignments.some(
        assignment => ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if division is locked
    if (division.isLocked) {
      return NextResponse.json(
        { error: 'Cannot modify format of locked division' },
        { status: 400 }
      );
    }

    let finalFormatConfig: DivisionFormatConfiguration;

    if (templateId) {
      // Create format from template
      const templateConfig = createDivisionFormatFromTemplate(templateId, params.id, customSettings);
      if (!templateConfig) {
        return NextResponse.json(
          { error: 'Invalid template ID' },
          { status: 400 }
        );
      }
      finalFormatConfig = templateConfig;
    } else {
      // Use provided format config
      finalFormatConfig = formatConfig;
    }

    // Validate format configuration
    const validation = validateDivisionFormat(finalFormatConfig);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid format configuration',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Update division with new format configuration
    const updatedDivision = await db.division.update({
      where: { id: params.id },
      data: {
        metadata: finalFormatConfig
      },
      include: {
        groups: {
          include: {
            teams: true
          }
        }
      }
    });

    // Calculate team count and estimated matches
    const teamCount = updatedDivision.groups.reduce((total, group) => total + group.teams.length, 0);
    const estimatedMatches = calculateEstimatedMatches(teamCount, finalFormatConfig);

    return NextResponse.json({
      success: true,
      divisionId: updatedDivision.id,
      formatConfig: finalFormatConfig,
      teamCount,
      estimatedMatches,
      warnings: validation.warnings
    });

  } catch (error) {
    console.error('Error updating division format:', error);
    return NextResponse.json(
      { error: 'Failed to update division format' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/divisions/[id]/format/generate-matches
 * Generate matches based on format configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phaseId, regenerate = false } = body;

    const division = await db.division.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: {
            assignments: {
              where: { userId: session.user.id }
            }
          }
        },
        groups: {
          include: {
            teams: true,
            matches: true
          }
        }
      }
    });

    if (!division) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = 
      session.user.role === 'ADMIN' ||
      division.tournament.assignments.some(
        assignment => ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get format configuration
    const formatConfig = division.metadata as DivisionFormatConfiguration | null;
    if (!formatConfig) {
      return NextResponse.json(
        { error: 'No format configuration found for division' },
        { status: 400 }
      );
    }

    // Find the phase to generate matches for
    const phase = formatConfig.phases.find(p => p.id === phaseId);
    if (!phase || !phase.enabled) {
      return NextResponse.json(
        { error: 'Phase not found or not enabled' },
        { status: 400 }
      );
    }

    // Check if matches already exist for this phase
    const existingMatches = division.groups.flatMap(group => 
      group.matches.filter(match => match.phaseId === phaseId)
    );

    if (existingMatches.length > 0 && !regenerate) {
      return NextResponse.json(
        { error: 'Matches already exist for this phase. Use regenerate=true to regenerate.' },
        { status: 400 }
      );
    }

    // TODO: Implement match generation based on phase type
    // This will be implemented in the next step when we create the match generation API

    return NextResponse.json({
      success: true,
      message: 'Match generation will be implemented in the next step',
      phaseId,
      phaseType: phase.type,
      existingMatches: existingMatches.length
    });

  } catch (error) {
    console.error('Error generating matches:', error);
    return NextResponse.json(
      { error: 'Failed to generate matches' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.id;
    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get('divisionId');

    // Get tournament with placement configuration
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        divisions: divisionId
          ? {
              where: { id: divisionId },
            }
          : true,
        assignments: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must have canConfigure permission
    const hasPermission = await PermissionManager.canConfigureTournament(
      (session.user as any).id,
      tournamentId
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Extract placement configuration from division metadata
    const placementConfigs = tournament.divisions.map((division) => {
      const metadata = division.metadata as any;
      return {
        divisionId: division.id,
        divisionName: division.name,
        placementConfig: metadata?.placementSystem || null,
      };
    });

    return NextResponse.json({
      tournamentId,
      placementConfigs,
    });
  } catch (error) {
    console.error('Error fetching placement configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.id;
    const body = await request.json();
    const { divisionId, placementConfig } = body;

    if (!divisionId) {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      );
    }

    // Check tournament permissions
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        assignments: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must have canConfigure permission
    const hasPermission = await PermissionManager.canConfigureTournament(
      (session.user as any).id,
      tournamentId
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get current division metadata
    const division = await db.division.findUnique({
      where: { id: divisionId },
    });

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Update division metadata with placement configuration
    const currentMetadata = (division.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      placementSystem: placementConfig,
    };

    await db.division.update({
      where: { id: divisionId },
      data: {
        metadata: updatedMetadata,
      },
    });

    return NextResponse.json({
      message: 'Placement configuration saved successfully',
      divisionId,
      placementConfig,
    });
  } catch (error) {
    console.error('Error saving placement configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


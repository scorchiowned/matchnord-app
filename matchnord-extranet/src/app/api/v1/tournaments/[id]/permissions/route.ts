import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tournamentId = params.id;
    const userId = (session.user as any).id;

    const permissions = await PermissionManager.getTournamentPermissions(
      userId,
      tournamentId
    );

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching tournament permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


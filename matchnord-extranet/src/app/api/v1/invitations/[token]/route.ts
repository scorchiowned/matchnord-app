import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await db.userInvitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Get tournament info if tournamentId exists
    let tournamentName: string | null = null;
    if (invitation.tournamentId) {
      const tournament = await db.tournament.findUnique({
        where: { id: invitation.tournamentId },
        select: { id: true, name: true },
      });
      tournamentName = tournament?.name || null;
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      tournamentId: invitation.tournamentId,
      tournamentName,
      canConfigure: invitation.canConfigure,
      canManageScores: invitation.canManageScores,
      isReferee: invitation.isReferee,
      status: invitation.status,
      expires: invitation.expires.toISOString(),
      inviterName: invitation.inviter?.name || null,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


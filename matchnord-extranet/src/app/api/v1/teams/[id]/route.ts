import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const teamId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.countryId) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    // Get the team and check permissions
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: {
          select: {
            id: true,
            createdById: true,
            organizationId: true,
          },
        },
        clubRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check permissions
    const canEditTeam =
      user.role === 'ADMIN' ||
      team.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: team.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditTeam) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this team' },
        { status: 403 }
      );
    }

    // Update the team
    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: {
        name: body.name,
        shortName: body.shortName || body.name.substring(0, 3).toUpperCase(),
        logo: body.logo !== undefined ? body.logo : undefined,
        clubId: body.clubId !== undefined ? body.clubId : null,
        club: body.club !== undefined ? body.club : undefined,
        city: body.city !== undefined ? body.city : undefined,
        countryId: body.countryId,
        level: body.level !== undefined ? body.level : undefined,
        managerId: body.managerId !== undefined ? body.managerId : null,
        // Contact details
        contactFirstName: body.contactFirstName !== undefined ? body.contactFirstName : undefined,
        contactLastName: body.contactLastName !== undefined ? body.contactLastName : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone : undefined,
        contactAddress: body.contactAddress !== undefined ? body.contactAddress : undefined,
        contactPostalCode: body.contactPostalCode !== undefined ? body.contactPostalCode : undefined,
        contactCity: body.contactCity !== undefined ? body.contactCity : undefined,
        // Billing details
        billingName: body.billingName !== undefined ? body.billingName : undefined,
        billingAddress: body.billingAddress !== undefined ? body.billingAddress : undefined,
        billingPostalCode: body.billingPostalCode !== undefined ? body.billingPostalCode : undefined,
        billingCity: body.billingCity !== undefined ? body.billingCity : undefined,
        billingEmail: body.billingEmail !== undefined ? body.billingEmail : undefined,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clubRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const teamId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Get the team and check permissions
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: {
          select: {
            id: true,
            createdById: true,
            organizationId: true,
          },
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            players: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if team has matches or players
    if (team._count.homeMatches > 0 || team._count.awayMatches > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team with existing matches' },
        { status: 400 }
      );
    }

    // Check permissions
    const canDeleteTeam =
      user.role === 'ADMIN' ||
      team.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: team.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canDeleteTeam) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this team' },
        { status: 403 }
      );
    }

    // Delete the team
    await db.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const countryId = searchParams.get('countryId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (countryId) {
      // Check if countryId is a UUID (database ID) or country name
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          countryId
        ) || /^[a-z0-9]{25}$/i.test(countryId); // CUID format

      if (isUUID) {
        where.countryId = countryId;
      } else {
        // Treat as country name and find the country ID
        const country = await db.country.findFirst({
          where: {
            OR: [
              { name: { contains: countryId, mode: 'insensitive' } },
              { code: { contains: countryId, mode: 'insensitive' } },
            ],
          },
        });

        if (country) {
          where.countryId = country.id;
        } else {
          // If country not found, return empty results
          return NextResponse.json({
            clubs: [],
            total: 0,
            limit,
            offset,
          });
        }
      }
    }

    const clubs = await db.club.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await db.club.count({ where });

    return NextResponse.json({
      clubs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user as any;

    // Only admins can create clubs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      shortName,
      logo,
      city,
      countryId,
      website,
      description,
      foundedYear,
    } = body;

    // Validate required fields
    if (!name || !countryId) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    // Check if club with same name already exists
    const existingClub = await db.club.findFirst({
      where: { name },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: 'Club with this name already exists' },
        { status: 409 }
      );
    }

    // Create the club
    const club = await db.club.create({
      data: {
        name,
        shortName,
        logo,
        city,
        countryId,
        website,
        description,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

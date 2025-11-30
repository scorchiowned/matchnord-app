import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all unique birth years from divisions
    const birthYears = await db.division.findMany({
      select: {
        birthYear: true,
      },
      where: {
        birthYear: {
          not: null,
        },
      },
      distinct: ['birthYear'],
      orderBy: {
        birthYear: 'desc', // Most recent birth years first
      },
    });

    const uniqueBirthYears = birthYears
      .map((division) => division.birthYear)
      .filter((birthYear): birthYear is number => birthYear !== null)
      .map((birthYear) => {
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        return {
          value: birthYear.toString(),
          label: `${birthYear} (Age ${age})`,
          birthYear: birthYear,
          age: age,
        };
      });

    return NextResponse.json({
      success: true,
      ageGroups: uniqueBirthYears,
      total: uniqueBirthYears.length,
    });
  } catch (error) {
    console.error('Error fetching age groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch age groups' },
      { status: 500 }
    );
  }
}

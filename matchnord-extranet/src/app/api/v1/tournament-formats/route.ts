import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  TOURNAMENT_FORMAT_TEMPLATES,
  getSuitableTemplates,
  getFormatTemplate
} from '@/lib/tournament/format-configuration';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tournament-formats
 * Get available tournament format templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamCount = searchParams.get('teamCount');
    const templateId = searchParams.get('templateId');

    // If specific template requested
    if (templateId) {
      const template = getFormatTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // If team count specified, return suitable templates
    if (teamCount) {
      const count = parseInt(teamCount);
      if (isNaN(count) || count < 1) {
        return NextResponse.json(
          { error: 'Invalid team count' },
          { status: 400 }
        );
      }

      const suitableTemplates = getSuitableTemplates(count);
      return NextResponse.json({ 
        templates: suitableTemplates,
        teamCount: count
      });
    }

    // Return all templates
    return NextResponse.json({ 
      templates: TOURNAMENT_FORMAT_TEMPLATES 
    });

  } catch (error) {
    console.error('Error fetching tournament formats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament formats' },
      { status: 500 }
    );
  }
}


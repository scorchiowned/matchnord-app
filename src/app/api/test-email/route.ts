import { NextRequest, NextResponse } from 'next/server';
import { emailService, testEmailService } from '@/lib/email';
import { z } from 'zod';

const TestEmailInput = z.object({
  type: z.enum([
    'test',
    'registration',
    'status',
    'announcement',
    'match',
    'team-manager-welcome',
  ]),
  to: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to } = TestEmailInput.parse(body);

    let result;

    switch (type) {
      case 'test':
        result = await testEmailService();
        break;

      case 'registration':
        result = await emailService.sendRegistrationConfirmation({
          to,
          teamName: 'Test Team FC',
          tournamentName: 'Summer Championship 2024',
          divisionName: 'Youth Division',
          managerName: 'Test Manager',
          registrationId: 'test-123',
          paymentAmount: 50,
          paymentMethod: 'CARD',
          tournamentStartDate: '2024-07-15',
          tournamentLocation: 'Helsinki, Finland',
        });
        break;

      case 'status':
        result = await emailService.sendRegistrationStatusUpdate({
          to,
          teamName: 'Test Team FC',
          tournamentName: 'Summer Championship 2024',
          status: 'APPROVED',
          managerName: 'Test Manager',
          notes:
            'Your registration has been approved. Welcome to the tournament!',
        });
        break;

      case 'announcement':
        result = await emailService.sendTournamentAnnouncement({
          to,
          tournamentName: 'Summer Championship 2024',
          subject: 'Important Tournament Update',
          message:
            "We are excited to announce that the tournament schedule has been finalized. Please check the website for your team's match times and venues.\n\nGood luck to all teams!",
          announcementDate: new Date().toLocaleDateString(),
        });
        break;

      case 'match':
        result = await emailService.sendMatchNotification({
          to,
          teamName: 'Test Team FC',
          opponentName: 'Rival United',
          matchDate: '2024-07-20',
          matchTime: '14:00',
          venue: 'Central Stadium, Field 1',
          tournamentName: 'Summer Championship 2024',
          type: 'UPCOMING',
        });
        break;

      case 'team-manager-welcome':
        result = await emailService.sendTeamManagerWelcome({
          to,
          managerName: 'Test Manager',
          email: to,
          loginUrl: 'http://localhost:3000/auth/signin',
          isNewUser: true,
          temporaryPassword: 'temp123',
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Test email of type '${type}' sent to ${to}`,
    });
  } catch (error) {
    console.error('Test email error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint',
    availableTypes: [
      'test',
      'registration',
      'status',
      'announcement',
      'match',
      'team-manager-welcome',
    ],
    usage: 'POST with { "type": "registration", "to": "manttila83@gmail.com" }',
  });
}

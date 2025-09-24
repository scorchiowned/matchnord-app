import { Resend } from 'resend';
import { env } from './env';

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Email template interfaces
interface BaseEmailData {
  to: string;
  from?: string;
}

interface RegistrationConfirmationData extends BaseEmailData {
  teamName: string;
  tournamentName: string;
  divisionName: string;
  managerName: string;
  registrationId: string;
  paymentAmount?: number;
  paymentMethod?: string;
  tournamentStartDate: string;
  tournamentLocation: string;
}

interface RegistrationStatusUpdateData extends BaseEmailData {
  teamName: string;
  tournamentName: string;
  status: 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  managerName: string;
  notes?: string;
}

interface TournamentAnnouncementData extends BaseEmailData {
  tournamentName: string;
  subject: string;
  message: string;
  announcementDate: string;
}

interface MatchNotificationData extends BaseEmailData {
  teamName: string;
  opponentName: string;
  matchDate: string;
  matchTime: string;
  venue: string;
  tournamentName: string;
  type: 'UPCOMING' | 'RESULT' | 'SCHEDULE_CHANGE';
  score?: string;
}

interface TeamManagerWelcomeData extends BaseEmailData {
  managerName: string;
  email: string;
  temporaryPassword?: string;
  loginUrl: string;
  isNewUser: boolean;
}

// Email service class
export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    if (!resend) {
      console.warn(
        'Resend not configured - email would be sent:',
        data.subject
      );
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const result = await resend.emails.send({
        from:
          data.from ||
          env.EMAIL_FROM ||
          'Tournament System <noreply@tournament.com>',
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Registration confirmation email
  async sendRegistrationConfirmation(data: RegistrationConfirmationData) {
    const subject = `Registration Confirmed - ${data.tournamentName}`;
    const html = this.generateRegistrationConfirmationHTML(data);

    return this.sendEmail({
      to: data.to,
      subject,
      html,
      from: data.from,
    });
  }

  // Registration status update email
  async sendRegistrationStatusUpdate(data: RegistrationStatusUpdateData) {
    const statusText =
      data.status === 'APPROVED'
        ? 'Approved'
        : data.status === 'REJECTED'
          ? 'Rejected'
          : 'Waitlisted';
    const subject = `Registration ${statusText} - ${data.tournamentName}`;
    const html = this.generateRegistrationStatusHTML(data);

    return this.sendEmail({
      to: data.to,
      subject,
      html,
      from: data.from,
    });
  }

  // Tournament announcement email
  async sendTournamentAnnouncement(data: TournamentAnnouncementData) {
    const html = this.generateTournamentAnnouncementHTML(data);

    return this.sendEmail({
      to: data.to,
      subject: data.subject,
      html,
      from: data.from,
    });
  }

  // Match notification email
  async sendMatchNotification(data: MatchNotificationData) {
    let subject = '';
    switch (data.type) {
      case 'UPCOMING':
        subject = `Upcoming Match - ${data.teamName} vs ${data.opponentName}`;
        break;
      case 'RESULT':
        subject = `Match Result - ${data.teamName} vs ${data.opponentName}`;
        break;
      case 'SCHEDULE_CHANGE':
        subject = `Match Schedule Update - ${data.teamName} vs ${data.opponentName}`;
        break;
    }

    const html = this.generateMatchNotificationHTML(data);

    return this.sendEmail({
      to: data.to,
      subject,
      html,
      from: data.from,
    });
  }

  // Team Manager welcome email
  async sendTeamManagerWelcome(data: TeamManagerWelcomeData) {
    const subject = data.isNewUser
      ? 'Welcome to Tournament Management System - Team Manager Account Created'
      : 'Tournament Management System - Your Team Manager Account';
    const html = this.generateTeamManagerWelcomeHTML(data);

    return this.sendEmail({
      to: data.to,
      subject,
      html,
      from: data.from,
    });
  }

  // HTML template generators
  private generateRegistrationConfirmationHTML(
    data: RegistrationConfirmationData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 Registration Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.managerName},</p>
            
            <p>Great news! Your team registration has been successfully submitted and confirmed.</p>
            
            <div class="info-box">
              <h3>Registration Details:</h3>
              <p><strong>Team Name:</strong> ${data.teamName}</p>
              <p><strong>Tournament:</strong> ${data.tournamentName}</p>
              <p><strong>Division:</strong> ${data.divisionName}</p>
              <p><strong>Registration ID:</strong> ${data.registrationId}</p>
              <p><strong>Tournament Start:</strong> ${data.tournamentStartDate}</p>
              <p><strong>Location:</strong> ${data.tournamentLocation}</p>
              ${data.paymentAmount ? `<p><strong>Payment:</strong> €${data.paymentAmount} via ${data.paymentMethod}</p>` : ''}
            </div>
            
            <p>You will receive further updates about schedules, venues, and match details as the tournament approaches.</p>
            
            <a href="${env.NEXTAUTH_URL}/tournaments/${data.registrationId}" class="button">View Tournament Details</a>
            
            <p>If you have any questions, please don't hesitate to contact the tournament organizers.</p>
            
            <p>Good luck with your preparation!</p>
          </div>
          <div class="footer">
            <p>Tournament Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateRegistrationStatusHTML(
    data: RegistrationStatusUpdateData
  ): string {
    const isApproved = data.status === 'APPROVED';
    const isRejected = data.status === 'REJECTED';

    const statusColor = isApproved
      ? '#10b981'
      : isRejected
        ? '#ef4444'
        : '#f59e0b';
    const statusEmoji = isApproved ? '✅' : isRejected ? '❌' : '⏳';
    const statusText = isApproved
      ? 'Approved'
      : isRejected
        ? 'Rejected'
        : 'Waitlisted';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration ${statusText}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${statusEmoji} Registration ${statusText}</h1>
          </div>
          <div class="content">
            <p>Dear ${data.managerName},</p>
            
            <div class="status-box">
              <h3>Status Update:</h3>
              <p><strong>Team:</strong> ${data.teamName}</p>
              <p><strong>Tournament:</strong> ${data.tournamentName}</p>
              <p><strong>Status:</strong> ${statusText}</p>
              ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            ${
              isApproved
                ? `
              <p>🎉 Congratulations! Your team registration has been approved. You will receive match schedules and further details soon.</p>
            `
                : isRejected
                  ? `
              <p>Unfortunately, your registration could not be approved at this time. Please contact the tournament organizers if you have questions.</p>
            `
                  : `
              <p>Your team has been placed on the waitlist. You will be notified if a spot becomes available.</p>
            `
            }
          </div>
          <div class="footer">
            <p>Tournament Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTournamentAnnouncementHTML(
    data: TournamentAnnouncementData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📢 ${data.tournamentName}</h1>
          </div>
          <div class="content">
            <div class="message-box">
              <p><strong>Date:</strong> ${data.announcementDate}</p>
              <div style="margin-top: 20px;">
                ${data.message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Tournament Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateMatchNotificationHTML(data: MatchNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Match Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .match-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚽ ${data.type === 'UPCOMING' ? 'Upcoming Match' : data.type === 'RESULT' ? 'Match Result' : 'Schedule Update'}</h1>
          </div>
          <div class="content">
            <div class="match-box">
              <h3>${data.teamName} vs ${data.opponentName}</h3>
              <p><strong>Tournament:</strong> ${data.tournamentName}</p>
              <p><strong>Date:</strong> ${data.matchDate}</p>
              <p><strong>Time:</strong> ${data.matchTime}</p>
              <p><strong>Venue:</strong> ${data.venue}</p>
              ${data.score ? `<p><strong>Final Score:</strong> ${data.score}</p>` : ''}
            </div>
            
            ${
              data.type === 'UPCOMING'
                ? `
              <p>Your upcoming match is scheduled. Please ensure your team arrives at least 30 minutes before kickoff.</p>
            `
                : data.type === 'RESULT'
                  ? `
              <p>The match has concluded. Check the tournament standings for updated positions.</p>
            `
                  : `
              <p>There has been a change to your match schedule. Please note the updated details above.</p>
            `
            }
          </div>
          <div class="footer">
            <p>Tournament Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateTeamManagerWelcomeHTML(data: TeamManagerWelcomeData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome Team Manager</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; padding: 25px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .credentials-box { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #f59e0b; }
            .features-list { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .features-list ul { margin: 0; padding-left: 20px; }
            .features-list li { margin: 8px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .highlight { background: #dbeafe; padding: 2px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 Welcome Team Manager!</h1>
            <p style="margin: 0; opacity: 0.9;">Your tournament management account is ready</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h3>Hello ${data.managerName}! 👋</h3>
              
              ${
                data.isNewUser
                  ? `
                <p>Your <strong>Team Manager</strong> account has been successfully created! You now have access to our tournament management system where you can:</p>
              `
                  : `
                <p>We've set up your <strong>Team Manager</strong> account in our tournament management system. You now have access to:</p>
              `
              }
            </div>
            
            <div class="features-list">
              <h4>🎯 What you can do as a Team Manager:</h4>
              <ul>
                <li><strong>Create Tournaments:</strong> Set up new tournaments with divisions, venues, and rules</li>
                <li><strong>Manage Registrations:</strong> Review and approve team registrations</li>
                <li><strong>Schedule Matches:</strong> Organize match schedules and venues</li>
                <li><strong>Track Results:</strong> Enter and manage match results and standings</li>
                <li><strong>Communicate:</strong> Send announcements to teams and participants</li>
                <li><strong>Generate Reports:</strong> Access tournament analytics and reports</li>
              </ul>
            </div>
            
            ${
              data.temporaryPassword
                ? `
              <div class="credentials-box">
                <h4>⚠️ Your Login Credentials:</h4>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong> <span class="highlight">${data.temporaryPassword}</span></p>
                <p><small><em>Please change your password after your first login for security.</em></small></p>
              </div>
            `
                : `
              <div class="welcome-box">
                <p><strong>Login Email:</strong> ${data.email}</p>
                <p>Use your existing password or request a password reset if needed.</p>
              </div>
            `
            }
            
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Access Tournament Management</a>
            </div>
            
            <div class="welcome-box">
              <h4>🚀 Getting Started:</h4>
              <ol>
                <li>Click the button above to access your dashboard</li>
                <li>Complete your profile information</li>
                <li>Explore the tournament creation wizard</li>
                <li>Check out the help documentation for tips and best practices</li>
              </ol>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p><strong>Welcome to the team! 🎉</strong></p>
          </div>
          <div class="footer">
            <p>Tournament Management System</p>
            <p>This email was sent because a Team Manager account was created with this email address.</p>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Helper function for testing email service
export async function testEmailService() {
  if (!resend) {
    console.log('📧 Email service not configured (missing RESEND_API_KEY)');
    return false;
  }

  try {
    const result = await resend.emails.send({
      //from: env.EMAIL_FROM || 'Tournament System <test@tournament.com>',
      from: 'Acme <onboarding@resend.dev>',
      to: 'manttila83@gmail.com',
      subject: 'Email Service Test',
      html: '<p>Email service is working correctly!</p>',
    });

    console.log('📧 Email service test successful:', result);
    return true;
  } catch (error) {
    console.error('📧 Email service test failed:', error);
    return false;
  }
}

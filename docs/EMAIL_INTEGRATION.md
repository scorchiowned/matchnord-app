# 📧 Email Integration with Resend

## Overview

The Tournament Management System now includes comprehensive email integration using [Resend](https://resend.com/), a modern email service designed for developers. This integration provides automated email notifications for various user actions and system events.

## ✅ Implemented Email Types

### 1. **Team Manager Welcome Email**

- **Trigger**: When a new TEAM_MANAGER user account is created
- **Recipients**: New Team Manager
- **Content**: Welcome message, account details, getting started guide, login instructions
- **Features**:
  - Conditional content for new vs existing users
  - Optional temporary password display
  - Direct login link
  - Feature overview and getting started checklist

### 2. **Registration Confirmation Email**

- **Trigger**: When a team successfully registers for a tournament
- **Recipients**: Team Manager
- **Content**: Registration details, tournament info, payment details, next steps
- **Features**:
  - Tournament location and dates
  - Payment information
  - Registration ID for reference
  - Link to tournament details

### 3. **Registration Status Update Email**

- **Trigger**: When registration status changes (APPROVED/REJECTED/WAITLISTED)
- **Recipients**: Team Manager
- **Content**: Status change notification with relevant information
- **Features**:
  - Color-coded status indicators
  - Conditional messaging based on status
  - Admin notes inclusion
  - Next steps guidance

### 4. **Tournament Announcement Email**

- **Trigger**: Manual admin action or automated announcements
- **Recipients**: Tournament participants
- **Content**: Custom announcement messages
- **Features**:
  - Rich HTML formatting
  - Custom subject lines
  - Tournament branding

### 5. **Match Notification Email**

- **Trigger**: Match scheduling, results, or changes
- **Recipients**: Team Managers
- **Content**: Match details, opponent info, venue, timing
- **Features**:
  - Different templates for upcoming/results/changes
  - Venue and timing information
  - Score display for results

## 🚀 Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com/)
2. Create a new API key in your dashboard
3. Verify your domain (for production use)

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
# Resend Configuration
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="Tournament System <noreply@yourdomain.com>"
```

### 3. Verify Configuration

- Visit `/admin/email-test` to test email functionality
- Send test emails to verify templates and delivery
- Check Resend dashboard for delivery status

## 🧪 Testing Email Integration

### Admin Email Test Interface

Navigate to `/admin/email-test` to access the testing interface:

1. **Select Email Type**: Choose from available email templates
2. **Enter Recipient**: Provide test email address
3. **Send Test Email**: Click to send and view results
4. **View Results**: See success/failure status and details

### Available Test Types

- `test`: Basic connectivity test
- `registration`: Tournament registration confirmation
- `status`: Registration status change notification
- `announcement`: Tournament announcement
- `match`: Match notification (upcoming/result/change)
- `team-manager-welcome`: New Team Manager welcome email

### API Testing

```bash
# Test registration confirmation email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "registration", "to": "manttila83@gmail.com"}'

# Test Team Manager welcome email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "team-manager-welcome", "to": "manager@example.com"}'
```

## 📧 Email Templates

All email templates feature:

- **Responsive HTML design** - Works on desktop and mobile
- **Professional styling** - Consistent branding and colors
- **Rich content** - Formatted text, buttons, and structured information
- **Accessibility** - Proper semantic HTML and alt text
- **Error handling** - Graceful fallbacks if email service fails

### Template Features

- Header with tournament branding
- Content sections with clear information hierarchy
- Call-to-action buttons with proper styling
- Footer with system information
- Conditional content based on context

## 🔄 Automatic Email Triggers

### Team Registration Flow

1. **User registers team** → Creates TEAM_MANAGER account (if new)
2. **New account created** → Sends Team Manager welcome email
3. **Registration completed** → Sends registration confirmation email
4. **Status changes** → Sends status update email

### Admin Actions

- **Registration approval/rejection** → Status update email
- **Tournament announcements** → Announcement email
- **Match scheduling/results** → Match notification email

## 🛡️ Error Handling

The email system includes robust error handling:

- **Non-blocking failures**: Email failures don't prevent user actions
- **Detailed logging**: All email attempts are logged with success/failure status
- **Fallback behavior**: System continues to function even if email service is unavailable
- **Configuration validation**: Checks for required environment variables

## 📊 Monitoring & Debugging

### Console Logging

- ✅ Success: `✅ Registration confirmation email sent successfully`
- ❌ Failure: `❌ Failed to send registration confirmation email: [error]`
- ⚠️ Warning: `📧 Email service not configured (missing RESEND_API_KEY)`

### Resend Dashboard

- Monitor delivery rates
- View bounce and complaint rates
- Check email logs and analytics
- Manage domain verification

## 🔮 Future Enhancements

### Planned Features

- **Email templates editor**: Admin interface for customizing email templates
- **Scheduled emails**: Support for delayed/scheduled email delivery
- **Email preferences**: User settings for email notification types
- **Bulk email campaigns**: Mass communication to tournament participants
- **Email analytics**: Open rates, click tracking, and engagement metrics
- **Multi-language support**: Localized email templates
- **SMS integration**: Optional SMS notifications for urgent updates

### Integration Opportunities

- **Calendar invites**: Attach .ics files for match schedules
- **PDF attachments**: Include tournament rules, schedules, or certificates
- **QR codes**: Generate QR codes for quick access to tournament info
- **Social sharing**: Include social media links and sharing buttons

## 🚨 Production Considerations

### Security

- Store API keys securely (environment variables, not code)
- Use verified domains for better deliverability
- Implement rate limiting for email sending
- Validate all email addresses before sending

### Performance

- Consider email queuing for high-volume tournaments
- Monitor API rate limits and usage
- Implement retry logic for failed sends
- Cache email templates for better performance

### Compliance

- Include unsubscribe links where required
- Respect user email preferences
- Follow GDPR and other privacy regulations
- Maintain email sending reputation

---

The email integration is now fully functional and ready for production use. Configure your Resend API key and start sending professional tournament notifications! 🎯

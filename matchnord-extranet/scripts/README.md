# Email Testing Scripts

This folder contains scripts to help test and debug the email functionality in the Tournament Management System.

## 📧 Available Scripts

### 1. `test-email.sh`

Test a specific email type to a recipient.

```bash
# Basic usage
./scripts/test-email.sh

# Test specific email type
./scripts/test-email.sh team-manager-welcome

# Test specific email type to specific recipient
./scripts/test-email.sh team-manager-welcome manttila83@gmail.com
```

### 2. `test-all-emails.sh`

Test all available email types to a recipient.

```bash
# Test all emails to default recipient (manttila83@gmail.com)
./scripts/test-all-emails.sh

# Test all emails to specific recipient
./scripts/test-all-emails.sh manttila83@gmail.com
```

### 3. `check-email-logs.sh`

Check Resend email delivery logs and status.

```bash
# Check last 10 emails
./scripts/check-email-logs.sh

# Check last 5 emails
./scripts/check-email-logs.sh 5
```

### 4. `email-help.sh`

Display help information and usage examples.

```bash
./scripts/email-help.sh
```

## 📋 Available Email Types

- **`test`** - Basic connectivity test
- **`registration`** - Tournament registration confirmation
- **`status`** - Registration status update
- **`announcement`** - Tournament announcement
- **`match`** - Match notification
- **`team-manager-welcome`** - Team Manager welcome email

## 🚨 Common Issues

### Domain Verification Error

```
You can only send testing emails to your own email address (manttila83@gmail.com)
```

**Solution:** Verify your domain at [resend.com/domains](https://resend.com/domains)

**Workaround:** Use `manttila83@gmail.com` for testing

### Server Not Running

```
Server is not running at http://localhost:3000
```

**Solution:** Start the server with `npm run dev`

### jq Not Installed

```
jq is not installed
```

**Solution:** Install jq with `brew install jq`

## 🔧 Prerequisites

1. **Server Running:** Make sure the development server is running on `http://localhost:3000`
2. **jq Installed:** Required for parsing JSON responses
   ```bash
   brew install jq
   ```
3. **Environment Variables:** Ensure `.env.local` contains:
   ```env
   RESEND_API_KEY=""
   EMAIL_FROM=onboarding@resend.dev
   ```

## 🚀 Quick Start

1. **Start the server:**

   ```bash
   npm run dev
   ```

2. **Test basic email:**

   ```bash
   ./scripts/test-email.sh test manttila83@gmail.com
   ```

3. **Check email logs:**

   ```bash
   ./scripts/check-email-logs.sh
   ```

4. **Get help:**
   ```bash
   ./scripts/email-help.sh
   ```

## 📊 Understanding Results

### Success Response

```json
{
  "success": true,
  "result": true,
  "message": "Test email of type 'test' sent to manttila83@gmail.com"
}
```

### Domain Verification Error

```json
{
  "success": true,
  "result": {
    "success": true,
    "data": {
      "data": null,
      "error": {
        "statusCode": 403,
        "message": "You can only send testing emails to your own email address..."
      }
    }
  }
}
```

## 🔍 Troubleshooting

1. **Check server logs** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Check Resend dashboard** for delivery status
4. **Test with Gmail first** before trying other providers
5. **Check spam folders** for delivered emails

## 📈 Production Setup

For production use:

1. **Verify your domain** at [resend.com/domains](https://resend.com/domains)
2. **Update EMAIL_FROM** to use your verified domain
3. **Test with various email providers**
4. **Monitor delivery rates** in Resend dashboard

# 📧 Email System E2E Tests

This directory contains comprehensive end-to-end tests for the email system functionality.

## 🎯 Test Coverage

### **User Registration & Email Verification Flow**

- ✅ User registration with email verification
- ✅ Email verification page functionality
- ✅ Invalid token handling
- ✅ Expired token handling
- ✅ Resend verification email

### **Team Registration & Approval Flow**

- ✅ Team registration with approval waiting
- ✅ Admin approval workflow
- ✅ Registration status updates

### **Invitation System Flow**

- ✅ User invitation creation
- ✅ Invitation acceptance flow
- ✅ Role-based invitations

### **Email Template Testing**

- ✅ Welcome + verification emails
- ✅ Team manager approval/rejection emails
- ✅ Team registration confirmation emails
- ✅ Participation confirmation emails
- ✅ Invitation emails

## 🚀 Running Tests

### **Quick Start**

```bash
# Run all email system tests
./scripts/test-email-system.sh

# Or run manually
npm run dev
npx playwright test e2e/email/email-system.spec.ts
```

### **Individual Test Suites**

```bash
# User registration flow
npx playwright test e2e/email/email-system.spec.ts -g "User Registration"

# Email verification
npx playwright test e2e/email/email-system.spec.ts -g "Email Verification"

# Team registration
npx playwright test e2e/email/email-system.spec.ts -g "Team Registration"

# Admin approval
npx playwright test e2e/email/email-system.spec.ts -g "Admin Approval"

# Invitation system
npx playwright test e2e/email/email-system.spec.ts -g "Invitation"
```

## 🧪 Test Architecture

### **Mock Email Service**

Tests use a mock email service to prevent actual emails from being sent:

- Intercepts `/api/auth/verify-email` POST requests
- Intercepts `/api/auth/resend-verification` requests
- Allows GET requests to pass through for actual verification testing

### **Test Data Management**

- **Setup**: Creates test users, tokens, and invitations
- **Cleanup**: Removes all test data after each test
- **Isolation**: Each test runs with fresh data

### **Database Verification**

Tests verify database state changes:

- User creation and verification status
- Token creation and usage
- Invitation status updates
- Registration status changes

## 📋 Test Scenarios

### **1. User Registration with Email Verification**

```typescript
test('User Registration with Email Verification Flow', async ({ page }) => {
  // 1. Navigate to signup page
  // 2. Fill registration form
  // 3. Submit registration
  // 4. Verify redirect and message
  // 5. Check database state
});
```

### **2. Email Verification Page**

```typescript
test('Email Verification Page Functionality', async ({ page }) => {
  // 1. Create test user with token
  // 2. Navigate to verification page
  // 3. Verify loading state
  // 4. Verify success state
  // 5. Test continue button
  // 6. Verify database update
});
```

### **3. Team Registration Flow**

```typescript
test('Team Registration with Approval Flow', async ({ page }) => {
  // 1. Create verified team manager
  // 2. Sign in and navigate to registration
  // 3. Fill and submit registration
  // 4. Verify confirmation message
  // 5. Check database state
});
```

### **4. Admin Approval Workflow**

```typescript
test('Admin Approval Workflow', async ({ page }) => {
  // 1. Create admin and pending user
  // 2. Sign in as admin
  // 3. Navigate to approval page
  // 4. Approve user
  // 5. Verify success and database update
});
```

### **5. Invitation System**

```typescript
test('User Invitation System', async ({ page }) => {
  // 1. Create team manager
  // 2. Sign in and navigate to invite page
  // 3. Send invitation
  // 4. Verify invitation creation
});
```

## 🔧 Test Configuration

### **Playwright Config**

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: On failure only
- **Traces**: On first retry

### **Test Environment**

- **Database**: PostgreSQL (Docker)
- **Server**: Next.js development server
- **Email**: Mocked Resend service

## 📊 Test Data

### **Test Users**

- `testuser@example.com` - Basic registration test
- `verifytest@example.com` - Email verification test
- `expiredtest@example.com` - Expired token test
- `resendtest@example.com` - Resend verification test
- `teammanager@example.com` - Team registration test
- `pendingmanager@example.com` - Admin approval test
- `inviter@example.com` - Invitation sender test
- `invited@example.com` - Invitation recipient test
- `accepttest@example.com` - Invitation acceptance test

### **Test Roles**

- `ADMIN` - Admin approval tests
- `TEAM_MANAGER` - Team management tests
- `TOURNAMENT_MANAGER` - Tournament management tests
- `REFEREE` - Referee invitation tests

## 🐛 Debugging Tests

### **View Test Results**

```bash
# Open test report
npx playwright show-report

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### **Debug Specific Test**

```bash
# Run single test with debug
npx playwright test e2e/email/email-system.spec.ts -g "User Registration" --debug
```

### **Check Database State**

```bash
# Connect to test database
psql postgresql://postgres:postgres@localhost:5434/tournament_app

# Check test users
SELECT email, role, "emailVerified", "isActive" FROM "User" WHERE email LIKE '%@example.com';
```

## 📈 Test Metrics

### **Coverage Goals**

- ✅ 100% email flow coverage
- ✅ 100% error scenario coverage
- ✅ 100% database state verification
- ✅ 100% UI interaction coverage

### **Performance Targets**

- ⏱️ Test suite completion: < 5 minutes
- ⏱️ Individual test completion: < 30 seconds
- 💾 Memory usage: < 500MB
- 🗄️ Database cleanup: < 1 second

## 🔄 Continuous Integration

### **GitHub Actions**

```yaml
- name: Run Email System Tests
  run: |
    npm run db:up
    npm run dev &
    sleep 10
    npx playwright test e2e/email/email-system.spec.ts
```

### **Pre-commit Hooks**

```bash
# Run email tests before commit
npm run test:email
```

## 📝 Test Maintenance

### **Adding New Tests**

1. Create test in `email-system.spec.ts`
2. Add test data to `email-test-helpers.ts`
3. Update cleanup functions
4. Add API endpoints if needed
5. Update documentation

### **Updating Existing Tests**

1. Update test logic
2. Verify test data still valid
3. Update cleanup if needed
4. Test locally before committing

## 🚨 Troubleshooting

### **Common Issues**

**Database Connection Errors**

```bash
# Restart database
npm run db:down
npm run db:up
```

**Server Not Ready**

```bash
# Check server status
curl http://localhost:3000/api/health

# Restart server
npm run dev
```

**Test Data Cleanup Issues**

```bash
# Manual cleanup
psql postgresql://postgres:postgres@localhost:5434/tournament_app -c "DELETE FROM \"User\" WHERE email LIKE '%@example.com';"
```

**Playwright Installation Issues**

```bash
# Reinstall Playwright
npx playwright install
```

---

## 📞 Support

For issues with email system tests:

1. Check this documentation
2. Review test logs
3. Check database state
4. Verify server status
5. Contact development team
